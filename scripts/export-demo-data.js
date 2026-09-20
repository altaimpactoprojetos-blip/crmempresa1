#!/usr/bin/env node
'use strict';
// Exporta os dados de demonstração do banco para public/demo/demo-data.js (usado pela versão estática no GitHub Pages).
// Uso: npm run demo:export  (após npm run seed:demo)
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

const TABLES = {
  settings: 'SELECT * FROM company_settings WHERE id = 1',
  users: 'SELECT id, name, email, role, active, available, team, last_login_at, created_at FROM users ORDER BY id',
  customers: 'SELECT * FROM customers ORDER BY id',
  customer_notes: 'SELECT * FROM customer_notes ORDER BY id',
  tickets: 'SELECT * FROM tickets ORDER BY id',
  ticket_events: 'SELECT * FROM ticket_events ORDER BY id',
  pipelines: 'SELECT * FROM pipelines ORDER BY position, id',
  stages: 'SELECT * FROM pipeline_stages ORDER BY pipeline_id, position',
  opportunities: 'SELECT * FROM opportunities ORDER BY id',
  opportunity_events: 'SELECT * FROM opportunity_events ORDER BY id',
  tasks: 'SELECT * FROM tasks ORDER BY id',
  quick_replies: 'SELECT * FROM quick_replies ORDER BY id',
  saved_filters: 'SELECT * FROM saved_filters ORDER BY id',
  automation_rules: 'SELECT * FROM automation_rules ORDER BY id',
  automation_runs: 'SELECT * FROM automation_runs ORDER BY id',
  notifications: 'SELECT * FROM notifications ORDER BY id',
  audit: 'SELECT * FROM audit_log ORDER BY id DESC LIMIT 150',
};

async function main() {
  const out = { exported_at: new Date().toISOString() };
  for (const [k, sql] of Object.entries(TABLES)) {
    const { rows } = await pool.query(sql);
    out[k] = k === 'settings' ? rows[0] : rows;
  }
  out.settings.logo_data = out.settings.logo_data || null;
  const dir = path.join(__dirname, '..', 'public', 'demo');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'demo-data.js'), `// Gerado por scripts/export-demo-data.js em ${out.exported_at}. Dados fictícios.\nwindow.DEMO_DATA = ${JSON.stringify(out).replace(/\},\{"id"/g, '},\n{"id"')};\n`);
  console.log(`Exportado: ${Object.entries(out).filter(([k]) => Array.isArray(out[k])).map(([k, v]) => `${k}=${v.length}`).join(', ')}`);
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
