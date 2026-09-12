'use strict';
// Integração com a API oficial do WhatsApp Business (Meta Cloud API).
// Sem credenciais nada é simulado: as funções lançam erro claro e o estado aparece como "desconectado".
const { query, tx } = require('../db');
const config = require('../config');
const { broadcast } = require('./realtime');
const { normalizePhone, nextProtocol } = require('./util');
const { HttpError } = require('./errors');

const wa = config.whatsapp;
const GRAPH = 'https://graph.facebook.com/v20.0';
const STATUS_PT = { sent: 'enviado', delivered: 'entregue', read: 'lido', failed: 'falhou', deleted: 'apagado' };

function state() {
  const missing = [];
  if (!wa.token) missing.push('WHATSAPP_TOKEN');
  if (!wa.phoneNumberId) missing.push('WHATSAPP_PHONE_NUMBER_ID');
  if (!wa.verifyToken) missing.push('WHATSAPP_VERIFY_TOKEN');
  if (!wa.appSecret) missing.push('WHATSAPP_APP_SECRET');
  return { configured: wa.configured, missing, webhook_ready: wa.configured && Boolean(wa.verifyToken), signature_check: Boolean(wa.appSecret) };
}

async function recordError(msg) {
  try { await query('UPDATE company_settings SET whatsapp_last_error = $1, whatsapp_last_error_at = now() WHERE id = 1', [String(msg).slice(0, 500)]); } catch (_) { /* ignore */ }
}

// Janela de 24h: mensagens livres só podem ser enviadas até 24h após a última mensagem do cliente.
async function windowOpen(customerId) {
  const { rows } = await query(`SELECT max(created_at) AS last_in FROM whatsapp_messages WHERE customer_id = $1 AND direction = 'entrada'`, [customerId]);
  const last = rows[0].last_in ? new Date(rows[0].last_in) : null;
  return { open: Boolean(last && Date.now() - last.getTime() < 24 * 3600 * 1000), last_inbound_at: last };
}

async function graph(path, body) {
  const resp = await fetch(`${GRAPH}/${path}`, { method: 'POST', headers: { Authorization: `Bearer ${wa.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const msg = data.error?.message || `HTTP ${resp.status}`;
    await recordError(msg);
    throw new HttpError(502, `A API do WhatsApp recusou o envio: ${msg}`, { code: data.error?.code });
  }
  return data;
}

// Envia texto (ou template) e grava no histórico do atendimento. Retorna a mensagem gravada.
async function sendText({ ticketId, customerId, body, userId, template, viaRule }) {
  if (!wa.configured) throw new HttpError(503, 'WhatsApp não está conectado. Configure as credenciais no servidor ou registre a interação manualmente.');
  const c = (await query('SELECT id, phone_digits, name FROM customers WHERE id = $1', [customerId])).rows[0];
  if (!c || !c.phone_digits) throw new HttpError(400, 'Cliente sem telefone válido para WhatsApp.');
  let payload;
  if (template) {
    payload = { messaging_product: 'whatsapp', to: c.phone_digits, type: 'template', template: { name: template.name, language: { code: template.language || 'pt_BR' } } };
  } else {
    const w = await windowOpen(c.id);
    if (!w.open) throw new HttpError(409, 'Fora da janela de 24h: o cliente não enviou mensagem nas últimas 24 horas. Pelas regras da Meta, só é permitido enviar um modelo (template) aprovado.', { window_closed: true, last_inbound_at: w.last_inbound_at });
    payload = { messaging_product: 'whatsapp', to: c.phone_digits, type: 'text', text: { body, preview_url: false } };
  }
  const data = await graph(`${wa.phoneNumberId}/messages`, payload);
  const waId = data.messages?.[0]?.id || null;
  const text = template ? `[modelo: ${template.name}]` : body;
  return tx(async (client) => {
    let eventId = null;
    if (ticketId) {
      const ev = await client.query(
        `INSERT INTO ticket_events (ticket_id, user_id, kind, direction, channel, body, payload) VALUES ($1,$2,'interaction','saida','WhatsApp',$3,$4) RETURNING id`,
        [ticketId, userId, text, JSON.stringify({ via: 'whatsapp_api', wa_message_id: waId, status: 'enviado', rule_id: viaRule || null })]);
      eventId = ev.rows[0].id;
      await client.query(`UPDATE tickets SET first_response_at = COALESCE(first_response_at, now()), last_message_at = now(), last_message_preview = left($2, 160),
        last_message_direction = 'saida', last_agent_message_at = now(), unread_count = 0, updated_at = now() WHERE id = $1`, [ticketId, text]);
    }
    const { rows } = await client.query(
      `INSERT INTO whatsapp_messages (customer_id, ticket_id, user_id, direction, wa_message_id, phone_digits, body, status, raw, ticket_event_id, message_type)
       VALUES ($1,$2,$3,'saida',$4,$5,$6,'enviado',$7,$8,$9) RETURNING *`,
      [c.id, ticketId || null, userId, waId, c.phone_digits, text, JSON.stringify(data), eventId, template ? 'template' : 'text']);
    broadcast('tickets_changed', { id: ticketId, action: 'message' });
    return rows[0];
  });
}

// Processa o corpo de um webhook (mensagens e status). Idempotente: eventos repetidos não duplicam registros.
async function processWebhook(body) {
  let messages = 0, statuses = 0;
  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const v = change.value || {};
      const contacts = new Map((v.contacts || []).map((c) => [normalizePhone(c.wa_id), c.profile?.name]));
      for (const m of v.messages || []) { if (await inbound(m, contacts)) messages++; }
      for (const s of v.statuses || []) { if (await statusUpdate(s)) statuses++; }
    }
  }
  await query('UPDATE company_settings SET whatsapp_last_event_at = now() WHERE id = 1');
  return { messages, statuses };
}

function describe(m) {
  switch (m.type) {
    case 'text': return { body: m.text?.body || '', media: null };
    case 'image': return { body: m.image?.caption || '[imagem]', media: { id: m.image?.id, mime: m.image?.mime_type, name: 'imagem' } };
    case 'document': return { body: m.document?.caption || `[documento] ${m.document?.filename || ''}`.trim(), media: { id: m.document?.id, mime: m.document?.mime_type, name: m.document?.filename || 'documento' } };
    case 'audio': return { body: '[áudio]', media: { id: m.audio?.id, mime: m.audio?.mime_type, name: 'audio' } };
    case 'video': return { body: m.video?.caption || '[vídeo]', media: { id: m.video?.id, mime: m.video?.mime_type, name: 'video' } };
    case 'sticker': return { body: '[figurinha]', media: null };
    case 'location': return { body: `[localização] ${m.location?.latitude}, ${m.location?.longitude}`, media: null };
    case 'button': return { body: m.button?.text || '[botão]', media: null };
    case 'interactive': return { body: m.interactive?.button_reply?.title || m.interactive?.list_reply?.title || '[interativo]', media: null };
    default: return { body: `[${m.type}]`, media: null };
  }
}

async function inbound(m, contacts) {
  const phone = normalizePhone(m.from);
  if (!phone || !m.id) return false;
  const { body, media } = describe(m);
  return tx(async (client) => {
    // Deduplicação: a mensagem é reservada primeiro pelo wa_message_id (índice único).
    const ins = await client.query(
      `INSERT INTO whatsapp_messages (direction, wa_message_id, phone_digits, body, status, raw, message_type) VALUES ('entrada',$1,$2,$3,'recebido',$4,$5)
       ON CONFLICT (wa_message_id) DO NOTHING RETURNING id`, [m.id, phone, body, JSON.stringify(m), m.type || 'text']);
    if (!ins.rowCount) return false;
    const msgId = ins.rows[0].id;
    // Cliente: pelo telefone; cria automaticamente quando não existe.
    let cust = (await client.query('SELECT id, name FROM customers WHERE phone_digits = $1 ORDER BY id LIMIT 1', [phone])).rows[0];
    let createdCustomer = false;
    if (!cust) {
      const name = contacts.get(phone) || `WhatsApp ${phone.slice(-4)}`;
      cust = (await client.query(`INSERT INTO customers (name, phone, phone_digits, source, tags) VALUES ($1,$2,$3,'WhatsApp','{}') RETURNING id, name`, [name, '+' + phone, phone])).rows[0];
      createdCustomer = true;
    }
    // Atendimento: o aberto mais recente do cliente; senão abre um novo na fila.
    let ticket = (await client.query(`SELECT * FROM tickets WHERE customer_id = $1 AND status NOT IN ('resolvido','cancelado') ORDER BY opened_at DESC LIMIT 1 FOR UPDATE`, [cust.id])).rows[0];
    let createdTicket = false;
    if (!ticket) {
      const protocol = await nextProtocol(client);
      const subject = body.replace(/\s+/g, ' ').slice(0, 80) || 'Mensagem pelo WhatsApp';
      ticket = (await client.query(`INSERT INTO tickets (protocol, customer_id, subject, channel, priority, status) VALUES ($1,$2,$3,'WhatsApp','normal','aguardando') RETURNING *`, [protocol, cust.id, subject])).rows[0];
      await client.query(`INSERT INTO ticket_events (ticket_id, kind, body, payload) VALUES ($1,'system','Atendimento aberto automaticamente por mensagem recebida no WhatsApp',$2)`, [ticket.id, JSON.stringify({ action: 'created', channel: 'WhatsApp', via: 'whatsapp_api' })]);
      createdTicket = true;
    }
    const at = m.timestamp ? new Date(Number(m.timestamp) * 1000) : new Date();
    const ev = await client.query(
      `INSERT INTO ticket_events (ticket_id, kind, direction, channel, body, payload, created_at) VALUES ($1,'interaction','entrada','WhatsApp',$2,$3,$4) RETURNING id`,
      [ticket.id, body, JSON.stringify({ via: 'whatsapp_api', wa_message_id: m.id, type: m.type, media: media || null }), at]);
    if (media && media.id) {
      await client.query(`INSERT INTO ticket_attachments (ticket_id, event_id, name, mime, size, wa_media_id) VALUES ($1,$2,$3,$4,0,$5)`, [ticket.id, ev.rows[0].id, media.name, media.mime || 'application/octet-stream', media.id]);
    }
    await client.query(`UPDATE whatsapp_messages SET customer_id = $1, ticket_id = $2, ticket_event_id = $3 WHERE id = $4`, [cust.id, ticket.id, ev.rows[0].id, msgId]);
    // Se o atendimento estava aguardando o cliente, volta para "em atendimento".
    const newStatus = ticket.status === 'aguardando_cliente' ? 'em_atendimento' : ticket.status;
    // O horário de chegada no CRM (now()) é usado para prazos; o carimbo da Meta fica no evento da linha do tempo.
    await client.query(`UPDATE tickets SET last_message_at = now(), last_message_preview = left($2, 160), last_message_direction = 'entrada', last_customer_message_at = now(),
      unread_count = unread_count + 1, status = $3, version = version + 1, updated_at = now() WHERE id = $1`, [ticket.id, body, newStatus]);
    if (newStatus !== ticket.status) {
      await client.query(`INSERT INTO ticket_events (ticket_id, kind, body, payload) VALUES ($1,'system','Cliente respondeu: status alterado de Aguardando cliente para Em atendimento',$2)`, [ticket.id, JSON.stringify({ action: 'status', from: ticket.status, to: newStatus })]);
    }
    setImmediate(async () => {
      const automations = require('./automations');
      await automations.stopFollowUps('ticket_id = $1', [ticket.id], 'Cliente respondeu');
      await automations.trigger('ticket_customer_replied', 'ticket', ticket.id, { dedupeKey: `reply:${m.id}` });
      if (createdTicket) await automations.trigger('ticket_created', 'ticket', ticket.id);
      const { notify } = require('./notify');
      if (ticket.assignee_id) await notify(ticket.assignee_id, 'Nova mensagem no WhatsApp', `${cust.name}: ${body.slice(0, 80)}`, `#/atendimentos/${ticket.id}`);
    });
    broadcast('whatsapp_message', { customer_id: cust.id, ticket_id: ticket.id, phone, created_customer: createdCustomer, created_ticket: createdTicket });
    broadcast('tickets_changed', { id: ticket.id, action: 'message' });
    return true;
  });
}

async function statusUpdate(s) {
  if (!s.id || !s.status) return false;
  const status = STATUS_PT[s.status] || s.status;
  const err = s.errors?.[0] ? `${s.errors[0].code}: ${s.errors[0].title || s.errors[0].message || ''}` : null;
  const at = s.timestamp ? new Date(Number(s.timestamp) * 1000) : new Date();
  // Só avança na ordem enviado → entregue → lido; um evento repetido ou atrasado não regride o status.
  const rank = { enviado: 1, entregue: 2, lido: 3, falhou: 9 };
  const { rows } = await query(`SELECT id, ticket_id, ticket_event_id, status FROM whatsapp_messages WHERE wa_message_id = $1`, [s.id]);
  const m = rows[0];
  if (!m) return false;
  if ((rank[status] || 0) <= (rank[m.status] || 0) && status !== 'falhou') return false;
  await query('UPDATE whatsapp_messages SET status = $1, status_at = $2, error = $3 WHERE id = $4', [status, at, err, m.id]);
  if (m.ticket_event_id) await query(`UPDATE ticket_events SET payload = payload || $1::jsonb WHERE id = $2`, [JSON.stringify({ status, status_at: at, error: err }), m.ticket_event_id]);
  if (status === 'falhou') await recordError(`Envio ${s.id} falhou: ${err || 'sem detalhe'}`);
  broadcast('tickets_changed', { id: m.ticket_id, action: 'status' });
  return true;
}

// Baixa uma mídia recebida (proxy autenticado) — só funciona com a integração conectada.
async function fetchMedia(mediaId) {
  if (!wa.configured) throw new HttpError(503, 'WhatsApp não está conectado.');
  const meta = await fetch(`${GRAPH}/${mediaId}`, { headers: { Authorization: `Bearer ${wa.token}` } });
  const info = await meta.json().catch(() => ({}));
  if (!meta.ok || !info.url) throw new HttpError(502, `Não foi possível obter a mídia: ${info.error?.message || meta.status}`);
  const file = await fetch(info.url, { headers: { Authorization: `Bearer ${wa.token}` } });
  if (!file.ok) throw new HttpError(502, 'Falha ao baixar a mídia do WhatsApp.');
  return { mime: info.mime_type || 'application/octet-stream', buffer: Buffer.from(await file.arrayBuffer()) };
}

module.exports = { state, sendText, processWebhook, windowOpen, fetchMedia, STATUS_PT };
