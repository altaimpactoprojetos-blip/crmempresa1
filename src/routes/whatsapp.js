'use strict';
// Rotas da integração oficial do WhatsApp (Meta Cloud API). Regras de negócio em lib/whatsapp.js.
const express = require('express');
const crypto = require('crypto');
const { z } = require('zod');
const { query } = require('../db');
const config = require('../config');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole, isManager } = require('../middleware/auth');
const { notFound, forbidden } = require('../lib/errors');
const { audit } = require('../lib/audit');
const wa = require('../lib/whatsapp');

const router = express.Router();
const cfg = config.whatsapp;

router.get('/status', requireAuth, async (_req, res, next) => {
  try {
    const st = wa.state();
    const s = (await query('SELECT whatsapp_last_event_at, whatsapp_last_error, whatsapp_last_error_at FROM company_settings WHERE id = 1')).rows[0];
    const counts = (await query(`SELECT count(*) FILTER (WHERE direction='entrada')::int AS received, count(*) FILTER (WHERE direction='saida')::int AS sent,
      count(*) FILTER (WHERE status='falhou')::int AS failed, max(created_at) AS last_message_at FROM whatsapp_messages`)).rows[0];
    const pending = [];
    if (!st.configured) pending.push('Credenciais ausentes no servidor: ' + st.missing.filter((m) => ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'].includes(m)).join(', ') + '.');
    if (st.configured && !cfg.verifyToken) pending.push('WHATSAPP_VERIFY_TOKEN ausente: o webhook não pode ser verificado pela Meta.');
    if (st.configured && !cfg.appSecret) pending.push('WHATSAPP_APP_SECRET ausente: a assinatura dos webhooks não é validada.');
    if (st.configured && !s.whatsapp_last_event_at) pending.push('Nenhum webhook recebido ainda: confirme a URL e a assinatura do campo "messages" no painel da Meta.');
    res.json({
      connected: st.configured,
      state: st.configured ? (s.whatsapp_last_event_at ? 'ativo' : 'configurado_sem_eventos') : 'desconectado',
      phone_number_id: st.configured ? cfg.phoneNumberId : null,
      webhook_url: `${config.appUrl}/api/whatsapp/webhook`,
      webhook_ready: st.webhook_ready, signature_check: st.signature_check, missing: st.missing,
      last_event_at: s.whatsapp_last_event_at, last_error: s.whatsapp_last_error, last_error_at: s.whatsapp_last_error_at,
      stats: counts, pending,
      message: st.configured
        ? 'Integração configurada. Mensagens recebidas abrem ou atualizam atendimentos; envios feitos pela central ficam no histórico com status de entrega.'
        : 'Integração desconectada. Enquanto as credenciais não forem configuradas no servidor, use "Abrir no WhatsApp" (atalho externo) e registre a interação manualmente.',
    });
  } catch (err) { next(err); }
});

// Janela de 24h de um cliente (para a central decidir entre texto livre e modelo)
router.get('/window/:customerId', requireAuth, async (req, res, next) => {
  try { res.json({ connected: cfg.configured, ...(await wa.windowOpen(Number(req.params.customerId))) }); } catch (err) { next(err); }
});

router.post('/send', requireAuth, validate(z.object({
  customer_id: z.number().int().positive(), ticket_id: z.number().int().positive().nullable().optional(),
  body: z.string().trim().max(4096).optional(),
  template: z.object({ name: z.string().trim().min(1).max(120), language: z.string().trim().max(10).optional() }).optional(),
})), async (req, res, next) => {
  try {
    if (!req.data.body && !req.data.template) return next(new (require('../lib/errors').HttpError)(400, 'Informe o texto ou o modelo a enviar.'));
    if (req.data.ticket_id) {
      const t = (await query('SELECT assignee_id FROM tickets WHERE id = $1', [req.data.ticket_id])).rows[0];
      if (!t) return next(notFound('Atendimento não encontrado.'));
      if (!isManager(req.user) && t.assignee_id !== req.user.id) return next(forbidden('Assuma o atendimento para responder ao cliente.'));
    }
    const m = await wa.sendText({ ticketId: req.data.ticket_id || null, customerId: req.data.customer_id, body: req.data.body, userId: req.user.id, template: req.data.template });
    await audit(req, 'whatsapp_send', 'customer', req.data.customer_id, { ticket_id: req.data.ticket_id || null, template: req.data.template?.name || null });
    res.status(201).json({ message: 'Mensagem enviada pela API oficial.', whatsapp_message: m });
  } catch (err) { next(err); }
});

// Mídia recebida (proxy autenticado)
router.get('/media/:id', requireAuth, async (req, res, next) => {
  try {
    const att = (await query('SELECT * FROM ticket_attachments WHERE wa_media_id = $1', [req.params.id])).rows[0];
    if (!att) return next(notFound('Mídia não encontrada.'));
    const { mime, buffer } = await wa.fetchMedia(req.params.id);
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(att.name)}"`);
    res.send(buffer);
  } catch (err) { next(err); }
});

// Registro de mensagens (área administrativa)
router.get('/log', requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const { rows } = await query(`SELECT m.id, m.direction, m.status, m.status_at, m.error, m.body, m.created_at, m.message_type, m.wa_message_id, m.ticket_id, c.name AS customer_name, t.protocol
      FROM whatsapp_messages m LEFT JOIN customers c ON c.id = m.customer_id LEFT JOIN tickets t ON t.id = m.ticket_id ORDER BY m.created_at DESC LIMIT $1`, [limit]);
    res.json({ messages: rows });
  } catch (err) { next(err); }
});

// Verificação do webhook (Meta)
router.get('/webhook', (req, res) => {
  if (!cfg.configured || !cfg.verifyToken) return res.status(404).send('Integração desconectada');
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === cfg.verifyToken) return res.status(200).send(req.query['hub.challenge']);
  res.sendStatus(403);
});

// Recebimento de mensagens e status (idempotente)
router.post('/webhook', async (req, res) => {
  if (!cfg.configured) return res.sendStatus(404);
  if (cfg.appSecret) {
    const sig = req.get('X-Hub-Signature-256') || '';
    const expected = 'sha256=' + crypto.createHmac('sha256', cfg.appSecret).update(req.rawBody || Buffer.alloc(0)).digest('hex');
    if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return res.sendStatus(401);
  }
  res.sendStatus(200);
  try { await wa.processWebhook(req.body || {}); }
  catch (err) { console.error('Erro ao processar webhook do WhatsApp:', err.message); await query('UPDATE company_settings SET whatsapp_last_error = $1, whatsapp_last_error_at = now() WHERE id = 1', [err.message]).catch(() => {}); }
});

module.exports = router;
