'use strict';
// Painel do dia: primeiro o que exige ação (fila, sem resposta, prazos vencidos, oportunidades sem próxima ação),
// depois pendências pessoais (atendente) ou visão da equipe (supervisor/administrador).
CRM.pages.dashboard = {
  async render(el) {
    this.el = el;
    const mgr = CRM.isManager();
    const [d, queue, unanswered] = await Promise.all([
      api('/reports/dashboard'),
      api('/tickets', { query: { view: 'queue', limit: 6 } }),
      api('/tickets', { query: mgr ? { view: 'unanswered', limit: 6 } : { view: 'mine', limit: 6 } }),
    ]);
    const t = d.tickets, o = d.opportunities, k = d.tasks, h = d.help;
    const kpi = (label, value, sub, href, help, cls = '') => `<a class="kpi ${cls}" href="${href}"><div class="label">${label}${help ? UI.help(help) : ''}</div><div class="value">${value ?? 0}</div><div class="sub">${sub || ''}</div></a>`;
    const slaPct = t.fr_samples ? Math.round((t.fr_within_sla / t.fr_samples) * 100) : null;
    const hasData = t.open || o.open || t.resolved_today || k.today || d.my_tasks.length;
    el.innerHTML = CRM.pageHeader('Painel', `${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })} · ${mgr ? 'visão da equipe' : 'suas pendências e próximos contatos'}`,
      `<button class="btn secondary" id="btnTicket">${UI.icons.inbox} <span class="lbl">Abrir atendimento</span></button><a class="btn" href="#/clientes?novo=1">${UI.icons.userPlus} <span class="lbl">Novo cliente</span></a>`) +
    `<h4 class="mb-s">Exige ação agora</h4>
    <div class="kpi-row mb">
      ${kpi('Fila de espera', t.queue, 'sem responsável', '#/atendimentos?view=queue', h.queue, t.queue ? 'warn' : '')}
      ${kpi(mgr ? 'Clientes sem resposta' : 'Meus sem resposta', mgr ? t.unanswered : t.mine_unanswered, t.overdue ? `${t.overdue} com prazo vencido` : `prazo: ${t.sla_minutes} min`, mgr ? '#/atendimentos?view=unanswered' : '#/atendimentos?view=mine', h.unanswered, (mgr ? t.unanswered : t.mine_unanswered) ? (t.overdue ? 'danger' : 'warn') : '')}
      ${kpi('Retornos vencidos', t.follow_up_overdue, 'agendados e não feitos', '#/atendimentos?tabela=1&view=follow_up_overdue', h.follow_up_overdue, t.follow_up_overdue ? 'danger' : '')}
      ${kpi('Oportunidades sem próxima ação', o.no_next_action, o.overdue ? `${o.overdue} com prazo vencido` : 'em etapas abertas', '#/funil?no_task=true', h.no_next_action, o.no_next_action ? 'warn' : '')}
    </div>
    ${!hasData ? `<div class="card mb">${UI.empty('Ainda não há dados para exibir', 'Comece cadastrando um cliente e abrindo o primeiro atendimento.')}<div class="ql"><a href="#/clientes?novo=1">Cadastrar cliente</a><a href="#/atendimentos?novo=1">Abrir atendimento</a>${CRM.isAdmin() ? '<a href="#/configuracoes">Configurar empresa e equipe</a>' : ''}</div></div>` : ''}
    ${mgr ? this.managerBlocks(d, queue, unanswered, slaPct) : this.agentBlocks(d, queue, unanswered)}
    <h4 class="mb-s mt">Acompanhamento</h4>
    <div class="kpi-row">
      ${kpi('Conversas abertas', t.open, `${t.opened_today} aberta(s) hoje`, '#/atendimentos?view=open', 'Atendimentos com status Aguardando, Em atendimento ou Aguardando cliente. Situação atual.')}
      ${kpi('Resolvidos hoje', t.resolved_today, mgr ? 'pela equipe' : 'por você', '#/atendimentos?tabela=1&view=closed', 'Atendimentos encerrados como Resolvido com data de encerramento igual a hoje.', t.resolved_today ? 'ok' : '')}
      ${kpi('Prazo de 1ª resposta', slaPct == null ? '—' : slaPct + '%', t.fr_samples ? `${t.fr_samples} atendimento(s) · média ${UI.fmtDuration(t.avg_first_response_s)}` : 'sem dados nos últimos 30 dias', '#/relatorios', h.sla, slaPct == null ? '' : slaPct >= 80 ? 'ok' : 'warn')}
      ${kpi('Ganhos no mês', UI.fmtMoneyShort(o.won_month_value), `${o.won_month} negócio(s) · ${o.lost_month} perdido(s)`, '#/relatorios', h.won_month, o.won_month ? 'ok' : '')}
    </div>`;
    el.querySelector('#btnTicket').onclick = () => CRM.pages.tickets.form({}, (tk) => { location.hash = `#/atendimentos/${tk.id}`; });
    el.querySelectorAll('[data-task-done]').forEach((cb) => cb.onchange = async () => { try { await api(`/tasks/${cb.dataset.taskDone}`, { method: 'PUT', body: { done: true } }); UI.ok('Tarefa concluída.'); this.render(el); } catch (e) { UI.err(e); cb.checked = false; } });
  },

  ticketList(list, et, es) {
    if (!list.length) return UI.empty(et, es);
    return list.map((x) => `<a class="conv-item" href="#/atendimentos/${x.id}">${UI.avatar(x.customer_name, 'sm')}<div style="min-width:0"><div class="name">${UI.esc(x.customer_name)}</div><div class="preview">${UI.esc(x.last_message_preview || x.subject)}</div></div><div class="time">${UI.fmtShort(x.last_message_at || x.opened_at)}</div><div class="meta">${UI.channelIcon(x.channel)} ${UI.esc(x.channel)} ${x.assignee_name ? `· ${UI.esc(x.assignee_name.split(' ')[0])}` : ''} ${x.priority === 'urgente' || x.priority === 'alta' ? UI.priorityBadge(x.priority) : ''} ${CRM.pages.tickets.slaHtml(x)}</div></a>`).join('');
  },
  taskList(list) {
    if (!list.length) return UI.empty('Nada pendente até amanhã', 'Suas tarefas e retornos aparecem aqui.');
    return list.map((x) => `<div class="task-row"><input type="checkbox" data-task-done="${x.id}" aria-label="Concluir"><div><div class="t">${x.kind === 'retorno' ? `${UI.icons.calendar} ` : ''}${UI.esc(x.title)}</div><div class="s ${x.due_at && new Date(x.due_at) < Date.now() ? 'text-danger' : ''}">${x.due_at ? UI.fmtDateTime(x.due_at) : 'sem prazo'}${x.due_at && new Date(x.due_at) < Date.now() ? ' · atrasada' : ''}${x.customer_name ? ` · <a href="#/clientes/${x.customer_id}">${UI.esc(x.customer_name)}</a>` : ''}</div></div>${x.ticket_id ? `<a class="btn xs secondary" href="#/atendimentos/${x.ticket_id}">Conversa</a>` : x.opportunity_id ? `<a class="btn xs secondary" href="#/funil/${x.opportunity_id}">Negociação</a>` : ''}</div>`).join('');
  },
  contacts(list) {
    if (!list.length) return UI.empty('Nenhum retorno agendado', '');
    return list.map((x) => `<div class="task-row"><span class="dot ${new Date(x.follow_up_at) < Date.now() ? 'danger' : new Date(x.follow_up_at) - Date.now() < 86400000 ? 'warn' : 'on'}"></span><div><div class="t"><a href="#/atendimentos/${x.id}">${UI.esc(x.customer_name)}</a> <span class="muted">· ${UI.esc(x.subject)}</span></div><div class="s ${new Date(x.follow_up_at) < Date.now() ? 'text-danger' : ''}">${UI.fmtDateTime(x.follow_up_at)}${new Date(x.follow_up_at) < Date.now() ? ' · vencido' : ''}</div></div><span class="mono xs muted">${UI.esc(x.protocol)}</span></div>`).join('');
  },

  agentBlocks(d, queue, mine) {
    return `<div class="grid cols-2">
      <div class="card flush"><div class="card-title"><h3>Minhas pendências</h3><a href="#/tarefas" class="small">Todas as tarefas</a></div><div style="padding:.3rem 1rem .5rem">${this.taskList(d.my_tasks)}</div></div>
      <div class="card flush"><div class="card-title"><h3>Próximos contatos</h3><a href="#/atendimentos?tabela=1&follow_up=pending" class="small">Ver todos</a></div><div style="padding:.3rem 1rem .5rem">${this.contacts(d.next_contacts)}</div></div>
      <div class="card flush"><div class="card-title"><h3>Minhas conversas</h3><a href="#/atendimentos?view=mine" class="small">Ver todas (${d.tickets.mine_open})</a></div>${this.ticketList(mine.tickets, 'Nada em andamento', 'Assuma um atendimento da fila para começar.')}</div>
      <div class="card flush"><div class="card-title"><h3>Fila de espera</h3><a href="#/atendimentos?view=queue" class="small">Ver fila (${queue.total})</a></div>${this.ticketList(queue.tickets, 'Fila vazia', 'Nenhum atendimento aguardando.')}</div>
    </div>`;
  },

  managerBlocks(d, queue, unanswered, slaPct) {
    const team = d.team || [];
    const maxOpen = Math.max(1, ...team.map((u) => u.open));
    const o = d.opportunities;
    return `<div class="grid cols-2">
      <div class="card flush"><div class="card-title"><h3>Carga da equipe</h3><span class="small muted">${team.filter((u) => u.available).length} de ${team.length} disponíveis ${UI.help('Atendimentos abertos por atendente (situação atual) e quantos estão com o cliente aguardando resposta. Resolvidos: hoje.')}</span></div>
        ${team.length ? `<div class="table-wrap"><table><thead><tr><th>Atendente</th><th>Abertos</th><th class="num" title="Sem resposta">S/ resp.</th><th class="num" title="Resolvidos hoje">Hoje</th><th class="num" title="Tarefas atrasadas">Atras.</th></tr></thead><tbody>${team.map((u) => `<tr class="clickable" data-href="#/atendimentos?tabela=1&view=open&assignee_id=${u.id}"><td class="nowrap"><span class="dot ${u.available ? 'on' : 'off'}" title="${u.available ? 'Disponível' : 'Indisponível'}"></span> ${UI.esc(u.name)}${u.team ? ` <span class="muted xs">· ${UI.esc(u.team)}</span>` : ''}</td><td style="min-width:90px"><div class="flex"><div class="bar grow"><span style="width:${Math.round((u.open / maxOpen) * 100)}%"></span></div><span class="small">${u.open}</span></div></td><td class="num ${u.unanswered ? 'text-warning strong' : ''}">${u.unanswered}</td><td class="num">${u.resolved_today}</td><td class="num ${u.overdue_tasks ? 'text-danger strong' : ''}">${u.overdue_tasks}</td></tr>`).join('')}</tbody></table></div>` : UI.empty('Nenhum atendente ativo', 'Cadastre a equipe em Configurações › Usuários.')}</div>
      <div class="card flush"><div class="card-title"><h3>Clientes aguardando resposta</h3><a href="#/atendimentos?view=unanswered" class="small">Ver todos (${d.tickets.unanswered})</a></div>${this.ticketList(unanswered.tickets, 'Tudo respondido', 'Nenhum cliente aguardando resposta.')}</div>
      <div class="card"><div class="card-title"><h3>Prazos e resultado</h3><a href="#/relatorios" class="small">Relatórios</a></div>
        <div class="grid cols-2">
          <div><div class="small muted">Cumprimento do prazo de 1ª resposta ${UI.help(d.help.sla)}</div><div class="flex"><div class="bar grow ${slaPct == null ? '' : slaPct >= 80 ? 'success' : 'warning'}"><span style="width:${slaPct || 0}%"></span></div><strong>${slaPct == null ? '—' : slaPct + '%'}</strong></div><div class="xs muted">${d.tickets.fr_samples} atendimento(s) em 30 dias · média ${UI.fmtDuration(d.tickets.avg_first_response_s)}</div></div>
          <div><div class="small muted">Resultado comercial no mês ${UI.help(d.help.won_month)}</div><div><strong>${UI.fmtMoney(o.won_month_value)}</strong> <span class="small muted">em ${o.won_month} ganho(s)</span></div><div class="xs muted">${o.lost_month} perdido(s) · ${o.closing_week} com previsão nos próximos 7 dias</div></div>
          <div><div class="small muted">Funil aberto</div><div><strong>${UI.fmtMoney(o.open_value)}</strong> <span class="small muted">em ${o.open} oportunidade(s)</span></div><div class="xs muted"><a href="#/funil?idle_days=${o.idle_days}">${o.idle} parada(s) há mais de ${o.idle_days} dias</a> ${UI.help(d.help.idle)}</div></div>
          <div><div class="small muted">Tarefas da equipe</div><div><strong class="${d.tasks.overdue ? 'text-danger' : ''}">${d.tasks.overdue}</strong> <span class="small muted">atrasada(s) · ${d.tasks.today} para hoje</span></div><div class="xs muted"><a href="#/tarefas?view=overdue">Ver tarefas</a></div></div>
        </div></div>
      <div class="card flush"><div class="card-title"><h3>Fila de espera</h3><div class="flex"><a href="#/atendimentos?view=queue" class="small">Ver fila (${queue.total})</a></div></div>${this.ticketList(queue.tickets, 'Fila vazia', 'Nenhum atendimento aguardando.')}</div>
      <div class="card flush"><div class="card-title"><h3>Minhas pendências</h3><a href="#/tarefas" class="small">Tarefas</a></div><div style="padding:.3rem 1rem .5rem">${this.taskList(d.my_tasks)}</div></div>
      <div class="card flush"><div class="card-title"><h3>Próximos contatos da equipe</h3><a href="#/atendimentos?tabela=1&follow_up=pending" class="small">Ver todos</a></div><div style="padding:.3rem 1rem .5rem">${this.contacts(d.next_contacts)}</div></div>
    </div>`;
  },
  onRealtime() { if (location.hash === '#/' || location.hash === '') this.render(this.el); },
};
