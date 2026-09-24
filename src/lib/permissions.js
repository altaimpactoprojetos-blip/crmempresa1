'use strict';
// Módulos que o administrador pode liberar ou bloquear para Gestor e Atendente.
const { forbidden } = require('./errors');

const MODULES = {
  dashboard: 'Dashboard',
  inbox: 'Conversas',
  customers: 'Clientes',
  tickets: 'Atendimentos',
  pipeline: 'Funil',
  tasks: 'Tarefas',
  reports: 'Relatórios',
};

function can(user, module) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const perms = (user.permissions || {})[user.role] || {};
  return perms[module] !== false;
}

// Bloqueia a rota quando o módulo está desligado para o perfil do usuário
const requireModule = (module) => (req, _res, next) =>
  can(req.user, module) ? next() : next(forbidden(`Seu perfil não tem acesso a ${MODULES[module]}.`));

module.exports = { MODULES, can, requireModule };
