'use strict';
const express = require('express');
const { query } = require('../db');
const { requireAuth, isManager } = require('../middleware/auth');
const { toCsv } = require('../lib/util');
const { STATUS_LABEL } = require('./tickets');

const router = express.Router();
router.use(requireAuth);

const METHODOLOGY = {
  first_response: 'Tempo médio entre a abertura do atendimento e o registro da primeira interação de saída (resposta ao cliente). Considera apenas atendimentos abertos no período que já possuem primeira resposta.',
  resolution: 'Tempo médio entre a abertura e o encerramento (status Resolvido) dos atendimentos encerrados no período.',
  conversion: 'Taxa de conversão = negócios ganhos ÷ (ganhos + perdidos) entre as oportunidades encerradas no período. Oportunidades ainda abertas não entram no cálculo.',
  period: 'Atendimentos são filtrados pela data de abertura; encerrados e negócios ganhos/perdidos pela data de encerramento; tarefas atrasadas consideram a situação atual.',
};

function buildFilters(req) {
  const p = [];
  const f = { ticket: [], opp: [], from: null, to: null };
  const q = req.query;
  const from = q.from && /^\d{4}-\d{2}-\d{2}$/.test(q.from) ? q.from : null;
  const to = q.to && /^\d{4}-\d{2}-\d{2}$/.test(q.to) ? q.to : null;
  f.from = from; f.to = to;
  let assignee = q.assignee_id ? Number(q.assignee_id) : null;
  if (!isManager(req.user)) assignee = req.user.id;
  if (assignee) { p.push(assignee); f.ticket.push(`t.assignee_id = $${p.length}`); f.opp.push(`o.owner_id = $${p.length}`); }
  if (q.source) { p.push(q.source); f.ticket.push(`c.source = $${p.length}`); f.opp.push(`c.source = $${p.length}`); }
  if (q.channel) { p.push(q.channel); f.ticket.push(`t.channel = $${p.length}`); }
  if (q.status) { p.push(q.status); f.ticket.push(`t.status = $${p.length}`); }
  if (from) { p.push(from); f.fromIdx = p.length; }
  if (to) { p.push(to); f.toIdx = p.length; }
  return { p, f };
}

// Executa a consulta enviando apenas os parâmetros realmente referenciados no SQL (renumerados).
async function run(sql, params) {
  const used = [...new Set((sql.match(/\$(\d+)/g) || []).map((m) => Number(m.slice(1))))].sort((a, b) => a - b);
  const map = new Map(used.map((n, i) => [n, i + 1]));
  const out = sql.replace(/\$(\d+)(?!\d)/g, (m, n) => `$${map.get(Number(n))}`);
  return query(out, used.map((n) => params[n - 1]));
}

const periodSql = (col, f) => [f.fromIdx ? `${col} >= $${f.fromIdx}::date` : null, f.toIdx ? `${col} < ($${f.toIdx}::date + 1)` : null].filter(Boolean);
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
    const tickets = (await run(`SELECT
        count(*) FILTER (WHERE t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS open,
        count(*) FILTER (WHERE t.status = 'aguardando')::int AS waiting,
        count(*) FILTER (WHERE t.status = 'em_atendimento')::int AS in_progress,
        count(*) FILTER (WHERE t.status = 'aguardando_cliente')::int AS waiting_customer,
        count(*)::int AS opened,
        avg(EXTRACT(EPOCH FROM (t.first_response_at - t.opened_at))) FILTER (WHERE t.first_response_at IS NOT NULL) AS avg_first_response_s,
        count(*) FILTER (WHERE t.first_response_at IS NOT NULL)::int AS first_response_samples
      ${tBase} WHERE ${tOpened}`, p)).rows[0];
    const closed = (await run(`SELECT
        count(*) FILTER (WHERE t.status = 'resolvido')::int AS resolved,
        count(*) FILTER (WHERE t.status = 'cancelado')::int AS cancelled,
        avg(EXTRACT(EPOCH FROM (t.closed_at - t.opened_at))) FILTER (WHERE t.status = 'resolvido') AS avg_resolution_s
      ${tBase} WHERE t.closed_at IS NOT NULL AND ${tClosed}`, p)).rows[0];
    const byAssignee = (await run(`SELECT COALESCE(u.name, 'Sem responsável') AS name, t.assignee_id,
        count(*)::int AS total,
        count(*) FILTER (WHERE t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS open,
        count(*) FILTER (WHERE t.status = 'resolvido')::int AS resolved
      ${tBase} WHERE ${tOpened} GROUP BY u.name, t.assignee_id ORDER BY total DESC`, p)).rows;
    const byStatus = (await run(`SELECT t.status, count(*)::int AS n ${tBase} WHERE ${tOpened} GROUP BY t.status`, p)).rows
      .map((r) => ({ status: r.status, label: STATUS_LABEL[r.status], n: r.n }));
    const byChannel = (await run(`SELECT t.channel, count(*)::int AS n ${tBase} WHERE ${tOpened} GROUP BY t.channel ORDER BY n DESC`, p)).rows;
    const bySource = (await run(`SELECT COALESCE(c.source,'Não informada') AS source, count(*)::int AS n ${tBase} WHERE ${tOpened} GROUP BY c.source ORDER BY n DESC`, p)).rows;
    const oppsOpen = (await run(`SELECT count(*)::int AS n, COALESCE(sum(o.value),0)::float AS value ${oBase} WHERE ${oOpen}`, p)).rows[0];
    const oppsClosed = (await run(`SELECT
        count(*) FILTER (WHERE s.kind = 'won')::int AS won, COALESCE(sum(o.value) FILTER (WHERE s.kind = 'won'),0)::float AS won_value,
        count(*) FILTER (WHERE s.kind = 'lost')::int AS lost
      ${oBase} WHERE o.closed_at IS NOT NULL AND ${oClosed}`, p)).rows[0];
    const lostReasons = (await run(`SELECT COALESCE(o.lost_reason,'Não informado') AS reason, count(*)::int AS n ${oBase}
      WHERE s.kind = 'lost' AND o.closed_at IS NOT NULL AND ${oClosed} GROUP BY o.lost_reason ORDER BY n DESC`, p)).rows;
    const byStage = (await run(`SELECT s.name, s.kind, count(*)::int AS n, COALESCE(sum(o.value),0)::float AS value ${oBase}
      WHERE ${and(f.opp)} AND (s.kind = 'open' OR ${and(periodSql('o.closed_at', f))}) GROUP BY s.name, s.kind, s.position ORDER BY s.position`, p)).rows;
    const taskParams = [];
    let taskWhere = 'done_at IS NULL AND due_at < now()';
    const assignee = isManager(req.user) ? (req.query.assignee_id ? Number(req.query.assignee_id) : null) : req.user.id;
    if (assignee) { taskParams.push(assignee); taskWhere += ` AND assignee_id = $1`; }
    const overdue = (await run(`SELECT count(*)::int AS n FROM tasks WHERE ${taskWhere}`, taskParams)).rows[0].n;
    const decided = oppsClosed.won + oppsClosed.lost;
    res.json({
      period: { from: f.from, to: f.to },
      tickets: { ...tickets, resolved: closed.resolved, cancelled: closed.cancelled,
        avg_first_response_s: tickets.avg_first_response_s == null ? null : Number(tickets.avg_first_response_s),
        avg_resolution_s: closed.avg_resolution_s == null ? null : Number(closed.avg_resolution_s) },
      by_assignee: byAssignee, by_status: byStatus, by_channel: byChannel, by_source: bySource,
      tasks: { overdue },
      opportunities: { open: oppsOpen.n, open_value: oppsOpen.value, won: oppsClosed.won, won_value: oppsClosed.won_value, lost: oppsClosed.lost,
        conversion: decided ? oppsClosed.won / decided : null, decided, lost_reasons: lostReasons, by_stage: byStage },
      methodology: METHODOLOGY,
    });
  } catch (err) { next(err); }
});


// Painel do dia: indicadores que orientam o trabalho, com escopo por perfil.
router.get('/dashboard', async (req, res, next) => {
  try {
    const mgr = isManager(req.user);
    const me = req.user.id;
    const AW = require('./tickets').AWAITING;
    const p = [me];
    const scope = mgr ? 'TRUE' : '(t.assignee_id = $1 OR t.assignee_id IS NULL)';
    const t = (await query(`SELECT
        count(*) FILTER (WHERE t.status = 'aguardando' AND t.assignee_id IS NULL)::int AS queue,
        count(*) FILTER (WHERE ${AW})::int AS unanswered,
        count(*) FILTER (WHERE ${AW} AND COALESCE(t.last_customer_message_at, t.opened_at) + (cs.response_sla_minutes || ' minutes')::interval < now())::int AS overdue,
        count(*) FILTER (WHERE t.follow_up_at IS NOT NULL AND t.follow_up_at < now() AND t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS follow_up_overdue,
        count(*) FILTER (WHERE t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS open,
        count(*) FILTER (WHERE t.assignee_id = $1 AND t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS mine_open,
        count(*) FILTER (WHERE t.assignee_id = $1 AND ${AW})::int AS mine_unanswered,
        count(*) FILTER (WHERE t.status = 'resolvido' AND t.closed_at::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date ${mgr ? '' : 'AND t.assignee_id = $1'})::int AS resolved_today,
        count(*) FILTER (WHERE t.opened_at::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date)::int AS opened_today,
        count(*) FILTER (WHERE t.first_response_at IS NOT NULL AND t.opened_at > now() - interval '30 days')::int AS fr_samples,
        count(*) FILTER (WHERE t.first_response_at IS NOT NULL AND t.opened_at > now() - interval '30 days' AND t.first_response_at <= t.opened_at + (cs.response_sla_minutes || ' minutes')::interval)::int AS fr_within_sla,
        avg(EXTRACT(EPOCH FROM (t.first_response_at - t.opened_at))) FILTER (WHERE t.first_response_at IS NOT NULL AND t.opened_at > now() - interval '30 days') AS avg_first_response_s,
        max(cs.response_sla_minutes) AS sla_minutes
      FROM tickets t CROSS JOIN company_settings cs WHERE ${scope}`, p)).rows[0];
    const oScope = mgr ? 'TRUE' : '(o.owner_id = $1 OR o.owner_id IS NULL)';
    const o = (await query(`SELECT
        count(*) FILTER (WHERE s.kind = 'open')::int AS open, COALESCE(sum(o.value) FILTER (WHERE s.kind = 'open'),0)::float AS open_value,
        count(*) FILTER (WHERE s.kind = 'open' AND o.next_action_at IS NULL AND NOT EXISTS (SELECT 1 FROM tasks k WHERE k.opportunity_id = o.id AND k.done_at IS NULL))::int AS no_next_action,
        count(*) FILTER (WHERE s.kind = 'open' AND ((o.next_action_at IS NOT NULL AND o.next_action_at < now()) OR EXISTS (SELECT 1 FROM tasks k WHERE k.opportunity_id = o.id AND k.done_at IS NULL AND k.due_at < now())))::int AS overdue,
        count(*) FILTER (WHERE s.kind = 'open' AND o.updated_at < now() - (cs.idle_opportunity_days || ' days')::interval)::int AS idle,
        count(*) FILTER (WHERE s.kind = 'won' AND date_trunc('month', o.closed_at) = date_trunc('month', now()))::int AS won_month,
        COALESCE(sum(o.value) FILTER (WHERE s.kind = 'won' AND date_trunc('month', o.closed_at) = date_trunc('month', now())),0)::float AS won_month_value,
        count(*) FILTER (WHERE s.kind = 'lost' AND date_trunc('month', o.closed_at) = date_trunc('month', now()))::int AS lost_month,
        count(*) FILTER (WHERE s.kind = 'open' AND o.expected_close_date IS NOT NULL AND o.expected_close_date <= (now() + interval '7 days')::date)::int AS closing_week,
        max(cs.idle_opportunity_days) AS idle_days
      FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id CROSS JOIN company_settings cs WHERE ${oScope}`, mgr ? [] : p)).rows[0];
    const tk = (await query(`SELECT
        count(*) FILTER (WHERE done_at IS NULL AND due_at < now())::int AS overdue,
        count(*) FILTER (WHERE done_at IS NULL AND due_at::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date)::int AS today
      FROM tasks WHERE ${mgr ? 'TRUE' : 'assignee_id = $1'}`, mgr ? [] : p)).rows[0];
    const myTasks = (await query(`SELECT t.id, t.title, t.due_at, t.priority, t.kind, t.customer_id, t.ticket_id, t.opportunity_id, c.name AS customer_name, tk.protocol
      FROM tasks t LEFT JOIN customers c ON c.id = t.customer_id LEFT JOIN tickets tk ON tk.id = t.ticket_id
      WHERE t.assignee_id = $1 AND t.done_at IS NULL AND (t.due_at IS NULL OR t.due_at < (now() AT TIME ZONE 'America/Sao_Paulo')::date + 2) ORDER BY t.due_at NULLS LAST LIMIT 8`, [me])).rows;
    const nextContacts = (await query(`SELECT t.id, t.protocol, t.subject, t.follow_up_at, c.name AS customer_name FROM tickets t JOIN customers c ON c.id = t.customer_id
      WHERE t.follow_up_at IS NOT NULL AND t.status IN ('aguardando','em_atendimento','aguardando_cliente') ${mgr ? '' : 'AND t.assignee_id = $1'} ORDER BY t.follow_up_at LIMIT 8`, mgr ? [] : [me])).rows;
    let team = [];
    if (mgr) {
      team = (await query(`SELECT u.id, u.name, u.available, u.team,
          count(t.id) FILTER (WHERE t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS open,
          count(t.id) FILTER (WHERE ${AW})::int AS unanswered,
          count(t.id) FILTER (WHERE t.status = 'resolvido' AND t.closed_at::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date)::int AS resolved_today,
          (SELECT count(*)::int FROM tasks k WHERE k.assignee_id = u.id AND k.done_at IS NULL AND k.due_at < now()) AS overdue_tasks
        FROM users u LEFT JOIN tickets t ON t.assignee_id = u.id WHERE u.active AND u.role = 'atendente' GROUP BY u.id ORDER BY u.name`)).rows;
    }
    res.json({
      role: req.user.role, tickets: t, opportunities: o, tasks: tk, my_tasks: myTasks, next_contacts: nextContacts, team,
      help: {
        queue: 'Atendimentos com status "Aguardando atendimento" e sem responsável. Situação atual.',
        unanswered: 'Atendimentos ativos em que a última mensagem é do cliente (ou ainda não houve resposta). Situação atual.',
        overdue: `Sem resposta há mais de ${t.sla_minutes} minutos (prazo configurado em Configurações › Empresa).`,
        follow_up_overdue: 'Atendimentos abertos com retorno agendado para uma data já passada.',
        no_next_action: 'Oportunidades abertas sem data de próxima ação e sem tarefa pendente.',
        sla: `Percentual de atendimentos dos últimos 30 dias cuja primeira resposta ocorreu dentro de ${t.sla_minutes} minutos após a abertura.`,
        won_month: 'Negócios movidos para a etapa "Ganho" no mês atual, pela data de encerramento.',
        idle: `Oportunidades abertas sem nenhuma atualização há mais de ${o.idle_days} dias.`,
      },
    });
  } catch (err) { next(err); }
});

// Exportação CSV do relatório de atendimentos por responsável
router.get('/export.csv', async (req, res, next) => {
  try {
    const { p, f } = buildFilters(req);
    const tBase = `FROM tickets t JOIN customers c ON c.id = t.customer_id LEFT JOIN users u ON u.id = t.assignee_id`;
    const tOpened = and([...f.ticket, ...periodSql('t.opened_at', f)]);
    const { rows } = await query(`SELECT COALESCE(u.name,'Sem responsável') AS responsavel, count(*)::int AS total,
        count(*) FILTER (WHERE t.status IN ('aguardando','em_atendimento','aguardando_cliente'))::int AS abertos,
        count(*) FILTER (WHERE t.status = 'resolvido')::int AS resolvidos,
        count(*) FILTER (WHERE t.status = 'cancelado')::int AS cancelados,
        round(avg(EXTRACT(EPOCH FROM (t.first_response_at - t.opened_at))) FILTER (WHERE t.first_response_at IS NOT NULL) / 60) AS primeira_resposta_min,
        round(avg(EXTRACT(EPOCH FROM (t.closed_at - t.opened_at))) FILTER (WHERE t.status = 'resolvido') / 60) AS resolucao_min
      ${tBase} WHERE ${tOpened} GROUP BY u.name ORDER BY total DESC`, p);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="relatorio-atendimentos.csv"');
    res.send(toCsv(rows, ['responsavel', 'total', 'abertos', 'resolvidos', 'cancelados', 'primeira_resposta_min', 'resolucao_min'].map((k) => ({ key: k, label: k }))));
  } catch (err) { next(err); }
});

module.exports = router;
