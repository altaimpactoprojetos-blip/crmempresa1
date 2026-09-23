'use strict';
// Painel do dono da plataforma (quem vende o CRM): empresas, planos, suspensão, prazo de teste e receita.
// Tem login próprio (tabela platform_admins, criado com "npm run create-platform-admin") e roda sem
// contexto de empresa (runAsSystem), por isso enxerga todas as empresas.
const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { query, runAsSystem } = require('../db');
const config = require('../config');
const { validate } = require('../middleware/validate');
const { unauthorized, notFound, badRequest } = require('../lib/errors');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
});

router.post(
  '/login',
  loginLimiter,
  validate(z.object({ email: z.string().trim().email(), password: z.string().min(1) })),
  async (req, res, next) => {
    try {
      const admin = (
        await runAsSystem(() => query('SELECT * FROM platform_admins WHERE lower(email) = lower($1)', [req.data.email]))
      ).rows[0];
      if (!admin || !(await bcrypt.compare(req.data.password, admin.password_hash)))
        return next(unauthorized('E-mail ou senha incorretos.'));
      // Sessão nova e separada da sessão de usuário de empresa
      await new Promise((resolve, reject) => req.session.regenerate((e) => (e ? reject(e) : resolve())));
      req.session.platformAdminId = admin.id;
      await runAsSystem(async () => {
        await query('UPDATE platform_admins SET last_login_at = now() WHERE id = $1', [admin.id]);
        await log(req, admin.id, 'login');
      });
      res.json({ admin: { id: admin.id, name: admin.name, email: admin.email } });
    } catch (err) {
      next(err);
    }
  },
);

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('crm.sid');
    res.json({ ok: true });
  });
});

// Daqui em diante: só o dono da plataforma, sempre sem contexto de empresa
router.use((req, _res, next) => {
  const id = req.session && req.session.platformAdminId;
  if (!id) return next(unauthorized());
  runAsSystem(async () => {
    try {
      const admin = (await query('SELECT id, name, email FROM platform_admins WHERE id = $1', [id])).rows[0];
      if (!admin) return req.session.destroy(() => next(unauthorized()));
      req.platformAdmin = admin;
      next();
    } catch (err) {
      next(err);
    }
  });
});

function log(req, adminId, action, companyId = null, details = {}) {
  return query('INSERT INTO platform_audit (admin_id, action, company_id, details, ip) VALUES ($1,$2,$3,$4,$5)', [
    adminId,
    action,
    companyId,
    JSON.stringify(details),
    req.ip,
  ]);
}

router.get('/me', (req, res) => res.json({ admin: req.platformAdmin, billing_enabled: config.billing.enabled }));

// Números do negócio
router.get('/overview', async (_req, res, next) => {
  try {
    const r = (
      await query(`SELECT
        count(*) FILTER (WHERE c.status = 'active')::int AS active,
        count(*) FILTER (WHERE c.status = 'trial')::int AS trial,
        count(*) FILTER (WHERE c.status = 'past_due')::int AS past_due,
        count(*) FILTER (WHERE c.status = 'suspended')::int AS suspended,
        count(*) FILTER (WHERE c.status = 'cancelled')::int AS cancelled,
        count(*) FILTER (WHERE c.created_at > now() - interval '30 days')::int AS signups_30d,
        count(*) FILTER (WHERE c.status = 'trial' AND c.trial_ends_at BETWEEN now() AND now() + interval '7 days')::int AS trials_ending,
        COALESCE(sum(p.price_cents) FILTER (WHERE c.status IN ('active', 'past_due')), 0)::int AS mrr_cents
      FROM companies c JOIN plans p ON p.id = c.plan`)
    ).rows[0];
    const received = (
      await query(`SELECT COALESCE(sum(value_cents), 0)::int AS cents FROM payments
        WHERE paid_at > date_trunc('month', now())`)
    ).rows[0].cents;
    res.json({ ...r, received_month_cents: received });
  } catch (err) {
    next(err);
  }
});

const LIST = `SELECT c.id, c.name, c.status, c.plan, p.name AS plan_name, p.price_cents, c.trial_ends_at,
    c.current_period_end, c.past_due_since, c.created_at, c.billing_subscription_id IS NOT NULL AS has_subscription,
    (SELECT count(*)::int FROM users u WHERE u.company_id = c.id AND u.active) AS users,
    (SELECT count(*)::int FROM channels ch WHERE ch.company_id = c.id AND ch.status <> 'disconnected') AS channels,
    (SELECT count(*)::int FROM messages m WHERE m.company_id = c.id AND m.created_at > now() - interval '30 days') AS messages_30d,
    (SELECT max(u.last_login_at) FROM users u WHERE u.company_id = c.id) AS last_login_at,
    (SELECT u.email FROM users u WHERE u.company_id = c.id AND u.role = 'admin' ORDER BY u.id LIMIT 1) AS admin_email
  FROM companies c JOIN plans p ON p.id = c.plan`;

router.get('/companies', async (req, res, next) => {
  try {
    const params = [];
    const where = [];
    if (req.query.q) {
      params.push(`%${String(req.query.q).trim()}%`);
      where.push(
        `(c.name ILIKE $${params.length} OR EXISTS (SELECT 1 FROM users u WHERE u.company_id = c.id AND u.email ILIKE $${params.length}))`,
      );
    }
    if (req.query.status) {
      params.push(String(req.query.status));
      where.push(`c.status = $${params.length}`);
    }
    const { rows } = await query(
      `${LIST} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY c.created_at DESC LIMIT 500`,
      params,
    );
    res.json({ companies: rows });
  } catch (err) {
    next(err);
  }
});

router.get('/companies/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const company = (await query(`${LIST} WHERE c.id = $1`, [id])).rows[0];
    if (!company) return next(notFound('Empresa não encontrada.'));
    const extra = (await query('SELECT notes, billing_email, billing_document FROM companies WHERE id = $1', [id]))
      .rows[0];
    const [users, payments, log] = await Promise.all([
      query(
        'SELECT id, name, email, role, active, last_login_at FROM users WHERE company_id = $1 ORDER BY active DESC, name',
        [id],
      ),
      query('SELECT * FROM payments WHERE company_id = $1 ORDER BY due_date DESC NULLS LAST LIMIT 24', [id]),
      query(
        `SELECT a.*, pa.name AS admin_name FROM platform_audit a LEFT JOIN platform_admins pa ON pa.id = a.admin_id
         WHERE a.company_id = $1 ORDER BY a.created_at DESC LIMIT 30`,
        [id],
      ),
    ]);
    res.json({ company: { ...company, ...extra }, users: users.rows, payments: payments.rows, log: log.rows });
  } catch (err) {
    next(err);
  }
});

router.put(
  '/companies/:id',
  validate(
    z.object({
      status: z.enum(['trial', 'active', 'past_due', 'suspended', 'cancelled']).optional(),
      plan: z.string().trim().min(1).max(40).optional(),
      trial_ends_at: z.string().datetime({ offset: true }).nullable().optional(),
      current_period_end: z.string().datetime({ offset: true }).nullable().optional(),
      notes: z.string().max(5000).nullable().optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const d = req.data;
      if (d.plan && !(await query('SELECT 1 FROM plans WHERE id = $1', [d.plan])).rowCount)
        return next(badRequest('Plano inexistente.'));
      const sets = [];
      const params = [id];
      for (const k of ['status', 'plan', 'trial_ends_at', 'current_period_end', 'notes']) {
        if (d[k] === undefined) continue;
        params.push(d[k]);
        sets.push(`${k} = $${params.length}`);
      }
      if (d.status && d.status !== 'past_due') sets.push('past_due_since = NULL');
      if (!sets.length) return next(badRequest('Nada para alterar.'));
      const { rows } = await query(
        `UPDATE companies SET ${sets.join(', ')}, updated_at = now() WHERE id = $1 RETURNING id`,
        params,
      );
      if (!rows[0]) return next(notFound('Empresa não encontrada.'));
      await log(req, req.platformAdmin.id, 'company_update', id, d);
      res.json({ ok: true, message: 'Empresa atualizada.' });
    } catch (err) {
      next(err);
    }
  },
);

router.get('/plans', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT p.*, (SELECT count(*)::int FROM companies c WHERE c.plan = p.id AND c.status IN ('active','past_due','trial')) AS companies
       FROM plans p ORDER BY position`,
    );
    res.json({ plans: rows });
  } catch (err) {
    next(err);
  }
});

const limit = z.number().int().min(1).max(10000).nullable();
router.put(
  '/plans/:id',
  validate(
    z.object({
      name: z.string().trim().min(2).max(60),
      price_cents: z.number().int().min(0).max(100000000),
      max_users: limit,
      max_channels: limit,
      features: z.object({ automations: z.boolean(), chatbot: z.boolean() }),
      public: z.boolean(),
    }),
  ),
  async (req, res, next) => {
    try {
      const d = req.data;
      const { rows } = await query(
        `UPDATE plans SET name = $2, price_cents = $3, max_users = $4, max_channels = $5, features = $6, public = $7,
           updated_at = now() WHERE id = $1 RETURNING *`,
        [req.params.id, d.name, d.price_cents, d.max_users, d.max_channels, JSON.stringify(d.features), d.public],
      );
      if (!rows[0]) return next(notFound('Plano não encontrado.'));
      await log(req, req.platformAdmin.id, 'plan_update', null, { plan: req.params.id, ...d });
      res.json({
        plan: rows[0],
        message: 'Plano atualizado. Assinaturas já existentes mantêm o valor anterior até a empresa trocar de plano.',
      });
    } catch (err) {
      next(err);
    }
  },
);

router.get('/audit', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT a.*, pa.name AS admin_name, c.name AS company_name FROM platform_audit a
       LEFT JOIN platform_admins pa ON pa.id = a.admin_id LEFT JOIN companies c ON c.id = a.company_id
       ORDER BY a.created_at DESC LIMIT 200`,
    );
    res.json({ log: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
