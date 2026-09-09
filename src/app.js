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

app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// Frontend estático (SPA)
const pub = path.join(__dirname, '..', 'public');
app.use(express.static(pub, { maxAge: config.env === 'production' ? '1h' : 0, etag: true }));
app.get('*', (_req, res) => res.sendFile(path.join(pub, 'index.html')));

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

module.exports = app;
