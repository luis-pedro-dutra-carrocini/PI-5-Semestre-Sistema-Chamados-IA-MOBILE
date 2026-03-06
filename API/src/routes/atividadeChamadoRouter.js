// src/routes/atividadeChamadoRoutes.js
const express = require('express');
const atividadeChamadoController = require('../controllers/atividadeChamadoController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas as rotas de atividade exigem autenticação
router.use(authMiddleware);

// Rotas de listagem (com permissões específicas)
router.get('/chamado/:chamadoId', atividadeChamadoController.listarAtividadesPorChamado);
router.get('/tecnico/:tecnicoId', atividadeChamadoController.listarAtividadesPorTecnico);
router.get('/chamado/:chamadoId/estatisticas', atividadeChamadoController.estatisticasPorChamado);
router.get('/:id', atividadeChamadoController.buscarAtividadePorId);

// Rotas de manipulação (apenas técnicos, com validações)
router.post('/chamado/:chamadoId', atividadeChamadoController.criarAtividade);
router.put('/:id', atividadeChamadoController.alterarAtividade);
router.delete('/:id', atividadeChamadoController.excluirAtividade);

module.exports = router;