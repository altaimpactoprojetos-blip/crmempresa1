'use strict';
const express = require('express');
const { z } = require('zod');
const { query } = require('../db');
const config = require('../config');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { audit } = require('../lib/audit');
const mailer = require('../lib/mailer');
const { broadcast } = require('../lib/realtime');
const { badRequest } = require('../lib/errors');

const router = express.Router();

// Identidade visual pública (necessária na tela de login)
router.get('/public', async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT name, logo_data, primary_color, accent_color, demo_mode FROM company_settings WHERE id = 1');
    res.json({ settings: rows[0] });
  } catch (err) { next(err); }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM company_settings WHERE id = 1');
    const stages = await query('SELECT * FROM pipeline_stages ORDER BY position');
    res.json({
      settings: rows[0],
      stages: stages.rows,
      integrations: {
        smtp: { configured: mailer.configured },
        whatsapp: { configured: config.whatsapp.configured, phone_number_id: config.whatsapp.configured ? config.whatsapp.phoneNumberId : null },
      },
    });
  } catch (err) { next(err); }
});

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use o formato #RRGGBB.');

router.put('/', requireRole('admin'), validate(z.object({
  name: z.string().trim().min(1).max(120).optional(),
  logo_data: z.string().max(400000, 'Logotipo muito grande (máx. ~300KB).').nullable().optional(),
  primary_color: color.optional(),
  accent_color: color.optional(),
  timezone: z.string().min(1).max(60).optional(),
  auto_distribution: z.boolean().optional(),
  demo_mode: z.boolean().optional(),
  contact_sources: z.array(z.string().trim().min(1).max(60)).min(1).max(30).optional(),
  channels: z.array(z.string().trim().min(1).max(60)).min(1).max(30).optional(),
})), async (req, res, next) => {
  try {
    const d = req.data;
    if (d.logo_data && !/^data:image\/(png|jpeg|svg\+xml|webp);base64,/.test(d.logo_data)) {
      return next(badRequest('Logotipo inválido. Envie PNG, JPEG, WEBP ou SVG.', { fields: { logo_data: 'Formato inválido.' } }));
    }
    const { rows } = await query(
      `UPDATE company_settings SET
        name = COALESCE($1, name), logo_data = CASE WHEN $2::boolean THEN $3 ELSE logo_data END,
        primary_color = COALESCE($4, primary_color), accent_color = COALESCE($5, accent_color),
        timezone = COALESCE($6, timezone), auto_distribution = COALESCE($7, auto_distribution),
        demo_mode = COALESCE($8, demo_mode), contact_sources = COALESCE($9, contact_sources),
        channels = COALESCE($10, channels), updated_at = now()
       WHERE id = 1 RETURNING *`,
      [d.name ?? null, d.logo_data !== undefined, d.logo_data ?? null, d.primary_color ?? null, d.accent_color ?? null,
        d.timezone ?? null, d.auto_distribution ?? null, d.demo_mode ?? null, d.contact_sources ?? null, d.channels ?? null]);
    await audit(req, 'settings_update', 'company_settings', 1, { fields: Object.keys(d) });
    broadcast('settings_changed', {});
    res.json({ settings: rows[0], message: 'Configurações salvas.' });
  } catch (err) { next(err); }
});

// Etapas do funil
router.get('/stages', requireAuth, async (_req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM pipeline_stages ORDER BY position');
    res.json({ stages: rows });
  } catch (err) { next(err); }
});

router.put('/stages', requireRole('admin'), validate(z.object({
  stages: z.array(z.object({
    id: z.number().int().positive().optional(),
    name: z.string().trim().min(1).max(60),
    kind: z.enum(['open', 'won', 'lost']),
    active: z.boolean().optional(),
  })).min(3).max(15),
})), async (req, res, next) => {
  try {
    const list = req.data.stages;
    const active = list.filter((s) => s.active !== false);
    if (active.filter((s) => s.kind === 'won').length !== 1 || active.filter((s) => s.kind === 'lost').length !== 1) {
      return next(badRequest('O funil precisa ter exatamente uma etapa "Ganho" e uma etapa "Perdido" ativas.'));
    }
    if (!active.some((s) => s.kind === 'open')) return next(badRequest('Inclua ao menos uma etapa aberta.'));
    const { tx } = require('../db');
    const out = await tx(async (client) => {
      const existing = (await client.query('SELECT id FROM pipeline_stages')).rows.map((r) => r.id);
      const keep = new Set();
      let pos = 1;
      for (const s of list) {
        if (s.id) {
          keep.add(s.id);
          await client.query('UPDATE pipeline_stages SET name=$1, kind=$2, active=$3, position=$4 WHERE id=$5',
            [s.name, s.kind, s.active !== false, pos++, s.id]);
        } else {
          const r = await client.query('INSERT INTO pipeline_stages (name, kind, active, position) VALUES ($1,$2,$3,$4) RETURNING id',
            [s.name, s.kind, s.active !== false, pos++]);
          keep.add(r.rows[0].id);
        }
      }
      for (const id of existing) {
        if (keep.has(id)) continue;
        const used = await client.query('SELECT 1 FROM opportunities WHERE stage_id = $1 LIMIT 1', [id]);
        if (used.rowCount) await client.query('UPDATE pipeline_stages SET active = FALSE, position = 999 WHERE id = $1', [id]);
        else await client.query('DELETE FROM pipeline_stages WHERE id = $1', [id]);
      }
      return (await client.query('SELECT * FROM pipeline_stages ORDER BY position')).rows;
    });
    await audit(req, 'stages_update', 'pipeline_stages', null, { count: list.length });
    res.json({ stages: out, message: 'Etapas do funil atualizadas.' });
  } catch (err) { next(err); }
});

// Registro de auditoria (admin/supervisor)
router.get('/audit', requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const { rows } = await query(
      `SELECT a.*, u.name AS user_name FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC LIMIT $1`, [limit]);
    res.json({ entries: rows });
  } catch (err) { next(err); }
});

module.exports = router;
