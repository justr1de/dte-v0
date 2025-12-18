import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { COORDENADAS_RO, CENTRO_RONDONIA, getCoordenadas } from '@/lib/coordenadasRO'
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
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

interface MunicipioData {
  cd_municipio: number
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

type MetricType = 'votos' | 'participacao' | 'abstencao' | 'eleitores'

// Componente para atualizar o centro do mapa
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 7)
  }, [center, map])
  return null
}

export default function MapasCalor() {
  const [loading, setLoading] = useState(true)
  const [municipios, setMunicipios] = useState<MunicipioData[]>([])
  const [filtroAno, setFiltroAno] = useState<number>(2024)
  const [filtroTurno, setFiltroTurno] = useState<number>(1)
  const [metricaSelecionada, setMetricaSelecionada] = useState<MetricType>('votos')
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('todos')
  const [paginaAtual, setPaginaAtual] = useState(1)
  const itensPorPagina = 15

  useEffect(() => {
    fetchData()
  }, [filtroAno, filtroTurno])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Usar a função RPC get_mapa_eleitoral
      const { data, error } = await supabase.rpc('get_mapa_eleitoral', {
        p_ano: filtroAno,
        p_turno: filtroTurno
      })

      if (error) throw error

      if (data && data.length > 0) {
        // Adicionar coordenadas aos dados
        const municipiosComCoordenadas = data.map((m: any) => {
          const coords = getCoordenadas(m.nm_municipio)
          return {
            ...m,
            latitude: coords ? coords[0] : CENTRO_RONDONIA[0],
            longitude: coords ? coords[1] : CENTRO_RONDONIA[1]
          }
        }).filter((m: any) => m.latitude && m.longitude)

        setMunicipios(municipiosComCoordenadas.sort((a: any, b: any) => b.total_votos - a.total_votos))
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar municípios
  const municipiosFiltrados = filtroMunicipio === 'todos' 
    ? municipios 
    : municipios.filter(m => m.nm_municipio === filtroMunicipio)

  // Paginação
  const totalPaginas = Math.ceil(municipiosFiltrados.length / itensPorPagina)
  const indiceInicio = (paginaAtual - 1) * itensPorPagina
  const indiceFim = indiceInicio + itensPorPagina
  const municipiosPaginados = municipiosFiltrados.slice(indiceInicio, indiceFim)

  // Reset página quando filtro muda
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroMunicipio, filtroAno, filtroTurno])

  const getColor = (value: number, max: number, metric: MetricType): string => {
    const ratio = max > 0 ? value / max : 0
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
      case 'votos': return m.total_votos
      case 'participacao': return m.participacao
      case 'abstencao': return m.abstencao
      case 'eleitores': return m.total_aptos
      default: return m.total_votos
    }
  }

  const getMetricLabel = (metric: MetricType): string => {
    switch (metric) {
      case 'votos': return 'Total de Votos'
      case 'participacao': return 'Participação (%)'
      case 'abstencao': return 'Abstenção (%)'
      case 'eleitores': return 'Eleitores Aptos'
      default: return 'Total de Votos'
    }
  }

  const maxValue = Math.max(...municipiosFiltrados.map(m => getMetricValue(m)), 1)

  // Calcular raio do círculo baseado no valor
  const getRadius = (value: number, max: number): number => {
    const minRadius = 8
    const maxRadius = 35
    const ratio = max > 0 ? value / max : 0
    return minRadius + (maxRadius - minRadius) * ratio
  }

  const metricas = [
    { key: 'votos' as MetricType, label: 'Total de Votos', icon: Vote },
    { key: 'participacao' as MetricType, label: 'Participação (%)', icon: TrendingUp },
    { key: 'abstencao' as MetricType, label: 'Abstenção (%)', icon: Users },
    { key: 'eleitores' as MetricType, label: 'Eleitores Aptos', icon: Users },
  ]

  // Estatísticas gerais
  const totalVotos = municipios.reduce((acc, m) => acc + m.total_votos, 0)
  const totalEleitores = municipios.reduce((acc, m) => acc + m.total_aptos, 0)
  const participacaoMedia = totalEleitores > 0 
    ? (municipios.reduce((acc, m) => acc + m.total_comparecimento, 0) / totalEleitores) * 100 
    : 0

  // Exportar para CSV
  const exportarCSV = () => {
    const headers = ['#', 'Município', 'Total Votos', 'Eleitores Aptos', 'Comparecimento', 'Abstenções', 'Participação (%)', 'Abstenção (%)', 'Latitude', 'Longitude']
    const rows = municipiosFiltrados.map((m, i) => [
      i + 1,
      m.nm_municipio,
      m.total_votos,
      m.total_aptos,
      m.total_comparecimento,
      m.total_abstencoes,
      m.participacao.toFixed(2),
      m.abstencao.toFixed(2),
      m.latitude,
      m.longitude
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `mapa_calor_ro_${filtroAno}_turno${filtroTurno}.csv`
    link.click()
  }

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

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Vote className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Total de Votos</p>
              <p className="text-xl font-bold">{totalVotos.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Eleitores Aptos</p>
              <p className="text-xl font-bold">{totalEleitores.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Participação Média</p>
              <p className="text-xl font-bold">{participacaoMedia.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <MapPin className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Municípios</p>
              <p className="text-xl font-bold">{municipios.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[var(--accent-color)]" />
            <span className="font-semibold">Filtros:</span>
          </div>
          <select
            value={filtroMunicipio}
            onChange={(e) => setFiltroMunicipio(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] flex-1 md:flex-none md:w-64"
          >
            <option value="todos">Todos os municípios ({municipios.length})</option>
            {municipios.map(m => (
              <option key={m.cd_municipio} value={m.nm_municipio}>{m.nm_municipio}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Seletor de Métrica */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-5 h-5 text-[var(--accent-color)]" />
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

      {/* Mapa Leaflet */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-lg font-semibold">Mapa de Calor - {getMetricLabel(metricaSelecionada)}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--text-secondary)]">Legenda:</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span>Baixo</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span>Médio-Baixo</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                <span>Médio</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-lime-500"></div>
                <span>Médio-Alto</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span>Alto</span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-[500px] rounded-lg overflow-hidden border border-[var(--border-color)]">
          <MapContainer
            center={CENTRO_RONDONIA}
            zoom={7}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapUpdater center={CENTRO_RONDONIA} />
            
            {municipiosFiltrados.map((m) => {
              const value = getMetricValue(m)
              const color = getColor(value, maxValue, metricaSelecionada)
              const radius = getRadius(value, maxValue)
              
              return (
                <CircleMarker
                  key={m.cd_municipio}
                  center={[m.latitude, m.longitude]}
                  radius={radius}
                  pathOptions={{
                    fillColor: color,
                    fillOpacity: 0.7,
                    color: color,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-bold text-lg mb-2">{m.nm_municipio}</h3>
                      <div className="space-y-1 text-sm">
                        <p><strong>Total de Votos:</strong> {m.total_votos.toLocaleString('pt-BR')}</p>
                        <p><strong>Eleitores Aptos:</strong> {m.total_aptos.toLocaleString('pt-BR')}</p>
                        <p><strong>Comparecimento:</strong> {m.total_comparecimento.toLocaleString('pt-BR')}</p>
                        <p><strong>Abstenções:</strong> {m.total_abstencoes.toLocaleString('pt-BR')}</p>
                        <p><strong>Participação:</strong> <span className="text-green-600">{m.participacao.toFixed(1)}%</span></p>
                        <p><strong>Abstenção:</strong> <span className="text-red-600">{m.abstencao.toFixed(1)}%</span></p>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              )
            })}
          </MapContainer>
        </div>
        
        <div className="mt-4 p-4 bg-[var(--bg-secondary)] rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-[var(--accent-color)] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[var(--text-secondary)]">
              <p><strong>Como interpretar:</strong> O tamanho e a cor dos círculos representam a intensidade da métrica selecionada.</p>
              <p className="mt-1">Círculos maiores e mais verdes indicam valores mais altos (exceto para abstenção, onde vermelho indica maior abstenção).</p>
              <p className="mt-1">Clique em um círculo para ver detalhes do município.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ranking por Município */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-lg font-semibold">Ranking por Município - {getMetricLabel(metricaSelecionada)}</h2>
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
                <th className="text-left p-3 font-semibold">Município</th>
                <th className="text-right p-3 font-semibold">Total Votos</th>
                <th className="text-right p-3 font-semibold">Eleitores Aptos</th>
                <th className="text-right p-3 font-semibold">Participação</th>
                <th className="text-right p-3 font-semibold">Abstenção</th>
                <th className="text-center p-3 font-semibold">Intensidade</th>
              </tr>
            </thead>
            <tbody>
              {municipiosPaginados.map((m, index) => {
                const value = getMetricValue(m)
                const color = getColor(value, maxValue, metricaSelecionada)
                const globalIndex = indiceInicio + index + 1
                return (
                  <tr key={m.cd_municipio} className={`border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)] ${index % 2 === 0 ? 'bg-[var(--bg-secondary)]/30' : ''}`}>
                    <td className="p-3 text-[var(--text-secondary)]">{globalIndex}</td>
                    <td className="p-3 font-medium">{m.nm_municipio}</td>
                    <td className="p-3 text-right">{m.total_votos.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right">{m.total_aptos.toLocaleString('pt-BR')}</td>
                    <td className="p-3 text-right">
                      <span className="text-green-500 font-medium">{m.participacao.toFixed(1)}%</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className="text-red-500 font-medium">{m.abstencao.toFixed(1)}%</span>
                    </td>
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

        {/* Paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-color)]">
            <span className="text-sm text-[var(--text-secondary)]">
              Mostrando {indiceInicio + 1} a {Math.min(indiceFim, municipiosFiltrados.length)} de {municipiosFiltrados.length} municípios
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaAtual(1)}
                disabled={paginaAtual === 1}
                className="px-3 py-1 rounded border border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]"
              >
                Primeira
              </button>
              <button
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="p-2 rounded border border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let pageNum
                if (totalPaginas <= 5) {
                  pageNum = i + 1
                } else if (paginaAtual <= 3) {
                  pageNum = i + 1
                } else if (paginaAtual >= totalPaginas - 2) {
                  pageNum = totalPaginas - 4 + i
                } else {
                  pageNum = paginaAtual - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPaginaAtual(pageNum)}
                    className={`px-3 py-1 rounded border ${
                      paginaAtual === pageNum
                        ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)]'
                        : 'border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              
              <button
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="p-2 rounded border border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPaginaAtual(totalPaginas)}
                disabled={paginaAtual === totalPaginas}
                className="px-3 py-1 rounded border border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]"
              >
                Última
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Informações sobre a visualização */}
      <div className="card p-6 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-500 mb-2">Sobre a Visualização</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Este mapa de calor utiliza dados oficiais do TSE (Tribunal Superior Eleitoral) agregados pela função 
              <code className="mx-1 px-1 py-0.5 bg-[var(--bg-secondary)] rounded">get_mapa_eleitoral</code>.
              As coordenadas geográficas dos 52 municípios de Rondônia foram mapeadas manualmente para permitir 
              a visualização espacial dos dados eleitorais.
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              <strong>Fonte dos dados:</strong> Portal de Dados Abertos do TSE - Boletins de Urna consolidados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
