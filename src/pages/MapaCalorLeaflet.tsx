import { useEffect, useState, useRef, useMemo } from 'react'
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
  ZoomIn,
  ZoomOut,
  Maximize2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'

// Declaração de tipo para leaflet.heat
declare module 'leaflet' {
  function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: {
      minOpacity?: number
      maxZoom?: number
      max?: number
      radius?: number
      blur?: number
      gradient?: { [key: number]: string }
    }
  ): L.Layer
}

interface ZonaSecaoData {
  cd_municipio: number
  nm_municipio: string
  nr_zona: number
  nr_secao: number
  totalVotos: number
  totalAptos: number
  participacao: number
  abstencao: number
  latitude: number
  longitude: number
}

// Coordenadas dos municípios de Rondônia com variação para zonas
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

// Componente para controlar o mapa
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
        onClick={() => map.setView([-10.8, -62.5], 7)}
        className="p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100"
        title="Resetar Visualização"
      >
        <Maximize2 className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  )
}

// Componente do HeatmapLayer
function HeatmapLayer({ 
  points, 
  options 
}: { 
  points: Array<[number, number, number]>
  options: {
    radius?: number
    blur?: number
    maxZoom?: number
    max?: number
    gradient?: { [key: number]: string }
  }
}) {
  const map = useMap()
  const heatLayerRef = useRef<L.Layer | null>(null)

  useEffect(() => {
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current)
    }

    if (points.length > 0) {
      heatLayerRef.current = L.heatLayer(points, options).addTo(map)
    }

    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
      }
    }
  }, [map, points, options])

  return null
}

export default function MapaCalorLeaflet() {
  const [loading, setLoading] = useState(true)
  const [zonaSecaoData, setZonaSecaoData] = useState<ZonaSecaoData[]>([])
  const [filtroAno, setFiltroAno] = useState<number>(2024)
  const [filtroTurno, setFiltroTurno] = useState<number>(1)
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('todos')
  const [metricaSelecionada, setMetricaSelecionada] = useState<MetricType>('votos')
  const [raioCalor, setRaioCalor] = useState<number>(25)
  const [intensidade, setIntensidade] = useState<number>(1)
  const [mostrarPontos, setMostrarPontos] = useState<boolean>(true)
  const [municipios, setMunicipios] = useState<string[]>([])

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
        const zonaSecaoMap: Record<string, ZonaSecaoData> = {}
        const municipioSet = new Set<string>()

        boletins.forEach(b => {
          const key = `${b.cd_municipio}-${b.nr_zona}-${b.nr_secao}`
          const nmMunicipio = b.nm_municipio?.toUpperCase() || ''
          municipioSet.add(nmMunicipio)
          
          const baseCoords = MUNICIPIOS_COORDS[nmMunicipio] || { lat: -10.8, lng: -62.5 }
          // Adicionar variação baseada na zona e seção para distribuir os pontos
          const latVariation = ((b.nr_zona % 10) - 5) * 0.02 + ((b.nr_secao % 20) - 10) * 0.005
          const lngVariation = ((b.nr_zona % 7) - 3) * 0.02 + ((b.nr_secao % 15) - 7) * 0.005
          
          if (!zonaSecaoMap[key]) {
            zonaSecaoMap[key] = {
              cd_municipio: b.cd_municipio,
              nm_municipio: b.nm_municipio,
              nr_zona: b.nr_zona,
              nr_secao: b.nr_secao,
              totalVotos: 0,
              totalAptos: b.qt_aptos || 0,
              participacao: 0,
              abstencao: b.qt_abstencoes || 0,
              latitude: baseCoords.lat + latVariation,
              longitude: baseCoords.lng + lngVariation
            }
          }
          zonaSecaoMap[key].totalVotos += b.qt_votos || 0
        })

        // Calcular métricas
        Object.values(zonaSecaoMap).forEach(z => {
          z.participacao = z.totalAptos > 0 ? (z.totalVotos / z.totalAptos) * 100 : 0
          z.abstencao = z.totalAptos > 0 ? (z.abstencao / z.totalAptos) * 100 : 0
        })

        setZonaSecaoData(Object.values(zonaSecaoMap))
        setMunicipios(Array.from(municipioSet).sort())
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMetricValue = (z: ZonaSecaoData): number => {
    switch (metricaSelecionada) {
      case 'votos': return z.totalVotos
      case 'participacao': return z.participacao
      case 'abstencao': return z.abstencao
      case 'densidade': return z.totalAptos
      default: return z.totalVotos
    }
  }

  const filteredData = useMemo(() => {
    if (filtroMunicipio === 'todos') return zonaSecaoData
    return zonaSecaoData.filter(z => z.nm_municipio?.toUpperCase() === filtroMunicipio)
  }, [zonaSecaoData, filtroMunicipio])

  const heatmapPoints = useMemo((): Array<[number, number, number]> => {
    const maxValue = Math.max(...filteredData.map(z => getMetricValue(z)), 1)
    return filteredData.map(z => [
      z.latitude,
      z.longitude,
      (getMetricValue(z) / maxValue) * intensidade
    ])
  }, [filteredData, metricaSelecionada, intensidade])

  const heatmapOptions = useMemo(() => {
    const gradient = metricaSelecionada === 'abstencao' 
      ? { 0.2: '#22c55e', 0.4: '#84cc16', 0.6: '#f59e0b', 0.8: '#f97316', 1: '#ef4444' }
      : { 0.2: '#ef4444', 0.4: '#f97316', 0.6: '#f59e0b', 0.8: '#84cc16', 1: '#22c55e' }
    
    return {
      radius: raioCalor,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient
    }
  }, [raioCalor, metricaSelecionada])

  const metricas = [
    { key: 'votos' as MetricType, label: 'Total de Votos', icon: Vote },
    { key: 'participacao' as MetricType, label: 'Participação (%)', icon: TrendingUp },
    { key: 'abstencao' as MetricType, label: 'Abstenção (%)', icon: Users },
    { key: 'densidade' as MetricType, label: 'Eleitores Aptos', icon: Users },
  ]

  const totais = useMemo(() => ({
    votos: filteredData.reduce((acc, z) => acc + z.totalVotos, 0),
    aptos: filteredData.reduce((acc, z) => acc + z.totalAptos, 0),
    participacao: filteredData.length > 0 
      ? filteredData.reduce((acc, z) => acc + z.participacao, 0) / filteredData.length 
      : 0,
    pontos: filteredData.length
  }), [filteredData])

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ThermometerSun className="w-7 h-7 text-[var(--accent-color)]" />
            Mapa de Calor Dinâmico
          </h1>
          <p className="text-[var(--text-secondary)]">Visualização em tempo real por zona/seção eleitoral</p>
        </div>
        <div className="flex flex-wrap gap-3">
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
          <select
            value={filtroMunicipio}
            onChange={(e) => setFiltroMunicipio(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
          >
            <option value="todos">Todos os Municípios</option>
            {municipios.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-[var(--accent-color)] text-white flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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

      {/* Controles do Mapa de Calor */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-[var(--accent-color)]" />
          <span className="font-semibold">Configurações do Mapa de Calor</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              Raio dos Pontos: {raioCalor}px
            </label>
            <input
              type="range"
              min="10"
              max="50"
              value={raioCalor}
              onChange={(e) => setRaioCalor(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              Intensidade: {intensidade.toFixed(1)}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={intensidade}
              onChange={(e) => setIntensidade(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMostrarPontos(!mostrarPontos)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
            >
              {mostrarPontos ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5" />}
              <span>Mapa de Calor {mostrarPontos ? 'Ativo' : 'Inativo'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Vote className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[var(--text-secondary)]">Total de Votos</span>
          </div>
          <p className="text-2xl font-bold">{totais.votos.toLocaleString('pt-BR')}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-green-500" />
            <span className="text-sm text-[var(--text-secondary)]">Eleitores Aptos</span>
          </div>
          <p className="text-2xl font-bold">{totais.aptos.toLocaleString('pt-BR')}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-[var(--text-secondary)]">Participação Média</span>
          </div>
          <p className="text-2xl font-bold">{totais.participacao.toFixed(1)}%</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-[var(--text-secondary)]">Pontos no Mapa</span>
          </div>
          <p className="text-2xl font-bold">{totais.pontos.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Mapa */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-lg font-semibold">Mapa de Calor por Zona/Seção</h2>
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
          {loading ? (
            <div className="flex items-center justify-center h-full bg-[var(--bg-secondary)]">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
              <span className="ml-2">Carregando dados...</span>
            </div>
          ) : (
            <MapContainer
              center={[-10.8, -62.5]}
              zoom={7}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mostrarPontos && heatmapPoints.length > 0 && (
                <HeatmapLayer points={heatmapPoints} options={heatmapOptions} />
              )}
              <MapControls />
            </MapContainer>
          )}
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-lg font-semibold">Dados por Zona/Seção (Top 20)</h2>
          </div>
          <button className="px-4 py-2 rounded-lg border border-[var(--border-color)] flex items-center gap-2 hover:bg-[var(--bg-secondary)]">
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left p-3 font-semibold">Município</th>
                <th className="text-center p-3 font-semibold">Zona</th>
                <th className="text-center p-3 font-semibold">Seção</th>
                <th className="text-right p-3 font-semibold">Votos</th>
                <th className="text-right p-3 font-semibold">Aptos</th>
                <th className="text-right p-3 font-semibold">Participação</th>
              </tr>
            </thead>
            <tbody>
              {filteredData
                .sort((a, b) => getMetricValue(b) - getMetricValue(a))
                .slice(0, 20)
                .map((z, index) => (
                  <tr key={`${z.cd_municipio}-${z.nr_zona}-${z.nr_secao}`} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">
                    <td className="p-3 font-medium">{z.nm_municipio}</td>
                    <td className="p-3 text-center">{z.nr_zona}</td>
                    <td className="p-3 text-center">{z.nr_secao}</td>
                    <td className="p-3 text-right">{z.totalVotos.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right">{z.totalAptos.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right">{z.participacao.toFixed(1)}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
