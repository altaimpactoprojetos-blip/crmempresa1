'use strict';
// Instagram Direct e Facebook Messenger (Messenger Platform da Meta). Cada canal usa o token da página da empresa.
// O contato é identificado pelo id que a Meta dá a ele na página: guardado como "fb:<id>" ou "ig:<id>".
const config = require('../config');
const { decrypt } = require('./crypto');
const { HttpError } = require('./errors');
const { graph } = require('./whatsapp');

const SERVICE = { messenger: 'Messenger', instagram: 'Instagram' };
const PREFIX = { messenger: 'fb', instagram: 'ig' };
const SOCIAL_TYPES = Object.keys(SERVICE);

const call = (channel, path, opts = {}) =>
  graph(decrypt(channel.access_token_enc), path, { ...opts, service: SERVICE[channel.type] });

const contactKey = (channel, id) => `${PREFIX[channel.type]}:${id}`;
const contactId = (key) => String(key).replace(/^(fb|ig):/, '');

// Confere o token e a página antes de salvar o canal. Para o Instagram, a página precisa ter
// uma conta profissional do Instagram vinculada.
async function getPage(type, token, pageId) {
  return graph(token, `${encodeURIComponent(pageId)}?fields=name,instagram_business_account{id,username}`, {
    service: SERVICE[type],
  });
}

// Assina a página no aplicativo para receber as mensagens pelo webhook.
function subscribePage(type, token, pageId) {
  return graph(token, `${encodeURIComponent(pageId)}/subscribed_apps`, {
    method: 'POST',
    body: { subscribed_fields: 'messages,message_echoes,message_deliveries,message_reads,messaging_postbacks' },
    service: SERVICE[type],
  });
}

// Até 24h após a última mensagem do cliente a resposta é livre; depois, até 7 dias, só como
// atendimento humano (tag HUMAN_AGENT). Passado isso, a Meta não deixa responder.
const DAY = 24 * 3600 * 1000;
function windowInfo(conv) {
  const last = conv.last_inbound_at ? new Date(conv.last_inbound_at).getTime() : 0;
  const expires = last ? new Date(last + 7 * DAY) : null;
  return {
    window_open: Boolean(expires && expires > new Date()),
    window_expires_at: expires,
    human_agent: Boolean(last && Date.now() - last > DAY),
  };
}

// Mensagens que o próprio CRM enviou: a Meta devolve uma cópia ("eco") que não deve virar mensagem nova.
const sentIds = new Set();
function remember(id) {
  if (!id) return;
  sentIds.add(id);
  if (sentIds.size > 5000) sentIds.delete(sentIds.values().next().value);
}

async function sendText(channel, conv, text) {
  const { human_agent: humanAgent } = windowInfo(conv);
  const data = await call(channel, `${encodeURIComponent(channel.page_id)}/messages`, {
    method: 'POST',
    body: {
      recipient: { id: contactId(conv.contact_phone) },
      messaging_type: humanAgent ? 'MESSAGE_TAG' : 'RESPONSE',
      ...(humanAgent ? { tag: 'HUMAN_AGENT' } : {}),
      message: { text },
    },
  });
  remember(data.message_id);
  return data.message_id || null;
}

// Nome do contato (a Meta não manda no webhook). Falha silenciosa: sem permissão, fica sem nome.
async function profileName(channel, id) {
  try {
    if (channel.type === 'instagram') {
      const p = await call(channel, `${encodeURIComponent(id)}?fields=name,username`);
      return p.name || (p.username ? `@${p.username}` : null);
    }
    const p = await call(channel, `${encodeURIComponent(id)}?fields=first_name,last_name`);
    return [p.first_name, p.last_name].filter(Boolean).join(' ') || null;
  } catch {
    return null;
  }
}

const ATTACHMENT = { image: 'image', audio: 'audio', video: 'video', file: 'document', sticker: 'sticker' };
const MIME = { image: 'image/jpeg', audio: 'audio/mp4', video: 'video/mp4' };

// Converte a mensagem da Meta no formato guardado no CRM. Anexos ficam só como link: nada é salvo no servidor.
function describe(message) {
  const att = (message.attachments || [])[0];
  if (att && ATTACHMENT[att.type] && att.payload?.url) {
    const type = ATTACHMENT[att.type];
    return {
      type,
      body: message.text || null,
      media: { url: att.payload.url, mime_type: MIME[type] || null, filename: null },
    };
  }
  if (att && ['share', 'story_mention', 'ig_reel', 'reel', 'fallback', 'template'].includes(att.type)) {
    const label = att.type === 'story_mention' ? 'Mencionou você em um story' : 'Compartilhou uma publicação';
    return {
      type: 'text',
      body: [message.text, att.payload?.url ? `${label}: ${att.payload.url}` : label].filter(Boolean).join('\n'),
    };
  }
  if (message.is_unsupported) return { type: 'unknown', body: null };
  return { type: 'text', body: message.text || message.quick_reply?.payload || '' };
}

// Só baixa anexos dos servidores da Meta (evita que o servidor seja usado para acessar outros endereços).
const ALLOWED_HOSTS = /(^|\.)(fbcdn\.net|fbsbx\.com|cdninstagram\.com|facebook\.com|instagram\.com)$/i;
function allowedUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol === 'https:' && ALLOWED_HOSTS.test(u.hostname)) return true;
  return new URL(config.whatsapp.graphUrl).origin === u.origin; // servidor falso dos testes
}

async function fetchMedia(media) {
  let url = media.url;
  for (let hop = 0; hop < 4; hop++) {
    if (!allowedUrl(url)) throw new HttpError(502, 'Endereço de mídia não permitido.');
    const resp = await fetch(url, { redirect: 'manual' });
    if (resp.status >= 300 && resp.status < 400 && resp.headers.get('location')) {
      url = new URL(resp.headers.get('location'), url).toString();
      continue;
    }
    if (!resp.ok) throw new HttpError(502, 'A mídia expirou ou não está mais disponível na Meta.');
    return {
      mimeType: resp.headers.get('content-type') || media.mime_type,
      body: Buffer.from(await resp.arrayBuffer()),
    };
  }
  throw new HttpError(502, 'Não foi possível baixar a mídia.');
}

module.exports = {
  SOCIAL_TYPES,
  SERVICE,
  contactKey,
  contactId,
  getPage,
  subscribePage,
  windowInfo,
  sendText,
  profileName,
  describe,
  fetchMedia,
  sentIds,
};
