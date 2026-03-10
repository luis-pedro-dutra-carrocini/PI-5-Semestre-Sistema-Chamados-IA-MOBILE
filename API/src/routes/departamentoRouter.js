// src/routes/departamentoRouter.js
const express = require('express');
const departamentoController = require('../controllers/departamentoController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas as rotas abaixo exigem autenticação
router.use(authMiddleware);

// Rotas públicas (não exigem autenticação para consultas básicas)
router.get('/', departamentoController.listarDepartamentos);
router.get('/:id', departamentoController.buscarDepartamentoPorId);

router.post('/', departamentoController.cadastrarDepartamento);
router.put('/:id', departamentoController.alterarDepartamento);
router.patch('/:id/status', departamentoController.alterarStatusDepartamento);

// NOTA: Não há rota de DELETE

module.exports = router;