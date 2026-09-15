'use strict';
// Busca de fornecedores para cotação. Os filtros são enviados ao fluxo do n8n,
// que devolve a lista; o CRM apenas exibe e permite cadastrar o fornecedor como cliente.
CRM.pages.suppliers = {
  async render(el) {
    this.el = el;
    this.status = await api('/n8n/status');
    const desligado = !this.status.outbound.configured;
    el.innerHTML = CRM.pageHeader('Fornecedores', 'Pesquise fornecedores pelo fluxo do n8n para montar cotações.') +
      (desligado ? `<div class="alert warning">Busca indisponível: o servidor precisa da variável <span class="mono">N8N_WEBHOOK_URL</span> apontando para o webhook do n8n. Peça ao administrador. Passo a passo em <span class="mono">docs/N8N.md</span>.</div>` : '') +
      `<div class="card"><form id="buscaForm">
        <div class="grid cols-4">
          ${UI.field('nicho', 'Nicho', UI.input('nicho', '', 'placeholder="Ex.: material elétrico" autocomplete="off"'))}
          ${UI.field('nome', 'Nome', UI.input('nome', '', 'placeholder="Ex.: Aço Forte" autocomplete="off"'))}
          ${UI.field('cidade', 'Cidade', UI.input('cidade', '', 'placeholder="Ex.: São Paulo" autocomplete="off"'))}
          ${UI.field('bairro', 'Bairro', UI.input('bairro', '', 'placeholder="Ex.: Mooca" autocomplete="off"'))}
        </div>
        <div class="flex wrap">
          <button class="btn" id="btnBuscar" ${desligado ? 'disabled' : ''}>Buscar</button>
          <button class="btn secondary" type="button" id="btnLimpar">Limpar</button>
          <span class="small muted">Preencha ao menos um campo. A busca pode levar alguns segundos.</span>
        </div>
      </form></div>
      <div id="resultado"></div>`;

    const form = el.querySelector('#buscaForm');
    form.onsubmit = (e) => { e.preventDefault(); this.buscar(form); };
    el.querySelector('#btnLimpar').onclick = () => { form.reset(); el.querySelector('#resultado').innerHTML = ''; };
  },

  async buscar(form) {
    const d = UI.formData(form);
    const filtros = { nicho: d.nicho, nome: d.nome, cidade: d.cidade, bairro: d.bairro };
    if (!Object.values(filtros).some((v) => v && v.trim())) { UI.toast('Informe ao menos um campo: nicho, nome, cidade ou bairro.', 'warning'); return; }
    const box = this.el.querySelector('#resultado');
    const btn = this.el.querySelector('#btnBuscar');
    btn.disabled = true;
    box.innerHTML = '<div class="card"><p class="muted">Consultando o n8n...</p></div>';
    try {
      const r = await api('/n8n/fornecedores/buscar', { method: 'POST', body: filtros });
      this.resultados = r.fornecedores;
      this.mostrar(box, r, filtros);
    } catch (err) {
      box.innerHTML = `<div class="alert danger">${UI.esc(err.message)}</div>`;
    } finally { btn.disabled = false; }
  },

  mostrar(box, r, filtros) {
    if (!r.total) {
      box.innerHTML = `<div class="card">${UI.empty('Nenhum fornecedor encontrado', r.message)}</div>`;
      return;
    }
    const usados = Object.entries(filtros).filter(([, v]) => v && v.trim()).map(([k, v]) => `${k}: ${v}`).join(' · ');
    // Mesma convenção das telas de cliente/atendimento: dígitos + DDI 55 quando faltar.
    const wa = (telefone) => { const d = UI.digits(telefone); return d ? UI.waLink(d.length <= 11 ? '55' + d : d) : null; };
    box.innerHTML = `<div class="card"><div class="card-title"><h3>${r.total} resultado(s)</h3><span class="small muted">${UI.esc(usados)}</span></div>
      <div class="table-wrap"><table><thead><tr><th>Fornecedor</th><th>Nicho</th><th>Contato</th><th>Local</th><th></th></tr></thead><tbody>
      ${r.fornecedores.map((f, i) => `<tr>
        <td><strong>${UI.esc(f.nome || 'Sem nome')}</strong>${f.documento ? `<div class="small muted mono">${UI.esc(f.documento)}</div>` : ''}${f.site ? `<div class="small"><a href="${UI.attr(f.site)}" target="_blank" rel="noopener noreferrer">site</a></div>` : ''}</td>
        <td class="small">${UI.esc(f.nicho || '—')}${f.avaliacao ? `<div class="small muted">nota ${UI.esc(f.avaliacao)}</div>` : ''}</td>
        <td class="small">${f.telefone ? `<div>${UI.esc(f.telefone)}</div>` : ''}${f.email ? `<div class="muted">${UI.esc(f.email)}</div>` : ''}${!f.telefone && !f.email ? '—' : ''}</td>
        <td class="small">${UI.esc([f.bairro, f.cidade].filter(Boolean).join(' · ') || '—')}${f.endereco ? `<div class="muted small">${UI.esc(f.endereco)}</div>` : ''}</td>
        <td class="nowrap">${wa(f.telefone) ? `<a class="btn secondary sm" href="${UI.attr(wa(f.telefone))}" target="_blank" rel="noopener noreferrer">WhatsApp</a> ` : ''}<button class="btn sm" data-cad="${i}">Cadastrar cliente</button></td>
      </tr>`).join('')}</tbody></table></div>
      <p class="small muted">Resultados vindos do fluxo do n8n (entrega #${UI.esc(String(r.delivery_id))}). Nada é gravado no CRM até você cadastrar o fornecedor.</p></div>`;

    box.querySelector('tbody').onclick = async (e) => {
      const b = e.target.closest('[data-cad]'); if (!b) return;
      const f = this.resultados[Number(b.dataset.cad)];
      b.disabled = true;
      try {
        const r2 = await api('/customers', { method: 'POST', body: {
          name: f.nome || f.telefone || 'Fornecedor sem nome',
          phone: f.telefone || undefined, email: f.email || undefined,
          city: f.cidade || undefined, company: f.nome || undefined,
          source: 'n8n', tags: ['fornecedor', ...(f.nicho ? [f.nicho] : [])],
          notes: [f.endereco, f.bairro, f.site].filter(Boolean).join(' · ') || undefined,
        } });
        UI.ok('Fornecedor cadastrado como cliente.');
        b.outerHTML = `<a class="btn secondary sm" href="#/clientes/${r2.customer.id}">Abrir cadastro</a>`;
      } catch (err) {
        if (err.status === 409 && err.data.duplicates && err.data.duplicates.length) {
          UI.toast('Já existe um cadastro com esse telefone.', 'warning');
          b.outerHTML = `<a class="btn secondary sm" href="#/clientes/${err.data.duplicates[0].id}">Já cadastrado</a>`;
        } else { UI.err(err); b.disabled = false; }
      }
    };
  },
};
