'use strict';
const config = require('./config');
const app = require('./app');
const { pool } = require('./db');

async function start() {
  try {
    const { rows } = await pool.query(`SELECT to_regclass('schema_migrations') AS t`);
    if (!rows[0].t) {
      console.error('Banco sem migrações aplicadas. Execute: npm run migrate');
      process.exit(1);
    }
    const admins = await pool.query(`SELECT count(*)::int AS n FROM users WHERE role = 'admin' AND active`);
    if (!admins.rows[0].n) console.warn('Nenhum administrador ativo. Execute: npm run create-admin');
  } catch (err) {
    console.error('Não foi possível conectar ao banco de dados:', err.message);
    process.exit(1);
  }
  require('./lib/automations').startScheduler();
  const server = app.listen(config.port, () => console.log(`CRM em execução em ${config.appUrl} (porta ${config.port}, ambiente ${config.env})`));
  const shutdown = () => { console.log('Encerrando...'); server.close(() => pool.end().then(() => process.exit(0))); setTimeout(() => process.exit(1), 5000); };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
