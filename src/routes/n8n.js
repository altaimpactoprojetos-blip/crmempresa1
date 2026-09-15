'use strict';
// Canal de testes com o n8n. Sem credenciais, a integração aparece como "desconectada".
//  - n8n → CRM: POST /api/n8n/inbound/:evento com o cabeçalho X-API-Key.
//  - CRM → n8n: POST no webhook de N8N_WEBHOOK_URL (evento de teste ou eventos do CRM).
const express = require('express');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const { query } = require('../db');
const config = require('../config');
const { validate } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { badRequest, unauthorized, HttpError } = require('../lib/errors');
const { audit } = require('../lib/audit');
const { broadcast } = require('../lib/realtime');
const n8n = require('../lib/n8n');

const router = express.Router();
const cfg = config.n8n;

const EVENT_RE = /^[a-z0-9]([a-z0-9._-]{0,58}[a-z0-9])?$/;
const inboundUrl = `${config.appUrl}/api/n8n/inbound/:evento`;

router.get('/status', requireAuth, (_req, res) => {
  res.json({
    connected: cfg.configured,
    inbound: {
      configured: cfg.inboundConfigured,
      url: inboundUrl,
      auth_header: 'X-API-Key',
      example_url: `${config.appUrl}/api/n8n/inbound/fornecedores.lista`,
    },
    outbound: {
      configured: cfg.outboundConfigured,
      url: n8n.maskedWebhookUrl(),
      signed: Boolean(cfg.webhookSecret),
      signature_header: 'X-CRM-Signature',
      timeout_ms: cfg.timeoutMs,
    },
    message: cfg.configured
      ? 'Canal do n8n ativo. Cada troca fica registrada no log de integração.'
      : 'Canal desconectado. Defina N8N_API_KEY (para o n8n gravar no CRM) e/ou N8N_WEBHOOK_URL (para o CRM avisar o n8n) no .env do servidor.',
  });
});

// ===== n8n → CRM =====
// Recebe qualquer payload (objeto ou lista) e registra no log. A transformação em
// fornecedores/cotações é uma etapa posterior; aqui o objetivo é validar o canal.
const inboundLimiter = rateLimit({
  windowMs: 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Muitas requisições. Reduza a frequência no n8n.' },
});

function requireApiKey(req, _res, next) {
  if (!cfg.inboundConfigured) return next(new HttpError(503, 'Canal de entrada desativado: defina N8N_API_KEY no servidor.'));
  const header = req.get('X-API-Key') || '';
  const bearer = (req.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!n8n.safeEqual(header || bearer, cfg.apiKey)) return next(unauthorized('Chave de API inválida.'));
  next();
}

// Teste de conectividade a partir do n8n (nó HTTP Request com method GET).
router.get('/ping', inboundLimiter, requireApiKey, (_req, res) => {
  res.json({ ok: true, service: 'crm', time: new Date().toISOString() });
});

router.post('/inbound/:event', inboundLimiter, requireApiKey, async (req, res, next) => {
  try {
    const event = String(req.params.event || '').toLowerCase();
    if (!EVENT_RE.test(event)) {
      return next(badRequest('Nome do evento inválido. Use letras minúsculas, números, ponto, hífen ou sublinhado (até 60 caracteres).'));
    }
    const payload = req.body;
    if (payload === undefined || payload === null || typeof payload !== 'object') {
      return next(badRequest('Envie um corpo JSON: um objeto ou uma lista de objetos.'));
    }
    const entry = await n8n.record({ direction: 'entrada', event, status: 'ok', payload, ip: req.ip });
    broadcast('n8n_inbound', { id: entry.id, event, items: entry.items });
    res.status(202).json({
      ok: true,
      delivery_id: entry.id,
      event,
      items: entry.items,
      received_at: entry.created_at,
      message: 'Payload recebido e registrado. Consulte em Configurações › Integrações.',
    });
  } catch (err) { next(err); }
});

// ===== CRM → n8n =====
router.post('/test', requireRole('admin', 'supervisor'), validate(z.object({
  event: z.string().trim().max(60).optional(),
  data: z.record(z.any()).optional(),
})), async (req, res, next) => {
  try {
    if (!cfg.outboundConfigured) return next(new HttpError(503, 'Defina N8N_WEBHOOK_URL no servidor para o CRM enviar eventos ao n8n.'));
    const event = (req.data.event || 'teste.conexao').toLowerCase();
    if (!EVENT_RE.test(event)) return next(badRequest('Nome do evento inválido.'));
    const result = await n8n.emit(event, {
      origem: 'CRM',
      disparado_por: { id: req.user.id, nome: req.user.name },
      ...(req.data.data || {}),
    }, { userId: req.user.id, ip: req.ip });
    await audit(req, 'n8n_test', 'n8n_event', result.id, { event, status: result.status });
    if (result.status !== 'ok') {
      return next(new HttpError(502, result.error || 'O n8n não aceitou o evento.', { delivery: result }));
    }
    res.json({ message: 'Evento entregue ao n8n.', delivery: result });
  } catch (err) { next(err); }
});

// ===== Busca de fornecedores para cotação =====
// A operadora informa nicho, nome, cidade e/ou bairro; o CRM repassa ao fluxo do n8n
// e exibe a lista devolvida por ele. A resposta do n8n é normalizada em lib/n8n.js.
const BUSCA_TIMEOUT_MS = Number(process.env.N8N_SEARCH_TIMEOUT_MS || 60000);
const termo = z.string().trim().max(120).optional();

router.post('/fornecedores/buscar', requireAuth, validate(z.object({
  nicho: termo, nome: termo, cidade: termo, bairro: termo,
  limite: z.coerce.number().int().min(1).max(200).optional(),
})), async (req, res, next) => {
  try {
    if (!cfg.outboundConfigured) {
      return next(new HttpError(503, 'Busca indisponível: defina N8N_WEBHOOK_URL no servidor para o CRM consultar o n8n.'));
    }
    const filtros = {
      nicho: req.data.nicho || null, nome: req.data.nome || null,
      cidade: req.data.cidade || null, bairro: req.data.bairro || null,
    };
    if (!Object.values(filtros).some(Boolean)) {
      return next(badRequest('Informe ao menos um campo: nicho, nome, cidade ou bairro.'));
    }
    const entrega = await n8n.emit('fornecedores.buscar', {
      ...filtros,
      limite: req.data.limite || 50,
      solicitado_por: { id: req.user.id, nome: req.user.name },
    }, { userId: req.user.id, ip: req.ip, timeoutMs: BUSCA_TIMEOUT_MS });

    if (entrega.status !== 'ok') {
      return next(new HttpError(502, entrega.error || 'O n8n não respondeu à busca.', { delivery_id: entrega.id }));
    }
    const fornecedores = n8n.normalizeSuppliers(entrega.response);
    await audit(req, 'n8n_busca_fornecedores', 'n8n_event', entrega.id, { ...filtros, encontrados: fornecedores ? fornecedores.length : 0 });
    if (!fornecedores) {
      return res.json({
        fornecedores: [], total: 0, delivery_id: entrega.id, formato_reconhecido: false,
        message: 'O n8n respondeu, mas não foi possível identificar uma lista de fornecedores. Faça o fluxo terminar em um nó "Respond to Webhook" devolvendo uma lista de objetos. Veja o corpo recebido em Configurações › Integrações.',
      });
    }
    res.json({
      fornecedores, total: fornecedores.length, delivery_id: entrega.id, formato_reconhecido: true,
      message: fornecedores.length ? `${fornecedores.length} fornecedor(es) encontrado(s).` : 'Nenhum fornecedor encontrado para esses filtros.',
    });
  } catch (err) { next(err); }
});

// ===== Log das trocas =====
router.get('/events', requireRole('admin', 'supervisor'), validate(z.object({
  limit: z.coerce.number().int().min(1).max(200).optional(),
  direction: z.enum(['entrada', 'saida']).optional(),
  event: z.string().trim().max(60).optional(),
}), 'query'), async (req, res, next) => {
  try {
    const q = req.queryData;
    const { rows } = await query(
      `SELECT e.*, u.name AS user_name FROM n8n_events e
       LEFT JOIN users u ON u.id = e.user_id
       WHERE ($1::text IS NULL OR e.direction = $1)
         AND ($2::text IS NULL OR e.event = $2)
       ORDER BY e.id DESC LIMIT $3`,
      [q.direction || null, q.event || null, q.limit || 50]);
    res.json({ events: rows });
  } catch (err) { next(err); }
});

router.get('/events/:id', requireRole('admin', 'supervisor'), async (req, res, next) => {
  try {
    const { rows } = await query('SELECT * FROM n8n_events WHERE id = $1', [Number(req.params.id) || 0]);
    if (!rows[0]) return next(new HttpError(404, 'Registro não encontrado.'));
    res.json({ event: rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
