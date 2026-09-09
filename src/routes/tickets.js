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

const SELECT = `SELECT t.*, c.name AS customer_name, c.phone AS customer_phone, c.company AS customer_company,
  u.name AS assignee_name, cb.name AS created_by_name
  FROM tickets t JOIN customers c ON c.id = t.customer_id LEFT JOIN users u ON u.id = t.assignee_id LEFT JOIN users cb ON cb.id = t.created_by`;

async function loadTicket(req, id, client) {
  const q = client ? client.query.bind(client) : query;
  const params = [id];
  const scope = scopeSql(req.user, params);
  const { rows } = await q(`${SELECT} WHERE t.id = $1 AND ${scope}`, params);
  if (!rows[0]) throw notFound('Atendimento não encontrado ou fora do seu escopo.');
  return rows[0];
}

async function addEvent(client, ticketId, userId, kind, body, extra = {}) {
  const { rows } = await client.query(
    `INSERT INTO ticket_events (ticket_id, user_id, kind, direction, channel, body, payload) VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *, (SELECT name FROM users WHERE id = $2) AS user_name`,
    [ticketId, userId, kind, extra.direction || null, extra.channel || null, body, JSON.stringify(extra.payload || {})]);
  return rows[0];
}

// Rodízio: próximo atendente ativo e disponível que recebeu atendimento há mais tempo.
async function pickNextAttendant(client, excludeId) {
  const { rows } = await client.query(
    `SELECT id, name FROM users WHERE active AND available AND role = 'atendente' AND id <> COALESCE($1, 0)
     ORDER BY last_assigned_at NULLS FIRST, id LIMIT 1 FOR UPDATE SKIP LOCKED`, [excludeId || null]);
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
});

router.get('/', async (req, res, next) => {
  try {
    const params = [];
    const where = [scopeSql(req.user, params)];
    const q = req.query;
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
    if (q.q) { params.push(`%${q.q.trim()}%`); where.push(`(t.protocol ILIKE $${params.length} OR t.subject ILIKE $${params.length} OR c.name ILIKE $${params.length} OR c.phone ILIKE $${params.length})`); }
    if (q.from) { params.push(q.from); where.push(`t.opened_at >= $${params.length}::timestamptz`); }
    if (q.to) { params.push(q.to); where.push(`t.opened_at < ($${params.length}::date + 1)`); }
    const limit = Math.min(Number(q.limit) || 50, 300);
    const page = Math.max(Number(q.page) || 1, 1);
    const base = `FROM tickets t JOIN customers c ON c.id = t.customer_id LEFT JOIN users u ON u.id = t.assignee_id LEFT JOIN users cb ON cb.id = t.created_by WHERE ${where.join(' AND ')}`;
    const total = (await query(`SELECT count(*)::int AS n ${base}`, params)).rows[0].n;
    params.push(limit, (page - 1) * limit);
    const { rows } = await query(`${SELECT.replace(/FROM tickets[\s\S]*/, '')} ${base}
      ORDER BY CASE t.priority WHEN 'urgente' THEN 0 WHEN 'alta' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, t.opened_at ASC
      LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
    res.json({ tickets: rows, total, page, limit });
  } catch (err) { next(err); }
});

router.get('/export.csv', async (req, res, next) => {
  try {
    const params = [];
    const where = [scopeSql(req.user, params)];
    if (req.query.from) { params.push(req.query.from); where.push(`t.opened_at >= $${params.length}::timestamptz`); }
    if (req.query.to) { params.push(req.query.to); where.push(`t.opened_at < ($${params.length}::date + 1)`); }
    const { rows } = await query(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY t.opened_at DESC`, params);
    await audit(req, 'tickets_export', 'ticket', null, { count: rows.length });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="atendimentos.csv"');
    res.send(toCsv(rows, [
      { key: 'protocol', label: 'protocolo' }, { key: 'customer_name', label: 'cliente' }, { key: 'subject', label: 'assunto' }, { key: 'channel', label: 'canal' },
      { key: 'priority', label: 'prioridade' }, { label: 'status', get: (r) => STATUS_LABEL[r.status] }, { key: 'assignee_name', label: 'responsavel' },
      { key: 'opened_at', label: 'abertura' }, { key: 'first_response_at', label: 'primeira_resposta' }, { key: 'closed_at', label: 'encerramento' }, { key: 'follow_up_at', label: 'retorno_agendado' },
    ]));
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const t = await loadTicket(req, Number(req.params.id));
    const events = await query(`SELECT e.*, u.name AS user_name FROM ticket_events e LEFT JOIN users u ON u.id = e.user_id WHERE e.ticket_id = $1 ORDER BY e.created_at ASC, e.id ASC`, [t.id]);
    const tasks = await query(`SELECT t.*, u.name AS assignee_name FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.ticket_id = $1 ORDER BY t.due_at`, [t.id]);
    const opps = await query(`SELECT o.id, o.title, o.value, s.name AS stage_name, s.kind AS stage_kind FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id WHERE o.ticket_id = $1`, [t.id]);
    res.json({ ticket: t, events: events.rows, tasks: tasks.rows, opportunities: opps.rows });
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
      if (assigneeId) {
        await addEvent(client, t.id, req.user.id, 'system', distributed ? 'Distribuído automaticamente (rodízio)' : 'Responsável atribuído', { payload: { action: 'assigned', to: assigneeId, auto: distributed } });
        if (assigneeId !== req.user.id) await notify(assigneeId, 'Novo atendimento atribuído', `${protocol} — ${d.subject}`, `#/atendimentos/${t.id}`, client);
      }
      await audit(req, 'ticket_create', 'ticket', t.id, { protocol, assignee_id: assigneeId, auto: distributed }, client);
      return t;
    });
    broadcast('tickets_changed', { id: result.id, action: 'created' });
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
        `UPDATE tickets SET status = $1, closed_at = CASE WHEN $2::boolean THEN now() ELSE NULL END, version = version + 1, updated_at = now() WHERE id = $3 RETURNING *`,
        [req.data.status, closing, id]);
      await addEvent(client, id, req.user.id, 'system', `Status alterado: ${STATUS_LABEL[t.status]} → ${STATUS_LABEL[req.data.status]}${req.data.note ? ` — ${req.data.note}` : ''}`,
        { payload: { action: 'status', from: t.status, to: req.data.status } });
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

// Anotação interna
router.post('/:id/notes', validate(z.object({ body: z.string().trim().min(1).max(5000) })), async (req, res, next) => {
  try {
    const t = await loadTicket(req, Number(req.params.id));
    const ev = await tx(async (client) => {
      const e = await addEvent(client, t.id, req.user.id, 'note', req.data.body);
      await client.query('UPDATE tickets SET updated_at = now() WHERE id = $1', [t.id]);
      return e;
    });
    res.status(201).json({ event: ev, message: 'Anotação interna registrada.' });
  } catch (err) { next(err); }
});

// Interação com o cliente (registro manual). Primeira saída define a "primeira resposta".
router.post('/:id/interactions', validate(z.object({
  direction: z.enum(['entrada', 'saida']),
  channel: z.string().trim().min(1).max(60),
  body: z.string().trim().min(1).max(10000),
})), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const out = await tx(async (client) => {
      const t = await loadTicket(req, id, client);
      if (!isManager(req.user) && t.assignee_id !== req.user.id) throw forbidden('Assuma o atendimento para registrar interações.');
      const e = await addEvent(client, id, req.user.id, 'interaction', req.data.body, { direction: req.data.direction, channel: req.data.channel });
      const upd = await client.query(
        `UPDATE tickets SET first_response_at = CASE WHEN $1 = 'saida' AND first_response_at IS NULL THEN now() ELSE first_response_at END, updated_at = now() WHERE id = $2 RETURNING *`,
        [req.data.direction, id]);
      return { event: e, ticket: upd.rows[0] };
    });
    res.status(201).json({ ...out, message: 'Interação registrada.' });
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
        const r = await client.query(
          `INSERT INTO tasks (title, description, customer_id, ticket_id, assignee_id, due_at, priority, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,'alta',$7) RETURNING *`,
          [`Retorno: ${t.subject} (${t.protocol})`, req.data.note || null, t.customer_id, id, t.assignee_id || req.user.id, req.data.at, req.user.id]);
        task = r.rows[0];
        await addEvent(client, id, req.user.id, 'system', `Retorno agendado para ${new Date(req.data.at).toLocaleString('pt-BR')}${req.data.note ? ` — ${req.data.note}` : ''}`, { payload: { action: 'follow_up', at: req.data.at } });
      } else {
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

module.exports = { router, STATUS_LABEL, OPEN };
