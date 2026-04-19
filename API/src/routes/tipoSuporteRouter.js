// src/routes/tipoSuporteRoutes.js
const express = require('express');
const tipoSuporteController = require('../controllers/tipoSuporteController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas as rotas abaixo exigem autenticação
router.use(authMiddleware);

router.get('/', tipoSuporteController.listarTiposSuporte);
router.get('/:id', tipoSuporteController.buscarTipoSuportePorId);
router.get('/unidade/:unidadeId', tipoSuporteController.listarTiposPorUnidade);

// Rotas que exigem autenticação e serão validadas no controller (apenas gestores da unidade)
router.post('/', tipoSuporteController.cadastrarTipoSuporte);
router.put('/:id', tipoSuporteController.alterarTipoSuporte);
router.patch('/:id/status', tipoSuporteController.alterarStatusTipoSuporte);

// NOTA: Não há rota de DELETE

module.exports = router;