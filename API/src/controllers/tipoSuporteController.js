// src/controllers/tipoSuporteController.js
const prisma = require('../prisma.js');

class TipoSuporteController {

    // Cadastrar novo tipo de suporte (apenas gestores da unidade)
    async cadastrarTipoSuporte(req, res) {
        try {
            const { UnidadeId, TipSupNom, TipSupStatus } = req.body;
            const usuarioLogado = req.usuario;

            // Validações básicas
            if (!UnidadeId) {
                return res.status(400).json({ error: 'Unidade é obrigatória' });
            }

            if (!TipSupNom || !TipSupNom.trim()) {
                return res.status(400).json({ error: 'Nome do tipo de suporte é obrigatório' });
            }

            // Verificar se o usuário é GESTOR
            if (usuarioLogado.usuarioTipo !== 'GESTOR') {
                return res.status(403).json({
                    error: 'Apenas gestores podem cadastrar tipos de suporte'
                });
            }

            // Buscar gestor logado
            const gestorLogado = await prisma.gestor.findUnique({
                where: { GestorId: usuarioLogado.usuarioId }
            });

            if (!gestorLogado) {
                return res.status(403).json({ error: 'Gestor não encontrado' });
            }

            // Verificar status do gestor
            if (gestorLogado.GestorStatus !== 'ATIVO') {
                return res.status(403).json({
                    error: 'Seu usuário gestor está inativo. Não é possível cadastrar tipos de suporte.'
                });
            }

            // Verificar se o gestor pertence à unidade informada
            if (gestorLogado.UnidadeId !== parseInt(UnidadeId)) {
                return res.status(403).json({
                    error: 'Você só pode cadastrar tipos de suporte na sua própria unidade'
                });
            }

            // Verificar se a unidade existe e está ativa
            const unidade = await prisma.unidade.findUnique({
                where: { UnidadeId: parseInt(UnidadeId) }
            });

            if (!unidade) {
                return res.status(404).json({ error: 'Unidade não encontrada' });
            }

            if (unidade.UnidadeStatus !== 'ATIVA') {
                return res.status(400).json({
                    error: 'Não é possível cadastrar tipos de suporte em uma unidade inativa ou bloqueada'
                });
            }

            // Validar status se fornecido
            if (TipSupStatus) {
                const statusValidos = ['ATIVO', 'INATIVO'];
                if (!statusValidos.includes(TipSupStatus)) {
                    return res.status(400).json({
                        error: 'Status inválido. Use: ATIVO ou INATIVO'
                    });
                }
            }

            // Verificar se já existe tipo de suporte com o mesmo nome na mesma unidade
            const tipoExistente = await prisma.tipoSuporte.findFirst({
                where: {
                    UnidadeId: parseInt(UnidadeId),
                    TipSupNom: {
                        equals: TipSupNom.trim(),
                        mode: 'insensitive'
                    }
                }
            });

            if (tipoExistente) {
                return res.status(409).json({
                    error: 'Já existe um tipo de suporte com este nome nesta unidade'
                });
            }

            // Criar tipo de suporte
            const tipoSuporte = await prisma.tipoSuporte.create({
                data: {
                    UnidadeId: parseInt(UnidadeId),
                    TipSupNom: TipSupNom.trim(),
                    TipSupStatus: TipSupStatus || 'ATIVO',
                    TipSupDtCadastro: new Date()
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

            res.status(201).json({
                message: 'Tipo de suporte cadastrado com sucesso',
                data: tipoSuporte
            });

        } catch (error) {
            console.error('Erro ao cadastrar tipo de suporte:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Alterar tipo de suporte (apenas gestores da unidade)
    async alterarTipoSuporte(req, res) {
        try {
            const { id } = req.params;
            const { TipSupNom, TipSupStatus } = req.body;
            const usuarioLogado = req.usuario;

            const tipoSuporteId = parseInt(id);
            if (isNaN(tipoSuporteId)) {
                return res.status(400).json({ error: 'ID do tipo de suporte inválido' });
            }

            // Verificar se o usuário é GESTOR
            if (usuarioLogado.usuarioTipo !== 'GESTOR') {
                return res.status(403).json({
                    error: 'Apenas gestores podem alterar tipos de suporte'
                });
            }

            // Buscar gestor logado
            const gestorLogado = await prisma.gestor.findUnique({
                where: { GestorId: usuarioLogado.usuarioId }
            });

            if (!gestorLogado) {
                return res.status(403).json({ error: 'Gestor não encontrado' });
            }

            // Verificar status do gestor
            if (gestorLogado.GestorStatus !== 'ATIVO') {
                return res.status(403).json({
                    error: 'Seu usuário gestor está inativo. Não é possível alterar tipos de suporte.'
                });
            }

            // Buscar tipo de suporte a ser alterado
            const tipoExistente = await prisma.tipoSuporte.findUnique({
                where: { TipSupId: tipoSuporteId },
                include: {
                    Unidade: true
                }
            });

            if (!tipoExistente) {
                return res.status(404).json({ error: 'Tipo de suporte não encontrado' });
            }

            // Verificar se o gestor pertence à mesma unidade do tipo de suporte
            if (gestorLogado.UnidadeId !== tipoExistente.UnidadeId) {
                return res.status(403).json({
                    error: 'Você só pode alterar tipos de suporte da sua própria unidade'
                });
            }

            // Verificar se a unidade está ativa
            if (tipoExistente.Unidade.UnidadeStatus !== 'ATIVA') {
                return res.status(400).json({
                    error: 'Não é possível alterar tipos de suporte de uma unidade inativa ou bloqueada'
                });
            }

            // Preparar dados para atualização
            const dadosAtualizacao = {};

            // Validar e adicionar nome se fornecido
            if (TipSupNom !== undefined) {
                if (!TipSupNom.trim()) {
                    return res.status(400).json({ error: 'Nome do tipo de suporte não pode ser vazio' });
                }

                // Verificar se já existe outro tipo com o mesmo nome na mesma unidade
                if (TipSupNom.trim().toLowerCase() !== tipoExistente.TipSupNom.toLowerCase()) {
                    const tipoMesmoNome = await prisma.tipoSuporte.findFirst({
                        where: {
                            UnidadeId: tipoExistente.UnidadeId,
                            TipSupNom: {
                                equals: TipSupNom.trim(),
                                mode: 'insensitive'
                            },
                            TipSupId: {
                                not: tipoSuporteId
                            }
                        }
                    });

                    if (tipoMesmoNome) {
                        return res.status(409).json({
                            error: 'Já existe outro tipo de suporte com este nome nesta unidade'
                        });
                    }
                }

                dadosAtualizacao.TipSupNom = TipSupNom.trim();
            }

            // Validar e adicionar status se fornecido
            if (TipSupStatus !== undefined) {
                const statusValidos = ['ATIVO', 'INATIVO'];
                if (!statusValidos.includes(TipSupStatus)) {
                    return res.status(400).json({
                        error: 'Status inválido. Use: ATIVO ou INATIVO'
                    });
                }

                // Se for inativar, verificar se existem chamados vinculados a este tipo
                if (TipSupStatus === 'INATIVO' && tipoExistente.TipSupStatus === 'ATIVO') {
                    const chamadosVinculados = await prisma.chamado.count({
                        where: {
                            TipSupId: tipoSuporteId,
                            ChamadoStatus: {
                                notIn: ['CONCLUIDO', 'CANCELADO', 'RECUSADO']
                            }
                        }
                    });

                    if (chamadosVinculados > 0) {
                        return res.status(400).json({
                            error: 'Não é possível inativar um tipo de suporte com chamados em andamento. Finalize os chamados primeiro.'
                        });
                    }
                }

                dadosAtualizacao.TipSupStatus = TipSupStatus;
            }

            // Verificar se há dados para atualizar
            if (Object.keys(dadosAtualizacao).length === 0) {
                return res.status(400).json({ error: 'Nenhum dado fornecido para atualização' });
            }

            // Atualizar tipo de suporte
            const tipoAtualizado = await prisma.tipoSuporte.update({
                where: { TipSupId: tipoSuporteId },
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

            res.status(200).json({
                message: 'Tipo de suporte atualizado com sucesso',
                data: tipoAtualizado
            });

        } catch (error) {
            console.error('Erro ao alterar tipo de suporte:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Listar tipos de suporte com filtros
    async listarTiposSuporte(req, res) {
        try {
            const {
                unidadeId,
                status,
                nome,
                pagina = 1,
                limite = 10
            } = req.query;

            const usuarioLogado = req.usuario;

            // Construir filtro base
            const filtro = {};

            // Aplicar filtros de acordo com permissão
            if (usuarioLogado?.usuarioTipo === 'GESTOR') {
                const gestorLogado = await prisma.gestor.findUnique({
                    where: { GestorId: usuarioLogado.usuarioId }
                });

                if (gestorLogado) {
                    // Gestor só vê tipos de suporte da sua unidade
                    filtro.UnidadeId = gestorLogado.UnidadeId;
                }
            }

            // Aplicar filtros da query
            if (unidadeId) {
                // Se for admin ou se o filtro for compatível com a permissão
                if (usuarioLogado?.usuarioTipo === 'ADMINISTRADOR') {
                    filtro.UnidadeId = parseInt(unidadeId);
                } else if (usuarioLogado?.usuarioTipo === 'GESTOR') {
                    // Verificar se o gestor tem acesso a esta unidade
                    const gestorLogado = await prisma.gestor.findUnique({
                        where: { GestorId: usuarioLogado.usuarioId }
                    });

                    if (gestorLogado && gestorLogado.UnidadeId === parseInt(unidadeId)) {
                        filtro.UnidadeId = parseInt(unidadeId);
                    } else {
                        return res.status(403).json({
                            error: 'Você não tem permissão para visualizar tipos de suporte desta unidade'
                        });
                    }
                }
            }

            if (status) {
                const statusValidos = ['ATIVO', 'INATIVO'];
                if (!statusValidos.includes(status)) {
                    return res.status(400).json({
                        error: 'Status inválido. Use: ATIVO ou INATIVO'
                    });
                }
                filtro.TipSupStatus = status;
            }

            if (nome) {
                filtro.TipSupNom = {
                    contains: nome,
                    mode: 'insensitive'
                };
            }

            // Calcular paginação
            const paginaAtual = parseInt(pagina);
            const limitePorPagina = parseInt(limite);
            const skip = (paginaAtual - 1) * limitePorPagina;

            // Buscar tipos de suporte
            const [tipos, total] = await prisma.$transaction([
                prisma.tipoSuporte.findMany({
                    where: filtro,
                    orderBy: [
                        { TipSupNom: 'asc' }
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
                        },
                        _count: {
                            select: {
                                Chamado: true
                            }
                        }
                    }
                }),
                prisma.tipoSuporte.count({ where: filtro })
            ]);

            res.status(200).json({
                data: tipos,
                paginacao: {
                    paginaAtual,
                    limitePorPagina,
                    totalRegistros: total,
                    totalPaginas: Math.ceil(total / limitePorPagina)
                }
            });

        } catch (error) {
            console.error('Erro ao listar tipos de suporte:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Buscar tipo de suporte por ID
    async buscarTipoSuportePorId(req, res) {
        try {
            const { id } = req.params;
            const usuarioLogado = req.usuario;

            const tipoSuporteId = parseInt(id);
            if (isNaN(tipoSuporteId)) {
                return res.status(400).json({ error: 'ID do tipo de suporte inválido' });
            }

            // Buscar tipo de suporte
            const tipoSuporte = await prisma.tipoSuporte.findUnique({
                where: { TipSupId: tipoSuporteId },
                include: {
                    Unidade: {
                        select: {
                            UnidadeId: true,
                            UnidadeNome: true,
                            UnidadeStatus: true
                        }
                    },
                    Chamado: {
                        select: {
                            ChamadoId: true,
                            ChamadoTitulo: true,
                            ChamadoStatus: true,
                            ChamadoDtAbertura: true
                        },
                        orderBy: {
                            ChamadoDtAbertura: 'desc'
                        },
                        take: 10
                    }
                }
            });

            if (!tipoSuporte) {
                return res.status(404).json({ error: 'Tipo de suporte não encontrado' });
            }

            // Verificar permissão de visualização para gestores
            if (usuarioLogado?.usuarioTipo === 'GESTOR') {
                const gestorLogado = await prisma.gestor.findUnique({
                    where: { GestorId: usuarioLogado.usuarioId }
                });

                if (gestorLogado && gestorLogado.UnidadeId !== tipoSuporte.UnidadeId) {
                    return res.status(403).json({
                        error: 'Você só pode visualizar tipos de suporte da sua própria unidade'
                    });
                }
            }

            res.status(200).json({
                data: tipoSuporte
            });

        } catch (error) {
            console.error('Erro ao buscar tipo de suporte:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Alterar apenas status do tipo de suporte (apenas gestores)
    async alterarStatusTipoSuporte(req, res) {
        try {
            const { id } = req.params;
            const { TipSupStatus } = req.body;
            const usuarioLogado = req.usuario;

            const tipoSuporteId = parseInt(id);
            if (isNaN(tipoSuporteId)) {
                return res.status(400).json({ error: 'ID do tipo de suporte inválido' });
            }

            // Validar status
            if (!TipSupStatus) {
                return res.status(400).json({ error: 'Status é obrigatório' });
            }

            const statusValidos = ['ATIVO', 'INATIVO'];
            if (!statusValidos.includes(TipSupStatus)) {
                return res.status(400).json({
                    error: 'Status inválido. Use: ATIVO ou INATIVO'
                });
            }

            // Verificar se o usuário é GESTOR
            if (usuarioLogado.usuarioTipo !== 'GESTOR') {
                return res.status(403).json({
                    error: 'Apenas gestores podem alterar status de tipos de suporte'
                });
            }

            // Buscar gestor logado
            const gestorLogado = await prisma.gestor.findUnique({
                where: { GestorId: usuarioLogado.usuarioId }
            });

            if (!gestorLogado) {
                return res.status(403).json({ error: 'Gestor não encontrado' });
            }

            // Verificar status do gestor
            if (gestorLogado.GestorStatus !== 'ATIVO') {
                return res.status(403).json({
                    error: 'Seu usuário gestor está inativo. Não é possível alterar status.'
                });
            }

            // Buscar tipo de suporte
            const tipoExistente = await prisma.tipoSuporte.findUnique({
                where: { TipSupId: tipoSuporteId },
                include: {
                    Unidade: true
                }
            });

            if (!tipoExistente) {
                return res.status(404).json({ error: 'Tipo de suporte não encontrado' });
            }

            // Verificar se o gestor pertence à mesma unidade do tipo de suporte
            if (gestorLogado.UnidadeId !== tipoExistente.UnidadeId) {
                return res.status(403).json({
                    error: 'Você só pode alterar status de tipos de suporte da sua própria unidade'
                });
            }

            // Verificar se a unidade está ativa
            if (tipoExistente.Unidade.UnidadeStatus !== 'ATIVA') {
                return res.status(400).json({
                    error: 'Não é possível alterar status de tipos de suporte de uma unidade inativa ou bloqueada'
                });
            }

            // Se for inativar, verificar se existem chamados em andamento
            if (TipSupStatus === 'INATIVO' && tipoExistente.TipSupStatus === 'ATIVO') {
                const chamadosEmAndamento = await prisma.chamado.count({
                    where: {
                        TipSupId: tipoSuporteId,
                        ChamadoStatus: {
                            notIn: ['CONCLUIDO', 'CANCELADO', 'RECUSADO']
                        }
                    }
                });

                if (chamadosEmAndamento > 0) {
                    return res.status(400).json({
                        error: 'Não é possível inativar um tipo de suporte com chamados em andamento'
                    });
                }
            }

            // Atualizar status
            const tipoAtualizado = await prisma.tipoSuporte.update({
                where: { TipSupId: tipoSuporteId },
                data: { TipSupStatus: TipSupStatus },
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

            res.status(200).json({
                message: 'Status do tipo de suporte atualizado com sucesso',
                data: tipoAtualizado
            });

        } catch (error) {
            console.error('Erro ao alterar status do tipo de suporte:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Listar tipos de suporte por unidade (para uso em selects)
    async listarTiposPorUnidade(req, res) {
        try {
            const { unidadeId } = req.params;
            const { apenasAtivos } = req.query;
            const usuarioLogado = req.usuario;

            const unidadeIdInt = parseInt(unidadeId);
            if (isNaN(unidadeIdInt)) {
                return res.status(400).json({ error: 'ID da unidade inválido' });
            }

            // Verificar permissão para gestores
            if (usuarioLogado?.usuarioTipo === 'GESTOR') {
                const gestorLogado = await prisma.gestor.findUnique({
                    where: { GestorId: usuarioLogado.usuarioId }
                });

                if (gestorLogado && gestorLogado.UnidadeId !== unidadeIdInt) {
                    return res.status(403).json({
                        error: 'Você só pode visualizar tipos de suporte da sua própria unidade'
                    });
                }
            }

            // Verificar se unidade existe
            const unidade = await prisma.unidade.findUnique({
                where: { UnidadeId: unidadeIdInt }
            });

            if (!unidade) {
                return res.status(404).json({ error: 'Unidade não encontrada' });
            }

            // Construir filtro
            const filtro = {
                UnidadeId: unidadeIdInt
            };

            if (apenasAtivos === 'true') {
                filtro.TipSupStatus = 'ATIVO';
            }

            // Buscar tipos de suporte
            const tipos = await prisma.tipoSuporte.findMany({
                where: filtro,
                orderBy: {
                    TipSupNom: 'asc'
                },
                select: {
                    TipSupId: true,
                    TipSupNom: true,
                    TipSupStatus: true,
                    _count: {
                        select: {
                            Chamado: true
                        }
                    }
                }
            });

            res.status(200).json({
                data: tipos
            });

        } catch (error) {
            console.error('Erro ao listar tipos de suporte por unidade:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new TipoSuporteController();