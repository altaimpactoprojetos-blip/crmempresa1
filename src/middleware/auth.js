'use strict';
const { unauthorized, forbidden } = require('../lib/errors');
const { query, runAsCompany } = require('../db');

const ROLES = ['admin', 'supervisor', 'atendente'];

// Carrega o usuário da sessão a cada requisição (garante que desativação tenha efeito imediato)
// e executa o restante da requisição no contexto da empresa dele (isolamento multiempresa).
function loadUser(req, _res, next) {
  const { userId, companyId } = req.session || {};
  if (!userId) return next();
  if (!companyId) {
    // Sessão anterior ao modo multiempresa: exige novo login.
    return req.session.destroy(() => next());
  }
  runAsCompany(companyId, async () => {
    try {
      const { rows } = await query(
        `SELECT u.id, u.company_id, u.name, u.email, u.role, u.active, u.available,
                c.status AS company_status, c.trial_ends_at
         FROM users u JOIN companies c ON c.id = u.company_id WHERE u.id = $1`,
        [userId],
      );
      const user = rows[0];
      if (user && user.active && user.company_status !== 'suspended' && user.company_status !== 'cancelled') {
        req.user = user;
        next();
      } else {
        req.session.destroy(() => next());
      }
    } catch (err) {
      next(err);
    }
  });
}

function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized());
  next();
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
}

const isManager = (user) => user && (user.role === 'admin' || user.role === 'supervisor');

module.exports = { ROLES, loadUser, requireAuth, requireRole, isManager };
