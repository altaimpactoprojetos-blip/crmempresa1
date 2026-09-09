'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { query, tx } = require('../db');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole, ROLES } = require('../middleware/auth');
const { badRequest, notFound, conflict } = require('../lib/errors');
const { audit } = require('../lib/audit');
const { createResetToken } = require('./auth');
const { broadcast } = require('../lib/realtime');

const router = express.Router();
router.use(requireAuth);

// Lista resumida (para seleção de responsável) — disponível a todos os perfis autenticados.
router.get('/', async (req, res, next) => {
  try {
    const includeInactive = req.query.include_inactive === 'true' && req.user.role !== 'atendente';
    const { rows } = await query(
      `SELECT id, name, email, role, active, available, last_login_at, created_at
       FROM users ${includeInactive ? '' : 'WHERE active'} ORDER BY active DESC, name`);
    const list = req.user.role === 'admin' ? rows : rows.map((u) => ({ id: u.id, name: u.name, role: u.role, active: u.active, available: u.available }));
    res.json({ users: list });
  } catch (err) { next(err); }
});

const userSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  role: z.enum(ROLES),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.').max(200).optional(),
  available: z.boolean().optional(),
});

router.post('/', requireRole('admin'), validate(userSchema.required({ password: true })), async (req, res, next) => {
  try {
    const d = req.data;
    const dup = await query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [d.email]);
    if (dup.rowCount) return next(badRequest('Já existe um usuário com este e-mail.', { fields: { email: 'E-mail já cadastrado.' } }));
    const hash = await bcrypt.hash(d.password, 12);
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash, role, available) VALUES ($1,$2,$3,$4,$5)
       RETURNING id, name, email, role, active, available, created_at`,
      [d.name, d.email, hash, d.role, d.available !== false]);
    await audit(req, 'user_create', 'user', rows[0].id, { email: d.email, role: d.role });
    res.status(201).json({ user: rows[0], message: 'Usuário criado com sucesso.' });
  } catch (err) { next(err); }
});

router.put('/:id', requireRole('admin'), validate(userSchema.partial()), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const d = req.data;
    const cur = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (!cur.rowCount) return next(notFound('Usuário não encontrado.'));
    if (d.email) {
      const dup = await query('SELECT 1 FROM users WHERE lower(email) = lower($1) AND id <> $2', [d.email, id]);
      if (dup.rowCount) return next(badRequest('Já existe um usuário com este e-mail.', { fields: { email: 'E-mail já cadastrado.' } }));
    }
    if (d.role && id === req.user.id && d.role !== 'admin') {
      return next(badRequest('Você não pode remover seu próprio perfil de administrador.'));
    }
    const hash = d.password ? await bcrypt.hash(d.password, 12) : null;
    const { rows } = await query(
      `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), role = COALESCE($3, role),
        password_hash = COALESCE($4, password_hash), available = COALESCE($5, available), updated_at = now()
       WHERE id = $6 RETURNING id, name, email, role, active, available`,
      [d.name ?? null, d.email ?? null, d.role ?? null, hash, d.available ?? null, id]);
    await audit(req, 'user_update', 'user', id, { fields: Object.keys(d).filter((k) => k !== 'password'), password_changed: Boolean(hash) });
    res.json({ user: rows[0], message: 'Usuário atualizado.' });
  } catch (err) { next(err); }
});

// Desativar (sem apagar histórico) e transferir pendências para outro responsável.
router.post('/:id/deactivate', requireRole('admin'), validate(z.object({
  transfer_to: z.number().int().positive().nullable().optional(),
})), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (id === req.user.id) return next(badRequest('Você não pode desativar o seu próprio usuário.'));
    const target = req.data.transfer_to || null;
    const result = await tx(async (client) => {
      const cur = await client.query('SELECT id, name, active FROM users WHERE id = $1 FOR UPDATE', [id]);
      if (!cur.rowCount) throw notFound('Usuário não encontrado.');
      if (target) {
        const t = await client.query('SELECT id FROM users WHERE id = $1 AND active AND id <> $2', [target, id]);
        if (!t.rowCount) throw badRequest('Usuário de destino inválido ou inativo.');
      }
      const pending = {
        tickets: (await client.query(`SELECT id FROM tickets WHERE assignee_id = $1 AND status NOT IN ('resolvido','cancelado')`, [id])).rows.map((r) => r.id),
        tasks: (await client.query('SELECT id FROM tasks WHERE assignee_id = $1 AND done_at IS NULL', [id])).rows.map((r) => r.id),
        opportunities: (await client.query(`SELECT o.id FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id WHERE o.owner_id = $1 AND s.kind = 'open'`, [id])).rows.map((r) => r.id),
        customers: (await client.query('SELECT id FROM customers WHERE owner_id = $1', [id])).rows.map((r) => r.id),
      };
      const total = pending.tickets.length + pending.tasks.length + pending.opportunities.length;
      if (total > 0 && !target) {
        throw conflict('Este usuário possui pendências. Informe para quem transferi-las.', { pending: {
          tickets: pending.tickets.length, tasks: pending.tasks.length, opportunities: pending.opportunities.length, customers: pending.customers.length } });
      }
      if (target) {
        if (pending.tickets.length) {
          await client.query(`UPDATE tickets SET assignee_id = $1, status = CASE WHEN status = 'em_atendimento' THEN 'em_atendimento' ELSE status END,
            version = version + 1, updated_at = now() WHERE id = ANY($2::int[])`, [target, pending.tickets]);
          for (const tid of pending.tickets) {
            await client.query(`INSERT INTO ticket_events (ticket_id, user_id, kind, body, payload) VALUES ($1,$2,'system',$3,$4)`,
              [tid, req.user.id, 'Atendimento transferido por desativação de usuário', JSON.stringify({ from: id, to: target, action: 'transfer' })]);
          }
        }
        if (pending.tasks.length) await client.query('UPDATE tasks SET assignee_id = $1, updated_at = now() WHERE id = ANY($2::int[])', [target, pending.tasks]);
        if (pending.opportunities.length) await client.query('UPDATE opportunities SET owner_id = $1, version = version + 1, updated_at = now() WHERE id = ANY($2::int[])', [target, pending.opportunities]);
        if (pending.customers.length) await client.query('UPDATE customers SET owner_id = $1, updated_at = now() WHERE id = ANY($2::int[])', [target, pending.customers]);
      }
      await client.query('UPDATE users SET active = FALSE, available = FALSE, updated_at = now() WHERE id = $1', [id]);
      await client.query('DELETE FROM user_sessions WHERE sess->>\'userId\' = $1', [String(id)]);
      await audit(req, 'user_deactivate', 'user', id, { transfer_to: target, transferred: {
        tickets: pending.tickets.length, tasks: pending.tasks.length, opportunities: pending.opportunities.length, customers: pending.customers.length } }, client);
      return pending;
    });
    broadcast('tickets_changed', { reason: 'user_deactivated' });
    res.json({ ok: true, message: 'Usuário desativado. O histórico foi preservado.', transferred: {
      tickets: result.tickets.length, tasks: result.tasks.length, opportunities: result.opportunities.length, customers: result.customers.length } });
  } catch (err) { next(err); }
});

router.post('/:id/activate', requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rowCount } = await query('UPDATE users SET active = TRUE, updated_at = now() WHERE id = $1', [id]);
    if (!rowCount) return next(notFound('Usuário não encontrado.'));
    await audit(req, 'user_activate', 'user', id);
    res.json({ ok: true, message: 'Usuário reativado.' });
  } catch (err) { next(err); }
});

// Administrador gera um link de redefinição (útil quando não há SMTP configurado).
router.post('/:id/reset-link', requireRole('admin'), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { rowCount } = await query('SELECT 1 FROM users WHERE id = $1 AND active', [id]);
    if (!rowCount) return next(notFound('Usuário não encontrado ou inativo.'));
    const { link } = await createResetToken(id);
    await audit(req, 'user_reset_link', 'user', id);
    res.json({ link, message: 'Link gerado. Ele é válido por 1 hora.' });
  } catch (err) { next(err); }
});

module.exports = router;
