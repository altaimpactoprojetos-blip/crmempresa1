'use strict';
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const config = require('./config');
const { pool } = require('./db');
const { loadUser } = require('./middleware/auth');
const { HttpError } = require('./lib/errors');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'], connectSrc: ["'self'"], fontSrc: ["'self'"], objectSrc: ["'none'"], frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// O webhook do WhatsApp precisa do corpo bruto para validar a assinatura.
app.use('/api/whatsapp/webhook', express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } }));
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: false }));

app.use(session({
  store: new PgSession({ pool, tableName: 'user_sessions', createTableIfMissing: false, pruneSessionInterval: 900 }),
  name: 'crm.sid',
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { httpOnly: true, sameSite: 'lax', secure: config.cookieSecure, maxAge: config.sessionHours * 3600 * 1000 },
}));

// Proteção CSRF simples: requisições mutáveis devem enviar o cabeçalho X-Requested-With (cookie SameSite=Lax complementa).
app.use('/api', (req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && !req.path.startsWith('/whatsapp/webhook')) {
    if (req.get('X-Requested-With') !== 'fetch') return res.status(403).json({ error: 'Requisição inválida (cabeçalho de proteção ausente).' });
  }
  next();
});

app.use('/api', loadUser);

app.get('/api/health', async (_req, res) => {
  try { await pool.query('SELECT 1'); res.json({ ok: true, db: 'ok' }); } catch (e) { res.status(500).json({ ok: false, db: e.message }); }
});
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/users', require('./routes/users'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/customers', require('./routes/customers').router);
app.use('/api/tickets', require('./routes/tickets').router);
app.use('/api/opportunities', require('./routes/pipeline'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/whatsapp', require('./routes/whatsapp'));
app.use('/api/quick-replies', require('./routes/quick-replies'));
app.use('/api/saved-filters', require('./routes/saved-filters'));
app.use('/api/automations', require('./routes/automations'));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// Frontend estático (SPA). Em execução embutida (Edge Function) os arquivos vêm de memória (globalThis.__STATIC__).
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json' };
// Com prefixo, o index recebe <base> e um script externo (a CSP bloqueia scripts inline) que define window.API_BASE.
const indexHtml = (raw) => (config.publicBase
  ? raw.replace('<head>', `<head>\n  <base href="${config.publicBase}/">`).replace('<script src="js/api.js">', '<script src="js/base.js"></script>\n  <script src="js/api.js">')
  : raw);
const baseJs = `window.API_BASE = ${JSON.stringify(config.publicBase)};`;
app.get('/js/base.js', (_req, res) => { res.set('Cache-Control', 'no-cache'); res.type('text/javascript; charset=utf-8').send(baseJs); });
if (globalThis.__STATIC__) {
  const files = globalThis.__STATIC__;
  app.get('*', (req, res) => {
    let p = req.path === '/' ? '/index.html' : req.path;
    if (!files[p]) p = '/index.html';
    const body = p === '/index.html' ? indexHtml(files[p]) : files[p];
    res.set('Cache-Control', p === '/index.html' ? 'no-cache' : 'public, max-age=3600');
    res.type(MIME[path.extname(p)] || 'application/octet-stream').send(body);
  });
} else {
  const pub = path.join(__dirname, '..', 'public');
  app.get(['/', '/index.html'], (_req, res) => { res.set('Cache-Control', 'no-cache'); res.type('html').send(indexHtml(require('fs').readFileSync(path.join(pub, 'index.html'), 'utf8'))); });
  app.use(express.static(pub, { maxAge: config.env === 'production' ? '1h' : 0, etag: true }));
  app.get('*', (_req, res) => { res.type('html').send(indexHtml(require('fs').readFileSync(path.join(pub, 'index.html'), 'utf8'))); });
}

// Tratamento de erros
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.details || {}) });
  }
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Conteúdo muito grande.' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
  if (err.code === '23505') return res.status(409).json({ error: 'Registro duplicado.' });
  if (err.code === '23503') return res.status(400).json({ error: 'Referência inválida: o registro relacionado não existe.' });
  console.error(err);
  res.status(500).json({ error: 'Erro interno. Tente novamente; se persistir, contate o administrador.' });
});

// Montagem sob um prefixo (ex.: /crm dentro do Supabase). Sem prefixo, exporta o app diretamente.
let exported = app;
if (config.basePath) {
  exported = express();
  exported.set('trust proxy', 1);
  exported.disable('x-powered-by');
  // Sem barra final o navegador resolveria os caminhos relativos errado: redireciona uma única vez.
  const bases = [...new Set([config.basePath, config.publicBase].filter(Boolean))];
  for (const b of bases) {
    exported.get(b, (req, res, next) => (req.originalUrl.split('?')[0].endsWith('/') ? next() : res.redirect(301, `${config.publicBase || b}/`)));
    exported.use(b, app);
  }
}
module.exports = exported;
