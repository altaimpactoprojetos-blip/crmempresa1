'use strict';
// Planos, limites, bloqueio por falta de pagamento, cobrança (Asaas falso) e painel do dono da plataforma.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const bcrypt = require('bcryptjs');
const { pool, resetDb, startServer, client, createTestCompany, createUser } = require('./helpers');
const { query, runAsSystem, runAsCompany } = require('../src/db');
const config = require('../src/config');

const WEBHOOK_TOKEN = 'token-do-webhook-asaas-123';
const calls = [];
let asaas, server, base, admin, at1, owner, other, companyId, otherId;

function startAsaasMock() {
  return new Promise((resolve) => {
    asaas = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        const json = (s, d) => {
          res.writeHead(s, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(d));
        };
        if (req.headers.access_token !== 'chave-asaas')
          return json(401, { errors: [{ description: 'Chave inválida' }] });
        calls.push({ method: req.method, path: req.url, body: body ? JSON.parse(body) : null });
        if (req.method === 'POST' && req.url === '/customers') return json(200, { id: 'cus_1' });
        if (req.method === 'PUT' && req.url.startsWith('/customers/')) return json(200, { id: 'cus_1' });
        if (req.method === 'POST' && req.url === '/subscriptions') return json(200, { id: 'sub_1' });
        if (req.method === 'PUT' && req.url === '/subscriptions/sub_1') return json(200, { id: 'sub_1' });
        if (req.method === 'DELETE' && req.url === '/subscriptions/sub_1') return json(200, { deleted: true });
        if (req.url === '/subscriptions/sub_1/payments')
          return json(200, {
            data: [
              {
                id: 'pay_1',
                customer: 'cus_1',
                status: 'PENDING',
                value: 197,
                dueDate: '2026-09-23',
                invoiceUrl: 'https://asaas.test/i/pay_1',
                billingType: 'UNDEFINED',
              },
            ],
          });
        json(404, { errors: [{ description: 'não encontrado' }] });
      });
    });
    asaas.listen(0, () => resolve(`http://127.0.0.1:${asaas.address().port}`));
  });
}

const hook = (body, token = WEBHOOK_TOKEN) =>
  fetch(`${base}/api/webhooks/asaas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'asaas-access-token': token },
    body: JSON.stringify(body),
  });
const setCompany = (sql, params = []) => runAsSystem(() => query(sql, [companyId, ...params]));

before(async () => {
  config.billing.asaasUrl = await startAsaasMock();
  config.billing.webhookToken = WEBHOOK_TOKEN;
  await resetDb();
  companyId = await createTestCompany('Loja', 'Admin', 'admin@loja.com');
  await createUser(companyId, 'Atendente Um', 'a1@loja.com', 'atendente');
  otherId = await createTestCompany('Outra', 'Admin B', 'admin@outra.com');
  await runAsSystem(async () =>
    query(`INSERT INTO platform_admins (name, email, password_hash) VALUES ('Dono', 'dono@plataforma.com', $1)`, [
      await bcrypt.hash('SenhaDoDono123', 4),
    ]),
  );
  ({ server, base } = await startServer());
  [admin, at1, owner, other] = [client(base), client(base), client(base), client(base)];
  await admin.login('admin@loja.com', 'Senha12345');
  await at1.login('a1@loja.com', 'Senha12345');
  await other.login('admin@outra.com', 'Senha12345');
});
after(async () => {
  server.close();
  asaas.close();
  await pool.end();
});

test('limites do plano: usuários, canais e recursos', async () => {
  await setCompany(`UPDATE companies SET plan = 'basico' WHERE id = $1`);
  const u = (email) => admin.post('/users', { name: 'Novo Usuário', email, role: 'atendente', password: 'Senha12345' });
  assert.equal((await u('n1@loja.com')).status, 201); // 3 de 3
  const over = await u('n2@loja.com');
  assert.equal(over.status, 402);
  assert.match(over.data.error, /até 3 usuário/);
  // Canal: o plano Básico permite 1
  await setCompany(
    `INSERT INTO channels (company_id, type, name, status) VALUES ($1, 'whatsapp_web', 'Loja', 'connected')`,
  );
  const ch = await admin.post('/channels/web', { name: 'Outro' });
  assert.equal(ch.status, 402);
  assert.equal(ch.data.limit, 'channels');
  // Recursos fora do plano
  const stage = (await admin.get('/pipelines')).data.pipelines[0].stages[0].id;
  const aut = await admin.post('/automations', {
    name: 'Teste',
    stage_id: stage,
    actions: [{ type: 'add_tag', tag: 'x' }],
  });
  assert.equal(aut.status, 402);
  assert.match(aut.data.error, /Automações do funil não está incluído/);
  const bot = (await admin.get('/chatbot')).data;
  assert.equal((await admin.put('/chatbot', { enabled: true, config: bot.config })).status, 402);
  assert.equal((await admin.put('/chatbot', { enabled: false, config: bot.config })).status, 200);
  // Uso aparece na tela de assinatura
  const b = (await admin.get('/billing')).data;
  assert.deepEqual(b.usage, { users: 3, channels: 1 });
  assert.equal(b.company.plan, 'basico');
  assert.ok(b.plans.some((p) => p.id === 'profissional'));
  assert.ok(!b.plans.some((p) => p.id === 'interno'));
});

test('teste encerrado: só a tela de assinatura continua liberada', async () => {
  await setCompany(`UPDATE companies SET status = 'trial', trial_ends_at = now() - interval '1 day' WHERE id = $1`);
  const r = await admin.get('/customers');
  assert.equal(r.status, 402);
  assert.equal(r.data.billing_blocked, true);
  assert.equal(r.data.reason, 'trial_ended');
  assert.equal((await at1.post('/customers', { name: 'Cliente X' })).status, 402);
  assert.equal((await admin.get('/auth/me')).data.company.billing_block, 'trial_ended');
  assert.equal((await admin.get('/billing')).status, 200);
  assert.equal((await admin.get('/settings')).status, 200);
  assert.equal((await admin.put('/settings', { name: 'X' })).status, 402);
  // Outra empresa não é afetada
  assert.equal((await other.get('/customers')).status, 200);
});

test('assinar: sem Asaas configurado orienta a falar com o suporte', async () => {
  config.billing.enabled = false;
  const r = await admin.post('/billing/subscribe', {
    plan_id: 'profissional',
    document: '11144477735',
    email: 'fin@loja.com',
  });
  assert.equal(r.status, 409);
  config.billing.enabled = true;
  config.billing.asaasApiKey = 'chave-asaas';
});

test('assinar: cria cliente e assinatura no Asaas e devolve o link de pagamento', async () => {
  assert.equal(
    (await at1.post('/billing/subscribe', { plan_id: 'profissional', document: '11144477735', email: 'f@l.com' }))
      .status,
    403,
  );
  const bad = await admin.post('/billing/subscribe', {
    plan_id: 'profissional',
    document: '11111111111',
    email: 'fin@loja.com',
  });
  assert.equal(bad.status, 400);
  assert.equal(
    (await admin.post('/billing/subscribe', { plan_id: 'interno', document: '11144477735', email: 'fin@loja.com' }))
      .status,
    404,
  );
  const r = await admin.post('/billing/subscribe', {
    plan_id: 'profissional',
    document: '111.444.777-35',
    email: 'fin@loja.com',
    billing_type: 'PIX',
  });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.invoice_url, 'https://asaas.test/i/pay_1');
  const sub = calls.find((c) => c.method === 'POST' && c.path === '/subscriptions').body;
  assert.equal(sub.value, 197);
  assert.equal(sub.cycle, 'MONTHLY');
  assert.equal(sub.customer, 'cus_1');
  assert.equal(calls.find((c) => c.path === '/customers').body.cpfCnpj, '11144477735');
  const b = (await admin.get('/billing')).data;
  assert.equal(b.company.plan, 'profissional');
  assert.equal(b.company.has_subscription, true);
  assert.equal(b.payments[0].status, 'PENDING');
  // Continua bloqueada até o pagamento ser confirmado
  assert.equal((await admin.get('/customers')).status, 402);
});

test('webhook do Asaas: token obrigatório, pagamento libera, repetição é ignorada, atraso bloqueia', async () => {
  const paid = {
    id: 'evt_1',
    event: 'PAYMENT_RECEIVED',
    payment: {
      id: 'pay_1',
      customer: 'cus_1',
      subscription: 'sub_1',
      status: 'RECEIVED',
      value: 197,
      dueDate: '2026-09-23',
      paymentDate: '2026-09-23',
    },
  };
  assert.equal((await hook(paid, 'errado')).status, 401);
  const r = await hook(paid);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).company_id, companyId);
  const b = (await admin.get('/billing')).data;
  assert.equal(b.company.status, 'active');
  assert.equal(b.payments[0].status, 'RECEIVED');
  assert.ok(new Date(b.company.current_period_end) >= new Date('2026-10-23T00:00:00Z'));
  assert.equal((await admin.get('/customers')).status, 200);
  assert.match(JSON.stringify(await (await hook(paid)).json()), /repetido/);

  await hook({
    id: 'evt_2',
    event: 'PAYMENT_OVERDUE',
    payment: { id: 'pay_2', customer: 'cus_1', status: 'OVERDUE', value: 197, dueDate: '2026-10-23' },
  });
  assert.equal((await admin.get('/billing')).data.company.status, 'past_due');
  assert.equal((await admin.get('/customers')).status, 200); // ainda dentro da tolerância
  await setCompany(`UPDATE companies SET past_due_since = now() - interval '10 days' WHERE id = $1`);
  const blocked = await admin.get('/customers');
  assert.equal(blocked.status, 402);
  assert.equal(blocked.data.reason, 'past_due');
  // Pagou a atrasada: volta a funcionar
  await hook({
    id: 'evt_3',
    event: 'PAYMENT_CONFIRMED',
    payment: { id: 'pay_2', customer: 'cus_1', status: 'CONFIRMED', value: 197, dueDate: '2026-10-23' },
  });
  assert.equal((await admin.get('/customers')).status, 200);
});

test('cancelar a renovação', async () => {
  const r = await admin.post('/billing/cancel');
  assert.equal(r.status, 200);
  assert.ok(calls.some((c) => c.method === 'DELETE' && c.path === '/subscriptions/sub_1'));
  assert.equal((await admin.get('/billing')).data.company.has_subscription, false);
  assert.equal((await admin.get('/customers')).status, 200); // período pago continua valendo
});

test('painel da plataforma: login próprio, visão geral, suspender e prorrogar teste', async () => {
  assert.equal((await owner.get('/platform/companies')).status, 401);
  assert.equal((await admin.get('/platform/companies')).status, 401); // usuário de empresa não entra
  assert.equal((await owner.post('/platform/login', { email: 'dono@plataforma.com', password: 'errada' })).status, 401);
  const login = await owner.post('/platform/login', { email: 'dono@plataforma.com', password: 'SenhaDoDono123' });
  assert.equal(login.status, 200);
  const ov = (await owner.get('/platform/overview')).data;
  assert.equal(ov.active, 2);
  assert.equal(ov.mrr_cents, 19700); // profissional + interno (R$ 0)
  assert.equal(ov.received_month_cents >= 0, true);
  const list = (await owner.get('/platform/companies', undefined)).data.companies;
  assert.equal(list.length, 2);
  const loja = list.find((c) => c.id === companyId);
  assert.equal(loja.admin_email, 'admin@loja.com');
  assert.equal(loja.users, 3);
  assert.equal((await owner.get('/platform/companies?q=outra')).data.companies.length, 1);

  // Suspender: a sessão da empresa cai na próxima requisição
  assert.equal((await owner.put(`/platform/companies/${companyId}`, { status: 'suspended' })).status, 200);
  assert.equal((await admin.get('/customers')).status, 401);
  assert.equal(
    (await client(base).post('/auth/login', { email: 'admin@loja.com', password: 'Senha12345' })).status,
    401,
  );
  // Reativar como teste com prazo prorrogado
  const until = new Date(Date.now() + 10 * 86400000).toISOString();
  assert.equal(
    (await owner.put(`/platform/companies/${companyId}`, { status: 'trial', trial_ends_at: until, plan: 'trial' }))
      .status,
    200,
  );
  const again = client(base);
  await again.login('admin@loja.com', 'Senha12345');
  assert.equal((await again.get('/customers')).status, 200);
  assert.equal((await owner.put(`/platform/companies/${companyId}`, { plan: 'nao-existe' })).status, 400);

  const detail = (await owner.get(`/platform/companies/${companyId}`)).data;
  assert.ok(detail.payments.length >= 2);
  assert.ok(detail.log.some((l) => l.action === 'company_update'));
});

test('painel da plataforma: editar planos', async () => {
  const r = await owner.put('/platform/plans/basico', {
    name: 'Básico',
    price_cents: 8900,
    max_users: 4,
    max_channels: 1,
    features: { automations: true, chatbot: false },
    public: true,
  });
  assert.equal(r.status, 200);
  const plans = (await owner.get('/platform/plans')).data.plans;
  assert.equal(plans.find((p) => p.id === 'basico').price_cents, 8900);
  assert.equal((await owner.get('/platform/audit')).data.log[0].action, 'plan_update');
});

test('tabelas da plataforma ficam invisíveis para as empresas', async () => {
  const rows = await runAsCompany(otherId, async () => ({
    admins: (await query('SELECT * FROM platform_admins')).rowCount,
    events: (await query('SELECT * FROM billing_events')).rowCount,
    payments: (await query('SELECT * FROM payments')).rowCount,
    plans: (await query('SELECT * FROM plans')).rowCount,
  }));
  assert.deepEqual(rows, { admins: 0, events: 0, payments: 0, plans: 5 });
  // Empresa não consegue alterar planos (a política só libera escrita para a plataforma)
  const upd = await runAsCompany(otherId, () => query(`UPDATE plans SET price_cents = 1 WHERE id = 'basico'`));
  assert.equal(upd.rowCount, 0);
});
