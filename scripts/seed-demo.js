#!/usr/bin/env node
'use strict';
// Popula o banco com dados FICTÍCIOS e coerentes e ativa o modo de demonstração (indicador discreto no sistema).
// Uso: npm run seed:demo   — cria usuários demo (senha: Demo12345) se ainda não existirem.
// Idempotente por e-mail dos usuários; os registros de clientes/atendimentos são criados a cada execução.
const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');

let seed = 20260912;
const rand = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const rnd = (a) => a[Math.floor(rand() * a.length)];
const ago = (min) => new Date(Date.now() - min * 60000);
const ahead = (min) => new Date(Date.now() + min * 60000);
const day = 1440;

const USERS = [
  ['Marina Albuquerque', 'admin@demo.local', 'admin', null],
  ['Ana Beatriz Ferreira', 'supervisor@demo.local', 'supervisor', null],
  ['Bruno Cardoso', 'bruno@demo.local', 'atendente', 'Comercial'],
  ['Carla Menezes', 'carla@demo.local', 'atendente', 'Comercial'],
  ['Diego Santos', 'diego@demo.local', 'atendente', 'Suporte'],
  ['Elaine Rocha', 'elaine@demo.local', 'atendente', 'Suporte'],
  ['Felipe Moraes', 'felipe@demo.local', 'atendente', 'Comercial'],
];
const CUSTOMERS = [
  ['Mariana Costa', '(11) 98765-4321', 'mariana@costaconfeccoes.com.br', 'Costa Confecções', 'São Paulo', 'Instagram', ['vip']],
  ['Pedro Alves', '(21) 97654-3210', 'pedro.alves@gmail.com', null, 'Rio de Janeiro', 'Site', []],
  ['Juliana Ramos', '(31) 96543-2109', 'juliana@ramosefilhos.com.br', 'Ramos & Filhos', 'Belo Horizonte', 'Indicação', ['revenda']],
  ['Carlos Mendes', '(41) 95432-1098', 'carlos@mendesdistribuidora.com.br', 'Mendes Distribuidora', 'Curitiba', 'WhatsApp', ['atacado']],
  ['Fernanda Lima', '(51) 94321-0987', 'fernanda.lima@outlook.com', null, 'Porto Alegre', 'Telefone', []],
  ['Ricardo Souza', '(61) 93210-9876', 'ricardo@souzatech.com.br', 'Souza Tech', 'Brasília', 'Site', ['lead']],
  ['Beatriz Nunes', '(71) 92109-8765', 'bia.nunes@gmail.com', null, 'Salvador', 'E-mail', []],
  ['Gustavo Rocha', '(81) 91098-7654', 'gustavo@rochaservicos.com.br', 'Rocha Serviços', 'Recife', 'Indicação', ['vip', 'revenda']],
  ['Helena Martins', '(19) 99876-5432', 'helena@padariamartins.com.br', 'Padaria Martins', 'Campinas', 'WhatsApp', []],
  ['Igor Teixeira', '(27) 98877-6655', 'igor.teixeira@hotmail.com', null, 'Vitória', 'Instagram', ['lead']],
  ['Larissa Campos', '(48) 99123-4567', 'larissa@camposadvocacia.com.br', 'Campos Advocacia', 'Florianópolis', 'Site', []],
  ['Marcelo Freitas', '(62) 98234-5678', 'marcelo@agrofreitas.com.br', 'Agro Freitas', 'Goiânia', 'Telefone', ['atacado']],
  ['Natália Barros', '(85) 99345-6789', 'natalia.barros@gmail.com', null, 'Fortaleza', 'WhatsApp', []],
  ['Otávio Pires', '(92) 99456-7890', 'otavio@piresmoveis.com.br', 'Pires Móveis', 'Manaus', 'Indicação', ['revenda']],
  ['Patrícia Duarte', '(11) 97567-8901', 'patricia@clinicaduarte.com.br', 'Clínica Duarte', 'São Paulo', 'E-mail', ['vip']],
  ['Rafael Gonçalves', '(47) 98678-9012', 'rafael.g@gmail.com', null, 'Joinville', 'Site', []],
];
const CONVERSATIONS = [
  { subject: 'Prazo de entrega do pedido 4821', channel: 'WhatsApp', msgs: [['in', 'Boa tarde! Queria saber quando chega o pedido 4821, já fez 10 dias.'], ['out', 'Boa tarde, {nome}! Aqui é {at}. Já estou verificando com a transportadora, te retorno em instantes.'], ['note', 'Pedido saiu do CD em 05/09, transportadora Rápido Sul. Rastreio sem atualização.'], ['out', 'Consegui a informação: o pedido está em trânsito e a previsão de entrega é para amanhã até as 18h.'], ['in', 'Perfeito, obrigada!']] },
  { subject: 'Solicitação de orçamento para 200 unidades', channel: 'WhatsApp', msgs: [['in', 'Olá, preciso de um orçamento para 200 unidades do modelo compacto. Tem desconto para esse volume?'], ['out', 'Olá, {nome}! Temos sim, acima de 100 unidades a tabela de atacado se aplica. Vou preparar a proposta e envio ainda hoje.'], ['in', 'Ótimo, fico no aguardo.']] },
  { subject: 'Divergência na fatura de agosto', channel: 'E-mail', msgs: [['in', 'A fatura de agosto veio com um valor diferente do contratado. Podem verificar?'], ['out', 'Olá, {nome}. Identificamos uma cobrança duplicada de frete. Estamos emitindo a fatura corrigida.'], ['note', 'Financeiro confirmou estorno em até 5 dias úteis.']] },
  { subject: 'Troca de produto com defeito', channel: 'WhatsApp', msgs: [['in', 'O produto chegou com o fecho quebrado. Como faço a troca?'], ['out', 'Sinto muito pelo ocorrido, {nome}. Pode me enviar uma foto do defeito e o número do pedido? Já abro a troca por aqui.'], ['in', 'Pedido 5107. Segue a foto.']] },
  { subject: 'Informações sobre planos empresariais', channel: 'Telefone', msgs: [['in', 'Ligou pedindo detalhes dos planos empresariais e valores por usuário.'], ['out', 'Enviei por e-mail a tabela de planos e agendei uma apresentação.']] },
  { subject: 'Renovação do contrato anual', channel: 'E-mail', msgs: [['in', 'Nosso contrato vence no fim do mês. Quais as condições para renovar?'], ['out', 'Olá, {nome}. Preparamos uma proposta de renovação com reajuste abaixo do índice. Segue em anexo.']] },
  { subject: 'Segunda via de boleto', channel: 'WhatsApp', msgs: [['in', 'Preciso da segunda via do boleto com vencimento dia 15.'], ['out', 'Claro, {nome}! Segue o boleto atualizado. Qualquer dúvida estou à disposição.'], ['in', 'Recebi, obrigado.']] },
  { subject: 'Suporte: erro ao emitir relatório', channel: 'Chat', msgs: [['in', 'Ao clicar em exportar relatório aparece "erro interno".'], ['out', 'Olá! Pode me informar qual relatório e o período selecionado?'], ['in', 'Relatório de vendas, mês de agosto.'], ['note', 'Reproduzido. Chamado interno #TI-338 aberto.']] },
  { subject: 'Cancelamento do serviço', channel: 'Telefone', msgs: [['in', 'Cliente informou que deseja cancelar por redução de equipe.'], ['out', 'Apresentei o plano reduzido; cliente vai avaliar e retorna até sexta.']] },
  { subject: 'Dúvida sobre garantia estendida', channel: 'WhatsApp', msgs: [['in', 'A garantia estendida cobre mau uso?'], ['out', 'Olá, {nome}! A garantia estendida cobre defeitos de fabricação por 24 meses; mau uso não está coberto.']] },
  { subject: 'Agendamento de visita técnica', channel: 'WhatsApp', msgs: [['in', 'Podem agendar uma visita técnica para a próxima semana?'], ['out', 'Sim, {nome}. Tenho disponibilidade na terça às 14h ou quinta às 10h. Qual prefere?'], ['in', 'Terça às 14h está ótimo.']] },
  { subject: 'Proposta comercial: licenças adicionais', channel: 'E-mail', msgs: [['in', 'Queremos adicionar 10 licenças ao contrato. Qual o valor?'], ['out', 'Olá, {nome}. Enviei a proposta com as 10 licenças adicionais e desconto por volume.']] },
  { subject: 'Reclamação de atraso no atendimento', channel: 'Instagram', msgs: [['in', 'Mandei mensagem ontem e ninguém respondeu.'], ['out', 'Olá, {nome}. Pedimos desculpas pela demora. Como podemos ajudar?']] },
  { subject: 'Pedido de catálogo atualizado', channel: 'WhatsApp', msgs: [['in', 'Vocês têm o catálogo 2026 em PDF?']] },
  { subject: 'Confirmação de pagamento', channel: 'WhatsApp', msgs: [['in', 'Fiz o PIX agora, podem confirmar?']] },
  { subject: 'Integração com sistema de estoque', channel: 'Chat', msgs: [['in', 'Vocês integram com o sistema Bling?'], ['out', 'Olá! Sim, temos integração nativa. Posso agendar uma demonstração?'], ['in', 'Pode ser na quinta de manhã.']] },
];
const QUICK = [
  ['Saudação inicial', 'ola', 'Olá, {nome}! Aqui é {atendente}. Como posso ajudar?'],
  ['Aguarde um momento', 'aguarde', 'Um momento, {nome}, estou verificando a informação e já retorno.'],
  ['Envio de proposta', 'proposta', 'Conforme conversamos, segue a proposta comercial. Fico à disposição para esclarecer qualquer ponto.'],
  ['Encerramento', 'tchau', 'Fico feliz em ter ajudado, {nome}! Se precisar de algo mais, é só chamar. Protocolo: {protocolo}.'],
  ['Horário de atendimento', 'horario', 'Nosso atendimento funciona de segunda a sexta, das 8h às 18h. Fora desse horário respondemos no próximo dia útil.'],
  ['Pedir dados do pedido', 'pedido', 'Para localizar o seu pedido, pode me informar o número dele e o CPF/CNPJ do cadastro?'],
];

async function main() {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const ids = {};
    for (const [name, email, role, team] of USERS) {
      const ex = await c.query('SELECT id FROM users WHERE lower(email)=lower($1)', [email]);
      ids[email] = ex.rowCount ? ex.rows[0].id : (await c.query(`INSERT INTO users (name,email,password_hash,role,team,available) VALUES ($1,$2,$3,$4,$5,TRUE) RETURNING id`, [name, email, await bcrypt.hash('Demo12345', 10), role, team])).rows[0].id;
      if (ex.rowCount) await c.query('UPDATE users SET team = COALESCE(team, $2) WHERE id = $1', [ex.rows[0].id, team]);
    }
    const attendants = USERS.filter((u) => u[2] === 'atendente').map((u) => ids[u[1]]);
    const nameOf = Object.fromEntries(USERS.map((u) => [ids[u[1]], u[0].split(' ')[0]]));
    const creator = ids['supervisor@demo.local'];
    await c.query(`UPDATE users SET available = FALSE WHERE id = $1`, [ids['felipe@demo.local']]);

    // Empresa: identidade e prazos
    await c.query(`UPDATE company_settings SET name = CASE WHEN name = 'Minha Empresa' THEN 'Horizonte Distribuidora' ELSE name END, demo_mode = TRUE, response_sla_minutes = 30, idle_opportunity_days = 7, auto_distribution = FALSE WHERE id = 1`);

    // Clientes
    const custIds = [];
    for (const [name, phone, email, company, city, source, tags] of CUSTOMERS) {
      const r = await c.query(`INSERT INTO customers (name, phone, phone_digits, email, company, city, source, tags, owner_id, created_by, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`, [name, phone, '55' + phone.replace(/\D/g, ''), email, company, city, source, tags, rnd(attendants), creator, ago((20 + rand() * 90) * day)]);
      custIds.push(r.rows[0].id);
    }

    // Funil comercial (padrão) + funil de pós-venda
    const pipe = (await c.query('SELECT id FROM pipelines WHERE is_default ORDER BY id LIMIT 1')).rows[0];
    let pos = (await c.query('SELECT COALESCE(max(position),0)+1 AS p FROM pipelines')).rows[0].p;
    const pv = (await c.query(`INSERT INTO pipelines (name, position) VALUES ('Pós-venda e renovações', $1) RETURNING id`, [pos])).rows[0];
    const pvStages = [['Contrato a vencer', 'open'], ['Contato feito', 'open'], ['Proposta de renovação', 'open'], ['Renovado', 'won'], ['Não renovado', 'lost']];
    for (let i = 0; i < pvStages.length; i++) await c.query('INSERT INTO pipeline_stages (pipeline_id, name, kind, position) VALUES ($1,$2,$3,$4)', [pv.id, pvStages[i][0], pvStages[i][1], i + 1]);
    const stages = (await c.query('SELECT * FROM pipeline_stages WHERE active AND pipeline_id = $1 ORDER BY position', [pipe.id])).rows;
    const openStages = stages.filter((s) => s.kind === 'open'), won = stages.find((s) => s.kind === 'won'), lost = stages.find((s) => s.kind === 'lost');
    const pvAll = (await c.query('SELECT * FROM pipeline_stages WHERE active AND pipeline_id = $1 ORDER BY position', [pv.id])).rows;

    // Atendimentos com conversas
    let n = 0;
    const plans = [];
    // situação: 'queue' (fila), 'unanswered' (cliente falou por último), 'overdue' (sem resposta há muito), 'active', 'waiting' (aguardando cliente), 'resolved', 'cancelled'
    const situations = ['queue', 'queue', 'queue', 'unanswered', 'unanswered', 'overdue', 'overdue', 'active', 'active', 'active', 'waiting', 'waiting', 'resolved', 'resolved', 'resolved', 'resolved', 'resolved', 'resolved', 'resolved', 'cancelled', 'active', 'unanswered', 'resolved', 'resolved', 'queue', 'active', 'resolved', 'waiting'];
    for (let i = 0; i < situations.length; i++) plans.push({ sit: situations[i], conv: CONVERSATIONS[i % CONVERSATIONS.length], cust: custIds[i % custIds.length] });
    for (const plan of plans) {
      const { sit, conv } = plan;
      const cust = plan.cust;
      const custName = CUSTOMERS[custIds.indexOf(cust)][0].split(' ')[0];
      const assignee = sit === 'queue' ? null : rnd(attendants);
      const closed = ['resolved', 'cancelled'].includes(sit);
      const openedMin = closed ? (2 + rand() * 25) * day : sit === 'overdue' ? 90 + rand() * 600 : sit === 'queue' ? 5 + rand() * 120 : (0.5 + rand() * 6) * day;
      const opened = ago(openedMin);
      const status = sit === 'queue' ? 'aguardando' : sit === 'waiting' ? 'aguardando_cliente' : sit === 'resolved' ? 'resolvido' : sit === 'cancelled' ? 'cancelado' : 'em_atendimento';
      const proto = `${opened.getFullYear()}${String(opened.getMonth() + 1).padStart(2, '0')}${String(opened.getDate()).padStart(2, '0')}-${String(++n + 900000).padStart(6, '0')}`;
      const priority = sit === 'overdue' ? rnd(['alta', 'urgente']) : rnd(['baixa', 'normal', 'normal', 'normal', 'alta']);
      const t = (await c.query(`INSERT INTO tickets (protocol, customer_id, subject, channel, priority, status, assignee_id, opened_at, created_by, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$8) RETURNING id`, [proto, cust, conv.subject, conv.channel, priority, status, assignee, opened, sit === 'queue' && conv.channel === 'WhatsApp' ? null : creator])).rows[0];
      const ev = async (kind, body, extra = {}, at) => c.query(`INSERT INTO ticket_events (ticket_id, user_id, kind, direction, channel, body, payload, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [t.id, extra.user || null, kind, extra.direction || null, extra.channel || null, body, JSON.stringify(extra.payload || {}), at]);
      await ev('system', conv.channel === 'WhatsApp' ? 'Atendimento aberto automaticamente por mensagem recebida no WhatsApp' : 'Atendimento aberto', { user: conv.channel === 'WhatsApp' ? null : creator, payload: { action: 'created', channel: conv.channel } }, opened);
      let cursor = new Date(opened.getTime());
      let msgs = conv.msgs;
      if (sit === 'queue') msgs = msgs.slice(0, 1);
      else if (sit === 'unanswered' || sit === 'overdue') msgs = msgs.filter((m, idx) => idx === 0 || m[0] !== 'out' || idx < msgs.length - 1).slice(0, 3).concat([['in', rnd(['E aí, alguma novidade?', 'Conseguiram verificar?', 'Ainda estou aguardando retorno.', 'Podem me dar uma posição?'])]]);
      else if (sit === 'waiting') msgs = msgs.filter((m) => m[0] !== 'in' || msgs.indexOf(m) === 0).slice(0, 2);
      let first = null, lastIn = null, lastOut = null, lastPrev = null, lastDir = null, unread = 0;
      if (assignee) { cursor = new Date(cursor.getTime() + 2 * 60000); await ev('system', 'Atendimento assumido', { user: assignee, payload: { action: 'claimed', to: assignee } }, cursor); }
      for (let i = 0; i < msgs.length; i++) {
        const [dir, raw] = msgs[i];
        const body = raw.replace('{nome}', custName).replace('{at}', nameOf[assignee] || 'Ana');
        const gap = i === 0 ? 0 : (dir === 'note' ? 3 : 4 + rand() * 40) * 60000;
        cursor = new Date(Math.min(cursor.getTime() + gap, Date.now() - 60000));
        if (sit === 'overdue' && i === msgs.length - 1) cursor = ago(45 + rand() * 300);
        if ((sit === 'unanswered') && i === msgs.length - 1) cursor = ago(3 + rand() * 20);
        if (dir === 'note') { await ev('note', body, { user: assignee || creator }, cursor); continue; }
        const isOut = dir === 'out';
        const via = conv.channel === 'WhatsApp' ? { via: 'whatsapp_api', status: isOut ? rnd(['entregue', 'lido', 'lido']) : undefined } : { manual: true };
        await ev('interaction', body, { user: isOut ? assignee : null, direction: isOut ? 'saida' : 'entrada', channel: conv.channel, payload: via }, cursor);
        if (isOut) { first = first || cursor; lastOut = cursor; unread = 0; } else { lastIn = cursor; unread++; }
        lastPrev = body; lastDir = isOut ? 'saida' : 'entrada';
      }
      let closedAt = null, followUp = null;
      if (closed) { closedAt = new Date(Math.min(cursor.getTime() + (30 + rand() * 600) * 60000, Date.now() - 30000)); await ev('system', `Status alterado: Em atendimento → ${sit === 'resolved' ? 'Resolvido' : 'Cancelado'}${sit === 'resolved' ? ' — Cliente confirmou a solução.' : ' — Cliente desistiu do pedido.'}`, { user: assignee, payload: { action: 'status', to: status } }, closedAt); unread = 0; }
      if (sit === 'waiting') { followUp = rand() < 0.5 ? ago(60 + rand() * 600) : ahead(120 + rand() * 2000); await ev('system', `Retorno agendado para ${followUp.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`, { user: assignee, payload: { action: 'follow_up' } }, new Date(cursor.getTime() + 60000)); await c.query(`INSERT INTO tasks (title, customer_id, ticket_id, assignee_id, due_at, priority, created_by, kind) VALUES ($1,$2,$3,$4,$5,'alta',$6,'retorno')`, [`Retorno: ${conv.subject} (${proto})`, cust, t.id, assignee, followUp, creator]); }
      if (sit === 'active' && rand() < 0.4) { followUp = ahead(60 + rand() * 1500); await c.query(`INSERT INTO tasks (title, customer_id, ticket_id, assignee_id, due_at, priority, created_by, kind) VALUES ($1,$2,$3,$4,$5,'alta',$6,'retorno')`, [`Retorno: ${conv.subject} (${proto})`, cust, t.id, assignee, followUp, creator]); }
      await c.query(`UPDATE tickets SET first_response_at = $2, closed_at = $3, follow_up_at = $4, last_message_at = $5, last_message_preview = left($6, 160), last_message_direction = $7, last_customer_message_at = $8, last_agent_message_at = $9, unread_count = $10, updated_at = $11 WHERE id = $1`,
        [t.id, first, closedAt, followUp, lastIn && (!lastOut || lastIn > lastOut) ? lastIn : (lastOut || lastIn), lastPrev, lastDir, lastIn, lastOut, closed ? 0 : unread, closedAt || cursor]);
    }

    // Oportunidades no funil comercial
    const titles = ['Plano anual — 10 licenças', 'Pacote de 200 unidades', 'Contrato de manutenção', 'Licenças adicionais', 'Projeto sob medida', 'Kit inicial de revenda', 'Assinatura premium', 'Reposição trimestral'];
    const reasons = ['Preço acima do orçamento', 'Prazo de entrega', 'Fechou com concorrente', 'Sem retorno do cliente'];
    const actions = ['Enviar proposta', 'Ligar para acompanhar', 'Agendar reunião', 'Aguardar aprovação', 'Enviar contrato'];
    for (let i = 0; i < 18; i++) {
      const kind = i < 12 ? 'open' : i < 15 ? 'won' : 'lost';
      const stage = kind === 'open' ? openStages[i % openStages.length] : kind === 'won' ? won : lost;
      const created = ago((3 + rand() * 45) * day);
      const cust = custIds[(i * 3) % custIds.length];
      const owner = rnd(attendants.slice(0, 3).concat(attendants[4]));
      // variações: 0 sem próxima ação, 1 vencida, 2 futura, 3 parada há 10 dias
      const variant = i % 4;
      const nextAt = kind !== 'open' ? null : variant === 0 ? null : variant === 1 ? ago((1 + rand() * 4) * day) : ahead((1 + rand() * 6) * day);
      const updated = kind === 'open' && variant === 3 ? ago((10 + rand() * 10) * day) : ago(rand() * 3 * day);
      const o = await c.query(`INSERT INTO opportunities (title, customer_id, owner_id, stage_id, value, next_action, next_action_at, expected_close_date, lost_reason, closed_at, created_by, created_at, updated_at, stage_entered_at, tags, source)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13,$14,$15) RETURNING id`,
        [titles[i % titles.length], cust, owner, stage.id, Math.round(800 + rand() * 24000), nextAt ? rnd(actions) : null, nextAt,
          kind === 'open' ? ahead((2 + rand() * 40) * day).toISOString().slice(0, 10) : null, kind === 'lost' ? rnd(reasons) : null, kind === 'open' ? null : ago(rand() * 12 * day), creator, created, updated,
          i % 5 === 0 ? ['prioridade'] : [], CUSTOMERS[custIds.indexOf(cust)][5]]);
      await c.query(`INSERT INTO opportunity_events (opportunity_id, user_id, body, payload, created_at) VALUES ($1,$2,$3,'{"action":"created"}',$4)`, [o.rows[0].id, creator, `Oportunidade criada na etapa "${openStages[0].name}"`, created]);
      if (stage.id !== openStages[0].id) await c.query(`INSERT INTO opportunity_events (opportunity_id, user_id, body, payload, created_at) VALUES ($1,$2,$3,$4,$5)`, [o.rows[0].id, owner, `Movida de "${openStages[0].name}" para "${stage.name}"${kind === 'lost' ? ' — motivo: ' + rnd(reasons) : ''}`, JSON.stringify({ action: 'move', from: openStages[0].id, to: stage.id }), updated]);
      if (kind === 'open' && variant === 2) await c.query(`INSERT INTO tasks (title, customer_id, opportunity_id, assignee_id, due_at, priority, created_by) VALUES ($1,$2,$3,$4,$5,'normal',$6)`, ['Enviar proposta revisada', cust, o.rows[0].id, owner, nextAt, creator]);
    }
    // Pós-venda
    for (let i = 0; i < 5; i++) {
      const stage = pvAll[i % 3];
      const cust = custIds[(i * 5 + 2) % custIds.length];
      await c.query(`INSERT INTO opportunities (title, customer_id, owner_id, stage_id, value, next_action, next_action_at, expected_close_date, created_by, created_at, stage_entered_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`, ['Renovação anual', cust, rnd(attendants), stage.id, Math.round(3000 + rand() * 15000), i % 2 ? 'Ligar para confirmar renovação' : null, i % 2 ? ahead((1 + i) * day) : null, ahead((10 + i * 5) * day).toISOString().slice(0, 10), creator, ago((2 + i) * day)]);
    }

    // Tarefas gerais
    const taskTitles = ['Retornar ligação sobre orçamento', 'Enviar catálogo atualizado', 'Confirmar recebimento do contrato', 'Agendar visita técnica', 'Atualizar cadastro do cliente', 'Cobrar retorno da proposta'];
    for (let i = 0; i < 10; i++) {
      await c.query(`INSERT INTO tasks (title, customer_id, assignee_id, due_at, priority, done_at, closed_reason, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [taskTitles[i % taskTitles.length], custIds[(i * 7) % custIds.length], attendants[i % attendants.length], i < 3 ? ago((1 + rand() * 3) * day) : i < 6 ? ahead(rand() * 600) : ahead((1 + rand() * 6) * day), rnd(['baixa', 'normal', 'alta']), i === 9 ? ago(day) : null, i === 9 ? null : null, creator]);
    }

    // Respostas rápidas
    for (const [title, shortcut, body] of QUICK) await c.query('INSERT INTO quick_replies (title, shortcut, body, created_by) VALUES ($1,$2,$3,$4)', [title, shortcut, body, ids['admin@demo.local']]);

    // Automações
    const proposal = openStages.find((s) => /proposta/i.test(s.name)) || openStages[2];
    const rules = [
      ['Tarefa após proposta enviada', 'opportunity_stage_changed', { stage_id: proposal.id }, 'create_task', { title: 'Acompanhar proposta de {cliente}', due_in_days: 2, priority: 'alta', assignee: 'owner' }, null, true],
      ['Alerta de oportunidade parada', 'opportunity_idle', { days: 7 }, 'notify', { to: 'owner', title: 'Oportunidade parada', body: '{oportunidade} de {cliente} está sem movimentação há mais de 7 dias.' }, null, true],
      ['Distribuir novos atendimentos do WhatsApp', 'ticket_created', { channel: 'WhatsApp' }, 'distribute', {}, 'Comercial', false],
      ['Avisar supervisão de prazo vencido', 'ticket_response_overdue', {}, 'notify', { to: 'supervisors', title: 'Prazo de resposta vencido', body: '{protocolo} — {cliente} aguarda resposta há mais tempo que o prazo.' }, null, true],
    ];
    for (const [name, trigger, cond, action, params, team, active] of rules) {
      const r = await c.query('INSERT INTO automation_rules (name, trigger, conditions, action, action_params, team, active, created_by, created_at, last_run_at, runs_count) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id', [name, trigger, JSON.stringify(cond), action, JSON.stringify(params), team, active, ids['admin@demo.local'], ago(15 * day), active ? ago(rand() * day) : null, active ? 3 : 0]);
      if (active) for (let k = 0; k < 3; k++) await c.query(`INSERT INTO automation_runs (rule_id, entity, entity_id, status, details, dedupe_key, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`, [r.rows[0].id, trigger.startsWith('ticket') ? 'ticket' : 'opportunity', k + 1, k === 2 ? 'ignorada' : 'executada', k === 2 ? 'Já existe uma tarefa aberta criada por esta regra.' : (action === 'notify' ? 'Notificados: 1 usuário(s).' : 'Tarefa criada.'), `seed:${trigger}:${k}`, ago((1 + k * 2) * day)]);
    }

    // Filtros salvos compartilhados
    await c.query(`INSERT INTO saved_filters (user_id, scope, name, params, shared) VALUES ($1,'tickets','Urgentes sem resposta',$2,TRUE), ($1,'pipeline','Sem próxima ação',$3,TRUE), ($1,'customers','Clientes VIP',$4,TRUE)`,
      [ids['supervisor@demo.local'], JSON.stringify({ view: 'unanswered', priority: 'urgente' }), JSON.stringify({ no_task: 'true' }), JSON.stringify({ tag: 'vip' })]);

    await c.query('COMMIT');
    console.log('Dados de demonstração criados. Modo de demonstração ATIVADO.');
    console.log('Usuários demo (senha Demo12345):', USERS.map((u) => `${u[1]} [${u[2]}]`).join(', '));
    console.log('Para remover, restaure um backup limpo ou recrie o banco; desative o indicador em Configurações › Empresa.');
  } catch (e) { await c.query('ROLLBACK'); throw e; } finally { c.release(); await pool.end(); }
}
main().catch((e) => { console.error('Falha ao popular demonstração:', e.message); process.exit(1); });
