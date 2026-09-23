'use strict';
// Caixa de entrada: processa o que chega de cada canal (WhatsApp, Instagram, Messenger) e mantém as conversas.
// Roda sempre no contexto da empresa dona do canal (runAsCompany).
const { tx, query, currentCompanyId } = require('../db');
const { broadcast } = require('./realtime');
const { normalizePhone, brPhoneVariants } = require('./util');
const meta = require('./meta');

const CHANNEL_LABEL = {
  whatsapp: 'WhatsApp',
  whatsapp_web: 'WhatsApp',
  messenger: 'Messenger',
  instagram: 'Instagram',
};

const MEDIA_TYPES = ['image', 'audio', 'video', 'document', 'sticker'];
const LABEL = {
  image: '📷 Imagem',
  audio: '🎤 Áudio',
  video: '🎬 Vídeo',
  document: '📄 Documento',
  sticker: 'Figurinha',
  location: '📍 Localização',
  contacts: '👤 Contato',
  template: '📋 Modelo',
};

// Converte a mensagem da Meta no formato guardado no CRM.
function describe(m) {
  if (m.type === 'text') return { type: 'text', body: m.text?.body || '' };
  if (MEDIA_TYPES.includes(m.type)) {
    const x = m[m.type] || {};
    return {
      type: m.type,
      body: x.caption || null,
      media: { id: x.id, mime_type: x.mime_type, filename: x.filename || null },
    };
  }
  if (m.type === 'location') {
    const l = m.location || {};
    return { type: 'location', body: [l.name, l.address, `${l.latitude},${l.longitude}`].filter(Boolean).join(' — ') };
  }
  if (m.type === 'button') return { type: 'text', body: m.button?.text || '' };
  if (m.type === 'interactive') {
    const r = m.interactive?.button_reply || m.interactive?.list_reply || {};
    return { type: 'text', body: r.title || '' };
  }
  if (m.type === 'reaction') return { type: 'reaction', body: m.reaction?.emoji || '' };
  if (m.type === 'contacts') {
    return { type: 'contacts', body: (m.contacts || []).map((c) => c.name?.formatted_name).join(', ') };
  }
  return { type: m.type || 'unknown', body: null };
}

const preview = (type, body) => (body ? String(body).slice(0, 140) : LABEL[type] || 'Mensagem');

// Cria (se preciso) cliente, conversa e oportunidade para um contato novo.
// phone: dígitos com DDI; "lid:<id>" quando o WhatsApp não revela o número (contatos com privacidade);
// "fb:<id>" / "ig:<id>" no Messenger e no Instagram.
async function openConversation(client, channel, phone, name, jid = null) {
  const label = CHANNEL_LABEL[channel.type] || 'WhatsApp';
  const hasNumber = /^\d+$/.test(phone);
  const fallbackName = hasNumber ? `+${phone}` : `Contato do ${label}`;
  let customer = hasNumber
    ? (
        await client.query('SELECT id FROM customers WHERE phone_digits = ANY($1) ORDER BY id LIMIT 1', [
          brPhoneVariants(phone),
        ])
      ).rows[0]
    : null;
  if (!customer) {
    customer = (
      await client.query(
        `INSERT INTO customers (name, phone, phone_digits, source) VALUES ($1, $2, $3, $4) RETURNING id`,
        [name || fallbackName, hasNumber ? `+${phone}` : null, hasNumber ? phone : null, label],
      )
    ).rows[0];
  }
  const conv = (
    await client.query(
      `INSERT INTO conversations (channel_id, customer_id, contact_phone, contact_name, contact_jid) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (company_id, channel_id, contact_phone) DO UPDATE SET updated_at = now()
       RETURNING *, (xmax = 0) AS inserted`,
      [channel.id, customer.id, phone, name || null, jid],
    )
  ).rows[0];
  if (conv.inserted) conv.newLead = await createLead(client, conv, name || fallbackName, label);
  return conv;
}

// Nova conversa vira oportunidade na primeira etapa do funil (como no Kommo), se ativado.
async function createLead(client, conv, name, label = 'WhatsApp') {
  const settings = (
    await client.query('SELECT inbox_auto_lead FROM company_settings WHERE company_id = app_company_id()')
  ).rows[0];
  if (!settings || !settings.inbox_auto_lead) return null;
  const open = (
    await client.query(
      `SELECT o.id FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id
       WHERE o.customer_id = $1 AND s.kind = 'open' ORDER BY o.created_at DESC LIMIT 1`,
      [conv.customer_id],
    )
  ).rows[0];
  let oppId = open && open.id;
  let created = null;
  if (!oppId) {
    const stage = (
      await client.query(
        `SELECT s.id, s.name FROM pipeline_stages s JOIN pipelines p ON p.id = s.pipeline_id
         WHERE p.is_default AND s.active AND s.kind = 'open' ORDER BY s.position LIMIT 1`,
      )
    ).rows[0];
    if (!stage) return null;
    oppId = (
      await client.query(`INSERT INTO opportunities (title, customer_id, stage_id) VALUES ($1, $2, $3) RETURNING id`, [
        `${label} — ${name}`,
        conv.customer_id,
        stage.id,
      ])
    ).rows[0].id;
    await client.query('INSERT INTO opportunity_events (opportunity_id, body, payload) VALUES ($1, $2, $3)', [
      oppId,
      `Criada automaticamente por uma conversa no ${label}, na etapa "${stage.name}"`,
      JSON.stringify({ action: 'created', via: label.toLowerCase(), conversation_id: conv.id }),
    ]);
    created = { opportunityId: oppId, stageId: stage.id };
  }
  await client.query('UPDATE conversations SET opportunity_id = $1 WHERE id = $2', [oppId, conv.id]);
  return created;
}

// Grava uma mensagem de qualquer canal. msg = { externalId, phone, jid, contactName, direction ('in' | 'out'),
// type, body, media, sentAt }. Mensagens 'out' aqui são as enviadas direto pelo celular (fora do CRM).
async function ingestMessage(channel, msg) {
  if (!msg.phone || !msg.externalId) return null;
  const sentAt = msg.sentAt || new Date();
  const incoming = msg.direction !== 'out';
  return tx(async (client) => {
    const dup = await client.query('SELECT 1 FROM messages WHERE wa_message_id = $1', [msg.externalId]);
    if (dup.rowCount) return null; // eventos podem ser reenviados
    let conv = (
      await client.query('SELECT * FROM conversations WHERE channel_id = $1 AND contact_phone = $2 FOR UPDATE', [
        channel.id,
        msg.phone,
      ])
    ).rows[0];
    const isNew = !conv;
    if (!conv) conv = await openConversation(client, channel, msg.phone, incoming ? msg.contactName : null, msg.jid);
    await client.query(
      `INSERT INTO messages (conversation_id, direction, type, body, media, wa_message_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        conv.id,
        incoming ? 'in' : 'out',
        msg.type,
        msg.body,
        msg.media ? JSON.stringify(msg.media) : null,
        msg.externalId,
        incoming ? 'received' : 'sent',
        sentAt,
      ],
    );
    await client.query(
      `UPDATE conversations SET last_message_at = $2, last_message_preview = $3, updated_at = now(),
         contact_jid = COALESCE($5::text, contact_jid),
         status = CASE WHEN $6 THEN 'open' ELSE status END,
         bot_state = CASE WHEN NOT $6 THEN 'done' WHEN status = 'closed' THEN NULL ELSE bot_state END,
         bot_tries = CASE WHEN $6 AND status = 'closed' THEN 0 ELSE bot_tries END,
         unread_count = CASE WHEN $6 THEN unread_count + 1 ELSE unread_count END,
         last_inbound_at = CASE WHEN $6 THEN $2 ELSE last_inbound_at END,
         contact_name = CASE WHEN $6 THEN COALESCE($4::text, contact_name) ELSE contact_name END
       WHERE id = $1`,
      [conv.id, sentAt, preview(msg.type, msg.body), msg.contactName || null, msg.jid || null, incoming],
    );
    return { conversationId: conv.id, isNew, newLead: conv.newLead || null, incoming };
  });
}

// Mensagem recebida pela API oficial (formato da Meta)
function receiveMessage(channel, m, contactName) {
  return ingestMessage(channel, {
    externalId: m.id,
    phone: normalizePhone(m.from),
    contactName,
    direction: 'in',
    ...describe(m),
    sentAt: m.timestamp ? new Date(Number(m.timestamp) * 1000) : new Date(),
  });
}

// Status de entrega das mensagens enviadas. Não regride (eventos podem chegar fora de ordem).
const RANK = { pending: 0, sent: 1, delivered: 2, read: 3, failed: 4 };
async function updateStatus(externalId, status, error = null) {
  if (!(status in RANK)) return null;
  return tx(async (client) => {
    const row = (
      await client.query(
        `SELECT id, conversation_id, status FROM messages WHERE wa_message_id = $1 AND direction = 'out'`,
        [externalId],
      )
    ).rows[0];
    if (!row || (RANK[row.status] ?? 0) >= RANK[status]) return null;
    await client.query('UPDATE messages SET status = $1, error = $2 WHERE id = $3', [status, error, row.id]);
    return row.conversation_id;
  });
}

// Avisa as telas da empresa (tempo real) sobre o resultado de ingestMessage.
function announce(result, companyId = currentCompanyId()) {
  if (!result) return;
  if (result.newLead) {
    // Oportunidade criada pela conversa: roda as automações da etapa (carregado aqui para evitar ciclo)
    require('./automations').onStageEntered({ companyId, ...result.newLead });
  }
  // Robô de atendimento (boas-vindas, menu, fora do horário)
  if (result.incoming) require('./chatbot').onInbound({ companyId, conversationId: result.conversationId });
  broadcast(
    'inbox_changed',
    { conversation_id: result.conversationId, new_conversation: result.isNew },
    undefined,
    companyId,
  );
  if (result.isNew) broadcast('pipeline_changed', {}, undefined, companyId);
}

// Processa um item "value" do webhook para o canal informado.
async function processWebhookValue(channel, value) {
  if (value.metadata && value.metadata.phone_number_id && value.metadata.phone_number_id !== channel.phone_number_id)
    return;
  const names = Object.fromEntries((value.contacts || []).map((c) => [c.wa_id, c.profile?.name]));
  for (const m of value.messages || []) announce(await receiveMessage(channel, m, names[m.from]));
  for (const s of value.statuses || []) {
    const error = s.errors && s.errors[0] ? s.errors[0].title || s.errors[0].message : null;
    const conversationId = await updateStatus(s.id, s.status, error);
    if (conversationId) broadcast('inbox_changed', { conversation_id: conversationId });
  }
}

// ---------- Instagram e Messenger ----------

// Marca como lidas as mensagens enviadas até o instante informado (o Messenger avisa por "watermark").
async function markReadUntil(channel, contact, watermark) {
  const { rows } = await query(
    `UPDATE messages m SET status = 'read' FROM conversations c
     WHERE c.id = m.conversation_id AND c.channel_id = $1 AND c.contact_phone = $2 AND m.direction = 'out'
       AND m.status IN ('sent', 'delivered') AND m.created_at <= to_timestamp($3 / 1000.0)
     RETURNING m.conversation_id`,
    [channel.id, contact, Number(watermark)],
  );
  return rows[0]?.conversation_id || null;
}

async function processMetaEvent(channel, ev, ownId) {
  const message = ev.message || (ev.postback ? { mid: ev.postback.mid, text: ev.postback.title } : null);
  if (message && message.mid && !message.is_deleted) {
    const echo = Boolean(message.is_echo); // enviada pela própria página (pelo app da Meta ou pelo CRM)
    if (echo && meta.sentIds.has(message.mid)) return;
    const other = echo ? ev.recipient?.id : ev.sender?.id;
    if (!other || String(other) === String(ownId)) return;
    const phone = meta.contactKey(channel, other);
    let contactName = null;
    if (!echo) {
      const known = await query('SELECT 1 FROM conversations WHERE channel_id = $1 AND contact_phone = $2', [
        channel.id,
        phone,
      ]);
      if (!known.rowCount) contactName = await meta.profileName(channel, other);
    }
    announce(
      await ingestMessage(channel, {
        externalId: message.mid,
        phone,
        contactName,
        direction: echo ? 'out' : 'in',
        ...meta.describe(message),
        sentAt: ev.timestamp ? new Date(Number(ev.timestamp)) : new Date(),
      }),
    );
  }
  const touched = new Set();
  for (const mid of ev.delivery?.mids || []) touched.add(await updateStatus(mid, 'delivered'));
  if (ev.read?.mid) touched.add(await updateStatus(ev.read.mid, 'read'));
  else if (ev.read?.watermark && ev.sender?.id)
    touched.add(await markReadUntil(channel, meta.contactKey(channel, ev.sender.id), ev.read.watermark));
  for (const id of touched) if (id) broadcast('inbox_changed', { conversation_id: id });
}

// Corpo do webhook do Messenger (object "page") ou do Instagram (object "instagram").
async function processMetaWebhook(channel, body) {
  if (body.object !== (channel.type === 'instagram' ? 'instagram' : 'page')) return;
  const ownId = channel.type === 'instagram' ? channel.ig_account_id : channel.page_id;
  for (const entry of body.entry || []) {
    if (String(entry.id) !== String(ownId)) continue;
    for (const ev of entry.messaging || []) await processMetaEvent(channel, ev, ownId);
  }
}

module.exports = {
  processMetaWebhook,
  CHANNEL_LABEL,
  processWebhookValue,
  ingestMessage,
  updateStatus,
  announce,
  openConversation,
  preview,
  describe,
};
