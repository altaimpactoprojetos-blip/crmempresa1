'use strict';
// Central de conversas, respostas rápidas, filtros salvos, múltiplos funis e automações.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { pool, resetDb, startServer, client, createUser } = require('./helpers');
const automations = require('../src/lib/automations');

let server, base, admin, sup, at1, at2, customerId;

before(async () => {
  await resetDb();
  await createUser('Admin', 'admin@t.com', 'admin');
  await createUser('Supervisora', 'sup@t.com', 'supervisor');
  await createUser('Atendente Um', 'a1@t.com', 'atendente');
  await createUser('Atendente Dois', 'a2@t.com', 'atendente');
  ({ server, base } = await startServer());
  admin = client(base); sup = client(base); at1 = client(base); at2 = client(base);
  await admin.login('admin@t.com', 'Senha12345'); await sup.login('sup@t.com', 'Senha12345');
  await at1.login('a1@t.com', 'Senha12345'); await at2.login('a2@t.com', 'Senha12345');
  customerId = (await sup.post('/customers', { name: 'Cliente Central', phone: '(11) 91111-2222' })).data.customer.id;
});
after(async () => { server.close(); await pool.end(); });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('central: mensagem inicial, contadores, sem resposta, prazo e leitura', async () => {
  const t = (await at1.post('/tickets', { customer_id: customerId, subject: 'Quero um orçamento', channel: 'WhatsApp', first_message: 'Olá, quanto custa o plano?' })).data.ticket;
  let c = (await at1.get('/tickets/counts')).data.counts;
  assert.equal(c.queue, 1); assert.equal(c.unanswered, 1);
  let list = (await at1.get('/tickets?view=unanswered')).data.tickets;
  assert.equal(list[0].id, t.id); assert.equal(list[0].awaiting_reply, true); assert.ok(list[0].response_due_at); assert.equal(list[0].unread_count, 1);
  assert.equal(list[0].last_message_preview, 'Olá, quanto custa o plano?');
  await at1.post(`/tickets/${t.id}/claim`);
  await at1.post(`/tickets/${t.id}/read`);
  assert.equal((await at1.get(`/tickets/${t.id}`)).data.ticket.unread_count, 0);
  const r = await at1.post(`/tickets/${t.id}/interactions`, { direction: 'saida', channel: 'WhatsApp', body: 'Custa R$ 100.', attachments: [{ name: 'tabela.txt', mime: 'text/plain', data: Buffer.from('preços').toString('base64') }] });
  assert.equal(r.status, 201); assert.equal(r.data.ticket.awaiting_reply, false); assert.equal(r.data.ticket.response_due_at, null); assert.equal(r.data.event.attachments.length, 1);
  const detail = (await at1.get(`/tickets/${t.id}`)).data;
  assert.equal(detail.attachments.length, 1);
  const file = await at1.raw(`/tickets/${t.id}/attachments/${detail.attachments[0].id}`);
  assert.equal(file.status, 200); assert.equal(await file.text(), 'preços');
  c = (await at1.get('/tickets/counts')).data.counts; assert.equal(c.unanswered, 0); assert.equal(c.mine, 1);
  // Cliente responde (registro manual) → volta a "sem resposta"; aguardando cliente é retomado automaticamente
  await at1.post(`/tickets/${t.id}/status`, { status: 'aguardando_cliente' });
  const inb = await at1.post(`/tickets/${t.id}/interactions`, { direction: 'entrada', channel: 'WhatsApp', body: 'Fechado, quero contratar.' });
  assert.equal(inb.data.ticket.status, 'em_atendimento'); assert.equal(inb.data.ticket.awaiting_reply, true); assert.equal(inb.data.ticket.unread_count, 1);
  // Encerrado não aceita interação
  await at1.post(`/tickets/${t.id}/status`, { status: 'resolvido' });
  assert.equal((await at1.post(`/tickets/${t.id}/interactions`, { direction: 'saida', channel: 'WhatsApp', body: 'x' })).status, 409);
  list = (await at1.get('/tickets?view=closed')).data.tickets; assert.equal(list.length, 1);
  // Ordenação e exportação com filtros
  assert.equal((await sup.get('/tickets?tabela=1&sort=customer_name&dir=desc')).status, 200);
  assert.equal((await sup.raw('/tickets/export.csv?view=closed')).status, 200);
});

test('respostas rápidas: supervisor mantém, atendente consulta, inativas ficam ocultas', async () => {
  assert.equal((await at1.post('/quick-replies', { title: 'x', body: 'y' })).status, 403);
  const q = await sup.post('/quick-replies', { title: 'Saudação', shortcut: 'ola', body: 'Olá {nome}!' });
  assert.equal(q.status, 201);
  assert.equal((await at1.get('/quick-replies')).data.quick_replies.length, 1);
  await sup.put(`/quick-replies/${q.data.quick_reply.id}`, { active: false });
  assert.equal((await at1.get('/quick-replies')).data.quick_replies.length, 0);
  assert.equal((await sup.get('/quick-replies?all=true')).data.quick_replies.length, 1);
});

test('filtros salvos: privados por usuário e compartilhados por supervisores', async () => {
  await at1.post('/saved-filters', { scope: 'tickets', name: 'Meus urgentes', params: { view: 'mine', priority: 'urgente' } });
  await sup.post('/saved-filters', { scope: 'tickets', name: 'Equipe', params: { view: 'open' }, shared: true });
  const at2List = (await at2.get('/saved-filters?scope=tickets')).data.filters;
  assert.equal(at2List.length, 1); assert.equal(at2List[0].name, 'Equipe');
  const at1List = (await at1.get('/saved-filters?scope=tickets')).data.filters; assert.equal(at1List.length, 2);
  assert.equal((await at1.post('/saved-filters', { scope: 'tickets', name: 'Tento compartilhar', params: {}, shared: true })).data.filter.shared, false);
  assert.equal((await at2.del(`/saved-filters/${at1List.find((f) => !f.shared).id}`)).status, 403);
});

test('funis múltiplos: criar funil, etapas próprias, oportunidade no funil certo e mover entre funis é bloqueado', async () => {
  const p = await admin.post('/settings/pipelines', { name: 'Pós-venda' });
  assert.equal(p.status, 201);
  const pipes = (await at1.get('/settings/pipelines')).data.pipelines;
  assert.equal(pipes.length, 2);
  const pv = pipes.find((x) => x.name === 'Pós-venda');
  assert.equal(pv.stages.filter((s) => s.kind === 'won').length, 1);
  const o = await at1.post('/opportunities', { title: 'Renovação', customer_id: customerId, value: 500, pipeline_id: pv.id });
  assert.equal(o.status, 201); assert.equal(o.data.opportunity.stage_id, pv.stages[0].id);
  const defaultStage = pipes.find((x) => x.is_default).stages.find((s) => s.kind === 'open');
  assert.equal((await at1.post(`/opportunities/${o.data.opportunity.id}/move`, { stage_id: defaultStage.id })).status, 400);
  const list = (await at1.get(`/opportunities?pipeline_id=${pv.id}`)).data;
  assert.equal(list.opportunities.length, 1); assert.equal(list.stages.length, pv.stages.length);
  assert.equal((await at1.get('/opportunities')).data.opportunities.length, 0, 'funil padrão não mostra a oportunidade do outro funil');
  assert.equal((await at1.get('/opportunities?no_task=true&pipeline_id=' + pv.id)).data.opportunities.length, 1);
  // Edição direta de campos
  const cur = o.data.opportunity;
  const upd = await at1.put(`/opportunities/${cur.id}`, { value: 900, tags: ['vip'], version: cur.version });
  assert.equal(upd.status, 200); assert.equal(Number(upd.data.opportunity.value), 900); assert.deepEqual(upd.data.opportunity.tags, ['vip']);
  assert.equal((await admin.put(`/settings/pipelines/${pv.id}`, { is_default: true })).status, 200);
  assert.equal((await admin.put(`/settings/pipelines/${pipes.find((x) => x.is_default).id}`, { active: false })).status, 200);
});

test('automações: tarefa ao mudar de etapa (sem duplicar), acompanhamento encerrado quando o cliente responde, regra pausada não executa', async () => {
  const stages = (await admin.get('/settings/stages')).data.stages.filter((s) => s.active);
  const pv = (await admin.get('/settings/pipelines')).data.pipelines.find((x) => x.name === 'Pós-venda');
  const target = pv.stages.find((s) => s.kind === 'open' && s.position === 2);
  const rule = await sup.post('/automations', { name: 'Tarefa após contato', trigger: 'opportunity_stage_changed', conditions: { stage_id: target.id }, action: 'create_task', action_params: { title: 'Acompanhar {cliente}', due_in_days: 2, assignee: 'owner' } });
  assert.equal(rule.status, 201);
  assert.equal((await at1.post('/automations', { name: 'x', trigger: 'ticket_created', action: 'distribute' })).status, 403);
  assert.equal((await sup.post('/automations', { name: 'msg', trigger: 'ticket_created', action: 'send_message', action_params: { body: 'oi' } })).status, 400, 'mensagem automática exige canal conectado');
  const opp = (await at1.post('/opportunities', { title: 'Renovação B', customer_id: customerId, value: 100, pipeline_id: pv.id })).data.opportunity;
  await at1.post(`/opportunities/${opp.id}/move`, { stage_id: target.id });
  await wait(300);
  let tasks = (await at1.get(`/tasks?view=open`)).data.tasks.filter((t) => t.opportunity_id === opp.id);
  assert.equal(tasks.length, 1); assert.equal(tasks[0].title, 'Acompanhar Cliente Central'); assert.equal(tasks[0].automation_rule_id, rule.data.rule.id);
  // Voltar e avançar de novo não duplica a tarefa aberta
  await at1.post(`/opportunities/${opp.id}/move`, { stage_id: pv.stages[0].id });
  await at1.post(`/opportunities/${opp.id}/move`, { stage_id: target.id });
  await wait(300);
  tasks = (await at1.get(`/tasks?view=open`)).data.tasks.filter((t) => t.opportunity_id === opp.id);
  assert.equal(tasks.length, 1);
  const runs = (await sup.get(`/automations/runs?rule_id=${rule.data.rule.id}`)).data.runs;
  assert.ok(runs.some((r) => r.status === 'executada')); assert.ok(runs.some((r) => r.status === 'ignorada'));
  // Negociação encerrada → acompanhamento encerrado automaticamente
  const won = pv.stages.find((s) => s.kind === 'won');
  await at1.post(`/opportunities/${opp.id}/move`, { stage_id: won.id });
  const done = (await at1.get('/tasks?view=done')).data.tasks.filter((t) => t.opportunity_id === opp.id);
  assert.equal(done.length, 1); assert.equal(done[0].closed_reason, 'Negociação encerrada');
  // Regra pausada
  await sup.put(`/automations/${rule.data.rule.id}`, { active: false });
  const opp2 = (await at1.post('/opportunities', { title: 'Renovação C', customer_id: customerId, pipeline_id: pv.id })).data.opportunity;
  await at1.post(`/opportunities/${opp2.id}/move`, { stage_id: target.id });
  await wait(300);
  assert.equal((await at1.get('/tasks?view=open')).data.tasks.filter((t) => t.opportunity_id === opp2.id).length, 0);
  // Prazo de resposta vencido (agendado) → notifica supervisores, uma única vez por estado
  const ov = await sup.post('/automations', { name: 'Prazo vencido', trigger: 'ticket_response_overdue', conditions: { minutes: 1 }, action: 'notify', action_params: { to: 'supervisors', title: 'Vencido: {protocolo}' } });
  const tk = (await at1.post('/tickets', { customer_id: customerId, subject: 'Sem resposta', channel: 'Chat', first_message: 'oi?' })).data.ticket;
  await pool.query(`UPDATE tickets SET last_customer_message_at = now() - interval '5 minutes', opened_at = now() - interval '5 minutes' WHERE id = $1`, [tk.id]);
  await automations.runScheduled(); await automations.runScheduled();
  const notifs = (await sup.get('/notifications')).data.notifications.filter((n) => n.title === `Vencido: ${tk.protocol}`);
  assert.equal(notifs.length, 1, 'notificação enviada uma única vez');
  assert.equal((await sup.get(`/automations/runs?rule_id=${ov.data.rule.id}`)).data.runs.length, 1);
  // Cliente responde → acompanhamentos do atendimento são encerrados
  await at1.post(`/tickets/${tk.id}/claim`);
  const fu = await at1.post('/automations/run-scheduled'); assert.equal(fu.status, 403);
  await pool.query(`INSERT INTO tasks (title, ticket_id, assignee_id, kind, due_at) VALUES ('Acomp.', $1, 3, 'acompanhamento', now())`, [tk.id]);
  await at1.post(`/tickets/${tk.id}/interactions`, { direction: 'entrada', channel: 'Chat', body: 'respondi' });
  await wait(300);
  const closedFu = (await at1.get('/tasks?view=done')).data.tasks.filter((t) => t.ticket_id === tk.id);
  assert.equal(closedFu.length, 1); assert.equal(closedFu[0].closed_reason, 'Cliente respondeu');
  // Distribuição por regra (equipe) ao abrir atendimento
  await admin.put('/users/3', { team: 'Suporte' });
  await sup.post('/automations', { name: 'Distribuir suporte', trigger: 'ticket_created', conditions: { channel: 'Chat' }, action: 'distribute', team: 'Suporte' });
  const t2 = (await sup.post('/tickets', { customer_id: customerId, subject: 'Auto', channel: 'Chat' })).data.ticket;
  await wait(300);
  assert.equal((await sup.get(`/tickets/${t2.id}`)).data.ticket.assignee_id, 3);
  void stages;
});

test('painel: indicadores por perfil e ajuda de cálculo', async () => {
  const d = (await sup.get('/reports/dashboard')).data;
  assert.equal(d.role, 'supervisor'); assert.ok(Array.isArray(d.team)); assert.ok(d.help.sla);
  assert.ok(d.tickets.queue >= 0); assert.ok(d.opportunities.no_next_action >= 0);
  const a = (await at1.get('/reports/dashboard')).data;
  assert.equal(a.role, 'atendente'); assert.equal(a.team.length, 0); assert.ok(Array.isArray(a.my_tasks));
});

test('acesso simultâneo: dois atendentes respondem em conversas diferentes e a lista reflete os dois', async () => {
  const [ta, tb] = await Promise.all([
    at1.post('/tickets', { customer_id: customerId, subject: 'Paralelo A', channel: 'Chat', assignee_id: 3 }),
    at2.post('/tickets', { customer_id: customerId, subject: 'Paralelo B', channel: 'Chat', assignee_id: 4 }),
  ]);
  await Promise.all([at1.post(`/tickets/${ta.data.ticket.id}/claim`), at2.post(`/tickets/${tb.data.ticket.id}/claim`)]);
  const rs = await Promise.all([
    at1.post(`/tickets/${ta.data.ticket.id}/interactions`, { direction: 'saida', channel: 'Chat', body: 'A responde' }),
    at2.post(`/tickets/${tb.data.ticket.id}/interactions`, { direction: 'saida', channel: 'Chat', body: 'B responde' }),
  ]);
  assert.ok(rs.every((r) => r.status === 201));
  const view = (await sup.get('/tickets?view=mine')).data; assert.equal(view.tickets.length, 0);
  const all = (await sup.get('/tickets?view=open')).data.tickets;
  assert.ok(all.find((t) => t.id === ta.data.ticket.id).last_message_preview === 'A responde');
  assert.ok(all.find((t) => t.id === tb.data.ticket.id).last_message_preview === 'B responde');
});
