'use strict';
// Funil comercial: quadro Kanban ou lista, múltiplos funis, filtros salvos e painel lateral da oportunidade.
CRM.pages.pipeline = {
  async render(el, { id, query }) {
    this.el = el; this.query = query; this.mode = query.modo || UI.store.get('pipeline.mode', 'board');
    const s = await CRM.settingsFull();
    this.pipelines = (s ? s.pipelines : []).filter((p) => p.active);
    this.allStages = s ? s.stages : [];
    this.sources = s ? s.settings.contact_sources : [];
    this.pipelineId = Number(query.pipeline_id) || UI.store.get('pipeline.id', null) || (this.pipelines.find((p) => p.is_default) || this.pipelines[0] || {}).id;
    if (!this.pipelines.some((p) => p.id === this.pipelineId)) this.pipelineId = (this.pipelines[0] || {}).id;
    UI.store.set('pipeline.id', this.pipelineId);
    el.innerHTML = CRM.pageHeader('Funil comercial', 'Oportunidades por etapa. A etapa comercial é independente do status do atendimento.',
      `<div class="seg" role="group" aria-label="Modo de visualização"><button data-mode="board" class="${this.mode === 'board' ? 'active' : ''}">${UI.icons.board} Quadro</button><button data-mode="list" class="${this.mode === 'list' ? 'active' : ''}">${UI.icons.list} Lista</button></div>
       <button class="btn secondary" id="btnExport">${UI.icons.download} <span class="lbl">Exportar</span></button><button class="btn" id="btnNew">${UI.icons.plus} <span class="lbl">Nova oportunidade</span></button>`) +
    `<div class="card"><div class="flex between wrap mb-s"><div class="flex wrap">
        ${this.pipelines.length > 1 ? `<select id="pipeSel" style="width:auto" aria-label="Funil">${this.pipelines.map((p) => `<option value="${p.id}" ${p.id === this.pipelineId ? 'selected' : ''}>${UI.esc(p.name)}</option>`).join('')}</select>` : `<strong>${UI.esc((this.pipelines[0] || {}).name || 'Funil')}</strong>`}
        ${CRM.isAdmin() ? '<a href="#/configuracoes/funil" class="small">Configurar funis</a>' : ''}</div>
        <div id="savedBox"></div></div>
      <form class="filters" id="filters"><div class="field grow"><label>Busca</label><input name="q" value="${UI.attr(query.q || '')}" placeholder="Título, cliente ou empresa"></div>
      ${CRM.isManager() ? `<div class="field"><label>Responsável</label>${UI.select('owner_id', [['', 'Todos'], ['none', 'Sem responsável'], ...CRM.users.filter((u) => u.active !== false).map((u) => [u.id, u.name])], query.owner_id)}</div>` : ''}
      <div class="field"><label>Origem</label>${UI.select('source', [['', 'Todas'], ...this.sources.map((x) => [x, x])], query.source)}</div>
      <div class="field"><label>Etiqueta</label><input name="tag" value="${UI.attr(query.tag || '')}" placeholder="ex.: vip"></div>
      <div class="field"><label>Situação</label>${UI.select('flag', [['', 'Todas'], ['no_task', 'Sem próxima ação'], ['overdue', 'Prazo vencido'], ['idle', 'Paradas']], query.no_task ? 'no_task' : query.overdue ? 'overdue' : query.idle_days ? 'idle' : '')}</div>
      <button class="btn secondary">Filtrar</button><a class="btn ghost" href="#/funil">Limpar</a></form><div id="board"></div></div>`;
    el.querySelector('#filters').onsubmit = (e) => { e.preventDefault(); const d = UI.formData(e.target); const flag = d.flag; delete d.flag; if (flag === 'no_task') d.no_task = 'true'; if (flag === 'overdue') d.overdue = 'true'; if (flag === 'idle') d.idle_days = 7; location.hash = `#/funil?${UI.qs({ ...d, pipeline_id: this.pipelineId })}`; };
    el.querySelectorAll('[data-mode]').forEach((b) => b.onclick = () => { this.mode = b.dataset.mode; UI.store.set('pipeline.mode', this.mode); el.querySelectorAll('[data-mode]').forEach((x) => x.classList.toggle('active', x === b)); this.board(); });
    const ps = el.querySelector('#pipeSel'); if (ps) ps.onchange = () => { location.hash = `#/funil?${UI.qs({ ...this.query, pipeline_id: ps.value })}`; };
    el.querySelector('#btnNew').onclick = () => this.form({ pipeline_id: this.pipelineId }, () => this.board());
    el.querySelector('#btnExport').onclick = () => UI.download('/opportunities/export.csv');
    UI.savedFilters(el.querySelector('#savedBox'), { scope: 'pipeline', current: () => ({ ...this.query, pipeline_id: this.pipelineId }), onApply: (p) => { location.hash = `#/funil?${UI.qs(p)}`; } });
    await this.board();
    if (id) this.detail(id);
  },

  params() { const q = this.query; return { q: q.q, owner_id: q.owner_id, source: q.source, tag: q.tag, no_task: q.no_task, overdue: q.overdue, idle_days: q.idle_days, pipeline_id: this.pipelineId, sort: this.sort, dir: this.dir }; },

  flags(o) {
    const out = [];
    const overdueTask = o.next_task_at && new Date(o.next_task_at) < Date.now();
    const overdueAction = o.next_action_at && new Date(o.next_action_at) < Date.now();
    if (overdueTask || overdueAction) out.push({ cls: 'warn', text: `Prazo vencido ${UI.fmtDate(overdueTask ? o.next_task_at : o.next_action_at)}` });
    else if (!o.open_tasks && !o.next_action_at) out.push({ cls: 'notask', text: 'Sem próxima ação' });
    return out;
  },

  async board() {
    const box = this.el.querySelector('#board'); if (!box) return;
    const r = await api('/opportunities', { query: this.params() });
    this.stages = r.stages; this.data = r;
    if (!r.opportunities.length && !this.query.q && !this.query.owner_id && !this.query.tag && !this.query.no_task && !this.query.overdue) {
      box.innerHTML = UI.empty('Nenhuma oportunidade neste funil', 'Crie a primeira oportunidade a partir de um cliente, de uma conversa ou pelo botão acima.'); return;
    }
    if (this.mode === 'list') return this.listView(box, r);
    const openOnly = r.opportunities.filter((o) => o.stage_kind === 'open');
    const totalOpen = openOnly.reduce((a, o) => a + Number(o.value || 0), 0);
    box.innerHTML = `<p class="small muted mb-s">${openOnly.length} em aberto · ${UI.fmtMoney(totalOpen)} · ${r.opportunities.length - openOnly.length} encerrada(s) nos últimos 30 dias. Arraste os cartões para mudar de etapa.</p>
      <div class="kanban-wrap"><div class="kanban">${r.stages.map((s) => { const items = r.opportunities.filter((o) => o.stage_id === s.id); const sum = items.reduce((a, o) => a + Number(o.value || 0), 0);
      return `<div class="kb-col" data-stage="${s.id}" data-kind="${s.kind}"><div class="kb-head" style="${s.color ? `border-top:3px solid ${UI.attr(s.color)}` : ''}"><div class="t"><span>${UI.esc(s.name)}</span><span class="n">${items.length}</span></div><div class="sum">${UI.fmtMoney(sum)}</div>${s.kind === 'open' && totalOpen ? `<div class="bar"><span style="width:${Math.round((sum / totalOpen) * 100)}%"></span></div>` : ''}</div>
        <div class="kb-cards">${items.map((o) => this.card(o, s)).join('') || '<div class="muted small center" style="padding:1rem">Vazio</div>'}</div></div>`; }).join('')}</div></div>`;
    box.querySelectorAll('.kb-card').forEach((card) => {
      card.onclick = () => this.detail(Number(card.dataset.id));
      card.onkeydown = (e) => { if (e.key === 'Enter') this.detail(Number(card.dataset.id)); };
      card.ondragstart = (e) => { e.dataTransfer.setData('text/plain', JSON.stringify({ id: card.dataset.id, version: card.dataset.version })); };
    });
    box.querySelectorAll('.kb-col').forEach((col) => {
      col.ondragover = (e) => { e.preventDefault(); col.classList.add('over'); };
      col.ondragleave = () => col.classList.remove('over');
      col.ondrop = async (e) => { e.preventDefault(); col.classList.remove('over'); const d = JSON.parse(e.dataTransfer.getData('text/plain')); this.move(Number(d.id), Number(col.dataset.stage), col.dataset.kind, Number(d.version)); };
    });
  },

  card(o, s) {
    const fl = this.flags(o);
    const canDrag = CRM.isManager() || o.owner_id === CRM.user.id || !o.owner_id;
    return `<div class="kb-card ${fl.some((f) => f.cls === 'warn') ? 'late' : fl.length ? 'notask-b' : ''}" draggable="${canDrag}" tabindex="0" data-id="${o.id}" data-version="${o.version}" role="button" aria-label="${UI.attr(o.title)}">
      <div class="cust" title="${UI.attr(o.customer_name)}">${UI.esc(o.customer_name)}${o.customer_company ? ` <span class="muted">· ${UI.esc(o.customer_company)}</span>` : ''}</div>
      <div class="title" title="${UI.attr(o.title)}">${UI.esc(o.title)}</div>
      <div class="row"><span class="value">${UI.fmtMoney(o.value)}</span><span title="Responsável">${o.owner_name ? UI.esc(o.owner_name.split(' ')[0]) : '—'}</span></div>
      <div class="row"><span title="Último contato">${o.last_contact_at ? `${UI.icons.message} ${UI.relative(o.last_contact_at)}` : '<span class="muted">sem contato</span>'}</span>${s.kind === 'open' && o.expected_close_date ? `<span title="Previsão de fechamento">${UI.icons.calendar} ${UI.fmtDate(o.expected_close_date)}</span>` : ''}</div>
      ${s.kind === 'open' ? `<div class="row"><span class="trunc" title="Próxima ação">${o.next_action ? `${UI.icons.arrowRight} ${UI.esc(o.next_action)}${o.next_action_at ? ` · ${UI.fmtDate(o.next_action_at)}` : ''}` : (o.open_tasks ? `${UI.icons.tasks} ${UI.plural(o.open_tasks, 'tarefa', 'tarefas')} · ${UI.fmtDate(o.next_task_at)}` : '')}</span></div>` : ''}
      ${fl.map((f) => `<div class="row"><span class="${f.cls}">${UI.icons.alert} ${f.text}</span></div>`).join('')}
      ${o.lost_reason ? `<div class="row"><span class="badge danger">${UI.esc(o.lost_reason)}</span></div>` : ''}${(o.tags || []).length ? `<div class="row"><span>${UI.tags(o.tags)}</span></div>` : ''}</div>`;
  },

  listView(box, r) {
    const byStage = r.stages.map((s) => { const items = r.opportunities.filter((o) => o.stage_id === s.id); return `${UI.esc(s.name)}: ${items.length} (${UI.fmtMoneyShort(items.reduce((a, o) => a + Number(o.value || 0), 0))})`; }).join(' · ');
    box.innerHTML = `<p class="small muted mb-s">${byStage}</p><div id="listTable"></div>`;
    UI.table(box.querySelector('#listTable'), { id: 'pipeline', rows: r.opportunities, total: r.opportunities.length, limit: 1000, sort: this.sort, dir: this.dir,
      columns: [
        { key: 'customer_name', label: 'Cliente', sortable: true, min: '160px', render: (o) => `<span class="trunc strong" title="${UI.attr(o.customer_name)}">${UI.esc(o.customer_name)}</span>${o.customer_company ? `<span class="trunc muted small">${UI.esc(o.customer_company)}</span>` : ''}` },
        { key: 'title', label: 'Oportunidade', sortable: true, min: '180px', render: (o) => `<span class="trunc" title="${UI.attr(o.title)}">${UI.esc(o.title)}</span>` },
        { key: 'stage', label: 'Etapa', sortable: true, render: (o) => UI.stageBadge(o.stage_name, o.stage_kind) },
        { key: 'value', label: 'Valor', sortable: true, align: 'right', nowrap: true, render: (o) => UI.fmtMoney(o.value) },
        { key: 'owner_name', label: 'Responsável', sortable: true, nowrap: true, render: (o) => UI.esc(o.owner_name || '—') },
        { key: 'last_contact', label: 'Último contato', nowrap: true, render: (o) => o.last_contact_at ? UI.fmtDateTime(o.last_contact_at) : '<span class="muted">—</span>' },
        { key: 'next_action_at', label: 'Próxima ação', sortable: true, min: '160px', render: (o) => { const f = this.flags(o); return `<span class="trunc">${UI.esc(o.next_action || (o.open_tasks ? `${o.open_tasks} tarefa(s)` : ''))}</span>${o.next_action_at || o.next_task_at ? `<span class="small ${f.some((x) => x.cls === 'warn') ? 'text-danger strong' : 'muted'}">${UI.fmtDateTime(o.next_action_at || o.next_task_at)}${f.some((x) => x.cls === 'warn') ? ' · vencido' : ''}</span>` : f.length ? `<span class="small text-warning">${f[0].text}</span>` : ''}`; } },
        { key: 'expected_close_date', label: 'Previsão', sortable: true, nowrap: true, render: (o) => UI.fmtDate(o.expected_close_date) },
        { key: 'tags', label: 'Etiquetas', default: false, render: (o) => UI.tags(o.tags) },
        { key: 'created_at', label: 'Criada', sortable: true, nowrap: true, default: false, render: (o) => UI.fmtDate(o.created_at) },
      ],
      onSort: (s, d) => { this.sort = s; this.dir = d; this.board(); }, onRow: (o) => this.detail(o.id) });
  },

  async move(id, stageId, kind, version, after) {
    try {
      let lost_reason;
      if (kind === 'lost') { lost_reason = await UI.prompt('Qual foi o motivo da perda?', { title: 'Marcar como perdida', placeholder: 'ex.: Preço, prazo, concorrente…' }); if (lost_reason === null) return; }
      const r = await api(`/opportunities/${id}/move`, { method: 'POST', body: { stage_id: stageId, lost_reason, version } });
      UI.ok(r.message); if (after) after(); else if (this.el && this.el.querySelector('#board')) this.board();
    } catch (err) { UI.err(err); if (after) after(); else if (this.el && this.el.querySelector('#board')) this.board(); }
  },

  async form({ customer, ticket_id, opp, pipeline_id } = {}, onSaved) {
    const isEdit = Boolean(opp);
    const s = await CRM.settingsFull();
    const pipelines = (s ? s.pipelines : []).filter((p) => p.active);
    const stagesAll = s ? s.stages : [];
    const pid = opp ? opp.pipeline_id : (pipeline_id || (pipelines.find((p) => p.is_default) || pipelines[0] || {}).id);
    const sources = s ? s.settings.contact_sources : [];
    const m = UI.modal({ title: isEdit ? 'Editar oportunidade' : 'Nova oportunidade', body: `<form id="oppForm">
      ${UI.field('customer_id', 'Cliente', `<input id="custSearch" placeholder="Digite para buscar o cliente…" autocomplete="off" value="${UI.attr(customer ? customer.name : opp ? opp.customer_name : '')}" ${customer || isEdit ? 'readonly' : ''}><input type="hidden" name="customer_id" data-type="int" value="${customer ? customer.id : opp ? opp.customer_id : ''}"><div class="search-results" id="custResults" hidden style="position:relative"></div>`, { required: true })}
      ${UI.field('title', 'Título', UI.input('title', opp?.title, 'required placeholder="ex.: Plano anual — 10 licenças"'), { required: true })}
      <div class="form-row cols-3">${UI.field('value', 'Valor estimado (R$)', UI.input('value', opp ? UI.money(opp.value) : '', 'data-type="money" placeholder="0,00" inputmode="decimal"'))}
        ${UI.field('owner_id', 'Responsável', UI.select('owner_id', UI.userOptions(CRM.users, { filter: CRM.isManager() ? null : (u) => u.id === CRM.user.id }), opp ? opp.owner_id : CRM.user.id, 'data-type="int"'))}
        ${isEdit ? UI.field('source', 'Origem', UI.select('source', [['', '—'], ...sources.map((x) => [x, x])], opp.source, 'data-type="nullable"')) : `<div class="field"><label>Funil e etapa inicial</label><div class="flex">${pipelines.length > 1 ? UI.select('pipeline_id', pipelines.map((p) => [p.id, p.name]), pid, 'data-type="int" id="pipeSelForm"') : `<input type="hidden" name="pipeline_id" value="${pid}" data-type="int">`}${UI.select('stage_id', stagesAll.filter((x) => x.kind === 'open' && x.active && x.pipeline_id === pid).map((x) => [x.id, x.name]), '', 'data-type="int" id="stageSelForm"')}</div></div>`}</div>
      <div class="form-row">${UI.field('next_action', 'Próxima ação', UI.input('next_action', opp?.next_action, 'data-type="nullable" placeholder="ex.: Enviar proposta revisada"'))}${UI.field('next_action_at', 'Quando', `<input type="datetime-local" name="next_action_at" value="${UI.toLocalInput(opp?.next_action_at)}">`)}</div>
      <div class="form-row">${UI.field('expected_close_date', 'Previsão de fechamento', `<input type="date" name="expected_close_date" data-type="nullable" value="${UI.attr(opp?.expected_close_date ? String(opp.expected_close_date).slice(0, 10) : '')}">`)}${UI.field('tags', 'Etiquetas', UI.input('tags', (opp?.tags || []).join(', '), 'data-type="tags" placeholder="separe por vírgula"'))}</div>
      ${ticket_id ? `<input type="hidden" name="ticket_id" value="${ticket_id}" data-type="int">` : ''}${isEdit ? `<input type="hidden" name="version" value="${opp.version}" data-type="int">` : ''}</form>`,
      footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="oppForm">${isEdit ? 'Salvar' : 'Criar oportunidade'}</button>` });
    const form = m.el.querySelector('#oppForm');
    const pipeSel = form.querySelector('#pipeSelForm'); if (pipeSel) pipeSel.onchange = () => { const st = form.querySelector('#stageSelForm'); st.innerHTML = stagesAll.filter((x) => x.kind === 'open' && x.active && x.pipeline_id === Number(pipeSel.value)).map((x) => `<option value="${x.id}">${UI.esc(x.name)}</option>`).join(''); };
    if (!customer && !isEdit) CRM.pages.tickets.customerPicker(form.querySelector('#custSearch'), form.querySelector('#custResults'), form.customer_id, m);
    form.onsubmit = async (e) => {
      e.preventDefault(); const d = UI.formData(form); if (!d.customer_id) { UI.showErrors(form, new ApiError(400, { fields: { customer_id: 'Selecione um cliente.' } })); return; }
      if (isEdit) delete d.customer_id;
      try { const r = isEdit ? await api(`/opportunities/${opp.id}`, { method: 'PUT', body: d }) : await api('/opportunities', { method: 'POST', body: d }); UI.ok(r.message); m.close(); if (onSaved) onSaved(r.opportunity); } catch (err) { UI.showErrors(form, err); }
    };
  },

  // Painel lateral amplo: contexto do funil permanece visível atrás.
  async detail(id, { onChange } = {}) {
    let r; try { r = await api(`/opportunities/${id}`); } catch (err) { return UI.err(err); }
    const o = r.opportunity; const stages = r.stages.filter((s) => s.active);
    const canEdit = CRM.isManager() || o.owner_id === CRM.user.id || o.owner_id === null;
    const isOpen = o.stage_kind === 'open';
    const changed = () => { if (onChange) onChange(); if (this.el && this.el.querySelector('#board')) this.board(); };
    const sources = (CRM._settingsFull && CRM._settingsFull.settings.contact_sources) || [];
    const fl = this.flags(o);
    const d = UI.drawer({ title: o.title, onClose: () => { if (location.hash.startsWith('#/funil/')) history.replaceState(null, '', '#/funil'); },
      body: `<div class="flex wrap mb">${UI.stageBadge(o.stage_name, o.stage_kind)}<span class="badge outline">${UI.esc(o.pipeline_name)}</span>${fl.map((f) => `<span class="badge ${f.cls === 'warn' ? 'danger' : 'warning'}">${f.text}</span>`).join('')}${o.open_ticket_id ? `<a class="badge primary" href="#/atendimentos/${o.open_ticket_id}">Atendimento ${UI.esc(UI.STATUS[o.open_ticket_status]?.short || '')}</a>` : ''}</div>
      ${isOpen && canEdit ? `<div class="flex wrap mb"><label class="small" style="margin:0">Etapa</label>${UI.select('stage', stages.map((s) => [s.id, s.name]), o.stage_id, 'id="moveSel" style="width:auto"')}<span class="muted small">Ganho/Perdido encerram a negociação; perda exige motivo.</span></div>` : ''}
      <div class="grid cols-2">
        <div><h4>Dados da negociação</h4><form id="inlineForm"><dl class="def-list" id="oppFields">
          ${this.inline('title', 'Título', o.title, canEdit)}
          ${this.inline('value', 'Valor', UI.money(o.value), canEdit, 'money', UI.fmtMoney(o.value))}
          ${this.inlineSelect('owner_id', 'Responsável', UI.userOptions(CRM.users, { filter: CRM.isManager() ? null : (u) => u.id === CRM.user.id }), o.owner_id, canEdit, o.owner_name || '—')}
          ${this.inline('expected_close_date', 'Previsão', o.expected_close_date ? String(o.expected_close_date).slice(0, 10) : '', canEdit, 'date', UI.fmtDate(o.expected_close_date))}
          ${this.inline('next_action', 'Próxima ação', o.next_action || '', canEdit, 'text', o.next_action || '—')}
          ${this.inline('next_action_at', 'Quando', UI.toLocalInput(o.next_action_at), canEdit, 'datetime', o.next_action_at ? UI.fmtDateTime(o.next_action_at) : '—')}
          ${this.inlineSelect('source', 'Origem', [['', '—'], ...sources.map((x) => [x, x])], o.source || '', canEdit, o.source || o.customer_source || '—')}
          ${this.inline('tags', 'Etiquetas', (o.tags || []).join(', '), canEdit, 'tags', UI.tags(o.tags) || '—')}
          ${o.lost_reason ? `<dt>Motivo da perda</dt><dd>${UI.esc(o.lost_reason)}</dd>` : ''}
          <dt>Criada</dt><dd>${UI.fmtDateTime(o.created_at)}</dd>${o.closed_at ? `<dt>Encerrada</dt><dd>${UI.fmtDateTime(o.closed_at)}</dd>` : ''}<dt>Na etapa há</dt><dd>${UI.fmtDuration((Date.now() - new Date(o.stage_entered_at || o.updated_at)) / 1000)}</dd></dl></form>
          ${canEdit ? '<p class="muted xs mt-s">Clique em um campo para editar; a alteração é salva ao sair do campo.</p>' : ''}
          <h4 class="mt">Contato</h4><dl class="def-list"><dt>Cliente</dt><dd><a href="#/clientes/${o.customer_id}">${UI.esc(o.customer_name)}</a></dd><dt>Empresa</dt><dd>${UI.esc(o.customer_company || '—')}</dd><dt>Telefone</dt><dd>${UI.esc(UI.fmtPhone(o.customer_phone) || '—')}</dd><dt>E-mail</dt><dd>${UI.esc(o.customer_email || '—')}</dd>${(o.customer_tags || []).length ? `<dt>Etiquetas</dt><dd>${UI.tags(o.customer_tags)}</dd>` : ''}</dl>
          <h4 class="mt flex between">Tarefas <button class="btn link small" id="taskBtn">+ Tarefa</button></h4>${r.tasks.length ? r.tasks.map((t) => `<div class="task-row ${t.done_at ? 'done' : ''}"><input type="checkbox" data-task="${t.id}" ${t.done_at ? 'checked' : ''} aria-label="Concluir"><div><div class="t">${UI.esc(t.title)}</div><div class="s ${!t.done_at && t.due_at && new Date(t.due_at) < Date.now() ? 'text-danger' : ''}">${t.due_at ? UI.fmtDateTime(t.due_at) : 'sem prazo'}${t.assignee_name ? ` · ${UI.esc(t.assignee_name.split(' ')[0])}` : ''}${!t.done_at && t.due_at && new Date(t.due_at) < Date.now() ? ' · atrasada' : ''}${t.closed_reason ? ` · ${UI.esc(t.closed_reason)}` : ''}</div></div></div>`).join('') : '<p class="muted small">Nenhuma tarefa. Oportunidades sem tarefa nem próxima ação aparecem sinalizadas no quadro.</p>'}
          <h4 class="mt">Atendimentos do cliente</h4>${r.tickets.length ? r.tickets.map((t) => `<div class="small"><a href="#/atendimentos/${t.id}"><span class="mono">${UI.esc(t.protocol)}</span></a> ${UI.esc(t.subject)} ${UI.statusBadge(t.status, true)}</div>`).join('') : '<p class="muted small">Nenhum atendimento.</p>'}</div>
        <div><h4>Histórico</h4><ul class="timeline">${r.events.map((e) => `<li class="system"><span class="tl-dot"></span><div><div class="tl-meta">${UI.esc(e.user_name || 'Sistema')} · ${UI.fmtDateTime(e.created_at)}</div><div class="tl-body">${UI.esc(e.body)}</div></div></li>`).join('')}</ul></div></div>`,
      footer: `${CRM.isManager() ? '<button class="btn danger secondary" id="delBtn">Excluir</button>' : ''}<span class="grow"></span>${o.open_ticket_id ? `<a class="btn secondary" href="#/atendimentos/${o.open_ticket_id}">${UI.icons.inbox} Abrir conversa</a>` : `<button class="btn secondary" id="newTicketBtn">${UI.icons.inbox} Abrir atendimento</button>`}<button class="btn secondary" id="editBtn">${UI.icons.edit} Editar tudo</button><button class="btn" data-close>Fechar</button>` });
    const el = d.el;
    el.querySelector('#editBtn').onclick = () => { d.close(); this.form({ opp: o }, () => { changed(); this.detail(id, { onChange }); }); };
    const ms = el.querySelector('#moveSel'); if (ms) ms.onchange = () => { const st = stages.find((s) => s.id === Number(ms.value)); if (!st || st.id === o.stage_id) return; d.close(); this.move(o.id, st.id, st.kind, o.version, () => { changed(); this.detail(id, { onChange }); }); };
    el.querySelector('#taskBtn').onclick = () => CRM.pages.tasks.form({ customer_id: o.customer_id, customer_name: o.customer_name, opportunity_id: o.id, assignee_id: o.owner_id }, () => { changed(); d.close(); this.detail(id, { onChange }); });
    const nt = el.querySelector('#newTicketBtn'); if (nt) nt.onclick = () => CRM.pages.tickets.form({ customer: { id: o.customer_id, name: o.customer_name } }, (t) => { d.close(); location.hash = `#/atendimentos/${t.id}`; });
    el.querySelectorAll('[data-task]').forEach((cb) => cb.onchange = async () => { try { await api(`/tasks/${cb.dataset.task}`, { method: 'PUT', body: { done: cb.checked } }); changed(); d.close(); this.detail(id, { onChange }); } catch (e) { UI.err(e); } });
    const del = el.querySelector('#delBtn'); if (del) del.onclick = async () => { if (!(await UI.confirm('Excluir esta oportunidade? Esta ação não pode ser desfeita.', { danger: true, okLabel: 'Excluir' }))) return; try { const r2 = await api(`/opportunities/${o.id}`, { method: 'DELETE' }); UI.ok(r2.message); d.close(); changed(); } catch (err) { UI.err(err); } };
    // Edição direta de campos comuns
    let version = o.version;
    el.querySelectorAll('[data-inline]').forEach((inp) => {
      const save = async () => {
        const name = inp.dataset.inline; let v = inp.value.trim();
        if (inp.dataset.type === 'money') v = v === '' ? 0 : Number(v.replace(/[R$\s.]/g, '').replace(',', '.'));
        else if (inp.dataset.type === 'tags') v = v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
        else if (inp.dataset.type === 'datetime') v = v ? new Date(v).toISOString() : null;
        else if (inp.dataset.type === 'int') v = v === '' ? null : Number(v);
        else if (v === '') v = null;
        if (JSON.stringify(v) === JSON.stringify(inp.dataset.orig === undefined ? null : JSON.parse(inp.dataset.orig))) return;
        try { const r2 = await api(`/opportunities/${o.id}`, { method: 'PUT', body: { [name]: v, version } }); version = r2.opportunity.version; inp.dataset.orig = JSON.stringify(v); UI.ok('Campo salvo.'); changed(); }
        catch (e) { UI.err(e); if (e.status === 409) { d.close(); this.detail(id, { onChange }); } }
      };
      inp.onchange = save;
      inp.onkeydown = (e) => { if (e.key === 'Enter' && inp.tagName !== 'TEXTAREA') { e.preventDefault(); inp.blur(); } };
    });
  },
  inline(name, label, value, canEdit, type = 'text', display) {
    if (!canEdit) return `<dt>${label}</dt><dd>${display !== undefined ? display : UI.esc(value || '—')}</dd>`;
    const orig = type === 'money' ? Number(String(value || '0').replace(/\./g, '').replace(',', '.')) : type === 'tags' ? (value ? value.split(',').map((s) => s.trim()).filter(Boolean) : []) : type === 'datetime' ? (value ? new Date(value).toISOString() : null) : (value || null);
    const inputType = type === 'date' ? 'date' : type === 'datetime' ? 'datetime-local' : 'text';
    return `<dt>${label}</dt><dd><input class="inline-edit" type="${inputType}" data-inline="${name}" data-type="${type}" data-orig='${UI.attr(JSON.stringify(orig))}' value="${UI.attr(value ?? '')}" aria-label="${label}" ${type === 'money' ? 'inputmode="decimal"' : ''}></dd>`;
  },
  inlineSelect(name, label, options, value, canEdit, display) {
    if (!canEdit) return `<dt>${label}</dt><dd>${UI.esc(display)}</dd>`;
    const isInt = name.endsWith('_id');
    return `<dt>${label}</dt><dd>${UI.select(name, options, value ?? '', `class="inline-edit" data-inline="${name}" data-type="${isInt ? 'int' : 'text'}" data-orig='${UI.attr(JSON.stringify(value ?? null))}' aria-label="${label}"`)}</dd>`;
  },
  onRealtime() { if (!document.querySelector('.modal-backdrop, .drawer-backdrop') && this.el && this.el.querySelector('#board')) this.board(); },
};
