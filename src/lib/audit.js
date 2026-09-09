'use strict';
const { query } = require('../db');

// Registra ações importantes. Não interrompe a requisição em caso de falha.
async function audit(req, action, entity, entityId, details = {}, client) {
  try {
    const q = client ? client.query.bind(client) : query;
    await q(
      `INSERT INTO audit_log (user_id, action, entity, entity_id, details, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user ? req.user.id : null, action, entity, entityId == null ? null : String(entityId),
        JSON.stringify(details), req.ip || null]
    );
  } catch (err) {
    console.error('Falha ao registrar auditoria:', err.message);
  }
}

module.exports = { audit };
