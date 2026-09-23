'use strict';
const helmet = require('helmet');
const config = require('../config');

// Quando o CRM é servido por HTTPS (COOKIE_SECURE=true), o navegador é instruído a usar sempre HTTPS.
// Servido só por HTTP (ex.: pelo IP, antes de configurar um domínio), essas instruções quebrariam a página:
// o navegador tentaria buscar scripts e estilos por HTTPS, que ainda não existe.
const https = config.cookieSecure;

// Cabeçalhos de segurança e Content-Security-Policy: o frontend só carrega recursos do próprio domínio.
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: https ? [] : null,
    },
  },
  strictTransportSecurity: https,
  crossOriginEmbedderPolicy: false,
});

module.exports = { securityHeaders };
