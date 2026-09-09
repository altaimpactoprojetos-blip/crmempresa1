'use strict';
require('dotenv').config();

function bool(v, def = false) {
  if (v === undefined || v === '') return def;
  return ['1', 'true', 'yes', 'sim'].includes(String(v).toLowerCase());
}

const config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  appUrl: (process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, ''),
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: bool(process.env.DATABASE_SSL),
  sessionSecret: process.env.SESSION_SECRET,
  sessionHours: Number(process.env.SESSION_HOURS || 12),
  cookieSecure: bool(process.env.COOKIE_SECURE),
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT || 587),
    secure: bool(process.env.SMTP_SECURE),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'CRM <nao-responda@localhost>',
  },
  whatsapp: {
    token: process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
    appSecret: process.env.WHATSAPP_APP_SECRET || '',
  },
};

config.smtp.configured = Boolean(config.smtp.host);
config.whatsapp.configured = Boolean(config.whatsapp.token && config.whatsapp.phoneNumberId);

if (!config.databaseUrl) {
  console.error('DATABASE_URL não definido. Copie .env.example para .env e ajuste.');
  process.exit(1);
}
if (!config.sessionSecret || config.sessionSecret.length < 16) {
  console.error('SESSION_SECRET ausente ou muito curto (mínimo 16 caracteres).');
  process.exit(1);
}
if (config.env === 'production' && /dev-secret|troque-este-valor/.test(config.sessionSecret)) {
  console.error('SESSION_SECRET de exemplo em produção. Gere um valor aleatório.');
  process.exit(1);
}

module.exports = config;
