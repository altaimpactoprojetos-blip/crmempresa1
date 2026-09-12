'use strict';
// Utilitários de interface: escape HTML, formatação (pt-BR), ícones, toasts, modais, painel lateral, menus e tabelas.
const UI = {};

UI.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
UI.attr = UI.esc;

// ---------- Formatação ----------
UI.fmtDate = (d) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');
UI.fmtDateTime = (d) => (d ? new Date(d).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
UI.fmtTime = (d) => (d ? new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '');
// Horário curto para listas: hoje → hora; esta semana → dia; senão → dd/mm.
UI.fmtShort = (d) => {
  if (!d) return ''; const x = new Date(d), now = new Date();
  if (x.toDateString() === now.toDateString()) return UI.fmtTime(x);
  const diff = (now - x) / 86400000;
  if (diff < 6) return x.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
  return x.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};
UI.fmtMoney = (v) => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
UI.fmtMoneyShort = (v) => { v = Number(v || 0); if (Math.abs(v) >= 1e6) return `R$ ${(v / 1e6).toFixed(1).replace('.', ',')} mi`; if (Math.abs(v) >= 1e4) return `R$ ${(v / 1e3).toFixed(1).replace('.', ',')} mil`; return UI.fmtMoney(v); };
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
  return f(Math.round(abs / 86400), abs < 172800 ? 'dia' : 'dias');
};
UI.toLocalInput = (d) => { if (!d) return ''; const x = new Date(d); const p = (n) => String(n).padStart(2, '0'); return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`; };
UI.fromLocalInput = (v) => (v ? new Date(v).toISOString() : null);
UI.initials = (name) => String(name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
UI.waLink = (phoneDigits) => (phoneDigits ? `https://wa.me/${phoneDigits}` : null);
UI.digits = (s) => String(s || '').replace(/\D+/g, '');
UI.phoneDigits = (phone) => { const d = UI.digits(phone); if (!d) return null; return d.length <= 11 ? '55' + d : d; };
UI.fmtPhone = (p) => { const d = UI.digits(p); if (d.length === 13 && d.startsWith('55')) return `(${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`; if (d.length === 12 && d.startsWith('55')) return `(${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`; if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`; return p || ''; };
UI.avatar = (name, cls = '') => `<span class="avatar ${cls}" title="${UI.attr(name || '')}">${UI.esc(UI.initials(name))}</span>`;
UI.plural = (n, s, p) => `${n} ${n === 1 ? s : p}`;

UI.STATUS = {
  aguardando: { label: 'Aguardando atendimento', short: 'Na fila', cls: 'warning' }, em_atendimento: { label: 'Em atendimento', short: 'Em atendimento', cls: 'primary' },
  aguardando_cliente: { label: 'Aguardando cliente', short: 'Aguard. cliente', cls: 'purple' }, resolvido: { label: 'Resolvido', short: 'Resolvido', cls: 'success' }, cancelado: { label: 'Cancelado', short: 'Cancelado', cls: 'dark' },
};
UI.PRIORITY = { baixa: { label: 'Baixa', cls: 'outline' }, normal: { label: 'Normal', cls: 'info' }, alta: { label: 'Alta', cls: 'warning' }, urgente: { label: 'Urgente', cls: 'danger' } };
UI.ROLE = { admin: 'Administrador', supervisor: 'Supervisor', atendente: 'Atendente' };
UI.statusBadge = (s, short) => { const m = UI.STATUS[s] || { label: s, cls: '' }; return `<span class="badge ${m.cls}">${UI.esc(short ? m.short : m.label)}</span>`; };
UI.priorityBadge = (p) => { const m = UI.PRIORITY[p] || { label: p, cls: '' }; return `<span class="badge ${m.cls}">${UI.esc(m.label)}</span>`; };
UI.stageBadge = (name, kind) => `<span class="badge ${kind === 'won' ? 'success' : kind === 'lost' ? 'danger' : 'primary'}">${UI.esc(name)}</span>`;
UI.tags = (list) => (list || []).map((t) => `<span class="tag">${UI.esc(t)}</span>`).join('');

// ---------- Ícones (família única, traço 1.8) ----------
const I = (d, extra = '') => `<svg class="i" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
UI.icons = {
  dashboard: I('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'),
  customers: I('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
  tickets: I('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  pipeline: I('<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>'),
  tasks: I('<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>'),
  reports: I('<path d="M18 20V10M12 20V4M6 20v-6"/>'),
  settings: I('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  search: I('<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>'),
  bell: I('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'),
  menu: I('<path d="M3 12h18M3 6h18M3 18h18"/>'),
  close: I('<path d="M18 6L6 18M6 6l12 12"/>'),
  plus: I('<path d="M12 5v14M5 12h14"/>'),
  check: I('<path d="M20 6L9 17l-5-5"/>'),
  checkDouble: I('<path d="M18 6L7 17l-4-4"/><path d="M22 10l-7.5 7.5"/>'),
  clock: I('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  alert: I('<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4M12 17h.01"/>'),
  info: I('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>'),
  help: I('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>'),
  more: I('<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>'),
  chevronLeft: I('<path d="M15 18l-6-6 6-6"/>'), chevronRight: I('<path d="M9 18l6-6-6-6"/>'), chevronDown: I('<path d="M6 9l6 6 6-6"/>'), chevronUp: I('<path d="M18 15l-6-6-6 6"/>'),
  arrowLeft: I('<path d="M19 12H5M12 19l-7-7 7-7"/>'), arrowRight: I('<path d="M5 12h14M12 5l7 7-7 7"/>'),
  edit: I('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'),
  trash: I('<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>'),
  send: I('<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>'),
  note: I('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>'),
  paperclip: I('<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>'),
  zap: I('<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>'),
  calendar: I('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  user: I('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  userPlus: I('<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/>'),
  phone: I('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>'),
  mail: I('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/>'),
  message: I('<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>'),
  globe: I('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>'),
  building: I('<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01M12 6h.01M12 10h.01M12 14h.01"/>'),
  external: I('<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><path d="M15 3h6v6M10 14L21 3"/>'),
  filter: I('<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>'),
  columns: I('<path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18"/>'),
  list: I('<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'),
  board: I('<rect x="3" y="3" width="5" height="18" rx="1"/><rect x="10" y="3" width="5" height="12" rx="1"/><rect x="17" y="3" width="4" height="8" rx="1"/>'),
  inbox: I('<path d="M22 12h-6l-2 3H10l-2-3H2"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'),
  save: I('<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>'),
  download: I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'),
  upload: I('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>'),
  refresh: I('<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>'),
  play: I('<path d="M5 3l14 9-14 9V3z"/>'), pause: I('<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>'),
  tag: I('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><path d="M7 7h.01"/>'),
  dollar: I('<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'),
  flag: I('<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>'),
  eye: I('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
  lock: I('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  logout: I('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'),
  sidebar: I('<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>'),
  x: I('<path d="M18 6L6 18M6 6l12 12"/>'),
  minus: I('<path d="M5 12h14"/>'),
  repeat: I('<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
  users: I('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'),
  whatsapp: I('<path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/>'),
  circle: I('<circle cx="12" cy="12" r="9"/>'),
  checkCircle: I('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>'),
  xCircle: I('<circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>'),
  sort: I('<path d="M11 5h10M11 9h7M11 13h4M3 17l3 3 3-3M6 18V4"/>'),
  grip: I('<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>'),
  arrowUp: I('<path d="M12 19V5M5 12l7-7 7 7"/>'), arrowDown: I('<path d="M12 5v14M19 12l-7 7-7-7"/>'),
  target: I('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  handshake: I('<path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l8.42 8.42 8.42-8.42a5.4 5.4 0 0 0 0-7.65z"/>'),
  copy: I('<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>'),
  file: I('<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/>'),
  image: I('<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>'),
};
UI.channelIcon = (ch) => { const c = String(ch || '').toLowerCase(); if (c.includes('whats')) return UI.icons.whatsapp; if (c.includes('tele') || c.includes('fone')) return UI.icons.phone; if (c.includes('mail')) return UI.icons.mail; if (c.includes('chat')) return UI.icons.message; if (c.includes('presen')) return UI.icons.building; if (c.includes('site') || c.includes('insta')) return UI.icons.globe; return UI.icons.message; };
UI.help = (text) => `<span class="help-icon" tabindex="0" data-help="${UI.attr(text)}" aria-label="Como é calculado">${UI.icons.help}</span>`;

// ---------- Toasts ----------
UI.toast = (msg, type = 'info', ms = 4000) => {
  const el = document.createElement('div'); el.className = `toast ${type}`; el.textContent = msg; el.setAttribute('role', 'status');
  document.getElementById('toasts').appendChild(el);
  setTimeout(() => el.remove(), ms);
};
UI.ok = (m) => UI.toast(m, 'success');
UI.err = (e) => UI.toast(e instanceof Error ? e.message : String(e), 'error', 6000);
UI.empty = (title, text, action = '') => `<div class="empty"><strong>${UI.esc(title)}</strong>${text ? UI.esc(text) : ''}${action ? `<div class="mt-s">${action}</div>` : ''}</div>`;

// ---------- Modal ----------
UI.modal = ({ title, body, footer, size = '', onClose }) => {
  const back = document.createElement('div'); back.className = 'modal-backdrop';
  back.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${UI.attr(title)}">
    <div class="modal-header"><h2>${UI.esc(title)}</h2><button class="icon-btn" data-close aria-label="Fechar">${UI.icons.close}</button></div>
    <div class="modal-body">${body}</div>
    ${footer !== null ? `<div class="modal-footer">${footer || ''}</div>` : ''}
  </div>`;
  const prev = document.activeElement;
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); if (onClose) onClose(); if (prev && prev.focus) prev.focus(); };
  const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(back);
  const first = back.querySelector('input:not([type=hidden]):not([readonly]), select, textarea, button:not([data-close])'); if (first) setTimeout(() => first.focus(), 30);
  return { el: back, close };
};

// Painel lateral (drawer): mantém o contexto da tela por trás.
UI.drawer = ({ title, body, footer, size = '', onClose }) => {
  const back = document.createElement('div'); back.className = 'drawer-backdrop';
  back.innerHTML = `<aside class="drawer ${size}" role="dialog" aria-modal="true" aria-label="${UI.attr(title)}">
    <div class="drawer-header"><h2 id="drawerTitle">${UI.esc(title)}</h2><div class="flex" id="drawerHeadActions"></div><button class="icon-btn" data-close aria-label="Fechar">${UI.icons.close}</button></div>
    <div class="drawer-body">${body}</div>
    ${footer !== null ? `<div class="drawer-footer">${footer || ''}</div>` : ''}
  </aside>`;
  const prev = document.activeElement;
  const close = () => { back.remove(); document.removeEventListener('keydown', onKey); if (onClose) onClose(); if (prev && prev.focus) prev.focus(); };
  const onKey = (e) => { if (e.key === 'Escape' && !document.querySelector('.modal-backdrop')) close(); };
  back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(back);
  const first = back.querySelector('.drawer-body button, .drawer-body input, .drawer-body a'); if (first) setTimeout(() => first.focus(), 30);
  return { el: back, close, body: back.querySelector('.drawer-body'), setTitle: (t) => { back.querySelector('#drawerTitle').textContent = t; } };
};

UI.confirm = (message, { title = 'Confirmar', okLabel = 'Confirmar', danger = false } = {}) => new Promise((resolve) => {
  const m = UI.modal({ title, size: 'narrow', body: `<p>${UI.esc(message)}</p>`,
    footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn ${danger ? 'danger' : ''}" data-ok>${UI.esc(okLabel)}</button>`,
    onClose: () => resolve(false) });
  m.el.querySelector('[data-ok]').onclick = () => { resolve(true); m.el.querySelector('[data-close]').click(); };
});

UI.prompt = (message, { title = 'Informe', placeholder = '', required = true, multiline = false, value = '' } = {}) => new Promise((resolve) => {
  let done = false;
  const m = UI.modal({ title, size: 'narrow', body: `<form id="promptForm"><div class="field"><label>${UI.esc(message)}</label>
    ${multiline ? `<textarea name="v" placeholder="${UI.attr(placeholder)}">${UI.esc(value)}</textarea>` : `<input name="v" value="${UI.attr(value)}" placeholder="${UI.attr(placeholder)}">`}<div class="error"></div></div></form>`,
    footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="promptForm">Confirmar</button>`,
    onClose: () => { if (!done) resolve(null); } });
  m.el.querySelector('#promptForm').onsubmit = (e) => {
    e.preventDefault(); const v = e.target.v.value.trim();
    if (required && !v) { e.target.querySelector('.error').textContent = 'Campo obrigatório.'; return; }
    done = true; resolve(v); m.close();
  };
});

// Menu suspenso ancorado em um botão. items: [{label, icon, onClick, danger, sep, head}]
UI.menu = (anchor, items, { align = 'right' } = {}) => {
  document.querySelectorAll('.menu').forEach((m) => m.remove());
  const wrap = anchor.closest('.menu-wrap') || anchor.parentElement;
  if (!wrap.classList.contains('menu-wrap')) { wrap.style.position = 'relative'; }
  const menu = document.createElement('div'); menu.className = `menu ${align === 'left' ? 'left' : ''}`; menu.setAttribute('role', 'menu');
  menu.innerHTML = items.map((it, i) => it.sep ? '<div class="sep"></div>' : it.head ? `<div class="head">${UI.esc(it.head)}</div>` : it.href ? `<a href="${UI.attr(it.href)}" role="menuitem">${it.icon ? UI.icons[it.icon] || '' : ''}${UI.esc(it.label)}</a>` : `<button type="button" role="menuitem" data-i="${i}" class="${it.danger ? 'danger' : ''}" ${it.disabled ? 'disabled' : ''}>${it.icon ? UI.icons[it.icon] || '' : ''}${UI.esc(it.label)}</button>`).join('');
  wrap.appendChild(menu);
  const close = () => { menu.remove(); document.removeEventListener('click', onDoc, true); document.removeEventListener('keydown', onKey); };
  const onDoc = (e) => { if (!menu.contains(e.target)) close(); else if (e.target.closest('a')) setTimeout(close, 10); };
  const onKey = (e) => { if (e.key === 'Escape') { close(); anchor.focus(); } };
  menu.querySelectorAll('button[data-i]').forEach((b) => b.onclick = () => { close(); items[Number(b.dataset.i)].onClick(); });
  setTimeout(() => { document.addEventListener('click', onDoc, true); document.addEventListener('keydown', onKey); const f = menu.querySelector('button, a'); if (f) f.focus(); }, 0);
  return { close };
};

// ---------- Formulários ----------
UI.formData = (form) => {
  const out = {};
  for (const el of form.elements) {
    if (!el.name || el.disabled) continue;
    let v;
    if (el.type === 'checkbox') v = el.checked;
    else if (el.type === 'radio') { if (!el.checked) continue; v = el.value; }
    else if (el.type === 'number') v = el.value === '' ? null : Number(el.value);
    else if (el.type === 'datetime-local') v = UI.fromLocalInput(el.value);
    else v = el.value.trim();
    const t = el.dataset.type;
    if (t === 'int') v = v === '' || v === null ? null : Number(v);
    if (t === 'tags') v = v ? v.split(',').map((s) => s.trim()).filter(Boolean) : [];
    if (t === 'nullable' && v === '') v = null;
    if (t === 'money') v = v === '' || v === null ? 0 : Number(String(v).replace(/[R$\s.]/g, '').replace(',', '.'));
    if (t === 'lines') v = v ? v.split('\n').map((s) => s.trim()).filter(Boolean) : [];
    out[el.name] = v;
  }
  return out;
};

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

UI.field = (name, label, input, { required = false, hint = '' } = {}) => {
  const m = input.match(/^<(?:input|select|textarea)[^>]*\sid="([^"]+)"/);
  const id = m ? m[1] : `f_${name}`;
  const html = m ? input : input.replace(/^<(input|select|textarea)/, `<$1 id="${id}"`);
  return `<div class="field"><label for="${id}">${UI.esc(label)}${required ? ' <span class="req">*</span>' : ''}</label>${html}${hint ? `<div class="hint">${UI.esc(hint)}</div>` : ''}<div class="error"></div></div>`;
};
UI.input = (name, value = '', attrs = '') => `<input name="${name}" value="${UI.attr(value ?? '')}" ${attrs}>`;
UI.select = (name, options, value, attrs = '') => `<select name="${name}" ${attrs}>${options.map((o) => {
  const [v, l] = Array.isArray(o) ? o : [o, o];
  return `<option value="${UI.attr(v)}" ${String(v) === String(value ?? '') ? 'selected' : ''}>${UI.esc(l)}</option>`;
}).join('')}</select>`;
UI.textarea = (name, value = '', attrs = '') => `<textarea name="${name}" ${attrs}>${UI.esc(value ?? '')}</textarea>`;
UI.userOptions = (users, { blank = '— Sem responsável —', filter } = {}) => [['', blank], ...users.filter((u) => u.active !== false && (!filter || filter(u))).map((u) => [u.id, u.name])];
UI.money = (v) => (v == null || v === '' ? '' : Number(v).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.'));

UI.download = (path) => { const a = document.createElement('a'); a.href = '/api' + path; a.download = ''; document.body.appendChild(a); a.click(); a.remove(); };
UI.debounce = (fn, ms = 300) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
UI.readFile = (file) => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file); });
UI.fmtBytes = (n) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);
UI.store = { get: (k, d) => { try { const v = localStorage.getItem('crm.' + k); return v === null ? d : JSON.parse(v); } catch (_) { return d; } }, set: (k, v) => { try { localStorage.setItem('crm.' + k, JSON.stringify(v)); } catch (_) { /* ignore */ } } };
UI.qs = (obj) => { const qs = new URLSearchParams(); Object.entries(obj || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '' && v !== false) qs.set(k, v === true ? 'true' : v); }); return qs.toString(); };

// ---------- Tabela genérica: colunas selecionáveis, ordenação, paginação, truncamento ----------
// columns: [{ key, label, render(row), sortable, width, align, default (visível), min }]
UI.table = (box, { id, columns, rows, total, page = 1, limit = 25, sort, dir, onSort, onPage, onRow, empty, rowClass, rowAttrs }) => {
  const hiddenCols = new Set(UI.store.get(`cols.${id}`, columns.filter((c) => c.default === false).map((c) => c.key)));
  const visible = columns.filter((c) => !hiddenCols.has(c.key));
  const pages = Math.max(1, Math.ceil((total ?? rows.length) / limit));
  const head = visible.map((c) => `<th class="${c.sortable ? 'sortable' : ''} ${c.align === 'right' ? 'num' : ''}" ${c.sortable ? `data-sort="${c.key}"` : ''} style="${c.width ? `width:${c.width};` : ''}${c.min ? `min-width:${c.min};` : ''}">${UI.esc(c.label)}${sort === c.key ? `<span class="sort-ind">${dir === 'desc' ? '▼' : '▲'}</span>` : ''}</th>`).join('');
  const body = rows.length ? rows.map((r) => `<tr class="${onRow ? 'clickable' : ''} ${rowClass ? rowClass(r) : ''}" ${rowAttrs ? rowAttrs(r) : ''} data-row="${r.id}">${visible.map((c) => `<td class="${c.align === 'right' ? 'num' : ''} ${c.nowrap ? 'nowrap' : ''}">${c.render ? c.render(r) : UI.esc(r[c.key] ?? '')}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${visible.length}">${empty || UI.empty('Nenhum registro', '')}</td></tr>`;
  box.innerHTML = `<div class="table-toolbar"><div class="muted small">${total ?? rows.length} registro(s)${pages > 1 ? ` · página ${page} de ${pages}` : ''}</div>
    <div class="menu-wrap"><button class="btn ghost sm" type="button" data-cols aria-haspopup="true">${UI.icons.columns} Colunas</button></div></div>
    <div class="table-wrap"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>
    ${pages > 1 ? `<div class="pagination"><button class="btn secondary sm" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>${UI.icons.chevronLeft} Anterior</button><span class="muted">${page} / ${pages}</span><button class="btn secondary sm" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>Próxima ${UI.icons.chevronRight}</button></div>` : ''}`;
  box.querySelectorAll('th[data-sort]').forEach((th) => { th.tabIndex = 0; const go = () => onSort && onSort(th.dataset.sort, sort === th.dataset.sort && dir !== 'desc' ? 'desc' : 'asc'); th.onclick = go; th.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; });
  box.querySelectorAll('[data-page]').forEach((b) => b.onclick = () => onPage && onPage(Number(b.dataset.page)));
  if (onRow) box.querySelectorAll('tr[data-row]').forEach((tr) => { tr.tabIndex = 0; tr.onclick = (e) => { if (e.target.closest('a, button, input, select, label')) return; onRow(rows.find((r) => String(r.id) === tr.dataset.row), e); }; tr.onkeydown = (e) => { if (e.key === 'Enter' && e.target === tr) onRow(rows.find((r) => String(r.id) === tr.dataset.row), e); }; });
  const colsBtn = box.querySelector('[data-cols]');
  colsBtn.onclick = () => {
    const existing = box.querySelector('.col-picker'); if (existing) { existing.remove(); return; }
    const pick = document.createElement('div'); pick.className = 'col-picker';
    pick.innerHTML = columns.map((c) => `<label><input type="checkbox" data-col="${c.key}" ${hiddenCols.has(c.key) ? '' : 'checked'}> ${UI.esc(c.label)}</label>`).join('');
    colsBtn.parentElement.appendChild(pick);
    pick.onchange = (e) => { const k = e.target.dataset.col; if (e.target.checked) hiddenCols.delete(k); else hiddenCols.add(k); UI.store.set(`cols.${id}`, [...hiddenCols]); UI.table(box, { id, columns, rows, total, page, limit, sort, dir, onSort, onPage, onRow, empty, rowClass, rowAttrs }); box.querySelector('[data-cols]').click(); };
    setTimeout(() => document.addEventListener('click', function h(e) { if (!pick.contains(e.target) && e.target !== colsBtn) { pick.remove(); document.removeEventListener('click', h); } }), 0);
  };
};

// Barra de filtros salvos (por escopo). onApply(params), currentParams()
UI.savedFilters = async (box, { scope, current, onApply, extraChips = '' }) => {
  const r = await api('/saved-filters', { query: { scope } }).catch(() => ({ filters: [] }));
  const render = (list) => {
    box.innerHTML = `<div class="chips">${extraChips}${list.map((f) => `<button type="button" class="chip" data-f="${f.id}" title="${f.shared ? 'Compartilhado por ' + UI.esc(f.user_name) : 'Meu filtro'}">${f.shared ? UI.icons.users : UI.icons.filter} ${UI.esc(f.name)}</button>`).join('')}
      <button type="button" class="chip" data-save title="Salvar os filtros atuais">${UI.icons.save} Salvar filtro</button></div>`;
    box.querySelectorAll('[data-f]').forEach((b) => { const f = list.find((x) => x.id === Number(b.dataset.f)); b.onclick = (e) => { if (e.shiftKey || e.altKey) return del(f); onApply(f.params); }; b.oncontextmenu = (e) => { e.preventDefault(); UI.menu(b, [{ label: 'Aplicar', icon: 'filter', onClick: () => onApply(f.params) }, { label: 'Excluir filtro', icon: 'trash', danger: true, onClick: () => del(f) }], { align: 'left' }); }; });
    box.querySelector('[data-save]').onclick = async () => {
      const params = current(); const name = await UI.prompt('Nome do filtro', { title: 'Salvar filtro', placeholder: 'ex.: Meus urgentes' }); if (!name) return;
      const shared = CRM.isManager() ? await UI.confirm('Compartilhar este filtro com toda a equipe?', { title: 'Compartilhar', okLabel: 'Compartilhar' }) : false;
      try { await api('/saved-filters', { method: 'POST', body: { scope, name, params, shared } }); UI.ok('Filtro salvo.'); const r2 = await api('/saved-filters', { query: { scope } }); render(r2.filters); } catch (e) { UI.err(e); }
    };
  };
  const del = async (f) => { if (!(await UI.confirm(`Excluir o filtro "${f.name}"?`, { danger: true, okLabel: 'Excluir' }))) return; try { await api(`/saved-filters/${f.id}`, { method: 'DELETE' }); const r2 = await api('/saved-filters', { query: { scope } }); render(r2.filters); } catch (e) { UI.err(e); } };
  render(r.filters);
};

window.UI = UI;
window.CRM = window.CRM || { pages: {} };
