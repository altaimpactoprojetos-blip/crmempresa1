'use strict';
// Webhooks públicos da Meta. Cada canal tem uma URL própria e secreta (/api/webhooks/whatsapp/<chave> ou
// /api/webhooks/meta/<chave> para Instagram e Messenger), o que identifica a empresa antes de qualquer acesso aos dados dela.
const express = require('express');
const { query, runAsSystem, runAsCompany } = require('../db');
const { decrypt } = require('../lib/crypto');
const whatsapp = require('../lib/whatsapp');
const { processWebhookValue, processMetaWebhook } = require('../lib/inbox');
const meta = require('../lib/meta');

const router = express.Router();

const findChannel = (key) =>
  runAsSystem(async () => (await query('SELECT * FROM channels WHERE webhook_key = $1', [key])).rows[0]);

// Verificação da URL do webhook (feita pela Meta ao configurar)
router.get(['/whatsapp/:key', '/meta/:key'], async (req, res, next) => {
  try {
    const channel = await findChannel(req.params.key);
    if (!channel) return res.sendStatus(404);
    if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === channel.verify_token)
      return res
        .status(200)
        .type('text/plain')
        .send(String(req.query['hub.challenge'] || ''));
    res.sendStatus(403);
  } catch (err) {
    next(err);
  }
});

router.post('/whatsapp/:key', async (req, res, next) => {
  try {
    const channel = await findChannel(req.params.key);
    if (!channel) return res.sendStatus(404);
    const secret = decrypt(channel.app_secret_enc);
    if (secret && !whatsapp.validSignature(secret, req.rawBody, req.get('X-Hub-Signature-256')))
      return res.sendStatus(401);
    res.sendStatus(200); // a Meta exige resposta rápida; o processamento segue em segundo plano
    if (channel.status !== 'connected') return;
    runAsCompany(channel.company_id, async () => {
      for (const entry of req.body.entry || [])
        for (const change of entry.changes || []) {
          if (change.field === 'messages' && change.value) await processWebhookValue(channel, change.value);
        }
    }).catch((err) => console.error(`Erro ao processar webhook do canal ${channel.id}:`, err.message));
  } catch (err) {
    next(err);
  }
});

// Instagram Direct e Messenger
router.post('/meta/:key', async (req, res, next) => {
  try {
    const channel = await findChannel(req.params.key);
    if (!channel || !meta.SOCIAL_TYPES.includes(channel.type)) return res.sendStatus(404);
    const secret = decrypt(channel.app_secret_enc);
    if (secret && !whatsapp.validSignature(secret, req.rawBody, req.get('X-Hub-Signature-256')))
      return res.sendStatus(401);
    res.sendStatus(200);
    if (channel.status !== 'connected') return;
    runAsCompany(channel.company_id, () => processMetaWebhook(channel, req.body || {})).catch((err) =>
      console.error(`Erro ao processar webhook do canal ${channel.id}:`, err.message),
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;
