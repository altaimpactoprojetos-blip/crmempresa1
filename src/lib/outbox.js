'use strict';
// Envio de mensagens para uma conversa (usado pela tela de Conversas e pelas automações).
const { query } = require('../db');
const { conflict } = require('./errors');
const { broadcast } = require('./realtime');
const { preview } = require('./inbox');
const whatsapp = require('./whatsapp');
const waweb = require('./waweb');

// A Meta só aceita mensagens livres até 24h após a última mensagem do cliente; depois, só modelos aprovados.
// A conexão por QR Code (WhatsApp Web) não tem essa regra.
const WINDOW_MS = 24 * 3600 * 1000;
function windowInfo(conv, channelType = conv.channel_type) {
  if (channelType === 'whatsapp_web') return { window_open: true, window_expires_at: null };
  const expires = conv.last_inbound_at ? new Date(new Date(conv.last_inbound_at).getTime() + WINDOW_MS) : null;
  return { window_open: Boolean(expires && expires > new Date()), window_expires_at: expires };
}

async function loadChannel(channelId) {
  const ch = (await query('SELECT * FROM channels WHERE id = $1', [channelId])).rows[0];
  if (!ch || ch.status !== 'connected')
    throw conflict('O canal de WhatsApp desta conversa está desconectado. Reconecte em Configurações › WhatsApp.');
  return ch;
}

// Registra a mensagem como "pendente", envia e grava o resultado (enviada ou falhou).
async function record(conv, { type, body, send, senderId = null }) {
  const msg = (
    await query(
      `INSERT INTO messages (conversation_id, direction, type, body, status, sender_id)
       VALUES ($1, 'out', $2, $3, 'pending', $4) RETURNING id`,
      [conv.id, type, body, senderId],
    )
  ).rows[0];
  let externalId;
  try {
    externalId = await send();
  } catch (err) {
    await query(`UPDATE messages SET status = 'failed', error = $2 WHERE id = $1`, [msg.id, err.message]);
    broadcast('inbox_changed', { conversation_id: conv.id });
    throw err;
  }
  await query(`UPDATE messages SET status = 'sent', wa_message_id = $2 WHERE id = $1`, [msg.id, externalId]);
  await query(
    `UPDATE conversations SET last_message_at = now(), last_message_preview = $2, unread_count = 0,
       status = 'open', updated_at = now() WHERE id = $1`,
    [conv.id, preview(type, body)],
  );
  broadcast('inbox_changed', { conversation_id: conv.id });
  return msg.id;
}

// Texto livre, respeitando a janela de 24h da API oficial.
async function sendText(conv, channel, text, senderId = null) {
  if (!windowInfo(conv, channel.type).window_open)
    throw conflict(
      'Passaram mais de 24 horas desde a última mensagem do cliente. Pela regra do WhatsApp, envie um modelo aprovado para retomar a conversa.',
      { requires_template: true },
    );
  return record(conv, {
    type: 'text',
    body: text,
    senderId,
    send: () =>
      channel.type === 'whatsapp_web'
        ? waweb.sendText(channel, conv.contact_jid || `${conv.contact_phone}@s.whatsapp.net`, text)
        : whatsapp.sendText(channel, conv.contact_phone, text),
  });
}

module.exports = { windowInfo, loadChannel, record, sendText };
