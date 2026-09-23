'use strict';
// Sobe o app em uma porta livre contra o banco de testes.
//
// DATABASE_URL_TEST (padrão postgres://crm:crm@localhost:5432/crm_test) é um usuário administrador,
// usado só para recriar o esquema e o papel da aplicação. O app e as migrações rodam como um
// usuário comum, dono das tabelas — igual à produção —, para que o isolamento entre empresas
// (Row Level Security) seja de fato exercitado: superusuários ignorariam as políticas.
const ADMIN_URL = process.env.DATABASE_URL_TEST || 'postgres://crm:crm@localhost:5432/crm_test';
const APP_ROLE = 'crm_app_test';
const appUrl = new URL(ADMIN_URL);
appUrl.username = APP_ROLE;
appUrl.password = APP_ROLE;
process.env.DATABASE_URL = appUrl.toString();
process.env.SESSION_SECRET = 'segredo-de-teste-0123456789abcdef';
process.env.NODE_ENV = 'test';
process.env.APP_URL = 'http://localhost';

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { pool, query, tx, runAsSystem } = require('../src/db');
const { createCompany } = require('../src/lib/companies');

async function resetDb() {
  const admin = new Pool({ connectionString: ADMIN_URL });
  try {
    await admin.query(`DO $$ BEGIN
      CREATE ROLE ${APP_ROLE} LOGIN PASSWORD '${APP_ROLE}' NOSUPERUSER NOBYPASSRLS;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    await admin.query(`DROP SCHEMA public CASCADE; CREATE SCHEMA public AUTHORIZATION ${APP_ROLE};`);
  } finally {
    await admin.end();
  }
  const migrator = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  try {
    await migrator.query("SELECT set_config('app.bypass_rls', 'on', false)");
    const dir = path.join(__dirname, '..', 'src', 'migrations');
    for (const f of fs
      .readdirSync(dir)
      .filter((x) => x.endsWith('.sql'))
      .sort())
      await migrator.query(fs.readFileSync(path.join(dir, f), 'utf8'));
    await migrator.query(
      'CREATE TABLE schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())',
    );
  } finally {
    await migrator.end();
  }
}

async function startServer() {
  const app = require('../src/app');
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  return { server, base };
}

// Cliente HTTP com cookie jar por sessão
function client(base) {
  let cookie = '';
  async function call(method, p, body) {
    const res = await fetch(base + '/api' + p, {
      method,
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'fetch', Cookie: cookie },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const sc = res.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('json') ? await res.json() : await res.text();
    return { status: res.status, data };
  }
  async function raw(p) {
    return fetch(base + '/api' + p, { headers: { Cookie: cookie } });
  }
  return {
    raw,
    get: (p) => call('GET', p),
    post: (p, b) => call('POST', p, b ?? {}),
    put: (p, b) => call('PUT', p, b),
    del: (p) => call('DELETE', p),
    async login(email, password) {
      const r = await call('POST', '/auth/login', { email, password });
      if (r.status !== 200) throw new Error('login falhou: ' + JSON.stringify(r.data));
      return r.data.user;
    },
  };
}

// Cria uma empresa com o seu administrador; devolve o id da empresa.
async function createTestCompany(companyName, adminName, adminEmail, password = 'Senha12345') {
  const { company } = await runAsSystem(() =>
    tx((c) => createCompany(c, { companyName, adminName, adminEmail, adminPassword: password, status: 'active' })),
  );
  return company.id;
}

async function createUser(companyId, name, email, role, password = 'Senha12345') {
  const { rows } = await runAsSystem(() =>
    query(`INSERT INTO users (company_id, name, email, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id`, [
      companyId,
      name,
      email,
      bcrypt.hashSync(password, 4),
      role,
    ]),
  );
  return rows[0].id;
}

module.exports = { pool, resetDb, startServer, client, createTestCompany, createUser };
