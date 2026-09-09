'use strict';
// Integração opcional com a API oficial do WhatsApp (Meta Cloud API).
// Sem credenciais, a integração aparece como "desconectada" e nada é simulado.
const express = require('express');
const crypto = require('crypto');
const { z } = require('zod');
const { query } = require('../db');
const config = require('../config');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { badRequest, HttpError } = require('../lib/errors');
const { audit } = require('../lib/audit');
const { broadcast } = require('../lib/realtime');
const { normalizePhone } = require('../lib/util');

const router = express.Router();
const wa = config.whatsapp;

router.get('/status', requireAuth, (_req, res) => {
  res.json({
    connected: wa.configured,
    phone_number_id: wa.configured ? wa.phoneNumberId : null,
    webhook_url: `${config.appUrl}/api/whatsapp/webhook`,
    message: wa.configured
      ? 'Integração configurada. Mensagens enviadas e recebidas pela API oficial são registradas no CRM.'
      : 'Integração desconectada. Configure WHATSAPP_TOKEN e WHATSAPP_PHONE_NUMBER_ID no servidor. Enquanto isso, use o botão "Abrir WhatsApp" e registre as interações manualmente.',
  });
});

router.post('/send', requireAuth, validate(z.object({
  customer_id: z.number().int().positive(), ticket_id: z.number().int().positive().nullable().optional(), body: z.string().trim().min(1).max(4096),
})), async (req, res, next) => {
  try {
    if (!wa.configured) return next(new HttpError(503, 'Integração com o WhatsApp não está configurada. Registre a interação manualmente.'));
    const c = (await query('SELECT id, phone_digits FROM customers WHERE id = $1', [req.data.customer_id])).rows[0];
    if (!c || !c.phone_digits) return next(badRequest('Cliente sem telefone válido.'));
    const resp = await fetch(`https://graph.facebook.com/v20.0/${wa.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${wa.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to: c.phone_digits, type: 'text', text: { body: req.data.body } }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      console.error('Erro da API do WhatsApp:', data);
      return next(new HttpError(502, `A API do WhatsApp recusou o envio: ${data.error?.message || resp.status}`));
    }
    const waId = data.messages?.[0]?.id || null;
    const { rows } = await query(
      `INSERT INTO whatsapp_messages (customer_id, ticket_id, user_id, direction, wa_message_id, phone_digits, body, status, raw)
       VALUES ($1,$2,$3,'saida',$4,$5,$6,'enviado',$7) RETURNING *`,
      [c.id, req.data.ticket_id || null, req.user.id, waId, c.phone_digits, req.data.body, JSON.stringify(data)]);
    if (req.data.ticket_id) {
      await query(`INSERT INTO ticket_events (ticket_id, user_id, kind, direction, channel, body, payload) VALUES ($1,$2,'interaction','saida','WhatsApp',$3,$4)`,
        [req.data.ticket_id, req.user.id, req.data.body, JSON.stringify({ via: 'whatsapp_api', wa_message_id: waId })]);
      await query(`UPDATE tickets SET first_response_at = COALESCE(first_response_at, now()), updated_at = now() WHERE id = $1`, [req.data.ticket_id]);
    }
    await audit(req, 'whatsapp_send', 'customer', c.id, { ticket_id: req.data.ticket_id || null });
    res.status(201).json({ message: 'Mensagem enviada pela API oficial.', whatsapp_message: rows[0] });
  } catch (err) { next(err); }
});

// Verificação do webhook (Meta)
router.get('/webhook', (req, res) => {
  if (!wa.configured || !wa.verifyToken) return res.status(404).send('Integração desconectada');
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === wa.verifyToken) return res.status(200).send(req.query['hub.challenge']);
  res.sendStatus(403);
});

// Recebimento de mensagens e status
router.post('/webhook', async (req, res) => {
  if (!wa.configured) return res.sendStatus(404);
  if (wa.appSecret) {
    const sig = req.get('X-Hub-Signature-256') || '';
    const expected = 'sha256=' + crypto.createHmac('sha256', wa.appSecret).update(req.rawBody || Buffer.alloc(0)).digest('hex');
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return res.sendStatus(401);
  }
  res.sendStatus(200);
  try {
    for (const entry of req.body.entry || []) {
      for (const change of entry.changes || []) {
        const v = change.value || {};
        for (const m of v.messages || []) {
          const phone = normalizePhone(m.from);
          const body = m.text?.body || `[${m.type}]`;
          const cust = (await query('SELECT id FROM customers WHERE phone_digits = $1 LIMIT 1', [phone])).rows[0];
          const ticket = cust ? (await query(`SELECT id FROM tickets WHERE customer_id = $1 AND status NOT IN ('resolvido','cancelado') ORDER BY opened_at DESC LIMIT 1`, [cust.id])).rows[0] : null;
          await query(
            `INSERT INTO whatsapp_messages (customer_id, ticket_id, direction, wa_message_id, phone_digits, body, status, raw)
             VALUES ($1,$2,'entrada',$3,$4,$5,'recebido',$6) ON CONFLICT (wa_message_id) DO NOTHING`,
            [cust ? cust.id : null, ticket ? ticket.id : null, m.id, phone, body, JSON.stringify(m)]);
          if (ticket) {
            await query(`INSERT INTO ticket_events (ticket_id, kind, direction, channel, body, payload) VALUES ($1,'interaction','entrada','WhatsApp',$2,$3)`,
              [ticket.id, body, JSON.stringify({ via: 'whatsapp_api', wa_message_id: m.id })]);
          }
          broadcast('whatsapp_message', { customer_id: cust ? cust.id : null, ticket_id: ticket ? ticket.id : null, phone });
        }
        for (const s of v.statuses || []) {
          await query('UPDATE whatsapp_messages SET status = $1 WHERE wa_message_id = $2', [s.status, s.id]);
        }
      }
    }
  } catch (err) { console.error('Erro ao processar webhook do WhatsApp:', err.message); }
});

module.exports = router;
