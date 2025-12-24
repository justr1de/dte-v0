import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart3,
  RefreshCw,
  Loader2,
  TrendingUp,
  Building2,
  Calendar,
  Download,
  Info
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
  Cell
} from 'recharts'

interface DadosMunicipio {
  municipio: string
  votos_2020: number
  votos_2022: number
  votos_2024: number
}

export default function ComparativoHistorico() {
  const [loading, setLoading] = useState(true)
  const [dados, setDados] = useState<DadosMunicipio[]>([])
  const [totais, setTotais] = useState({ total_2020: 0, total_2022: 0, total_2024: 0 })
  const [municipiosFiltro, setMunicipiosFiltro] = useState<string[]>([])
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('todos')
  const [tipoVisualizacao, setTipoVisualizacao] = useState<'top15' | 'todos'>('top15')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Usar função RPC para buscar votos por município corretamente
      const getVotosPorMunicipio = async (ano: number, cargo: number) => {
        const { data, error } = await supabase.rpc('get_votos_por_municipio', {
          p_ano: ano,
          p_cargo: cargo
        })

        if (error) {
          console.error(`Erro ao buscar dados de ${ano}:`, error)
          throw error
        }

        const municipios: Record<string, number> = {}
        ;(data || []).forEach((row: any) => {
          municipios[row.nm_municipio] = row.total_votos
        })
        return municipios
      }

      // Buscar dados de 2022 da tabela votacao_municipio_2022 (Governador)
      const getVotos2022Governador = async () => {
        const { data, error } = await supabase
          .from('votacao_municipio_2022')
          .select('nm_municipio, total_votos')
          .eq('ds_cargo', 'GOVERNADOR')

        if (error) {
          console.error('Erro ao buscar dados de 2022:', error)
          throw error
        }
        
        const municipios: Record<string, number> = {}
        ;(data || []).forEach(row => {
          municipios[row.nm_municipio] = row.total_votos
        })
        return municipios
      }

      // Buscar dados de cada ano usando a função RPC correta
      // 2020 e 2024: Prefeito (cargo 11) usando RPC
      // 2022: Governador da tabela votacao_municipio_2022
      const [votos2020, votos2022, votos2024] = await Promise.all([
        getVotosPorMunicipio(2020, 11),
        getVotos2022Governador(),
        getVotosPorMunicipio(2024, 11)
      ])

      // Combinar todos os municípios
      const todosMunicipios = new Set([
        ...Object.keys(votos2020),
        ...Object.keys(votos2022),
        ...Object.keys(votos2024)
      ])

      // Criar dados combinados
      const dadosCombinados: DadosMunicipio[] = Array.from(todosMunicipios).map(mun => ({
        municipio: mun,
        votos_2020: votos2020[mun] || 0,
        votos_2022: votos2022[mun] || 0,
        votos_2024: votos2024[mun] || 0
      }))

      // Ordenar por total de votos (soma dos 3 anos)
      dadosCombinados.sort((a, b) => 
        (b.votos_2020 + b.votos_2022 + b.votos_2024) - (a.votos_2020 + a.votos_2022 + a.votos_2024)
      )

      setDados(dadosCombinados)
      setMunicipiosFiltro(dadosCombinados.map(d => d.municipio).sort())
      
      // Calcular totais
      const total2020 = Object.values(votos2020).reduce((a, b) => a + b, 0)
      const total2022 = Object.values(votos2022).reduce((a, b) => a + b, 0)
      const total2024 = Object.values(votos2024).reduce((a, b) => a + b, 0)
      
      console.log('Totais calculados:', { total2020, total2022, total2024 })
      
      setTotais({
        total_2020: total2020,
        total_2022: total2022,
        total_2024: total2024
      })

    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDadosGrafico = () => {
    let dadosFiltrados = [...dados]
    
    if (filtroMunicipio !== 'todos') {
      dadosFiltrados = dadosFiltrados.filter(d => d.municipio === filtroMunicipio)
    }

    if (tipoVisualizacao === 'top15') {
      return dadosFiltrados.slice(0, 15)
    }
    
    return dadosFiltrados
  }

  const exportarCSV = () => {
    const headers = ['Município', 'Votos 2020', 'Votos 2022', 'Votos 2024', 'Variação 2020-2024']
    const rows = dados.map(d => {
      const variacao = d.votos_2020 > 0 ? ((d.votos_2024 - d.votos_2020) / d.votos_2020 * 100).toFixed(2) : 'N/A'
      return [d.municipio, d.votos_2020, d.votos_2022, d.votos_2024, variacao]
    })
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'comparativo_historico_votos.csv'
    link.click()
  }

  const dadosGrafico = getDadosGrafico()

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-primary)] p-3 border border-[var(--border-color)] rounded-lg shadow-lg">
          <p className="font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value.toLocaleString('pt-BR')} votos
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-[var(--accent-color)]" />
            Comparativo Histórico
          </h1>
          <p className="text-[var(--text-secondary)]">Comparação de votos por município entre 2020, 2022 e 2024</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={fetchData}
            className="px-4 py-2 rounded-lg bg-[var(--accent-color)] text-white flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button
            onClick={exportarCSV}
            className="px-4 py-2 rounded-lg border border-[var(--border-color)] flex items-center gap-2 hover:bg-[var(--bg-secondary)]"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Aviso sobre os dados */}
      <div className="card p-4 bg-blue-500/10 border-blue-500/30">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-500">Sobre os dados</p>
            <p className="text-sm text-[var(--text-secondary)]">
              <strong>2020 e 2024:</strong> Eleições Municipais (Prefeito) - Comparação direta possível<br/>
              <strong>2022:</strong> Eleições Gerais (Governador) - Referência de participação estadual
            </p>
          </div>
        </div>
      </div>

      {/* Cards de Totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[var(--text-secondary)]">2020 - Eleições Municipais</span>
          </div>
          <p className="text-2xl font-bold text-blue-500">{totais.total_2020.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-[var(--text-secondary)]">votos (Prefeito)</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-green-500" />
            <span className="text-sm text-[var(--text-secondary)]">2022 - Eleições Gerais</span>
          </div>
          <p className="text-2xl font-bold text-green-500">{totais.total_2022.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-[var(--text-secondary)]">votos (Governador)</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-[var(--text-secondary)]">2024 - Eleições Municipais</span>
          </div>
          <p className="text-2xl font-bold text-orange-500">{totais.total_2024.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-[var(--text-secondary)]">votos (Prefeito)</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">Município</label>
            <select
              value={filtroMunicipio}
              onChange={(e) => setFiltroMunicipio(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
            >
              <option value="todos">Todos os municípios</option>
              {municipiosFiltro.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">Visualização</label>
            <select
              value={tipoVisualizacao}
              onChange={(e) => setTipoVisualizacao(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
            >
              <option value="top15">Top 15 municípios</option>
              <option value="todos">Todos os municípios</option>
            </select>
          </div>
          <div className="flex items-end">
            <p className="text-sm text-[var(--text-secondary)]">
              Exibindo {dadosGrafico.length} de {dados.length} municípios
            </p>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="card p-12 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
          <span className="ml-3">Carregando dados históricos...</span>
        </div>
      ) : (
        <>
          {/* Gráfico de Barras Horizontal */}
          <div className="card p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[var(--accent-color)]" />
              Total de Votos por Município (2020, 2022, 2024)
            </h3>
            <div style={{ height: Math.max(400, dadosGrafico.length * 35) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={dadosGrafico}
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => value.toLocaleString('pt-BR')}
                    stroke="var(--text-secondary)"
                  />
                  <YAxis 
                    dataKey="municipio" 
                    type="category" 
                    width={95}
                    tick={{ fontSize: 11 }}
                    stroke="var(--text-secondary)"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="votos_2020" name="2020 (Municipal)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="votos_2022" name="2022 (Geral)" fill="#22c55e" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="votos_2024" name="2024 (Municipal)" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela de Detalhamento */}
          <div className="card p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[var(--accent-color)]" />
              Detalhamento por Município
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-3 px-4">Município</th>
                    <th className="text-right py-3 px-4">2020 (Prefeito)</th>
                    <th className="text-right py-3 px-4">2022 (Governador)</th>
                    <th className="text-right py-3 px-4">2024 (Prefeito)</th>
                    <th className="text-right py-3 px-4">Variação 2020-2024</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosGrafico.map((d, i) => {
                    const variacao = d.votos_2020 > 0 
                      ? ((d.votos_2024 - d.votos_2020) / d.votos_2020 * 100) 
                      : 0
                    return (
                      <tr key={i} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">
                        <td className="py-3 px-4 font-medium">{d.municipio}</td>
                        <td className="text-right py-3 px-4 text-blue-500">{d.votos_2020.toLocaleString('pt-BR')}</td>
                        <td className="text-right py-3 px-4 text-green-500">{d.votos_2022.toLocaleString('pt-BR')}</td>
                        <td className="text-right py-3 px-4 text-orange-500">{d.votos_2024.toLocaleString('pt-BR')}</td>
                        <td className={`text-right py-3 px-4 flex items-center justify-end gap-1 ${variacao >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          <TrendingUp className={`w-4 h-4 ${variacao < 0 ? 'rotate-180' : ''}`} />
                          {variacao.toFixed(1)}%
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Fonte dos dados */}
      <div className="text-center text-sm text-[var(--text-secondary)] py-4">
        Fonte: Tribunal Superior Eleitoral (TSE) - Dados processados pelo DTE
      </div>
    </div>
  )
}
