"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Ticket,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  HelpCircle,
  PlayCircle,
  PauseCircle,
  Calendar,
  Users,
  Briefcase,
  AlertTriangle,
  TrendingUp,
  BarChart3
} from "lucide-react"
import { listarChamados, getEstatisticas, type Chamado, type ChamadoFilters, type Estatisticas } from "@/lib/chamado-service"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Componente de Status Badge
function StatusBadge({ status }: { status: string }) {
  const styles = {
    PENDENTE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    ANALISADO: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    ATRIBUIDO: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
    EMATENDIMENTO: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    CONCLUIDO: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    CANCELADO: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
    RECUSADO: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  };
  
  const icons = {
    PENDENTE: <Clock size={14} className="mr-1" />,
    ANALISADO: <Search size={14} className="mr-1" />,
    ATRIBUIDO: <Users size={14} className="mr-1" />,
    EMATENDIMENTO: <PlayCircle size={14} className="mr-1" />,
    CONCLUIDO: <CheckCircle size={14} className="mr-1" />,
    CANCELADO: <XCircle size={14} className="mr-1" />,
    RECUSADO: <AlertCircle size={14} className="mr-1" />
  };

  const labels = {
    PENDENTE: 'Pendente',
    ANALISADO: 'Analisado',
    ATRIBUIDO: 'Atribuído',
    EMATENDIMENTO: 'Em Atendimento',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
    RECUSADO: 'Recusado'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
      {icons[status as keyof typeof icons]}
      {labels[status as keyof typeof labels]}
    </span>
  );
}

// Componente de Urgência Badge
function UrgenciaBadge({ urgencia }: { urgencia?: string }) {
  if (!urgencia) return null;
  
  const styles = {
    BAIXA: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    MEDIA: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    ALTA: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    URGENTE: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${styles[urgencia as keyof typeof styles]}`}>
      <AlertTriangle size={14} className="mr-1" />
      {urgencia}
    </span>
  );
}

export default function ChamadosPage() {
  const router = useRouter();
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ChamadoFilters>({
    pagina: 1,
    limite: 10
  });
  const [paginacao, setPaginacao] = useState({
    paginaAtual: 1,
    limitePorPagina: 10,
    totalRegistros: 0,
    totalPaginas: 1
  });
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    carregarDados();
  }, [filters]);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [chamadosResponse, stats] = await Promise.all([
        listarChamados(filters),
        getEstatisticas('30d')
      ]);
      
      setChamados(chamadosResponse.data);
      setPaginacao(chamadosResponse.paginacao);
      setEstatisticas(stats);
    } catch (err) {
      console.error('Erro ao carregar chamados:', err);
      setError('Não foi possível carregar os chamados');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ChamadoFilters, value: any) => {
    setFilters({ ...filters, [key]: value, pagina: 1 });
  };

  const handlePageChange = (novaPagina: number) => {
    setFilters({ ...filters, pagina: novaPagina });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementar busca quando o backend suportar
    setFilters({ ...filters, pagina: 1 });
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: ptBR });
  };

  // Filtrar localmente enquanto o backend não tem busca
  const chamadosFiltrados = chamados.filter(c => 
    c.ChamadoTitulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.Pessoa.PessoaNome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusOptions = [
    { value: 'PENDENTE', label: 'Pendente', color: 'yellow' },
    { value: 'ANALISADO', label: 'Analisado', color: 'blue' },
    { value: 'ATRIBUIDO', label: 'Atribuído', color: 'indigo' },
    { value: 'EMATENDIMENTO', label: 'Em Atendimento', color: 'purple' },
    { value: 'CONCLUIDO', label: 'Concluído', color: 'green' },
    { value: 'CANCELADO', label: 'Cancelado', color: 'gray' },
    { value: 'RECUSADO', label: 'Recusado', color: 'red' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Chamados
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gerencie os chamados da unidade
          </p>
        </div>
        <div className="flex gap-2">
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      {estatisticas && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
              <BarChart3 size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {estatisticas.total}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Últimos 30 dias
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Pendentes</span>
              <Clock size={18} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {estatisticas.porStatus.PENDENTE || 0}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Em Atendimento</span>
              <PlayCircle size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {estatisticas.porStatus.EMATENDIMENTO || 0}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Concluídos</span>
              <CheckCircle size={18} className="text-green-600 dark:text-green-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {estatisticas.porStatus.CONCLUIDO || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Busca */}
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por título ou solicitante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900 dark:text-gray-100"
              />
            </form>

            {/* Botão de filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Filter size={18} />
              <span>Filtros</span>
            </button>

            {/* Atualizar */}
            <button
              onClick={carregarDados}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              <span>Atualizar</span>
            </button>
          </div>

          {/* Opções de filtro */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Status */}
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Status
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                    className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                  >
                    <option value="">Todos</option>
                    {statusOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Urgência */}
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Urgência
                  </label>
                  <select
                    value={filters.urgencia || ''}
                    onChange={(e) => handleFilterChange('urgencia', e.target.value || undefined)}
                    className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                  >
                    <option value="">Todas</option>
                    <option value="BAIXA">BAIXA</option>
                    <option value="MEDIA">MÉDIA</option>
                    <option value="ALTA">ALTA</option>
                    <option value="URGENTE">URGENTE</option>
                  </select>
                </div>

                {/* Período */}
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Data Início
                  </label>
                  <input
                    type="date"
                    value={filters.dataInicio || ''}
                    onChange={(e) => handleFilterChange('dataInicio', e.target.value || undefined)}
                    className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                    Data Fim
                  </label>
                  <input
                    type="date"
                    value={filters.dataFim || ''}
                    onChange={(e) => handleFilterChange('dataFim', e.target.value || undefined)}
                    className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Chamados */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : chamadosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Ticket size={48} className="text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">Nenhum chamado encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {chamadosFiltrados.map((chamado) => (
              <div
                key={chamado.ChamadoId}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/gestor/autenticado/chamados/${chamado.ChamadoId}`)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        #{chamado.ChamadoId}
                      </span>
                      <StatusBadge status={chamado.ChamadoStatus} />
                      {chamado.ChamadoUrgencia && (
                        <UrgenciaBadge urgencia={chamado.ChamadoUrgencia} />
                      )}
                    </div>
                    
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {chamado.ChamadoTitulo}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {chamado.Pessoa.PessoaNome}
                      </span>
                      
                      {chamado.TipoSuporte && (
                        <span className="flex items-center gap-1">
                          <Briefcase size={14} />
                          {chamado.TipoSuporte.TipSupNom}
                        </span>
                      )}
                      
                      {chamado.Equipe && (
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {chamado.Equipe.EquipeNome}
                        </span>
                      )}
                      
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(chamado.ChamadoDtAbertura)}
                      </span>
                      
                      {chamado._count && (
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {chamado._count.AtividadeChamado} atividades
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/gestor/autenticado/chamados/${chamado.ChamadoId}`);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      title="Visualizar"
                    >
                      <Eye size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/gestor/autenticado/chamados/${chamado.ChamadoId}/editar`);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                      title="Editar"
                    >
                      <Edit size={18} className="text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginação */}
        {!isLoading && chamadosFiltrados.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {(paginacao.paginaAtual - 1) * paginacao.limitePorPagina + 1} a {Math.min(paginacao.paginaAtual * paginacao.limitePorPagina, paginacao.totalRegistros)} de {paginacao.totalRegistros}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(paginacao.paginaAtual - 1)}
                disabled={paginacao.paginaAtual === 1}
                className="p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">
                {paginacao.paginaAtual}
              </span>
              <button
                onClick={() => handlePageChange(paginacao.paginaAtual + 1)}
                disabled={paginacao.paginaAtual === paginacao.totalPaginas}
                className="p-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}