'use strict';
const { unauthorized, forbidden } = require('../lib/errors');
const { query } = require('../db');

const ROLES = ['admin', 'supervisor', 'atendente'];

// Carrega o usuário da sessão a cada requisição (garante que desativação tenha efeito imediato).
async function loadUser(req, _res, next) {
  try {
    if (req.session && req.session.userId) {
      const { rows } = await query(
        'SELECT id, name, email, role, active, available FROM users WHERE id = $1',
        [req.session.userId]
      );
      const user = rows[0];
      if (user && user.active) {
        req.user = user;
      } else {
        req.session.destroy(() => {});
      }
    }
    next();
  } catch (err) { next(err); }
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
