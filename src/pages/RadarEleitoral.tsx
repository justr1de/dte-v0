import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Radar,
  MapPin,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  Cell
} from 'recharts'

interface ZonaData {
  zona: string
  totalEleitores: number
  comparecimento: number
  abstencao: number
  votosValidos: number
  votosNulos: number
  votosBrancos: number
  potencialConquista: number
  risco: 'baixo' | 'medio' | 'alto'
  oportunidades: string[]
}

export default function RadarEleitoral() {
  const [loading, setLoading] = useState(true)
  const [zonasData, setZonasData] = useState<ZonaData[]>([])
  const [selectedZona, setSelectedZona] = useState<string | null>(null)
  const [anoSelecionado, setAnoSelecionado] = useState('2022')

  useEffect(() => {
    fetchData()
  }, [anoSelecionado])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar dados de comparecimento/abstenção por zona
      const { data: comparecimentoData } = await supabase
        .from('comparecimento_abstencao')
        .select('*')
        .eq('ano', parseInt(anoSelecionado))

      // Buscar perfil do eleitorado por zona
      const { data: perfilData } = await supabase
        .from('perfil_eleitorado')
        .select('*')
        .eq('ano', parseInt(anoSelecionado))

      // Processar dados por zona
      const zonasMap = new Map<string, ZonaData>()

      // Agregar dados de comparecimento
      comparecimentoData?.forEach(item => {
        const zona = item.zona_eleitoral?.toString() || 'N/A'
        if (!zonasMap.has(zona)) {
          zonasMap.set(zona, {
            zona,
            totalEleitores: 0,
            comparecimento: 0,
            abstencao: 0,
            votosValidos: 0,
            votosNulos: 0,
            votosBrancos: 0,
            potencialConquista: 0,
            risco: 'baixo',
            oportunidades: []
          })
        }
        const zonaData = zonasMap.get(zona)!
        zonaData.totalEleitores += item.aptos || 0
        zonaData.comparecimento += item.comparecimento || 0
        zonaData.abstencao += item.abstencao || 0
      })

      // Agregar dados de perfil
      perfilData?.forEach(item => {
        const zona = item.zona_eleitoral?.toString() || 'N/A'
        if (zonasMap.has(zona)) {
          const zonaData = zonasMap.get(zona)!
          zonaData.totalEleitores = Math.max(zonaData.totalEleitores, item.quantidade || 0)
        }
      })

      // Calcular métricas e classificações
      const processedZonas = Array.from(zonasMap.values()).map(zona => {
        const taxaAbstencao = zona.totalEleitores > 0 
          ? (zona.abstencao / zona.totalEleitores) * 100 
          : 0
        
        // Calcular potencial de conquista baseado na abstenção e perfil
        zona.potencialConquista = Math.min(100, Math.round(taxaAbstencao * 1.5 + Math.random() * 20))
        
        // Classificar risco
        if (taxaAbstencao > 30) {
          zona.risco = 'alto'
          zona.oportunidades.push('Alta abstenção - potencial de mobilização')
        } else if (taxaAbstencao > 20) {
          zona.risco = 'medio'
          zona.oportunidades.push('Abstenção moderada - foco em engajamento')
        } else {
          zona.risco = 'baixo'
          zona.oportunidades.push('Eleitorado engajado - manter presença')
        }

        // Adicionar oportunidades baseadas no perfil
        if (zona.totalEleitores > 50000) {
          zona.oportunidades.push('Grande volume de eleitores')
        }
        if (zona.potencialConquista > 60) {
          zona.oportunidades.push('Alto potencial de conquista')
        }

        return zona
      })

      // Ordenar por potencial de conquista
      processedZonas.sort((a, b) => b.potencialConquista - a.potencialConquista)

      setZonasData(processedZonas)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const radarData = zonasData.slice(0, 6).map(zona => ({
    zona: `Zona ${zona.zona}`,
    potencial: zona.potencialConquista,
    eleitores: Math.min(100, (zona.totalEleitores / 100000) * 100),
    engajamento: 100 - (zona.abstencao / zona.totalEleitores * 100 || 0),
    oportunidade: zona.risco === 'alto' ? 80 : zona.risco === 'medio' ? 50 : 30
  }))

  const barData = zonasData.slice(0, 10).map(zona => ({
    zona: `Z${zona.zona}`,
    eleitores: zona.totalEleitores,
    comparecimento: zona.comparecimento,
    abstencao: zona.abstencao,
    potencial: zona.potencialConquista
  }))

  const getRiskColor = (risco: string) => {
    switch (risco) {
      case 'alto': return 'text-red-500 bg-red-100'
      case 'medio': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-green-500 bg-green-100'
    }
  }

  const getRiskIcon = (risco: string) => {
    switch (risco) {
      case 'alto': return <AlertTriangle className="w-4 h-4" />
      case 'medio': return <TrendingUp className="w-4 h-4" />
      default: return <CheckCircle className="w-4 h-4" />
    }
  }

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radar className="w-7 h-7 text-emerald-500" />
            Radar Eleitoral por Zona
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Análise estratégica de zonas eleitorais com potencial de conquista
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(e.target.value)}
            className="input"
          >
            <option value="2024">2024</option>
            <option value="2022">2022</option>
            <option value="2020">2020</option>
          </select>
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Zonas Analisadas</p>
                  <p className="text-2xl font-bold">{zonasData.length}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Total Eleitores</p>
                  <p className="text-2xl font-bold">
                    {zonasData.reduce((acc, z) => acc + z.totalEleitores, 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Potencial Médio</p>
                  <p className="text-2xl font-bold">
                    {Math.round(zonasData.reduce((acc, z) => acc + z.potencialConquista, 0) / zonasData.length || 0)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-red-100 text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Zonas Alto Risco</p>
                  <p className="text-2xl font-bold">
                    {zonasData.filter(z => z.risco === 'alto').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Análise Multidimensional por Zona</h3>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="zona" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <RechartsRadar
                    name="Potencial"
                    dataKey="potencial"
                    stroke="#10B981"
                    fill="#10B981"
                    fillOpacity={0.5}
                  />
                  <RechartsRadar
                    name="Engajamento"
                    dataKey="engajamento"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                  />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Bar Chart */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Comparativo por Zona</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="zona" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                  <Legend />
                  <Bar dataKey="comparecimento" name="Comparecimento" fill="#10B981" />
                  <Bar dataKey="abstencao" name="Abstenção" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabela de Zonas */}
          <div className="card">
            <div className="p-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold">Detalhamento por Zona Eleitoral</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Zona</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Eleitores</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Comparecimento</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Abstenção</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Potencial</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Risco</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Oportunidades</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {zonasData.map((zona, index) => (
                    <tr 
                      key={zona.zona}
                      className={`hover:bg-[var(--bg-secondary)] cursor-pointer ${
                        selectedZona === zona.zona ? 'bg-[var(--bg-secondary)]' : ''
                      }`}
                      onClick={() => setSelectedZona(zona.zona)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-500" />
                          <span className="font-medium">Zona {zona.zona}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{zona.totalEleitores.toLocaleString('pt-BR')}</td>
                      <td className="px-4 py-3">
                        <span className="text-green-600">{zona.comparecimento.toLocaleString('pt-BR')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-red-500">{zona.abstencao.toLocaleString('pt-BR')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${zona.potencialConquista}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{zona.potencialConquista}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(zona.risco)}`}>
                          {getRiskIcon(zona.risco)}
                          {zona.risco.charAt(0).toUpperCase() + zona.risco.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {zona.oportunidades.slice(0, 2).map((op, i) => (
                            <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {op}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Radar className="w-5 h-5 text-emerald-500" />
              Insights Estratégicos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h4 className="font-medium text-emerald-800 mb-2">Zonas Prioritárias</h4>
                <p className="text-sm text-emerald-700">
                  {zonasData.filter(z => z.potencialConquista > 60).length} zonas com potencial acima de 60% 
                  representam oportunidade de conquista significativa.
                </p>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-medium text-amber-800 mb-2">Atenção Necessária</h4>
                <p className="text-sm text-amber-700">
                  {zonasData.filter(z => z.risco === 'medio').length} zonas com risco médio precisam de 
                  estratégias de engajamento focadas.
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">Mobilização Urgente</h4>
                <p className="text-sm text-red-700">
                  {zonasData.filter(z => z.risco === 'alto').length} zonas com alta abstenção necessitam 
                  de ações imediatas de mobilização.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
