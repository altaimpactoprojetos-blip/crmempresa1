'use strict';
const { HttpError } = require('../lib/errors');

// Códigos de erro do PostgreSQL traduzidos para respostas HTTP.
const PG_ERRORS = {
  23505: { status: 409, error: 'Registro duplicado.' },
  23503: { status: 400, error: 'Referência inválida: o registro relacionado não existe.' },
};

// Erros do body-parser do Express.
const PARSER_ERRORS = {
  'entity.too.large': { status: 413, error: 'Conteúdo muito grande.' },
  'entity.parse.failed': { status: 400, error: 'JSON inválido.' },
};

function apiNotFound(_req, res) {
  res.status(404).json({ error: 'Rota não encontrada.' });
}

function errorHandler(err, _req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, ...(err.details || {}) });
  }
  const known = PARSER_ERRORS[err.type] || PG_ERRORS[err.code];
  if (known) return res.status(known.status).json({ error: known.error });

  console.error(err);
  res.status(500).json({ error: 'Erro interno. Tente novamente; se persistir, contate o administrador.' });
}

module.exports = { apiNotFound, errorHandler };
