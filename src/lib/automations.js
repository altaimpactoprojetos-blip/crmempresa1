'use strict';
// Automações do funil (como o "funil digital" do Kommo): quando uma oportunidade entra em uma etapa,
// as ações configuradas rodam em sequência. Cada execução fica registrada em automation_runs.
const { query, tx, runAsCompany } = require('../db');
const { notify } = require('./notify');
const { broadcast } = require('./realtime');
const outbox = require('./outbox');

const ACTION_TYPES = ['create_task', 'send_whatsapp', 'set_owner', 'add_tag', 'notify'];

async function loadContext(opportunityId) {
  return (
    await query(
      `SELECT o.*, c.name AS customer_name, u.name AS owner_name, s.name AS stage_name, cs.name AS company_name
       FROM opportunities o JOIN customers c ON c.id = o.customer_id JOIN pipeline_stages s ON s.id = o.stage_id
       LEFT JOIN users u ON u.id = o.owner_id
       LEFT JOIN company_settings cs ON cs.company_id = o.company_id
       WHERE o.id = $1`,
      [opportunityId],
    )
  ).rows[0];
}

// Variáveis disponíveis nos textos: {nome}, {primeiro_nome}, {oportunidade}, {valor}, {etapa}, {responsavel}, {empresa}
function fill(text, o) {
  const vars = {
    nome: o.customer_name || '',
    primeiro_nome: (o.customer_name || '').split(' ')[0],
    oportunidade: o.title || '',
    valor: Number(o.value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    etapa: o.stage_name || '',
    responsavel: o.owner_name || '',
    empresa: o.company_name || '',
  };
  return String(text).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

async function resolveUser(who, o, actorId) {
  if (who === 'owner') return o.owner_id;
  if (who === 'actor') return actorId || null;
  if (typeof who === 'number') {
    const u = (await query('SELECT id FROM users WHERE id = $1 AND active', [who])).rows[0];
    if (!u) throw new Error('Usuário da ação não existe ou está desativado.');
    return u.id;
  }
  return null;
}

const ACTIONS = {
  async create_task(o, a, { actorId, automation }) {
    const assignee = await resolveUser(a.assignee || 'owner', o, actorId);
    const hours = Number.isFinite(a.due_in_hours) ? a.due_in_hours : 24;
    const task = (
      await query(
        `INSERT INTO tasks (title, description, customer_id, opportunity_id, assignee_id, due_at, priority)
         VALUES ($1, $2, $3, $4, $5, now() + make_interval(hours => $6), 'normal') RETURNING id`,
        [fill(a.title, o), `Criada pela automação "${automation.name}".`, o.customer_id, o.id, assignee, hours],
      )
    ).rows[0];
    if (assignee) await notify(assignee, 'Nova tarefa (automação)', fill(a.title, o), '#/tarefas');
    return { task_id: task.id };
  },

  async send_whatsapp(o, a) {
    const conv = (
      await query(
        `SELECT c.*, ch.type AS channel_type FROM conversations c JOIN channels ch ON ch.id = c.channel_id
         WHERE (c.opportunity_id = $1 OR c.customer_id = $2) AND ch.status = 'connected'
         ORDER BY (c.opportunity_id = $1) DESC, c.last_message_at DESC NULLS LAST LIMIT 1`,
        [o.id, o.customer_id],
      )
    ).rows[0];
    if (!conv) throw new Error('O cliente não tem conversa de WhatsApp em um número conectado.');
    const channel = await outbox.loadChannel(conv.channel_id);
    const messageId = await outbox.sendText(conv, channel, fill(a.text, o), null);
    return { conversation_id: conv.id, message_id: messageId };
  },

  async set_owner(o, a) {
    const userId = await tx(async (client) => {
      let id = a.user_id;
      if (id === 'round_robin') {
        // Rodízio: atendente ativo e disponível que recebeu algo há mais tempo
        const next = (
          await client.query(
            `SELECT id FROM users WHERE active AND available AND role = 'atendente'
             ORDER BY last_assigned_at NULLS FIRST, id LIMIT 1 FOR UPDATE SKIP LOCKED`,
          )
        ).rows[0];
        if (!next) throw new Error('Nenhum atendente disponível para o rodízio.');
        id = next.id;
        await client.query('UPDATE users SET last_assigned_at = now() WHERE id = $1', [id]);
      } else {
        const u = (await client.query('SELECT id FROM users WHERE id = $1 AND active', [id])).rows[0];
        if (!u) throw new Error('Usuário da ação não existe ou está desativado.');
      }
      await client.query('UPDATE opportunities SET owner_id = $2, updated_at = now() WHERE id = $1', [o.id, id]);
      await client.query(
        `INSERT INTO opportunity_events (opportunity_id, body, payload) VALUES ($1, 'Responsável definido pela automação', $2)`,
        [o.id, JSON.stringify({ action: 'owner', to: id, via: 'automation' })],
      );
      return id;
    });
    await notify(userId, 'Oportunidade atribuída a você', o.title, `#/funil/${o.id}`);
    return { owner_id: userId };
  },

  async add_tag(o, a) {
    const tag = String(a.tag).trim();
    await query(`UPDATE customers SET tags = array_append(tags, $2) WHERE id = $1 AND NOT ($2 = ANY(tags))`, [
      o.customer_id,
      tag,
    ]);
    return { tag };
  },

  async notify(o, a, { actorId }) {
    const userId = await resolveUser(a.user || 'owner', o, actorId);
    if (!userId) throw new Error('A oportunidade não tem responsável para avisar.');
    await notify(userId, fill(a.text || 'Oportunidade mudou de etapa', o), o.title, `#/funil/${o.id}`);
    return { user_id: userId };
  },
};

async function runOne(automation, opportunityId, actorId) {
  const detail = [];
  for (const action of automation.actions) {
    try {
      const o = await loadContext(opportunityId); // recarrega: ações anteriores podem ter mudado algo
      if (!o) throw new Error('Oportunidade não encontrada.');
      const fn = ACTIONS[action.type];
      if (!fn) throw new Error(`Ação desconhecida: ${action.type}`);
      detail.push({ type: action.type, ok: true, ...(await fn(o, action, { actorId, automation })) });
    } catch (err) {
      detail.push({ type: action.type, ok: false, error: err.message });
    }
  }
  const okCount = detail.filter((d) => d.ok).length;
  const status = okCount === detail.length ? 'ok' : okCount ? 'partial' : 'error';
  await query('INSERT INTO automation_runs (automation_id, opportunity_id, status, detail) VALUES ($1,$2,$3,$4)', [
    automation.id,
    opportunityId,
    status,
    JSON.stringify(detail),
  ]);
  return { status, detail };
}

// Dispara as automações da etapa. Roda fora da requisição: não atrasa quem moveu o cartão.
function onStageEntered({ companyId, opportunityId, stageId, actorId = null }) {
  return runAsCompany(companyId, async () => {
    const { rows } = await query('SELECT * FROM automations WHERE active AND stage_id = $1 ORDER BY id', [stageId]);
    const results = [];
    for (const a of rows) results.push(await runOne(a, opportunityId, actorId));
    if (rows.length) broadcast('pipeline_changed', { id: opportunityId }, undefined, companyId);
    return results;
  }).catch((err) => {
    console.error(`[automações] oportunidade ${opportunityId}: ${err.message}`);
    return [];
  });
}

module.exports = { ACTION_TYPES, onStageEntered, fill };
