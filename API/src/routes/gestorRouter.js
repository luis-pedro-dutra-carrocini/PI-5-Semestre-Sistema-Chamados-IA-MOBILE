// src/routes/gestorRouter.js
const express = require('express');
const gestorController = require('../controllers/gestorController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', gestorController.loginGestor);

// Todas as rotas de gestor exigem autenticação
router.use(authMiddleware);

// Rotas de listagem e busca (protegidas, mas com filtros por permissão)
router.get('/', gestorController.listarGestores);
router.get('/:id', gestorController.buscarGestorPorId);
router.get('/dashboard/dados', gestorController.dashboard)

// Rotas de cadastro e alteração
router.post('/', gestorController.cadastrarGestor);
router.put('/:id', gestorController.alterarGestor);
router.patch('/:id/status', gestorController.alterarStatusGestor);

// NOTA: Não há rota de DELETE, somente é permitido inativar

module.exports = router;