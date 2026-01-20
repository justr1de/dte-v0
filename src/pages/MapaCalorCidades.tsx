import { useEffect, useState, useRef, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  MapPin,
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
  Calendar,
  Info
} from 'lucide-react'
import { MapContainer, TileLayer, useMap, CircleMarker, Popup, Tooltip } from 'react-leaflet'
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

interface MunicipioData {
  cd_municipio: number
  nm_municipio: string
  totalEleitores: number
  totalVotos: number
  totalComparecimento: number
  totalAbstencoes: number
  participacao: number
  latitude: number
  longitude: number
  ano: number
}

// Coordenadas dos 52 municípios de Rondônia
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

// Cores por ano de eleição
const CORES_ANO: Record<number, { cor: string, corHex: string, nome: string }> = {
  2024: { cor: 'text-emerald-500', corHex: '#10b981', nome: 'Eleições 2024' },
  2022: { cor: 'text-blue-500', corHex: '#3b82f6', nome: 'Eleições 2022' },
  2020: { cor: 'text-purple-500', corHex: '#8b5cf6', nome: 'Eleições 2020' },
  2018: { cor: 'text-orange-500', corHex: '#f97316', nome: 'Eleições 2018' },
}

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

export default function MapaCalorCidades() {
  const [loading, setLoading] = useState(true)
  const [dadosMunicipios, setDadosMunicipios] = useState<MunicipioData[]>([])
  const [anosSelecionados, setAnosSelecionados] = useState<number[]>([2024, 2022, 2020])
  const [filtroTurno, setFiltroTurno] = useState<number>(1)
  const [raioCalor, setRaioCalor] = useState<number>(35)
  const [mostrarCirculos, setMostrarCirculos] = useState<boolean>(true)
  const [mostrarHeatmap, setMostrarHeatmap] = useState<boolean>(true)

  useEffect(() => {
    fetchAllYearsData()
  }, [anosSelecionados, filtroTurno])

  const fetchAllYearsData = async () => {
    setLoading(true)
    try {
      const allData: MunicipioData[] = []
      
      for (const ano of anosSelecionados) {
        const { data: boletins, error } = await supabase
          .from('boletins_urna')
          .select('cd_municipio, nm_municipio, qt_votos, qt_aptos, qt_comparecimento, qt_abstencoes')
          .eq('ano_eleicao', ano)
          .eq('nr_turno', filtroTurno)
          .limit(100000)

        if (error) throw error

        if (boletins && boletins.length > 0) {
          const municipioMap: Record<string, MunicipioData> = {}

          boletins.forEach(b => {
            const nmMunicipio = b.nm_municipio?.toUpperCase() || ''
            const coords = MUNICIPIOS_COORDS[nmMunicipio] || { lat: -10.8, lng: -62.5 }
            
            if (!municipioMap[nmMunicipio]) {
              municipioMap[nmMunicipio] = {
                cd_municipio: b.cd_municipio,
                nm_municipio: nmMunicipio,
                totalEleitores: 0,
                totalVotos: 0,
                totalComparecimento: 0,
                totalAbstencoes: 0,
                participacao: 0,
                latitude: coords.lat,
                longitude: coords.lng,
                ano: ano
              }
            }
            municipioMap[nmMunicipio].totalEleitores += b.qt_aptos || 0
            municipioMap[nmMunicipio].totalVotos += b.qt_votos || 0
            municipioMap[nmMunicipio].totalComparecimento += b.qt_comparecimento || 0
            municipioMap[nmMunicipio].totalAbstencoes += b.qt_abstencoes || 0
          })

          // Calcular participação
          Object.values(municipioMap).forEach(m => {
            m.participacao = m.totalEleitores > 0 
              ? (m.totalComparecimento / m.totalEleitores) * 100 
              : 0
          })

          allData.push(...Object.values(municipioMap))
        }
      }

      setDadosMunicipios(allData)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAno = (ano: number) => {
    if (anosSelecionados.includes(ano)) {
      if (anosSelecionados.length > 1) {
        setAnosSelecionados(anosSelecionados.filter(a => a !== ano))
      }
    } else {
      setAnosSelecionados([...anosSelecionados, ano])
    }
  }

  const dadosFiltrados = useMemo(() => {
    return dadosMunicipios.filter(m => anosSelecionados.includes(m.ano))
  }, [dadosMunicipios, anosSelecionados])

  const heatmapPoints = useMemo((): Array<[number, number, number]> => {
    const maxValue = Math.max(...dadosFiltrados.map(m => m.totalEleitores), 1)
    return dadosFiltrados.map(m => [
      m.latitude,
      m.longitude,
      (m.totalEleitores / maxValue)
    ])
  }, [dadosFiltrados])

  const heatmapOptions = useMemo(() => ({
    radius: raioCalor,
    blur: 20,
    maxZoom: 17,
    max: 1.0,
    gradient: { 
      0.1: '#3b82f6', 
      0.3: '#22c55e', 
      0.5: '#eab308', 
      0.7: '#f97316', 
      1: '#ef4444' 
    }
  }), [raioCalor])

  // Calcular tamanho do círculo baseado no número de eleitores
  const getCircleRadius = (eleitores: number) => {
    const maxEleitores = Math.max(...dadosFiltrados.map(m => m.totalEleitores), 1)
    const minRadius = 8
    const maxRadius = 40
    return minRadius + (eleitores / maxEleitores) * (maxRadius - minRadius)
  }

  // Estatísticas por ano
  const estatisticasPorAno = useMemo(() => {
    const stats: Record<number, { eleitores: number, votos: number, municipios: number, participacao: number }> = {}
    
    anosSelecionados.forEach(ano => {
      const dadosAno = dadosMunicipios.filter(m => m.ano === ano)
      stats[ano] = {
        eleitores: dadosAno.reduce((acc, m) => acc + m.totalEleitores, 0),
        votos: dadosAno.reduce((acc, m) => acc + m.totalVotos, 0),
        municipios: dadosAno.length,
        participacao: dadosAno.length > 0 
          ? dadosAno.reduce((acc, m) => acc + m.participacao, 0) / dadosAno.length 
          : 0
      }
    })
    
    return stats
  }, [dadosMunicipios, anosSelecionados])

  const totais = useMemo(() => ({
    eleitores: dadosFiltrados.reduce((acc, m) => acc + m.totalEleitores, 0),
    votos: dadosFiltrados.reduce((acc, m) => acc + m.totalVotos, 0),
    municipios: new Set(dadosFiltrados.map(m => m.nm_municipio)).size,
    participacao: dadosFiltrados.length > 0 
      ? dadosFiltrados.reduce((acc, m) => acc + m.participacao, 0) / dadosFiltrados.length 
      : 0
  }), [dadosFiltrados])

  // Exportar CSV
  const exportarCSV = () => {
    const headers = ['Município', 'Ano', 'Total Eleitores', 'Total Votos', 'Comparecimento', 'Abstenções', 'Participação (%)']
    const rows = dadosFiltrados.map(m => [
      m.nm_municipio,
      m.ano,
      m.totalEleitores,
      m.totalVotos,
      m.totalComparecimento,
      m.totalAbstencoes,
      m.participacao.toFixed(2)
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `mapa_calor_cidades_ro_${anosSelecionados.join('_')}.csv`
    link.click()
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ThermometerSun className="w-7 h-7 text-[var(--accent-color)]" />
            Mapa de Calor: Eleitores por Cidade
          </h1>
          <p className="text-[var(--text-secondary)]">
            Visualização do quantitativo de eleitores por município de Rondônia
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={filtroTurno}
            onChange={(e) => setFiltroTurno(Number(e.target.value))}
            className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
          >
            <option value={1}>1º Turno</option>
            <option value={2}>2º Turno</option>
          </select>
          <button
            onClick={fetchAllYearsData}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-[var(--accent-color)] text-white flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={exportarCSV}
            className="px-4 py-2 rounded-lg border border-[var(--border-color)] flex items-center gap-2 hover:bg-[var(--bg-secondary)]"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Seletor de Anos */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-[var(--accent-color)]" />
          <span className="font-semibold">Anos de Eleição</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {Object.entries(CORES_ANO).map(([ano, config]) => (
            <button
              key={ano}
              onClick={() => toggleAno(Number(ano))}
              className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 transition-all ${
                anosSelecionados.includes(Number(ano))
                  ? 'border-current bg-opacity-20'
                  : 'border-[var(--border-color)] opacity-50'
              }`}
              style={{ 
                borderColor: anosSelecionados.includes(Number(ano)) ? config.corHex : undefined,
                backgroundColor: anosSelecionados.includes(Number(ano)) ? `${config.corHex}20` : undefined
              }}
            >
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: config.corHex }}
              />
              <span className="font-medium">{ano}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Layout Principal: Mapa + Legenda */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Mapa - 3 colunas */}
        <div className="lg:col-span-3 card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[var(--accent-color)]" />
              <h2 className="text-lg font-semibold">Mapa de Calor por Município</h2>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mostrarHeatmap}
                  onChange={(e) => setMostrarHeatmap(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Mapa de Calor</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mostrarCirculos}
                  onChange={(e) => setMostrarCirculos(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Círculos</span>
              </label>
            </div>
          </div>

          {/* Controle de Raio */}
          <div className="mb-4">
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              Raio do Mapa de Calor: {raioCalor}px
            </label>
            <input
              type="range"
              min="15"
              max="60"
              value={raioCalor}
              onChange={(e) => setRaioCalor(Number(e.target.value))}
              className="w-full max-w-xs"
            />
          </div>

          <div className="relative h-[600px] rounded-lg overflow-hidden border border-[var(--border-color)]">
            {loading ? (
              <div className="flex items-center justify-center h-full bg-[var(--bg-secondary)]">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
                <span className="ml-2">Carregando dados de {anosSelecionados.length} anos...</span>
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
                
                {/* Mapa de Calor */}
                {mostrarHeatmap && heatmapPoints.length > 0 && (
                  <HeatmapLayer points={heatmapPoints} options={heatmapOptions} />
                )}
                
                {/* Círculos por município */}
                {mostrarCirculos && dadosFiltrados.map((m, index) => (
                  <CircleMarker
                    key={`${m.nm_municipio}-${m.ano}-${index}`}
                    center={[m.latitude, m.longitude]}
                    radius={getCircleRadius(m.totalEleitores)}
                    pathOptions={{
                      color: CORES_ANO[m.ano]?.corHex || '#666',
                      fillColor: CORES_ANO[m.ano]?.corHex || '#666',
                      fillOpacity: 0.6,
                      weight: 2
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold text-lg">{m.nm_municipio}</h3>
                        <p className="text-sm font-medium" style={{ color: CORES_ANO[m.ano]?.corHex }}>
                          Eleições {m.ano}
                        </p>
                        <hr className="my-2" />
                        <p><strong>Eleitores:</strong> {m.totalEleitores.toLocaleString('pt-BR')}</p>
                        <p><strong>Votos:</strong> {m.totalVotos.toLocaleString('pt-BR')}</p>
                        <p><strong>Comparecimento:</strong> {m.totalComparecimento.toLocaleString('pt-BR')}</p>
                        <p><strong>Participação:</strong> {m.participacao.toFixed(1)}%</p>
                      </div>
                    </Popup>
                    <Tooltip permanent={false}>
                      {m.nm_municipio} ({m.ano}): {m.totalEleitores.toLocaleString('pt-BR')} eleitores
                    </Tooltip>
                  </CircleMarker>
                ))}
                
                <MapControls />
              </MapContainer>
            )}
          </div>
        </div>

        {/* Legenda e Estatísticas - 1 coluna */}
        <div className="space-y-4">
          {/* Legenda de Cores por Ano */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-[var(--accent-color)]" />
              <h3 className="font-semibold">Legenda por Ano</h3>
            </div>
            <div className="space-y-3">
              {anosSelecionados.sort((a, b) => b - a).map(ano => (
                <div key={ano} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-secondary)]">
                  <div 
                    className="w-5 h-5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: CORES_ANO[ano]?.corHex }}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{CORES_ANO[ano]?.nome}</p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {estatisticasPorAno[ano]?.municipios || 0} municípios
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legenda de Intensidade */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-[var(--accent-color)]" />
              <h3 className="font-semibold">Intensidade</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-500" />
                <span className="text-sm">Muito Alto (&gt;100k eleitores)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-orange-500" />
                <span className="text-sm">Alto (50k-100k)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-500" />
                <span className="text-sm">Médio (20k-50k)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-500" />
                <span className="text-sm">Baixo (5k-20k)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-500" />
                <span className="text-sm">Muito Baixo (&lt;5k)</span>
              </div>
            </div>
          </div>

          {/* Estatísticas por Ano */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-[var(--accent-color)]" />
              <h3 className="font-semibold">Estatísticas por Ano</h3>
            </div>
            <div className="space-y-4">
              {anosSelecionados.sort((a, b) => b - a).map(ano => (
                <div 
                  key={ano} 
                  className="p-3 rounded-lg border-l-4"
                  style={{ borderColor: CORES_ANO[ano]?.corHex }}
                >
                  <p className="font-semibold mb-2" style={{ color: CORES_ANO[ano]?.corHex }}>
                    {ano}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-[var(--text-secondary)]">Eleitores</p>
                      <p className="font-medium">
                        {(estatisticasPorAno[ano]?.eleitores || 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--text-secondary)]">Votos</p>
                      <p className="font-medium">
                        {(estatisticasPorAno[ano]?.votos || 0).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[var(--text-secondary)]">Municípios</p>
                      <p className="font-medium">{estatisticasPorAno[ano]?.municipios || 0}</p>
                    </div>
                    <div>
                      <p className="text-[var(--text-secondary)]">Participação</p>
                      <p className="font-medium">
                        {(estatisticasPorAno[ano]?.participacao || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totais Gerais */}
          <div className="card p-4 bg-gradient-to-br from-[var(--accent-color)]/10 to-transparent">
            <h3 className="font-semibold mb-3">Totais Gerais</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Total Eleitores:</span>
                <span className="font-bold">{totais.eleitores.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Total Votos:</span>
                <span className="font-bold">{totais.votos.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Municípios:</span>
                <span className="font-bold">{totais.municipios}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Participação Média:</span>
                <span className="font-bold">{totais.participacao.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-lg font-semibold">Dados por Município</h2>
          </div>
          <span className="text-sm text-[var(--text-secondary)]">
            {dadosFiltrados.length} registros
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left p-3 font-semibold">Município</th>
                <th className="text-center p-3 font-semibold">Ano</th>
                <th className="text-right p-3 font-semibold">Eleitores</th>
                <th className="text-right p-3 font-semibold">Votos</th>
                <th className="text-right p-3 font-semibold">Comparecimento</th>
                <th className="text-right p-3 font-semibold">Participação</th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados
                .sort((a, b) => b.totalEleitores - a.totalEleitores)
                .slice(0, 30)
                .map((m, index) => (
                  <tr 
                    key={`${m.nm_municipio}-${m.ano}-${index}`} 
                    className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
                  >
                    <td className="p-3 font-medium">{m.nm_municipio}</td>
                    <td className="p-3 text-center">
                      <span 
                        className="px-2 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: CORES_ANO[m.ano]?.corHex }}
                      >
                        {m.ano}
                      </span>
                    </td>
                    <td className="p-3 text-right font-medium">
                      {m.totalEleitores.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-right">
                      {m.totalVotos.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-right">
                      {m.totalComparecimento.toLocaleString('pt-BR')}
                    </td>
                    <td className="p-3 text-right">
                      <span className={m.participacao >= 80 ? 'text-green-500' : m.participacao >= 70 ? 'text-yellow-500' : 'text-red-500'}>
                        {m.participacao.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
