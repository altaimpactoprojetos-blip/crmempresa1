'use strict';
// Instagram Direct e Facebook Messenger na caixa de entrada, contra um servidor falso da Meta.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { pool, resetDb, startServer, client, createTestCompany, createUser } = require('./helpers');
const { query, runAsSystem } = require('../src/db');
const config = require('../src/config');
const { TOKEN, APP_SECRET, FB_PAGE, IG_PAGE, IG_ACCOUNT, startMetaMock, metaWebhook, waitFor } = require('./metaMock');

let mock, server, base, admin, at1, adminB, fb, ig;
const findConv = async (c, key) =>
  (await c.get('/inbox/conversations?status=all')).data.conversations.find((x) => x.contact_phone === key);
const incoming = (sender, recipient, mid, message = { text: 'Oi' }, extra = {}) => ({
  sender: { id: sender },
  recipient: { id: recipient },
  timestamp: Date.now(),
  message: { mid, ...message },
  ...extra,
});

before(async () => {
  mock = await startMetaMock();
  config.whatsapp.graphUrl = mock.url;
  await resetDb();
  const companyId = await createTestCompany('Loja', 'Admin', 'admin@loja.com');
  await createUser(companyId, 'Atendente Um', 'a1@loja.com', 'atendente');
  await createTestCompany('Outra Empresa', 'Admin B', 'admin@outra.com');
  ({ server, base } = await startServer());
  [admin, at1, adminB] = [client(base), client(base), client(base)];
  await admin.login('admin@loja.com', 'Senha12345');
  await at1.login('a1@loja.com', 'Senha12345');
  await adminB.login('admin@outra.com', 'Senha12345');
});
after(async () => {
  server.close();
  mock.srv.close();
  await pool.end();
});

test('conectar Messenger e Instagram: valida a página, assina o webhook e protege o token', async () => {
  const body = {
    type: 'messenger',
    name: 'Facebook da loja',
    page_id: FB_PAGE,
    access_token: 'token-errado-0123456789abc',
  };
  const bad = await admin.post('/channels/social', body);
  assert.equal(bad.status, 502);
  assert.match(bad.data.error, /Messenger recusou/);
  assert.equal((await at1.post('/channels/social', { ...body, access_token: TOKEN })).status, 403);

  const r = await admin.post('/channels/social', { ...body, access_token: TOKEN, app_secret: APP_SECRET });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  fb = r.data.channel;
  assert.equal(fb.type, 'messenger');
  assert.match(fb.webhook_url, /\/api\/webhooks\/meta\/[\w-]{20,}$/);
  fb.key = fb.webhook_url.split('/').pop();
  assert.deepEqual(mock.subscribed, [FB_PAGE]);

  // Instagram exige conta profissional vinculada à página
  const noIg = await admin.post('/channels/social', { ...body, type: 'instagram', access_token: TOKEN });
  assert.equal(noIg.status, 400);
  assert.match(noIg.data.error, /Instagram vinculada/);
  const r2 = await admin.post('/channels/social', {
    type: 'instagram',
    name: 'Instagram',
    page_id: IG_PAGE,
    access_token: TOKEN,
    app_secret: APP_SECRET,
  });
  assert.equal(r2.status, 201);
  ig = r2.data.channel;
  assert.equal(ig.ig_account_id, IG_ACCOUNT);
  assert.equal(ig.display_phone, '@lojateste');
  ig.key = ig.webhook_url.split('/').pop();

  // Mesma página, outra empresa: recusado
  assert.equal((await adminB.post('/channels/social', { ...body, access_token: TOKEN })).status, 409);
  const stored = (await runAsSystem(() => query(`SELECT access_token_enc FROM channels WHERE type = 'messenger'`)))
    .rows[0].access_token_enc;
  assert.ok(!stored.includes(TOKEN));
  assert.equal((await at1.get('/channels')).data.channels[0].webhook_url, undefined);
});

test('webhook: verificação e assinatura obrigatória', async () => {
  const v = await fetch(
    `${base}/api/webhooks/meta/${fb.key}?hub.mode=subscribe&hub.verify_token=${fb.verify_token}&hub.challenge=77`,
  );
  assert.equal(await v.text(), '77');
  const forged = await metaWebhook(base, fb.key, 'page', FB_PAGE, [incoming('900', FB_PAGE, 'm_FORJADA')], {
    secret: 'outro',
  });
  assert.equal(forged.status, 401);
  // O webhook do WhatsApp não aceita a chave de um canal do Messenger
  const wrongKind = await fetch(`${base}/api/webhooks/meta/nao-existe`, { method: 'POST' });
  assert.equal(wrongKind.status, 404);
});

test('Messenger: contato novo vira cliente, conversa e oportunidade com o nome do perfil', async () => {
  const r = await metaWebhook(base, fb.key, 'page', FB_PAGE, [
    incoming('1001', FB_PAGE, 'm_IN1', { text: 'Olá, quero um orçamento' }),
  ]);
  assert.equal(r.status, 200);
  const conv = await waitFor(() => findConv(admin, 'fb:1001'));
  assert.equal(conv.contact_name, 'Ana Souza');
  assert.equal(conv.channel_type, 'messenger');
  assert.equal(conv.opportunity_title, 'Messenger — Ana Souza');
  const cust = (await admin.get(`/customers/${conv.customer_id}`)).data.customer;
  assert.equal(cust.source, 'Messenger');
  assert.equal(cust.phone, null);
  // Repetição do evento e evento de outra página são ignorados
  await metaWebhook(base, fb.key, 'page', FB_PAGE, [incoming('1001', FB_PAGE, 'm_IN1')]);
  await metaWebhook(base, fb.key, 'page', '999999', [incoming('1002', '999999', 'm_OUTRA')]);
  await metaWebhook(base, fb.key, 'instagram', FB_PAGE, [incoming('1003', FB_PAGE, 'm_OBJ')]);
  await new Promise((res) => setTimeout(res, 250));
  const msgs = (await admin.get(`/inbox/conversations/${conv.id}`)).data.messages;
  assert.equal(msgs.length, 1);
  assert.equal(await findConv(admin, 'fb:1002'), undefined);
  assert.equal(await findConv(admin, 'fb:1003'), undefined);
});

test('Messenger: resposta, eco da própria mensagem, entrega e leitura', async () => {
  const conv = await findConv(admin, 'fb:1001');
  const r = await admin.post(`/inbox/conversations/${conv.id}/messages`, { body: 'Claro! Qual produto?' });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const out = mock.sent.at(-1);
  assert.equal(out.page, FB_PAGE);
  assert.deepEqual(out.recipient, { id: '1001' });
  assert.equal(out.messaging_type, 'RESPONSE');
  assert.equal(out.message.text, 'Claro! Qual produto?');
  const mid = `m_OUT${mock.sent.length}`;
  // Eco do que o CRM enviou: não duplica
  await metaWebhook(base, fb.key, 'page', FB_PAGE, [
    {
      sender: { id: FB_PAGE },
      recipient: { id: '1001' },
      timestamp: Date.now(),
      message: { mid, text: 'Claro! Qual produto?', is_echo: true },
    },
  ]);
  // Mensagem enviada pelo app da página (fora do CRM) entra como enviada
  await metaWebhook(base, fb.key, 'page', FB_PAGE, [
    {
      sender: { id: FB_PAGE },
      recipient: { id: '1001' },
      timestamp: Date.now(),
      message: { mid: 'm_APP1', text: 'Enviado pelo celular', is_echo: true },
    },
  ]);
  await metaWebhook(base, fb.key, 'page', FB_PAGE, [
    { sender: { id: '1001' }, recipient: { id: FB_PAGE }, timestamp: Date.now(), delivery: { mids: [mid] } },
  ]);
  const msgs = await waitFor(async () => {
    const m = (await admin.get(`/inbox/conversations/${conv.id}`)).data.messages;
    return m.length === 3 && m.find((x) => x.body === 'Claro! Qual produto?').status === 'delivered' ? m : null;
  });
  assert.equal(msgs.filter((m) => m.body === 'Claro! Qual produto?').length, 1);
  assert.equal(msgs.find((m) => m.body === 'Enviado pelo celular').direction, 'out');
  // Leitura por "watermark": tudo o que foi enviado até ali fica lido
  await metaWebhook(base, fb.key, 'page', FB_PAGE, [
    { sender: { id: '1001' }, recipient: { id: FB_PAGE }, timestamp: Date.now(), read: { watermark: Date.now() } },
  ]);
  await waitFor(
    async () =>
      (await admin.get(`/inbox/conversations/${conv.id}`)).data.messages.find((m) => m.body === 'Claro! Qual produto?')
        .status === 'read',
  );
});

test('janela: após 24h responde como atendimento humano; após 7 dias bloqueia', async () => {
  const conv = await findConv(admin, 'fb:1001');
  await runAsSystem(() =>
    query(`UPDATE conversations SET last_inbound_at = now() - interval '3 days' WHERE id = $1`, [conv.id]),
  );
  const detail = (await admin.get(`/inbox/conversations/${conv.id}`)).data.conversation;
  assert.equal(detail.window_open, true);
  assert.equal(
    (await admin.post(`/inbox/conversations/${conv.id}/messages`, { body: 'Ainda tem interesse?' })).status,
    201,
  );
  assert.equal(mock.sent.at(-1).messaging_type, 'MESSAGE_TAG');
  assert.equal(mock.sent.at(-1).tag, 'HUMAN_AGENT');
  await runAsSystem(() =>
    query(`UPDATE conversations SET last_inbound_at = now() - interval '8 days' WHERE id = $1`, [conv.id]),
  );
  const blocked = await admin.post(`/inbox/conversations/${conv.id}/messages`, { body: 'Oi?' });
  assert.equal(blocked.status, 409);
  assert.match(blocked.data.error, /7 dias/);
  // Modelos de mensagem não existem fora da API do WhatsApp
  assert.equal((await admin.get(`/inbox/conversations/${conv.id}/templates`)).data.not_applicable, true);
});

test('Instagram: mensagem com foto (sem guardar arquivo) e nome do perfil', async () => {
  await metaWebhook(base, ig.key, 'instagram', IG_ACCOUNT, [
    incoming('2001', IG_ACCOUNT, 'ig_IN1', {
      attachments: [{ type: 'image', payload: { url: `${mock.url}/att/foto1` } }],
    }),
  ]);
  const conv = await waitFor(() => findConv(admin, 'ig:2001'));
  assert.equal(conv.contact_name, 'Bruno Lima');
  assert.equal(conv.opportunity_title, 'Instagram — Bruno Lima');
  const m = (await admin.get(`/inbox/conversations/${conv.id}`)).data.messages[0];
  assert.equal(m.type, 'image');
  assert.equal(m.has_media, true);
  const file = await admin.raw(`/inbox/messages/${m.id}/media`);
  assert.equal(file.status, 200);
  assert.equal(file.headers.get('content-type'), 'image/jpeg');
  // Endereço de mídia fora da Meta não é baixado (proteção contra uso do servidor como proxy)
  await runAsSystem(() =>
    query(`UPDATE messages SET media = jsonb_set(media, '{url}', '"http://169.254.169.254/latest"') WHERE id = $1`, [
      m.id,
    ]),
  );
  assert.equal((await admin.raw(`/inbox/messages/${m.id}/media`)).status, 502);
  // Resposta vai pela página vinculada
  assert.equal((await admin.post(`/inbox/conversations/${conv.id}/messages`, { body: 'Oi Bruno!' })).status, 201);
  assert.equal(mock.sent.at(-1).page, IG_PAGE);
  assert.deepEqual(mock.sent.at(-1).recipient, { id: '2001' });
});

test('isolamento: outra empresa não vê as conversas do Instagram/Messenger', async () => {
  assert.deepEqual((await adminB.get('/inbox/conversations?status=all')).data.conversations, []);
  const conv = await findConv(admin, 'ig:2001');
  assert.equal((await adminB.get(`/inbox/conversations/${conv.id}`)).status, 404);
});
