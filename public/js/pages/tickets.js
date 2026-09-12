'use strict';
// Central de conversas: lista (esquerda), conversa (centro) e contexto do cliente (direita). Visão em tabela para supervisão.
CRM.pages.tickets = {
  VIEWS: [['mine', 'Meus'], ['queue', 'Fila'], ['unanswered', 'Sem resposta'], ['waiting_customer', 'Aguardando cliente'], ['open', 'Todos abertos'], ['closed', 'Encerrados']],

  async render(el, { id, query }) {
    this.el = el; this.id = id || null; this.query = query;
    const s = await CRM.settingsFull();
    this.channels = s ? s.settings.channels : ['WhatsApp', 'Telefone', 'E-mail'];
    this.quick = s ? s.quick_replies : [];
    this.sla = s ? s.settings.response_sla_minutes : 30;
    if (!this.waStatus) this.waStatus = await api('/whatsapp/status').catch(() => ({ connected: false }));
    if (query.tabela) return this.table(el, query);
    if (query.novo) { history.replaceState(null, '', '#/atendimentos'); setTimeout(() => this.form({}, (t) => { location.hash = `#/atendimentos/${t.id}`; }), 50); }
    this.view = query.view || (this.id ? (this.view || 'open') : UI.store.get('inbox.view', CRM.user.role === 'atendente' ? 'mine' : 'open'));
    UI.store.set('inbox.view', this.view);
    this.filters = { q: query.q || '', channel: query.channel || '', assignee_id: query.assignee_id || '', priority: query.priority || '' };
    el.className = 'content full';
    el.innerHTML = `<div class="inbox ${this.id ? 'm-conv' : 'm-list'}" id="inbox">
      <section class="conv-list" aria-label="Lista de conversas"><div class="head">
        <div class="flex"><input id="convSearch" placeholder="Buscar conversa…" value="${UI.attr(this.filters.q)}" aria-label="Buscar conversa">
          <div class="menu-wrap"><button class="icon-btn" id="convFilters" title="Filtros" aria-label="Filtros">${UI.icons.filter}</button></div>
          <button class="icon-btn" id="convNew" title="Abrir atendimento" aria-label="Abrir atendimento">${UI.icons.plus}</button></div>
        <div class="chips" id="convViews"></div></div>
        <div class="items" id="convItems"><p class="muted small" style="padding:1rem">Carregando…</p></div>
        <div style="padding:.45rem .75rem;border-top:1px solid var(--border)" class="flex between"><a href="#/atendimentos?tabela=1" class="small">${UI.icons.list} Visão em tabela</a>${CRM.isManager() ? '<button class="btn link small" id="btnDistribute">Distribuir fila</button>' : ''}</div>
      </section>
      <section class="conv-main" id="convMain" aria-label="Conversa"><div class="conv-empty"><div>${UI.icons.inbox}<br><strong>Selecione uma conversa</strong><br><span class="small">ou abra um novo atendimento pelo botão +</span></div></div></section>
      <aside class="conv-context" id="convCtx" aria-label="Contexto do cliente"></aside>
    </div>`;
    const search = el.querySelector('#convSearch');
    search.oninput = UI.debounce(() => { this.filters.q = search.value.trim(); this.list(); }, 300);
    el.querySelector('#convNew').onclick = () => this.form({}, (t) => { location.hash = `#/atendimentos/${t.id}`; });
    el.querySelector('#convFilters').onclick = (e) => this.filterMenu(e.currentTarget);
    const dist = el.querySelector('#btnDistribute'); if (dist) dist.onclick = async () => { try { const r = await api('/tickets/distribute', { method: 'POST' }); UI.toast(r.message, r.assigned ? 'success' : 'warning'); this.list(); } catch (err) { UI.err(err); } };
    await this.renderViews();
    await this.list();
    if (this.id) await this.open(this.id);
  },

  async renderViews() {
    const c = (await api('/tickets/counts').catch(() => ({ counts: {} }))).counts || {};
    CRM.counts = c;
    const box = this.el.querySelector('#convViews'); if (!box) return;
    box.innerHTML = this.VIEWS.map(([k, l]) => `<button type="button" class="chip ${this.view === k ? 'active' : ''}" data-view="${k}">${l}${c[k] ? ` <span class="n">${c[k]}</span>` : ''}</button>`).join('');
    box.querySelectorAll('[data-view]').forEach((b) => b.onclick = () => { this.view = b.dataset.view; UI.store.set('inbox.view', this.view); box.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x === b)); this.list(); });
  },

  filterMenu(btn) {
    const f = this.filters;
    const m = UI.modal({ title: 'Filtrar conversas', size: 'narrow', body: `<form id="cfForm">
      ${UI.field('channel', 'Canal', UI.select('channel', [['', 'Todos'], ...this.channels.map((c) => [c, c])], f.channel))}
      ${CRM.isManager() ? UI.field('assignee_id', 'Responsável', UI.select('assignee_id', [['', 'Todos'], ['none', 'Sem responsável'], ...CRM.users.filter((u) => u.active !== false).map((u) => [u.id, u.name])], f.assignee_id)) : ''}
      ${UI.field('priority', 'Prioridade', UI.select('priority', [['', 'Todas'], ...Object.entries(UI.PRIORITY).map(([k, v]) => [k, v.label])], f.priority))}</form>`,
      footer: `<button class="btn ghost" id="cfClear">Limpar</button><button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="cfForm">Aplicar</button>` });
    m.el.querySelector('#cfForm').onsubmit = (e) => { e.preventDefault(); Object.assign(this.filters, UI.formData(e.target)); m.close(); this.list(); btn.classList.toggle('active', Boolean(this.filters.channel || this.filters.assignee_id || this.filters.priority)); };
    m.el.querySelector('#cfClear').onclick = () => { this.filters = { q: this.filters.q, channel: '', assignee_id: '', priority: '' }; m.close(); this.list(); };
  },

  async list() {
    const box = this.el.querySelector('#convItems'); if (!box) return;
    const q = { view: this.view, ...this.filters, limit: 80 };
    let r; try { r = await api('/tickets', { query: q }); } catch (e) { box.innerHTML = `<div class="alert danger">${UI.esc(e.message)}</div>`; return; }
    this.rows = r.tickets;
    if (!r.tickets.length) {
      const msgs = { queue: ['Fila vazia', 'Todos os atendimentos foram assumidos.'], mine: ['Nenhuma conversa sua', 'Assuma um atendimento da fila para começar.'], unanswered: ['Tudo respondido', 'Nenhum cliente aguardando resposta.'], waiting_customer: ['Nenhuma conversa aguardando o cliente', ''], closed: ['Nenhum atendimento encerrado', ''], open: ['Nenhuma conversa aberta', 'Abra um novo atendimento pelo botão +.'] };
      box.innerHTML = UI.empty(...(msgs[this.view] || ['Nada encontrado', 'Ajuste a busca ou os filtros.'])); return;
    }
    box.innerHTML = r.tickets.map((t) => this.item(t)).join('');
    box.querySelectorAll('.conv-item').forEach((a) => a.onclick = (e) => { e.preventDefault(); location.hash = `#/atendimentos/${a.dataset.id}`; });
  },

  slaHtml(t) {
    if (!t.awaiting_reply || !t.response_due_at) return '';
    const ms = new Date(t.response_due_at) - Date.now();
    if (ms < 0) return `<span class="sla late" title="Prazo de resposta vencido">${UI.icons.alert} vencido ${UI.relative(t.response_due_at).replace('há ', 'há ')}</span>`;
    if (ms < 10 * 60000) return `<span class="sla soon" title="Prazo de resposta">${UI.icons.clock} ${Math.max(1, Math.round(ms / 60000))} min</span>`;
    return `<span class="sla" title="Prazo de resposta">${UI.icons.clock} ${UI.fmtDuration(ms / 1000)}</span>`;
  },

  item(t) {
    const active = t.id === this.id;
    const last = t.last_message_preview || t.subject || '';
    const prefix = t.last_message_direction === 'saida' ? 'Você: ' : '';
    return `<a class="conv-item ${active ? 'active' : ''}" data-id="${t.id}" href="#/atendimentos/${t.id}" aria-current="${active ? 'true' : 'false'}">
      ${UI.avatar(t.customer_name)}
      <div style="min-width:0"><div class="name">${UI.esc(t.customer_name)}</div><div class="preview ${t.last_message_direction ? '' : 'note-prev'}">${UI.esc(prefix + last)}</div></div>
      <div><div class="time">${UI.fmtShort(t.last_message_at || t.opened_at)}</div>${t.unread_count ? `<span class="unread" title="${t.unread_count} sem leitura">${t.unread_count}</span>` : ''}</div>
      <div class="meta"><span class="ch" title="${UI.attr(t.channel)}">${UI.channelIcon(t.channel)} ${UI.esc(t.channel)}</span>
        <span>${t.assignee_name ? UI.esc(t.assignee_name.split(' ')[0]) : '<em>na fila</em>'}</span>
        ${t.status === 'aguardando_cliente' ? '<span class="badge purple">aguard. cliente</span>' : ''}${['resolvido', 'cancelado'].includes(t.status) ? UI.statusBadge(t.status, true) : ''}
        ${t.priority === 'urgente' || t.priority === 'alta' ? UI.priorityBadge(t.priority) : ''}${this.slaHtml(t)}</div></a>`;
  },

  // ---------- Conversa selecionada ----------
  async open(id, { keepDraft = false } = {}) {
    this.id = id;
    const main = this.el.querySelector('#convMain'), ctx = this.el.querySelector('#convCtx'), inbox = this.el.querySelector('#inbox');
    if (!main) return;
    const draft = keepDraft ? main.querySelector('#composerText')?.value : '';
    let r; try { r = await api(`/tickets/${id}`); } catch (e) { main.innerHTML = `<div class="conv-empty"><div>${UI.icons.alert}<br>${UI.esc(e.message)}<br><a href="#/atendimentos">Voltar à lista</a></div></div>`; ctx.innerHTML = ''; return; }
    const t = r.ticket;
    // Atualização em tempo real: se o estado do atendimento não mudou, só a conversa e o contexto são redesenhados (o texto digitado é preservado).
    const prev = this.current && this.current.ticket;
    if (keepDraft && prev && prev.id === t.id && prev.version === t.version && prev.status === t.status && prev.assignee_id === t.assignee_id && main.querySelector('#composer')) {
      this.current = r;
      const body = main.querySelector('#convBody'); const atBottom = body.scrollHeight - body.scrollTop - body.clientHeight < 80;
      body.innerHTML = this.messages(r); if (atBottom) body.scrollTop = body.scrollHeight;
      this.context(ctx, r, { canAct: ['aguardando', 'em_atendimento', 'aguardando_cliente'].includes(t.status) && (t.assignee_id === CRM.user.id || CRM.isManager()), mgr: CRM.isManager() });
      return;
    }
    this.current = r;
    inbox.classList.remove('m-list', 'm-ctx'); inbox.classList.add('m-conv');
    this.el.querySelectorAll('.conv-item').forEach((a) => a.classList.toggle('active', Number(a.dataset.id) === id));
    if (t.unread_count) api(`/tickets/${id}/read`, { method: 'POST' }).catch(() => {});
    const open = ['aguardando', 'em_atendimento', 'aguardando_cliente'].includes(t.status);
    const isOwner = t.assignee_id === CRM.user.id, mgr = CRM.isManager();
    const canAct = open && (isOwner || mgr);
    const wa = t.customer_phone_digits ? UI.waLink(t.customer_phone_digits) : null;
    const primary = [];
    if (t.status === 'aguardando' && (!t.assignee_id || isOwner)) primary.push(`<button class="btn success" data-act="claim">${UI.icons.check} <span class="lbl">Assumir</span></button>`);
    if (canAct && t.status !== 'aguardando') {
      primary.push(`<button class="btn secondary" data-act="followup" title="Agendar retorno">${UI.icons.calendar} <span class="lbl">Retorno</span></button>`);
      primary.push(`<button class="btn" data-act="status" data-status="resolvido">${UI.icons.checkCircle} <span class="lbl">Resolver</span></button>`);
    }
    if (!open) primary.push(`<button class="btn" data-act="reopen">${UI.icons.refresh} <span class="lbl">Reabrir</span></button>`);
    main.innerHTML = `<div class="conv-head">
      <button class="icon-btn mobile-back" id="backList" aria-label="Voltar à lista">${UI.icons.arrowLeft}</button>
      ${UI.avatar(t.customer_name)}
      <div class="who"><div class="name"><a href="#/clientes/${t.customer_id}" style="color:inherit">${UI.esc(t.customer_name)}</a>${t.customer_company ? ` <span class="muted small">· ${UI.esc(t.customer_company)}</span>` : ''}</div>
        <div class="sub"><span class="mono">${UI.esc(t.protocol)}</span>${UI.statusBadge(t.status, true)}${UI.priorityBadge(t.priority)}<span class="ch">${UI.channelIcon(t.channel)} ${UI.esc(t.channel)}</span><span>${t.assignee_name ? `Resp.: <strong>${UI.esc(t.assignee_name)}</strong>` : '<em>na fila</em>'}</span>${t.follow_up_at && open ? `<span class="${new Date(t.follow_up_at) < Date.now() ? 'text-danger' : ''}" title="Retorno agendado">${UI.icons.calendar} ${UI.fmtDateTime(t.follow_up_at)}</span>` : ''}</div></div>
      <div class="actions">${primary.join('')}<div class="menu-wrap"><button class="icon-btn" id="moreActions" aria-label="Mais ações" aria-haspopup="true">${UI.icons.more}</button></div><button class="icon-btn mobile-back" id="showCtx" aria-label="Dados do cliente">${UI.icons.user}</button></div>
    </div>
    <div class="conv-body" id="convBody">${this.messages(r)}</div>
    ${this.composer(t, canAct, mgr, open, draft)}`;
    main.querySelector('#backList').onclick = () => { inbox.classList.remove('m-conv'); inbox.classList.add('m-list'); history.replaceState(null, '', '#/atendimentos'); };
    main.querySelector('#showCtx').onclick = () => inbox.classList.toggle('m-ctx');
    main.querySelectorAll('[data-act]').forEach((b) => b.onclick = () => this.action(b.dataset.act, t, b.dataset.status, () => { this.open(id, { keepDraft: true }); this.list(); this.renderViews(); }));
    main.querySelector('#moreActions').onclick = (e) => this.moreMenu(e.currentTarget, t, { open, isOwner, mgr, canAct, wa });
    const body = main.querySelector('#convBody'); body.scrollTop = body.scrollHeight;
    this.bindComposer(main, t, canAct, mgr, open);
    this.context(ctx, r, { canAct, mgr });
  },

  subjectTitle(t) { return `${t.protocol} · ${t.subject}`; },

  moreMenu(btn, t, { open, isOwner, mgr, canAct, wa }) {
    const items = [{ head: this.subjectTitle(t) }];
    const done = () => { this.open(t.id, { keepDraft: true }); this.list(); this.renderViews(); };
    if (canAct && t.status !== 'aguardando') {
      if (t.status !== 'aguardando_cliente') items.push({ label: 'Marcar como aguardando cliente', icon: 'clock', onClick: () => this.action('status', t, 'aguardando_cliente', done) });
      else items.push({ label: 'Retomar atendimento', icon: 'play', onClick: () => this.action('status', t, 'em_atendimento', done) });
      items.push({ label: 'Transferir…', icon: 'users', onClick: () => this.action('transfer', t, null, done) });
      items.push({ label: 'Devolver à fila', icon: 'inbox', onClick: () => this.action('release', t, null, done) });
    }
    if (t.status === 'aguardando' && t.assignee_id && !isOwner && mgr) items.push({ label: 'Reatribuir…', icon: 'users', onClick: () => this.action('transfer', t, null, done) });
    if (open && (isOwner || mgr || !t.assignee_id)) items.push({ label: 'Editar assunto, canal e prioridade', icon: 'edit', onClick: () => this.action('edit', t, null, done) });
    items.push({ label: 'Nova oportunidade', icon: 'pipeline', onClick: () => CRM.pages.pipeline.form({ customer: { id: t.customer_id, name: t.customer_name }, ticket_id: t.id }, done) });
    items.push({ label: 'Nova tarefa', icon: 'tasks', onClick: () => CRM.pages.tasks.form({ customer_id: t.customer_id, customer_name: t.customer_name, ticket_id: t.id, assignee_id: t.assignee_id }, done) });
    items.push({ sep: true }, { label: 'Ficha do cliente', icon: 'user', href: `#/clientes/${t.customer_id}` });
    if (wa) items.push({ label: 'Abrir no WhatsApp (externo)', icon: 'external', onClick: () => window.open(wa, '_blank', 'noopener') });
    if (canAct && (t.status !== 'aguardando' || mgr)) items.push({ sep: true }, { label: 'Cancelar atendimento', icon: 'xCircle', danger: true, onClick: () => this.action('status', t, 'cancelado', done) });
    UI.menu(btn, items);
  },

  messages(r) {
    const { events, attachments } = r;
    const byEvent = {}; (attachments || []).forEach((a) => { (byEvent[a.event_id] = byEvent[a.event_id] || []).push(a); });
    let lastDay = null; const out = [];
    for (const e of events) {
      const day = new Date(e.created_at).toDateString();
      if (day !== lastDay) { out.push(`<div class="day-sep">${UI.fmtDate(e.created_at)}</div>`); lastDay = day; }
      const atts = (byEvent[e.id] || []).map((a) => `<div class="att"><a href="/api/tickets/${r.ticket.id}/attachments/${a.id}" target="_blank" rel="noopener">${a.mime && a.mime.startsWith('image/') ? UI.icons.image : UI.icons.file} ${UI.esc(a.name)}${a.size ? ` <span class="muted">(${UI.fmtBytes(a.size)})</span>` : ''}</a></div>`).join('');
      if (e.kind === 'system') { out.push(`<div class="msg sys" title="${UI.fmtDateTime(e.created_at)}">${UI.esc(e.body || '')}${e.user_name ? ` · ${UI.esc(e.user_name)}` : ''} · ${UI.fmtTime(e.created_at)}</div>`); continue; }
      if (e.kind === 'note') { out.push(`<div class="msg note"><div class="m-tag">${UI.icons.lock} Nota interna · não visível ao cliente</div>${UI.esc(e.body || '')}${atts}<div class="m-meta">${UI.esc(e.user_name || '')} · ${UI.fmtTime(e.created_at)}</div></div>`); continue; }
      const out_ = e.direction === 'saida';
      const p = e.payload || {};
      const via = p.via === 'whatsapp_api' ? 'WhatsApp (API oficial)' : `${e.channel || ''} · registro manual`;
      let status = '';
      if (out_ && p.via === 'whatsapp_api') {
        const st = p.status || 'enviado';
        status = st === 'falhou' ? `<span class="status failed" title="${UI.attr(p.error || 'Falha no envio')}">${UI.icons.alert} falhou</span>` : st === 'lido' ? `<span class="status read" title="Lida">${UI.icons.checkDouble} lida</span>` : st === 'entregue' ? `<span class="status" title="Entregue">${UI.icons.checkDouble} entregue</span>` : `<span class="status" title="Enviada">${UI.icons.check} enviada</span>`;
      }
      out.push(`<div class="msg ${out_ ? 'out' : 'in'}">${UI.esc(e.body || '')}${atts}<div class="m-meta"><span title="${UI.attr(via)}">${out_ ? UI.esc(e.user_name || 'Sistema') : 'Cliente'}${p.via === 'whatsapp_api' ? '' : ' · manual'}</span>· ${UI.fmtTime(e.created_at)} ${status}</div></div>`);
    }
    return out.join('') || '<div class="muted small center" style="padding:2rem">Sem mensagens ainda.</div>';
  },

  composer(t, canAct, mgr, open, draft = '') {
    const waLive = this.waStatus && this.waStatus.connected && t.channel === 'WhatsApp';
    const disabledReason = !open ? 'Atendimento encerrado. Reabra para continuar a conversa.' : !(canAct || mgr) ? 'Assuma o atendimento para responder ao cliente.' : '';
    return `<div class="composer" id="composer">
      <div class="mode" role="tablist"><button type="button" class="active" data-mode="reply" role="tab">${UI.icons.send} Responder</button><button type="button" class="note" data-mode="note" role="tab">${UI.icons.lock} Nota interna</button><button type="button" data-mode="inbound" role="tab" title="Registrar uma mensagem que o cliente enviou por fora do sistema">${UI.icons.inbox} Registrar recebida</button>
        <span class="grow"></span><span class="small muted" id="channelInfo">${waLive ? `${UI.icons.whatsapp} envio pela API oficial` : `${UI.channelIcon(t.channel)} ${UI.esc(t.channel)} · registro manual`}</span></div>
      <div style="position:relative"><textarea id="composerText" placeholder="${disabledReason || 'Escreva a resposta ao cliente… (Ctrl+Enter envia)'}" ${disabledReason && !mgr ? 'disabled' : ''} aria-label="Mensagem">${UI.esc(draft || '')}</textarea><div id="qrPop" class="qr-pop" hidden></div></div>
      <div class="att-list" id="attList"></div>
      <div class="tools">
        <button type="button" class="btn ghost sm" id="btnQuick" title="Respostas rápidas">${UI.icons.zap} Respostas rápidas</button>
        <button type="button" class="btn ghost sm" id="btnAttach" title="Anexar arquivo (até 2 MB)">${UI.icons.paperclip} Anexar</button><input type="file" id="attFile" hidden multiple>
        <select id="inboundChannel" hidden style="width:auto;min-height:28px;padding:.2rem .5rem" aria-label="Canal">${this.channels.map((c) => `<option ${c === t.channel ? 'selected' : ''}>${UI.esc(c)}</option>`).join('')}</select>
        <span class="hint" id="composerHint">${disabledReason || (waLive ? 'A mensagem será enviada ao cliente pelo WhatsApp Business. Status de entrega aparecem na conversa.' : 'A mensagem é registrada como enviada ao cliente por ' + UI.esc(t.channel) + '. A primeira resposta define o tempo de 1ª resposta.')}</span>
        <button type="button" class="btn" id="btnSend" ${disabledReason && !mgr ? 'disabled' : ''}>${UI.icons.send} Enviar</button></div></div>`;
  },

  bindComposer(main, t, canAct, mgr, open) {
    const comp = main.querySelector('#composer'), ta = main.querySelector('#composerText'), send = main.querySelector('#btnSend'), hint = main.querySelector('#composerHint');
    const chSel = main.querySelector('#inboundChannel'), attList = main.querySelector('#attList'), file = main.querySelector('#attFile');
    let mode = 'reply'; let atts = [];
    const waLive = this.waStatus && this.waStatus.connected && t.channel === 'WhatsApp';
    const setMode = (m) => {
      mode = m; comp.classList.toggle('note-mode', m === 'note');
      comp.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('active', b.dataset.mode === m));
      chSel.hidden = m !== 'inbound';
      const closed = !open;
      if (m === 'note') { ta.disabled = false; send.disabled = false; ta.placeholder = 'Nota interna: visível apenas para a equipe (Ctrl+Enter salva)'; hint.textContent = 'Notas internas não são enviadas ao cliente e não contam como resposta.'; send.innerHTML = `${UI.icons.lock} Salvar nota`; }
      else if (m === 'inbound') { const ok = !closed && (canAct || mgr); ta.disabled = !ok; send.disabled = !ok; ta.placeholder = ok ? 'Texto da mensagem recebida do cliente (telefone, e-mail, presencial…)' : 'Assuma o atendimento para registrar.'; hint.textContent = ok ? 'Registro manual de uma mensagem que o cliente enviou fora do CRM. Zera o contador de resposta.' : 'Assuma o atendimento para registrar interações.'; send.innerHTML = `${UI.icons.inbox} Registrar`; }
      else { const ok = !closed && (canAct || mgr); ta.disabled = !ok; send.disabled = !ok; ta.placeholder = ok ? 'Escreva a resposta ao cliente… (Ctrl+Enter envia)' : (closed ? 'Atendimento encerrado. Reabra para continuar.' : 'Assuma o atendimento para responder.'); hint.textContent = ok ? (waLive ? 'A mensagem será enviada ao cliente pelo WhatsApp Business.' : `Registrada como enviada ao cliente por ${t.channel}.`) : (closed ? 'Atendimento encerrado.' : 'Assuma o atendimento para responder ao cliente.'); send.innerHTML = `${UI.icons.send} Enviar`; }
    };
    comp.querySelectorAll('[data-mode]').forEach((b) => b.onclick = () => { setMode(b.dataset.mode); ta.focus(); });
    setMode('reply');
    // Respostas rápidas: botão ou "/" no início do texto
    const pop = main.querySelector('#qrPop');
    const showQuick = (filter = '') => {
      const list = (this.quick || []).filter((q) => !filter || q.title.toLowerCase().includes(filter) || (q.shortcut || '').toLowerCase().includes(filter));
      if (!list.length) { pop.innerHTML = `<div class="muted small" style="padding:.6rem .8rem">${this.quick.length ? 'Nenhuma resposta corresponde.' : 'Nenhuma resposta rápida cadastrada. Administradores cadastram em Configurações › Respostas rápidas.'}</div>`; pop.hidden = false; return; }
      pop.innerHTML = list.map((q) => `<button type="button" data-q="${q.id}"><div class="t">${UI.esc(q.title)}${q.shortcut ? ` <span class="mono muted">/${UI.esc(q.shortcut)}</span>` : ''}</div><div class="b">${UI.esc(q.body)}</div></button>`).join('');
      pop.hidden = false;
      pop.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => { const q = this.quick.find((x) => x.id === Number(b.dataset.q)); const first = (t.customer_name || '').split(' ')[0]; ta.value = (ta.value.replace(/^\/\S*$/, '') + q.body.replace(/\{nome\}/g, first).replace(/\{atendente\}/g, CRM.user.name.split(' ')[0]).replace(/\{protocolo\}/g, t.protocol)).trim(); pop.hidden = true; ta.focus(); });
    };
    main.querySelector('#btnQuick').onclick = () => { if (!pop.hidden) { pop.hidden = true; return; } showQuick(); };
    ta.addEventListener('input', () => { const m = ta.value.match(/^\/(\S*)$/); if (m) showQuick(m[1].toLowerCase()); else pop.hidden = true; });
    document.addEventListener('click', (e) => { if (!e.target.closest('#qrPop, #btnQuick, #composerText')) pop.hidden = true; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) { pop.hidden = true; ta.focus(); } });
    // Anexos
    main.querySelector('#btnAttach').onclick = () => file.click();
    const renderAtts = () => { attList.innerHTML = atts.map((a, i) => `<span class="badge outline">${UI.icons.paperclip} ${UI.esc(a.name)} <button type="button" class="icon-btn" style="min-height:0;min-width:0;padding:0 2px" data-rm="${i}" aria-label="Remover">${UI.icons.x}</button></span>`).join(''); attList.querySelectorAll('[data-rm]').forEach((b) => b.onclick = () => { atts.splice(Number(b.dataset.rm), 1); renderAtts(); }); };
    file.onchange = async () => { for (const f of file.files) { if (f.size > 2 * 1024 * 1024) { UI.toast(`"${f.name}" excede 2 MB.`, 'warning'); continue; } if (atts.length >= 5) { UI.toast('Máximo de 5 anexos por mensagem.', 'warning'); break; } atts.push({ name: f.name, mime: f.type || 'application/octet-stream', data: await UI.readFile(f) }); } file.value = ''; renderAtts(); };
    // Envio
    const submit = async () => {
      const text = ta.value.trim(); if (!text && !atts.length) return; if (!text) { UI.toast('Escreva um texto para acompanhar o anexo.', 'warning'); return; }
      send.disabled = true;
      try {
        let r;
        if (mode === 'note') r = await api(`/tickets/${t.id}/notes`, { method: 'POST', body: { body: text, attachments: atts } });
        else if (mode === 'inbound') r = await api(`/tickets/${t.id}/interactions`, { method: 'POST', body: { direction: 'entrada', channel: chSel.value, body: text, attachments: atts } });
        else if (waLive && !atts.length) {
          try { r = await api('/whatsapp/send', { method: 'POST', body: { customer_id: t.customer_id, ticket_id: t.id, body: text } }); }
          catch (e) { if (e.status === 409 && e.data.window_closed) { return this.templateDialog(t, e, () => { ta.value = ''; this.open(t.id); this.list(); }); } throw e; }
        } else r = await api(`/tickets/${t.id}/interactions`, { method: 'POST', body: { direction: 'saida', channel: t.channel, body: text, attachments: atts } });
        ta.value = ''; atts = []; renderAtts(); UI.ok(r.message);
        await this.open(t.id); this.list(); this.renderViews();
      } catch (e) { UI.err(e); } finally { send.disabled = false; }
    };
    send.onclick = submit;
    ta.onkeydown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); submit(); } if (e.key === 'Escape') pop.hidden = true; };
    if (!ta.disabled) setTimeout(() => ta.focus(), 50);
  },

  templateDialog(t, err, done) {
    const m = UI.modal({ title: 'Fora da janela de 24 horas', size: 'narrow', body: `<div class="alert warning">${UI.esc(err.message)}</div>
      <form id="tplForm">${UI.field('name', 'Nome do modelo aprovado', UI.input('name', '', 'required placeholder="ex.: retorno_atendimento"'), { required: true, hint: 'O modelo precisa estar aprovado na conta do WhatsApp Business.' })}${UI.field('language', 'Idioma', UI.input('language', 'pt_BR'))}</form>
      <p class="small muted">Alternativa: use "Abrir no WhatsApp" no menu e registre a mensagem manualmente.</p>`,
      footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="tplForm">Enviar modelo</button>` });
    m.el.querySelector('#tplForm').onsubmit = async (e) => { e.preventDefault(); const d = UI.formData(e.target); try { const r = await api('/whatsapp/send', { method: 'POST', body: { customer_id: t.customer_id, ticket_id: t.id, template: { name: d.name, language: d.language || 'pt_BR' } } }); UI.ok(r.message); m.close(); done(); } catch (e2) { UI.showErrors(e.target, e2); } };
  },

  // ---------- Contexto (direita) ----------
  context(ctx, r, { canAct, mgr }) {
    const t = r.ticket, c = r.customer || {};
    const opps = r.opportunities || [], openOpp = opps.filter((o) => o.stage_kind === 'open');
    const openTasks = (r.tasks || []).filter((x) => !x.done_at), custTasks = r.customer_tasks || [];
    const inbox = this.el.querySelector('#inbox');
    ctx.innerHTML = `<div class="ctx-sec"><h4><span>Cliente</span><span class="flex"><button class="icon-btn mobile-back" id="ctxClose" aria-label="Fechar">${UI.icons.x}</button><a href="#/clientes/${t.customer_id}" class="small">Ficha completa</a></span></h4>
        <dl class="def-list"><dt>Telefone</dt><dd>${UI.esc(UI.fmtPhone(c.phone) || '—')}</dd><dt>E-mail</dt><dd>${UI.esc(c.email || '—')}</dd><dt>Empresa</dt><dd>${UI.esc(c.company || '—')}</dd><dt>Origem</dt><dd>${UI.esc(c.source || '—')}</dd><dt>Responsável</dt><dd>${UI.esc(c.owner_name || '—')}</dd>${(c.tags || []).length ? `<dt>Etiquetas</dt><dd>${UI.tags(c.tags)}</dd>` : ''}</dl>
        ${c.notes ? `<p class="small muted mt-s" style="white-space:pre-wrap">${UI.esc(c.notes)}</p>` : ''}
        <div class="flex mt-s"><button class="btn secondary xs" id="ctxEditCust">${UI.icons.edit} Editar</button>${t.customer_phone_digits ? `<a class="btn secondary xs" href="${UI.waLink(t.customer_phone_digits)}" target="_blank" rel="noopener" title="Abre o WhatsApp fora do CRM; sem sincronização de mensagens">${UI.icons.external} WhatsApp</a>` : ''}</div></div>
      <div class="ctx-sec"><h4><span>Atendimento</span></h4><dl class="def-list"><dt>Assunto</dt><dd>${UI.esc(t.subject)}</dd><dt>Abertura</dt><dd>${UI.fmtDateTime(t.opened_at)}</dd><dt>1ª resposta</dt><dd>${t.first_response_at ? `${UI.fmtDuration((new Date(t.first_response_at) - new Date(t.opened_at)) / 1000)}` : '<span class="muted">pendente</span>'}</dd>${t.closed_at ? `<dt>Encerrado</dt><dd>${UI.fmtDateTime(t.closed_at)}</dd>` : ''}${t.follow_up_at ? `<dt>Retorno</dt><dd class="${new Date(t.follow_up_at) < Date.now() ? 'text-danger' : ''}">${UI.fmtDateTime(t.follow_up_at)}</dd>` : ''}<dt>Aberto por</dt><dd>${UI.esc(t.created_by_name || 'WhatsApp')}</dd></dl>${t.description ? `<p class="small mt-s" style="white-space:pre-wrap">${UI.esc(t.description)}</p>` : ''}</div>
      <div class="ctx-sec"><h4><span>Negociação</span><button class="btn link small" id="ctxNewOpp">+ Nova</button></h4>
        ${openOpp.length ? openOpp.map((o) => `<div class="ctx-item" data-opp="${o.id}"><div class="t"><a href="#/funil/${o.id}" data-opp-open="${o.id}">${UI.esc(o.title)}</a><span>${UI.fmtMoney(o.value)}</span></div>
          <div class="flex mt-s"><select data-opp-stage="${o.id}" data-version="${o.version}" aria-label="Etapa" style="min-height:28px;padding:.15rem .4rem;font-size:12.5px">${this.stagesFor(o).map((s) => `<option value="${s.id}" ${s.id === o.stage_id ? 'selected' : ''}>${UI.esc(s.name)}</option>`).join('')}</select></div>
          <div class="muted xs mt-s">${o.owner_name ? UI.esc(o.owner_name) : 'sem responsável'}${o.next_action ? ` · próx.: ${UI.esc(o.next_action)}${o.next_action_at ? ` (${UI.fmtDate(o.next_action_at)})` : ''}` : ' · <span class="text-warning">sem próxima ação</span>'}</div></div>`).join('')
        : `<p class="muted small">Nenhuma negociação aberta.${opps.length ? ` ${opps.length} encerrada(s) na ficha do cliente.` : ''} A etapa comercial é independente do status do atendimento.</p>`}</div>
      <div class="ctx-sec"><h4><span>Tarefas</span><button class="btn link small" id="ctxNewTask">+ Nova</button></h4>
        ${[...openTasks, ...custTasks].length ? [...openTasks, ...custTasks].map((x) => `<div class="task-row"><input type="checkbox" data-task-done="${x.id}" aria-label="Concluir"><div><div class="t">${UI.esc(x.title)}</div><div class="s ${x.due_at && new Date(x.due_at) < Date.now() ? 'text-danger' : ''}">${x.due_at ? UI.fmtDateTime(x.due_at) : 'sem prazo'}${x.assignee_name ? ` · ${UI.esc(x.assignee_name.split(' ')[0])}` : ''}${x.due_at && new Date(x.due_at) < Date.now() ? ' · atrasada' : ''}</div></div></div>`).join('') : '<p class="muted small">Nenhuma tarefa pendente.</p>'}</div>
      <div class="ctx-sec"><h4><span>Anexos (${(r.attachments || []).length})</span></h4>${(r.attachments || []).length ? (r.attachments || []).map((a) => `<div class="small"><a href="/api/tickets/${t.id}/attachments/${a.id}" target="_blank" rel="noopener">${UI.icons.paperclip} ${UI.esc(a.name)}</a> <span class="muted xs">${UI.fmtDate(a.created_at)}</span></div>`).join('') : '<p class="muted small">Nenhum anexo nesta conversa.</p>'}</div>
      <div class="ctx-sec"><h4><span>Outros atendimentos</span></h4>${(r.customer_tickets || []).length ? (r.customer_tickets || []).map((x) => `<div class="small"><a href="#/atendimentos/${x.id}"><span class="mono">${UI.esc(x.protocol)}</span></a> ${UI.esc(x.subject)} ${UI.statusBadge(x.status, true)}</div>`).join('') : '<p class="muted small">Primeiro atendimento deste cliente.</p>'}</div>`;
    ctx.querySelector('#ctxClose').onclick = () => inbox.classList.remove('m-ctx');
    const done = () => { this.open(t.id, { keepDraft: true }); };
    ctx.querySelector('#ctxEditCust').onclick = () => CRM.pages.customers.form(c, done);
    ctx.querySelector('#ctxNewOpp').onclick = () => CRM.pages.pipeline.form({ customer: { id: t.customer_id, name: t.customer_name }, ticket_id: t.id }, done);
    ctx.querySelector('#ctxNewTask').onclick = () => CRM.pages.tasks.form({ customer_id: t.customer_id, customer_name: t.customer_name, ticket_id: t.id, assignee_id: t.assignee_id || CRM.user.id }, done);
    ctx.querySelectorAll('[data-task-done]').forEach((cb) => cb.onchange = async () => { try { await api(`/tasks/${cb.dataset.taskDone}`, { method: 'PUT', body: { done: true } }); UI.ok('Tarefa concluída.'); done(); } catch (e) { UI.err(e); cb.checked = false; } });
    ctx.querySelectorAll('[data-opp-open]').forEach((a) => a.onclick = (e) => { e.preventDefault(); CRM.pages.pipeline.detail(Number(a.dataset.oppOpen), { onChange: done }); });
    ctx.querySelectorAll('[data-opp-stage]').forEach((sel) => sel.onchange = async () => {
      const o = openOpp.find((x) => x.id === Number(sel.dataset.oppStage)); const st = this.stagesFor(o).find((s) => s.id === Number(sel.value));
      await CRM.pages.pipeline.move(o.id, st.id, st.kind, o.version, done); done();
    });
  },
  stagesFor(o) { const all = (CRM._settingsFull && CRM._settingsFull.stages) || []; return all.filter((s) => s.active && s.pipeline_id === o.pipeline_id); },

  // ---------- Ações ----------
  async claim(id, after) {
    try { const r = await api(`/tickets/${id}/claim`, { method: 'POST' }); UI.ok(r.message); if (after) after(); else location.hash = `#/atendimentos/${id}`; }
    catch (err) { UI.toast(err.message, 'warning', 6000); if (after) after(); }
  },

  async action(act, t, status, done) {
    try {
      if (act === 'claim') return this.claim(t.id, done);
      if (act === 'release') { if (!(await UI.confirm('Devolver este atendimento à fila de espera?'))) return; const r = await api(`/tickets/${t.id}/release`, { method: 'POST' }); UI.ok(r.message); return done(); }
      if (act === 'reopen') { const note = await UI.prompt('Motivo da reabertura (opcional)', { title: 'Reabrir atendimento', required: false }); if (note === null) return; const r = await api(`/tickets/${t.id}/reopen`, { method: 'POST', body: { note: note || undefined } }); UI.ok(r.message); return done(); }
      if (act === 'status') {
        const label = UI.STATUS[status].label; let note;
        if (status === 'resolvido' || status === 'cancelado') { note = await UI.prompt(`${status === 'resolvido' ? 'Resumo da solução' : 'Motivo do cancelamento'} (opcional)`, { title: `Marcar como ${label}`, required: false, multiline: true }); if (note === null) return; }
        const r = await api(`/tickets/${t.id}/status`, { method: 'POST', body: { status, note: note || undefined, version: t.version } }); UI.ok(r.message); return done();
      }
      if (act === 'transfer') {
        const opts = CRM.users.filter((u) => u.id !== t.assignee_id && u.active !== false);
        const m = UI.modal({ title: 'Transferir atendimento', size: 'narrow', body: `<form id="trForm">${UI.field('to_user_id', 'Novo responsável', UI.select('to_user_id', opts.map((u) => [u.id, `${u.name} (${UI.ROLE[u.role]})${u.role === 'atendente' && !u.available ? ' — indisponível' : ''}`]), '', 'data-type="int" required'), { required: true })}${UI.field('reason', 'Motivo', UI.input('reason', '', 'placeholder="Opcional"'))}<input type="hidden" name="version" value="${t.version}" data-type="int"></form>`,
          footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="trForm">Transferir</button>` });
        m.el.querySelector('#trForm').onsubmit = async (e) => { e.preventDefault(); try { const r = await api(`/tickets/${t.id}/transfer`, { method: 'POST', body: UI.formData(e.target) }); UI.ok(r.message); m.close(); done(); } catch (err) { UI.showErrors(e.target, err); } };
        return;
      }
      if (act === 'followup') {
        const def = t.follow_up_at || new Date(Date.now() + 86400000).toISOString();
        const m = UI.modal({ title: 'Agendar retorno', size: 'narrow', body: `<form id="fuForm">${UI.field('at', 'Data e hora do retorno', `<input type="datetime-local" name="at" value="${UI.toLocalInput(def)}" required>`, { required: true, hint: 'Uma tarefa de retorno é criada para o responsável; ela é encerrada automaticamente se o cliente responder antes.' })}
          <div class="chips mb-s">${[['Amanhã 9h', 1, 9], ['Em 2 dias', 2, 9], ['Próx. semana', 7, 9]].map(([l, d, h]) => `<button type="button" class="chip" data-d="${d}" data-h="${h}">${l}</button>`).join('')}</div>
          ${UI.field('note', 'Observação', UI.input('note', '', 'placeholder="Opcional"'))}</form>`,
          footer: `${t.follow_up_at ? '<button class="btn ghost" id="clearFu">Remover agendamento</button>' : ''}<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="fuForm">Agendar</button>` });
        m.el.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => { const d = new Date(); d.setDate(d.getDate() + Number(b.dataset.d)); d.setHours(Number(b.dataset.h), 0, 0, 0); m.el.querySelector('[name=at]').value = UI.toLocalInput(d); });
        m.el.querySelector('#fuForm').onsubmit = async (e) => { e.preventDefault(); try { const d = UI.formData(e.target); const r = await api(`/tickets/${t.id}/follow-up`, { method: 'POST', body: { at: d.at, note: d.note || undefined } }); UI.ok(r.message); m.close(); done(); } catch (err) { UI.showErrors(e.target, err); } };
        const cl = m.el.querySelector('#clearFu'); if (cl) cl.onclick = async () => { try { const r = await api(`/tickets/${t.id}/follow-up`, { method: 'POST', body: { at: null } }); UI.ok(r.message); m.close(); done(); } catch (err) { UI.err(err); } };
        return;
      }
      if (act === 'edit') {
        const m = UI.modal({ title: 'Editar atendimento', body: `<form id="edForm">${UI.field('subject', 'Assunto', UI.input('subject', t.subject, 'required'), { required: true })}<div class="form-row">${UI.field('channel', 'Canal', UI.select('channel', (this.channels || [t.channel]).map((c) => [c, c]), t.channel))}${UI.field('priority', 'Prioridade', UI.select('priority', Object.entries(UI.PRIORITY).map(([k, v]) => [k, v.label]), t.priority))}</div>${UI.field('description', 'Descrição', UI.textarea('description', t.description, 'data-type="nullable"'))}<input type="hidden" name="version" value="${t.version}" data-type="int"></form>`,
          footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="edForm">Salvar</button>` });
        m.el.querySelector('#edForm').onsubmit = async (e) => { e.preventDefault(); try { const r = await api(`/tickets/${t.id}`, { method: 'PUT', body: UI.formData(e.target) }); UI.ok(r.message); m.close(); done(); } catch (err) { UI.showErrors(e.target, err); } };
      }
    } catch (err) { UI.err(err); if (err.status === 409) done(); }
  },

  // ---------- Abrir atendimento ----------
  async form({ customer } = {}, onSaved) {
    if (!this.channels) { const s = await CRM.settingsFull(); this.channels = s ? s.settings.channels : ['WhatsApp', 'Telefone', 'E-mail']; }
    const assigneeOpts = CRM.isManager() ? UI.userOptions(CRM.users, { blank: '— Deixar na fila —' }) : [['', '— Deixar na fila —'], [CRM.user.id, `${CRM.user.name} (eu)`]];
    const m = UI.modal({ title: 'Abrir atendimento', body: `<form id="tkForm">
      ${UI.field('customer_id', 'Cliente', `<div class="flex"><input id="custSearch" placeholder="Digite para buscar o cliente…" autocomplete="off" value="${UI.attr(customer ? customer.name : '')}" ${customer ? 'readonly' : ''} class="grow"><input type="hidden" name="customer_id" data-type="int" value="${customer ? customer.id : ''}">${customer ? '' : '<button type="button" class="btn secondary sm" id="newCust">+ Novo</button>'}</div><div class="search-results" id="custResults" hidden style="position:relative"></div>`, { required: true })}
      ${UI.field('subject', 'Assunto', UI.input('subject', '', 'required maxlength="200"'), { required: true })}
      <div class="form-row cols-3">${UI.field('channel', 'Canal', UI.select('channel', this.channels.map((c) => [c, c]), this.channels[0]), { required: true })}
        ${UI.field('priority', 'Prioridade', UI.select('priority', Object.entries(UI.PRIORITY).map(([k, v]) => [k, v.label]), 'normal'))}
        ${UI.field('assignee_id', 'Responsável', UI.select('assignee_id', assigneeOpts, CRM.user.role === 'atendente' ? CRM.user.id : '', 'data-type="int"'))}</div>
      ${UI.field('first_message', 'Mensagem do cliente', UI.textarea('first_message', '', 'placeholder="O que o cliente disse ao entrar em contato (registrada como mensagem recebida)"'))}
      ${UI.field('description', 'Contexto interno', UI.textarea('description', '', 'data-type="nullable" placeholder="Opcional: observações visíveis só para a equipe" rows="2"'))}
      <label class="check"><input type="checkbox" name="auto_assign"> Distribuir automaticamente em rodízio (se ninguém for escolhido)</label></form>`,
      footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="tkForm">Abrir atendimento</button>` });
    const form = m.el.querySelector('#tkForm');
    if (!customer) this.customerPicker(form.querySelector('#custSearch'), form.querySelector('#custResults'), form.customer_id, m);
    form.onsubmit = async (e) => {
      e.preventDefault(); const d = UI.formData(form); if (!d.customer_id) { UI.showErrors(form, new ApiError(400, { fields: { customer_id: 'Selecione um cliente.' } })); return; }
      if (!d.first_message) delete d.first_message;
      try { const r = await api('/tickets', { method: 'POST', body: d }); UI.ok(r.message); m.close(); if (onSaved) onSaved(r.ticket); else location.hash = `#/atendimentos/${r.ticket.id}`; } catch (err) { UI.showErrors(form, err); }
    };
  },

  customerPicker(input, box, hidden, modal) {
    const run = UI.debounce(async () => {
      const q = input.value.trim(); if (q.length < 2) { box.hidden = true; return; }
      const r = await api('/customers', { query: { q, limit: 8 } });
      box.innerHTML = r.customers.length ? r.customers.map((c) => `<a href="#" data-id="${c.id}" data-name="${UI.attr(c.name)}"><strong>${UI.esc(c.name)}</strong> <span class="muted small">${UI.esc(UI.fmtPhone(c.phone))} ${UI.esc(c.company || '')}</span></a>`).join('') : '<div class="cat">Nenhum cliente encontrado</div>';
      box.hidden = false;
    }, 250);
    input.oninput = () => { hidden.value = ''; run(); };
    box.onclick = (e) => { e.preventDefault(); const a = e.target.closest('a'); if (!a) return; hidden.value = a.dataset.id; input.value = a.dataset.name; box.hidden = true; };
    const nb = modal.el.querySelector('#newCust'); if (nb) nb.onclick = () => CRM.pages.customers.form(null, (c) => { hidden.value = c.id; input.value = c.name; });
  },

  // ---------- Visão em tabela (supervisão) ----------
  async table(el, query) {
    this.tq = { ...query }; delete this.tq.tabela;
    this.page = Number(query.page) || 1;
    el.innerHTML = CRM.pageHeader('Atendimentos', 'Visão em tabela para supervisão: filtros, ordenação, colunas e exportação.',
      `<a class="btn secondary" href="#/atendimentos">${UI.icons.inbox} <span class="lbl">Central de conversas</span></a>${CRM.isManager() ? `<button class="btn secondary" id="btnDistribute" title="Distribui a fila sem responsável em rodízio">${UI.icons.repeat} <span class="lbl">Distribuir fila</span></button>` : ''}<button class="btn secondary" id="btnExport">${UI.icons.download} <span class="lbl">Exportar CSV</span></button><button class="btn" id="btnNew">${UI.icons.plus} <span class="lbl">Abrir atendimento</span></button>`) +
    `<div class="card"><div id="savedBox" class="mb-s"></div><form class="filters" id="filters">
      <div class="field grow"><label>Busca</label><input name="q" value="${UI.attr(query.q || '')}" placeholder="Protocolo, assunto, cliente ou telefone"></div>
      <div class="field"><label>Visão</label>${UI.select('view', [['', 'Todas'], ['open', 'Abertos'], ['queue', 'Fila'], ['mine', 'Meus'], ['unanswered', 'Sem resposta'], ['overdue', 'Prazo vencido'], ['waiting_customer', 'Aguardando cliente'], ['follow_up_overdue', 'Retorno vencido'], ['closed', 'Encerrados']], query.view)}</div>
      <div class="field"><label>Status</label>${UI.select('status', [['', 'Todos'], ...Object.entries(UI.STATUS).map(([k, v]) => [k, v.label])], query.status)}</div>
      <div class="field"><label>Prioridade</label>${UI.select('priority', [['', 'Todas'], ...Object.entries(UI.PRIORITY).map(([k, v]) => [k, v.label])], query.priority)}</div>
      <div class="field"><label>Canal</label>${UI.select('channel', [['', 'Todos'], ...this.channels.map((c) => [c, c])], query.channel)}</div>
      ${CRM.isManager() ? `<div class="field"><label>Responsável</label>${UI.select('assignee_id', [['', 'Todos'], ['none', 'Sem responsável'], ...CRM.users.map((u) => [u.id, u.name])], query.assignee_id)}</div>` : ''}
      <div class="field"><label>De</label><input type="date" name="from" value="${UI.attr(query.from || '')}"></div><div class="field"><label>Até</label><input type="date" name="to" value="${UI.attr(query.to || '')}"></div>
      <button class="btn secondary">Filtrar</button><a class="btn ghost" href="#/atendimentos?tabela=1">Limpar</a></form><div id="list"></div></div>`;
    el.querySelector('#filters').onsubmit = (e) => { e.preventDefault(); const d = UI.formData(e.target); location.hash = `#/atendimentos?${UI.qs({ tabela: 1, ...d })}`; };
    el.querySelector('#btnNew').onclick = () => this.form({}, () => this.tableList());
    el.querySelector('#btnExport').onclick = () => UI.download(`/tickets/export.csv?${UI.qs(this.tq)}`);
    const dist = el.querySelector('#btnDistribute'); if (dist) dist.onclick = async () => { try { const r = await api('/tickets/distribute', { method: 'POST' }); UI.toast(r.message, r.assigned ? 'success' : 'warning'); this.tableList(); } catch (err) { UI.err(err); } };
    UI.savedFilters(el.querySelector('#savedBox'), { scope: 'tickets', current: () => this.tq, onApply: (p) => { location.hash = `#/atendimentos?${UI.qs({ tabela: 1, ...p })}`; } });
    await this.tableList();
  },

  async tableList() {
    const box = this.el.querySelector('#list'); if (!box) return;
    const q = { ...this.tq, page: this.page, limit: 25 };
    if (!q.view && !q.status) q.open = 'true';
    const r = await api('/tickets', { query: q });
    const late = (t) => t.awaiting_reply && t.response_due_at && new Date(t.response_due_at) < Date.now();
    UI.table(box, { id: 'tickets', rows: r.tickets, total: r.total, page: r.page, limit: r.limit, sort: q.sort, dir: q.dir,
      columns: [
        { key: 'protocol', label: 'Protocolo', sortable: true, nowrap: true, render: (t) => `<span class="mono">${UI.esc(t.protocol)}</span>` },
        { key: 'customer_name', label: 'Cliente', sortable: true, min: '180px', render: (t) => `<span class="trunc strong" title="${UI.attr(t.customer_name)}">${UI.esc(t.customer_name)}</span><span class="trunc muted small">${UI.esc(UI.fmtPhone(t.customer_phone))}</span>` },
        { key: 'subject', label: 'Assunto', sortable: true, min: '200px', render: (t) => `<span class="trunc" title="${UI.attr(t.subject)}">${UI.esc(t.subject)}</span>` },
        { key: 'last_message_preview', label: 'Última mensagem', default: false, min: '200px', render: (t) => `<span class="trunc muted" title="${UI.attr(t.last_message_preview || '')}">${UI.esc(t.last_message_preview || '')}</span>` },
        { key: 'channel', label: 'Canal', sortable: true, nowrap: true, render: (t) => `${UI.channelIcon(t.channel)} ${UI.esc(t.channel)}` },
        { key: 'priority', label: 'Prioridade', sortable: true, render: (t) => UI.priorityBadge(t.priority) },
        { key: 'status', label: 'Status', sortable: true, render: (t) => UI.statusBadge(t.status) },
        { key: 'assignee_name', label: 'Responsável', sortable: true, nowrap: true, render: (t) => UI.esc(t.assignee_name || '—') },
        { key: 'response_due_at', label: 'Prazo de resposta', sortable: true, nowrap: true, render: (t) => t.awaiting_reply ? `<span class="${late(t) ? 'text-danger strong' : ''}">${late(t) ? 'vencido ' : 'até '}${UI.fmtDateTime(t.response_due_at)}</span>` : '<span class="muted">—</span>' },
        { key: 'last_message_at', label: 'Última msg.', sortable: true, nowrap: true, default: false, render: (t) => UI.fmtDateTime(t.last_message_at) },
        { key: 'opened_at', label: 'Abertura', sortable: true, nowrap: true, render: (t) => `<span title="${UI.fmtDateTime(t.opened_at)}">${UI.fmtDateTime(t.opened_at)}</span>` },
        { key: 'closed_at', label: 'Encerramento', sortable: false, nowrap: true, default: false, render: (t) => UI.fmtDateTime(t.closed_at) },
        { key: 'follow_up_at', label: 'Retorno', sortable: true, nowrap: true, render: (t) => t.follow_up_at ? `<span class="${new Date(t.follow_up_at) < Date.now() ? 'text-danger strong' : ''}">${UI.fmtDateTime(t.follow_up_at)}</span>` : '' },
        { key: 'unread_count', label: 'Não lidas', align: 'right', default: false, render: (t) => t.unread_count || '' },
        { key: 'actions', label: '', render: (t) => t.status === 'aguardando' && (!t.assignee_id || t.assignee_id === CRM.user.id) ? `<button class="btn sm success" data-claim="${t.id}">Assumir</button>` : '' },
      ],
      onSort: (sort, dir) => { this.tq.sort = sort; this.tq.dir = dir; this.tableList(); },
      onPage: (p) => { this.page = p; this.tableList(); },
      onRow: (t) => { location.hash = `#/atendimentos/${t.id}`; },
      rowClass: (t) => (late(t) ? 'late' : ''),
      empty: UI.empty('Nenhum atendimento encontrado', 'Ajuste os filtros ou abra um novo atendimento.') });
    box.querySelectorAll('[data-claim]').forEach((b) => b.onclick = () => this.claim(Number(b.dataset.claim), () => this.tableList()));
  },

  onRealtime() { if (this.query && this.query.tabela) return this.tableList(); this.list(); this.renderViews(); if (this.id) this.open(this.id, { keepDraft: true }); },
};
