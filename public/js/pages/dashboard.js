'use strict';
CRM.pages.dashboard = {
  async render(el) {
    this.el = el;
    const [rep, tasks, queue, mine] = await Promise.all([
      api('/reports/summary'), api('/tasks', { query: { view: 'today' } }),
      api('/tickets', { query: { queue: 'true', limit: 8 } }), api('/tickets', { query: { mine: 'true', open: 'true', limit: 8 } }),
    ]);
    const t = rep.tickets, o = rep.opportunities;
    const hasData = t.opened || o.open || o.decided || tasks.tasks.length;
    el.innerHTML = CRM.pageHeader('Dashboard', `Visão geral de ${new Date().toLocaleDateString('pt-BR')}. Indicadores calculados a partir dos registros reais.`,
      `<a class="btn secondary" href="#/atendimentos?novo=1">Abrir atendimento</a><a class="btn" href="#/clientes?novo=1">Novo cliente</a>`) +
    `<div class="grid cols-4 mb">
      ${kpi('Em espera', t.waiting, 'aguardando atendimento', t.waiting ? 'warn' : '')}
      ${kpi('Abertos', t.open, 'em andamento no total')}
      ${kpi('Resolvidos', t.resolved, 'no total', 'ok')}
      ${kpi('Tarefas atrasadas', rep.tasks.overdue, CRM.isManager() ? 'da equipe' : 'suas', rep.tasks.overdue ? 'danger' : '')}
      ${kpi('1ª resposta (média)', UI.fmtDuration(t.avg_first_response_s), t.first_response_samples ? `${t.first_response_samples} atendimento(s)` : 'sem dados suficientes')}
      ${kpi('Resolução (média)', UI.fmtDuration(t.avg_resolution_s), t.resolved ? `${t.resolved} resolvido(s)` : 'sem dados suficientes')}
      ${kpi('Oportunidades abertas', o.open, UI.fmtMoney(o.open_value))}
      ${kpi('Conversão', o.conversion == null ? '—' : Math.round(o.conversion * 100) + '%', o.decided ? `${o.won} ganhos / ${o.lost} perdidos` : 'sem negócios encerrados', o.conversion != null ? 'ok' : '')}
    </div>
    ${!hasData ? `<div class="card"><div class="empty"><strong>Ainda não há dados para exibir</strong>Comece cadastrando um cliente e abrindo o primeiro atendimento.</div><div class="ql"><a href="#/clientes?novo=1">+ Cadastrar cliente</a><a href="#/atendimentos?novo=1">+ Abrir atendimento</a><a href="#/configuracoes">Configurar empresa e equipe</a></div></div>` : ''}
    <div class="grid cols-2">
      <div class="card"><div class="card-title"><h3>Fila de espera</h3><a href="#/atendimentos?status=aguardando" class="small">Ver todos (${queue.total})</a></div>${ticketList(queue.tickets, 'Fila vazia', 'Nenhum atendimento aguardando.')}</div>
      <div class="card"><div class="card-title"><h3>Meus atendimentos em andamento</h3><a href="#/atendimentos?mine=1" class="small">Ver todos (${mine.total})</a></div>${ticketList(mine.tickets, 'Nada em andamento', 'Assuma um atendimento da fila para começar.')}</div>
      <div class="card"><div class="card-title"><h3>Tarefas de hoje</h3><a href="#/tarefas" class="small">Ver tarefas</a></div>
        ${tasks.tasks.length ? `<table><tbody>${tasks.tasks.slice(0, 8).map((x) => `<tr><td><a href="#/tarefas">${UI.esc(x.title)}</a>${x.customer_name ? `<div class="muted small">${UI.esc(x.customer_name)}</div>` : ''}</td><td class="nowrap small">${UI.fmtDateTime(x.due_at)}</td><td>${UI.priorityBadge(x.priority)}</td></tr>`).join('')}</tbody></table>` : UI.empty('Sem tarefas para hoje', tasks.summary.overdue ? `Atenção: ${tasks.summary.overdue} tarefa(s) atrasada(s).` : '')}</div>
      <div class="card"><div class="card-title"><h3>Atendimentos por responsável</h3><a href="#/relatorios" class="small">Relatórios</a></div>
        ${rep.by_assignee.length ? `<div class="hbar-list">${rep.by_assignee.slice(0, 10).map((r) => { const max = rep.by_assignee[0].total; return `<div class="row"><span class="nowrap" style="overflow:hidden;text-overflow:ellipsis">${UI.esc(r.name)}</span><div class="bar"><span style="width:${Math.round((r.total / max) * 100)}%"></span></div><span class="right">${r.total}</span></div>`; }).join('')}</div>` : UI.empty('Sem dados', 'Nenhum atendimento registrado.')}</div>
    </div>`;
    function kpi(label, value, sub, cls = '') { return `<div class="kpi ${cls}"><div class="label">${label}</div><div class="value">${value ?? 0}</div><div class="sub">${sub || ''}</div></div>`; }
    function ticketList(list, et, es) {
      if (!list.length) return UI.empty(et, es);
      return `<table><tbody>${list.map((x) => `<tr class="clickable" data-href="#/atendimentos/${x.id}"><td><span class="mono small">${UI.esc(x.protocol)}</span><div>${UI.esc(x.subject)}</div><div class="muted small">${UI.esc(x.customer_name)}${x.assignee_name ? ` · ${UI.esc(x.assignee_name)}` : ''}</div></td><td>${UI.priorityBadge(x.priority)}</td><td class="small nowrap muted">${UI.relative(x.opened_at)}</td></tr>`).join('')}</tbody></table>`;
    }
  },
  onRealtime() { if (location.hash === '#/' || location.hash === '') this.render(this.el); },
};
