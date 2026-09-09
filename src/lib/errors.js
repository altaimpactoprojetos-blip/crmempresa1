'use strict';
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
const badRequest = (msg, details) => new HttpError(400, msg, details);
const unauthorized = (msg = 'Faça login para continuar.') => new HttpError(401, msg);
const forbidden = (msg = 'Você não tem permissão para esta ação.') => new HttpError(403, msg);
const notFound = (msg = 'Registro não encontrado.') => new HttpError(404, msg);
const conflict = (msg, details) => new HttpError(409, msg, details);

module.exports = { HttpError, badRequest, unauthorized, forbidden, notFound, conflict };
