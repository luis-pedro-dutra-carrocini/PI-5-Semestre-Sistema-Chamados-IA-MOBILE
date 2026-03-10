"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Ticket,
  ArrowLeft,
  Edit,
  Clock,
  Search,
  Calendar,
  Users,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  PlayCircle,
  PauseCircle,
  FileText,
  MessageSquare,
  User,
  Building2,
  Tag,
  Save,
  RefreshCw
} from "lucide-react"
import { buscarChamadoPorId, alterarStatus, atribuirEquipe, type Chamado } from "@/lib/chamado-service"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

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
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  );
}

function UrgenciaBadge({ urgencia }: { urgencia?: string }) {
  if (!urgencia) return null;
  
  const styles = {
    BAIXA: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    MEDIA: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    ALTA: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    URGENTE: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[urgencia as keyof typeof styles]}`}>
      <AlertTriangle size={16} className="inline mr-1" />
      {urgencia}
    </span>
  );
}

export default function DetalhesChamadoPage() {
  const params = useParams();
  const router = useRouter();
  const [chamado, setChamado] = useState<Chamado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (params.id) {
      carregarChamado();
    }
  }, [params.id]);

  const carregarChamado = async () => {
    try {
      setIsLoading(true);
      const data = await buscarChamadoPorId(Number(params.id));
      setChamado(data);
    } catch (err) {
      console.error('Erro ao carregar chamado:', err);
      setError('Não foi possível carregar os detalhes do chamado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (novoStatus: string) => {
    try {
      setUpdating(true);
      await alterarStatus(Number(params.id), novoStatus);
      await carregarChamado();
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      alert('Erro ao alterar status do chamado');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !chamado) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Chamado não encontrado'}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Voltar
        </button>
      </div>
    );
  }

  const statusOptions = [
    { value: 'PENDENTE', label: 'Pendente', icon: Clock },
    { value: 'ANALISADO', label: 'Analisado', icon: Search },
    { value: 'ATRIBUIDO', label: 'Atribuído', icon: Users },
    { value: 'EMATENDIMENTO', label: 'Em Atendimento', icon: PlayCircle },
    { value: 'CONCLUIDO', label: 'Concluído', icon: CheckCircle },
    { value: 'CANCELADO', label: 'Cancelado', icon: XCircle },
    { value: 'RECUSADO', label: 'Recusado', icon: HelpCircle }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Chamado #{chamado.ChamadoId}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {chamado.ChamadoTitulo}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/gestor/autenticado/chamados/${chamado.ChamadoId}/editar`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Edit size={18} />
            <span>Editar</span>
          </button>
        </div>
      </div>

      {/* Status e Urgência */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <StatusBadge status={chamado.ChamadoStatus} />
          {chamado.ChamadoUrgencia && <UrgenciaBadge urgencia={chamado.ChamadoUrgencia} />}
          {chamado.ChamadoPrioridade && (
            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm">
              Prioridade: {chamado.ChamadoPrioridade}/10
            </span>
          )}
        </div>

        {/* Informações principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <User size={16} />
              Solicitante
            </h3>
            <div>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {chamado.Pessoa.PessoaNome}
              </p>
              {chamado.Pessoa.PessoaEmail && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {chamado.Pessoa.PessoaEmail}
                </p>
              )}
              {chamado.Pessoa.PessoaTelefone && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {chamado.Pessoa.PessoaTelefone}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Building2 size={16} />
              Unidade
            </h3>
            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {chamado.Unidade.UnidadeNome}
            </p>
          </div>

          {chamado.TipoSuporte && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Briefcase size={16} />
                Tipo de Suporte
              </h3>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {chamado.TipoSuporte.TipSupNom}
              </p>
            </div>
          )}

          {chamado.Equipe && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Users size={16} />
                Equipe Responsável
              </h3>
              <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {chamado.Equipe.EquipeNome}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <Calendar size={16} />
              Datas
            </h3>
            <div>
              <p className="text-sm">
                <span className="text-gray-500 dark:text-gray-400">Abertura: </span>
                <span className="text-gray-900 dark:text-gray-100">{formatDate(chamado.ChamadoDtAbertura)}</span>
              </p>
              {chamado.ChamadoDtEncerramento && (
                <p className="text-sm mt-1">
                  <span className="text-gray-500 dark:text-gray-400">Encerramento: </span>
                  <span className="text-gray-900 dark:text-gray-100">{formatDate(chamado.ChamadoDtEncerramento)}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Descrição */}
      {chamado.ChamadoDescricaoFormatada && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
            <FileText size={16} />
            Descrição
          </h3>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {chamado.ChamadoDescricaoFormatada}
          </div>
        </div>
      )}

      {/* Ações do Gestor */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <Tag size={16} />
          Ações do Gestor
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusOptions.map((option) => {
            const Icon = option.icon;
            const isCurrent = chamado.ChamadoStatus === option.value;
            const isDisabled = 
              (chamado.ChamadoStatus === 'CONCLUIDO' && option.value !== 'CONCLUIDO') ||
              (chamado.ChamadoStatus === 'CANCELADO' && option.value !== 'CANCELADO') ||
              (chamado.ChamadoStatus === 'RECUSADO' && option.value !== 'RECUSADO');

            return (
              <button
                key={option.value}
                onClick={() => handleStatusChange(option.value)}
                disabled={isDisabled || isCurrent || updating}
                className={`p-4 rounded-lg border transition-all ${
                  isCurrent
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : isDisabled
                    ? 'border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 dark:border-gray-800 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                }`}
              >
                <Icon size={20} className={`mx-auto mb-2 ${
                  isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                }`} />
                <p className={`text-sm font-medium ${
                  isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {option.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Atividades */}
      {chamado.AtividadeChamado && chamado.AtividadeChamado.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
            <MessageSquare size={16} />
            Histórico de Atividades
          </h3>

          <div className="space-y-4">
            {chamado.AtividadeChamado.map((atividade) => (
              <div key={atividade.AtividadeId} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <User size={16} className="text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {atividade.Tecnico?.TecnicoNome || 'Sistema'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {formatDate(atividade.AtividadeDtRealizacao)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {atividade.AtividadeDescricao}
                  </p>
                  {atividade.AtividadeObservacao && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 italic">
                      Obs: {atividade.AtividadeObservacao}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}