'use strict';
// Evolução SaaS: dashboard, relatórios, listas com ordenação, tarefas por período, permissões por módulo e assinatura.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { pool, resetDb, startServer, client, createTestCompany, createUser } = require('./helpers');

let server, base, admin, sup, at1, at2, customerId, ticketId;
// Datas no fuso da empresa (padrão America/Sao_Paulo), como o servidor calcula
const localDay = (d = new Date()) => d.toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
const today = () => localDay();

before(async () => {
  await resetDb();
  const companyId = await createTestCompany('Empresa Teste', 'Admin', 'admin@e.com');
  await createUser(companyId, 'Gestora', 'sup@e.com', 'supervisor');
  await createUser(companyId, 'Atendente Um', 'a1@e.com', 'atendente');
  await createUser(companyId, 'Atendente Dois', 'a2@e.com', 'atendente');
  ({ server, base } = await startServer());
  [admin, sup, at1, at2] = [client(base), client(base), client(base), client(base)];
  await admin.login('admin@e.com', 'Senha12345');
  await sup.login('sup@e.com', 'Senha12345');
  await at1.login('a1@e.com', 'Senha12345');
  await at2.login('a2@e.com', 'Senha12345');
  customerId = (await at1.post('/customers', { name: 'Zeca Souza', phone: '(11) 97777-6666' })).data.customer.id;
  await at1.post('/customers', { name: 'Ana Lima' });
  ticketId = (await at1.post('/tickets', { customer_id: customerId, subject: 'Pedido atrasado', channel: 'Telefone' }))
    .data.ticket.id;
});
after(async () => {
  server.close();
  await pool.end();
});

test('dashboard: desempenho, atividade, funil e primeiros passos com dados reais', async () => {
  const d = (await admin.get('/reports/dashboard')).data;
  assert.equal(d.performance.today, 1);
  assert.equal(d.performance.month, 1);
  assert.equal(d.performance.conversion, null); // sem negócios encerrados: não inventa taxa
  assert.ok(d.activity.some((a) => a.kind === 'ticket_opened' && a.title === 'Pedido atrasado'));
  assert.ok(d.activity.some((a) => a.kind === 'customer_created' && a.title === 'Zeca Souza'));
  assert.ok(d.funnel.length >= 3);
  assert.deepEqual(d.onboarding, { company: false, users: true, customer: true, ticket: true, opportunity: false });
  // Atendente: sem ranking e sem primeiros passos; só vê o que é dele
  const a2 = (await at2.get('/reports/dashboard')).data;
  assert.deepEqual(a2.ranking, []);
  assert.equal(a2.onboarding, null);
  assert.equal(a2.performance.today, 0);
});

test('relatórios: série diária, tarefas concluídas, clientes cadastrados e filtro por cliente', async () => {
  const task = (await at1.post('/tasks', { title: 'Ligar para o Zeca', customer_id: customerId })).data.task;
  await at1.put(`/tasks/${task.id}`, { done: true });
  const r = (await admin.get(`/reports/summary?from=${today()}&to=${today()}`)).data;
  assert.equal(r.daily.length, 1);
  assert.equal(r.daily[0].opened, 1);
  assert.equal(r.totals.customers_created, 2);
  assert.equal(r.totals.tasks_done, 1);
  const none = (await admin.get(`/reports/summary?from=${today()}&to=${today()}&customer=Ana`)).data;
  assert.equal(none.tickets.opened, 0);
  // Período longo demais: sem série diária (evita consultas pesadas)
  assert.deepEqual((await admin.get('/reports/summary?from=2020-01-01&to=2026-12-31')).data.daily, []);
});

test('listas: ordenação de clientes e atendimentos, último contato e tarefas por período/busca', async () => {
  const byName = (await admin.get('/customers?sort=name')).data.customers.map((c) => c.name);
  assert.deepEqual(byName, ['Ana Lima', 'Zeca Souza']);
  const zeca = (await admin.get('/customers?sort=last_contact')).data.customers[0];
  assert.equal(zeca.name, 'Zeca Souza');
  assert.ok(zeca.last_contact_at);
  assert.equal((await admin.get('/tickets?sort=newest')).status, 200);
  const due = new Date(Date.now() + 2 * 86400000).toISOString();
  await at1.post('/tasks', { title: 'Enviar proposta', due_at: due });
  const day = localDay(new Date(due));
  const inRange = (await at1.get(`/tasks?view=all&from=${day}&to=${day}`)).data.tasks;
  assert.deepEqual(
    inRange.map((t) => t.title),
    ['Enviar proposta'],
  );
  assert.equal((await at1.get('/tasks?q=proposta')).data.tasks.length, 1);
  // Perfil do cliente traz o histórico das oportunidades para a linha do tempo
  assert.ok(Array.isArray((await admin.get(`/customers/${customerId}`)).data.opportunity_events));
});

test('permissões por módulo: só o administrador altera; módulo desligado some e é bloqueado', async () => {
  assert.equal((await sup.put('/settings/permissions', { supervisor: {}, atendente: {} })).status, 403);
  const r = await admin.put('/settings/permissions', {
    supervisor: { reports: false },
    atendente: { inbox: false, pipeline: false },
  });
  assert.equal(r.status, 200);
  assert.equal((await admin.get('/settings/permissions')).data.permissions.atendente.inbox, false);
  const me = (await at1.get('/auth/me')).data.company.permissions;
  assert.equal(me.atendente.pipeline, false);
  assert.equal((await at1.get('/inbox/conversations')).status, 403);
  assert.equal((await at1.get('/opportunities')).status, 403);
  assert.equal((await sup.get('/reports/export.csv')).status, 403);
  // Quem tem acesso continua usando normalmente
  assert.equal((await sup.get('/opportunities')).status, 200);
  assert.equal((await admin.get('/inbox/conversations')).status, 200);
  assert.equal((await at1.get(`/tickets/${ticketId}`)).status, 200);
  // Voltando ao padrão, tudo liberado de novo
  await admin.put('/settings/permissions', { supervisor: {}, atendente: {} });
  assert.equal((await at1.get('/inbox/conversations')).status, 200);
});

test('assinatura: plano Profissional por R$ 49,90 e consumo da empresa', async () => {
  const b = (await admin.get('/billing')).data;
  const pro = b.plans.find((p) => p.id === 'profissional');
  assert.equal(pro.price_cents, 4990);
  assert.ok(!b.plans.some((p) => p.id === 'basico' && p.public));
  assert.equal(b.usage.customers, 2);
  assert.equal(b.usage.tickets_month, 1);
  assert.equal(b.usage.users, 4);
});

test('páginas e scripts são sempre revalidados (atualizações aparecem sem limpar o cache)', async () => {
  assert.equal((await fetch(`${base}/`)).headers.get('cache-control'), 'no-cache');
  assert.equal((await fetch(`${base}/js/app.js`)).headers.get('cache-control'), 'no-cache');
});
