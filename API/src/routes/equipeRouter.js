// src/routes/equipeRoutes.js
const express = require('express');
const equipeController = require('../controllers/equipeController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Rotas públicas (não exigem autenticação para consultas básicas)
router.get('/', equipeController.listarEquipes);
router.get('/:id', equipeController.buscarEquipePorId);
router.get('/:equipeId/tecnicos', equipeController.listarVinculosPorEquipe);
router.get('/tecnico/:tecnicoId', equipeController.listarVinculosPorTecnico);

// Todas as rotas abaixo exigem autenticação
router.use(authMiddleware);

// Rotas de equipe (apenas gestores)
router.post('/', equipeController.cadastrarEquipe);
router.put('/:id', equipeController.alterarEquipe);
router.patch('/:id/status', equipeController.alterarStatusEquipe);

// Rotas de vínculos técnico-equipe (apenas gestores)
router.post('/:equipeId/tecnicos', equipeController.adicionarTecnicoEquipe);
router.put('/vinculos/:vinculoId', equipeController.alterarTecnicoEquipe);
router.delete('/vinculos/:vinculoId', equipeController.removerTecnicoEquipe); // EXCLUSÃO PERMITIDA

// NOTA: Não há rota de DELETE para equipe, apenas para vínculos

module.exports = router;