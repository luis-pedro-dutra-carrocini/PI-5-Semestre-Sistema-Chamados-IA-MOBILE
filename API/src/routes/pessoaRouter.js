// src/routes/pessoaRouter.js
const express = require('express');
const pessoaController = require('../controllers/pessoaController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Rota pública de login
router.post('/login', pessoaController.login);

// Todas as rotas abaixo exigem autenticação
router.use(authMiddleware);

// Rotas de listagem e busca (protegidas)
router.get('/', pessoaController.listarPessoas);
router.get('/:id', pessoaController.buscarPessoaPorId);
router.get('/unidade/:unidadeId', pessoaController.listarPessoasPorUnidade);

// Rotas de cadastro e alteração
router.post('/', pessoaController.cadastrarPessoa); // Apenas gestor
router.put('/:id', pessoaController.alterarPessoa); // Gestor ou própria pessoa
router.patch('/:id/status', pessoaController.alterarStatusPessoa); // Apenas gestor

// NOTA: Não há rota de DELETE

module.exports = router;