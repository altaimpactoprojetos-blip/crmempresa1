#!/usr/bin/env node
'use strict';
// Cria (ou troca a senha de) um acesso ao painel do dono da plataforma (/plataforma).
// Uso interativo:     npm run create-platform-admin
// Uso não interativo: PLATFORM_NAME="Nome" PLATFORM_EMAIL=a@b.com PLATFORM_PASSWORD='senha' npm run create-platform-admin
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { pool, query, runAsSystem } = require('../src/db');

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
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
  const name = process.env.PLATFORM_NAME || (await ask('Seu nome: '));
  const email = process.env.PLATFORM_EMAIL || (await ask('E-mail: '));
  const password = process.env.PLATFORM_PASSWORD || (await ask('Senha (mín. 10 caracteres): ', true));
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 10) {
    console.error('Dados inválidos. Informe nome, e-mail válido e senha com ao menos 10 caracteres.');
    process.exit(1);
  }
  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await runAsSystem(() =>
      query(
        `INSERT INTO platform_admins (name, email, password_hash) VALUES ($1, lower($2), $3)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
         RETURNING (xmax = 0) AS created`,
        [name, email, hash],
      ),
    );
    console.log(
      rows[0].created
        ? `Acesso criado. Entre em /plataforma com ${email}.`
        : `Senha de ${email} atualizada. Entre em /plataforma.`,
    );
  } finally {
    await pool.end();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
