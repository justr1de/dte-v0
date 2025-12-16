import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { 
  PlusCircle, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  ClipboardList,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react'

interface Pesquisa {
  id: number
  titulo: string
  descricao: string
  status: string
  data_inicio: string
  data_fim: string
  publico_alvo: string
  margem_erro: number
  nivel_confianca: number
  registro_tse: string
  created_at: string
}

export default function Pesquisas() {
  const [pesquisas, setPesquisas] = useState<Pesquisa[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')

  useEffect(() => {
    fetchPesquisas()
  }, [])

  const fetchPesquisas = async () => {
    try {
      const { data, error } = await supabase
        .from('pesquisas')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPesquisas(data || [])
    } catch (error) {
      console.error('Erro ao carregar pesquisas:', error)
      // Dados de exemplo para demonstração
      setPesquisas([
        {
          id: 1,
          titulo: 'Pesquisa de Intenção de Voto - Porto Velho',
          descricao: 'Pesquisa eleitoral para identificar intenção de voto dos eleitores de Porto Velho',
          status: 'ativa',
          data_inicio: '2024-01-15',
          data_fim: '2024-02-15',
          publico_alvo: 'Eleitores de Porto Velho maiores de 16 anos',
          margem_erro: 3.5,
          nivel_confianca: 95,
          registro_tse: 'RO-00001/2024',
          created_at: '2024-01-10'
        },
        {
          id: 2,
          titulo: 'Avaliação de Gestão Municipal',
          descricao: 'Pesquisa para avaliar a percepção dos cidadãos sobre a gestão municipal atual',
          status: 'rascunho',
          data_inicio: '',
          data_fim: '',
          publico_alvo: 'Eleitores de Porto Velho',
          margem_erro: 4,
          nivel_confianca: 95,
          registro_tse: '',
          created_at: '2024-01-08'
        },
        {
          id: 3,
          titulo: 'Pesquisa Eleitoral 2022 - 2º Turno',
          descricao: 'Pesquisa de intenção de voto para o segundo turno das eleições 2022',
          status: 'encerrada',
          data_inicio: '2022-10-01',
          data_fim: '2022-10-28',
          publico_alvo: 'Eleitores de Rondônia',
          margem_erro: 2.5,
          nivel_confianca: 95,
          registro_tse: 'RO-00045/2022',
          created_at: '2022-09-28'
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativa': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'rascunho': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'encerrada': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      case 'arquivada': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ativa': return 'Ativa'
      case 'rascunho': return 'Rascunho'
      case 'encerrada': return 'Encerrada'
      case 'arquivada': return 'Arquivada'
      default: return status
    }
  }

  const filteredPesquisas = pesquisas.filter(p => {
    const matchesSearch = p.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.descricao.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'todos' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Pesquisas Eleitorais</h1>
            <p className="text-[var(--text-muted)]">Gerencie suas pesquisas de opinião e intenção de voto</p>
          </div>
          <Link
            to="/pesquisas/criar"
            className="btn-primary flex items-center gap-2 w-fit"
          >
            <PlusCircle className="w-5 h-5" />
            Nova Pesquisa
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <ClipboardList className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Total de Pesquisas</p>
                <p className="text-xl font-bold">{pesquisas.length}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <BarChart3 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Pesquisas Ativas</p>
                <p className="text-xl font-bold">{pesquisas.filter(p => p.status === 'ativa').length}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Edit className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Rascunhos</p>
                <p className="text-xl font-bold">{pesquisas.filter(p => p.status === 'rascunho').length}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Encerradas</p>
                <p className="text-xl font-bold">{pesquisas.filter(p => p.status === 'encerrada').length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Buscar pesquisas..."
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
                <option value="ativa">Ativas</option>
                <option value="rascunho">Rascunhos</option>
                <option value="encerrada">Encerradas</option>
                <option value="arquivada">Arquivadas</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pesquisas List */}
        <div className="space-y-4">
          {loading ? (
            <div className="card p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="mt-4 text-[var(--text-muted)]">Carregando pesquisas...</p>
            </div>
          ) : filteredPesquisas.length === 0 ? (
            <div className="card p-8 text-center">
              <ClipboardList className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma pesquisa encontrada</h3>
              <p className="text-[var(--text-muted)] mb-4">
                {searchTerm || statusFilter !== 'todos' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Crie sua primeira pesquisa eleitoral'}
              </p>
              <Link to="/pesquisas/criar" className="btn-primary inline-flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Criar Pesquisa
              </Link>
            </div>
          ) : (
            filteredPesquisas.map((pesquisa) => (
              <div key={pesquisa.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{pesquisa.titulo}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(pesquisa.status)}`}>
                        {getStatusLabel(pesquisa.status)}
                      </span>
                    </div>
                    <p className="text-[var(--text-muted)] mb-3">{pesquisa.descricao}</p>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {pesquisa.registro_tse && (
                        <span className="flex items-center gap-1 text-[var(--text-muted)]">
                          <ClipboardList className="w-4 h-4" />
                          TSE: {pesquisa.registro_tse}
                        </span>
                      )}
                      {pesquisa.data_inicio && (
                        <span className="flex items-center gap-1 text-[var(--text-muted)]">
                          <Calendar className="w-4 h-4" />
                          {new Date(pesquisa.data_inicio).toLocaleDateString('pt-BR')} - {new Date(pesquisa.data_fim).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[var(--text-muted)]">
                        <Users className="w-4 h-4" />
                        {pesquisa.publico_alvo}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/pesquisas/${pesquisa.id}`}
                      className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                      title="Visualizar"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <Link
                      to={`/pesquisas/${pesquisa.id}/editar`}
                      className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  )
}
