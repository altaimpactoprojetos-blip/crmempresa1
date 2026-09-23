'use strict';
// Envio de mensagens para uma conversa (usado pela tela de Conversas, pelas automações e pelo robô).
const { query } = require('../db');
const { conflict } = require('./errors');
const { broadcast } = require('./realtime');
const { preview } = require('./inbox');
const whatsapp = require('./whatsapp');
const waweb = require('./waweb');
const meta = require('./meta');

// A Meta só aceita mensagens livres até 24h após a última mensagem do cliente; depois, só modelos aprovados.
// A conexão por QR Code (WhatsApp Web) não tem essa regra; Instagram e Messenger têm regra própria (lib/meta.js).
const WINDOW_MS = 24 * 3600 * 1000;
function windowInfo(conv, channelType = conv.channel_type) {
  if (channelType === 'whatsapp_web') return { window_open: true, window_expires_at: null };
  if (meta.SOCIAL_TYPES.includes(channelType)) return meta.windowInfo(conv);
  const expires = conv.last_inbound_at ? new Date(new Date(conv.last_inbound_at).getTime() + WINDOW_MS) : null;
  return { window_open: Boolean(expires && expires > new Date()), window_expires_at: expires };
}

async function loadChannel(channelId) {
  const ch = (await query('SELECT * FROM channels WHERE id = $1', [channelId])).rows[0];
  if (!ch || ch.status !== 'connected')
    throw conflict('O canal desta conversa está desconectado. Reconecte em Configurações › Conexões.');
  return ch;
}

// Registra a mensagem como "pendente", envia e grava o resultado (enviada ou falhou).
// bot = enviada pelo robô de atendimento. Quando uma pessoa da equipe responde, o robô para nesta conversa.
async function record(conv, { type, body, send, senderId = null, bot = false }) {
  const msg = (
    await query(
      `INSERT INTO messages (conversation_id, direction, type, body, status, sender_id, is_bot)
       VALUES ($1, 'out', $2, $3, 'pending', $4, $5) RETURNING id`,
      [conv.id, type, body, senderId, bot],
    )
  ).rows[0];
  if (senderId) await query(`UPDATE conversations SET bot_state = 'done' WHERE id = $1`, [conv.id]);
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
async function sendText(conv, channel, text, senderId = null, { bot = false } = {}) {
  const social = meta.SOCIAL_TYPES.includes(channel.type);
  if (social && !windowInfo(conv, channel.type).window_open)
    throw conflict(
      `Passaram mais de 7 dias desde a última mensagem do cliente. Pela regra do ${meta.SERVICE[channel.type]}, só é possível responder quando ele escrever de novo.`,
    );
  if (!windowInfo(conv, channel.type).window_open)
    throw conflict(
      'Passaram mais de 24 horas desde a última mensagem do cliente. Pela regra do WhatsApp, envie um modelo aprovado para retomar a conversa.',
      { requires_template: true },
    );
  return record(conv, {
    type: 'text',
    body: text,
    senderId,
    bot,
    send: () => {
      if (social) return meta.sendText(channel, conv, text);
      if (channel.type === 'whatsapp_web')
        return waweb.sendText(channel, conv.contact_jid || `${conv.contact_phone}@s.whatsapp.net`, text);
      return whatsapp.sendText(channel, conv.contact_phone, text);
    },
  });
}

module.exports = { windowInfo, loadChannel, record, sendText };
