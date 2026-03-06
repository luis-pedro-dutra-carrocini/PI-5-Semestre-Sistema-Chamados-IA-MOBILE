// src/routes/adminRouter.js
const express = require('express');
const adminController = require('../controllers/adminController');

const router = express.Router();

// Rota pública de login (não precisa de autenticação)
router.post('/login', adminController.login);

module.exports = router;