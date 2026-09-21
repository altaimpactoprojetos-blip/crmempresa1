'use strict';
// Ponto de entrada quando o CRM roda como Supabase Edge Function (Deno). Empacotado por scripts/build-edge.js.
// As dependências npm são injetadas em globalThis.__deps pelo index.ts; os arquivos do frontend em globalThis.__STATIC__.
// No build, `process.env` é substituído por um objeto próprio (o runtime de Edge Functions não permite alterar o ambiente).
const D = globalThis.Deno;
const env = (k, d) => (D && D.env.get(k)) || process.env[k] || d;
const crypto = require('crypto');
process.env.NODE_ENV = 'production';
process.env.DATABASE_URL = env('DATABASE_URL') || env('SUPABASE_DB_URL');
process.env.DATABASE_SSL = env('DATABASE_SSL', 'true');
process.env.COOKIE_SECURE = env('COOKIE_SECURE', 'true');
process.env.BASE_PATH = env('BASE_PATH', '/crm');
process.env.PUBLIC_BASE = env('PUBLIC_BASE', '/functions/v1/crm');
process.env.APP_URL = env('APP_URL') || (env('SUPABASE_URL') ? `${env('SUPABASE_URL')}${process.env.PUBLIC_BASE}` : 'http://localhost:8000' + process.env.PUBLIC_BASE);
// Segredo de sessão: explícito ou derivado da chave de serviço do projeto (estável entre reinícios).
process.env.SESSION_SECRET = env('SESSION_SECRET') || crypto.createHash('sha256').update('crm-session:' + (env('SUPABASE_SERVICE_ROLE_KEY') || env('SUPABASE_ANON_KEY') || 'sem-chave')).digest('hex');
for (const k of ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_VERIFY_TOKEN', 'WHATSAPP_APP_SECRET', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'SESSION_HOURS']) { const v = env(k); if (v) process.env[k] = v; }

globalThis.__STATIC__ = require('./static-embed');
const app = require('./app');
const automations = require('./lib/automations');
const { pool } = require('./db');

// Em ambiente sem processo permanente, as verificações agendadas rodam junto com as requisições (no máximo a cada minuto).
let lastRun = 0;
app.use((_req, _res, next) => { const now = Date.now(); if (now - lastRun > 60000) { lastRun = now; automations.runScheduled().catch((e) => console.error('Agendador:', e.message)); } next(); });

// Garante as migrações na primeira execução (só as pendentes) e sobe o servidor.
const migrate = require('./lib/migrate');
migrate(pool).catch((e) => console.error('Migração automática falhou:', e.message));
app.listen(8000, () => console.log('CRM (edge) em execução em', process.env.APP_URL));
