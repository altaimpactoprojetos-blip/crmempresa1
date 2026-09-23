'use strict';
// Canais de atendimento conectados pela empresa: WhatsApp (API oficial ou QR Code), Instagram Direct e Messenger.
const express = require('express');
const { z } = require('zod');
const { query } = require('../db');
const config = require('../config');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { notFound, conflict, badRequest } = require('../lib/errors');
const { audit } = require('../lib/audit');
const { encrypt, randomToken } = require('../lib/crypto');
const whatsapp = require('../lib/whatsapp');
const waweb = require('../lib/waweb');
const meta = require('../lib/meta');

const router = express.Router();
router.use(requireAuth);

const PUBLIC_FIELDS = `id, type, name, phone_number_id, waba_id, page_id, ig_account_id, display_phone, verified_name, status, last_error,
  webhook_key, verify_token, created_at, updated_at, (app_secret_enc IS NOT NULL) AS has_app_secret`;

// Segredos nunca saem do servidor; dados do webhook só para administradores.
function present(row, user) {
  const out = {
    id: row.id,
    type: row.type,
    name: row.name,
    display_phone: row.display_phone,
    verified_name: row.verified_name,
    status: row.status,
    last_error: row.last_error,
  };
  if (user.role === 'admin' && row.type === 'whatsapp') {
    Object.assign(out, {
      phone_number_id: row.phone_number_id,
      waba_id: row.waba_id,
      has_app_secret: row.has_app_secret,
      webhook_url: `${config.appUrl}/api/webhooks/whatsapp/${row.webhook_key}`,
      verify_token: row.verify_token,
      created_at: row.created_at,
    });
  }
  if (user.role === 'admin' && meta.SOCIAL_TYPES.includes(row.type)) {
    Object.assign(out, {
      page_id: row.page_id,
      ig_account_id: row.ig_account_id,
      has_app_secret: row.has_app_secret,
      webhook_url: `${config.appUrl}/api/webhooks/meta/${row.webhook_key}`,
      verify_token: row.verify_token,
      created_at: row.created_at,
    });
  }
  return out;
}

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(`SELECT ${PUBLIC_FIELDS} FROM channels ORDER BY created_at`);
    res.json({ channels: rows.map((r) => present(r, req.user)) });
  } catch (err) {
    next(err);
  }
});

const channelSchema = z.object({
  name: z.string().trim().min(1).max(80),
  access_token: z.string().trim().min(20, 'Token inválido.').max(1000),
  phone_number_id: z
    .string()
    .trim()
    .regex(/^\d{5,30}$/, 'Informe o identificador numérico do número (Phone number ID).'),
  waba_id: z
    .string()
    .trim()
    .regex(/^\d{5,30}$/, 'Informe o identificador numérico da conta (WhatsApp Business Account ID).')
    .nullable()
    .optional(),
  app_secret: z.string().trim().min(10).max(200).nullable().optional(),
});

router.post('/', requireRole('admin'), validate(channelSchema), async (req, res, next) => {
  try {
    const d = req.data;
    const info = await whatsapp.getPhoneNumber(d.access_token, d.phone_number_id);
    const { rows } = await query(
      `INSERT INTO channels (name, phone_number_id, waba_id, display_phone, verified_name, access_token_enc,
         app_secret_enc, webhook_key, verify_token, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (phone_number_id) DO NOTHING RETURNING ${PUBLIC_FIELDS}`,
      [
        d.name,
        d.phone_number_id,
        d.waba_id || null,
        info.display_phone_number || null,
        info.verified_name || null,
        encrypt(d.access_token),
        encrypt(d.app_secret),
        randomToken(24),
        randomToken(18),
        req.user.id,
      ],
    );
    if (!rows[0]) return next(conflict('Este número de WhatsApp já está conectado ao CRM.'));
    await audit(req, 'channel_connect', 'channel', rows[0].id, { phone: rows[0].display_phone });
    res.status(201).json({ channel: present(rows[0], req.user), message: 'WhatsApp conectado.' });
  } catch (err) {
    next(err);
  }
});

// Instagram Direct ou Facebook Messenger: página do Facebook + token de acesso da página.
const socialSchema = z.object({
  type: z.enum(['messenger', 'instagram']),
  name: z.string().trim().min(1).max(80),
  page_id: z
    .string()
    .trim()
    .regex(/^\d{5,30}$/, 'Informe o identificador numérico da página (Page ID).'),
  access_token: z.string().trim().min(20, 'Token inválido.').max(1000),
  app_secret: z.string().trim().min(10).max(200).nullable().optional(),
});

router.post('/social', requireRole('admin'), validate(socialSchema), async (req, res, next) => {
  try {
    const d = req.data;
    const page = await meta.getPage(d.type, d.access_token, d.page_id);
    const ig = page.instagram_business_account;
    if (d.type === 'instagram' && !ig)
      return next(
        badRequest(
          'Esta página não tem uma conta profissional do Instagram vinculada. Vincule no Instagram (Configurações › Conta › Página vinculada) e tente de novo.',
        ),
      );
    // Assina a página no aplicativo para o webhook receber as mensagens; se falhar, conecta e avisa.
    let warning = null;
    try {
      await meta.subscribePage(d.type, d.access_token, d.page_id);
    } catch (err) {
      warning = `Não foi possível ativar o recebimento automaticamente: ${err.message}`;
    }
    const { rows } = await query(
      `INSERT INTO channels (type, name, page_id, ig_account_id, display_phone, verified_name, access_token_enc,
         app_secret_enc, webhook_key, verify_token, last_error, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       ON CONFLICT (type, page_id) WHERE page_id IS NOT NULL DO NOTHING RETURNING ${PUBLIC_FIELDS}`,
      [
        d.type,
        d.name,
        d.page_id,
        d.type === 'instagram' ? ig.id : null,
        d.type === 'instagram' ? `@${ig.username}` : page.name || null,
        page.name || null,
        encrypt(d.access_token),
        encrypt(d.app_secret),
        randomToken(24),
        randomToken(18),
        warning,
        req.user.id,
      ],
    );
    if (!rows[0]) return next(conflict(`Esta página já está conectada ao CRM (${meta.SERVICE[d.type]}).`));
    await audit(req, 'channel_connect', 'channel', rows[0].id, { type: d.type, page_id: d.page_id });
    res.status(201).json({ channel: present(rows[0], req.user), message: `${meta.SERVICE[d.type]} conectado.` });
  } catch (err) {
    next(err);
  }
});

// WhatsApp por QR Code: cria a conexão e começa a gerar o QR (lido pelo celular em Aparelhos conectados).
router.post(
  '/web',
  requireRole('admin'),
  validate(z.object({ name: z.string().trim().min(1).max(80) })),
  async (req, res, next) => {
    try {
      const { rows } = await query(
        `INSERT INTO channels (type, name, status, created_by) VALUES ('whatsapp_web', $1, 'pending', $2)
         RETURNING *, (app_secret_enc IS NOT NULL) AS has_app_secret`,
        [req.data.name, req.user.id],
      );
      await waweb.start(rows[0]);
      await audit(req, 'channel_connect', 'channel', rows[0].id, { type: 'whatsapp_web' });
      res.status(201).json({ channel: present(rows[0], req.user), message: 'Leia o QR Code com o celular.' });
    } catch (err) {
      next(err);
    }
  },
);

async function loadWebChannel(id) {
  const ch = (await query(`SELECT * FROM channels WHERE id = $1 AND type = 'whatsapp_web'`, [Number(id)])).rows[0];
  if (!ch) throw notFound('Conexão não encontrada.');
  return ch;
}

// Situação da conexão por QR Code e o QR atual (imagem), para a tela acompanhar a leitura.
router.get('/:id/qr', requireRole('admin'), async (req, res, next) => {
  try {
    const ch = await loadWebChannel(req.params.id);
    const live = waweb.state(ch.id);
    res.json({ status: ch.status, connecting: live.status === 'pending', qr: live.qr, last_error: ch.last_error });
  } catch (err) {
    next(err);
  }
});

// Gera um novo QR Code (ou retoma a sessão salva) para uma conexão desconectada.
router.post('/:id/connect', requireRole('admin'), async (req, res, next) => {
  try {
    const ch = await loadWebChannel(req.params.id);
    await query(
      `UPDATE channels SET status = CASE WHEN status = 'connected' THEN status ELSE 'pending' END,
      last_error = NULL, updated_at = now() WHERE id = $1`,
      [ch.id],
    );
    await waweb.start({ ...ch, status: 'pending' });
    res.json({ ok: true, message: 'Leia o QR Code com o celular.' });
  } catch (err) {
    next(err);
  }
});

// Atualiza nome/credenciais ou reconecta um canal.
router.put(
  '/:id',
  requireRole('admin'),
  validate(channelSchema.partial().omit({ phone_number_id: true })),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const cur = (await query('SELECT * FROM channels WHERE id = $1', [id])).rows[0];
      if (!cur) return next(notFound('Canal não encontrado.'));
      if (cur.type === 'whatsapp_web' && Object.keys(req.data).some((k) => k !== 'name'))
        return next(badRequest('Conexões por QR Code não usam token: gere um novo QR Code para reconectar.'));
      const d = req.data;
      let info = {};
      if (d.access_token && meta.SOCIAL_TYPES.includes(cur.type)) {
        const page = await meta.getPage(cur.type, d.access_token, cur.page_id);
        info = { verified_name: page.name };
      } else if (d.access_token) info = await whatsapp.getPhoneNumber(d.access_token, cur.phone_number_id);
      const { rows } = await query(
        `UPDATE channels SET name = COALESCE($2, name), waba_id = CASE WHEN $3::boolean THEN $4 ELSE waba_id END,
           access_token_enc = COALESCE($5, access_token_enc),
           app_secret_enc = CASE WHEN $6::boolean THEN $7 ELSE app_secret_enc END,
           display_phone = COALESCE($8, display_phone), verified_name = COALESCE($9, verified_name),
           status = CASE WHEN $5 IS NOT NULL THEN 'connected' ELSE status END,
           last_error = CASE WHEN $5 IS NOT NULL THEN NULL ELSE last_error END, updated_at = now()
         WHERE id = $1 RETURNING ${PUBLIC_FIELDS}`,
        [
          id,
          d.name ?? null,
          d.waba_id !== undefined,
          d.waba_id || null,
          d.access_token ? encrypt(d.access_token) : null,
          d.app_secret !== undefined,
          encrypt(d.app_secret),
          info.display_phone_number || null,
          info.verified_name || null,
        ],
      );
      await audit(req, 'channel_update', 'channel', id, { fields: Object.keys(d) });
      res.json({ channel: present(rows[0], req.user), message: 'Canal atualizado.' });
    } catch (err) {
      next(err);
    }
  },
);

// Desconecta: o histórico de conversas é mantido; novas mensagens deixam de ser recebidas e enviadas.
router.post('/:id/disconnect', requireRole('admin'), async (req, res, next) => {
  try {
    const cur = (await query('SELECT * FROM channels WHERE id = $1', [Number(req.params.id)])).rows[0];
    if (cur && cur.type === 'whatsapp_web') await waweb.logout(cur); // desconecta o aparelho e apaga a sessão
    const { rows } = await query(
      `UPDATE channels SET status = 'disconnected', updated_at = now() WHERE id = $1 RETURNING ${PUBLIC_FIELDS}`,
      [Number(req.params.id)],
    );
    if (!rows[0]) return next(notFound('Canal não encontrado.'));
    await audit(req, 'channel_disconnect', 'channel', rows[0].id);
    res.json({ channel: present(rows[0], req.user), message: 'Canal desconectado.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
