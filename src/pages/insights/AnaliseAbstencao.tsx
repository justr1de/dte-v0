import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  AlertTriangle,
  Users,
  TrendingDown,
  TrendingUp,
  MapPin,
  Target,
  Download,
  RefreshCw,
  Percent,
  ChevronDown,
  ChevronUp,
  Building2,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight
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
  ComposedChart,
  Area,
  AreaChart
} from 'recharts'

interface DadosMunicipio {
  nm_municipio: string
  total_aptos: number
  total_comparecimento: number
  total_abstencoes: number
  participacao: number
  abstencao: number
}

interface DadosZona {
  nr_zona: number
  total_aptos: number
  total_comparecimento: number
  total_abstencoes: number
  votos_brancos: number
  votos_nulos: number
  taxa_abstencao: number
}

export default function AnaliseAbstencao() {
  const [loading, setLoading] = useState(true)
  const [dadosMunicipios, setDadosMunicipios] = useState<DadosMunicipio[]>([])
  const [dadosZonas, setDadosZonas] = useState<DadosZona[]>([])
  const [dadosHistorico, setDadosHistorico] = useState<any[]>([])
  const [anoSelecionado, setAnoSelecionado] = useState('2024')
  const [turnoSelecionado, setTurnoSelecionado] = useState('1')
  const [expandedMunicipio, setExpandedMunicipio] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [anoSelecionado, turnoSelecionado])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar dados por município usando get_mapa_eleitoral
      const { data: municipiosData, error: municipiosError } = await supabase
        .rpc('get_mapa_eleitoral', { 
          p_ano: parseInt(anoSelecionado), 
          p_turno: parseInt(turnoSelecionado) 
        })

      if (municipiosError) {
        console.error('Erro ao buscar municípios:', municipiosError)
      } else if (municipiosData) {
        setDadosMunicipios(municipiosData)
      }

      // Buscar dados por zona usando get_dados_territoriais
      const { data: zonasData, error: zonasError } = await supabase
        .rpc('get_dados_territoriais', { 
          p_ano: parseInt(anoSelecionado), 
          p_turno: parseInt(turnoSelecionado) 
        })

      if (zonasError) {
        console.error('Erro ao buscar zonas:', zonasError)
      } else if (zonasData) {
        const zonasProcessadas = zonasData.map((zona: any) => ({
          ...zona,
          taxa_abstencao: zona.total_aptos > 0 
            ? (zona.total_abstencoes / zona.total_aptos) * 100 
            : 0
        }))
        setDadosZonas(zonasProcessadas)
      }

      // Buscar dados históricos para comparação
      const historico = []
      for (const ano of [2020, 2024]) {
        const { data } = await supabase
          .rpc('get_mapa_eleitoral', { p_ano: ano, p_turno: 1 })
        if (data && data.length > 0) {
          const totalAptos = data.reduce((acc: number, d: any) => acc + (d.total_aptos || 0), 0)
          const totalAbstencoes = data.reduce((acc: number, d: any) => acc + (d.total_abstencoes || 0), 0)
          historico.push({
            ano: ano.toString(),
            taxa: totalAptos > 0 ? (totalAbstencoes / totalAptos) * 100 : 0,
            abstencoes: totalAbstencoes,
            aptos: totalAptos
          })
        }
      }
      setDadosHistorico(historico)

    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cálculos de resumo
  const totalAptos = dadosMunicipios.reduce((acc, d) => acc + (d.total_aptos || 0), 0)
  const totalComparecimento = dadosMunicipios.reduce((acc, d) => acc + (d.total_comparecimento || 0), 0)
  const totalAbstencao = dadosMunicipios.reduce((acc, d) => acc + (d.total_abstencoes || 0), 0)
  const taxaAbstencaoGeral = totalAptos > 0 ? (totalAbstencao / totalAptos) * 100 : 0

  // Classificar municípios por abstenção
  const municipiosOrdenados = [...dadosMunicipios].sort((a, b) => (b.abstencao || 0) - (a.abstencao || 0))
  const top10MaiorAbstencao = municipiosOrdenados.slice(0, 10)
  const top10MenorAbstencao = [...dadosMunicipios].sort((a, b) => (a.abstencao || 0) - (b.abstencao || 0)).slice(0, 10)

  // Classificar zonas por abstenção
  const zonasOrdenadas = [...dadosZonas].sort((a, b) => b.taxa_abstencao - a.taxa_abstencao)
  const zonasAltaAbstencao = dadosZonas.filter(z => z.taxa_abstencao > 25)
  const zonasMediaAbstencao = dadosZonas.filter(z => z.taxa_abstencao > 15 && z.taxa_abstencao <= 25)
  const zonasBaixaAbstencao = dadosZonas.filter(z => z.taxa_abstencao <= 15)

  // Dados para gráficos
  const barDataMunicipios = top10MaiorAbstencao.map(d => ({
    municipio: d.nm_municipio?.substring(0, 12) || 'N/A',
    taxa: parseFloat((d.abstencao || 0).toFixed(1)),
    abstencoes: d.total_abstencoes || 0
  }))

  const barDataZonas = zonasOrdenadas.slice(0, 15).map(z => ({
    zona: `Z${z.nr_zona}`,
    taxa: parseFloat(z.taxa_abstencao.toFixed(1)),
    abstencoes: z.total_abstencoes,
    comparecimento: z.total_comparecimento
  }))

  const pieData = [
    { name: 'Compareceram', value: totalComparecimento, color: '#10B981' },
    { name: 'Abstiveram', value: totalAbstencao, color: '#EF4444' }
  ]

  const distribuicaoRisco = [
    { name: 'Alta (>25%)', value: zonasAltaAbstencao.length, color: '#EF4444' },
    { name: 'Média (15-25%)', value: zonasMediaAbstencao.length, color: '#F59E0B' },
    { name: 'Baixa (<15%)', value: zonasBaixaAbstencao.length, color: '#10B981' }
  ]

  // Calcular variação histórica
  const variacaoHistorica = dadosHistorico.length >= 2 
    ? dadosHistorico[dadosHistorico.length - 1].taxa - dadosHistorico[0].taxa 
    : 0

  // Potencial de votos (abstencionistas que podem ser mobilizados)
  const potencialVotos = Math.round(totalAbstencao * 0.1) // 10% dos abstencionistas

  const exportarCSV = () => {
    const headers = ['Município', 'Eleitores Aptos', 'Comparecimento', 'Abstenções', 'Taxa Abstenção %']
    const rows = dadosMunicipios.map(m => [
      m.nm_municipio,
      m.total_aptos,
      m.total_comparecimento,
      m.total_abstencoes,
      (m.abstencao || 0).toFixed(2)
    ])
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `analise_abstencao_${anoSelecionado}_T${turnoSelecionado}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-red-500" />
            Análise de Abstenção
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Identifique padrões de abstenção e oportunidades de mobilização eleitoral
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(e.target.value)}
            className="input"
          >
            <option value="2024">2024</option>
            <option value="2020">2020</option>
          </select>
          <select
            value={turnoSelecionado}
            onChange={(e) => setTurnoSelecionado(e.target.value)}
            className="input"
          >
            <option value="1">1º Turno</option>
            <option value="2">2º Turno</option>
          </select>
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={exportarCSV}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
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
                  <p className="text-sm text-[var(--text-muted)]">Eleitores Aptos</p>
                  <p className="text-2xl font-bold">{totalAptos.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Compareceram</p>
                  <p className="text-2xl font-bold">{totalComparecimento.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-red-100 text-red-600">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Abstiveram</p>
                  <p className="text-2xl font-bold">{totalAbstencao.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="card p-4 bg-red-50 border-red-200">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-red-200 text-red-700">
                  <Percent className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-red-700">Taxa Abstenção</p>
                  <p className="text-2xl font-bold text-red-700">{taxaAbstencaoGeral.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Zonas Críticas</p>
                  <p className="text-2xl font-bold">{zonasAltaAbstencao.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos Principais */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Taxa de Abstenção por Município */}
            <div className="lg:col-span-2 card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-red-500" />
                Top 10 Municípios com Maior Abstenção
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={barDataMunicipios} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 35]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="municipio" width={100} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'taxa' ? `${value}%` : value.toLocaleString('pt-BR'),
                      name === 'taxa' ? 'Taxa de Abstenção' : 'Total de Abstenções'
                    ]}
                  />
                  <Bar dataKey="taxa" name="Taxa %" fill="#EF4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Comparecimento vs Abstenção */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Comparecimento vs Abstenção</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {pieData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm">{entry.name}</span>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-semibold mt-6 mb-4">Classificação de Risco</h3>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie
                    data={distribuicaoRisco}
                    cx="50%"
                    cy="50%"
                    outerRadius={50}
                    dataKey="value"
                  >
                    {distribuicaoRisco.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-3 mt-2 flex-wrap">
                {distribuicaoRisco.map((entry, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-xs">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Evolução Histórica e Zonas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Evolução Histórica */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Evolução Histórica da Abstenção</h3>
              {dadosHistorico.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={dadosHistorico}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ano" />
                      <YAxis domain={[20, 35]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `${parseFloat(value).toFixed(2)}%`,
                          'Taxa de Abstenção'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="taxa" 
                        stroke="#EF4444" 
                        fill="#FEE2E2" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {variacaoHistorica < 0 ? (
                        <>
                          <ArrowDownRight className="w-5 h-5 text-green-600" />
                          <span className="text-green-600 font-medium">
                            Redução de {Math.abs(variacaoHistorica).toFixed(2)}% na abstenção
                          </span>
                        </>
                      ) : (
                        <>
                          <ArrowUpRight className="w-5 h-5 text-red-600" />
                          <span className="text-red-600 font-medium">
                            Aumento de {variacaoHistorica.toFixed(2)}% na abstenção
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Comparando {dadosHistorico[0]?.ano} com {dadosHistorico[dadosHistorico.length - 1]?.ano}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  Dados históricos não disponíveis
                </div>
              )}
            </div>

            {/* Taxa por Zona */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-500" />
                Taxa de Abstenção por Zona Eleitoral
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={barDataZonas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="zona" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 35]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="comparecimento" name="Comparecimento" fill="#10B981" />
                  <Bar yAxisId="left" dataKey="abstencoes" name="Abstenções" fill="#EF4444" />
                  <Line yAxisId="right" type="monotone" dataKey="taxa" name="Taxa %" stroke="#F59E0B" strokeWidth={2} dot />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela de Municípios com Alta Abstenção */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Municípios com Alta Abstenção (Prioridade de Mobilização)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Município</th>
                    <th className="text-right py-3 px-4">Eleitores Aptos</th>
                    <th className="text-right py-3 px-4">Comparecimento</th>
                    <th className="text-right py-3 px-4">Abstenção</th>
                    <th className="text-right py-3 px-4">Taxa</th>
                    <th className="text-center py-3 px-4">Nível</th>
                    <th className="text-left py-3 px-4">Ação Sugerida</th>
                  </tr>
                </thead>
                <tbody>
                  {top10MaiorAbstencao.map((mun, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{mun.nm_municipio}</td>
                      <td className="text-right py-3 px-4">{(mun.total_aptos || 0).toLocaleString('pt-BR')}</td>
                      <td className="text-right py-3 px-4 text-green-600">{(mun.total_comparecimento || 0).toLocaleString('pt-BR')}</td>
                      <td className="text-right py-3 px-4 text-red-600">{(mun.total_abstencoes || 0).toLocaleString('pt-BR')}</td>
                      <td className="text-right py-3 px-4">
                        <span className={`font-bold ${(mun.abstencao || 0) > 25 ? 'text-red-600' : (mun.abstencao || 0) > 20 ? 'text-amber-600' : 'text-green-600'}`}>
                          {(mun.abstencao || 0).toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          (mun.abstencao || 0) > 30 ? 'bg-red-100 text-red-700' :
                          (mun.abstencao || 0) > 25 ? 'bg-amber-100 text-amber-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {(mun.abstencao || 0) > 30 ? 'Crítico' : (mun.abstencao || 0) > 25 ? 'Alto' : 'Moderado'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {(mun.abstencao || 0) > 30 
                          ? 'Prioridade máxima: transporte e conscientização'
                          : (mun.abstencao || 0) > 25 
                          ? 'Campanha intensiva de mobilização'
                          : 'Monitorar e manter engajamento'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights e Oportunidades */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 border-l-4 border-red-500">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h4 className="font-semibold text-red-700">Alerta Crítico</h4>
              </div>
              <p className="text-sm text-gray-600">
                <strong>{zonasAltaAbstencao.length} zonas</strong> apresentam taxa de abstenção acima de 25%. 
                Estas áreas representam <strong>{zonasAltaAbstencao.reduce((acc, z) => acc + z.total_abstencoes, 0).toLocaleString('pt-BR')}</strong> eleitores 
                que não compareceram às urnas.
              </p>
            </div>

            <div className="card p-6 border-l-4 border-amber-500">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-amber-500" />
                <h4 className="font-semibold text-amber-700">Oportunidade</h4>
              </div>
              <p className="text-sm text-gray-600">
                Mobilizar apenas <strong>10%</strong> dos abstencionistas pode adicionar aproximadamente 
                <strong> {potencialVotos.toLocaleString('pt-BR')} votos</strong> à sua campanha.
              </p>
            </div>

            <div className="card p-6 border-l-4 border-blue-500">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-blue-500" />
                <h4 className="font-semibold text-blue-700">Estratégia</h4>
              </div>
              <p className="text-sm text-gray-600">
                Foque em campanhas de transporte e conscientização nas zonas críticas. 
                Considere parcerias com associações de bairro e igrejas locais para aumentar o comparecimento.
              </p>
            </div>
          </div>

          {/* Municípios com Menor Abstenção (Benchmark) */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Municípios com Menor Abstenção (Benchmark)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Estes municípios podem servir como referência para estratégias de mobilização bem-sucedidas.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {top10MenorAbstencao.slice(0, 5).map((mun, index) => (
                <div key={index} className="bg-green-50 p-4 rounded-lg text-center">
                  <p className="font-medium text-green-800 text-sm">{mun.nm_municipio}</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{(mun.abstencao || 0).toFixed(1)}%</p>
                  <p className="text-xs text-green-600">de abstenção</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
