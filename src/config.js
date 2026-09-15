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
  n8n: {
    // Chave que o n8n envia ao CRM (cabeçalho X-API-Key) para gravar dados.
    apiKey: process.env.N8N_API_KEY || '',
    // URL do nó Webhook do n8n que recebe os eventos do CRM.
    webhookUrl: process.env.N8N_WEBHOOK_URL || '',
    // Segredo opcional: assina o corpo enviado ao n8n (cabeçalho X-CRM-Signature).
    webhookSecret: process.env.N8N_WEBHOOK_SECRET || '',
    timeoutMs: Number(process.env.N8N_TIMEOUT_MS || 10000),
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
config.n8n.inboundConfigured = Boolean(config.n8n.apiKey);
config.n8n.outboundConfigured = Boolean(config.n8n.webhookUrl);
config.n8n.configured = config.n8n.inboundConfigured || config.n8n.outboundConfigured;

if (config.n8n.apiKey && config.n8n.apiKey.length < 24) {
  console.error('N8N_API_KEY muito curta (mínimo 24 caracteres). Gere com: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}
if (config.n8n.webhookUrl && !/^https?:\/\//.test(config.n8n.webhookUrl)) {
  console.error('N8N_WEBHOOK_URL inválida: informe a URL completa do nó Webhook do n8n (http:// ou https://).');
  process.exit(1);
}

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
