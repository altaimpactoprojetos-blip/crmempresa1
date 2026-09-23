'use strict';
const express = require('express');
const { pool } = require('../db');

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

api.use('/auth', require('./auth').router);
api.use('/users', require('./users'));
api.use('/settings', require('./settings'));
api.use('/customers', require('./customers').router);
api.use('/tickets', require('./tickets').router);
api.use('/opportunities', require('./pipeline'));
api.use('/tasks', require('./tasks'));
api.use('/reports', require('./reports'));
api.use('/notifications', require('./notifications'));
api.use('/whatsapp', require('./whatsapp'));

module.exports = api;
