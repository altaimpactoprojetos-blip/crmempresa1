'use strict';
const { AsyncLocalStorage } = require('async_hooks');
const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  max: 15,
});

pool.on('error', (err) => console.error('Erro inesperado no pool do PostgreSQL', err));

// Multiempresa: cada requisição roda "dentro" de uma empresa (ou como sistema). O contexto é levado
// ao PostgreSQL em cada transação e as políticas de Row Level Security (migração 003) garantem que
// uma empresa nunca leia nem grave dados de outra, mesmo que uma consulta esqueça de filtrar.
const context = new AsyncLocalStorage();

function runAsCompany(companyId, fn) {
  const id = Number(companyId);
  if (!Number.isInteger(id) || id <= 0) throw new Error('Empresa inválida para o contexto do banco.');
  return context.run({ companyId: id }, fn);
}

// Para operações sem empresa definida: login, cadastro de empresa, webhooks, scripts.
function runAsSystem(fn) {
  return context.run({ system: true }, fn);
}

function currentCompanyId() {
  const ctx = context.getStore();
  return ctx && ctx.companyId ? ctx.companyId : null;
}

// Executa fn(client) em uma transação com o contexto de empresa aplicado.
async function withClient(fn) {
  const ctx = context.getStore();
  if (!ctx) throw new Error('Acesso ao banco sem contexto de empresa (use runAsCompany ou runAsSystem).');
  const companyId = ctx.system ? '' : String(ctx.companyId); // inteiro já validado em runAsCompany
  const bypass = ctx.system ? 'on' : 'off';
  const client = await pool.connect();
  try {
    await client.query(
      `BEGIN; SELECT set_config('app.company_id', '${companyId}', true), set_config('app.bypass_rls', '${bypass}', true)`,
    );
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      /* ignore */
    }
    throw err;
  } finally {
    client.release();
  }
}

function query(text, params) {
  return withClient((client) => client.query(text, params));
}

// Executa fn dentro de uma transação. fn recebe um client.
function tx(fn) {
  return withClient(fn);
}

module.exports = { pool, query, tx, runAsCompany, runAsSystem, currentCompanyId };
