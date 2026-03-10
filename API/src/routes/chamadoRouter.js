// src/routes/chamadoRoutes.js
const express = require('express');
const chamadoController = require('../controllers/chamadoController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas as rotas de chamado exigem autenticação
router.use(authMiddleware);

// Rotas de listagem e estatísticas
router.get('/', chamadoController.listarChamados);
router.get('/estatisticas', chamadoController.estatisticas);
router.get('/:id', chamadoController.buscarChamadoPorId);

// Rotas de criação e alteração
router.post('/', chamadoController.abrirChamado); // Apenas PESSOA
router.put('/:id', chamadoController.alterarChamado); // Pessoa (restrito), gestor ou técnico
router.patch('/:id/status', chamadoController.alterarStatus); // Gestor ou técnico
router.patch('/:id/atribuir-equipe', chamadoController.atribuirEquipe); // Apenas gestor

// NOTA: Não há rota de DELETE

module.exports = router;