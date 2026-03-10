import { apiClient } from "./api";

export interface Tecnico {
  TecnicoId: number;
  TecnicoNome: string;
  TecnicoEmail?: string;
  TecnicoTelefone?: string;
  TecnicoCPF: string;
  TecnicoUsuario: string;
  TecnicoStatus: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  TecnicoDtCadastro: string;
  DepartamentoId: number;
  UnidadeId: number;
  Unidade?: {
    UnidadeId: number;
    UnidadeNome: string;
    UnidadeStatus: string;
  };
  Departamento?: {
    DepartamentoId: number;
    DepartamentoNome: string;
    DepartamentoStatus: string;
  };
  TecnicoEquipe?: Array<{
    TecEquId: number;
    TecEquStatus: string;
    Equipe: {
      EquipeId: number;
      EquipeNome: string;
      EquipeStatus: string;
    };
  }>;
  AtividadeChamado?: Array<{
    AtividadeId: number;
    ChamadoId: number;
    AtividadeDescricao: string;
    AtividadeDtRealizacao: string;
  }>;
  _count?: {
    AtividadeChamado: number;
    TecnicoEquipe: number;
  };
}

export interface TecnicoFilters {
  status?: string;
  departamentoId?: number;
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

export interface ListaTecnicosResponse {
  data: Tecnico[];
  paginacao: Paginacao;
}

export async function listarTecnicos(filters: TecnicoFilters = {}): Promise<ListaTecnicosResponse> {
  try {
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.departamentoId) params.append('departamentoId', filters.departamentoId.toString());
    if (filters.pagina) params.append('pagina', filters.pagina.toString());
    if (filters.limite) params.append('limite', filters.limite.toString());
    
    const response = await apiClient.get(`/tecnico?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao listar técnicos:', error);
    throw error;
  }
}

export async function buscarTecnicoPorId(id: number): Promise<Tecnico> {
  try {
    const response = await apiClient.get(`/tecnico/${id}`);
    return response.data.data;
  } catch (error) {
    console.error('Erro ao buscar técnico:', error);
    throw error;
  }
}

export async function cadastrarTecnico(data: {
  DepartamentoId: number;
  UnidadeId: number;
  TecnicoNome: string;
  TecnicoEmail?: string;
  TecnicoTelefone?: string;
  TecnicoCPF: string;
  TecnicoUsuario: string;
  TecnicoSenha: string;
  TecnicoStatus?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
}) {
  try {
    const response = await apiClient.post('/tecnico', data);
    return response.data;
  } catch (error) {
    console.error('Erro ao cadastrar técnico:', error);
    throw error;
  }
}

export async function alterarTecnico(
  id: number,
  data: {
    DepartamentoId?: number;
    UnidadeId?: number;
    TecnicoNome?: string;
    TecnicoEmail?: string | null;
    TecnicoTelefone?: string | null;
    TecnicoCPF?: string;
    TecnicoUsuario?: string;
    TecnicoSenha?: string;
    TecnicoStatus?: 'ATIVO' | 'INATIVO' | 'BLOQUEADO';
  }
) {
  try {
    const response = await apiClient.put(`/tecnico/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Erro ao alterar técnico:', error);
    throw error;
  }
}

export async function alterarStatusTecnico(id: number, status: string) {
  try {
    const response = await apiClient.patch(`/tecnico/${id}/status`, { TecnicoStatus: status });
    return response.data;
  } catch (error) {
    console.error('Erro ao alterar status do técnico:', error);
    throw error;
  }
}

export async function listarTecnicosPorUnidade(unidadeId: number, departamentoId?: number, apenasAtivos?: boolean) {
  try {
    const params = new URLSearchParams();
    if (departamentoId) params.append('departamentoId', departamentoId.toString());
    if (apenasAtivos) params.append('apenasAtivos', 'true');
    
    const response = await apiClient.get(`/tecnico/unidade/${unidadeId}?${params.toString()}`);
    return response.data.data;
  } catch (error) {
    console.error('Erro ao listar técnicos por unidade:', error);
    throw error;
  }
}