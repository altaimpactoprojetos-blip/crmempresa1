'use strict';
// Robô de atendimento: responde contatos novos com boas-vindas e um menu de opções, direciona a conversa
// (responsável, etapa do funil, etiqueta) e avisa quando a mensagem chega fora do horário de atendimento.
// Assim que alguém da equipe responde (ou assume a conversa), o robô para naquela conversa.
//
// Configuração (chatbot_settings.config):
// { channels: [ids] (vazio = todos), welcome, invalid, handoff,
//   options: [{ label, reply, assign: null | 'round_robin' | userId, stage_id, tag }],
//   hours: { enabled, days: { "0".."6": ["08:00", "18:00"] | null }, away } }   ("0" = domingo)
const { query, tx, runAsCompany, currentCompanyId } = require('../db');
const { broadcast } = require('./realtime');
const { notify } = require('./notify');
const outbox = require('./outbox');

const MAX_TRIES = 3;
const AWAY_EVERY_MS = 12 * 3600 * 1000; // aviso de fora do horário no máximo a cada 12h por conversa

const DEFAULTS = {
  channels: [],
  welcome: 'Olá, {primeiro_nome}! Obrigado pelo contato com a {empresa}. Como podemos ajudar?',
  invalid: 'Não entendi. Responda só com o número de uma das opções:',
  handoff: 'Certo! Um atendente vai continuar o seu atendimento em instantes.',
  options: [],
  hours: {
    enabled: false,
    days: {},
    away: 'Recebemos a sua mensagem! Nosso horário de atendimento já encerrou; respondemos assim que voltarmos.',
  },
};

const norm = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

function fill(text, vars) {
  return String(text || '').replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

// Dia da semana e hora no fuso da empresa
function localClock(tz, date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return { day, time: `${parts.hour}:${parts.minute}` };
}

function isOpen(hours, tz, date = new Date()) {
  if (!hours || !hours.enabled) return true;
  const { day, time } = localClock(tz, date);
  const span = hours.days?.[String(day)];
  return Boolean(span && span[0] <= time && time < span[1]);
}

const menuText = (options) => options.map((o, i) => `${i + 1} - ${o.label}`).join('\n');

function matchOption(options, text) {
  const t = norm(text);
  const num = t.match(/^(\d+)\b/);
  if (num) return options[Number(num[1]) - 1] || null;
  return options.find((o) => norm(o.label) === t) || null;
}

async function loadSettings() {
  const row = (await query('SELECT enabled, config FROM chatbot_settings')).rows[0];
  return { enabled: Boolean(row?.enabled), config: { ...DEFAULTS, ...(row?.config || {}) } };
}

// Aplica o destino da opção escolhida: responsável, etapa e etiqueta.
async function route(conv, option) {
  const done = [];
  if (option.assign) {
    const userId = await tx(async (client) => {
      let id = option.assign;
      if (id === 'round_robin') {
        const next = (
          await client.query(
            `SELECT id FROM users WHERE active AND available AND role = 'atendente'
             ORDER BY last_assigned_at NULLS FIRST, id LIMIT 1 FOR UPDATE SKIP LOCKED`,
          )
        ).rows[0];
        if (!next) return null;
        id = next.id;
        await client.query('UPDATE users SET last_assigned_at = now() WHERE id = $1', [id]);
      } else if (!(await client.query('SELECT 1 FROM users WHERE id = $1 AND active', [id])).rowCount) return null;
      await client.query('UPDATE conversations SET assignee_id = $2 WHERE id = $1 AND assignee_id IS NULL', [
        conv.id,
        id,
      ]);
      return id;
    });
    if (userId) {
      await notify(userId, 'Nova conversa para você', conv.contact_name || 'Contato', `#/conversas/${conv.id}`);
      done.push('assign');
    }
  }
  if (option.tag && conv.customer_id) {
    await query(`UPDATE customers SET tags = array_append(tags, $2) WHERE id = $1 AND NOT ($2 = ANY(tags))`, [
      conv.customer_id,
      option.tag,
    ]);
    done.push('tag');
  }
  if (option.stage_id && conv.opportunity_id) {
    const moved = await tx(async (client) => {
      const stage = (
        await client.query(`SELECT * FROM pipeline_stages WHERE id = $1 AND active AND kind = 'open'`, [
          option.stage_id,
        ])
      ).rows[0];
      const o = (
        await client.query(
          `SELECT o.*, s.name AS stage_name, s.pipeline_id FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id
           WHERE o.id = $1 FOR UPDATE OF o`,
          [conv.opportunity_id],
        )
      ).rows[0];
      // Só move dentro do mesmo funil e se a oportunidade ainda estiver aberta
      if (!stage || !o || o.stage_id === stage.id || o.closed_at || o.pipeline_id !== stage.pipeline_id) return null;
      await client.query(
        'UPDATE opportunities SET stage_id = $1, version = version + 1, updated_at = now() WHERE id = $2',
        [stage.id, o.id],
      );
      await client.query('INSERT INTO opportunity_events (opportunity_id, body, payload) VALUES ($1,$2,$3)', [
        o.id,
        `Movida de "${o.stage_name}" para "${stage.name}" pelo robô de atendimento`,
        JSON.stringify({ action: 'move', from: o.stage_id, to: stage.id, via: 'chatbot' }),
      ]);
      return { opportunityId: o.id, stageId: stage.id };
    });
    if (moved) {
      require('./automations').onStageEntered({ companyId: currentCompanyId(), ...moved });
      done.push('stage');
    }
  }
  return done;
}

// Decide o que responder (dentro de uma transação, para duas mensagens seguidas não gerarem duas respostas)
// e depois envia. Devolve a lista de ações para os testes.
async function handle(conversationId) {
  const { enabled, config } = await loadSettings();
  if (!enabled) return null;
  const tz = (await query('SELECT timezone, name FROM company_settings')).rows[0] || {};
  const plan = await tx(async (client) => {
    const conv = (
      await client.query(
        `SELECT c.*, ch.type AS channel_type, cu.name AS customer_name FROM conversations c
         JOIN channels ch ON ch.id = c.channel_id LEFT JOIN customers cu ON cu.id = c.customer_id
         WHERE c.id = $1 FOR UPDATE OF c`,
        [conversationId],
      )
    ).rows[0];
    if (!conv || conv.assignee_id || conv.bot_state === 'done' || conv.status !== 'open') return null;
    if (config.channels?.length && !config.channels.includes(conv.channel_id)) return null;
    const last = (
      await client.query(
        `SELECT body FROM messages WHERE conversation_id = $1 AND direction = 'in' ORDER BY created_at DESC, id DESC LIMIT 1`,
        [conv.id],
      )
    ).rows[0];
    const name = conv.contact_name || conv.customer_name || '';
    const vars = { nome: name, primeiro_nome: name.split(' ')[0], empresa: tz.name || '' };
    const options = (config.options || []).filter((o) => o.label);
    const out = { conv, texts: [], option: null };
    const set = (state, tries) =>
      client.query('UPDATE conversations SET bot_state = $2, bot_tries = $3 WHERE id = $1', [conv.id, state, tries]);

    if (!isOpen(config.hours, tz.timezone || 'America/Sao_Paulo')) {
      if (conv.away_sent_at && Date.now() - new Date(conv.away_sent_at).getTime() < AWAY_EVERY_MS) return null;
      await client.query('UPDATE conversations SET away_sent_at = now() WHERE id = $1', [conv.id]);
      out.texts.push(fill(config.hours.away, vars));
      return out;
    }
    if (!conv.bot_state) {
      const welcome = fill(config.welcome, vars);
      out.texts.push(options.length ? `${welcome}\n\n${menuText(options)}` : welcome);
      await set(options.length ? 'menu' : 'done', 0);
      return out;
    }
    // Aguardando a escolha do menu
    const option = matchOption(options, last?.body);
    if (option) {
      if (option.reply) out.texts.push(fill(option.reply, vars));
      out.option = option;
      await set('done', 0);
    } else if (conv.bot_tries + 1 >= MAX_TRIES) {
      out.texts.push(fill(config.handoff, vars));
      await set('done', conv.bot_tries + 1);
    } else {
      out.texts.push(`${fill(config.invalid, vars)}\n\n${menuText(options)}`);
      await set('menu', conv.bot_tries + 1);
    }
    return out;
  });
  if (!plan) return null;
  const result = { sent: [], routed: [] };
  if (plan.texts.length) {
    const channel = await outbox.loadChannel(plan.conv.channel_id);
    for (const text of plan.texts) {
      await outbox.sendText(plan.conv, channel, text, null, { bot: true });
      result.sent.push(text);
    }
  }
  if (plan.option) result.routed = await route(plan.conv, plan.option);
  broadcast('inbox_changed', { conversation_id: plan.conv.id });
  return result;
}

// Chamado para cada mensagem recebida. Roda fora da requisição/webhook e nunca derruba o processamento.
function onInbound({ companyId, conversationId }) {
  return runAsCompany(companyId, () => handle(conversationId)).catch((err) => {
    console.error(`[robô] conversa ${conversationId}: ${err.message}`);
    return null;
  });
}

module.exports = { DEFAULTS, onInbound, handle, isOpen, matchOption, localClock };
