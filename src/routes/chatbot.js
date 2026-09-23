'use strict';
// Configuração do robô de atendimento (uma por empresa).
const express = require('express');
const { z } = require('zod');
const { query } = require('../db');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { badRequest } = require('../lib/errors');
const { audit } = require('../lib/audit');
const { DEFAULTS } = require('../lib/chatbot');

const router = express.Router();
router.use(requireAuth, requireRole('admin', 'supervisor'));

router.get('/', async (_req, res, next) => {
  try {
    const row = (await query('SELECT enabled, config, updated_at FROM chatbot_settings')).rows[0];
    res.json({
      enabled: Boolean(row?.enabled),
      config: { ...DEFAULTS, ...(row?.config || {}) },
      updated_at: row?.updated_at || null,
    });
  } catch (err) {
    next(err);
  }
});

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora inválida (use HH:MM).');
const schema = z.object({
  enabled: z.boolean(),
  config: z.object({
    channels: z.array(z.number().int().positive()).max(50).default([]),
    welcome: z.string().trim().min(1, 'Escreva a mensagem de boas-vindas.').max(1000),
    invalid: z.string().trim().min(1).max(500),
    handoff: z.string().trim().min(1).max(500),
    options: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(60),
          reply: z.string().trim().max(1000).default(''),
          assign: z
            .union([z.literal('round_robin'), z.number().int().positive()])
            .nullable()
            .default(null),
          stage_id: z.number().int().positive().nullable().default(null),
          tag: z.string().trim().max(40).nullable().default(null),
        }),
      )
      .max(9, 'No máximo 9 opções no menu.'),
    hours: z.object({
      enabled: z.boolean(),
      days: z.record(z.enum(['0', '1', '2', '3', '4', '5', '6']), z.tuple([time, time]).nullable()).default({}),
      away: z.string().trim().min(1).max(1000),
    }),
  }),
});

router.put('/', requireRole('admin'), validate(schema), async (req, res, next) => {
  try {
    const { enabled, config } = req.data;
    for (const [day, span] of Object.entries(config.hours.days))
      if (span && span[0] >= span[1])
        return next(badRequest(`Horário inválido no dia ${day}: o fim deve ser depois do início.`));
    if (config.hours.enabled && !Object.values(config.hours.days).some(Boolean))
      return next(badRequest('Informe ao menos um dia com horário de atendimento.'));
    for (const o of config.options) {
      if (
        o.stage_id &&
        !(await query(`SELECT 1 FROM pipeline_stages WHERE id = $1 AND active AND kind = 'open'`, [o.stage_id]))
          .rowCount
      )
        return next(badRequest(`Etapa inválida na opção "${o.label}".`));
      if (
        typeof o.assign === 'number' &&
        !(await query('SELECT 1 FROM users WHERE id = $1 AND active', [o.assign])).rowCount
      )
        return next(badRequest(`Responsável inválido na opção "${o.label}".`));
    }
    await query(
      `INSERT INTO chatbot_settings (enabled, config, updated_by, updated_at) VALUES ($1, $2, $3, now())
       ON CONFLICT (company_id) DO UPDATE SET enabled = $1, config = $2, updated_by = $3, updated_at = now()`,
      [enabled, JSON.stringify(config), req.user.id],
    );
    await audit(req, 'chatbot_update', 'chatbot', null, { enabled, options: config.options.length });
    res.json({ ok: true, message: enabled ? 'Robô de atendimento ativado.' : 'Configuração salva (robô desligado).' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
