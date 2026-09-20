'use strict';
CRM.pages.reports = {
  async render(el, { query }) {
    this.el = el; this.query = query;
    const s = await CRM.settingsFull();
    const sources = s ? s.settings.contact_sources : [], channels = s ? s.settings.channels : [];
    const today = new Date(), first = new Date(today.getFullYear(), today.getMonth(), 1);
    const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const q = { from: query.from ?? iso(first), to: query.to ?? iso(today), assignee_id: query.assignee_id || '', source: query.source || '', channel: query.channel || '', status: query.status || '' };
    const preset = (days) => { const t = new Date(), f = new Date(); f.setDate(f.getDate() - days + 1); return `#/relatorios?${UI.qs({ ...q, from: iso(f), to: iso(t) })}`; };
    el.innerHTML = CRM.pageHeader('Relatórios', 'Indicadores de atendimento e comerciais calculados a partir dos registros.', `<button class="btn secondary" id="btnExport">${UI.icons.download} <span class="lbl">Por responsável (CSV)</span></button><button class="btn secondary" id="btnExportT">${UI.icons.download} <span class="lbl">Atendimentos (CSV)</span></button>`) +
    `<div class="card"><div class="chips mb-s"><a class="chip" href="${preset(1)}">Hoje</a><a class="chip" href="${preset(7)}">7 dias</a><a class="chip" href="${preset(30)}">30 dias</a><a class="chip" href="#/relatorios">Mês atual</a><a class="chip" href="#/relatorios?from=&to=">Todo o período</a></div>
    <form class="filters" id="filters"><div class="field"><label>De</label><input type="date" name="from" value="${q.from}"></div><div class="field"><label>Até</label><input type="date" name="to" value="${q.to}"></div>
      ${CRM.isManager() ? `<div class="field"><label>Atendente</label>${UI.select('assignee_id', UI.userOptions(CRM.users, { blank: 'Todos' }), q.assignee_id)}</div>` : ''}
      <div class="field"><label>Origem do cliente</label>${UI.select('source', [['', 'Todas'], ...sources.map((x) => [x, x])], q.source)}</div>
      <div class="field"><label>Canal</label>${UI.select('channel', [['', 'Todos'], ...channels.map((x) => [x, x])], q.channel)}</div>
      <div class="field"><label>Status</label>${UI.select('status', [['', 'Todos'], ...Object.entries(UI.STATUS).map(([k, v]) => [k, v.label])], q.status)}</div>
      <button class="btn">Aplicar</button></form></div><div id="out" class="mt"><p class="muted">Calculando…</p></div>`;
    el.querySelector('#filters').onsubmit = (e) => { e.preventDefault(); const d = UI.formData(e.target); location.hash = `#/relatorios?${UI.qs(d)}`; };
    const qs = UI.qs(q);
    el.querySelector('#btnExport').onclick = () => UI.download(`/reports/export.csv?${qs}`);
    el.querySelector('#btnExportT').onclick = () => UI.download(`/tickets/export.csv?from=${q.from}&to=${q.to}`);
    const r = await api('/reports/summary', { query: q });
    const t = r.tickets, o = r.opportunities, out = el.querySelector('#out'), m = r.methodology;
    const period = q.from || q.to ? `${q.from ? 'de ' + UI.fmtDate(q.from + 'T12:00:00') : ''} ${q.to ? 'até ' + UI.fmtDate(q.to + 'T12:00:00') : ''}` : 'todo o período';
    if (!t.opened && !o.open && !o.decided) { out.innerHTML = `<div class="card">${UI.empty('Sem dados para o período selecionado', `Nenhum atendimento ou oportunidade encontrado ${period}. Amplie o período ou remova filtros.`)}</div>`; return; }
    const kpi = (l, v, sub = '', cls = '', help = '') => `<div class="kpi ${cls}"><div class="label">${l}${help ? UI.help(help) : ''}</div><div class="value">${v}</div><div class="sub">${sub}</div></div>`;
    const hbars = (rows, labelKey, valueKey, fmt = (x) => x) => { if (!rows.length) return UI.empty('Sem dados', ''); const max = Math.max(...rows.map((x) => Number(x[valueKey]))) || 1; return `<div class="hbar-list">${rows.map((x) => `<div class="row"><span class="trunc" title="${UI.attr(x[labelKey])}">${UI.esc(x[labelKey])}</span><div class="bar"><span style="width:${Math.round((Number(x[valueKey]) / max) * 100)}%"></span></div><span class="right">${fmt(x[valueKey])}</span></div>`).join('')}</div>`; };
    out.innerHTML = `<p class="muted small">Período: ${period} ${UI.help(m.period)}. Atendimentos abertos no período: <strong>${t.opened}</strong>.</p>
      <h3>Atendimento</h3><div class="kpi-row mb">${kpi('Em andamento', t.open, 'situação atual dos abertos no período')}${kpi('Em espera', t.waiting, '', t.waiting ? 'warn' : '')}${kpi('Resolvidos', t.resolved, 'encerrados no período', 'ok')}${kpi('Cancelados', t.cancelled)}
        ${kpi('Tempo médio 1ª resposta', UI.fmtDuration(t.avg_first_response_s), t.first_response_samples ? `${t.first_response_samples} amostra(s)` : 'dados insuficientes', '', m.first_response)}${kpi('Tempo médio de resolução', UI.fmtDuration(t.avg_resolution_s), t.resolved ? `${t.resolved} resolvido(s)` : 'dados insuficientes', '', m.resolution)}${kpi('Tarefas atrasadas', r.tasks.overdue, 'situação atual', r.tasks.overdue ? 'danger' : '')}${kpi('Aguardando cliente', t.waiting_customer)}</div>
      <div class="grid cols-2 mb"><div class="card"><h3>Por responsável</h3>${t.opened ? `<div class="table-wrap"><table><thead><tr><th>Responsável</th><th class="num">Total</th><th class="num">Abertos</th><th class="num">Resolvidos</th></tr></thead><tbody>${r.by_assignee.map((x) => `<tr><td>${UI.esc(x.name)}</td><td class="num">${x.total}</td><td class="num">${x.open}</td><td class="num">${x.resolved}</td></tr>`).join('')}</tbody></table></div>` : UI.empty('Sem dados', '')}</div>
        <div class="card"><h3>Por status</h3>${hbars(r.by_status, 'label', 'n')}<h3 class="mt">Por canal</h3>${hbars(r.by_channel, 'channel', 'n')}<h3 class="mt">Por origem do cliente</h3>${hbars(r.by_source, 'source', 'n')}</div></div>
      <h3>Comercial</h3><div class="kpi-row mb">${kpi('Oportunidades abertas', o.open, UI.fmtMoney(o.open_value))}${kpi('Negócios ganhos', o.won, UI.fmtMoney(o.won_value), 'ok')}${kpi('Negócios perdidos', o.lost, '', o.lost ? 'danger' : '')}${kpi('Taxa de conversão', o.conversion == null ? '—' : Math.round(o.conversion * 100) + '%', o.decided ? `${o.won} de ${o.decided} encerrados` : 'sem negócios encerrados no período', '', m.conversion)}</div>
      <div class="grid cols-2 mb"><div class="card"><h3>Por etapa</h3>${hbars(o.by_stage, 'name', 'n')}</div><div class="card"><h3>Motivos de perda</h3>${o.lost ? hbars(o.lost_reasons, 'reason', 'n') : UI.empty('Nenhuma perda registrada', '')}</div></div>
      <details class="card"><summary>Como os indicadores são calculados</summary><ul class="small mt-s">${Object.values(m).map((x) => `<li>${UI.esc(x)}</li>`).join('')}</ul></details>`;
  },
};
