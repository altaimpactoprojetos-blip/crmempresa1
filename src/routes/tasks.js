'use strict';
const express = require('express');
const { z } = require('zod');
const { query } = require('../db');
const { validate } = require('../middleware/validate');
const { requireAuth, isManager } = require('../middleware/auth');
const { notFound, forbidden } = require('../lib/errors');
const { audit } = require('../lib/audit');
const { notify } = require('../lib/notify');

const router = express.Router();
router.use(requireAuth);

const SELECT = `SELECT t.*, u.name AS assignee_name, c.name AS customer_name, o.title AS opportunity_title, tk.protocol AS ticket_protocol
  FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id LEFT JOIN customers c ON c.id = t.customer_id
  LEFT JOIN opportunities o ON o.id = t.opportunity_id LEFT JOIN tickets tk ON tk.id = t.ticket_id`;

function scopeSql(user, params) {
  if (isManager(user)) return 'TRUE';
  params.push(user.id);
  return `(t.assignee_id = $${params.length} OR t.created_by = $${params.length})`;
}

const schema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().max(5000).nullable().optional(),
  customer_id: z.number().int().positive().nullable().optional(),
  opportunity_id: z.number().int().positive().nullable().optional(),
  ticket_id: z.number().int().positive().nullable().optional(),
  assignee_id: z.number().int().positive().nullable().optional(),
  due_at: z.string().datetime({ offset: true }).nullable().optional(),
  priority: z.enum(['baixa', 'normal', 'alta']).default('normal'),
});

// GET /api/tasks?view=today|upcoming|overdue|done|all&assignee_id=
router.get('/', async (req, res, next) => {
  try {
    const params = [];
    const where = [scopeSql(req.user, params)];
    const view = req.query.view || 'all';
    if (view === 'today') where.push(`t.done_at IS NULL AND t.due_at::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date`);
    else if (view === 'upcoming') where.push(`t.done_at IS NULL AND t.due_at::date > (now() AT TIME ZONE 'America/Sao_Paulo')::date`);
    else if (view === 'overdue') where.push(`t.done_at IS NULL AND t.due_at < now()`);
    else if (view === 'open') where.push('t.done_at IS NULL');
    else if (view === 'done') where.push('t.done_at IS NOT NULL');
    if (req.query.assignee_id) { params.push(Number(req.query.assignee_id)); where.push(`t.assignee_id = $${params.length}`); }
    if (req.query.customer_id) { params.push(Number(req.query.customer_id)); where.push(`t.customer_id = $${params.length}`); }
    const { rows } = await query(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY t.done_at NULLS FIRST, t.due_at NULLS LAST, t.created_at DESC LIMIT 500`, params);
    const p2 = [];
    const scope2 = scopeSql(req.user, p2);
    const summary = (await query(
      `SELECT count(*) FILTER (WHERE done_at IS NULL AND due_at::date = (now() AT TIME ZONE 'America/Sao_Paulo')::date)::int AS today,
              count(*) FILTER (WHERE done_at IS NULL AND due_at::date > (now() AT TIME ZONE 'America/Sao_Paulo')::date)::int AS upcoming,
              count(*) FILTER (WHERE done_at IS NULL AND due_at < now())::int AS overdue,
              count(*) FILTER (WHERE done_at IS NULL)::int AS open
       FROM tasks t WHERE ${scope2}`, p2)).rows[0];
    res.json({ tasks: rows, summary });
  } catch (err) { next(err); }
});

router.post('/', validate(schema), async (req, res, next) => {
  try {
    const d = req.data;
    if (!isManager(req.user) && d.assignee_id && d.assignee_id !== req.user.id) return next(forbidden('Atendentes não podem atribuir tarefas a outros usuários.'));
    const assignee = d.assignee_id === undefined ? req.user.id : d.assignee_id;
    const { rows } = await query(
      `INSERT INTO tasks (title, description, customer_id, opportunity_id, ticket_id, assignee_id, due_at, priority, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [d.title, d.description || null, d.customer_id || null, d.opportunity_id || null, d.ticket_id || null, assignee, d.due_at || null, d.priority, req.user.id]);
    if (assignee && assignee !== req.user.id) await notify(assignee, 'Nova tarefa atribuída', d.title, '#/tarefas');
    await audit(req, 'task_create', 'task', rows[0].id, { title: d.title });
    res.status(201).json({ task: rows[0], message: 'Tarefa criada.' });
  } catch (err) { next(err); }
});

async function loadTask(req, id) {
  const params = [id];
  const { rows } = await query(`${SELECT} WHERE t.id = $1 AND ${scopeSql(req.user, params)}`, params);
  if (!rows[0]) throw notFound('Tarefa não encontrada ou fora do seu escopo.');
  return rows[0];
}

router.put('/:id', validate(schema.partial().extend({ done: z.boolean().optional() })), async (req, res, next) => {
  try {
    const t = await loadTask(req, Number(req.params.id));
    const d = req.data;
    if (!isManager(req.user) && d.assignee_id !== undefined && d.assignee_id !== null && d.assignee_id !== req.user.id) {
      return next(forbidden('Atendentes não podem atribuir tarefas a outros usuários.'));
    }
    const { rows } = await query(
      `UPDATE tasks SET title = COALESCE($1, title), description = CASE WHEN $2::boolean THEN $3 ELSE description END,
        customer_id = CASE WHEN $4::boolean THEN $5 ELSE customer_id END, opportunity_id = CASE WHEN $6::boolean THEN $7 ELSE opportunity_id END,
        assignee_id = CASE WHEN $8::boolean THEN $9 ELSE assignee_id END, due_at = CASE WHEN $10::boolean THEN $11 ELSE due_at END,
        priority = COALESCE($12, priority), done_at = CASE WHEN $13::boolean THEN (CASE WHEN $14::boolean THEN now() ELSE NULL END) ELSE done_at END,
        updated_at = now() WHERE id = $15 RETURNING *`,
      [d.title ?? null, d.description !== undefined, d.description ?? null, d.customer_id !== undefined, d.customer_id ?? null,
        d.opportunity_id !== undefined, d.opportunity_id ?? null, d.assignee_id !== undefined, d.assignee_id ?? null,
        d.due_at !== undefined, d.due_at ?? null, d.priority ?? null, d.done !== undefined, d.done === true, t.id]);
    if (d.assignee_id && d.assignee_id !== t.assignee_id && d.assignee_id !== req.user.id) await notify(d.assignee_id, 'Tarefa atribuída a você', t.title, '#/tarefas');
    await audit(req, 'task_update', 'task', t.id, { fields: Object.keys(d) });
    res.json({ task: rows[0], message: d.done === true ? 'Tarefa concluída.' : d.done === false ? 'Tarefa reaberta.' : 'Tarefa atualizada.' });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const t = await loadTask(req, Number(req.params.id));
    if (!isManager(req.user) && t.created_by !== req.user.id && t.assignee_id !== req.user.id) return next(forbidden());
    await query('DELETE FROM tasks WHERE id = $1', [t.id]);
    await audit(req, 'task_delete', 'task', t.id, { title: t.title });
    res.json({ ok: true, message: 'Tarefa excluída.' });
  } catch (err) { next(err); }
});

module.exports = router;
