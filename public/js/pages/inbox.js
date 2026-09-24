'use strict';
// Caixa de entrada (estilo Kommo): lista de conversas à esquerda e chat à direita.
CRM.pages.inbox = {
  FILTERS: [
    ['open', 'Abertas'],
    ['mine', 'Minhas'],
    ['unassigned', 'Sem responsável'],
    ['unread', 'Não lidas'],
    ['closed', 'Encerradas'],
  ],

  async render(el, { id, query }) {
    this.el = el;
    this.filter = this.filter || 'open';
    this.q = query.q || '';
    this.currentId = id || null;
    const [channels, replies, stages] = await Promise.all([api('/channels'), api('/quick-replies'), api('/pipelines')]);
    this.channels = channels.channels;
    this.replies = replies.quick_replies;
    // Todas as etapas de todos os funis; o seletor mostra só as do funil da oportunidade
    CRM.stages = stages.pipelines.flatMap((p) => p.stages);
    el.innerHTML = `<div class="inbox ${this.sideOpen() ? 'with-side' : ''}">
      <section class="inbox-list">
        <div class="inbox-list-head">
          <h1>Conversas</h1>
          <input id="convSearch" type="search" placeholder="Buscar nome ou telefone" value="${UI.attr(this.q)}">
          <div class="chips" id="convFilters">${this.FILTERS.map(([k, l]) => `<button data-filter="${k}" class="${this.filter === k ? 'active' : ''}">${l}</button>`).join('')}</div>
        </div>
        <div id="convItems" class="inbox-items"></div>
      </section>
      <section class="inbox-chat" id="chat"></section>
      <aside class="inbox-side" id="convSide"></aside>
    </div>`;
    el.querySelector('#convFilters').onclick = (e) => {
      const b = e.target.closest('[data-filter]');
      if (!b) return;
      this.filter = b.dataset.filter;
      el.querySelectorAll('#convFilters button').forEach((x) => x.classList.toggle('active', x === b));
      this.loadList();
    };
    el.querySelector('#convSearch').oninput = UI.debounce((e) => {
      this.q = e.target.value.trim();
      this.loadList();
    }, 300);
    el.querySelector('#convItems').onclick = (e) => {
      const item = e.target.closest('[data-conv]');
      if (item) this.open(Number(item.dataset.conv));
    };
    await this.loadList();
    if (this.currentId) await this.open(this.currentId);
    else this.renderPlaceholder();
  },

  // Painel lateral com os dados do cliente (aberto por padrão em telas largas)
  sideOpen() {
    try {
      const v = localStorage.getItem('crm.inboxSide');
      if (v) return v === 'open';
    } catch (_) {
      /* sem preferência salva */
    }
    return window.innerWidth >= 1280;
  },

  async loadSide(force = false) {
    const box = this.el.querySelector('#convSide');
    const c = this.conv;
    if (!box || !c || !this.sideOpen()) return;
    if (!force && this.sideFor === c.id) return; // atualizações em tempo real não recarregam o painel
    this.sideFor = c.id;
    if (!c.customer_id) {
      box.innerHTML = `<div class="side-sec">${UI.empty('Contato sem cadastro', 'Esta conversa ainda não está ligada a um cliente.')}</div>`;
      return;
    }
    box.innerHTML = UI.skeleton('rows');
    let r;
    try {
      r = await api(`/customers/${c.customer_id}`);
    } catch (err) {
      box.innerHTML = `<div class="side-sec"><div class="alert danger small">${UI.esc(err.message)}</div></div>`;
      return;
    }
    if (this.sideFor !== c.id) return;
    const cu = r.customer;
    const openTickets = r.tickets.filter((t) => !['resolvido', 'cancelado'].includes(t.status));
    const openOpps = r.opportunities.filter((o) => o.stage_kind === 'open');
    const pending = r.tasks.filter((t) => !t.done_at);
    const row = (k, v) =>
      v ? `<div class="side-row"><span class="muted small">${k}</span><span>${v}</span></div>` : '';
    box.innerHTML = `<div class="side-sec center"><span class="avatar lg">${UI.esc(UI.initials(cu.name))}</span><h3>${UI.esc(cu.name)}</h3>
        <div class="muted small">${UI.esc([cu.company, cu.city].filter(Boolean).join(' · '))}</div>
        <div class="side-tags">${(cu.tags || []).map((t) => `<span class="tag">${UI.esc(t)}</span>`).join('')}</div></div>
      <div class="side-sec">${row('Telefone', UI.esc(cu.phone || ''))}${row('E-mail', UI.esc(cu.email || ''))}${row('Origem', UI.esc(cu.source || ''))}${row('Responsável pelo cliente', UI.esc(cu.owner_name || '—'))}${row('Na conversa', UI.esc(c.assignee_name || 'Sem responsável'))}</div>
      <div class="side-sec"><h4>Oportunidades abertas</h4>${
        openOpps.length
          ? openOpps
              .slice(0, 3)
              .map(
                (o) =>
                  `<a class="side-item" href="#/funil/${o.id}"><strong>${UI.esc(o.title)}</strong><span class="small muted">${UI.esc(o.stage_name)} · ${UI.fmtMoney(o.value)}</span></a>`,
              )
              .join('')
          : '<p class="small muted">Nenhuma.</p>'
      }</div>
      <div class="side-sec"><h4>Atendimentos em aberto</h4>${
        openTickets.length
          ? openTickets
              .slice(0, 3)
              .map(
                (t) =>
                  `<a class="side-item" href="#/atendimentos/${t.id}"><strong>${UI.esc(t.subject)}</strong><span class="small muted mono">${UI.esc(t.protocol)}</span></a>`,
              )
              .join('')
          : '<p class="small muted">Nenhum.</p>'
      }</div>
      <div class="side-sec"><h4>Tarefas pendentes (${pending.length})</h4>${pending
        .slice(0, 3)
        .map(
          (t) =>
            `<div class="side-item"><strong>${UI.esc(t.title)}</strong><span class="small muted">${t.due_at ? UI.fmtDateTime(t.due_at) : 'sem prazo'}</span></div>`,
        )
        .join('')}</div>
      <div class="side-sec side-actions"><a class="btn secondary sm" href="#/clientes/${cu.id}">Ver cliente</a>
        <button class="btn secondary sm" data-side="ticket">Abrir atendimento</button><button class="btn secondary sm" data-side="task">Nova tarefa</button>
        <button class="btn secondary sm" data-side="opp">Nova oportunidade</button></div>`;
    const refresh = () => this.loadSide(true);
    box.querySelector('.side-actions').onclick = (e) => {
      const a = e.target.closest('[data-side]')?.dataset.side;
      if (a === 'ticket') CRM.pages.tickets.form({ customer: cu }, refresh);
      if (a === 'task') CRM.pages.tasks.form({ customer_id: cu.id, customer_name: cu.name }, refresh);
      if (a === 'opp') CRM.pages.pipeline.form({ customer: cu }, refresh);
    };
  },

  // Atualização em tempo real (novas mensagens, status, atribuições)
  onRealtime() {
    this.loadList();
    if (this.currentId) this.loadChat({ keepDraft: true });
  },

  async loadList() {
    const f = this.filter;
    const params = { q: this.q };
    if (f === 'closed') params.status = 'closed';
    else if (f !== 'open') params.filter = f;
    const { conversations } = await api('/inbox/conversations', { query: params });
    const box = this.el.querySelector('#convItems');
    if (!box) return;
    box.innerHTML = conversations.length
      ? conversations.map((c) => this.itemHtml(c)).join('')
      : UI.empty(
          'Nenhuma conversa',
          f === 'open' ? 'As mensagens recebidas no WhatsApp, Instagram e Messenger aparecem aqui.' : '',
        );
  },

  CHANNEL_TAG: {
    whatsapp: ['wa', 'WhatsApp'],
    whatsapp_web: ['wa', 'WhatsApp'],
    instagram: ['ig', 'Instagram'],
    messenger: ['fb', 'Messenger'],
  },

  // Contato: telefone no WhatsApp; no Instagram/Messenger (ou WhatsApp com privacidade) não há número
  contactLine(c) {
    return /^\d+$/.test(c.contact_phone || '')
      ? UI.fmtPhone(c.contact_phone)
      : this.CHANNEL_TAG[c.channel_type]?.[1] || '';
  },

  channelTag(c) {
    const [cls, label] = this.CHANNEL_TAG[c.channel_type] || ['wa', 'WhatsApp'];
    return `<span class="ch-tag ${cls}" title="${label}">${cls === 'wa' ? 'WA' : cls === 'ig' ? 'IG' : 'FB'}</span>`;
  },

  itemHtml(c) {
    const name = c.contact_name || c.customer_name || this.contactLine(c);
    return `<button class="conv-item ${c.id === this.currentId ? 'active' : ''} ${c.unread_count ? 'unread' : ''}" data-conv="${c.id}">
      <span class="avatar">${UI.esc(UI.initials(name))}${this.channelTag(c)}</span>
      <span class="conv-main"><span class="conv-top"><strong>${UI.esc(name)}</strong><span class="muted small">${UI.esc(UI.relative(c.last_message_at))}</span></span>
      <span class="conv-bottom"><span class="conv-preview">${UI.esc(c.last_message_preview || '')}</span>${c.unread_count ? `<span class="badge success">${c.unread_count}</span>` : ''}</span>
      <span class="muted small">${c.assignee_name ? UI.esc(c.assignee_name) : 'Sem responsável'}${c.stage_name ? ' · ' + UI.esc(c.stage_name) : ''}</span></span>
    </button>`;
  },

  renderPlaceholder() {
    const chat = this.el.querySelector('#chat');
    if (!this.channels.length) {
      chat.innerHTML = `<div class="chat-empty"><h2>Conecte o WhatsApp ou o Instagram da empresa</h2>
        <p class="muted">Receba e responda as mensagens dos clientes aqui dentro. Cada conversa vira um cliente e uma oportunidade no funil automaticamente.</p>
        ${CRM.isAdmin() ? '<a class="btn" href="#/configuracoes/whatsapp">Conectar canais</a>' : '<p class="small">Peça ao administrador para conectar os canais em Configurações › WhatsApp e redes.</p>'}</div>`;
    } else
      chat.innerHTML = `<div class="chat-empty">${UI.empty('Selecione uma conversa', 'Escolha uma conversa na lista para ver as mensagens.')}</div>`;
  },

  async open(id) {
    this.currentId = id;
    history.replaceState(null, '', `#/conversas/${id}`);
    this.el.querySelectorAll('.conv-item').forEach((x) => x.classList.toggle('active', Number(x.dataset.conv) === id));
    this.el.querySelector('.inbox').classList.add('chat-open');
    await this.loadChat();
  },

  async loadChat({ keepDraft = false } = {}) {
    const chat = this.el.querySelector('#chat');
    let data;
    try {
      data = await api(`/inbox/conversations/${this.currentId}`);
    } catch (err) {
      chat.innerHTML = `<div class="chat-empty"><div class="alert danger">${UI.esc(err.message)}</div></div>`;
      return;
    }
    const draft = keepDraft ? chat.querySelector('#composerText')?.value : '';
    const mode = keepDraft ? this.mode : 'message';
    this.conv = data.conversation;
    this.mode = mode || 'message';
    const c = this.conv;
    const name = c.contact_name || c.customer_name || this.contactLine(c);
    chat.innerHTML = `<header class="chat-head">
        <button class="icon-btn chat-back" id="chatBack" aria-label="Voltar">←</button>
        <span class="avatar">${UI.esc(UI.initials(name))}</span>
        <div class="grow"><strong>${UI.esc(name)}</strong><div class="muted small">${UI.esc([...new Set([this.contactLine(c), c.channel_name])].join(' · '))}${c.customer_id ? ` · <a href="#/clientes/${c.customer_id}">Ver cliente</a>` : ''}</div></div>
        <button class="icon-btn" id="infoBtn" title="Dados do cliente">${UI.icons.user}</button>
        ${this.stageSelect(c)}
        ${this.assignControl(c)}
        ${c.status === 'open' ? '<button class="btn secondary sm" id="closeConv">Encerrar</button>' : '<button class="btn secondary sm" id="reopenConv">Reabrir</button>'}
      </header>
      <div class="chat-messages" id="chatMessages">${data.messages.map((m) => this.messageHtml(m)).join('') || '<p class="muted center">Nenhuma mensagem ainda.</p>'}</div>
      ${this.composerHtml(c)}`;
    const box = chat.querySelector('#chatMessages');
    box.scrollTop = box.scrollHeight;
    const text = chat.querySelector('#composerText');
    if (text && draft) text.value = draft;
    this.bindChat(chat);
    // Conversa aberta na tela: o que chega já conta como lido
    if (c.unread_count && document.visibilityState === 'visible') {
      await api(`/inbox/conversations/${c.id}/read`, { method: 'POST' });
      this.loadList();
    }
  },

  stageSelect(c) {
    if (!c.opportunity_id) return '';
    const current = (CRM.stages || []).find((s) => s.id === c.stage_id);
    const stages = (CRM.stages || []).filter((s) => s.active && current && s.pipeline_id === current.pipeline_id);
    if (!stages.length) return `<span class="badge">${UI.esc(c.stage_name || '')}</span>`;
    return `<select id="stageSel" class="sm" title="Etapa no funil">${stages.map((s) => `<option value="${s.id}" ${s.id === c.stage_id ? 'selected' : ''}>${UI.esc(s.name)}</option>`).join('')}</select>`;
  },

  assignControl(c) {
    if (CRM.isManager()) {
      const users = CRM.users.filter((u) => u.active);
      return `<select id="assignSel" class="sm" title="Responsável"><option value="">Sem responsável</option>${users.map((u) => `<option value="${u.id}" ${u.id === c.assignee_id ? 'selected' : ''}>${UI.esc(u.name)}</option>`).join('')}</select>`;
    }
    if (!c.assignee_id) return '<button class="btn sm" id="claimConv">Assumir</button>';
    if (c.assignee_id === CRM.user.id) return '<button class="btn ghost sm" id="releaseConv">Devolver à fila</button>';
    return `<span class="badge">${UI.esc(c.assignee_name)}</span>`;
  },

  STATUS_ICON: { pending: '🕓', sent: '✓', delivered: '✓✓', read: '✓✓', failed: '⚠' },

  messageHtml(m) {
    if (m.type === 'system') return `<div class="msg-system">${UI.esc(m.body)} · ${UI.fmtDateTime(m.created_at)}</div>`;
    const media = m.has_media ? this.mediaHtml(m) : '';
    const body = m.body ? `<div class="msg-text">${UI.esc(m.body)}</div>` : '';
    const who =
      m.direction === 'in' ? '' : m.is_bot ? '🤖 Robô · ' : m.sender_name ? `${UI.esc(m.sender_name)} · ` : '';
    const status =
      m.direction === 'out'
        ? `<span class="msg-status ${m.status}" title="${UI.attr(m.error || m.status)}">${this.STATUS_ICON[m.status] || ''}</span>`
        : '';
    const error = m.status === 'failed' ? `<div class="msg-error">Não enviada: ${UI.esc(m.error || 'erro')}</div>` : '';
    return `<div class="msg ${m.direction}">${m.direction === 'note' ? '<div class="msg-label">Anotação interna</div>' : ''}${media}${body}${error}
      <div class="msg-meta">${who}${UI.esc(new Date(m.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }))} ${status}</div></div>`;
  },

  mediaHtml(m) {
    const src = `/api/inbox/messages/${m.id}/media`;
    if (m.type === 'image' || m.type === 'sticker')
      return `<a href="${src}" target="_blank" rel="noopener"><img class="msg-img" src="${src}" alt="Imagem" loading="lazy"></a>`;
    if (m.type === 'audio') return `<audio controls preload="none" src="${src}"></audio>`;
    if (m.type === 'video') return `<video controls preload="none" src="${src}" class="msg-img"></video>`;
    return `<a class="msg-file" href="${src}" target="_blank" rel="noopener">📄 ${UI.esc(m.filename || 'Documento')}</a>`;
  },

  composerHtml(c) {
    const closedWindow = !c.window_open;
    const social = c.channel_type === 'instagram' || c.channel_type === 'messenger';
    const windowAlert = social
      ? `<div class="alert warning small">O cliente não escreve há mais de 7 dias. Pela regra da Meta, só é possível responder quando ele mandar uma nova mensagem no ${this.CHANNEL_TAG[c.channel_type][1]}.</div>`
      : `<div class="alert warning small">A janela de 24 horas do WhatsApp está fechada: o cliente não escreve há mais de um dia. Envie um modelo aprovado para retomar a conversa. <button class="btn sm" id="sendTemplate">Enviar modelo</button></div>`;
    return `<footer class="composer">
      <div class="composer-tabs"><button data-mode="message" class="${this.mode === 'message' ? 'active' : ''}">Mensagem</button><button data-mode="note" class="${this.mode === 'note' ? 'active' : ''}">Anotação interna</button></div>
      ${closedWindow && this.mode === 'message' ? windowAlert : ''}
      <div class="composer-row ${this.mode === 'note' ? 'note' : ''}">
        <div class="qr-pop" id="qrPop" hidden></div>
        <textarea id="composerText" rows="2" placeholder="${this.mode === 'note' ? 'Anotação visível só para a equipe' : 'Escreva uma mensagem. Digite / para respostas rápidas'}" ${closedWindow && this.mode === 'message' ? 'disabled' : ''}></textarea>
        <button class="btn" id="sendBtn" ${closedWindow && this.mode === 'message' ? 'disabled' : ''}>${this.mode === 'note' ? 'Anotar' : 'Enviar'}</button>
      </div></footer>`;
  },

  bindChat(chat) {
    const c = this.conv;
    const $ = (s) => chat.querySelector(s);
    $('#chatBack').onclick = () => this.el.querySelector('.inbox').classList.remove('chat-open');
    $('#infoBtn').onclick = () => {
      const open = !this.sideOpen();
      try {
        localStorage.setItem('crm.inboxSide', open ? 'open' : 'closed');
      } catch (_) {
        /* preferência só nesta página */
      }
      this.el.querySelector('.inbox').classList.toggle('with-side', open);
      if (open) this.loadSide(true);
    };
    this.loadSide();
    const act = async (fn) => {
      try {
        const r = await fn();
        if (r && r.message) UI.ok(r.message);
        await this.loadChat();
        this.loadList();
      } catch (err) {
        UI.err(err);
      }
    };
    if ($('#closeConv'))
      $('#closeConv').onclick = () => act(() => api(`/inbox/conversations/${c.id}/close`, { method: 'POST' }));
    if ($('#reopenConv'))
      $('#reopenConv').onclick = () => act(() => api(`/inbox/conversations/${c.id}/reopen`, { method: 'POST' }));
    const assign = (to) =>
      act(() => api(`/inbox/conversations/${c.id}/assign`, { method: 'PUT', body: { assignee_id: to } }));
    if ($('#assignSel')) $('#assignSel').onchange = (e) => assign(e.target.value ? Number(e.target.value) : null);
    if ($('#claimConv')) $('#claimConv').onclick = () => assign(CRM.user.id);
    if ($('#releaseConv')) $('#releaseConv').onclick = () => assign(null);
    if ($('#stageSel'))
      $('#stageSel').onchange = async (e) => {
        const stageId = Number(e.target.value);
        const stage = (CRM.stages || []).find((s) => s.id === stageId);
        const body = { stage_id: stageId };
        if (stage && stage.kind === 'lost') {
          body.lost_reason = await UI.prompt('Motivo da perda', { title: 'Negócio perdido' });
          if (!body.lost_reason) return this.loadChat();
        }
        act(() => api(`/opportunities/${c.opportunity_id}/move`, { method: 'POST', body }));
      };
    this.bindComposer(chat);
  },

  bindComposer(chat) {
    const c = this.conv;
    const text = chat.querySelector('#composerText');
    const pop = chat.querySelector('#qrPop');
    const tabs = chat.querySelector('.composer-tabs');
    tabs.onclick = (e) => {
      const b = e.target.closest('[data-mode]');
      if (!b) return;
      this.mode = b.dataset.mode;
      chat.querySelector('.composer').outerHTML = this.composerHtml(c);
      this.bindComposer(chat);
    };
    const tpl = chat.querySelector('#sendTemplate');
    if (tpl) tpl.onclick = () => this.templateModal();
    const send = async () => {
      const body = text.value.trim();
      if (!body) return;
      const btn = chat.querySelector('#sendBtn');
      btn.disabled = true;
      try {
        const path = this.mode === 'note' ? 'notes' : 'messages';
        await api(`/inbox/conversations/${c.id}/${path}`, { method: 'POST', body: { body } });
        text.value = '';
        await this.loadChat();
        this.loadList();
      } catch (err) {
        UI.err(err);
        if (err.data && err.data.requires_template) await this.loadChat();
      } finally {
        btn.disabled = false;
      }
    };
    chat.querySelector('#sendBtn').onclick = send;
    // Respostas rápidas: "/" + atalho
    const showReplies = () => {
      const m = /^\/(\S*)$/.exec(text.value);
      const list = m ? this.replies.filter((r) => r.shortcut.startsWith(m[1].toLowerCase())) : [];
      pop.hidden = !list.length;
      pop.innerHTML = list
        .slice(0, 8)
        .map(
          (r, i) =>
            `<button data-reply="${r.id}" class="${i === 0 ? 'active' : ''}"><strong>/${UI.esc(r.shortcut)}</strong> <span class="muted">${UI.esc(r.body.slice(0, 80))}</span></button>`,
        )
        .join('');
    };
    const useReply = (id) => {
      const r = this.replies.find((x) => x.id === id);
      if (!r) return;
      text.value = r.body.replace(/\{nome\}/gi, (c.contact_name || c.customer_name || '').split(' ')[0]);
      pop.hidden = true;
      text.focus();
    };
    pop.onclick = (e) => {
      const b = e.target.closest('[data-reply]');
      if (b) useReply(Number(b.dataset.reply));
    };
    text.oninput = showReplies;
    text.onkeydown = (e) => {
      if (!pop.hidden && (e.key === 'Enter' || e.key === 'Tab')) {
        e.preventDefault();
        const first = pop.querySelector('.active');
        if (first) useReply(Number(first.dataset.reply));
        return;
      }
      if (e.key === 'Escape') pop.hidden = true;
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    };
  },

  async templateModal() {
    const c = this.conv;
    let r;
    try {
      r = await api(`/inbox/conversations/${c.id}/templates`);
    } catch (err) {
      return UI.err(err);
    }
    if (!r.templates.length) {
      return UI.modal({
        title: 'Modelos de mensagem',
        size: 'narrow',
        body: `<p>${r.waba_configured ? 'Nenhum modelo aprovado encontrado na sua conta do WhatsApp Business.' : 'Informe o ID da conta do WhatsApp Business (WABA) em Configurações › WhatsApp para listar os modelos.'}</p><p class="small muted">Os modelos são criados e aprovados no Gerenciador do WhatsApp (Meta Business).</p>`,
        footer: '<button class="btn" data-close>Fechar</button>',
      });
    }
    const m = UI.modal({
      title: 'Enviar modelo aprovado',
      body: `<form id="tplForm">${UI.field(
        'tpl',
        'Modelo',
        UI.select(
          'tpl',
          r.templates.map((t, i) => [String(i), `${t.name} (${t.language})`]),
          '0',
        ),
      )}
        <div id="tplBody" class="help"></div><div id="tplParams"></div></form>`,
      footer:
        '<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="tplForm">Enviar</button>',
    });
    const form = m.el.querySelector('#tplForm');
    const firstName = (c.contact_name || c.customer_name || '').split(' ')[0];
    const draw = () => {
      const t = r.templates[Number(form.tpl.value)];
      m.el.querySelector('#tplBody').textContent = t.body;
      m.el.querySelector('#tplParams').innerHTML = Array.from({ length: t.params }, (_, i) =>
        UI.field(`p${i}`, `Variável {{${i + 1}}}`, UI.input(`p${i}`, i === 0 ? firstName : '', 'required'), {
          required: true,
        }),
      ).join('');
    };
    form.tpl.onchange = draw;
    draw();
    form.onsubmit = async (e) => {
      e.preventDefault();
      const t = r.templates[Number(form.tpl.value)];
      const params = Array.from({ length: t.params }, (_, i) => form[`p${i}`].value.trim());
      const preview = t.body.replace(/\{\{(\d+)\}\}/g, (_, n) => params[Number(n) - 1] || '');
      try {
        await api(`/inbox/conversations/${c.id}/template`, {
          method: 'POST',
          body: { name: t.name, language: t.language, params, preview },
        });
        m.close();
        UI.ok('Modelo enviado.');
        await this.loadChat();
        this.loadList();
      } catch (err) {
        UI.showErrors(form, err);
      }
    };
  },
};
