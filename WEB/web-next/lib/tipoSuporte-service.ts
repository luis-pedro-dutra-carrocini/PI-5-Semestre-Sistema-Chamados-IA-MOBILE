import { apiClient } from "./api";

export interface TipoSuporte {
  TipSupId: number;
  TipSupNom: string;
  TipSupStatus: 'ATIVO' | 'INATIVO';
  TipSupDtCadastro: string;
  UnidadeId: number;
  Unidade?: {
    UnidadeId: number;
    UnidadeNome: string;
    UnidadeStatus: string;
  };
  _count?: {
    Chamado: number;
  };
  // ADICIONE esta propriedade
  Chamado?: Array<{
    ChamadoId: number;
    ChamadoTitulo: string;
    ChamadoStatus: string;
    ChamadoDtAbertura: string;
  }>;
}

export interface TipoSuporteFilters {
  status?: string;
  nome?: string;
  unidadeId?: number;
  pagina?: number;
  limite?: number;
  apenasAtivos?: boolean;
}

export interface Paginacao {
  paginaAtual: number;
  limitePorPagina: number;
  totalRegistros: number;
  totalPaginas: number;
}

export interface ListaTiposSuporteResponse {
  data: TipoSuporte[];
  paginacao: Paginacao;
}

export async function listarTiposSuporte(filters: TipoSuporteFilters = {}): Promise<ListaTiposSuporteResponse> {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.nome) params.append('nome', filters.nome);
    if (filters.unidadeId) params.append('unidadeId', filters.unidadeId.toString());
    if (filters.pagina) params.append('pagina', filters.pagina.toString());
    if (filters.limite) params.append('limite', filters.limite.toString());
    if (filters.apenasAtivos) params.append('apenasAtivos', 'true');
    
    const response = await apiClient.get(`/tiposuporte?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao listar tipos de suporte:', error);
    throw error;
  }
}

export async function buscarTipoSuportePorId(id: number): Promise<TipoSuporte> {
  try {
    const response = await apiClient.get(`/tiposuporte/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar tipo de suporte:', error);
    throw error;
  }
}

export async function listarTiposPorUnidade(unidadeId: number, apenasAtivos?: boolean): Promise<TipoSuporte[]> {
  try {
    const params = new URLSearchParams();
    if (apenasAtivos) params.append('apenasAtivos', 'true');
    
    const response = await apiClient.get(`/tiposuporte/unidade/${unidadeId}?${params.toString()}`);
    return response.data.data;
  } catch (error) {
    console.error('Erro ao listar tipos por unidade:', error);
    throw error;
  }
}

export async function cadastrarTipoSuporte(data: {
  UnidadeId: number;
  TipSupNom: string;
  TipSupStatus?: 'ATIVO' | 'INATIVO';
}) {
  try {
    const response = await apiClient.post('/tiposuporte', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao cadastrar tipo de suporte:', error);
    throw error;
  }
}

export async function alterarTipoSuporte(
  id: number,
  data: {
    TipSupNom?: string;
    TipSupStatus?: 'ATIVO' | 'INATIVO';
  }
) {
  try {
    const response = await apiClient.put(`/tiposuporte/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Erro ao alterar tipo de suporte:', error);
    throw error;
  }
}

export async function alterarStatusTipoSuporte(id: number, status: string) {
  try {
    const response = await apiClient.patch(`/tiposuporte/${id}/status`, { TipSupStatus: status });
    return response.data;
  } catch (error) {
    console.error('Erro ao alterar status do tipo de suporte:', error);
    throw error;
  }
}