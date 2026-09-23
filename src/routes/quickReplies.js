'use strict';
// Respostas rápidas: textos prontos inseridos no chat digitando "/atalho".
const express = require('express');
const { z } = require('zod');
const { query } = require('../db');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { notFound, conflict } = require('../lib/errors');

const router = express.Router();
router.use(requireAuth);

const schema = z.object({
  shortcut: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]{1,30}$/, 'Use letras, números, "-" ou "_" (sem espaços).'),
  body: z.string().trim().min(1).max(4000),
});

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT id, shortcut, body, updated_at FROM quick_replies ORDER BY shortcut');
    res.json({ quick_replies: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireRole('admin', 'supervisor'), validate(schema), async (req, res, next) => {
  try {
    const { rows } = await query(
      'INSERT INTO quick_replies (shortcut, body, created_by) VALUES ($1, $2, $3) RETURNING *',
      [req.data.shortcut, req.data.body, req.user.id],
    );
    res.status(201).json({ quick_reply: rows[0], message: 'Resposta rápida criada.' });
  } catch (err) {
    next(err.code === '23505' ? conflict('Já existe uma resposta com este atalho.') : err);
  }
});

router.put('/:id', requireRole('admin', 'supervisor'), validate(schema.partial()), async (req, res, next) => {
  try {
    const { rows } = await query(
      `UPDATE quick_replies SET shortcut = COALESCE($2, shortcut), body = COALESCE($3, body), updated_at = now()
       WHERE id = $1 RETURNING *`,
      [Number(req.params.id), req.data.shortcut ?? null, req.data.body ?? null],
    );
    if (!rows[0]) return next(notFound('Resposta rápida não encontrada.'));
    res.json({ quick_reply: rows[0], message: 'Resposta rápida atualizada.' });
  } catch (err) {
    next(err.code === '23505' ? conflict('Já existe uma resposta com este atalho.') : err);
  }
});

router.delete('/:id', requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const r = await query('DELETE FROM quick_replies WHERE id = $1', [Number(req.params.id)]);
    if (!r.rowCount) return next(notFound('Resposta rápida não encontrada.'));
    res.json({ ok: true, message: 'Resposta rápida excluída.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
