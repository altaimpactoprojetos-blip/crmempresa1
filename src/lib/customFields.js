'use strict';
// Campos personalizados de clientes e oportunidades: definições em custom_fields, valores em <tabela>.custom (JSONB).
const { query } = require('../db');
const { badRequest } = require('./errors');

const TYPES = ['text', 'textarea', 'number', 'money', 'date', 'select', 'checkbox', 'url'];

// "Data de aniversário" -> "data_de_aniversario"
function slugify(label) {
  return (
    String(label)
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'campo'
  );
}

async function definitions(entity, client) {
  const q = client ? client.query.bind(client) : query;
  return (await q('SELECT * FROM custom_fields WHERE entity = $1 AND active ORDER BY position, id', [entity])).rows;
}

// Converte e confere um valor; devolve [valor, erro].
function coerce(def, raw) {
  if (raw === null || raw === undefined || raw === '') return [null, null];
  switch (def.type) {
    case 'text':
    case 'textarea': {
      const s = String(raw).trim();
      const max = def.type === 'text' ? 500 : 5000;
      return s.length > max ? [null, `Máximo de ${max} caracteres.`] : [s || null, null];
    }
    case 'number':
    case 'money': {
      const n = typeof raw === 'number' ? raw : Number(String(raw).replace(/\./g, '').replace(',', '.'));
      return Number.isFinite(n) ? [n, null] : [null, 'Informe um número.'];
    }
    case 'date':
      return /^\d{4}-\d{2}-\d{2}$/.test(String(raw)) && !isNaN(new Date(raw))
        ? [String(raw), null]
        : [null, 'Data inválida.'];
    case 'select':
      return def.options.includes(String(raw)) ? [String(raw), null] : [null, 'Opção inválida.'];
    case 'checkbox':
      return [raw === true || raw === 'true' || raw === 'on' || raw === 1, null];
    case 'url':
      return /^https?:\/\/[^\s]+$/i.test(String(raw).trim())
        ? [String(raw).trim(), null]
        : [null, 'Informe um endereço começando com http:// ou https://.'];
    default:
      return [null, null];
  }
}

// Valida os valores recebidos. Em criação, exige os obrigatórios; em edição, só os enviados.
// Campos desconhecidos são ignorados. Erros usam a chave "custom.<campo>" (destacada no formulário).
async function clean(entity, input, { partial = false, client } = {}) {
  if (input == null) {
    if (partial) return null;
    input = {};
  }
  if (typeof input !== 'object' || Array.isArray(input)) throw badRequest('Campos personalizados inválidos.');
  const out = {};
  const fields = {};
  for (const def of await definitions(entity, client)) {
    const given = Object.prototype.hasOwnProperty.call(input, def.key);
    if (partial && !given) continue;
    const [value, error] = coerce(def, input[def.key]);
    if (error) fields[`custom.${def.key}`] = error;
    else if (def.required && (value === null || value === false) && def.type !== 'checkbox')
      fields[`custom.${def.key}`] = 'Campo obrigatório.';
    else out[def.key] = value;
  }
  if (Object.keys(fields).length) throw badRequest('Verifique os campos destacados.', { fields });
  return out;
}

module.exports = { TYPES, slugify, definitions, clean };
