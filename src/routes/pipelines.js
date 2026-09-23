'use strict';
// Funis da empresa (ex.: Vendas, Pós-venda). As etapas de cada um são editadas em /settings/stages.
const express = require('express');
const { z } = require('zod');
const { query, tx } = require('../db');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { badRequest, notFound, conflict } = require('../lib/errors');
const { audit } = require('../lib/audit');
const { broadcast } = require('../lib/realtime');
const { insertStages, NEW_PIPELINE_STAGES } = require('../lib/companies');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (_req, res, next) => {
  try {
    const pipelines = (await query('SELECT * FROM pipelines ORDER BY position, id')).rows;
    const stages = (await query('SELECT * FROM pipeline_stages ORDER BY position')).rows;
    res.json({ pipelines: pipelines.map((p) => ({ ...p, stages: stages.filter((s) => s.pipeline_id === p.id) })) });
  } catch (err) {
    next(err);
  }
});

const nameSchema = z.object({ name: z.string().trim().min(2).max(60) });

router.post('/', requireRole('admin'), validate(nameSchema), async (req, res, next) => {
  try {
    const pipeline = await tx(async (client) => {
      const count = (await client.query('SELECT count(*)::int AS n FROM pipelines')).rows[0].n;
      if (count >= 20) throw badRequest('Limite de 20 funis por empresa.');
      const p = (
        await client.query('INSERT INTO pipelines (name, position) VALUES ($1, $2) RETURNING *', [
          req.data.name,
          count + 1,
        ])
      ).rows[0];
      await insertStages(client, req.user.company_id, p.id, NEW_PIPELINE_STAGES);
      return p;
    });
    await audit(req, 'pipeline_create', 'pipeline', pipeline.id, { name: pipeline.name });
    broadcast('pipeline_changed', {});
    res.status(201).json({ pipeline, message: 'Funil criado. Ajuste as etapas como preferir.' });
  } catch (err) {
    next(err);
  }
});

router.put(
  '/:id',
  requireRole('admin'),
  validate(nameSchema.partial().extend({ is_default: z.literal(true).optional() })),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const out = await tx(async (client) => {
        const cur = (await client.query('SELECT * FROM pipelines WHERE id = $1', [id])).rows[0];
        if (!cur) throw notFound('Funil não encontrado.');
        if (req.data.is_default) await client.query('UPDATE pipelines SET is_default = FALSE WHERE is_default');
        return (
          await client.query(
            `UPDATE pipelines SET name = COALESCE($2, name), is_default = is_default OR COALESCE($3, FALSE)
             WHERE id = $1 RETURNING *`,
            [id, req.data.name ?? null, req.data.is_default ?? null],
          )
        ).rows[0];
      });
      await audit(req, 'pipeline_update', 'pipeline', id, req.data);
      broadcast('pipeline_changed', {});
      res.json({ pipeline: out, message: 'Funil atualizado.' });
    } catch (err) {
      next(err);
    }
  },
);

router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const cur = (await query('SELECT * FROM pipelines WHERE id = $1', [id])).rows[0];
    if (!cur) return next(notFound('Funil não encontrado.'));
    if (cur.is_default) return next(badRequest('Defina outro funil como principal antes de excluir este.'));
    const used = await query(
      'SELECT 1 FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id WHERE s.pipeline_id = $1 LIMIT 1',
      [id],
    );
    if (used.rowCount)
      return next(conflict('Este funil tem oportunidades. Mova-as para outro funil antes de excluir.'));
    await query('DELETE FROM pipelines WHERE id = $1', [id]);
    await audit(req, 'pipeline_delete', 'pipeline', id, { name: cur.name });
    broadcast('pipeline_changed', {});
    res.json({ ok: true, message: 'Funil excluído.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
