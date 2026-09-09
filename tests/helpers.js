'use strict';
// Sobe o app em uma porta livre contra o banco de testes (DATABASE_URL_TEST ou crm_test).
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || 'postgres://crm:crm@localhost:5432/crm_test';
process.env.SESSION_SECRET = 'segredo-de-teste-0123456789abcdef';
process.env.NODE_ENV = 'test';
process.env.APP_URL = 'http://localhost';
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

async function resetDb() {
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
  const dir = path.join(__dirname, '..', 'src', 'migrations');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql')).sort()) await pool.query(fs.readFileSync(path.join(dir, f), 'utf8'));
  await pool.query('CREATE TABLE schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())');
}

async function startServer() {
  const app = require('../src/app');
  const server = await new Promise((resolve) => { const s = app.listen(0, () => resolve(s)); });
  const base = `http://127.0.0.1:${server.address().port}`;
  return { server, base };
}

// Cliente HTTP com cookie jar por sessão
function client(base) {
  let cookie = '';
  async function call(method, p, body) {
    const res = await fetch(base + '/api' + p, { method, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch', Cookie: cookie }, body: body !== undefined ? JSON.stringify(body) : undefined });
    const sc = res.headers.get('set-cookie'); if (sc) cookie = sc.split(';')[0];
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('json') ? await res.json() : await res.text();
    return { status: res.status, data };
  }
  async function raw(p) { return fetch(base + '/api' + p, { headers: { Cookie: cookie } }); }
  return { raw, get: (p) => call('GET', p), post: (p, b) => call('POST', p, b ?? {}), put: (p, b) => call('PUT', p, b), del: (p) => call('DELETE', p),
    async login(email, password) { const r = await call('POST', '/auth/login', { email, password }); if (r.status !== 200) throw new Error('login falhou: ' + JSON.stringify(r.data)); return r.data.user; } };
}

async function createUser(name, email, role, password = 'Senha12345') {
  const bcrypt = require('bcryptjs');
  const { rows } = await pool.query(`INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id`, [name, email, await bcrypt.hash(password, 4), role]);
  return rows[0].id;
}

module.exports = { pool, resetDb, startServer, client, createUser };
