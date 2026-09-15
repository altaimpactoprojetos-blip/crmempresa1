'use strict';
// Canal de integração com o n8n.
//  - Saída (CRM → n8n): POST assinado no nó Webhook configurado em N8N_WEBHOOK_URL.
//  - Entrada (n8n → CRM): autenticação por chave (N8N_API_KEY), tratada em routes/n8n.js.
// Toda troca fica registrada na tabela n8n_events para depuração dos testes.
const crypto = require('crypto');
const { query } = require('../db');
const config = require('../config');

const MAX_PAYLOAD_CHARS = 200000; // evita encher o log com cargas enormes

// Assinatura HMAC-SHA256 do corpo enviado, no formato "sha256=<hex>".
function sign(raw) {
  if (!config.n8n.webhookSecret) return null;
  return 'sha256=' + crypto.createHmac('sha256', config.n8n.webhookSecret).update(raw).digest('hex');
}

// Comparação de segredos em tempo constante.
function safeEqual(a, b) {
  const ba = Buffer.from(String(a || ''));
  const bb = Buffer.from(String(b || ''));
  if (ba.length !== bb.length || ba.length === 0) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function countItems(payload) {
  if (Array.isArray(payload)) return payload.length;
  for (const key of ['items', 'data', 'fornecedores', 'suppliers', 'results']) {
    if (Array.isArray(payload?.[key])) return payload[key].length;
  }
  return null;
}

function trim(value) {
  const json = JSON.stringify(value === undefined ? null : value);
  if (json && json.length > MAX_PAYLOAD_CHARS) {
    return JSON.stringify({ _truncado: true, _tamanho: json.length, _amostra: json.slice(0, 2000) });
  }
  return json;
}

// Grava uma linha no log e devolve o registro criado.
async function record({ direction, event, status = 'pendente', payload = {}, userId = null, ip = null }) {
  const { rows } = await query(
    `INSERT INTO n8n_events (direction, event, status, items, payload, user_id, ip)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [direction, event, status, countItems(payload), trim(payload), userId, ip]);
  return rows[0];
}

async function finish(id, { status, httpStatus = null, response = null, error = null }) {
  const { rows } = await query(
    `UPDATE n8n_events SET status = $1, http_status = $2, response = $3, error = $4, finished_at = now()
     WHERE id = $5 RETURNING *`,
    [status, httpStatus, response == null ? null : trim(response), error, id]);
  return rows[0];
}

// Envia um evento ao n8n. Nunca lança: devolve o registro do log com o resultado.
async function emit(event, payload = {}, { userId = null, ip = null, timeoutMs = null } = {}) {
  if (!config.n8n.outboundConfigured) {
    return { skipped: true, reason: 'N8N_WEBHOOK_URL não configurada.' };
  }
  const entry = await record({ direction: 'saida', event, payload, userId, ip });
  const body = JSON.stringify({ event, sent_at: new Date().toISOString(), delivery_id: entry.id, data: payload });
  const signature = sign(body);
  try {
    const resp = await fetch(config.n8n.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CRM-Event': event,
        'X-CRM-Delivery': String(entry.id),
        ...(signature ? { 'X-CRM-Signature': signature } : {}),
      },
      body,
      signal: AbortSignal.timeout(timeoutMs || config.n8n.timeoutMs),
    });
    const text = await resp.text().catch(() => '');
    let parsed = null;
    try { parsed = text ? JSON.parse(text) : null; } catch (_) { parsed = { raw: text.slice(0, 2000) }; }
    return finish(entry.id, {
      status: resp.ok ? 'ok' : 'erro',
      httpStatus: resp.status,
      response: parsed,
      error: resp.ok ? null : `O n8n respondeu ${resp.status}.`,
    });
  } catch (err) {
    const msg = err.name === 'TimeoutError' || err.name === 'AbortError'
      ? `O n8n não respondeu em ${timeoutMs || config.n8n.timeoutMs} ms.`
      : `Falha ao contatar o n8n: ${err.message}`;
    return finish(entry.id, { status: 'erro', error: msg });
  }
}

// ===== Normalização da resposta do n8n =====
// O fluxo do n8n pode devolver a lista de várias formas (array na raiz, {data:[...]},
// [{json:{...}}] etc.) e com nomes de campo variados. Aqui tudo vira o mesmo formato.
const CAMPOS = {
  nome: ['nome', 'name', 'nome_fantasia', 'razao_social', 'empresa', 'title', 'titulo'],
  nicho: ['nicho', 'categoria', 'category', 'segmento', 'ramo', 'tipo', 'type'],
  telefone: ['telefone', 'phone', 'fone', 'celular', 'whatsapp', 'telephone', 'phone_number'],
  email: ['email', 'e_mail', 'e-mail', 'mail'],
  cidade: ['cidade', 'city', 'municipio'],
  bairro: ['bairro', 'neighborhood', 'distrito', 'district'],
  endereco: ['endereco', 'endereço', 'address', 'logradouro', 'rua'],
  site: ['site', 'website', 'url', 'link', 'pagina'],
  avaliacao: ['avaliacao', 'avaliação', 'rating', 'nota', 'stars'],
  documento: ['cnpj', 'documento', 'document', 'cpf'],
};

function pick(obj, chaves) {
  const mapa = new Map(Object.keys(obj).map((k) => [k.toLowerCase().trim(), k]));
  for (const c of chaves) {
    const real = mapa.get(c);
    if (real !== undefined && obj[real] !== null && obj[real] !== '') return obj[real];
  }
  return null;
}

// Localiza a lista dentro da resposta, em qualquer um dos formatos usuais.
function extractList(resposta) {
  if (Array.isArray(resposta)) return resposta;
  if (!resposta || typeof resposta !== 'object') return null;
  for (const key of ['fornecedores', 'suppliers', 'items', 'data', 'results', 'resultados', 'lista']) {
    const v = resposta[key];
    if (Array.isArray(v)) return v;
    if (v && typeof v === 'object' && Array.isArray(v.items)) return v.items;
  }
  // Objeto único que já parece um fornecedor
  if (pick(resposta, CAMPOS.nome)) return [resposta];
  return null;
}

function normalizeSuppliers(resposta) {
  const lista = extractList(resposta);
  if (!lista) return null;
  return lista
    .map((item) => {
      // O n8n costuma embrulhar cada item em { json: {...} }
      const o = item && typeof item === 'object' && item.json && typeof item.json === 'object' ? item.json : item;
      if (!o || typeof o !== 'object') return null;
      const texto = (v) => (v == null ? null : String(v).trim() || null);
      return {
        nome: texto(pick(o, CAMPOS.nome)),
        nicho: texto(pick(o, CAMPOS.nicho)),
        telefone: texto(pick(o, CAMPOS.telefone)),
        email: texto(pick(o, CAMPOS.email)),
        cidade: texto(pick(o, CAMPOS.cidade)),
        bairro: texto(pick(o, CAMPOS.bairro)),
        endereco: texto(pick(o, CAMPOS.endereco)),
        site: texto(pick(o, CAMPOS.site)),
        avaliacao: texto(pick(o, CAMPOS.avaliacao)),
        documento: texto(pick(o, CAMPOS.documento)),
        bruto: o,
      };
    })
    .filter((f) => f && (f.nome || f.telefone || f.email));
}

// Esconde a URL do webhook, mostrando apenas host e caminho (sem query, que pode conter segredo).
function maskedWebhookUrl() {
  if (!config.n8n.webhookUrl) return null;
  try {
    const u = new URL(config.n8n.webhookUrl);
    return `${u.protocol}//${u.host}${u.pathname}`;
  } catch (_) { return null; }
}

module.exports = { emit, record, finish, sign, safeEqual, countItems, normalizeSuppliers, maskedWebhookUrl, MAX_PAYLOAD_CHARS };
