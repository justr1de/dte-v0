import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Trophy,
  Users,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  BarChart3,
  Download,
  RefreshCw,
  Percent,
  Flag
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
  Radar,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts'

interface DadosCandidato {
  id: string
  nome: string
  partido: string
  cargo: string
  ano: number
  votos: number
  percentual: number
  situacao: string
}

interface DadosPartido {
  partido: string
  totalVotos: number
  totalCandidatos: number
  mediaVotos: number
  eleitos: number
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

export default function CompetitividadeEleitoral() {
  const [loading, setLoading] = useState(true)
  const [candidatos, setCandidatos] = useState<DadosCandidato[]>([])
  const [partidos, setPartidos] = useState<DadosPartido[]>([])
  const [anoSelecionado, setAnoSelecionado] = useState('2022')
  const [cargoSelecionado, setCargoSelecionado] = useState('todos')
  const [anosDisponiveis, setAnosDisponiveis] = useState<number[]>([])

  useEffect(() => {
    fetchData()
  }, [anoSelecionado, cargoSelecionado])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar candidatos históricos
      const { data: candidatosData } = await supabase
        .from('candidatos_historico')
        .select('*')
        .order('votos_nominais', { ascending: false })

      if (candidatosData && candidatosData.length > 0) {
        // Extrair anos disponíveis
        const anos = [...new Set(candidatosData.map(c => c.ano))].sort((a, b) => b - a)
        setAnosDisponiveis(anos)

        // Filtrar por ano e cargo
        let filteredData = candidatosData.filter(c => c.ano?.toString() === anoSelecionado)
        if (cargoSelecionado !== 'todos') {
          filteredData = filteredData.filter(c => 
            c.cargo?.toLowerCase().includes(cargoSelecionado.toLowerCase())
          )
        }

        // Calcular total de votos para percentuais
        const totalVotos = filteredData.reduce((acc, c) => acc + (c.votos_nominais || 0), 0)

        // Processar candidatos
        const processedCandidatos: DadosCandidato[] = filteredData.map(c => ({
          id: c.id,
          nome: c.nome || 'Candidato',
          partido: c.sigla_partido || 'OUTROS',
          cargo: c.cargo || 'N/A',
          ano: c.ano || 2022,
          votos: c.votos_nominais || 0,
          percentual: totalVotos > 0 ? ((c.votos_nominais || 0) / totalVotos) * 100 : 0,
          situacao: c.situacao || 'N/A'
        }))

        setCandidatos(processedCandidatos)

        // Agregar por partido
        const partidoMap = new Map<string, DadosPartido>()
        processedCandidatos.forEach(c => {
          if (!partidoMap.has(c.partido)) {
            partidoMap.set(c.partido, {
              partido: c.partido,
              totalVotos: 0,
              totalCandidatos: 0,
              mediaVotos: 0,
              eleitos: 0,
              cor: coresPartidos[c.partido] || coresPartidos['OUTROS']
            })
          }
          const p = partidoMap.get(c.partido)!
          p.totalVotos += c.votos
          p.totalCandidatos += 1
          if (c.situacao?.toLowerCase().includes('eleit')) {
            p.eleitos += 1
          }
        })

        // Calcular média de votos
        partidoMap.forEach(p => {
          p.mediaVotos = p.totalCandidatos > 0 ? Math.round(p.totalVotos / p.totalCandidatos) : 0
        })

        const processedPartidos = Array.from(partidoMap.values())
          .sort((a, b) => b.totalVotos - a.totalVotos)

        setPartidos(processedPartidos)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cálculos de resumo
  const totalVotos = candidatos.reduce((acc, c) => acc + c.votos, 0)
  const totalCandidatos = candidatos.length
  const totalEleitos = candidatos.filter(c => c.situacao?.toLowerCase().includes('eleit')).length
  const totalPartidos = partidos.length

  // Top 10 candidatos
  const topCandidatos = candidatos.slice(0, 10)

  // Dados para gráficos
  const barDataPartidos = partidos.slice(0, 10).map(p => ({
    partido: p.partido,
    votos: p.totalVotos,
    candidatos: p.totalCandidatos,
    eleitos: p.eleitos
  }))

  const pieDataPartidos = partidos.slice(0, 8).map(p => ({
    name: p.partido,
    value: p.totalVotos,
    color: p.cor
  }))

  const scatterData = candidatos.slice(0, 50).map(c => ({
    nome: c.nome,
    votos: c.votos,
    percentual: c.percentual,
    partido: c.partido
  }))

  const radarDataPartidos = partidos.slice(0, 6).map(p => ({
    partido: p.partido,
    votos: Math.min(100, (p.totalVotos / (partidos[0]?.totalVotos || 1)) * 100),
    candidatos: Math.min(100, (p.totalCandidatos / (partidos[0]?.totalCandidatos || 1)) * 100),
    eleitos: Math.min(100, (p.eleitos / Math.max(1, partidos[0]?.eleitos || 1)) * 100),
    media: Math.min(100, (p.mediaVotos / (partidos[0]?.mediaVotos || 1)) * 100)
  }))

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-7 h-7 text-amber-500" />
            Competitividade Eleitoral
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Análise comparativa de candidatos e partidos
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(e.target.value)}
            className="input"
          >
            {anosDisponiveis.map(ano => (
              <option key={ano} value={ano.toString()}>{ano}</option>
            ))}
          </select>
          <select
            value={cargoSelecionado}
            onChange={(e) => setCargoSelecionado(e.target.value)}
            className="input"
          >
            <option value="todos">Todos os Cargos</option>
            <option value="prefeito">Prefeito</option>
            <option value="vereador">Vereador</option>
            <option value="governador">Governador</option>
            <option value="deputado">Deputado</option>
            <option value="senador">Senador</option>
          </select>
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Candidatos</p>
                  <p className="text-2xl font-bold">{totalCandidatos.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Total Votos</p>
                  <p className="text-2xl font-bold">{totalVotos.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Eleitos</p>
                  <p className="text-2xl font-bold">{totalEleitos}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <Flag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Partidos</p>
                  <p className="text-2xl font-bold">{totalPartidos}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-cyan-100 text-cyan-600">
                  <Percent className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Média/Candidato</p>
                  <p className="text-2xl font-bold">
                    {totalCandidatos > 0 ? Math.round(totalVotos / totalCandidatos).toLocaleString('pt-BR') : 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos Principais */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Votos por Partido */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Desempenho por Partido</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={barDataPartidos} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="partido" type="category" width={60} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                  <Legend />
                  <Bar dataKey="votos" name="Votos" fill="#3B82F6" />
                  <Bar dataKey="eleitos" name="Eleitos" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Distribuição de Votos */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Distribuição de Votos por Partido</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pieDataPartidos}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {pieDataPartidos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Radar e Top Candidatos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar de Competitividade */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Análise Comparativa de Partidos</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarDataPartidos}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="partido" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar name="Votos" dataKey="votos" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  <Radar name="Eleitos" dataKey="eleitos" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Top 10 Candidatos */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Top 10 Candidatos</h3>
              <div className="space-y-3">
                {topCandidatos.map((candidato, index) => (
                  <div key={candidato.id} className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-amber-100 text-amber-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{candidato.nome}</span>
                        <span 
                          className="px-1.5 py-0.5 rounded text-xs text-white"
                          style={{ backgroundColor: coresPartidos[candidato.partido] || coresPartidos['OUTROS'] }}
                        >
                          {candidato.partido}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${candidato.percentual}%` }}
                          />
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">
                          {candidato.votos.toLocaleString('pt-BR')} ({candidato.percentual.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                    {candidato.situacao?.toLowerCase().includes('eleit') && (
                      <Award className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabela Completa de Partidos */}
          <div className="card">
            <div className="p-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold">Ranking de Partidos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Pos.</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Partido</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Candidatos</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Total Votos</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Média/Candidato</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Eleitos</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">% do Total</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Desempenho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {partidos.map((partido, index) => (
                    <tr key={partido.partido} className="hover:bg-[var(--bg-secondary)]">
                      <td className="px-4 py-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-amber-100 text-amber-700' :
                          index === 1 ? 'bg-gray-100 text-gray-700' :
                          index === 2 ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: partido.cor }}
                        >
                          {partido.partido}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{partido.totalCandidatos}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {partido.totalVotos.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {partido.mediaVotos.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-emerald-600 font-medium">{partido.eleitos}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {totalVotos > 0 ? ((partido.totalVotos / totalVotos) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ 
                              width: `${totalVotos > 0 ? (partido.totalVotos / totalVotos) * 100 : 0}%`,
                              backgroundColor: partido.cor
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4 bg-amber-50 border-amber-200">
              <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Partido Líder
              </h4>
              <p className="text-sm text-amber-700">
                O <strong>{partidos[0]?.partido || 'N/A'}</strong> lidera com{' '}
                {partidos[0]?.totalVotos.toLocaleString('pt-BR')} votos ({totalVotos > 0 ? ((partidos[0]?.totalVotos / totalVotos) * 100).toFixed(1) : 0}% do total),
                elegendo {partidos[0]?.eleitos || 0} candidatos.
              </p>
            </div>
            <div className="card p-4 bg-blue-50 border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Competitividade
              </h4>
              <p className="text-sm text-blue-700">
                Os 3 maiores partidos concentram{' '}
                {totalVotos > 0 ? ((partidos.slice(0, 3).reduce((acc, p) => acc + p.totalVotos, 0) / totalVotos) * 100).toFixed(1) : 0}%{' '}
                dos votos, indicando {partidos.slice(0, 3).reduce((acc, p) => acc + p.totalVotos, 0) / totalVotos > 0.6 ? 'alta concentração' : 'competição equilibrada'}.
              </p>
            </div>
            <div className="card p-4 bg-emerald-50 border-emerald-200">
              <h4 className="font-medium text-emerald-800 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Eficiência
              </h4>
              <p className="text-sm text-emerald-700">
                Taxa de eleição geral: {totalCandidatos > 0 ? ((totalEleitos / totalCandidatos) * 100).toFixed(1) : 0}%.
                O partido mais eficiente é o que tem maior relação eleitos/candidatos.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
