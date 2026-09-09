'use strict';
// Camada de acesso à API. Todas as chamadas mutáveis enviam o cabeçalho de proteção X-Requested-With.
class ApiError extends Error {
  constructor(status, data) { super((data && data.error) || 'Erro na requisição.'); this.status = status; this.data = data || {}; }
}

async function api(path, { method = 'GET', body, query } = {}) {
  let url = '/api' + path;
  if (query) {
    const qs = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, v); });
    const s = qs.toString(); if (s) url += (url.includes('?') ? '&' : '?') + s;
  }
  const res = await fetch(url, {
    method, credentials: 'same-origin',
    headers: { 'X-Requested-With': 'fetch', ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) data = await res.json(); else data = { raw: await res.text() };
  if (!res.ok) {
    if (res.status === 401 && window.CRM && CRM.onUnauthorized) CRM.onUnauthorized();
    throw new ApiError(res.status, data);
  }
  return data;
}

window.api = api;
window.ApiError = ApiError;
