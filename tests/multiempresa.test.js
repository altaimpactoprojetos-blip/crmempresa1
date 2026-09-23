'use strict';
// Isolamento entre empresas (SaaS): uma empresa nunca vê, altera nem referencia dados de outra.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { pool, resetDb, startServer, client, createTestCompany, createUser } = require('./helpers');
const { query, runAsCompany, runAsSystem } = require('../src/db');
const realtime = require('../src/lib/realtime');

let server, base, adminA, adminB, companyA, companyB;
const A = {};

before(async () => {
  await resetDb();
  companyA = await createTestCompany('Empresa A', 'Admin A', 'admin@a.com');
  await createUser(companyA, 'Atendente A', 'atendente@a.com', 'atendente');
  ({ server, base } = await startServer());
  adminA = client(base);
  await adminA.login('admin@a.com', 'Senha12345');

  // Dados da empresa A
  A.customer = (await adminA.post('/customers', { name: 'Cliente da A', phone: '11999990000' })).data.customer;
  A.ticket = (
    await adminA.post('/tickets', { customer_id: A.customer.id, subject: 'Atendimento da A', channel: 'WhatsApp' })
  ).data.ticket;
  A.opportunity = (
    await adminA.post('/opportunities', { title: 'Negócio da A', customer_id: A.customer.id, value: 1000 })
  ).data.opportunity;
  A.task = (await adminA.post('/tasks', { title: 'Tarefa da A', customer_id: A.customer.id })).data.task;
  A.stages = (await adminA.get('/settings/stages')).data.stages;
});
after(async () => {
  server.close();
  await pool.end();
});

test('cadastro de empresa: cria conta de teste, faz login e recusa e-mail repetido', async () => {
  adminB = client(base);
  const r = await adminB.post('/auth/signup', {
    company_name: 'Empresa B',
    name: 'Admin B',
    email: 'admin@b.com',
    password: 'Senha12345',
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  companyB = r.data.company.id;
  assert.notEqual(companyB, companyA);
  const me = (await adminB.get('/auth/me')).data;
  assert.equal(me.user.email, 'admin@b.com');
  assert.equal(me.company.status, 'trial');
  assert.ok(me.company.trial_ends_at);
  assert.equal((await adminB.get('/settings/public')).data.settings.name, 'Empresa B');
  // Funil padrão próprio
  const stagesB = (await adminB.get('/settings/stages')).data.stages;
  assert.equal(stagesB.length, 6);
  assert.ok(stagesB.every((s) => !A.stages.some((a) => a.id === s.id)));

  const dup = await client(base).post('/auth/signup', {
    company_name: 'Outra',
    name: 'Xavier',
    email: 'ADMIN@a.com',
    password: 'Senha12345',
  });
  assert.equal(dup.status, 400);
  assert.ok(dup.data.fields.email);
  // E-mail é único entre empresas também ao criar usuário
  const u = await adminB.post('/users', {
    name: 'Xavier',
    email: 'atendente@a.com',
    role: 'atendente',
    password: 'Senha12345',
  });
  assert.equal(u.status, 400);
  assert.ok(u.data.fields.email);
});

test('listagens e relatórios só mostram dados da própria empresa', async () => {
  assert.equal((await adminB.get('/customers')).data.customers.length, 0);
  assert.equal((await adminB.get('/customers?q=Cliente')).data.customers.length, 0);
  assert.equal((await adminB.get('/tickets')).data.tickets.length, 0);
  assert.equal((await adminB.get('/tasks?view=all')).data.tasks.length, 0);
  const users = (await adminB.get('/users')).data.users;
  assert.deepEqual(
    users.map((u) => u.email),
    ['admin@b.com'],
  );
  const pipeline = (await adminB.get('/opportunities')).data;
  assert.ok(JSON.stringify(pipeline).indexOf('Negócio da A') === -1);
  const rep = (await adminB.get('/reports/summary')).data;
  assert.equal(rep.tickets.opened, 0);
  const audit = (await adminB.get('/settings/audit')).data.entries;
  assert.ok(audit.every((e) => e.action !== 'login' || e.user_name === 'Admin B'));
  // A empresa A continua vendo os seus
  assert.equal((await adminA.get('/customers')).data.customers.length, 1);
});

test('acesso direto por id a registros de outra empresa responde como inexistente', async () => {
  assert.equal((await adminB.get(`/customers/${A.customer.id}`)).status, 404);
  assert.equal((await adminB.get(`/tickets/${A.ticket.id}`)).status, 404);
  assert.equal((await adminB.get(`/opportunities/${A.opportunity.id}`)).status, 404);
  assert.equal((await adminB.put(`/customers/${A.customer.id}`, { city: 'Invadida', version: 1 })).status, 404);
  assert.equal((await adminB.put(`/tasks/${A.task.id}`, { done: true })).status, 404);
  assert.equal((await adminB.post(`/tickets/${A.ticket.id}/claim`)).status, 404);
  // Nada foi alterado na empresa A
  const c = (await adminA.get(`/customers/${A.customer.id}`)).data.customer;
  assert.notEqual(c.city, 'Invadida');
});

test('não é possível criar registros apontando para dados de outra empresa', async () => {
  const t = await adminB.post('/tickets', { customer_id: A.customer.id, subject: 'Tentativa', channel: 'WhatsApp' });
  assert.ok(t.status >= 400 && t.status < 500, `ticket: ${t.status}`);
  const o = await adminB.post('/opportunities', { title: 'Tentativa', customer_id: A.customer.id });
  assert.ok(o.status >= 400 && o.status < 500, `oportunidade: ${o.status}`);
  const k = await adminB.post('/tasks', { title: 'Tentativa', customer_id: A.customer.id });
  assert.ok(k.status >= 400 && k.status < 500, `tarefa: ${k.status}`);
  // Oportunidade própria não pode ir para etapa de outra empresa
  const cb = (await adminB.post('/customers', { name: 'Cliente da B' })).data.customer;
  const ob = (await adminB.post('/opportunities', { title: 'Negócio da B', customer_id: cb.id })).data.opportunity;
  const moved = await adminB.post(`/opportunities/${ob.id}/move`, { stage_id: A.stages[1].id });
  assert.ok(moved.status >= 400 && moved.status < 500, `mover: ${moved.status}`);
});

test('protocolos são numerados por empresa', async () => {
  const cb = (await adminB.get('/customers')).data.customers[0];
  const tb = (await adminB.post('/tickets', { customer_id: cb.id, subject: 'Primeiro da B', channel: 'Telefone' })).data
    .ticket;
  assert.match(tb.protocol, /-000001$/);
  assert.match(A.ticket.protocol, /-000001$/);
});

test('banco: sem contexto não há acesso, e cada contexto só enxerga a própria empresa', async () => {
  await assert.rejects(() => query('SELECT 1 FROM customers'), /sem contexto de empresa/);
  const seenByB = await runAsCompany(companyB, () => query('SELECT id FROM customers WHERE id = $1', [A.customer.id]));
  assert.equal(seenByB.rowCount, 0);
  // Gravar explicitamente com o id de outra empresa é barrado pela política de segurança
  await assert.rejects(
    () =>
      runAsCompany(companyB, () =>
        query('INSERT INTO customers (company_id, name) VALUES ($1, $2)', [companyA, 'Intrusa']),
      ),
    /row-level security/,
  );
  const total = await runAsSystem(() => query('SELECT count(*)::int AS n FROM customers'));
  assert.equal(total.rows[0].n, 2);
});

test('tempo real: eventos só chegam a usuários da mesma empresa', async () => {
  const received = { a: [], b: [] };
  const fakeRes = (bucket) => ({ writeHead() {}, write: (s) => received[bucket].push(s) });
  const closers = [];
  const fakeReq = (user) => ({ user, on: (_ev, cb) => closers.push(cb) });
  const resA = fakeRes('a');
  const resB = fakeRes('b');
  realtime.subscribe(fakeReq({ id: 1, company_id: companyA }), resA);
  realtime.subscribe(fakeReq({ id: 99, company_id: companyB }), resB);
  runAsCompany(companyA, () => realtime.broadcast('tickets_changed', { id: 1 }));
  assert.ok(received.a.some((s) => s.includes('tickets_changed')));
  assert.ok(!received.b.some((s) => s.includes('tickets_changed')));
  closers.forEach((close) => close());
});

test('empresa suspensa não consegue entrar', async () => {
  await runAsSystem(() => query("UPDATE companies SET status = 'suspended' WHERE id = $1", [companyB]));
  assert.equal((await adminB.get('/auth/me')).status, 401);
  const r = await client(base).post('/auth/login', { email: 'admin@b.com', password: 'Senha12345' });
  assert.equal(r.status, 401);
  assert.match(r.data.error, /suspensa/);
});
