'use strict';
const { query } = require('../db');
const { broadcast } = require('./realtime');

// Cria uma notificação interna para um usuário e avisa via SSE.
async function notify(userId, title, body, link, client) {
  if (!userId) return;
  const q = client ? client.query.bind(client) : query;
  await q('INSERT INTO notifications (user_id, title, body, link) VALUES ($1,$2,$3,$4)',
    [userId, title, body || null, link || null]);
  broadcast('notification', { title, body, link }, [userId]);
}

module.exports = { notify };
