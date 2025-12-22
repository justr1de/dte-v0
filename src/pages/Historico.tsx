import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  RefreshCw,
  Filter,
  BarChart3,
  Users,
  MapPin
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

interface MunicipioHistorico {
  municipio: string
  votos_2020: number
  votos_2022: number
  votos_2024: number
  variacao_2020_2024: number
  variacao_2022_2024: number
  tendencia: 'crescente' | 'estavel' | 'decrescente'
}

export default function Historico() {
  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState<MunicipioHistorico[]>([])
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>('todos')
  const [ordenacao, setOrdenacao] = useState<'nome' | 'variacao' | 'votos'>('votos')
  const [totais, setTotais] = useState({
    total_2020: 0,
    total_2022: 0,
    total_2024: 0,
    variacao_geral: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar dados de 2020 e 2024 da tabela boletins_urna (Prefeito)
      const getVotosPorMunicipio = async (ano: number, cargo: number) => {
        let allData: any[] = []
        let page = 0
        const pageSize = 50000

        while (true) {
          const { data, error } = await supabase
            .from('boletins_urna')
            .select('nm_municipio, nr_zona, nr_secao, qt_comparecimento')
            .eq('ano_eleicao', ano)
            .eq('nr_turno', 1)
            .eq('sg_uf', 'RO')
            .eq('cd_cargo_pergunta', cargo)
            .range(page * pageSize, (page + 1) * pageSize - 1)

          if (error) throw error
          if (!data || data.length === 0) break
          
          allData = [...allData, ...data]
          if (data.length < pageSize) break
          page++
        }

        const municipios: Record<string, number> = {}
        const secoesVistas = new Set<string>()

        allData.forEach(row => {
          if (!row.nm_municipio) return
          
          const secaoKey = `${row.nm_municipio}-${row.nr_zona}-${row.nr_secao}`
          if (secoesVistas.has(secaoKey)) return
          secoesVistas.add(secaoKey)

          if (!municipios[row.nm_municipio]) {
            municipios[row.nm_municipio] = 0
          }
          municipios[row.nm_municipio] += row.qt_comparecimento || 0
        })

        return municipios
      }

      // Buscar dados de 2022 da tabela votacao_municipio_2022 (Governador)
      const getVotos2022 = async () => {
        const { data, error } = await supabase
          .from('votacao_municipio_2022')
          .select('nm_municipio, total_votos')
          .eq('ds_cargo', 'GOVERNADOR')

        if (error) throw error
        
        const municipios: Record<string, number> = {}
        ;(data || []).forEach(row => {
          municipios[row.nm_municipio] = row.total_votos
        })
        return municipios
      }

      const [votos2020, votos2022, votos2024] = await Promise.all([
        getVotosPorMunicipio(2020, 11),
        getVotos2022(),
        getVotosPorMunicipio(2024, 11)
      ])

      // Combinar todos os municípios
      const todosMunicipios = new Set([
        ...Object.keys(votos2020),
        ...Object.keys(votos2022),
        ...Object.keys(votos2024)
      ])

      // Criar dados combinados
      const dadosCombinados: MunicipioHistorico[] = Array.from(todosMunicipios).map(mun => {
        const v2020 = votos2020[mun] || 0
        const v2022 = votos2022[mun] || 0
        const v2024 = votos2024[mun] || 0
        
        const variacao_2020_2024 = v2020 > 0 ? ((v2024 - v2020) / v2020) * 100 : 0
        const variacao_2022_2024 = v2022 > 0 ? ((v2024 - v2022) / v2022) * 100 : 0
        
        let tendencia: 'crescente' | 'estavel' | 'decrescente' = 'estavel'
        if (variacao_2020_2024 > 5) tendencia = 'crescente'
        else if (variacao_2020_2024 < -5) tendencia = 'decrescente'
        
        return {
          municipio: mun,
          votos_2020: v2020,
          votos_2022: v2022,
          votos_2024: v2024,
          variacao_2020_2024,
          variacao_2022_2024,
          tendencia
        }
      })

      // Calcular totais
      const total_2020 = Object.values(votos2020).reduce((a, b) => a + b, 0)
      const total_2022 = Object.values(votos2022).reduce((a, b) => a + b, 0)
      const total_2024 = Object.values(votos2024).reduce((a, b) => a + b, 0)
      const variacao_geral = total_2020 > 0 ? ((total_2024 - total_2020) / total_2020) * 100 : 0

      setTotais({ total_2020, total_2022, total_2024, variacao_geral })
      setDados(dadosCombinados)

    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDadosOrdenados = () => {
    let dadosFiltrados = [...dados]
    
    if (municipioSelecionado !== 'todos') {
      dadosFiltrados = dadosFiltrados.filter(d => d.municipio === municipioSelecionado)
    }

    switch (ordenacao) {
      case 'nome':
        return dadosFiltrados.sort((a, b) => a.municipio.localeCompare(b.municipio))
      case 'variacao':
        return dadosFiltrados.sort((a, b) => b.variacao_2020_2024 - a.variacao_2020_2024)
      case 'votos':
      default:
        return dadosFiltrados.sort((a, b) => b.votos_2024 - a.votos_2024)
    }
  }

  const dadosOrdenados = getDadosOrdenados()

  const dadosGraficoEvolucao = [
    { ano: '2020', votos: totais.total_2020, label: 'Municipal' },
    { ano: '2022', votos: totais.total_2022, label: 'Estadual' },
    { ano: '2024', votos: totais.total_2024, label: 'Municipal' }
  ]

  const dadosGraficoMunicipios = dadosOrdenados.slice(0, 15).map(d => ({
    municipio: d.municipio.length > 12 ? d.municipio.substring(0, 12) + '...' : d.municipio,
    '2020': d.votos_2020,
    '2022': d.votos_2022,
    '2024': d.votos_2024
  }))

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'crescente':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'decrescente':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-yellow-500" />
    }
  }

  const getTendenciaColor = (tendencia: string) => {
    switch (tendencia) {
      case 'crescente':
        return 'bg-green-100 text-green-700'
      case 'decrescente':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-yellow-100 text-yellow-700'
    }
  }

  const exportarCSV = () => {
    const headers = ['Município', 'Votos 2020', 'Votos 2022', 'Votos 2024', 'Variação 2020-2024 (%)', 'Tendência']
    const rows = dadosOrdenados.map(d => [
      d.municipio,
      d.votos_2020,
      d.votos_2022,
      d.votos_2024,
      d.variacao_2020_2024.toFixed(2),
      d.tendencia
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'historico_participacao_ro.csv'
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-7 h-7 text-purple-500" />
            Evolução da Participação Eleitoral
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Análise histórica de 2020, 2022 e 2024 para os 52 municípios de Rondônia
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={exportarCSV}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">2020 - Municipal</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {totais.total_2020.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">2022 - Estadual</p>
                  <p className="text-2xl font-bold text-green-600">
                    {totais.total_2022.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">2024 - Municipal</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {totais.total_2024.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${totais.variacao_geral >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {totais.variacao_geral >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Variação 2020→2024</p>
                  <p className={`text-2xl font-bold ${totais.variacao_geral >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totais.variacao_geral >= 0 ? '+' : ''}{totais.variacao_geral.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráfico de Evolução Geral */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              Evolução da Participação em Rondônia
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dadosGraficoEvolucao}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="ano" stroke="var(--text-muted)" />
                  <YAxis stroke="var(--text-muted)" tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Votos']}
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="votos" 
                    stroke="#8B5CF6" 
                    fill="#8B5CF6" 
                    fillOpacity={0.3}
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filtros */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-[var(--text-muted)]" />
              <span className="font-semibold">Filtros</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-[var(--text-muted)] mb-1 block">Município</label>
                <select
                  value={municipioSelecionado}
                  onChange={(e) => setMunicipioSelecionado(e.target.value)}
                  className="input w-full"
                >
                  <option value="todos">Todos os 52 municípios</option>
                  {dados.map(d => d.municipio).sort().map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-[var(--text-muted)] mb-1 block">Ordenar por</label>
                <select
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value as any)}
                  className="input w-full"
                >
                  <option value="votos">Maior número de votos</option>
                  <option value="variacao">Maior variação</option>
                  <option value="nome">Nome do município</option>
                </select>
              </div>
              <div className="flex items-end">
                <p className="text-sm text-[var(--text-muted)]">
                  Exibindo {dadosOrdenados.length} de {dados.length} municípios
                </p>
              </div>
            </div>
          </div>

          {/* Gráfico Comparativo por Município */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-500" />
              Comparativo por Município (Top 15)
            </h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGraficoMunicipios} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis type="number" stroke="var(--text-muted)" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="municipio" stroke="var(--text-muted)" width={120} />
                  <Tooltip 
                    formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Votos']}
                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
                  />
                  <Legend />
                  <Bar dataKey="2020" fill="#3B82F6" name="2020 (Municipal)" />
                  <Bar dataKey="2022" fill="#10B981" name="2022 (Estadual)" />
                  <Bar dataKey="2024" fill="#F97316" name="2024 (Municipal)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela Detalhada */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)]">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-purple-500" />
                Detalhamento por Município
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Município</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">2020</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">2022</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">2024</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Var. 2020→2024</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Tendência</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosOrdenados.map((d, index) => (
                    <tr key={d.municipio} className={index % 2 === 0 ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-secondary)]'}>
                      <td className="px-4 py-3 font-medium">{d.municipio}</td>
                      <td className="px-4 py-3 text-right text-blue-600">{d.votos_2020.toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right text-green-600">{d.votos_2022.toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{d.votos_2024.toLocaleString('pt-BR')}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${d.variacao_2020_2024 >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {d.variacao_2020_2024 >= 0 ? '+' : ''}{d.variacao_2020_2024.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTendenciaColor(d.tendencia)}`}>
                            {getTendenciaIcon(d.tendencia)}
                            {d.tendencia === 'crescente' ? 'Crescente' : d.tendencia === 'decrescente' ? 'Decrescente' : 'Estável'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
