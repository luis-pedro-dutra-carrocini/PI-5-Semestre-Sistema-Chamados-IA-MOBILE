// src/controllers/chamadoController.js
const prisma = require('../prisma.js');

class ChamadoController {

    // Abrir novo chamado (apenas PESSOA)
    async abrirChamado(req, res) {
        try {
            const { PessoaId, UnidadeId, ChamadoDescricaoInicial } = req.body;
            const usuarioLogado = req.usuario;

            // Validações básicas
            if (!PessoaId) {
                return res.status(400).json({ error: 'ID da pessoa é obrigatório' });
            }

            if (!UnidadeId) {
                return res.status(400).json({ error: 'Unidade é obrigatória' });
            }

            if (!ChamadoDescricaoInicial || !ChamadoDescricaoInicial.trim()) {
                return res.status(400).json({ error: 'Descrição inicial do chamado é obrigatória' });
            }

            // Verificar se o usuário é PESSOA
            if (usuarioLogado.usuarioTipo !== 'PESSOA') {
                return res.status(403).json({
                    error: 'Apenas pessoas podem abrir chamados'
                });
            }

            // Verificar se a pessoa logada é a mesma que está abrindo o chamado
            if (usuarioLogado.usuarioId !== parseInt(PessoaId)) {
                return res.status(403).json({
                    error: 'Você só pode abrir chamados para você mesmo'
                });
            }

            // Buscar pessoa
            const pessoa = await prisma.pessoa.findUnique({
                where: { PessoaId: parseInt(PessoaId) },
                include: {
                    Unidade: true
                }
            });

            if (!pessoa) {
                return res.status(404).json({ error: 'Pessoa não encontrada' });
            }

            // Verificar se a pessoa está ativa
            if (pessoa.PessoaStatus !== 'ATIVA') {
                return res.status(403).json({
                    error: 'Sua conta está inativa ou bloqueada. Não é possível abrir chamados.'
                });
            }

            // Verificar se a unidade da pessoa corresponde à informada
            if (pessoa.UnidadeId !== parseInt(UnidadeId)) {
                return res.status(400).json({
                    error: 'A unidade informada não corresponde à unidade da pessoa'
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
                    error: 'Não é possível abrir chamados em uma unidade inativa ou bloqueada'
                });
            }

            // Criar chamado
            const chamado = await prisma.chamado.create({
                data: {
                    PessoaId: parseInt(PessoaId),
                    UnidadeId: parseInt(UnidadeId),
                    ChamadoDescricaoInicial: ChamadoDescricaoInicial.trim(),
                    ChamadoStatus: 'PENDENTE',
                    ChamadoDtAbertura: new Date()
                },
                include: {
                    Pessoa: {
                        select: {
                            PessoaId: true,
                            PessoaNome: true,
                            PessoaEmail: true,
                            PessoaTelefone: true
                        }
                    },
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
                message: 'Chamado aberto com sucesso',
                data: chamado
            });

        } catch (error) {
            console.error('Erro ao abrir chamado:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Alterar chamado (gestor OU técnico da equipe responsável OU pessoa que abriu - com restrições)
    async alterarChamado(req, res) {
        try {
            const { id } = req.params;
            const {
                TipSupId,
                EquipeId,
                ChamadoTitulo,
                ChamadoDescricaoFormatada,
                ChamadoPrioridade,
                ChamadoUrgencia,
                ChamadoStatus
            } = req.body;

            const usuarioLogado = req.usuario;
            const chamadoId = parseInt(id);

            if (isNaN(chamadoId)) {
                return res.status(400).json({ error: 'ID do chamado inválido' });
            }

            // Buscar chamado
            const chamadoExistente = await prisma.chamado.findUnique({
                where: { ChamadoId: chamadoId },
                include: {
                    Pessoa: true,
                    Unidade: true,
                    Equipe: {
                        include: {
                            TecnicoEquipe: {
                                where: {
                                    TecEquStatus: 'ATIVO'
                                },
                                include: {
                                    Tecnico: true
                                }
                            }
                        }
                    }
                }
            });

            if (!chamadoExistente) {
                return res.status(404).json({ error: 'Chamado não encontrado' });
            }

            // Verificar permissões
            let podeAlterar = false;
            let tipoAcesso = '';

            // Caso 1: Pessoa que abriu o chamado
            if (usuarioLogado.usuarioTipo === 'PESSOA' && usuarioLogado.usuarioId === chamadoExistente.PessoaId) {
                podeAlterar = true;
                tipoAcesso = 'PESSOA';

                // Pessoa não pode alterar campos restritos
                if (TipSupId !== undefined || EquipeId !== undefined || ChamadoPrioridade !== undefined || 
                    ChamadoUrgencia !== undefined || ChamadoStatus !== undefined) {
                    return res.status(403).json({
                        error: 'Você não pode alterar tipo de suporte, equipe, prioridade, urgência ou status do chamado'
                    });
                }
            }

            // Caso 2: Gestor da unidade
            else if (usuarioLogado.usuarioTipo === 'GESTOR') {
                const gestorLogado = await prisma.gestor.findUnique({
                    where: { GestorId: usuarioLogado.usuarioId }
                });

                if (gestorLogado && gestorLogado.UnidadeId === chamadoExistente.UnidadeId) {
                    podeAlterar = true;
                    tipoAcesso = 'GESTOR';
                }
            }

            // Caso 3: Técnico da equipe responsável
            else if (usuarioLogado.usuarioTipo === 'TECNICO' && chamadoExistente.EquipeId) {
                // Verificar se o técnico pertence à equipe responsável
                const tecnicoEquipe = await prisma.tecnicoEquipe.findFirst({
                    where: {
                        TecnicoId: usuarioLogado.usuarioId,
                        EquipeId: chamadoExistente.EquipeId,
                        TecEquStatus: 'ATIVO'
                    }
                });

                if (tecnicoEquipe) {
                    podeAlterar = true;
                    tipoAcesso = 'TECNICO';

                    // Técnico não pode alterar certos campos
                    if (TipSupId !== undefined || EquipeId !== undefined) {
                        return res.status(403).json({
                            error: 'Técnicos não podem alterar tipo de suporte ou equipe do chamado'
                        });
                    }
                }
            }

            if (!podeAlterar) {
                return res.status(403).json({
                    error: 'Você não tem permissão para alterar este chamado'
                });
            }

            // Preparar dados para atualização
            const dadosAtualizacao = {};

            // Validar e adicionar campos de acordo com o tipo de acesso
            if (TipSupId !== undefined && tipoAcesso === 'GESTOR') {
                // Verificar se o tipo de suporte existe e pertence à unidade
                if (TipSupId) {
                    const tipoSuporte = await prisma.tipoSuporte.findFirst({
                        where: {
                            TipSupId: parseInt(TipSupId),
                            UnidadeId: chamadoExistente.UnidadeId,
                            TipSupStatus: 'ATIVO'
                        }
                    });

                    if (!tipoSuporte) {
                        return res.status(404).json({ 
                            error: 'Tipo de suporte não encontrado ou não pertence à unidade' 
                        });
                    }
                }
                dadosAtualizacao.TipSupId = TipSupId ? parseInt(TipSupId) : null;
            }

            if (EquipeId !== undefined && tipoAcesso === 'GESTOR') {
                // Verificar se a equipe existe e pertence à unidade
                if (EquipeId) {
                    const equipe = await prisma.equipe.findFirst({
                        where: {
                            EquipeId: parseInt(EquipeId),
                            UnidadeId: chamadoExistente.UnidadeId,
                            EquipeStatus: 'ATIVA'
                        }
                    });

                    if (!equipe) {
                        return res.status(404).json({ 
                            error: 'Equipe não encontrada ou não pertence à unidade' 
                        });
                    }
                }
                dadosAtualizacao.EquipeId = EquipeId ? parseInt(EquipeId) : null;
            }

            if (ChamadoTitulo !== undefined) {
                if (!ChamadoTitulo.trim()) {
                    return res.status(400).json({ error: 'Título do chamado não pode ser vazio' });
                }
                dadosAtualizacao.ChamadoTitulo = ChamadoTitulo.trim();
            }

            if (ChamadoDescricaoFormatada !== undefined) {
                dadosAtualizacao.ChamadoDescricaoFormatada = ChamadoDescricaoFormatada?.trim() || null;
            }

            if (ChamadoPrioridade !== undefined && tipoAcesso !== 'PESSOA') {
                const prioridade = parseInt(ChamadoPrioridade);
                if (isNaN(prioridade) || prioridade < 1 || prioridade > 10) {
                    return res.status(400).json({ 
                        error: 'Prioridade deve ser um número entre 1 e 10' 
                    });
                }
                dadosAtualizacao.ChamadoPrioridade = prioridade;
            }

            if (ChamadoUrgencia !== undefined && tipoAcesso !== 'PESSOA') {
                const urgenciasValidas = ['BAIXA', 'MEDIA', 'ALTA', 'URGENTE'];
                if (!urgenciasValidas.includes(ChamadoUrgencia)) {
                    return res.status(400).json({ 
                        error: 'Urgência inválida. Use: BAIXA, MEDIA, ALTA ou URGENTE' 
                    });
                }
                dadosAtualizacao.ChamadoUrgencia = ChamadoUrgencia;
            }

            if (ChamadoStatus !== undefined && tipoAcesso !== 'PESSOA') {
                const statusValidos = ['PENDENTE', 'ANALISADO', 'ATRIBUIDO', 'EMATENDIMENTO', 'CONCLUIDO', 'CANCELADO', 'RECUSADO'];
                if (!statusValidos.includes(ChamadoStatus)) {
                    return res.status(400).json({ 
                        error: 'Status inválido' 
                    });
                }

                // Se for concluir, adicionar data de encerramento
                if (ChamadoStatus === 'CONCLUIDO' && chamadoExistente.ChamadoStatus !== 'CONCLUIDO') {
                    dadosAtualizacao.ChamadoDtEncerramento = new Date();
                }

                // Se for cancelar/recusar, adicionar data de encerramento
                if ((ChamadoStatus === 'CANCELADO' || ChamadoStatus === 'RECUSADO') && 
                    chamadoExistente.ChamadoStatus !== 'CANCELADO' && 
                    chamadoExistente.ChamadoStatus !== 'RECUSADO') {
                    dadosAtualizacao.ChamadoDtEncerramento = new Date();
                }

                dadosAtualizacao.ChamadoStatus = ChamadoStatus;
            }

            // Verificar se há dados para atualizar
            if (Object.keys(dadosAtualizacao).length === 0) {
                return res.status(400).json({ error: 'Nenhum dado fornecido para atualização' });
            }

            // Atualizar chamado
            const chamadoAtualizado = await prisma.chamado.update({
                where: { ChamadoId: chamadoId },
                data: dadosAtualizacao,
                include: {
                    Pessoa: {
                        select: {
                            PessoaId: true,
                            PessoaNome: true,
                            PessoaEmail: true,
                            PessoaTelefone: true
                        }
                    },
                    Unidade: {
                        select: {
                            UnidadeId: true,
                            UnidadeNome: true,
                            UnidadeStatus: true
                        }
                    },
                    TipoSuporte: {
                        select: {
                            TipSupId: true,
                            TipSupNom: true
                        }
                    },
                    Equipe: {
                        select: {
                            EquipeId: true,
                            EquipeNome: true
                        }
                    }
                }
            });

            res.status(200).json({
                message: 'Chamado atualizado com sucesso',
                data: chamadoAtualizado
            });

        } catch (error) {
            console.error('Erro ao alterar chamado:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Listar chamados com filtros
    async listarChamados(req, res) {
        try {
            const {
                unidadeId,
                pessoaId,
                equipeId,
                tipoSuporteId,
                status,
                urgencia,
                prioridadeMin,
                prioridadeMax,
                dataInicio,
                dataFim,
                pagina = 1,
                limite = 10
            } = req.query;

            const usuarioLogado = req.usuario;

            // Construir filtro base
            const filtro = {};

            // Aplicar filtros de acordo com permissão
            if (usuarioLogado.usuarioTipo === 'PESSOA') {
                // Pessoa só vê seus próprios chamados
                filtro.PessoaId = usuarioLogado.usuarioId;
            }
            else if (usuarioLogado.usuarioTipo === 'TECNICO') {
                // Técnico vê chamados da sua unidade OU atribuídos à sua equipe
                const tecnico = await prisma.tecnico.findUnique({
                    where: { TecnicoId: usuarioLogado.usuarioId },
                    include: {
                        TecnicoEquipe: {
                            where: {
                                TecEquStatus: 'ATIVO'
                            },
                            select: {
                                EquipeId: true
                            }
                        }
                    }
                });

                if (tecnico) {
                    filtro.OR = [
                        { UnidadeId: tecnico.UnidadeId },
                        { EquipeId: { in: tecnico.TecnicoEquipe.map(te => te.EquipeId) } }
                    ];
                }
            }
            else if (usuarioLogado.usuarioTipo === 'GESTOR') {
                const gestor = await prisma.gestor.findUnique({
                    where: { GestorId: usuarioLogado.usuarioId }
                });

                if (gestor) {
                    // Gestor vê chamados da sua unidade
                    filtro.UnidadeId = gestor.UnidadeId;
                }
            }

            // Aplicar filtros da query (sobrescrevem os automáticos se tiver permissão)
            if (usuarioLogado.usuarioTipo === 'ADMINISTRADOR' && unidadeId) {
                filtro.UnidadeId = parseInt(unidadeId);
            }

            if (pessoaId && (usuarioLogado.usuarioTipo === 'ADMINISTRADOR' || usuarioLogado.usuarioTipo === 'GESTOR')) {
                filtro.PessoaId = parseInt(pessoaId);
            }

            if (equipeId && (usuarioLogado.usuarioTipo === 'ADMINISTRADOR' || usuarioLogado.usuarioTipo === 'GESTOR')) {
                filtro.EquipeId = parseInt(equipeId);
            }

            if (tipoSuporteId) {
                filtro.TipSupId = parseInt(tipoSuporteId);
            }

            if (status) {
                const statusArray = status.split(',');
                filtro.ChamadoStatus = { in: statusArray };
            }

            if (urgencia) {
                const urgenciaArray = urgencia.split(',');
                filtro.ChamadoUrgencia = { in: urgenciaArray };
            }

            if (prioridadeMin || prioridadeMax) {
                filtro.ChamadoPrioridade = {};
                if (prioridadeMin) filtro.ChamadoPrioridade.gte = parseInt(prioridadeMin);
                if (prioridadeMax) filtro.ChamadoPrioridade.lte = parseInt(prioridadeMax);
            }

            if (dataInicio || dataFim) {
                filtro.ChamadoDtAbertura = {};
                if (dataInicio) {
                    const inicio = new Date(dataInicio);
                    inicio.setHours(0, 0, 0, 0);
                    filtro.ChamadoDtAbertura.gte = inicio;
                }
                if (dataFim) {
                    const fim = new Date(dataFim);
                    fim.setHours(23, 59, 59, 999);
                    filtro.ChamadoDtAbertura.lte = fim;
                }
            }

            // Calcular paginação
            const paginaAtual = parseInt(pagina);
            const limitePorPagina = parseInt(limite);
            const skip = (paginaAtual - 1) * limitePorPagina;

            // Buscar chamados
            const [chamados, total] = await prisma.$transaction([
                prisma.chamado.findMany({
                    where: filtro,
                    orderBy: [
                        { ChamadoDtAbertura: 'desc' }
                    ],
                    skip: skip,
                    take: limitePorPagina,
                    include: {
                        Pessoa: {
                            select: {
                                PessoaId: true,
                                PessoaNome: true,
                                PessoaEmail: true,
                                PessoaTelefone: true
                            }
                        },
                        Unidade: {
                            select: {
                                UnidadeId: true,
                                UnidadeNome: true
                            }
                        },
                        TipoSuporte: {
                            select: {
                                TipSupId: true,
                                TipSupNom: true
                            }
                        },
                        Equipe: {
                            select: {
                                EquipeId: true,
                                EquipeNome: true
                            }
                        },
                        _count: {
                            select: {
                                AtividadeChamado: true
                            }
                        }
                    }
                }),
                prisma.chamado.count({ where: filtro })
            ]);

            res.status(200).json({
                data: chamados,
                paginacao: {
                    paginaAtual,
                    limitePorPagina,
                    totalRegistros: total,
                    totalPaginas: Math.ceil(total / limitePorPagina)
                }
            });

        } catch (error) {
            console.error('Erro ao listar chamados:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Buscar chamado por ID
    async buscarChamadoPorId(req, res) {
        try {
            const { id } = req.params;
            const usuarioLogado = req.usuario;

            const chamadoId = parseInt(id);
            if (isNaN(chamadoId)) {
                return res.status(400).json({ error: 'ID do chamado inválido' });
            }

            // Buscar chamado
            const chamado = await prisma.chamado.findUnique({
                where: { ChamadoId: chamadoId },
                include: {
                    Pessoa: {
                        select: {
                            PessoaId: true,
                            PessoaNome: true,
                            PessoaEmail: true,
                            PessoaTelefone: true
                        }
                    },
                    Unidade: {
                        select: {
                            UnidadeId: true,
                            UnidadeNome: true,
                            UnidadeStatus: true
                        }
                    },
                    TipoSuporte: {
                        select: {
                            TipSupId: true,
                            TipSupNom: true,
                            TipSupStatus: true
                        }
                    },
                    Equipe: {
                        select: {
                            EquipeId: true,
                            EquipeNome: true,
                            EquipeStatus: true,
                            TecnicoEquipe: {
                                where: {
                                    TecEquStatus: 'ATIVO'
                                },
                                include: {
                                    Tecnico: {
                                        select: {
                                            TecnicoId: true,
                                            TecnicoNome: true,
                                            TecnicoEmail: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    AtividadeChamado: {
                        orderBy: {
                            AtividadeDtRealizacao: 'desc'
                        },
                        include: {
                            Tecnico: {
                                select: {
                                    TecnicoId: true,
                                    TecnicoNome: true
                                }
                            }
                        }
                    }
                }
            });

            if (!chamado) {
                return res.status(404).json({ error: 'Chamado não encontrado' });
            }

            // Verificar permissão de visualização
            let podeVisualizar = false;

            if (usuarioLogado.usuarioTipo === 'PESSOA') {
                podeVisualizar = (usuarioLogado.usuarioId === chamado.PessoaId);
            }
            else if (usuarioLogado.usuarioTipo === 'TECNICO') {
                // Técnico pode ver se é da mesma unidade OU da equipe responsável
                const tecnico = await prisma.tecnico.findUnique({
                    where: { TecnicoId: usuarioLogado.usuarioId },
                    include: {
                        TecnicoEquipe: {
                            where: {
                                TecEquStatus: 'ATIVO'
                            },
                            select: {
                                EquipeId: true
                            }
                        }
                    }
                });

                if (tecnico) {
                    podeVisualizar = (tecnico.UnidadeId === chamado.UnidadeId) ||
                        (chamado.EquipeId && tecnico.TecnicoEquipe.some(te => te.EquipeId === chamado.EquipeId));
                }
            }
            else if (usuarioLogado.usuarioTipo === 'GESTOR') {
                const gestor = await prisma.gestor.findUnique({
                    where: { GestorId: usuarioLogado.usuarioId }
                });

                if (gestor) {
                    podeVisualizar = (gestor.UnidadeId === chamado.UnidadeId);
                }
            }
            else if (usuarioLogado.usuarioTipo === 'ADMINISTRADOR') {
                podeVisualizar = true;
            }

            if (!podeVisualizar) {
                return res.status(403).json({
                    error: 'Você não tem permissão para visualizar este chamado'
                });
            }

            res.status(200).json({
                data: chamado
            });

        } catch (error) {
            console.error('Erro ao buscar chamado:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Atribuir chamado a uma equipe (apenas gestor)
    async atribuirEquipe(req, res) {
        try {
            const { id } = req.params;
            const { EquipeId } = req.body;
            const usuarioLogado = req.usuario;

            const chamadoId = parseInt(id);
            if (isNaN(chamadoId)) {
                return res.status(400).json({ error: 'ID do chamado inválido' });
            }

            if (!EquipeId) {
                return res.status(400).json({ error: 'ID da equipe é obrigatório' });
            }

            // Verificar se é gestor
            if (usuarioLogado.usuarioTipo !== 'GESTOR') {
                return res.status(403).json({
                    error: 'Apenas gestores podem atribuir equipes a chamados'
                });
            }

            // Buscar gestor
            const gestor = await prisma.gestor.findUnique({
                where: { GestorId: usuarioLogado.usuarioId }
            });

            if (!gestor || gestor.GestorStatus !== 'ATIVO') {
                return res.status(403).json({ error: 'Gestor não encontrado ou inativo' });
            }

            // Buscar chamado
            const chamado = await prisma.chamado.findUnique({
                where: { ChamadoId: chamadoId }
            });

            if (!chamado) {
                return res.status(404).json({ error: 'Chamado não encontrado' });
            }

            // Verificar se o chamado é da unidade do gestor
            if (chamado.UnidadeId !== gestor.UnidadeId) {
                return res.status(403).json({
                    error: 'Você só pode atribuir equipes a chamados da sua unidade'
                });
            }

            // Verificar se a equipe existe e pertence à unidade
            const equipe = await prisma.equipe.findFirst({
                where: {
                    EquipeId: parseInt(EquipeId),
                    UnidadeId: gestor.UnidadeId,
                    EquipeStatus: 'ATIVA'
                }
            });

            if (!equipe) {
                return res.status(404).json({ 
                    error: 'Equipe não encontrada ou não pertence à unidade' 
                });
            }

            // Atualizar chamado
            const chamadoAtualizado = await prisma.chamado.update({
                where: { ChamadoId: chamadoId },
                data: {
                    EquipeId: parseInt(EquipeId),
                    ChamadoStatus: chamado.ChamadoStatus === 'PENDENTE' ? 'ANALISADO' : chamado.ChamadoStatus
                },
                include: {
                    Equipe: {
                        select: {
                            EquipeId: true,
                            EquipeNome: true
                        }
                    }
                }
            });

            res.status(200).json({
                message: 'Equipe atribuída ao chamado com sucesso',
                data: chamadoAtualizado
            });

        } catch (error) {
            console.error('Erro ao atribuir equipe:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Alterar status do chamado (com validações de fluxo)
    async alterarStatus(req, res) {
        try {
            const { id } = req.params;
            const { ChamadoStatus } = req.body;
            const usuarioLogado = req.usuario;

            const chamadoId = parseInt(id);
            if (isNaN(chamadoId)) {
                return res.status(400).json({ error: 'ID do chamado inválido' });
            }

            // Validar status
            if (!ChamadoStatus) {
                return res.status(400).json({ error: 'Status é obrigatório' });
            }

            const statusValidos = ['PENDENTE', 'ANALISADO', 'ATRIBUIDO', 'EMATENDIMENTO', 'CONCLUIDO', 'CANCELADO', 'RECUSADO'];
            if (!statusValidos.includes(ChamadoStatus)) {
                return res.status(400).json({ error: 'Status inválido' });
            }

            // Buscar chamado
            const chamado = await prisma.chamado.findUnique({
                where: { ChamadoId: chamadoId },
                include: {
                    Equipe: {
                        include: {
                            TecnicoEquipe: {
                                where: {
                                    TecEquStatus: 'ATIVO'
                                }
                            }
                        }
                    }
                }
            });

            if (!chamado) {
                return res.status(404).json({ error: 'Chamado não encontrado' });
            }

            // Verificar permissões
            let podeAlterarStatus = false;

            // Gestor pode alterar qualquer status
            if (usuarioLogado.usuarioTipo === 'GESTOR') {
                const gestor = await prisma.gestor.findUnique({
                    where: { GestorId: usuarioLogado.usuarioId }
                });

                if (gestor && gestor.UnidadeId === chamado.UnidadeId) {
                    podeAlterarStatus = true;
                }
            }
            // Técnico da equipe responsável pode alterar (exceto cancelar/recusar)
            else if (usuarioLogado.usuarioTipo === 'TECNICO' && chamado.EquipeId) {
                const tecnicoEquipe = await prisma.tecnicoEquipe.findFirst({
                    where: {
                        TecnicoId: usuarioLogado.usuarioId,
                        EquipeId: chamado.EquipeId,
                        TecEquStatus: 'ATIVO'
                    }
                });

                if (tecnicoEquipe) {
                    // Técnico não pode cancelar ou recusar
                    if (ChamadoStatus === 'CANCELADO' || ChamadoStatus === 'RECUSADO') {
                        return res.status(403).json({
                            error: 'Técnicos não podem cancelar ou recusar chamados'
                        });
                    }
                    podeAlterarStatus = true;
                }
            }

            if (!podeAlterarStatus) {
                return res.status(403).json({
                    error: 'Você não tem permissão para alterar o status deste chamado'
                });
            }

            // Validar transições de status
            const transicoesValidas = {
                'PENDENTE': ['ANALISADO', 'CANCELADO'],
                'ANALISADO': ['ATRIBUIDO', 'PENDENTE', 'CANCELADO'],
                'ATRIBUIDO': ['EMATENDIMENTO', 'ANALISADO', 'CANCELADO'],
                'EMATENDIMENTO': ['CONCLUIDO', 'ATRIBUIDO', 'CANCELADO'],
                'CONCLUIDO': [],
                'CANCELADO': [],
                'RECUSADO': []
            };

            if (!transicoesValidas[chamado.ChamadoStatus].includes(ChamadoStatus)) {
                return res.status(400).json({
                    error: `Não é possível mudar de ${chamado.ChamadoStatus} para ${ChamadoStatus}`
                });
            }

            // Preparar dados para atualização
            const dadosAtualizacao = { ChamadoStatus };

            // Se for concluir, adicionar data de encerramento
            if (ChamadoStatus === 'CONCLUIDO' && chamado.ChamadoStatus !== 'CONCLUIDO') {
                dadosAtualizacao.ChamadoDtEncerramento = new Date();
            }

            // Se for cancelar/recusar, adicionar data de encerramento
            if ((ChamadoStatus === 'CANCELADO' || ChamadoStatus === 'RECUSADO') && 
                chamado.ChamadoStatus !== 'CANCELADO' && 
                chamado.ChamadoStatus !== 'RECUSADO') {
                dadosAtualizacao.ChamadoDtEncerramento = new Date();
            }

            // Atualizar chamado
            const chamadoAtualizado = await prisma.chamado.update({
                where: { ChamadoId: chamadoId },
                data: dadosAtualizacao,
                include: {
                    Pessoa: {
                        select: {
                            PessoaId: true,
                            PessoaNome: true
                        }
                    },
                    Equipe: {
                        select: {
                            EquipeId: true,
                            EquipeNome: true
                        }
                    }
                }
            });

            res.status(200).json({
                message: 'Status do chamado atualizado com sucesso',
                data: chamadoAtualizado
            });

        } catch (error) {
            console.error('Erro ao alterar status:', error);
            res.status(500).json({ error: error.message });
        }
    }

    // Estatísticas de chamados
    async estatisticas(req, res) {
        try {
            const { unidadeId, periodo } = req.query;
            const usuarioLogado = req.usuario;

            // Definir período (padrão: últimos 30 dias)
            const dataFim = new Date();
            const dataInicio = new Date();
            
            if (periodo === '7d') {
                dataInicio.setDate(dataInicio.getDate() - 7);
            } else if (periodo === '30d') {
                dataInicio.setDate(dataInicio.getDate() - 30);
            } else if (periodo === '90d') {
                dataInicio.setDate(dataInicio.getDate() - 90);
            } else {
                dataInicio.setDate(dataInicio.getDate() - 30); // padrão 30 dias
            }

            dataInicio.setHours(0, 0, 0, 0);
            dataFim.setHours(23, 59, 59, 999);

            // Construir filtro base
            const filtro = {
                ChamadoDtAbertura: {
                    gte: dataInicio,
                    lte: dataFim
                }
            };

            // Aplicar filtros de acordo com permissão
            if (usuarioLogado.usuarioTipo === 'GESTOR') {
                const gestor = await prisma.gestor.findUnique({
                    where: { GestorId: usuarioLogado.usuarioId }
                });

                if (gestor) {
                    filtro.UnidadeId = gestor.UnidadeId;
                }
            } else if (usuarioLogado.usuarioTipo === 'TECNICO') {
                const tecnico = await prisma.tecnico.findUnique({
                    where: { TecnicoId: usuarioLogado.usuarioId }
                });

                if (tecnico) {
                    filtro.UnidadeId = tecnico.UnidadeId;
                }
            }

            // Aplicar filtro de unidade se fornecido (apenas admin)
            if (unidadeId && usuarioLogado.usuarioTipo === 'ADMINISTRADOR') {
                filtro.UnidadeId = parseInt(unidadeId);
            }

            // Buscar estatísticas
            const [
                totalChamados,
                porStatus,
                porUrgencia,
                tempoMedioResolucao
            ] = await Promise.all([
                // Total de chamados no período
                prisma.chamado.count({ where: filtro }),

                // Chamados por status
                prisma.chamado.groupBy({
                    by: ['ChamadoStatus'],
                    where: filtro,
                    _count: true
                }),

                // Chamados por urgência
                prisma.chamado.groupBy({
                    by: ['ChamadoUrgencia'],
                    where: {
                        ...filtro,
                        ChamadoUrgencia: { not: null }
                    },
                    _count: true
                }),

                // Tempo médio de resolução (chamados concluídos)
                prisma.chamado.aggregate({
                    where: {
                        ...filtro,
                        ChamadoStatus: 'CONCLUIDO',
                        ChamadoDtEncerramento: { not: null }
                    },
                    _avg: {
                        // Calcular diferença em horas
                        // Isso é um exemplo - pode precisar de ajustes
                    }
                })
            ]);

            res.status(200).json({
                data: {
                    periodo: {
                        dataInicio,
                        dataFim
                    },
                    total: totalChamados,
                    porStatus: porStatus.reduce((acc, curr) => {
                        acc[curr.ChamadoStatus] = curr._count;
                        return acc;
                    }, {}),
                    porUrgencia: porUrgencia.reduce((acc, curr) => {
                        acc[curr.ChamadoUrgencia] = curr._count;
                        return acc;
                    }, {})
                }
            });

        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new ChamadoController();