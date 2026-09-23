'use strict';
const express = require('express');
const { pool } = require('../db');
const { billingGate } = require('../lib/subscription');

// Registro central de todas as rotas da API (montado em /api).
const api = express.Router();

api.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: 'ok' });
  } catch (e) {
    res.status(500).json({ ok: false, db: e.message });
  }
});

// Painel do dono da plataforma (sessão própria, sem empresa) e webhook de cobrança
api.use('/platform', require('./platform'));
api.use('/webhooks', require('./webhooks'));

// Empresa com teste encerrado ou pagamento atrasado: só a tela de assinatura continua liberada
api.use(billingGate);
api.use('/auth', require('./auth').router);
api.use('/billing', require('./billing'));
api.use('/users', require('./users'));
api.use('/settings', require('./settings'));
api.use('/customers', require('./customers').router);
api.use('/tickets', require('./tickets').router);
api.use('/opportunities', require('./pipeline'));
api.use('/pipelines', require('./pipelines'));
api.use('/custom-fields', require('./customFields'));
api.use('/automations', require('./automations'));
api.use('/tasks', require('./tasks'));
api.use('/reports', require('./reports'));
api.use('/notifications', require('./notifications'));
api.use('/inbox', require('./inbox'));
api.use('/channels', require('./channels'));
api.use('/quick-replies', require('./quickReplies'));
api.use('/chatbot', require('./chatbot'));

module.exports = api;
