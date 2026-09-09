'use strict';
CRM.pages.tasks = {
  async render(el, { query }) {
    this.el = el; this.view = query.view || 'today';
    el.innerHTML = CRM.pageHeader('Tarefas e retornos', 'Acompanhe compromissos vinculados a clientes, atendimentos e oportunidades.', '<button class="btn" id="btnNew">+ Nova tarefa</button>') +
      `<div class="tabs" id="tabs"></div><div class="card">${CRM.isManager() ? `<div class="filters"><div class="field"><label>Responsável</label>${UI.select('assignee_id', UI.userOptions(CRM.users, { blank: 'Todos' }), query.assignee_id, 'id="assigneeFilter"')}</div></div>` : ''}<div id="list"></div></div>`;
    el.querySelector('#btnNew').onclick = () => this.form({}, () => this.list());
    const af = el.querySelector('#assigneeFilter'); if (af) af.onchange = () => this.list();
    await this.list();
  },
  async list() {
    const af = this.el.querySelector('#assigneeFilter');
    const r = await api('/tasks', { query: { view: this.view, assignee_id: af ? af.value : '' } });
    const s = r.summary;
    this.el.querySelector('#tabs').innerHTML = [['today', 'Hoje', s.today, 'primary'], ['overdue', 'Atrasadas', s.overdue, 'danger'], ['upcoming', 'Futuras', s.upcoming, ''], ['open', 'Todas abertas', s.open, ''], ['done', 'Concluídas', null, '']]
      .map(([k, l, n, c]) => `<button data-view="${k}" class="${this.view === k ? 'active' : ''}">${l}${n ? ` <span class="badge ${c}">${n}</span>` : ''}</button>`).join('');
    this.el.querySelector('#tabs').onclick = (e) => { const b = e.target.closest('[data-view]'); if (!b) return; this.view = b.dataset.view; this.list(); };
    const box = this.el.querySelector('#list');
    if (!r.tasks.length) { const msgs = { today: ['Nenhuma tarefa para hoje', 'Aproveite para adiantar as futuras.'], overdue: ['Nenhuma tarefa atrasada', 'Tudo em dia.'], upcoming: ['Nenhuma tarefa futura', ''], open: ['Nenhuma tarefa aberta', 'Crie uma tarefa pelo botão acima.'], done: ['Nenhuma tarefa concluída', ''] }; box.innerHTML = UI.empty(...msgs[this.view]); return; }
    box.innerHTML = `<div class="table-wrap"><table><thead><tr><th></th><th>Tarefa</th><th>Vinculada a</th><th>Responsável</th><th>Prazo</th><th>Prioridade</th><th></th></tr></thead><tbody>
      ${r.tasks.map((t) => { const late = !t.done_at && t.due_at && new Date(t.due_at) < Date.now();
        return `<tr><td><input type="checkbox" data-done="${t.id}" ${t.done_at ? 'checked' : ''} title="${t.done_at ? 'Reabrir' : 'Concluir'}"></td><td><strong ${t.done_at ? 'style="text-decoration:line-through;color:var(--muted)"' : ''}>${UI.esc(t.title)}</strong>${t.description ? `<div class="muted small">${UI.esc(t.description)}</div>` : ''}</td>
        <td class="small">${t.customer_name ? `<a href="#/clientes/${t.customer_id}">${UI.esc(t.customer_name)}</a>` : ''}${t.ticket_protocol ? ` · <a href="#/atendimentos/${t.ticket_id}" class="mono">${UI.esc(t.ticket_protocol)}</a>` : ''}${t.opportunity_title ? ` · <a href="#/funil/${t.opportunity_id}">${UI.esc(t.opportunity_title)}</a>` : ''}</td>
        <td class="small">${UI.esc(t.assignee_name || '—')}</td><td class="small nowrap">${late ? `<span class="badge danger">${UI.fmtDateTime(t.due_at)}</span>` : UI.fmtDateTime(t.due_at)}</td><td>${UI.priorityBadge(t.priority)}</td>
        <td class="nowrap"><button class="icon-btn" data-edit="${t.id}" title="Editar">✎</button><button class="icon-btn" data-del="${t.id}" title="Excluir">🗑</button></td></tr>`; }).join('')}</tbody></table></div>`;
    this.tasks = r.tasks;
    box.querySelectorAll('[data-done]').forEach((c) => c.onchange = async () => { try { const r2 = await api(`/tasks/${c.dataset.done}`, { method: 'PUT', body: { done: c.checked } }); UI.ok(r2.message); this.list(); } catch (err) { UI.err(err); this.list(); } });
    box.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => this.form({ task: this.tasks.find((t) => t.id === Number(b.dataset.edit)) }, () => this.list()));
    box.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => { if (!(await UI.confirm('Excluir esta tarefa?', { danger: true, okLabel: 'Excluir' }))) return; try { const r2 = await api(`/tasks/${b.dataset.del}`, { method: 'DELETE' }); UI.ok(r2.message); this.list(); } catch (err) { UI.err(err); } });
  },
  form({ task, customer_id, customer_name, ticket_id, opportunity_id, assignee_id } = {}, onSaved) {
    const isEdit = Boolean(task);
    const m = UI.modal({ title: isEdit ? 'Editar tarefa' : 'Nova tarefa', body: `<form id="taskForm">
      ${UI.field('title', 'Título', UI.input('title', task?.title, 'required'), { required: true })}
      ${UI.field('description', 'Descrição', UI.textarea('description', task?.description, 'data-type="nullable"'))}
      <div class="form-row cols-3">${UI.field('assignee_id', 'Responsável', UI.select('assignee_id', UI.userOptions(CRM.users, { filter: CRM.isManager() ? null : (u) => u.id === CRM.user.id }), task ? task.assignee_id : (assignee_id || CRM.user.id), 'data-type="int"'))}
        ${UI.field('due_at', 'Prazo', `<input type="datetime-local" name="due_at" value="${UI.toLocalInput(task?.due_at)}">`)}${UI.field('priority', 'Prioridade', UI.select('priority', [['baixa', 'Baixa'], ['normal', 'Normal'], ['alta', 'Alta']], task?.priority || 'normal'))}</div>
      ${customer_name || task?.customer_name ? `<p class="muted small">Vinculada ao cliente <strong>${UI.esc(customer_name || task.customer_name)}</strong>${ticket_id || task?.ticket_protocol ? ' e ao atendimento' : ''}${opportunity_id || task?.opportunity_title ? ' e à oportunidade' : ''}.</p>` : `${UI.field('customer_id', 'Cliente (opcional)', `<input id="custSearch" placeholder="Digite para buscar..." autocomplete="off"><input type="hidden" name="customer_id" data-type="int"><div class="search-results" id="custResults" hidden style="position:relative"></div>`)}`}
      ${!isEdit && customer_id ? `<input type="hidden" name="customer_id" value="${customer_id}" data-type="int">` : ''}${!isEdit && ticket_id ? `<input type="hidden" name="ticket_id" value="${ticket_id}" data-type="int">` : ''}${!isEdit && opportunity_id ? `<input type="hidden" name="opportunity_id" value="${opportunity_id}" data-type="int">` : ''}</form>`,
      footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="taskForm">${isEdit ? 'Salvar' : 'Criar tarefa'}</button>` });
    const form = m.el.querySelector('#taskForm');
    const cs = form.querySelector('#custSearch'); if (cs) CRM.pages.tickets.customerPicker(cs, form.querySelector('#custResults'), form.customer_id, m);
    form.onsubmit = async (e) => { e.preventDefault(); const d = UI.formData(form); if (d.customer_id === null || d.customer_id === '') delete d.customer_id;
      try { const r = isEdit ? await api(`/tasks/${task.id}`, { method: 'PUT', body: d }) : await api('/tasks', { method: 'POST', body: d }); UI.ok(r.message); m.close(); if (onSaved) onSaved(r.task); } catch (err) { UI.showErrors(form, err); } };
  },
};
