import { useState } from 'react'
import Layout from '@/components/Layout'
import { 
  Bell, 
  PlusCircle, 
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  Play,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

interface AcaoCampanha {
  id: number
  titulo: string
  descricao: string
  tipo: string
  status: 'planejada' | 'em_andamento' | 'concluida' | 'cancelada'
  data_prevista: string
  data_execucao?: string
  bairro_alvo: string
  publico_alvo: string
  resultado_esperado: string
  resultado_obtido?: string
  metricas?: {
    alcance?: number
    engajamento?: number
    conversao?: number
  }
}

export default function AcoesCampanha() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [showModal, setShowModal] = useState(false)

  const acoes: AcaoCampanha[] = [
    {
      id: 1,
      titulo: 'Caminhada Centro Histórico',
      descricao: 'Caminhada pelo centro histórico com distribuição de material e conversa com eleitores',
      tipo: 'Caminhada',
      status: 'concluida',
      data_prevista: '2024-01-15',
      data_execucao: '2024-01-15',
      bairro_alvo: 'Centro',
      publico_alvo: 'Comerciantes e trabalhadores',
      resultado_esperado: 'Alcançar 500 pessoas',
      resultado_obtido: 'Alcançou 650 pessoas',
      metricas: { alcance: 650, engajamento: 78, conversao: 45 }
    },
    {
      id: 2,
      titulo: 'Comício Praça Central',
      descricao: 'Grande comício com apresentação de propostas e participação de apoiadores',
      tipo: 'Comício',
      status: 'em_andamento',
      data_prevista: '2024-01-20',
      bairro_alvo: 'Centro',
      publico_alvo: 'Público geral',
      resultado_esperado: 'Reunir 2000 pessoas',
      metricas: { alcance: 1200 }
    },
    {
      id: 3,
      titulo: 'Visita Associação de Moradores',
      descricao: 'Reunião com lideranças comunitárias para apresentar propostas',
      tipo: 'Reunião',
      status: 'planejada',
      data_prevista: '2024-01-25',
      bairro_alvo: 'Zona Sul',
      publico_alvo: 'Lideranças comunitárias',
      resultado_esperado: 'Firmar parcerias com 5 associações'
    },
    {
      id: 4,
      titulo: 'Carreata Zona Norte',
      descricao: 'Carreata passando pelos principais bairros da Zona Norte',
      tipo: 'Carreata',
      status: 'planejada',
      data_prevista: '2024-01-28',
      bairro_alvo: 'Zona Norte',
      publico_alvo: 'Moradores da região',
      resultado_esperado: 'Percorrer 15km e alcançar 3000 pessoas'
    },
    {
      id: 5,
      titulo: 'Debate na Universidade',
      descricao: 'Participação em debate organizado pelo DCE',
      tipo: 'Debate',
      status: 'cancelada',
      data_prevista: '2024-01-18',
      bairro_alvo: 'Zona Leste',
      publico_alvo: 'Estudantes universitários',
      resultado_esperado: 'Engajar público jovem'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'concluida': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'em_andamento': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'planejada': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'cancelada': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluida': return <CheckCircle className="w-4 h-4" />
      case 'em_andamento': return <Play className="w-4 h-4" />
      case 'planejada': return <Clock className="w-4 h-4" />
      case 'cancelada': return <XCircle className="w-4 h-4" />
      default: return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'concluida': return 'Concluída'
      case 'em_andamento': return 'Em Andamento'
      case 'planejada': return 'Planejada'
      case 'cancelada': return 'Cancelada'
      default: return status
    }
  }

  const filteredAcoes = acoes.filter(a => {
    const matchesSearch = a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.bairro_alvo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'todos' || a.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = {
    total: acoes.length,
    planejadas: acoes.filter(a => a.status === 'planejada').length,
    emAndamento: acoes.filter(a => a.status === 'em_andamento').length,
    concluidas: acoes.filter(a => a.status === 'concluida').length,
    canceladas: acoes.filter(a => a.status === 'cancelada').length
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="w-7 h-7 text-emerald-500" />
              Ações de Campanha
            </h1>
            <p className="text-[var(--text-muted)]">
              Gerencie e acompanhe todas as ações da campanha
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 w-fit"
          >
            <PlusCircle className="w-5 h-5" />
            Nova Ação
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Total</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Planejadas</p>
                <p className="text-xl font-bold">{stats.planejadas}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Play className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Em Andamento</p>
                <p className="text-xl font-bold">{stats.emAndamento}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Concluídas</p>
                <p className="text-xl font-bold">{stats.concluidas}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Canceladas</p>
                <p className="text-xl font-bold">{stats.canceladas}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Buscar ações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[var(--text-muted)]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="todos">Todos os status</option>
                <option value="planejada">Planejadas</option>
                <option value="em_andamento">Em Andamento</option>
                <option value="concluida">Concluídas</option>
                <option value="cancelada">Canceladas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Timeline de Ações */}
        <div className="space-y-4">
          {filteredAcoes.length === 0 ? (
            <div className="card p-8 text-center">
              <Bell className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma ação encontrada</h3>
              <p className="text-[var(--text-muted)]">
                Crie uma nova ação de campanha para começar
              </p>
            </div>
          ) : (
            filteredAcoes.map((acao) => (
              <div key={acao.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Info Principal */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold">{acao.titulo}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${getStatusColor(acao.status)}`}>
                        {getStatusIcon(acao.status)}
                        {getStatusLabel(acao.status)}
                      </span>
                      <span className="px-2 py-1 text-xs bg-[var(--bg-secondary)] rounded">
                        {acao.tipo}
                      </span>
                    </div>

                    <p className="text-[var(--text-muted)] mb-4">{acao.descricao}</p>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <span className="flex items-center gap-1 text-[var(--text-muted)]">
                        <Calendar className="w-4 h-4" />
                        {new Date(acao.data_prevista).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1 text-[var(--text-muted)]">
                        <MapPin className="w-4 h-4" />
                        {acao.bairro_alvo}
                      </span>
                      <span className="flex items-center gap-1 text-[var(--text-muted)]">
                        <Users className="w-4 h-4" />
                        {acao.publico_alvo}
                      </span>
                    </div>

                    {/* Resultados */}
                    {acao.status === 'concluida' && acao.metricas && (
                      <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                        <p className="text-sm font-medium mb-2">Resultados:</p>
                        <div className="flex flex-wrap gap-4">
                          {acao.metricas.alcance && (
                            <div className="text-center">
                              <p className="text-lg font-bold text-emerald-500">{acao.metricas.alcance}</p>
                              <p className="text-xs text-[var(--text-muted)]">Alcance</p>
                            </div>
                          )}
                          {acao.metricas.engajamento && (
                            <div className="text-center">
                              <p className="text-lg font-bold text-blue-500">{acao.metricas.engajamento}%</p>
                              <p className="text-xs text-[var(--text-muted)]">Engajamento</p>
                            </div>
                          )}
                          {acao.metricas.conversao && (
                            <div className="text-center">
                              <p className="text-lg font-bold text-purple-500">{acao.metricas.conversao}</p>
                              <p className="text-xs text-[var(--text-muted)]">Conversões</p>
                            </div>
                          )}
                        </div>
                        {acao.resultado_obtido && (
                          <p className="text-sm text-green-600 mt-2">✓ {acao.resultado_obtido}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex lg:flex-col items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors" title="Visualizar">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors" title="Editar">
                      <Edit className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors" title="Excluir">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Nova Ação */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-card)] rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[var(--border-color)]">
                <h2 className="text-xl font-bold">Nova Ação de Campanha</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Título</label>
                  <input type="text" className="input w-full" placeholder="Ex: Caminhada no Centro" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo</label>
                  <select className="input w-full">
                    <option>Caminhada</option>
                    <option>Comício</option>
                    <option>Carreata</option>
                    <option>Reunião</option>
                    <option>Debate</option>
                    <option>Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea className="input w-full" rows={3} placeholder="Descreva a ação..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Data Prevista</label>
                    <input type="date" className="input w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Bairro/Região</label>
                    <input type="text" className="input w-full" placeholder="Ex: Centro" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Público-Alvo</label>
                  <input type="text" className="input w-full" placeholder="Ex: Comerciantes" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Resultado Esperado</label>
                  <input type="text" className="input w-full" placeholder="Ex: Alcançar 500 pessoas" />
                </div>
              </div>
              <div className="p-6 border-t border-[var(--border-color)] flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancelar
                </button>
                <button onClick={() => setShowModal(false)} className="btn-primary">
                  Criar Ação
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
