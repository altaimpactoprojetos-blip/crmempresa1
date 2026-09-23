'use strict';
// Servidor falso da Graph API para Instagram Direct e Messenger (usado em social.test.js e chatbot.test.js).
const http = require('http');
const crypto = require('crypto');

const TOKEN = 'token-da-pagina-0123456789abcdef';
const APP_SECRET = 'segredo-do-app-meta-456';
const FB_PAGE = '4444444444';
const IG_PAGE = '5555555555';
const IG_ACCOUNT = '17841400000001';

function startMetaMock() {
  const sent = [];
  const subscribed = [];
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        const url = new URL(req.url, 'http://x');
        const json = (status, data) => {
          res.writeHead(status, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(data));
        };
        if (url.pathname.startsWith('/att/')) {
          res.writeHead(200, { 'Content-Type': 'image/jpeg' });
          return res.end(Buffer.from([0xff, 0xd8, 0xff]));
        }
        if (req.headers.authorization !== `Bearer ${TOKEN}`)
          return json(401, { error: { message: 'Invalid OAuth access token', code: 190 } });
        const parts = url.pathname.split('/').filter(Boolean);
        const fields = url.searchParams.get('fields') || '';
        if (req.method === 'GET' && parts.length === 1 && fields.startsWith('name,instagram_business_account'))
          return json(200, {
            id: parts[0],
            name: 'Loja Teste',
            ...(parts[0] === IG_PAGE ? { instagram_business_account: { id: IG_ACCOUNT, username: 'lojateste' } } : {}),
          });
        if (req.method === 'GET' && fields === 'first_name,last_name')
          return json(200, { first_name: 'Ana', last_name: 'Souza' });
        if (req.method === 'GET' && fields === 'name,username')
          return json(200, { name: 'Bruno Lima', username: 'bruno' });
        if (req.method === 'POST' && parts[1] === 'subscribed_apps') {
          subscribed.push(parts[0]);
          return json(200, { success: true });
        }
        if (req.method === 'POST' && parts[1] === 'messages') {
          const payload = JSON.parse(body);
          sent.push({ page: parts[0], ...payload });
          return json(200, { recipient_id: payload.recipient.id, message_id: `m_OUT${sent.length}` });
        }
        json(404, { error: { message: 'not found' } });
      });
    });
    srv.listen(0, () => resolve({ srv, url: `http://127.0.0.1:${srv.address().port}`, sent, subscribed }));
  });
}

// Envia um evento ao webhook do canal, assinado como a Meta faz
function metaWebhook(base, key, object, entryId, messaging, { secret = APP_SECRET } = {}) {
  const raw = JSON.stringify({ object, entry: [{ id: entryId, time: Date.now(), messaging }] });
  const sig = 'sha256=' + crypto.createHmac('sha256', secret).update(raw).digest('hex');
  return fetch(`${base}/api/webhooks/meta/${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Hub-Signature-256': sig },
    body: raw,
  });
}

async function waitFor(fn, ms = 3000) {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error('tempo esgotado aguardando condição');
    await new Promise((r) => setTimeout(r, 50));
  }
}

module.exports = { TOKEN, APP_SECRET, FB_PAGE, IG_PAGE, IG_ACCOUNT, startMetaMock, metaWebhook, waitFor };
