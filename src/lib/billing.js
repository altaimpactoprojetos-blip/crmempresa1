'use strict';
// Cobrança recorrente pelo Asaas (Pix, boleto ou cartão). O Asaas avisa os pagamentos pelo webhook
// /api/webhooks/asaas; aqui só ficam o cliente HTTP e a aplicação dos eventos à empresa.
const crypto = require('crypto');
const config = require('../config');
const { query, runAsSystem } = require('../db');
const { HttpError } = require('./errors');

async function asaas(path, { method = 'GET', body } = {}) {
  let resp;
  try {
    resp = await fetch(`${config.billing.asaasUrl}${path}`, {
      method,
      headers: {
        access_token: config.billing.asaasApiKey,
        'User-Agent': 'CRM',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new HttpError(502, `Não foi possível falar com o sistema de cobrança: ${err.message}`);
  }
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = (data.errors || []).map((e) => e.description).join(' ') || `erro ${resp.status}`;
    throw new HttpError(502, `O sistema de cobrança recusou a operação: ${msg}`);
  }
  return data;
}

const today = () => new Date().toISOString().slice(0, 10);

// Cria ou atualiza o cliente e a assinatura mensal da empresa. Devolve a cobrança em aberto (com o link de pagamento).
async function subscribe(company, plan, { document, email, billingType }) {
  let customerId = company.billing_customer_id;
  const customer = { name: company.name, cpfCnpj: document, email, externalReference: `company:${company.id}` };
  if (customerId) await asaas(`/customers/${customerId}`, { method: 'PUT', body: customer });
  else customerId = (await asaas('/customers', { method: 'POST', body: customer })).id;

  const description = `Assinatura ${config.appName} — plano ${plan.name}`;
  let subscriptionId = company.billing_subscription_id;
  if (subscriptionId) {
    await asaas(`/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      body: { value: plan.price_cents / 100, billingType, description, updatePendingPayments: true },
    });
  } else {
    subscriptionId = (
      await asaas('/subscriptions', {
        method: 'POST',
        body: {
          customer: customerId,
          billingType,
          value: plan.price_cents / 100,
          nextDueDate: today(),
          cycle: 'MONTHLY',
          description,
          externalReference: `company:${company.id}`,
        },
      })
    ).id;
  }
  const payments = (await asaas(`/subscriptions/${subscriptionId}/payments`)).data || [];
  const open = payments.find((p) => ['PENDING', 'OVERDUE'].includes(p.status)) || null;
  return { customerId, subscriptionId, payments, open };
}

function cancel(subscriptionId) {
  return asaas(`/subscriptions/${subscriptionId}`, { method: 'DELETE' });
}

// Grava (ou atualiza) uma cobrança do Asaas no histórico da empresa.
async function savePayment(companyId, p) {
  const paid = ['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(p.status);
  await query(
    `INSERT INTO payments (company_id, provider_id, status, value_cents, due_date, paid_at, invoice_url, billing_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (provider_id) DO UPDATE SET status = EXCLUDED.status, value_cents = EXCLUDED.value_cents,
       due_date = EXCLUDED.due_date, paid_at = COALESCE(EXCLUDED.paid_at, payments.paid_at),
       invoice_url = COALESCE(EXCLUDED.invoice_url, payments.invoice_url), billing_type = EXCLUDED.billing_type,
       updated_at = now()`,
    [
      companyId,
      p.id,
      p.status,
      Math.round(Number(p.value || 0) * 100),
      p.dueDate || null,
      paid ? p.clientPaymentDate || p.paymentDate || new Date().toISOString() : null,
      p.invoiceUrl || null,
      p.billingType || null,
    ],
  );
}

function validToken(header) {
  const expected = config.billing.webhookToken;
  if (!expected || !header) return false;
  const a = Buffer.from(String(header));
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const PAID = ['PAYMENT_CONFIRMED', 'PAYMENT_RECEIVED'];

// Aplica um evento do webhook. Idempotente: eventos repetidos são ignorados.
function handleEvent(body) {
  return runAsSystem(async () => {
    const p = body.payment;
    if (!p || !p.customer) return { ignored: 'sem cobrança' };
    const eventId = body.id || `${body.event}:${p.id}:${p.status}`;
    const fresh = await query('INSERT INTO billing_events (id) VALUES ($1) ON CONFLICT DO NOTHING', [eventId]);
    if (!fresh.rowCount) return { ignored: 'repetido' };
    const company = (await query('SELECT * FROM companies WHERE billing_customer_id = $1', [p.customer])).rows[0];
    if (!company) return { ignored: 'empresa não encontrada' };
    await savePayment(company.id, p);
    if (PAID.includes(body.event)) {
      // Pago: libera até um mês depois do vencimento desta cobrança
      await query(
        `UPDATE companies SET status = 'active', past_due_since = NULL, updated_at = now(),
           current_period_end = GREATEST(COALESCE(current_period_end, now()), ($2::date + interval '1 month')::timestamptz)
         WHERE id = $1 AND status NOT IN ('suspended', 'cancelled')`,
        [company.id, p.dueDate || today()],
      );
    } else if (body.event === 'PAYMENT_OVERDUE') {
      await query(
        `UPDATE companies SET status = 'past_due', past_due_since = COALESCE(past_due_since, now()), updated_at = now()
         WHERE id = $1 AND status IN ('active', 'trial')`,
        [company.id],
      );
    }
    return { company_id: company.id, event: body.event };
  });
}

module.exports = { subscribe, cancel, savePayment, handleEvent, validToken };
