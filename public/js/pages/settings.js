'use strict';
CRM.pages.settings = {
  async render(el, { sub }) {
    this.el = el;
    CRM.invalidateSettings();
    const r = await api('/settings'); this.data = r;
    const tabs = [['empresa', 'Empresa'], ['usuarios', 'Usuários'], ['funil', 'Funis'], ['canais', 'Canais e origens'], ['respostas', 'Respostas rápidas'], ['automacoes', 'Automações'], ['integracoes', 'Integrações'], ['backup', 'Backup'], ['auditoria', 'Auditoria']];
    const allowed = CRM.isAdmin() ? tabs.map(([k]) => k) : CRM.user.role === 'supervisor' ? ['funil', 'respostas', 'automacoes', 'integracoes', 'auditoria'] : ['funil', 'respostas', 'integracoes'];
    const visible = tabs.filter(([k]) => allowed.includes(k));
    this.tab = sub && visible.some(([k]) => k === sub) ? sub : visible[0][0];
    el.innerHTML = CRM.pageHeader('Configurações', CRM.isAdmin() ? 'Identidade visual, equipe, funis, respostas rápidas, automações e integrações.' : 'Consulta de configurações. Alterações estruturais exigem perfil de administrador.') +
      `<div class="tabs">${visible.map(([k, l]) => `<button data-tab="${k}" class="${this.tab === k ? 'active' : ''}">${l}</button>`).join('')}</div><div id="tabBody"></div>`;
    el.querySelector('.tabs').onclick = (e) => { const b = e.target.closest('[data-tab]'); if (b) location.hash = `#/configuracoes/${b.dataset.tab}`; };
    this[this.tab](el.querySelector('#tabBody'));
  },

  empresa(box) {
    const s = this.data.settings;
    box.innerHTML = `<div class="card"><form id="coForm"><div class="grid" style="grid-template-columns: 1fr 260px">
      <div>${UI.field('name', 'Nome da empresa', UI.input('name', s.name, 'required'), { required: true })}
        <div class="form-row">${UI.field('primary_color', 'Cor principal (ações)', `<div class="flex"><input type="color" class="color-swatch" id="pc" value="${s.primary_color}" aria-label="Escolher cor"><input name="primary_color" value="${s.primary_color}" pattern="^#[0-9a-fA-F]{6}$"></div>`, { hint: 'Botões e destaques. A estrutura usa azul-marinho e cinzas neutros.' })}${UI.field('accent_color', 'Cor secundária', `<div class="flex"><input type="color" class="color-swatch" id="ac" value="${s.accent_color}" aria-label="Escolher cor"><input name="accent_color" value="${s.accent_color}" pattern="^#[0-9a-fA-F]{6}$"></div>`)}</div>
        <div class="form-row cols-3">${UI.field('timezone', 'Fuso horário', UI.input('timezone', s.timezone), { hint: 'Ex.: America/Sao_Paulo' })}
          ${UI.field('response_sla_minutes', 'Prazo de resposta (min)', UI.input('response_sla_minutes', s.response_sla_minutes, 'type="number" min="1" max="10080"'), { hint: 'Tempo para responder ao cliente antes de contar como vencido.' })}
          ${UI.field('idle_opportunity_days', 'Oportunidade parada (dias)', UI.input('idle_opportunity_days', s.idle_opportunity_days, 'type="number" min="1" max="365"'), { hint: 'Sem atualização por este período é sinalizada no painel.' })}</div>
        <label class="check"><input type="checkbox" name="auto_distribution" ${s.auto_distribution ? 'checked' : ''}> Distribuição automática em rodízio ao abrir atendimentos sem responsável</label>
        <label class="check mt-s"><input type="checkbox" name="demo_mode" ${s.demo_mode ? 'checked' : ''}> Modo de demonstração (indicador discreto de dados fictícios)</label></div>
      <div><label>Logotipo</label><img class="logo-preview" id="logoPrev" src="${UI.attr(s.logo_data || '')}" alt="" ${s.logo_data ? '' : 'hidden'}><div class="field mt-s"><input type="file" id="logoFile" accept="image/png,image/jpeg,image/svg+xml,image/webp"><div class="hint">PNG, JPEG, WEBP ou SVG, até 300KB.</div></div><button type="button" class="btn ghost sm" id="logoClear">Remover logotipo</button></div></div>
      <div class="right mt"><button class="btn">Salvar</button></div></form></div>`;
    const form = box.querySelector('#coForm'); let logo;
    box.querySelector('#pc').oninput = (e) => form.primary_color.value = e.target.value; box.querySelector('#ac').oninput = (e) => form.accent_color.value = e.target.value;
    box.querySelector('#logoFile').onchange = (e) => { const f = e.target.files[0]; if (!f) return; if (f.size > 300 * 1024) { UI.toast('Arquivo maior que 300KB.', 'error'); e.target.value = ''; return; } const rd = new FileReader(); rd.onload = () => { logo = rd.result; const p = box.querySelector('#logoPrev'); p.src = logo; p.hidden = false; }; rd.readAsDataURL(f); };
    box.querySelector('#logoClear').onclick = () => { logo = null; box.querySelector('#logoPrev').hidden = true; };
    form.onsubmit = async (e) => { e.preventDefault(); const d = UI.formData(form); if (logo !== undefined) d.logo_data = logo; d.response_sla_minutes = Number(d.response_sla_minutes); d.idle_opportunity_days = Number(d.idle_opportunity_days);
      try { const r = await api('/settings', { method: 'PUT', body: d }); UI.ok(r.message); CRM.settings = r.settings; location.reload(); } catch (err) { UI.showErrors(form, err); } };
  },

  async usuarios(box) {
    const r = await api('/users', { query: { include_inactive: 'true' } });
    box.innerHTML = `<div class="card"><div class="card-title"><h3>Equipe (${r.users.filter((u) => u.active).length} ativos)</h3><button class="btn" id="newUser">${UI.icons.userPlus} Novo usuário</button></div>
      <div class="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Equipe</th><th>Situação</th><th>Disponível</th><th>Último acesso</th><th></th></tr></thead><tbody>
      ${r.users.map((u) => `<tr><td class="nowrap"><strong>${UI.esc(u.name)}</strong></td><td class="small">${UI.esc(u.email)}</td><td><span class="badge ${u.role === 'admin' ? 'dark' : u.role === 'supervisor' ? 'purple' : 'primary'}">${UI.ROLE[u.role]}</span></td><td class="small">${UI.esc(u.team || '—')}</td><td>${u.active ? '<span class="badge success">Ativo</span>' : '<span class="badge">Desativado</span>'}</td><td class="small">${u.role === 'atendente' ? (u.available ? 'Sim' : 'Não') : '—'}</td><td class="small nowrap">${UI.fmtDateTime(u.last_login_at)}</td>
        <td class="nowrap"><button class="btn sm secondary" data-edit="${u.id}">Editar</button> <button class="btn sm secondary" data-link="${u.id}" title="Gerar link de redefinição de senha">Senha</button> ${u.active ? `<button class="btn sm danger secondary" data-deact="${u.id}" ${u.id === CRM.user.id ? 'disabled' : ''}>Desativar</button>` : `<button class="btn sm success" data-act="${u.id}">Reativar</button>`}</td></tr>`).join('')}</tbody></table></div>
      <p class="muted small mt-s">Desativar um usuário preserva todo o histórico e exige a transferência das pendências (atendimentos, tarefas e oportunidades abertas) para outro responsável. A equipe é usada por automações e distribuição.</p></div>`;
    box.querySelector('#newUser').onclick = () => this.userForm(null, () => this.usuarios(box));
    box.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => this.userForm(r.users.find((u) => u.id === Number(b.dataset.edit)), () => this.usuarios(box)));
    box.querySelectorAll('[data-act]').forEach((b) => b.onclick = async () => { try { const x = await api(`/users/${b.dataset.act}/activate`, { method: 'POST' }); UI.ok(x.message); await CRM.loadUsers(); this.usuarios(box); } catch (err) { UI.err(err); } });
    box.querySelectorAll('[data-link]').forEach((b) => b.onclick = async () => { try { const x = await api(`/users/${b.dataset.link}/reset-link`, { method: 'POST' }); UI.modal({ title: 'Link de redefinição de senha', size: 'narrow', body: `<p class="small">${UI.esc(x.message)} Envie ao usuário por um canal seguro:</p><input readonly value="${UI.attr(x.link)}" data-select-all>`, footer: '<button class="btn" data-close>Fechar</button>' }); } catch (err) { UI.err(err); } });
    box.querySelectorAll('[data-deact]').forEach((b) => b.onclick = () => this.deactivate(r.users.find((u) => u.id === Number(b.dataset.deact)), r.users, () => this.usuarios(box)));
  },
  userForm(u, done) {
    const isEdit = Boolean(u);
    const m = UI.modal({ title: isEdit ? 'Editar usuário' : 'Novo usuário', body: `<form id="uForm"><div class="form-row">${UI.field('name', 'Nome', UI.input('name', u?.name, 'required'), { required: true })}${UI.field('email', 'E-mail', UI.input('email', u?.email, 'type="email" required'), { required: true })}</div>
      <div class="form-row cols-3">${UI.field('role', 'Perfil', UI.select('role', Object.entries(UI.ROLE), u?.role || 'atendente'), { required: true })}${UI.field('team', 'Equipe', UI.input('team', u?.team, 'data-type="nullable" placeholder="ex.: Comercial"'))}${UI.field('password', isEdit ? 'Nova senha' : 'Senha inicial', UI.input('password', '', `type="password" minlength="8" ${isEdit ? '' : 'required'} autocomplete="new-password"`), { required: !isEdit, hint: isEdit ? 'Em branco mantém a atual.' : 'Mínimo de 8 caracteres.' })}</div>
      <label class="check"><input type="checkbox" name="available" ${u ? (u.available ? 'checked' : '') : 'checked'}> Disponível para distribuição automática (atendentes)</label>
      <div class="help mt"><strong>Administrador:</strong> configura o sistema e gerencia usuários. <strong>Supervisor:</strong> acompanha a equipe, indicadores, automações e redistribui atendimentos. <strong>Atendente:</strong> acessa seus clientes e atendimentos e a fila compartilhada.</div></form>`,
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
      catch (err) { if (err.status === 409 && err.data.pending) { const p = err.data.pending; m.el.querySelector('#dErr').innerHTML = `<div class="alert warning"><span>${UI.esc(err.message)} Pendências: ${p.tickets} atendimento(s), ${p.tasks} tarefa(s), ${p.opportunities} oportunidade(s), ${p.customers} cliente(s).</span></div>`; } else UI.showErrors(e.target, err); } };
  },

  async funil(box) {
    const ro = !CRM.isAdmin();
    const r = await api('/settings/pipelines');
    this.pipelines = r.pipelines;
    const cur = this.pipelineEdit && r.pipelines.some((p) => p.id === this.pipelineEdit) ? this.pipelineEdit : (r.pipelines.find((p) => p.is_default) || r.pipelines[0]).id;
    this.pipelineEdit = cur;
    const p = r.pipelines.find((x) => x.id === cur);
    const stages = p.stages.filter((s) => s.active);
    const row = (s = { name: '', kind: 'open', color: null }) => `<tr data-id="${s.id || ''}"><td><input name="name" value="${UI.attr(s.name)}" required ${ro ? 'readonly' : ''} aria-label="Nome da etapa"></td><td>${UI.select('kind', [['open', 'Aberta'], ['won', 'Ganho'], ['lost', 'Perdido']], s.kind, ro ? 'disabled' : '')}</td><td><input type="color" name="color" value="${UI.attr(s.color || '#94a3b8')}" class="color-swatch" ${ro ? 'disabled' : ''} aria-label="Cor"></td><td class="nowrap">${ro ? '' : `<button type="button" class="icon-btn" data-up aria-label="Subir">${UI.icons.arrowUp}</button><button type="button" class="icon-btn" data-down aria-label="Descer">${UI.icons.arrowDown}</button><button type="button" class="icon-btn" data-rm title="Remover" aria-label="Remover">${UI.icons.trash}</button>`}</td></tr>`;
    box.innerHTML = `<div class="grid" style="grid-template-columns: 280px 1fr"><div class="card"><div class="card-title"><h3>Funis</h3>${ro ? '' : `<button class="btn sm secondary" id="addPipe">${UI.icons.plus} Novo</button>`}</div>
        ${r.pipelines.map((x) => `<div class="task-row" style="cursor:pointer" data-pipe="${x.id}"><span class="dot ${x.id === cur ? 'on' : x.active ? '' : 'danger'}"></span><div><div class="t">${UI.esc(x.name)}${x.is_default ? ' <span class="badge outline">padrão</span>' : ''}${!x.active ? ' <span class="badge">inativo</span>' : ''}</div><div class="s">${x.stages.filter((s) => s.active).length} etapas</div></div></div>`).join('')}
        <p class="muted xs mt-s">Cada funil tem suas próprias etapas. Oportunidades ficam no funil escolhido ao criá-las.</p></div>
      <div class="card"><div class="card-title"><h3>Etapas de "${UI.esc(p.name)}"</h3>${ro ? '' : `<div class="flex"><button class="btn sm secondary" id="renamePipe">Renomear</button>${p.is_default ? '' : `<button class="btn sm secondary" id="defaultPipe">Tornar padrão</button>`}${p.active ? `<button class="btn sm danger secondary" id="deactPipe" ${p.is_default ? 'disabled' : ''}>Desativar</button>` : `<button class="btn sm success" id="actPipe">Reativar</button>`}</div>`}</div>
        <p class="muted small">Ordene as etapas; é obrigatório ter exatamente uma etapa "Ganho" e uma "Perdido". Etapas removidas que já possuem oportunidades ficam apenas ocultas.</p>
        <form id="stForm"><div class="table-wrap"><table><thead><tr><th>Nome</th><th>Tipo</th><th>Cor</th><th></th></tr></thead><tbody id="stBody">${stages.map(row).join('')}</tbody></table></div>
        ${ro ? '' : `<div class="flex between mt"><button type="button" class="btn secondary sm" id="addSt">${UI.icons.plus} Adicionar etapa</button><button class="btn">Salvar etapas</button></div>`}</form></div></div>`;
    box.querySelectorAll('[data-pipe]').forEach((d) => d.onclick = () => { this.pipelineEdit = Number(d.dataset.pipe); this.funil(box); });
    if (ro) return;
    const body = box.querySelector('#stBody');
    box.querySelector('#addSt').onclick = () => body.insertAdjacentHTML('beforeend', row());
    body.onclick = (e) => { const tr = e.target.closest('tr'); if (!tr) return; if (e.target.closest('[data-rm]')) tr.remove(); if (e.target.closest('[data-up]') && tr.previousElementSibling) tr.previousElementSibling.before(tr); if (e.target.closest('[data-down]') && tr.nextElementSibling) tr.nextElementSibling.after(tr); };
    box.querySelector('#stForm').onsubmit = async (e) => { e.preventDefault(); const list = [...body.querySelectorAll('tr')].map((tr) => ({ id: tr.dataset.id ? Number(tr.dataset.id) : undefined, name: tr.querySelector('[name=name]').value.trim(), kind: tr.querySelector('[name=kind]').value, color: tr.querySelector('[name=color]').value }));
      try { const x = await api('/settings/stages', { method: 'PUT', body: { pipeline_id: cur, stages: list } }); UI.ok(x.message); CRM.invalidateSettings(); this.funil(box); } catch (err) { UI.err(err); } };
    box.querySelector('#addPipe').onclick = async () => { const name = await UI.prompt('Nome do novo funil', { title: 'Novo funil', placeholder: 'ex.: Pós-venda' }); if (!name) return; try { const x = await api('/settings/pipelines', { method: 'POST', body: { name } }); UI.ok(x.message); this.pipelineEdit = x.pipeline.id; CRM.invalidateSettings(); this.funil(box); } catch (err) { UI.err(err); } };
    box.querySelector('#renamePipe').onclick = async () => { const name = await UI.prompt('Novo nome', { title: 'Renomear funil', value: p.name }); if (!name) return; try { await api(`/settings/pipelines/${cur}`, { method: 'PUT', body: { name } }); CRM.invalidateSettings(); this.funil(box); } catch (err) { UI.err(err); } };
    const dp = box.querySelector('#defaultPipe'); if (dp) dp.onclick = async () => { try { await api(`/settings/pipelines/${cur}`, { method: 'PUT', body: { is_default: true } }); UI.ok('Funil padrão atualizado.'); CRM.invalidateSettings(); this.funil(box); } catch (err) { UI.err(err); } };
    const de = box.querySelector('#deactPipe'); if (de) de.onclick = async () => { if (!(await UI.confirm('Desativar este funil? As oportunidades existentes continuam acessíveis pela ficha do cliente.', { danger: true, okLabel: 'Desativar' }))) return; try { await api(`/settings/pipelines/${cur}`, { method: 'PUT', body: { active: false } }); CRM.invalidateSettings(); this.funil(box); } catch (err) { UI.err(err); } };
    const ac = box.querySelector('#actPipe'); if (ac) ac.onclick = async () => { try { await api(`/settings/pipelines/${cur}`, { method: 'PUT', body: { active: true } }); CRM.invalidateSettings(); this.funil(box); } catch (err) { UI.err(err); } };
  },

  canais(box) {
    const s = this.data.settings;
    box.innerHTML = `<div class="grid cols-2"><div class="card"><h3>Canais de atendimento</h3><form id="chForm">${UI.field('channels', 'Um por linha', UI.textarea('channels', s.channels.join('\n'), 'rows="8" data-type="lines"'))}<button class="btn">Salvar canais</button></form></div>
      <div class="card"><h3>Origens de contato</h3><form id="srForm">${UI.field('contact_sources', 'Um por linha', UI.textarea('contact_sources', s.contact_sources.join('\n'), 'rows="8" data-type="lines"'))}<button class="btn">Salvar origens</button></form></div></div>`;
    const save = (form, key) => async (e) => { e.preventDefault(); const d = UI.formData(form); try { const r = await api('/settings', { method: 'PUT', body: { [key]: d[key] } }); UI.ok(r.message); this.data.settings = r.settings; CRM.invalidateSettings(); } catch (err) { UI.showErrors(form, err); } };
    const ch = box.querySelector('#chForm'), sr = box.querySelector('#srForm'); ch.onsubmit = save(ch, 'channels'); sr.onsubmit = save(sr, 'contact_sources');
  },

  async respostas(box) {
    const canEdit = CRM.isManager();
    const r = await api('/quick-replies', { query: { all: 'true' } });
    box.innerHTML = `<div class="card"><div class="card-title"><h3>Respostas rápidas (${r.quick_replies.length})</h3>${canEdit ? `<button class="btn" id="newQr">${UI.icons.plus} Nova resposta</button>` : ''}</div>
      <p class="muted small">Na conversa, digite <span class="mono">/</span> seguido do atalho ou use o botão "Respostas rápidas". Variáveis: <span class="mono">{nome}</span> (primeiro nome do cliente), <span class="mono">{atendente}</span>, <span class="mono">{protocolo}</span>.</p>
      ${r.quick_replies.length ? `<div class="table-wrap"><table><thead><tr><th>Título</th><th>Atalho</th><th>Texto</th><th>Situação</th>${canEdit ? '<th></th>' : ''}</tr></thead><tbody>${r.quick_replies.map((q) => `<tr><td class="nowrap"><strong>${UI.esc(q.title)}</strong></td><td class="mono">${q.shortcut ? '/' + UI.esc(q.shortcut) : ''}</td><td><span class="trunc" style="max-width:420px" title="${UI.attr(q.body)}">${UI.esc(q.body)}</span></td><td>${q.active ? '<span class="badge success">Ativa</span>' : '<span class="badge">Inativa</span>'}</td>${canEdit ? `<td class="nowrap"><button class="btn sm secondary" data-edit="${q.id}">Editar</button> <button class="btn sm secondary" data-toggle="${q.id}" data-active="${q.active}">${q.active ? 'Desativar' : 'Ativar'}</button> <button class="icon-btn" data-del="${q.id}" aria-label="Excluir">${UI.icons.trash}</button></td>` : ''}</tr>`).join('')}</tbody></table></div>` : UI.empty('Nenhuma resposta rápida', 'Cadastre textos padrão para acelerar as respostas.')}</div>`;
    if (!canEdit) return;
    const form = (q) => {
      const isEdit = Boolean(q);
      const m = UI.modal({ title: isEdit ? 'Editar resposta rápida' : 'Nova resposta rápida', body: `<form id="qrForm"><div class="form-row">${UI.field('title', 'Título', UI.input('title', q?.title, 'required'), { required: true })}${UI.field('shortcut', 'Atalho', UI.input('shortcut', q?.shortcut, 'data-type="nullable" placeholder="ex.: ola"'), { hint: 'Digite /atalho na conversa.' })}</div>${UI.field('body', 'Texto', UI.textarea('body', q?.body, 'required rows="5" placeholder="Olá {nome}, aqui é {atendente}…"'), { required: true })}<label class="check"><input type="checkbox" name="active" ${!q || q.active ? 'checked' : ''}> Ativa</label></form>`,
        footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="qrForm">Salvar</button>` });
      m.el.querySelector('#qrForm').onsubmit = async (e) => { e.preventDefault(); try { const x = isEdit ? await api(`/quick-replies/${q.id}`, { method: 'PUT', body: UI.formData(e.target) }) : await api('/quick-replies', { method: 'POST', body: UI.formData(e.target) }); UI.ok(x.message); m.close(); CRM.invalidateSettings(); this.respostas(box); } catch (err) { UI.showErrors(e.target, err); } };
    };
    box.querySelector('#newQr').onclick = () => form(null);
    box.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => form(r.quick_replies.find((q) => q.id === Number(b.dataset.edit))));
    box.querySelectorAll('[data-toggle]').forEach((b) => b.onclick = async () => { try { await api(`/quick-replies/${b.dataset.toggle}`, { method: 'PUT', body: { active: b.dataset.active !== 'true' } }); CRM.invalidateSettings(); this.respostas(box); } catch (err) { UI.err(err); } });
    box.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => { if (!(await UI.confirm('Excluir esta resposta rápida?', { danger: true, okLabel: 'Excluir' }))) return; try { await api(`/quick-replies/${b.dataset.del}`, { method: 'DELETE' }); CRM.invalidateSettings(); this.respostas(box); } catch (err) { UI.err(err); } });
  },

  async automacoes(box) {
    const [meta, r, runs] = await Promise.all([api('/automations/meta'), api('/automations'), api('/automations/runs', { query: { limit: 60 } })]);
    this.autoMeta = meta;
    const T = meta.triggers, A = meta.actions;
    const condText = (rule) => { const c = rule.conditions || {}; const parts = []; if (c.channel) parts.push(`canal = ${c.channel}`); if (c.priority) parts.push(`prioridade = ${c.priority}`); if (c.minutes) parts.push(`após ${c.minutes} min`); if (c.days) parts.push(`após ${c.days} dias`); if (c.stage_id) { const st = this.data.stages.find((s) => s.id === Number(c.stage_id)); parts.push(`etapa = ${st ? st.name : c.stage_id}`); } if (c.pipeline_id) { const p = this.data.pipelines.find((x) => x.id === Number(c.pipeline_id)); parts.push(`funil = ${p ? p.name : c.pipeline_id}`); } if (rule.team) parts.push(`equipe = ${rule.team}`); return parts.length ? parts.join(', ') : 'sem condição'; };
    const actText = (rule) => { const p = rule.action_params || {}; switch (rule.action) { case 'create_task': return `tarefa "${p.title}" em ${p.due_in_days || 1} dia(s)`; case 'notify': return `notificar ${p.to === 'supervisors' ? 'supervisores' : p.to === 'owner' ? 'responsável' : p.to === 'admins' ? 'administradores' : CRM.userName(Number(p.to)) || p.to}`; case 'set_priority': return `prioridade → ${p.priority}`; case 'add_tag': return `etiqueta "${p.tag}"`; case 'send_message': return `enviar "${(p.body || '').slice(0, 40)}…"`; default: return A[rule.action]?.label || rule.action; } };
    box.innerHTML = `<div class="grid" style="grid-template-columns: 1fr 380px">
      <div class="card"><div class="card-title"><h3>Regras (${r.rules.length})</h3><div class="flex"><button class="btn secondary sm" id="runNow" title="Executa agora as verificações agendadas (prazos vencidos, oportunidades paradas)">${UI.icons.play} Verificar agora</button><button class="btn" id="newRule">${UI.icons.plus} Nova regra</button></div></div>
        <p class="muted small">Cada regra tem gatilho → condição → ação. As verificações agendadas rodam a cada minuto no servidor. Tarefas duplicadas são evitadas e acompanhamentos são encerrados quando o cliente responde ou a negociação é fechada.${meta.whatsapp_connected ? '' : ' Mensagens automáticas exigem o WhatsApp conectado.'}</p>
        ${r.rules.length ? r.rules.map((rule) => `<div class="rule-card"><div class="flex between"><div><strong>${UI.esc(rule.name)}</strong> ${rule.active ? '<span class="badge success">ativa</span>' : '<span class="badge">pausada</span>'}</div>
            <div class="flex"><button class="btn xs secondary" data-toggle="${rule.id}" data-active="${rule.active}">${rule.active ? `${UI.icons.pause} Pausar` : `${UI.icons.play} Ativar`}</button><button class="btn xs secondary" data-edit="${rule.id}">Editar</button><button class="icon-btn" data-del="${rule.id}" aria-label="Excluir">${UI.icons.trash}</button></div></div>
          <div class="flow"><span class="step">${UI.icons.zap} ${UI.esc(T[rule.trigger]?.label || rule.trigger)}</span>${UI.icons.arrowRight}<span class="step">${UI.esc(condText(rule))}</span>${UI.icons.arrowRight}<span class="step">${UI.esc(actText(rule))}</span></div>
          <div class="xs muted mt-s">${rule.runs_count} execução(ões) no total · ${rule.runs_7d} nos últimos 7 dias${rule.failures_7d ? ` · <span class="text-danger">${rule.failures_7d} falha(s)</span>` : ''}${rule.last_run_at ? ` · última ${UI.relative(rule.last_run_at)}` : ''}</div></div>`).join('') : UI.empty('Nenhuma regra', 'Crie a primeira regra ou use um dos modelos sugeridos.')}
        <h4 class="mt">Modelos sugeridos</h4><div class="chips">${this.ruleTemplates().map((t, i) => `<button type="button" class="chip" data-tpl="${i}">${UI.icons.plus} ${UI.esc(t.name)}</button>`).join('')}</div></div>
      <div class="card flush"><div class="card-title"><h3>Histórico de execução</h3></div>${runs.runs.length ? `<div style="max-height:70vh;overflow:auto">${runs.runs.map((x) => `<div class="task-row"><span class="dot ${x.status === 'executada' ? 'on' : x.status === 'falhou' ? 'danger' : 'off'}" title="${x.status}"></span><div><div class="t">${UI.esc(x.rule_name)} <span class="muted">· ${x.entity === 'ticket' ? `<a href="#/atendimentos/${x.entity_id}" class="mono">${UI.esc(x.entity_label || x.entity_id)}</a>` : `<a href="#/funil/${x.entity_id}">${UI.esc(x.entity_label || x.entity_id)}</a>`}</span></div><div class="s">${x.status} · ${UI.esc(x.details || '')} · ${UI.fmtDateTime(x.created_at)}</div></div></div>`).join('')}</div>` : UI.empty('Nenhuma execução ainda', '')}</div></div>`;
    box.querySelector('#newRule').onclick = () => this.ruleForm(null, () => this.automacoes(box));
    box.querySelector('#runNow').onclick = async () => { try { const x = await api('/automations/run-scheduled', { method: 'POST' }); UI.ok(x.message); this.automacoes(box); } catch (err) { UI.err(err); } };
    box.querySelectorAll('[data-tpl]').forEach((b) => b.onclick = () => this.ruleForm(this.ruleTemplates()[Number(b.dataset.tpl)], () => this.automacoes(box), true));
    box.querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => this.ruleForm(r.rules.find((x) => x.id === Number(b.dataset.edit)), () => this.automacoes(box)));
    box.querySelectorAll('[data-toggle]').forEach((b) => b.onclick = async () => { try { const x = await api(`/automations/${b.dataset.toggle}`, { method: 'PUT', body: { active: b.dataset.active !== 'true' } }); UI.ok(x.message); this.automacoes(box); } catch (err) { UI.err(err); } });
    box.querySelectorAll('[data-del]').forEach((b) => b.onclick = async () => { if (!(await UI.confirm('Excluir esta regra e seu histórico?', { danger: true, okLabel: 'Excluir' }))) return; try { await api(`/automations/${b.dataset.del}`, { method: 'DELETE' }); this.automacoes(box); } catch (err) { UI.err(err); } });
  },
  ruleTemplates() {
    const proposal = (this.data.stages || []).find((s) => /proposta/i.test(s.name) && s.active);
    return [
      { name: 'Tarefa após proposta enviada', trigger: 'opportunity_stage_changed', conditions: { stage_id: proposal ? proposal.id : '' }, action: 'create_task', action_params: { title: 'Acompanhar proposta de {cliente}', due_in_days: 2, priority: 'alta', assignee: 'owner' } },
      { name: 'Alerta de oportunidade parada', trigger: 'opportunity_idle', conditions: { days: 7 }, action: 'notify', action_params: { to: 'owner', title: 'Oportunidade parada', body: '{oportunidade} de {cliente} está sem movimentação há mais de 7 dias.' } },
      { name: 'Distribuir novos atendimentos', trigger: 'ticket_created', conditions: {}, action: 'distribute', action_params: {} },
      { name: 'Avisar supervisor de prazo vencido', trigger: 'ticket_response_overdue', conditions: { minutes: '' }, action: 'notify', action_params: { to: 'supervisors', title: 'Prazo de resposta vencido', body: '{protocolo} — {cliente} aguarda resposta há mais tempo que o prazo.' } },
      { name: 'Retorno vencido vira urgente', trigger: 'ticket_follow_up_overdue', conditions: { minutes: 60 }, action: 'set_priority', action_params: { priority: 'urgente' } },
    ];
  },
  ruleForm(rule, done, isTemplate = false) {
    const meta = this.autoMeta; const T = meta.triggers, A = meta.actions;
    const isEdit = Boolean(rule && rule.id && !isTemplate);
    const r = rule || { name: '', trigger: 'ticket_created', conditions: {}, action: 'notify', action_params: {}, team: '', active: true };
    const stages = this.data.stages.filter((s) => s.active), pipelines = this.data.pipelines.filter((p) => p.active);
    const teams = [...new Set(CRM.users.map((u) => u.team).filter(Boolean))];
    const m = UI.modal({ title: isEdit ? 'Editar regra' : 'Nova regra de automação', body: `<form id="ruleForm">
      ${UI.field('name', 'Nome', UI.input('name', r.name, 'required'), { required: true })}
      <div class="form-row">${UI.field('trigger', 'Gatilho (quando)', UI.select('trigger', Object.entries(T).map(([k, v]) => [k, v.label]), r.trigger, 'id="trigSel"'), { required: true })}${UI.field('action', 'Ação (então)', UI.select('action', Object.entries(A).filter(([k]) => k !== 'send_message' || meta.whatsapp_connected).map(([k, v]) => [k, v.label]), r.action, 'id="actSel"'), { required: true })}</div>
      <h4>Condições (se)</h4><div class="form-row cols-3" id="condBox"></div>
      <h4>Parâmetros da ação</h4><div class="form-row" id="paramBox"></div>
      <div class="form-row">${UI.field('team', 'Aplicar à equipe', UI.select('team', [['', 'Todas'], ...teams.map((t) => [t, t])], r.team || ''), { hint: 'Considera a equipe do responsável; na distribuição, escolhe atendentes da equipe.' })}<div class="field"><label>&nbsp;</label><label class="check"><input type="checkbox" name="active" ${r.active !== false ? 'checked' : ''}> Regra ativa</label></div></div></form>`,
      footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="ruleForm">${isEdit ? 'Salvar' : 'Criar regra'}</button>` });
    const form = m.el.querySelector('#ruleForm');
    const renderCond = () => {
      const t = T[form.trigger.value]; const c = r.conditions || {}; const box = form.querySelector('#condBox'); const parts = [];
      if (t.conditions.includes('channel')) parts.push(UI.field('c_channel', 'Canal', UI.select('c_channel', [['', 'Qualquer'], ...this.data.settings.channels.map((x) => [x, x])], c.channel || '')));
      if (t.conditions.includes('priority')) parts.push(UI.field('c_priority', 'Prioridade', UI.select('c_priority', [['', 'Qualquer'], ...Object.entries(UI.PRIORITY).map(([k, v]) => [k, v.label])], c.priority || '')));
      if (t.conditions.includes('minutes')) parts.push(UI.field('c_minutes', 'Minutos', UI.input('c_minutes', c.minutes ?? '', 'type="number" min="0" placeholder="padrão: prazo configurado"'), { hint: form.trigger.value === 'ticket_follow_up_overdue' ? 'Tolerância após o horário do retorno.' : 'Em branco usa o prazo de resposta da empresa.' }));
      if (t.conditions.includes('days')) parts.push(UI.field('c_days', 'Dias parada', UI.input('c_days', c.days ?? '', 'type="number" min="1" placeholder="padrão: configuração"')));
      if (t.conditions.includes('stage_id')) parts.push(UI.field('c_stage_id', 'Etapa de destino', UI.select('c_stage_id', [['', 'Qualquer'], ...stages.map((s) => [s.id, `${s.name} (${pipelines.find((p) => p.id === s.pipeline_id)?.name || ''})`])], c.stage_id || '')));
      if (t.conditions.includes('pipeline_id')) parts.push(UI.field('c_pipeline_id', 'Funil', UI.select('c_pipeline_id', [['', 'Qualquer'], ...pipelines.map((p) => [p.id, p.name])], c.pipeline_id || '')));
      box.innerHTML = parts.join('') || '<p class="muted small">Sem condições adicionais para este gatilho.</p>';
    };
    const renderParams = () => {
      const a = form.action.value; const p = r.action_params || {}; const box = form.querySelector('#paramBox'); const parts = [];
      if (a === 'create_task') parts.push(UI.field('p_title', 'Título da tarefa', UI.input('p_title', p.title || '', 'required placeholder="ex.: Acompanhar proposta de {cliente}"'), { required: true, hint: 'Variáveis: {cliente}, {protocolo}, {oportunidade}, {etapa}.' }), UI.field('p_due_in_days', 'Prazo (dias)', UI.input('p_due_in_days', p.due_in_days ?? 1, 'type="number" min="0"')), UI.field('p_priority', 'Prioridade', UI.select('p_priority', [['baixa', 'Baixa'], ['normal', 'Normal'], ['alta', 'Alta']], p.priority || 'normal')), UI.field('p_assignee', 'Responsável', UI.select('p_assignee', [['owner', 'Responsável do registro'], ...CRM.users.filter((u) => u.active !== false).map((u) => [u.id, u.name])], p.assignee || 'owner')));
      if (a === 'notify') parts.push(UI.field('p_to', 'Notificar', UI.select('p_to', [['owner', 'Responsável do registro'], ['supervisors', 'Supervisores e administradores'], ['admins', 'Administradores'], ...CRM.users.filter((u) => u.active !== false).map((u) => [u.id, u.name])], p.to || 'owner')), UI.field('p_title', 'Título', UI.input('p_title', p.title || '', 'required'), { required: true }), UI.field('p_body', 'Mensagem', UI.input('p_body', p.body || '', 'placeholder="{protocolo} — {cliente}"'), { hint: 'Variáveis: {cliente}, {protocolo}, {assunto}, {oportunidade}, {etapa}.' }));
      if (a === 'set_priority') parts.push(UI.field('p_priority', 'Nova prioridade', UI.select('p_priority', Object.entries(UI.PRIORITY).map(([k, v]) => [k, v.label]), p.priority || 'alta')));
      if (a === 'add_tag') parts.push(UI.field('p_tag', 'Etiqueta', UI.input('p_tag', p.tag || '', 'required')));
      if (a === 'send_message') parts.push(UI.field('p_body', 'Texto da mensagem', UI.textarea('p_body', p.body || '', 'required'), { hint: 'Enviada pela API oficial apenas dentro da janela de 24h e para atendimentos do canal WhatsApp.' }));
      if (a === 'distribute') parts.push('<p class="muted small">Atribui o atendimento ao próximo atendente disponível no rodízio (da equipe selecionada, se houver). Sem ninguém disponível, permanece na fila.</p>');
      box.innerHTML = parts.join('');
    };
    form.querySelector('#trigSel').onchange = renderCond; form.querySelector('#actSel').onchange = renderParams;
    renderCond(); renderParams();
    form.onsubmit = async (e) => {
      e.preventDefault(); const d = UI.formData(form);
      const conditions = {}, action_params = {};
      Object.entries(d).forEach(([k, v]) => { if (k.startsWith('c_') && v !== '' && v !== null) conditions[k.slice(2)] = v; if (k.startsWith('p_') && v !== '' && v !== null) action_params[k.slice(2)] = v; });
      const body = { name: d.name, trigger: d.trigger, action: d.action, conditions, action_params, team: d.team || null, active: d.active };
      try { const x = isEdit ? await api(`/automations/${rule.id}`, { method: 'PUT', body }) : await api('/automations', { method: 'POST', body }); UI.ok(x.message); m.close(); done(); } catch (err) { UI.showErrors(form, err); }
    };
  },

  async integracoes(box) {
    const wa = await api('/whatsapp/status'); const smtp = this.data.integrations.smtp;
    const st = wa.state;
    const stateBadge = st === 'ativo' ? '<span class="badge success">Conectado · recebendo eventos</span>' : st === 'configurado_sem_eventos' ? '<span class="badge warning">Configurado · sem eventos ainda</span>' : '<span class="badge">Desconectado</span>';
    const log = CRM.isManager() ? await api('/whatsapp/log', { query: { limit: 30 } }).catch(() => ({ messages: [] })) : { messages: [] };
    box.innerHTML = `<div class="grid" style="grid-template-columns: 1fr 1fr"><div class="card"><div class="card-title"><h3>${UI.icons.whatsapp} WhatsApp Business (API oficial)</h3>${stateBadge}</div>
      <p class="small">${UI.esc(wa.message)}</p>
      <div class="state-box"><div class="status-line"><span class="dot ${wa.connected ? 'on' : 'off'}"></span> Credenciais no servidor: <strong>${wa.connected ? 'presentes' : 'ausentes'}</strong></div>
        <div class="status-line"><span class="dot ${wa.webhook_ready ? 'on' : 'off'}"></span> Webhook: <strong>${wa.webhook_ready ? 'pronto para verificação' : 'não verificável'}</strong></div>
        <div class="status-line"><span class="dot ${wa.signature_check ? 'on' : 'warn'}"></span> Validação de assinatura: <strong>${wa.signature_check ? 'ativa' : 'desativada'}</strong></div>
        <div class="status-line"><span class="dot ${wa.last_event_at ? 'on' : 'off'}"></span> Último evento recebido: <strong>${wa.last_event_at ? UI.fmtDateTime(wa.last_event_at) : 'nenhum'}</strong></div>
        ${wa.last_error ? `<div class="status-line text-danger"><span class="dot danger"></span> Último erro (${UI.fmtDateTime(wa.last_error_at)}): ${UI.esc(wa.last_error)}</div>` : ''}
        <div class="status-line"><span class="dot"></span> Mensagens: ${wa.stats.received} recebida(s), ${wa.stats.sent} enviada(s)${wa.stats.failed ? `, <span class="text-danger">${wa.stats.failed} com falha</span>` : ''}</div></div>
      ${wa.pending.length ? `<h4 class="mt">Pendências para concluir a conexão</h4><ul class="small">${wa.pending.map((p) => `<li>${UI.esc(p)}</li>`).join('')}</ul>` : '<p class="small text-success mt">Nenhuma pendência de configuração.</p>'}
      <p class="small muted">Enquanto a integração não estiver conectada, o botão "Abrir no WhatsApp" funciona como atalho externo e as interações devem ser registradas manualmente na conversa (identificadas como "registro manual").</p>
      <details class="mt"><summary>Detalhes técnicos (administrador)</summary><div class="help mt-s">
        <p>Variáveis no arquivo <span class="mono">.env</span> do servidor (nunca armazenadas no banco nem exibidas aqui):</p>
        <pre class="code">WHATSAPP_TOKEN=            # token permanente do app Meta
WHATSAPP_PHONE_NUMBER_ID=  # ID do número no WhatsApp Business
WHATSAPP_VERIFY_TOKEN=     # valor à sua escolha, usado na verificação do webhook
WHATSAPP_APP_SECRET=       # segredo do app, valida a assinatura X-Hub-Signature-256</pre>
        <p>URL do webhook para cadastrar no painel da Meta (campo <span class="mono">messages</span>):<br><span class="mono">${UI.esc(wa.webhook_url)}</span></p>
        <p>Como funciona: mensagens recebidas são vinculadas ao cliente pelo telefone (criando o cliente quando não existe) e ao atendimento aberto mais recente (abrindo um novo na fila quando não há). Eventos repetidos são ignorados pelo identificador da mensagem. Status enviado → entregue → lido → falhou aparecem na conversa. Texto livre só pode ser enviado até 24h após a última mensagem do cliente; fora da janela é preciso usar um modelo aprovado.</p>
        <p>Após alterar o <span class="mono">.env</span>, reinicie o serviço. Guia completo em <span class="mono">docs/INSTALACAO.md</span>.</p></div></details></div>
      <div class="stack"><div class="card"><div class="card-title"><h3>${UI.icons.mail} E-mail (SMTP)</h3>${smtp.configured ? '<span class="badge success">Configurado</span>' : '<span class="badge">Não configurado</span>'}</div>
      <p class="small">${smtp.configured ? 'A recuperação de senha envia o link por e-mail.' : 'Sem SMTP, a recuperação de senha registra o link no log do servidor e o administrador pode gerar um link em Configurações › Usuários › Senha.'}</p>
      <details><summary class="small">Detalhes técnicos</summary><div class="help mt-s">Variáveis: <span class="mono">SMTP_HOST</span>, <span class="mono">SMTP_PORT</span>, <span class="mono">SMTP_SECURE</span>, <span class="mono">SMTP_USER</span>, <span class="mono">SMTP_PASS</span>, <span class="mono">MAIL_FROM</span>.</div></details></div>
      <div class="card"><h3>Outros canais</h3><p class="small muted">Telefone, e-mail, chat do site e presencial são registrados manualmente na conversa. A prioridade é concluir o WhatsApp oficial antes de integrar outros canais; nenhum outro é apresentado como conectado.</p></div>
      ${CRM.isManager() ? `<div class="card flush"><div class="card-title"><h3>Registro de mensagens da API</h3></div>${log.messages.length ? `<div class="table-wrap" style="max-height:340px"><table><thead><tr><th>Quando</th><th>Dir.</th><th>Cliente</th><th>Status</th><th>Texto</th></tr></thead><tbody>${log.messages.map((x) => `<tr><td class="nowrap small">${UI.fmtDateTime(x.created_at)}</td><td>${x.direction === 'saida' ? 'Envio' : 'Receb.'}</td><td class="small">${UI.esc(x.customer_name || '—')}${x.protocol ? ` <a href="#/atendimentos/${x.ticket_id}" class="mono xs">${UI.esc(x.protocol)}</a>` : ''}</td><td><span class="badge ${x.status === 'falhou' ? 'danger' : x.status === 'lido' ? 'primary' : ''}" title="${UI.attr(x.error || '')}">${UI.esc(x.status)}</span></td><td><span class="trunc" style="max-width:200px" title="${UI.attr(x.body || '')}">${UI.esc(x.body || '')}</span></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted small" style="padding:0 1rem 1rem">Nenhuma mensagem trafegou pela API ainda.</p>'}</div>` : ''}</div></div>`;
  },

  backup(box) {
    box.innerHTML = `<div class="card"><h3>Backup e restauração</h3>
      <p class="small">Os backups são gerados no servidor com <span class="mono">pg_dump</span> e ficam na pasta <span class="mono">backups/</span> do projeto (retenção dos últimos 30). Recomenda-se copiar os arquivos para um local externo.</p>
      <h4>Gerar backup</h4><pre class="code">npm run backup</pre>
      <h4>Agendar diariamente (cron, 02h)</h4><pre class="code">0 2 * * * cd /caminho/do/crm && npm run backup >> backups/backup.log 2>&1</pre>
      <h4>Restaurar</h4><pre class="code">npm run restore -- backups/crm-AAAAMMDD-HHMMSS.dump</pre>
      <p class="small muted">A restauração substitui todos os dados do banco configurado em DATABASE_URL. Pare o servidor antes e confirme a operação quando solicitado. Detalhes em <span class="mono">docs/INSTALACAO.md</span>.</p></div>`;
  },

  async auditoria(box) {
    const q = this.auditQuery || {};
    const r = await api('/settings/audit', { query: { limit: 200, ...q } });
    box.innerHTML = `<div class="card"><div class="card-title"><h3>Registro de ações (últimas 200)</h3></div><form class="filters" id="auForm"><div class="field"><label>Usuário</label>${UI.select('user_id', [['', 'Todos'], ...CRM.users.map((u) => [u.id, u.name])], q.user_id)}</div><div class="field"><label>Ação contém</label><input name="action" value="${UI.attr(q.action || '')}" placeholder="ex.: ticket_"></div><button class="btn secondary">Filtrar</button></form>
      <div class="table-wrap"><table><thead><tr><th>Quando</th><th>Usuário</th><th>Ação</th><th>Entidade</th><th>Detalhes</th><th>IP</th></tr></thead><tbody>
      ${r.entries.map((a) => `<tr><td class="small nowrap">${UI.fmtDateTime(a.created_at)}</td><td class="small nowrap">${UI.esc(a.user_name || '—')}</td><td class="mono">${UI.esc(a.action)}</td><td class="small nowrap">${UI.esc(a.entity || '')} ${UI.esc(a.entity_id || '')}</td><td class="small muted"><span class="trunc" style="max-width:320px" title="${UI.attr(JSON.stringify(a.details))}">${UI.esc(JSON.stringify(a.details))}</span></td><td class="small muted">${UI.esc(a.ip || '')}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Nenhum registro.</td></tr>'}</tbody></table></div></div>`;
    box.querySelector('#auForm').onsubmit = (e) => { e.preventDefault(); this.auditQuery = UI.formData(e.target); this.auditoria(box); };
  },
};
