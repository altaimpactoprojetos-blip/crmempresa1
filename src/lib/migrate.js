'use strict';
// Aplica as migrações SQL pendentes (compartilhado por scripts/migrate.js e pela execução em Edge Function).
// Em execução embutida, o conteúdo das migrações vem de globalThis.__MIGRATIONS__ (gerado no build).
const fs = require('fs');
const path = require('path');

function loadMigrations() {
  if (globalThis.__MIGRATIONS__) return globalThis.__MIGRATIONS__;
  const dir = path.join(__dirname, '..', 'migrations');
  return fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((name) => ({ name, sql: fs.readFileSync(path.join(dir, name), 'utf8') }));
}

async function migrate(pool, log = () => {}) {
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`);
    const applied = new Set((await client.query('SELECT name FROM schema_migrations')).rows.map((r) => r.name));
    for (const m of loadMigrations()) {
      if (applied.has(m.name)) continue;
      log(`Aplicando ${m.name}... `);
      await client.query('BEGIN');
      try { await client.query(m.sql); await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [m.name]); await client.query('COMMIT'); log('ok\n'); }
      catch (err) { await client.query('ROLLBACK'); throw err; }
    }
  } finally { client.release(); }
}

module.exports = migrate;
