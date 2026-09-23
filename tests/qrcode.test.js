'use strict';
// WhatsApp por QR Code contra um "WhatsApp Web falso" (substitui a biblioteca Baileys).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('events');
const { pool, resetDb, startServer, client, createTestCompany, createUser } = require('./helpers');
const { query, runAsSystem } = require('../src/db');
const waweb = require('../src/lib/waweb');

// ---------- WhatsApp Web falso ----------
const sockets = [];
const sentByCrm = [];
function fakeSocket(auth) {
  const ev = new EventEmitter();
  const sock = {
    auth,
    ev,
    user: null,
    ended: false,
    signalRepository: {
      lidMapping: { getPNForLID: async (lid) => (lid === '999@lid' ? '5511933332222@s.whatsapp.net' : null) },
    },
    async sendMessage(jid, content, opts) {
      sentByCrm.push({ jid, content, id: opts.messageId });
      // O WhatsApp devolve a própria mensagem enviada como evento (deve ser ignorada pelo CRM)
      ev.emit('messages.upsert', {
        type: 'notify',
        messages: [
          { key: { remoteJid: jid, fromMe: true, id: opts.messageId }, message: { conversation: content.text } },
        ],
      });
      return { key: { id: opts.messageId } };
    },
    async onWhatsApp(phone) {
      return phone === '5511900001111' ? [{ exists: true, jid: '5511900001111@s.whatsapp.net' }] : [];
    },
    async logout() {
      ev.emit('connection.update', { connection: 'close', lastDisconnect: { error: { output: { statusCode: 401 } } } });
    },
    end() {
      sock.ended = true;
    },
  };
  sockets.push(sock);
  return sock;
}
const fakeDriver = {
  LOGGED_OUT: 401,
  initCreds: async () => ({ noiseKey: 'chave-secreta-do-aparelho', me: null }),
  serializer: async () => ({ replacer: undefined, reviver: undefined }),
  fixKey: async (_t, v) => v,
  createSocket: async (auth) => fakeSocket(auth),
  download: async (msg) => Buffer.from(`conteudo:${msg.message.imageMessage.url}`),
};
const lastSock = () => sockets[sockets.length - 1];
const tick = (ms = 80) => new Promise((r) => setTimeout(r, ms));
async function waitFor(fn, ms = 3000) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error('tempo esgotado aguardando condição');
    await tick(40);
  }
}
const incoming = (jid, id, message, extra = {}) =>
  lastSock().ev.emit('messages.upsert', {
    type: 'notify',
    messages: [
      {
        key: { remoteJid: jid, fromMe: false, id, ...extra.key },
        pushName: extra.name || 'Beto',
        message,
        messageTimestamp: Math.floor(Date.now() / 1000),
      },
    ],
  });

let server, base, admin, at1, adminB, channel;
const conversations = async (c = admin) => (await c.get('/inbox/conversations?status=all')).data.conversations;

before(async () => {
  waweb.setDriver(fakeDriver);
  await resetDb();
  const companyId = await createTestCompany('Loja QR', 'Admin', 'admin@qr.com');
  await createUser(companyId, 'Atendente', 'at@qr.com', 'atendente');
  await createTestCompany('Outra', 'Admin B', 'admin@b-qr.com');
  ({ server, base } = await startServer());
  [admin, at1, adminB] = [client(base), client(base), client(base)];
  await admin.login('admin@qr.com', 'Senha12345');
  await at1.login('at@qr.com', 'Senha12345');
  await adminB.login('admin@b-qr.com', 'Senha12345');
});
after(async () => {
  waweb.stopAll();
  server.close();
  await pool.end();
});

test('gerar QR Code, ler com o celular e guardar a sessão criptografada', async () => {
  assert.equal((await at1.post('/channels/web', { name: 'Loja' })).status, 403);
  const r = await admin.post('/channels/web', { name: 'Celular da loja' });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  channel = r.data.channel;
  assert.equal(channel.type, 'whatsapp_web');
  assert.equal(channel.status, 'pending');
  lastSock().ev.emit('connection.update', { qr: '2@codigo-do-qr' });
  const qr = await waitFor(async () => (await admin.get(`/channels/${channel.id}/qr`)).data.qr);
  assert.match(qr, /^data:image\/png;base64,/);
  assert.equal((await adminB.get(`/channels/${channel.id}/qr`)).status, 404);
  // Celular leu o QR
  const sock = lastSock();
  sock.auth.creds.me = { id: '5511944443333:7@s.whatsapp.net' };
  sock.ev.emit('creds.update', {});
  sock.user = { id: '5511944443333:7@s.whatsapp.net', name: 'Loja QR' };
  sock.ev.emit('connection.update', { connection: 'open' });
  const ch = await waitFor(async () =>
    (await admin.get('/channels')).data.channels.find((c) => c.status === 'connected'),
  );
  assert.equal(ch.display_phone, '+5511944443333');
  const stored = (await runAsSystem(() => query(`SELECT value_enc FROM channel_session_keys WHERE key_type = 'creds'`)))
    .rows[0].value_enc;
  assert.ok(!stored.includes('chave-secreta-do-aparelho'), 'sessão deve ficar criptografada');
});

test('mensagem recebida cria cliente, conversa e oportunidade; grupos e status são ignorados', async () => {
  incoming('5511977776666@s.whatsapp.net', 'M1', { conversation: 'Olá, tem horário amanhã?' });
  incoming('120363@g.us', 'G1', { conversation: 'mensagem de grupo' });
  incoming('status@broadcast', 'S1', { conversation: 'status' });
  const conv = await waitFor(async () => (await conversations()).find((c) => c.contact_phone === '5511977776666'));
  assert.equal(conv.contact_name, 'Beto');
  assert.equal(conv.channel_type, 'whatsapp_web');
  assert.equal(conv.stage_name, 'Novo contato');
  await tick(150);
  assert.equal((await conversations()).length, 1);
});

test('contato com privacidade (@lid): usa o número quando o WhatsApp informa, senão o identificador', async () => {
  incoming('999@lid', 'L1', { conversation: 'oi pelo lid mapeado' }, { name: 'Carla' });
  incoming('888@lid', 'L2', { conversation: 'oi sem número' }, { name: 'Dani', key: { remoteJidAlt: undefined } });
  incoming(
    '777@lid',
    'L3',
    { conversation: 'oi com alt' },
    { name: 'Edu', key: { remoteJidAlt: '5521911110000@s.whatsapp.net' } },
  );
  await waitFor(async () => (await conversations()).length === 4);
  const list = await conversations();
  const by = (n) => list.find((c) => c.contact_name === n);
  assert.equal(by('Carla').contact_phone, '5511933332222');
  assert.equal(by('Edu').contact_phone, '5521911110000');
  assert.equal(by('Dani').contact_phone, 'lid:888');
  // Resposta vai para o endereço @lid original
  const r = await admin.post(`/inbox/conversations/${by('Dani').id}/messages`, { body: 'Olá Dani!' });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  assert.equal(sentByCrm[sentByCrm.length - 1].jid, '888@lid');
});

test('envio pelo CRM sem duplicar, sem regra de 24h, e confirmações de leitura', async () => {
  const conv = (await conversations()).find((c) => c.contact_phone === '5511977776666');
  await runAsSystem(() =>
    query(`UPDATE conversations SET last_inbound_at = now() - interval '3 days' WHERE id = $1`, [conv.id]),
  );
  const r = await at1.post(`/inbox/conversations/${conv.id}/messages`, { body: 'Temos às 14h!' });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  const sent = sentByCrm[sentByCrm.length - 1];
  assert.equal(sent.jid, '5511977776666@s.whatsapp.net');
  assert.deepEqual(sent.content, { text: 'Temos às 14h!' });
  await tick(150);
  let msgs = (await admin.get(`/inbox/conversations/${conv.id}`)).data.messages;
  assert.equal(msgs.filter((m) => m.direction === 'out').length, 1, 'o eco do envio não pode duplicar');
  lastSock().ev.emit('messages.update', [{ key: { id: sent.id, fromMe: true }, update: { status: 4 } }]);
  await waitFor(async () => {
    msgs = (await admin.get(`/inbox/conversations/${conv.id}`)).data.messages;
    return msgs.find((m) => m.direction === 'out').status === 'read';
  });
  const t = await admin.post(`/inbox/conversations/${conv.id}/template`, { name: 'x', language: 'pt_BR' });
  assert.equal(t.status, 400);
});

test('mensagem enviada direto pelo celular aparece no CRM', async () => {
  const conv = (await conversations()).find((c) => c.contact_phone === '5511977776666');
  lastSock().ev.emit('messages.upsert', {
    type: 'notify',
    messages: [
      {
        key: { remoteJid: '5511977776666@s.whatsapp.net', fromMe: true, id: 'CELULAR1' },
        message: { extendedTextMessage: { text: 'Mandei do celular' } },
        messageTimestamp: Math.floor(Date.now() / 1000),
      },
    ],
  });
  await waitFor(async () =>
    (await admin.get(`/inbox/conversations/${conv.id}`)).data.messages.some((m) => m.body === 'Mandei do celular'),
  );
  const m = (await admin.get(`/inbox/conversations/${conv.id}`)).data.messages.find(
    (x) => x.body === 'Mandei do celular',
  );
  assert.equal(m.direction, 'out');
  assert.equal(m.sender_name, null);
});

test('fotos e áudios não ficam no banco: só a referência, baixada do WhatsApp ao abrir', async () => {
  incoming('5511977776666@s.whatsapp.net', 'IMG1', {
    imageMessage: {
      url: 'https://mmg.whatsapp.net/foto',
      mimetype: 'image/jpeg',
      caption: 'Olha a foto',
      mediaKey: 'segredo-da-midia',
    },
  });
  const conv = (await conversations()).find((c) => c.contact_phone === '5511977776666');
  const msg = await waitFor(async () =>
    (await admin.get(`/inbox/conversations/${conv.id}`)).data.messages.find((m) => m.type === 'image'),
  );
  assert.equal(msg.body, 'Olha a foto');
  const raw = (await runAsSystem(() => query('SELECT media FROM messages WHERE id = $1', [msg.id]))).rows[0].media;
  assert.deepEqual(Object.keys(raw).sort(), ['filename', 'mime_type', 'ref']);
  assert.ok(!JSON.stringify(raw).includes('segredo-da-midia'), 'referência da mídia deve ficar criptografada');
  const file = await admin.raw(`/inbox/messages/${msg.id}/media`);
  assert.equal(file.headers.get('content-type'), 'image/jpeg');
  assert.equal(await file.text(), 'conteudo:https://mmg.whatsapp.net/foto');
});

test('iniciar conversa pelo cadastro confere se o número tem WhatsApp', async () => {
  const ok = (await admin.post('/customers', { name: 'Fábio', phone: '(11) 90000-1111' })).data.customer;
  const r = await admin.post('/inbox/conversations', { customer_id: ok.id });
  assert.equal(r.status, 201, JSON.stringify(r.data));
  assert.equal(r.data.conversation.contact_jid, '5511900001111@s.whatsapp.net');
  const no = (await admin.post('/customers', { name: 'Sem Zap', phone: '(11) 3333-4444' })).data.customer;
  const r2 = await admin.post('/inbox/conversations', { customer_id: no.id });
  assert.equal(r2.status, 400);
  assert.match(r2.data.error, /não tem WhatsApp/);
});

test('reinício do servidor retoma a sessão salva, sem novo QR', async () => {
  waweb.stopAll();
  const before = sockets.length;
  assert.equal(await waweb.resumeAll(), 1);
  assert.equal(sockets.length, before + 1);
  assert.deepEqual(lastSock().auth.creds.me, { id: '5511944443333:7@s.whatsapp.net' });
  lastSock().user = { id: '5511944443333:7@s.whatsapp.net' };
  lastSock().ev.emit('connection.update', { connection: 'open' });
  await tick();
});

test('outra empresa não vê a conexão nem as conversas', async () => {
  assert.deepEqual((await adminB.get('/channels')).data.channels, []);
  assert.deepEqual((await adminB.get('/inbox/conversations?status=all')).data.conversations, []);
});

test('desconectar encerra a sessão no celular e apaga as chaves', async () => {
  const r = await admin.post(`/channels/${channel.id}/disconnect`);
  assert.equal(r.status, 200);
  assert.equal(r.data.channel.status, 'disconnected');
  const keys = (await runAsSystem(() => query('SELECT count(*)::int AS n FROM channel_session_keys'))).rows[0].n;
  assert.equal(keys, 0);
  const conv = (await conversations()).find((c) => c.contact_phone === '5511977776666');
  const s = await admin.post(`/inbox/conversations/${conv.id}/messages`, { body: 'oi' });
  assert.equal(s.status, 409);
});

test('QR não lido expira e para de gerar códigos até pedir de novo', async () => {
  assert.equal((await admin.post(`/channels/${channel.id}/connect`)).status, 200);
  lastSock().ev.emit('connection.update', { qr: '2@outro' });
  lastSock().ev.emit('connection.update', {
    connection: 'close',
    lastDisconnect: { error: { output: { statusCode: 408 } } },
  });
  const st = await waitFor(async () => {
    const d = (await admin.get(`/channels/${channel.id}/qr`)).data;
    return d.status === 'disconnected' ? d : null;
  });
  assert.match(st.last_error, /expirou/);
  assert.equal(st.qr, null);
});
