'use strict';
// Caixa de entrada (estilo Kommo): conversas de WhatsApp atendidas dentro do CRM.
const express = require('express');
const { z } = require('zod');
const { query } = require('../db');
const { validate } = require('../middleware/validate');
const { requireAuth, isManager } = require('../middleware/auth');
const { badRequest, notFound, forbidden, conflict } = require('../lib/errors');
const { audit } = require('../lib/audit');
const { broadcast } = require('../lib/realtime');
const { notify } = require('../lib/notify');
const { normalizePhone } = require('../lib/util');
const { preview } = require('../lib/inbox');
const whatsapp = require('../lib/whatsapp');
const waweb = require('../lib/waweb');
const { brPhoneVariants } = require('../lib/util');

const router = express.Router();
router.use(requireAuth);

// A Meta só aceita mensagens livres até 24h após a última mensagem do cliente; depois, só modelos aprovados.
const WINDOW_MS = 24 * 3600 * 1000;
const windowInfo = (c) => {
  // Conexão por QR Code (WhatsApp Web) não tem essa regra
  if (c.channel_type === 'whatsapp_web') return { window_open: true, window_expires_at: null };
  const expires = c.last_inbound_at ? new Date(new Date(c.last_inbound_at).getTime() + WINDOW_MS) : null;
  return { window_open: Boolean(expires && expires > new Date()), window_expires_at: expires };
};

// Atendente: conversas atribuídas a ele e as sem responsável (fila compartilhada).
function scopeSql(user, params) {
  if (isManager(user)) return 'TRUE';
  params.push(user.id);
  return `(c.assignee_id = $${params.length} OR c.assignee_id IS NULL)`;
}

const SELECT = `SELECT c.*, ch.name AS channel_name, ch.display_phone AS channel_phone, ch.status AS channel_status, ch.type AS channel_type,
    u.name AS assignee_name, cu.name AS customer_name, o.title AS opportunity_title, o.value AS opportunity_value,
    o.stage_id, s.name AS stage_name, s.kind AS stage_kind
  FROM conversations c JOIN channels ch ON ch.id = c.channel_id
  LEFT JOIN users u ON u.id = c.assignee_id LEFT JOIN customers cu ON cu.id = c.customer_id
  LEFT JOIN opportunities o ON o.id = c.opportunity_id LEFT JOIN pipeline_stages s ON s.id = o.stage_id`;

async function loadConversation(req, id) {
  const params = [Number(id)];
  const scope = scopeSql(req.user, params);
  const c = (await query(`${SELECT} WHERE c.id = $1 AND ${scope}`, params)).rows[0];
  if (!c) throw notFound('Conversa não encontrada ou fora do seu escopo.');
  return c;
}

async function loadChannel(conv) {
  const ch = (await query('SELECT * FROM channels WHERE id = $1', [conv.channel_id])).rows[0];
  if (!ch || ch.status !== 'connected')
    throw conflict('O canal de WhatsApp desta conversa está desconectado. Reconecte em Configurações › WhatsApp.');
  return ch;
}

router.get('/summary', async (req, res, next) => {
  try {
    const params = [];
    const scope = scopeSql(req.user, params);
    const r = (
      await query(
        `SELECT count(*) FILTER (WHERE c.unread_count > 0)::int AS unread,
                count(*) FILTER (WHERE c.assignee_id IS NULL)::int AS unassigned
         FROM conversations c WHERE c.status = 'open' AND ${scope}`,
        params,
      )
    ).rows[0];
    res.json(r);
  } catch (err) {
    next(err);
  }
});

router.get('/conversations', async (req, res, next) => {
  try {
    const params = [];
    const where = [scopeSql(req.user, params)];
    const status = req.query.status || 'open';
    if (status !== 'all') {
      params.push(status === 'closed' ? 'closed' : 'open');
      where.push(`c.status = $${params.length}`);
    }
    if (req.query.filter === 'mine') {
      params.push(req.user.id);
      where.push(`c.assignee_id = $${params.length}`);
    } else if (req.query.filter === 'unassigned') where.push('c.assignee_id IS NULL');
    else if (req.query.filter === 'unread') where.push('c.unread_count > 0');
    if (req.query.customer_id) {
      params.push(Number(req.query.customer_id));
      where.push(`c.customer_id = $${params.length}`);
    }
    if (req.query.q) {
      params.push(`%${String(req.query.q).trim()}%`);
      where.push(
        `(c.contact_name ILIKE $${params.length} OR cu.name ILIKE $${params.length} OR c.contact_phone LIKE $${params.length})`,
      );
    }
    const { rows } = await query(
      `${SELECT} WHERE ${where.join(' AND ')} ORDER BY c.last_message_at DESC NULLS LAST, c.id DESC LIMIT 200`,
      params,
    );
    res.json({ conversations: rows.map((c) => ({ ...c, ...windowInfo(c) })) });
  } catch (err) {
    next(err);
  }
});

// Inicia (ou retoma) uma conversa com um cliente cadastrado. A primeira mensagem precisa ser um modelo.
router.post(
  '/conversations',
  validate(z.object({ customer_id: z.number().int().positive(), channel_id: z.number().int().positive().optional() })),
  async (req, res, next) => {
    try {
      const cust = (await query('SELECT id, name, phone_digits FROM customers WHERE id = $1', [req.data.customer_id]))
        .rows[0];
      if (!cust) return next(notFound('Cliente não encontrado.'));
      const phone = normalizePhone(cust.phone_digits);
      if (!phone) return next(badRequest('Cadastre o telefone (com DDD) do cliente para conversar pelo WhatsApp.'));
      const channel = (
        await query(
          `SELECT * FROM channels WHERE status = 'connected' AND ($1::int IS NULL OR id = $1) ORDER BY created_at LIMIT 1`,
          [req.data.channel_id || null],
        )
      ).rows[0];
      if (!channel) return next(conflict('Nenhum WhatsApp conectado. Conecte um número em Configurações › WhatsApp.'));
      let contact = { phone, jid: null };
      if (channel.type === 'whatsapp_web') {
        contact = await waweb.resolveJid(channel, brPhoneVariants(phone));
        if (!contact) return next(badRequest('Este número não tem WhatsApp.'));
      }
      const conv = (
        await query(
          `INSERT INTO conversations (channel_id, customer_id, contact_phone, contact_name, contact_jid, assignee_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (company_id, channel_id, contact_phone)
           DO UPDATE SET customer_id = COALESCE(conversations.customer_id, EXCLUDED.customer_id), updated_at = now()
         RETURNING id`,
          [channel.id, cust.id, contact.phone, cust.name, contact.jid, req.user.id],
        )
      ).rows[0];
      broadcast('inbox_changed', { conversation_id: conv.id });
      res.status(201).json({ conversation: await loadConversation(req, conv.id) });
    } catch (err) {
      next(err);
    }
  },
);

router.get('/conversations/:id', async (req, res, next) => {
  try {
    const c = await loadConversation(req, req.params.id);
    const { rows } = await query(
      `SELECT * FROM (
         SELECT m.id, m.direction, m.type, m.body, m.media IS NOT NULL AS has_media, m.media->>'mime_type' AS mime_type,
                m.media->>'filename' AS filename, m.status, m.error, m.created_at, u.name AS sender_name
         FROM messages m LEFT JOIN users u ON u.id = m.sender_id
         WHERE m.conversation_id = $1 ORDER BY m.created_at DESC, m.id DESC LIMIT 300) x
       ORDER BY created_at, id`,
      [c.id],
    );
    res.json({ conversation: { ...c, ...windowInfo(c) }, messages: rows });
  } catch (err) {
    next(err);
  }
});

router.post('/conversations/:id/read', async (req, res, next) => {
  try {
    const c = await loadConversation(req, req.params.id);
    await query('UPDATE conversations SET unread_count = 0 WHERE id = $1', [c.id]);
    broadcast('inbox_changed', { conversation_id: c.id }, [req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Registra a mensagem como "pendente", envia pela API e atualiza o resultado.
async function sendOutgoing(req, conv, { type, body, send }) {
  if (req.user.role === 'atendente' && !conv.assignee_id) {
    // Quem responde primeiro assume a conversa (evita duas pessoas respondendo o mesmo cliente)
    await query('UPDATE conversations SET assignee_id = $2 WHERE id = $1 AND assignee_id IS NULL', [
      conv.id,
      req.user.id,
    ]);
  }
  const msg = (
    await query(
      `INSERT INTO messages (conversation_id, direction, type, body, status, sender_id)
       VALUES ($1, 'out', $2, $3, 'pending', $4) RETURNING id`,
      [conv.id, type, body, req.user.id],
    )
  ).rows[0];
  let waId;
  try {
    waId = await send();
  } catch (err) {
    await query(`UPDATE messages SET status = 'failed', error = $2 WHERE id = $1`, [msg.id, err.message]);
    broadcast('inbox_changed', { conversation_id: conv.id });
    throw err;
  }
  await query(`UPDATE messages SET status = 'sent', wa_message_id = $2 WHERE id = $1`, [msg.id, waId]);
  await query(
    `UPDATE conversations SET last_message_at = now(), last_message_preview = $2, unread_count = 0,
       status = 'open', updated_at = now() WHERE id = $1`,
    [conv.id, preview(type, body)],
  );
  broadcast('inbox_changed', { conversation_id: conv.id });
  return msg.id;
}

router.post(
  '/conversations/:id/messages',
  validate(z.object({ body: z.string().trim().min(1).max(4096) })),
  async (req, res, next) => {
    try {
      const c = await loadConversation(req, req.params.id);
      const channel = await loadChannel(c);
      if (!windowInfo(c).window_open) {
        return next(
          conflict(
            'Passaram mais de 24 horas desde a última mensagem do cliente. Pela regra do WhatsApp, envie um modelo aprovado para retomar a conversa.',
            { requires_template: true },
          ),
        );
      }
      const id = await sendOutgoing(req, c, {
        type: 'text',
        body: req.data.body,
        send: () =>
          channel.type === 'whatsapp_web'
            ? waweb.sendText(channel, c.contact_jid || `${c.contact_phone}@s.whatsapp.net`, req.data.body)
            : whatsapp.sendText(channel, c.contact_phone, req.data.body),
      });
      res.status(201).json({ id, message: 'Mensagem enviada.' });
    } catch (err) {
      next(err);
    }
  },
);

router.get('/conversations/:id/templates', async (req, res, next) => {
  try {
    const c = await loadConversation(req, req.params.id);
    const channel = await loadChannel(c);
    if (channel.type === 'whatsapp_web')
      return res.json({ templates: [], waba_configured: false, not_applicable: true });
    const templates = await whatsapp.listTemplates(channel);
    res.json({
      templates: templates.map((t) => {
        const bodyText = (t.components || []).find((x) => x.type === 'BODY')?.text || '';
        return {
          name: t.name,
          language: t.language,
          category: t.category,
          body: bodyText,
          params: (bodyText.match(/\{\{\d+\}\}/g) || []).length,
        };
      }),
      waba_configured: Boolean(channel.waba_id),
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/conversations/:id/template',
  validate(
    z.object({
      name: z
        .string()
        .trim()
        .regex(/^[a-z0-9_]{1,512}$/, 'Nome de modelo inválido.'),
      language: z.string().trim().min(2).max(10),
      params: z.array(z.string().trim().min(1).max(1000)).max(20).default([]),
      preview: z.string().max(4096).optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      const c = await loadConversation(req, req.params.id);
      const channel = await loadChannel(c);
      if (channel.type === 'whatsapp_web')
        return next(badRequest('Modelos de mensagem só existem na API oficial do WhatsApp.'));
      const d = req.data;
      const id = await sendOutgoing(req, c, {
        type: 'template',
        body: d.preview || `[Modelo: ${d.name}]`,
        send: () => whatsapp.sendTemplate(channel, c.contact_phone, d),
      });
      res.status(201).json({ id, message: 'Modelo enviado.' });
    } catch (err) {
      next(err);
    }
  },
);

// Anotação interna: visível só para a equipe, nunca enviada ao cliente.
router.post(
  '/conversations/:id/notes',
  validate(z.object({ body: z.string().trim().min(1).max(4000) })),
  async (req, res, next) => {
    try {
      const c = await loadConversation(req, req.params.id);
      const { rows } = await query(
        `INSERT INTO messages (conversation_id, direction, type, body, status, sender_id)
         VALUES ($1, 'note', 'note', $2, 'note', $3) RETURNING id`,
        [c.id, req.data.body, req.user.id],
      );
      broadcast('inbox_changed', { conversation_id: c.id });
      res.status(201).json({ id: rows[0].id, message: 'Anotação registrada.' });
    } catch (err) {
      next(err);
    }
  },
);

router.put(
  '/conversations/:id/assign',
  validate(z.object({ assignee_id: z.number().int().positive().nullable() })),
  async (req, res, next) => {
    try {
      const c = await loadConversation(req, req.params.id);
      const to = req.data.assignee_id;
      if (req.user.role === 'atendente' && to !== req.user.id && !(to === null && c.assignee_id === req.user.id))
        return next(forbidden('Atendentes só podem assumir a conversa ou devolvê-la para a fila.'));
      if (to) {
        const u = (await query('SELECT id FROM users WHERE id = $1 AND active', [to])).rows[0];
        if (!u) return next(badRequest('Responsável inválido.'));
      }
      await query('UPDATE conversations SET assignee_id = $2, updated_at = now() WHERE id = $1', [c.id, to]);
      if (to && to !== req.user.id)
        await notify(to, 'Conversa atribuída a você', c.contact_name || `+${c.contact_phone}`, `#/conversas/${c.id}`);
      await audit(req, 'conversation_assign', 'conversation', c.id, { from: c.assignee_id, to });
      broadcast('inbox_changed', { conversation_id: c.id });
      res.json({ ok: true, message: to ? 'Responsável atualizado.' : 'Conversa devolvida para a fila.' });
    } catch (err) {
      next(err);
    }
  },
);

for (const [action, status, msg] of [
  ['close', 'closed', 'Conversa encerrada.'],
  ['reopen', 'open', 'Conversa reaberta.'],
]) {
  router.post(`/conversations/:id/${action}`, async (req, res, next) => {
    try {
      const c = await loadConversation(req, req.params.id);
      await query('UPDATE conversations SET status = $2, unread_count = 0, updated_at = now() WHERE id = $1', [
        c.id,
        status,
      ]);
      await query(
        `INSERT INTO messages (conversation_id, direction, type, body, status, sender_id) VALUES ($1,'note','system',$2,'note',$3)`,
        [c.id, status === 'closed' ? 'Conversa encerrada' : 'Conversa reaberta', req.user.id],
      );
      broadcast('inbox_changed', { conversation_id: c.id });
      res.json({ ok: true, message: msg });
    } catch (err) {
      next(err);
    }
  });
}

// Mídia recebida (imagem, áudio, documento...): baixada da Meta sob demanda, sem guardar no servidor.
const SAFE_INLINE = /^(image\/(jpeg|png|webp|gif)|audio\/[a-z0-9.+-]+|video\/(mp4|3gpp)|application\/pdf)$/;
router.get('/messages/:id/media', async (req, res, next) => {
  try {
    const m = (
      await query('SELECT id, conversation_id, media FROM messages WHERE id = $1 AND media IS NOT NULL', [
        Number(req.params.id),
      ])
    ).rows[0];
    if (!m) return next(notFound('Mídia não encontrada.'));
    const c = await loadConversation(req, m.conversation_id);
    const channel = (await query('SELECT * FROM channels WHERE id = $1', [c.channel_id])).rows[0];
    const file =
      channel.type === 'whatsapp_web'
        ? await waweb.fetchMedia(channel, m.media)
        : await whatsapp.fetchMedia(channel, m.media.id);
    const mime = String(file.mimeType || 'application/octet-stream')
      .split(';')[0]
      .trim();
    // O arquivo vem do cliente: só formatos seguros abrem no navegador; o resto (HTML, SVG...) é baixado.
    const inline = SAFE_INLINE.test(mime);
    const name = m.media.filename || `arquivo-${m.id}`;
    res.setHeader('Content-Type', inline ? mime : 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(name)}`,
    );
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(file.body);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
