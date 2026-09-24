'use strict';
CRM.pages.reports = {
  async render(el, { query }) {
    this.el = el;
    this.query = query;
    const s = await api('/settings').catch(() => null);
    const sources = s ? s.settings.contact_sources : [],
      channels = s ? s.settings.channels : [];
    const today = new Date(),
      first = new Date(today.getFullYear(), today.getMonth(), 1);
    const iso = (d) => d.toISOString().slice(0, 10);
    const q = {
      from: query.from ?? iso(first),
      to: query.to ?? iso(today),
      assignee_id: query.assignee_id || '',
      source: query.source || '',
      channel: query.channel || '',
      status: query.status || '',
      customer: query.customer || '',
    };
    const iso2 = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const back = (days) => iso2(new Date(today.getFullYear(), today.getMonth(), today.getDate() - days));
    const presets = [
      ['Hoje', iso2(today), iso2(today)],
      ['7 dias', back(6), iso2(today)],
      ['30 dias', back(29), iso2(today)],
      ['Este mês', iso2(first), iso2(today)],
      [
        'Mês passado',
        iso2(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        iso2(new Date(today.getFullYear(), today.getMonth(), 0)),
      ],
    ];
    el.innerHTML =
      CRM.pageHeader(
        'Relatórios',
        'Indicadores de atendimento e comercial calculados a partir dos registros.',
        '<button class="btn secondary" id="btnExport">Exportar CSV (por responsável)</button><button class="btn secondary" id="btnExportT">Exportar atendimentos</button>',
      ) +
      `<div class="chips mb" id="presets">${presets.map(([l, a, b]) => `<button data-from="${a}" data-to="${b}" class="${q.from === a && q.to === b ? 'active' : ''}">${l}</button>`).join('')}</div>
      <form class="filters" id="filters"><div class="field"><label>De</label><input type="date" name="from" value="${q.from}"></div><div class="field"><label>Até</label><input type="date" name="to" value="${q.to}"></div>
      ${CRM.isManager() ? `<div class="field"><label>Atendente</label>${UI.select('assignee_id', UI.userOptions(CRM.users, { blank: 'Todos' }), q.assignee_id)}</div>` : ''}
      <div class="field"><label>Origem do cliente</label>${UI.select('source', [['', 'Todas'], ...sources.map((x) => [x, x])], q.source)}</div>
      <div class="field"><label>Canal</label>${UI.select('channel', [['', 'Todos'], ...channels.map((x) => [x, x])], q.channel)}</div>
      <div class="field"><label>Status</label>${UI.select('status', [['', 'Todos'], ...Object.entries(UI.STATUS).map(([k, v]) => [k, v.label])], q.status)}</div>
      <div class="field"><label>Cliente</label><input name="customer" value="${UI.attr(q.customer)}" placeholder="Nome do cliente"></div>
      <button class="btn">Aplicar</button><button type="button" class="btn ghost" id="clearBtn">Limpar período</button></form><div id="out"><p class="muted">Calculando...</p></div>`;
    el.querySelector('#filters').onsubmit = (e) => {
      e.preventDefault();
      const d = UI.formData(e.target);
      const qs = new URLSearchParams();
      Object.entries(d).forEach(([k, v]) => {
        if (v) qs.set(k, v);
      });
      location.hash = `#/relatorios?${qs}`;
    };
    el.querySelector('#presets').onclick = (e) => {
      const b = e.target.closest('[data-from]');
      if (!b) return;
      const qs2 = new URLSearchParams(
        Object.entries({ ...q, from: b.dataset.from, to: b.dataset.to }).filter(([, v]) => v),
      );
      location.hash = `#/relatorios?${qs2}`;
    };
    el.querySelector('#clearBtn').onclick = () => {
      location.hash = '#/relatorios?from=&to=';
    };
    const qs = new URLSearchParams(Object.entries(q).filter(([, v]) => v)).toString();
    el.querySelector('#btnExport').onclick = () => UI.download(`/reports/export.csv?${qs}`);
    el.querySelector('#btnExportT').onclick = () => UI.download(`/tickets/export.csv?from=${q.from}&to=${q.to}`);
    const r = await api('/reports/summary', { query: q });
    const t = r.tickets,
      o = r.opportunities,
      out = el.querySelector('#out');
    const period =
      q.from || q.to
        ? `${q.from ? 'de ' + UI.fmtDate(q.from + 'T12:00:00') : ''} ${q.to ? 'até ' + UI.fmtDate(q.to + 'T12:00:00') : ''}`
        : 'todo o período';
    if (!t.opened && !o.open && !o.decided && !r.totals.customers_created && !r.totals.tasks_done) {
      out.innerHTML = `<div class="card">${UI.empty('Sem dados para o período selecionado', `Nenhum atendimento ou oportunidade encontrado ${period}. Amplie o período ou remova filtros.`)}</div>`;
      return;
    }
    const kpi = (l, v, sub = '', cls = '') =>
      `<div class="kpi ${cls}"><div class="label">${l}</div><div class="value">${v}</div><div class="sub">${sub}</div></div>`;
    const hbars = (rows, labelKey, valueKey, fmt = (x) => x) => {
      if (!rows.length) return UI.empty('Sem dados', '');
      const max = Math.max(...rows.map((x) => Number(x[valueKey]))) || 1;
      return `<div class="hbar-list">${rows.map((x) => `<div class="row"><span class="nowrap" style="overflow:hidden;text-overflow:ellipsis" title="${UI.attr(x[labelKey])}">${UI.esc(x[labelKey])}</span><div class="bar"><span style="width:${Math.round((Number(x[valueKey]) / max) * 100)}%"></span></div><span class="right">${fmt(x[valueKey])}</span></div>`).join('')}</div>`;
    };
    out.innerHTML = `<p class="muted small">Período: ${period}. Atendimentos abertos: <strong>${t.opened}</strong>.</p>
      <div class="grid cols-4 mb">${kpi('Total de atendimentos', t.opened, 'abertos no período')}${kpi('Clientes cadastrados', r.totals.customers_created, 'no período')}${kpi('Tarefas concluídas', r.totals.tasks_done, 'no período', 'ok')}${kpi('Conversão', o.conversion == null ? '—' : Math.round(o.conversion * 100) + '%', o.decided ? `${o.won} de ${o.decided} negócios` : 'sem negócios encerrados')}</div>
      ${this.dailyChart(r.daily)}
      <h3>Atendimentos</h3><div class="grid cols-4 mb">${kpi('Abertos (em andamento)', t.open)}${kpi('Em espera', t.waiting, '', t.waiting ? 'warn' : '')}${kpi('Resolvidos', t.resolved, 'encerrados no período', 'ok')}${kpi('Cancelados', t.cancelled)}
        ${kpi('Tempo médio 1ª resposta', UI.fmtDuration(t.avg_first_response_s), t.first_response_samples ? `${t.first_response_samples} amostra(s)` : 'dados insuficientes')}${kpi('Tempo médio de resolução', UI.fmtDuration(t.avg_resolution_s), t.resolved ? `${t.resolved} resolvido(s)` : 'dados insuficientes')}${kpi('Tarefas atrasadas', r.tasks.overdue, 'situação atual', r.tasks.overdue ? 'danger' : '')}${kpi('Aguardando cliente', t.waiting_customer)}</div>
      <div class="grid cols-2 mb"><div class="card"><h3>Por responsável</h3>${t.opened ? `<table><thead><tr><th>Responsável</th><th class="right">Total</th><th class="right">Abertos</th><th class="right">Resolvidos</th></tr></thead><tbody>${r.by_assignee.map((x) => `<tr><td>${UI.esc(x.name)}</td><td class="right">${x.total}</td><td class="right">${x.open}</td><td class="right">${x.resolved}</td></tr>`).join('')}</tbody></table>` : UI.empty('Sem dados', '')}</div>
        <div class="card"><h3>Por status</h3>${hbars(r.by_status, 'label', 'n')}<h3 class="mt">Por canal</h3>${hbars(r.by_channel, 'channel', 'n')}<h3 class="mt">Por origem do cliente</h3>${hbars(r.by_source, 'source', 'n')}</div></div>
      <h3>Comercial</h3><div class="grid cols-4 mb">${kpi('Oportunidades abertas', o.open, UI.fmtMoney(o.open_value))}${kpi('Negócios ganhos', o.won, UI.fmtMoney(o.won_value), 'ok')}${kpi('Negócios perdidos', o.lost, '', o.lost ? 'danger' : '')}${kpi('Taxa de conversão', o.conversion == null ? '—' : Math.round(o.conversion * 100) + '%', o.decided ? `${o.won} de ${o.decided} encerrados` : 'sem negócios encerrados no período')}</div>
      <div class="grid cols-2 mb"><div class="card"><h3>Por etapa</h3>${hbars(o.by_stage, 'name', 'n')}</div><div class="card"><h3>Motivos de perda</h3>${o.lost ? hbars(o.lost_reasons, 'reason', 'n') : UI.empty('Nenhuma perda registrada', '')}</div></div>
      <details class="card"><summary>Como os indicadores são calculados</summary><ul class="small mt">${Object.values(
        r.methodology,
      )
        .map((m) => `<li>${UI.esc(m)}</li>`)
        .join('')}</ul></details>`;
  },

  // Atendimentos abertos x resolvidos por dia (barras agrupadas, com dica ao passar o mouse e tabela)
  dailyChart(days) {
    if (!days || !days.length) return '';
    const total = days.reduce((a, d) => a + d.opened + d.resolved, 0);
    if (!total)
      return `<div class="card mb"><h3>Atendimentos por dia</h3>${UI.empty('Nenhum atendimento no período', 'Os dias com atendimentos abertos ou resolvidos aparecem aqui.')}</div>`;
    const W = 900,
      H = 220,
      padL = 32,
      padB = 26,
      padT = 10;
    const max = Math.max(1, ...days.map((d) => Math.max(d.opened, d.resolved)));
    const step = (W - padL) / days.length;
    const bw = Math.max(2, Math.min(14, step / 2 - 2));
    const y = (v) => padT + (H - padT - padB) * (1 - v / max);
    const ticks = [0, Math.ceil(max / 2), max];
    const fmtDay = (d) => d.slice(8, 10) + '/' + d.slice(5, 7);
    const labelEvery = Math.ceil(days.length / 12);
    const bar = (x, v, cls) => {
      if (!v) return '';
      const top = y(v),
        h = H - padB - top;
      return `<path class="${cls}" d="M${x},${H - padB} V${top + Math.min(3, h)} q0,-3 3,-3 h${bw - 6} q3,0 3,3 V${H - padB} Z"/>`;
    };
    const groups = days
      .map((d, i) => {
        const x0 = padL + i * step + step / 2 - bw - 1;
        return `<g class="day" data-i="${i}"><rect class="hit" x="${padL + i * step}" y="${padT}" width="${step}" height="${H - padT - padB}"/>
          ${bar(x0, d.opened, 's1')}${bar(x0 + bw + 2, d.resolved, 's2')}
          ${i % labelEvery === 0 ? `<text class="xl" x="${padL + i * step + step / 2}" y="${H - 8}">${fmtDay(d.day)}</text>` : ''}</g>`;
      })
      .join('');
    const html = `<div class="card mb chart-card"><div class="card-title"><h3>Atendimentos por dia</h3>
        <div class="legend"><span><i class="s1"></i>Abertos</span><span><i class="s2"></i>Resolvidos</span></div></div>
      <div class="chart-wrap"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Atendimentos abertos e resolvidos por dia">
        ${ticks.map((v) => `<line class="grid" x1="${padL}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text class="yl" x="${padL - 6}" y="${y(v) + 4}">${v}</text>`).join('')}
        ${groups}</svg><div class="chart-tip" hidden></div></div>
      <details class="mt"><summary class="small">Ver em tabela</summary><div class="table-wrap"><table class="small"><thead><tr><th>Dia</th><th class="right">Abertos</th><th class="right">Resolvidos</th></tr></thead><tbody>
        ${days.map((d) => `<tr><td>${fmtDay(d.day)}</td><td class="right">${d.opened}</td><td class="right">${d.resolved}</td></tr>`).join('')}</tbody></table></div></details></div>`;
    // A dica é ligada depois que o HTML entra na página
    setTimeout(() => {
      const card = this.el.querySelector('.chart-card');
      if (!card) return;
      const tip = card.querySelector('.chart-tip');
      const wrap = card.querySelector('.chart-wrap');
      card.querySelector('svg').onmousemove = (e) => {
        const g = e.target.closest('.day');
        if (!g) return (tip.hidden = true);
        const d = days[Number(g.dataset.i)];
        tip.innerHTML = `<strong>${fmtDay(d.day)}</strong><span><i class="s1"></i>Abertos: ${d.opened}</span><span><i class="s2"></i>Resolvidos: ${d.resolved}</span>`;
        const box = wrap.getBoundingClientRect();
        tip.style.left = `${Math.min(e.clientX - box.left + 12, box.width - 150)}px`;
        tip.style.top = `${e.clientY - box.top - 10}px`;
        tip.hidden = false;
      };
      card.querySelector('svg').onmouseleave = () => (tip.hidden = true);
    });
    return html;
  },
};
