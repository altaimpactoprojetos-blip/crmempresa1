'use strict';

const onlyDigits = (s) => (s ? String(s).replace(/\D+/g, '') : '');

// Normaliza telefone brasileiro para dígitos com DDI (55) quando possível.
function normalizePhone(s) {
  let d = onlyDigits(s);
  if (!d) return null;
  if (d.length === 10 || d.length === 11) d = '55' + d; // DDD + número
  return d;
}

function normalizeEmail(s) {
  if (!s) return null;
  const e = String(s).trim().toLowerCase();
  return e || null;
}

// Validação simples de CPF/CNPJ (dígitos verificadores)
function validDocument(doc) {
  const d = onlyDigits(doc);
  if (!d) return true;
  if (d.length === 11) return validCpf(d);
  if (d.length === 14) return validCnpj(d);
  return false;
}
function validCpf(c) {
  if (/^(\d)\1+$/.test(c)) return false;
  const calc = (len) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(c[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(c[9]) && calc(10) === Number(c[10]);
}
function validCnpj(c) {
  if (/^(\d)\1+$/.test(c)) return false;
  const calc = (len) => {
    const w = len === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(c[i]) * w[i];
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(c[12]) && calc(13) === Number(c[13]);
}

// Gera protocolo único: AAAAMMDD-000123
async function nextProtocol(client) {
  const { rows } = await client.query("SELECT nextval('ticket_protocol_seq') AS n");
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  return `${ymd}-${String(rows[0].n).padStart(6, '0')}`;
}

function toCsv(rows, columns) {
  const esc = (v) => {
    if (v == null) return '';
    let s = v instanceof Date ? v.toISOString() : Array.isArray(v) ? v.join('|') : String(v);
    if (/[";\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const header = columns.map((c) => esc(c.label)).join(';');
  const lines = rows.map((r) => columns.map((c) => esc(typeof c.get === 'function' ? c.get(r) : r[c.key])).join(';'));
  return '﻿' + [header, ...lines].join('\r\n');
}

// Parser CSV simples com suporte a aspas; detecta separador ; ou ,
function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/)[0] || '';
  const sep = (firstLine.match(/;/g) || []).length >= (firstLine.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === sep) { row.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((f) => f.trim() !== '')) rows.push(row);
      row = [];
    } else field += ch;
  }
  row.push(field);
  if (row.some((f) => f.trim() !== '')) rows.push(row);
  return rows;
}

module.exports = { onlyDigits, normalizePhone, normalizeEmail, validDocument, nextProtocol, toCsv, parseCsv };
