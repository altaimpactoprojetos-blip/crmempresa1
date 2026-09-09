'use strict';
// Utilitários de interface: escape HTML, formatação, toasts, modais e formulários.
const UI = {};

UI.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
UI.attr = UI.esc;

UI.fmtDate = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');
UI.fmtDateTime = (d) => (d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
UI.fmtMoney = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
UI.fmtDuration = (s) => {
  if (s == null || isNaN(s)) return '—';
  s = Math.round(Number(s));
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60); if (m < 60) return `${m} min`;
  const h = s / 3600; if (h < 48) return `${h.toFixed(1).replace('.', ',')} h`;
  return `${(h / 24).toFixed(1).replace('.', ',')} dias`;
};
UI.relative = (d) => {
  if (!d) return '—';
  const diff = (new Date(d) - Date.now()) / 1000; const abs = Math.abs(diff);
  const f = (n, u) => `${diff < 0 ? 'há' : 'em'} ${n} ${u}`;
  if (abs < 60) return diff < 0 ? 'agora' : 'em instantes';
  if (abs < 3600) return f(Math.round(abs / 60), 'min');
  if (abs < 86400) return f(Math.round(abs / 3600), 'h');
  return f(Math.round(abs / 86400), 'dias');
};
UI.toLocalInput = (d) => { // ISO -> valor de <input type=datetime-local>
  if (!d) return ''; const x = new Date(d); const p = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
};
UI.fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);
UI.initials = (name) => String(name || '?').split(/\s+/).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
UI.waLink = (phoneDigits) => (phoneDigits ? `https://wa.me/${phoneDigits}` : null);
UI.digits = (s) => String(s || '').replace(/\D+/g, '');

UI.STATUS = {
  aguardando: { label: 'Aguardando atendimento', cls: 'warning' }, em_atendimento: { label: 'Em atendimento', cls: 'primary' },
  aguardando_cliente: { label: 'Aguardando cliente', cls: 'purple' }, resolvido: { label: 'Resolvido', cls: 'success' }, cancelado: { label: 'Cancelado', cls: 'dark' },
};
UI.PRIORITY = { baixa: { label: 'Baixa', cls: '' }, normal: { label: 'Normal', cls: 'info' }, alta: { label: 'Alta', cls: 'warning' }, urgente: { label: 'Urgente', cls: 'danger' } };
UI.ROLE = { admin: 'Administrador', supervisor: 'Supervisor', atendente: 'Atendente' };
UI.statusBadge = (s) => { const m = UI.STATUS[s] || { label: s, cls: '' }; return `<span class="badge ${m.cls}">${UI.esc(m.label)}</span>`; };
UI.priorityBadge = (p) => { const m = UI.PRIORITY[p] || { label: p, cls: '' }; return `<span class="badge ${m.cls}">${UI.esc(m.label)}</span>`; };

UI.toast = (msg, type = 'info', ms = 4000) => {
  const el = document.createElement('div'); el.className = `toast ${type}`; el.textContent = msg;
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), ms);
};
UI.ok = (m) => UI.toast(m, 'success');
UI.err = (e) => UI.toast(e instanceof Error ? e.message : String(e), 'error', 6000);

UI.empty = (title, text) => `<div class="empty"><strong>${UI.esc(title)}</strong>${text ? UI.esc(text) : ''}</div>`;

// Modal genérico. Retorna { el, close }.
UI.modal = ({ title, body, footer, size = '', onClose }) => {
  const back = document.createElement('div'); back.className = 'modal-backdrop';
  back.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true">
    <div class="modal-header"><h2>${UI.esc(title)}</h2><button class="icon-btn" data-close aria-label="Fechar">✕</button></div>
    <div class="modal-body">${body}</div>
    ${footer !== null ? `<div class="modal-footer">${footer || ''}</div>` : ''}
  </div>`;
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); if (onClose) onClose(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(back);
  const first = back.querySelector('input, select, textarea'); if (first) setTimeout(() => first.focus(), 30);
  return { el: back, close };
};

UI.confirm = (message, { title = 'Confirmar', okLabel = 'Confirmar', danger = false } = {}) => new Promise((resolve) => {
  const m = UI.modal({ title, size: 'narrow', body: `<p>${UI.esc(message)}</p>`,
    footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn ${danger ? 'danger' : ''}" data-ok>${UI.esc(okLabel)}</button>`,
    onClose: () => resolve(false) });
  m.el.querySelector('[data-ok]').onclick = () => { resolve(true); m.el.querySelector('[data-close]').click(); };
});

UI.prompt = (message, { title = 'Informe', placeholder = '', required = true, multiline = false } = {}) => new Promise((resolve) => {
  let done = false;
  const m = UI.modal({ title, size: 'narrow', body: `<form id="promptForm"><div class="field"><label>${UI.esc(message)}</label>
    ${multiline ? `<textarea name="v" placeholder="${UI.attr(placeholder)}"></textarea>` : `<input name="v" placeholder="${UI.attr(placeholder)}">`}<div class="error"></div></div></form>`,
    footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="promptForm">OK</button>`,
    onClose: () => { if (!done) resolve(null); } });
  m.el.querySelector('#promptForm').onsubmit = (e) => {
    e.preventDefault(); const v = e.target.v.value.trim();
    if (required && !v) { e.target.querySelector('.error').textContent = 'Campo obrigatório.'; return; }
    done = true; resolve(v); m.close();
  };
});

// Serializa um <form> para objeto, convertendo tipos conforme data-type.
UI.formData = (form) => {
  const out = {};
  for (const el of form.elements) {
    if (!el.name || el.disabled) continue;
    let v;
    if (el.type === 'checkbox') v = el.checked;
    else if (el.type === 'number') v = el.value === '' ? null : Number(el.value);
    else if (el.type === 'datetime-local') v = UI.fromLocalInput(el.value);
    else v = el.value.trim();
    const t = el.dataset.type;
    if (t === 'int') v = v === '' || v === null ? null : Number(v);
    if (t === 'tags') v = v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
    if (t === 'nullable' && v === '') v = null;
    if (t === 'money') v = v === '' || v === null ? 0 : Number(String(v).replace(/\./g, '').replace(',', '.'));
    out[el.name] = v;
  }
  return out;
};

// Exibe erros de campo retornados pela API ({ fields: { nome: 'msg' } }).
UI.showErrors = (form, err) => {
  form.querySelectorAll('.field.has-error').forEach((f) => { f.classList.remove('has-error'); const e = f.querySelector('.error'); if (e) e.textContent = ''; });
  const fields = (err && err.data && err.data.fields) || {};
  let focused = false;
  for (const [name, msg] of Object.entries(fields)) {
    const el = form.elements[name]; if (!el) continue;
    const field = el.closest('.field'); if (!field) continue;
    field.classList.add('has-error');
    let e = field.querySelector('.error'); if (!e) { e = document.createElement('div'); e.className = 'error'; field.appendChild(e); }
    e.textContent = msg;
    if (!focused) { el.focus(); focused = true; }
  }
  if (!Object.keys(fields).length && err) UI.err(err);
};

UI.field = (name, label, input, { required = false, hint = '' } = {}) =>
  `<div class="field"><label>${UI.esc(label)}${required ? ' <span class="req">*</span>' : ''}</label>${input}${hint ? `<div class="hint">${UI.esc(hint)}</div>` : ''}<div class="error"></div></div>`;
UI.input = (name, value = '', attrs = '') => `<input name="${name}" value="${UI.attr(value ?? '')}" ${attrs}>`;
UI.select = (name, options, value, attrs = '') => `<select name="${name}" ${attrs}>${options.map((o) => {
  const [v, l] = Array.isArray(o) ? o : [o, o];
  return `<option value="${UI.attr(v)}" ${String(v) === String(value ?? '') ? 'selected' : ''}>${UI.esc(l)}</option>`;
}).join('')}</select>`;
UI.textarea = (name, value = '', attrs = '') => `<textarea name="${name}" ${attrs}>${UI.esc(value ?? '')}</textarea>`;
UI.userOptions = (users, { blank = '— Sem responsável —', filter } = {}) => [['', blank], ...users.filter((u) => u.active !== false && (!filter || filter(u))).map((u) => [u.id, u.name])];

UI.download = (path) => { const a = document.createElement('a'); a.href = '/api' + path; a.download = ''; document.body.appendChild(a); a.click(); a.remove(); };

UI.debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

UI.icons = {
  dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  customers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  tickets: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  pipeline: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>',
  tasks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',
  settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M3 12h18M3 6h18M3 18h18"/></svg>',
};

window.UI = UI;
// Namespace global do app; as páginas registram-se em CRM.pages antes de app.js executar.
window.CRM = window.CRM || { pages: {} };
