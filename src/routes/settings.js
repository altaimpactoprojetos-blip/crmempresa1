'use strict';
const express = require('express');
const { isValidTimezone } = require('../lib/timezone');
const { z } = require('zod');
const { query, tx } = require('../db');
const config = require('../config');
const { MODULES } = require('../lib/permissions');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { audit } = require('../lib/audit');
const mailer = require('../lib/mailer');
const { broadcast } = require('../lib/realtime');
const { badRequest, notFound } = require('../lib/errors');

const router = express.Router();

// Identidade visual: da empresa, para quem está logado; do produto, na tela de login e de cadastro.
router.get('/public', async (req, res, next) => {
  try {
    const product = { app_name: config.appName, allow_signup: config.allowSignup };
    if (!req.user) {
      return res.json({ settings: { name: config.appName, logo_data: null, demo_mode: false }, product });
    }
    const { rows } = await query(
      'SELECT name, logo_data, primary_color, accent_color, demo_mode FROM company_settings WHERE company_id = app_company_id()',
    );
    res.json({ settings: rows[0], product });
  } catch (err) {
    next(err);
  }
});

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM company_settings WHERE company_id = app_company_id()');
    const stages = await query(
      'SELECT s.* FROM pipeline_stages s JOIN pipelines p ON p.id = s.pipeline_id WHERE p.is_default ORDER BY s.position',
    );
    res.json({
      settings: rows[0],
      stages: stages.rows,
      integrations: { smtp: { configured: mailer.configured } },
    });
  } catch (err) {
    next(err);
  }
});

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use o formato #RRGGBB.');

router.put(
  '/',
  requireRole('admin'),
  validate(
    z.object({
      name: z.string().trim().min(1).max(120).optional(),
      logo_data: z.string().max(400000, 'Logotipo muito grande (máx. ~300KB).').nullable().optional(),
      primary_color: color.optional(),
      accent_color: color.optional(),
      timezone: z
        .string()
        .min(1)
        .max(60)
        .refine(isValidTimezone, 'Fuso horário inválido (use o formato IANA, ex.: America/Sao_Paulo).')
        .optional(),
      auto_distribution: z.boolean().optional(),
      inbox_auto_lead: z.boolean().optional(),
      demo_mode: z.boolean().optional(),
      contact_sources: z.array(z.string().trim().min(1).max(60)).min(1).max(30).optional(),
      channels: z.array(z.string().trim().min(1).max(60)).min(1).max(30).optional(),
    }),
  ),
  async (req, res, next) => {
    try {
      const d = req.data;
      if (d.logo_data && !/^data:image\/(png|jpeg|svg\+xml|webp);base64,/.test(d.logo_data)) {
        return next(
          badRequest('Logotipo inválido. Envie PNG, JPEG, WEBP ou SVG.', {
            fields: { logo_data: 'Formato inválido.' },
          }),
        );
      }
      const { rows } = await query(
        `UPDATE company_settings SET
        name = COALESCE($1, name), logo_data = CASE WHEN $2::boolean THEN $3 ELSE logo_data END,
        primary_color = COALESCE($4, primary_color), accent_color = COALESCE($5, accent_color),
        timezone = COALESCE($6, timezone), auto_distribution = COALESCE($7, auto_distribution),
        demo_mode = COALESCE($8, demo_mode), contact_sources = COALESCE($9, contact_sources),
        channels = COALESCE($10, channels), inbox_auto_lead = COALESCE($11, inbox_auto_lead), updated_at = now()
       WHERE company_id = app_company_id() RETURNING *`,
        [
          d.name ?? null,
          d.logo_data !== undefined,
          d.logo_data ?? null,
          d.primary_color ?? null,
          d.accent_color ?? null,
          d.timezone ?? null,
          d.auto_distribution ?? null,
          d.demo_mode ?? null,
          d.contact_sources ?? null,
          d.channels ?? null,
          d.inbox_auto_lead ?? null,
        ],
      );
      await audit(req, 'settings_update', 'company_settings', req.user.company_id, { fields: Object.keys(d) });
      broadcast('settings_changed', {});
      res.json({ settings: rows[0], message: 'Configurações salvas.' });
    } catch (err) {
      next(err);
    }
  },
);

// Etapas de um funil (padrão: o funil principal da empresa)
async function resolvePipeline(id, client) {
  const q = client ? client.query.bind(client) : query;
  const { rows } = await q(
    id ? 'SELECT * FROM pipelines WHERE id = $1' : 'SELECT * FROM pipelines WHERE is_default LIMIT 1',
    id ? [Number(id)] : [],
  );
  if (!rows[0]) throw notFound('Funil não encontrado.');
  return rows[0];
}

router.get('/stages', requireAuth, async (req, res, next) => {
  try {
    const pipeline = await resolvePipeline(req.query.pipeline_id);
    const { rows } = await query('SELECT * FROM pipeline_stages WHERE pipeline_id = $1 ORDER BY position', [
      pipeline.id,
    ]);
    res.json({ stages: rows, pipeline });
  } catch (err) {
    next(err);
  }
});

router.put(
  '/stages',
  requireRole('admin'),
  validate(
    z.object({
      pipeline_id: z.number().int().positive().optional(),
      stages: z
        .array(
          z.object({
            id: z.number().int().positive().optional(),
            name: z.string().trim().min(1).max(60),
            kind: z.enum(['open', 'won', 'lost']),
            active: z.boolean().optional(),
          }),
        )
        .min(3)
        .max(15),
    }),
  ),
  async (req, res, next) => {
    try {
      const list = req.data.stages;
      const active = list.filter((s) => s.active !== false);
      if (active.filter((s) => s.kind === 'won').length !== 1 || active.filter((s) => s.kind === 'lost').length !== 1) {
        return next(badRequest('O funil precisa ter exatamente uma etapa "Ganho" e uma etapa "Perdido" ativas.'));
      }
      if (!active.some((s) => s.kind === 'open')) return next(badRequest('Inclua ao menos uma etapa aberta.'));
      const out = await tx(async (client) => {
        const pipeline = await resolvePipeline(req.data.pipeline_id, client);
        const existing = (
          await client.query('SELECT id FROM pipeline_stages WHERE pipeline_id = $1', [pipeline.id])
        ).rows.map((r) => r.id);
        const keep = new Set();
        let pos = 1;
        for (const s of list) {
          if (s.id) {
            if (!existing.includes(s.id)) throw badRequest('Etapa não pertence a este funil.');
            keep.add(s.id);
            await client.query('UPDATE pipeline_stages SET name=$1, kind=$2, active=$3, position=$4 WHERE id=$5', [
              s.name,
              s.kind,
              s.active !== false,
              pos++,
              s.id,
            ]);
          } else {
            const r = await client.query(
              'INSERT INTO pipeline_stages (pipeline_id, name, kind, active, position) VALUES ($1,$2,$3,$4,$5) RETURNING id',
              [pipeline.id, s.name, s.kind, s.active !== false, pos++],
            );
            keep.add(r.rows[0].id);
          }
        }
        for (const id of existing) {
          if (keep.has(id)) continue;
          const used = await client.query('SELECT 1 FROM opportunities WHERE stage_id = $1 LIMIT 1', [id]);
          if (used.rowCount)
            await client.query('UPDATE pipeline_stages SET active = FALSE, position = 999 WHERE id = $1', [id]);
          else await client.query('DELETE FROM pipeline_stages WHERE id = $1', [id]);
        }
        return (
          await client.query('SELECT * FROM pipeline_stages WHERE pipeline_id = $1 ORDER BY position', [pipeline.id])
        ).rows;
      });
      await audit(req, 'stages_update', 'pipeline_stages', null, { count: list.length });
      res.json({ stages: out, message: 'Etapas do funil atualizadas.' });
    } catch (err) {
      next(err);
    }
  },
);

// Permissões por módulo (Gestor e Atendente)
router.get('/permissions', requireRole('admin'), async (_req, res, next) => {
  try {
    const row = (await query('SELECT permissions FROM company_settings WHERE company_id = app_company_id()')).rows[0];
    res.json({ modules: MODULES, permissions: row ? row.permissions : {} });
  } catch (err) {
    next(err);
  }
});

const moduleFlags = z.object(Object.fromEntries(Object.keys(MODULES).map((k) => [k, z.boolean()]))).partial();
router.put(
  '/permissions',
  requireRole('admin'),
  validate(z.object({ supervisor: moduleFlags, atendente: moduleFlags })),
  async (req, res, next) => {
    try {
      await query(
        'UPDATE company_settings SET permissions = $1, updated_at = now() WHERE company_id = app_company_id()',
        [JSON.stringify(req.data)],
      );
      await audit(req, 'permissions_update', 'company_settings', req.user.company_id, req.data);
      res.json({
        ok: true,
        message: 'Permissões atualizadas. Valem no próximo carregamento da página de cada pessoa.',
      });
    } catch (err) {
      next(err);
    }
  },
);

// Registro de auditoria (admin/supervisor)
router.get('/audit', requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 500);
    const { rows } = await query(
      `SELECT a.*, u.name AS user_name FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
       ORDER BY a.created_at DESC LIMIT $1`,
      [limit],
    );
    res.json({ entries: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
