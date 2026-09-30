'use strict';
const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
};
CRM.pages.dashboard = {
  async render(el) {
    this.el = el;
    const [rep, tasks, queue, mine, dash] = await Promise.all([
      api('/reports/summary'),
      api('/tasks', { query: { view: 'today' } }),
      api('/tickets', { query: { queue: 'true', limit: 8 } }),
      api('/tickets', { query: { mine: 'true', open: 'true', limit: 8 } }),
      api('/reports/dashboard'),
    ]);
    const pf = dash.performance;
    const onboarding = this.onboardingHtml(dash.onboarding);
    const t = rep.tickets,
      o = rep.opportunities;
    const hasData = t.opened || o.open || o.decided || tasks.tasks.length;
    el.innerHTML =
      CRM.pageHeader(
        'Dashboard',
        `${greeting()}, ${CRM.user.name.split(' ')[0]}. Resumo de ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}.`,
        `<a class="btn secondary" href="#/atendimentos?novo=1">Abrir atendimento</a><a class="btn" href="#/clientes?novo=1">Novo cliente</a>`,
      ) +
      onboarding +
      `<div class="grid cols-4 mb">
      ${kpi('Em espera', t.waiting, 'aguardando atendimento', t.waiting ? 'warn' : '', 'hourglass')}
      ${kpi('Abertos', t.open, 'em andamento no total', '', 'tickets')}
      ${kpi('Resolvidos', t.resolved, `no total · ${pf.resolved_month} no mês`, 'ok', 'check', trend(pf.resolved_month, pf.resolved_prev))}
      ${kpi('Tarefas atrasadas', rep.tasks.overdue, CRM.isManager() ? 'da equipe' : 'suas', rep.tasks.overdue ? 'danger' : '', 'alert')}
      ${kpi('1ª resposta (média)', UI.fmtDuration(t.avg_first_response_s), t.first_response_samples ? `${t.first_response_samples} atendimento(s)` : 'sem dados suficientes', '', 'zap', trend(pf.avg_first_response_s, pf.avg_first_response_prev_s, true))}
      ${kpi('Resolução (média)', UI.fmtDuration(t.avg_resolution_s), t.resolved ? `${t.resolved} resolvido(s)` : 'sem dados suficientes', '', 'clock', trend(pf.avg_resolution_s, pf.avg_resolution_prev_s, true))}
      ${kpi('Oportunidades abertas', o.open, UI.fmtMoney(o.open_value), '', 'money')}
      ${kpi('Conversão', o.conversion == null ? '—' : Math.round(o.conversion * 100) + '%', o.decided ? `${o.won} ganhos / ${o.lost} perdidos` : 'sem negócios encerrados', o.conversion != null ? 'ok' : '', 'target', trend(pf.conversion, pf.conversion_prev))}
    </div>
    <div class="grid cols-2 mb">${this.performanceHtml(pf)}${this.funnelHtml(dash.funnel)}</div>
    <div class="grid cols-2 mb">${this.activityHtml(dash.activity)}${CRM.isManager() ? this.rankingHtml(dash.ranking) : ''}</div>
    ${!hasData && !onboarding ? `<div class="card"><div class="empty"><strong>Ainda não há dados para exibir</strong>Comece cadastrando um cliente e abrindo o primeiro atendimento.</div><div class="ql"><a href="#/clientes?novo=1">+ Cadastrar cliente</a><a href="#/atendimentos?novo=1">+ Abrir atendimento</a><a href="#/configuracoes">Configurar empresa e equipe</a></div></div>` : ''}
    <div class="grid cols-2">
      <div class="card"><div class="card-title"><h3>Fila de espera</h3><a href="#/atendimentos?status=aguardando" class="small">Ver todos (${queue.total})</a></div>${ticketList(queue.tickets, 'Fila vazia', 'Nenhum atendimento aguardando.')}</div>
      <div class="card"><div class="card-title"><h3>Meus atendimentos em andamento</h3><a href="#/atendimentos?mine=1" class="small">Ver todos (${mine.total})</a></div>${ticketList(mine.tickets, 'Nada em andamento', 'Assuma um atendimento da fila para começar.')}</div>
      <div class="card"><div class="card-title"><h3>Tarefas de hoje</h3><a href="#/tarefas" class="small">Ver tarefas</a></div>
        ${
          tasks.tasks.length
            ? `<table><tbody>${tasks.tasks
                .slice(0, 8)
                .map(
                  (x) =>
                    `<tr><td><a href="#/tarefas">${UI.esc(x.title)}</a>${x.customer_name ? `<div class="muted small">${UI.esc(x.customer_name)}</div>` : ''}</td><td class="nowrap small">${UI.fmtDateTime(x.due_at)}</td><td>${UI.priorityBadge(x.priority)}</td></tr>`,
                )
                .join('')}</tbody></table>`
            : UI.empty(
                'Sem tarefas para hoje',
                tasks.summary.overdue ? `Atenção: ${tasks.summary.overdue} tarefa(s) atrasada(s).` : '',
              )
        }</div>
      <div class="card"><div class="card-title"><h3>Atendimentos por responsável</h3><a href="#/relatorios" class="small">Relatórios</a></div>
        ${
          rep.by_assignee.length
            ? `<div class="hbar-list">${rep.by_assignee
                .slice(0, 10)
                .map((r) => {
                  const max = rep.by_assignee[0].total;
                  return `<div class="row"><span class="nowrap" style="overflow:hidden;text-overflow:ellipsis">${UI.esc(r.name)}</span><div class="bar"><span style="width:${Math.round((r.total / max) * 100)}%"></span></div><span class="right">${r.total}</span></div>`;
                })
                .join('')}</div>`
            : UI.empty('Sem dados', 'Nenhum atendimento registrado.')
        }</div>
    </div>`;
    function kpi(label, value, sub, cls = '', icon = '', tr = '') {
      return `<div class="kpi ${cls}"><div class="label">${label}</div>${icon ? `<div class="kpi-icon">${UI.icons[icon]}</div>` : ''}<div class="value">${value ?? 0}</div><div class="sub">${sub || ''}</div>${tr}</div>`;
    }
    // Comparação com o mês anterior; só aparece quando há dados nos dois meses
    function trend(cur, prev, lowerIsBetter = false) {
      if (cur == null || prev == null || !prev) return '';
      const pct = Math.round(((cur - prev) / prev) * 100);
      if (!pct) return '<div class="trend flat">= mês anterior</div>';
      const good = lowerIsBetter ? pct < 0 : pct > 0;
      return `<div class="trend ${good ? 'up' : 'down'}">${pct > 0 ? '▲' : '▼'} ${Math.abs(pct)}% vs. mês anterior</div>`;
    }
    const dismiss = el.querySelector('#onbDismiss');
    if (dismiss)
      dismiss.onclick = () => {
        this.setOnboardingHidden(true);
        el.querySelector('.onboarding').remove();
      };
    function ticketList(list, et, es) {
      if (!list.length) return UI.empty(et, es);
      return `<table><tbody>${list.map((x) => `<tr class="clickable" data-href="#/atendimentos/${x.id}"><td><span class="mono small">${UI.esc(x.protocol)}</span><div>${UI.esc(x.subject)}</div><div class="muted small">${UI.esc(x.customer_name)}${x.assignee_name ? ` · ${UI.esc(x.assignee_name)}` : ''}</div></td><td>${UI.priorityBadge(x.priority)}</td><td class="small nowrap muted">${UI.relative(x.opened_at)}</td></tr>`).join('')}</tbody></table>`;
    }
  },
  // ---------- Primeiros passos ----------
  onbKey() {
    return `crm.onboarding.${CRM.company ? CRM.company.id : ''}`;
  },
  setOnboardingHidden(v) {
    try {
      localStorage.setItem(this.onbKey(), v ? 'hidden' : '');
    } catch (_) {
      /* sem armazenamento: some só nesta visita */
    }
  },
  onboardingHtml(o) {
    if (!o) return '';
    let hidden = false;
    try {
      hidden = localStorage.getItem(this.onbKey()) === 'hidden';
    } catch (_) {
      hidden = false;
    }
    const steps = [
      [o.company, 'Configurar a empresa', 'Nome, logotipo e cores', '#/configuracoes/empresa'],
      [o.users, 'Cadastrar a equipe', 'Convide quem vai atender', '#/configuracoes/usuarios'],
      [o.customer, 'Cadastrar o primeiro cliente', 'Ou conecte o WhatsApp e eles chegam sozinhos', '#/clientes?novo=1'],
      [o.ticket, 'Abrir o primeiro atendimento', 'Com protocolo e prioridade', '#/atendimentos?novo=1'],
      [o.opportunity, 'Criar a primeira oportunidade', 'Acompanhe as vendas no funil', '#/funil'],
    ];
    const done = steps.filter(([ok]) => ok).length;
    if (hidden || done === steps.length) return '';
    const pct = Math.round((done / steps.length) * 100);
    return `<div class="card onboarding mb"><div class="flex between wrap"><div class="flex">${UI.icons.rocket}<div><h3>Primeiros passos</h3><p class="small muted">${done} de ${steps.length} concluídos. Nada é obrigatório: use o CRM como preferir.</p></div></div>
      <button class="btn ghost sm" id="onbDismiss">Ocultar</button></div>
      <div class="progress"><span style="width:${pct}%"></span></div><div class="small muted right">${pct}%</div>
      <div class="onb-steps">${steps
        .map(
          ([ok, t, d, href], i) =>
            `<a class="onb-step ${ok ? 'done' : ''}" href="${href}"><span class="onb-num">${ok ? '✓' : i + 1}</span><span><strong>${t}</strong><span class="small muted">${d}</span></span></a>`,
        )
        .join('')}</div></div>`;
  },

  // ---------- Desempenho de atendimento ----------
  performanceHtml(pf) {
    const cell = (label, v) =>
      `<div class="perf-cell"><span class="small muted">${label}</span><strong>${v}</strong></div>`;
    return `<div class="card"><div class="card-title"><h3>Desempenho de atendimento</h3><a href="#/relatorios" class="small">Relatórios</a></div>
      <div class="perf-grid">${cell('Hoje', pf.today)}${cell('Nesta semana', pf.week)}${cell('Neste mês', pf.month)}${cell('1ª resposta no mês', UI.fmtDuration(pf.avg_first_response_s))}</div>
      <p class="small muted mt">Atendimentos abertos no período${CRM.isManager() ? ' pela equipe' : ' atribuídos a você'}. Mês anterior: ${pf.prev_month}.</p></div>`;
  },

  // ---------- Funil de vendas ----------
  funnelHtml(stages) {
    const open = stages.filter((s) => s.kind !== 'lost');
    const max = Math.max(1, ...open.map((s) => s.n));
    const total = open.reduce((a, s) => a + s.n, 0);
    return `<div class="card"><div class="card-title"><h3>Funil de vendas</h3><a href="#/funil" class="small">Abrir funil</a></div>
      ${
        total
          ? `<div class="funnel">${open
              .map(
                (s) =>
                  `<div class="funnel-row ${s.kind}"><span class="funnel-name">${UI.esc(s.name)}${s.kind === 'won' ? ' <span class="muted small">(no mês)</span>' : ''}</span>
                  <div class="funnel-bar"><span style="width:${Math.max(4, Math.round((s.n / max) * 100))}%"></span></div>
                  <span class="funnel-num"><strong>${s.n}</strong><span class="small muted">${UI.fmtMoney(s.value)}</span></span></div>`,
              )
              .join('')}</div>`
          : UI.empty('Funil vazio', 'Crie uma oportunidade ou conecte o WhatsApp para os contatos entrarem sozinhos.')
      }</div>`;
  },

  // ---------- Atividade recente ----------
  ACTIVITY: {
    customer_created: ['user', 'Novo cliente'],
    ticket_opened: ['tickets', 'Atendimento aberto'],
    ticket_resolved: ['check', 'Atendimento resolvido'],
    task_created: ['tasks', 'Tarefa criada'],
    stage_changed: ['pipeline', 'Mudança de etapa'],
  },
  activityHtml(list) {
    return `<div class="card"><div class="card-title"><h3>Atividade recente</h3></div>
      ${
        list.length
          ? `<ul class="activity">${list
              .map((a) => {
                const [icon, label] = this.ACTIVITY[a.kind] || ['activity', a.kind];
                return `<li><a href="${UI.attr(a.href)}"><span class="act-icon ${a.kind}">${UI.icons[icon]}</span><span class="act-main"><span class="small muted">${label}${a.kind.startsWith('ticket') && a.detail ? ` · <span class="mono">${UI.esc(a.detail)}</span>` : ''}</span><strong>${UI.esc(a.title)}</strong>${a.kind === 'stage_changed' ? `<span class="small muted">${UI.esc(a.detail || '')}</span>` : ''}</span><span class="small muted nowrap">${UI.relative(a.at)}</span></a></li>`;
              })
              .join('')}</ul>`
          : UI.empty('Nada por aqui ainda', 'As novidades de clientes, atendimentos, tarefas e funil aparecem aqui.')
      }</div>`;
  },

  // ---------- Ranking operacional (gestores) ----------
  rankingHtml(rows) {
    return `<div class="card"><div class="card-title"><h3>Atendimentos por pessoa no mês</h3></div>
      ${
        rows.length
          ? `<div class="table-wrap"><table><thead><tr><th>Pessoa</th><th class="right">Atendidos</th><th class="right">Resolvidos</th><th class="right">1ª resposta</th></tr></thead><tbody>${rows
              .map(
                (r) =>
                  `<tr><td><span class="flex"><span class="avatar sm">${UI.esc(UI.initials(r.name))}</span>${UI.esc(r.name)}</span></td><td class="right">${r.handled}</td><td class="right">${r.resolved}</td><td class="right">${UI.fmtDuration(r.avg_first_response_s)}</td></tr>`,
              )
              .join('')}</tbody></table></div>`
          : UI.empty(
              'Sem atendimentos no mês',
              'Os números da equipe aparecem aqui conforme os atendimentos acontecem.',
            )
      }</div>`;
  },

  onRealtime() {
    if (location.hash === '#/' || location.hash === '') this.render(this.el);
  },
};
