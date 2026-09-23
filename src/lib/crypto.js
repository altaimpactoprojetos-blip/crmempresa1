'use strict';
// Criptografia de segredos guardados no banco (tokens de canais): AES-256-GCM.
// A chave vem de ENCRYPTION_KEY (ou, na falta dela, de SESSION_SECRET). Trocar a chave
// invalida os tokens salvos: os canais precisarão ser reconectados.
const crypto = require('crypto');
const config = require('../config');

const key = Buffer.from(crypto.hkdfSync('sha256', config.encryptionKey, Buffer.alloc(0), 'crm:segredos:v1', 32));

function encrypt(plain) {
  if (plain == null || plain === '') return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return ['v1', iv.toString('base64'), cipher.getAuthTag().toString('base64'), data.toString('base64')].join(':');
}

function decrypt(value) {
  if (!value) return null;
  const [version, iv, tag, data] = value.split(':');
  if (version !== 'v1') throw new Error('Formato de segredo desconhecido.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv, 'base64'));
  decipher.setAuthTag(Buffer.from(tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
}

const randomToken = (bytes = 24) => crypto.randomBytes(bytes).toString('base64url');

module.exports = { encrypt, decrypt, randomToken };
