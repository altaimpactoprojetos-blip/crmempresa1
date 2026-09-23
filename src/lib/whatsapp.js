'use strict';
// Cliente da API oficial do WhatsApp (Meta Cloud API). Cada canal usa o token da própria empresa.
const crypto = require('crypto');
const config = require('../config');
const { decrypt } = require('./crypto');
const { HttpError } = require('./errors');

const GRAPH = () => config.whatsapp.graphUrl;

async function graph(token, path, { method = 'GET', body } = {}) {
  let resp;
  try {
    resp = await fetch(`${GRAPH()}/${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new HttpError(502, `Não foi possível falar com a API do WhatsApp: ${err.message}`);
  }
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = data.error?.error_user_msg || data.error?.message || `erro ${resp.status}`;
    const err = new HttpError(502, `A API do WhatsApp recusou a operação: ${msg}`);
    err.metaCode = data.error?.code;
    throw err;
  }
  return data;
}

// Confere o token e o número antes de salvar o canal.
function getPhoneNumber(token, phoneNumberId) {
  return graph(token, `${encodeURIComponent(phoneNumberId)}?fields=display_phone_number,verified_name`);
}

const tokenOf = (channel) => decrypt(channel.access_token_enc);

async function sendMessage(channel, to, payload) {
  const data = await graph(tokenOf(channel), `${encodeURIComponent(channel.phone_number_id)}/messages`, {
    method: 'POST',
    body: { messaging_product: 'whatsapp', recipient_type: 'individual', to, ...payload },
  });
  return data.messages?.[0]?.id || null;
}

const sendText = (channel, to, text) => sendMessage(channel, to, { type: 'text', text: { body: text } });

function sendTemplate(channel, to, { name, language, params = [] }) {
  const components = params.length
    ? [{ type: 'body', parameters: params.map((p) => ({ type: 'text', text: String(p) })) }]
    : undefined;
  return sendMessage(channel, to, { type: 'template', template: { name, language: { code: language }, components } });
}

async function listTemplates(channel) {
  if (!channel.waba_id) return [];
  const data = await graph(
    tokenOf(channel),
    `${encodeURIComponent(channel.waba_id)}/message_templates?fields=name,language,status,category,components&limit=100`,
  );
  return (data.data || []).filter((t) => t.status === 'APPROVED');
}

// Baixa uma mídia recebida (a Meta entrega só o id; a URL é temporária e exige o token).
async function fetchMedia(channel, mediaId) {
  const token = tokenOf(channel);
  const info = await graph(token, encodeURIComponent(mediaId));
  const resp = await fetch(info.url, { headers: { Authorization: `Bearer ${token}` } });
  if (!resp.ok) throw new HttpError(502, 'Não foi possível baixar a mídia do WhatsApp.');
  return { mimeType: info.mime_type || resp.headers.get('content-type'), body: Buffer.from(await resp.arrayBuffer()) };
}

// Assinatura X-Hub-Signature-256 enviada pela Meta, calculada com o App Secret do aplicativo.
function validSignature(appSecret, rawBody, header) {
  const expected =
    'sha256=' +
    crypto
      .createHmac('sha256', appSecret)
      .update(rawBody || Buffer.alloc(0))
      .digest('hex');
  const got = String(header || '');
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

module.exports = { getPhoneNumber, sendText, sendTemplate, listTemplates, fetchMedia, validSignature };
