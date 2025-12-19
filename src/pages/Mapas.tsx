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
  Layers,
  Info,
  Building2,
  ChevronDown,
  ChevronUp,
  School
} from 'lucide-react'
import { GoogleMap, useJsApiLoader, HeatmapLayer } from '@react-google-maps/api'

const GOOGLE_MAPS_API_KEY = 'AIzaSyATbu5wi9oIQo7hkjNiCjgXI6Gji18ucuI'

interface ZonaData {
  nr_zona: number
  municipios: string[]
  total_votos: number
  total_aptos: number
  total_comparecimento: number
  total_abstencoes: number
  participacao: number
  abstencao: number
  latitude: number
  longitude: number
  locais_votacao: LocalVotacao[]
}

interface LocalVotacao {
  nr_local: number
  nm_local: string
  endereco: string
  municipio: string
  qt_secoes: number
}

// Mapeamento de zonas para municípios (dados do TSE 2020)
const ZONAS_MUNICIPIOS: Record<number, string[]> = {
  1: ['GUAJARÁ-MIRIM', 'NOVA MAMORÉ'],
  2: ['ITAPUÃ DO OESTE', 'PORTO VELHO'],
  3: ['JI-PARANÁ', 'PRESIDENTE MÉDICI'],
  4: ['VILHENA'],
  5: ['COSTA MARQUES', 'SÃO FRANCISCO DO GUAPORÉ'],
  6: ['PORTO VELHO'],
  7: ['ARIQUEMES'],
  8: ['CABIXI', 'CHUPINGUAIA', 'COLORADO DO OESTE'],
  9: ['PIMENTA BUENO', 'PRIMAVERA DE RONDÔNIA'],
  10: ['JARU'],
  11: ['CACOAL', 'MINISTRO ANDREAZZA'],
  12: ['ESPIGÃO DO OESTE'],
  13: ['OURO PRETO DO OESTE', 'TEIXEIRÓPOLIS'],
  15: ['CASTANHEIRAS', 'NOVA BRASILÂNDIA D\'OESTE', 'NOVO HORIZONTE DO OESTE'],
  16: ['CEREJEIRAS', 'CORUMBIARA', 'PIMENTEIRAS DO OESTE'],
  17: ['ALTA FLORESTA D\'OESTE'],
  18: ['ALVORADA DO OESTE', 'URUPÁ'],
  19: ['ALTO ALEGRE DOS PARECIS', 'PARECIS', 'SANTA LUZIA D\'OESTE', 'SÃO FELIPE D\'OESTE'],
  20: ['PORTO VELHO'],
  21: ['CANDEIAS DO JAMARI', 'PORTO VELHO'],
  25: ['ALTO PARAÍSO', 'MONTE NEGRO'],
  26: ['CACAULÂNDIA', 'CUJUBIM', 'RIO CRESPO'],
  27: ['GOVERNADOR JORGE TEIXEIRA', 'THEOBROMA'],
  28: ['MIRANTE DA SERRA', 'NOVA UNIÃO', 'VALE DO PARAÍSO'],
  29: ['ROLIM DE MOURA'],
  30: ['JI-PARANÁ'],
  32: ['MACHADINHO D\'OESTE', 'VALE DO ANARI'],
  34: ['BURITIS', 'CAMPO NOVO DE RONDÔNIA'],
  35: ['SERINGUEIRAS', 'SÃO MIGUEL DO GUAPORÉ'],
}

// Coordenadas das zonas eleitorais de Rondônia
const ZONAS_COORDS: Record<number, { lat: number, lng: number }> = {
  1: { lat: -10.7833, lng: -65.3500 },  // Guajará-Mirim
  2: { lat: -8.7612, lng: -63.9004 },   // Porto Velho
  3: { lat: -10.8853, lng: -61.9517 },  // Ji-Paraná
  4: { lat: -12.7406, lng: -60.1458 },  // Vilhena
  5: { lat: -12.4389, lng: -64.2278 },  // Costa Marques
  6: { lat: -8.7612, lng: -63.9004 },   // Porto Velho
  7: { lat: -9.9082, lng: -63.0408 },   // Ariquemes
  8: { lat: -13.1175, lng: -60.5444 },  // Colorado do Oeste
  9: { lat: -11.6725, lng: -61.1936 },  // Pimenta Bueno
  10: { lat: -10.4389, lng: -62.4664 }, // Jaru
  11: { lat: -11.4386, lng: -61.4472 }, // Cacoal
  12: { lat: -11.5267, lng: -61.0147 }, // Espigão do Oeste
  13: { lat: -10.7250, lng: -62.2500 }, // Ouro Preto do Oeste
  15: { lat: -11.7250, lng: -62.3167 }, // Nova Brasilândia
  16: { lat: -13.1944, lng: -60.8167 }, // Cerejeiras
  17: { lat: -11.9356, lng: -61.9997 }, // Alta Floresta
  18: { lat: -11.3500, lng: -62.2833 }, // Alvorada do Oeste
  19: { lat: -12.1333, lng: -61.8500 }, // Alto Alegre dos Parecis
  20: { lat: -8.7612, lng: -63.9004 },  // Porto Velho
  21: { lat: -8.7833, lng: -63.7000 },  // Candeias do Jamari
  25: { lat: -10.2500, lng: -63.3000 }, // Monte Negro
  26: { lat: -9.3667, lng: -62.5833 },  // Cujubim
  27: { lat: -10.6167, lng: -62.7500 }, // Gov. Jorge Teixeira
  28: { lat: -11.0333, lng: -62.6667 }, // Mirante da Serra
  29: { lat: -11.7279, lng: -61.7714 }, // Rolim de Moura
  30: { lat: -10.8853, lng: -61.9517 }, // Ji-Paraná
  32: { lat: -9.4428, lng: -61.9814 },  // Machadinho
  34: { lat: -10.2125, lng: -63.8292 }, // Buritis
  35: { lat: -11.6917, lng: -62.7167 }, // São Miguel do Guaporé
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

export default function Mapas() {
  const [loading, setLoading] = useState(true)
  const [zonas, setZonas] = useState<ZonaData[]>([])
  const [filtroAno, setFiltroAno] = useState<number>(2024)
  const [filtroTurno, setFiltroTurno] = useState<number>(1)
  const [metricaSelecionada, setMetricaSelecionada] = useState<MetricType>('votos')
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [heatmapData, setHeatmapData] = useState<google.maps.visualization.WeightedLocation[]>([])
  const [totalVotosGeral, setTotalVotosGeral] = useState(0)
  const [totalEleitores, setTotalEleitores] = useState(0)
  const [zonaExpandida, setZonaExpandida] = useState<number | null>(null)
  const [locaisVotacao, setLocaisVotacao] = useState<Record<number, LocalVotacao[]>>({})

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries
  })

  useEffect(() => {
    fetchData()
  }, [filtroAno, filtroTurno])

  useEffect(() => {
    if (isLoaded && zonas.length > 0) {
      updateHeatmapData()
    }
  }, [zonas, metricaSelecionada, isLoaded])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar dados diretamente da tabela boletins_urna agrupados por zona
      const { data: boletins, error } = await supabase
        .from('boletins_urna')
        .select('nr_zona, nm_municipio, nr_secao, nr_local_votacao, qt_votos, qt_aptos, qt_comparecimento, qt_abstencoes')
        .eq('ano_eleicao', filtroAno)
        .eq('nr_turno', filtroTurno)
        .eq('cd_cargo_pergunta', 11) // Apenas Prefeito
        .limit(100000)

      if (error) throw error

      if (boletins && boletins.length > 0) {
        // Agregar por zona
        const zonaMap: Record<number, {
          municipios: Set<string>,
          total_votos: number,
          total_aptos: number,
          total_comparecimento: number,
          total_abstencoes: number,
          secoes: Set<string>,
          locais: Map<number, { nm_local: string, endereco: string, municipio: string, secoes: Set<string> }>
        }> = {}

        boletins.forEach(b => {
          const zona = b.nr_zona
          const secaoKey = `${zona}-${b.nr_secao}`
          const localKey = b.nr_local_votacao
          
          if (!zonaMap[zona]) {
            zonaMap[zona] = {
              municipios: new Set(),
              total_votos: 0,
              total_aptos: 0,
              total_comparecimento: 0,
              total_abstencoes: 0,
              secoes: new Set(),
              locais: new Map()
            }
          }
          
          zonaMap[zona].municipios.add(b.nm_municipio)
          zonaMap[zona].total_votos += b.qt_votos || 0
          
          // Evitar duplicação de seções
          if (!zonaMap[zona].secoes.has(secaoKey)) {
            zonaMap[zona].secoes.add(secaoKey)
            zonaMap[zona].total_aptos += b.qt_aptos || 0
            zonaMap[zona].total_comparecimento += b.qt_comparecimento || 0
            zonaMap[zona].total_abstencoes += b.qt_abstencoes || 0
          }

          // Agregar locais de votação
          if (localKey && !zonaMap[zona].locais.has(localKey)) {
            zonaMap[zona].locais.set(localKey, {
              nm_local: '',
              endereco: '',
              municipio: b.nm_municipio,
              secoes: new Set()
            })
          }
          if (localKey) {
            zonaMap[zona].locais.get(localKey)?.secoes.add(String(b.nr_secao))
          }
        })

        const zonasData: ZonaData[] = Object.entries(zonaMap).map(([zona, data]) => {
          const nrZona = Number(zona)
          const coords = ZONAS_COORDS[nrZona] || { lat: -10.8, lng: -62.5 }
          const participacao = data.total_aptos > 0 ? (data.total_comparecimento / data.total_aptos) * 100 : 0
          const abstencao = data.total_aptos > 0 ? (data.total_abstencoes / data.total_aptos) * 100 : 0
          
          // Usar municípios do mapeamento estático ou dos dados
          const municipios = ZONAS_MUNICIPIOS[nrZona] || Array.from(data.municipios)
          
          // Converter locais para array
          const locaisArray: LocalVotacao[] = Array.from(data.locais.entries()).map(([nr, info]) => ({
            nr_local: nr,
            nm_local: info.nm_local || `Local ${nr}`,
            endereco: info.endereco,
            municipio: info.municipio,
            qt_secoes: info.secoes.size
          }))
          
          return {
            nr_zona: nrZona,
            municipios,
            total_votos: data.total_comparecimento, // Usar comparecimento como total de votos
            total_aptos: data.total_aptos,
            total_comparecimento: data.total_comparecimento,
            total_abstencoes: data.total_abstencoes,
            participacao,
            abstencao,
            latitude: coords.lat,
            longitude: coords.lng,
            locais_votacao: locaisArray
          }
        })

        setZonas(zonasData.sort((a, b) => b.total_votos - a.total_votos))
        setTotalVotosGeral(zonasData.reduce((acc, z) => acc + z.total_votos, 0))
        setTotalEleitores(zonasData.reduce((acc, z) => acc + z.total_aptos, 0))
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMetricValue = (z: ZonaData): number => {
    switch (metricaSelecionada) {
      case 'votos': return z.total_votos
      case 'participacao': return z.participacao
      case 'abstencao': return z.abstencao
      case 'densidade': return z.total_aptos
      default: return z.total_votos
    }
  }

  const updateHeatmapData = () => {
    if (!isLoaded || !window.google) return

    const maxValue = Math.max(...zonas.map(z => getMetricValue(z)), 1)
    
    const data: google.maps.visualization.WeightedLocation[] = zonas.map(z => ({
      location: new google.maps.LatLng(z.latitude, z.longitude),
      weight: (getMetricValue(z) / maxValue) * 100
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

  const exportarCSV = () => {
    const headers = ['Zona', 'Municípios', 'Total Votos', 'Eleitores Aptos', 'Comparecimento', 'Abstenções', 'Participação (%)', 'Abstenção (%)', 'Locais de Votação']
    const rows = zonas.map(z => [
      z.nr_zona,
      z.municipios.join('; '),
      z.total_votos,
      z.total_aptos,
      z.total_comparecimento,
      z.total_abstencoes,
      z.participacao.toFixed(2),
      z.abstencao.toFixed(2),
      z.locais_votacao.length
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `mapa_calor_zonas_${filtroAno}_turno${filtroTurno}.csv`
    link.click()
  }

  const toggleZonaExpandida = (zona: number) => {
    setZonaExpandida(zonaExpandida === zona ? null : zona)
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
            Mapa de Calor - Zonas Eleitorais
          </h1>
          <p className="text-[var(--text-secondary)]">Visualização de intensidade eleitoral por zona eleitoral de Rondônia</p>
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

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Vote className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[var(--text-secondary)]">Total de Votos</span>
          </div>
          <p className="text-2xl font-bold">{totalVotosGeral.toLocaleString('pt-BR')}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-green-500" />
            <span className="text-sm text-[var(--text-secondary)]">Eleitores Aptos</span>
          </div>
          <p className="text-2xl font-bold">{totalEleitores.toLocaleString('pt-BR')}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-[var(--text-secondary)]">Zonas Eleitorais</span>
          </div>
          <p className="text-2xl font-bold">{zonas.length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span className="text-sm text-[var(--text-secondary)]">Participação Média</span>
          </div>
          <p className="text-2xl font-bold">
            {zonas.length > 0 ? (zonas.reduce((acc, z) => acc + z.participacao, 0) / zonas.length).toFixed(1) : 0}%
          </p>
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
            <h2 className="text-lg font-semibold">Mapa de Calor - Zonas Eleitorais</h2>
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

      {/* Detalhamento por Zona */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-lg font-semibold">Detalhamento por Zona Eleitoral</h2>
          </div>
          <button 
            onClick={exportarCSV}
            className="px-4 py-2 rounded-lg border border-[var(--border-color)] flex items-center gap-2 hover:bg-[var(--bg-secondary)]"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        <div className="space-y-3">
          {zonas.map((z, index) => (
            <div key={z.nr_zona} className="border border-[var(--border-color)] rounded-lg overflow-hidden">
              {/* Cabeçalho da Zona (clicável) */}
              <div 
                className="p-4 bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-secondary)]/80 transition-colors"
                onClick={() => toggleZonaExpandida(z.nr_zona)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-[var(--accent-color)]">#{index + 1}</span>
                    <div>
                      <h3 className="font-semibold flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Zona {z.nr_zona}
                      </h3>
                      <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {z.municipios.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-[var(--text-secondary)]">Votos</p>
                      <p className="font-bold">{z.total_votos.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[var(--text-secondary)]">Eleitores</p>
                      <p className="font-bold">{z.total_aptos.toLocaleString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[var(--text-secondary)]">Participação</p>
                      <span className={`px-2 py-1 rounded text-sm font-bold ${z.participacao >= 75 ? 'bg-green-500/20 text-green-500' : z.participacao >= 60 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}`}>
                        {z.participacao.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-[var(--text-secondary)]">Locais</p>
                      <p className="font-bold flex items-center gap-1">
                        <School className="w-4 h-4" />
                        {z.locais_votacao.length}
                      </p>
                    </div>
                    {zonaExpandida === z.nr_zona ? (
                      <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
                    )}
                  </div>
                </div>
              </div>

              {/* Detalhes expandidos */}
              {zonaExpandida === z.nr_zona && (
                <div className="p-4 border-t border-[var(--border-color)]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-[var(--bg-primary)] rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        Municípios da Zona
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {z.municipios.map(mun => (
                          <span key={mun} className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-sm">
                            {mun}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-[var(--bg-primary)] rounded-lg">
                      <h4 className="font-semibold mb-2">Estatísticas Detalhadas</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-[var(--text-secondary)]">Comparecimento:</span>
                          <span className="ml-2 font-medium">{z.total_comparecimento.toLocaleString('pt-BR')}</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-secondary)]">Abstenções:</span>
                          <span className="ml-2 font-medium">{z.total_abstencoes.toLocaleString('pt-BR')}</span>
                        </div>
                        <div>
                          <span className="text-[var(--text-secondary)]">Taxa Abstenção:</span>
                          <span className={`ml-2 font-medium ${z.abstencao <= 25 ? 'text-green-500' : z.abstencao <= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {z.abstencao.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[var(--text-secondary)]">Locais de Votação:</span>
                          <span className="ml-2 font-medium">{z.locais_votacao.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Lista de Locais de Votação */}
                  {z.locais_votacao.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <School className="w-4 h-4 text-emerald-500" />
                        Locais de Votação ({z.locais_votacao.length})
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                        {z.locais_votacao.slice(0, 12).map((local, idx) => (
                          <div key={idx} className="p-3 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)]">
                            <p className="font-medium text-sm">{local.nm_local || `Local ${local.nr_local}`}</p>
                            <p className="text-xs text-[var(--text-secondary)]">{local.municipio}</p>
                            {local.endereco && (
                              <p className="text-xs text-[var(--text-secondary)] mt-1">{local.endereco}</p>
                            )}
                            <p className="text-xs text-emerald-500 mt-1">{local.qt_secoes} seções</p>
                          </div>
                        ))}
                      </div>
                      {z.locais_votacao.length > 12 && (
                        <p className="text-sm text-[var(--text-secondary)] mt-2 text-center">
                          ... e mais {z.locais_votacao.length - 12} locais
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Informações */}
      <div className="card p-4 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-500">Sobre a Visualização</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              O mapa de calor mostra a concentração de votos e outras métricas eleitorais nas 29 zonas eleitorais de Rondônia. 
              Cada ponto representa uma zona eleitoral, posicionada na sede do município principal da zona.
              Clique em uma zona para ver os detalhes, incluindo os municípios que a compõem e os locais de votação (escolas, etc.).
              <br /><br />
              <strong>Fonte dos dados:</strong> Portal de Dados Abertos do TSE - Boletins de Urna consolidados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
