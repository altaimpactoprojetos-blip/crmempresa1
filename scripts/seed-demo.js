#!/usr/bin/env node
'use strict';
// Popula o banco com dados FICTÍCIOS e ativa o modo de demonstração (banner visível no sistema).
// Uso: npm run seed:demo   — cria usuários demo (senha: Demo12345) se ainda não existirem.
const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');

const USERS = [
  ['Ana Supervisora', 'supervisor@demo.local', 'supervisor'], ['Bruno Atendente', 'bruno@demo.local', 'atendente'],
  ['Carla Atendente', 'carla@demo.local', 'atendente'], ['Diego Atendente', 'diego@demo.local', 'atendente'],
];
const CUSTOMERS = [
  ['Mariana Costa', '(11) 98765-4321', 'mariana@exemplo.com', 'Costa Confecções', 'São Paulo', 'Instagram', ['vip']],
  ['Pedro Alves', '(21) 97654-3210', 'pedro.alves@exemplo.com', null, 'Rio de Janeiro', 'Site', []],
  ['Juliana Ramos', '(31) 96543-2109', 'ju.ramos@exemplo.com', 'Ramos & Filhos', 'Belo Horizonte', 'Indicação', ['revenda']],
  ['Carlos Mendes', '(41) 95432-1098', null, 'Mendes Distribuidora', 'Curitiba', 'WhatsApp', ['atacado']],
  ['Fernanda Lima', '(51) 94321-0987', 'fernanda@exemplo.com', null, 'Porto Alegre', 'Telefone', []],
  ['Ricardo Souza', '(61) 93210-9876', 'ricardo@exemplo.com', 'Souza Tech', 'Brasília', 'Site', ['lead']],
  ['Beatriz Nunes', '(71) 92109-8765', 'bia@exemplo.com', null, 'Salvador', 'E-mail', []],
  ['Gustavo Rocha', '(81) 91098-7654', 'gustavo@exemplo.com', 'Rocha Serviços', 'Recife', 'Indicação', ['vip', 'revenda']],
];
const SUBJECTS = ['Dúvida sobre prazo de entrega', 'Solicitação de orçamento', 'Problema com fatura', 'Troca de produto', 'Informações sobre planos', 'Reclamação de atendimento', 'Renovação de contrato', 'Cancelamento', 'Suporte técnico', 'Segunda via de boleto'];
const CHANNELS = ['WhatsApp', 'Telefone', 'E-mail', 'Chat'];
const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const daysAgo = (d, h = 0) => new Date(Date.now() - d * 86400000 - h * 3600000);

async function main() {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const ids = {};
    for (const [name, email, role] of USERS) {
      const ex = await c.query('SELECT id FROM users WHERE lower(email)=lower($1)', [email]);
      ids[email] = ex.rowCount ? ex.rows[0].id : (await c.query(`INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id`, [name, email, await bcrypt.hash('Demo12345', 10), role])).rows[0].id;
    }
    const attendants = USERS.filter((u) => u[2] === 'atendente').map((u) => ids[u[1]]);
    const admin = (await c.query(`SELECT id FROM users WHERE role='admin' ORDER BY id LIMIT 1`)).rows[0];
    const creator = admin ? admin.id : ids['supervisor@demo.local'];
    const custIds = [];
    for (const [name, phone, email, company, city, source, tags] of CUSTOMERS) {
      const r = await c.query(`INSERT INTO customers (name, phone, phone_digits, email, company, city, source, tags, owner_id, created_by, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`, [name, phone, '55' + phone.replace(/\D/g, ''), email, company, city, source, tags, rnd(attendants), creator, daysAgo(30 + Math.random() * 60)]);
      custIds.push(r.rows[0].id);
    }
    const stages = (await c.query('SELECT * FROM pipeline_stages WHERE active ORDER BY position')).rows;
    const openStages = stages.filter((s) => s.kind === 'open'), won = stages.find((s) => s.kind === 'won'), lost = stages.find((s) => s.kind === 'lost');
    let n = 0;
    for (let i = 0; i < 24; i++) {
      const cust = rnd(custIds), opened = daysAgo(Math.random() * 25, Math.random() * 10);
      const statusPick = i < 4 ? 'aguardando' : i < 9 ? 'em_atendimento' : i < 11 ? 'aguardando_cliente' : i < 21 ? 'resolvido' : 'cancelado';
      const assignee = statusPick === 'aguardando' ? null : rnd(attendants);
      const first = statusPick === 'aguardando' ? null : new Date(opened.getTime() + (5 + Math.random() * 120) * 60000);
      const closed = ['resolvido', 'cancelado'].includes(statusPick) ? new Date(opened.getTime() + (2 + Math.random() * 70) * 3600000) : null;
      const proto = `${opened.getFullYear()}${String(opened.getMonth() + 1).padStart(2, '0')}${String(opened.getDate()).padStart(2, '0')}-${String(++n + 900000).padStart(6, '0')}`;
      const t = await c.query(`INSERT INTO tickets (protocol, customer_id, subject, channel, priority, status, assignee_id, opened_at, first_response_at, closed_at, follow_up_at, created_by, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$8) RETURNING id`,
        [proto, cust, rnd(SUBJECTS), rnd(CHANNELS), rnd(['baixa', 'normal', 'normal', 'alta', 'urgente']), statusPick, assignee, opened, first, closed,
          statusPick === 'aguardando_cliente' ? new Date(Date.now() + 86400000) : null, creator]);
      await c.query(`INSERT INTO ticket_events (ticket_id, user_id, kind, body, payload, created_at) VALUES ($1,$2,'system','Atendimento aberto','{"action":"created"}',$3)`, [t.rows[0].id, creator, opened]);
      if (assignee) {
        await c.query(`INSERT INTO ticket_events (ticket_id, user_id, kind, body, payload, created_at) VALUES ($1,$2,'system','Atendimento assumido',$3,$4)`, [t.rows[0].id, assignee, JSON.stringify({ action: 'claimed', to: assignee }), new Date(opened.getTime() + 60000)]);
        await c.query(`INSERT INTO ticket_events (ticket_id, user_id, kind, direction, channel, body, created_at) VALUES ($1,$2,'interaction','saida','WhatsApp','Olá! Recebemos sua solicitação e já estamos verificando.',$3)`, [t.rows[0].id, assignee, first]);
      }
      if (closed) await c.query(`INSERT INTO ticket_events (ticket_id, user_id, kind, body, payload, created_at) VALUES ($1,$2,'system',$3,$4,$5)`, [t.rows[0].id, assignee, `Status alterado: Em atendimento → ${statusPick === 'resolvido' ? 'Resolvido' : 'Cancelado'}`, JSON.stringify({ action: 'status', to: statusPick }), closed]);
    }
    const reasons = ['Preço', 'Prazo', 'Fechou com concorrente', 'Sem retorno'];
    for (let i = 0; i < 12; i++) {
      const kind = i < 7 ? 'open' : i < 10 ? 'won' : 'lost';
      const stage = kind === 'open' ? rnd(openStages) : kind === 'won' ? won : lost;
      const created = daysAgo(5 + Math.random() * 40);
      const o = await c.query(`INSERT INTO opportunities (title, customer_id, owner_id, stage_id, value, next_action, next_action_at, expected_close_date, lost_reason, closed_at, created_by, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
        [rnd(['Plano anual', 'Pacote de 50 unidades', 'Contrato de manutenção', 'Licença adicional', 'Projeto sob medida']), rnd(custIds), rnd(attendants), stage.id, Math.round(500 + Math.random() * 20000),
          kind === 'open' ? rnd(['Enviar proposta', 'Ligar para follow-up', 'Agendar reunião', 'Aguardar aprovação']) : null, kind === 'open' ? new Date(Date.now() + (Math.random() * 10 - 3) * 86400000) : null,
          kind === 'open' ? new Date(Date.now() + Math.random() * 30 * 86400000).toISOString().slice(0, 10) : null, kind === 'lost' ? rnd(reasons) : null, kind === 'open' ? null : daysAgo(Math.random() * 10), creator, created]);
      await c.query(`INSERT INTO opportunity_events (opportunity_id, user_id, body, payload, created_at) VALUES ($1,$2,$3,'{"action":"created"}',$4)`, [o.rows[0].id, creator, `Oportunidade criada na etapa "${openStages[0].name}"`, created]);
    }
    for (let i = 0; i < 10; i++) {
      await c.query(`INSERT INTO tasks (title, customer_id, assignee_id, due_at, priority, done_at, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [rnd(['Retornar ligação', 'Enviar proposta revisada', 'Confirmar recebimento', 'Agendar visita', 'Atualizar cadastro']), rnd(custIds), rnd(attendants),
          new Date(Date.now() + (Math.random() * 10 - 4) * 86400000), rnd(['baixa', 'normal', 'alta']), i < 3 ? daysAgo(1) : null, creator]);
    }
    await c.query('UPDATE company_settings SET demo_mode = TRUE WHERE id = 1');
    await c.query('COMMIT');
    console.log('Dados de demonstração criados. Modo de demonstração ATIVADO (banner visível).');
    console.log('Usuários demo (senha Demo12345):', USERS.map((u) => `${u[1]} [${u[2]}]`).join(', '));
    console.log('Para remover, restaure um backup limpo ou recrie o banco; desative o banner em Configurações › Empresa.');
  } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); await pool.end(); }
}
main().catch((e) => { console.error('Falha ao popular demonstração:', e.message); process.exit(1); });
