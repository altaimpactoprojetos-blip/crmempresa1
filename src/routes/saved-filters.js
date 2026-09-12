'use strict';
// Filtros salvos por usuário (opcionalmente compartilhados com a equipe por supervisores/administradores).
const express = require('express');
const { z } = require('zod');
const { query } = require('../db');
const { validate } = require('../middleware/validate');
const { requireAuth, isManager } = require('../middleware/auth');
const { notFound, forbidden } = require('../lib/errors');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const params = [req.user.id];
    let where = '(f.user_id = $1 OR f.shared)';
    if (req.query.scope) { params.push(req.query.scope); where += ` AND f.scope = $${params.length}`; }
    const { rows } = await query(`SELECT f.*, u.name AS user_name FROM saved_filters f LEFT JOIN users u ON u.id = f.user_id WHERE ${where} ORDER BY f.shared, f.name`, params);
    res.json({ filters: rows });
  } catch (err) { next(err); }
});

const schema = z.object({
  scope: z.enum(['tickets', 'pipeline', 'customers', 'tasks']),
  name: z.string().trim().min(1).max(60),
  params: z.record(z.any()).default({}),
  shared: z.boolean().optional(),
});

router.post('/', validate(schema), async (req, res, next) => {
  try {
    const d = req.data;
    const shared = Boolean(d.shared) && isManager(req.user);
    const { rows } = await query('INSERT INTO saved_filters (user_id, scope, name, params, shared) VALUES ($1,$2,$3,$4,$5) RETURNING *', [req.user.id, d.scope, d.name, JSON.stringify(d.params), shared]);
    res.status(201).json({ filter: rows[0], message: 'Filtro salvo.' });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const f = (await query('SELECT * FROM saved_filters WHERE id = $1', [Number(req.params.id)])).rows[0];
    if (!f) return next(notFound());
    if (f.user_id !== req.user.id && !isManager(req.user)) return next(forbidden());
    await query('DELETE FROM saved_filters WHERE id = $1', [f.id]);
    res.json({ ok: true, message: 'Filtro removido.' });
  } catch (err) { next(err); }
});

module.exports = router;
