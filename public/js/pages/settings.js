'use strict';
CRM.pages.settings = {
  async render(el, { sub }) {
    this.el = el;
    const r = await api('/settings'); this.data = r;
    const tabs = [['empresa', 'Empresa'], ['usuarios', 'Usuários'], ['funil', 'Funil'], ['canais', 'Canais e origens'], ['integracoes', 'Integrações'], ['backup', 'Backup'], ['auditoria', 'Auditoria']];
    const visible = CRM.isAdmin() ? tabs : tabs.filter(([k]) => ['integracoes', 'auditoria', 'funil'].includes(k));
    this.tab = sub && visible.some(([k]) => k === sub) ? sub : visible[0][0];
    el.innerHTML = CRM.pageHeader('Configurações', CRM.isAdmin() ? 'Identidade visual, equipe, funil e integrações.' : 'Consulta de configurações. Alterações exigem perfil de administrador.') +
      `<div class="tabs">${visible.map(([k, l]) => `<button data-tab="${k}" class="${this.tab === k ? 'active' : ''}">${l}</button>`).join('')}</div><div id="tabBody"></div>`;
    el.querySelector('.tabs').onclick = (e) => { const b = e.target.closest('[data-tab]'); if (b) location.hash = `#/configuracoes/${b.dataset.tab}`; };
    this[this.tab](el.querySelector('#tabBody'));
  },

  empresa(box) {
    const s = this.data.settings;
    box.innerHTML = `<div class="card"><form id="coForm"><div class="grid" style="grid-template-columns: 1fr 260px">
      <div>${UI.field('name', 'Nome da empresa', UI.input('name', s.name, 'required'), { required: true })}
        <div class="form-row">${UI.field('primary_color', 'Cor principal', `<div class="flex"><input type="color" class="color-swatch" id="pc" value="${s.primary_color}"><input name="primary_color" value="${s.primary_color}" pattern="^#[0-9a-fA-F]{6}$"></div>`)}${UI.field('accent_color', 'Cor de destaque', `<div class="flex"><input type="color" class="color-swatch" id="ac" value="${s.accent_color}"><input name="accent_color" value="${s.accent_color}" pattern="^#[0-9a-fA-F]{6}$"></div>`)}</div>
        ${UI.field('timezone', 'Fuso horário', UI.input('timezone', s.timezone), { hint: 'Ex.: America/Sao_Paulo' })}
        <label class="check"><input type="checkbox" name="auto_distribution" ${s.auto_distribution ? 'checked' : ''}> Distribuição automática em rodízio ao abrir atendimentos sem responsável</label>
        <label class="check mt"><input type="checkbox" name="demo_mode" ${s.demo_mode ? 'checked' : ''}> Modo de demonstração (exibe aviso de dados fictícios)</label></div>
      <div><label>Logotipo</label><img class="logo-preview" id="logoPrev" src="${UI.attr(s.logo_data || '')}" alt="" ${s.logo_data ? '' : 'hidden'}><div class="field mt"><input type="file" id="logoFile" accept="image/png,image/jpeg,image/svg+xml,image/webp"><div class="hint">PNG, JPEG, WEBP ou SVG, até 300KB.</div></div><button type="button" class="btn ghost sm" id="logoClear">Remover logotipo</button></div></div>
      <div class="right mt"><button class="btn">Salvar</button></div></form></div>`;
    const form = box.querySelector('#coForm'); let logo;
    box.querySelector('#pc').oninput = (e) => form.primary_color.value = e.target.value; box.querySelector('#ac').oninput = (e) => form.accent_color.value = e.target.value;
    box.querySelector('#logoFile').onchange = (e) => { const f = e.target.files[0]; if (!f) return; if (f.size > 300 * 1024) { UI.toast('Arquivo maior que 300KB.', 'error'); e.target.value = ''; return; } const rd = new FileReader(); rd.onload = () => { logo = rd.result; const p = box.querySelector('#logoPrev'); p.src = logo; p.hidden = false; }; rd.readAsDataURL(f); };
    box.querySelector('#logoClear').onclick = () => { logo = null; box.querySelector('#logoPrev').hidden = true; };
    form.onsubmit = async (e) => { e.preventDefault(); const d = UI.formData(form); if (logo !== undefined) d.logo_data = logo;
      try { const r = await api('/settings', { method: 'PUT', body: d }); UI.ok(r.message); CRM.settings = r.settings; location.reload(); } catch (err) { UI.showErrors(form, err); } };
  },

  async usuarios(box) {
    const r = await api('/users', { query: { include_inactive: 'true' } });
    box.innerHTML = `<div class="card"><div class="card-title"><h3>Equipe (${r.users.filter((u) => u.active).length} ativos)</h3><button class="btn" id="newUser">+ Novo usuário</button></div>
      <div class="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th>Disponível</th><th>Último acesso</th><th></th></tr></thead><tbody>
      ${r.users.map((u) => `<tr><td><strong>${UI.esc(u.name)}</strong></td><td class="small">${UI.esc(u.email)}</td><td><span class="badge ${u.role === 'admin' ? 'dark' : u.role === 'supervisor' ? 'purple' : 'primary'}">${UI.ROLE[u.role]}</span></td><td>${u.active ? '<span class="badge success">Ativo</span>' : '<span class="badge">Desativado</span>'}</td><td class="small">${u.role === 'atendente' ? (u.available ? 'Sim' : 'Não') : '—'}</td><td class="small">${UI.fmtDateTime(u.last_login_at)}</td>
        <td class="nowrap"><button class="btn sm secondary" data-edit="${u.id}">Editar</button> <button class="btn sm secondary" data-link="${u.id}" title="Gerar link de redefinição de senha">Senha</button> ${u.active ? `<button class="btn sm danger" data-deact="${u.id}" ${u.id === CRM.user.id ? 'disabled' : ''}>Desativar</button>` : `<button class="btn sm success" data-act="${u.id}">Reativar</button>`}</td></tr>`).join('')}</tbody></table></div>
      <p class="muted small mt">Desativar um usuário preserva todo o histórico e exige a transferência das pendências (atendimentos, tarefas e oportunidades abertas) para outro responsável.</p></div>`;
    box.querySelector('#newUser').onclick = () => this.userForm(null, () => this.usuarios(box));
    box.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => this.userForm(r.users.find((u) => u.id === Number(b.dataset.edit)), () => this.usuarios(box)));
    box.querySelectorAll('[data-act]').forEach((b) => b.onclick = async () => { try { const x = await api(`/users/${b.dataset.act}/activate`, { method: 'POST' }); UI.ok(x.message); await CRM.loadUsers(); this.usuarios(box); } catch (err) { UI.err(err); } });
    box.querySelectorAll('[data-link]').forEach((b) => b.onclick = async () => { try { const x = await api(`/users/${b.dataset.link}/reset-link`, { method: 'POST' }); UI.modal({ title: 'Link de redefinição de senha', size: 'narrow', body: `<p class="small">${UI.esc(x.message)} Envie ao usuário por um canal seguro:</p><input readonly value="${UI.attr(x.link)}" data-select-all>`, footer: '<button class="btn" data-close>Fechar</button>' }); } catch (err) { UI.err(err); } });
    box.querySelectorAll('[data-deact]').forEach((b) => b.onclick = () => this.deactivate(r.users.find((u) => u.id === Number(b.dataset.deact)), r.users, () => this.usuarios(box)));
  },
  userForm(u, done) {
    const isEdit = Boolean(u);
    const m = UI.modal({ title: isEdit ? 'Editar usuário' : 'Novo usuário', body: `<form id="uForm"><div class="form-row">${UI.field('name', 'Nome', UI.input('name', u?.name, 'required'), { required: true })}${UI.field('email', 'E-mail', UI.input('email', u?.email, 'type="email" required'), { required: true })}</div>
      <div class="form-row">${UI.field('role', 'Perfil', UI.select('role', Object.entries(UI.ROLE), u?.role || 'atendente'), { required: true })}${UI.field('password', isEdit ? 'Nova senha (deixe em branco para manter)' : 'Senha inicial', UI.input('password', '', `type="password" minlength="8" ${isEdit ? '' : 'required'} autocomplete="new-password"`), { required: !isEdit, hint: 'Mínimo de 8 caracteres.' })}</div>
      <label class="check"><input type="checkbox" name="available" ${u ? (u.available ? 'checked' : '') : 'checked'}> Disponível para distribuição automática (atendentes)</label>
      <div class="help mt"><strong>Administrador:</strong> configura o sistema e gerencia usuários. <strong>Supervisor:</strong> acompanha a equipe, indicadores e redistribui atendimentos. <strong>Atendente:</strong> acessa seus clientes e atendimentos e a fila compartilhada.</div></form>`,
      footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="uForm">${isEdit ? 'Salvar' : 'Criar usuário'}</button>` });
    m.el.querySelector('#uForm').onsubmit = async (e) => { e.preventDefault(); const d = UI.formData(e.target); if (!d.password) delete d.password;
      try { const r = isEdit ? await api(`/users/${u.id}`, { method: 'PUT', body: d }) : await api('/users', { method: 'POST', body: d }); UI.ok(r.message); m.close(); await CRM.loadUsers(); done(); } catch (err) { UI.showErrors(e.target, err); } };
  },
  deactivate(u, users, done) {
    const others = users.filter((x) => x.active && x.id !== u.id);
    const m = UI.modal({ title: `Desativar ${u.name}`, size: 'narrow', body: `<form id="dForm"><p class="small">O usuário perderá o acesso imediatamente. O histórico é preservado. As pendências (atendimentos abertos, tarefas, oportunidades e clientes sob responsabilidade) serão transferidas para:</p>
      ${UI.field('transfer_to', 'Transferir pendências para', UI.select('transfer_to', [['', '— Não transferir (só permitido sem pendências) —'], ...others.map((x) => [x.id, `${x.name} (${UI.ROLE[x.role]})`])], '', 'data-type="int"'))}<div id="dErr"></div></form>`,
      footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn danger" type="submit" form="dForm">Desativar</button>` });
    m.el.querySelector('#dForm').onsubmit = async (e) => { e.preventDefault(); const d = UI.formData(e.target);
      try { const r = await api(`/users/${u.id}/deactivate`, { method: 'POST', body: { transfer_to: d.transfer_to || null } }); UI.ok(`${r.message} Transferidos: ${r.transferred.tickets} atendimento(s), ${r.transferred.tasks} tarefa(s), ${r.transferred.opportunities} oportunidade(s), ${r.transferred.customers} cliente(s).`); m.close(); await CRM.loadUsers(); done(); }
      catch (err) { if (err.status === 409 && err.data.pending) { const p = err.data.pending; m.el.querySelector('#dErr').innerHTML = `<div class="alert warning">${UI.esc(err.message)} Pendências: ${p.tickets} atendimento(s), ${p.tasks} tarefa(s), ${p.opportunities} oportunidade(s), ${p.customers} cliente(s).</div>`; } else UI.showErrors(e.target, err); } };
  },

  funil(box) {
    const stages = this.data.stages.filter((s) => s.active); const ro = !CRM.isAdmin();
    const row = (s = { name: '', kind: 'open' }) => `<tr data-id="${s.id || ''}"><td><input name="name" value="${UI.attr(s.name)}" required ${ro ? 'readonly' : ''}></td><td>${UI.select('kind', [['open', 'Aberta'], ['won', 'Ganho'], ['lost', 'Perdido']], s.kind, ro ? 'disabled' : '')}</td><td class="nowrap">${ro ? '' : '<button type="button" class="icon-btn" data-up>↑</button><button type="button" class="icon-btn" data-down>↓</button><button type="button" class="icon-btn" data-rm title="Remover">🗑</button>'}</td></tr>`;
    box.innerHTML = `<div class="card"><h3>Etapas do funil</h3><p class="muted small">Ordene as etapas; é obrigatório ter exatamente uma etapa "Ganho" e uma "Perdido". Etapas removidas que já possuem oportunidades ficam apenas ocultas.</p>
      <form id="stForm"><table><thead><tr><th>Nome</th><th>Tipo</th><th></th></tr></thead><tbody id="stBody">${stages.map(row).join('')}</tbody></table>
      ${ro ? '' : '<div class="flex between mt"><button type="button" class="btn secondary sm" id="addSt">+ Adicionar etapa</button><button class="btn">Salvar etapas</button></div>'}</form></div>`;
    if (ro) return;
    const body = box.querySelector('#stBody');
    box.querySelector('#addSt').onclick = () => body.insertAdjacentHTML('beforeend', row());
    body.onclick = (e) => { const tr = e.target.closest('tr'); if (!tr) return; if (e.target.closest('[data-rm]')) tr.remove(); if (e.target.closest('[data-up]') && tr.previousElementSibling) tr.previousElementSibling.before(tr); if (e.target.closest('[data-down]') && tr.nextElementSibling) tr.nextElementSibling.after(tr); };
    box.querySelector('#stForm').onsubmit = async (e) => { e.preventDefault(); const list = [...body.querySelectorAll('tr')].map((tr) => ({ id: tr.dataset.id ? Number(tr.dataset.id) : undefined, name: tr.querySelector('[name=name]').value.trim(), kind: tr.querySelector('[name=kind]').value }));
      try { const r = await api('/settings/stages', { method: 'PUT', body: { stages: list } }); UI.ok(r.message); this.data.stages = r.stages; this.funil(box); } catch (err) { UI.err(err); } };
  },

  canais(box) {
    const s = this.data.settings;
    box.innerHTML = `<div class="grid cols-2"><div class="card"><h3>Canais de atendimento</h3><form id="chForm">${UI.field('channels', 'Um por linha', UI.textarea('channels', s.channels.join('\n'), 'rows="8"'))}<button class="btn">Salvar canais</button></form></div>
      <div class="card"><h3>Origens de contato</h3><form id="srForm">${UI.field('contact_sources', 'Um por linha', UI.textarea('contact_sources', s.contact_sources.join('\n'), 'rows="8"'))}<button class="btn">Salvar origens</button></form></div></div>`;
    const save = (form, key) => async (e) => { e.preventDefault(); const list = form[key].value.split('\n').map((x) => x.trim()).filter(Boolean); try { const r = await api('/settings', { method: 'PUT', body: { [key]: list } }); UI.ok(r.message); this.data.settings = r.settings; } catch (err) { UI.showErrors(form, err); } };
    const ch = box.querySelector('#chForm'), sr = box.querySelector('#srForm'); ch.onsubmit = save(ch, 'channels'); sr.onsubmit = save(sr, 'contact_sources');
  },

  async integracoes(box) {
    const wa = await api('/whatsapp/status'); const smtp = this.data.integrations.smtp;
    box.innerHTML = `<div class="grid cols-2"><div class="card"><div class="card-title"><h3>WhatsApp Business (API oficial)</h3>${wa.connected ? '<span class="badge success">Conectado</span>' : '<span class="badge">Desconectado</span>'}</div>
      <p class="small">${UI.esc(wa.message)}</p>
      ${wa.connected ? `<p class="small">Número (ID): <span class="mono">${UI.esc(wa.phone_number_id)}</span></p>` : ''}
      <p class="small">URL do webhook para configurar no painel da Meta: <span class="mono">${UI.esc(wa.webhook_url)}</span></p>
      <div class="help">Variáveis no servidor (.env): <span class="mono">WHATSAPP_TOKEN</span>, <span class="mono">WHATSAPP_PHONE_NUMBER_ID</span>, <span class="mono">WHATSAPP_VERIFY_TOKEN</span> e <span class="mono">WHATSAPP_APP_SECRET</span>. As credenciais nunca são armazenadas no banco nem exibidas aqui.</div>
      <p class="small muted">O botão "Abrir WhatsApp" nas telas de cliente e atendimento funciona sempre, mas apenas abre a conversa no aplicativo — as mensagens não são sincronizadas. Nenhum envio é simulado.</p></div>
      <div class="card"><div class="card-title"><h3>E-mail (SMTP)</h3>${smtp.configured ? '<span class="badge success">Configurado</span>' : '<span class="badge">Não configurado</span>'}</div>
      <p class="small">${smtp.configured ? 'A recuperação de senha envia o link por e-mail.' : 'Sem SMTP, a recuperação de senha registra o link no log do servidor e o administrador pode gerar um link em Configurações › Usuários › Senha.'}</p>
      <div class="help">Variáveis: <span class="mono">SMTP_HOST</span>, <span class="mono">SMTP_PORT</span>, <span class="mono">SMTP_USER</span>, <span class="mono">SMTP_PASS</span>, <span class="mono">MAIL_FROM</span>.</div></div></div>`;
  },

  backup(box) {
    box.innerHTML = `<div class="card"><h3>Backup e restauração</h3>
      <p class="small">Os backups são gerados no servidor com <span class="mono">pg_dump</span> e ficam na pasta <span class="mono">backups/</span> do projeto (retenção dos últimos 30). Recomenda-se copiar os arquivos para um local externo.</p>
      <h4>Gerar backup</h4><pre class="small">npm run backup</pre>
      <h4>Agendar diariamente (cron, 02h)</h4><pre class="small">0 2 * * * cd /caminho/do/crm && npm run backup >> backups/backup.log 2>&1</pre>
      <h4>Restaurar</h4><pre class="small">npm run restore -- backups/crm-AAAAMMDD-HHMMSS.dump</pre>
      <p class="small muted">A restauração substitui todos os dados do banco configurado em DATABASE_URL. Pare o servidor antes e confirme a operação quando solicitado. Detalhes em <span class="mono">docs/INSTALACAO.md</span>.</p></div>`;
  },

  async auditoria(box) {
    const r = await api('/settings/audit', { query: { limit: 200 } });
    box.innerHTML = `<div class="card"><h3>Registro de ações (últimas 200)</h3><div class="table-wrap"><table><thead><tr><th>Quando</th><th>Usuário</th><th>Ação</th><th>Entidade</th><th>Detalhes</th><th>IP</th></tr></thead><tbody>
      ${r.entries.map((a) => `<tr><td class="small nowrap">${UI.fmtDateTime(a.created_at)}</td><td class="small">${UI.esc(a.user_name || '—')}</td><td class="mono small">${UI.esc(a.action)}</td><td class="small">${UI.esc(a.entity || '')} ${UI.esc(a.entity_id || '')}</td><td class="small muted">${UI.esc(JSON.stringify(a.details))}</td><td class="small muted">${UI.esc(a.ip || '')}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Nenhum registro.</td></tr>'}</tbody></table></div></div>`;
  },
};
