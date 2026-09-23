'use strict';
// Robô de atendimento: boas-vindas, menu, direcionamento, horário de atendimento e passagem para a equipe.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { pool, resetDb, startServer, client, createTestCompany, createUser } = require('./helpers');
const { query, runAsSystem } = require('../src/db');
const config = require('../src/config');
const { isOpen, matchOption } = require('../src/lib/chatbot');
const { TOKEN, FB_PAGE, startMetaMock, metaWebhook, waitFor } = require('./metaMock');

let mock, server, base, admin, sup, at1, fb, atId, stages;
let seq = 0;
const say = (psid, text) =>
  metaWebhook(base, fb.key, 'page', FB_PAGE, [
    { sender: { id: psid }, recipient: { id: FB_PAGE }, timestamp: Date.now(), message: { mid: `m_${++seq}`, text } },
  ]);
const findConv = async (psid) =>
  (await admin.get('/inbox/conversations?status=all')).data.conversations.find((x) => x.contact_phone === `fb:${psid}`);
const botTexts = async (conv) =>
  (await admin.get(`/inbox/conversations/${conv.id}`)).data.messages.filter((m) => m.is_bot).map((m) => m.body);
const sentTo = (psid) => mock.sent.filter((m) => m.recipient.id === psid).map((m) => m.message.text);
const pause = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const baseConfig = () => ({
  channels: [],
  welcome: 'Olá, {primeiro_nome}! Bem-vindo à {empresa}.',
  invalid: 'Não entendi.',
  handoff: 'Vou chamar um atendente.',
  options: [
    {
      label: 'Comprar',
      reply: 'Ótimo! Já vou te passar para vendas.',
      assign: 'round_robin',
      stage_id: stages.andamento,
      tag: 'quer-comprar',
    },
    {
      label: 'Suporte técnico',
      reply: 'Certo, o suporte já vai falar com você.',
      assign: null,
      stage_id: null,
      tag: null,
    },
  ],
  hours: { enabled: false, days: {}, away: 'Estamos fechados agora.' },
});

before(async () => {
  mock = await startMetaMock();
  config.whatsapp.graphUrl = mock.url;
  await resetDb();
  const companyId = await createTestCompany('Loja', 'Admin', 'admin@loja.com');
  await createUser(companyId, 'Supervisora', 'sup@loja.com', 'supervisor');
  atId = await createUser(companyId, 'Atendente Um', 'a1@loja.com', 'atendente');
  ({ server, base } = await startServer());
  [admin, sup, at1] = [client(base), client(base), client(base)];
  await admin.login('admin@loja.com', 'Senha12345');
  await sup.login('sup@loja.com', 'Senha12345');
  await at1.login('a1@loja.com', 'Senha12345');
  const r = await admin.post('/channels/social', {
    type: 'messenger',
    name: 'Facebook',
    page_id: FB_PAGE,
    access_token: TOKEN,
  });
  fb = r.data.channel;
  fb.key = fb.webhook_url.split('/').pop();
  const st = (await admin.get('/pipelines')).data.pipelines[0].stages;
  stages = { first: st[0].id, andamento: st[1].id, won: st.find((s) => s.kind === 'won').id };
});
after(async () => {
  server.close();
  mock.srv.close();
  await pool.end();
});

test('menu: aceita número, texto e ignora acentos', () => {
  const opts = [{ label: 'Comprar' }, { label: 'Suporte técnico' }];
  assert.equal(matchOption(opts, '2'), opts[1]);
  assert.equal(matchOption(opts, ' 1 - quero comprar'), opts[0]);
  assert.equal(matchOption(opts, 'SUPORTE TECNICO'), opts[1]);
  assert.equal(matchOption(opts, '3'), null);
  assert.equal(matchOption(opts, 'oi'), null);
  assert.equal(matchOption(opts, undefined), null);
});

test('horário de atendimento no fuso da empresa', () => {
  const hours = { enabled: true, days: { 1: ['08:00', '18:00'] } };
  // Segunda-feira 10:00 em São Paulo = 13:00 UTC
  assert.equal(isOpen(hours, 'America/Sao_Paulo', new Date('2026-09-21T13:00:00Z')), true);
  // Segunda 20:00 em São Paulo (23:00 UTC) — fechado; 17:59 aberto; 18:00 fechado
  assert.equal(isOpen(hours, 'America/Sao_Paulo', new Date('2026-09-21T23:00:00Z')), false);
  assert.equal(isOpen(hours, 'America/Sao_Paulo', new Date('2026-09-21T20:59:00Z')), true);
  assert.equal(isOpen(hours, 'America/Sao_Paulo', new Date('2026-09-21T21:00:00Z')), false);
  // Domingo sem horário
  assert.equal(isOpen(hours, 'America/Sao_Paulo', new Date('2026-09-20T13:00:00Z')), false);
  assert.equal(isOpen({ enabled: false }, 'America/Sao_Paulo'), true);
});

test('configuração: só administrador altera, com validação', async () => {
  const cfg = baseConfig();
  assert.equal((await at1.get('/chatbot')).status, 403);
  assert.equal((await sup.get('/chatbot')).status, 200);
  assert.equal((await sup.put('/chatbot', { enabled: true, config: cfg })).status, 403);
  const badStage = await admin.put('/chatbot', {
    enabled: true,
    config: { ...cfg, options: [{ ...cfg.options[0], stage_id: stages.won }] },
  });
  assert.equal(badStage.status, 400);
  const badHours = await admin.put('/chatbot', {
    enabled: true,
    config: { ...cfg, hours: { enabled: true, days: { 1: ['18:00', '08:00'] }, away: 'x' } },
  });
  assert.equal(badHours.status, 400);
  const def = (await admin.get('/chatbot')).data;
  assert.equal(def.enabled, false);
  assert.ok(def.config.welcome);
});

test('robô desligado não responde', async () => {
  await say('3001', 'Oi');
  const conv = await waitFor(() => findConv('3001'));
  await pause();
  assert.deepEqual(await botTexts(conv), []);
});

test('boas-vindas com menu, opção inválida e direcionamento pela opção escolhida', async () => {
  assert.equal((await admin.put('/chatbot', { enabled: true, config: baseConfig() })).status, 200);
  await say('3002', 'Oi, boa tarde');
  const conv = await waitFor(() => findConv('3002'));
  await waitFor(() => sentTo('3002').length === 1);
  assert.equal(sentTo('3002')[0], 'Olá, Ana! Bem-vindo à Loja.\n\n1 - Comprar\n2 - Suporte técnico');
  assert.equal((await botTexts(conv)).length, 1);

  await say('3002', 'quanto custa?');
  await waitFor(() => sentTo('3002').length === 2);
  assert.match(sentTo('3002')[1], /^Não entendi\.\n\n1 - Comprar/);

  await say('3002', '1');
  await waitFor(() => sentTo('3002').length === 3);
  assert.equal(sentTo('3002')[2], 'Ótimo! Já vou te passar para vendas.');
  const after1 = await waitFor(async () => {
    const c = await findConv('3002');
    return c.assignee_id && c.stage_id === stages.andamento ? c : null;
  });
  assert.equal(after1.assignee_id, atId);
  const cust = (await admin.get(`/customers/${after1.customer_id}`)).data.customer;
  assert.ok(cust.tags.includes('quer-comprar'));
  const opp = (await admin.get(`/opportunities/${after1.opportunity_id}`)).data;
  assert.ok(opp.events.some((e) => /pelo robô/.test(e.body)));
  // Depois de direcionada, o robô não fala mais
  await say('3002', 'obrigado');
  await pause();
  assert.equal(sentTo('3002').length, 3);
});

test('depois de 3 respostas inválidas, passa para a equipe', async () => {
  await say('3003', 'Oi');
  await waitFor(() => sentTo('3003').length === 1);
  await say('3003', 'hã');
  await waitFor(() => sentTo('3003').length === 2);
  await say('3003', 'não sei');
  await waitFor(() => sentTo('3003').length === 3);
  await say('3003', '???');
  await waitFor(() => sentTo('3003').length === 4);
  assert.equal(sentTo('3003')[3], 'Vou chamar um atendente.');
  await say('3003', '1');
  await pause();
  assert.equal(sentTo('3003').length, 4);
});

test('quando alguém da equipe responde, o robô para; conversa reaberta recomeça', async () => {
  await say('3004', 'Oi');
  const conv = await waitFor(() => findConv('3004'));
  await waitFor(() => sentTo('3004').length === 1);
  assert.equal((await at1.post(`/inbox/conversations/${conv.id}/messages`, { body: 'Olá! Sou a Carla.' })).status, 201);
  await say('3004', '2');
  await pause();
  assert.deepEqual(sentTo('3004'), [sentTo('3004')[0], 'Olá! Sou a Carla.']);
  // Encerrada e o cliente volta a escrever: nova rodada de boas-vindas (se ninguém estiver com ela)
  await admin.put(`/inbox/conversations/${conv.id}/assign`, { assignee_id: null });
  await admin.post(`/inbox/conversations/${conv.id}/close`);
  await say('3004', 'Oi de novo');
  await waitFor(() => sentTo('3004').length === 3);
  assert.match(sentTo('3004')[2], /^Olá, Ana!/);
});

test('fora do horário: avisa uma vez e não mostra o menu', async () => {
  const cfg = baseConfig();
  // Aberto só em um dia que não é hoje (no fuso da empresa)
  const today = new Date().toLocaleDateString('en-US', { timeZone: 'America/Sao_Paulo', weekday: 'short' });
  const other = String((['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(today) + 1) % 7);
  cfg.hours = { enabled: true, days: { [other]: ['08:00', '18:00'] }, away: 'Estamos fechados agora.' };
  assert.equal((await admin.put('/chatbot', { enabled: true, config: cfg })).status, 200);
  await say('3005', 'Oi');
  await waitFor(() => sentTo('3005').length === 1);
  assert.equal(sentTo('3005')[0], 'Estamos fechados agora.');
  await say('3005', 'Alguém aí?');
  await pause();
  assert.equal(sentTo('3005').length, 1);
  const conv = await findConv('3005');
  assert.equal(
    (await runAsSystem(() => query('SELECT bot_state FROM conversations WHERE id = $1', [conv.id]))).rows[0].bot_state,
    null,
  );
});

test('robô limitado a canais escolhidos', async () => {
  const cfg = baseConfig();
  cfg.channels = [999999];
  assert.equal((await admin.put('/chatbot', { enabled: true, config: cfg })).status, 200);
  await say('3006', 'Oi');
  await waitFor(() => findConv('3006'));
  await pause();
  assert.equal(sentTo('3006').length, 0);
});
