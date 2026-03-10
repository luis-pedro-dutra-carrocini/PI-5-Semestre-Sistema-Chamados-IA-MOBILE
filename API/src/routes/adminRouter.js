// src/routes/adminRouter.js
const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Rota pública de login (não precisa de autenticação)
router.post('/login', adminController.login);

router.use(authMiddleware);

// Rota de Dashboard (protegida)
router.get('/dashboard', adminController.dashboard);

// Alterar dados
router.put('/', adminController.alterarAdmin);

module.exports = router;