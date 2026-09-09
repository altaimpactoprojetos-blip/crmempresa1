'use strict';
// Notificação em tempo real via Server-Sent Events (processo único).
const clients = new Map(); // res -> userId

function subscribe(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`event: hello\ndata: {}\n\n`);
  clients.set(res, req.user.id);
  const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch (_) { /* ignore */ } }, 25000);
  req.on('close', () => { clearInterval(ping); clients.delete(res); });
}

// Envia para todos (ou só para userIds informados)
function broadcast(event, data = {}, userIds) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const [res, uid] of clients) {
    if (userIds && !userIds.includes(uid)) continue;
    try { res.write(payload); } catch (_) { clients.delete(res); }
  }
}

module.exports = { subscribe, broadcast };
