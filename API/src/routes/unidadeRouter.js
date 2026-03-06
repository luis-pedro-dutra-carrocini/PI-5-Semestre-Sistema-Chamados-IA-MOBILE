// src/routes/unidadeRouter.js
const express = require('express');
const unidadeController = require('../controllers/unidadeController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Rotas públicas (não exigem autenticação)
router.get('/', unidadeController.listarUnidades);
router.get('/:id', unidadeController.buscarUnidadePorId);

// Todas as rotas abaixo exigem autenticação
router.use(authMiddleware);

// Rotas que exigem autenticação (especificamente ADMINISTRADOR - verificado no controller)
router.post('/', unidadeController.cadastrarUnidade);
router.put('/:id', unidadeController.alterarUnidade);
router.patch('/:id/status', unidadeController.alterarStatusUnidade);

// NOTA: Não há rota de DELETE, conforme solicitado

module.exports = router;