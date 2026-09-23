'use strict';

const MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
// Rotas chamadas por serviços externos (sem navegador), que se autenticam por assinatura própria.
const EXEMPT_PATHS = ['/webhooks/'];

// Proteção CSRF: requisições mutáveis devem enviar o cabeçalho X-Requested-With: fetch,
// que um formulário de outro site não consegue definir. O cookie SameSite=Lax complementa.
function csrfGuard(req, res, next) {
  const exempt = EXEMPT_PATHS.some((p) => req.path.startsWith(p));
  if (MUTATING_METHODS.includes(req.method) && !exempt && req.get('X-Requested-With') !== 'fetch') {
    return res.status(403).json({ error: 'Requisição inválida (cabeçalho de proteção ausente).' });
  }
  next();
}

module.exports = { csrfGuard };
