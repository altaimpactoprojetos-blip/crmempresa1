'use strict';
const nodemailer = require('nodemailer');
const config = require('../config');

let transporter = null;
if (config.smtp.configured) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
}

// Retorna true quando o e-mail foi realmente enviado.
async function sendMail({ to, subject, text }) {
  if (!transporter) return false;
  await transporter.sendMail({ from: config.smtp.from, to, subject, text });
  return true;
}

module.exports = { sendMail, configured: Boolean(transporter) };
