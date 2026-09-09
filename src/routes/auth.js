'use strict';
const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { query } = require('../db');
const config = require('../config');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const { badRequest, unauthorized } = require('../lib/errors');
const { audit } = require('../lib/audit');
const mailer = require('../lib/mailer');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
});

router.post('/login', loginLimiter, validate(z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
})), async (req, res, next) => {
  try {
    const { email, password } = req.data;
    const { rows } = await query('SELECT * FROM users WHERE lower(email) = lower($1)', [email]);
    const user = rows[0];
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) return next(unauthorized('E-mail ou senha incorretos.'));
    if (!user.active) return next(unauthorized('Usuário desativado. Fale com o administrador.'));
    await new Promise((resolve, reject) => req.session.regenerate((e) => (e ? reject(e) : resolve())));
    req.session.userId = user.id;
    await query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);
    req.user = user;
    await audit(req, 'login', 'user', user.id);
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('crm.sid');
    res.json({ ok: true });
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.put('/me/password', requireAuth, validate(z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8, 'A nova senha deve ter ao menos 8 caracteres.').max(200),
})), async (req, res, next) => {
  try {
    const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    if (!(await bcrypt.compare(req.data.current_password, rows[0].password_hash))) {
      return next(badRequest('Senha atual incorreta.', { fields: { current_password: 'Senha atual incorreta.' } }));
    }
    const hash = await bcrypt.hash(req.data.new_password, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [hash, req.user.id]);
    await audit(req, 'password_change', 'user', req.user.id);
    res.json({ ok: true, message: 'Senha alterada com sucesso.' });
  } catch (err) { next(err); }
});

router.put('/me/availability', requireAuth, validate(z.object({ available: z.boolean() })), async (req, res, next) => {
  try {
    await query('UPDATE users SET available = $1, updated_at = now() WHERE id = $2', [req.data.available, req.user.id]);
    res.json({ ok: true, available: req.data.available });
  } catch (err) { next(err); }
});

// Recuperação de senha: sempre responde igual, para não revelar e-mails cadastrados.
const forgotLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Muitas solicitações. Tente novamente mais tarde.' } });

router.post('/forgot-password', forgotLimiter, validate(z.object({ email: z.string().trim().email() })), async (req, res, next) => {
  try {
    const { rows } = await query('SELECT id, name, email FROM users WHERE lower(email) = lower($1) AND active', [req.data.email]);
    if (rows[0]) {
      const { token, link } = await createResetToken(rows[0].id);
      const sent = await mailer.sendMail({
        to: rows[0].email,
        subject: 'Recuperação de senha',
        text: `Olá, ${rows[0].name}.\n\nPara definir uma nova senha, acesse o link abaixo (válido por 1 hora):\n${link}\n\nSe você não solicitou, ignore esta mensagem.`,
      }).catch((e) => { console.error('Falha ao enviar e-mail:', e.message); return false; });
      if (!sent) {
        console.warn(`[recuperação de senha] SMTP não configurado. Link para ${rows[0].email}: ${link}`);
      }
      void token;
    }
    res.json({ ok: true, message: 'Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.', mail_configured: mailer.configured });
  } catch (err) { next(err); }
});

router.post('/reset-password', validate(z.object({
  token: z.string().min(10),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.').max(200),
})), async (req, res, next) => {
  try {
    const hash = crypto.createHash('sha256').update(req.data.token).digest('hex');
    const { rows } = await query(
      `SELECT pr.id, pr.user_id FROM password_resets pr
       WHERE pr.token_hash = $1 AND pr.used_at IS NULL AND pr.expires_at > now()`, [hash]);
    if (!rows[0]) return next(badRequest('Link inválido ou expirado. Solicite uma nova recuperação.'));
    const pwHash = await bcrypt.hash(req.data.password, 12);
    await query('UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2', [pwHash, rows[0].user_id]);
    await query('UPDATE password_resets SET used_at = now() WHERE id = $1', [rows[0].id]);
    await query('DELETE FROM user_sessions WHERE sess->>\'userId\' = $1', [String(rows[0].user_id)]);
    req.user = { id: rows[0].user_id };
    await audit(req, 'password_reset', 'user', rows[0].user_id);
    res.json({ ok: true, message: 'Senha redefinida. Faça login com a nova senha.' });
  } catch (err) { next(err); }
});

async function createResetToken(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  await query('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES ($1,$2, now() + interval \'1 hour\')', [userId, hash]);
  return { token, link: `${config.appUrl}/#/redefinir-senha/${token}` };
}

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, active: u.active, available: u.available };
}

module.exports = { router, createResetToken, publicUser };
