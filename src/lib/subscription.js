'use strict';
// Plano e situação da assinatura da empresa: limites (usuários, canais), recursos do plano e bloqueio
// quando o teste acaba ou o pagamento atrasa. O dono da plataforma controla tudo pelo painel (routes/platform.js).
const { query } = require('../db');
const config = require('../config');
const { HttpError } = require('./errors');

const DAY = 24 * 3600 * 1000;

// Motivo do bloqueio (ou null). Suspensa/cancelada nem chega a entrar (middleware/auth.js).
function blockReason(c, now = Date.now()) {
  const grace = config.billing.graceDays * DAY;
  if (c.status === 'trial' && c.trial_ends_at && new Date(c.trial_ends_at).getTime() < now) return 'trial_ended';
  if (c.status === 'past_due' && c.past_due_since && new Date(c.past_due_since).getTime() + grace < now)
    return 'past_due';
  if (c.status === 'active' && c.current_period_end && new Date(c.current_period_end).getTime() + grace < now)
    return 'expired';
  return null;
}

const REASON_TEXT = {
  trial_ended: 'O período de teste terminou. Escolha um plano para continuar usando o CRM.',
  past_due: 'Há uma mensalidade em atraso. Regularize o pagamento para continuar usando o CRM.',
  expired: 'A assinatura venceu. Renove para continuar usando o CRM.',
};

// 402: a interface leva o administrador para a tela de assinatura
const paymentRequired = (msg, details = {}) => new HttpError(402, msg, details);

// Com a empresa bloqueada, só o necessário para abrir a tela de assinatura continua funcionando.
const OPEN_WHEN_BLOCKED = [/^\/auth\//, /^\/billing(\/|$)/, /^\/notifications(\/|$)/, /^\/settings\/public$/];
const READ_WHEN_BLOCKED = [/^\/settings$/, /^\/users$/];
function billingGate(req, _res, next) {
  const reason = req.user && req.user.billing_block;
  if (!reason) return next();
  const p = req.path;
  if (OPEN_WHEN_BLOCKED.some((r) => r.test(p))) return next();
  if (req.method === 'GET' && READ_WHEN_BLOCKED.some((r) => r.test(p))) return next();
  next(paymentRequired(REASON_TEXT[reason], { billing_blocked: true, reason }));
}

async function currentPlan() {
  return (
    await query(
      `SELECT p.*, c.status AS company_status FROM companies c JOIN plans p ON p.id = c.plan WHERE c.id = app_company_id()`,
    )
  ).rows[0];
}

async function usage(client) {
  const q = client ? client.query.bind(client) : query;
  const r = (
    await q(`SELECT (SELECT count(*)::int FROM users WHERE active) AS users,
      (SELECT count(*)::int FROM channels WHERE status <> 'disconnected') AS channels`)
  ).rows[0];
  return r;
}

// Confere o limite antes de criar/reativar um usuário ou conectar um canal.
async function checkLimit(kind, client) {
  const plan = await currentPlan();
  const max = kind === 'users' ? plan.max_users : plan.max_channels;
  if (max == null) return;
  const used = (await usage(client))[kind];
  if (used >= max)
    throw paymentRequired(
      kind === 'users'
        ? `O plano ${plan.name} permite até ${max} usuário(s) ativo(s). Mude de plano para adicionar mais.`
        : `O plano ${plan.name} permite até ${max} canal(is) conectado(s). Mude de plano para conectar mais.`,
      { limit: kind, max },
    );
}

async function requireFeature(feature) {
  const plan = await currentPlan();
  if (!plan.features || !plan.features[feature]) {
    const label = { automations: 'Automações do funil', chatbot: 'O robô de atendimento' }[feature];
    throw paymentRequired(`${label} não está incluído no plano ${plan.name}. Mude de plano para usar.`, {
      feature,
    });
  }
}

module.exports = { blockReason, billingGate, currentPlan, usage, checkLimit, requireFeature, REASON_TEXT };
