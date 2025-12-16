import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Eye,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Plus,
  Trash2,
  RefreshCw,
  Download
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

interface Concorrente {
  id: string
  nome: string
  partido: string
  cargo: string
  votosHistorico: number
  percentualHistorico: number
  forcas: string[]
  fraquezas: string[]
  ameacas: string[]
  oportunidades: string[]
  nivelAmeaca: 'baixo' | 'medio' | 'alto'
  tendencia: 'subindo' | 'estavel' | 'descendo'
  cor: string
}

const coresPartidos: { [key: string]: string } = {
  'PT': '#E11D48',
  'PL': '#1D4ED8',
  'UNIÃO': '#2563EB',
  'PP': '#3B82F6',
  'MDB': '#16A34A',
  'PSD': '#F59E0B',
  'REPUBLICANOS': '#7C3AED',
  'PDT': '#DC2626',
  'PSDB': '#0EA5E9',
  'PODE': '#8B5CF6',
  'PSB': '#EF4444',
  'OUTROS': '#6B7280'
}

export default function MonitorConcorrencia() {
  const [loading, setLoading] = useState(true)
  const [concorrentes, setConcorrentes] = useState<Concorrente[]>([])
  const [concorrenteSelecionado, setConcorrenteSelecionado] = useState<Concorrente | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [novoConcorrente, setNovoConcorrente] = useState<Partial<Concorrente>>({})
  const [cargoFiltro, setCargoFiltro] = useState('todos')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar candidatos históricos
      const { data: candidatosData } = await supabase
        .from('candidatos_historico')
        .select('*')
        .eq('ano', 2022)
        .order('votos_nominais', { ascending: false })
        .limit(20)

      // Carregar concorrentes salvos
      const concorrentesSalvos = localStorage.getItem('dte_concorrentes')
      
      if (concorrentesSalvos) {
        setConcorrentes(JSON.parse(concorrentesSalvos))
      } else if (candidatosData && candidatosData.length > 0) {
        // Criar concorrentes a partir dos dados históricos
        const totalVotos = candidatosData.reduce((acc, c) => acc + (c.votos_nominais || 0), 0)
        const concorrentesIniciais: Concorrente[] = candidatosData.slice(0, 8).map((c, index) => ({
          id: c.id || index.toString(),
          nome: c.nome || 'Candidato',
          partido: c.sigla_partido || 'PARTIDO',
          cargo: c.cargo || 'Vereador',
          votosHistorico: c.votos_nominais || 0,
          percentualHistorico: totalVotos > 0 ? ((c.votos_nominais || 0) / totalVotos) * 100 : 0,
          forcas: ['Base eleitoral consolidada'],
          fraquezas: ['A definir'],
          ameacas: ['Concorrência acirrada'],
          oportunidades: ['Eleitorado indeciso'],
          nivelAmeaca: index < 3 ? 'alto' : index < 6 ? 'medio' : 'baixo',
          tendencia: index % 3 === 0 ? 'subindo' : index % 3 === 1 ? 'estavel' : 'descendo',
          cor: coresPartidos[c.sigla_partido] || coresPartidos['OUTROS']
        }))
        
        setConcorrentes(concorrentesIniciais)
        localStorage.setItem('dte_concorrentes', JSON.stringify(concorrentesIniciais))
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const salvarConcorrente = () => {
    if (!novoConcorrente.nome || !novoConcorrente.partido) return

    const concorrente: Concorrente = {
      id: Date.now().toString(),
      nome: novoConcorrente.nome || '',
      partido: novoConcorrente.partido || '',
      cargo: novoConcorrente.cargo || 'Vereador',
      votosHistorico: novoConcorrente.votosHistorico || 0,
      percentualHistorico: novoConcorrente.percentualHistorico || 0,
      forcas: novoConcorrente.forcas || [],
      fraquezas: novoConcorrente.fraquezas || [],
      ameacas: novoConcorrente.ameacas || [],
      oportunidades: novoConcorrente.oportunidades || [],
      nivelAmeaca: novoConcorrente.nivelAmeaca || 'medio',
      tendencia: novoConcorrente.tendencia || 'estavel',
      cor: coresPartidos[novoConcorrente.partido || ''] || coresPartidos['OUTROS']
    }

    const novosConcorrentes = [...concorrentes, concorrente]
    setConcorrentes(novosConcorrentes)
    localStorage.setItem('dte_concorrentes', JSON.stringify(novosConcorrentes))
    setModalAberto(false)
    setNovoConcorrente({})
  }

  const excluirConcorrente = (id: string) => {
    const novosConcorrentes = concorrentes.filter(c => c.id !== id)
    setConcorrentes(novosConcorrentes)
    localStorage.setItem('dte_concorrentes', JSON.stringify(novosConcorrentes))
    if (concorrenteSelecionado?.id === id) {
      setConcorrenteSelecionado(null)
    }
  }

  const concorrentesFiltrados = cargoFiltro === 'todos' 
    ? concorrentes 
    : concorrentes.filter(c => c.cargo.toLowerCase() === cargoFiltro.toLowerCase())

  const barData = concorrentesFiltrados.slice(0, 8).map(c => ({
    nome: c.nome.split(' ')[0],
    votos: c.votosHistorico,
    percentual: c.percentualHistorico
  }))

  const pieData = concorrentesFiltrados.slice(0, 6).map(c => ({
    name: c.partido,
    value: c.votosHistorico,
    color: c.cor
  }))

  const radarData = concorrenteSelecionado ? [
    { subject: 'Votos', value: Math.min(100, (concorrenteSelecionado.votosHistorico / 50000) * 100) },
    { subject: 'Forças', value: concorrenteSelecionado.forcas.length * 25 },
    { subject: 'Ameaça', value: concorrenteSelecionado.nivelAmeaca === 'alto' ? 90 : concorrenteSelecionado.nivelAmeaca === 'medio' ? 60 : 30 },
    { subject: 'Tendência', value: concorrenteSelecionado.tendencia === 'subindo' ? 80 : concorrenteSelecionado.tendencia === 'estavel' ? 50 : 20 },
    { subject: 'Oportunidades', value: concorrenteSelecionado.oportunidades.length * 25 }
  ] : []

  const getAmeacaColor = (nivel: string) => {
    switch (nivel) {
      case 'alto': return 'text-red-500 bg-red-100'
      case 'medio': return 'text-amber-500 bg-amber-100'
      default: return 'text-green-500 bg-green-100'
    }
  }

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'subindo': return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'descendo': return <TrendingDown className="w-4 h-4 text-red-500" />
      default: return <BarChart3 className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Eye className="w-7 h-7 text-indigo-500" />
            Monitor de Concorrência
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Acompanhe e analise seus concorrentes eleitorais
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={cargoFiltro}
            onChange={(e) => setCargoFiltro(e.target.value)}
            className="input"
          >
            <option value="todos">Todos os Cargos</option>
            <option value="prefeito">Prefeito</option>
            <option value="vereador">Vereador</option>
            <option value="governador">Governador</option>
            <option value="deputado">Deputado</option>
          </select>
          <button
            onClick={() => setModalAberto(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Concorrentes</p>
                  <p className="text-2xl font-bold">{concorrentesFiltrados.length}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-red-100 text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Alto Risco</p>
                  <p className="text-2xl font-bold">
                    {concorrentesFiltrados.filter(c => c.nivelAmeaca === 'alto').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Em Ascensão</p>
                  <p className="text-2xl font-bold">
                    {concorrentesFiltrados.filter(c => c.tendencia === 'subindo').length}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Partidos</p>
                  <p className="text-2xl font-bold">
                    {new Set(concorrentesFiltrados.map(c => c.partido)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Barras */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Votos por Concorrente</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                  <Bar dataKey="votos" name="Votos" fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Pizza */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Distribuição por Partido</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name }) => name}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Lista de Concorrentes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card">
                <div className="p-4 border-b border-[var(--border-color)]">
                  <h3 className="text-lg font-semibold">Lista de Concorrentes</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[var(--bg-secondary)]">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Candidato</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Partido</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold">Votos</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Ameaça</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Tendência</th>
                        <th className="px-4 py-3 text-center text-sm font-semibold">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-color)]">
                      {concorrentesFiltrados.map(concorrente => (
                        <tr 
                          key={concorrente.id}
                          className={`hover:bg-[var(--bg-secondary)] cursor-pointer ${
                            concorrenteSelecionado?.id === concorrente.id ? 'bg-[var(--bg-secondary)]' : ''
                          }`}
                          onClick={() => setConcorrenteSelecionado(concorrente)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                style={{ backgroundColor: concorrente.cor }}
                              >
                                {concorrente.nome.charAt(0)}
                              </div>
                              <span className="font-medium">{concorrente.nome}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span 
                              className="px-2 py-1 rounded text-xs font-medium text-white"
                              style={{ backgroundColor: concorrente.cor }}
                            >
                              {concorrente.partido}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {concorrente.votosHistorico.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAmeacaColor(concorrente.nivelAmeaca)}`}>
                              {concorrente.nivelAmeaca.charAt(0).toUpperCase() + concorrente.nivelAmeaca.slice(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getTendenciaIcon(concorrente.tendencia)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={(e) => { e.stopPropagation(); excluirConcorrente(concorrente.id); }}
                              className="p-1 text-red-500 hover:bg-red-100 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Análise SWOT do Concorrente */}
            <div>
              {concorrenteSelecionado ? (
                <div className="card p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: concorrenteSelecionado.cor }}
                    >
                      {concorrenteSelecionado.nome.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{concorrenteSelecionado.nome}</h3>
                      <p className="text-sm text-[var(--text-muted)]">{concorrenteSelecionado.partido}</p>
                    </div>
                  </div>

                  {/* Radar Chart */}
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar
                        name="Análise"
                        dataKey="value"
                        stroke={concorrenteSelecionado.cor}
                        fill={concorrenteSelecionado.cor}
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>

                  {/* SWOT */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="text-xs font-semibold text-green-700 mb-2">Forças</h4>
                      <ul className="text-xs text-green-600 space-y-1">
                        {concorrenteSelecionado.forcas.map((f, i) => (
                          <li key={i}>• {f}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <h4 className="text-xs font-semibold text-red-700 mb-2">Fraquezas</h4>
                      <ul className="text-xs text-red-600 space-y-1">
                        {concorrenteSelecionado.fraquezas.map((f, i) => (
                          <li key={i}>• {f}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <h4 className="text-xs font-semibold text-amber-700 mb-2">Ameaças</h4>
                      <ul className="text-xs text-amber-600 space-y-1">
                        {concorrenteSelecionado.ameacas.map((a, i) => (
                          <li key={i}>• {a}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-xs font-semibold text-blue-700 mb-2">Oportunidades</h4>
                      <ul className="text-xs text-blue-600 space-y-1">
                        {concorrenteSelecionado.oportunidades.map((o, i) => (
                          <li key={i}>• {o}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card p-8 text-center">
                  <Eye className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">Selecione um concorrente para análise</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal Adicionar Concorrente */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-card)] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Adicionar Concorrente</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  value={novoConcorrente.nome || ''}
                  onChange={(e) => setNovoConcorrente({ ...novoConcorrente, nome: e.target.value })}
                  className="input w-full"
                  placeholder="Nome do candidato"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Partido</label>
                <input
                  type="text"
                  value={novoConcorrente.partido || ''}
                  onChange={(e) => setNovoConcorrente({ ...novoConcorrente, partido: e.target.value })}
                  className="input w-full"
                  placeholder="Sigla do partido"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cargo</label>
                <select
                  value={novoConcorrente.cargo || 'Vereador'}
                  onChange={(e) => setNovoConcorrente({ ...novoConcorrente, cargo: e.target.value })}
                  className="input w-full"
                >
                  <option value="Prefeito">Prefeito</option>
                  <option value="Vereador">Vereador</option>
                  <option value="Governador">Governador</option>
                  <option value="Deputado">Deputado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nível de Ameaça</label>
                <select
                  value={novoConcorrente.nivelAmeaca || 'medio'}
                  onChange={(e) => setNovoConcorrente({ ...novoConcorrente, nivelAmeaca: e.target.value as any })}
                  className="input w-full"
                >
                  <option value="baixo">Baixo</option>
                  <option value="medio">Médio</option>
                  <option value="alto">Alto</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setModalAberto(false); setNovoConcorrente({}); }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={salvarConcorrente}
                className="btn-primary"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
