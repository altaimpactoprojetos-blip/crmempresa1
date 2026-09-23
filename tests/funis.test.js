'use strict';
// Fase 2: vários funis, campos personalizados e automações por etapa.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { pool, resetDb, startServer, client, createTestCompany, createUser } = require('./helpers');
const { query, runAsCompany, runAsSystem } = require('../src/db');
const inbox = require('../src/lib/inbox');

let server, base, admin, sup, at1, adminB, companyId;
const tick = (ms = 60) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, ms = 4000) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error('tempo esgotado aguardando condição');
    await tick(40);
  }
}

before(async () => {
  await resetDb();
  companyId = await createTestCompany('Loja', 'Admin', 'admin@f.com');
  await createUser(companyId, 'Supervisora', 'sup@f.com', 'supervisor');
  await createUser(companyId, 'Atendente Um', 'a1@f.com', 'atendente');
  await createTestCompany('Outra', 'Admin B', 'admin@bf.com');
  ({ server, base } = await startServer());
  [admin, sup, at1, adminB] = [client(base), client(base), client(base), client(base)];
  await admin.login('admin@f.com', 'Senha12345');
  await sup.login('sup@f.com', 'Senha12345');
  await at1.login('a1@f.com', 'Senha12345');
  await adminB.login('admin@bf.com', 'Senha12345');
});
after(async () => {
  server.close();
  await pool.end();
});

let vendas, posVenda, customer;

test('vários funis: criar, quadro separado por funil e regras de exclusão', async () => {
  const list = (await admin.get('/pipelines')).data.pipelines;
  assert.equal(list.length, 1);
  vendas = list[0];
  assert.equal(vendas.is_default, true);
  assert.equal(vendas.stages.length, 6);
  assert.equal((await at1.post('/pipelines', { name: 'Pós-venda' })).status, 403);
  const r = await admin.post('/pipelines', { name: 'Pós-venda' });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  posVenda = (await admin.get('/pipelines')).data.pipelines.find((p) => p.name === 'Pós-venda');
  assert.deepEqual(
    posVenda.stages.map((s) => s.kind),
    ['open', 'open', 'won', 'lost'],
  );
  customer = (await admin.post('/customers', { name: 'Cliente Funis', phone: '11911112222' })).data.customer;
  const o1 = (await admin.post('/opportunities', { title: 'Venda', customer_id: customer.id })).data.opportunity;
  const o2 = (
    await admin.post('/opportunities', { title: 'Suporte', customer_id: customer.id, pipeline_id: posVenda.id })
  ).data.opportunity;
  assert.equal(o1.stage_id, vendas.stages[0].id);
  assert.equal(o2.stage_id, posVenda.stages[0].id);
  const board = (await admin.get(`/opportunities?pipeline_id=${posVenda.id}`)).data;
  assert.deepEqual(
    board.opportunities.map((o) => o.title),
    ['Suporte'],
  );
  assert.equal(board.stages.length, 4);
  assert.equal(board.pipelines.length, 2);
  // Etapas: não aceita etapa de outro funil
  const bad = await admin.put('/settings/stages', {
    pipeline_id: posVenda.id,
    stages: [{ id: vendas.stages[0].id, name: 'x', kind: 'open' }, ...posVenda.stages.slice(1)],
  });
  assert.equal(bad.status, 400);
  assert.equal((await admin.del(`/pipelines/${posVenda.id}`)).status, 409, 'funil com oportunidades');
  assert.equal((await admin.del(`/pipelines/${vendas.id}`)).status, 400, 'funil principal');
  // Trocar o principal
  assert.equal((await admin.put(`/pipelines/${posVenda.id}`, { is_default: true })).status, 200);
  const after = (await admin.get('/pipelines')).data.pipelines;
  assert.deepEqual(
    after.filter((p) => p.is_default).map((p) => p.id),
    [posVenda.id],
  );
  await admin.put(`/pipelines/${vendas.id}`, { is_default: true });
  // Outra empresa não vê
  assert.equal((await adminB.get('/pipelines')).data.pipelines.length, 1);
  assert.equal((await adminB.post('/opportunities', { title: 'x', customer_id: customer.id })).status, 400);
});

test('campos personalizados: tipos, obrigatórios, edição parcial e exclusão', async () => {
  let r = await admin.post('/custom-fields', {
    entity: 'customer',
    label: 'Segmento',
    type: 'select',
    options: ['Varejo', 'Atacado'],
    required: true,
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const segmento = r.data.field;
  assert.equal(segmento.key, 'segmento');
  r = await admin.post('/custom-fields', { entity: 'opportunity', label: 'Data do evento', type: 'date' });
  assert.equal(r.data.field.key, 'data_do_evento');
  assert.equal(
    (await admin.post('/custom-fields', { entity: 'customer', label: 'Lista', type: 'select' })).status,
    400,
  );
  assert.equal((await at1.post('/custom-fields', { entity: 'customer', label: 'X', type: 'text' })).status, 403);

  r = await admin.post('/customers', { name: 'Sem Segmento' });
  assert.equal(r.status, 400);
  assert.ok(r.data.fields['custom.segmento']);
  r = await admin.post('/customers', { name: 'Segmento Errado', custom: { segmento: 'Indústria' } });
  assert.equal(r.status, 400);
  r = await admin.post('/customers', { name: 'Com Segmento', custom: { segmento: 'Varejo', desconhecido: 'x' } });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  assert.deepEqual(r.data.customer.custom, { segmento: 'Varejo' });
  const c = r.data.customer;
  r = await admin.put(`/customers/${c.id}`, { city: 'Santos' });
  assert.deepEqual(r.data.customer.custom, { segmento: 'Varejo' }, 'edição sem custom mantém os valores');
  r = await admin.put(`/customers/${c.id}`, { custom: { segmento: 'Atacado' } });
  assert.deepEqual(r.data.customer.custom, { segmento: 'Atacado' });

  r = await admin.post('/opportunities', {
    title: 'Evento',
    customer_id: c.id,
    custom: { data_do_evento: '31/12/2026' },
  });
  assert.equal(r.status, 400);
  r = await admin.post('/opportunities', {
    title: 'Evento',
    customer_id: c.id,
    custom: { data_do_evento: '2026-12-31' },
  });
  assert.equal(r.status, 201);
  assert.equal(r.data.opportunity.custom.data_do_evento, '2026-12-31');

  assert.equal((await admin.del(`/custom-fields/${segmento.id}`)).status, 200);
  assert.equal((await admin.post('/customers', { name: 'Agora pode' })).status, 201);
  assert.deepEqual((await adminB.get('/custom-fields')).data.fields, []);
});

test('automações: validação e permissões', async () => {
  const stage = vendas.stages[2];
  assert.equal((await at1.get('/automations')).status, 403);
  assert.equal(
    (await admin.post('/automations', { name: 'X', stage_id: stage.id, actions: [{ type: 'apagar_tudo' }] })).status,
    400,
  );
  assert.equal((await admin.post('/automations', { name: 'Sem ações', stage_id: stage.id, actions: [] })).status, 400);
  const otherStage = (await adminB.get('/pipelines')).data.pipelines[0].stages[0].id;
  const r = await admin.post('/automations', {
    name: 'Etapa de outra empresa',
    stage_id: otherStage,
    actions: [{ type: 'add_tag', tag: 'x' }],
  });
  assert.equal(r.status, 400);
  assert.equal((await sup.get('/automations')).status, 200);
  assert.equal(
    (await sup.post('/automations', { name: 'X', stage_id: stage.id, actions: [{ type: 'add_tag', tag: 'x' }] }))
      .status,
    403,
  );
});

test('automações: ao mover para a etapa, cria tarefa, etiqueta, define responsável e avisa', async () => {
  const proposta = vendas.stages[2];
  const r = await admin.post('/automations', {
    name: 'Proposta enviada',
    stage_id: proposta.id,
    actions: [
      { type: 'set_owner', user_id: 3 },
      { type: 'create_task', title: 'Ligar para {primeiro_nome} sobre {oportunidade}', due_in_hours: 48 },
      { type: 'add_tag', tag: 'proposta' },
      { type: 'notify', text: 'Proposta de {valor} enviada' },
      { type: 'send_whatsapp', text: 'Olá {primeiro_nome}!' },
    ],
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const auto = r.data.automation;
  const cust = (await admin.post('/customers', { name: 'Maria Souza' })).data.customer;
  const opp = (await admin.post('/opportunities', { title: 'Bolo de casamento', customer_id: cust.id, value: 1500 }))
    .data.opportunity;
  assert.equal((await admin.post(`/opportunities/${opp.id}/move`, { stage_id: proposta.id })).status, 200);
  const runs = await waitFor(async () => {
    const x = (await admin.get(`/automations/${auto.id}/runs`)).data.runs;
    return x.length ? x : null;
  });
  const run = runs[0];
  assert.equal(run.status, 'partial', JSON.stringify(run.detail));
  assert.deepEqual(
    run.detail.map((d) => [d.type, d.ok]),
    [
      ['set_owner', true],
      ['create_task', true],
      ['add_tag', true],
      ['notify', true],
      ['send_whatsapp', false],
    ],
  );
  assert.match(run.detail[4].error, /não tem conversa de WhatsApp/);
  const o = (await admin.get(`/opportunities/${opp.id}`)).data;
  assert.equal(o.opportunity.owner_id, 3);
  assert.equal(o.tasks[0].title, 'Ligar para Maria sobre Bolo de casamento');
  assert.equal(o.tasks[0].assignee_id, 3);
  const hours = (new Date(o.tasks[0].due_at) - Date.now()) / 3600000;
  assert.ok(hours > 47 && hours < 49);
  assert.deepEqual((await admin.get(`/customers/${cust.id}`)).data.customer.tags, ['proposta']);
  const notes = (await at1.get('/notifications')).data.notifications.map((n) => n.title + ' ' + (n.body || ''));
  assert.ok(notes.some((n) => n.includes('Proposta de R$')));
  // Voltar e entrar de novo roda de novo; etiqueta não duplica
  await admin.post(`/opportunities/${opp.id}/move`, { stage_id: vendas.stages[1].id });
  await admin.post(`/opportunities/${opp.id}/move`, { stage_id: proposta.id });
  await waitFor(async () => (await admin.get(`/automations/${auto.id}/runs`)).data.runs.length === 2);
  assert.deepEqual((await admin.get(`/customers/${cust.id}`)).data.customer.tags, ['proposta']);
  // Automação inativa não roda
  await admin.put(`/automations/${auto.id}`, { active: false });
  await admin.post(`/opportunities/${opp.id}/move`, { stage_id: vendas.stages[1].id });
  await admin.post(`/opportunities/${opp.id}/move`, { stage_id: proposta.id });
  await tick(300);
  assert.equal((await admin.get(`/automations/${auto.id}/runs`)).data.runs.length, 2);
});

test('automação na primeira etapa roda para leads novos, inclusive os que chegam pelo WhatsApp', async () => {
  const first = vendas.stages[0];
  const r = await admin.post('/automations', {
    name: 'Boas-vindas',
    stage_id: first.id,
    actions: [
      { type: 'set_owner', user_id: 'round_robin' },
      { type: 'add_tag', tag: 'novo-lead' },
    ],
  });
  const auto = r.data.automation;
  // Lead criado manualmente
  const cust = (await admin.post('/customers', { name: 'Lead Manual' })).data.customer;
  const opp = (await admin.post('/opportunities', { title: 'Lead manual', customer_id: cust.id })).data.opportunity;
  await waitFor(async () => (await admin.get(`/opportunities/${opp.id}`)).data.opportunity.owner_id === 3);
  // Lead criado por uma mensagem no WhatsApp
  const channel = (
    await runAsSystem(() =>
      query(
        `INSERT INTO channels (company_id, type, name, status) VALUES ($1, 'whatsapp_web', 'Teste', 'connected') RETURNING *`,
        [companyId],
      ),
    )
  ).rows[0];
  await runAsCompany(companyId, async () => {
    const result = await inbox.ingestMessage(channel, {
      externalId: 'AUTO-1',
      phone: '5511977770000',
      jid: '5511977770000@s.whatsapp.net',
      contactName: 'Carlos WhatsApp',
      direction: 'in',
      type: 'text',
      body: 'Oi',
    });
    assert.ok(result.newLead);
    inbox.announce(result);
  });
  await waitFor(async () => (await admin.get(`/automations/${auto.id}/runs`)).data.runs.length === 2);
  const lead = (await admin.get('/opportunities')).data.opportunities.find(
    (o) => o.title === 'WhatsApp — Carlos WhatsApp',
  );
  assert.equal(lead.owner_id, 3);
  const c = (await admin.get(`/customers/${lead.customer_id}`)).data.customer;
  assert.deepEqual(c.tags, ['novo-lead']);
});

test('outra empresa não vê automações nem execuções', async () => {
  assert.deepEqual((await adminB.get('/automations')).data.automations, []);
  const mine = (await admin.get('/automations')).data.automations[0];
  assert.equal((await adminB.put(`/automations/${mine.id}`, { active: false })).status, 404);
  assert.deepEqual((await adminB.get(`/automations/${mine.id}/runs`)).data.runs, []);
});
