'use strict';
// WhatsApp por QR Code: conexão pelo protocolo do WhatsApp Web (biblioteca Baileys), uma por canal.
//
// - A sessão (credenciais e chaves) fica no banco, criptografada, e sobrevive a reinícios do servidor.
// - Mídias NÃO são baixadas nem guardadas: salvamos só a referência (criptografada) e buscamos no
//   WhatsApp quando alguém abre a foto/áudio no CRM.
// - Grupos, status e canais de transmissão são ignorados; só conversas individuais entram no CRM.
// Uso não oficial do WhatsApp: o número pode ser bloqueado pelo WhatsApp (aviso exibido na tela).
const crypto = require('crypto');
const QRCode = require('qrcode');
const { query, tx, runAsCompany, runAsSystem } = require('../db');
const { encrypt, decrypt } = require('./crypto');
const { broadcast } = require('./realtime');
const inbox = require('./inbox');
const { HttpError } = require('./errors');

const logger = {
  level: 'silent',
  child: () => logger,
  trace() {},
  debug() {},
  info() {},
  warn() {},
  error() {},
  fatal() {},
};

// ---------- Driver: acesso à biblioteca (substituído por um falso nos testes) ----------
let baileys;
const loadBaileys = async () => (baileys ||= await import('@whiskeysockets/baileys'));

const realDriver = {
  LOGGED_OUT: 401,
  async initCreds() {
    return (await loadBaileys()).initAuthCreds();
  },
  async serializer() {
    const b = await loadBaileys();
    return { replacer: b.BufferJSON.replacer, reviver: b.BufferJSON.reviver };
  },
  async fixKey(type, value) {
    const b = await loadBaileys();
    return type === 'app-state-sync-key' && value ? b.proto.Message.AppStateSyncKeyData.fromObject(value) : value;
  },
  async createSocket(auth) {
    const b = await loadBaileys();
    const { version } = await b.fetchLatestBaileysVersion().catch(() => ({}));
    return b.makeWASocket({
      version,
      auth: { creds: auth.creds, keys: b.makeCacheableSignalKeyStore(auth.keys, logger) },
      logger,
      browser: b.Browsers.ubuntu('Chrome'),
      markOnlineOnConnect: false, // o celular continua recebendo notificações
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
    });
  },
  async download(message, sock) {
    const b = await loadBaileys();
    return b.downloadMediaMessage(message, 'buffer', {}, { logger, reuploadRequest: sock && sock.updateMediaMessage });
  },
};
let driver = realDriver;
function setDriver(d) {
  driver = d || realDriver;
}

// ---------- Sessão guardada no banco ----------
async function makeAuthState(channel) {
  const inCompany = (fn) => runAsCompany(channel.company_id, fn);
  const { replacer, reviver } = await driver.serializer();
  const pack = (v) => encrypt(JSON.stringify(v, replacer));
  const unpack = (v) => JSON.parse(decrypt(v), reviver);
  const saved = await inCompany(() =>
    query(`SELECT value_enc FROM channel_session_keys WHERE channel_id = $1 AND key_type = 'creds'`, [channel.id]),
  );
  const creds = saved.rows[0] ? unpack(saved.rows[0].value_enc) : await driver.initCreds();
  return {
    creds,
    keys: {
      get: (type, ids) =>
        inCompany(async () => {
          const { rows } = await query(
            'SELECT key_id, value_enc FROM channel_session_keys WHERE channel_id = $1 AND key_type = $2 AND key_id = ANY($3)',
            [channel.id, type, ids],
          );
          const out = {};
          for (const r of rows) out[r.key_id] = await driver.fixKey(type, unpack(r.value_enc));
          return out;
        }),
      set: (data) =>
        inCompany(() =>
          tx(async (client) => {
            for (const type of Object.keys(data)) {
              for (const [id, value] of Object.entries(data[type])) {
                if (value)
                  await client.query(
                    `INSERT INTO channel_session_keys (channel_id, key_type, key_id, value_enc) VALUES ($1,$2,$3,$4)
                     ON CONFLICT (channel_id, key_type, key_id) DO UPDATE SET value_enc = EXCLUDED.value_enc, updated_at = now()`,
                    [channel.id, type, id, pack(value)],
                  );
                else
                  await client.query(
                    'DELETE FROM channel_session_keys WHERE channel_id = $1 AND key_type = $2 AND key_id = $3',
                    [channel.id, type, id],
                  );
              }
            }
          }),
        ),
    },
    saveCreds: () =>
      inCompany(() =>
        query(
          `INSERT INTO channel_session_keys (channel_id, key_type, key_id, value_enc) VALUES ($1, 'creds', 'creds', $2)
           ON CONFLICT (channel_id, key_type, key_id) DO UPDATE SET value_enc = EXCLUDED.value_enc, updated_at = now()`,
          [channel.id, pack(creds)],
        ),
      ),
    clear: () => inCompany(() => query('DELETE FROM channel_session_keys WHERE channel_id = $1', [channel.id])),
  };
}

// ---------- Conexões ativas (processo único) ----------
const sessions = new Map(); // channelId -> { channel, sock, auth, status, qr, retries, opened, stopping, sentIds }

const log = (channel, err) => console.error(`[WhatsApp QR] canal ${channel.id}: ${err.message || err}`);

async function setChannel(channel, fields) {
  const keys = Object.keys(fields);
  await runAsCompany(channel.company_id, () =>
    query(
      `UPDATE channels SET ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')}, updated_at = now() WHERE id = $1`,
      [channel.id, ...keys.map((k) => fields[k])],
    ),
  );
  broadcast('channel_status', { channel_id: channel.id, ...fields }, undefined, channel.company_id);
}

// Inicia (ou retoma) a conexão de um canal. Sem sessão salva, o WhatsApp gera um QR Code.
async function start(channel) {
  const current = sessions.get(channel.id);
  if (current && current.sock && !current.stopping) return current;
  const s = { channel, status: 'pending', qr: null, retries: current ? current.retries : 0, sentIds: new Set() };
  sessions.set(channel.id, s);
  s.auth = await makeAuthState(channel);
  s.opened = Boolean(s.auth.creds && s.auth.creds.me);
  s.sock = await driver.createSocket(s.auth);
  const ev = s.sock.ev;
  ev.on('creds.update', () => s.auth.saveCreds().catch((e) => log(channel, e)));
  ev.on('connection.update', (u) => onConnection(s, u).catch((e) => log(channel, e)));
  ev.on('messages.upsert', (e) => onMessages(s, e).catch((err) => log(channel, err)));
  ev.on('messages.update', (e) => onUpdates(s, e).catch((err) => log(channel, err)));
  return s;
}

async function onConnection(s, u) {
  const { channel } = s;
  if (u.qr) {
    s.qr = await QRCode.toDataURL(u.qr, { margin: 1, width: 280 });
    s.status = 'pending';
    broadcast('channel_status', { channel_id: channel.id, status: 'pending', qr: true }, undefined, channel.company_id);
  }
  if (u.connection === 'open') {
    s.status = 'connected';
    s.qr = null;
    s.retries = 0;
    s.opened = true;
    const user = s.sock.user || {};
    const digits = String(user.id || '').split(/[:@]/)[0];
    await setChannel(channel, {
      status: 'connected',
      last_error: null,
      display_phone: digits ? `+${digits}` : null,
      verified_name: user.name || user.notify || null,
    });
  }
  if (u.connection === 'close') {
    const code =
      u.lastDisconnect && u.lastDisconnect.error && u.lastDisconnect.error.output
        ? u.lastDisconnect.error.output.statusCode
        : null;
    s.sock = null;
    if (s.stopping) return;
    if (code === driver.LOGGED_OUT) {
      sessions.delete(channel.id);
      await s.auth.clear();
      await setChannel(channel, {
        status: 'disconnected',
        last_error: 'A sessão foi encerrada no celular (Aparelhos conectados). Gere um novo QR Code.',
      });
      return;
    }
    if (!s.opened) {
      // Ninguém leu o QR a tempo: para de gerar códigos até alguém pedir de novo.
      sessions.delete(channel.id);
      await setChannel(channel, {
        status: 'disconnected',
        last_error: 'O QR Code expirou. Gere um novo para conectar.',
      });
      return;
    }
    s.retries += 1;
    if (s.retries > 8) {
      sessions.delete(channel.id);
      await setChannel(channel, {
        status: 'error',
        last_error: 'Não foi possível reconectar ao WhatsApp. Confira se o celular tem internet e reconecte.',
      });
      return;
    }
    const delay = Math.min(60000, 1000 * 2 ** s.retries);
    setTimeout(() => {
      if (sessions.get(channel.id) === s && !s.stopping) {
        sessions.delete(channel.id);
        start(channel).catch((e) => log(channel, e));
      }
    }, delay).unref();
  }
}

// Conteúdo real da mensagem (o WhatsApp embrulha mensagens temporárias, de visualização única etc.)
function unwrap(message) {
  let m = message;
  for (let i = 0; i < 5 && m; i++) {
    const inner =
      m.ephemeralMessage ||
      m.viewOnceMessage ||
      m.viewOnceMessageV2 ||
      m.viewOnceMessageV2Extension ||
      m.documentWithCaptionMessage ||
      m.editedMessage;
    if (!inner || !inner.message) break;
    m = inner.message;
  }
  return m;
}

const MEDIA = {
  imageMessage: 'image',
  audioMessage: 'audio',
  videoMessage: 'video',
  documentMessage: 'document',
  stickerMessage: 'sticker',
};

function describe(content) {
  if (!content) return null;
  if (content.conversation != null) return { type: 'text', body: content.conversation };
  if (content.extendedTextMessage) return { type: 'text', body: content.extendedTextMessage.text || '' };
  for (const [key, type] of Object.entries(MEDIA)) {
    const x = content[key];
    if (x)
      return {
        type,
        body: x.caption || null,
        mediaKey: key,
        mime: x.mimetype || null,
        filename: x.fileName || null,
      };
  }
  if (content.locationMessage) {
    const l = content.locationMessage;
    return {
      type: 'location',
      body: [l.name, l.address, `${l.degreesLatitude},${l.degreesLongitude}`].filter(Boolean).join(' — '),
    };
  }
  if (content.contactMessage) return { type: 'contacts', body: content.contactMessage.displayName || '' };
  if (content.reactionMessage) return { type: 'reaction', body: content.reactionMessage.text || '' };
  if (content.buttonsResponseMessage)
    return { type: 'text', body: content.buttonsResponseMessage.selectedDisplayText || '' };
  if (content.listResponseMessage) return { type: 'text', body: content.listResponseMessage.title || '' };
  return null; // mensagens de protocolo, enquetes etc. não entram no CRM
}

const IGNORED = /@(g\.us|broadcast|newsletter)$/;

// Descobre o número do contato. Contas com privacidade chegam como "...@lid"; o número pode vir junto
// (remoteJidAlt) ou estar no mapeamento do protocolo. Sem número, usamos "lid:<id>".
async function contactOf(s, key) {
  const jid = key.remoteJid;
  if (jid.endsWith('@s.whatsapp.net')) return { phone: jid.split('@')[0].split(':')[0], jid };
  let pn = key.remoteJidAlt && key.remoteJidAlt.endsWith('@s.whatsapp.net') ? key.remoteJidAlt : null;
  const mapping = s.sock && s.sock.signalRepository && s.sock.signalRepository.lidMapping;
  if (!pn && mapping) pn = await mapping.getPNForLID(jid).catch(() => null);
  if (pn) return { phone: pn.split('@')[0].split(':')[0], jid };
  return { phone: `lid:${jid.split('@')[0]}`, jid };
}

async function onMessages(s, { messages, type }) {
  if (type !== 'notify' && type !== 'append') return;
  const { replacer } = await driver.serializer();
  for (const m of messages || []) {
    const key = m.key || {};
    if (!key.remoteJid || IGNORED.test(key.remoteJid) || !m.message || !key.id) continue;
    if (key.fromMe && s.sentIds.delete(key.id)) continue; // enviada pelo próprio CRM: já registrada
    const sentAt = m.messageTimestamp ? new Date(Number(m.messageTimestamp) * 1000) : new Date();
    if (type === 'append' && Date.now() - sentAt.getTime() > 10 * 60 * 1000) continue; // histórico antigo
    const content = unwrap(m.message);
    const d = describe(content);
    if (!d) continue;
    const contact = await contactOf(s, key);
    // Guardamos só a referência criptografada para baixar a mídia do WhatsApp quando alguém abrir.
    const media = d.mediaKey
      ? {
          ref: encrypt(JSON.stringify({ key, message: { [d.mediaKey]: content[d.mediaKey] } }, replacer)),
          mime_type: d.mime,
          filename: d.filename,
        }
      : null;
    const result = await runAsCompany(s.channel.company_id, () =>
      inbox.ingestMessage(s.channel, {
        externalId: key.id,
        phone: contact.phone,
        jid: contact.jid,
        contactName: key.fromMe ? null : m.pushName || null,
        direction: key.fromMe ? 'out' : 'in',
        type: d.type,
        body: d.body,
        media,
        sentAt,
      }),
    );
    inbox.announce(result, s.channel.company_id);
  }
}

// Confirmações de entrega/leitura: 2 = enviada, 3 = entregue, 4/5 = lida/ouvida
const ACK = { 0: 'failed', 2: 'sent', 3: 'delivered', 4: 'read', 5: 'read' };
async function onUpdates(s, updates) {
  for (const u of updates || []) {
    const status = u.update && ACK[u.update.status];
    if (!status || !u.key || !u.key.fromMe) continue;
    const conversationId = await runAsCompany(s.channel.company_id, () => inbox.updateStatus(u.key.id, status));
    if (conversationId)
      broadcast('inbox_changed', { conversation_id: conversationId }, undefined, s.channel.company_id);
  }
}

// ---------- Operações usadas pelas rotas ----------
function activeSocket(channel) {
  const s = sessions.get(channel.id);
  if (!s || !s.sock || s.status !== 'connected')
    throw new HttpError(
      409,
      'O WhatsApp desta conexão não está conectado no momento. Confira o celular ou reconecte em Configurações › WhatsApp.',
    );
  return s;
}

async function sendText(channel, jid, text) {
  const s = activeSocket(channel);
  const id = '3EB0' + crypto.randomBytes(8).toString('hex').toUpperCase();
  s.sentIds.add(id);
  try {
    await s.sock.sendMessage(jid, { text }, { messageId: id });
  } catch (err) {
    s.sentIds.delete(id);
    throw new HttpError(502, `O WhatsApp recusou o envio: ${err.message}`);
  }
  return id;
}

// Confirma se o número tem WhatsApp e devolve o endereço certo (considera o 9 extra de celulares BR).
async function resolveJid(channel, phoneVariants) {
  const s = activeSocket(channel);
  for (const phone of phoneVariants) {
    const [r] = (await s.sock.onWhatsApp(phone).catch(() => [])) || [];
    if (r && r.exists) return { jid: r.jid, phone: r.jid.split('@')[0].split(':')[0] };
  }
  return null;
}

async function fetchMedia(channel, media) {
  const { reviver } = await driver.serializer();
  const msg = JSON.parse(decrypt(media.ref), reviver);
  const s = sessions.get(channel.id);
  try {
    const body = await driver.download(msg, s && s.sock);
    return { mimeType: media.mime_type || 'application/octet-stream', body };
  } catch (err) {
    log(channel, err);
    throw new HttpError(
      502,
      'Não foi possível baixar este arquivo do WhatsApp. Ele pode ter sido apagado do celular ou expirado.',
    );
  }
}

function state(channelId) {
  const s = sessions.get(channelId);
  return s ? { status: s.status, qr: s.qr } : { status: null, qr: null };
}

// Encerra a sessão: desconecta o aparelho no WhatsApp e apaga as chaves do banco.
async function logout(channel) {
  const s = sessions.get(channel.id);
  sessions.delete(channel.id);
  if (s) {
    s.stopping = true;
    try {
      if (s.sock) await s.sock.logout();
    } catch (_) {
      /* já desconectado */
    }
  }
  const auth = await makeAuthState(channel);
  await auth.clear();
}

// Ao iniciar o servidor: retoma as conexões que estavam ativas.
async function resumeAll() {
  const { rows } = await runAsSystem(() =>
    query(`SELECT * FROM channels WHERE type = 'whatsapp_web' AND status = 'connected'`),
  );
  for (const channel of rows) await start(channel).catch((e) => log(channel, e));
  return rows.length;
}

function stopAll() {
  for (const s of sessions.values()) {
    s.stopping = true;
    try {
      if (s.sock) s.sock.end(undefined);
    } catch (_) {
      /* ignore */
    }
  }
  sessions.clear();
}

module.exports = {
  start,
  state,
  sendText,
  resolveJid,
  fetchMedia,
  logout,
  resumeAll,
  stopAll,
  setDriver,
  unwrap,
  describe,
};
