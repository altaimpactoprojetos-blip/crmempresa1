'use strict';
// Respostas rápidas: qualquer usuário consulta; administradores e supervisores mantêm.
const express = require('express');
const { z } = require('zod');
const { query } = require('../db');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { notFound } = require('../lib/errors');
const { audit } = require('../lib/audit');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const all = req.query.all === 'true' && req.user.role !== 'atendente';
    const { rows } = await query(`SELECT q.*, u.name AS created_by_name FROM quick_replies q LEFT JOIN users u ON u.id = q.created_by ${all ? '' : 'WHERE q.active'} ORDER BY q.active DESC, q.title`);
    res.json({ quick_replies: rows });
  } catch (err) { next(err); }
});

const schema = z.object({
  title: z.string().trim().min(1).max(80),
  shortcut: z.string().trim().max(30).nullable().optional(),
  body: z.string().trim().min(1).max(4000),
  active: z.boolean().optional(),
});

router.post('/', requireRole('admin', 'supervisor'), validate(schema), async (req, res, next) => {
  try {
    const d = req.data;
    const { rows } = await query('INSERT INTO quick_replies (title, shortcut, body, active, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING *', [d.title, d.shortcut || null, d.body, d.active !== false, req.user.id]);
    await audit(req, 'quick_reply_create', 'quick_reply', rows[0].id, { title: d.title });
    res.status(201).json({ quick_reply: rows[0], message: 'Resposta rápida criada.' });
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('admin', 'supervisor'), validate(schema.partial()), async (req, res, next) => {
  try {
    const d = req.data;
    const { rows } = await query(`UPDATE quick_replies SET title = COALESCE($1, title), shortcut = CASE WHEN $2::boolean THEN $3 ELSE shortcut END, body = COALESCE($4, body), active = COALESCE($5, active), updated_at = now() WHERE id = $6 RETURNING *`,
      [d.title ?? null, d.shortcut !== undefined, d.shortcut ?? null, d.body ?? null, d.active ?? null, Number(req.params.id)]);
    if (!rows[0]) return next(notFound());
    await audit(req, 'quick_reply_update', 'quick_reply', rows[0].id, { fields: Object.keys(d) });
    res.json({ quick_reply: rows[0], message: 'Resposta rápida atualizada.' });
  } catch (err) { next(err); }
});

router.delete('/:id', requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM quick_replies WHERE id = $1', [Number(req.params.id)]);
    if (!rowCount) return next(notFound());
    await audit(req, 'quick_reply_delete', 'quick_reply', Number(req.params.id));
    res.json({ ok: true, message: 'Resposta rápida excluída.' });
  } catch (err) { next(err); }
});

module.exports = router;
