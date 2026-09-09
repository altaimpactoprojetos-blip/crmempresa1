'use strict';
const { badRequest } = require('../lib/errors');

// Valida req.body (ou query) com um esquema zod e devolve mensagens em português.
function validate(schema, source = 'body') {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const fields = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_';
        if (!fields[key]) fields[key] = translate(issue);
      }
      return next(badRequest('Verifique os campos destacados.', { fields }));
    }
    req[source === 'body' ? 'data' : 'queryData'] = result.data;
    next();
  };
}

function translate(issue) {
  switch (issue.code) {
    case 'invalid_type':
      if (issue.received === 'undefined' || issue.received === 'null') return 'Campo obrigatório.';
      return 'Valor inválido.';
    case 'too_small':
      if (issue.type === 'string') return issue.minimum <= 1 ? 'Campo obrigatório.' : `Mínimo de ${issue.minimum} caracteres.`;
      return `Valor mínimo: ${issue.minimum}.`;
    case 'too_big':
      if (issue.type === 'string') return `Máximo de ${issue.maximum} caracteres.`;
      return `Valor máximo: ${issue.maximum}.`;
    case 'invalid_string':
      if (issue.validation === 'email') return 'E-mail inválido.';
      return 'Formato inválido.';
    case 'invalid_enum_value':
      return 'Opção inválida.';
    default:
      return issue.message || 'Valor inválido.';
  }
}

module.exports = { validate };
