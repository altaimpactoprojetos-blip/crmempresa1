'use strict';
// Definição dos campos personalizados de clientes e oportunidades.
const express = require('express');
const { z } = require('zod');
const { query } = require('../db');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { badRequest, notFound, conflict } = require('../lib/errors');
const { audit } = require('../lib/audit');
const { TYPES, slugify } = require('../lib/customFields');

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const params = [];
    let where = 'active';
    if (['customer', 'opportunity'].includes(req.query.entity)) {
      params.push(req.query.entity);
      where += ' AND entity = $1';
    }
    const { rows } = await query(`SELECT * FROM custom_fields WHERE ${where} ORDER BY entity, position, id`, params);
    res.json({ fields: rows });
  } catch (err) {
    next(err);
  }
});

const schema = z.object({
  entity: z.enum(['customer', 'opportunity']),
  label: z.string().trim().min(1).max(60),
  type: z.enum(TYPES),
  options: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  required: z.boolean().default(false),
  position: z.number().int().min(0).max(1000).optional(),
});

router.post('/', requireRole('admin'), validate(schema), async (req, res, next) => {
  try {
    const d = req.data;
    if (d.type === 'select' && !d.options.length)
      return next(badRequest('Informe as opções da lista.', { fields: { options: 'Informe ao menos uma opção.' } }));
    const count = (await query('SELECT count(*)::int AS n FROM custom_fields WHERE entity = $1', [d.entity])).rows[0].n;
    if (count >= 50) return next(badRequest('Limite de 50 campos por tipo de cadastro.'));
    const key = slugify(d.label);
    const { rows } = await query(
      `INSERT INTO custom_fields (entity, key, label, type, options, required, position)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (company_id, entity, key) DO NOTHING RETURNING *`,
      [d.entity, key, d.label, d.type, d.type === 'select' ? d.options : [], d.required, d.position ?? count + 1],
    );
    if (!rows[0]) return next(conflict('Já existe um campo com este nome.'));
    await audit(req, 'custom_field_create', 'custom_field', rows[0].id, { entity: d.entity, key });
    res.status(201).json({ field: rows[0], message: 'Campo criado.' });
  } catch (err) {
    next(err);
  }
});

// A chave e o tipo não mudam (os valores já gravados continuam válidos).
router.put(
  '/:id',
  requireRole('admin'),
  validate(schema.pick({ label: true, options: true, required: true, position: true }).partial()),
  async (req, res, next) => {
    try {
      const d = req.data;
      const { rows } = await query(
        `UPDATE custom_fields SET label = COALESCE($2, label), options = CASE WHEN type = 'select' THEN COALESCE($3, options) ELSE options END,
           required = COALESCE($4, required), position = COALESCE($5, position) WHERE id = $1 AND active RETURNING *`,
        [Number(req.params.id), d.label ?? null, d.options ?? null, d.required ?? null, d.position ?? null],
      );
      if (!rows[0]) return next(notFound('Campo não encontrado.'));
      res.json({ field: rows[0], message: 'Campo atualizado.' });
    } catch (err) {
      next(err);
    }
  },
);

// Exclusão lógica: some dos formulários, mas os valores antigos continuam nos registros.
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const r = await query('UPDATE custom_fields SET active = FALSE WHERE id = $1 AND active', [Number(req.params.id)]);
    if (!r.rowCount) return next(notFound('Campo não encontrado.'));
    await audit(req, 'custom_field_delete', 'custom_field', Number(req.params.id));
    res.json({ ok: true, message: 'Campo removido dos formulários.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
