import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import {
  MapPin,
  Layers,
  Filter,
  Download,
  RefreshCw,
  Loader2,
  ThermometerSun,
  Users,
  Vote,
  TrendingUp,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MunicipioData {
  cd_municipio: string
  nm_municipio: string
  totalVotos: number
  totalAptos: number
  participacao: number
  abstencao: number
}

interface GeoJSONFeature {
  type: string
  properties: {
    id: string
    name: string
    description: string
  }
  geometry: {
    type: string
    coordinates: number[][][]
  }
}

type MetricType = 'votos' | 'participacao' | 'abstencao' | 'densidade'

// Componente para controlar o zoom do mapa
function MapControls() {
  const map = useMap()
  
  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100"
        title="Zoom In"
      >
        <ZoomIn className="w-5 h-5 text-gray-700" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100"
        title="Zoom Out"
      >
        <ZoomOut className="w-5 h-5 text-gray-700" />
      </button>
      <button
        onClick={() => map.setView([-10.8, -63.0], 6)}
        className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100"
        title="Resetar Visualização"
      >
        <Maximize2 className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  )
}

export default function MapaInterativo() {
  const [loading, setLoading] = useState(true)
  const [municipiosData, setMunicipiosData] = useState<Record<string, MunicipioData>>({})
  const [geoData, setGeoData] = useState<any>(null)
  const [filtroAno, setFiltroAno] = useState<number>(2024)
  const [filtroTurno, setFiltroTurno] = useState<number>(1)
  const [metricaSelecionada, setMetricaSelecionada] = useState<MetricType>('votos')
  const [selectedMunicipio, setSelectedMunicipio] = useState<MunicipioData | null>(null)
  const geoJsonRef = useRef<L.GeoJSON | null>(null)

  useEffect(() => {
    loadGeoJSON()
  }, [])

  useEffect(() => {
    fetchData()
  }, [filtroAno, filtroTurno])

  useEffect(() => {
    if (geoJsonRef.current && geoData) {
      geoJsonRef.current.clearLayers()
      geoJsonRef.current.addData(geoData)
    }
  }, [municipiosData, metricaSelecionada])

  const loadGeoJSON = async () => {
    try {
      const response = await fetch('/rondonia-municipios.json')
      const data = await response.json()
      setGeoData(data)
    } catch (error) {
      console.error('Erro ao carregar GeoJSON:', error)
    }
  }

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
        const municipioMap: Record<string, MunicipioData> = {}
        const secoesProcessadas = new Set<string>()

        boletins.forEach(b => {
          const secaoKey = `${b.cd_municipio}-${b.nr_zona}-${b.nr_secao}`
          const cdMunicipio = String(b.cd_municipio)
          
          if (!municipioMap[cdMunicipio]) {
            municipioMap[cdMunicipio] = {
              cd_municipio: cdMunicipio,
              nm_municipio: b.nm_municipio,
              totalVotos: 0,
              totalAptos: 0,
              participacao: 0,
              abstencao: 0
            }
          }
          municipioMap[cdMunicipio].totalVotos += b.qt_votos || 0

          if (!secoesProcessadas.has(secaoKey)) {
            secoesProcessadas.add(secaoKey)
            municipioMap[cdMunicipio].totalAptos += b.qt_aptos || 0
            municipioMap[cdMunicipio].abstencao += b.qt_abstencoes || 0
          }
        })

        // Calcular participação
        Object.values(municipioMap).forEach(m => {
          m.participacao = m.totalAptos > 0 ? (m.totalVotos / m.totalAptos) * 100 : 0
          m.abstencao = m.totalAptos > 0 ? (m.abstencao / m.totalAptos) * 100 : 0
        })

        setMunicipiosData(municipioMap)
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

  const maxValue = Math.max(...Object.values(municipiosData).map(m => getMetricValue(m)), 1)

  const getColor = (value: number): string => {
    const ratio = value / maxValue
    if (metricaSelecionada === 'abstencao') {
      // Vermelho para alta abstenção
      if (ratio > 0.8) return '#dc2626'
      if (ratio > 0.6) return '#ea580c'
      if (ratio > 0.4) return '#f59e0b'
      if (ratio > 0.2) return '#84cc16'
      return '#22c55e'
    } else {
      // Verde para alta participação/votos
      if (ratio > 0.8) return '#15803d'
      if (ratio > 0.6) return '#22c55e'
      if (ratio > 0.4) return '#84cc16'
      if (ratio > 0.2) return '#f59e0b'
      return '#ef4444'
    }
  }

  const style = (feature: GeoJSONFeature) => {
    const municipioId = feature.properties.id
    const municipioData = municipiosData[municipioId]
    const value = municipioData ? getMetricValue(municipioData) : 0
    const color = getColor(value)

    return {
      fillColor: color,
      weight: 2,
      opacity: 1,
      color: '#374151',
      fillOpacity: 0.7
    }
  }

  const onEachFeature = (feature: GeoJSONFeature, layer: L.Layer) => {
    const municipioId = feature.properties.id
    const municipioData = municipiosData[municipioId]
    const municipioName = feature.properties.name

    layer.on({
      mouseover: (e: L.LeafletMouseEvent) => {
        const layer = e.target
        layer.setStyle({
          weight: 3,
          color: '#1e40af',
          fillOpacity: 0.9
        })
        layer.bringToFront()
        if (municipioData) {
          setSelectedMunicipio(municipioData)
        }
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        if (geoJsonRef.current) {
          geoJsonRef.current.resetStyle(e.target)
        }
        setSelectedMunicipio(null)
      },
      click: () => {
        if (municipioData) {
          setSelectedMunicipio(municipioData)
        }
      }
    })

    // Tooltip
    const tooltipContent = municipioData
      ? `<strong>${municipioName}</strong><br/>
         Votos: ${municipioData.totalVotos.toLocaleString('pt-BR')}<br/>
         Participação: ${municipioData.participacao.toFixed(1)}%<br/>
         Abstenção: ${municipioData.abstencao.toFixed(1)}%`
      : `<strong>${municipioName}</strong><br/>Sem dados`

    layer.bindTooltip(tooltipContent, {
      permanent: false,
      direction: 'top',
      className: 'leaflet-tooltip-custom'
    })
  }

  const metricas = [
    { key: 'votos' as MetricType, label: 'Total de Votos', icon: Vote },
    { key: 'participacao' as MetricType, label: 'Participação (%)', icon: TrendingUp },
    { key: 'abstencao' as MetricType, label: 'Abstenção (%)', icon: Users },
    { key: 'densidade' as MetricType, label: 'Eleitores Aptos', icon: Users },
  ]

  if (loading && !geoData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
        <span className="ml-2">Carregando mapa...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-7 h-7 text-[var(--accent-color)]" />
            Mapa Interativo de Rondônia
          </h1>
          <p className="text-[var(--text-secondary)]">Visualização geográfica dos dados eleitorais por município</p>
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

      {/* Mapa */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-lg font-semibold">Mapa de Calor Geográfico</h2>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[var(--text-secondary)]">Legenda:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: metricaSelecionada === 'abstencao' ? '#22c55e' : '#ef4444' }}></div>
              <span>Baixo</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span>Médio</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: metricaSelecionada === 'abstencao' ? '#ef4444' : '#22c55e' }}></div>
              <span>Alto</span>
            </div>
          </div>
        </div>

        <div className="relative h-[600px] rounded-lg overflow-hidden border border-[var(--border-color)]">
          {geoData && (
            <MapContainer
              center={[-10.8, -63.0]}
              zoom={6}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <GeoJSON
                ref={geoJsonRef as any}
                data={geoData}
                style={style as any}
                onEachFeature={onEachFeature as any}
              />
              <MapControls />
            </MapContainer>
          )}

          {/* Info Box */}
          {selectedMunicipio && (
            <div className="absolute bottom-4 left-4 z-[1000] bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg max-w-xs">
              <h3 className="font-bold text-lg mb-2">{selectedMunicipio.nm_municipio}</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Total de Votos:</strong> {selectedMunicipio.totalVotos.toLocaleString('pt-BR')}</p>
                <p><strong>Eleitores Aptos:</strong> {selectedMunicipio.totalAptos.toLocaleString('pt-BR')}</p>
                <p><strong>Participação:</strong> {selectedMunicipio.participacao.toFixed(1)}%</p>
                <p><strong>Abstenção:</strong> {selectedMunicipio.abstencao.toFixed(1)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ranking de Municípios */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ThermometerSun className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-lg font-semibold">Ranking por {metricas.find(m => m.key === metricaSelecionada)?.label}</h2>
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
              </tr>
            </thead>
            <tbody>
              {Object.values(municipiosData)
                .sort((a, b) => getMetricValue(b) - getMetricValue(a))
                .slice(0, 15)
                .map((m, index) => (
                  <tr key={m.cd_municipio} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">
                    <td className="p-3 text-[var(--text-secondary)]">{index + 1}</td>
                    <td className="p-3 font-medium">{m.nm_municipio}</td>
                    <td className="p-3 text-right">{m.totalVotos.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right">{m.totalAptos.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right">{m.participacao.toFixed(1)}%</td>
                    <td className="p-3 text-right">{m.abstencao.toFixed(1)}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
