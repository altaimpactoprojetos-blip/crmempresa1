'use strict';
const express = require('express');
const { z } = require('zod');
const { query, tx } = require('../db');
const { validate } = require('../middleware/validate');
const { requireAuth, isManager } = require('../middleware/auth');
const { badRequest, notFound, conflict, forbidden } = require('../lib/errors');
const { audit } = require('../lib/audit');
const { normalizePhone, normalizeEmail, validDocument, toCsv, parseCsv, onlyDigits } = require('../lib/util');

const router = express.Router();
router.use(requireAuth);

// Escopo de visibilidade: atendente vê clientes sob sua responsabilidade, sem responsável,
// ou vinculados a atendimentos seus. Admin/supervisor veem todos.
function scopeSql(user, alias = 'c', params) {
  if (isManager(user)) return 'TRUE';
  params.push(user.id);
  const p = `$${params.length}`;
  return `(${alias}.owner_id = ${p} OR ${alias}.owner_id IS NULL OR EXISTS (SELECT 1 FROM tickets t WHERE t.customer_id = ${alias}.id AND t.assignee_id = ${p}))`;
}

async function loadCustomer(req, id) {
  const params = [id];
  const scope = scopeSql(req.user, 'c', params);
  const { rows } = await query(
    `SELECT c.*, u.name AS owner_name FROM customers c LEFT JOIN users u ON u.id = c.owner_id
     WHERE c.id = $1 AND ${scope}`, params);
  if (!rows[0]) throw notFound('Cliente não encontrado ou fora do seu escopo.');
  return rows[0];
}

const customerSchema = z.object({
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(30).nullable().optional(),
  email: z.string().trim().email().max(200).nullable().optional().or(z.literal('')),
  company: z.string().trim().max(160).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  document: z.string().trim().max(20).nullable().optional(),
  source: z.string().trim().max(60).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  notes: z.string().max(5000).nullable().optional(),
  owner_id: z.number().int().positive().nullable().optional(),
  version: z.number().int().optional(),
});

function clean(d) {
  const out = { ...d };
  if (out.email === '') out.email = null;
  if (out.email) out.email = normalizeEmail(out.email);
  if (out.phone !== undefined) out.phone_digits = normalizePhone(out.phone);
  if (out.document) {
    if (!validDocument(out.document)) throw badRequest('CPF ou CNPJ inválido.', { fields: { document: 'CPF/CNPJ inválido.' } });
    out.document = onlyDigits(out.document);
  }
  return out;
}

async function findDuplicates(phoneDigits, email, excludeId) {
  if (!phoneDigits && !email) return [];
  const params = [phoneDigits || null, email || null, excludeId || 0];
  const { rows } = await query(
    `SELECT id, name, phone, email, company FROM customers
     WHERE id <> $3 AND (($1::text IS NOT NULL AND phone_digits = $1) OR ($2::text IS NOT NULL AND lower(email) = $2))
     LIMIT 5`, params);
  return rows;
}

// GET /api/customers?q=&source=&owner_id=&tag=&page=&limit=&pending_followup=
router.get('/', async (req, res, next) => {
  try {
    const params = [];
    const where = [scopeSql(req.user, 'c', params)];
    if (req.query.q) {
      params.push(`%${req.query.q.trim()}%`);
      const textIdx = params.length;
      const digits = onlyDigits(req.query.q);
      let digitsClause = '';
      if (digits) { params.push(`%${digits}%`); digitsClause = `OR c.phone_digits LIKE $${params.length} OR c.document LIKE $${params.length}`; }
      where.push(`(c.name ILIKE $${textIdx} OR c.email ILIKE $${textIdx} OR c.company ILIKE $${textIdx} ${digitsClause})`);
    }
    if (req.query.source) { params.push(req.query.source); where.push(`c.source = $${params.length}`); }
    if (req.query.owner_id) { params.push(Number(req.query.owner_id)); where.push(`c.owner_id = $${params.length}`); }
    if (req.query.city) { params.push(`%${req.query.city}%`); where.push(`c.city ILIKE $${params.length}`); }
    if (req.query.tag) { params.push(req.query.tag); where.push(`$${params.length} = ANY(c.tags)`); }
    if (req.query.pending_followup === 'true') {
      where.push(`EXISTS (SELECT 1 FROM tickets t WHERE t.customer_id = c.id AND t.follow_up_at IS NOT NULL AND t.status NOT IN ('resolvido','cancelado'))`);
    }
    const limit = Math.min(Number(req.query.limit) || 25, 200);
    const page = Math.max(Number(req.query.page) || 1, 1);
    if (req.query.no_open_ticket === 'true') where.push(`NOT EXISTS (SELECT 1 FROM tickets t WHERE t.customer_id = c.id AND t.status NOT IN ('resolvido','cancelado'))`);
    const SORTS = { name: 'lower(c.name)', updated_at: 'c.updated_at', created_at: 'c.created_at', company: 'lower(c.company)', city: 'lower(c.city)', source: 'c.source', owner_name: 'u.name', next_follow_up: 'next_follow_up', open_tickets: 'open_tickets' };
    const order = req.query.sort && SORTS[req.query.sort] ? `${SORTS[req.query.sort]} ${req.query.dir === 'desc' ? 'DESC NULLS LAST' : 'ASC NULLS LAST'}` : 'c.updated_at DESC';
    const sql = `FROM customers c LEFT JOIN users u ON u.id = c.owner_id WHERE ${where.join(' AND ')}`;
    const total = (await query(`SELECT count(*)::int AS n ${sql}`, params)).rows[0].n;
    params.push(limit, (page - 1) * limit);
    const { rows } = await query(
      `SELECT c.id, c.name, c.phone, c.email, c.company, c.city, c.source, c.tags, c.owner_id, u.name AS owner_name, c.created_at, c.updated_at,
        (SELECT count(*)::int FROM tickets t WHERE t.customer_id = c.id AND t.status NOT IN ('resolvido','cancelado')) AS open_tickets,
        (SELECT min(t.follow_up_at) FROM tickets t WHERE t.customer_id = c.id AND t.follow_up_at IS NOT NULL AND t.status NOT IN ('resolvido','cancelado')) AS next_follow_up,
        (SELECT max(e.created_at) FROM ticket_events e JOIN tickets t ON t.id = e.ticket_id WHERE t.customer_id = c.id AND e.kind = 'interaction') AS last_contact_at,
        (SELECT count(*)::int FROM opportunities o JOIN pipeline_stages s ON s.id = o.stage_id WHERE o.customer_id = c.id AND s.kind = 'open') AS open_opportunities
       ${sql} ORDER BY ${order} LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
    res.json({ customers: rows, total, page, limit });
  } catch (err) { next(err); }
});

// Exportação CSV respeitando o escopo do usuário
router.get('/export.csv', async (req, res, next) => {
  try {
    const params = [];
    const scope = scopeSql(req.user, 'c', params);
    const { rows } = await query(
      `SELECT c.*, u.name AS owner_name FROM customers c LEFT JOIN users u ON u.id = c.owner_id WHERE ${scope} ORDER BY c.name`, params);
    await audit(req, 'customers_export', 'customer', null, { count: rows.length });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="clientes.csv"');
    res.send(toCsv(rows, [
      { key: 'id', label: 'id' }, { key: 'name', label: 'nome' }, { key: 'phone', label: 'telefone' }, { key: 'email', label: 'email' },
      { key: 'company', label: 'empresa' }, { key: 'city', label: 'cidade' }, { key: 'document', label: 'cpf_cnpj' }, { key: 'source', label: 'origem' },
      { key: 'tags', label: 'etiquetas' }, { key: 'owner_name', label: 'responsavel' }, { key: 'notes', label: 'observacoes' }, { key: 'created_at', label: 'criado_em' },
    ]));
  } catch (err) { next(err); }
});

// Verificação de duplicidade antes de salvar
router.get('/check-duplicates', async (req, res, next) => {
  try {
    const dups = await findDuplicates(normalizePhone(req.query.phone), normalizeEmail(req.query.email), Number(req.query.exclude_id) || 0);
    res.json({ duplicates: dups });
  } catch (err) { next(err); }
});

// Prévia de importação CSV: valida linhas e aponta erros, sem gravar.
const importSchema = z.object({ csv: z.string().min(1).max(5 * 1024 * 1024), commit: z.boolean().optional(), skip_duplicates: z.boolean().optional() });
const HEADER_MAP = {
  nome: 'name', name: 'name', telefone: 'phone', phone: 'phone', celular: 'phone', email: 'email', 'e-mail': 'email',
  empresa: 'company', company: 'company', cidade: 'city', city: 'city', cpf_cnpj: 'document', cpf: 'document', cnpj: 'document', documento: 'document',
  origem: 'source', source: 'source', etiquetas: 'tags', tags: 'tags', observacoes: 'notes', observações: 'notes', notes: 'notes', responsavel: 'owner', responsável: 'owner',
};

router.post('/import', validate(importSchema), async (req, res, next) => {
  try {
    if (!isManager(req.user)) return next(forbidden('Apenas administradores e supervisores podem importar clientes.'));
    const rows = parseCsv(req.data.csv);
    if (rows.length < 2) return next(badRequest('O arquivo precisa ter um cabeçalho e ao menos uma linha.'));
    const header = rows[0].map((h) => HEADER_MAP[h.trim().toLowerCase()] || null);
    if (!header.includes('name')) return next(badRequest('Coluna obrigatória ausente: "nome".'));
    const users = (await query('SELECT id, name, email FROM users WHERE active')).rows;
    const results = [];
    const seenPhones = new Set(), seenEmails = new Set();
    for (let i = 1; i < rows.length; i++) {
      const rec = {};
      rows[i].forEach((v, idx) => { if (header[idx]) rec[header[idx]] = v.trim(); });
      const errors = [];
      if (!rec.name || rec.name.length < 2) errors.push('Nome obrigatório.');
      const email = normalizeEmail(rec.email);
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('E-mail inválido.');
      const phoneDigits = normalizePhone(rec.phone);
      if (rec.phone && !phoneDigits) errors.push('Telefone inválido.');
      if (rec.document && !validDocument(rec.document)) errors.push('CPF/CNPJ inválido.');
      let ownerId = null;
      if (rec.owner) {
        const u = users.find((x) => x.name.toLowerCase() === rec.owner.toLowerCase() || x.email.toLowerCase() === rec.owner.toLowerCase());
        if (u) ownerId = u.id; else errors.push(`Responsável "${rec.owner}" não encontrado.`);
      }
      const warnings = [];
      if ((phoneDigits && seenPhones.has(phoneDigits)) || (email && seenEmails.has(email))) warnings.push('Duplicado dentro do próprio arquivo.');
      if (phoneDigits) seenPhones.add(phoneDigits);
      if (email) seenEmails.add(email);
      const dups = errors.length ? [] : await findDuplicates(phoneDigits, email, 0);
      if (dups.length) warnings.push(`Possível duplicidade com: ${dups.map((d) => `#${d.id} ${d.name}`).join(', ')}`);
      results.push({ line: i + 1, data: { ...rec, email, phone_digits: phoneDigits, owner_id: ownerId,
        tags: rec.tags ? rec.tags.split(/[|,]/).map((t) => t.trim()).filter(Boolean) : [] }, errors, warnings, duplicate: dups.length > 0 });
    }
    const valid = results.filter((r) => !r.errors.length);
    if (!req.data.commit) {
      return res.json({ preview: true, total: results.length, valid: valid.length, invalid: results.length - valid.length,
        duplicates: results.filter((r) => r.duplicate).length, rows: results.slice(0, 500) });
    }
    let imported = 0, skipped = 0;
    await tx(async (client) => {
      for (const r of valid) {
        if (req.data.skip_duplicates && r.duplicate) { skipped++; continue; }
        const d = r.data;
        await client.query(
          `INSERT INTO customers (name, phone, phone_digits, email, company, city, document, source, tags, notes, owner_id, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
          [d.name, d.phone || null, d.phone_digits, d.email, d.company || null, d.city || null, d.document ? onlyDigits(d.document) : null,
            d.source || null, d.tags, d.notes || null, d.owner_id, req.user.id]);
        imported++;
      }
    });
    await audit(req, 'customers_import', 'customer', null, { imported, skipped, invalid: results.length - valid.length });
    res.json({ preview: false, imported, skipped, invalid: results.length - valid.length,
      errors: results.filter((r) => r.errors.length).map((r) => ({ line: r.line, errors: r.errors })),
      message: `${imported} cliente(s) importado(s).` });
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const c = await loadCustomer(req, Number(req.params.id));
    const [tickets, opps, tasks, notes, wa] = await Promise.all([
      query(`SELECT t.id, t.protocol, t.subject, t.status, t.priority, t.channel, t.assignee_id, u.name AS assignee_name, t.opened_at, t.closed_at, t.follow_up_at, t.last_message_at, t.last_message_preview, t.unread_count
             FROM tickets t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.customer_id = $1 ORDER BY t.opened_at DESC`, [c.id]),
      query(`SELECT o.*, s.name AS stage_name, s.kind AS stage_kind, s.pipeline_id, p.name AS pipeline_name, u.name AS owner_name FROM opportunities o
             JOIN pipeline_stages s ON s.id = o.stage_id JOIN pipelines p ON p.id = s.pipeline_id LEFT JOIN users u ON u.id = o.owner_id WHERE o.customer_id = $1 ORDER BY (s.kind = 'open') DESC, o.created_at DESC`, [c.id]),
      query(`SELECT t.*, u.name AS assignee_name FROM tasks t LEFT JOIN users u ON u.id = t.assignee_id WHERE t.customer_id = $1 ORDER BY t.done_at NULLS FIRST, t.due_at`, [c.id]),
      query(`SELECT n.*, u.name AS user_name FROM customer_notes n LEFT JOIN users u ON u.id = n.user_id WHERE n.customer_id = $1 ORDER BY n.created_at DESC`, [c.id]),
      query(`SELECT id, direction, body, status, created_at FROM whatsapp_messages WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 50`, [c.id]),
    ]);
    const timeline = (await query(`SELECT e.id, e.ticket_id, e.kind, e.direction, e.channel, e.body, e.created_at, u.name AS user_name, t.protocol FROM ticket_events e JOIN tickets t ON t.id = e.ticket_id LEFT JOIN users u ON u.id = e.user_id
      WHERE t.customer_id = $1 AND e.kind IN ('interaction','note') ORDER BY e.created_at DESC LIMIT 40`, [c.id])).rows;
    const duplicates = await findDuplicates(c.phone_digits, c.email ? c.email.toLowerCase() : null, c.id);
    res.json({ customer: c, tickets: tickets.rows, opportunities: opps.rows, tasks: tasks.rows, notes: notes.rows, whatsapp_messages: wa.rows, timeline, duplicates });
  } catch (err) { next(err); }
});

router.post('/', validate(customerSchema), async (req, res, next) => {
  try {
    const d = clean(req.data);
    const dups = await findDuplicates(d.phone_digits, d.email, 0);
    if (dups.length && !req.query.force) {
      return next(conflict('Já existe um cliente com este telefone ou e-mail.', { duplicates: dups, can_force: true }));
    }
    const ownerId = d.owner_id === undefined ? (req.user.role === 'atendente' ? req.user.id : null) : d.owner_id;
    const { rows } = await query(
      `INSERT INTO customers (name, phone, phone_digits, email, company, city, document, source, tags, notes, owner_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [d.name, d.phone || null, d.phone_digits || null, d.email || null, d.company || null, d.city || null, d.document || null,
        d.source || null, d.tags || [], d.notes || null, ownerId, req.user.id]);
    await audit(req, 'customer_create', 'customer', rows[0].id, { name: d.name });
    res.status(201).json({ customer: rows[0], message: 'Cliente cadastrado com sucesso.', duplicates: dups });
  } catch (err) { next(err); }
});

router.put('/:id', validate(customerSchema.partial()), async (req, res, next) => {
  try {
    const cur = await loadCustomer(req, Number(req.params.id));
    if (req.user.role === 'atendente' && req.data.owner_id !== undefined && req.data.owner_id !== cur.owner_id && req.data.owner_id !== req.user.id && cur.owner_id !== req.user.id) {
      return next(forbidden('Atendentes só podem alterar o responsável de seus próprios clientes.'));
    }
    const d = clean(req.data);
    if (d.version !== undefined && d.version !== cur.version) {
      return next(conflict('Este cliente foi alterado por outro usuário. Recarregue a página para ver a versão atual.', { current: cur }));
    }
    const phoneDigits = d.phone !== undefined ? d.phone_digits : cur.phone_digits;
    const email = d.email !== undefined ? d.email : cur.email;
    const dups = await findDuplicates(phoneDigits, email ? email.toLowerCase() : null, cur.id);
    if (dups.length && !req.query.force && (d.phone !== undefined || d.email !== undefined)) {
      return next(conflict('Já existe outro cliente com este telefone ou e-mail.', { duplicates: dups, can_force: true }));
    }
    const { rows } = await query(
      `UPDATE customers SET name = COALESCE($1, name), phone = CASE WHEN $2::boolean THEN $3 ELSE phone END,
        phone_digits = CASE WHEN $2::boolean THEN $4 ELSE phone_digits END, email = CASE WHEN $5::boolean THEN $6 ELSE email END,
        company = CASE WHEN $7::boolean THEN $8 ELSE company END, city = CASE WHEN $9::boolean THEN $10 ELSE city END,
        document = CASE WHEN $11::boolean THEN $12 ELSE document END, source = CASE WHEN $13::boolean THEN $14 ELSE source END,
        tags = COALESCE($15, tags), notes = CASE WHEN $16::boolean THEN $17 ELSE notes END,
        owner_id = CASE WHEN $18::boolean THEN $19 ELSE owner_id END, version = version + 1, updated_at = now()
       WHERE id = $20 RETURNING *`,
      [d.name ?? null, d.phone !== undefined, d.phone || null, d.phone_digits || null, d.email !== undefined, d.email || null,
        d.company !== undefined, d.company || null, d.city !== undefined, d.city || null, d.document !== undefined, d.document || null,
        d.source !== undefined, d.source || null, d.tags ?? null, d.notes !== undefined, d.notes || null,
        d.owner_id !== undefined, d.owner_id ?? null, cur.id]);
    await audit(req, 'customer_update', 'customer', cur.id, { fields: Object.keys(req.data) });
    res.json({ customer: rows[0], message: 'Cliente atualizado.' });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return next(forbidden('Apenas administradores podem excluir clientes.'));
    const c = await loadCustomer(req, Number(req.params.id));
    const used = await query('SELECT (SELECT count(*) FROM tickets WHERE customer_id=$1)::int AS t, (SELECT count(*) FROM opportunities WHERE customer_id=$1)::int AS o', [c.id]);
    if (used.rows[0].t || used.rows[0].o) return next(conflict('Este cliente possui atendimentos ou oportunidades e não pode ser excluído. O histórico deve ser preservado.'));
    await query('DELETE FROM customers WHERE id = $1', [c.id]);
    await audit(req, 'customer_delete', 'customer', c.id, { name: c.name });
    res.json({ ok: true, message: 'Cliente excluído.' });
  } catch (err) { next(err); }
});

router.post('/:id/notes', validate(z.object({ body: z.string().trim().min(1).max(5000) })), async (req, res, next) => {
  try {
    const c = await loadCustomer(req, Number(req.params.id));
    const { rows } = await query(
      `INSERT INTO customer_notes (customer_id, user_id, body) VALUES ($1,$2,$3) RETURNING *, (SELECT name FROM users WHERE id = $2) AS user_name`,
      [c.id, req.user.id, req.data.body]);
    await query('UPDATE customers SET updated_at = now() WHERE id = $1', [c.id]);
    res.status(201).json({ note: rows[0], message: 'Anotação adicionada.' });
  } catch (err) { next(err); }
});

module.exports = { router, loadCustomer, scopeSql };
