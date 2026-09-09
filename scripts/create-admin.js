#!/usr/bin/env node
'use strict';
// Cria o primeiro administrador de forma segura (a senha nunca fica no código).
// Uso interativo:     npm run create-admin
// Uso não interativo: ADMIN_NAME="Nome" ADMIN_EMAIL=a@b.com ADMIN_PASSWORD='senha' npm run create-admin
const readline = require('readline');
const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');

function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      // Oculta a digitação da senha
      rl._writeToOutput = function (str) { if (str.includes(question)) rl.output.write(question); };
    }
    rl.question(question, (answer) => { rl.close(); if (hidden) process.stdout.write('\n'); resolve(answer.trim()); });
  });
}

async function main() {
  const name = process.env.ADMIN_NAME || await ask('Nome do administrador: ');
  const email = process.env.ADMIN_EMAIL || await ask('E-mail: ');
  const password = process.env.ADMIN_PASSWORD || await ask('Senha (mín. 8 caracteres): ', true);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 8) {
    console.error('Dados inválidos. Informe nome, e-mail válido e senha com ao menos 8 caracteres.');
    process.exit(1);
  }
  const dup = await pool.query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [email]);
  if (dup.rowCount) { console.error('Já existe um usuário com este e-mail.'); process.exit(1); }
  const hash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(`INSERT INTO users (name, email, password_hash, role, available) VALUES ($1,$2,$3,'admin',false) RETURNING id`, [name, email, hash]);
  await pool.query(`INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES ($1,'user_create','user',$2,'{"via":"create-admin"}')`, [rows[0].id, String(rows[0].id)]);
  console.log(`Administrador criado (id ${rows[0].id}). Faça login com ${email}.`);
  await pool.end();
}
main().catch((e) => { console.error(e.message); process.exit(1); });
