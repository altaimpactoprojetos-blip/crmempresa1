'use strict';
CRM.pages.tasks = {
  LAYOUTS: [
    ['list', 'Lista', 'list'],
    ['board', 'Quadro', 'kanban'],
    ['calendar', 'Calendário', 'calendar'],
  ],
  layoutPref(v) {
    try {
      if (v) localStorage.setItem('crm.tasksLayout', v);
      return localStorage.getItem('crm.tasksLayout') || 'list';
    } catch (_) {
      return v || 'list';
    }
  },
  async render(el, { query }) {
    this.el = el;
    this.view = query.view || 'today';
    this.q = query.q || '';
    this.layout = this.layoutPref();
    this.month = this.month || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    el.innerHTML =
      CRM.pageHeader(
        'Tarefas e retornos',
        'Acompanhe compromissos vinculados a clientes, atendimentos e oportunidades.',
        `<div class="seg" id="layoutSeg">${this.LAYOUTS.map(([k, l, i]) => `<button data-layout="${k}" class="${this.layout === k ? 'active' : ''}" title="${l}">${UI.icons[i]}<span>${l}</span></button>`).join('')}</div>
        <button class="btn" id="btnNew">+ Nova tarefa</button>`,
      ) +
      `<div class="tabs" id="tabs"></div><div class="card"><div class="filters"><div class="field grow"><label>Busca</label><input id="taskSearch" value="${UI.attr(this.q)}" placeholder="Título da tarefa ou cliente"></div>${CRM.isManager() ? `<div class="field"><label>Responsável</label>${UI.select('assignee_id', UI.userOptions(CRM.users, { blank: 'Todos' }), query.assignee_id, 'id="assigneeFilter"')}</div>` : ''}</div><div id="list"></div></div>`;
    el.querySelector('#btnNew').onclick = () => this.form({}, () => this.list());
    el.querySelector('#layoutSeg').onclick = (e) => {
      const b = e.target.closest('[data-layout]');
      if (!b) return;
      this.layout = this.layoutPref(b.dataset.layout);
      el.querySelectorAll('#layoutSeg button').forEach((x) => x.classList.toggle('active', x === b));
      this.list();
    };
    const qf = el.querySelector('#taskSearch');
    qf.oninput = UI.debounce(() => {
      this.q = qf.value.trim();
      this.list();
    }, 300);
    const af = el.querySelector('#assigneeFilter');
    if (af) af.onchange = () => this.list();
    await this.list();
  },
  async list() {
    if (this.layout === 'board') return this.board();
    if (this.layout === 'calendar') return this.calendar();
    this.el.querySelector('#tabs').hidden = false;
    const af = this.el.querySelector('#assigneeFilter');
    const r = await api('/tasks', { query: { view: this.view, assignee_id: af ? af.value : '', q: this.q } });
    const s = r.summary;
    this.el.querySelector('#tabs').innerHTML = [
      ['today', 'Hoje', s.today, 'primary'],
      ['overdue', 'Atrasadas', s.overdue, 'danger'],
      ['upcoming', 'Futuras', s.upcoming, ''],
      ['open', 'Todas abertas', s.open, ''],
      ['done', 'Concluídas', null, ''],
    ]
      .map(
        ([k, l, n, c]) =>
          `<button data-view="${k}" class="${this.view === k ? 'active' : ''}">${l}${n ? ` <span class="badge ${c}">${n}</span>` : ''}</button>`,
      )
      .join('');
    this.el.querySelector('#tabs').onclick = (e) => {
      const b = e.target.closest('[data-view]');
      if (!b) return;
      this.view = b.dataset.view;
      this.list();
    };
    const box = this.el.querySelector('#list');
    if (!r.tasks.length) {
      const msgs = {
        today: ['Nenhuma tarefa para hoje', 'Aproveite para adiantar as futuras.'],
        overdue: ['Nenhuma tarefa atrasada', 'Tudo em dia.'],
        upcoming: ['Nenhuma tarefa futura', ''],
        open: ['Nenhuma tarefa aberta', 'Crie uma tarefa pelo botão acima.'],
        done: ['Nenhuma tarefa concluída', ''],
      };
      box.innerHTML = UI.empty(...msgs[this.view]);
      return;
    }
    box.innerHTML = `<div class="table-wrap"><table><thead><tr><th></th><th>Tarefa</th><th>Vinculada a</th><th>Responsável</th><th>Prazo</th><th>Prioridade</th><th></th></tr></thead><tbody>
      ${r.tasks
        .map((t) => {
          const late = !t.done_at && t.due_at && new Date(t.due_at) < Date.now();
          return `<tr><td><input type="checkbox" data-done="${t.id}" ${t.done_at ? 'checked' : ''} title="${t.done_at ? 'Reabrir' : 'Concluir'}"></td><td><strong ${t.done_at ? 'style="text-decoration:line-through;color:var(--muted)"' : ''}>${UI.esc(t.title)}</strong>${t.description ? `<div class="muted small">${UI.esc(t.description)}</div>` : ''}</td>
        <td class="small">${t.customer_name ? `<a href="#/clientes/${t.customer_id}">${UI.esc(t.customer_name)}</a>` : ''}${t.ticket_protocol ? ` · <a href="#/atendimentos/${t.ticket_id}" class="mono">${UI.esc(t.ticket_protocol)}</a>` : ''}${t.opportunity_title ? ` · <a href="#/funil/${t.opportunity_id}">${UI.esc(t.opportunity_title)}</a>` : ''}</td>
        <td class="small">${UI.esc(t.assignee_name || '—')}</td><td class="small nowrap">${late ? `<span class="badge danger">${UI.fmtDateTime(t.due_at)}</span>` : UI.fmtDateTime(t.due_at)}</td><td>${UI.priorityBadge(t.priority)}</td>
        <td class="nowrap"><button class="icon-btn" data-edit="${t.id}" title="Editar">✎</button><button class="icon-btn" data-del="${t.id}" title="Excluir">🗑</button></td></tr>`;
        })
        .join('')}</tbody></table></div>`;
    this.tasks = r.tasks;
    box.querySelectorAll('[data-done]').forEach(
      (c) =>
        (c.onchange = async () => {
          try {
            const r2 = await api(`/tasks/${c.dataset.done}`, { method: 'PUT', body: { done: c.checked } });
            UI.ok(r2.message);
            this.list();
          } catch (err) {
            UI.err(err);
            this.list();
          }
        }),
    );
    box
      .querySelectorAll('[data-edit]')
      .forEach(
        (b) =>
          (b.onclick = () =>
            this.form({ task: this.tasks.find((t) => t.id === Number(b.dataset.edit)) }, () => this.list())),
      );
    box.querySelectorAll('[data-del]').forEach(
      (b) =>
        (b.onclick = async () => {
          if (!(await UI.confirm('Excluir esta tarefa?', { danger: true, okLabel: 'Excluir' }))) return;
          try {
            const r2 = await api(`/tasks/${b.dataset.del}`, { method: 'DELETE' });
            UI.ok(r2.message);
            this.list();
          } catch (err) {
            UI.err(err);
          }
        }),
    );
  },
  filterQuery() {
    const af = this.el.querySelector('#assigneeFilter');
    return { assignee_id: af ? af.value : '', q: this.q };
  },

  async toggleDone(id, done) {
    try {
      UI.ok((await api(`/tasks/${id}`, { method: 'PUT', body: { done } })).message);
    } catch (err) {
      UI.err(err);
    }
    this.list();
  },

  card(t) {
    const late = !t.done_at && t.due_at && new Date(t.due_at) < Date.now();
    return `<div class="kb-card task-card ${late ? 'late' : ''} ${t.done_at ? 'done' : ''}" draggable="true" data-task="${t.id}">
      <div class="title">${UI.esc(t.title)}</div>${t.customer_name ? `<div class="small">${UI.esc(t.customer_name)}</div>` : ''}
      <div class="meta"><span>${t.due_at ? UI.fmtDateTime(t.due_at) : 'sem prazo'}</span>${UI.priorityBadge(t.priority)}</div>
      <div class="meta"><span>${UI.esc(t.assignee_name || '—')}</span></div></div>`;
  },

  // Quadro: colunas por situação; arrastar para "Concluídas" conclui, arrastar de volta reabre
  async board() {
    this.el.querySelector('#tabs').hidden = true;
    const box = this.el.querySelector('#list');
    const [open, done] = await Promise.all([
      api('/tasks', { query: { view: 'open', ...this.filterQuery() } }),
      api('/tasks', { query: { view: 'done', ...this.filterQuery() } }),
    ]);
    this.tasks = [...open.tasks, ...done.tasks];
    const today = new Date().toDateString();
    const cols = [
      ['overdue', 'Atrasadas', open.tasks.filter((t) => t.due_at && new Date(t.due_at) < Date.now())],
      [
        'today',
        'Hoje',
        open.tasks.filter(
          (t) => t.due_at && new Date(t.due_at) >= Date.now() && new Date(t.due_at).toDateString() === today,
        ),
      ],
      [
        'next',
        'Próximas',
        open.tasks.filter(
          (t) => t.due_at && new Date(t.due_at).toDateString() !== today && new Date(t.due_at) > Date.now(),
        ),
      ],
      ['none', 'Sem prazo', open.tasks.filter((t) => !t.due_at)],
      ['done', 'Concluídas', done.tasks.slice(0, 30)],
    ];
    box.innerHTML = `<div class="kanban task-board">${cols
      .map(
        ([k, l, list]) =>
          `<div class="kb-col" data-col="${k}"><div class="kb-head"><span>${l} <span class="badge">${list.length}</span></span></div>${list.map((t) => this.card(t)).join('') || '<div class="muted small center" style="padding:1rem">Vazio</div>'}</div>`,
      )
      .join(
        '',
      )}</div><p class="muted small">Arraste um cartão para "Concluídas" para concluir, ou de volta para reabrir.</p>`;
    this.bindCards(box);
    box.querySelectorAll('.kb-col').forEach((col) => {
      col.ondragover = (e) => {
        e.preventDefault();
        col.classList.add('over');
      };
      col.ondragleave = () => col.classList.remove('over');
      col.ondrop = (e) => {
        e.preventDefault();
        col.classList.remove('over');
        const t = this.tasks.find((x) => x.id === Number(e.dataTransfer.getData('text/plain')));
        if (!t) return;
        const toDone = col.dataset.col === 'done';
        if (toDone !== Boolean(t.done_at)) this.toggleDone(t.id, toDone);
      };
    });
  },

  bindCards(box) {
    box.querySelectorAll('[data-task]').forEach((c) => {
      c.onclick = () => this.form({ task: this.tasks.find((t) => t.id === Number(c.dataset.task)) }, () => this.list());
      c.ondragstart = (e) => {
        c.classList.add('dragging');
        e.dataTransfer.setData('text/plain', c.dataset.task);
      };
      c.ondragend = () => c.classList.remove('dragging');
    });
  },

  // Calendário do mês, pelo prazo das tarefas
  async calendar() {
    this.el.querySelector('#tabs').hidden = true;
    const box = this.el.querySelector('#list');
    const m = this.month;
    const iso = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const first = new Date(m.getFullYear(), m.getMonth(), 1);
    const last = new Date(m.getFullYear(), m.getMonth() + 1, 0);
    const r = await api('/tasks', { query: { view: 'all', from: iso(first), to: iso(last), ...this.filterQuery() } });
    this.tasks = r.tasks;
    const byDay = {};
    for (const t of r.tasks) (byDay[iso(new Date(t.due_at))] ||= []).push(t);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay()); // começa no domingo
    const cells = [];
    for (let d = new Date(start); d <= last || d.getDay() !== 0; d.setDate(d.getDate() + 1)) {
      const key = iso(d);
      const list = byDay[key] || [];
      const isToday = key === iso(new Date());
      cells.push(`<div class="cal-day ${d.getMonth() !== m.getMonth() ? 'other' : ''} ${isToday ? 'today' : ''}" data-day="${key}">
        <div class="cal-num">${d.getDate()}</div>${list
          .slice(0, 4)
          .map((t) => {
            const late = !t.done_at && new Date(t.due_at) < Date.now();
            return `<div class="cal-task ${t.done_at ? 'done' : late ? 'late' : t.priority}" data-task="${t.id}" title="${UI.attr(t.title)}">${UI.esc(new Date(t.due_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))} ${UI.esc(t.title)}</div>`;
          })
          .join('')}${list.length > 4 ? `<div class="small muted">+${list.length - 4}</div>` : ''}</div>`);
    }
    box.innerHTML = `<div class="cal-head"><button class="btn secondary sm" data-nav="-1">‹</button><h3>${((t) => t.charAt(0).toUpperCase() + t.slice(1))(m.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))}</h3><button class="btn secondary sm" data-nav="1">›</button><button class="btn ghost sm" data-nav="0">Hoje</button></div>
      <div class="cal-grid">${['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((d) => `<div class="cal-wd">${d}</div>`).join('')}${cells.join('')}</div>
      <p class="muted small">Clique em um dia para criar uma tarefa nele. Tarefas sem prazo aparecem só na lista.</p>`;
    box.querySelector('.cal-head').onclick = (e) => {
      const n = e.target.closest('[data-nav]')?.dataset.nav;
      if (n === undefined) return;
      const now = new Date();
      this.month =
        n === '0'
          ? new Date(now.getFullYear(), now.getMonth(), 1)
          : new Date(m.getFullYear(), m.getMonth() + Number(n), 1);
      this.calendar();
    };
    box.querySelector('.cal-grid').onclick = (e) => {
      const task = e.target.closest('[data-task]');
      if (task)
        return this.form({ task: this.tasks.find((t) => t.id === Number(task.dataset.task)) }, () => this.list());
      const day = e.target.closest('[data-day]');
      if (day) this.form({ due_at: new Date(`${day.dataset.day}T09:00`).toISOString() }, () => this.list());
    };
  },

  form({ task, customer_id, customer_name, ticket_id, opportunity_id, assignee_id, due_at } = {}, onSaved) {
    const isEdit = Boolean(task);
    const m = UI.modal({
      title: isEdit ? 'Editar tarefa' : 'Nova tarefa',
      body: `<form id="taskForm">
      ${UI.field('title', 'Título', UI.input('title', task?.title, 'required'), { required: true })}
      ${UI.field('description', 'Descrição', UI.textarea('description', task?.description, 'data-type="nullable"'))}
      <div class="form-row cols-3">${UI.field('assignee_id', 'Responsável', UI.select('assignee_id', UI.userOptions(CRM.users, { filter: CRM.isManager() ? null : (u) => u.id === CRM.user.id }), task ? task.assignee_id : assignee_id || CRM.user.id, 'data-type="int"'))}
        ${UI.field('due_at', 'Prazo', `<input type="datetime-local" name="due_at" value="${UI.toLocalInput(task ? task.due_at : due_at)}">`)}${UI.field(
          'priority',
          'Prioridade',
          UI.select(
            'priority',
            [
              ['baixa', 'Baixa'],
              ['normal', 'Normal'],
              ['alta', 'Alta'],
            ],
            task?.priority || 'normal',
          ),
        )}</div>
      ${customer_name || task?.customer_name ? `<p class="muted small">Vinculada ao cliente <strong>${UI.esc(customer_name || task.customer_name)}</strong>${ticket_id || task?.ticket_protocol ? ' e ao atendimento' : ''}${opportunity_id || task?.opportunity_title ? ' e à oportunidade' : ''}.</p>` : `${UI.field('customer_id', 'Cliente (opcional)', `<input id="custSearch" placeholder="Digite para buscar..." autocomplete="off"><input type="hidden" name="customer_id" data-type="int"><div class="search-results" id="custResults" hidden style="position:relative"></div>`)}`}
      ${!isEdit && customer_id ? `<input type="hidden" name="customer_id" value="${customer_id}" data-type="int">` : ''}${!isEdit && ticket_id ? `<input type="hidden" name="ticket_id" value="${ticket_id}" data-type="int">` : ''}${!isEdit && opportunity_id ? `<input type="hidden" name="opportunity_id" value="${opportunity_id}" data-type="int">` : ''}</form>`,
      footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="taskForm">${isEdit ? 'Salvar' : 'Criar tarefa'}</button>`,
    });
    const form = m.el.querySelector('#taskForm');
    const cs = form.querySelector('#custSearch');
    if (cs) CRM.pages.tickets.customerPicker(cs, form.querySelector('#custResults'), form.customer_id, m);
    form.onsubmit = async (e) => {
      e.preventDefault();
      const d = UI.formData(form);
      if (d.customer_id === null || d.customer_id === '') delete d.customer_id;
      try {
        const r = isEdit
          ? await api(`/tasks/${task.id}`, { method: 'PUT', body: d })
          : await api('/tasks', { method: 'POST', body: d });
        UI.ok(r.message);
        m.close();
        if (onSaved) onSaved(r.task);
      } catch (err) {
        UI.showErrors(form, err);
      }
    };
  },
};
