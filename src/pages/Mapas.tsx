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
  BarChart3
} from 'lucide-react'
import { GoogleMap, useJsApiLoader, HeatmapLayer } from '@react-google-maps/api'

const GOOGLE_MAPS_API_KEY = 'AIzaSyATbu5wi9oIQo7hkjNiCjgXI6Gji18ucuI'

interface ZonaData {
  nr_zona: number
  nm_municipio: string
  total_votos: number
  total_aptos: number
  total_comparecimento: number
  total_abstencoes: number
  participacao: number
  abstencao: number
  latitude: number
  longitude: number
}

// Coordenadas aproximadas das zonas eleitorais de Rondônia
// Baseadas nas sedes dos municípios que compõem cada zona
const ZONAS_COORDS: Record<number, { lat: number, lng: number, municipio: string }> = {
  1: { lat: -8.7612, lng: -63.9004, municipio: 'PORTO VELHO' },
  2: { lat: -8.7612, lng: -63.9004, municipio: 'PORTO VELHO' },
  3: { lat: -10.8853, lng: -61.9517, municipio: 'JI-PARANÁ' },
  4: { lat: -11.4386, lng: -61.4472, municipio: 'CACOAL' },
  5: { lat: -12.7406, lng: -60.1458, municipio: 'VILHENA' },
  6: { lat: -8.7612, lng: -63.9004, municipio: 'PORTO VELHO' },
  7: { lat: -9.9082, lng: -63.0408, municipio: 'ARIQUEMES' },
  8: { lat: -10.7833, lng: -65.3500, municipio: 'GUAJARÁ-MIRIM' },
  9: { lat: -11.6725, lng: -61.1936, municipio: 'PIMENTA BUENO' },
  10: { lat: -10.4389, lng: -62.4664, municipio: 'JARU' },
  11: { lat: -10.7250, lng: -62.2500, municipio: 'OURO PRETO DO OESTE' },
  12: { lat: -11.7279, lng: -61.7714, municipio: 'ROLIM DE MOURA' },
  13: { lat: -13.1175, lng: -60.5444, municipio: 'COLORADO DO OESTE' },
  15: { lat: -11.5267, lng: -61.0147, municipio: 'ESPIGÃO D\'OESTE' },
  16: { lat: -13.4833, lng: -61.0500, municipio: 'PIMENTEIRAS DO OESTE' },
  17: { lat: -11.9356, lng: -61.9997, municipio: 'ALTA FLORESTA D\'OESTE' },
  18: { lat: -11.1750, lng: -61.9000, municipio: 'PRESIDENTE MÉDICI' },
  19: { lat: -11.9000, lng: -61.5000, municipio: 'SÃO FELIPE D\'OESTE' },
  20: { lat: -8.7612, lng: -63.9004, municipio: 'PORTO VELHO' },
  21: { lat: -8.7612, lng: -63.9004, municipio: 'PORTO VELHO' },
  25: { lat: -10.2125, lng: -63.8292, municipio: 'BURITIS' },
  26: { lat: -9.3667, lng: -62.5833, municipio: 'CUJUBIM' },
  27: { lat: -9.4428, lng: -61.9814, municipio: 'MACHADINHO D\'OESTE' },
  28: { lat: -10.9000, lng: -62.5500, municipio: 'NOVA UNIÃO' },
  29: { lat: -8.7833, lng: -63.7000, municipio: 'CANDEIAS DO JAMARI' },
  30: { lat: -10.8853, lng: -61.9517, municipio: 'JI-PARANÁ' },
  32: { lat: -12.9833, lng: -60.9167, municipio: 'CORUMBIARA' },
  34: { lat: -9.1833, lng: -63.1500, municipio: 'ITAPUÃ DO OESTE' },
  35: { lat: -8.7612, lng: -63.9004, municipio: 'PORTO VELHO' },
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
      // Buscar dados agregados por zona eleitoral
      const { data, error } = await supabase.rpc('get_dados_por_zona', {
        p_ano: filtroAno,
        p_turno: filtroTurno
      })

      if (error) {
        console.error('Erro na função RPC, tentando fallback:', error)
        // Fallback: buscar dados diretamente
        await fetchDataFallback()
        return
      }

      if (data && data.length > 0) {
        const zonasData: ZonaData[] = data.map((d: any) => {
          const coords = ZONAS_COORDS[d.nr_zona] || { lat: -10.8, lng: -62.5, municipio: 'DESCONHECIDO' }
          return {
            nr_zona: d.nr_zona,
            nm_municipio: coords.municipio,
            total_votos: Number(d.total_votos) || 0,
            total_aptos: Number(d.total_aptos) || 0,
            total_comparecimento: Number(d.total_comparecimento) || 0,
            total_abstencoes: Number(d.total_abstencoes) || 0,
            participacao: Number(d.participacao) || 0,
            abstencao: Number(d.abstencao) || 0,
            latitude: coords.lat,
            longitude: coords.lng
          }
        })

        setZonas(zonasData.sort((a, b) => b.total_votos - a.total_votos))
        setTotalVotosGeral(zonasData.reduce((acc, z) => acc + z.total_votos, 0))
        setTotalEleitores(zonasData.reduce((acc, z) => acc + z.total_aptos, 0))
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      await fetchDataFallback()
    } finally {
      setLoading(false)
    }
  }

  const fetchDataFallback = async () => {
    try {
      // Buscar dados diretamente da tabela boletins_urna
      const { data: boletins, error } = await supabase
        .from('boletins_urna')
        .select('nr_zona, nm_municipio, nr_secao, qt_votos, qt_aptos, qt_comparecimento, qt_abstencoes')
        .eq('ano_eleicao', filtroAno)
        .eq('nr_turno', filtroTurno)
        .eq('cd_cargo_pergunta', 11) // Apenas Prefeito
        .limit(100000)

      if (error) throw error

      if (boletins && boletins.length > 0) {
        // Agregar por zona, evitando duplicação por seção
        const zonaMap: Record<number, {
          total_votos: number,
          total_aptos: number,
          total_comparecimento: number,
          total_abstencoes: number,
          secoes: Set<string>
        }> = {}

        boletins.forEach(b => {
          const zona = b.nr_zona
          const secaoKey = `${zona}-${b.nr_secao}`
          
          if (!zonaMap[zona]) {
            zonaMap[zona] = {
              total_votos: 0,
              total_aptos: 0,
              total_comparecimento: 0,
              total_abstencoes: 0,
              secoes: new Set()
            }
          }
          
          zonaMap[zona].total_votos += b.qt_votos || 0
          
          // Evitar duplicação de seções
          if (!zonaMap[zona].secoes.has(secaoKey)) {
            zonaMap[zona].secoes.add(secaoKey)
            zonaMap[zona].total_aptos += b.qt_aptos || 0
            zonaMap[zona].total_comparecimento += b.qt_comparecimento || 0
            zonaMap[zona].total_abstencoes += b.qt_abstencoes || 0
          }
        })

        const zonasData: ZonaData[] = Object.entries(zonaMap).map(([zona, data]) => {
          const nrZona = Number(zona)
          const coords = ZONAS_COORDS[nrZona] || { lat: -10.8, lng: -62.5, municipio: 'DESCONHECIDO' }
          const participacao = data.total_aptos > 0 ? (data.total_comparecimento / data.total_aptos) * 100 : 0
          const abstencao = data.total_aptos > 0 ? (data.total_abstencoes / data.total_aptos) * 100 : 0
          
          return {
            nr_zona: nrZona,
            nm_municipio: coords.municipio,
            total_votos: data.total_comparecimento, // Usar comparecimento como total de votos
            total_aptos: data.total_aptos,
            total_comparecimento: data.total_comparecimento,
            total_abstencoes: data.total_abstencoes,
            participacao,
            abstencao,
            latitude: coords.lat,
            longitude: coords.lng
          }
        })

        setZonas(zonasData.sort((a, b) => b.total_votos - a.total_votos))
        setTotalVotosGeral(zonasData.reduce((acc, z) => acc + z.total_votos, 0))
        setTotalEleitores(zonasData.reduce((acc, z) => acc + z.total_aptos, 0))
      }
    } catch (error) {
      console.error('Erro no fallback:', error)
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
    const headers = ['Zona', 'Município Sede', 'Total Votos', 'Eleitores Aptos', 'Comparecimento', 'Abstenções', 'Participação (%)', 'Abstenção (%)']
    const rows = zonas.map(z => [
      z.nr_zona,
      z.nm_municipio,
      z.total_votos,
      z.total_aptos,
      z.total_comparecimento,
      z.total_abstencoes,
      z.participacao.toFixed(2),
      z.abstencao.toFixed(2)
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `mapa_calor_zonas_${filtroAno}_turno${filtroTurno}.csv`
    link.click()
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

      {/* Ranking por Zona */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-lg font-semibold">Ranking por Zona Eleitoral - {metricas.find(m => m.key === metricaSelecionada)?.label}</h2>
          </div>
          <button 
            onClick={exportarCSV}
            className="px-4 py-2 rounded-lg border border-[var(--border-color)] flex items-center gap-2 hover:bg-[var(--bg-secondary)]"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border-color)]">
                <th className="text-left p-3 font-semibold">#</th>
                <th className="text-left p-3 font-semibold">Zona</th>
                <th className="text-left p-3 font-semibold">Município Sede</th>
                <th className="text-right p-3 font-semibold">Total Votos</th>
                <th className="text-right p-3 font-semibold">Eleitores</th>
                <th className="text-right p-3 font-semibold">Participação</th>
                <th className="text-right p-3 font-semibold">Abstenção</th>
              </tr>
            </thead>
            <tbody>
              {zonas.map((z, index) => (
                <tr key={z.nr_zona} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">
                  <td className="p-3 text-[var(--text-secondary)]">{index + 1}</td>
                  <td className="p-3 font-medium">Zona {z.nr_zona}</td>
                  <td className="p-3">{z.nm_municipio}</td>
                  <td className="p-3 text-right">{z.total_votos.toLocaleString('pt-BR')}</td>
                  <td className="p-3 text-right">{z.total_aptos.toLocaleString('pt-BR')}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-1 rounded text-sm ${z.participacao >= 75 ? 'bg-green-500/20 text-green-500' : z.participacao >= 60 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}`}>
                      {z.participacao.toFixed(1)}%
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-1 rounded text-sm ${z.abstencao <= 25 ? 'bg-green-500/20 text-green-500' : z.abstencao <= 40 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-red-500/20 text-red-500'}`}>
                      {z.abstencao.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              A intensidade das cores indica o valor da métrica selecionada - cores mais intensas representam valores mais altos.
              <br /><br />
              <strong>Fonte dos dados:</strong> Portal de Dados Abertos do TSE - Boletins de Urna consolidados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
