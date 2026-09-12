'use strict';
// Integração WhatsApp com credenciais configuradas: webhook idempotente, vínculo cliente/atendimento,
// status de entrega/leitura, envio pela API (simulada) e janela de 24h.
process.env.WHATSAPP_TOKEN = 'token-teste';
process.env.WHATSAPP_PHONE_NUMBER_ID = '12345';
process.env.WHATSAPP_VERIFY_TOKEN = 'verifica';
process.env.WHATSAPP_APP_SECRET = 'segredo';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { pool, resetDb, startServer, client, createUser } = require('./helpers');

let server, base, sup, at1;
const sent = [];
const realFetch = global.fetch;

before(async () => {
  await resetDb();
  await createUser('Admin', 'admin@t.com', 'admin');
  await createUser('Supervisora', 'sup@t.com', 'supervisor');
  await createUser('Atendente Um', 'a1@t.com', 'atendente');
  ({ server, base } = await startServer());
  sup = client(base); at1 = client(base);
  await sup.login('sup@t.com', 'Senha12345'); await at1.login('a1@t.com', 'Senha12345');
  // Simula a Graph API da Meta apenas para chamadas externas; o app local continua real.
  global.fetch = async (url, opts) => {
    if (String(url).startsWith('https://graph.facebook.com')) {
      const body = JSON.parse(opts.body); sent.push(body);
      if (body.text && /falha/.test(body.text.body)) return new Response(JSON.stringify({ error: { message: 'Número inválido', code: 131026 } }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      return new Response(JSON.stringify({ messages: [{ id: 'wamid.out.' + sent.length }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return realFetch(url, opts);
  };
});
after(async () => { global.fetch = realFetch; server.close(); await pool.end(); });

function webhook(payload) {
  const raw = JSON.stringify(payload);
  const sig = 'sha256=' + crypto.createHmac('sha256', 'segredo').update(raw).digest('hex');
  return realFetch(base + '/api/whatsapp/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': sig }, body: raw });
}
const msg = (id, from, text, name = 'Cliente Zap') => ({ entry: [{ changes: [{ value: { contacts: [{ wa_id: from, profile: { name } }], messages: [{ id, from, timestamp: String(Math.floor(Date.now() / 1000)), type: 'text', text: { body: text } }] } }] }] });
const status = (id, st) => ({ entry: [{ changes: [{ value: { statuses: [{ id, status: st, timestamp: String(Math.floor(Date.now() / 1000)) }] } }] }] });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('estado: conectado, webhook verificável e assinatura obrigatória', async () => {
  const st = (await sup.get('/whatsapp/status')).data;
  assert.equal(st.connected, true); assert.equal(st.state, 'configurado_sem_eventos'); assert.ok(st.pending.some((p) => /Nenhum webhook/.test(p)));
  const ok = await realFetch(base + '/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=verifica&hub.challenge=abc');
  assert.equal(await ok.text(), 'abc');
  assert.equal((await realFetch(base + '/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=errado')).status, 403);
  const bad = await realFetch(base + '/api/whatsapp/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': 'sha256=00' }, body: '{}' });
  assert.equal(bad.status, 401);
});

test('recebimento: cria cliente e atendimento, vincula mensagens, ignora evento repetido', async () => {
  assert.equal((await webhook(msg('wamid.1', '5511977776666', 'Olá, quero um orçamento'))).status, 200);
  await wait(400);
  const cust = (await sup.get('/customers?q=Cliente Zap')).data.customers;
  assert.equal(cust.length, 1); assert.equal(cust[0].phone, '+5511977776666');
  let tk = (await sup.get(`/tickets?customer_id=${cust[0].id}`)).data.tickets;
  assert.equal(tk.length, 1); assert.equal(tk[0].status, 'aguardando'); assert.equal(tk[0].channel, 'WhatsApp'); assert.equal(tk[0].unread_count, 1); assert.equal(tk[0].awaiting_reply, true);
  // Evento repetido (mesmo id) não duplica nada
  await webhook(msg('wamid.1', '5511977776666', 'Olá, quero um orçamento')); await wait(300);
  await webhook(msg('wamid.2', '5511977776666', 'Ainda estou aqui')); await wait(300);
  const d = (await sup.get(`/tickets/${tk[0].id}`)).data;
  assert.equal(d.events.filter((e) => e.kind === 'interaction').length, 2);
  assert.equal(d.ticket.unread_count, 2);
  assert.equal((await sup.get('/customers?q=Cliente Zap')).data.customers.length, 1);
  const st = (await sup.get('/whatsapp/status')).data; assert.equal(st.state, 'ativo'); assert.equal(st.stats.received, 2);
});

test('envio pela API: exige responsável, grava histórico com status e recebe entregue/lido; falha registrada', async () => {
  const cust = (await sup.get('/customers?q=Cliente Zap')).data.customers[0];
  const tk = (await sup.get(`/tickets?customer_id=${cust.id}`)).data.tickets[0];
  assert.equal((await at1.post('/whatsapp/send', { customer_id: cust.id, ticket_id: tk.id, body: 'oi' })).status, 403, 'precisa assumir antes');
  await at1.post(`/tickets/${tk.id}/claim`);
  const r = await at1.post('/whatsapp/send', { customer_id: cust.id, ticket_id: tk.id, body: 'Olá! Segue o orçamento.' });
  assert.equal(r.status, 201); assert.equal(r.data.whatsapp_message.status, 'enviado');
  assert.equal(sent[sent.length - 1].to, '5511977776666');
  let d = (await at1.get(`/tickets/${tk.id}`)).data;
  assert.equal(d.ticket.unread_count, 0); assert.equal(d.ticket.awaiting_reply, false); assert.ok(d.ticket.first_response_at);
  const ev = d.events.find((e) => e.direction === 'saida'); assert.equal(ev.payload.via, 'whatsapp_api'); assert.equal(ev.payload.status, 'enviado');
  const waId = r.data.whatsapp_message.wa_message_id;
  await webhook(status(waId, 'delivered')); await wait(200);
  await webhook(status(waId, 'read')); await wait(200);
  await webhook(status(waId, 'delivered')); await wait(200); // atrasado: não regride
  d = (await at1.get(`/tickets/${tk.id}`)).data;
  assert.equal(d.events.find((e) => e.direction === 'saida').payload.status, 'lido');
  const failed = await at1.post('/whatsapp/send', { customer_id: cust.id, ticket_id: tk.id, body: 'mensagem com falha' });
  assert.equal(failed.status, 502);
  assert.ok((await sup.get('/whatsapp/status')).data.last_error);
  const log = (await sup.get('/whatsapp/log')).data.messages; assert.ok(log.length >= 3);
  assert.equal((await at1.get('/whatsapp/log')).status, 403);
});

test('janela de 24h: fora dela só modelo aprovado; mensagem recebida reabre a janela', async () => {
  const cust = (await sup.get('/customers?q=Cliente Zap')).data.customers[0];
  const tk = (await sup.get(`/tickets?customer_id=${cust.id}`)).data.tickets[0];
  await pool.query(`UPDATE whatsapp_messages SET created_at = now() - interval '2 days' WHERE direction = 'entrada'`);
  const closed = await at1.post('/whatsapp/send', { customer_id: cust.id, ticket_id: tk.id, body: 'texto livre' });
  assert.equal(closed.status, 409); assert.equal(closed.data.window_closed, true);
  const tpl = await at1.post('/whatsapp/send', { customer_id: cust.id, ticket_id: tk.id, template: { name: 'retorno_atendimento' } });
  assert.equal(tpl.status, 201); assert.equal(sent[sent.length - 1].type, 'template');
  await webhook(msg('wamid.3', '5511977776666', 'Pode mandar')); await wait(300);
  assert.equal((await at1.get(`/whatsapp/window/${cust.id}`)).data.open, true);
  // Atendimento estava "em atendimento"; cliente respondeu → sem resposta de novo e notificação ao responsável
  const d = (await at1.get(`/tickets/${tk.id}`)).data; assert.equal(d.ticket.awaiting_reply, true);
  assert.ok((await at1.get('/notifications')).data.notifications.some((n) => n.title === 'Nova mensagem no WhatsApp'));
});

test('mensagem recebida com atendimento encerrado abre um novo na fila; mídia vira anexo consultável', async () => {
  const cust = (await sup.get('/customers?q=Cliente Zap')).data.customers[0];
  const tk = (await sup.get(`/tickets?customer_id=${cust.id}`)).data.tickets[0];
  await at1.post(`/tickets/${tk.id}/status`, { status: 'resolvido' });
  await webhook({ entry: [{ changes: [{ value: { messages: [{ id: 'wamid.4', from: '5511977776666', type: 'image', image: { id: 'media-1', mime_type: 'image/jpeg', caption: 'Comprovante' } }] } }] }] });
  await wait(300);
  const list = (await sup.get(`/tickets?customer_id=${cust.id}&open=true`)).data.tickets;
  assert.equal(list.length, 1); assert.notEqual(list[0].id, tk.id); assert.equal(list[0].subject, 'Comprovante');
  const d = (await sup.get(`/tickets/${list[0].id}`)).data;
  assert.equal(d.attachments.length, 1); assert.equal(d.attachments[0].wa_media_id, 'media-1');
});
