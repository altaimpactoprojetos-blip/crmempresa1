'use strict';
// Automações por etapa do funil.
const express = require('express');
const { z } = require('zod');
const { query } = require('../db');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { badRequest, notFound } = require('../lib/errors');
const { audit } = require('../lib/audit');

const router = express.Router();
router.use(requireAuth, requireRole('admin', 'supervisor'));

const who = z.union([z.enum(['owner', 'actor', 'none']), z.number().int().positive()]);
const action = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('create_task'),
    title: z.string().trim().min(2).max(200),
    due_in_hours: z.number().int().min(0).max(8760).default(24),
    assignee: who.default('owner'),
  }),
  z.object({ type: z.literal('send_whatsapp'), text: z.string().trim().min(1).max(4096) }),
  z.object({ type: z.literal('set_owner'), user_id: z.union([z.literal('round_robin'), z.number().int().positive()]) }),
  z.object({ type: z.literal('add_tag'), tag: z.string().trim().min(1).max(40) }),
  z.object({ type: z.literal('notify'), user: who.default('owner'), text: z.string().trim().min(1).max(300) }),
]);
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  stage_id: z.number().int().positive(),
  active: z.boolean().default(true),
  actions: z.array(action).min(1).max(10),
});

const SELECT = `SELECT a.*, s.name AS stage_name, s.pipeline_id, p.name AS pipeline_name,
    (SELECT row_to_json(r) FROM (SELECT status, created_at FROM automation_runs WHERE automation_id = a.id
       ORDER BY created_at DESC LIMIT 1) r) AS last_run
  FROM automations a JOIN pipeline_stages s ON s.id = a.stage_id JOIN pipelines p ON p.id = s.pipeline_id`;

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(`${SELECT} ORDER BY p.position, s.position, a.id`);
    res.json({ automations: rows });
  } catch (err) {
    next(err);
  }
});

async function checkStage(stageId) {
  const s = (await query('SELECT id FROM pipeline_stages WHERE id = $1 AND active', [stageId])).rows[0];
  if (!s) throw badRequest('Etapa inválida.', { fields: { stage_id: 'Escolha uma etapa.' } });
}

router.post('/', requireRole('admin'), validate(schema), async (req, res, next) => {
  try {
    const d = req.data;
    await checkStage(d.stage_id);
    const { rows } = await query(
      'INSERT INTO automations (name, stage_id, active, actions, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [d.name, d.stage_id, d.active, JSON.stringify(d.actions), req.user.id],
    );
    await audit(req, 'automation_create', 'automation', rows[0].id, { name: d.name });
    const a = (await query(`${SELECT} WHERE a.id = $1`, [rows[0].id])).rows[0];
    res.status(201).json({ automation: a, message: 'Automação criada.' });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireRole('admin'), validate(schema.partial()), async (req, res, next) => {
  try {
    const d = req.data;
    if (d.stage_id) await checkStage(d.stage_id);
    const { rowCount } = await query(
      `UPDATE automations SET name = COALESCE($2, name), stage_id = COALESCE($3, stage_id), active = COALESCE($4, active),
         actions = COALESCE($5, actions), updated_at = now() WHERE id = $1`,
      [
        Number(req.params.id),
        d.name ?? null,
        d.stage_id ?? null,
        d.active ?? null,
        d.actions ? JSON.stringify(d.actions) : null,
      ],
    );
    if (!rowCount) return next(notFound('Automação não encontrada.'));
    await audit(req, 'automation_update', 'automation', Number(req.params.id), { fields: Object.keys(d) });
    const a = (await query(`${SELECT} WHERE a.id = $1`, [Number(req.params.id)])).rows[0];
    res.json({ automation: a, message: 'Automação atualizada.' });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const r = await query('DELETE FROM automations WHERE id = $1', [Number(req.params.id)]);
    if (!r.rowCount) return next(notFound('Automação não encontrada.'));
    await audit(req, 'automation_delete', 'automation', Number(req.params.id));
    res.json({ ok: true, message: 'Automação excluída.' });
  } catch (err) {
    next(err);
  }
});

// Histórico de execuções (o que cada ação fez ou por que falhou)
router.get('/:id/runs', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT r.*, o.title AS opportunity_title FROM automation_runs r LEFT JOIN opportunities o ON o.id = r.opportunity_id
       WHERE r.automation_id = $1 ORDER BY r.created_at DESC LIMIT 50`,
      [Number(req.params.id)],
    );
    res.json({ runs: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
