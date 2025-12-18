import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Layout from '@/components/Layout'
import {
  MapPin,
  Filter,
  RefreshCw,
  Loader2,
  ThermometerSun,
  Users,
  Vote,
  TrendingUp,
  Download,
  Layers,
  Info,
  BarChart3,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface MunicipioData {
  cd_municipio: number
  nm_municipio: string
  total_votos: number
  total_aptos: number
  total_comparecimento: number
  total_abstencoes: number
  participacao: number
  abstencao: number
}

type MetricType = 'votos' | 'participacao' | 'abstencao' | 'densidade'

export default function Mapas() {
  const [loading, setLoading] = useState(true)
  const [municipios, setMunicipios] = useState<MunicipioData[]>([])
  const [filtroAno, setFiltroAno] = useState<number>(2024)
  const [filtroTurno, setFiltroTurno] = useState<number>(1)
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('todos')
  const [metricaSelecionada, setMetricaSelecionada] = useState<MetricType>('votos')
  const [listaMunicipios, setListaMunicipios] = useState<string[]>([])
  const [totalVotosGeral, setTotalVotosGeral] = useState(0)
  const [totalEleitores, setTotalEleitores] = useState(0)
  
  // Paginação
  const [page, setPage] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    fetchData()
  }, [filtroAno, filtroTurno])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Usar a função SQL de agregação para buscar dados já processados
      const { data, error } = await supabase.rpc('get_mapa_eleitoral', {
        p_ano: filtroAno,
        p_turno: filtroTurno
      })

      if (error) throw error

      if (data && data.length > 0) {
        // Dados já vêm agregados e ordenados do banco
        const municipiosData: MunicipioData[] = data.map((d: any) => ({
          cd_municipio: d.cd_municipio,
          nm_municipio: d.nm_municipio,
          total_votos: Number(d.total_votos) || 0,
          total_aptos: Number(d.total_aptos) || 0,
          total_comparecimento: Number(d.total_comparecimento) || 0,
          total_abstencoes: Number(d.total_abstencoes) || 0,
          participacao: Number(d.participacao) || 0,
          abstencao: Number(d.abstencao) || 0
        }))

        // Calcular totais
        let totalVotos = 0
        let totalAptos = 0
        const municipioSet = new Set<string>()

        municipiosData.forEach(m => {
          totalVotos += m.total_votos
          totalAptos += m.total_aptos
          municipioSet.add(m.nm_municipio?.toUpperCase() || '')
        })

        setMunicipios(municipiosData)
        setListaMunicipios(Array.from(municipioSet).sort())
        setTotalVotosGeral(totalVotos)
        setTotalEleitores(totalAptos)
      } else {
        setMunicipios([])
        setListaMunicipios([])
        setTotalVotosGeral(0)
        setTotalEleitores(0)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMetricValue = (m: MunicipioData): number => {
    switch (metricaSelecionada) {
      case 'votos': return m.total_votos
      case 'participacao': return m.participacao
      case 'abstencao': return m.abstencao
      case 'densidade': return m.total_aptos
      default: return m.total_votos
    }
  }

  const filteredData = useMemo(() => {
    if (filtroMunicipio === 'todos') return municipios
    return municipios.filter(m => m.nm_municipio?.toUpperCase() === filtroMunicipio)
  }, [municipios, filtroMunicipio])

  // Reset página quando filtros mudam
  useEffect(() => {
    setPage(1)
  }, [filtroMunicipio, filtroAno, filtroTurno])

  // Paginação
  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const dadosPaginados = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  // Calcular cor da barra baseada na métrica
  const getBarColor = (m: MunicipioData) => {
    const maxValue = Math.max(...municipios.map(mun => getMetricValue(mun)), 1)
    const value = getMetricValue(m)
    const ratio = value / maxValue
    
    if (metricaSelecionada === 'abstencao') {
      if (ratio > 0.7) return 'bg-red-500'
      if (ratio > 0.4) return 'bg-yellow-500'
      return 'bg-green-500'
    } else {
      if (ratio > 0.7) return 'bg-red-500'
      if (ratio > 0.5) return 'bg-yellow-500'
      if (ratio > 0.3) return 'bg-green-500'
      return 'bg-blue-500'
    }
  }

  const getBarWidth = (m: MunicipioData) => {
    const maxValue = Math.max(...municipios.map(mun => getMetricValue(mun)), 1)
    const value = getMetricValue(m)
    return `${(value / maxValue) * 100}%`
  }

  const formatMetricValue = (m: MunicipioData) => {
    const value = getMetricValue(m)
    if (metricaSelecionada === 'participacao' || metricaSelecionada === 'abstencao') {
      return `${value.toFixed(1)}%`
    }
    return value.toLocaleString('pt-BR')
  }

  const metricas = [
    { key: 'votos' as MetricType, label: 'Total de Votos', icon: Vote, description: 'Quantidade total de votos apurados' },
    { key: 'participacao' as MetricType, label: 'Participação (%)', icon: TrendingUp, description: 'Percentual de comparecimento' },
    { key: 'abstencao' as MetricType, label: 'Abstenção (%)', icon: Users, description: 'Percentual de abstenção' },
    { key: 'densidade' as MetricType, label: 'Eleitores Aptos', icon: MapPin, description: 'Total de eleitores aptos a votar' },
  ]

  const exportToCSV = () => {
    const headers = ['Posição', 'Município', 'Total Votos', 'Eleitores Aptos', 'Participação (%)', 'Abstenção (%)']
    const rows = filteredData.map((m, i) => [
      i + 1,
      m.nm_municipio,
      m.total_votos,
      m.total_aptos,
      m.participacao.toFixed(2),
      m.abstencao.toFixed(2)
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `mapa_eleitoral_${filtroAno}_turno${filtroTurno}.csv`
    link.click()
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ThermometerSun className="w-7 h-7 text-[var(--accent-color)]" />
              Mapas Eleitorais
            </h1>
            <p className="text-[var(--text-secondary)]">Visualização geográfica dos dados eleitorais de Rondônia</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={filtroAno}
              onChange={(e) => setFiltroAno(Number(e.target.value))}
              className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
            >
              <option value={2024}>2024</option>
              <option value={2022}>2022</option>
              <option value={2020}>2020</option>
            </select>
            <select
              value={filtroTurno}
              onChange={(e) => setFiltroTurno(Number(e.target.value))}
              className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
            >
              <option value={1}>1º Turno</option>
              <option value={2}>2º Turno</option>
            </select>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[var(--accent-color)] text-white flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Atualizar
            </button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
              <Vote className="w-4 h-4" />
              <span className="text-sm">Total de Votos</span>
            </div>
            <p className="text-2xl font-bold">{totalVotosGeral.toLocaleString('pt-BR')}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm">Eleitores Aptos</span>
            </div>
            <p className="text-2xl font-bold">{totalEleitores.toLocaleString('pt-BR')}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Municípios</span>
            </div>
            <p className="text-2xl font-bold">{municipios.length}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Participação Média</span>
            </div>
            <p className="text-2xl font-bold">
              {municipios.length > 0 
                ? (municipios.reduce((acc, m) => acc + m.participacao, 0) / municipios.length).toFixed(1) 
                : 0}%
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-[var(--accent-color)]" />
              <span className="font-semibold">Filtros:</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={metricaSelecionada}
                onChange={(e) => setMetricaSelecionada(e.target.value as MetricType)}
                className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
              >
                {metricas.map(m => (
                  <option key={m.key} value={m.key}>{m.label}</option>
                ))}
              </select>
              <select
                value={filtroMunicipio}
                onChange={(e) => setFiltroMunicipio(e.target.value)}
                className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
              >
                <option value="todos">Todos os municípios</option>
                {listaMunicipios.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
            <span className="ml-2">Carregando dados do mapa...</span>
          </div>
        ) : (
          <>
            {/* Visualização de Calor - Barras */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[var(--accent-color)]" />
                  <h2 className="text-lg font-semibold">Mapa de Calor - {metricas.find(m => m.key === metricaSelecionada)?.label}</h2>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--text-secondary)]">Legenda:</span>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded bg-blue-500"></div>
                      <span>Baixo</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded bg-green-500"></div>
                      <span>Médio-Baixo</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded bg-yellow-500"></div>
                      <span>Médio</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded bg-red-500"></div>
                      <span>Alto</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {filteredData.map((m, index) => (
                  <div key={m.cd_municipio} className="flex items-center gap-4">
                    <span className="w-8 text-right text-[var(--text-secondary)]">{index + 1}</span>
                    <span className="w-40 truncate font-medium">{m.nm_municipio}</span>
                    <div className="flex-1 h-6 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getBarColor(m)} transition-all duration-500`}
                        style={{ width: getBarWidth(m) }}
                      ></div>
                    </div>
                    <span className="w-24 text-right font-semibold">{formatMetricValue(m)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabela de Ranking */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[var(--accent-color)]" />
                  <h2 className="text-lg font-semibold">Ranking por Município - {metricas.find(m => m.key === metricaSelecionada)?.label}</h2>
                </div>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center gap-2 hover:bg-[var(--bg-card)] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="text-left py-3 px-4">#</th>
                      <th className="text-left py-3 px-4">Município</th>
                      <th className="text-right py-3 px-4">Total Votos</th>
                      <th className="text-right py-3 px-4">Eleitores</th>
                      <th className="text-right py-3 px-4">Participação</th>
                      <th className="text-right py-3 px-4">Abstenção</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dadosPaginados.map((m, index) => {
                      const globalIndex = (page - 1) * itemsPerPage + index
                      return (
                        <tr key={m.cd_municipio} className={`border-b border-[var(--border-color)]/50 hover:bg-[var(--bg-secondary)]/50 transition-colors ${globalIndex % 2 === 0 ? 'bg-[var(--bg-secondary)]/30' : ''}`}>
                          <td className="py-3 px-4 text-[var(--text-muted)]">{globalIndex + 1}</td>
                          <td className="py-3 px-4 font-medium">{m.nm_municipio}</td>
                          <td className="py-3 px-4 text-right font-mono">{m.total_votos.toLocaleString('pt-BR')}</td>
                          <td className="py-3 px-4 text-right font-mono">{m.total_aptos.toLocaleString('pt-BR')}</td>
                          <td className="py-3 px-4 text-right"><span className="text-green-500 font-medium">{m.participacao.toFixed(1)}%</span></td>
                          <td className="py-3 px-4 text-right"><span className="text-red-500 font-medium">{m.abstencao.toFixed(1)}%</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Controles de Paginação */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-color)]">
                <p className="text-sm text-[var(--text-secondary)]">
                  Mostrando {((page - 1) * itemsPerPage) + 1} a {Math.min(page * itemsPerPage, filteredData.length)} de {filteredData.length} municípios
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
                  >
                    Primeira
                  </button>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                            page === pageNum 
                              ? 'bg-blue-600 text-white' 
                              : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
                  >
                    Última
                  </button>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="card p-4 bg-blue-500/10 border-blue-500/30">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-500">Sobre a Visualização</h3>
                  <p className="text-sm text-[var(--text-secondary)]">
                    O gráfico de barras mostra a concentração de votos e outras métricas eleitorais nos municípios de Rondônia. 
                    O tamanho das barras representa a intensidade da métrica selecionada - barras maiores indicam valores mais altos. 
                    As cores variam de azul (baixo) a vermelho (alto), indicando a intensidade relativa de cada município.
                    <br /><br />
                    <strong>Fonte dos dados:</strong> Portal de Dados Abertos do TSE - Boletins de Urna consolidados.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
