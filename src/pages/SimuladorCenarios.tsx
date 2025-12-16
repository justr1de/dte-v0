import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  TrendingUp,
  Play,
  RotateCcw,
  Save,
  Download,
  Users,
  Target,
  BarChart3,
  Percent,
  AlertCircle,
  CheckCircle,
  Sliders
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'

interface Candidato {
  id: string
  nome: string
  partido: string
  votosBase: number
  percentualBase: number
}

interface CenarioConfig {
  taxaComparecimento: number
  taxaIndecisos: number
  transferenciasVotos: { [key: string]: number }
  efeitoCampanha: number
  mobilizacaoJovens: number
  mobilizacaoIdosos: number
}

interface ResultadoSimulacao {
  candidatos: {
    nome: string
    partido: string
    votos: number
    percentual: number
    variacao: number
  }[]
  totalVotos: number
  vencedor: string
  margemVitoria: number
  segundoTurno: boolean
}

export default function SimuladorCenarios() {
  const [loading, setLoading] = useState(true)
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [config, setConfig] = useState<CenarioConfig>({
    taxaComparecimento: 80,
    taxaIndecisos: 15,
    transferenciasVotos: {},
    efeitoCampanha: 0,
    mobilizacaoJovens: 50,
    mobilizacaoIdosos: 50
  })
  const [resultado, setResultado] = useState<ResultadoSimulacao | null>(null)
  const [historico, setHistorico] = useState<ResultadoSimulacao[]>([])
  const [cargoSelecionado, setCargoSelecionado] = useState('prefeito')

  useEffect(() => {
    fetchCandidatos()
  }, [cargoSelecionado])

  const fetchCandidatos = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('candidatos_historico')
        .select('*')
        .eq('ano', 2022)
        .limit(8)

      if (data && data.length > 0) {
        const totalVotos = data.reduce((acc, c) => acc + (c.votos_nominais || 0), 0)
        const processedCandidatos = data.map(c => ({
          id: c.id,
          nome: c.nome || 'Candidato',
          partido: c.sigla_partido || 'PARTIDO',
          votosBase: c.votos_nominais || 0,
          percentualBase: totalVotos > 0 ? ((c.votos_nominais || 0) / totalVotos) * 100 : 0
        })).sort((a, b) => b.votosBase - a.votosBase).slice(0, 6)

        setCandidatos(processedCandidatos)
        
        // Inicializar transferências
        const transferencias: { [key: string]: number } = {}
        processedCandidatos.forEach(c => {
          transferencias[c.id] = 0
        })
        setConfig(prev => ({ ...prev, transferenciasVotos: transferencias }))
      } else {
        // Dados de exemplo se não houver dados reais
        const exemplosCandidatos: Candidato[] = [
          { id: '1', nome: 'Candidato A', partido: 'PARTIDO1', votosBase: 45000, percentualBase: 35 },
          { id: '2', nome: 'Candidato B', partido: 'PARTIDO2', votosBase: 38000, percentualBase: 29.5 },
          { id: '3', nome: 'Candidato C', partido: 'PARTIDO3', votosBase: 25000, percentualBase: 19.4 },
          { id: '4', nome: 'Candidato D', partido: 'PARTIDO4', votosBase: 12000, percentualBase: 9.3 },
          { id: '5', nome: 'Outros', partido: 'OUTROS', votosBase: 8800, percentualBase: 6.8 },
        ]
        setCandidatos(exemplosCandidatos)
        
        const transferencias: { [key: string]: number } = {}
        exemplosCandidatos.forEach(c => {
          transferencias[c.id] = 0
        })
        setConfig(prev => ({ ...prev, transferenciasVotos: transferencias }))
      }
    } catch (error) {
      console.error('Erro ao buscar candidatos:', error)
    } finally {
      setLoading(false)
    }
  }

  const simular = () => {
    const totalEleitores = 150000 // Base de eleitores
    const eleitoresComparecendo = Math.round(totalEleitores * (config.taxaComparecimento / 100))
    const votosIndecisos = Math.round(eleitoresComparecendo * (config.taxaIndecisos / 100))
    
    // Calcular votos simulados para cada candidato
    const resultadosCandidatos = candidatos.map(candidato => {
      let votosSimulados = candidato.votosBase
      
      // Aplicar transferência de votos
      const transferencia = config.transferenciasVotos[candidato.id] || 0
      votosSimulados += Math.round(votosIndecisos * (transferencia / 100))
      
      // Aplicar efeito de campanha (primeiro candidato recebe mais)
      if (candidato.id === candidatos[0]?.id) {
        votosSimulados += Math.round(votosSimulados * (config.efeitoCampanha / 100))
      }
      
      // Aplicar mobilização por faixa etária
      const fatorJovens = (config.mobilizacaoJovens - 50) / 100
      const fatorIdosos = (config.mobilizacaoIdosos - 50) / 100
      votosSimulados += Math.round(votosSimulados * (fatorJovens * 0.15 + fatorIdosos * 0.1))
      
      // Ajustar pelo comparecimento
      votosSimulados = Math.round(votosSimulados * (config.taxaComparecimento / 80))
      
      return {
        nome: candidato.nome,
        partido: candidato.partido,
        votos: Math.max(0, votosSimulados),
        percentual: 0,
        variacao: 0
      }
    })
    
    // Calcular percentuais
    const totalVotosSimulados = resultadosCandidatos.reduce((acc, c) => acc + c.votos, 0)
    resultadosCandidatos.forEach((c, i) => {
      c.percentual = totalVotosSimulados > 0 ? (c.votos / totalVotosSimulados) * 100 : 0
      c.variacao = c.percentual - candidatos[i].percentualBase
    })
    
    // Ordenar por votos
    resultadosCandidatos.sort((a, b) => b.votos - a.votos)
    
    const vencedor = resultadosCandidatos[0]
    const segundo = resultadosCandidatos[1]
    const margemVitoria = vencedor.percentual - (segundo?.percentual || 0)
    const segundoTurno = vencedor.percentual < 50
    
    const novoResultado: ResultadoSimulacao = {
      candidatos: resultadosCandidatos,
      totalVotos: totalVotosSimulados,
      vencedor: vencedor.nome,
      margemVitoria,
      segundoTurno
    }
    
    setResultado(novoResultado)
    setHistorico(prev => [...prev.slice(-4), novoResultado])
  }

  const resetar = () => {
    setConfig({
      taxaComparecimento: 80,
      taxaIndecisos: 15,
      transferenciasVotos: Object.fromEntries(candidatos.map(c => [c.id, 0])),
      efeitoCampanha: 0,
      mobilizacaoJovens: 50,
      mobilizacaoIdosos: 50
    })
    setResultado(null)
  }

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  const pieData = resultado?.candidatos.map((c, i) => ({
    name: c.nome,
    value: c.percentual,
    color: COLORS[i % COLORS.length]
  })) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-blue-500" />
            Simulador de Cenários Eleitorais
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Projete diferentes cenários e analise possíveis resultados
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={cargoSelecionado}
            onChange={(e) => setCargoSelecionado(e.target.value)}
            className="input"
          >
            <option value="prefeito">Prefeito</option>
            <option value="vereador">Vereador</option>
            <option value="governador">Governador</option>
            <option value="deputado_estadual">Deputado Estadual</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Configuração */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sliders className="w-5 h-5" />
                Parâmetros do Cenário
              </h3>

              <div className="space-y-6">
                {/* Taxa de Comparecimento */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Taxa de Comparecimento: {config.taxaComparecimento}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={config.taxaComparecimento}
                    onChange={(e) => setConfig(prev => ({ ...prev, taxaComparecimento: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                    <span>50%</span>
                    <span>95%</span>
                  </div>
                </div>

                {/* Taxa de Indecisos */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Eleitores Indecisos: {config.taxaIndecisos}%
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="40"
                    value={config.taxaIndecisos}
                    onChange={(e) => setConfig(prev => ({ ...prev, taxaIndecisos: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Efeito de Campanha */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Efeito de Campanha: {config.efeitoCampanha > 0 ? '+' : ''}{config.efeitoCampanha}%
                  </label>
                  <input
                    type="range"
                    min="-20"
                    max="20"
                    value={config.efeitoCampanha}
                    onChange={(e) => setConfig(prev => ({ ...prev, efeitoCampanha: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Mobilização Jovens */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mobilização Jovens (18-35): {config.mobilizacaoJovens}%
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="80"
                    value={config.mobilizacaoJovens}
                    onChange={(e) => setConfig(prev => ({ ...prev, mobilizacaoJovens: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Mobilização Idosos */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Mobilização Idosos (60+): {config.mobilizacaoIdosos}%
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="80"
                    value={config.mobilizacaoIdosos}
                    onChange={(e) => setConfig(prev => ({ ...prev, mobilizacaoIdosos: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Transferência de Votos Indecisos */}
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Distribuição de Indecisos
                  </label>
                  <div className="space-y-2">
                    {candidatos.slice(0, 4).map(candidato => (
                      <div key={candidato.id} className="flex items-center gap-2">
                        <span className="text-xs w-24 truncate">{candidato.nome}</span>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={config.transferenciasVotos[candidato.id] || 0}
                          onChange={(e) => setConfig(prev => ({
                            ...prev,
                            transferenciasVotos: {
                              ...prev.transferenciasVotos,
                              [candidato.id]: parseInt(e.target.value)
                            }
                          }))}
                          className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-xs w-8">{config.transferenciasVotos[candidato.id] || 0}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={simular}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Simular
                </button>
                <button
                  onClick={resetar}
                  className="btn-secondary flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-2 space-y-4">
            {resultado ? (
              <>
                {/* Cards de Resultado */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="text-sm text-[var(--text-muted)]">Total Votos</span>
                    </div>
                    <p className="text-xl font-bold">{resultado.totalVotos.toLocaleString('pt-BR')}</p>
                  </div>

                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm text-[var(--text-muted)]">Vencedor</span>
                    </div>
                    <p className="text-xl font-bold truncate">{resultado.vencedor}</p>
                  </div>

                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="w-5 h-5 text-amber-500" />
                      <span className="text-sm text-[var(--text-muted)]">Margem</span>
                    </div>
                    <p className="text-xl font-bold">{resultado.margemVitoria.toFixed(1)}%</p>
                  </div>

                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      {resultado.segundoTurno ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      <span className="text-sm text-[var(--text-muted)]">Turno</span>
                    </div>
                    <p className="text-xl font-bold">
                      {resultado.segundoTurno ? '2º Turno' : '1º Turno'}
                    </p>
                  </div>
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gráfico de Pizza */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4">Distribuição de Votos</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name.split(' ')[0]}: ${value.toFixed(1)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Gráfico de Barras */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4">Comparativo</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={resultado.candidatos.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="nome" tick={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="percentual" name="%" fill="#3B82F6">
                          {resultado.candidatos.slice(0, 5).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabela de Resultados */}
                <div className="card">
                  <div className="p-4 border-b border-[var(--border-color)]">
                    <h3 className="text-lg font-semibold">Resultado Detalhado</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[var(--bg-secondary)]">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Posição</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Candidato</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Partido</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Votos</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">%</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Variação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]">
                        {resultado.candidatos.map((candidato, index) => (
                          <tr key={index} className="hover:bg-[var(--bg-secondary)]">
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                index === 0 ? 'bg-amber-100 text-amber-700' :
                                index === 1 ? 'bg-gray-100 text-gray-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium">{candidato.nome}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                {candidato.partido}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">{candidato.votos.toLocaleString('pt-BR')}</td>
                            <td className="px-4 py-3 text-right font-medium">{candidato.percentual.toFixed(2)}%</td>
                            <td className="px-4 py-3 text-right">
                              <span className={candidato.variacao >= 0 ? 'text-green-600' : 'text-red-500'}>
                                {candidato.variacao >= 0 ? '+' : ''}{candidato.variacao.toFixed(2)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="card p-12 text-center">
                <TrendingUp className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-500 mb-2">
                  Configure os parâmetros e clique em Simular
                </h3>
                <p className="text-sm text-gray-400">
                  Ajuste os controles à esquerda para criar diferentes cenários eleitorais
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
