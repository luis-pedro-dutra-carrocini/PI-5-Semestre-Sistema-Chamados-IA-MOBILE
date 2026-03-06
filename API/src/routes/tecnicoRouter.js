// src/routes/tecnicoRouter.js
const express = require('express');
const tecnicoController = require('../controllers/tecnicoController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Rota pública de login
router.post('/login', tecnicoController.login);

// Todas as rotas abaixo exigem autenticação
router.use(authMiddleware);

// Rotas de listagem e busca (protegidas)
router.get('/', tecnicoController.listarTecnicos);
router.get('/:id', tecnicoController.buscarTecnicoPorId);
router.get('/unidade/:unidadeId', tecnicoController.listarTecnicosPorUnidade);

// Rotas de cadastro e alteração
router.post('/', tecnicoController.cadastrarTecnico); // Apenas gestor
router.put('/:id', tecnicoController.alterarTecnico); // Gestor ou próprio técnico
router.patch('/:id/status', tecnicoController.alterarStatusTecnico); // Apenas gestor

// NOTA: Não há rota de DELETE, conforme solicitado

module.exports = router;