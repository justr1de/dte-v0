import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  MapPin,
  Layers,
  Filter,
  Download,
  RefreshCw,
  Info,
  Loader2,
  ThermometerSun,
  Users,
  Vote,
  TrendingUp
} from 'lucide-react'

interface MunicipioData {
  cd_municipio: number
  nm_municipio: string
  totalVotos: number
  totalAptos: number
  participacao: number
  abstencao: number
  latitude?: number
  longitude?: number
}

interface ZonaData {
  nr_zona: number
  totalVotos: number
  totalSecoes: number
  participacao: number
}

// Coordenadas aproximadas dos municípios de Rondônia
const MUNICIPIOS_COORDS: Record<string, { lat: number, lng: number }> = {
  'PORTO VELHO': { lat: -8.7612, lng: -63.9004 },
  'JI-PARANÁ': { lat: -10.8853, lng: -61.9517 },
  'ARIQUEMES': { lat: -9.9082, lng: -63.0408 },
  'VILHENA': { lat: -12.7406, lng: -60.1458 },
  'CACOAL': { lat: -11.4386, lng: -61.4472 },
  'ROLIM DE MOURA': { lat: -11.7279, lng: -61.7714 },
  'GUAJARÁ-MIRIM': { lat: -10.7833, lng: -65.3500 },
  'JARU': { lat: -10.4389, lng: -62.4664 },
  'OURO PRETO DO OESTE': { lat: -10.7250, lng: -62.2500 },
  'PIMENTA BUENO': { lat: -11.6725, lng: -61.1936 },
  'BURITIS': { lat: -10.2125, lng: -63.8292 },
  'MACHADINHO DO OESTE': { lat: -9.4428, lng: -61.9814 },
  'COLORADO DO OESTE': { lat: -13.1175, lng: -60.5444 },
  'ESPIGÃO DO OESTE': { lat: -11.5267, lng: -61.0147 },
  'NOVA MAMORÉ': { lat: -10.4078, lng: -65.3339 },
  'SÃO MIGUEL DO GUAPORÉ': { lat: -11.6917, lng: -62.7167 },
  'ALTA FLORESTA DO OESTE': { lat: -11.9356, lng: -61.9997 },
  'PRESIDENTE MÉDICI': { lat: -11.1750, lng: -61.9000 },
  'CEREJEIRAS': { lat: -13.1944, lng: -60.8167 },
  'COSTA MARQUES': { lat: -12.4389, lng: -64.2278 },
}

type MetricType = 'votos' | 'participacao' | 'abstencao' | 'densidade'

export default function MapasCalor() {
  const [loading, setLoading] = useState(true)
  const [municipios, setMunicipios] = useState<MunicipioData[]>([])
  const [zonas, setZonas] = useState<ZonaData[]>([])
  const [filtroAno, setFiltroAno] = useState<number>(2024)
  const [filtroTurno, setFiltroTurno] = useState<number>(1)
  const [metricaSelecionada, setMetricaSelecionada] = useState<MetricType>('votos')
  const [visualizacao, setVisualizacao] = useState<'municipio' | 'zona'>('municipio')
  const mapRef = useRef<HTMLDivElement>(null)

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
        .limit(50000)

      if (error) throw error

      if (boletins && boletins.length > 0) {
        // Agregar por município
        const municipioMap: Record<string, MunicipioData> = {}
        const zonaMap: Record<number, ZonaData> = {}
        const secoesProcessadas = new Set<string>()

        boletins.forEach(b => {
          const secaoKey = `${b.cd_municipio}-${b.nr_zona}-${b.nr_secao}`
          
          // Município
          if (!municipioMap[b.nm_municipio]) {
            const coords = MUNICIPIOS_COORDS[b.nm_municipio?.toUpperCase()] || { lat: -10.5, lng: -62.5 }
            municipioMap[b.nm_municipio] = {
              cd_municipio: b.cd_municipio,
              nm_municipio: b.nm_municipio,
              totalVotos: 0,
              totalAptos: 0,
              participacao: 0,
              abstencao: 0,
              latitude: coords.lat,
              longitude: coords.lng
            }
          }
          municipioMap[b.nm_municipio].totalVotos += b.qt_votos || 0

          // Zona
          if (!zonaMap[b.nr_zona]) {
            zonaMap[b.nr_zona] = {
              nr_zona: b.nr_zona,
              totalVotos: 0,
              totalSecoes: 0,
              participacao: 0
            }
          }
          zonaMap[b.nr_zona].totalVotos += b.qt_votos || 0

          // Contar seções únicas e somar aptos/abstenções apenas uma vez por seção
          if (!secoesProcessadas.has(secaoKey)) {
            secoesProcessadas.add(secaoKey)
            municipioMap[b.nm_municipio].totalAptos += b.qt_aptos || 0
            municipioMap[b.nm_municipio].abstencao += b.qt_abstencoes || 0
            zonaMap[b.nr_zona].totalSecoes += 1
          }
        })

        // Calcular participação
        Object.values(municipioMap).forEach(m => {
          m.participacao = m.totalAptos > 0 ? (m.totalVotos / m.totalAptos) * 100 : 0
          m.abstencao = m.totalAptos > 0 ? (m.abstencao / m.totalAptos) * 100 : 0
        })

        setMunicipios(Object.values(municipioMap).sort((a, b) => b.totalVotos - a.totalVotos))
        setZonas(Object.values(zonaMap).sort((a, b) => b.totalVotos - a.totalVotos))
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const getColor = (value: number, max: number, metric: MetricType): string => {
    const ratio = value / max
    if (metric === 'abstencao') {
      // Vermelho para alta abstenção
      if (ratio > 0.8) return '#ef4444'
      if (ratio > 0.6) return '#f97316'
      if (ratio > 0.4) return '#f59e0b'
      if (ratio > 0.2) return '#84cc16'
      return '#22c55e'
    } else {
      // Verde para alta participação/votos
      if (ratio > 0.8) return '#22c55e'
      if (ratio > 0.6) return '#84cc16'
      if (ratio > 0.4) return '#f59e0b'
      if (ratio > 0.2) return '#f97316'
      return '#ef4444'
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

  const maxValue = Math.max(...municipios.map(m => getMetricValue(m)))

  const metricas = [
    { key: 'votos' as MetricType, label: 'Total de Votos', icon: Vote },
    { key: 'participacao' as MetricType, label: 'Participação (%)', icon: TrendingUp },
    { key: 'abstencao' as MetricType, label: 'Abstenção (%)', icon: Users },
    { key: 'densidade' as MetricType, label: 'Eleitores Aptos', icon: Users },
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
            Mapas de Calor
          </h1>
          <p className="text-[var(--text-secondary)]">Visualização geográfica dos dados eleitorais de Rondônia</p>
        </div>
        <div className="flex gap-3">
          <select
            value={filtroAno}
            onChange={(e) => setFiltroAno(Number(e.target.value))}
            className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
          >
            <option value={2024}>2024</option>
            <option value={2022}>2022</option>
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

      {/* Seletor de Métrica */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-5 h-5 text-[var(--accent-color)]" />
          <span className="font-semibold">Métrica de Visualização</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metricas.map(m => (
            <button
              key={m.key}
              onClick={() => setMetricaSelecionada(m.key)}
              className={`p-3 rounded-lg border flex items-center gap-2 transition-all ${
                metricaSelecionada === m.key
                  ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10'
                  : 'border-[var(--border-color)] hover:border-[var(--accent-color)]/50'
              }`}
            >
              <m.icon className="w-5 h-5" />
              <span className="text-sm">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mapa Visual (Grid de Municípios) */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-lg font-semibold">Mapa de Calor por Município</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--text-secondary)]">Legenda:</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-red-500"></div>
                <span>Baixo</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-yellow-500"></div>
                <span>Médio</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-green-500"></div>
                <span>Alto</span>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Municípios como Heatmap */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {municipios.slice(0, 24).map((m, index) => {
            const value = getMetricValue(m)
            const color = getColor(value, maxValue, metricaSelecionada)
            return (
              <div
                key={m.cd_municipio}
                className="p-4 rounded-lg border border-[var(--border-color)] relative overflow-hidden group cursor-pointer hover:scale-105 transition-transform"
                style={{ backgroundColor: `${color}20` }}
              >
                <div
                  className="absolute inset-0 opacity-30"
                  style={{ backgroundColor: color }}
                />
                <div className="relative z-10">
                  <p className="font-semibold text-sm truncate">{m.nm_municipio}</p>
                  <p className="text-lg font-bold mt-1">
                    {metricaSelecionada === 'votos' || metricaSelecionada === 'densidade'
                      ? value.toLocaleString('pt-BR')
                      : `${value.toFixed(1)}%`
                    }
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    #{index + 1} no ranking
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tabela Detalhada */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-lg font-semibold">Dados Detalhados por Município</h2>
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
                <th className="text-right p-3 font-semibold">Eleitores Aptos</th>
                <th className="text-right p-3 font-semibold">Participação</th>
                <th className="text-right p-3 font-semibold">Abstenção</th>
                <th className="text-center p-3 font-semibold">Intensidade</th>
              </tr>
            </thead>
            <tbody>
              {municipios.slice(0, 20).map((m, index) => {
                const value = getMetricValue(m)
                const color = getColor(value, maxValue, metricaSelecionada)
                return (
                  <tr key={m.cd_municipio} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">
                    <td className="p-3 text-[var(--text-secondary)]">{index + 1}</td>
                    <td className="p-3 font-medium">{m.nm_municipio}</td>
                    <td className="p-3 text-right">{m.totalVotos.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right">{m.totalAptos.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right">{m.participacao.toFixed(1)}%</td>
                    <td className="p-3 text-right">{m.abstencao.toFixed(1)}%</td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        <div
                          className="w-8 h-8 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Instruções para Implementação de Mapa Real */}
      <div className="card p-6 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-500 mb-2">Implementação de Mapa Interativo</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Para implementar um mapa de calor interativo com visualização geográfica real, siga estas direções:
            </p>
            <ol className="text-sm text-[var(--text-secondary)] space-y-2 list-decimal list-inside">
              <li><strong>Leaflet.js + Leaflet.heat:</strong> Biblioteca leve para mapas interativos com plugin de heatmap</li>
              <li><strong>GeoJSON de Rondônia:</strong> Baixe os polígonos dos municípios do IBGE (geojson.io)</li>
              <li><strong>Coordenadas das seções:</strong> Utilize as coordenadas dos locais de votação do TSE</li>
              <li><strong>Integração:</strong> Combine os dados do Supabase com as coordenadas para gerar pontos de calor</li>
            </ol>
            <div className="mt-4 p-3 bg-[var(--bg-secondary)] rounded-lg">
              <code className="text-xs">
                npm install leaflet leaflet.heat react-leaflet @types/leaflet
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
