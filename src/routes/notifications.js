'use strict';
const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { subscribe } = require('../lib/realtime');

const router = express.Router();
router.use(requireAuth);

router.get('/stream', (req, res) => subscribe(req, res));

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.id]);
    // Inclui alertas calculados: tarefas atrasadas e retornos pendentes de hoje.
    const alerts = (await query(
      `SELECT (SELECT count(*)::int FROM tasks WHERE assignee_id = $1 AND done_at IS NULL AND due_at < now()) AS overdue_tasks,
              (SELECT count(*)::int FROM tickets WHERE assignee_id = $1 AND follow_up_at IS NOT NULL AND follow_up_at <= now() + interval '1 day' AND status NOT IN ('resolvido','cancelado')) AS follow_ups_due`,
      [req.user.id])).rows[0];
    res.json({ notifications: rows, unread: rows.filter((n) => !n.read_at).length, alerts });
  } catch (err) { next(err); }
});

router.post('/read-all', async (req, res, next) => {
  try {
    await query('UPDATE notifications SET read_at = now() WHERE user_id = $1 AND read_at IS NULL', [req.user.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/:id/read', async (req, res, next) => {
  try {
    await query('UPDATE notifications SET read_at = now() WHERE id = $1 AND user_id = $2', [Number(req.params.id), req.user.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
