import { apiClient } from "./api";

export interface Atividade {
  AtividadeId: number;
  AtividadeDescricao: string;
  AtividadeObservacao?: string;
  AtividadeDtRealizacao: string;
  Tecnico?: {
    TecnicoId: number;
    TecnicoNome: string;
  };
}

export interface Chamado {
  ChamadoId: number;
  ChamadoTitulo: string;
  ChamadoDescricaoFormatada?: string;
  ChamadoPrioridade?: number;
  ChamadoUrgencia?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  ChamadoStatus: 'PENDENTE' | 'ANALISADO' | 'ATRIBUIDO' | 'EMATENDIMENTO' | 'CONCLUIDO' | 'CANCELADO' | 'RECUSADO' | 'FALTAINFORMACAO';
  ChamadoDtAbertura: string;
  ChamadoDtEncerramento?: string;
  ChamadoDtPlanejada?: string;
  ChamadoDescricaoInicial?: string;
  PessoaId: number;
  UnidadeId: number;
  TipSupId?: number;
  EquipeId?: number;
  AtividadeChamado?: Atividade[];
  ChamadoDiasComProblema: 0;
  ChamadoRiscoVidaHumana: false;
  ChamadoRiscoVidaAnimal: false;
  ChamadoBloqueioVia: false;
  Pessoa: {
    PessoaId: number;
    PessoaNome: string;
    PessoaEmail?: string;
    PessoaTelefone?: string;
  };
  Unidade: {
    UnidadeId: number;
    UnidadeNome: string;
  };
  TipoSuporte?: {
    TipSupId: number;
    TipSupNom: string;
  };
  Equipe?: {
    EquipeId: number;
    EquipeNome: string;
  };
  _count?: {
    AtividadeChamado: number;
  };
}

export interface ChamadoFilters {
  status?: string;
  urgencia?: string;
  tipoSuporteId?: number;
  equipeId?: number;
  pessoaId?: number;
  dataInicio?: string;
  dataFim?: string;
  prioridadeMin?: number;
  prioridadeMax?: number;
  pagina?: number;
  limite?: number;
  busca?: string;
}

export interface Paginacao {
  paginaAtual: number;
  limitePorPagina: number;
  totalRegistros: number;
  totalPaginas: number;
}

export interface ListaChamadosResponse {
  data: Chamado[];
  paginacao: Paginacao;
}

export interface Estatisticas {
  periodo: {
    dataInicio: string;
    dataFim: string;
  };
  total: number;
  porStatus: Record<string, number>;
  porUrgencia: Record<string, number>;
}

export async function listarChamados(filters: ChamadoFilters = {}): Promise<ListaChamadosResponse> {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.urgencia) params.append('urgencia', filters.urgencia);
    if (filters.tipoSuporteId) params.append('tipoSuporteId', filters.tipoSuporteId.toString());
    if (filters.equipeId) params.append('equipeId', filters.equipeId.toString());
    if (filters.pessoaId) params.append('pessoaId', filters.pessoaId.toString());
    if (filters.dataInicio) params.append('dataInicio', filters.dataInicio);
    if (filters.dataFim) params.append('dataFim', filters.dataFim);
    if (filters.prioridadeMin) params.append('prioridadeMin', filters.prioridadeMin.toString());
    if (filters.prioridadeMax) params.append('prioridadeMax', filters.prioridadeMax.toString());
    if (filters.pagina) params.append('pagina', filters.pagina.toString());
    if (filters.limite) params.append('limite', filters.limite.toString());
    
    const response = await apiClient.get(`/chamado?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao listar chamados:', error);
    throw error;
  }
}

export async function buscarChamadoPorId(id: number): Promise<Chamado> {
  try {
    const response = await apiClient.get(`/chamado/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar chamado:', error);
    throw error;
  }
}

export async function alterarChamado(
  id: number,
  data: {
    TipSupId?: number | null;
    EquipeId?: number | null;
    ChamadoTitulo?: string;
    ChamadoDescricaoInicial?: string;
    ChamadoPrioridade?: number;
    ChamadoUrgencia?: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
    ChamadoStatus?: string;

  }
) {
  try {
    const response = await apiClient.put(`/chamado/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Erro ao alterar chamado:', error);
    throw error;
  }
}

export async function atribuirEquipe(id: number, equipeId: number) {
  try {
    const response = await apiClient.patch(`/chamado/${id}/atribuir-equipe`, { EquipeId: equipeId });
    return response.data;
  } catch (error) {
    console.error('Erro ao atribuir equipe:', error);
    throw error;
  }
}

export async function alterarStatus(id: number, status: string, motivoRecusa?: string) {
  try {
    const response = await apiClient.patch(`/chamado/${id}/status`, { ChamadoStatus: status, ChamadoDescricaoFormatada: motivoRecusa });
    return response.data;
  } catch (error) {
    console.error('Erro ao alterar status:', error);
    throw error;
  }
}

export async function getEstatisticas(periodo?: string) {
  try {
    const params = periodo ? `?periodo=${periodo}` : '';
    console.log('Buscando estatísticas com período:', periodo);
    const response = await apiClient.get(`/chamado/estatisticas${params}`);
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    throw error;
  }
}