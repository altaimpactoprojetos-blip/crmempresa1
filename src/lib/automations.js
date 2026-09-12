'use strict';
// Automações simples: gatilho → condição → ação. Regras ficam em automation_rules e cada execução
// em automation_runs (com chave de deduplicação para não repetir a mesma ação no mesmo estado).
const { query, tx, pool } = require('../db');
const { notify } = require('./notify');
const { broadcast } = require('./realtime');
const config = require('../config');

const TRIGGERS = {
  ticket_created: { label: 'Atendimento aberto', entity: 'ticket', scheduled: false, conditions: ['channel', 'priority', 'team'] },
  ticket_customer_replied: { label: 'Cliente respondeu', entity: 'ticket', scheduled: false, conditions: ['channel', 'team'] },
  ticket_response_overdue: { label: 'Prazo de resposta vencido', entity: 'ticket', scheduled: true, conditions: ['minutes', 'priority', 'team'] },
  ticket_follow_up_overdue: { label: 'Retorno agendado vencido', entity: 'ticket', scheduled: true, conditions: ['minutes', 'team'] },
  opportunity_stage_changed: { label: 'Oportunidade mudou de etapa', entity: 'opportunity', scheduled: false, conditions: ['stage_id', 'team'] },
  opportunity_idle: { label: 'Oportunidade parada', entity: 'opportunity', scheduled: true, conditions: ['days', 'pipeline_id', 'team'] },
};
const ACTIONS = {
  create_task: { label: 'Criar tarefa', params: ['title', 'due_in_days', 'priority', 'assignee'] },
  notify: { label: 'Notificar', params: ['to', 'title', 'body'] },
  distribute: { label: 'Distribuir em rodízio', params: [] },
  set_priority: { label: 'Alterar prioridade', params: ['priority'] },
  add_tag: { label: 'Adicionar etiqueta ao cliente', params: ['tag'] },
  send_message: { label: 'Enviar mensagem (canal conectado)', params: ['body'] },
};

async function activeRules(trigger) {
  const { rows } = await query('SELECT * FROM automation_rules WHERE active AND trigger = $1 ORDER BY id', [trigger]);
  return rows;
}

async function recordRun(rule, entity, entityId, status, details, dedupeKey) {
  try {
    const { rowCount } = await query(
      `INSERT INTO automation_runs (rule_id, entity, entity_id, status, details, dedupe_key) VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (rule_id, dedupe_key) WHERE dedupe_key IS NOT NULL DO NOTHING`,
      [rule.id, entity, entityId, status, details || null, dedupeKey || null]);
    if (rowCount && status === 'executada') await query('UPDATE automation_rules SET last_run_at = now(), runs_count = runs_count + 1 WHERE id = $1', [rule.id]);
    return rowCount > 0;
  } catch (e) { console.error('Falha ao registrar execução de automação:', e.message); return false; }
}

async function alreadyRan(rule, dedupeKey) {
  if (!dedupeKey) return false;
  const { rowCount } = await query('SELECT 1 FROM automation_runs WHERE rule_id = $1 AND dedupe_key = $2', [rule.id, dedupeKey]);
  return rowCount > 0;
}

// ---- Condições ----
function matches(rule, ctx) {
  const c = rule.conditions || {};
  const t = ctx.ticket, o = ctx.opportunity;
  if (c.channel && t && t.channel !== c.channel) return false;
  if (c.priority && t && t.priority !== c.priority) return false;
  if (c.stage_id && o && Number(c.stage_id) !== Number(o.stage_id)) return false;
  if (c.pipeline_id && o && Number(c.pipeline_id) !== Number(o.pipeline_id)) return false;
  if (rule.team) {
    const ownerTeam = ctx.ownerTeam;
    if (ownerTeam !== undefined && ownerTeam !== null && ownerTeam !== rule.team) return false;
  }
  return true;
}

// ---- Ações ----
async function resolveUsers(to, ctx) {
  if (to === 'owner') { const id = ctx.ticket ? ctx.ticket.assignee_id : ctx.opportunity ? ctx.opportunity.owner_id : null; return id ? [id] : []; }
  if (to === 'supervisors') return (await query(`SELECT id FROM users WHERE active AND role IN ('supervisor','admin')`)).rows.map((r) => r.id);
  if (to === 'admins') return (await query(`SELECT id FROM users WHERE active AND role = 'admin'`)).rows.map((r) => r.id);
  const n = Number(to); return n ? [n] : [];
}

function fill(text, ctx) {
  const t = ctx.ticket || {}, o = ctx.opportunity || {};
  return String(text || '')
    .replace(/\{protocolo\}/g, t.protocol || '').replace(/\{assunto\}/g, t.subject || '')
    .replace(/\{cliente\}/g, ctx.customerName || t.customer_name || o.customer_name || '')
    .replace(/\{oportunidade\}/g, o.title || '').replace(/\{etapa\}/g, ctx.stageName || o.stage_name || '');
}

async function runAction(rule, ctx) {
  const p = rule.action_params || {};
  const t = ctx.ticket, o = ctx.opportunity;
  const link = t ? `#/atendimentos/${t.id}` : o ? `#/funil/${o.id}` : null;
  switch (rule.action) {
    case 'create_task': {
      const entityCol = t ? 'ticket_id' : 'opportunity_id', entityId = t ? t.id : o.id;
      const dup = await query(`SELECT 1 FROM tasks WHERE automation_rule_id = $1 AND ${entityCol} = $2 AND done_at IS NULL`, [rule.id, entityId]);
      if (dup.rowCount) return { status: 'ignorada', details: 'Já existe uma tarefa aberta criada por esta regra.' };
      let assignee = p.assignee === 'owner' || !p.assignee ? (t ? t.assignee_id : o.owner_id) : Number(p.assignee) || null;
      if (!assignee) assignee = (await query(`SELECT id FROM users WHERE active AND role IN ('supervisor','admin') ORDER BY role, id LIMIT 1`)).rows[0]?.id || null;
      const due = new Date(Date.now() + (Number(p.due_in_days) || 1) * 86400000);
      const title = fill(p.title || 'Acompanhar {cliente}', ctx);
      const { rows } = await query(
        `INSERT INTO tasks (title, description, customer_id, ticket_id, opportunity_id, assignee_id, due_at, priority, automation_rule_id, kind)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'acompanhamento') RETURNING id`,
        [title, `Criada automaticamente pela regra "${rule.name}".`, t ? t.customer_id : o.customer_id, t ? t.id : null, o ? o.id : null, assignee, due,
          ['baixa', 'normal', 'alta'].includes(p.priority) ? p.priority : 'normal', rule.id]);
      if (assignee) await notify(assignee, 'Tarefa criada por automação', title, '#/tarefas');
      return { status: 'executada', details: `Tarefa #${rows[0].id} "${title}" para ${due.toLocaleDateString('pt-BR')}.` };
    }
    case 'notify': {
      const users = await resolveUsers(p.to || 'owner', ctx);
      if (!users.length) return { status: 'ignorada', details: 'Nenhum destinatário.' };
      const title = fill(p.title || rule.name, ctx), body = fill(p.body || '', ctx);
      for (const u of users) await notify(u, title, body, link);
      return { status: 'executada', details: `Notificados: ${users.length} usuário(s).` };
    }
    case 'distribute': {
      if (!t) return { status: 'ignorada', details: 'Ação válida apenas para atendimentos.' };
      const out = await tx(async (client) => {
        const cur = (await client.query(`SELECT id, assignee_id, status FROM tickets WHERE id = $1 FOR UPDATE`, [t.id])).rows[0];
        if (!cur || cur.assignee_id || cur.status !== 'aguardando') return null;
        const teamSql = rule.team ? 'AND team = $1' : 'AND $1::text IS NULL';
        const pick = (await client.query(`SELECT id, name FROM users WHERE active AND available AND role = 'atendente' ${teamSql} ORDER BY last_assigned_at NULLS FIRST, id LIMIT 1 FOR UPDATE SKIP LOCKED`, [rule.team || null])).rows[0];
        if (!pick) return false;
        await client.query('UPDATE users SET last_assigned_at = now() WHERE id = $1', [pick.id]);
        await client.query('UPDATE tickets SET assignee_id = $1, version = version + 1, updated_at = now() WHERE id = $2', [pick.id, t.id]);
        await client.query(`INSERT INTO ticket_events (ticket_id, user_id, kind, body, payload) VALUES ($1,NULL,'system',$2,$3)`,
          [t.id, `Distribuído automaticamente para ${pick.name} (regra "${rule.name}")`, JSON.stringify({ action: 'assigned', to: pick.id, auto: true, rule_id: rule.id })]);
        await notify(pick.id, 'Novo atendimento atribuído', `${t.protocol} — ${t.subject}`, link, client);
        return pick;
      });
      if (out === null) return { status: 'ignorada', details: 'Atendimento já tem responsável ou não está na fila.' };
      if (out === false) return { status: 'ignorada', details: 'Nenhum atendente disponível; permanece na fila.' };
      broadcast('tickets_changed', { id: t.id, action: 'distributed' });
      return { status: 'executada', details: `Atribuído a ${out.name}.` };
    }
    case 'set_priority': {
      if (!t || !['baixa', 'normal', 'alta', 'urgente'].includes(p.priority)) return { status: 'ignorada', details: 'Prioridade inválida.' };
      if (t.priority === p.priority) return { status: 'ignorada', details: 'Prioridade já era a definida.' };
      await query('UPDATE tickets SET priority = $1, version = version + 1, updated_at = now() WHERE id = $2', [p.priority, t.id]);
      await query(`INSERT INTO ticket_events (ticket_id, kind, body, payload) VALUES ($1,'system',$2,$3)`, [t.id, `Prioridade alterada para "${p.priority}" (regra "${rule.name}")`, JSON.stringify({ action: 'priority', to: p.priority, rule_id: rule.id })]);
      broadcast('tickets_changed', { id: t.id, action: 'updated' });
      return { status: 'executada', details: `Prioridade: ${p.priority}.` };
    }
    case 'add_tag': {
      const cid = t ? t.customer_id : o.customer_id; const tag = String(p.tag || '').trim();
      if (!tag) return { status: 'ignorada', details: 'Etiqueta vazia.' };
      const { rowCount } = await query(`UPDATE customers SET tags = array_append(tags, $1), updated_at = now() WHERE id = $2 AND NOT ($1 = ANY(tags))`, [tag, cid]);
      return rowCount ? { status: 'executada', details: `Etiqueta "${tag}" adicionada.` } : { status: 'ignorada', details: 'Cliente já tinha a etiqueta.' };
    }
    case 'send_message': {
      if (!t) return { status: 'ignorada', details: 'Ação válida apenas para atendimentos.' };
      if (!config.whatsapp.configured) return { status: 'falhou', details: 'WhatsApp não está conectado; mensagem automática não enviada.' };
      if (t.channel !== 'WhatsApp') return { status: 'ignorada', details: 'Atendimento não é do canal WhatsApp.' };
      const wa = require('./whatsapp');
      try {
        const r = await wa.sendText({ ticketId: t.id, customerId: t.customer_id, body: fill(p.body, ctx), userId: null, viaRule: rule.id });
        return { status: 'executada', details: `Mensagem enviada (id ${r.wa_message_id || '?'}).` };
      } catch (e) { return { status: 'falhou', details: e.message }; }
    }
    default: return { status: 'falhou', details: 'Ação desconhecida.' };
  }
}

async function loadContext(entity, id) {
  if (entity === 'ticket') {
    const t = (await query(`SELECT t.*, c.name AS customer_name, u.team AS owner_team FROM tickets t JOIN customers c ON c.id = t.customer_id LEFT JOIN users u ON u.id = t.assignee_id WHERE t.id = $1`, [id])).rows[0];
    return t ? { ticket: t, customerName: t.customer_name, ownerTeam: t.owner_team } : null;
  }
  const o = (await query(`SELECT o.*, c.name AS customer_name, s.name AS stage_name, s.pipeline_id, u.team AS owner_team FROM opportunities o JOIN customers c ON c.id = o.customer_id JOIN pipeline_stages s ON s.id = o.stage_id LEFT JOIN users u ON u.id = o.owner_id WHERE o.id = $1`, [id])).rows[0];
  return o ? { opportunity: o, customerName: o.customer_name, stageName: o.stage_name, ownerTeam: o.owner_team } : null;
}

// Dispara um gatilho por evento (chamado pelas rotas). Nunca lança: falhas são registradas.
async function trigger(name, entity, id, extra = {}) {
  try {
    const rules = await activeRules(name);
    if (!rules.length) return;
    const ctx = await loadContext(entity, id);
    if (!ctx) return;
    Object.assign(ctx, extra);
    for (const rule of rules) {
      if (!matches(rule, ctx)) continue;
      const key = extra.dedupeKey ? `${entity}:${id}:${extra.dedupeKey}` : null;
      if (await alreadyRan(rule, key)) continue;
      const r = await runAction(rule, ctx);
      await recordRun(rule, entity, id, r.status, r.details, key);
    }
  } catch (e) { console.error(`Automação (${name}) falhou:`, e.message); }
}

// Comportamentos fixos: interromper acompanhamentos quando o cliente responde ou a negociação encerra.
async function stopFollowUps(where, params, reason) {
  const { rowCount } = await query(`UPDATE tasks SET done_at = now(), closed_reason = $${params.length + 1}, updated_at = now()
    WHERE done_at IS NULL AND (automation_rule_id IS NOT NULL OR kind = 'acompanhamento') AND ${where}`, [...params, reason]);
  return rowCount;
}

// Gatilhos agendados (executados a cada minuto pelo servidor).
async function runScheduled() {
  const settings = (await query('SELECT response_sla_minutes, idle_opportunity_days FROM company_settings WHERE id = 1')).rows[0];
  // Prazo de resposta vencido
  for (const rule of await activeRules('ticket_response_overdue')) {
    const minutes = Number(rule.conditions?.minutes) || settings.response_sla_minutes;
    const { rows } = await query(
      `SELECT t.id, COALESCE(t.last_customer_message_at, t.opened_at) AS since FROM tickets t
       WHERE t.status IN ('aguardando','em_atendimento') AND (t.last_agent_message_at IS NULL OR t.last_customer_message_at > t.last_agent_message_at)
         AND COALESCE(t.last_customer_message_at, t.opened_at) < now() - ($1 || ' minutes')::interval`, [String(minutes)]);
    for (const r of rows) await trigger_one(rule, 'ticket', r.id, `overdue:${new Date(r.since).toISOString()}`);
  }
  for (const rule of await activeRules('ticket_follow_up_overdue')) {
    const minutes = Number(rule.conditions?.minutes) || 0;
    const { rows } = await query(`SELECT id, follow_up_at FROM tickets WHERE status IN ('aguardando','em_atendimento','aguardando_cliente') AND follow_up_at IS NOT NULL AND follow_up_at < now() - ($1 || ' minutes')::interval`, [String(minutes)]);
    for (const r of rows) await trigger_one(rule, 'ticket', r.id, `followup:${new Date(r.follow_up_at).toISOString()}`);
  }
  for (const rule of await activeRules('opportunity_idle')) {
    const days = Number(rule.conditions?.days) || settings.idle_opportunity_days;
    const { rows } = await query(`SELECT o.id, o.updated_at FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id WHERE s.kind = 'open' AND o.updated_at < now() - ($1 || ' days')::interval`, [String(days)]);
    for (const r of rows) await trigger_one(rule, 'opportunity', r.id, `idle:${new Date(r.updated_at).toISOString()}`);
  }
}

async function trigger_one(rule, entity, id, dedupe) {
  try {
    const key = `${entity}:${id}:${dedupe}`;
    if (await alreadyRan(rule, key)) return;
    const ctx = await loadContext(entity, id);
    if (!ctx || !matches(rule, ctx)) return;
    const r = await runAction(rule, ctx);
    await recordRun(rule, entity, id, r.status, r.details, key);
  } catch (e) { console.error('Automação agendada falhou:', e.message); }
}

let timer = null;
function startScheduler(intervalMs = 60000) {
  if (timer) return;
  const tick = () => runScheduled().catch((e) => console.error('Agendador de automações:', e.message));
  timer = setInterval(tick, intervalMs);
  if (timer.unref) timer.unref();
  setTimeout(tick, 5000).unref?.();
}
function stopScheduler() { if (timer) clearInterval(timer); timer = null; }

module.exports = { TRIGGERS, ACTIONS, trigger, runScheduled, startScheduler, stopScheduler, stopFollowUps, pool };
