'use strict';
// Caixa de entrada: processa o que chega pelo webhook do WhatsApp e mantém as conversas.
// Roda sempre no contexto da empresa dona do canal (runAsCompany).
const { tx } = require('../db');
const { broadcast } = require('./realtime');
const { normalizePhone, brPhoneVariants } = require('./util');

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
async function openConversation(client, channel, phone, name) {
  let customer = (
    await client.query('SELECT id FROM customers WHERE phone_digits = ANY($1) ORDER BY id LIMIT 1', [
      brPhoneVariants(phone),
    ])
  ).rows[0];
  if (!customer) {
    customer = (
      await client.query(
        `INSERT INTO customers (name, phone, phone_digits, source) VALUES ($1, $2, $3, 'WhatsApp') RETURNING id`,
        [name || `+${phone}`, `+${phone}`, phone],
      )
    ).rows[0];
  }
  const conv = (
    await client.query(
      `INSERT INTO conversations (channel_id, customer_id, contact_phone, contact_name) VALUES ($1,$2,$3,$4)
       ON CONFLICT (company_id, channel_id, contact_phone) DO UPDATE SET updated_at = now()
       RETURNING *, (xmax = 0) AS inserted`,
      [channel.id, customer.id, phone, name || null],
    )
  ).rows[0];
  if (conv.inserted) await createLead(client, conv, name || `+${phone}`);
  return conv;
}

// Nova conversa vira oportunidade na primeira etapa do funil (como no Kommo), se ativado.
async function createLead(client, conv, name) {
  const settings = (
    await client.query('SELECT inbox_auto_lead FROM company_settings WHERE company_id = app_company_id()')
  ).rows[0];
  if (!settings || !settings.inbox_auto_lead) return;
  const open = (
    await client.query(
      `SELECT o.id FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id
       WHERE o.customer_id = $1 AND s.kind = 'open' ORDER BY o.created_at DESC LIMIT 1`,
      [conv.customer_id],
    )
  ).rows[0];
  let oppId = open && open.id;
  if (!oppId) {
    const stage = (
      await client.query(
        `SELECT id, name FROM pipeline_stages WHERE active AND kind = 'open' ORDER BY position LIMIT 1`,
      )
    ).rows[0];
    if (!stage) return;
    oppId = (
      await client.query(`INSERT INTO opportunities (title, customer_id, stage_id) VALUES ($1, $2, $3) RETURNING id`, [
        `WhatsApp — ${name}`,
        conv.customer_id,
        stage.id,
      ])
    ).rows[0].id;
    await client.query('INSERT INTO opportunity_events (opportunity_id, body, payload) VALUES ($1, $2, $3)', [
      oppId,
      `Criada automaticamente por uma conversa no WhatsApp, na etapa "${stage.name}"`,
      JSON.stringify({ action: 'created', via: 'whatsapp', conversation_id: conv.id }),
    ]);
  }
  await client.query('UPDATE conversations SET opportunity_id = $1 WHERE id = $2', [oppId, conv.id]);
}

async function receiveMessage(channel, m, contactName) {
  const phone = normalizePhone(m.from);
  if (!phone || !m.id) return null;
  const msg = describe(m);
  const sentAt = m.timestamp ? new Date(Number(m.timestamp) * 1000) : new Date();
  return tx(async (client) => {
    const dup = await client.query('SELECT 1 FROM messages WHERE wa_message_id = $1', [m.id]);
    if (dup.rowCount) return null; // a Meta pode reenviar o mesmo evento
    let conv = (
      await client.query('SELECT * FROM conversations WHERE channel_id = $1 AND contact_phone = $2 FOR UPDATE', [
        channel.id,
        phone,
      ])
    ).rows[0];
    const isNew = !conv;
    if (!conv) conv = await openConversation(client, channel, phone, contactName);
    await client.query(
      `INSERT INTO messages (conversation_id, direction, type, body, media, wa_message_id, status, created_at)
       VALUES ($1, 'in', $2, $3, $4, $5, 'received', $6)`,
      [conv.id, msg.type, msg.body, msg.media ? JSON.stringify(msg.media) : null, m.id, sentAt],
    );
    await client.query(
      `UPDATE conversations SET status = 'open', unread_count = unread_count + 1, last_message_at = $2,
         last_message_preview = $3, last_inbound_at = $2, contact_name = COALESCE($4, contact_name), updated_at = now()
       WHERE id = $1`,
      [conv.id, sentAt, preview(msg.type, msg.body), contactName || null],
    );
    return { conversationId: conv.id, isNew };
  });
}

// Status de entrega das mensagens enviadas. Não regride (eventos podem chegar fora de ordem).
const RANK = { pending: 0, sent: 1, delivered: 2, read: 3, failed: 4 };
async function updateStatus(s) {
  if (!(s.status in RANK)) return null;
  const error = s.errors && s.errors[0] ? s.errors[0].title || s.errors[0].message : null;
  return tx(async (client) => {
    const row = (
      await client.query(
        `SELECT id, conversation_id, status FROM messages WHERE wa_message_id = $1 AND direction = 'out'`,
        [s.id],
      )
    ).rows[0];
    if (!row || (RANK[row.status] ?? 0) >= RANK[s.status]) return null;
    await client.query('UPDATE messages SET status = $1, error = $2 WHERE id = $3', [s.status, error, row.id]);
    return row.conversation_id;
  });
}

// Processa um item "value" do webhook para o canal informado.
async function processWebhookValue(channel, value) {
  if (value.metadata && value.metadata.phone_number_id && value.metadata.phone_number_id !== channel.phone_number_id)
    return;
  const names = Object.fromEntries((value.contacts || []).map((c) => [c.wa_id, c.profile?.name]));
  for (const m of value.messages || []) {
    const r = await receiveMessage(channel, m, names[m.from]);
    if (r) broadcast('inbox_changed', { conversation_id: r.conversationId, new_conversation: r.isNew });
    if (r && r.isNew) broadcast('pipeline_changed', {});
  }
  for (const s of value.statuses || []) {
    const conversationId = await updateStatus(s);
    if (conversationId) broadcast('inbox_changed', { conversation_id: conversationId });
  }
}

module.exports = { processWebhookValue, openConversation, preview, describe };
