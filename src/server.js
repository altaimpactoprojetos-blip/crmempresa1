'use strict';
const config = require('./config');
const app = require('./app');
const { pool, query, runAsSystem } = require('./db');

async function start() {
  try {
    const { rows } = await pool.query(`SELECT to_regclass('schema_migrations') AS t`);
    if (!rows[0].t) {
      console.error('Banco sem migrações aplicadas. Execute: npm run migrate');
      process.exit(1);
    }
    // O isolamento entre empresas depende de Row Level Security, que superusuários ignoram.
    const role = (await pool.query('SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user')).rows[0];
    if (role.rolsuper || role.rolbypassrls) {
      console.error(
        'O usuário do banco em DATABASE_URL é superusuário ou ignora RLS: o isolamento entre empresas não funcionaria.\n' +
          'Use um usuário comum, dono das tabelas (o scripts/instalar-vps.sh já cria assim).',
      );
      process.exit(1);
    }
    const companies = (await runAsSystem(() => query('SELECT count(*)::int AS n FROM companies'))).rows[0].n;
    if (!companies)
      console.warn('Nenhuma empresa cadastrada. Crie a primeira pela tela de cadastro ou: npm run create-admin');
  } catch (err) {
    console.error('Não foi possível conectar ao banco de dados:', err.message);
    process.exit(1);
  }
  const server = app.listen(config.port, () =>
    console.log(`CRM em execução em ${config.appUrl} (porta ${config.port}, ambiente ${config.env})`),
  );
  const shutdown = () => {
    console.log('Encerrando...');
    server.close(() => pool.end().then(() => process.exit(0)));
    setTimeout(() => process.exit(1), 5000);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
