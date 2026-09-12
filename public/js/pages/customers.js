'use strict';
CRM.pages.customers = {
  async render(el, { id, query }) {
    this.el = el;
    if (id) return this.detail(el, id);
    this.query = query; this.page = Number(query.page) || 1;
    const full = await CRM.settingsFull();
    this.sources = full ? full.settings.contact_sources : [];
    el.innerHTML = CRM.pageHeader('Clientes', 'Cadastro, histórico e responsável de cada cliente.',
      `<button class="btn secondary" id="btnExport">${UI.icons.download} <span class="lbl">Exportar</span></button>${CRM.isManager() ? `<button class="btn secondary" id="btnImport">${UI.icons.upload} <span class="lbl">Importar CSV</span></button>` : ''}<button class="btn" id="btnNew">${UI.icons.plus} <span class="lbl">Novo cliente</span></button>`) +
    `<div class="card"><div id="savedBox" class="mb-s"></div><form class="filters" id="filters">
      <div class="field grow"><label>Busca</label><input name="q" value="${UI.attr(query.q || '')}" placeholder="Nome, telefone, e-mail, empresa ou CPF/CNPJ"></div>
      <div class="field"><label>Origem</label>${UI.select('source', [['', 'Todas'], ...this.sources.map((s) => [s, s])], query.source)}</div>
      <div class="field"><label>Responsável</label>${UI.select('owner_id', UI.userOptions(CRM.users, { blank: 'Todos' }), query.owner_id)}</div>
      <div class="field"><label>Etiqueta</label><input name="tag" value="${UI.attr(query.tag || '')}" placeholder="ex.: vip"></div>
      <div class="field"><label>Situação</label>${UI.select('flag', [['', 'Todas'], ['pending_followup', 'Com retorno pendente'], ['no_open_ticket', 'Sem atendimento aberto']], query.pending_followup ? 'pending_followup' : query.no_open_ticket ? 'no_open_ticket' : '')}</div>
      <button class="btn secondary">Filtrar</button><a class="btn ghost" href="#/clientes">Limpar</a></form>
      <div id="list"></div></div>`;
    el.querySelector('#filters').onsubmit = (e) => { e.preventDefault(); const d = UI.formData(e.target); const flag = d.flag; delete d.flag; if (flag) d[flag] = 'true'; location.hash = `#/clientes?${UI.qs(d)}`; };
    el.querySelector('#btnNew').onclick = () => this.form();
    el.querySelector('#btnExport').onclick = () => UI.download('/customers/export.csv');
    const imp = el.querySelector('#btnImport'); if (imp) imp.onclick = () => this.importDialog();
    UI.savedFilters(el.querySelector('#savedBox'), { scope: 'customers', current: () => this.query, onApply: (p) => { location.hash = `#/clientes?${UI.qs(p)}`; } });
    await this.list();
    if (query.novo) { history.replaceState(null, '', '#/clientes'); this.form(); }
  },

  async list() {
    const box = this.el.querySelector('#list'); if (!box) return;
    const q = { ...this.query, page: this.page, limit: 25 }; delete q.novo;
    const r = await api('/customers', { query: q });
    UI.table(box, { id: 'customers', rows: r.customers, total: r.total, page: r.page, limit: r.limit, sort: this.query.sort, dir: this.query.dir,
      columns: [
        { key: 'name', label: 'Nome', sortable: true, min: '180px', render: (c) => `<span class="trunc strong" title="${UI.attr(c.name)}">${UI.esc(c.name)}</span>${c.email ? `<span class="trunc muted small" title="${UI.attr(c.email)}">${UI.esc(c.email)}</span>` : ''}` },
        { key: 'phone', label: 'Telefone', nowrap: true, render: (c) => UI.esc(UI.fmtPhone(c.phone)) },
        { key: 'company', label: 'Empresa', sortable: true, min: '140px', render: (c) => `<span class="trunc" title="${UI.attr(c.company || '')}">${UI.esc(c.company || '—')}</span>` },
        { key: 'city', label: 'Cidade', sortable: true, nowrap: true, default: false, render: (c) => UI.esc(c.city || '—') },
        { key: 'source', label: 'Origem', sortable: true, nowrap: true, render: (c) => UI.esc(c.source || '—') },
        { key: 'tags', label: 'Etiquetas', render: (c) => UI.tags(c.tags) },
        { key: 'owner_name', label: 'Responsável', sortable: true, nowrap: true, render: (c) => UI.esc(c.owner_name || '—') },
        { key: 'open_tickets', label: 'Atend. abertos', sortable: true, align: 'right', render: (c) => c.open_tickets ? `<span class="badge primary">${c.open_tickets}</span>` : '<span class="muted">0</span>' },
        { key: 'open_opportunities', label: 'Negociações', align: 'right', default: false, render: (c) => c.open_opportunities || '<span class="muted">0</span>' },
        { key: 'last_contact_at', label: 'Último contato', nowrap: true, render: (c) => c.last_contact_at ? UI.fmtDateTime(c.last_contact_at) : '<span class="muted">—</span>' },
        { key: 'next_follow_up', label: 'Retorno', sortable: true, nowrap: true, render: (c) => c.next_follow_up ? `<span class="${new Date(c.next_follow_up) < Date.now() ? 'text-danger strong' : ''}">${UI.fmtDateTime(c.next_follow_up)}${new Date(c.next_follow_up) < Date.now() ? ' · vencido' : ''}</span>` : '' },
        { key: 'created_at', label: 'Cadastro', sortable: true, nowrap: true, default: false, render: (c) => UI.fmtDate(c.created_at) },
      ],
      onSort: (sort, dir) => { this.query.sort = sort; this.query.dir = dir; this.list(); }, onPage: (p) => { this.page = p; this.list(); },
      onRow: (c) => { location.hash = `#/clientes/${c.id}`; },
      empty: UI.empty('Nenhum cliente encontrado', this.query.q ? 'Ajuste a busca ou os filtros.' : 'Cadastre o primeiro cliente pelo botão acima ou importe um CSV.') });
  },

  form(c = null, onSaved) {
    const isEdit = Boolean(c);
    const canOwner = CRM.isManager() || !isEdit || c.owner_id === CRM.user.id || !c.owner_id;
    const m = UI.modal({ title: isEdit ? 'Editar cliente' : 'Novo cliente', body: `<form id="custForm">
      <div id="dupBox"></div>
      <div class="form-row">${UI.field('name', 'Nome', UI.input('name', c?.name, 'required maxlength="160"'), { required: true })}${UI.field('company', 'Empresa', UI.input('company', c?.company, 'data-type="nullable"'))}</div>
      <div class="form-row">${UI.field('phone', 'Telefone', UI.input('phone', c?.phone, 'data-type="nullable" placeholder="(11) 99999-9999" inputmode="tel"'))}${UI.field('email', 'E-mail', UI.input('email', c?.email, 'type="email" data-type="nullable"'))}</div>
      <div class="form-row cols-3">${UI.field('city', 'Cidade', UI.input('city', c?.city, 'data-type="nullable"'))}${UI.field('document', 'CPF ou CNPJ', UI.input('document', c?.document, 'data-type="nullable"'), { hint: 'Opcional' })}
        ${UI.field('source', 'Origem do contato', UI.select('source', [['', '— Selecione —'], ...(this.sources || []).map((s) => [s, s])], c?.source, 'data-type="nullable"'))}</div>
      <div class="form-row">${UI.field('tags', 'Etiquetas', UI.input('tags', (c?.tags || []).join(', '), 'data-type="tags" placeholder="vip, revenda"'), { hint: 'Separe por vírgula' })}
        ${UI.field('owner_id', 'Responsável', UI.select('owner_id', UI.userOptions(CRM.users, { filter: CRM.isManager() ? null : (u) => u.id === CRM.user.id }), c ? c.owner_id : (CRM.user.role === 'atendente' ? CRM.user.id : ''), `data-type="int" ${canOwner ? '' : 'disabled'}`))}</div>
      ${UI.field('notes', 'Observações', UI.textarea('notes', c?.notes, 'data-type="nullable"'))}
      ${isEdit ? `<input type="hidden" name="version" value="${c.version}" data-type="int">` : ''}</form>`,
      footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="custForm">${isEdit ? 'Salvar alterações' : 'Cadastrar'}</button>` });
    const form = m.el.querySelector('#custForm');
    const checkDup = UI.debounce(async () => {
      const phone = form.phone.value, email = form.email.value; if (!phone && !email) { form.querySelector('#dupBox').innerHTML = ''; return; }
      const r = await api('/customers/check-duplicates', { query: { phone, email, exclude_id: c?.id } }).catch(() => ({ duplicates: [] }));
      form.querySelector('#dupBox').innerHTML = r.duplicates.length ? `<div class="alert warning"><span>Possível duplicidade: ${r.duplicates.map((d) => `<a href="#/clientes/${d.id}">#${d.id} ${UI.esc(d.name)}</a>`).join(', ')}. Verifique antes de salvar.</span></div>` : '';
    }, 400);
    form.phone.oninput = checkDup; form.email.oninput = checkDup;
    let force = false;
    form.onsubmit = async (e) => {
      e.preventDefault(); const d = UI.formData(form);
      try {
        const r = isEdit ? await api(`/customers/${c.id}${force ? '?force=1' : ''}`, { method: 'PUT', body: d }) : await api(`/customers${force ? '?force=1' : ''}`, { method: 'POST', body: d });
        UI.ok(r.message); m.close(); if (onSaved) onSaved(r.customer); else location.hash = `#/clientes/${r.customer.id}`;
        if (isEdit && location.hash === `#/clientes/${c.id}`) this.detail(this.el, c.id);
      } catch (err) {
        if (err.status === 409 && err.data.can_force) {
          form.querySelector('#dupBox').innerHTML = `<div class="alert warning"><span>${UI.esc(err.message)} ${err.data.duplicates.map((x) => `<a href="#/clientes/${x.id}">#${x.id} ${UI.esc(x.name)}</a>`).join(', ')}.<br><button type="button" class="btn sm secondary mt-s" id="forceBtn">Salvar mesmo assim</button></span></div>`;
          form.querySelector('#forceBtn').onclick = () => { force = true; form.requestSubmit(); };
        } else if (err.status === 409) { UI.err(err); } else UI.showErrors(form, err);
      }
    };
  },

  async detail(el, id) {
    const r = await api(`/customers/${id}`);
    const c = r.customer; this.current = c;
    const wa = c.phone_digits ? UI.waLink(c.phone_digits) : null;
    const openT = r.tickets.find((t) => !['resolvido', 'cancelado'].includes(t.status));
    const pendingFollow = r.tickets.find((t) => t.follow_up_at && !['resolvido', 'cancelado'].includes(t.status));
    const openOpps = r.opportunities.filter((o) => o.stage_kind === 'open');
    el.innerHTML = `<div class="page-header"><div class="flex"><a href="#/clientes" class="icon-btn" aria-label="Voltar">${UI.icons.arrowLeft}</a>${UI.avatar(c.name)}<div><h1 style="margin:0">${UI.esc(c.name)}</h1><p>${[c.company, c.city, c.source ? `Origem: ${c.source}` : '', c.owner_name ? `Responsável: ${c.owner_name}` : ''].filter(Boolean).map(UI.esc).join(' · ')}</p></div></div>
      <div class="flex wrap">${openT ? `<a class="btn secondary" href="#/atendimentos/${openT.id}">${UI.icons.inbox} <span class="lbl">Abrir conversa</span></a>` : `<button class="btn secondary" id="btnTicket">${UI.icons.inbox} <span class="lbl">Abrir atendimento</span></button>`}<button class="btn secondary" id="btnOpp">${UI.icons.pipeline} <span class="lbl">Nova oportunidade</span></button><button class="btn" id="btnEdit">${UI.icons.edit} <span class="lbl">Editar</span></button>
      <div class="menu-wrap"><button class="icon-btn" id="moreBtn" aria-label="Mais ações">${UI.icons.more}</button></div></div></div>
    ${r.duplicates.length ? `<div class="alert warning"><span>Possível duplicidade com: ${r.duplicates.map((d) => `<a href="#/clientes/${d.id}">#${d.id} ${UI.esc(d.name)}</a>`).join(', ')}.</span></div>` : ''}
    ${pendingFollow ? `<div class="alert ${new Date(pendingFollow.follow_up_at) < Date.now() ? 'warning' : 'info'}"><span>Retorno ${new Date(pendingFollow.follow_up_at) < Date.now() ? 'vencido' : 'agendado'} em <strong>${UI.fmtDateTime(pendingFollow.follow_up_at)}</strong> — atendimento <a href="#/atendimentos/${pendingFollow.id}">${UI.esc(pendingFollow.protocol)}</a>.</span></div>` : ''}
    <div class="grid" style="grid-template-columns: 320px 1fr" id="custGrid">
      <div class="stack"><div class="card"><h3>Dados</h3>
        <dl class="def-list"><dt>Telefone</dt><dd>${UI.esc(UI.fmtPhone(c.phone) || '—')}</dd><dt>E-mail</dt><dd>${UI.esc(c.email || '—')}</dd>
          <dt>Empresa</dt><dd>${UI.esc(c.company || '—')}</dd><dt>Cidade</dt><dd>${UI.esc(c.city || '—')}</dd>
          <dt>CPF/CNPJ</dt><dd>${UI.esc(c.document || '—')}</dd><dt>Origem</dt><dd>${UI.esc(c.source || '—')}</dd>
          <dt>Responsável</dt><dd>${UI.esc(c.owner_name || '—')}</dd><dt>Etiquetas</dt><dd>${UI.tags(c.tags) || '—'}</dd>
          <dt>Cadastro</dt><dd>${UI.fmtDate(c.created_at)}</dd></dl>
        ${c.notes ? `<h4 class="mt">Observações</h4><p class="small" style="white-space:pre-wrap">${UI.esc(c.notes)}</p>` : ''}
        ${wa ? `<p class="muted xs mt-s">${UI.icons.external} <a href="${wa}" target="_blank" rel="noopener">Abrir no WhatsApp</a> é um atalho externo; as mensagens são sincronizadas apenas quando a integração oficial está conectada.</p>` : ''}</div>
        <div class="card"><h3>Anotações internas</h3><form id="noteForm"><textarea name="body" placeholder="Anotação visível apenas para a equipe" required rows="2"></textarea><div class="right mt-s"><button class="btn sm">Adicionar</button></div></form>
          <ul class="timeline mt-s">${r.notes.map((n) => `<li class="note"><span class="tl-dot"></span><div><div class="tl-meta">${UI.esc(n.user_name || '')} · ${UI.fmtDateTime(n.created_at)}</div><div class="tl-body">${UI.esc(n.body)}</div></div></li>`).join('') || '<li class="muted small">Nenhuma anotação.</li>'}</ul></div>
      </div>
      <div class="stack">
        <div class="card"><div class="card-title"><h3>Negociações ${openOpps.length ? `<span class="badge primary">${openOpps.length} aberta(s)</span>` : ''}</h3></div>
          ${r.opportunities.length ? `<div class="table-wrap"><table><thead><tr><th>Oportunidade</th><th>Funil / etapa</th><th class="num">Valor</th><th>Responsável</th><th>Próxima ação</th><th>Previsão</th></tr></thead><tbody>${r.opportunities.map((o) => `<tr class="clickable" data-opp="${o.id}"><td><span class="trunc" style="max-width:220px" title="${UI.attr(o.title)}">${UI.esc(o.title)}</span></td><td class="nowrap">${UI.stageBadge(o.stage_name, o.stage_kind)}<span class="muted xs"> ${UI.esc(o.pipeline_name)}</span></td><td class="num nowrap">${UI.fmtMoney(o.value)}</td><td class="nowrap">${UI.esc(o.owner_name || '—')}</td><td>${o.stage_kind === 'open' ? (o.next_action ? `${UI.esc(o.next_action)}${o.next_action_at ? `<span class="muted small"> · ${UI.fmtDate(o.next_action_at)}</span>` : ''}` : '<span class="text-warning small">sem próxima ação</span>') : (o.lost_reason ? `<span class="muted small">${UI.esc(o.lost_reason)}</span>` : '')}</td><td class="nowrap">${UI.fmtDate(o.expected_close_date)}</td></tr>`).join('')}</tbody></table></div>` : UI.empty('Nenhuma negociação', 'Crie uma oportunidade quando houver interesse comercial.')}</div>
        <div class="card"><div class="card-title"><h3>Atendimentos (${r.tickets.length})</h3></div>
          ${r.tickets.length ? `<div class="table-wrap"><table><thead><tr><th>Protocolo</th><th>Assunto</th><th>Canal</th><th>Status</th><th>Responsável</th><th>Última msg.</th></tr></thead><tbody>${r.tickets.map((t) => `<tr class="clickable" data-href="#/atendimentos/${t.id}"><td class="mono nowrap">${UI.esc(t.protocol)}</td><td><span class="trunc" style="max-width:260px" title="${UI.attr(t.subject)}">${UI.esc(t.subject)}</span></td><td class="nowrap">${UI.channelIcon(t.channel)} ${UI.esc(t.channel)}</td><td>${UI.statusBadge(t.status, true)}</td><td class="nowrap">${UI.esc(t.assignee_name || '—')}</td><td class="nowrap small">${UI.fmtDateTime(t.last_message_at || t.opened_at)}</td></tr>`).join('')}</tbody></table></div>` : UI.empty('Nenhum atendimento', 'Abra o primeiro atendimento para este cliente.')}</div>
        <div class="card"><div class="card-title"><h3>Tarefas (${r.tasks.filter((t) => !t.done_at).length} abertas)</h3><button class="btn link small" id="btnTask">+ Nova tarefa</button></div>
          ${r.tasks.length ? r.tasks.map((t) => `<div class="task-row ${t.done_at ? 'done' : ''}"><input type="checkbox" data-task="${t.id}" ${t.done_at ? 'checked' : ''} aria-label="Concluir"><div><div class="t">${UI.esc(t.title)}</div><div class="s ${!t.done_at && t.due_at && new Date(t.due_at) < Date.now() ? 'text-danger' : ''}">${UI.fmtDateTime(t.due_at)}${t.assignee_name ? ` · ${UI.esc(t.assignee_name)}` : ''}${!t.done_at && t.due_at && new Date(t.due_at) < Date.now() ? ' · atrasada' : ''}</div></div>${UI.priorityBadge(t.priority)}</div>`).join('') : UI.empty('Nenhuma tarefa', '')}</div>
        <div class="card"><div class="card-title"><h3>Histórico de interações</h3></div>
          ${r.timeline && r.timeline.length ? `<ul class="timeline">${r.timeline.map((e) => `<li class="${e.kind}"><span class="tl-dot"></span><div><div class="tl-meta">${e.kind === 'note' ? 'Nota interna' : e.direction === 'saida' ? 'Enviada' : 'Recebida'} · ${UI.esc(e.channel || '')} · ${UI.esc(e.user_name || 'Cliente')} · ${UI.fmtDateTime(e.created_at)} · <a href="#/atendimentos/${e.ticket_id}" class="mono">${UI.esc(e.protocol)}</a></div><div class="tl-body">${UI.esc(e.body || '')}</div></div></li>`).join('')}</ul>` : UI.empty('Sem interações registradas', '')}</div>
      </div></div>`;
    el.querySelector('#btnEdit').onclick = () => this.form(c);
    const bt = el.querySelector('#btnTicket'); if (bt) bt.onclick = () => CRM.pages.tickets.form({ customer: c }, (t) => { location.hash = `#/atendimentos/${t.id}`; });
    el.querySelector('#btnOpp').onclick = () => CRM.pages.pipeline.form({ customer: c }, () => this.detail(el, id));
    el.querySelector('#btnTask').onclick = () => CRM.pages.tasks.form({ customer_id: c.id, customer_name: c.name }, () => this.detail(el, id));
    el.querySelector('#moreBtn').onclick = (e) => UI.menu(e.currentTarget, [
      { label: 'Nova tarefa', icon: 'tasks', onClick: () => CRM.pages.tasks.form({ customer_id: c.id, customer_name: c.name }, () => this.detail(el, id)) },
      ...(wa ? [{ label: 'Abrir no WhatsApp (externo)', icon: 'external', onClick: () => window.open(wa, '_blank', 'noopener') }] : []),
      ...(CRM.isAdmin() ? [{ sep: true }, { label: 'Excluir cliente', icon: 'trash', danger: true, onClick: async () => { if (!(await UI.confirm('Excluir este cliente? Só é possível sem atendimentos ou negociações.', { danger: true, okLabel: 'Excluir' }))) return; try { const r2 = await api(`/customers/${c.id}`, { method: 'DELETE' }); UI.ok(r2.message); location.hash = '#/clientes'; } catch (err) { UI.err(err); } } }] : []),
    ]);
    el.querySelector('#noteForm').onsubmit = async (e) => { e.preventDefault(); try { const r2 = await api(`/customers/${id}/notes`, { method: 'POST', body: UI.formData(e.target) }); UI.ok(r2.message); this.detail(el, id); } catch (err) { UI.showErrors(e.target, err); } };
    el.querySelectorAll('[data-opp]').forEach((tr) => tr.onclick = () => CRM.pages.pipeline.detail(Number(tr.dataset.opp), { onChange: () => this.detail(el, id) }));
    el.querySelectorAll('[data-task]').forEach((cb) => cb.onchange = async () => { try { await api(`/tasks/${cb.dataset.task}`, { method: 'PUT', body: { done: cb.checked } }); this.detail(el, id); } catch (err) { UI.err(err); } });
    if (window.innerWidth < 800) el.querySelector('#custGrid').style.gridTemplateColumns = '1fr';
  },

  importDialog() {
    const m = UI.modal({ title: 'Importar clientes (CSV)', size: 'wide', body: `<div class="help">Colunas aceitas (cabeçalho na primeira linha): <strong>nome</strong> (obrigatório), telefone, email, empresa, cidade, cpf_cnpj, origem, etiquetas (separadas por | ou ,), observacoes, responsavel (nome ou e-mail do usuário). Separador ; ou , — codificação UTF-8.</div>
      <div class="field"><label>Arquivo CSV</label><input type="file" id="csvFile" accept=".csv,text/csv"></div><div id="preview"></div>`,
      footer: `<button class="btn secondary" data-close>Fechar</button><button class="btn" id="btnCommit" disabled>Importar linhas válidas</button>` });
    let csvText = null;
    const file = m.el.querySelector('#csvFile'), prev = m.el.querySelector('#preview'), commit = m.el.querySelector('#btnCommit');
    file.onchange = async () => {
      const f = file.files[0]; if (!f) return;
      csvText = await f.text();
      prev.innerHTML = '<p class="muted">Validando…</p>';
      try {
        const r = await api('/customers/import', { method: 'POST', body: { csv: csvText } });
        prev.innerHTML = `<div class="alert ${r.invalid ? 'warning' : 'success'}"><span>${r.total} linha(s): <strong>${r.valid}</strong> válida(s), <strong>${r.invalid}</strong> com erro, <strong>${r.duplicates}</strong> possível(is) duplicidade(s).</span></div>
          <label class="check"><input type="checkbox" id="skipDup" checked> Ignorar linhas com possível duplicidade</label>
          <div class="table-wrap mt-s" style="max-height:340px"><table><thead><tr><th>Linha</th><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Situação</th></tr></thead><tbody>
          ${r.rows.map((x) => `<tr><td>${x.line}</td><td>${UI.esc(x.data.name || '')}</td><td>${UI.esc(x.data.phone || '')}</td><td>${UI.esc(x.data.email || '')}</td><td class="small">${x.errors.length ? `<span class="badge danger">Erro</span> ${UI.esc(x.errors.join(' '))}` : x.warnings.length ? `<span class="badge warning">Aviso</span> ${UI.esc(x.warnings.join(' '))}` : '<span class="badge success">OK</span>'}</td></tr>`).join('')}</tbody></table></div>`;
        commit.disabled = r.valid === 0;
      } catch (err) { prev.innerHTML = `<div class="alert danger">${UI.esc(err.message)}</div>`; commit.disabled = true; }
    };
    commit.onclick = async () => {
      commit.disabled = true;
      try {
        const r = await api('/customers/import', { method: 'POST', body: { csv: csvText, commit: true, skip_duplicates: m.el.querySelector('#skipDup').checked } });
        prev.innerHTML = `<div class="alert success"><span>${UI.esc(r.message)} ${r.skipped ? `${r.skipped} ignorada(s) por duplicidade.` : ''} ${r.invalid ? `${r.invalid} com erro não importada(s).` : ''}</span></div>
          ${r.errors.length ? `<h4>Relatório de erros</h4><table><tbody>${r.errors.map((e) => `<tr><td>Linha ${e.line}</td><td>${UI.esc(e.errors.join(' '))}</td></tr>`).join('')}</tbody></table>` : ''}`;
        this.list();
      } catch (err) { UI.err(err); commit.disabled = false; }
    };
  },
};
