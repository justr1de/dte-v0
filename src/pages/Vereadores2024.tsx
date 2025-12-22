import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Users,
  Vote,
  MapPin,
  TrendingUp,
  Filter,
  Download,
  Search,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Building2,
  Award,
  Loader2,
  RefreshCw,
  Trophy,
  Medal
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
  PieChart,
  Pie,
  Cell
} from 'recharts'

interface Vereador {
  nm_votavel: string
  nm_municipio: string
  nm_partido: string
  total_votos: number
}

const CORES_PARTIDOS: Record<string, string> = {
  'UNIÃO BRASIL': '#1E3A8A',
  'UNIÃO': '#1E3A8A',
  'PL': '#16A34A',
  'MDB': '#DC2626',
  'PSD': '#7C3AED',
  'PT': '#EF4444',
  'PSDB': '#F59E0B',
  'PP': '#3B82F6',
  'PDT': '#10B981',
  'PSB': '#6366F1',
  'PODEMOS': '#EC4899',
  'REPUBLICANOS': '#8B5CF6',
  'CIDADANIA': '#06B6D4',
  'PV': '#84CC16',
  'PSOL': '#A855F7',
  'PC do B': '#0EA5E9',
  'AVANTE': '#D946EF',
  'SOLIDARIEDADE': '#F43F5E',
  'NOVO': '#FF6F00',
  'REDE': '#00BCD4',
}

function getCorPartido(partido: string): string {
  if (!partido) return '#6B7280'
  const partidoUpper = partido.toUpperCase()
  for (const [key, color] of Object.entries(CORES_PARTIDOS)) {
    if (partidoUpper.includes(key.toUpperCase())) return color
  }
  return '#6B7280'
}

// Número de vagas por município (principais)
const VAGAS_MUNICIPIO: Record<string, number> = {
  'PORTO VELHO': 21,
  'JI-PARANÁ': 15,
  'ARIQUEMES': 15,
  'VILHENA': 13,
  'CACOAL': 13,
  'ROLIM DE MOURA': 11,
  'JARU': 11,
  'GUAJARÁ-MIRIM': 11,
  'OURO PRETO DO OESTE': 11,
  'PIMENTA BUENO': 11,
}

export default function Vereadores2024() {
  const [loading, setLoading] = useState(true)
  const [vereadores, setVereadores] = useState<Vereador[]>([])
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>('PORTO VELHO')
  const [municipios, setMunicipios] = useState<string[]>([])
  const [busca, setBusca] = useState('')
  const [expandedVereador, setExpandedVereador] = useState<string | null>(null)

  useEffect(() => {
    fetchMunicipios()
  }, [])

  useEffect(() => {
    fetchVereadores()
  }, [municipioSelecionado])

  const fetchMunicipios = async () => {
    try {
      const { data, error } = await supabase
        .from('votos_vereadores_2024_detalhado')
        .select('nm_municipio')
      
      if (error) throw error
      
      const uniqueMunicipios = [...new Set((data || []).map(d => d.nm_municipio))].sort()
      setMunicipios(uniqueMunicipios)
    } catch (err) {
      console.error('Erro ao buscar municípios:', err)
    }
  }

  const fetchVereadores = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('votos_vereadores_2024_detalhado')
        .select('*')
        .eq('nm_municipio', municipioSelecionado)
        .order('total_votos', { ascending: false })

      if (error) throw error
      setVereadores(data || [])
    } catch (err) {
      console.error('Erro ao buscar vereadores:', err)
    } finally {
      setLoading(false)
    }
  }

  const vagasDisponiveis = VAGAS_MUNICIPIO[municipioSelecionado] || 9
  const totalVotos = vereadores.reduce((acc, v) => acc + v.total_votos, 0)
  
  // Separar eleitos e não eleitos
  const eleitos = vereadores.slice(0, vagasDisponiveis)
  const naoEleitos = vereadores.slice(vagasDisponiveis)
  
  // Filtrar por busca
  const vereadoresFiltrados = vereadores.filter(v => 
    v.nm_votavel.toLowerCase().includes(busca.toLowerCase()) ||
    (v.nm_partido && v.nm_partido.toLowerCase().includes(busca.toLowerCase()))
  )

  // Top 10 para gráfico
  const top10 = vereadores.slice(0, 10)

  // Dados por partido
  const votosPorPartido = vereadores.reduce((acc, v) => {
    const partido = v.nm_partido || 'Outros'
    acc[partido] = (acc[partido] || 0) + v.total_votos
    return acc
  }, {} as Record<string, number>)

  const dadosPartidos = Object.entries(votosPorPartido)
    .map(([partido, votos]) => ({ partido, votos }))
    .sort((a, b) => b.votos - a.votos)
    .slice(0, 8)

  // Linha de corte
  const linhaDeCorte = eleitos.length > 0 ? eleitos[eleitos.length - 1].total_votos : 0
  const primeiroSuplente = naoEleitos.length > 0 ? naoEleitos[0] : null

  const exportarCSV = () => {
    const headers = ['Posição', 'Vereador', 'Partido', 'Município', 'Votos', 'Status']
    const rows = vereadores.map((v, i) => [
      i + 1,
      v.nm_votavel,
      v.nm_partido || '-',
      v.nm_municipio,
      v.total_votos,
      i < vagasDisponiveis ? 'ELEITO' : 'NÃO ELEITO'
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vereadores_${municipioSelecionado.toLowerCase().replace(/ /g, '_')}_2024.csv`
    link.click()
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-500" />
            Vereadores 2024
          </h1>
          <p className="text-[var(--text-secondary)]">
            Análise detalhada dos vereadores eleitos em {municipioSelecionado}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={municipioSelecionado}
            onChange={(e) => setMunicipioSelecionado(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-sm"
          >
            {municipios.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <button
            onClick={fetchVereadores}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>

          <button
            onClick={exportarCSV}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <p className="text-sm text-[var(--text-secondary)]">Total de Votos</p>
          <p className="text-2xl font-bold text-emerald-500">{totalVotos.toLocaleString('pt-BR')}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--text-secondary)]">Candidatos</p>
          <p className="text-2xl font-bold text-blue-500">{vereadores.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--text-secondary)]">Vagas</p>
          <p className="text-2xl font-bold text-purple-500">{vagasDisponiveis}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--text-secondary)]">Linha de Corte</p>
          <p className="text-2xl font-bold text-amber-500">{linhaDeCorte.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-[var(--text-muted)]">votos mínimos</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--text-secondary)]">1º Suplente</p>
          <p className="text-lg font-bold text-red-500 truncate">{primeiroSuplente?.nm_votavel || '-'}</p>
          <p className="text-xs text-[var(--text-muted)]">{primeiroSuplente?.total_votos.toLocaleString('pt-BR') || 0} votos</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <>
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 10 Vereadores */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                Top 10 - Vereadores Mais Votados
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis 
                      type="number" 
                      stroke="var(--text-secondary)" 
                      tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}K` : value}
                    />
                    <YAxis 
                      dataKey="nm_votavel" 
                      type="category" 
                      stroke="var(--text-secondary)" 
                      width={130}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Votos']}
                    />
                    <Bar dataKey="total_votos" radius={[0, 4, 4, 0]}>
                      {top10.map((entry, index) => (
                        <Cell key={index} fill={getCorPartido(entry.nm_partido)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Votos por Partido */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-500" />
                Votos por Partido
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosPartidos}
                      dataKey="votos"
                      nameKey="partido"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ partido, percent }) => `${partido} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {dadosPartidos.map((entry, index) => (
                        <Cell key={index} fill={getCorPartido(entry.partido)} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Votos']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top 5 Mais Votados com Medalhas */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Top 5 Vereadores Mais Votados
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {eleitos.slice(0, 5).map((v, i) => (
                <div 
                  key={v.nm_votavel} 
                  className={`p-4 rounded-xl border-2 ${
                    i === 0 ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' :
                    i === 1 ? 'border-gray-400 bg-gray-50 dark:bg-gray-800/20' :
                    i === 2 ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' :
                    'border-[var(--border-color)] bg-[var(--bg-card)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {i === 0 && <span className="text-2xl">🥇</span>}
                    {i === 1 && <span className="text-2xl">🥈</span>}
                    {i === 2 && <span className="text-2xl">🥉</span>}
                    {i > 2 && <span className="text-lg font-bold text-[var(--text-muted)]">#{i + 1}</span>}
                    <span 
                      className="px-2 py-0.5 text-xs rounded-full text-white"
                      style={{ backgroundColor: getCorPartido(v.nm_partido) }}
                    >
                      {v.nm_partido || 'N/A'}
                    </span>
                  </div>
                  <p className="font-bold text-sm truncate">{v.nm_votavel}</p>
                  <p className="text-lg font-bold text-emerald-500">{v.total_votos.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {((v.total_votos / totalVotos) * 100).toFixed(1)}% dos votos
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Busca */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Buscar vereador ou partido..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)]"
              />
            </div>
          </div>

          {/* Lista de Vereadores Eleitos */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-500" />
                Vereadores Eleitos ({eleitos.length})
              </h2>
              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-medium">
                {vagasDisponiveis} vagas
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-3 px-2">#</th>
                    <th className="text-left py-3 px-2">Vereador</th>
                    <th className="text-left py-3 px-2">Partido</th>
                    <th className="text-right py-3 px-2">Votos</th>
                    <th className="text-right py-3 px-2">%</th>
                    <th className="text-center py-3 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {eleitos.filter(v => 
                    v.nm_votavel.toLowerCase().includes(busca.toLowerCase()) ||
                    (v.nm_partido && v.nm_partido.toLowerCase().includes(busca.toLowerCase()))
                  ).map((v, index) => (
                    <tr 
                      key={v.nm_votavel} 
                      className="border-b border-[var(--border-color)]/50 hover:bg-[var(--bg-secondary)]/50 transition-colors"
                    >
                      <td className="py-2 px-2">
                        <span className={`font-bold ${index < 3 ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}>
                          {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                        </span>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: getCorPartido(v.nm_partido) }}
                          />
                          <span className="font-medium">{v.nm_votavel}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <span 
                          className="px-2 py-0.5 text-xs rounded-full text-white"
                          style={{ backgroundColor: getCorPartido(v.nm_partido) }}
                        >
                          {v.nm_partido || 'N/A'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right font-mono font-bold">{v.total_votos.toLocaleString('pt-BR')}</td>
                      <td className="py-2 px-2 text-right">
                        <span className="px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-sm font-semibold">
                          {((v.total_votos / totalVotos) * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded text-xs font-bold">
                          ELEITO
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lista de Não Eleitos (Suplentes) */}
          {naoEleitos.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-500" />
                  Suplentes / Não Eleitos ({naoEleitos.length})
                </h2>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[var(--bg-card)]">
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="text-left py-3 px-2">#</th>
                      <th className="text-left py-3 px-2">Candidato</th>
                      <th className="text-left py-3 px-2">Partido</th>
                      <th className="text-right py-3 px-2">Votos</th>
                      <th className="text-right py-3 px-2">Dif. p/ Corte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {naoEleitos.filter(v => 
                      v.nm_votavel.toLowerCase().includes(busca.toLowerCase()) ||
                      (v.nm_partido && v.nm_partido.toLowerCase().includes(busca.toLowerCase()))
                    ).slice(0, 50).map((v, index) => (
                      <tr 
                        key={v.nm_votavel} 
                        className="border-b border-[var(--border-color)]/50 hover:bg-[var(--bg-secondary)]/50 transition-colors"
                      >
                        <td className="py-2 px-2 text-[var(--text-muted)]">{vagasDisponiveis + index + 1}</td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: getCorPartido(v.nm_partido) }}
                            />
                            <span className="font-medium">{v.nm_votavel}</span>
                            {index === 0 && (
                              <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded text-xs">
                                1º Suplente
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <span 
                            className="px-2 py-0.5 text-xs rounded-full text-white opacity-70"
                            style={{ backgroundColor: getCorPartido(v.nm_partido) }}
                          >
                            {v.nm_partido || 'N/A'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-mono">{v.total_votos.toLocaleString('pt-BR')}</td>
                        <td className="py-2 px-2 text-right">
                          <span className="text-red-500 font-medium">
                            -{(linhaDeCorte - v.total_votos).toLocaleString('pt-BR')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
