'use strict';
// Assinatura da empresa: plano atual, uso, troca de plano e pagamentos (tela Assinatura).
const express = require('express');
const { z } = require('zod');
const { query, tx } = require('../db');
const config = require('../config');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { badRequest, conflict, notFound } = require('../lib/errors');
const { audit } = require('../lib/audit');
const { validDocument } = require('../lib/util');
const billing = require('../lib/billing');
const { usage, blockReason, REASON_TEXT } = require('../lib/subscription');

const router = express.Router();
router.use(requireAuth);

const company = async () => (await query('SELECT * FROM companies WHERE id = app_company_id()')).rows[0];

router.get('/', async (req, res, next) => {
  try {
    const c = await company();
    const [plans, used] = await Promise.all([
      query('SELECT * FROM plans WHERE public OR id = $1 ORDER BY position', [c.plan]),
      usage(),
    ]);
    const reason = blockReason(c);
    const out = {
      company: {
        status: c.status,
        plan: c.plan,
        trial_ends_at: c.trial_ends_at,
        current_period_end: c.current_period_end,
        past_due_since: c.past_due_since,
        has_subscription: Boolean(c.billing_subscription_id),
        block_reason: reason,
        block_text: reason ? REASON_TEXT[reason] : null,
      },
      plans: plans.rows,
      usage: {
        ...used,
        ...(
          await query(`SELECT (SELECT count(*)::int FROM customers) AS customers,
            (SELECT count(*)::int FROM tickets WHERE opened_at >= date_trunc('month', now())) AS tickets_month`)
        ).rows[0],
      },
      billing_enabled: config.billing.enabled,
      grace_days: config.billing.graceDays,
    };
    if (req.user.role === 'admin') {
      out.company.billing_email = c.billing_email || req.user.email;
      out.company.billing_document = c.billing_document;
      out.payments = (await query('SELECT * FROM payments ORDER BY due_date DESC NULLS LAST, id DESC LIMIT 24')).rows;
      // Próxima cobrança em aberto e a forma de pagamento usada por último
      const pending = out.payments.filter((p) => ['PENDING', 'OVERDUE'].includes(p.status));
      out.next_payment = pending.length ? pending[pending.length - 1] : null;
      out.last_billing_type =
        (out.payments.find((p) => p.billing_type && p.billing_type !== 'UNDEFINED') || {}).billing_type || null;
    }
    res.json(out);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/subscribe',
  requireRole('admin'),
  validate(
    z.object({
      plan_id: z.string().trim().min(1).max(40),
      document: z.string().trim().min(11).max(20),
      email: z.string().trim().email().max(200),
      billing_type: z.enum(['UNDEFINED', 'PIX', 'BOLETO', 'CREDIT_CARD']).default('UNDEFINED'),
    }),
  ),
  async (req, res, next) => {
    try {
      if (!config.billing.enabled)
        return next(conflict('O pagamento on-line ainda não está disponível. Fale com o suporte para assinar.'));
      const d = req.data;
      const document = d.document.replace(/\D/g, '');
      if (!validDocument(document))
        return next(badRequest('CPF ou CNPJ inválido.', { fields: { document: 'CPF ou CNPJ inválido.' } }));
      const plan = (await query('SELECT * FROM plans WHERE id = $1 AND public', [d.plan_id])).rows[0];
      if (!plan) return next(notFound('Plano não encontrado.'));
      const used = await usage();
      if (plan.max_users != null && used.users > plan.max_users)
        return next(
          badRequest(`O plano ${plan.name} permite ${plan.max_users} usuário(s); desative usuários antes de mudar.`),
        );
      if (plan.max_channels != null && used.channels > plan.max_channels)
        return next(
          badRequest(`O plano ${plan.name} permite ${plan.max_channels} canal(is); desconecte canais antes de mudar.`),
        );
      const c = await company();
      const r = await billing.subscribe(c, plan, { document, email: d.email, billingType: d.billing_type });
      await tx(async (client) => {
        await client.query(
          `UPDATE companies SET plan = $1, billing_customer_id = $2, billing_subscription_id = $3, billing_email = $4,
             billing_document = $5, updated_at = now() WHERE id = app_company_id()`,
          [plan.id, r.customerId, r.subscriptionId, d.email, document],
        );
      });
      for (const p of r.payments) await billing.savePayment(c.id, p);
      await audit(req, 'billing_subscribe', 'company', c.id, { plan: plan.id });
      res.json({
        ok: true,
        invoice_url: r.open ? r.open.invoiceUrl : null,
        message: `Plano ${plan.name} escolhido.${r.open ? ' Conclua o pagamento na página que foi aberta.' : ''}`,
      });
    } catch (err) {
      next(err);
    }
  },
);

// Cancela a renovação: a empresa continua usando até o fim do período já pago.
router.post('/cancel', requireRole('admin'), async (req, res, next) => {
  try {
    const c = await company();
    if (!c.billing_subscription_id) return next(badRequest('Não há assinatura ativa.'));
    await billing.cancel(c.billing_subscription_id);
    await query('UPDATE companies SET billing_subscription_id = NULL, updated_at = now() WHERE id = $1', [c.id]);
    await audit(req, 'billing_cancel', 'company', c.id);
    res.json({
      ok: true,
      message: c.current_period_end
        ? `Renovação cancelada. O CRM continua liberado até ${new Date(c.current_period_end).toLocaleDateString('pt-BR')}.`
        : 'Renovação cancelada.',
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
