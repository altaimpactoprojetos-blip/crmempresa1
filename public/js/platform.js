'use strict';
// Painel do dono da plataforma: empresas-clientes, planos, receita e registro de ações.
const root = document.getElementById('root');
const P = {
  admin: null,
  STATUS: {
    trial: ['Teste', 'primary'],
    active: ['Ativa', 'success'],
    past_due: ['Em atraso', 'warning'],
    suspended: ['Suspensa', 'danger'],
    cancelled: ['Cancelada', ''],
  },
};
CRM.onUnauthorized = () => {
  if (P.admin) {
    P.admin = null;
    login();
  }
};
const status = (s) => {
  const [l, c] = P.STATUS[s] || [s, ''];
  return `<span class="badge ${c}">${l}</span>`;
};
const money = (cents) => UI.fmtMoney((cents || 0) / 100);
const header = (title, sub = '', actions = '') =>
  `<div class="page-header"><div><h1>${UI.esc(title)}</h1>${sub ? `<p>${UI.esc(sub)}</p>` : ''}</div><div class="flex wrap">${actions}</div></div>`;

function login() {
  root.innerHTML = `<div class="auth-wrap"><aside class="auth-side"><div><h1>Painel da plataforma</h1>
      <p>Acompanhe as empresas que usam o CRM, planos, testes e pagamentos.</p></div></aside>
    <main class="auth-main"><div class="auth-card"><h2 class="center">Entrar no painel</h2>
      <form id="loginForm">${UI.field('email', 'E-mail', UI.input('email', '', 'type="email" required autocomplete="username"'))}
      ${UI.field('password', 'Senha', UI.input('password', '', 'type="password" required autocomplete="current-password"'))}
      <button class="btn block">Entrar</button></form>
      <p class="small muted center mt">O acesso é criado no servidor com <span class="mono">npm run create-platform-admin</span>.</p></div></main></div>`;
  root.querySelector('#loginForm').onsubmit = async (e) => {
    e.preventDefault();
    try {
      P.admin = (await api('/platform/login', { method: 'POST', body: UI.formData(e.target) })).admin;
      shell();
    } catch (err) {
      UI.showErrors(e.target, err);
      if (!err.data?.fields) UI.err(err);
    }
  };
}

const TABS = [
  ['visao', 'Visão geral'],
  ['empresas', 'Empresas'],
  ['planos', 'Planos'],
  ['registro', 'Registro'],
];

function shell() {
  root.innerHTML = `<div class="platform"><header class="platform-top"><strong>Painel da plataforma</strong>
      <nav class="tabs" id="ptabs">${TABS.map(([k, l]) => `<button data-tab="${k}">${l}</button>`).join('')}</nav>
      <div class="grow"></div><span class="small muted">${UI.esc(P.admin.name)}</span><button class="btn ghost sm" id="plogout">Sair</button></header>
      <main class="content" id="pcontent"></main></div>`;
  root.querySelector('#ptabs').onclick = (e) => {
    const b = e.target.closest('[data-tab]');
    if (b) location.hash = `#/${b.dataset.tab}`;
  };
  root.querySelector('#plogout').onclick = async () => {
    await api('/platform/logout', { method: 'POST' });
    P.admin = null;
    login();
  };
  route();
}

async function route() {
  if (!P.admin) return;
  const tab = (location.hash.replace(/^#\/?/, '').split(/[/?]/)[0] || 'visao').trim();
  const key = TABS.some(([k]) => k === tab) ? tab : 'visao';
  root.querySelectorAll('#ptabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === key));
  UI.closeModals();
  const el = root.querySelector('#pcontent');
  el.onclick = null; // cada aba registra os seus próprios cliques
  el.innerHTML = '<p class="muted">Carregando...</p>';
  try {
    await PAGES[key](el);
  } catch (err) {
    el.innerHTML = `<div class="alert danger">${UI.esc(err.message)}</div>`;
  }
}

const kpi = (label, value, sub = '', cls = '') =>
  `<div class="kpi ${cls}"><div class="label">${label}</div><div class="value">${value}</div><div class="sub">${sub}</div></div>`;

const PAGES = {
  async visao(el) {
    const [o, { companies }] = await Promise.all([api('/platform/overview'), api('/platform/companies')]);
    const ending = companies
      .filter((c) => c.status === 'trial' && c.trial_ends_at && new Date(c.trial_ends_at) > Date.now())
      .sort((a, b) => new Date(a.trial_ends_at) - new Date(b.trial_ends_at))
      .slice(0, 8);
    const late = companies.filter((c) => c.status === 'past_due');
    const list = (rows, empty, col) =>
      rows.length
        ? `<table><tbody>${rows.map((c) => `<tr class="clickable" data-company="${c.id}"><td><strong>${UI.esc(c.name)}</strong><div class="muted small">${UI.esc(c.admin_email || '')}</div></td><td class="small nowrap">${col(c)}</td></tr>`).join('')}</tbody></table>`
        : UI.empty(empty);
    el.innerHTML =
      header('Visão geral', 'Números do negócio em tempo real.') +
      `<div class="grid cols-4 mb">${kpi('Receita mensal recorrente', money(o.mrr_cents), 'empresas ativas e em atraso', 'ok')}
        ${kpi('Recebido no mês', money(o.received_month_cents), 'pagamentos confirmados')}
        ${kpi('Empresas ativas', o.active, `${o.trial} em teste`)}
        ${kpi('Em atraso', o.past_due, `${o.suspended} suspensa(s) · ${o.cancelled} cancelada(s)`, o.past_due ? 'warn' : '')}</div>
      <div class="grid cols-4 mb">${kpi('Cadastros (30 dias)', o.signups_30d)}${kpi('Testes acabando (7 dias)', o.trials_ending, '', o.trials_ending ? 'warn' : '')}</div>
      <div class="grid cols-2"><div class="card"><h3>Testes terminando</h3>${list(ending, 'Nenhum teste em andamento', (c) => `termina ${UI.fmtDate(c.trial_ends_at)}`)}</div>
        <div class="card"><h3>Pagamentos em atraso</h3>${list(late, 'Nenhuma empresa em atraso', (c) => `desde ${UI.fmtDate(c.past_due_since)}`)}</div></div>`;
    el.onclick = (e) => {
      const r = e.target.closest('[data-company]');
      if (r) companyDetail(Number(r.dataset.company), () => PAGES.visao(el));
    };
  },

  async empresas(el) {
    const q = new URLSearchParams(location.hash.split('?')[1] || '');
    const { companies } = await api('/platform/companies', { query: { q: q.get('q'), status: q.get('status') } });
    el.innerHTML =
      header('Empresas', `${companies.length} empresa(s)`) +
      `<form class="filters card" id="pf"><div class="field grow"><label>Busca</label><input name="q" value="${UI.attr(q.get('q') || '')}" placeholder="Nome da empresa ou e-mail de um usuário"></div>
        <div class="field"><label>Situação</label>${UI.select('status', [['', 'Todas'], ...Object.entries(P.STATUS).map(([k, [l]]) => [k, l])], q.get('status') || '')}</div>
        <button class="btn secondary">Filtrar</button></form>
      <div class="card"><div class="table-wrap"><table><thead><tr><th>Empresa</th><th>Plano</th><th>Situação</th><th>Usuários</th><th>Canais</th><th>Mensagens (30d)</th><th>Último acesso</th><th>Criada</th></tr></thead><tbody>
      ${
        companies
          .map(
            (
              c,
            ) => `<tr class="clickable" data-company="${c.id}"><td><strong>${UI.esc(c.name)}</strong><div class="muted small">${UI.esc(c.admin_email || '')}</div></td>
          <td>${UI.esc(c.plan_name)}<div class="muted small">${c.price_cents ? `${money(c.price_cents)}/mês` : ''}</div></td>
          <td>${status(c.status)}${c.status === 'trial' && c.trial_ends_at ? `<div class="muted small">até ${UI.fmtDate(c.trial_ends_at)}</div>` : ''}${c.current_period_end ? `<div class="muted small">pago até ${UI.fmtDate(c.current_period_end)}</div>` : ''}</td>
          <td>${c.users}</td><td>${c.channels}</td><td>${c.messages_30d}</td><td class="small">${c.last_login_at ? UI.relative(c.last_login_at) : '—'}</td><td class="small">${UI.fmtDate(c.created_at)}</td></tr>`,
          )
          .join('') || `<tr><td colspan="8">${UI.empty('Nenhuma empresa encontrada')}</td></tr>`
      }</tbody></table></div></div>`;
    el.querySelector('#pf').onsubmit = (e) => {
      e.preventDefault();
      const d = UI.formData(e.target);
      const qs = new URLSearchParams(Object.entries(d).filter(([, v]) => v));
      location.hash = `#/empresas?${qs}`;
    };
    el.querySelector('tbody').onclick = (e) => {
      const r = e.target.closest('[data-company]');
      if (r) companyDetail(Number(r.dataset.company), () => PAGES.empresas(el));
    };
  },

  async planos(el) {
    const { plans } = await api('/platform/plans');
    el.innerHTML =
      header(
        'Planos',
        'Preços e limites oferecidos às empresas. Planos não públicos só podem ser atribuídos por aqui.',
      ) +
      `<div class="card"><div class="table-wrap"><table><thead><tr><th>Plano</th><th>Preço</th><th>Usuários</th><th>Canais</th><th>Automações</th><th>Robô</th><th>Visível</th><th>Empresas</th><th></th></tr></thead><tbody>
      ${plans
        .map(
          (
            p,
          ) => `<tr><td><strong>${UI.esc(p.name)}</strong> <span class="muted small mono">${UI.esc(p.id)}</span></td><td>${money(p.price_cents)}</td>
          <td>${p.max_users ?? '∞'}</td><td>${p.max_channels ?? '∞'}</td><td>${p.features.automations ? 'Sim' : 'Não'}</td><td>${p.features.chatbot ? 'Sim' : 'Não'}</td>
          <td>${p.public ? 'Sim' : 'Não'}</td><td>${p.companies}</td><td><button class="btn ghost sm" data-edit="${p.id}">Editar</button></td></tr>`,
        )
        .join('')}</tbody></table></div></div>`;
    el.querySelector('tbody').onclick = (e) => {
      const b = e.target.closest('[data-edit]');
      if (b)
        planForm(
          plans.find((p) => p.id === b.dataset.edit),
          () => PAGES.planos(el),
        );
    };
  },

  async registro(el) {
    const { log } = await api('/platform/audit');
    el.innerHTML =
      header('Registro', 'Últimas 200 ações no painel.') +
      `<div class="card"><div class="table-wrap"><table><thead><tr><th>Quando</th><th>Quem</th><th>Ação</th><th>Empresa</th><th>Detalhes</th><th>IP</th></tr></thead><tbody>
      ${log.map((l) => `<tr><td class="small nowrap">${UI.fmtDateTime(l.created_at)}</td><td>${UI.esc(l.admin_name || '—')}</td><td class="mono small">${UI.esc(l.action)}</td><td>${UI.esc(l.company_name || '')}</td><td class="small mono">${UI.esc(JSON.stringify(l.details))}</td><td class="small">${UI.esc(l.ip || '')}</td></tr>`).join('')}</tbody></table></div></div>`;
  },
};

async function companyDetail(id, onChange) {
  const [{ company: c, users, payments, log }, { plans }] = await Promise.all([
    api(`/platform/companies/${id}`),
    api('/platform/plans'),
  ]);
  const toDate = (d) => (d ? new Date(d).toISOString().slice(0, 10) : '');
  const m = UI.modal({
    title: c.name,
    size: 'wide',
    body: `<div class="grid cols-2"><div>
        <table class="small"><tbody><tr><th>Situação</th><td>${status(c.status)}</td></tr><tr><th>Plano</th><td>${UI.esc(c.plan_name)} (${money(c.price_cents)}/mês)</td></tr>
          <tr><th>Teste até</th><td>${UI.fmtDate(c.trial_ends_at)}</td></tr><tr><th>Pago até</th><td>${UI.fmtDate(c.current_period_end)}</td></tr>
          <tr><th>Assinatura automática</th><td>${c.has_subscription ? 'Sim' : 'Não'}</td></tr><tr><th>Cobrança</th><td>${UI.esc(c.billing_email || '—')} ${c.billing_document ? `· ${UI.esc(c.billing_document)}` : ''}</td></tr>
          <tr><th>Uso</th><td>${c.users} usuário(s) · ${c.channels} canal(is) · ${c.messages_30d} mensagens em 30 dias</td></tr><tr><th>Criada em</th><td>${UI.fmtDateTime(c.created_at)}</td></tr></tbody></table>
        <h4 class="mt">Ações rápidas</h4><div class="flex wrap">
          ${c.status === 'suspended' ? '<button class="btn sm" data-act="reactivate">Reativar</button>' : '<button class="btn danger sm" data-act="suspend">Suspender</button>'}
          <button class="btn secondary sm" data-act="trial7">Teste +7 dias</button><button class="btn secondary sm" data-act="trial30">Teste +30 dias</button></div>
        <form id="coEdit" class="mt"><div class="form-row">${UI.field(
          'plan',
          'Plano',
          UI.select(
            'plan',
            plans.map((p) => [p.id, `${p.name} (${money(p.price_cents)})`]),
            c.plan,
          ),
        )}
          ${UI.field(
            'status',
            'Situação',
            UI.select(
              'status',
              Object.entries(P.STATUS).map(([k, [l]]) => [k, l]),
              c.status,
            ),
          )}</div>
          <div class="form-row">${UI.field('trial_ends_at', 'Teste até', `<input type="date" name="trial_ends_at" value="${toDate(c.trial_ends_at)}">`)}
          ${UI.field('current_period_end', 'Pago até', `<input type="date" name="current_period_end" value="${toDate(c.current_period_end)}">`, { hint: 'Para pagamentos recebidos fora do sistema (Pix direto, transferência).' })}</div>
          ${UI.field('notes', 'Anotações internas', UI.textarea('notes', c.notes || '', 'rows="3"'))}
          <button class="btn">Salvar alterações</button></form></div>
      <div><h4>Usuários</h4><table class="small"><tbody>${users.map((u) => `<tr><td>${UI.esc(u.name)}<div class="muted">${UI.esc(u.email)}</div></td><td>${UI.esc(u.role)}${u.active ? '' : ' (inativo)'}</td><td class="nowrap">${u.last_login_at ? UI.relative(u.last_login_at) : 'nunca entrou'}</td></tr>`).join('')}</tbody></table>
        <h4 class="mt">Pagamentos</h4>${payments.length ? `<table class="small"><tbody>${payments.map((p) => `<tr><td>${UI.fmtDate(p.due_date)}</td><td>${money(p.value_cents)}</td><td>${UI.esc(p.status)}</td><td>${p.paid_at ? UI.fmtDate(p.paid_at) : ''}</td></tr>`).join('')}</tbody></table>` : '<p class="muted small">Nenhum pagamento.</p>'}
        <h4 class="mt">Histórico no painel</h4>${log.length ? log.map((l) => `<div class="small"><span class="muted">${UI.fmtDateTime(l.created_at)}</span> · ${UI.esc(l.admin_name || '')} · <span class="mono">${UI.esc(JSON.stringify(l.details))}</span></div>`).join('') : '<p class="muted small">Sem alterações.</p>'}</div></div>`,
    footer: '<button class="btn secondary" data-close>Fechar</button>',
  });
  const save = async (body, msg) => {
    try {
      const r = await api(`/platform/companies/${id}`, { method: 'PUT', body });
      UI.ok(msg || r.message);
      m.close();
      onChange();
    } catch (err) {
      UI.err(err);
    }
  };
  const plusDays = (n) => {
    const base = c.trial_ends_at && new Date(c.trial_ends_at) > Date.now() ? new Date(c.trial_ends_at) : new Date();
    return new Date(base.getTime() + n * 86400000).toISOString();
  };
  m.el.querySelector('.flex.wrap').onclick = async (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'suspend') {
      if (
        !(await UI.confirm(`Suspender "${c.name}"? Todos os usuários perdem o acesso na hora.`, {
          danger: true,
          okLabel: 'Suspender',
        }))
      )
        return;
      save({ status: 'suspended' }, 'Empresa suspensa.');
    }
    if (act === 'reactivate') save({ status: c.current_period_end ? 'active' : 'trial' }, 'Empresa reativada.');
    if (act === 'trial7' || act === 'trial30')
      save({ status: 'trial', trial_ends_at: plusDays(act === 'trial7' ? 7 : 30) }, 'Teste prorrogado.');
  };
  m.el.querySelector('#coEdit').onsubmit = (e) => {
    e.preventDefault();
    const d = UI.formData(e.target);
    const endOfDay = (s) => (s ? new Date(`${s}T23:59:59`).toISOString() : null);
    save({
      plan: d.plan,
      status: d.status,
      trial_ends_at: endOfDay(d.trial_ends_at),
      current_period_end: endOfDay(d.current_period_end),
      notes: d.notes || null,
    });
  };
}

function planForm(p, onSaved) {
  const m = UI.modal({
    title: `Plano ${p.name}`,
    size: 'narrow',
    body: `<form id="plForm">${UI.field('name', 'Nome', UI.input('name', p.name, 'required'))}
      ${UI.field('price', 'Preço mensal (R$)', UI.input('price', (p.price_cents / 100).toFixed(2).replace('.', ','), 'data-type="money" required'))}
      <div class="form-row">${UI.field('max_users', 'Máx. de usuários', `<input type="number" name="max_users" min="1" value="${p.max_users ?? ''}" placeholder="Sem limite">`)}
      ${UI.field('max_channels', 'Máx. de canais', `<input type="number" name="max_channels" min="1" value="${p.max_channels ?? ''}" placeholder="Sem limite">`)}</div>
      <label class="check"><input type="checkbox" name="automations" ${p.features.automations ? 'checked' : ''}> Automações do funil</label>
      <label class="check"><input type="checkbox" name="chatbot" ${p.features.chatbot ? 'checked' : ''}> Robô de atendimento</label>
      <label class="check"><input type="checkbox" name="public" ${p.public ? 'checked' : ''}> Visível para as empresas escolherem</label></form>`,
    footer:
      '<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="plForm">Salvar</button>',
  });
  const f = m.el.querySelector('#plForm');
  f.onsubmit = async (e) => {
    e.preventDefault();
    const d = UI.formData(f);
    const num = (v) => (v === '' || v == null ? null : Number(v));
    try {
      const r = await api(`/platform/plans/${p.id}`, {
        method: 'PUT',
        body: {
          name: d.name,
          price_cents: Math.round(d.price * 100),
          max_users: num(f.max_users.value),
          max_channels: num(f.max_channels.value),
          features: { automations: f.automations.checked, chatbot: f.chatbot.checked },
          public: f.public.checked,
        },
      });
      UI.ok(r.message);
      m.close();
      onSaved();
    } catch (err) {
      UI.err(err);
    }
  };
}

window.addEventListener('hashchange', route);
(async () => {
  try {
    P.admin = (await api('/platform/me')).admin;
    shell();
  } catch (_) {
    login();
  }
})();
