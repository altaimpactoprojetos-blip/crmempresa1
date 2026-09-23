'use strict';
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const config = require('../config');
const { pool } = require('../db');

// Sessões gravadas no PostgreSQL (tabela user_sessions), com cookie HttpOnly e expiração deslizante.
const sessionMiddleware = session({
  store: new PgSession({ pool, tableName: 'user_sessions', createTableIfMissing: false, pruneSessionInterval: 900 }),
  name: 'crm.sid',
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: config.sessionHours * 3600 * 1000,
  },
});

module.exports = { sessionMiddleware };
