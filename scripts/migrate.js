#!/usr/bin/env node
'use strict';
// Aplica as migrações SQL em src/migrations em ordem, uma única vez cada.
const { pool } = require('../src/db');
const migrate = require('../src/lib/migrate');
migrate(pool, (m) => process.stdout.write(m)).then(() => { console.log('Banco de dados atualizado.'); return pool.end(); })
  .catch((err) => { console.error('Falha na migração:', err.message); process.exit(1); });
