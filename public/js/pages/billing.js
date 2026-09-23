'use strict';
// Assinatura da empresa: plano, uso, troca de plano e pagamentos.
CRM.pages.billing = {
  STATUS: {
    trial: ['Período de teste', 'primary'],
    active: ['Ativa', 'success'],
    past_due: ['Pagamento em atraso', 'warning'],
    suspended: ['Suspensa', 'danger'],
    cancelled: ['Cancelada', 'danger'],
  },
  PAYMENT: {
    PENDING: ['Aguardando pagamento', 'warning'],
    RECEIVED: ['Pago', 'success'],
    CONFIRMED: ['Pago', 'success'],
    RECEIVED_IN_CASH: ['Pago', 'success'],
    OVERDUE: ['Vencido', 'danger'],
    REFUNDED: ['Estornado', ''],
  },

  async render(el) {
    this.el = el;
    const [data, me] = await Promise.all([api('/billing'), api('/auth/me')]);
    CRM.company = me.company; // sincroniza o aviso do menu (ex.: depois de um pagamento)
    const footer = document.querySelector('.sidebar-footer');
    if (footer) footer.innerHTML = CRM.planChipHtml();
    const c = data.company;
    const current = data.plans.find((p) => p.id === c.plan);
    const isAdmin = CRM.isAdmin();
    const [statusLabel, statusCls] = this.STATUS[c.status] || [c.status, ''];
    const days = c.trial_ends_at ? Math.ceil((new Date(c.trial_ends_at) - Date.now()) / 86400000) : null;
    const lines = [];
    if (c.status === 'trial' && days !== null)
      lines.push(
        days > 0
          ? `O teste termina em ${days} ${days === 1 ? 'dia' : 'dias'} (${UI.fmtDate(c.trial_ends_at)}).`
          : 'O teste terminou.',
      );
    if (c.current_period_end) lines.push(`Pago até ${UI.fmtDate(c.current_period_end)}.`);
    if (c.status === 'past_due')
      lines.push(`Há uma mensalidade em aberto. O acesso é bloqueado ${data.grace_days} dias após o vencimento.`);
    const bar = (used, max) => {
      const pct = max ? Math.min(100, Math.round((used / max) * 100)) : 0;
      return `<div class="usage"><div class="usage-bar"><span style="width:${max ? pct : 4}%" class="${pct >= 100 ? 'full' : ''}"></span></div><span class="small">${used} de ${max ?? 'ilimitado'}</span></div>`;
    };
    const feature = (ok, label) => `<li class="${ok ? '' : 'off'}">${ok ? '✓' : '—'} ${label}</li>`;
    const planCard = (p) => {
      const isCurrent = p.id === c.plan;
      return `<div class="card plan-card ${isCurrent ? 'current' : ''}"><div class="flex between"><h3>${UI.esc(p.name)}</h3>${isCurrent ? '<span class="badge primary">Plano atual</span>' : ''}</div>
        <div class="plan-price">${p.price_cents ? `${UI.fmtMoney(p.price_cents / 100)}<span>/mês</span>` : 'Grátis'}</div>
        <ul class="plan-features">${feature(true, `${p.max_users ?? 'Usuários ilimitados'}${p.max_users ? ` usuário${p.max_users > 1 ? 's' : ''}` : ''}`)}
          ${feature(true, `${p.max_channels ?? 'Canais ilimitados'}${p.max_channels ? ` ${p.max_channels > 1 ? 'canais' : 'canal'} (WhatsApp, Instagram ou Messenger)` : ''}`)}
          ${feature(true, 'Funis, campos personalizados e relatórios')}
          ${feature(p.features.automations, 'Automações do funil')}
          ${feature(p.features.chatbot, 'Robô de atendimento')}</ul>
        ${isAdmin && p.public ? `<button class="btn ${isCurrent && c.has_subscription ? 'secondary' : ''}" data-plan="${p.id}">${isCurrent && c.has_subscription ? 'Atualizar pagamento' : isCurrent ? 'Assinar este plano' : 'Escolher este plano'}</button>` : ''}</div>`;
    };
    el.innerHTML =
      CRM.pageHeader('Assinatura', 'Plano da empresa, uso e pagamentos.') +
      (c.block_text
        ? `<div class="alert danger"><strong>Acesso bloqueado.</strong> ${UI.esc(c.block_text)}${isAdmin ? '' : ' Fale com o administrador da sua empresa.'}</div>`
        : '') +
      `<div class="grid cols-2"><div class="card"><div class="flex between"><h3>Plano atual: ${UI.esc(current ? current.name : c.plan)}</h3><span class="badge ${statusCls}">${statusLabel}</span></div>
          ${lines.map((l) => `<p class="small">${UI.esc(l)}</p>`).join('')}
          ${isAdmin && c.has_subscription ? '<button class="btn ghost sm" id="cancelSub">Cancelar renovação</button>' : ''}</div>
        <div class="card"><h3>Uso</h3><p class="small muted">Usuários ativos</p>${bar(data.usage.users, current?.max_users)}
          <p class="small muted mt">Canais conectados</p>${bar(data.usage.channels, current?.max_channels)}</div></div>
      ${isAdmin ? `<h3 class="mt">Planos</h3>${data.billing_enabled ? '' : '<div class="alert info small">O pagamento on-line ainda não foi ativado. Escolha o plano e fale com o suporte para assinar.</div>'}` : ''}
      <div class="grid cols-3">${data.plans
        .filter((p) => p.public || p.id === c.plan)
        .map(planCard)
        .join('')}</div>
      ${
        isAdmin
          ? `<div class="card mt"><h3>Pagamentos</h3>${
              data.payments.length
                ? `<div class="table-wrap"><table><thead><tr><th>Vencimento</th><th>Valor</th><th>Situação</th><th>Pago em</th><th></th></tr></thead><tbody>${data.payments
                    .map((p) => {
                      const [l, cls] = this.PAYMENT[p.status] || [p.status, ''];
                      return `<tr><td>${UI.fmtDate(p.due_date)}</td><td>${UI.fmtMoney(p.value_cents / 100)}</td><td><span class="badge ${cls}">${l}</span></td><td>${p.paid_at ? UI.fmtDate(p.paid_at) : '—'}</td>
                      <td>${p.invoice_url ? `<a class="btn ${['PENDING', 'OVERDUE'].includes(p.status) ? '' : 'ghost'} sm" href="${UI.attr(p.invoice_url)}" target="_blank" rel="noopener">${['PENDING', 'OVERDUE'].includes(p.status) ? 'Pagar' : 'Ver fatura'}</a>` : ''}</td></tr>`;
                    })
                    .join('')}</tbody></table></div>`
                : UI.empty('Nenhum pagamento ainda', 'As cobranças aparecem aqui depois que você escolher um plano.')
            }</div>`
          : ''
      }`;
    el.querySelectorAll('[data-plan]').forEach((b) => {
      b.onclick = () =>
        this.subscribe(
          data,
          data.plans.find((p) => p.id === b.dataset.plan),
        );
    });
    const cancel = el.querySelector('#cancelSub');
    if (cancel)
      cancel.onclick = async () => {
        if (
          !(await UI.confirm('Cancelar a renovação automática? O CRM continua liberado até o fim do período pago.', {
            danger: true,
            okLabel: 'Cancelar renovação',
          }))
        )
          return;
        try {
          UI.ok((await api('/billing/cancel', { method: 'POST' })).message);
          this.render(el);
        } catch (err) {
          UI.err(err);
        }
      };
  },

  subscribe(data, plan) {
    if (!data.billing_enabled) {
      UI.modal({
        title: `Plano ${plan.name}`,
        size: 'narrow',
        body: `<p>O pagamento on-line ainda não está disponível. Fale com o suporte para assinar o plano <strong>${UI.esc(plan.name)}</strong> (${UI.fmtMoney(plan.price_cents / 100)}/mês).</p>`,
        footer: '<button class="btn" data-close>Entendi</button>',
      });
      return;
    }
    const c = data.company;
    const m = UI.modal({
      title: `Assinar o plano ${plan.name}`,
      size: 'narrow',
      body: `<form id="subForm"><p class="small">${UI.fmtMoney(plan.price_cents / 100)} por mês, renovado automaticamente. Cancele quando quiser.</p>
        ${UI.field('document', 'CPF ou CNPJ de quem paga', UI.input('document', c.billing_document || '', 'required inputmode="numeric"'), { required: true, hint: 'Usado na nota e na cobrança.' })}
        ${UI.field('email', 'E-mail para as cobranças', UI.input('email', c.billing_email || '', 'type="email" required'), { required: true })}
        ${UI.field(
          'billing_type',
          'Forma de pagamento',
          UI.select(
            'billing_type',
            [
              ['UNDEFINED', 'Escolher na hora de pagar'],
              ['PIX', 'Pix'],
              ['BOLETO', 'Boleto'],
              ['CREDIT_CARD', 'Cartão de crédito'],
            ],
            'UNDEFINED',
          ),
        )}</form>`,
      footer:
        '<button class="btn secondary" data-close>Voltar</button><button class="btn" type="submit" form="subForm">Continuar para o pagamento</button>',
    });
    const form = m.el.querySelector('#subForm');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const btn = m.el.querySelector('button[type=submit]');
      btn.disabled = true;
      // Abre a aba antes da resposta para o navegador não bloquear a janela do pagamento
      const win = window.open('', '_blank');
      try {
        const r = await api('/billing/subscribe', { method: 'POST', body: { plan_id: plan.id, ...UI.formData(form) } });
        if (r.invoice_url && win) win.location = r.invoice_url;
        else if (win) win.close();
        UI.ok(r.message);
        m.close();
        this.render(this.el);
      } catch (err) {
        if (win) win.close();
        UI.showErrors(form, err);
        if (!err.data?.fields) UI.err(err);
      } finally {
        btn.disabled = false;
      }
    };
  },
};
