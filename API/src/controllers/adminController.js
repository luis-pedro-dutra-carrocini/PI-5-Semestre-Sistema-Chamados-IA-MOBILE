// src/controllers/adminController.js
const prisma = require('../prisma.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AdminController {

    // Login do administrador
    async login(req, res) {
        try {
            const { AdministradorUsuario, AdministradorSenha } = req.body;

            // Validações básicas
            if (!AdministradorUsuario || !AdministradorUsuario.trim()) {
                return res.status(400).json({
                    error: 'Usuário é obrigatório'
                });
            }

            if (!AdministradorSenha || !AdministradorSenha.trim()) {
                return res.status(400).json({
                    error: 'Senha é obrigatória'
                });
            }

            // Buscar administrador pelo usuário
            const administrador = await prisma.administrador.findUnique({
                where: {
                    AdministradorUsuario: AdministradorUsuario.trim()
                }
            });

            // Verificar se administrador existe
            if (!administrador) {
                return res.status(401).json({
                    error: 'Usuário ou senha inválidos'
                });
            }

            // Verificar senha
            const senhaValida = await bcrypt.compare(
                AdministradorSenha.trim(),
                administrador.AdministradorSenha
            );

            if (!senhaValida) {
                return res.status(401).json({
                    error: 'Usuário ou senha inválidos'
                });
            }

            // Gerar token JWT
            const token = jwt.sign(
                {
                    usuarioId: administrador.AdministradorId,
                    usuarioTipo: 'ADMINISTRADOR',
                    usuarioEmail: administrador.AdministradorUsuario
                },
                process.env.JWT_SECRET,
                { expiresIn: '8h' } // Token válido por 8 horas
            );

            // Retornar dados do admin (sem a senha)
            const adminSemSenha = {
                AdministradorId: administrador.AdministradorId,
                AdministradorUsuario: administrador.AdministradorUsuario
            };

            res.status(200).json({
                message: 'Login realizado com sucesso',
                data: {
                    usuario: adminSemSenha,
                    token,
                    tipo: 'ADMINISTRADOR'
                }
            });

        } catch (error) {
            console.error('Erro no login do administrador:', error);
            res.status(500).json({
                error: error.message
            });
        }
    }
}

module.exports = new AdminController();