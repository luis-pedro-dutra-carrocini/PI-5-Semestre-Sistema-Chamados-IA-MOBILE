// src/routes/departamentoRouter.js
const express = require('express');
const departamentoController = require('../controllers/departamentoController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Rotas públicas (não exigem autenticação para consultas básicas)
router.get('/', departamentoController.listarDepartamentos);
router.get('/:id', departamentoController.buscarDepartamentoPorId);
router.get('/unidade/:unidadeId', departamentoController.listarDepartamentosPorUnidade);

// Todas as rotas abaixo exigem autenticação
router.use(authMiddleware);

// Rotas que exigem autenticação e serão validadas no controller (apenas ADMINUNIDADE)
router.post('/', departamentoController.cadastrarDepartamento);
router.put('/:id', departamentoController.alterarDepartamento);
router.patch('/:id/status', departamentoController.alterarStatusDepartamento);

// NOTA: Não há rota de DELETE, conforme solicitado

module.exports = router;