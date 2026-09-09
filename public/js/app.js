'use strict';
// Núcleo do aplicativo: autenticação, roteamento por hash, layout e tempo real.
const CRM = window.CRM;
Object.assign(CRM, {
  user: null, settings: null, users: [], es: null, unread: 0,
  isManager() { return this.user && (this.user.role === 'admin' || this.user.role === 'supervisor'); },
  isAdmin() { return this.user && this.user.role === 'admin'; },
});

const root = document.getElementById('root');

CRM.onUnauthorized = () => { if (CRM.user) { CRM.user = null; UI.toast('Sua sessão expirou. Faça login novamente.', 'warning'); renderAuth(); } };

function applyBranding() {
  const s = CRM.settings || {};
  document.documentElement.style.setProperty('--primary', s.primary_color || '#1d4ed8');
  document.documentElement.style.setProperty('--primary-dark', shade(s.primary_color || '#1d4ed8', -18));
  document.documentElement.style.setProperty('--accent', s.accent_color || '#0f766e');
  document.title = s.name ? `${s.name} — CRM` : 'CRM';
}
function shade(hex, pct) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (pct / 100) * 255)));
  return '#' + [f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, '0')).join('');
}
function brandHtml(cls = '') {
  const s = CRM.settings || {};
  const logo = s.logo_data ? `<img src="${UI.attr(s.logo_data)}" alt="">` : `<span class="logo-fallback">${UI.esc(UI.initials(s.name || 'CRM'))}</span>`;
  return `<div class="brand ${cls}">${logo}<span>${UI.esc(s.name || 'CRM')}</span></div>`;
}

// ---------- Autenticação ----------
function renderAuth(view = 'login', param) {
  CRM.es && CRM.es.close(); CRM.es = null;
  let body;
  if (view === 'forgot') body = `
    <h2 class="center">Recuperar senha</h2>
    <p class="muted center small">Informe seu e-mail. Se estiver cadastrado, enviaremos um link para redefinir a senha.</p>
    <form id="authForm">${UI.field('email', 'E-mail', UI.input('email', '', 'type="email" required autocomplete="email"'), { required: true })}
    <button class="btn" style="width:100%">Enviar instruções</button></form>
    <p class="center mt small"><a href="#/login">Voltar ao login</a></p>`;
  else if (view === 'reset') body = `
    <h2 class="center">Nova senha</h2>
    <form id="authForm">${UI.field('password', 'Nova senha', UI.input('password', '', 'type="password" required minlength="8" autocomplete="new-password"'), { required: true, hint: 'Mínimo de 8 caracteres.' })}
    ${UI.field('confirm', 'Confirmar senha', UI.input('confirm', '', 'type="password" required autocomplete="new-password"'), { required: true })}
    <button class="btn" style="width:100%">Salvar nova senha</button></form>
    <p class="center mt small"><a href="#/login">Voltar ao login</a></p>`;
  else body = `
    <form id="authForm">${UI.field('email', 'E-mail', UI.input('email', '', 'type="email" required autocomplete="username"'), { required: true })}
    ${UI.field('password', 'Senha', UI.input('password', '', 'type="password" required autocomplete="current-password"'), { required: true })}
    <button class="btn" style="width:100%">Entrar</button></form>
    <p class="center mt small"><a href="#/esqueci-senha">Esqueci minha senha</a></p>`;
  root.innerHTML = `<div class="auth-wrap"><div class="auth-card">${brandHtml()}${CRM.settings && CRM.settings.demo_mode ? '<div class="alert warning small">Modo de demonstração: os dados são fictícios.</div>' : ''}${body}</div></div>`;
  const form = root.querySelector('#authForm');
  form.onsubmit = async (e) => {
    e.preventDefault(); const btn = form.querySelector('button'); btn.disabled = true;
    const d = UI.formData(form);
    try {
      if (view === 'login') { const r = await api('/auth/login', { method: 'POST', body: d }); CRM.user = r.user; location.hash = '#/'; await boot(); }
      else if (view === 'forgot') { const r = await api('/auth/forgot-password', { method: 'POST', body: { email: d.email } }); UI.ok(r.message); if (!r.mail_configured) UI.toast('Envio de e-mail não configurado neste servidor: peça ao administrador um link de redefinição.', 'warning', 9000); }
      else { if (d.password !== d.confirm) { UI.showErrors(form, new ApiError(400, { fields: { confirm: 'As senhas não coincidem.' } })); btn.disabled = false; return; }
        const r = await api('/auth/reset-password', { method: 'POST', body: { token: param, password: d.password } }); UI.ok(r.message); location.hash = '#/login'; }
    } catch (err) { UI.showErrors(form, err); } finally { btn.disabled = false; }
  };
}

// ---------- Layout ----------
const NAV = [
  ['#/', 'Dashboard', 'dashboard'], ['#/clientes', 'Clientes', 'customers'], ['#/atendimentos', 'Atendimentos', 'tickets'],
  ['#/funil', 'Funil', 'pipeline'], ['#/tarefas', 'Tarefas', 'tasks'], ['#/relatorios', 'Relatórios', 'reports'], ['#/configuracoes', 'Configurações', 'settings'],
];

function renderShell() {
  root.innerHTML = `<div id="app">
    <aside class="sidebar" id="sidebar">${brandHtml()}
      <nav class="nav" id="nav">${NAV.map(([h, l, i]) => `<a href="${h}" data-nav="${h}">${UI.icons[i]}<span>${l}</span><span class="badge" data-nav-badge="${h}" hidden></span></a>`).join('')}</nav>
      <div class="sidebar-footer"><div class="user">${UI.esc(CRM.user.name)}</div><div>${UI.ROLE[CRM.user.role]} · <a href="#/perfil" style="color:#93c5fd">Meu perfil</a> · <a href="#" id="logout" style="color:#93c5fd">Sair</a></div></div>
    </aside>
    <div class="main">
      ${CRM.settings.demo_mode ? '<div class="demo-banner">Modo de demonstração — os dados exibidos são fictícios. Desative em Configurações › Empresa.</div>' : ''}
      <header class="topbar">
        <button class="icon-btn menu-toggle" id="menuToggle" aria-label="Menu">${UI.icons.menu}</button>
        <div class="search">${UI.icons.search}<input id="globalSearch" placeholder="Buscar cliente, protocolo, telefone..." autocomplete="off"><div class="search-results" id="searchResults" hidden></div></div>
        <div class="grow"></div>
        ${CRM.user.role === 'atendente' ? `<label class="avail-toggle" title="Disponível para receber atendimentos na distribuição automática"><span class="dot ${CRM.user.available ? 'on' : 'off'}" id="availDot"></span><input type="checkbox" id="availToggle" ${CRM.user.available ? 'checked' : ''}> Disponível</label>` : ''}
        <button class="icon-btn notif-btn" id="notifBtn" aria-label="Notificações">${UI.icons.bell}<span class="count" id="notifCount" hidden></span></button>
      </header>
      <main class="content" id="content"></main>
    </div></div>`;
  root.querySelector('#logout').onclick = async (e) => { e.preventDefault(); await api('/auth/logout', { method: 'POST' }); CRM.user = null; location.hash = '#/login'; renderAuth(); };
  root.querySelector('#menuToggle').onclick = () => root.querySelector('#sidebar').classList.toggle('open');
  root.querySelector('#nav').onclick = () => root.querySelector('#sidebar').classList.remove('open');
  const av = root.querySelector('#availToggle');
  if (av) av.onchange = async () => { try { const r = await api('/auth/me/availability', { method: 'PUT', body: { available: av.checked } }); CRM.user.available = r.available; root.querySelector('#availDot').className = `dot ${r.available ? 'on' : 'off'}`; UI.ok(r.available ? 'Você está disponível para novos atendimentos.' : 'Você está indisponível para distribuição automática.'); } catch (e) { UI.err(e); } };
  root.querySelector('#notifBtn').onclick = toggleNotifications;
  setupSearch();
  refreshBadges();
  connectRealtime();
}

async function refreshBadges() {
  try {
    const [q, t, n] = await Promise.all([api('/tickets', { query: { queue: 'true', limit: 1 } }), api('/tasks', { query: { view: 'overdue' } }), api('/notifications')]);
    setBadge('#/atendimentos', q.total, 'warning'); setBadge('#/tarefas', t.summary.overdue, 'danger');
    CRM.unread = n.unread; const c = root.querySelector('#notifCount'); if (c) { c.textContent = n.unread; c.hidden = !n.unread; }
  } catch (_) { /* silencioso */ }
}
function setBadge(nav, n, cls) { const el = root.querySelector(`[data-nav-badge="${nav}"]`); if (!el) return; el.textContent = n; el.className = `badge ${cls}`; el.hidden = !n; }

async function toggleNotifications() {
  const existing = document.querySelector('.notif-panel'); if (existing) { existing.remove(); return; }
  const r = await api('/notifications');
  const panel = document.createElement('div'); panel.className = 'notif-panel';
  const alerts = [];
  if (r.alerts.overdue_tasks) alerts.push(`<div class="item unread"><strong>${r.alerts.overdue_tasks} tarefa(s) atrasada(s)</strong><br><a href="#/tarefas">Ver tarefas</a></div>`);
  if (r.alerts.follow_ups_due) alerts.push(`<div class="item unread"><strong>${r.alerts.follow_ups_due} retorno(s) pendente(s) até amanhã</strong><br><a href="#/atendimentos?follow_up=pending">Ver atendimentos</a></div>`);
  panel.innerHTML = `<div class="flex between" style="padding:.6rem .9rem;border-bottom:1px solid var(--border)"><strong>Notificações</strong><button class="btn ghost sm" id="readAll">Marcar todas como lidas</button></div>
    ${alerts.join('')}${r.notifications.length ? r.notifications.map((n) => `<div class="item ${n.read_at ? '' : 'unread'}"><div>${UI.esc(n.title)}</div><div class="muted small">${UI.esc(n.body || '')}</div><div class="small">${n.link ? `<a href="${UI.attr(n.link)}">Abrir</a> · ` : ''}${UI.relative(n.created_at)}</div></div>`).join('') : (alerts.length ? '' : '<div class="item muted">Nenhuma notificação.</div>')}`;
  panel.querySelector('#readAll').onclick = async () => { await api('/notifications/read-all', { method: 'POST' }); panel.remove(); refreshBadges(); };
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) setTimeout(() => panel.remove(), 50); });
  root.querySelector('.main').appendChild(panel);
  setTimeout(() => document.addEventListener('click', function h(e) { if (!panel.contains(e.target) && !e.target.closest('#notifBtn')) { panel.remove(); document.removeEventListener('click', h); } }), 0);
}

function connectRealtime() {
  if (CRM.es) CRM.es.close();
  const es = new EventSource('/api/notifications/stream'); CRM.es = es;
  const refresh = UI.debounce(() => { refreshBadges(); if (CRM.currentPage && CRM.currentPage.onRealtime) CRM.currentPage.onRealtime(); }, 400);
  es.addEventListener('tickets_changed', refresh);
  es.addEventListener('pipeline_changed', refresh);
  es.addEventListener('whatsapp_message', refresh);
  es.addEventListener('settings_changed', async () => { CRM.settings = (await api('/settings/public')).settings; applyBranding(); });
  es.addEventListener('notification', (e) => { const d = JSON.parse(e.data); UI.toast(`${d.title}${d.body ? ': ' + d.body : ''}`, 'info', 6000); refresh(); });
  es.onerror = () => { es.close(); setTimeout(() => { if (CRM.user) connectRealtime(); }, 5000); };
}

function setupSearch() {
  const input = root.querySelector('#globalSearch'), box = root.querySelector('#searchResults');
  const run = UI.debounce(async () => {
    const q = input.value.trim(); if (q.length < 2) { box.hidden = true; return; }
    try {
      const [c, t] = await Promise.all([api('/customers', { query: { q, limit: 6 } }), api('/tickets', { query: { q, limit: 6 } })]);
      box.innerHTML = `${c.customers.length ? '<div class="cat">Clientes</div>' + c.customers.map((x) => `<a href="#/clientes/${x.id}"><strong>${UI.esc(x.name)}</strong> <span class="muted small">${UI.esc(x.phone || '')} ${UI.esc(x.company || '')}</span></a>`).join('') : ''}
        ${t.tickets.length ? '<div class="cat">Atendimentos</div>' + t.tickets.map((x) => `<a href="#/atendimentos/${x.id}"><span class="mono">${UI.esc(x.protocol)}</span> ${UI.esc(x.subject)} <span class="muted small">— ${UI.esc(x.customer_name)}</span></a>`).join('') : ''}
        ${!c.customers.length && !t.tickets.length ? '<div class="cat">Nenhum resultado</div>' : ''}`;
      box.hidden = false;
    } catch (_) { box.hidden = true; }
  }, 250);
  input.oninput = run;
  input.onkeydown = (e) => { if (e.key === 'Escape') { box.hidden = true; input.blur(); } if (e.key === 'Enter') { location.hash = `#/clientes?q=${encodeURIComponent(input.value.trim())}`; box.hidden = true; } };
  box.onclick = () => { box.hidden = true; input.value = ''; };
  document.addEventListener('click', (e) => { if (!e.target.closest('.search')) box.hidden = true; });
}

// ---------- Roteador ----------
function parseHash() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return { path, parts, query: Object.fromEntries(new URLSearchParams(qs || '')) };
}

async function route() {
  const { parts, query } = parseHash();
  const p0 = parts[0] || '';
  if (!CRM.user) {
    if (p0 === 'esqueci-senha') return renderAuth('forgot');
    if (p0 === 'redefinir-senha' && parts[1]) return renderAuth('reset', parts[1]);
    return renderAuth('login');
  }
  if (p0 === 'login' || p0 === 'esqueci-senha' || p0 === 'redefinir-senha') { location.hash = '#/'; return; }
  if (!root.querySelector('#app')) renderShell();
  const map = { '': 'dashboard', clientes: 'customers', atendimentos: 'tickets', funil: 'pipeline', tarefas: 'tasks', relatorios: 'reports', configuracoes: 'settings', perfil: 'profile' };
  const key = map[p0];
  root.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === `#/${p0}`));
  const content = root.querySelector('#content');
  if (!key || !CRM.pages[key]) { content.innerHTML = UI.empty('Página não encontrada', 'Use o menu lateral para navegar.'); return; }
  CRM.currentPage = CRM.pages[key];
  content.innerHTML = '<p class="muted">Carregando...</p>';
  try { await CRM.pages[key].render(content, { id: parts[1] ? Number(parts[1]) : null, sub: parts[1], query }); }
  catch (err) { if (err.status === 401) return; content.innerHTML = `<div class="alert danger">${UI.esc(err.message)}</div>`; }
}

CRM.loadUsers = async () => { CRM.users = (await api('/users')).users; return CRM.users; };
CRM.pageHeader = (title, subtitle, actions = '') => `<div class="page-header"><div><h1>${UI.esc(title)}</h1>${subtitle ? `<p>${UI.esc(subtitle)}</p>` : ''}</div><div class="flex wrap">${actions}</div></div>`;

// Página de perfil
CRM.pages.profile = {
  async render(el) {
    el.innerHTML = CRM.pageHeader('Meu perfil', `${CRM.user.name} · ${CRM.user.email}`) + `<div class="grid cols-2"><div class="card"><h3>Alterar senha</h3>
      <form id="pwForm">${UI.field('current_password', 'Senha atual', UI.input('current_password', '', 'type="password" required autocomplete="current-password"'), { required: true })}
      ${UI.field('new_password', 'Nova senha', UI.input('new_password', '', 'type="password" required minlength="8" autocomplete="new-password"'), { required: true, hint: 'Mínimo de 8 caracteres.' })}
      <button class="btn">Salvar</button></form></div>
      <div class="card"><h3>Sessão</h3><p class="muted">Perfil: <strong>${UI.ROLE[CRM.user.role]}</strong></p><p class="muted small">Sua sessão expira automaticamente após o período configurado pelo administrador.</p></div></div>`;
    el.querySelector('#pwForm').onsubmit = async (e) => { e.preventDefault(); try { const r = await api('/auth/me/password', { method: 'PUT', body: UI.formData(e.target) }); UI.ok(r.message); e.target.reset(); } catch (err) { UI.showErrors(e.target, err); } };
  },
};

async function boot() {
  try { CRM.settings = (await api('/settings/public')).settings; applyBranding(); } catch (_) { CRM.settings = {}; }
  if (!CRM.user) { try { CRM.user = (await api('/auth/me')).user; } catch (_) { CRM.user = null; } }
  if (CRM.user) { await CRM.loadUsers().catch(() => {}); root.innerHTML = ''; }
  route();
}
// Navegação por linhas clicáveis (data-href) sem handlers inline, compatível com a CSP.
document.addEventListener('click', (e) => {
  if (e.target.closest('a, button, input, select, textarea, label')) return;
  const el = e.target.closest('[data-href]'); if (el) location.hash = el.dataset.href;
});
document.addEventListener('focusin', (e) => { if (e.target.matches('[data-select-all]')) e.target.select(); });
window.addEventListener('hashchange', route);
boot();
