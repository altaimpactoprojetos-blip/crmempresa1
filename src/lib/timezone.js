'use strict';
// Datas "do dia" seguem o fuso configurado pela empresa (company_settings.timezone),
// e não o fuso da sessão do PostgreSQL (normalmente UTC em servidores).

const COMPANY_TZ = '(SELECT timezone FROM company_settings WHERE id = 1)';

// Data local (no fuso da empresa) de uma expressão timestamptz.
const localDate = (expr) => `(${expr} AT TIME ZONE ${COMPANY_TZ})::date`;

// Data de hoje no fuso da empresa.
const todaySql = () => localDate('now()');

// Início (00:00 local) do dia informado em um parâmetro 'AAAA-MM-DD', como timestamptz.
const startOfDaySql = (param) => `(${param}::date::timestamp AT TIME ZONE ${COMPANY_TZ})`;

// Início (00:00 local) do dia seguinte ao informado — use com "<" para incluir o dia inteiro.
const endOfDaySql = (param) => `((${param}::date + 1)::timestamp AT TIME ZONE ${COMPANY_TZ})`;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const isDateString = (s) => typeof s === 'string' && DATE_RE.test(s);

function isValidTimezone(tz) {
  try {
    new Intl.DateTimeFormat('pt-BR', { timeZone: tz });
    return true;
  } catch (_) {
    return false;
  }
}

module.exports = { localDate, todaySql, startOfDaySql, endOfDaySql, isDateString, isValidTimezone };
