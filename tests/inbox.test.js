'use strict';
// Caixa de entrada do WhatsApp contra um servidor falso da API da Meta (Graph API).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const crypto = require('crypto');
const { pool, resetDb, startServer, client, createTestCompany, createUser } = require('./helpers');
const { query, runAsSystem } = require('../src/db');
const config = require('../src/config');

const GOOD_TOKEN = 'token-valido-da-meta-0123456789';
const APP_SECRET = 'segredo-do-app-meta-123';
const sent = []; // mensagens recebidas pelo servidor falso

// ---------- Servidor falso da Meta ----------
let graph;
function startGraphMock() {
  return new Promise((resolve) => {
    graph = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        const url = new URL(req.url, 'http://x');
        const auth = req.headers.authorization || '';
        const json = (status, data) => {
          res.writeHead(status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        };
        if (url.pathname.startsWith('/download/')) {
          const id = url.pathname.split('/')[2];
          res.writeHead(200, { 'Content-Type': id === 'media-html' ? 'text/html' : 'image/jpeg' });
          return res.end(id === 'media-html' ? '<script>alert(1)</script>' : Buffer.from([0xff, 0xd8, 0xff]));
        }
        if (auth !== `Bearer ${GOOD_TOKEN}`)
          return json(401, { error: { message: 'Invalid OAuth access token', code: 190 } });
        const parts = url.pathname.split('/').filter(Boolean);
        if (req.method === 'GET' && parts.length === 1 && parts[0].startsWith('media-')) {
          const base = `http://127.0.0.1:${graph.address().port}`;
          return json(200, {
            url: `${base}/download/${parts[0]}`,
            mime_type: parts[0] === 'media-html' ? 'text/html' : 'image/jpeg',
          });
        }
        if (req.method === 'GET' && parts.length === 1)
          return json(200, { display_phone_number: '+55 11 4000-0000', verified_name: 'Loja Teste', id: parts[0] });
        if (req.method === 'GET' && parts[1] === 'message_templates')
          return json(200, {
            data: [
              {
                name: 'boas_vindas',
                language: 'pt_BR',
                status: 'APPROVED',
                category: 'MARKETING',
                components: [{ type: 'BODY', text: 'Olá {{1}}, tudo bem?' }],
              },
              { name: 'rascunho', language: 'pt_BR', status: 'PENDING', components: [] },
            ],
          });
        if (req.method === 'POST' && parts[1] === 'messages') {
          const payload = JSON.parse(body);
          if (payload.to === '5599999999999')
            return json(400, { error: { message: 'Recipient phone number not in allowed list', code: 131030 } });
          sent.push(payload);
          return json(200, { messages: [{ id: `wamid.OUT${sent.length}` }] });
        }
        json(404, { error: { message: 'not found' } });
      });
    });
    graph.listen(0, () => resolve(`http://127.0.0.1:${graph.address().port}`));
  });
}

// ---------- Utilidades ----------
let server, base, admin, sup, at1, at2, channel, adminB;

async function webhook(key, value, { secret = APP_SECRET } = {}) {
  const raw = JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [{ changes: [{ field: 'messages', value }] }],
  });
  const sig = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');
  return fetch(`${base}/api/webhooks/whatsapp/${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': sig },
    body: raw,
  });
}
const inbound = (from, id, extra = {}) => ({
  metadata: { phone_number_id: '1111111111' },
  contacts: [{ wa_id: from, profile: { name: extra.name || 'Maria Cliente' } }],
  messages: [
    { from, id, timestamp: String(Math.floor(Date.now() / 1000)), type: 'text', text: { body: 'Oi' }, ...extra.msg },
  ],
});
async function waitFor(fn, ms = 3000) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error('tempo esgotado aguardando condição');
    await new Promise((r) => setTimeout(r, 50));
  }
}
const findConv = async (c, phone) =>
  (await c.get('/inbox/conversations?status=all')).data.conversations.find((x) => x.contact_phone === phone);

before(async () => {
  config.whatsapp.graphUrl = await startGraphMock();
  await resetDb();
  const companyId = await createTestCompany('Loja', 'Admin', 'admin@loja.com');
  await createUser(companyId, 'Supervisora', 'sup@loja.com', 'supervisor');
  await createUser(companyId, 'Atendente Um', 'a1@loja.com', 'atendente');
  await createUser(companyId, 'Atendente Dois', 'a2@loja.com', 'atendente');
  await createTestCompany('Outra Empresa', 'Admin B', 'admin@outra.com');
  ({ server, base } = await startServer());
  [admin, sup, at1, at2, adminB] = [client(base), client(base), client(base), client(base), client(base)];
  await admin.login('admin@loja.com', 'Senha12345');
  await sup.login('sup@loja.com', 'Senha12345');
  await at1.login('a1@loja.com', 'Senha12345');
  await at2.login('a2@loja.com', 'Senha12345');
  await adminB.login('admin@outra.com', 'Senha12345');
});
after(async () => {
  server.close();
  graph.close();
  await pool.end();
});

test('conectar WhatsApp: valida o token na Meta e protege os segredos', async () => {
  const body = { name: 'Vendas', access_token: 'token-errado-0123456789abc', phone_number_id: '1111111111' };
  const bad = await admin.post('/channels', body);
  assert.equal(bad.status, 502);
  assert.match(bad.data.error, /Invalid OAuth/);
  assert.equal((await at1.post('/channels', { ...body, access_token: GOOD_TOKEN })).status, 403);

  const r = await admin.post('/channels', {
    ...body,
    access_token: GOOD_TOKEN,
    waba_id: '2222222222',
    app_secret: APP_SECRET,
  });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  channel = r.data.channel;
  assert.equal(channel.display_phone, '+55 11 4000-0000');
  assert.match(channel.webhook_url, /\/api\/webhooks\/whatsapp\/[\w-]{20,}$/);
  assert.ok(channel.verify_token);
  assert.equal(channel.access_token, undefined);
  channel.key = channel.webhook_url.split('/').pop();
  // Atendente vê o canal, mas não os dados de configuração
  const seen = (await at1.get('/channels')).data.channels[0];
  assert.equal(seen.verify_token, undefined);
  assert.equal(seen.webhook_url, undefined);
  // Token gravado criptografado
  const stored = (await runAsSystem(() => query('SELECT access_token_enc FROM channels'))).rows[0].access_token_enc;
  assert.ok(!stored.includes(GOOD_TOKEN));
  // O mesmo número não pode ser conectado por outra empresa
  const dup = await adminB.post('/channels', { ...body, access_token: GOOD_TOKEN });
  assert.equal(dup.status, 409);
});

test('webhook: verificação da Meta e assinatura obrigatória', async () => {
  const v = await fetch(
    `${base}/api/webhooks/whatsapp/${channel.key}?hub.mode=subscribe&hub.verify_token=${channel.verify_token}&hub.challenge=123`,
  );
  assert.equal(v.status, 200);
  assert.equal(await v.text(), '123');
  const wrong = await fetch(`${base}/api/webhooks/whatsapp/${channel.key}?hub.mode=subscribe&hub.verify_token=x`);
  assert.equal(wrong.status, 403);
  const forged = await webhook(channel.key, inbound('5511911112222', 'wamid.FORJADA'), { secret: 'outro' });
  assert.equal(forged.status, 401);
  await new Promise((r) => setTimeout(r, 200));
  assert.equal(await findConv(admin, '5511911112222'), undefined);
});

test('mensagem de contato novo cria cliente, conversa e oportunidade no funil (sem duplicar)', async () => {
  assert.equal((await webhook(channel.key, inbound('5511987654321', 'wamid.IN1'))).status, 200);
  const conv = await waitFor(() => findConv(admin, '5511987654321'));
  assert.equal(conv.unread_count, 1);
  assert.equal(conv.contact_name, 'Maria Cliente');
  assert.equal(conv.window_open, true);
  assert.equal(conv.stage_name, 'Novo contato');
  assert.match(conv.opportunity_title, /WhatsApp — Maria Cliente/);
  const cust = (await admin.get(`/customers/${conv.customer_id}`)).data;
  assert.equal(cust.customer.source, 'WhatsApp');
  assert.equal(cust.conversations[0].id, conv.id);
  // Reenvio do mesmo evento pela Meta não duplica
  await webhook(channel.key, inbound('5511987654321', 'wamid.IN1'));
  await webhook(channel.key, inbound('5511987654321', 'wamid.IN2', { msg: { text: { body: 'Quero orçamento' } } }));
  const detail = await waitFor(async () => {
    const d = (await admin.get(`/inbox/conversations/${conv.id}`)).data;
    return d.messages.length === 2 ? d : null;
  });
  assert.deepEqual(
    detail.messages.map((m) => m.body),
    ['Oi', 'Quero orçamento'],
  );
  assert.equal((await admin.get('/opportunities')).status, 200);
});

test('celular brasileiro sem o 9 extra é ligado ao cliente já cadastrado', async () => {
  const c = (await admin.post('/customers', { name: 'João Cadastrado', phone: '(21) 98888-7777' })).data.customer;
  await webhook(channel.key, inbound('552188887777', 'wamid.BR1', { name: 'Joao' }));
  const conv = await waitFor(() => findConv(admin, '552188887777'));
  assert.equal(conv.customer_id, c.id);
});

test('atendentes: fila compartilhada, quem responde assume, e escopo por responsável', async () => {
  const conv = await findConv(admin, '5511987654321');
  assert.ok(await findConv(at1, '5511987654321'), 'sem responsável aparece para todos os atendentes');
  const r = await at1.post(`/inbox/conversations/${conv.id}/messages`, { body: 'Olá! Como posso ajudar?' });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const after = (await admin.get(`/inbox/conversations/${conv.id}`)).data.conversation;
  assert.equal(after.assignee_name, 'Atendente Um');
  assert.equal((await at2.get(`/inbox/conversations/${conv.id}`)).status, 404);
  // Atendente não transfere para outra pessoa; supervisor pode
  assert.equal((await at1.put(`/inbox/conversations/${conv.id}/assign`, { assignee_id: 4 })).status, 403);
  assert.equal((await sup.put(`/inbox/conversations/${conv.id}/assign`, { assignee_id: 3 })).status, 200);
});

test('envio pela API oficial e status de entrega (sem regredir)', async () => {
  const conv = await findConv(admin, '5511987654321');
  const last = sent[sent.length - 1];
  assert.equal(last.to, '5511987654321');
  assert.deepEqual(last.text, { body: 'Olá! Como posso ajudar?' });
  const statuses = (id, status) => ({ metadata: { phone_number_id: '1111111111' }, statuses: [{ id, status }] });
  const out = (await admin.get(`/inbox/conversations/${conv.id}`)).data.messages.find((m) => m.direction === 'out');
  assert.equal(out.status, 'sent');
  await webhook(channel.key, statuses('wamid.OUT1', 'read'));
  await webhook(channel.key, statuses('wamid.OUT1', 'delivered'));
  await waitFor(async () => {
    const m = (await admin.get(`/inbox/conversations/${conv.id}`)).data.messages.find((x) => x.id === out.id);
    return m.status === 'read';
  });
  await new Promise((r) => setTimeout(r, 150));
  const m = (await admin.get(`/inbox/conversations/${conv.id}`)).data.messages.find((x) => x.id === out.id);
  assert.equal(m.status, 'read');
});

test('fora da janela de 24h só vão modelos aprovados', async () => {
  const conv = await findConv(admin, '5511987654321');
  await runAsSystem(() =>
    query(`UPDATE conversations SET last_inbound_at = now() - interval '25 hours' WHERE id = $1`, [conv.id]),
  );
  const r = await admin.post(`/inbox/conversations/${conv.id}/messages`, { body: 'Oi de novo' });
  assert.equal(r.status, 409);
  assert.equal(r.data.requires_template, true);
  const t = (await admin.get(`/inbox/conversations/${conv.id}/templates`)).data.templates;
  assert.deepEqual(
    t.map((x) => [x.name, x.params]),
    [['boas_vindas', 1]],
  );
  const s = await admin.post(`/inbox/conversations/${conv.id}/template`, {
    name: 'boas_vindas',
    language: 'pt_BR',
    params: ['Maria'],
    preview: 'Olá Maria, tudo bem?',
  });
  assert.equal(s.status, 201, JSON.stringify(s.data));
  const last = sent[sent.length - 1];
  assert.equal(last.type, 'template');
  assert.equal(last.template.name, 'boas_vindas');
  assert.deepEqual(last.template.components[0].parameters, [{ type: 'text', text: 'Maria' }]);
});

test('falha da Meta fica registrada na mensagem e anotações internas nunca são enviadas', async () => {
  const cust = (await admin.post('/customers', { name: 'Número Bloqueado', phone: '5599999999999' })).data.customer;
  const conv = (await admin.post('/inbox/conversations', { customer_id: cust.id })).data.conversation;
  const r = await admin.post(`/inbox/conversations/${conv.id}/template`, { name: 'boas_vindas', language: 'pt_BR' });
  assert.equal(r.status, 502);
  assert.match(r.data.error, /not in allowed list/);
  const msgs = (await admin.get(`/inbox/conversations/${conv.id}`)).data.messages;
  assert.equal(msgs[0].status, 'failed');
  const before = sent.length;
  assert.equal((await admin.post(`/inbox/conversations/${conv.id}/notes`, { body: 'Cliente VIP' })).status, 201);
  assert.equal(sent.length, before);
});

test('mídias: baixadas da Meta sob demanda; formatos perigosos só como download', async () => {
  const img = inbound('5511955554444', 'wamid.IMG', {
    msg: { type: 'image', image: { id: 'media-foto', mime_type: 'image/jpeg', caption: 'Foto do produto' } },
  });
  await webhook(channel.key, img);
  const html = inbound('5511955554444', 'wamid.DOC', {
    msg: { type: 'document', document: { id: 'media-html', mime_type: 'text/html', filename: 'x.html' } },
  });
  await webhook(channel.key, html);
  const conv = await waitFor(() => findConv(admin, '5511955554444'));
  const msgs = await waitFor(async () => {
    const m = (await admin.get(`/inbox/conversations/${conv.id}`)).data.messages;
    return m.length === 2 ? m : null;
  });
  assert.equal(msgs[0].body, 'Foto do produto');
  const photo = await admin.raw(`/inbox/messages/${msgs[0].id}/media`);
  assert.equal(photo.headers.get('content-type'), 'image/jpeg');
  assert.match(photo.headers.get('content-disposition'), /^inline/);
  const doc = await admin.raw(`/inbox/messages/${msgs[1].id}/media`);
  assert.equal(doc.headers.get('content-type'), 'application/octet-stream');
  assert.match(doc.headers.get('content-disposition'), /^attachment/);
});

test('encerrar, reabrir e nova mensagem reabre a conversa', async () => {
  const conv = await findConv(admin, '5511955554444');
  assert.equal((await admin.post(`/inbox/conversations/${conv.id}/close`)).status, 200);
  assert.equal(
    (await admin.get('/inbox/conversations')).data.conversations.some((c) => c.id === conv.id),
    false,
  );
  await webhook(channel.key, inbound('5511955554444', 'wamid.VOLTOU'));
  await waitFor(async () => (await findConv(admin, '5511955554444')).status === 'open');
});

test('respostas rápidas: gestão restrita e separadas por empresa', async () => {
  assert.equal((await at1.post('/quick-replies', { shortcut: 'ola', body: 'Olá!' })).status, 403);
  const r = await sup.post('/quick-replies', { shortcut: 'Preco', body: 'Nossa tabela de preços: ...' });
  assert.equal(r.status, 201);
  assert.equal(r.data.quick_reply.shortcut, 'preco');
  assert.equal((await sup.post('/quick-replies', { shortcut: 'preco', body: 'x' })).status, 409);
  assert.equal((await sup.post('/quick-replies', { shortcut: 'com espaço', body: 'x' })).status, 400);
  assert.equal((await at1.get('/quick-replies')).data.quick_replies.length, 1);
  assert.equal((await adminB.get('/quick-replies')).data.quick_replies.length, 0);
  assert.equal((await adminB.put(`/quick-replies/${r.data.quick_reply.id}`, { body: 'invadido' })).status, 404);
});

test('outra empresa não vê canais nem conversas', async () => {
  assert.deepEqual((await adminB.get('/channels')).data.channels, []);
  assert.deepEqual((await adminB.get('/inbox/conversations?status=all')).data.conversations, []);
  const conv = await findConv(admin, '5511987654321');
  assert.equal((await adminB.get(`/inbox/conversations/${conv.id}`)).status, 404);
  assert.equal((await adminB.post(`/inbox/conversations/${conv.id}/notes`, { body: 'x' })).status, 404);
});

test('canal desconectado não envia nem recebe', async () => {
  assert.equal((await admin.post(`/channels/${channel.id}/disconnect`)).status, 200);
  const conv = await findConv(admin, '5511955554444');
  const r = await admin.post(`/inbox/conversations/${conv.id}/messages`, { body: 'teste' });
  assert.equal(r.status, 409);
  assert.match(r.data.error, /desconectado/);
  await webhook(channel.key, inbound('5511900000001', 'wamid.IGNORADA'));
  await new Promise((res) => setTimeout(res, 200));
  assert.equal(await findConv(admin, '5511900000001'), undefined);
  // Reconectar com novo token volta a funcionar
  const re = await admin.put(`/channels/${channel.id}`, { access_token: GOOD_TOKEN });
  assert.equal(re.status, 200);
  assert.equal(re.data.channel.status, 'connected');
});
