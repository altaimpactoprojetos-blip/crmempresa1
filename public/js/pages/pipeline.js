'use strict';
CRM.pages.pipeline = {
  async render(el, { id, query }) {
    this.el = el; this.query = query;
    el.innerHTML = CRM.pageHeader('Funil comercial', 'Arraste os cartões entre as etapas. A etapa comercial é independente do status do atendimento.',
      `<button class="btn secondary" id="btnExport">Exportar CSV</button><button class="btn" id="btnNew">+ Nova oportunidade</button>`) +
    `<form class="filters" id="filters"><div class="field grow"><label>Busca</label><input name="q" value="${UI.attr(query.q || '')}" placeholder="Título, cliente ou empresa"></div>
      ${CRM.isManager() ? `<div class="field"><label>Responsável</label>${UI.select('owner_id', UI.userOptions(CRM.users, { blank: 'Todos' }), query.owner_id)}</div>` : ''}
      <button class="btn secondary">Filtrar</button><a class="btn ghost" href="#/funil">Limpar</a></form><div id="board"></div>`;
    el.querySelector('#filters').onsubmit = (e) => { e.preventDefault(); const d = UI.formData(e.target); const qs = new URLSearchParams(); Object.entries(d).forEach(([k, v]) => { if (v) qs.set(k, v); }); location.hash = `#/funil?${qs}`; };
    el.querySelector('#btnNew').onclick = () => this.form({}, () => this.board());
    el.querySelector('#btnExport').onclick = () => UI.download('/opportunities/export.csv');
    await this.board();
    if (id) this.detail(id);
  },

  async board() {
    const box = this.el.querySelector('#board'); if (!box) return;
    const r = await api('/opportunities', { query: { q: this.query.q, owner_id: this.query.owner_id } });
    this.stages = r.stages;
    if (!r.opportunities.length && !this.query.q && !this.query.owner_id) {
      box.innerHTML = `<div class="card">${UI.empty('Nenhuma oportunidade no funil', 'Crie a primeira oportunidade a partir de um cliente ou pelo botão acima.')}</div>`; return;
    }
    box.innerHTML = `<div class="kanban">${r.stages.map((s) => { const items = r.opportunities.filter((o) => o.stage_id === s.id); const sum = items.reduce((a, o) => a + Number(o.value || 0), 0);
      return `<div class="kb-col" data-stage="${s.id}" data-kind="${s.kind}"><div class="kb-head"><span>${UI.esc(s.name)} <span class="badge">${items.length}</span></span><span class="sum">${UI.fmtMoney(sum)}</span></div>
        ${items.map((o) => `<div class="kb-card ${o.next_action_at && new Date(o.next_action_at) < Date.now() ? 'late' : ''}" draggable="true" data-id="${o.id}" data-version="${o.version}"><div class="title">${UI.esc(o.title)}</div><div class="small">${UI.esc(o.customer_name)}${o.customer_company ? ` · ${UI.esc(o.customer_company)}` : ''}</div>
          <div class="meta"><span class="value">${UI.fmtMoney(o.value)}</span><span>${UI.esc(o.owner_name || '—')}</span></div>${o.next_action ? `<div class="meta"><span>→ ${UI.esc(o.next_action)}</span><span>${o.next_action_at ? UI.fmtDate(o.next_action_at) : ''}</span></div>` : ''}${o.expected_close_date && s.kind === 'open' ? `<div class="meta"><span>Previsão: ${UI.fmtDate(o.expected_close_date)}</span></div>` : ''}${o.lost_reason ? `<div class="meta"><span class="badge danger">${UI.esc(o.lost_reason)}</span></div>` : ''}</div>`).join('') || '<div class="muted small center" style="padding:1rem">Vazio</div>'}</div>`; }).join('')}</div>
      <p class="muted small">Oportunidades ganhas ou perdidas há mais de 30 dias ficam ocultas do quadro, mas continuam nos relatórios e na exportação.</p>`;
    box.querySelectorAll('.kb-card').forEach((card) => {
      card.onclick = () => this.detail(Number(card.dataset.id));
      card.ondragstart = (e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ id: card.dataset.id, version: card.dataset.version })); };
    });
    box.querySelectorAll('.kb-col').forEach((col) => {
      col.ondragover = (e) => { e.preventDefault(); col.classList.add('over'); };
      col.ondragleave = () => col.classList.remove('over');
      col.ondrop = async (e) => { e.preventDefault(); col.classList.remove('over'); const d = JSON.parse(e.dataTransfer.getData('text/plain')); this.move(Number(d.id), Number(col.dataset.stage), col.dataset.kind, Number(d.version)); };
    });
  },

  async move(id, stageId, kind, version) {
    try {
      let lost_reason;
      if (kind === 'lost') { lost_reason = await UI.prompt('Qual foi o motivo da perda?', { title: 'Marcar como perdida', placeholder: 'ex.: Preço, prazo, concorrente...' }); if (lost_reason === null) return; }
      const r = await api(`/opportunities/${id}/move`, { method: 'POST', body: { stage_id: stageId, lost_reason, version } });
      UI.ok(r.message); this.board();
    } catch (err) { UI.err(err); this.board(); }
  },

  async form({ customer, ticket_id, opp } = {}, onSaved) {
    const isEdit = Boolean(opp);
    if (!this.stages) this.stages = (await api('/settings/stages')).stages;
    const m = UI.modal({ title: isEdit ? 'Editar oportunidade' : 'Nova oportunidade', body: `<form id="oppForm">
      ${UI.field('customer_id', 'Cliente', `<input id="custSearch" placeholder="Digite para buscar o cliente..." autocomplete="off" value="${UI.attr(customer ? customer.name : opp ? opp.customer_name : '')}" ${customer || isEdit ? 'readonly' : ''}><input type="hidden" name="customer_id" data-type="int" value="${customer ? customer.id : opp ? opp.customer_id : ''}"><div class="search-results" id="custResults" hidden style="position:relative"></div>`, { required: true })}
      ${UI.field('title', 'Título', UI.input('title', opp?.title, 'required placeholder="ex.: Plano anual — 10 licenças"'), { required: true })}
      <div class="form-row cols-3">${UI.field('value', 'Valor estimado (R$)', UI.input('value', opp ? Number(opp.value).toFixed(2).replace('.', ',') : '', 'data-type="money" placeholder="0,00"'))}
        ${UI.field('owner_id', 'Responsável', UI.select('owner_id', UI.userOptions(CRM.users, { filter: CRM.isManager() ? null : (u) => u.id === CRM.user.id }), opp ? opp.owner_id : CRM.user.id, 'data-type="int"'))}
        ${isEdit ? '' : UI.field('stage_id', 'Etapa inicial', UI.select('stage_id', this.stages.filter((s) => s.kind === 'open' && s.active).map((s) => [s.id, s.name]), '', 'data-type="int"'))}</div>
      <div class="form-row">${UI.field('next_action', 'Próxima ação', UI.input('next_action', opp?.next_action, 'data-type="nullable" placeholder="ex.: Enviar proposta revisada"'))}${UI.field('next_action_at', 'Quando', `<input type="datetime-local" name="next_action_at" value="${UI.toLocalInput(opp?.next_action_at)}">`)}</div>
      ${UI.field('expected_close_date', 'Previsão de fechamento', `<input type="date" name="expected_close_date" data-type="nullable" value="${UI.attr(opp?.expected_close_date ? String(opp.expected_close_date).slice(0, 10) : '')}">`)}
      ${ticket_id ? `<input type="hidden" name="ticket_id" value="${ticket_id}" data-type="int">` : ''}${isEdit ? `<input type="hidden" name="version" value="${opp.version}" data-type="int">` : ''}</form>`,
      footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="oppForm">${isEdit ? 'Salvar' : 'Criar oportunidade'}</button>` });
    const form = m.el.querySelector('#oppForm');
    if (!customer && !isEdit) CRM.pages.tickets.customerPicker(form.querySelector('#custSearch'), form.querySelector('#custResults'), form.customer_id, m);
    form.onsubmit = async (e) => {
      e.preventDefault(); const d = UI.formData(form); if (!d.customer_id) { UI.showErrors(form, new ApiError(400, { fields: { customer_id: 'Selecione um cliente.' } })); return; }
      if (isEdit) delete d.customer_id;
      try { const r = isEdit ? await api(`/opportunities/${opp.id}`, { method: 'PUT', body: d }) : await api('/opportunities', { method: 'POST', body: d }); UI.ok(r.message); m.close(); if (onSaved) onSaved(r.opportunity); } catch (err) { UI.showErrors(form, err); }
    };
  },

  async detail(id) {
    let r; try { r = await api(`/opportunities/${id}`); } catch (err) { return UI.err(err); }
    const o = r.opportunity; const openStages = (this.stages || []).filter((s) => s.active);
    const m = UI.modal({ title: o.title, size: 'wide', body: `<div class="grid cols-2">
      <div><table class="small"><tbody><tr><th>Cliente</th><td><a href="#/clientes/${o.customer_id}">${UI.esc(o.customer_name)}</a>${o.customer_company ? ` · ${UI.esc(o.customer_company)}` : ''}</td></tr>
        <tr><th>Etapa</th><td><span class="badge ${o.stage_kind === 'won' ? 'success' : o.stage_kind === 'lost' ? 'danger' : 'primary'}">${UI.esc(o.stage_name)}</span></td></tr>
        <tr><th>Valor</th><td>${UI.fmtMoney(o.value)}</td></tr><tr><th>Responsável</th><td>${UI.esc(o.owner_name || '—')}</td></tr>
        <tr><th>Próxima ação</th><td>${UI.esc(o.next_action || '—')} ${o.next_action_at ? `<span class="muted">(${UI.fmtDateTime(o.next_action_at)})</span>` : ''}</td></tr>
        <tr><th>Previsão</th><td>${UI.fmtDate(o.expected_close_date)}</td></tr>${o.lost_reason ? `<tr><th>Motivo da perda</th><td>${UI.esc(o.lost_reason)}</td></tr>` : ''}
        <tr><th>Criada em</th><td>${UI.fmtDateTime(o.created_at)}</td></tr>${o.closed_at ? `<tr><th>Encerrada em</th><td>${UI.fmtDateTime(o.closed_at)}</td></tr>` : ''}</tbody></table>
        <div class="flex wrap mt"><label class="small">Mover para:</label>${UI.select('stage', [['', '—'], ...openStages.filter((s) => s.id !== o.stage_id).map((s) => [s.id, s.name])], '', 'id="moveSel" style="width:auto"')}<button class="btn sm" id="moveBtn">Mover</button></div>
        <h4 class="mt">Tarefas</h4>${r.tasks.length ? r.tasks.map((t) => `<div class="small">${t.done_at ? '✅' : '⬜'} ${UI.esc(t.title)} <span class="muted">· ${UI.fmtDateTime(t.due_at)}</span></div>`).join('') : '<p class="muted small">Nenhuma tarefa.</p>'}<button class="btn sm secondary mt" id="taskBtn">+ Tarefa</button></div>
      <div><h4>Histórico</h4><ul class="timeline">${r.events.map((e) => `<li class="system"><span class="tl-dot"></span><div><div class="tl-meta">${UI.esc(e.user_name || '')} · ${UI.fmtDateTime(e.created_at)}</div><div class="tl-body">${UI.esc(e.body)}</div></div></li>`).join('')}</ul></div></div>`,
      footer: `${CRM.isManager() ? '<button class="btn danger" id="delBtn">Excluir</button>' : ''}<button class="btn secondary" data-close>Fechar</button><button class="btn" id="editBtn">Editar</button>`,
      onClose: () => { if (location.hash.startsWith('#/funil/')) history.replaceState(null, '', '#/funil'); } });
    m.el.querySelector('#editBtn').onclick = () => { m.close(); this.form({ opp: o }, () => { this.board(); this.detail(id); }); };
    m.el.querySelector('#moveBtn').onclick = () => { const sel = m.el.querySelector('#moveSel'); if (!sel.value) return; const st = openStages.find((s) => s.id === Number(sel.value)); m.close(); this.move(o.id, st.id, st.kind, o.version); };
    m.el.querySelector('#taskBtn').onclick = () => CRM.pages.tasks.form({ customer_id: o.customer_id, customer_name: o.customer_name, opportunity_id: o.id, assignee_id: o.owner_id }, () => { m.close(); this.detail(id); });
    const del = m.el.querySelector('#delBtn'); if (del) del.onclick = async () => { if (!(await UI.confirm('Excluir esta oportunidade? Esta ação não pode ser desfeita.', { danger: true, okLabel: 'Excluir' }))) return; try { const r2 = await api(`/opportunities/${o.id}`, { method: 'DELETE' }); UI.ok(r2.message); m.close(); this.board(); } catch (err) { UI.err(err); } };
  },
  onRealtime() { if (!document.querySelector('.modal-backdrop')) this.board(); },
};
