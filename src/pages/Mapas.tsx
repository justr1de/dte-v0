import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
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
  BarChart3
} from 'lucide-react'

interface MunicipioData {
  cd_municipio: number
  nm_municipio: string
  totalVotos: number
  totalAptos: number
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

  useEffect(() => {
    fetchData()
  }, [filtroAno, filtroTurno])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: boletins, error } = await supabase
        .from('boletins_urna')
        .select('cd_municipio, nm_municipio, nr_zona, nr_secao, qt_votos, qt_aptos, qt_comparecimento, qt_abstencoes')
        .eq('ano_eleicao', filtroAno)
        .eq('nr_turno', filtroTurno)
        .limit(100000)

      if (error) throw error

      if (boletins && boletins.length > 0) {
        const municipioMap: Record<string, MunicipioData> = {}
        const municipioSet = new Set<string>()
        const secoesProcessadas = new Set<string>()

        boletins.forEach(b => {
          const nmMunicipio = b.nm_municipio?.toUpperCase() || ''
          const secaoKey = `${b.cd_municipio}-${b.nr_zona}-${b.nr_secao}`
          municipioSet.add(nmMunicipio)
          
          if (!municipioMap[nmMunicipio]) {
            municipioMap[nmMunicipio] = {
              cd_municipio: b.cd_municipio,
              nm_municipio: b.nm_municipio,
              totalVotos: 0,
              totalAptos: 0,
              participacao: 0,
              abstencao: 0
            }
          }
          
          municipioMap[nmMunicipio].totalVotos += b.qt_votos || 0

          // Contar aptos e abstenções apenas uma vez por seção
          if (!secoesProcessadas.has(secaoKey)) {
            secoesProcessadas.add(secaoKey)
            municipioMap[nmMunicipio].totalAptos += b.qt_aptos || 0
            municipioMap[nmMunicipio].abstencao += b.qt_abstencoes || 0
          }
        })

        // Calcular métricas e totais
        let totalVotos = 0
        let totalAptos = 0
        
        Object.values(municipioMap).forEach(m => {
          m.participacao = m.totalAptos > 0 ? (m.totalVotos / m.totalAptos) * 100 : 0
          m.abstencao = m.totalAptos > 0 ? (m.abstencao / m.totalAptos) * 100 : 0
          totalVotos += m.totalVotos
          totalAptos += m.totalAptos
        })

        setMunicipios(Object.values(municipioMap).sort((a, b) => b.totalVotos - a.totalVotos))
        setListaMunicipios(Array.from(municipioSet).sort())
        setTotalVotosGeral(totalVotos)
        setTotalEleitores(totalAptos)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMetricValue = (m: MunicipioData): number => {
    switch (metricaSelecionada) {
      case 'votos': return m.totalVotos
      case 'participacao': return m.participacao
      case 'abstencao': return m.abstencao
      case 'densidade': return m.totalAptos
      default: return m.totalVotos
    }
  }

  const filteredData = useMemo(() => {
    if (filtroMunicipio === 'todos') return municipios
    return municipios.filter(m => m.nm_municipio?.toUpperCase() === filtroMunicipio)
  }, [municipios, filtroMunicipio])

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

  const metricas = [
    { key: 'votos' as MetricType, label: 'Total de Votos', icon: Vote, description: 'Quantidade total de votos apurados' },
    { key: 'participacao' as MetricType, label: 'Participação (%)', icon: TrendingUp, description: 'Percentual de comparecimento' },
    { key: 'abstencao' as MetricType, label: 'Abstenção (%)', icon: Users, description: 'Percentual de abstenção' },
    { key: 'densidade' as MetricType, label: 'Eleitores Aptos', icon: MapPin, description: 'Total de eleitores aptos a votar' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
        <span className="ml-2">Carregando dados do mapa...</span>
      </div>
    )
  }

  return (
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
            className="px-4 py-2 rounded-lg bg-[var(--accent-color)] text-white flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
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
            {totalEleitores > 0 ? ((totalVotosGeral / totalEleitores) * 100).toFixed(1) : 0}%
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

        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredData.map((m, index) => (
            <div key={m.cd_municipio} className="flex items-center gap-3 p-2 hover:bg-[var(--bg-secondary)] rounded-lg transition-colors">
              <span className="w-8 text-center text-[var(--text-secondary)] font-medium">{index + 1}</span>
              <span className="w-48 font-medium truncate">{m.nm_municipio}</span>
              <div className="flex-1 h-8 bg-[var(--bg-secondary)] rounded-lg overflow-hidden relative">
                <div 
                  className={`h-full ${getBarColor(m)} transition-all duration-500 rounded-lg`}
                  style={{ width: getBarWidth(m) }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-sm font-medium">
                  {metricaSelecionada === 'votos' || metricaSelecionada === 'densidade' 
                    ? getMetricValue(m).toLocaleString('pt-BR')
                    : `${getMetricValue(m).toFixed(1)}%`
                  }
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de Ranking */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-lg font-semibold">Ranking por Município - {metricas.find(m => m.key === metricaSelecionada)?.label}</h2>
          </div>
          <button className="px-4 py-2 rounded-lg border border-[var(--border-color)] flex items-center gap-2 hover:bg-[var(--bg-secondary)]">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left p-3 font-semibold">#</th>
                <th className="text-left p-3 font-semibold">Município</th>
                <th className="text-right p-3 font-semibold">Total Votos</th>
                <th className="text-right p-3 font-semibold">Eleitores</th>
                <th className="text-right p-3 font-semibold">Participação</th>
                <th className="text-right p-3 font-semibold">Abstenção</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(0, 15).map((m, index) => (
                <tr key={m.cd_municipio} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">
                  <td className="p-3 text-[var(--text-secondary)]">{index + 1}</td>
                  <td className="p-3 font-medium">{m.nm_municipio}</td>
                  <td className="p-3 text-right">{m.totalVotos.toLocaleString('pt-BR')}</td>
                  <td className="p-3 text-right">{m.totalAptos.toLocaleString('pt-BR')}</td>
                  <td className="p-3 text-right">
                    <span className={m.participacao > 80 ? 'text-green-500' : m.participacao > 70 ? 'text-yellow-500' : 'text-red-500'}>
                      {m.participacao.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className={m.abstencao < 20 ? 'text-green-500' : m.abstencao < 30 ? 'text-yellow-500' : 'text-red-500'}>
                      {m.abstencao.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="card p-4 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-500 mb-1">Sobre a Visualização</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              O gráfico de barras mostra a concentração de votos e outras métricas eleitorais nos municípios de Rondônia.
              O tamanho das barras representa a intensidade da métrica selecionada - barras maiores indicam valores mais altos.
              As cores variam de azul (baixo) a vermelho (alto), indicando a intensidade relativa de cada município.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
