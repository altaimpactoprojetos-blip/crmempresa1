'use strict';
CRM.pages.customers = {
  async render(el, { id, query }) {
    this.el = el;
    if (id) return this.detail(el, id);
    this.query = query; this.page = Number(query.page) || 1;
    const settings = (await api('/settings/public')).settings; void settings;
    const full = await api('/settings').catch(() => null);
    this.sources = full ? full.settings.contact_sources : [];
    el.innerHTML = CRM.pageHeader('Clientes', 'Cadastro, histórico e responsável de cada cliente.',
      `<button class="btn secondary" id="btnExport">Exportar CSV</button>${CRM.isManager() ? '<button class="btn secondary" id="btnImport">Importar CSV</button>' : ''}<button class="btn" id="btnNew">+ Novo cliente</button>`) +
    `<div class="card"><form class="filters" id="filters">
      <div class="field grow"><label>Busca</label><input name="q" value="${UI.attr(query.q || '')}" placeholder="Nome, telefone, e-mail, empresa ou CPF/CNPJ"></div>
      <div class="field"><label>Origem</label>${UI.select('source', [['', 'Todas'], ...this.sources.map((s) => [s, s])], query.source)}</div>
      <div class="field"><label>Responsável</label>${UI.select('owner_id', UI.userOptions(CRM.users, { blank: 'Todos' }), query.owner_id)}</div>
      <div class="field"><label>Etiqueta</label><input name="tag" value="${UI.attr(query.tag || '')}" placeholder="ex.: vip"></div>
      <div class="field"><label class="check" style="margin-top:1.4rem"><input type="checkbox" name="pending_followup" ${query.pending_followup ? 'checked' : ''}> Com retorno pendente</label></div>
      <button class="btn secondary">Filtrar</button><a class="btn ghost" href="#/clientes">Limpar</a></form>
      <div id="list"></div></div>`;
    el.querySelector('#filters').onsubmit = (e) => { e.preventDefault(); const d = UI.formData(e.target); const qs = new URLSearchParams(); Object.entries(d).forEach(([k, v]) => { if (v && v !== false) qs.set(k, v === true ? 'true' : v); }); location.hash = `#/clientes?${qs}`; };
    el.querySelector('#btnNew').onclick = () => this.form();
    el.querySelector('#btnExport').onclick = () => UI.download('/customers/export.csv');
    const imp = el.querySelector('#btnImport'); if (imp) imp.onclick = () => this.importDialog();
    await this.list();
    if (query.novo) { history.replaceState(null, '', '#/clientes'); this.form(); }
  },

  async list() {
    const box = this.el.querySelector('#list'); if (!box) return;
    const q = { ...this.query, page: this.page, limit: 25 }; delete q.novo;
    const r = await api('/customers', { query: q });
    if (!r.customers.length) { box.innerHTML = UI.empty('Nenhum cliente encontrado', this.query.q ? 'Ajuste a busca ou os filtros.' : 'Cadastre o primeiro cliente pelo botão acima ou importe um CSV.'); return; }
    box.innerHTML = `<div class="table-wrap"><table><thead><tr><th>Nome</th><th>Contato</th><th>Empresa / Cidade</th><th>Origem</th><th>Etiquetas</th><th>Responsável</th><th>Atend. abertos</th><th>Retorno</th></tr></thead><tbody>
      ${r.customers.map((c) => `<tr class="clickable" data-href="#/clientes/${c.id}"><td><strong>${UI.esc(c.name)}</strong></td>
        <td class="small">${UI.esc(c.phone || '')}<br><span class="muted">${UI.esc(c.email || '')}</span></td><td class="small">${UI.esc(c.company || '')}<br><span class="muted">${UI.esc(c.city || '')}</span></td>
        <td class="small">${UI.esc(c.source || '—')}</td><td>${(c.tags || []).map((t) => `<span class="tag">${UI.esc(t)}</span>`).join('')}</td><td class="small">${UI.esc(c.owner_name || '—')}</td>
        <td class="center">${c.open_tickets ? `<span class="badge primary">${c.open_tickets}</span>` : '<span class="muted">0</span>'}</td>
        <td class="small">${c.next_follow_up ? `<span class="badge ${new Date(c.next_follow_up) < Date.now() ? 'danger' : 'warning'}">${UI.fmtDateTime(c.next_follow_up)}</span>` : ''}</td></tr>`).join('')}</tbody></table></div>
      ${pagination(r.total, r.page, r.limit)}`;
    box.querySelectorAll('[data-page]').forEach((b) => b.onclick = () => { this.page = Number(b.dataset.page); this.list(); });
    function pagination(total, page, limit) { const pages = Math.ceil(total / limit); if (pages <= 1) return `<div class="pagination muted">${total} registro(s)</div>`;
      return `<div class="pagination"><span class="muted">${total} registro(s) · página ${page} de ${pages}</span><button class="btn secondary sm" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>Anterior</button><button class="btn secondary sm" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>Próxima</button></div>`; }
  },

  // Formulário de criação/edição
  form(c = null, onSaved) {
    const isEdit = Boolean(c);
    const canOwner = CRM.isManager() || !isEdit || c.owner_id === CRM.user.id || !c.owner_id;
    const m = UI.modal({ title: isEdit ? 'Editar cliente' : 'Novo cliente', body: `<form id="custForm">
      <div id="dupBox"></div>
      <div class="form-row">${UI.field('name', 'Nome', UI.input('name', c?.name, 'required maxlength="160"'), { required: true })}${UI.field('company', 'Empresa', UI.input('company', c?.company, 'data-type="nullable"'))}</div>
      <div class="form-row">${UI.field('phone', 'Telefone', UI.input('phone', c?.phone, 'data-type="nullable" placeholder="(11) 99999-9999"'))}${UI.field('email', 'E-mail', UI.input('email', c?.email, 'type="email" data-type="nullable"'))}</div>
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
      form.querySelector('#dupBox').innerHTML = r.duplicates.length ? `<div class="alert warning">Possível duplicidade: ${r.duplicates.map((d) => `<a href="#/clientes/${d.id}">#${d.id} ${UI.esc(d.name)}</a>`).join(', ')}. Verifique antes de salvar.</div>` : '';
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
          form.querySelector('#dupBox').innerHTML = `<div class="alert warning">${UI.esc(err.message)} ${err.data.duplicates.map((x) => `<a href="#/clientes/${x.id}">#${x.id} ${UI.esc(x.name)}</a>`).join(', ')}.<br><button type="button" class="btn sm warning secondary mt" id="forceBtn">Salvar mesmo assim</button></div>`;
          form.querySelector('#forceBtn').onclick = () => { force = true; form.requestSubmit(); };
        } else if (err.status === 409) { UI.err(err); } else UI.showErrors(form, err);
      }
    };
  },

  async detail(el, id) {
    const r = await api(`/customers/${id}`);
    const c = r.customer; this.current = c;
    const phone = UI.digits(c.phone); const wa = phone ? UI.waLink(phone.length <= 11 ? '55' + phone : phone) : null;
    const pendingFollow = r.tickets.find((t) => t.follow_up_at && !['resolvido', 'cancelado'].includes(t.status));
    el.innerHTML = CRM.pageHeader(c.name, [c.company, c.city, c.source ? `Origem: ${c.source}` : ''].filter(Boolean).join(' · '),
      `${wa ? `<a class="btn wa" href="${wa}" target="_blank" rel="noopener" title="Abre o WhatsApp Web/desktop. Esta ação não sincroniza mensagens com o CRM.">Abrir WhatsApp</a>` : ''}
       <button class="btn secondary" id="btnTicket">Abrir atendimento</button><button class="btn secondary" id="btnOpp">Nova oportunidade</button><button class="btn secondary" id="btnTask">Nova tarefa</button><button class="btn" id="btnEdit">Editar</button>`) +
    `${r.duplicates.length ? `<div class="alert warning">Possível duplicidade com: ${r.duplicates.map((d) => `<a href="#/clientes/${d.id}">#${d.id} ${UI.esc(d.name)}</a>`).join(', ')}.</div>` : ''}
     ${pendingFollow ? `<div class="alert info">Retorno pendente em <strong>${UI.fmtDateTime(pendingFollow.follow_up_at)}</strong> — atendimento <a href="#/atendimentos/${pendingFollow.id}">${UI.esc(pendingFollow.protocol)}</a>.</div>` : ''}
     ${wa ? '<p class="muted small">O botão "Abrir WhatsApp" apenas abre a conversa no aplicativo; as mensagens trocadas lá não são gravadas no CRM. Registre as interações no atendimento.</p>' : ''}
    <div class="grid" style="grid-template-columns: 320px 1fr">
      <div class="stack"><div class="card"><h3>Dados</h3>
        <table class="small"><tbody>
          <tr><th>Telefone</th><td>${UI.esc(c.phone || '—')}</td></tr><tr><th>E-mail</th><td>${UI.esc(c.email || '—')}</td></tr>
          <tr><th>Empresa</th><td>${UI.esc(c.company || '—')}</td></tr><tr><th>Cidade</th><td>${UI.esc(c.city || '—')}</td></tr>
          <tr><th>CPF/CNPJ</th><td>${UI.esc(c.document || '—')}</td></tr><tr><th>Origem</th><td>${UI.esc(c.source || '—')}</td></tr>
          <tr><th>Responsável</th><td>${UI.esc(c.owner_name || '—')}</td></tr><tr><th>Etiquetas</th><td>${(c.tags || []).map((t) => `<span class="tag">${UI.esc(t)}</span>`).join('') || '—'}</td></tr>
          <tr><th>Cadastro</th><td>${UI.fmtDateTime(c.created_at)}</td></tr></tbody></table>
        ${c.notes ? `<h4 class="mt">Observações</h4><p class="small" style="white-space:pre-wrap">${UI.esc(c.notes)}</p>` : ''}</div>
        <div class="card"><h3>Anotações internas</h3><form id="noteForm"><textarea name="body" placeholder="Escreva uma anotação visível apenas para a equipe" required></textarea><div class="right mt"><button class="btn sm">Adicionar</button></div></form>
          <ul class="timeline mt">${r.notes.map((n) => `<li class="note"><span class="tl-dot"></span><div><div class="tl-meta">${UI.esc(n.user_name || '')} · ${UI.fmtDateTime(n.created_at)}</div><div class="tl-body">${UI.esc(n.body)}</div></div></li>`).join('') || '<li class="muted small">Nenhuma anotação.</li>'}</ul></div>
        ${r.whatsapp_messages.length ? `<div class="card"><h3>WhatsApp (API oficial)</h3><ul class="timeline">${r.whatsapp_messages.map((w) => `<li class="interaction"><span class="tl-dot"></span><div><div class="tl-meta">${w.direction === 'saida' ? 'Enviada' : 'Recebida'} · ${UI.fmtDateTime(w.created_at)} · ${UI.esc(w.status)}</div><div class="tl-body">${UI.esc(w.body || '')}</div></div></li>`).join('')}</ul></div>` : ''}
      </div>
      <div class="stack">
        <div class="card"><div class="card-title"><h3>Atendimentos (${r.tickets.length})</h3></div>
          ${r.tickets.length ? `<div class="table-wrap"><table><thead><tr><th>Protocolo</th><th>Assunto</th><th>Canal</th><th>Status</th><th>Responsável</th><th>Abertura</th></tr></thead><tbody>${r.tickets.map((t) => `<tr class="clickable" data-href="#/atendimentos/${t.id}"><td class="mono small">${UI.esc(t.protocol)}</td><td>${UI.esc(t.subject)}</td><td class="small">${UI.esc(t.channel)}</td><td>${UI.statusBadge(t.status)}</td><td class="small">${UI.esc(t.assignee_name || '—')}</td><td class="small nowrap">${UI.fmtDateTime(t.opened_at)}</td></tr>`).join('')}</tbody></table></div>` : UI.empty('Nenhum atendimento', 'Abra o primeiro atendimento para este cliente.')}</div>
        <div class="card"><div class="card-title"><h3>Negociações (${r.opportunities.length})</h3></div>
          ${r.opportunities.length ? `<div class="table-wrap"><table><thead><tr><th>Título</th><th>Etapa</th><th>Valor</th><th>Responsável</th><th>Previsão</th></tr></thead><tbody>${r.opportunities.map((o) => `<tr class="clickable" data-href="#/funil/${o.id}"><td>${UI.esc(o.title)}</td><td><span class="badge ${o.stage_kind === 'won' ? 'success' : o.stage_kind === 'lost' ? 'danger' : 'primary'}">${UI.esc(o.stage_name)}</span></td><td>${UI.fmtMoney(o.value)}</td><td class="small">${UI.esc(o.owner_name || '—')}</td><td class="small">${UI.fmtDate(o.expected_close_date)}</td></tr>`).join('')}</tbody></table></div>` : UI.empty('Nenhuma negociação', 'Crie uma oportunidade quando houver interesse comercial.')}</div>
        <div class="card"><div class="card-title"><h3>Tarefas (${r.tasks.length})</h3></div>
          ${r.tasks.length ? `<table><tbody>${r.tasks.map((t) => `<tr><td>${t.done_at ? '✅ ' : ''}${UI.esc(t.title)}</td><td class="small">${UI.esc(t.assignee_name || '')}</td><td class="small nowrap ${!t.done_at && t.due_at && new Date(t.due_at) < Date.now() ? 'badge danger' : ''}">${UI.fmtDateTime(t.due_at)}</td><td>${UI.priorityBadge(t.priority)}</td></tr>`).join('')}</tbody></table>` : UI.empty('Nenhuma tarefa', '')}</div>
      </div></div>`;
    el.querySelector('#btnEdit').onclick = () => this.form(c);
    el.querySelector('#btnTicket').onclick = () => CRM.pages.tickets.form({ customer: c }, () => this.detail(el, id));
    el.querySelector('#btnOpp').onclick = () => CRM.pages.pipeline.form({ customer: c }, () => this.detail(el, id));
    el.querySelector('#btnTask').onclick = () => CRM.pages.tasks.form({ customer_id: c.id, customer_name: c.name }, () => this.detail(el, id));
    el.querySelector('#noteForm').onsubmit = async (e) => { e.preventDefault(); try { const r2 = await api(`/customers/${id}/notes`, { method: 'POST', body: UI.formData(e.target) }); UI.ok(r2.message); this.detail(el, id); } catch (err) { UI.showErrors(e.target, err); } };
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
      prev.innerHTML = '<p class="muted">Validando...</p>';
      try {
        const r = await api('/customers/import', { method: 'POST', body: { csv: csvText } });
        prev.innerHTML = `<div class="alert ${r.invalid ? 'warning' : 'success'}">${r.total} linha(s): <strong>${r.valid}</strong> válida(s), <strong>${r.invalid}</strong> com erro, <strong>${r.duplicates}</strong> possível(is) duplicidade(s).</div>
          <label class="check"><input type="checkbox" id="skipDup" checked> Ignorar linhas com possível duplicidade</label>
          <div class="table-wrap mt" style="max-height:340px;overflow:auto"><table><thead><tr><th>Linha</th><th>Nome</th><th>Telefone</th><th>E-mail</th><th>Situação</th></tr></thead><tbody>
          ${r.rows.map((x) => `<tr><td>${x.line}</td><td>${UI.esc(x.data.name || '')}</td><td>${UI.esc(x.data.phone || '')}</td><td>${UI.esc(x.data.email || '')}</td><td class="small">${x.errors.length ? `<span class="badge danger">Erro</span> ${UI.esc(x.errors.join(' '))}` : x.warnings.length ? `<span class="badge warning">Aviso</span> ${UI.esc(x.warnings.join(' '))}` : '<span class="badge success">OK</span>'}</td></tr>`).join('')}</tbody></table></div>`;
        commit.disabled = r.valid === 0;
      } catch (err) { prev.innerHTML = `<div class="alert danger">${UI.esc(err.message)}</div>`; commit.disabled = true; }
    };
    commit.onclick = async () => {
      commit.disabled = true;
      try {
        const r = await api('/customers/import', { method: 'POST', body: { csv: csvText, commit: true, skip_duplicates: m.el.querySelector('#skipDup').checked } });
        prev.innerHTML = `<div class="alert success">${UI.esc(r.message)} ${r.skipped ? `${r.skipped} ignorada(s) por duplicidade.` : ''} ${r.invalid ? `${r.invalid} com erro não importada(s).` : ''}</div>
          ${r.errors.length ? `<h4>Relatório de erros</h4><table><tbody>${r.errors.map((e) => `<tr><td>Linha ${e.line}</td><td>${UI.esc(e.errors.join(' '))}</td></tr>`).join('')}</tbody></table>` : ''}`;
        this.list();
      } catch (err) { UI.err(err); commit.disabled = false; }
    };
  },
};
