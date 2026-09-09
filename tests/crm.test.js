'use strict';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { pool, resetDb, startServer, client, createUser } = require('./helpers');

let server, base, admin, sup, at1, at2;

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
});
after(async () => { server.close(); await pool.end(); });

test('autenticação: rejeita senha errada, exige cabeçalho de proteção e sessão', async () => {
  const anon = client(base);
  const bad = await anon.post('/auth/login', { email: 'admin@t.com', password: 'errada' });
  assert.equal(bad.status, 401);
  const noHeader = await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(noHeader.status, 403);
  const me = await anon.get('/auth/me'); assert.equal(me.status, 401);
  const val = await anon.post('/auth/login', { email: 'nao-e-email', password: '' });
  assert.equal(val.status, 400); assert.ok(val.data.fields.email);
});

let customerId, ticketId, oppId;

test('fluxo completo: cliente → atendimento → assumir → interação → oportunidade → retorno → transferir → encerrar', async () => {
  // Cadastrar cliente
  let r = await at1.post('/customers', { name: 'Maria Silva', phone: '(11) 98888-7777', email: 'maria@ex.com', company: 'Padaria Central', city: 'São Paulo', source: 'WhatsApp', tags: ['vip'] });
  assert.equal(r.status, 201, JSON.stringify(r.data)); customerId = r.data.customer.id;
  assert.equal(r.data.customer.phone_digits, '5511988887777');
  // Duplicidade por telefone
  r = await at1.post('/customers', { name: 'Maria S.', phone: '11988887777' });
  assert.equal(r.status, 409); assert.equal(r.data.duplicates[0].id, customerId);
  // Campos obrigatórios
  r = await at1.post('/customers', { phone: '123' }); assert.equal(r.status, 400); assert.equal(r.data.fields.name, 'Campo obrigatório.');
  // CPF inválido
  r = await at1.post('/customers', { name: 'Teste CPF', document: '111.111.111-11' }); assert.equal(r.status, 400);

  // Abrir atendimento na fila (sem responsável)
  r = await at1.post('/tickets', { customer_id: customerId, subject: 'Dúvida sobre pedido', channel: 'WhatsApp', priority: 'alta' });
  assert.equal(r.status, 201); ticketId = r.data.ticket.id;
  assert.match(r.data.ticket.protocol, /^\d{8}-\d{6}$/); assert.equal(r.data.ticket.status, 'aguardando'); assert.equal(r.data.ticket.assignee_id, null);

  // Atendente não pode registrar interação sem assumir
  r = await at1.post(`/tickets/${ticketId}/interactions`, { direction: 'saida', channel: 'WhatsApp', body: 'Olá' }); assert.equal(r.status, 403);

  // Assumir (atribuir responsável)
  r = await at1.post(`/tickets/${ticketId}/claim`); assert.equal(r.status, 200); assert.equal(r.data.ticket.status, 'em_atendimento');

  // Registrar interação de saída => primeira resposta
  r = await at1.post(`/tickets/${ticketId}/interactions`, { direction: 'saida', channel: 'WhatsApp', body: 'Olá Maria, vou verificar seu pedido.' });
  assert.equal(r.status, 201); assert.ok(r.data.ticket.first_response_at);
  r = await at1.post(`/tickets/${ticketId}/notes`, { body: 'Cliente parece insatisfeita com o prazo.' }); assert.equal(r.status, 201);

  // Criar oportunidade vinculada
  r = await at1.post('/opportunities', { title: 'Encomenda mensal', customer_id: customerId, value: 1500.5, ticket_id: ticketId, next_action: 'Enviar proposta', expected_close_date: '2030-01-15' });
  assert.equal(r.status, 201, JSON.stringify(r.data)); oppId = r.data.opportunity.id;

  // Agendar retorno -> cria tarefa
  const at = new Date(Date.now() + 86400000).toISOString();
  r = await at1.post(`/tickets/${ticketId}/follow-up`, { at, note: 'Ligar amanhã' });
  assert.equal(r.status, 200); assert.ok(r.data.task); assert.equal(r.data.task.assignee_id, 3);
  const tasks = await at1.get('/tasks?view=upcoming'); assert.equal(tasks.data.tasks.length, 1);
  const custPending = await at1.get('/customers?pending_followup=true'); assert.equal(custPending.data.customers.length, 1);

  // Transferir para atendente 2 (com versão para controle de concorrência)
  const cur = (await at1.get(`/tickets/${ticketId}`)).data.ticket;
  r = await at1.post(`/tickets/${ticketId}/transfer`, { to_user_id: 4, reason: 'Especialista', version: cur.version });
  assert.equal(r.status, 200); assert.equal(r.data.ticket.assignee_id, 4);
  // Versão antiga agora conflita
  r = await sup.post(`/tickets/${ticketId}/transfer`, { to_user_id: 3, version: cur.version }); assert.equal(r.status, 409);
  // Atendente 1 perdeu o acesso (não é mais responsável e não está na fila)
  r = await at1.get(`/tickets/${ticketId}`); assert.equal(r.status, 404);
  // Atendente 2 recebeu notificação
  const notif = await at2.get('/notifications'); assert.ok(notif.data.notifications.some((n) => n.title.includes('transferido')));

  // Encerrar (resolvido)
  r = await at2.post(`/tickets/${ticketId}/status`, { status: 'resolvido', note: 'Pedido localizado.' });
  assert.equal(r.status, 200); assert.ok(r.data.ticket.closed_at);
  // Oportunidade continua aberta (status separado da etapa comercial)
  const opp = (await at1.get(`/opportunities/${oppId}`)).data.opportunity; assert.equal(opp.stage_kind, 'open'); assert.equal(opp.closed_at, null);

  // Reabrir e cancelar
  r = await at2.post(`/tickets/${ticketId}/reopen`, { note: 'Cliente retornou' }); assert.equal(r.status, 200); assert.equal(r.data.ticket.status, 'em_atendimento');
  r = await at2.post(`/tickets/${ticketId}/status`, { status: 'resolvido' }); assert.equal(r.status, 200);

  // Linha do tempo registra quem fez cada mudança
  const detail = (await sup.get(`/tickets/${ticketId}`)).data;
  const sys = detail.events.filter((e) => e.kind === 'system');
  assert.ok(sys.some((e) => e.payload.action === 'transfer' && e.user_id === 3 && e.payload.to === 4));
  assert.ok(sys.some((e) => e.payload.action === 'status' && e.user_id === 4 && e.payload.to === 'resolvido'));
  assert.ok(sys.some((e) => e.payload.action === 'reopened'));
});

test('funil: mover etapas, exigir motivo de perda e calcular conversão', async () => {
  const stages = (await at1.get('/settings/stages')).data.stages;
  const lost = stages.find((s) => s.kind === 'lost'), won = stages.find((s) => s.kind === 'won'), neg = stages.find((s) => s.name === 'Negociação');
  let r = await at1.post(`/opportunities/${oppId}/move`, { stage_id: neg.id }); assert.equal(r.status, 200);
  r = await at1.post(`/opportunities/${oppId}/move`, { stage_id: lost.id }); assert.equal(r.status, 400); assert.ok(r.data.requires_lost_reason);
  r = await at1.post(`/opportunities/${oppId}/move`, { stage_id: lost.id, lost_reason: 'Preço' }); assert.equal(r.status, 200); assert.ok(r.data.opportunity.closed_at);
  const o2 = await at1.post('/opportunities', { title: 'Outra', customer_id: customerId, value: 300 });
  r = await at1.post(`/opportunities/${o2.data.opportunity.id}/move`, { stage_id: won.id }); assert.equal(r.status, 200);
  const rep = (await sup.get('/reports/summary')).data;
  assert.equal(rep.opportunities.won, 1); assert.equal(rep.opportunities.lost, 1); assert.equal(rep.opportunities.conversion, 0.5);
  assert.equal(rep.opportunities.lost_reasons[0].reason, 'Preço');
  assert.ok(rep.tickets.avg_first_response_s >= 0); assert.ok(rep.tickets.avg_resolution_s >= 0); assert.equal(rep.tickets.resolved, 1);
  assert.ok(rep.methodology.conversion);
  const today = new Date().toISOString().slice(0, 10);
  const filtered = await sup.get(`/reports/summary?from=${today}&to=${today}&assignee_id=3&source=WhatsApp&channel=WhatsApp`);
  assert.equal(filtered.status, 200, JSON.stringify(filtered.data)); assert.equal(filtered.data.opportunities.won, 1);
  const onlyFrom = await sup.get(`/reports/summary?from=${today}`); assert.equal(onlyFrom.status, 200);
  const csv = await sup.raw(`/reports/export.csv?from=${today}&to=${today}`); assert.equal(csv.status, 200);
  const future = (await sup.get('/reports/summary?from=2040-01-01&to=2040-01-02')).data; assert.equal(future.tickets.opened, 0);
});

test('disputa: duas pessoas tentam assumir o mesmo atendimento ao mesmo tempo', async () => {
  const t = await sup.post('/tickets', { customer_id: customerId, subject: 'Disputa', channel: 'Telefone' });
  const id = t.data.ticket.id;
  const results = await Promise.all([at1.post(`/tickets/${id}/claim`), at2.post(`/tickets/${id}/claim`)]);
  const ok = results.filter((r) => r.status === 200), conflict = results.filter((r) => r.status === 409);
  assert.equal(ok.length, 1); assert.equal(conflict.length, 1);
  assert.match(conflict[0].data.error, /já foi assumido por/);
  const final = (await sup.get(`/tickets/${id}`)).data.ticket; assert.equal(final.assignee_id, ok[0].data.ticket.assignee_id);
  // Repetição em série também é bloqueada
  const again = await (final.assignee_id === 3 ? at2 : at1).post(`/tickets/${id}/claim`); assert.equal(again.status, 409);
});

test('distribuição automática em rodízio e fila quando ninguém está disponível', async () => {
  await admin.put('/settings', { auto_distribution: true });
  const a = await sup.post('/tickets', { customer_id: customerId, subject: 'Auto 1', channel: 'E-mail' });
  const b = await sup.post('/tickets', { customer_id: customerId, subject: 'Auto 2', channel: 'E-mail' });
  assert.ok(a.data.ticket.assignee_id && b.data.ticket.assignee_id);
  assert.notEqual(a.data.ticket.assignee_id, b.data.ticket.assignee_id, 'rodízio deve alternar entre atendentes');
  // Ninguém disponível -> fica na fila
  await at1.put('/auth/me/availability', { available: false }); await at2.put('/auth/me/availability', { available: false });
  const c = await sup.post('/tickets', { customer_id: customerId, subject: 'Auto 3', channel: 'E-mail' });
  assert.equal(c.data.ticket.assignee_id, null); assert.equal(c.data.ticket.status, 'aguardando');
  const dist = await sup.post('/tickets/distribute'); assert.equal(dist.data.assigned, 0); assert.match(dist.data.message, /Nenhum atendente disponível/);
  await at1.put('/auth/me/availability', { available: true });
  const dist2 = await sup.post('/tickets/distribute'); assert.equal(dist2.data.assigned, 1);
  await admin.put('/settings', { auto_distribution: false });
  await at2.put('/auth/me/availability', { available: true });
});

test('permissões: atendente não gerencia usuários/configurações nem vê atendimentos de outros', async () => {
  assert.equal((await at1.post('/users', { name: 'X', email: 'x@t.com', role: 'admin', password: 'Senha12345' })).status, 403);
  assert.equal((await sup.post('/users', { name: 'X', email: 'x@t.com', role: 'admin', password: 'Senha12345' })).status, 403);
  assert.equal((await at1.put('/settings', { name: 'Hack' })).status, 403);
  assert.equal((await at1.get('/settings/audit')).status, 403);
  assert.equal((await at1.post('/tickets/distribute')).status, 403);
  assert.equal((await at1.post('/customers/import', { csv: 'nome\nA' })).status, 403);
  // Atendente não pode atribuir atendimento a outro
  assert.equal((await at1.post('/tickets', { customer_id: customerId, subject: 'Para outro', channel: 'Chat', assignee_id: 4 })).status, 403);
  // Atendimento do at2 é invisível ao at1; supervisor vê tudo
  const t = await at2.post('/tickets', { customer_id: customerId, subject: 'Do dois', channel: 'Chat', assignee_id: 4 });
  assert.equal((await at1.get(`/tickets/${t.data.ticket.id}`)).status, 404);
  assert.equal((await sup.get(`/tickets/${t.data.ticket.id}`)).status, 200);
  // Cliente de outro atendente sem vínculo fica fora do escopo
  const c = await at2.post('/customers', { name: 'Só do Dois', owner_id: 4 });
  assert.equal((await at1.get(`/customers/${c.data.customer.id}`)).status, 404);
  assert.equal((await sup.get(`/customers/${c.data.customer.id}`)).status, 200);
  // Relatório do atendente é restrito a ele mesmo
  const rep = (await at1.get('/reports/summary')).data; assert.ok(rep.by_assignee.every((x) => x.assignee_id === 3 || x.name === 'Sem responsável'));
  // Lista de usuários para atendente não expõe e-mails
  const users = (await at1.get('/users')).data.users; assert.ok(users.every((u) => u.email === undefined));
});

test('usuários: desativar exige transferência de pendências e preserva histórico', async () => {
  const u = await admin.post('/users', { name: 'Temporário', email: 'temp@t.com', role: 'atendente', password: 'Senha12345' });
  assert.equal(u.status, 201); const uid = u.data.user.id;
  const tmp = client(base); await tmp.login('temp@t.com', 'Senha12345');
  const t = await tmp.post('/tickets', { customer_id: customerId, subject: 'Pendente do temp', channel: 'Chat', assignee_id: uid });
  await tmp.post(`/tickets/${t.data.ticket.id}/claim`);
  let r = await admin.post(`/users/${uid}/deactivate`, {}); assert.equal(r.status, 409); assert.equal(r.data.pending.tickets, 1);
  r = await admin.post(`/users/${uid}/deactivate`, { transfer_to: 3 }); assert.equal(r.status, 200); assert.equal(r.data.transferred.tickets, 1);
  assert.equal((await tmp.get('/auth/me')).status, 401, 'sessão do usuário desativado deve cair');
  const tk = (await sup.get(`/tickets/${t.data.ticket.id}`)).data; assert.equal(tk.ticket.assignee_id, 3);
  assert.ok(tk.events.some((e) => e.payload.action === 'claimed' && e.user_id === uid), 'histórico do usuário desativado preservado');
  assert.equal((await client(base).post('/auth/login', { email: 'temp@t.com', password: 'Senha12345' })).status, 401);
  // Duplicidade de e-mail e auto-remoção de admin
  assert.equal((await admin.post('/users', { name: 'Dup', email: 'ADMIN@t.com', role: 'atendente', password: 'Senha12345' })).status, 400);
  assert.equal((await admin.put('/users/1', { role: 'atendente' })).status, 400);
  assert.equal((await admin.post('/users/1/deactivate', {})).status, 400);
});

test('recuperação de senha por link gerado pelo administrador', async () => {
  const r = await admin.post('/users/4/reset-link'); assert.equal(r.status, 200);
  const token = r.data.link.split('/redefinir-senha/')[1];
  const anon = client(base);
  assert.equal((await anon.post('/auth/reset-password', { token, password: 'curta' })).status, 400);
  assert.equal((await anon.post('/auth/reset-password', { token, password: 'NovaSenha123' })).status, 200);
  assert.equal((await anon.post('/auth/reset-password', { token, password: 'NovaSenha123' })).status, 400, 'token não reutilizável');
  await anon.login('a2@t.com', 'NovaSenha123');
  const forgot = await anon.post('/auth/forgot-password', { email: 'inexistente@t.com' }); assert.equal(forgot.status, 200);
  await at2.login('a2@t.com', 'NovaSenha123');
});

test('clientes: importação CSV com prévia, erros e exportação por escopo; edição com controle de versão', async () => {
  const csv = 'nome;telefone;email;origem;etiquetas;responsavel\nJoão Souza;(21) 97777-6666;joao@ex.com;Site;lead|quente;Atendente Um\n;123;x;Site;;\nMaria Dup;11988887777;;Site;;\nAna Lima;;ana@ex.com;Indicação;;Fulano';
  let r = await sup.post('/customers/import', { csv }); assert.equal(r.status, 200); assert.equal(r.data.preview, true);
  assert.equal(r.data.valid, 2); assert.equal(r.data.invalid, 2); assert.equal(r.data.duplicates, 1);
  r = await sup.post('/customers/import', { csv, commit: true, skip_duplicates: true });
  assert.equal(r.data.imported, 1); assert.equal(r.data.skipped, 1); assert.equal(r.data.errors.length, 2);
  const joao = (await sup.get('/customers?q=Souza')).data.customers[0]; assert.equal(joao.owner_id, 3); assert.deepEqual(joao.tags, ['lead', 'quente']);
  // Exportação: atendente 2 só vê o próprio escopo
  const csvOut = await at2.raw('/customers/export.csv');
  assert.equal(csvOut.status, 200); assert.match(csvOut.headers.get('content-type'), /text\/csv/);
  // Edição com versão desatualizada
  const c = (await sup.get(`/customers/${customerId}`)).data.customer;
  assert.equal((await sup.put(`/customers/${customerId}`, { city: 'Campinas', version: c.version })).status, 200);
  const stale = await sup.put(`/customers/${customerId}`, { city: 'Santos', version: c.version }); assert.equal(stale.status, 409);
  // Anotação interna e exclusão bloqueada com histórico
  assert.equal((await at1.post(`/customers/${customerId}/notes`, { body: 'Nota' })).status, 201);
  assert.equal((await admin.del(`/customers/${customerId}`)).status, 409);
});


test('tarefas: visões hoje/atrasadas/futuras e conclusão', async () => {
  const past = new Date(Date.now() - 3600e3).toISOString(), today = new Date(Date.now() + 60e3).toISOString();
  await at1.post('/tasks', { title: 'Atrasada', due_at: past }); await at1.post('/tasks', { title: 'Hoje', due_at: today });
  const s = (await at1.get('/tasks?view=all')).data.summary; assert.ok(s.overdue >= 1); assert.ok(s.today >= 1);
  const over = (await at1.get('/tasks?view=overdue')).data.tasks; const id = over[0].id;
  assert.equal((await at1.put(`/tasks/${id}`, { done: true })).status, 200);
  assert.ok((await at1.get('/tasks?view=overdue')).data.tasks.every((t) => t.id !== id));
  assert.equal((await at1.put(`/tasks/${id}`, { assignee_id: 4 })).status, 403);
});

test('configurações: identidade visual, etapas do funil e auditoria', async () => {
  let r = await admin.put('/settings', { name: 'Empresa Teste', primary_color: '#123456', logo_data: 'data:image/png;base64,iVBORw0KGgo=' });
  assert.equal(r.status, 200); assert.equal(r.data.settings.name, 'Empresa Teste');
  assert.equal((await admin.put('/settings', { primary_color: 'azul' })).status, 400);
  assert.equal((await admin.put('/settings', { logo_data: 'data:text/html;base64,PGI+' })).status, 400);
  const pub = (await client(base).get('/settings/public')).data.settings; assert.equal(pub.name, 'Empresa Teste');
  const stages = (await admin.get('/settings/stages')).data.stages;
  r = await admin.put('/settings/stages', { stages: [...stages.map((s) => ({ id: s.id, name: s.name, kind: s.kind })).slice(0, 4), { name: 'Contrato', kind: 'open' }, ...stages.slice(4).map((s) => ({ id: s.id, name: s.name, kind: s.kind }))] });
  assert.equal(r.status, 200); assert.equal(r.data.stages.length, 7); assert.equal(r.data.stages[4].name, 'Contrato');
  assert.equal((await admin.put('/settings/stages', { stages: stages.filter((s) => s.kind !== 'won').map((s) => ({ id: s.id, name: s.name, kind: s.kind })) })).status, 400);
  const audit = (await admin.get('/settings/audit')).data.entries;
  for (const a of ['ticket_claim', 'ticket_transfer', 'ticket_status', 'user_deactivate', 'settings_update', 'customers_import', 'login']) assert.ok(audit.some((e) => e.action === a), `auditoria deve conter ${a}`);
});

test('whatsapp: desconectado sem credenciais, sem simulação', async () => {
  const st = (await at1.get('/whatsapp/status')).data; assert.equal(st.connected, false);
  assert.equal((await at1.post('/whatsapp/send', { customer_id: customerId, body: 'oi' })).status, 503);
  assert.equal((await fetch(base + '/api/whatsapp/webhook?hub.mode=subscribe')).status, 404);
});
