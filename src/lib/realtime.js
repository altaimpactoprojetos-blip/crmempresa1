'use strict';
// Notificação em tempo real via Server-Sent Events (processo único).
// Cada conexão pertence a uma empresa: eventos só chegam a usuários da mesma empresa.
const { currentCompanyId } = require('../db');

const clients = new Map(); // res -> { userId, companyId }

function subscribe(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`event: hello\ndata: {}\n\n`);
  clients.set(res, { userId: req.user.id, companyId: req.user.company_id });
  const ping = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch (_) {
      /* ignore */
    }
  }, 25000);
  req.on('close', () => {
    clearInterval(ping);
    clients.delete(res);
  });
}

// Envia aos usuários da empresa do contexto atual (ou só aos userIds informados).
function broadcast(event, data = {}, userIds, companyId = currentCompanyId()) {
  if (!companyId) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [res, client] of clients) {
    if (client.companyId !== companyId) continue;
    if (userIds && !userIds.includes(client.userId)) continue;
    try {
      res.write(payload);
    } catch (_) {
      clients.delete(res);
    }
  }
}

module.exports = { subscribe, broadcast };
