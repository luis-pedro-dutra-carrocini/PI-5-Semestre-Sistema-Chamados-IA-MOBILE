// src/controllers/gestorController.js
const prisma = require('../prisma.js');
const bcrypt = require('bcrypt');

class GestorController {

    // Cadastrar novo gestor
    async cadastrarGestor(req, res) {
        try {
            const {
                UnidadeId,
                GestorNome,
                GestorEmail,
                GestorTelefone,
                GestorCPF,
                GestorUsuario,
                GestorSenha,
                GestorNivel,
                GestorStatus
            } = req.body;

            const usuarioLogado = req.usuario;

            // Validações básicas
            if (!UnidadeId) {
                return res.status(400).json({ error: 'Unidade é obrigatória' });
            }

            if (!GestorNome || !GestorNome.trim()) {
                return res.status(400).json({ error: 'Nome do gestor é obrigatório' });
            }

            if (!GestorCPF || !GestorCPF.trim()) {
                return res.status(400).json({ error: 'CPF é obrigatório' });
            }

            if (!GestorUsuario || !GestorUsuario.trim()) {
                return res.status(400).json({ error: 'Usuário é obrigatório' });
            }

            if (!GestorSenha || !GestorSenha.trim()) {
                return res.status(400).json({ error: 'Senha é obrigatória' });
            }

            if (GestorSenha.trim().length < 6) {
                return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
            }

            if (!GestorNivel) {
                return res.status(400).json({ error: 'Nível do gestor é obrigatório' });
            }

            const niveisValidos = ['COMUM', 'ADMINUNIDADE'];
            if (!niveisValidos.includes(GestorNivel)) {
                return res.status(400).json({ 
                    error: 'Nível inválido. Use: COMUM ou ADMINUNIDADE' 
                });
            }

            // Validar status se fornecido
            if (GestorStatus) {
                const statusValidos = ['ATIVO', 'INATIVO', 'BLOQUEADO'];
                if (!statusValidos.includes(GestorStatus)) {
                    return res.status(400).json({ 
                        error: 'Status inválido. Use: ATIVO, INATIVO ou BLOQUEADO' 
                    });
                }
            }

            // Verificar regras de permissão baseado no tipo de usuário logado
            if (usuarioLogado.usuarioTipo === 'ADMINISTRADOR') {
                // ADMINISTRADOR pode cadastrar qualquer nível
                // Não precisa de validação adicional
            } 
            else if (usuarioLogado.usuarioTipo === 'GESTOR') {
                // Buscar gestor logado para verificar nível e unidade
                const gestorLogado = await prisma.gestor.findUnique({
                    where: { GestorId: usuarioLogado.usuarioId }
                });

                if (!gestorLogado) {
                    return res.status(403).json({ 
                        error: 'Gestor não encontrado' 
                    });
                }

                // Verificar se é ADMINUNIDADE
                if (gestorLogado.GestorNivel !== 'ADMINUNIDADE') {
                    return res.status(403).json({ 
                        error: 'Apenas gestores ADMINUNIDADE podem cadastrar novos gestores' 
                    });
                }

                // ADMINUNIDADE não pode cadastrar outro ADMINUNIDADE
                if (GestorNivel === 'ADMINUNIDADE') {
                    return res.status(403).json({ 
                        error: 'Gestores ADMINUNIDADE não podem cadastrar outros administradores de unidade' 
                    });
                }

                // ADMINUNIDADE só pode cadastrar gestores da sua própria unidade
                if (gestorLogado.UnidadeId !== parseInt(UnidadeId)) {
                    return res.status(403).json({ 
                        error: 'Você só pode cadastrar gestores na sua própria unidade' 
                    });
                }
            } 
            else {
                return res.status(403).json({ 
                    error: 'Apenas administradores e gestores ADMINUNIDADE podem cadastrar gestores' 
                });
            }

            // Verificar se a unidade existe
            const unidade = await prisma.unidade.findUnique({
                where: { UnidadeId: parseInt(UnidadeId) }
            });

            if (!unidade) {
                return res.status(404).json({ error: 'Unidade não encontrada' });
            }

            // Verificar se a unidade está ativa
            if (unidade.UnidadeStatus !== 'ATIVA') {
                return res.status(400).json({ 
                    error: 'Não é possível cadastrar gestores em uma unidade inativa ou bloqueada' 
                });
            }

            // Verificar duplicidade de CPF
            const cpfExistente = await prisma.gestor.findUnique({
                where: { GestorCPF: GestorCPF.trim() }
            });

            if (cpfExistente) {
                return res.status(409).json({ error: 'CPF já cadastrado' });
            }

            // Verificar duplicidade de usuário
            const usuarioExistente = await prisma.gestor.findUnique({
                where: { GestorUsuario: GestorUsuario.trim() }
            });

            if (usuarioExistente) {
                return res.status(409).json({ error: 'Nome de usuário já está em uso' });
            }

            // Criptografar senha
            const salt = await bcrypt.genSalt(10);
            const senhaHash = await bcrypt.hash(GestorSenha.trim(), salt);

            // Criar gestor
            const gestor = await prisma.gestor.create({
                data: {
                    UnidadeId: parseInt(UnidadeId),
                    GestorNome: GestorNome.trim(),
                    GestorEmail: GestorEmail?.trim() || null,
                    GestorTelefone: GestorTelefone?.trim() || null,
                    GestorCPF: GestorCPF.trim(),
                    GestorUsuario: GestorUsuario.trim(),
                    GestorSenha: senhaHash,
                    GestorNivel: GestorNivel,
                    GestorStatus: GestorStatus || 'ATIVO'
                },
                include: {
                    Unidade: {
                        select: {
                            UnidadeId: true,
                            UnidadeNome: true,
                            UnidadeStatus: true
                        }
                    }
                }
            });

            // Remover senha do retorno
            const { GestorSenha: _, ...gestorSemSenha } = gestor;

            res.status(201).json({
                message: 'Gestor cadastrado com sucesso',
                data: gestorSemSenha
            });

        } catch (error) {
            console.error('Erro ao cadastrar gestor:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Alterar gestor
    async alterarGestor(req, res) {
        try {
            const { id } = req.params;
            const {
                UnidadeId,
                GestorNome,
                GestorEmail,
                GestorTelefone,
                GestorCPF,
                GestorUsuario,
                GestorSenha,
                GestorNivel,
                GestorStatus
            } = req.body;

            const usuarioLogado = req.usuario;
            const gestorId = parseInt(id);

            if (isNaN(gestorId)) {
                return res.status(400).json({ error: 'ID do gestor inválido' });
            }

            // Buscar gestor a ser alterado
            const gestorAlterar = await prisma.gestor.findUnique({
                where: { GestorId: gestorId },
                include: {
                    Unidade: true
                }
            });

            if (!gestorAlterar) {
                return res.status(404).json({ error: 'Gestor não encontrado' });
            }

            // Verificar permissões baseado no tipo de usuário logado
            let podeAlterar = false;
            let gestorLogado = null;

            if (usuarioLogado.usuarioTipo === 'ADMINISTRADOR') {
                // ADMINISTRADOR pode alterar qualquer gestor
                podeAlterar = true;
            } 
            else if (usuarioLogado.usuarioTipo === 'GESTOR') {
                // Buscar gestor logado
                gestorLogado = await prisma.gestor.findUnique({
                    where: { GestorId: usuarioLogado.usuarioId }
                });

                if (!gestorLogado) {
                    return res.status(403).json({ error: 'Gestor não encontrado' });
                }

                // Gestor COMUM não pode alterar ninguém
                if (gestorLogado.GestorNivel === 'COMUM') {
                    return res.status(403).json({ 
                        error: 'Gestores comuns não podem alterar dados de outros gestores' 
                    });
                }

                // ADMINUNIDADE pode alterar desde que:
                if (gestorLogado.GestorNivel === 'ADMINUNIDADE') {
                    // 1. Seja da mesma unidade
                    if (gestorLogado.UnidadeId !== gestorAlterar.UnidadeId) {
                        return res.status(403).json({ 
                            error: 'Você só pode alterar gestores da sua própria unidade' 
                        });
                    }

                    // 2. Não pode alterar outro ADMINUNIDADE
                    if (gestorAlterar.GestorNivel === 'ADMINUNIDADE') {
                        return res.status(403).json({ 
                            error: 'Gestores ADMINUNIDADE não podem alterar outros administradores de unidade' 
                        });
                    }

                    podeAlterar = true;
                }
            } 
            else {
                return res.status(403).json({ 
                    error: 'Apenas administradores e gestores ADMINUNIDADE podem alterar gestores' 
                });
            }

            if (!podeAlterar) {
                return res.status(403).json({ 
                    error: 'Você não tem permissão para alterar este gestor' 
                });
            }

            // Preparar dados para atualização
            const dadosAtualizacao = {};

            // Validar e adicionar campos
            if (UnidadeId !== undefined) {
                // Verificar se a unidade existe
                const unidade = await prisma.unidade.findUnique({
                    where: { UnidadeId: parseInt(UnidadeId) }
                });

                if (!unidade) {
                    return res.status(404).json({ error: 'Unidade não encontrada' });
                }

                if (unidade.UnidadeStatus !== 'ATIVA') {
                    return res.status(400).json({ 
                        error: 'Não é possível transferir gestor para uma unidade inativa ou bloqueada' 
                    });
                }

                dadosAtualizacao.UnidadeId = parseInt(UnidadeId);
            }

            if (GestorNome !== undefined) {
                if (!GestorNome.trim()) {
                    return res.status(400).json({ error: 'Nome do gestor não pode ser vazio' });
                }
                dadosAtualizacao.GestorNome = GestorNome.trim();
            }

            if (GestorEmail !== undefined) {
                dadosAtualizacao.GestorEmail = GestorEmail?.trim() || null;
            }

            if (GestorTelefone !== undefined) {
                dadosAtualizacao.GestorTelefone = GestorTelefone?.trim() || null;
            }

            if (GestorCPF !== undefined) {
                if (!GestorCPF.trim()) {
                    return res.status(400).json({ error: 'CPF não pode ser vazio' });
                }

                // Verificar se CPF já existe para outro gestor
                const cpfExistente = await prisma.gestor.findFirst({
                    where: {
                        GestorCPF: GestorCPF.trim(),
                        GestorId: { not: gestorId }
                    }
                });

                if (cpfExistente) {
                    return res.status(409).json({ error: 'CPF já cadastrado para outro gestor' });
                }

                dadosAtualizacao.GestorCPF = GestorCPF.trim();
            }

            if (GestorUsuario !== undefined) {
                if (!GestorUsuario.trim()) {
                    return res.status(400).json({ error: 'Usuário não pode ser vazio' });
                }

                // Verificar se usuário já existe para outro gestor
                const usuarioExistente = await prisma.gestor.findFirst({
                    where: {
                        GestorUsuario: GestorUsuario.trim(),
                        GestorId: { not: gestorId }
                    }
                });

                if (usuarioExistente) {
                    return res.status(409).json({ error: 'Nome de usuário já está em uso' });
                }

                dadosAtualizacao.GestorUsuario = GestorUsuario.trim();
            }

            if (GestorSenha !== undefined) {
                if (!GestorSenha.trim()) {
                    return res.status(400).json({ error: 'Senha não pode ser vazia' });
                }
                if (GestorSenha.trim().length < 6) {
                    return res.status(400).json({ error: 'A senha deve ter no mínimo 6 caracteres' });
                }
                const salt = await bcrypt.genSalt(10);
                dadosAtualizacao.GestorSenha = await bcrypt.hash(GestorSenha.trim(), salt);
            }

            if (GestorNivel !== undefined) {
                const niveisValidos = ['COMUM', 'ADMINUNIDADE'];
                if (!niveisValidos.includes(GestorNivel)) {
                    return res.status(400).json({ 
                        error: 'Nível inválido. Use: COMUM ou ADMINUNIDADE' 
                    });
                }

                // ADMINUNIDADE não pode alterar nível para ADMINUNIDADE
                if (usuarioLogado.usuarioTipo === 'GESTOR' && 
                    gestorLogado?.GestorNivel === 'ADMINUNIDADE' && 
                    GestorNivel === 'ADMINUNIDADE') {
                    return res.status(403).json({ 
                        error: 'Gestores ADMINUNIDADE não podem alterar o nível para ADMINUNIDADE' 
                    });
                }

                dadosAtualizacao.GestorNivel = GestorNivel;
            }

            if (GestorStatus !== undefined) {
                const statusValidos = ['ATIVO', 'INATIVO', 'BLOQUEADO'];
                if (!statusValidos.includes(GestorStatus)) {
                    return res.status(400).json({ 
                        error: 'Status inválido. Use: ATIVO, INATIVO ou BLOQUEADO' 
                    });
                }
                dadosAtualizacao.GestorStatus = GestorStatus;
            }

            // Verificar se há dados para atualizar
            if (Object.keys(dadosAtualizacao).length === 0) {
                return res.status(400).json({ error: 'Nenhum dado fornecido para atualização' });
            }

            // Atualizar gestor
            const gestorAtualizado = await prisma.gestor.update({
                where: { GestorId: gestorId },
                data: dadosAtualizacao,
                include: {
                    Unidade: {
                        select: {
                            UnidadeId: true,
                            UnidadeNome: true,
                            UnidadeStatus: true
                        }
                    }
                }
            });

            // Remover senha do retorno
            const { GestorSenha: _, ...gestorSemSenha } = gestorAtualizado;

            res.status(200).json({
                message: 'Gestor atualizado com sucesso',
                data: gestorSemSenha
            });

        } catch (error) {
            console.error('Erro ao alterar gestor:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Listar gestores com filtros
    async listarGestores(req, res) {
        try {
            const { 
                unidadeId, 
                nivel, 
                status, 
                pagina = 1, 
                limite = 10 
            } = req.query;

            const usuarioLogado = req.usuario;

            // Construir filtro base
            const filtro = {};

            // Aplicar filtros de acordo com permissão
            if (usuarioLogado.usuarioTipo === 'GESTOR') {
                const gestorLogado = await prisma.gestor.findUnique({
                    where: { GestorId: usuarioLogado.usuarioId }
                });

                if (gestorLogado) {
                    // Gestor só vê gestores da sua unidade
                    filtro.UnidadeId = gestorLogado.UnidadeId;
                }
            }

            // Aplicar filtros da query (sobrescrevem os automáticos se for admin)
            if (usuarioLogado.usuarioTipo === 'ADMINISTRADOR' && unidadeId) {
                filtro.UnidadeId = parseInt(unidadeId);
            }

            if (nivel) {
                const niveisValidos = ['COMUM', 'ADMINUNIDADE'];
                if (!niveisValidos.includes(nivel)) {
                    return res.status(400).json({ 
                        error: 'Nível inválido. Use: COMUM ou ADMINUNIDADE' 
                    });
                }
                filtro.GestorNivel = nivel;
            }

            if (status) {
                const statusValidos = ['ATIVO', 'INATIVO', 'BLOQUEADO'];
                if (!statusValidos.includes(status)) {
                    return res.status(400).json({ 
                        error: 'Status inválido. Use: ATIVO, INATIVO ou BLOQUEADO' 
                    });
                }
                filtro.GestorStatus = status;
            }

            // Calcular paginação
            const paginaAtual = parseInt(pagina);
            const limitePorPagina = parseInt(limite);
            const skip = (paginaAtual - 1) * limitePorPagina;

            // Buscar gestores
            const [gestores, total] = await prisma.$transaction([
                prisma.gestor.findMany({
                    where: filtro,
                    orderBy: [
                        { GestorNivel: 'desc' },
                        { GestorNome: 'asc' }
                    ],
                    skip: skip,
                    take: limitePorPagina,
                    include: {
                        Unidade: {
                            select: {
                                UnidadeId: true,
                                UnidadeNome: true,
                                UnidadeStatus: true
                            }
                        }
                    }
                }),
                prisma.gestor.count({ where: filtro })
            ]);

            // Remover senhas dos gestores
            const gestoresSemSenha = gestores.map(gestor => {
                const { GestorSenha: _, ...gestorSemSenha } = gestor;
                return gestorSemSenha;
            });

            res.status(200).json({
                data: gestoresSemSenha,
                paginacao: {
                    paginaAtual,
                    limitePorPagina,
                    totalRegistros: total,
                    totalPaginas: Math.ceil(total / limitePorPagina)
                }
            });

        } catch (error) {
            console.error('Erro ao listar gestores:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Buscar gestor por ID
    async buscarGestorPorId(req, res) {
        try {
            const { id } = req.params;
            const usuarioLogado = req.usuario;

            const gestorId = parseInt(id);
            if (isNaN(gestorId)) {
                return res.status(400).json({ error: 'ID do gestor inválido' });
            }

            // Buscar gestor
            const gestor = await prisma.gestor.findUnique({
                where: { GestorId: gestorId },
                include: {
                    Unidade: {
                        select: {
                            UnidadeId: true,
                            UnidadeNome: true,
                            UnidadeStatus: true
                        }
                    }
                }
            });

            if (!gestor) {
                return res.status(404).json({ error: 'Gestor não encontrado' });
            }

            // Verificar permissão de visualização
            if (usuarioLogado.usuarioTipo === 'GESTOR') {
                const gestorLogado = await prisma.gestor.findUnique({
                    where: { GestorId: usuarioLogado.usuarioId }
                });

                if (gestorLogado && gestorLogado.UnidadeId !== gestor.UnidadeId) {
                    return res.status(403).json({ 
                        error: 'Você só pode visualizar gestores da sua própria unidade' 
                    });
                }
            }

            // Remover senha do retorno
            const { GestorSenha: _, ...gestorSemSenha } = gestor;

            res.status(200).json({
                data: gestorSemSenha
            });

        } catch (error) {
            console.error('Erro ao buscar gestor:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Alterar apenas status do gestor
    async alterarStatusGestor(req, res) {
        try {
            const { id } = req.params;
            const { GestorStatus } = req.body;
            const usuarioLogado = req.usuario;

            const gestorId = parseInt(id);
            if (isNaN(gestorId)) {
                return res.status(400).json({ error: 'ID do gestor inválido' });
            }

            // Validar status
            if (!GestorStatus) {
                return res.status(400).json({ error: 'Status é obrigatório' });
            }

            const statusValidos = ['ATIVO', 'INATIVO', 'BLOQUEADO'];
            if (!statusValidos.includes(GestorStatus)) {
                return res.status(400).json({ 
                    error: 'Status inválido. Use: ATIVO, INATIVO ou BLOQUEADO' 
                });
            }

            // Buscar gestor a ser alterado
            const gestorAlterar = await prisma.gestor.findUnique({
                where: { GestorId: gestorId }
            });

            if (!gestorAlterar) {
                return res.status(404).json({ error: 'Gestor não encontrado' });
            }

            // Verificar permissões (mesma lógica da alteração completa)
            let podeAlterar = false;
            let gestorLogado = null;

            if (usuarioLogado.usuarioTipo === 'ADMINISTRADOR') {
                podeAlterar = true;
            } 
            else if (usuarioLogado.usuarioTipo === 'GESTOR') {
                gestorLogado = await prisma.gestor.findUnique({
                    where: { GestorId: usuarioLogado.usuarioId }
                });

                if (!gestorLogado) {
                    return res.status(403).json({ error: 'Gestor não encontrado' });
                }

                if (gestorLogado.GestorNivel === 'COMUM') {
                    return res.status(403).json({ 
                        error: 'Gestores comuns não podem alterar status de outros gestores' 
                    });
                }

                if (gestorLogado.GestorNivel === 'ADMINUNIDADE') {
                    if (gestorLogado.UnidadeId !== gestorAlterar.UnidadeId) {
                        return res.status(403).json({ 
                            error: 'Você só pode alterar status de gestores da sua própria unidade' 
                        });
                    }

                    if (gestorAlterar.GestorNivel === 'ADMINUNIDADE') {
                        return res.status(403).json({ 
                            error: 'Gestores ADMINUNIDADE não podem alterar status de outros administradores de unidade' 
                        });
                    }

                    podeAlterar = true;
                }
            }

            if (!podeAlterar) {
                return res.status(403).json({ 
                    error: 'Você não tem permissão para alterar o status deste gestor' 
                });
            }

            // Atualizar apenas status
            const gestorAtualizado = await prisma.gestor.update({
                where: { GestorId: gestorId },
                data: { GestorStatus: GestorStatus },
                include: {
                    Unidade: {
                        select: {
                            UnidadeId: true,
                            UnidadeNome: true,
                            UnidadeStatus: true
                        }
                    }
                }
            });

            // Remover senha do retorno
            const { GestorSenha: _, ...gestorSemSenha } = gestorAtualizado;

            res.status(200).json({
                message: 'Status do gestor atualizado com sucesso',
                data: gestorSemSenha
            });

        } catch (error) {
            console.error('Erro ao alterar status do gestor:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new GestorController();