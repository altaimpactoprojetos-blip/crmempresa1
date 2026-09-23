#!/usr/bin/env node
'use strict';
// Cria uma empresa com o seu administrador de forma segura (a senha nunca fica no código).
// Uso interativo:     npm run create-admin
// Uso não interativo: ADMIN_COMPANY="Empresa" ADMIN_NAME="Nome" ADMIN_EMAIL=a@b.com ADMIN_PASSWORD='senha' npm run create-admin
const readline = require('readline');
const { pool, query, tx, runAsSystem } = require('../src/db');
const { createCompany } = require('../src/lib/companies');

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Oculta a digitação da senha
      rl._writeToOutput = function (str) {
        if (str.includes(question)) rl.output.write(question);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

async function main() {
  const companyName = process.env.ADMIN_COMPANY || (await ask('Nome da empresa: '));
  const name = process.env.ADMIN_NAME || (await ask('Nome do administrador: '));
  const email = process.env.ADMIN_EMAIL || (await ask('E-mail: '));
  const password = process.env.ADMIN_PASSWORD || (await ask('Senha (mín. 8 caracteres): ', true));
  if (!companyName || !name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 8) {
    console.error('Dados inválidos. Informe empresa, nome, e-mail válido e senha com ao menos 8 caracteres.');
    process.exit(1);
  }
  try {
    await runAsSystem(async () => {
      const dup = await query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email]);
      if (dup.rowCount) {
        console.error('Já existe um usuário com este e-mail.');
        process.exit(1);
      }
      const { company, admin } = await tx((client) =>
        createCompany(client, {
          companyName,
          adminName: name,
          adminEmail: email,
          adminPassword: password,
          status: 'active',
        }),
      );
      console.log(`Empresa "${company.name}" (id ${company.id}) criada. Faça login com ${admin.email}.`);
    });
  } finally {
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
