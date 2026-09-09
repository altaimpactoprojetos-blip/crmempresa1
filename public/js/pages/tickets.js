'use strict';
CRM.pages.tickets = {
  async render(el, { id, query }) {
    this.el = el; this.id = id || null; this.query = query;
    if (id) return this.detail(el, id);
    const s = await api('/settings').catch(() => null);
    this.channels = s ? s.settings.channels : ['WhatsApp', 'Telefone', 'E-mail'];
    const tab = query.tab || (query.mine ? 'mine' : query.status || query.follow_up ? 'all' : 'queue');
    el.innerHTML = CRM.pageHeader('Atendimentos', 'Central de atendimentos: fila de espera, andamento e histórico.',
      `${CRM.isManager() ? '<button class="btn secondary" id="btnDistribute" title="Distribui a fila sem responsável em rodízio entre atendentes disponíveis">Distribuir fila</button>' : ''}<button class="btn secondary" id="btnExport">Exportar CSV</button><button class="btn" id="btnNew">+ Abrir atendimento</button>`) +
    `<div class="tabs" id="tabs">${[['queue', 'Fila de espera'], ['mine', 'Meus atendimentos'], ['all', 'Todos']].map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? 'active' : ''}">${l}</button>`).join('')}</div>
    <div class="card"><form class="filters" id="filters">
      <div class="field grow"><label>Busca</label><input name="q" value="${UI.attr(query.q || '')}" placeholder="Protocolo, assunto ou cliente"></div>
      <div class="field"><label>Status</label>${UI.select('status', [['', 'Todos'], ...Object.entries(UI.STATUS).map(([k, v]) => [k, v.label])], query.status)}</div>
      <div class="field"><label>Prioridade</label>${UI.select('priority', [['', 'Todas'], ...Object.entries(UI.PRIORITY).map(([k, v]) => [k, v.label])], query.priority)}</div>
      <div class="field"><label>Canal</label>${UI.select('channel', [['', 'Todos'], ...this.channels.map((c) => [c, c])], query.channel)}</div>
      ${CRM.isManager() ? `<div class="field"><label>Responsável</label>${UI.select('assignee_id', [['', 'Todos'], ['none', 'Sem responsável'], ...CRM.users.map((u) => [u.id, u.name])], query.assignee_id)}</div>` : ''}
      <div class="field"><label>De</label><input type="date" name="from" value="${UI.attr(query.from || '')}"></div><div class="field"><label>Até</label><input type="date" name="to" value="${UI.attr(query.to || '')}"></div>
      <button class="btn secondary">Filtrar</button><a class="btn ghost" href="#/atendimentos?tab=${tab}">Limpar</a></form><div id="list"></div></div>`;
    this.tab = tab;
    el.querySelector('#tabs').onclick = (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; location.hash = `#/atendimentos?tab=${b.dataset.tab}`; };
    el.querySelector('#filters').onsubmit = (e) => { e.preventDefault(); const d = UI.formData(e.target); const qs = new URLSearchParams({ tab }); Object.entries(d).forEach(([k, v]) => { if (v) qs.set(k, v); }); location.hash = `#/atendimentos?${qs}`; };
    el.querySelector('#btnNew').onclick = () => this.form({}, () => this.list());
    el.querySelector('#btnExport').onclick = () => UI.download(`/tickets/export.csv?from=${query.from || ''}&to=${query.to || ''}`);
    const dist = el.querySelector('#btnDistribute'); if (dist) dist.onclick = async () => { try { const r = await api('/tickets/distribute', { method: 'POST' }); UI.toast(r.message, r.assigned ? 'success' : 'warning'); this.list(); } catch (err) { UI.err(err); } };
    await this.list();
    if (query.novo) { history.replaceState(null, '', '#/atendimentos'); this.form({}, () => this.list()); }
  },

  async list() {
    const box = this.el.querySelector('#list'); if (!box) return;
    const q = { q: this.query.q, priority: this.query.priority, channel: this.query.channel, from: this.query.from, to: this.query.to, limit: 100 };
    if (this.tab === 'queue') q.status = 'aguardando';
    else if (this.tab === 'mine') { q.mine = 'true'; q.status = this.query.status || 'aguardando,em_atendimento,aguardando_cliente'; }
    else { q.status = this.query.status; q.assignee_id = this.query.assignee_id; if (this.query.follow_up) q.follow_up = this.query.follow_up; }
    const r = await api('/tickets', { query: q });
    if (!r.tickets.length) { box.innerHTML = UI.empty(this.tab === 'queue' ? 'Fila vazia' : 'Nenhum atendimento encontrado', this.tab === 'queue' ? 'Todos os atendimentos foram assumidos.' : 'Ajuste os filtros ou abra um novo atendimento.'); return; }
    box.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Protocolo</th><th>Cliente</th><th>Assunto</th><th>Canal</th><th>Prioridade</th><th>Status</th><th>Responsável</th><th>Abertura</th><th>Retorno</th><th></th></tr></thead><tbody>
      ${r.tickets.map((t) => `<tr class="clickable" data-id="${t.id}"><td class="mono small">${UI.esc(t.protocol)}</td><td><strong>${UI.esc(t.customer_name)}</strong><div class="muted small">${UI.esc(t.customer_phone || '')}</div></td><td>${UI.esc(t.subject)}</td><td class="small">${UI.esc(t.channel)}</td><td>${UI.priorityBadge(t.priority)}</td><td>${UI.statusBadge(t.status)}</td><td class="small">${UI.esc(t.assignee_name || '—')}</td><td class="small nowrap" title="${UI.fmtDateTime(t.opened_at)}">${UI.relative(t.opened_at)}</td><td class="small nowrap">${t.follow_up_at ? `<span class="badge ${new Date(t.follow_up_at) < Date.now() ? 'danger' : 'warning'}">${UI.fmtDateTime(t.follow_up_at)}</span>` : ''}</td>
        <td>${t.status === 'aguardando' && (!t.assignee_id || t.assignee_id === CRM.user.id) ? `<button class="btn sm success" data-claim="${t.id}">Assumir</button>` : ''}</td></tr>`).join('')}</tbody></table></div><div class="pagination muted">${r.total} atendimento(s)</div>`;
    box.querySelectorAll('tr[data-id]').forEach((tr) => tr.onclick = (e) => { if (e.target.closest('button')) return; location.hash = `#/atendimentos/${tr.dataset.id}`; });
    box.querySelectorAll('[data-claim]').forEach((b) => b.onclick = () => this.claim(Number(b.dataset.claim), () => this.list()));
  },

  async claim(id, after) {
    try { const r = await api(`/tickets/${id}/claim`, { method: 'POST' }); UI.ok(r.message); if (after) after(); else location.hash = `#/atendimentos/${id}`; }
    catch (err) { UI.toast(err.message, 'warning', 6000); if (after) after(); }
  },

  // Abrir atendimento (opcionalmente já com cliente definido)
  async form({ customer } = {}, onSaved) {
    if (!this.channels) { const s = await api('/settings').catch(() => null); this.channels = s ? s.settings.channels : ['WhatsApp', 'Telefone', 'E-mail']; }
    const assigneeOpts = CRM.isManager() ? UI.userOptions(CRM.users, { blank: '— Deixar na fila —' }) : [['', '— Deixar na fila —'], [CRM.user.id, `${CRM.user.name} (eu)`]];
    const m = UI.modal({ title: 'Abrir atendimento', body: `<form id="tkForm">
      ${UI.field('customer_id', 'Cliente', `<div class="flex"><input id="custSearch" placeholder="Digite para buscar o cliente..." autocomplete="off" value="${UI.attr(customer ? customer.name : '')}" ${customer ? 'readonly' : ''} class="grow"><input type="hidden" name="customer_id" data-type="int" value="${customer ? customer.id : ''}">${customer ? '' : '<button type="button" class="btn secondary sm" id="newCust">+ Novo</button>'}</div><div class="search-results" id="custResults" hidden style="position:relative"></div>`, { required: true })}
      ${UI.field('subject', 'Assunto', UI.input('subject', '', 'required maxlength="200"'), { required: true })}
      <div class="form-row cols-3">${UI.field('channel', 'Canal de origem', UI.select('channel', this.channels.map((c) => [c, c]), this.channels[0]), { required: true })}
        ${UI.field('priority', 'Prioridade', UI.select('priority', Object.entries(UI.PRIORITY).map(([k, v]) => [k, v.label]), 'normal'))}
        ${UI.field('assignee_id', 'Responsável', UI.select('assignee_id', assigneeOpts, '', 'data-type="int"'))}</div>
      ${UI.field('description', 'Descrição', UI.textarea('description', '', 'data-type="nullable" placeholder="Relato do cliente, contexto, etc."'))}
      <label class="check"><input type="checkbox" name="auto_assign"> Distribuir automaticamente em rodízio (se ninguém for escolhido)</label></form>`,
      footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="tkForm">Abrir atendimento</button>` });
    const form = m.el.querySelector('#tkForm');
    if (!customer) this.customerPicker(form.querySelector('#custSearch'), form.querySelector('#custResults'), form.customer_id, m);
    form.onsubmit = async (e) => {
      e.preventDefault(); const d = UI.formData(form); if (!d.customer_id) { UI.showErrors(form, new ApiError(400, { fields: { customer_id: 'Selecione um cliente.' } })); return; }
      try { const r = await api('/tickets', { method: 'POST', body: d }); UI.ok(r.message); m.close(); if (onSaved) onSaved(r.ticket); location.hash = `#/atendimentos/${r.ticket.id}`; } catch (err) { UI.showErrors(form, err); }
    };
  },

  customerPicker(input, box, hidden, modal) {
    const run = UI.debounce(async () => {
      const q = input.value.trim(); if (q.length < 2) { box.hidden = true; return; }
      const r = await api('/customers', { query: { q, limit: 8 } });
      box.innerHTML = r.customers.length ? r.customers.map((c) => `<a href="#" data-id="${c.id}" data-name="${UI.attr(c.name)}"><strong>${UI.esc(c.name)}</strong> <span class="muted small">${UI.esc(c.phone || '')} ${UI.esc(c.company || '')}</span></a>`).join('') : '<div class="cat">Nenhum cliente encontrado</div>';
      box.hidden = false;
    }, 250);
    input.oninput = () => { hidden.value = ''; run(); };
    box.onclick = (e) => { e.preventDefault(); const a = e.target.closest('a'); if (!a) return; hidden.value = a.dataset.id; input.value = a.dataset.name; box.hidden = true; };
    const nb = modal.el.querySelector('#newCust'); if (nb) nb.onclick = () => CRM.pages.customers.form(null, (c) => { hidden.value = c.id; input.value = c.name; });
  },

  async detail(el, id) {
    const r = await api(`/tickets/${id}`);
    const t = r.ticket; this.current = t;
    const open = ['aguardando', 'em_atendimento', 'aguardando_cliente'].includes(t.status);
    const isOwner = t.assignee_id === CRM.user.id, mgr = CRM.isManager();
    const canAct = open && (isOwner || mgr);
    const phone = UI.digits(t.customer_phone); const wa = phone ? UI.waLink(phone.length <= 11 ? '55' + phone : phone) : null;
    const actions = [];
    if (t.status === 'aguardando' && (!t.assignee_id || isOwner)) actions.push('<button class="btn success" data-act="claim">Assumir atendimento</button>');
    if (t.status === 'aguardando' && t.assignee_id && !isOwner && mgr) actions.push('<button class="btn secondary" data-act="transfer">Reatribuir</button>');
    if (canAct && t.status !== 'aguardando') {
      if (t.status !== 'aguardando_cliente') actions.push('<button class="btn secondary" data-act="status" data-status="aguardando_cliente">Aguardando cliente</button>');
      else actions.push('<button class="btn secondary" data-act="status" data-status="em_atendimento">Retomar atendimento</button>');
      actions.push('<button class="btn secondary" data-act="transfer">Transferir</button>', '<button class="btn secondary" data-act="release">Devolver à fila</button>', '<button class="btn secondary" data-act="followup">Agendar retorno</button>',
        '<button class="btn" data-act="status" data-status="resolvido">Resolver</button>', '<button class="btn danger" data-act="status" data-status="cancelado">Cancelar</button>');
    } else if (canAct && t.status === 'aguardando' && mgr) actions.push('<button class="btn danger" data-act="status" data-status="cancelado">Cancelar</button>');
    if (!open) actions.push('<button class="btn" data-act="reopen">Reabrir</button>');
    if (open && (isOwner || mgr || !t.assignee_id)) actions.push('<button class="btn ghost" data-act="edit">Editar</button>');
    el.innerHTML = `<div class="page-header"><div><a href="#/atendimentos" class="small">← Atendimentos</a><h1><span class="mono">${UI.esc(t.protocol)}</span> · ${UI.esc(t.subject)}</h1>
        <p>${UI.statusBadge(t.status)} ${UI.priorityBadge(t.priority)} <span class="badge">${UI.esc(t.channel)}</span> · Cliente: <a href="#/clientes/${t.customer_id}">${UI.esc(t.customer_name)}</a>${t.customer_company ? ` (${UI.esc(t.customer_company)})` : ''} · Responsável: <strong>${UI.esc(t.assignee_name || 'na fila')}</strong></p></div>
      <div class="flex wrap" id="actions">${wa ? `<a class="btn wa" href="${wa}" target="_blank" rel="noopener" title="Abre o WhatsApp. Não sincroniza mensagens com o CRM.">Abrir WhatsApp</a>` : ''}${actions.join('')}</div></div>
    ${!open ? `<div class="alert info">Atendimento encerrado em ${UI.fmtDateTime(t.closed_at)}. Negociações vinculadas continuam abertas no funil até serem encerradas separadamente.</div>` : ''}
    ${t.follow_up_at && open ? `<div class="alert ${new Date(t.follow_up_at) < Date.now() ? 'warning' : 'info'}">Retorno agendado para <strong>${UI.fmtDateTime(t.follow_up_at)}</strong>. <a href="#" data-act="followup">Alterar</a></div>` : ''}
    <div class="grid" style="grid-template-columns: 1fr 340px">
      <div class="stack">
        <div class="card"><h3>Registrar</h3>
          <div class="tabs" id="regTabs"><button class="active" data-kind="interaction">Interação com o cliente</button><button data-kind="note">Anotação interna</button></div>
          <form id="regForm">
            <div class="form-row" id="interFields">${UI.field('direction', 'Direção', UI.select('direction', [['saida', 'Saída (resposta ao cliente)'], ['entrada', 'Entrada (cliente entrou em contato)']]))}${UI.field('channel', 'Canal', UI.select('channel', (this.channels || [t.channel]).includes(t.channel) ? (this.channels || [t.channel]).map((c) => [c, c]) : [[t.channel, t.channel], ...(this.channels || []).map((c) => [c, c])], t.channel))}</div>
            ${UI.field('body', 'Conteúdo', UI.textarea('body', '', 'required placeholder="Resumo do que foi tratado"'), { required: true })}
            <div class="flex between"><span class="muted small" id="regHint">${canAct ? 'A primeira interação de saída define o tempo de primeira resposta.' : 'Assuma o atendimento para registrar interações.'}</span><button class="btn" ${canAct || mgr ? '' : 'disabled'}>Registrar</button></div></form></div>
        <div class="card"><h3>Linha do tempo</h3>
          <ul class="timeline">${r.events.map((e) => `<li class="${e.kind}"><span class="tl-dot"></span><div><div class="tl-meta">${e.kind === 'note' ? 'Anotação interna' : e.kind === 'interaction' ? `${e.direction === 'saida' ? 'Saída' : 'Entrada'} · ${UI.esc(e.channel || '')}` : 'Sistema'} · ${UI.esc(e.user_name || 'Sistema')} · ${UI.fmtDateTime(e.created_at)}</div><div class="tl-body">${UI.esc(e.body || '')}</div></div></li>`).join('')}</ul></div>
      </div>
      <div class="stack">
        <div class="card"><h3>Detalhes</h3><table class="small"><tbody>
          <tr><th>Abertura</th><td>${UI.fmtDateTime(t.opened_at)}</td></tr><tr><th>1ª resposta</th><td>${t.first_response_at ? `${UI.fmtDateTime(t.first_response_at)} <span class="muted">(${UI.fmtDuration((new Date(t.first_response_at) - new Date(t.opened_at)) / 1000)})</span>` : '<span class="muted">ainda não registrada</span>'}</td></tr>
          <tr><th>Encerramento</th><td>${t.closed_at ? `${UI.fmtDateTime(t.closed_at)} <span class="muted">(${UI.fmtDuration((new Date(t.closed_at) - new Date(t.opened_at)) / 1000)})</span>` : '—'}</td></tr>
          <tr><th>Aberto por</th><td>${UI.esc(t.created_by_name || '—')}</td></tr><tr><th>Telefone</th><td>${UI.esc(t.customer_phone || '—')}</td></tr></tbody></table>
          ${t.description ? `<h4 class="mt">Descrição</h4><p class="small" style="white-space:pre-wrap">${UI.esc(t.description)}</p>` : ''}</div>
        <div class="card"><div class="card-title"><h3>Negociações</h3><button class="btn sm secondary" id="btnOpp">+ Oportunidade</button></div>${r.opportunities.length ? r.opportunities.map((o) => `<div><a href="#/funil/${o.id}">${UI.esc(o.title)}</a> <span class="badge ${o.stage_kind === 'won' ? 'success' : o.stage_kind === 'lost' ? 'danger' : 'primary'}">${UI.esc(o.stage_name)}</span> <span class="muted small">${UI.fmtMoney(o.value)}</span></div>`).join('') : '<p class="muted small">Nenhuma oportunidade vinculada. O status do atendimento e a etapa comercial são independentes.</p>'}</div>
        <div class="card"><div class="card-title"><h3>Tarefas</h3><button class="btn sm secondary" id="btnTask">+ Tarefa</button></div>${r.tasks.length ? r.tasks.map((x) => `<div class="small">${x.done_at ? '✅' : '⬜'} ${UI.esc(x.title)} <span class="muted">· ${UI.fmtDateTime(x.due_at)} · ${UI.esc(x.assignee_name || '')}</span></div>`).join('') : '<p class="muted small">Nenhuma tarefa.</p>'}</div>
      </div></div>`;
    // Registro
    let kind = 'interaction';
    el.querySelector('#regTabs').onclick = (e) => { const b = e.target.closest('button'); if (!b) return; kind = b.dataset.kind; el.querySelectorAll('#regTabs button').forEach((x) => x.classList.toggle('active', x === b)); el.querySelector('#interFields').hidden = kind !== 'interaction'; el.querySelector('#regHint').textContent = kind === 'note' ? 'Anotações internas não são visíveis ao cliente e não contam como resposta.' : (canAct ? 'A primeira interação de saída define o tempo de primeira resposta.' : 'Assuma o atendimento para registrar interações.'); el.querySelector('#regForm button').disabled = kind === 'interaction' && !(canAct || mgr); };
    el.querySelector('#regForm').onsubmit = async (e) => { e.preventDefault(); const d = UI.formData(e.target);
      try { const r2 = kind === 'note' ? await api(`/tickets/${id}/notes`, { method: 'POST', body: { body: d.body } }) : await api(`/tickets/${id}/interactions`, { method: 'POST', body: d }); UI.ok(r2.message); this.detail(el, id); } catch (err) { UI.showErrors(e.target, err); } };
    el.querySelector('#btnOpp').onclick = () => CRM.pages.pipeline.form({ customer: { id: t.customer_id, name: t.customer_name }, ticket_id: t.id }, () => this.detail(el, id));
    el.querySelector('#btnTask').onclick = () => CRM.pages.tasks.form({ customer_id: t.customer_id, customer_name: t.customer_name, ticket_id: t.id, assignee_id: t.assignee_id }, () => this.detail(el, id));
    el.querySelectorAll('[data-act]').forEach((b) => b.onclick = (e) => { e.preventDefault(); this.action(b.dataset.act, t, b.dataset.status, () => this.detail(el, id)); });
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
        const m = UI.modal({ title: 'Agendar retorno', size: 'narrow', body: `<form id="fuForm">${UI.field('at', 'Data e hora do retorno', `<input type="datetime-local" name="at" value="${UI.toLocalInput(t.follow_up_at)}" required>`, { required: true, hint: 'Uma tarefa de retorno será criada para o responsável.' })}${UI.field('note', 'Observação', UI.input('note', '', 'placeholder="Opcional"'))}</form>`,
          footer: `${t.follow_up_at ? '<button class="btn ghost" id="clearFu">Remover agendamento</button>' : ''}<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="fuForm">Agendar</button>` });
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

  onRealtime() { if (this.id) this.detail(this.el, this.id); else this.list(); },
};
