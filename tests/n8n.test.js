'use strict';
// Testes do canal de integração com o n8n. Sobe um servidor local que faz o papel
// do nó Webhook do n8n, para verificar o envio assinado sem depender da rede.
const http = require('http');
const crypto = require('crypto');
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');

const API_KEY = 'chave-de-teste-0123456789abcdef0123';
const SECRET = 'segredo-de-assinatura-do-n8n';

// As variáveis precisam existir antes de src/config ser carregado (via helpers).
const FAKE_PORT = 45000 + Math.floor(Math.random() * 2000);
process.env.N8N_API_KEY = API_KEY;
process.env.N8N_WEBHOOK_SECRET = SECRET;
process.env.N8N_TIMEOUT_MS = '3000';
process.env.N8N_WEBHOOK_URL = `http://127.0.0.1:${FAKE_PORT}/webhook/crm`;

// helpers carrega src/config: as variáveis acima precisam estar definidas antes.
const { pool, resetDb, startServer, client, createUser } = require('./helpers');

let fake, fakeCalls = [], fakeStatus = 200, fakeBody = { recebido: true };
let server, base, admin, atendente;

// Servidor local que faz o papel do nó Webhook do n8n.
before(async () => {
  fake = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      fakeCalls.push({ headers: req.headers, body });
      res.writeHead(fakeStatus, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(fakeBody));
    });
  });
  await new Promise((resolve) => fake.listen(FAKE_PORT, '127.0.0.1', resolve));
  await resetDb();
  await createUser('Admin', 'admin@n8n.com', 'admin');
  await createUser('Atendente', 'at@n8n.com', 'atendente');
  ({ server, base } = await startServer());
  admin = client(base); atendente = client(base);
  await admin.login('admin@n8n.com', 'Senha12345');
  await atendente.login('at@n8n.com', 'Senha12345');
});
after(async () => { server.close(); fake.close(); await pool.end(); });

const inbound = (event, body, headers = {}) => fetch(`${base}/api/n8n/inbound/${event}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
});

test('status: descreve os dois sentidos sem expor a chave', async () => {
  const r = await admin.get('/n8n/status');
  assert.equal(r.status, 200);
  assert.equal(r.data.connected, true);
  assert.equal(r.data.inbound.configured, true);
  assert.equal(r.data.outbound.signed, true);
  assert.equal(JSON.stringify(r.data).includes(API_KEY), false);
  assert.equal(JSON.stringify(r.data).includes(SECRET), false);
  const anon = client(base);
  assert.equal((await anon.get('/n8n/status')).status, 401);
});

test('entrada: exige chave válida e dispensa o cabeçalho de proteção CSRF', async () => {
  assert.equal((await inbound('fornecedores.lista', { a: 1 })).status, 401);
  assert.equal((await inbound('fornecedores.lista', { a: 1 }, { 'X-API-Key': 'errada-mas-do-mesmo-tamanho-123456' })).status, 401);
  const ok = await inbound('fornecedores.lista', { a: 1 }, { 'X-API-Key': API_KEY });
  assert.equal(ok.status, 202); // sem X-Requested-With: o webhook é isento
  // Authorization: Bearer também é aceito
  assert.equal((await inbound('fornecedores.lista', { a: 1 }, { Authorization: `Bearer ${API_KEY}` })).status, 202);
});

test('entrada: registra a lista recebida com a contagem de itens', async () => {
  const fornecedores = [
    { nome: 'Aço Forte Ltda', cnpj: '11222333000181', email: 'vendas@acoforte.com' },
    { nome: 'Parafusos União', cnpj: '22333444000199', email: 'cotacao@uniao.com' },
    { nome: 'Metal Sul', cnpj: '33444555000155', email: 'comercial@metalsul.com' },
  ];
  const res = await inbound('fornecedores.lista', { fornecedores }, { 'X-API-Key': API_KEY });
  const data = await res.json();
  assert.equal(res.status, 202);
  assert.equal(data.items, 3);
  assert.ok(data.delivery_id);

  const log = await admin.get(`/n8n/events/${data.delivery_id}`);
  assert.equal(log.status, 200);
  assert.equal(log.data.event.direction, 'entrada');
  assert.equal(log.data.event.status, 'ok');
  assert.equal(log.data.event.payload.fornecedores[1].nome, 'Parafusos União');

  // Lista na raiz também é contada
  const raiz = await inbound('fornecedores.lista', fornecedores, { 'X-API-Key': API_KEY });
  assert.equal((await raiz.json()).items, 3);
});

test('entrada: recusa nome de evento inválido e corpo que não é objeto', async () => {
  assert.equal((await inbound('Evento Com Espaço', { a: 1 }, { 'X-API-Key': API_KEY })).status, 400);
  const escalar = await fetch(`${base}/api/n8n/inbound/teste`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Key': API_KEY }, body: '"apenas-texto"',
  });
  assert.equal(escalar.status, 400);
});

test('ping: confere a chave a partir do n8n', async () => {
  const bad = await fetch(`${base}/api/n8n/ping`);
  assert.equal(bad.status, 401);
  const ok = await fetch(`${base}/api/n8n/ping`, { headers: { 'X-API-Key': API_KEY } });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).ok, true);
});

test('saída: envia evento assinado ao n8n e registra a entrega', async () => {
  fakeCalls = [];
  const r = await admin.post('/n8n/test', { event: 'cotacao.teste', data: { pedido: 42 } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.delivery.status, 'ok');
  assert.equal(r.data.delivery.http_status, 200);

  assert.equal(fakeCalls.length, 1);
  const call = fakeCalls[0];
  assert.equal(call.headers['x-crm-event'], 'cotacao.teste');
  const esperado = 'sha256=' + crypto.createHmac('sha256', SECRET).update(call.body).digest('hex');
  assert.equal(call.headers['x-crm-signature'], esperado);
  const enviado = JSON.parse(call.body);
  assert.equal(enviado.data.pedido, 42);
  assert.equal(enviado.data.disparado_por.nome, 'Admin');

  // Atendente não dispara testes
  assert.equal((await atendente.post('/n8n/test', {})).status, 403);
  assert.equal((await atendente.get('/n8n/events')).status, 403);
});

test('saída: erro do n8n vira 502 e fica registrado como erro', async () => {
  fakeStatus = 500;
  const r = await admin.post('/n8n/test', { event: 'cotacao.falha' });
  fakeStatus = 200;
  assert.equal(r.status, 502);
  const log = await admin.get('/n8n/events?direction=saida&event=cotacao.falha');
  assert.equal(log.data.events[0].status, 'erro');
  assert.equal(log.data.events[0].http_status, 500);
});

test('log: lista as trocas mais recentes primeiro e filtra por sentido', async () => {
  const r = await admin.get('/n8n/events?limit=100');
  assert.equal(r.status, 200);
  assert.ok(r.data.events.length >= 5);
  assert.ok(r.data.events[0].id > r.data.events[1].id);
  const so_entrada = await admin.get('/n8n/events?direction=entrada');
  assert.ok(so_entrada.data.events.every((e) => e.direction === 'entrada'));
});

test('busca de fornecedores: repassa os filtros ao n8n e normaliza a resposta', async () => {
  fakeCalls = [];
  // Formato "difícil": itens embrulhados em {json:...} e nomes de campo variados.
  fakeBody = { data: [
    { json: { Nome: 'Elétrica Central', categoria: 'Material elétrico', Telefone: '(11) 3333-4444', City: 'São Paulo', neighborhood: 'Mooca', website: 'https://eletricacentral.com.br' } },
    { json: { razao_social: 'Luz & Cia', segmento: 'Material elétrico', whatsapp: '11999998888', email: 'vendas@luzecia.com', cidade: 'São Paulo', bairro: 'Mooca' } },
    { json: { observacao: 'linha sem nome nem contato — deve ser descartada' } },
  ] };
  const r = await atendente.post('/n8n/fornecedores/buscar', { nicho: 'material elétrico', cidade: 'São Paulo', bairro: 'Mooca' });
  fakeBody = { recebido: true };
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.formato_reconhecido, true);
  assert.equal(r.data.total, 2);

  const [a, b] = r.data.fornecedores;
  assert.equal(a.nome, 'Elétrica Central');
  assert.equal(a.nicho, 'Material elétrico');
  assert.equal(a.telefone, '(11) 3333-4444');
  assert.equal(a.cidade, 'São Paulo');
  assert.equal(a.bairro, 'Mooca');
  assert.equal(a.site, 'https://eletricacentral.com.br');
  assert.equal(b.nome, 'Luz & Cia');
  assert.equal(b.telefone, '11999998888');
  assert.equal(b.email, 'vendas@luzecia.com');

  // O fluxo do n8n recebe os filtros e quem pesquisou
  const enviado = JSON.parse(fakeCalls[0].body);
  assert.equal(enviado.event, 'fornecedores.buscar');
  assert.equal(enviado.data.nicho, 'material elétrico');
  assert.equal(enviado.data.cidade, 'São Paulo');
  assert.equal(enviado.data.bairro, 'Mooca');
  assert.equal(enviado.data.nome, null);
  assert.equal(enviado.data.solicitado_por.nome, 'Atendente');
});

test('busca de fornecedores: lista na raiz e objeto único também são aceitos', async () => {
  fakeBody = [{ nome: 'Metal Sul', telefone: '5199999000' }];
  let r = await atendente.post('/n8n/fornecedores/buscar', { nome: 'Metal' });
  assert.equal(r.data.total, 1);
  assert.equal(r.data.fornecedores[0].nome, 'Metal Sul');

  fakeBody = { nome: 'Fornecedor Único', cidade: 'Curitiba' };
  r = await atendente.post('/n8n/fornecedores/buscar', { cidade: 'Curitiba' });
  assert.equal(r.data.total, 1);
  assert.equal(r.data.fornecedores[0].cidade, 'Curitiba');
  fakeBody = { recebido: true };
});

test('busca de fornecedores: exige um filtro e avisa quando o formato não é reconhecido', async () => {
  const vazio = await atendente.post('/n8n/fornecedores/buscar', { nicho: '  ' });
  assert.equal(vazio.status, 400);

  fakeBody = { status: 'em processamento' };
  const r = await atendente.post('/n8n/fornecedores/buscar', { nicho: 'elétrica' });
  fakeBody = { recebido: true };
  assert.equal(r.status, 200);
  assert.equal(r.data.formato_reconhecido, false);
  assert.equal(r.data.total, 0);
  assert.match(r.data.message, /Respond to Webhook/);
});

test('busca de fornecedores: falha do n8n vira 502 e fica no log', async () => {
  fakeStatus = 502;
  const r = await atendente.post('/n8n/fornecedores/buscar', { nicho: 'elétrica' });
  fakeStatus = 200;
  assert.equal(r.status, 502);
  const log = await admin.get('/n8n/events?direction=saida&event=fornecedores.buscar&limit=1');
  assert.equal(log.data.events[0].status, 'erro');
});
