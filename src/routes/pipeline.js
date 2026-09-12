'use strict';
const express = require('express');
const { z } = require('zod');
const { query, tx } = require('../db');
const { validate } = require('../middleware/validate');
const { requireAuth, isManager } = require('../middleware/auth');
const { badRequest, notFound, conflict, forbidden } = require('../lib/errors');
const { audit } = require('../lib/audit');
const { broadcast } = require('../lib/realtime');
const { notify } = require('../lib/notify');
const { toCsv } = require('../lib/util');
const automations = require('../lib/automations');

const router = express.Router();
router.use(requireAuth);

function scopeSql(user, params) {
  if (isManager(user)) return 'TRUE';
  params.push(user.id);
  return `(o.owner_id = $${params.length} OR o.owner_id IS NULL)`;
}

const SELECT = `SELECT o.*, c.name AS customer_name, c.phone AS customer_phone, c.email AS customer_email, c.company AS customer_company, c.source AS customer_source, c.tags AS customer_tags,
  u.name AS owner_name, s.name AS stage_name, s.kind AS stage_kind, s.pipeline_id, p.name AS pipeline_name,
  (SELECT count(*)::int FROM tasks t WHERE t.opportunity_id = o.id AND t.done_at IS NULL) AS open_tasks,
  (SELECT min(t.due_at) FROM tasks t WHERE t.opportunity_id = o.id AND t.done_at IS NULL) AS next_task_at,
  (SELECT max(e.created_at) FROM ticket_events e JOIN tickets t ON t.id = e.ticket_id WHERE t.customer_id = o.customer_id AND e.kind = 'interaction') AS last_contact_at,
  (SELECT t.id FROM tickets t WHERE t.customer_id = o.customer_id AND t.status NOT IN ('resolvido','cancelado') ORDER BY t.opened_at DESC LIMIT 1) AS open_ticket_id,
  (SELECT t.status FROM tickets t WHERE t.customer_id = o.customer_id AND t.status NOT IN ('resolvido','cancelado') ORDER BY t.opened_at DESC LIMIT 1) AS open_ticket_status
  FROM opportunities o JOIN customers c ON c.id = o.customer_id LEFT JOIN users u ON u.id = o.owner_id JOIN pipeline_stages s ON s.id = o.stage_id JOIN pipelines p ON p.id = s.pipeline_id`;

async function load(req, id, client) {
  const q = client ? client.query.bind(client) : query;
  const params = [id];
  const { rows } = await q(`${SELECT} WHERE o.id = $1 AND ${scopeSql(req.user, params)}`, params);
  if (!rows[0]) throw notFound('Oportunidade não encontrada ou fora do seu escopo.');
  return rows[0];
}

const schema = z.object({
  title: z.string().trim().min(2).max(200),
  customer_id: z.number().int().positive(),
  owner_id: z.number().int().positive().nullable().optional(),
  stage_id: z.number().int().positive().optional(),
  pipeline_id: z.number().int().positive().optional(),
  value: z.number().min(0).max(1e12).default(0),
  next_action: z.string().trim().max(300).nullable().optional(),
  next_action_at: z.string().datetime({ offset: true }).nullable().optional(),
  expected_close_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.').nullable().optional(),
  ticket_id: z.number().int().positive().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  source: z.string().trim().max(60).nullable().optional(),
  version: z.number().int().optional(),
});

const SORTS = { updated_at: 'o.updated_at', created_at: 'o.created_at', value: 'o.value', title: 'o.title', customer_name: 'c.name', owner_name: 'u.name', stage: 's.position', expected_close_date: 'o.expected_close_date', next_action_at: 'o.next_action_at' };

router.get('/', async (req, res, next) => {
  try {
    const params = [];
    const where = [scopeSql(req.user, params)];
    const q = req.query;
    let pipelineId = q.pipeline_id ? Number(q.pipeline_id) : null;
    const pipelines = (await query('SELECT * FROM pipelines WHERE active ORDER BY position, id')).rows;
    if (!pipelineId && !q.all_pipelines) pipelineId = (pipelines.find((p) => p.is_default) || pipelines[0] || {}).id || null;
    if (pipelineId) { params.push(pipelineId); where.push(`s.pipeline_id = $${params.length}`); }
    if (q.owner_id === 'none') where.push('o.owner_id IS NULL');
    else if (q.owner_id) { params.push(Number(q.owner_id)); where.push(`o.owner_id = $${params.length}`); }
    if (q.customer_id) { params.push(Number(q.customer_id)); where.push(`o.customer_id = $${params.length}`); }
    if (q.q) { params.push(`%${q.q.trim()}%`); where.push(`(o.title ILIKE $${params.length} OR c.name ILIKE $${params.length} OR c.company ILIKE $${params.length})`); }
    if (q.tag) { params.push(q.tag); where.push(`($${params.length} = ANY(o.tags) OR $${params.length} = ANY(c.tags))`); }
    if (q.source) { params.push(q.source); where.push(`COALESCE(o.source, c.source) = $${params.length}`); }
    if (q.stage_id) { params.push(Number(q.stage_id)); where.push(`o.stage_id = $${params.length}`); }
    if (q.open === 'true') where.push(`s.kind = 'open'`);
    if (q.kind) { params.push(q.kind); where.push(`s.kind = $${params.length}`); }
    if (q.no_task === 'true') where.push(`s.kind = 'open' AND NOT EXISTS (SELECT 1 FROM tasks t WHERE t.opportunity_id = o.id AND t.done_at IS NULL) AND (o.next_action_at IS NULL)`);
    if (q.overdue === 'true') where.push(`s.kind = 'open' AND ((o.next_action_at IS NOT NULL AND o.next_action_at < now()) OR EXISTS (SELECT 1 FROM tasks t WHERE t.opportunity_id = o.id AND t.done_at IS NULL AND t.due_at < now()))`);
    if (q.idle_days) { params.push(String(Number(q.idle_days) || 7)); where.push(`s.kind = 'open' AND o.updated_at < now() - ($${params.length} || ' days')::interval`); }
    if (q.min_value) { params.push(Number(q.min_value)); where.push(`o.value >= $${params.length}`); }
    if (q.closed_from) { params.push(q.closed_from); where.push(`o.closed_at >= $${params.length}::timestamptz`); }
    if (q.from) { params.push(q.from); where.push(`o.created_at >= $${params.length}::date`); }
    if (q.to) { params.push(q.to); where.push(`o.created_at < ($${params.length}::date + 1)`); }
    const stagesParams = pipelineId ? [pipelineId] : [];
    const stages = await query(`SELECT * FROM pipeline_stages WHERE active ${pipelineId ? 'AND pipeline_id = $1' : ''} ORDER BY pipeline_id, position`, stagesParams);
    let order = 'o.updated_at DESC';
    if (q.sort && SORTS[q.sort]) order = `${SORTS[q.sort]} ${q.dir === 'desc' ? 'DESC NULLS LAST' : 'ASC NULLS LAST'}`;
    const { rows } = await query(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT 1000`, params);
    // No Kanban, etapas fechadas mostram somente os últimos 30 dias para não acumular.
    const cutoff = Date.now() - 30 * 86400000;
    const list = q.all === 'true' ? rows : rows.filter((o) => o.stage_kind === 'open' || !o.closed_at || new Date(o.closed_at).getTime() >= cutoff);
    res.json({ pipelines, pipeline_id: pipelineId, stages: stages.rows, opportunities: list, total: rows.length });
  } catch (err) { next(err); }
});

router.get('/export.csv', async (req, res, next) => {
  try {
    const params = [];
    const { rows } = await query(`${SELECT} WHERE ${scopeSql(req.user, params)} ORDER BY o.created_at DESC`, params);
    await audit(req, 'opportunities_export', 'opportunity', null, { count: rows.length });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="oportunidades.csv"');
    res.send(toCsv(rows, [
      { key: 'id', label: 'id' }, { key: 'title', label: 'titulo' }, { key: 'customer_name', label: 'cliente' }, { key: 'owner_name', label: 'responsavel' }, { key: 'pipeline_name', label: 'funil' },
      { key: 'stage_name', label: 'etapa' }, { key: 'value', label: 'valor' }, { key: 'next_action', label: 'proxima_acao' }, { key: 'next_action_at', label: 'proxima_acao_em' },
      { key: 'expected_close_date', label: 'previsao_fechamento' }, { key: 'lost_reason', label: 'motivo_perda' }, { key: 'tags', label: 'etiquetas' }, { key: 'created_at', label: 'criado_em' }, { key: 'closed_at', label: 'fechado_em' },
    ]));
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const o = await load(req, Number(req.params.id));
    const [events, tasks, tickets, stages] = await Promise.all([
      query(`SELECT e.*, u.name AS user_name FROM opportunity_events e LEFT JOIN users u ON u.id = e.user_id WHERE e.opportunity_id = $1 ORDER BY e.created_at DESC, e.id DESC`, [o.id]),
      query(`SELECT t.*, u.name AS assignee_name FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.opportunity_id = $1 ORDER BY t.done_at NULLS FIRST, t.due_at`, [o.id]),
      query(`SELECT id, protocol, subject, status, opened_at, assignee_id FROM tickets WHERE customer_id = $1 ORDER BY opened_at DESC LIMIT 6`, [o.customer_id]),
      query('SELECT * FROM pipeline_stages WHERE active AND pipeline_id = $1 ORDER BY position', [o.pipeline_id]),
    ]);
    res.json({ opportunity: o, events: events.rows, tasks: tasks.rows, tickets: tickets.rows, stages: stages.rows });
  } catch (err) { next(err); }
});

router.post('/', validate(schema), async (req, res, next) => {
  try {
    const d = req.data;
    if (req.user.role === 'atendente' && d.owner_id && d.owner_id !== req.user.id) return next(forbidden('Atendentes só podem criar oportunidades sob sua própria responsabilidade.'));
    const out = await tx(async (client) => {
      const cust = await client.query('SELECT id, source FROM customers WHERE id = $1', [d.customer_id]);
      if (!cust.rowCount) throw badRequest('Cliente não encontrado.', { fields: { customer_id: 'Cliente inválido.' } });
      let stageId = d.stage_id;
      if (!stageId) {
        const pipelineId = d.pipeline_id || (await client.query('SELECT id FROM pipelines WHERE active ORDER BY is_default DESC, position LIMIT 1')).rows[0]?.id;
        stageId = (await client.query(`SELECT id FROM pipeline_stages WHERE active AND kind = 'open' AND pipeline_id = $1 ORDER BY position LIMIT 1`, [pipelineId])).rows[0]?.id;
      }
      const stage = stageId ? (await client.query('SELECT * FROM pipeline_stages WHERE id = $1 AND active', [stageId])).rows[0] : null;
      if (!stage) throw badRequest('Etapa inválida.');
      if (stage.kind !== 'open') throw badRequest('Crie a oportunidade em uma etapa aberta.');
      const ownerId = d.owner_id === undefined ? req.user.id : d.owner_id;
      const { rows } = await client.query(
        `INSERT INTO opportunities (title, customer_id, owner_id, stage_id, value, next_action, next_action_at, expected_close_date, ticket_id, tags, source, created_by, stage_entered_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now()) RETURNING *`,
        [d.title, d.customer_id, ownerId, stageId, d.value, d.next_action || null, d.next_action_at || null, d.expected_close_date || null, d.ticket_id || null, d.tags || [], d.source || cust.rows[0].source || null, req.user.id]);
      await client.query('INSERT INTO opportunity_events (opportunity_id, user_id, body, payload) VALUES ($1,$2,$3,$4)',
        [rows[0].id, req.user.id, `Oportunidade criada na etapa "${stage.name}"`, JSON.stringify({ action: 'created', stage_id: stageId })]);
      await audit(req, 'opportunity_create', 'opportunity', rows[0].id, { title: d.title, value: d.value }, client);
      return rows[0];
    });
    broadcast('pipeline_changed', { id: out.id });
    res.status(201).json({ opportunity: out, message: 'Oportunidade criada.' });
  } catch (err) { next(err); }
});

router.put('/:id', validate(schema.partial()), async (req, res, next) => {
  try {
    const o = await load(req, Number(req.params.id));
    const d = req.data;
    if (!isManager(req.user) && o.owner_id !== req.user.id && o.owner_id !== null) return next(forbidden('Somente o responsável pode editar esta oportunidade.'));
    if (d.version !== undefined && d.version !== o.version) return next(conflict('Esta oportunidade foi alterada por outro usuário. Recarregue para ver a versão atual.', { current: o }));
    if (d.stage_id !== undefined && d.stage_id !== o.stage_id) return next(badRequest('Use a ação "mover etapa" para alterar a etapa.'));
    if (!isManager(req.user) && d.owner_id !== undefined && d.owner_id !== null && d.owner_id !== req.user.id) return next(forbidden('Atendentes não podem atribuir oportunidades a outros usuários.'));
    const { rows } = await query(
      `UPDATE opportunities SET title = COALESCE($1, title), owner_id = CASE WHEN $2::boolean THEN $3 ELSE owner_id END, value = COALESCE($4, value),
        next_action = CASE WHEN $5::boolean THEN $6 ELSE next_action END, next_action_at = CASE WHEN $7::boolean THEN $8 ELSE next_action_at END,
        expected_close_date = CASE WHEN $9::boolean THEN $10 ELSE expected_close_date END, tags = COALESCE($11, tags), source = CASE WHEN $12::boolean THEN $13 ELSE source END,
        version = version + 1, updated_at = now() WHERE id = $14 RETURNING *`,
      [d.title ?? null, d.owner_id !== undefined, d.owner_id ?? null, d.value ?? null, d.next_action !== undefined, d.next_action ?? null,
        d.next_action_at !== undefined, d.next_action_at ?? null, d.expected_close_date !== undefined, d.expected_close_date ?? null, d.tags ?? null, d.source !== undefined, d.source ?? null, o.id]);
    const changed = Object.keys(d).filter((k) => k !== 'version' && JSON.stringify(d[k]) !== JSON.stringify(o[k]));
    if (changed.length) await query('INSERT INTO opportunity_events (opportunity_id, user_id, body, payload) VALUES ($1,$2,$3,$4)', [o.id, req.user.id, `Campos atualizados: ${changed.map(fieldLabel).join(', ')}`, JSON.stringify({ action: 'updated', fields: changed })]);
    if (d.owner_id !== undefined && d.owner_id !== o.owner_id && d.owner_id && d.owner_id !== req.user.id) await notify(d.owner_id, 'Oportunidade atribuída a você', o.title, `#/funil/${o.id}`);
    await audit(req, 'opportunity_update', 'opportunity', o.id, { fields: Object.keys(d) });
    broadcast('pipeline_changed', { id: o.id });
    res.json({ opportunity: rows[0], message: 'Oportunidade atualizada.' });
  } catch (err) { next(err); }
});
function fieldLabel(k) { return ({ title: 'título', owner_id: 'responsável', value: 'valor', next_action: 'próxima ação', next_action_at: 'data da próxima ação', expected_close_date: 'previsão', tags: 'etiquetas', source: 'origem' })[k] || k; }

// Mover de etapa (Kanban). Ao marcar como perdida, o motivo é obrigatório.
router.post('/:id/move', validate(z.object({ stage_id: z.number().int().positive(), lost_reason: z.string().trim().max(300).optional(), version: z.number().int().optional() })), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    let moved = null;
    const out = await tx(async (client) => {
      const o = await load(req, id, client);
      if (!isManager(req.user) && o.owner_id !== req.user.id && o.owner_id !== null) throw forbidden('Somente o responsável pode mover esta oportunidade.');
      if (req.data.version !== undefined && req.data.version !== o.version) throw conflict('Esta oportunidade foi alterada por outro usuário. Recarregue para ver a versão atual.', { current: o });
      const stage = (await client.query('SELECT * FROM pipeline_stages WHERE id = $1 AND active', [req.data.stage_id])).rows[0];
      if (!stage) throw badRequest('Etapa inválida.');
      if (stage.pipeline_id !== o.pipeline_id) throw badRequest('A etapa pertence a outro funil.');
      if (stage.id === o.stage_id) return o;
      if (stage.kind === 'lost' && !req.data.lost_reason) throw badRequest('Informe o motivo da perda.', { fields: { lost_reason: 'Motivo obrigatório.' }, requires_lost_reason: true });
      const closed = stage.kind !== 'open';
      const { rows } = await client.query(
        `UPDATE opportunities SET stage_id = $1, closed_at = CASE WHEN $2::boolean THEN now() ELSE NULL END, lost_reason = CASE WHEN $3::boolean THEN $4 ELSE NULL END,
         stage_entered_at = now(), version = version + 1, updated_at = now() WHERE id = $5 RETURNING *`,
        [stage.id, closed, stage.kind === 'lost', req.data.lost_reason || null, id]);
      await client.query('INSERT INTO opportunity_events (opportunity_id, user_id, body, payload) VALUES ($1,$2,$3,$4)',
        [id, req.user.id, `Movida de "${o.stage_name}" para "${stage.name}"${stage.kind === 'lost' ? ` — motivo: ${req.data.lost_reason}` : ''}`,
          JSON.stringify({ action: 'move', from: o.stage_id, to: stage.id, lost_reason: req.data.lost_reason || null })]);
      if (closed) await client.query(`UPDATE tasks SET done_at = now(), closed_reason = 'Negociação encerrada', updated_at = now() WHERE opportunity_id = $1 AND done_at IS NULL AND (automation_rule_id IS NOT NULL OR kind = 'acompanhamento')`, [id]);
      await audit(req, 'opportunity_move', 'opportunity', id, { from: o.stage_id, to: stage.id, kind: stage.kind }, client);
      moved = stage;
      return rows[0];
    });
    broadcast('pipeline_changed', { id });
    if (moved) setImmediate(() => automations.trigger('opportunity_stage_changed', 'opportunity', id, { dedupeKey: `stage:${moved.id}:${Date.now()}` }));
    res.json({ opportunity: out, message: 'Etapa atualizada.' });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!isManager(req.user)) return next(forbidden('Apenas administradores e supervisores podem excluir oportunidades.'));
    const o = await load(req, Number(req.params.id));
    await query('DELETE FROM opportunities WHERE id = $1', [o.id]);
    await audit(req, 'opportunity_delete', 'opportunity', o.id, { title: o.title });
    broadcast('pipeline_changed', { id: o.id });
    res.json({ ok: true, message: 'Oportunidade excluída.' });
  } catch (err) { next(err); }
});

module.exports = router;
