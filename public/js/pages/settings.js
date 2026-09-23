'use strict';
CRM.pages.settings = {
  async render(el, { sub }) {
    this.el = el;
    const r = await api('/settings');
    this.data = r;
    const tabs = [
      ['empresa', 'Empresa'],
      ['usuarios', 'Usuários'],
      ['funil', 'Funis'],
      ['campos', 'Campos personalizados'],
      ['automacoes', 'Automações'],
      ['whatsapp', 'WhatsApp'],
      ['respostas', 'Respostas rápidas'],
      ['canais', 'Canais e origens'],
      ['integracoes', 'Integrações'],
      ['backup', 'Backup'],
      ['auditoria', 'Auditoria'],
    ];
    const visible = CRM.isAdmin()
      ? tabs
      : tabs.filter(([k]) =>
          [
            'respostas',
            'integracoes',
            'auditoria',
            'funil',
            'campos',
            ...(CRM.isManager() ? ['automacoes'] : []),
          ].includes(k),
        );
    this.tab = sub && visible.some(([k]) => k === sub) ? sub : visible[0][0];
    el.innerHTML =
      CRM.pageHeader(
        'Configurações',
        CRM.isAdmin()
          ? 'Identidade visual, equipe, funil e integrações.'
          : 'Consulta de configurações. Alterações exigem perfil de administrador.',
      ) +
      `<div class="tabs">${visible.map(([k, l]) => `<button data-tab="${k}" class="${this.tab === k ? 'active' : ''}">${l}</button>`).join('')}</div><div id="tabBody"></div>`;
    el.querySelector('.tabs').onclick = (e) => {
      const b = e.target.closest('[data-tab]');
      if (b) location.hash = `#/configuracoes/${b.dataset.tab}`;
    };
    this[this.tab](el.querySelector('#tabBody'));
  },

  empresa(box) {
    const s = this.data.settings;
    box.innerHTML = `<div class="card"><form id="coForm"><div class="grid" style="grid-template-columns: 1fr 260px">
      <div>${UI.field('name', 'Nome da empresa', UI.input('name', s.name, 'required'), { required: true })}
        <div class="form-row">${UI.field('primary_color', 'Cor principal', `<div class="flex"><input type="color" class="color-swatch" id="pc" value="${s.primary_color}"><input name="primary_color" value="${s.primary_color}" pattern="^#[0-9a-fA-F]{6}$"></div>`)}${UI.field('accent_color', 'Cor de destaque', `<div class="flex"><input type="color" class="color-swatch" id="ac" value="${s.accent_color}"><input name="accent_color" value="${s.accent_color}" pattern="^#[0-9a-fA-F]{6}$"></div>`)}</div>
        ${UI.field('timezone', 'Fuso horário', UI.input('timezone', s.timezone), { hint: 'Ex.: America/Sao_Paulo' })}
        <label class="check"><input type="checkbox" name="auto_distribution" ${s.auto_distribution ? 'checked' : ''}> Distribuição automática em rodízio ao abrir atendimentos sem responsável</label>
        <label class="check mt"><input type="checkbox" name="inbox_auto_lead" ${s.inbox_auto_lead ? 'checked' : ''}> Criar oportunidade no funil automaticamente para cada nova conversa no WhatsApp</label>
        <label class="check mt"><input type="checkbox" name="demo_mode" ${s.demo_mode ? 'checked' : ''}> Modo de demonstração (exibe aviso de dados fictícios)</label></div>
      <div><label>Logotipo</label><img class="logo-preview" id="logoPrev" src="${UI.attr(s.logo_data || '')}" alt="" ${s.logo_data ? '' : 'hidden'}><div class="field mt"><input type="file" id="logoFile" accept="image/png,image/jpeg,image/svg+xml,image/webp"><div class="hint">PNG, JPEG, WEBP ou SVG, até 300KB.</div></div><button type="button" class="btn ghost sm" id="logoClear">Remover logotipo</button></div></div>
      <div class="right mt"><button class="btn">Salvar</button></div></form></div>`;
    const form = box.querySelector('#coForm');
    let logo;
    box.querySelector('#pc').oninput = (e) => (form.primary_color.value = e.target.value);
    box.querySelector('#ac').oninput = (e) => (form.accent_color.value = e.target.value);
    box.querySelector('#logoFile').onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 300 * 1024) {
        UI.toast('Arquivo maior que 300KB.', 'error');
        e.target.value = '';
        return;
      }
      const rd = new FileReader();
      rd.onload = () => {
        logo = rd.result;
        const p = box.querySelector('#logoPrev');
        p.src = logo;
        p.hidden = false;
      };
      rd.readAsDataURL(f);
    };
    box.querySelector('#logoClear').onclick = () => {
      logo = null;
      box.querySelector('#logoPrev').hidden = true;
    };
    form.onsubmit = async (e) => {
      e.preventDefault();
      const d = UI.formData(form);
      if (logo !== undefined) d.logo_data = logo;
      try {
        const r = await api('/settings', { method: 'PUT', body: d });
        UI.ok(r.message);
        CRM.settings = r.settings;
        location.reload();
      } catch (err) {
        UI.showErrors(form, err);
      }
    };
  },

  async usuarios(box) {
    const r = await api('/users', { query: { include_inactive: 'true' } });
    box.innerHTML = `<div class="card"><div class="card-title"><h3>Equipe (${r.users.filter((u) => u.active).length} ativos)</h3><button class="btn" id="newUser">+ Novo usuário</button></div>
      <div class="table-wrap"><table><thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Situação</th><th>Disponível</th><th>Último acesso</th><th></th></tr></thead><tbody>
      ${r.users
        .map(
          (
            u,
          ) => `<tr><td><strong>${UI.esc(u.name)}</strong></td><td class="small">${UI.esc(u.email)}</td><td><span class="badge ${u.role === 'admin' ? 'dark' : u.role === 'supervisor' ? 'purple' : 'primary'}">${UI.ROLE[u.role]}</span></td><td>${u.active ? '<span class="badge success">Ativo</span>' : '<span class="badge">Desativado</span>'}</td><td class="small">${u.role === 'atendente' ? (u.available ? 'Sim' : 'Não') : '—'}</td><td class="small">${UI.fmtDateTime(u.last_login_at)}</td>
        <td class="nowrap"><button class="btn sm secondary" data-edit="${u.id}">Editar</button> <button class="btn sm secondary" data-link="${u.id}" title="Gerar link de redefinição de senha">Senha</button> ${u.active ? `<button class="btn sm danger" data-deact="${u.id}" ${u.id === CRM.user.id ? 'disabled' : ''}>Desativar</button>` : `<button class="btn sm success" data-act="${u.id}">Reativar</button>`}</td></tr>`,
        )
        .join('')}</tbody></table></div>
      <p class="muted small mt">Desativar um usuário preserva todo o histórico e exige a transferência das pendências (atendimentos, tarefas e oportunidades abertas) para outro responsável.</p></div>`;
    box.querySelector('#newUser').onclick = () => this.userForm(null, () => this.usuarios(box));
    box.querySelectorAll('[data-edit]').forEach(
      (b) =>
        (b.onclick = () =>
          this.userForm(
            r.users.find((u) => u.id === Number(b.dataset.edit)),
            () => this.usuarios(box),
          )),
    );
    box.querySelectorAll('[data-act]').forEach(
      (b) =>
        (b.onclick = async () => {
          try {
            const x = await api(`/users/${b.dataset.act}/activate`, { method: 'POST' });
            UI.ok(x.message);
            await CRM.loadUsers();
            this.usuarios(box);
          } catch (err) {
            UI.err(err);
          }
        }),
    );
    box.querySelectorAll('[data-link]').forEach(
      (b) =>
        (b.onclick = async () => {
          try {
            const x = await api(`/users/${b.dataset.link}/reset-link`, { method: 'POST' });
            UI.modal({
              title: 'Link de redefinição de senha',
              size: 'narrow',
              body: `<p class="small">${UI.esc(x.message)} Envie ao usuário por um canal seguro:</p><input readonly value="${UI.attr(x.link)}" data-select-all>`,
              footer: '<button class="btn" data-close>Fechar</button>',
            });
          } catch (err) {
            UI.err(err);
          }
        }),
    );
    box.querySelectorAll('[data-deact]').forEach(
      (b) =>
        (b.onclick = () =>
          this.deactivate(
            r.users.find((u) => u.id === Number(b.dataset.deact)),
            r.users,
            () => this.usuarios(box),
          )),
    );
  },
  userForm(u, done) {
    const isEdit = Boolean(u);
    const m = UI.modal({
      title: isEdit ? 'Editar usuário' : 'Novo usuário',
      body: `<form id="uForm"><div class="form-row">${UI.field('name', 'Nome', UI.input('name', u?.name, 'required'), { required: true })}${UI.field('email', 'E-mail', UI.input('email', u?.email, 'type="email" required'), { required: true })}</div>
      <div class="form-row">${UI.field('role', 'Perfil', UI.select('role', Object.entries(UI.ROLE), u?.role || 'atendente'), { required: true })}${UI.field('password', isEdit ? 'Nova senha (deixe em branco para manter)' : 'Senha inicial', UI.input('password', '', `type="password" minlength="8" ${isEdit ? '' : 'required'} autocomplete="new-password"`), { required: !isEdit, hint: 'Mínimo de 8 caracteres.' })}</div>
      <label class="check"><input type="checkbox" name="available" ${u ? (u.available ? 'checked' : '') : 'checked'}> Disponível para distribuição automática (atendentes)</label>
      <div class="help mt"><strong>Administrador:</strong> configura o sistema e gerencia usuários. <strong>Supervisor:</strong> acompanha a equipe, indicadores e redistribui atendimentos. <strong>Atendente:</strong> acessa seus clientes e atendimentos e a fila compartilhada.</div></form>`,
      footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="uForm">${isEdit ? 'Salvar' : 'Criar usuário'}</button>`,
    });
    m.el.querySelector('#uForm').onsubmit = async (e) => {
      e.preventDefault();
      const d = UI.formData(e.target);
      if (!d.password) delete d.password;
      try {
        const r = isEdit
          ? await api(`/users/${u.id}`, { method: 'PUT', body: d })
          : await api('/users', { method: 'POST', body: d });
        UI.ok(r.message);
        m.close();
        await CRM.loadUsers();
        done();
      } catch (err) {
        UI.showErrors(e.target, err);
      }
    };
  },
  deactivate(u, users, done) {
    const others = users.filter((x) => x.active && x.id !== u.id);
    const m = UI.modal({
      title: `Desativar ${u.name}`,
      size: 'narrow',
      body: `<form id="dForm"><p class="small">O usuário perderá o acesso imediatamente. O histórico é preservado. As pendências (atendimentos abertos, tarefas, oportunidades e clientes sob responsabilidade) serão transferidas para:</p>
      ${UI.field('transfer_to', 'Transferir pendências para', UI.select('transfer_to', [['', '— Não transferir (só permitido sem pendências) —'], ...others.map((x) => [x.id, `${x.name} (${UI.ROLE[x.role]})`])], '', 'data-type="int"'))}<div id="dErr"></div></form>`,
      footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn danger" type="submit" form="dForm">Desativar</button>`,
    });
    m.el.querySelector('#dForm').onsubmit = async (e) => {
      e.preventDefault();
      const d = UI.formData(e.target);
      try {
        const r = await api(`/users/${u.id}/deactivate`, {
          method: 'POST',
          body: { transfer_to: d.transfer_to || null },
        });
        UI.ok(
          `${r.message} Transferidos: ${r.transferred.tickets} atendimento(s), ${r.transferred.tasks} tarefa(s), ${r.transferred.opportunities} oportunidade(s), ${r.transferred.customers} cliente(s).`,
        );
        m.close();
        await CRM.loadUsers();
        done();
      } catch (err) {
        if (err.status === 409 && err.data.pending) {
          const p = err.data.pending;
          m.el.querySelector('#dErr').innerHTML =
            `<div class="alert warning">${UI.esc(err.message)} Pendências: ${p.tickets} atendimento(s), ${p.tasks} tarefa(s), ${p.opportunities} oportunidade(s), ${p.customers} cliente(s).</div>`;
        } else UI.showErrors(e.target, err);
      }
    };
  },

  // ---------- Funis e etapas ----------
  async funil(box) {
    const pipelines = (await api('/pipelines')).pipelines;
    const ro = !CRM.isAdmin();
    if (!pipelines.some((p) => p.id === this.pipelineSel))
      this.pipelineSel = (pipelines.find((p) => p.is_default) || pipelines[0]).id;
    const current = pipelines.find((p) => p.id === this.pipelineSel);
    const stages = current.stages.filter((s) => s.active);
    const row = (s = { name: '', kind: 'open' }) =>
      `<tr data-id="${s.id || ''}"><td><input name="name" value="${UI.attr(s.name)}" required ${ro ? 'readonly' : ''}></td><td>${UI.select(
        'kind',
        [
          ['open', 'Aberta'],
          ['won', 'Ganho'],
          ['lost', 'Perdido'],
        ],
        s.kind,
        ro ? 'disabled' : '',
      )}</td><td class="nowrap">${ro ? '' : '<button type="button" class="icon-btn" data-up>↑</button><button type="button" class="icon-btn" data-down>↓</button><button type="button" class="icon-btn" data-rm title="Remover">🗑</button>'}</td></tr>`;
    box.innerHTML = `<div class="card"><div class="flex between wrap"><div><h3>Funis</h3><p class="muted small">Separe processos diferentes (ex.: vendas, pós-venda, parcerias). O funil <b>principal</b> recebe os contatos novos do WhatsApp.</p></div>
      ${ro ? '' : '<button class="btn sm" id="newPipe">+ Novo funil</button>'}</div>
      <div class="tabs" id="pipeSel">${pipelines.map((p) => `<button data-id="${p.id}" class="${p.id === current.id ? 'active' : ''}">${UI.esc(p.name)}${p.is_default ? ' <span class="badge primary">principal</span>' : ''}</button>`).join('')}</div>
      ${ro ? '' : `<div class="flex wrap"><button class="btn secondary sm" id="renPipe">Renomear</button>${current.is_default ? '' : '<button class="btn secondary sm" id="defPipe">Tornar principal</button><button class="btn ghost sm" id="delPipe">Excluir funil</button>'}</div>`}</div>
      <div class="card"><h3>Etapas de "${UI.esc(current.name)}"</h3><p class="muted small">Ordene as etapas; é obrigatório ter exatamente uma etapa "Ganho" e uma "Perdido". Etapas removidas que já possuem oportunidades ficam apenas ocultas.</p>
      <form id="stForm"><table><thead><tr><th>Nome</th><th>Tipo</th><th></th></tr></thead><tbody id="stBody">${stages.map(row).join('')}</tbody></table>
      ${ro ? '' : '<div class="flex between mt"><button type="button" class="btn secondary sm" id="addSt">+ Adicionar etapa</button><button class="btn">Salvar etapas</button></div>'}</form></div>`;
    box.querySelector('#pipeSel').onclick = (e) => {
      const b = e.target.closest('button[data-id]');
      if (!b) return;
      this.pipelineSel = Number(b.dataset.id);
      this.funil(box);
    };
    if (ro) return;
    const call = async (fn) => {
      try {
        const r = await fn();
        if (r) UI.ok(r.message);
        this.funil(box);
      } catch (err) {
        UI.err(err);
      }
    };
    box.querySelector('#newPipe').onclick = async () => {
      const name = await UI.prompt('Nome do novo funil', { title: 'Novo funil', placeholder: 'ex.: Pós-venda' });
      if (!name) return;
      call(async () => {
        const r = await api('/pipelines', { method: 'POST', body: { name } });
        this.pipelineSel = r.pipeline.id;
        return r;
      });
    };
    box.querySelector('#renPipe').onclick = async () => {
      const name = await UI.prompt('Novo nome do funil', { title: 'Renomear funil', placeholder: current.name });
      if (name) call(() => api(`/pipelines/${current.id}`, { method: 'PUT', body: { name } }));
    };
    const def = box.querySelector('#defPipe');
    if (def)
      def.onclick = () => call(() => api(`/pipelines/${current.id}`, { method: 'PUT', body: { is_default: true } }));
    const del = box.querySelector('#delPipe');
    if (del)
      del.onclick = async () => {
        if (await UI.confirm(`Excluir o funil "${current.name}" e suas etapas?`, { danger: true, okLabel: 'Excluir' }))
          call(() => api(`/pipelines/${current.id}`, { method: 'DELETE' }));
      };
    const body = box.querySelector('#stBody');
    box.querySelector('#addSt').onclick = () => body.insertAdjacentHTML('beforeend', row());
    body.onclick = (e) => {
      const tr = e.target.closest('tr');
      if (!tr) return;
      if (e.target.closest('[data-rm]')) tr.remove();
      if (e.target.closest('[data-up]') && tr.previousElementSibling) tr.previousElementSibling.before(tr);
      if (e.target.closest('[data-down]') && tr.nextElementSibling) tr.nextElementSibling.after(tr);
    };
    box.querySelector('#stForm').onsubmit = (e) => {
      e.preventDefault();
      const list = [...body.querySelectorAll('tr')].map((tr) => ({
        id: tr.dataset.id ? Number(tr.dataset.id) : undefined,
        name: tr.querySelector('[name=name]').value.trim(),
        kind: tr.querySelector('[name=kind]').value,
      }));
      call(() => api('/settings/stages', { method: 'PUT', body: { pipeline_id: current.id, stages: list } }));
    };
  },

  // ---------- Campos personalizados ----------
  async campos(box) {
    const { fields } = await api('/custom-fields');
    const ro = !CRM.isAdmin();
    const typeLabels = {
      text: 'Texto',
      textarea: 'Texto longo',
      number: 'Número',
      money: 'Valor (R$)',
      date: 'Data',
      select: 'Lista de opções',
      checkbox: 'Sim/Não',
      url: 'Link',
    };
    const table = (entity, title) => {
      const list = fields.filter((f) => f.entity === entity);
      return `<div class="card"><div class="flex between"><h3>${title}</h3>${ro ? '' : `<button class="btn sm" data-new="${entity}">+ Novo campo</button>`}</div>
        ${
          list.length
            ? `<div class="table-wrap"><table><thead><tr><th>Campo</th><th>Tipo</th><th>Obrigatório</th>${ro ? '' : '<th></th>'}</tr></thead><tbody>${list
                .map(
                  (f) =>
                    `<tr><td>${UI.esc(f.label)} <span class="muted small mono">${UI.esc(f.key)}</span></td><td>${typeLabels[f.type]}${f.type === 'select' ? `<div class="muted small">${UI.esc(f.options.join(', '))}</div>` : ''}</td><td>${f.required ? 'Sim' : 'Não'}</td>${ro ? '' : `<td class="nowrap"><button class="btn ghost sm" data-edit="${f.id}">Editar</button><button class="btn ghost sm" data-del="${f.id}">Excluir</button></td>`}</tr>`,
                )
                .join('')}</tbody></table></div>`
            : UI.empty('Nenhum campo personalizado', 'Crie campos para guardar informações específicas do seu negócio.')
        }</div>`;
    };
    box.innerHTML = `<p class="muted small">Campos extras aparecem nos formulários e na ficha do cliente e da oportunidade. Excluir um campo só o remove dos formulários: os valores já preenchidos continuam guardados.</p>
      <div class="grid cols-2">${table('customer', 'Clientes')}${table('opportunity', 'Oportunidades')}</div>`;
    if (ro) return;
    const done = async () => {
      await CRM.loadCustomFields(true);
      this.campos(box);
    };
    box.onclick = async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.new) this.fieldForm({ entity: b.dataset.new }, typeLabels, done);
      if (b.dataset.edit)
        this.fieldForm(
          fields.find((f) => f.id === Number(b.dataset.edit)),
          typeLabels,
          done,
        );
      if (b.dataset.del) {
        const f = fields.find((x) => x.id === Number(b.dataset.del));
        if (!(await UI.confirm(`Remover o campo "${f.label}" dos formulários?`, { danger: true, okLabel: 'Remover' })))
          return;
        try {
          UI.ok((await api(`/custom-fields/${f.id}`, { method: 'DELETE' })).message);
          done();
        } catch (err) {
          UI.err(err);
        }
      }
    };
  },

  fieldForm(f, typeLabels, done) {
    const isEdit = Boolean(f.id);
    const m = UI.modal({
      title: isEdit ? 'Editar campo' : `Novo campo de ${f.entity === 'customer' ? 'cliente' : 'oportunidade'}`,
      size: 'narrow',
      body: `<form id="cfForm">${UI.field('label', 'Nome do campo', UI.input('label', f.label, 'required maxlength="60" placeholder="ex.: Data de aniversário"'), { required: true })}
        ${UI.field('type', 'Tipo', UI.select('type', Object.entries(typeLabels), f.type || 'text', isEdit ? 'disabled' : ''))}
        <div id="optBox">${UI.field('options', 'Opções (uma por linha)', UI.textarea('options', (f.options || []).join('\n'), 'rows="4"'))}</div>
        <label class="check"><input type="checkbox" name="required" ${f.required ? 'checked' : ''}> Preenchimento obrigatório</label></form>`,
      footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="cfForm">Salvar</button>`,
    });
    const form = m.el.querySelector('#cfForm');
    const sync = () => (m.el.querySelector('#optBox').hidden = form.type.value !== 'select');
    form.type.onchange = sync;
    sync();
    form.onsubmit = async (e) => {
      e.preventDefault();
      const body = {
        label: form.label.value.trim(),
        required: form.required.checked,
        options: form.options.value
          .split('\n')
          .map((x) => x.trim())
          .filter(Boolean),
      };
      if (!isEdit) Object.assign(body, { entity: f.entity, type: form.type.value });
      try {
        const r = isEdit
          ? await api(`/custom-fields/${f.id}`, { method: 'PUT', body })
          : await api('/custom-fields', { method: 'POST', body });
        UI.ok(r.message);
        m.close();
        done();
      } catch (err) {
        UI.showErrors(form, err);
      }
    };
  },

  // ---------- Automações ----------
  async automacoes(box) {
    const [{ automations }, { pipelines }] = await Promise.all([api('/automations'), api('/pipelines')]);
    const ro = !CRM.isAdmin();
    const statusBadge = (st) =>
      ({
        ok: '<span class="badge success">ok</span>',
        partial: '<span class="badge warning">parcial</span>',
        error: '<span class="badge danger">erro</span>',
      })[st] || '';
    box.innerHTML = `<div class="card"><div class="flex between wrap"><div><h3>Automações do funil</h3><p class="muted small">Quando uma oportunidade entra em uma etapa, as ações configuradas rodam sozinhas: criar tarefa, mandar WhatsApp, definir responsável (inclusive por rodízio), marcar o cliente ou avisar alguém.</p></div>
      ${ro ? '' : '<button class="btn sm" id="newAut">+ Nova automação</button>'}</div>
      ${
        automations.length
          ? `<div class="table-wrap"><table><thead><tr><th>Nome</th><th>Quando entrar em</th><th>Ações</th><th>Última execução</th><th>Situação</th><th></th></tr></thead><tbody>${automations
              .map(
                (a) =>
                  `<tr><td><b>${UI.esc(a.name)}</b></td><td>${pipelines.length > 1 ? `<span class="muted small">${UI.esc(a.pipeline_name)} ›</span> ` : ''}${UI.esc(a.stage_name)}</td>
                  <td class="small">${a.actions.map((x) => UI.esc(this.actionLabels[x.type])).join(', ')}</td>
                  <td class="small">${a.last_run ? `${statusBadge(a.last_run.status)} ${UI.fmtDateTime(a.last_run.created_at)}` : '<span class="muted">nunca</span>'}</td>
                  <td>${a.active ? '<span class="badge success">ativa</span>' : '<span class="badge">pausada</span>'}</td>
                  <td class="nowrap"><button class="btn ghost sm" data-runs="${a.id}">Histórico</button>${ro ? '' : `<button class="btn ghost sm" data-edit="${a.id}">Editar</button><button class="btn ghost sm" data-del="${a.id}">Excluir</button>`}</td></tr>`,
              )
              .join('')}</tbody></table></div>`
          : UI.empty(
              'Nenhuma automação',
              ro
                ? 'Peça a um administrador para criar.'
                : 'Crie a primeira: ex.: ao entrar em "Proposta", criar tarefa de follow-up em 2 dias.',
            )
      }</div>`;
    const reload = () => this.automacoes(box);
    const nb = box.querySelector('#newAut');
    if (nb) nb.onclick = () => this.automationForm(null, pipelines, reload);
    box.onclick = async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const a = automations.find((x) => x.id === Number(b.dataset.runs || b.dataset.edit || b.dataset.del));
      if (!a) return;
      if (b.dataset.runs) this.automationRuns(a, statusBadge);
      if (b.dataset.edit) this.automationForm(a, pipelines, reload);
      if (b.dataset.del) {
        if (!(await UI.confirm(`Excluir a automação "${a.name}"?`, { danger: true, okLabel: 'Excluir' }))) return;
        try {
          UI.ok((await api(`/automations/${a.id}`, { method: 'DELETE' })).message);
          reload();
        } catch (err) {
          UI.err(err);
        }
      }
    };
  },

  actionLabels: {
    create_task: 'Criar tarefa',
    send_whatsapp: 'Enviar WhatsApp',
    set_owner: 'Definir responsável',
    add_tag: 'Adicionar etiqueta ao cliente',
    notify: 'Avisar usuário',
  },

  // Campos de cada tipo de ação (data-k = propriedade enviada à API)
  actionFields(a) {
    const users = (CRM.users || []).filter((u) => u.active);
    const who = (k, v, extra = []) =>
      UI.select(
        k,
        [
          ['owner', 'Responsável pela oportunidade'],
          ['actor', 'Quem moveu o cartão'],
          ...extra,
          ...users.map((u) => [u.id, u.name]),
        ],
        v,
        `data-k="${k}" data-int-or-str`,
      );
    switch (a.type) {
      case 'create_task':
        return `<div class="form-row cols-3">${UI.field('title', 'Título da tarefa', UI.input('title', a.title, 'data-k="title" placeholder="ex.: Ligar para {primeiro_nome}"'))}
          ${UI.field('due_in_hours', 'Prazo (horas)', `<input type="number" min="0" max="8760" data-k="due_in_hours" value="${UI.attr(a.due_in_hours ?? 24)}">`)}
          ${UI.field('assignee', 'Para', who('assignee', a.assignee ?? 'owner', [['none', 'Ninguém']]))}</div>`;
      case 'send_whatsapp':
        return UI.field(
          'text',
          'Mensagem',
          `<textarea data-k="text" rows="3" placeholder="Olá {primeiro_nome}, ...">${UI.esc(a.text || '')}</textarea>`,
        );
      case 'set_owner':
        return UI.field(
          'user_id',
          'Novo responsável',
          UI.select(
            'user_id',
            [['round_robin', 'Rodízio entre atendentes disponíveis'], ...users.map((u) => [u.id, u.name])],
            a.user_id ?? 'round_robin',
            'data-k="user_id" data-int-or-str',
          ),
        );
      case 'add_tag':
        return UI.field('tag', 'Etiqueta', UI.input('tag', a.tag, 'data-k="tag" placeholder="ex.: proposta-enviada"'));
      case 'notify':
        return `<div class="form-row">${UI.field('user', 'Avisar', who('user', a.user ?? 'owner'))}${UI.field('text', 'Aviso', UI.input('text', a.text, 'data-k="text" placeholder="ex.: {oportunidade} chegou em {etapa}"'))}</div>`;
      default:
        return '';
    }
  },

  automationForm(a, pipelines, done) {
    const isEdit = Boolean(a);
    const actions = a ? a.actions.map((x) => ({ ...x })) : [{ type: 'create_task' }];
    const stageOptions = pipelines
      .map(
        (p) =>
          `<optgroup label="${UI.attr(p.name)}">${p.stages
            .filter((s) => s.active)
            .map(
              (s) => `<option value="${s.id}" ${a && a.stage_id === s.id ? 'selected' : ''}>${UI.esc(s.name)}</option>`,
            )
            .join('')}</optgroup>`,
      )
      .join('');
    const m = UI.modal({
      title: isEdit ? 'Editar automação' : 'Nova automação',
      size: 'wide',
      body: `<form id="autForm"><div class="form-row">${UI.field('name', 'Nome', UI.input('name', a?.name, 'required placeholder="ex.: Follow-up de proposta"'), { required: true })}
        ${UI.field('stage_id', 'Quando a oportunidade entrar na etapa', `<select name="stage_id" data-type="int" required>${stageOptions}</select>`, { required: true })}</div>
        <label class="check"><input type="checkbox" name="active" ${!a || a.active ? 'checked' : ''}> Automação ativa</label>
        <h4 class="mt">Ações (executadas em ordem)</h4><div id="actList"></div>
        <button type="button" class="btn secondary sm" id="addAct">+ Adicionar ação</button>
        <p class="muted small mt">Variáveis nos textos: {nome}, {primeiro_nome}, {oportunidade}, {valor}, {etapa}, {responsavel}, {empresa}. "Enviar WhatsApp" usa a conversa do cliente em um número conectado (no WhatsApp oficial, fora da janela de 24h, a Meta exige modelo aprovado).</p></form>`,
      footer: `<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="autForm">Salvar</button>`,
    });
    const form = m.el.querySelector('#autForm');
    const list = m.el.querySelector('#actList');
    // Lê os valores digitados antes de redesenhar a lista
    const read = () =>
      [...list.querySelectorAll('.action-row')].map((row) => {
        const out = { type: row.querySelector('[data-type-sel]').value };
        row.querySelectorAll('[data-k]').forEach((el) => {
          let v = el.value.trim();
          if (el.type === 'number') v = v === '' ? undefined : Number(v);
          else if (el.hasAttribute('data-int-or-str') && /^\d+$/.test(v)) v = Number(v);
          out[el.dataset.k] = v;
        });
        return out;
      });
    const draw = () => {
      list.innerHTML = actions
        .map(
          (x, i) =>
            `<div class="action-row card" data-i="${i}"><div class="flex between"><select data-type-sel style="width:auto">${Object.entries(
              this.actionLabels,
            )
              .map(([k, l]) => `<option value="${k}" ${k === x.type ? 'selected' : ''}>${l}</option>`)
              .join(
                '',
              )}</select>${actions.length > 1 ? '<button type="button" class="icon-btn" data-rm title="Remover ação">🗑</button>' : ''}</div>${this.actionFields(x)}</div>`,
        )
        .join('');
    };
    draw();
    list.onchange = (e) => {
      if (!e.target.matches('[data-type-sel]')) return;
      const i = Number(e.target.closest('.action-row').dataset.i);
      actions.splice(0, actions.length, ...read());
      actions[i] = { type: e.target.value };
      draw();
    };
    list.onclick = (e) => {
      if (!e.target.closest('[data-rm]')) return;
      const i = Number(e.target.closest('.action-row').dataset.i);
      actions.splice(0, actions.length, ...read());
      actions.splice(i, 1);
      draw();
    };
    m.el.querySelector('#addAct').onclick = () => {
      actions.splice(0, actions.length, ...read());
      if (actions.length >= 10) return UI.err(new Error('Máximo de 10 ações por automação.'));
      actions.push({ type: 'notify' });
      draw();
    };
    form.onsubmit = async (e) => {
      e.preventDefault();
      const body = {
        name: form.name.value.trim(),
        stage_id: Number(form.stage_id.value),
        active: form.active.checked,
        actions: read(),
      };
      try {
        const r = isEdit
          ? await api(`/automations/${a.id}`, { method: 'PUT', body })
          : await api('/automations', { method: 'POST', body });
        UI.ok(r.message);
        m.close();
        done();
      } catch (err) {
        UI.showErrors(form, err);
        if (!err.data?.fields) UI.err(err);
      }
    };
  },

  async automationRuns(a, statusBadge) {
    const { runs } = await api(`/automations/${a.id}/runs`);
    UI.modal({
      title: `Histórico — ${a.name}`,
      size: 'wide',
      body: runs.length
        ? `<div class="table-wrap"><table><thead><tr><th>Quando</th><th>Oportunidade</th><th>Resultado</th><th>Detalhes</th></tr></thead><tbody>${runs
            .map(
              (r) =>
                `<tr><td class="nowrap small">${UI.fmtDateTime(r.created_at)}</td><td>${r.opportunity_id ? `<a href="#/funil/${r.opportunity_id}">${UI.esc(r.opportunity_title || '#' + r.opportunity_id)}</a>` : '—'}</td><td>${statusBadge(r.status)}</td>
                <td class="small">${r.detail.map((d) => `<div>${d.ok ? '✓' : '✗'} ${UI.esc(this.actionLabels[d.type] || d.type)}${d.error ? ` — <span class="text-danger">${UI.esc(d.error)}</span>` : ''}</div>`).join('')}</td></tr>`,
            )
            .join('')}</tbody></table></div>`
        : UI.empty('Nenhuma execução ainda', 'Mova uma oportunidade para a etapa para disparar a automação.'),
      footer: '<button class="btn secondary" data-close>Fechar</button>',
    });
  },

  canais(box) {
    const s = this.data.settings;
    box.innerHTML = `<div class="grid cols-2"><div class="card"><h3>Canais de atendimento</h3><form id="chForm">${UI.field('channels', 'Um por linha', UI.textarea('channels', s.channels.join('\n'), 'rows="8"'))}<button class="btn">Salvar canais</button></form></div>
      <div class="card"><h3>Origens de contato</h3><form id="srForm">${UI.field('contact_sources', 'Um por linha', UI.textarea('contact_sources', s.contact_sources.join('\n'), 'rows="8"'))}<button class="btn">Salvar origens</button></form></div></div>`;
    const save = (form, key) => async (e) => {
      e.preventDefault();
      const list = form[key].value
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean);
      try {
        const r = await api('/settings', { method: 'PUT', body: { [key]: list } });
        UI.ok(r.message);
        this.data.settings = r.settings;
      } catch (err) {
        UI.showErrors(form, err);
      }
    };
    const ch = box.querySelector('#chForm'),
      sr = box.querySelector('#srForm');
    ch.onsubmit = save(ch, 'channels');
    sr.onsubmit = save(sr, 'contact_sources');
  },

  integracoes(box) {
    const smtp = this.data.integrations.smtp;
    box.innerHTML = `<div class="grid cols-2"><div class="card"><div class="card-title"><h3>E-mail (SMTP)</h3>${smtp.configured ? '<span class="badge success">Configurado</span>' : '<span class="badge">Não configurado</span>'}</div>
      <p class="small">${smtp.configured ? 'A recuperação de senha envia o link por e-mail.' : 'Sem SMTP, a recuperação de senha registra o link no log do servidor e o administrador pode gerar um link em Configurações › Usuários › Senha.'}</p>
      <div class="help">Configurado no servidor pelo responsável pela plataforma.</div></div>
      <div class="card"><div class="card-title"><h3>WhatsApp Business</h3></div><p class="small">Conecte o número da empresa em <a href="#/configuracoes/whatsapp">Configurações › WhatsApp</a>.</p></div></div>`;
  },

  async whatsapp(box) {
    const { channels } = await api('/channels');
    const statusBadge = (c) =>
      ({
        connected: '<span class="badge success">Conectado</span>',
        pending: '<span class="badge warning">Aguardando leitura do QR</span>',
        error: '<span class="badge danger">Erro</span>',
      })[c.status] || '<span class="badge">Desconectado</span>';
    const kind = (c) => (c.type === 'whatsapp_web' ? 'QR Code (WhatsApp Web)' : 'API oficial (Meta)');
    const apiDetails = (c) => `<h4>Webhook (configure no painel da Meta)</h4>
      ${UI.field('', 'URL de retorno (Callback URL)', `<input readonly value="${UI.attr(c.webhook_url)}" data-select-all>`)}
      ${UI.field('', 'Token de verificação (Verify token)', `<input readonly value="${UI.attr(c.verify_token)}" data-select-all>`)}
      <p class="small muted">Em WhatsApp › Configuração › Webhook, cole os dois valores acima e assine o campo <span class="mono">messages</span>.
      ${c.has_app_secret ? '' : '<br><strong>Recomendado:</strong> informe a chave secreta do app para o CRM conferir a assinatura de cada mensagem recebida.'}</p>
      <p class="small muted">ID do número: <span class="mono">${UI.esc(c.phone_number_id)}</span>${c.waba_id ? ` · ID da conta (WABA): <span class="mono">${UI.esc(c.waba_id)}</span>` : ''}</p>`;
    const actions = (c) => {
      if (c.type === 'whatsapp_web')
        return c.status === 'connected'
          ? `<button class="btn ghost sm" data-disconnect="${c.id}">Desconectar</button>`
          : `<button class="btn sm" data-qr="${c.id}">Gerar QR Code</button>`;
      return `<button class="btn secondary sm" data-edit="${c.id}">${c.status === 'connected' ? 'Atualizar credenciais' : 'Reconectar'}</button>
        ${c.status === 'connected' ? `<button class="btn ghost sm" data-disconnect="${c.id}">Desconectar</button>` : ''}`;
    };
    const channelCard = (
      c,
    ) => `<div class="card channel-card"><div class="card-title"><div><h3>${UI.esc(c.name)}</h3><div class="muted small">${kind(c)}</div></div>${statusBadge(c)}</div>
      ${c.display_phone ? `<p><strong>${UI.esc(UI.fmtPhone(c.display_phone))}</strong> ${c.verified_name ? `<span class="muted">· ${UI.esc(c.verified_name)}</span>` : ''}</p>` : ''}
      ${c.last_error ? `<div class="alert warning small">${UI.esc(c.last_error)}</div>` : ''}
      ${c.type === 'whatsapp' && CRM.isAdmin() ? apiDetails(c) : ''}
      <div class="flex">${actions(c)}</div></div>`;
    const credentialFields = (isNew) => `
      ${isNew ? UI.field('name', 'Nome da conexão', UI.input('name', 'WhatsApp', 'required maxlength="80"'), { required: true, hint: 'Ex.: Vendas, Suporte.' }) : ''}
      ${UI.field('access_token', 'Token de acesso permanente', UI.input('access_token', '', `type="password" ${isNew ? 'required' : ''} autocomplete="off"`), { required: isNew, hint: 'Gerado em Configurações do negócio › Usuários do sistema, com as permissões whatsapp_business_messaging e whatsapp_business_management.' })}
      ${isNew ? UI.field('phone_number_id', 'ID do número de telefone (Phone number ID)', UI.input('phone_number_id', '', 'required inputmode="numeric"'), { required: true }) : ''}
      ${UI.field('waba_id', 'ID da conta do WhatsApp Business (WABA ID)', UI.input('waba_id', '', 'inputmode="numeric"'), { hint: 'Necessário para listar os modelos de mensagem aprovados.' })}
      ${UI.field('app_secret', 'Chave secreta do app (App Secret)', UI.input('app_secret', '', 'type="password" autocomplete="off"'), { hint: 'Em Configurações do app › Básico. Protege o webhook contra mensagens falsas.' })}`;
    box.innerHTML = `${channels.length ? `<div class="grid cols-2">${channels.map(channelCard).join('')}</div>` : ''}
      <h3 class="mt">${channels.length ? 'Adicionar outra conexão' : 'Conectar o WhatsApp da empresa'}</h3>
      <div class="grid cols-2">
        <div class="card option-card"><div class="option-icon">▣</div><h3>Pelo QR Code</h3>
          <p class="small">Conecte em 1 minuto, usando o WhatsApp que já está no celular da empresa, como no WhatsApp Web. Fotos e áudios continuam no celular: o CRM só os mostra quando você abre.</p>
          <div class="alert warning small"><strong>Atenção:</strong> esta conexão não é oficial. O WhatsApp pode bloquear o número, principalmente se ele enviar muitas mensagens para quem não tem o número salvo. Para grandes volumes, prefira a API oficial.</div>
          <button class="btn" id="newQr">Gerar QR Code</button></div>
        <div class="card option-card"><div class="option-icon">✓</div><h3>Pela API oficial da Meta <span class="badge success">Recomendado</span></h3>
          <p class="small">Sem risco de bloqueio, com modelos de mensagem aprovados e várias pessoas atendendo. Exige conta no Meta Business.</p>
          <details class="help"><summary>Passo a passo na Meta</summary><ol class="small">
            <li>Em <span class="mono">developers.facebook.com</span>, crie um app do tipo <em>Empresa</em> e adicione o produto <em>WhatsApp</em>.</li>
            <li>Em WhatsApp › Configuração da API, adicione e verifique o número da empresa. Copie o <em>ID do número de telefone</em> e o <em>ID da conta do WhatsApp Business</em>.</li>
            <li>Em business.facebook.com › Configurações do negócio › Usuários do sistema, crie um usuário administrador, atribua o app e a conta do WhatsApp e gere um <em>token permanente</em>.</li>
            <li>Em Configurações do app › Básico, copie a <em>Chave secreta do app</em>.</li>
            <li>Preencha o formulário abaixo. Depois, configure o webhook na Meta com os dados que vão aparecer aqui.</li></ol></details>
          <form id="waForm" class="mt">${credentialFields(true)}<button class="btn">Conectar pela API</button></form></div>
      </div>`;
    const form = box.querySelector('#waForm');
    const clean = (d) => Object.fromEntries(Object.entries(d).filter(([, v]) => v !== '' && v != null));
    form.onsubmit = async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button');
      btn.disabled = true;
      try {
        const r = await api('/channels', { method: 'POST', body: clean(UI.formData(form)) });
        UI.ok(r.message);
        this.whatsapp(box);
      } catch (err) {
        UI.showErrors(form, err);
      } finally {
        btn.disabled = false;
      }
    };
    box.querySelector('#newQr').onclick = async () => {
      const name = await UI.prompt('Nome da conexão', {
        title: 'Conectar pelo QR Code',
        placeholder: 'Ex.: WhatsApp da loja',
      });
      if (!name) return;
      try {
        const r = await api('/channels/web', { method: 'POST', body: { name } });
        this.qrModal(r.channel.id, box);
      } catch (err) {
        UI.err(err);
      }
    };
    box.onclick = async (e) => {
      const edit = e.target.closest('[data-edit]');
      const disc = e.target.closest('[data-disconnect]');
      const qr = e.target.closest('[data-qr]');
      if (qr) {
        try {
          await api(`/channels/${qr.dataset.qr}/connect`, { method: 'POST' });
          this.qrModal(Number(qr.dataset.qr), box);
        } catch (err) {
          UI.err(err);
        }
      }
      if (disc) {
        if (
          !(await UI.confirm(
            'Desconectar este número? O histórico de conversas é mantido, mas novas mensagens deixam de chegar e de ser enviadas.',
            { danger: true, okLabel: 'Desconectar' },
          ))
        )
          return;
        try {
          UI.ok((await api(`/channels/${disc.dataset.disconnect}/disconnect`, { method: 'POST' })).message);
          this.whatsapp(box);
        } catch (err) {
          UI.err(err);
        }
      }
      if (edit) {
        const m = UI.modal({
          title: 'Atualizar credenciais',
          body: `<form id="waEdit">${credentialFields(false)}<p class="small muted">Deixe em branco o que não mudou. Informar um novo token reconecta o canal.</p></form>`,
          footer:
            '<button class="btn secondary" data-close>Cancelar</button><button class="btn" type="submit" form="waEdit">Salvar</button>',
        });
        const f = m.el.querySelector('#waEdit');
        f.onsubmit = async (ev) => {
          ev.preventDefault();
          try {
            const r = await api(`/channels/${edit.dataset.edit}`, { method: 'PUT', body: clean(UI.formData(f)) });
            UI.ok(r.message);
            m.close();
            this.whatsapp(box);
          } catch (err) {
            UI.showErrors(f, err);
          }
        };
      }
    };
  },

  // Mostra o QR Code e acompanha a leitura pelo celular até conectar.
  qrModal(channelId, box) {
    let timer;
    const m = UI.modal({
      title: 'Conectar pelo QR Code',
      body: `<div class="qr-box"><div id="qrArea" class="qr-area"><p class="muted">Gerando QR Code...</p></div>
        <ol class="small qr-steps"><li>Abra o <strong>WhatsApp</strong> no celular da empresa.</li>
        <li>Toque em <strong>Mais opções (⋮)</strong> ou <strong>Configurações</strong> e depois em <strong>Aparelhos conectados</strong>.</li>
        <li>Toque em <strong>Conectar um aparelho</strong> e aponte a câmera para este código.</li></ol></div>`,
      footer: '<button class="btn secondary" data-close>Fechar</button>',
      onClose: () => {
        clearTimeout(timer);
        this.whatsapp(box);
      },
    });
    const area = m.el.querySelector('#qrArea');
    const poll = async () => {
      try {
        const s = await api(`/channels/${channelId}/qr`);
        if (s.status === 'connected') {
          area.innerHTML =
            '<div class="qr-done">✓</div><p><strong>WhatsApp conectado!</strong></p><p class="small muted">As novas mensagens vão aparecer em Conversas.</p>';
          return;
        }
        if (s.status === 'disconnected' || s.status === 'error') {
          area.innerHTML = `<div class="alert warning small">${UI.esc(s.last_error || 'Conexão interrompida.')}</div><button class="btn" id="qrRetry">Gerar novo QR Code</button>`;
          area.querySelector('#qrRetry').onclick = async () => {
            area.innerHTML = '<p class="muted">Gerando QR Code...</p>';
            await api(`/channels/${channelId}/connect`, { method: 'POST' });
            timer = setTimeout(poll, 1500);
          };
          return;
        }
        if (s.qr) area.innerHTML = `<img src="${UI.attr(s.qr)}" alt="QR Code do WhatsApp" width="260" height="260">`;
      } catch (err) {
        area.innerHTML = `<div class="alert danger small">${UI.esc(err.message)}</div>`;
        return;
      }
      timer = setTimeout(poll, 2000);
    };
    poll();
  },

  async respostas(box) {
    const { quick_replies: list } = await api('/quick-replies');
    const canEdit = CRM.isManager();
    box.innerHTML = `<div class="grid cols-2"><div class="card"><h3>Respostas rápidas</h3>
      <p class="small muted">No chat, digite <span class="mono">/</span> e o atalho para inserir o texto. Use <span class="mono">{nome}</span> para o primeiro nome do cliente.</p>
      ${list.length ? `<div class="table-wrap"><table><thead><tr><th>Atalho</th><th>Texto</th>${canEdit ? '<th></th>' : ''}</tr></thead><tbody>${list.map((r) => `<tr><td class="mono">/${UI.esc(r.shortcut)}</td><td class="small">${UI.esc(r.body)}</td>${canEdit ? `<td class="nowrap"><button class="btn ghost sm" data-edit="${r.id}">Editar</button><button class="btn ghost sm" data-del="${r.id}">Excluir</button></td>` : ''}</tr>`).join('')}</tbody></table></div>` : UI.empty('Nenhuma resposta rápida', canEdit ? 'Crie a primeira ao lado.' : 'Peça a um supervisor para cadastrar.')}</div>
      ${canEdit ? `<div class="card"><h3>Nova resposta</h3><form id="qrForm">${UI.field('shortcut', 'Atalho', UI.input('shortcut', '', 'required maxlength="30" placeholder="ex.: preco"'), { required: true, hint: 'Letras, números, "-" ou "_", sem espaços.' })}${UI.field('body', 'Texto', UI.textarea('body', '', 'rows="5" required'), { required: true })}<button class="btn">Salvar</button></form></div>` : ''}</div>`;
    const form = box.querySelector('#qrForm');
    if (form)
      form.onsubmit = async (e) => {
        e.preventDefault();
        try {
          UI.ok((await api('/quick-replies', { method: 'POST', body: UI.formData(form) })).message);
          this.respostas(box);
        } catch (err) {
          UI.showErrors(form, err);
        }
      };
    box.onclick = async (e) => {
      const del = e.target.closest('[data-del]');
      const edit = e.target.closest('[data-edit]');
      try {
        if (del && (await UI.confirm('Excluir esta resposta rápida?', { danger: true, okLabel: 'Excluir' }))) {
          UI.ok((await api(`/quick-replies/${del.dataset.del}`, { method: 'DELETE' })).message);
          this.respostas(box);
        }
        if (edit) {
          const r = list.find((x) => x.id === Number(edit.dataset.edit));
          const body = await UI.prompt(`Texto de /${r.shortcut}`, { title: 'Editar resposta rápida', multiline: true });
          if (body) {
            UI.ok((await api(`/quick-replies/${r.id}`, { method: 'PUT', body: { body } })).message);
            this.respostas(box);
          }
        }
      } catch (err) {
        UI.err(err);
      }
    };
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
