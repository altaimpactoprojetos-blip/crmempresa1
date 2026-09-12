'use strict';
const express = require('express');
const { z } = require('zod');
const { query, tx } = require('../db');
const { validate } = require('../middleware/validate');
const { requireAuth, isManager, requireRole } = require('../middleware/auth');
const { badRequest, notFound, conflict, forbidden } = require('../lib/errors');
const { audit } = require('../lib/audit');
const { broadcast } = require('../lib/realtime');
const { notify } = require('../lib/notify');
const { nextProtocol, toCsv } = require('../lib/util');
const automations = require('../lib/automations');

const router = express.Router();
router.use(requireAuth);

const STATUS = ['aguardando', 'em_atendimento', 'aguardando_cliente', 'resolvido', 'cancelado'];
const STATUS_LABEL = { aguardando: 'Aguardando atendimento', em_atendimento: 'Em atendimento', aguardando_cliente: 'Aguardando cliente', resolvido: 'Resolvido', cancelado: 'Cancelado' };
const OPEN = ['aguardando', 'em_atendimento', 'aguardando_cliente'];

// Atendente: seus atendimentos + fila compartilhada (sem responsável ou aguardando).
function scopeSql(user, params, alias = 't') {
  if (isManager(user)) return 'TRUE';
  params.push(user.id);
  return `(${alias}.assignee_id = $${params.length} OR ${alias}.assignee_id IS NULL)`;
}

// "Aguardando resposta": o cliente falou por último (ou ninguém respondeu ainda) e o atendimento está ativo.
const AWAITING = `(t.status IN ('aguardando','em_atendimento') AND (t.last_agent_message_at IS NULL OR COALESCE(t.last_customer_message_at, t.opened_at) > t.last_agent_message_at))`;
const RESPONSE_DUE = `CASE WHEN ${AWAITING} THEN COALESCE(t.last_customer_message_at, t.opened_at) + (cs.response_sla_minutes || ' minutes')::interval ELSE NULL END`;

const SELECT_COLS = `t.*, c.name AS customer_name, c.phone AS customer_phone, c.phone_digits AS customer_phone_digits, c.company AS customer_company, c.email AS customer_email, c.tags AS customer_tags,
  u.name AS assignee_name, cb.name AS created_by_name, ${AWAITING} AS awaiting_reply, ${RESPONSE_DUE} AS response_due_at, cs.response_sla_minutes,
  (SELECT count(*)::int FROM tasks tk WHERE tk.ticket_id = t.id AND tk.done_at IS NULL) AS open_tasks,
  (SELECT count(*)::int FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id WHERE o.customer_id = t.customer_id AND s.kind = 'open') AS open_opportunities,
  (SELECT count(*)::int FROM ticket_attachments a WHERE a.ticket_id = t.id) AS attachments_count`;
const FROM = `FROM tickets t JOIN customers c ON c.id = t.customer_id LEFT JOIN users u ON u.id = t.assignee_id LEFT JOIN users cb ON cb.id = t.created_by CROSS JOIN company_settings cs`;
const SELECT = `SELECT ${SELECT_COLS} ${FROM}`;

async function loadTicket(req, id, client) {
  const q = client ? client.query.bind(client) : query;
  const params = [id];
  const scope = scopeSql(req.user, params);
  const { rows } = await q(`${SELECT} WHERE t.id = $1 AND ${scope}`, params);
  if (!rows[0]) throw notFound('Atendimento não encontrado ou fora do seu escopo.');
  return rows[0];
}

// Insere um evento na linha do tempo e mantém os campos resumidos da conversa.
async function addEvent(client, ticketId, userId, kind, body, extra = {}) {
  const { rows } = await client.query(
    `INSERT INTO ticket_events (ticket_id, user_id, kind, direction, channel, body, payload) VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *, (SELECT name FROM users WHERE id = $2) AS user_name`,
    [ticketId, userId, kind, extra.direction || null, extra.channel || null, body, JSON.stringify(extra.payload || {})]);
  if (kind === 'interaction') {
    const out = extra.direction === 'saida';
    await client.query(
      `UPDATE tickets SET last_message_at = now(), last_message_preview = left($2, 160), last_message_direction = $3,
        last_customer_message_at = CASE WHEN $4::boolean THEN last_customer_message_at ELSE now() END,
        last_agent_message_at = CASE WHEN $4::boolean THEN now() ELSE last_agent_message_at END,
        unread_count = CASE WHEN $4::boolean THEN 0 ELSE unread_count + 1 END,
        first_response_at = CASE WHEN $4::boolean THEN COALESCE(first_response_at, now()) ELSE first_response_at END,
        updated_at = now() WHERE id = $1`, [ticketId, body || '', extra.direction || null, out]);
  } else {
    await client.query('UPDATE tickets SET updated_at = now() WHERE id = $1', [ticketId]);
  }
  return rows[0];
}

// Rodízio: próximo atendente ativo e disponível que recebeu atendimento há mais tempo.
async function pickNextAttendant(client, excludeId, team) {
  const { rows } = await client.query(
    `SELECT id, name FROM users WHERE active AND available AND role = 'atendente' AND id <> COALESCE($1, 0) AND ($2::text IS NULL OR team = $2)
     ORDER BY last_assigned_at NULLS FIRST, id LIMIT 1 FOR UPDATE SKIP LOCKED`, [excludeId || null, team || null]);
  if (!rows[0]) return null;
  await client.query('UPDATE users SET last_assigned_at = now() WHERE id = $1', [rows[0].id]);
  return rows[0];
}

const ticketSchema = z.object({
  customer_id: z.number().int().positive(),
  subject: z.string().trim().min(3).max(200),
  description: z.string().max(10000).nullable().optional(),
  channel: z.string().trim().min(1).max(60),
  priority: z.enum(['baixa', 'normal', 'alta', 'urgente']).default('normal'),
  assignee_id: z.number().int().positive().nullable().optional(),
  auto_assign: z.boolean().optional(),
  first_message: z.string().trim().max(10000).optional(),
});

const SORTS = {
  opened_at: 't.opened_at', last_message_at: 'COALESCE(t.last_message_at, t.opened_at)', protocol: 't.protocol', customer_name: 'c.name', subject: 't.subject',
  status: 't.status', assignee_name: 'u.name', channel: 't.channel', follow_up_at: 't.follow_up_at', response_due_at: RESPONSE_DUE,
  priority: `CASE t.priority WHEN 'urgente' THEN 0 WHEN 'alta' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END`,
};

function buildWhere(req) {
  const params = [];
  const where = [scopeSql(req.user, params)];
  const q = req.query;
  const view = q.view || '';
  if (view === 'mine') { params.push(req.user.id); where.push(`t.assignee_id = $${params.length} AND t.status = ANY('{aguardando,em_atendimento,aguardando_cliente}')`); }
  else if (view === 'queue') where.push(`t.status = 'aguardando' AND t.assignee_id IS NULL`);
  else if (view === 'unanswered') where.push(AWAITING);
  else if (view === 'waiting_customer') where.push(`t.status = 'aguardando_cliente'`);
  else if (view === 'closed') where.push(`t.status IN ('resolvido','cancelado')`);
  else if (view === 'open') where.push(`t.status = ANY('{aguardando,em_atendimento,aguardando_cliente}')`);
  else if (view === 'overdue') where.push(`${AWAITING} AND COALESCE(t.last_customer_message_at, t.opened_at) + (cs.response_sla_minutes || ' minutes')::interval < now()`);
  else if (view === 'follow_up_overdue') where.push(`t.follow_up_at IS NOT NULL AND t.follow_up_at < now() AND t.status = ANY('{aguardando,em_atendimento,aguardando_cliente}')`);
  if (q.status) { const list = String(q.status).split(',').filter((s) => STATUS.includes(s)); if (list.length) { params.push(list); where.push(`t.status = ANY($${params.length}::text[])`); } }
  else if (q.open === 'true') { params.push(OPEN); where.push(`t.status = ANY($${params.length}::text[])`); }
  if (q.queue === 'true') where.push(`t.status = 'aguardando'`);
  if (q.mine === 'true') { params.push(req.user.id); where.push(`t.assignee_id = $${params.length}`); }
  if (q.assignee_id === 'none') where.push('t.assignee_id IS NULL');
  else if (q.assignee_id) { params.push(Number(q.assignee_id)); where.push(`t.assignee_id = $${params.length}`); }
  if (q.priority) { params.push(q.priority); where.push(`t.priority = $${params.length}`); }
  if (q.channel) { params.push(q.channel); where.push(`t.channel = $${params.length}`); }
  if (q.customer_id) { params.push(Number(q.customer_id)); where.push(`t.customer_id = $${params.length}`); }
  if (q.follow_up === 'pending') where.push(`t.follow_up_at IS NOT NULL AND t.status = ANY('{aguardando,em_atendimento,aguardando_cliente}')`);
  if (q.tag) { params.push(q.tag); where.push(`$${params.length} = ANY(c.tags)`); }
  if (q.q) { params.push(`%${q.q.trim()}%`); where.push(`(t.protocol ILIKE $${params.length} OR t.subject ILIKE $${params.length} OR c.name ILIKE $${params.length} OR c.phone ILIKE $${params.length} OR c.company ILIKE $${params.length})`); }
  if (q.from) { params.push(q.from); where.push(`t.opened_at >= $${params.length}::timestamptz`); }
  if (q.to) { params.push(q.to); where.push(`t.opened_at < ($${params.length}::date + 1)`); }
  return { params, where };
}

router.get('/', async (req, res, next) => {
  try {
    const { params, where } = buildWhere(req);
    const q = req.query;
    const limit = Math.min(Number(q.limit) || 50, 300);
    const page = Math.max(Number(q.page) || 1, 1);
    const base = `${FROM} WHERE ${where.join(' AND ')}`;
    const total = (await query(`SELECT count(*)::int AS n ${base}`, params)).rows[0].n;
    let order = `CASE t.priority WHEN 'urgente' THEN 0 WHEN 'alta' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, t.opened_at ASC`;
    if (q.sort && SORTS[q.sort]) order = `${SORTS[q.sort]} ${q.dir === 'desc' ? 'DESC NULLS LAST' : 'ASC NULLS LAST'}, t.id DESC`;
    else if (q.view && !['queue'].includes(q.view)) order = `COALESCE(t.last_message_at, t.opened_at) DESC`;
    params.push(limit, (page - 1) * limit);
    const { rows } = await query(`SELECT ${SELECT_COLS} ${base} ORDER BY ${order} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
    res.json({ tickets: rows, total, page, limit });
  } catch (err) { next(err); }
});

// Contadores dos filtros da central (fila, meus, sem resposta, aguardando cliente, encerrados, vencidos).
router.get('/counts', async (req, res, next) => {
  try {
    const params = [];
    const scope = scopeSql(req.user, params);
    params.push(req.user.id);
    const me = `$${params.length}`;
    const { rows } = await query(`SELECT
        count(*) FILTER (WHERE t.status = 'aguardando' AND t.assignee_id IS NULL)::int AS queue,
        count(*) FILTER (WHERE t.assignee_id = ${me} AND t.status = ANY('{aguardando,em_atendimento,aguardando_cliente}'))::int AS mine,
        count(*) FILTER (WHERE ${AWAITING})::int AS unanswered,
        count(*) FILTER (WHERE ${AWAITING} AND COALESCE(t.last_customer_message_at, t.opened_at) + (cs.response_sla_minutes || ' minutes')::interval < now())::int AS overdue,
        count(*) FILTER (WHERE t.status = 'aguardando_cliente')::int AS waiting_customer,
        count(*) FILTER (WHERE t.status = ANY('{aguardando,em_atendimento,aguardando_cliente}'))::int AS open,
        count(*) FILTER (WHERE t.status IN ('resolvido','cancelado') AND t.closed_at > now() - interval '30 days')::int AS closed,
        count(*) FILTER (WHERE t.follow_up_at IS NOT NULL AND t.follow_up_at < now() AND t.status = ANY('{aguardando,em_atendimento,aguardando_cliente}'))::int AS follow_up_overdue,
        COALESCE(sum(t.unread_count) FILTER (WHERE t.assignee_id = ${me} OR t.assignee_id IS NULL), 0)::int AS unread
      ${FROM} WHERE ${scope}`, params);
    res.json({ counts: rows[0] });
  } catch (err) { next(err); }
});

router.get('/export.csv', async (req, res, next) => {
  try {
    const { params, where } = buildWhere(req);
    const { rows } = await query(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY t.opened_at DESC LIMIT 5000`, params);
    await audit(req, 'tickets_export', 'ticket', null, { count: rows.length });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="atendimentos.csv"');
    res.send(toCsv(rows, [
      { key: 'protocol', label: 'protocolo' }, { key: 'customer_name', label: 'cliente' }, { key: 'customer_phone', label: 'telefone' }, { key: 'subject', label: 'assunto' }, { key: 'channel', label: 'canal' },
      { key: 'priority', label: 'prioridade' }, { label: 'status', get: (r) => STATUS_LABEL[r.status] }, { key: 'assignee_name', label: 'responsavel' },
      { key: 'opened_at', label: 'abertura' }, { key: 'first_response_at', label: 'primeira_resposta' }, { key: 'last_message_at', label: 'ultima_mensagem' }, { key: 'closed_at', label: 'encerramento' }, { key: 'follow_up_at', label: 'retorno_agendado' },
    ]));
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const t = await loadTicket(req, Number(req.params.id));
    const [events, tasks, opps, attachments, customer, history] = await Promise.all([
      query(`SELECT e.*, u.name AS user_name FROM ticket_events e LEFT JOIN users u ON u.id = e.user_id WHERE e.ticket_id = $1 ORDER BY e.created_at ASC, e.id ASC`, [t.id]),
      query(`SELECT t.*, u.name AS assignee_name FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.ticket_id = $1 ORDER BY t.done_at NULLS FIRST, t.due_at`, [t.id]),
      query(`SELECT o.id, o.title, o.value, o.stage_id, o.owner_id, o.next_action, o.next_action_at, o.expected_close_date, o.version, o.ticket_id, s.name AS stage_name, s.kind AS stage_kind, s.pipeline_id, u.name AS owner_name
             FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id LEFT JOIN users u ON u.id = o.owner_id WHERE o.customer_id = $1 ORDER BY (s.kind = 'open') DESC, o.updated_at DESC`, [t.customer_id]),
      query(`SELECT id, event_id, name, mime, size, wa_media_id, created_at FROM ticket_attachments WHERE ticket_id = $1 ORDER BY created_at`, [t.id]),
      query(`SELECT c.*, u.name AS owner_name FROM customers c LEFT JOIN users u ON u.id = c.owner_id WHERE c.id = $1`, [t.customer_id]),
      query(`SELECT id, protocol, subject, status, opened_at, closed_at FROM tickets WHERE customer_id = $1 AND id <> $2 ORDER BY opened_at DESC LIMIT 8`, [t.customer_id, t.id]),
    ]);
    const custTasks = await query(`SELECT t.id, t.title, t.due_at, t.done_at, t.priority, u.name AS assignee_name FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.customer_id = $1 AND t.done_at IS NULL AND (t.ticket_id IS NULL OR t.ticket_id <> $2) ORDER BY t.due_at LIMIT 10`, [t.customer_id, t.id]);
    res.json({ ticket: t, events: events.rows, tasks: tasks.rows, opportunities: opps.rows, attachments: attachments.rows, customer: customer.rows[0], customer_tickets: history.rows, customer_tasks: custTasks.rows });
  } catch (err) { next(err); }
});

router.post('/', validate(ticketSchema), async (req, res, next) => {
  try {
    const d = req.data;
    if (req.user.role === 'atendente' && d.assignee_id && d.assignee_id !== req.user.id) {
      return next(forbidden('Atendentes só podem atribuir atendimentos a si mesmos ou deixá-los na fila.'));
    }
    const result = await tx(async (client) => {
      const cust = await client.query('SELECT id FROM customers WHERE id = $1', [d.customer_id]);
      if (!cust.rowCount) throw badRequest('Cliente não encontrado.', { fields: { customer_id: 'Cliente inválido.' } });
      let assigneeId = d.assignee_id || null;
      let distributed = false;
      if (!assigneeId) {
        const settings = (await client.query('SELECT auto_distribution FROM company_settings WHERE id = 1')).rows[0];
        if (settings.auto_distribution || d.auto_assign) {
          const pick = await pickNextAttendant(client);
          if (pick) { assigneeId = pick.id; distributed = true; }
        }
      }
      const protocol = await nextProtocol(client);
      const { rows } = await client.query(
        `INSERT INTO tickets (protocol, customer_id, subject, description, channel, priority, status, assignee_id, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,'aguardando',$7,$8) RETURNING *`,
        [protocol, d.customer_id, d.subject, d.description || null, d.channel, d.priority, assigneeId, req.user.id]);
      const t = rows[0];
      await addEvent(client, t.id, req.user.id, 'system', 'Atendimento aberto', { payload: { action: 'created', channel: d.channel } });
      if (d.first_message) await addEvent(client, t.id, req.user.id, 'interaction', d.first_message, { direction: 'entrada', channel: d.channel, payload: { manual: true } });
      if (assigneeId) {
        await addEvent(client, t.id, req.user.id, 'system', distributed ? 'Distribuído automaticamente (rodízio)' : 'Responsável atribuído', { payload: { action: 'assigned', to: assigneeId, auto: distributed } });
        if (assigneeId !== req.user.id) await notify(assigneeId, 'Novo atendimento atribuído', `${protocol} — ${d.subject}`, `#/atendimentos/${t.id}`, client);
      }
      await audit(req, 'ticket_create', 'ticket', t.id, { protocol, assignee_id: assigneeId, auto: distributed }, client);
      return t;
    });
    broadcast('tickets_changed', { id: result.id, action: 'created' });
    setImmediate(() => automations.trigger('ticket_created', 'ticket', result.id));
    res.status(201).json({ ticket: result, message: `Atendimento ${result.protocol} aberto.` });
  } catch (err) { next(err); }
});

router.put('/:id', validate(z.object({
  subject: z.string().trim().min(3).max(200).optional(),
  description: z.string().max(10000).nullable().optional(),
  channel: z.string().trim().min(1).max(60).optional(),
  priority: z.enum(['baixa', 'normal', 'alta', 'urgente']).optional(),
  version: z.number().int().optional(),
})), async (req, res, next) => {
  try {
    const t = await loadTicket(req, Number(req.params.id));
    if (!isManager(req.user) && t.assignee_id !== req.user.id && t.assignee_id !== null) return next(forbidden('Somente o responsável pode editar este atendimento.'));
    const d = req.data;
    if (d.version !== undefined && d.version !== t.version) return next(conflict('Este atendimento foi alterado por outro usuário. Recarregue para ver a versão atual.', { current: t }));
    const { rows } = await query(
      `UPDATE tickets SET subject = COALESCE($1, subject), description = CASE WHEN $2::boolean THEN $3 ELSE description END,
        channel = COALESCE($4, channel), priority = COALESCE($5, priority), version = version + 1, updated_at = now() WHERE id = $6 RETURNING *`,
      [d.subject ?? null, d.description !== undefined, d.description ?? null, d.channel ?? null, d.priority ?? null, t.id]);
    await audit(req, 'ticket_update', 'ticket', t.id, { fields: Object.keys(d) });
    broadcast('tickets_changed', { id: t.id, action: 'updated' });
    res.json({ ticket: rows[0], message: 'Atendimento atualizado.' });
  } catch (err) { next(err); }
});

// Assumir atendimento (atômico: impede que duas pessoas assumam o mesmo ao mesmo tempo)
router.post('/:id/claim', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await tx(async (client) => {
      const upd = await client.query(
        `UPDATE tickets SET assignee_id = $1, status = 'em_atendimento', version = version + 1, updated_at = now()
         WHERE id = $2 AND status = 'aguardando' AND (assignee_id IS NULL OR assignee_id = $1) RETURNING *`, [req.user.id, id]);
      if (!upd.rowCount) {
        const cur = await client.query(`SELECT t.status, t.assignee_id, u.name AS assignee_name FROM tickets t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.id = $1`, [id]);
        if (!cur.rowCount) throw notFound('Atendimento não encontrado.');
        const c = cur.rows[0];
        if (c.assignee_id && c.assignee_id !== req.user.id) throw conflict(`Este atendimento já foi assumido por ${c.assignee_name}.`, { assignee_id: c.assignee_id, status: c.status });
        throw conflict(`Este atendimento não está aguardando (status atual: ${STATUS_LABEL[c.status]}).`, { status: c.status });
      }
      await addEvent(client, id, req.user.id, 'system', 'Atendimento assumido', { payload: { action: 'claimed', to: req.user.id } });
      await client.query('UPDATE users SET last_assigned_at = now() WHERE id = $1', [req.user.id]);
      await audit(req, 'ticket_claim', 'ticket', id, {}, client);
      return upd.rows[0];
    });
    broadcast('tickets_changed', { id, action: 'claimed' });
    res.json({ ticket: result, message: 'Você assumiu este atendimento.' });
  } catch (err) { next(err); }
});

// Marcar mensagens como lidas (zera o contador de não lidas)
router.post('/:id/read', async (req, res, next) => {
  try {
    const t = await loadTicket(req, Number(req.params.id));
    if (t.unread_count) { await query('UPDATE tickets SET unread_count = 0 WHERE id = $1', [t.id]); broadcast('tickets_changed', { id: t.id, action: 'read' }, [req.user.id]); }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// Atribuir/transferir para outro atendente
router.post('/:id/transfer', validate(z.object({ to_user_id: z.number().int().positive(), reason: z.string().max(500).optional(), version: z.number().int().optional() })), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await tx(async (client) => {
      const t = await loadTicket(req, id, client);
      if (!isManager(req.user) && t.assignee_id !== req.user.id && t.assignee_id !== null) throw forbidden('Somente o responsável ou um supervisor pode transferir este atendimento.');
      if (!OPEN.includes(t.status)) throw conflict('Não é possível transferir um atendimento encerrado. Reabra-o primeiro.');
      if (req.data.version !== undefined && req.data.version !== t.version) throw conflict('Este atendimento foi alterado por outro usuário. Recarregue para ver a versão atual.', { current: t });
      const target = await client.query('SELECT id, name FROM users WHERE id = $1 AND active', [req.data.to_user_id]);
      if (!target.rowCount) throw badRequest('Usuário de destino inválido ou inativo.');
      if (target.rows[0].id === t.assignee_id) throw badRequest('O atendimento já está com este responsável.');
      const upd = await client.query(
        `UPDATE tickets SET assignee_id = $1, status = CASE WHEN status = 'aguardando_cliente' THEN status ELSE 'em_atendimento' END,
         version = version + 1, updated_at = now() WHERE id = $2 RETURNING *`, [target.rows[0].id, id]);
      await addEvent(client, id, req.user.id, 'system', `Transferido para ${target.rows[0].name}${req.data.reason ? ` — ${req.data.reason}` : ''}`,
        { payload: { action: 'transfer', from: t.assignee_id, to: target.rows[0].id, reason: req.data.reason || null } });
      await client.query('UPDATE users SET last_assigned_at = now() WHERE id = $1', [target.rows[0].id]);
      await notify(target.rows[0].id, 'Atendimento transferido para você', `${t.protocol} — ${t.subject}`, `#/atendimentos/${id}`, client);
      await audit(req, 'ticket_transfer', 'ticket', id, { from: t.assignee_id, to: target.rows[0].id }, client);
      return upd.rows[0];
    });
    broadcast('tickets_changed', { id, action: 'transferred' });
    res.json({ ticket: result, message: 'Atendimento transferido.' });
  } catch (err) { next(err); }
});

// Devolver para a fila (remove responsável)
router.post('/:id/release', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await tx(async (client) => {
      const t = await loadTicket(req, id, client);
      if (!isManager(req.user) && t.assignee_id !== req.user.id) throw forbidden('Somente o responsável ou um supervisor pode devolver este atendimento à fila.');
      if (!OPEN.includes(t.status)) throw conflict('Atendimento encerrado não pode voltar à fila. Reabra-o primeiro.');
      const upd = await client.query(`UPDATE tickets SET assignee_id = NULL, status = 'aguardando', version = version + 1, updated_at = now() WHERE id = $1 RETURNING *`, [id]);
      await addEvent(client, id, req.user.id, 'system', 'Devolvido à fila de espera', { payload: { action: 'released', from: t.assignee_id } });
      await audit(req, 'ticket_release', 'ticket', id, { from: t.assignee_id }, client);
      return upd.rows[0];
    });
    broadcast('tickets_changed', { id, action: 'released' });
    res.json({ ticket: result, message: 'Atendimento devolvido à fila.' });
  } catch (err) { next(err); }
});

router.post('/:id/status', validate(z.object({
  status: z.enum(['em_atendimento', 'aguardando_cliente', 'resolvido', 'cancelado']),
  note: z.string().max(2000).optional(),
  version: z.number().int().optional(),
})), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await tx(async (client) => {
      const t = await loadTicket(req, id, client);
      if (!isManager(req.user) && t.assignee_id !== req.user.id) throw forbidden('Somente o responsável ou um supervisor pode alterar o status.');
      if (!OPEN.includes(t.status)) throw conflict('Atendimento já encerrado. Use "Reabrir" para continuar.');
      if (req.data.version !== undefined && req.data.version !== t.version) throw conflict('Este atendimento foi alterado por outro usuário. Recarregue para ver a versão atual.', { current: t });
      if (!t.assignee_id && req.data.status !== 'cancelado') throw conflict('Assuma o atendimento antes de alterar o status.');
      const closing = ['resolvido', 'cancelado'].includes(req.data.status);
      const upd = await client.query(
        `UPDATE tickets SET status = $1, closed_at = CASE WHEN $2::boolean THEN now() ELSE NULL END, unread_count = CASE WHEN $2::boolean THEN 0 ELSE unread_count END, version = version + 1, updated_at = now() WHERE id = $3 RETURNING *`,
        [req.data.status, closing, id]);
      await addEvent(client, id, req.user.id, 'system', `Status alterado: ${STATUS_LABEL[t.status]} → ${STATUS_LABEL[req.data.status]}${req.data.note ? ` — ${req.data.note}` : ''}`,
        { payload: { action: 'status', from: t.status, to: req.data.status } });
      if (closing) await client.query(`UPDATE tasks SET done_at = now(), closed_reason = 'Atendimento encerrado', updated_at = now() WHERE ticket_id = $1 AND done_at IS NULL AND kind = 'acompanhamento'`, [id]);
      await audit(req, 'ticket_status', 'ticket', id, { from: t.status, to: req.data.status }, client);
      return upd.rows[0];
    });
    broadcast('tickets_changed', { id, action: 'status' });
    res.json({ ticket: result, message: `Status atualizado para "${STATUS_LABEL[result.status]}".` });
  } catch (err) { next(err); }
});

router.post('/:id/reopen', validate(z.object({ note: z.string().max(2000).optional() })), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const result = await tx(async (client) => {
      const t = await loadTicket(req, id, client);
      if (OPEN.includes(t.status)) throw conflict('Este atendimento já está aberto.');
      const assigneeActive = t.assignee_id ? (await client.query('SELECT 1 FROM users WHERE id = $1 AND active', [t.assignee_id])).rowCount > 0 : false;
      const status = assigneeActive ? 'em_atendimento' : 'aguardando';
      const upd = await client.query(
        `UPDATE tickets SET status = $1, assignee_id = CASE WHEN $2::boolean THEN assignee_id ELSE NULL END, closed_at = NULL, version = version + 1, updated_at = now() WHERE id = $3 RETURNING *`,
        [status, assigneeActive, id]);
      await addEvent(client, id, req.user.id, 'system', `Atendimento reaberto${req.data.note ? ` — ${req.data.note}` : ''}`, { payload: { action: 'reopened', from: t.status, to: status } });
      if (assigneeActive && t.assignee_id !== req.user.id) await notify(t.assignee_id, 'Atendimento reaberto', `${t.protocol} — ${t.subject}`, `#/atendimentos/${id}`, client);
      await audit(req, 'ticket_reopen', 'ticket', id, {}, client);
      return upd.rows[0];
    });
    broadcast('tickets_changed', { id, action: 'reopened' });
    res.json({ ticket: result, message: 'Atendimento reaberto.' });
  } catch (err) { next(err); }
});

const attachmentSchema = z.array(z.object({
  name: z.string().trim().min(1).max(200), mime: z.string().trim().min(1).max(120), data: z.string().min(1).max(3 * 1024 * 1024),
})).max(5).optional();

async function saveAttachments(client, ticketId, eventId, userId, list) {
  const out = [];
  for (const a of list || []) {
    const buf = Buffer.from(a.data.replace(/^data:[^;]+;base64,/, ''), 'base64');
    if (buf.length > 2 * 1024 * 1024) throw badRequest(`Anexo "${a.name}" maior que 2 MB.`);
    const { rows } = await client.query(`INSERT INTO ticket_attachments (ticket_id, event_id, name, mime, size, data, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, name, mime, size, created_at`,
      [ticketId, eventId, a.name, a.mime, buf.length, buf, userId]);
    out.push(rows[0]);
  }
  return out;
}

// Anotação interna (nunca visível ao cliente)
router.post('/:id/notes', validate(z.object({ body: z.string().trim().min(1).max(5000), attachments: attachmentSchema })), async (req, res, next) => {
  try {
    const t = await loadTicket(req, Number(req.params.id));
    const ev = await tx(async (client) => {
      const e = await addEvent(client, t.id, req.user.id, 'note', req.data.body);
      e.attachments = await saveAttachments(client, t.id, e.id, req.user.id, req.data.attachments);
      if (e.attachments.length) await client.query(`UPDATE ticket_events SET payload = payload || $1::jsonb WHERE id = $2`, [JSON.stringify({ attachments: e.attachments.map((a) => ({ id: a.id, name: a.name, mime: a.mime, size: a.size })) }), e.id]);
      return e;
    });
    broadcast('tickets_changed', { id: t.id, action: 'note' });
    res.status(201).json({ event: ev, message: 'Anotação interna registrada.' });
  } catch (err) { next(err); }
});

// Interação com o cliente (registro manual). Primeira saída define a "primeira resposta".
router.post('/:id/interactions', validate(z.object({
  direction: z.enum(['entrada', 'saida']),
  channel: z.string().trim().min(1).max(60),
  body: z.string().trim().min(1).max(10000),
  attachments: attachmentSchema,
})), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const out = await tx(async (client) => {
      const t = await loadTicket(req, id, client);
      if (!isManager(req.user) && t.assignee_id !== req.user.id) throw forbidden('Assuma o atendimento para registrar interações.');
      if (!OPEN.includes(t.status)) throw conflict('Atendimento encerrado. Reabra-o para registrar novas interações.');
      const e = await addEvent(client, id, req.user.id, 'interaction', req.data.body, { direction: req.data.direction, channel: req.data.channel, payload: { manual: true } });
      e.attachments = await saveAttachments(client, id, e.id, req.user.id, req.data.attachments);
      if (e.attachments.length) await client.query(`UPDATE ticket_events SET payload = payload || $1::jsonb WHERE id = $2`, [JSON.stringify({ manual: true, attachments: e.attachments.map((a) => ({ id: a.id, name: a.name, mime: a.mime, size: a.size })) }), e.id]);
      let status = t.status;
      if (req.data.direction === 'entrada' && t.status === 'aguardando_cliente') {
        status = 'em_atendimento';
        await client.query(`UPDATE tickets SET status = 'em_atendimento', version = version + 1 WHERE id = $1`, [id]);
        await addEvent(client, id, req.user.id, 'system', 'Cliente respondeu: status alterado de Aguardando cliente para Em atendimento', { payload: { action: 'status', from: t.status, to: status } });
      }
      const upd = await client.query(`${SELECT} WHERE t.id = $1`, [id]);
      return { event: e, ticket: upd.rows[0] };
    });
    broadcast('tickets_changed', { id, action: 'message' });
    if (req.data.direction === 'entrada') setImmediate(async () => { await automations.stopFollowUps('ticket_id = $1', [id], 'Cliente respondeu'); await automations.trigger('ticket_customer_replied', 'ticket', id, { dedupeKey: `reply:${out.event.id}` }); });
    res.status(201).json({ ...out, message: 'Interação registrada.' });
  } catch (err) { next(err); }
});

router.get('/:id/attachments/:aid', async (req, res, next) => {
  try {
    const t = await loadTicket(req, Number(req.params.id));
    const a = (await query('SELECT * FROM ticket_attachments WHERE id = $1 AND ticket_id = $2', [Number(req.params.aid), t.id])).rows[0];
    if (!a) return next(notFound('Anexo não encontrado.'));
    if (!a.data && a.wa_media_id) {
      const { mime, buffer } = await require('../lib/whatsapp').fetchMedia(a.wa_media_id);
      res.setHeader('Content-Type', mime); res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(a.name)}"`); return res.send(buffer);
    }
    res.setHeader('Content-Type', a.mime);
    res.setHeader('Content-Disposition', `${req.query.download ? 'attachment' : 'inline'}; filename="${encodeURIComponent(a.name)}"`);
    res.send(a.data);
  } catch (err) { next(err); }
});

// Agendar retorno: grava no atendimento e cria uma tarefa vinculada.
router.post('/:id/follow-up', validate(z.object({ at: z.string().datetime({ offset: true }).nullable(), note: z.string().max(500).optional() })), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const out = await tx(async (client) => {
      const t = await loadTicket(req, id, client);
      if (!isManager(req.user) && t.assignee_id !== req.user.id) throw forbidden('Somente o responsável pode agendar retorno.');
      const upd = await client.query('UPDATE tickets SET follow_up_at = $1, updated_at = now() WHERE id = $2 RETURNING *', [req.data.at, id]);
      let task = null;
      if (req.data.at) {
        await client.query(`UPDATE tasks SET done_at = now(), closed_reason = 'Retorno reagendado', updated_at = now() WHERE ticket_id = $1 AND done_at IS NULL AND kind = 'retorno'`, [id]);
        const r = await client.query(
          `INSERT INTO tasks (title, description, customer_id, ticket_id, assignee_id, due_at, priority, created_by, kind)
           VALUES ($1,$2,$3,$4,$5,$6,'alta',$7,'retorno') RETURNING *`,
          [`Retorno: ${t.subject} (${t.protocol})`, req.data.note || null, t.customer_id, id, t.assignee_id || req.user.id, req.data.at, req.user.id]);
        task = r.rows[0];
        await addEvent(client, id, req.user.id, 'system', `Retorno agendado para ${new Date(req.data.at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}${req.data.note ? ` — ${req.data.note}` : ''}`, { payload: { action: 'follow_up', at: req.data.at } });
      } else {
        await client.query(`UPDATE tasks SET done_at = now(), closed_reason = 'Agendamento removido', updated_at = now() WHERE ticket_id = $1 AND done_at IS NULL AND kind = 'retorno'`, [id]);
        await addEvent(client, id, req.user.id, 'system', 'Retorno agendado removido', { payload: { action: 'follow_up_cleared' } });
      }
      return { ticket: upd.rows[0], task };
    });
    broadcast('tickets_changed', { id, action: 'follow_up' });
    res.json({ ...out, message: req.data.at ? 'Retorno agendado e tarefa criada.' : 'Agendamento removido.' });
  } catch (err) { next(err); }
});

// Distribuição em rodízio de toda a fila sem responsável (supervisor/admin)
router.post('/distribute', requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const out = await tx(async (client) => {
      const queue = await client.query(`SELECT id, protocol, subject FROM tickets WHERE status = 'aguardando' AND assignee_id IS NULL ORDER BY
        CASE priority WHEN 'urgente' THEN 0 WHEN 'alta' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, opened_at FOR UPDATE SKIP LOCKED`);
      let assigned = 0;
      for (const t of queue.rows) {
        const pick = await pickNextAttendant(client);
        if (!pick) break;
        await client.query('UPDATE tickets SET assignee_id = $1, version = version + 1, updated_at = now() WHERE id = $2', [pick.id, t.id]);
        await addEvent(client, t.id, req.user.id, 'system', `Distribuído automaticamente (rodízio) para ${pick.name}`, { payload: { action: 'assigned', to: pick.id, auto: true } });
        await notify(pick.id, 'Novo atendimento atribuído', `${t.protocol} — ${t.subject}`, `#/atendimentos/${t.id}`, client);
        assigned++;
      }
      await audit(req, 'tickets_distribute', 'ticket', null, { assigned, remaining: queue.rowCount - assigned }, client);
      return { assigned, remaining: queue.rowCount - assigned };
    });
    broadcast('tickets_changed', { action: 'distributed' });
    const msg = out.assigned === 0 ? (out.remaining === 0 ? 'Não há atendimentos na fila.' : 'Nenhum atendente disponível. Os atendimentos permanecem na fila.')
      : `${out.assigned} atendimento(s) distribuído(s).${out.remaining ? ` ${out.remaining} permanecem na fila.` : ''}`;
    res.json({ ...out, message: msg });
  } catch (err) { next(err); }
});

module.exports = { router, STATUS_LABEL, OPEN, AWAITING };
