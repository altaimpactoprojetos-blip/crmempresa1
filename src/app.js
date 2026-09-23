'use strict';
const path = require('path');
const express = require('express');
const config = require('./config');
const { securityHeaders } = require('./middleware/security');
const { sessionMiddleware } = require('./middleware/session');
const { csrfGuard } = require('./middleware/csrf');
const { loadUser } = require('./middleware/auth');
const { apiNotFound, errorHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(securityHeaders);

// Corpo das requisições. Webhooks guardam o corpo bruto para validar a assinatura.
app.use(
  '/api/webhooks',
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: false }));

// API
app.use(sessionMiddleware);
app.use('/api', csrfGuard, loadUser, apiRoutes, apiNotFound);

// Frontend estático (SPA): qualquer outra rota devolve o index.html.
app.use(express.static(PUBLIC_DIR, { maxAge: config.env === 'production' ? '1h' : 0, etag: true }));
// Painel do dono da plataforma (página separada do CRM das empresas)
app.get('/plataforma', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'plataforma.html')));
app.get('*', (_req, res) => res.sendFile(path.join(PUBLIC_DIR, 'index.html')));

app.use(errorHandler);

module.exports = app;
