'use strict';
const express = require('express');
const { z } = require('zod');
const { query, tx } = require('../db');
const config = require('../config');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { audit } = require('../lib/audit');
const mailer = require('../lib/mailer');
const { broadcast } = require('../lib/realtime');
const { badRequest, notFound } = require('../lib/errors');

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
    const stages = await query('SELECT * FROM pipeline_stages ORDER BY pipeline_id, position');
    const pipelines = await query('SELECT * FROM pipelines ORDER BY position, id');
    const quick = await query('SELECT id, title, shortcut, body, active FROM quick_replies WHERE active ORDER BY title');
    res.json({
      settings: rows[0],
      stages: stages.rows,
      pipelines: pipelines.rows,
      quick_replies: quick.rows,
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
  response_sla_minutes: z.number().int().min(1).max(10080).optional(),
  idle_opportunity_days: z.number().int().min(1).max(365).optional(),
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
        channels = COALESCE($10, channels), response_sla_minutes = COALESCE($11, response_sla_minutes), idle_opportunity_days = COALESCE($12, idle_opportunity_days), updated_at = now()
       WHERE id = 1 RETURNING *`,
      [d.name ?? null, d.logo_data !== undefined, d.logo_data ?? null, d.primary_color ?? null, d.accent_color ?? null,
        d.timezone ?? null, d.auto_distribution ?? null, d.demo_mode ?? null, d.contact_sources ?? null, d.channels ?? null, d.response_sla_minutes ?? null, d.idle_opportunity_days ?? null]);
    await audit(req, 'settings_update', 'company_settings', 1, { fields: Object.keys(d) });
    broadcast('settings_changed', {});
    res.json({ settings: rows[0], message: 'Configurações salvas.' });
  } catch (err) { next(err); }
});

// ===== Funis =====
router.get('/pipelines', requireAuth, async (_req, res, next) => {
  try {
    const pipelines = (await query('SELECT * FROM pipelines ORDER BY position, id')).rows;
    const stages = (await query('SELECT * FROM pipeline_stages ORDER BY pipeline_id, position')).rows;
    res.json({ pipelines: pipelines.map((p) => ({ ...p, stages: stages.filter((s) => s.pipeline_id === p.id) })) });
  } catch (err) { next(err); }
});

router.post('/pipelines', requireRole('admin'), validate(z.object({ name: z.string().trim().min(1).max(80) })), async (req, res, next) => {
  try {
    const out = await tx(async (client) => {
      const pos = (await client.query('SELECT COALESCE(max(position),0)+1 AS p FROM pipelines')).rows[0].p;
      const p = (await client.query('INSERT INTO pipelines (name, position) VALUES ($1,$2) RETURNING *', [req.data.name, pos])).rows[0];
      const defaults = [['Novo contato', 'open'], ['Qualificação', 'open'], ['Proposta', 'open'], ['Negociação', 'open'], ['Ganho', 'won'], ['Perdido', 'lost']];
      for (let i = 0; i < defaults.length; i++) await client.query('INSERT INTO pipeline_stages (pipeline_id, name, kind, position) VALUES ($1,$2,$3,$4)', [p.id, defaults[i][0], defaults[i][1], i + 1]);
      return p;
    });
    await audit(req, 'pipeline_create', 'pipeline', out.id, { name: out.name });
    res.status(201).json({ pipeline: out, message: 'Funil criado com etapas padrão.' });
  } catch (err) { next(err); }
});

router.put('/pipelines/:id', requireRole('admin'), validate(z.object({ name: z.string().trim().min(1).max(80).optional(), is_default: z.boolean().optional(), active: z.boolean().optional() })), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const out = await tx(async (client) => {
      const cur = (await client.query('SELECT * FROM pipelines WHERE id = $1', [id])).rows[0];
      if (!cur) throw notFound('Funil não encontrado.');
      if (req.data.active === false) {
        const others = await client.query('SELECT count(*)::int AS n FROM pipelines WHERE active AND id <> $1', [id]);
        if (!others.rows[0].n) throw badRequest('Mantenha ao menos um funil ativo.');
        if (cur.is_default) throw badRequest('Defina outro funil como padrão antes de desativar este.');
      }
      if (req.data.is_default) await client.query('UPDATE pipelines SET is_default = FALSE');
      const r = await client.query('UPDATE pipelines SET name = COALESCE($1, name), is_default = COALESCE($2, is_default), active = COALESCE($3, active) WHERE id = $4 RETURNING *', [req.data.name ?? null, req.data.is_default ?? null, req.data.active ?? null, id]);
      return r.rows[0];
    });
    await audit(req, 'pipeline_update', 'pipeline', id, { fields: Object.keys(req.data) });
    res.json({ pipeline: out, message: 'Funil atualizado.' });
  } catch (err) { next(err); }
});

// Etapas do funil (compatível: sem pipeline_id usa o funil padrão)
router.get('/stages', requireAuth, async (req, res, next) => {
  try {
    const params = [];
    let where = '';
    if (req.query.pipeline_id) { params.push(Number(req.query.pipeline_id)); where = 'WHERE pipeline_id = $1'; }
    const { rows } = await query(`SELECT * FROM pipeline_stages ${where} ORDER BY pipeline_id, position`, params);
    res.json({ stages: rows });
  } catch (err) { next(err); }
});

router.put('/stages', requireRole('admin'), validate(z.object({
  pipeline_id: z.number().int().positive().optional(),
  stages: z.array(z.object({
    id: z.number().int().positive().optional(),
    name: z.string().trim().min(1).max(60),
    kind: z.enum(['open', 'won', 'lost']),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
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
    const out = await tx(async (client) => {
      const pipelineId = req.data.pipeline_id || (await client.query('SELECT id FROM pipelines ORDER BY is_default DESC, position LIMIT 1')).rows[0].id;
      const existing = (await client.query('SELECT id FROM pipeline_stages WHERE pipeline_id = $1', [pipelineId])).rows.map((r) => r.id);
      const keep = new Set();
      let pos = 1;
      for (const s of list) {
        if (s.id) {
          if (!existing.includes(s.id)) throw badRequest('Etapa não pertence a este funil.');
          keep.add(s.id);
          await client.query('UPDATE pipeline_stages SET name=$1, kind=$2, active=$3, position=$4, color=$5 WHERE id=$6', [s.name, s.kind, s.active !== false, pos++, s.color ?? null, s.id]);
        } else {
          const r = await client.query('INSERT INTO pipeline_stages (pipeline_id, name, kind, active, position, color) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id', [pipelineId, s.name, s.kind, s.active !== false, pos++, s.color ?? null]);
          keep.add(r.rows[0].id);
        }
      }
      for (const id of existing) {
        if (keep.has(id)) continue;
        const used = await client.query('SELECT 1 FROM opportunities WHERE stage_id = $1 LIMIT 1', [id]);
        if (used.rowCount) await client.query('UPDATE pipeline_stages SET active = FALSE, position = 999 WHERE id = $1', [id]);
        else await client.query('DELETE FROM pipeline_stages WHERE id = $1', [id]);
      }
      return (await client.query('SELECT * FROM pipeline_stages WHERE pipeline_id = $1 ORDER BY position', [pipelineId])).rows;
    });
    await audit(req, 'stages_update', 'pipeline_stages', req.data.pipeline_id || null, { count: list.length });
    res.json({ stages: out, message: 'Etapas do funil atualizadas.' });
  } catch (err) { next(err); }
});

// Registro de auditoria (admin/supervisor)
router.get('/audit', requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const params = [limit];
    const where = [];
    if (req.query.user_id) { params.push(Number(req.query.user_id)); where.push(`a.user_id = $${params.length}`); }
    if (req.query.action) { params.push(`%${req.query.action}%`); where.push(`a.action ILIKE $${params.length}`); }
    const { rows } = await query(
      `SELECT a.*, u.name AS user_name FROM audit_log a LEFT JOIN users u ON u.id = a.user_id ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY a.created_at DESC LIMIT $1`, params);
    res.json({ entries: rows });
  } catch (err) { next(err); }
});

module.exports = router;
