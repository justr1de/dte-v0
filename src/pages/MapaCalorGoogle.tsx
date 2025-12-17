import { useEffect, useState, useCallback } from 'react'
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
  Layers
} from 'lucide-react'
import { GoogleMap, useJsApiLoader, HeatmapLayer } from '@react-google-maps/api'

const GOOGLE_MAPS_API_KEY = 'AIzaSyATbu5wi9oIQo7hkjNiCjgXI6Gji18ucuI'

interface MunicipioData {
  cd_municipio: number
  nm_municipio: string
  totalVotos: number
  totalAptos: number
  participacao: number
  abstencao: number
  latitude: number
  longitude: number
}

// Coordenadas dos municípios de Rondônia
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
  'MACHADINHO D\'OESTE': { lat: -9.4428, lng: -61.9814 },
  'COLORADO DO OESTE': { lat: -13.1175, lng: -60.5444 },
  'ESPIGÃO D\'OESTE': { lat: -11.5267, lng: -61.0147 },
  'NOVA MAMORÉ': { lat: -10.4078, lng: -65.3339 },
  'SÃO MIGUEL DO GUAPORÉ': { lat: -11.6917, lng: -62.7167 },
  'ALTA FLORESTA D\'OESTE': { lat: -11.9356, lng: -61.9997 },
  'PRESIDENTE MÉDICI': { lat: -11.1750, lng: -61.9000 },
  'CEREJEIRAS': { lat: -13.1944, lng: -60.8167 },
  'COSTA MARQUES': { lat: -12.4389, lng: -64.2278 },
  'CANDEIAS DO JAMARI': { lat: -8.7833, lng: -63.7000 },
  'NOVA BRASILÂNDIA D\'OESTE': { lat: -11.7250, lng: -62.3167 },
  'ALVORADA D\'OESTE': { lat: -11.3500, lng: -62.2833 },
  'SÃO FRANCISCO DO GUAPORÉ': { lat: -12.0500, lng: -63.5667 },
  'SERINGUEIRAS': { lat: -11.8000, lng: -63.0333 },
  'MIRANTE DA SERRA': { lat: -11.0333, lng: -62.6667 },
  'MONTE NEGRO': { lat: -10.2500, lng: -63.3000 },
  'CUJUBIM': { lat: -9.3667, lng: -62.5833 },
  'ITAPUÃ DO OESTE': { lat: -9.1833, lng: -63.1500 },
  'RIO CRESPO': { lat: -9.7000, lng: -62.9000 },
  'THEOBROMA': { lat: -10.2500, lng: -62.3500 },
  'URUPÁ': { lat: -11.1333, lng: -62.3667 },
  'GOVERNADOR JORGE TEIXEIRA': { lat: -10.6167, lng: -62.7500 },
  'VALE DO ANARI': { lat: -9.8667, lng: -62.1833 },
  'ALTO PARAÍSO': { lat: -9.7167, lng: -63.3167 },
  'CACAULÂNDIA': { lat: -10.3333, lng: -62.9000 },
  'CAMPO NOVO DE RONDÔNIA': { lat: -10.5667, lng: -63.6167 },
  'CASTANHEIRAS': { lat: -11.4333, lng: -61.9500 },
  'CHUPINGUAIA': { lat: -12.5667, lng: -60.9000 },
  'CORUMBIARA': { lat: -12.9833, lng: -60.9167 },
  'MINISTRO ANDREAZZA': { lat: -11.2000, lng: -61.5167 },
  'NOVO HORIZONTE DO OESTE': { lat: -11.7167, lng: -62.0000 },
  'PARECIS': { lat: -12.1667, lng: -61.6000 },
  'PIMENTEIRAS DO OESTE': { lat: -13.4833, lng: -61.0500 },
  'PRIMAVERA DE RONDÔNIA': { lat: -11.8333, lng: -61.3167 },
  'SANTA LUZIA D\'OESTE': { lat: -11.9000, lng: -61.7833 },
  'SÃO FELIPE D\'OESTE': { lat: -11.9000, lng: -61.5000 },
  'TEIXEIRÓPOLIS': { lat: -10.9167, lng: -62.2500 },
  'VALE DO PARAÍSO': { lat: -10.4500, lng: -62.1333 },
  'ALTO ALEGRE DOS PARECIS': { lat: -12.1333, lng: -61.8500 },
  'NOVA UNIÃO': { lat: -10.9000, lng: -62.5500 },
}

type MetricType = 'votos' | 'participacao' | 'abstencao' | 'densidade'

const mapContainerStyle = {
  width: '100%',
  height: '600px'
}

const center = {
  lat: -10.8,
  lng: -62.5
}

const libraries: ("visualization")[] = ["visualization"]

export default function MapaCalorGoogle() {
  const [loading, setLoading] = useState(true)
  const [municipios, setMunicipios] = useState<MunicipioData[]>([])
  const [filtroAno, setFiltroAno] = useState<number>(2024)
  const [filtroTurno, setFiltroTurno] = useState<number>(1)
  const [metricaSelecionada, setMetricaSelecionada] = useState<MetricType>('votos')
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [heatmapData, setHeatmapData] = useState<google.maps.visualization.WeightedLocation[]>([])

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries
  })

  useEffect(() => {
    fetchData()
  }, [filtroAno, filtroTurno])

  useEffect(() => {
    if (isLoaded && municipios.length > 0) {
      updateHeatmapData()
    }
  }, [municipios, metricaSelecionada, isLoaded])

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
          const nmMunicipio = b.nm_municipio?.toUpperCase() || ''
          
          if (!municipioMap[nmMunicipio]) {
            const coords = MUNICIPIOS_COORDS[nmMunicipio] || { lat: -10.8, lng: -62.5 }
            municipioMap[nmMunicipio] = {
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
          municipioMap[nmMunicipio].totalVotos += b.qt_votos || 0

          if (!secoesProcessadas.has(secaoKey)) {
            secoesProcessadas.add(secaoKey)
            municipioMap[nmMunicipio].totalAptos += b.qt_aptos || 0
            municipioMap[nmMunicipio].abstencao += b.qt_abstencoes || 0
          }
        })

        Object.values(municipioMap).forEach(m => {
          m.participacao = m.totalAptos > 0 ? (m.totalVotos / m.totalAptos) * 100 : 0
          m.abstencao = m.totalAptos > 0 ? (m.abstencao / m.totalAptos) * 100 : 0
        })

        setMunicipios(Object.values(municipioMap).sort((a, b) => b.totalVotos - a.totalVotos))
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

  const updateHeatmapData = () => {
    if (!isLoaded || !window.google) return

    const maxValue = Math.max(...municipios.map(m => getMetricValue(m)), 1)
    
    const data: google.maps.visualization.WeightedLocation[] = municipios.map(m => ({
      location: new google.maps.LatLng(m.latitude, m.longitude),
      weight: (getMetricValue(m) / maxValue) * 100
    }))

    setHeatmapData(data)
  }

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map)
  }, [])

  const onUnmount = useCallback(() => {
    setMap(null)
  }, [])

  const metricas = [
    { key: 'votos' as MetricType, label: 'Total de Votos', icon: Vote },
    { key: 'participacao' as MetricType, label: 'Participação (%)', icon: TrendingUp },
    { key: 'abstencao' as MetricType, label: 'Abstenção (%)', icon: Users },
    { key: 'densidade' as MetricType, label: 'Eleitores Aptos', icon: Users },
  ]

  const getGradient = () => {
    if (metricaSelecionada === 'abstencao') {
      return [
        'rgba(34, 197, 94, 0)',
        'rgba(34, 197, 94, 0.5)',
        'rgba(132, 204, 22, 0.7)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(249, 115, 22, 0.9)',
        'rgba(239, 68, 68, 1)'
      ]
    }
    return [
      'rgba(239, 68, 68, 0)',
      'rgba(239, 68, 68, 0.5)',
      'rgba(249, 115, 22, 0.7)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(132, 204, 22, 0.9)',
      'rgba(34, 197, 94, 1)'
    ]
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
        <span className="ml-2">Carregando Google Maps...</span>
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
            Mapa de Calor - Google Maps
          </h1>
          <p className="text-[var(--text-secondary)]">Visualização de intensidade eleitoral por município de Rondônia</p>
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

      {/* Mapa de Calor */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[var(--accent-color)]" />
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

        <div className="rounded-lg overflow-hidden border border-[var(--border-color)]">
          {loading ? (
            <div className="flex items-center justify-center h-[600px]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
              <span className="ml-2">Carregando dados...</span>
            </div>
          ) : (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={7}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                mapTypeId: 'roadmap',
                styles: [
                  {
                    featureType: 'administrative',
                    elementType: 'geometry.stroke',
                    stylers: [{ color: '#4b5563' }]
                  },
                  {
                    featureType: 'administrative.province',
                    elementType: 'geometry.stroke',
                    stylers: [{ color: '#1f2937' }, { weight: 2 }]
                  }
                ]
              }}
            >
              {heatmapData.length > 0 && (
                <HeatmapLayer
                  data={heatmapData}
                  options={{
                    radius: 50,
                    opacity: 0.8,
                    gradient: getGradient()
                  }}
                />
              )}
            </GoogleMap>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Vote className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[var(--text-secondary)]">Total de Votos</span>
          </div>
          <p className="text-2xl font-bold">
            {municipios.reduce((acc, m) => acc + m.totalVotos, 0).toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-green-500" />
            <span className="text-sm text-[var(--text-secondary)]">Eleitores Aptos</span>
          </div>
          <p className="text-2xl font-bold">
            {municipios.reduce((acc, m) => acc + m.totalAptos, 0).toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-[var(--text-secondary)]">Participação Média</span>
          </div>
          <p className="text-2xl font-bold">
            {(municipios.reduce((acc, m) => acc + m.participacao, 0) / (municipios.length || 1)).toFixed(1)}%
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-[var(--text-secondary)]">Municípios</span>
          </div>
          <p className="text-2xl font-bold">{municipios.length}</p>
        </div>
      </div>

      {/* Ranking */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-lg font-semibold">Top 10 Municípios por {metricas.find(m => m.key === metricaSelecionada)?.label}</h2>
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
              {municipios.slice(0, 10).map((m, index) => (
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
