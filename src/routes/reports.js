'use strict';
const express = require('express');
const { query } = require('../db');
const { requireAuth, isManager } = require('../middleware/auth');
const { toCsv } = require('../lib/util');
const { requireModule } = require('../lib/permissions');
const { startOfDaySql, endOfDaySql, isDateString, localDate, todaySql } = require('../lib/timezone');
const { STATUS_LABEL } = require('./tickets');

const router = express.Router();
router.use(requireAuth);

const METHODOLOGY = {
  first_response:
    'Tempo médio entre a abertura do atendimento e o registro da primeira interação de saída (resposta ao cliente). Considera apenas atendimentos abertos no período que já possuem primeira resposta.',
  resolution:
    'Tempo médio entre a abertura e o encerramento (status Resolvido) dos atendimentos encerrados no período.',
  conversion:
    'Taxa de conversão = negócios ganhos ÷ (ganhos + perdidos) entre as oportunidades encerradas no período. Oportunidades ainda abertas não entram no cálculo.',
  period:
    'Atendimentos são filtrados pela data de abertura; encerrados e negócios ganhos/perdidos pela data de encerramento; tarefas atrasadas consideram a situação atual.',
};

function buildFilters(req) {
  const p = [];
  const f = { ticket: [], opp: [], from: null, to: null };
  const q = req.query;
  const from = isDateString(q.from) ? q.from : null;
  const to = isDateString(q.to) ? q.to : null;
  f.from = from;
  f.to = to;
  let assignee = q.assignee_id ? Number(q.assignee_id) : null;
  if (!isManager(req.user)) assignee = req.user.id;
  if (assignee) {
    p.push(assignee);
    f.ticket.push(`t.assignee_id = $${p.length}`);
    f.opp.push(`o.owner_id = $${p.length}`);
  }
  if (q.source) {
    p.push(q.source);
    f.ticket.push(`c.source = $${p.length}`);
    f.opp.push(`c.source = $${p.length}`);
  }
  if (q.channel) {
    p.push(q.channel);
    f.ticket.push(`t.channel = $${p.length}`);
  }
  if (q.status) {
    p.push(q.status);
    f.ticket.push(`t.status = $${p.length}`);
  }
  if (q.customer) {
    p.push(`%${String(q.customer).trim()}%`);
    f.ticket.push(`c.name ILIKE $${p.length}`);
    f.opp.push(`c.name ILIKE $${p.length}`);
  }
  if (from) {
    p.push(from);
    f.fromIdx = p.length;
  }
  if (to) {
    p.push(to);
    f.toIdx = p.length;
  }
  return { p, f };
}

// Executa a consulta enviando apenas os parâmetros realmente referenciados no SQL (renumerados).
async function run(sql, params) {
  const used = [...new Set((sql.match(/\$(\d+)/g) || []).map((m) => Number(m.slice(1))))].sort((a, b) => a - b);
  const map = new Map(used.map((n, i) => [n, i + 1]));
  const out = sql.replace(/\$(\d+)(?!\d)/g, (m, n) => `$${map.get(Number(n))}`);
  return query(
    out,
    used.map((n) => params[n - 1]),
  );
}

const periodSql = (col, f) =>
  [
    f.fromIdx ? `${col} >= ${startOfDaySql(`$${f.fromIdx}`)}` : null,
    f.toIdx ? `${col} < ${endOfDaySql(`$${f.toIdx}`)}` : null,
  ].filter(Boolean);
const and = (arr) => (arr.length ? arr.join(' AND ') : 'TRUE');

router.get('/summary', async (req, res, next) => {
  try {
    const { p, f } = buildFilters(req);
    const tBase = `FROM tickets t JOIN customers c ON c.id = t.customer_id LEFT JOIN users u ON u.id = t.assignee_id`;
    const oBase = `FROM opportunities o JOIN customers c ON c.id = o.customer_id JOIN pipeline_stages s ON s.id = o.stage_id LEFT JOIN users u ON u.id = o.owner_id`;
    const tOpened = and([...f.ticket, ...periodSql('t.opened_at', f)]);
    const tClosed = and([...f.ticket, ...periodSql('t.closed_at', f)]);
    const oClosed = and([...f.opp, ...periodSql('o.closed_at', f)]);
    const oOpen = and([...f.opp, `s.kind = 'open'`]);
    const tickets = (
      await run(
        `SELECT
        count(*) FILTER (WHERE t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS open,
        count(*) FILTER (WHERE t.status = 'aguardando')::int AS waiting,
        count(*) FILTER (WHERE t.status = 'em_atendimento')::int AS in_progress,
        count(*) FILTER (WHERE t.status = 'aguardando_cliente')::int AS waiting_customer,
        count(*)::int AS opened,
        avg(EXTRACT(EPOCH FROM (t.first_response_at - t.opened_at))) FILTER (WHERE t.first_response_at IS NOT NULL) AS avg_first_response_s,
        count(*) FILTER (WHERE t.first_response_at IS NOT NULL)::int AS first_response_samples
      ${tBase} WHERE ${tOpened}`,
        p,
      )
    ).rows[0];
    const closed = (
      await run(
        `SELECT
        count(*) FILTER (WHERE t.status = 'resolvido')::int AS resolved,
        count(*) FILTER (WHERE t.status = 'cancelado')::int AS cancelled,
        avg(EXTRACT(EPOCH FROM (t.closed_at - t.opened_at))) FILTER (WHERE t.status = 'resolvido') AS avg_resolution_s
      ${tBase} WHERE t.closed_at IS NOT NULL AND ${tClosed}`,
        p,
      )
    ).rows[0];
    const byAssignee = (
      await run(
        `SELECT COALESCE(u.name, 'Sem responsável') AS name, t.assignee_id,
        count(*)::int AS total,
        count(*) FILTER (WHERE t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS open,
        count(*) FILTER (WHERE t.status = 'resolvido')::int AS resolved
      ${tBase} WHERE ${tOpened} GROUP BY u.name, t.assignee_id ORDER BY total DESC`,
        p,
      )
    ).rows;
    const byStatus = (
      await run(`SELECT t.status, count(*)::int AS n ${tBase} WHERE ${tOpened} GROUP BY t.status`, p)
    ).rows.map((r) => ({ status: r.status, label: STATUS_LABEL[r.status], n: r.n }));
    const byChannel = (
      await run(`SELECT t.channel, count(*)::int AS n ${tBase} WHERE ${tOpened} GROUP BY t.channel ORDER BY n DESC`, p)
    ).rows;
    const bySource = (
      await run(
        `SELECT COALESCE(c.source,'Não informada') AS source, count(*)::int AS n ${tBase} WHERE ${tOpened} GROUP BY c.source ORDER BY n DESC`,
        p,
      )
    ).rows;
    const oppsOpen = (
      await run(`SELECT count(*)::int AS n, COALESCE(sum(o.value),0)::float AS value ${oBase} WHERE ${oOpen}`, p)
    ).rows[0];
    const oppsClosed = (
      await run(
        `SELECT
        count(*) FILTER (WHERE s.kind = 'won')::int AS won, COALESCE(sum(o.value) FILTER (WHERE s.kind = 'won'),0)::float AS won_value,
        count(*) FILTER (WHERE s.kind = 'lost')::int AS lost
      ${oBase} WHERE o.closed_at IS NOT NULL AND ${oClosed}`,
        p,
      )
    ).rows[0];
    const lostReasons = (
      await run(
        `SELECT COALESCE(o.lost_reason,'Não informado') AS reason, count(*)::int AS n ${oBase}
      WHERE s.kind = 'lost' AND o.closed_at IS NOT NULL AND ${oClosed} GROUP BY o.lost_reason ORDER BY n DESC`,
        p,
      )
    ).rows;
    const byStage = (
      await run(
        `SELECT s.name, s.kind, count(*)::int AS n, COALESCE(sum(o.value),0)::float AS value ${oBase}
      WHERE ${and(f.opp)} AND (s.kind = 'open' OR ${and(periodSql('o.closed_at', f))}) GROUP BY s.name, s.kind, s.position ORDER BY s.position`,
        p,
      )
    ).rows;
    const taskParams = [];
    let taskWhere = 'done_at IS NULL AND due_at < now()';
    const assignee = isManager(req.user) ? (req.query.assignee_id ? Number(req.query.assignee_id) : null) : req.user.id;
    if (assignee) {
      taskParams.push(assignee);
      taskWhere += ` AND assignee_id = $1`;
    }
    const overdue = (await run(`SELECT count(*)::int AS n FROM tasks WHERE ${taskWhere}`, taskParams)).rows[0].n;
    // Série diária (até 92 dias) de atendimentos abertos e resolvidos, no fuso da empresa
    let daily = [];
    if (f.fromIdx && f.toIdx && (new Date(f.to) - new Date(f.from)) / 86400000 <= 92) {
      daily = (
        await run(
          `SELECT d::date AS day,
             (SELECT count(*) ${tBase} WHERE ${and(f.ticket)} AND ${localDate('t.opened_at')} = d::date)::int AS opened,
             (SELECT count(*) ${tBase} WHERE ${and(f.ticket)} AND t.status = 'resolvido' AND ${localDate('t.closed_at')} = d::date)::int AS resolved
           FROM generate_series($${f.fromIdx}::date, $${f.toIdx}::date, interval '1 day') d ORDER BY d`,
          p,
        )
      ).rows.map((r) => ({ ...r, day: r.day.toISOString().slice(0, 10) }));
    }
    const period = (col) => and(periodSql(col, f));
    // Tarefas concluídas e clientes cadastrados no período (o atendente vê só os dele)
    const who = assignee ? Number(assignee) : null;
    const tasksDone = (
      await run(
        `SELECT count(*)::int AS n FROM tasks WHERE done_at IS NOT NULL AND ${period('done_at')}${who ? ` AND assignee_id = ${who}` : ''}`,
        p,
      )
    ).rows[0].n;
    const customersCreated = (
      await run(
        `SELECT count(*)::int AS n FROM customers WHERE ${period('created_at')}${who ? ` AND owner_id = ${who}` : ''}`,
        p,
      )
    ).rows[0].n;
    const decided = oppsClosed.won + oppsClosed.lost;
    res.json({
      daily,
      totals: { tasks_done: tasksDone, customers_created: customersCreated },
      period: { from: f.from, to: f.to },
      tickets: {
        ...tickets,
        resolved: closed.resolved,
        cancelled: closed.cancelled,
        avg_first_response_s: tickets.avg_first_response_s == null ? null : Number(tickets.avg_first_response_s),
        avg_resolution_s: closed.avg_resolution_s == null ? null : Number(closed.avg_resolution_s),
      },
      by_assignee: byAssignee,
      by_status: byStatus,
      by_channel: byChannel,
      by_source: bySource,
      tasks: { overdue },
      opportunities: {
        open: oppsOpen.n,
        open_value: oppsOpen.value,
        won: oppsClosed.won,
        won_value: oppsClosed.won_value,
        lost: oppsClosed.lost,
        conversion: decided ? oppsClosed.won / decided : null,
        decided,
        lost_reasons: lostReasons,
        by_stage: byStage,
      },
      methodology: METHODOLOGY,
    });
  } catch (err) {
    next(err);
  }
});

// Exportação CSV do relatório de atendimentos por responsável
// Painel inicial: desempenho (hoje/semana/mês e comparação com o mês anterior), atividade recente,
// funil do funil principal, ranking operacional da equipe e primeiros passos.
router.get('/dashboard', async (req, res, next) => {
  try {
    const manager = isManager(req.user);
    const me = req.user.id;
    const today = todaySql();
    const month = `date_trunc('month', ${today})::date`;
    const prevMonth = `(date_trunc('month', ${today}) - interval '1 month')::date`;
    const week = `date_trunc('week', ${today})::date`;
    const tScope = manager ? 'TRUE' : `t.assignee_id = ${Number(me)}`;
    const oScope = manager ? 'TRUE' : `o.owner_id = ${Number(me)}`;
    const opened = localDate('t.opened_at');
    const closed = localDate('t.closed_at');
    const perf = (
      await query(`SELECT
        count(*) FILTER (WHERE ${opened} = ${today})::int AS today,
        count(*) FILTER (WHERE ${opened} >= ${week})::int AS week,
        count(*) FILTER (WHERE ${opened} >= ${month})::int AS month,
        count(*) FILTER (WHERE ${opened} >= ${prevMonth} AND ${opened} < ${month})::int AS prev_month,
        count(*) FILTER (WHERE t.status = 'resolvido' AND ${closed} >= ${month})::int AS resolved_month,
        count(*) FILTER (WHERE t.status = 'resolvido' AND ${closed} >= ${prevMonth} AND ${closed} < ${month})::int AS resolved_prev,
        avg(EXTRACT(EPOCH FROM (t.first_response_at - t.opened_at))) FILTER (WHERE t.first_response_at IS NOT NULL AND ${opened} >= ${month}) AS frt_month,
        avg(EXTRACT(EPOCH FROM (t.first_response_at - t.opened_at))) FILTER (WHERE t.first_response_at IS NOT NULL AND ${opened} >= ${prevMonth} AND ${opened} < ${month}) AS frt_prev,
        avg(EXTRACT(EPOCH FROM (t.closed_at - t.opened_at))) FILTER (WHERE t.status = 'resolvido' AND ${closed} >= ${month}) AS res_month,
        avg(EXTRACT(EPOCH FROM (t.closed_at - t.opened_at))) FILTER (WHERE t.status = 'resolvido' AND ${closed} >= ${prevMonth} AND ${closed} < ${month}) AS res_prev
      FROM tickets t WHERE ${tScope}`)
    ).rows[0];
    const oClosed = localDate('o.closed_at');
    const conv = (
      await query(`SELECT
        count(*) FILTER (WHERE s.kind = 'won' AND ${oClosed} >= ${month})::int AS won,
        count(*) FILTER (WHERE s.kind = 'lost' AND ${oClosed} >= ${month})::int AS lost,
        count(*) FILTER (WHERE s.kind = 'won' AND ${oClosed} >= ${prevMonth} AND ${oClosed} < ${month})::int AS won_prev,
        count(*) FILTER (WHERE s.kind = 'lost' AND ${oClosed} >= ${prevMonth} AND ${oClosed} < ${month})::int AS lost_prev
      FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id WHERE o.closed_at IS NOT NULL AND ${oScope}`)
    ).rows[0];
    const rate = (w, l) => (w + l ? w / (w + l) : null);
    const num = (v) => (v == null ? null : Number(v));

    // Atividade recente (o atendente vê só o que é dele)
    const mine = (col) => (manager ? 'TRUE' : `${col} = ${Number(me)}`);
    const activity = (
      await query(`SELECT * FROM (
        (SELECT 'customer_created' AS kind, c.name AS title, NULL AS detail, c.created_at AS at, '#/clientes/' || c.id AS href
           FROM customers c WHERE ${mine('c.owner_id')} ORDER BY c.created_at DESC LIMIT 8)
        UNION ALL
        (SELECT 'ticket_opened', t.subject, t.protocol, t.opened_at, '#/atendimentos/' || t.id
           FROM tickets t WHERE ${tScope} ORDER BY t.opened_at DESC LIMIT 8)
        UNION ALL
        (SELECT 'ticket_resolved', t.subject, t.protocol, t.closed_at, '#/atendimentos/' || t.id
           FROM tickets t WHERE t.status = 'resolvido' AND t.closed_at IS NOT NULL AND ${tScope} ORDER BY t.closed_at DESC LIMIT 8)
        UNION ALL
        (SELECT 'task_created', k.title, NULL, k.created_at, '#/tarefas'
           FROM tasks k WHERE ${mine('k.assignee_id')} ORDER BY k.created_at DESC LIMIT 8)
        UNION ALL
        (SELECT 'stage_changed', o.title, e.body, e.created_at, '#/funil/' || o.id
           FROM opportunity_events e JOIN opportunities o ON o.id = e.opportunity_id
           WHERE e.payload->>'action' = 'move' AND ${oScope} ORDER BY e.created_at DESC LIMIT 8)
      ) x ORDER BY at DESC LIMIT 8`)
    ).rows;

    // Funil principal: quantidade e valor por etapa (abertas agora; ganho/perdido no mês)
    const funnel = (
      await query(`SELECT s.id, s.name, s.kind, s.position,
          count(o.id) FILTER (WHERE s.kind = 'open' OR ${localDate('o.closed_at')} >= ${month})::int AS n,
          COALESCE(sum(o.value) FILTER (WHERE s.kind = 'open' OR ${localDate('o.closed_at')} >= ${month}), 0)::float AS value
        FROM pipeline_stages s JOIN pipelines p ON p.id = s.pipeline_id AND p.is_default
        LEFT JOIN opportunities o ON o.stage_id = s.id AND ${oScope}
        WHERE s.active GROUP BY s.id ORDER BY s.position`)
    ).rows;

    // Ranking operacional do mês (só para gestores)
    const ranking = manager
      ? (
          await query(`SELECT u.id, u.name,
            count(t.id) FILTER (WHERE ${opened} >= ${month})::int AS handled,
            count(t.id) FILTER (WHERE t.status = 'resolvido' AND ${closed} >= ${month})::int AS resolved,
            avg(EXTRACT(EPOCH FROM (t.first_response_at - t.opened_at))) FILTER (WHERE t.first_response_at IS NOT NULL AND ${opened} >= ${month}) AS avg_first_response_s
          FROM users u LEFT JOIN tickets t ON t.assignee_id = u.id
          WHERE u.active GROUP BY u.id HAVING count(t.id) FILTER (WHERE ${opened} >= ${month} OR (t.status = 'resolvido' AND ${closed} >= ${month})) > 0
          ORDER BY resolved DESC, handled DESC LIMIT 8`)
        ).rows.map((r) => ({ ...r, avg_first_response_s: num(r.avg_first_response_s) }))
      : [];

    // Primeiros passos (só administradores configuram a empresa)
    const onboarding =
      req.user.role === 'admin'
        ? (
            await query(`SELECT
              EXISTS (SELECT 1 FROM audit_log WHERE action = 'settings_update') AS company,
              (SELECT count(*) FROM users) > 1 AS users,
              EXISTS (SELECT 1 FROM customers) AS customer,
              EXISTS (SELECT 1 FROM tickets) AS ticket,
              EXISTS (SELECT 1 FROM opportunities) AS opportunity`)
          ).rows[0]
        : null;

    res.json({
      performance: {
        today: perf.today,
        week: perf.week,
        month: perf.month,
        prev_month: perf.prev_month,
        resolved_month: perf.resolved_month,
        resolved_prev: perf.resolved_prev,
        avg_first_response_s: num(perf.frt_month),
        avg_first_response_prev_s: num(perf.frt_prev),
        avg_resolution_s: num(perf.res_month),
        avg_resolution_prev_s: num(perf.res_prev),
        conversion: rate(conv.won, conv.lost),
        conversion_prev: rate(conv.won_prev, conv.lost_prev),
      },
      activity,
      funnel,
      ranking,
      onboarding,
    });
  } catch (err) {
    next(err);
  }
});

router.get('/export.csv', requireModule('reports'), async (req, res, next) => {
  try {
    const { p, f } = buildFilters(req);
    const tBase = `FROM tickets t JOIN customers c ON c.id = t.customer_id LEFT JOIN users u ON u.id = t.assignee_id`;
    const tOpened = and([...f.ticket, ...periodSql('t.opened_at', f)]);
    const { rows } = await query(
      `SELECT COALESCE(u.name,'Sem responsável') AS responsavel, count(*)::int AS total,
        count(*) FILTER (WHERE t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS abertos,
        count(*) FILTER (WHERE t.status = 'resolvido')::int AS resolvidos,
        count(*) FILTER (WHERE t.status = 'cancelado')::int AS cancelados,
        round(avg(EXTRACT(EPOCH FROM (t.first_response_at - t.opened_at))) FILTER (WHERE t.first_response_at IS NOT NULL) / 60) AS primeira_resposta_min,
        round(avg(EXTRACT(EPOCH FROM (t.closed_at - t.opened_at))) FILTER (WHERE t.status = 'resolvido') / 60) AS resolucao_min
      ${tBase} WHERE ${tOpened} GROUP BY u.name ORDER BY total DESC`,
      p,
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-atendimentos.csv"');
    res.send(
      toCsv(
        rows,
        ['responsavel', 'total', 'abertos', 'resolvidos', 'cancelados', 'primeira_resposta_min', 'resolucao_min'].map(
          (k) => ({ key: k, label: k }),
        ),
      ),
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;
