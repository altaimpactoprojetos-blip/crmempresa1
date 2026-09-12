'use strict';
// Regras de automação: gatilho → condição → ação, com histórico de execução.
const express = require('express');
const { z } = require('zod');
const { query } = require('../db');
const { validate } = require('../middleware/validate');
const { requireRole } = require('../middleware/auth');
const { notFound, badRequest } = require('../lib/errors');
const { audit } = require('../lib/audit');
const automations = require('../lib/automations');
const config = require('../config');

const router = express.Router();
router.use(requireRole('admin', 'supervisor'));

router.get('/meta', (_req, res) => res.json({ triggers: automations.TRIGGERS, actions: automations.ACTIONS, whatsapp_connected: config.whatsapp.configured }));

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(`SELECT r.*, u.name AS created_by_name,
      (SELECT count(*)::int FROM automation_runs x WHERE x.rule_id = r.id AND x.status = 'executada' AND x.created_at > now() - interval '7 days') AS runs_7d,
      (SELECT count(*)::int FROM automation_runs x WHERE x.rule_id = r.id AND x.status = 'falhou' AND x.created_at > now() - interval '7 days') AS failures_7d
      FROM automation_rules r LEFT JOIN users u ON u.id = r.created_by ORDER BY r.active DESC, r.id`);
    res.json({ rules: rows });
  } catch (err) { next(err); }
});

router.get('/runs', async (req, res, next) => {
  try {
    const params = [Math.min(Number(req.query.limit) || 100, 500)];
    let where = '';
    if (req.query.rule_id) { params.push(Number(req.query.rule_id)); where = `WHERE x.rule_id = $2`; }
    const { rows } = await query(`SELECT x.*, r.name AS rule_name,
      CASE WHEN x.entity = 'ticket' THEN (SELECT protocol FROM tickets t WHERE t.id = x.entity_id) ELSE (SELECT title FROM opportunities o WHERE o.id = x.entity_id) END AS entity_label
      FROM automation_runs x JOIN automation_rules r ON r.id = x.rule_id ${where} ORDER BY x.created_at DESC LIMIT $1`, params);
    res.json({ runs: rows });
  } catch (err) { next(err); }
});

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  trigger: z.string().refine((v) => Boolean(automations.TRIGGERS[v]), 'Gatilho inválido.'),
  conditions: z.record(z.any()).default({}),
  action: z.string().refine((v) => Boolean(automations.ACTIONS[v]), 'Ação inválida.'),
  action_params: z.record(z.any()).default({}),
  team: z.string().trim().max(60).nullable().optional(),
  active: z.boolean().optional(),
});

function check(d) {
  const t = automations.TRIGGERS[d.trigger];
  if (d.action === 'distribute' && t.entity !== 'ticket') throw badRequest('A distribuição em rodízio só se aplica a gatilhos de atendimento.');
  if (['set_priority', 'send_message'].includes(d.action) && t.entity !== 'ticket') throw badRequest('Esta ação só se aplica a gatilhos de atendimento.');
  if (d.action === 'send_message' && !config.whatsapp.configured) throw badRequest('Mensagens automáticas exigem um canal conectado. O WhatsApp está desconectado neste servidor.');
  if (d.action === 'create_task' && !d.action_params.title) throw badRequest('Informe o título da tarefa.', { fields: { 'action_params.title': 'Obrigatório.' } });
}

router.post('/', validate(schema), async (req, res, next) => {
  try {
    const d = req.data; check(d);
    const { rows } = await query('INSERT INTO automation_rules (name, trigger, conditions, action, action_params, team, active, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [d.name, d.trigger, JSON.stringify(d.conditions), d.action, JSON.stringify(d.action_params), d.team || null, d.active !== false, req.user.id]);
    await audit(req, 'automation_create', 'automation_rule', rows[0].id, { name: d.name, trigger: d.trigger, action: d.action });
    res.status(201).json({ rule: rows[0], message: 'Regra criada.' });
  } catch (err) { next(err); }
});

router.put('/:id', validate(schema.partial()), async (req, res, next) => {
  try {
    const cur = (await query('SELECT * FROM automation_rules WHERE id = $1', [Number(req.params.id)])).rows[0];
    if (!cur) return next(notFound('Regra não encontrada.'));
    const d = { ...cur, ...req.data, conditions: req.data.conditions ?? cur.conditions, action_params: req.data.action_params ?? cur.action_params };
    check(d);
    const { rows } = await query(`UPDATE automation_rules SET name=$1, trigger=$2, conditions=$3, action=$4, action_params=$5, team=$6, active=$7, updated_at=now() WHERE id=$8 RETURNING *`,
      [d.name, d.trigger, JSON.stringify(d.conditions), d.action, JSON.stringify(d.action_params), d.team || null, d.active, cur.id]);
    await audit(req, 'automation_update', 'automation_rule', cur.id, { fields: Object.keys(req.data) });
    res.json({ rule: rows[0], message: req.data.active === false ? 'Regra pausada.' : req.data.active === true ? 'Regra ativada.' : 'Regra atualizada.' });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM automation_rules WHERE id = $1', [Number(req.params.id)]);
    if (!rowCount) return next(notFound('Regra não encontrada.'));
    await audit(req, 'automation_delete', 'automation_rule', Number(req.params.id));
    res.json({ ok: true, message: 'Regra excluída.' });
  } catch (err) { next(err); }
});

// Executa agora os gatilhos agendados (útil para testes e para o administrador verificar uma regra).
router.post('/run-scheduled', async (req, res, next) => {
  try { await automations.runScheduled(); await audit(req, 'automation_run_now', 'automation_rule', null); res.json({ ok: true, message: 'Verificação executada.' }); } catch (err) { next(err); }
});

module.exports = router;
