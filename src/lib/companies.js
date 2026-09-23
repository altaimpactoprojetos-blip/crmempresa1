'use strict';
const bcrypt = require('bcryptjs');
const config = require('../config');

const DEFAULT_STAGES = [
  ['Novo contato', 'open'],
  ['Em atendimento', 'open'],
  ['Proposta enviada', 'open'],
  ['Negociação', 'open'],
  ['Ganho', 'won'],
  ['Perdido', 'lost'],
];

// Cria uma empresa com configurações e funil padrão e o seu primeiro administrador.
// Deve rodar em uma transação de sistema (runAsSystem + tx), pois a empresa ainda não existe.
async function createCompany(client, { companyName, adminName, adminEmail, adminPassword, status = 'trial' }) {
  const trialEnds = status === 'trial' ? `now() + interval '${Number(config.trialDays)} days'` : 'NULL';
  const company = (
    await client.query(
      `INSERT INTO companies (name, status, plan, trial_ends_at) VALUES ($1, $2, $3, ${trialEnds}) RETURNING *`,
      [companyName, status, status === 'trial' ? 'trial' : 'pro'],
    )
  ).rows[0];
  await client.query('INSERT INTO company_settings (company_id, name) VALUES ($1, $2)', [company.id, companyName]);
  for (const [i, [name, kind]] of DEFAULT_STAGES.entries()) {
    await client.query('INSERT INTO pipeline_stages (company_id, name, position, kind) VALUES ($1,$2,$3,$4)', [
      company.id,
      name,
      i + 1,
      kind,
    ]);
  }
  const hash = await bcrypt.hash(adminPassword, 12);
  const admin = (
    await client.query(
      `INSERT INTO users (company_id, name, email, password_hash, role, available)
       VALUES ($1, $2, $3, $4, 'admin', false) RETURNING *`,
      [company.id, adminName, adminEmail, hash],
    )
  ).rows[0];
  await client.query(
    `INSERT INTO audit_log (company_id, user_id, action, entity, entity_id, details)
     VALUES ($1, $2, 'company_create', 'company', $3, '{}')`,
    [company.id, admin.id, String(company.id)],
  );
  return { company, admin };
}

module.exports = { createCompany, DEFAULT_STAGES };
