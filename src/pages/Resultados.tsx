import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, RefreshCw, Filter, Download } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import { supabase } from '../lib/supabase'

interface ResultadoCandidato {
  nm_votavel: string
  nm_partido: string
  total_votos: number
  percentual: number
}

// Cores por partido
const coresPartidos: Record<string, string> = {
  'PT': '#CC0000',
  'PL': '#1E3A8A',
  'UNIÃO BRASIL': '#0066CC',
  'UNIÃO': '#0066CC',
  'MDB': '#00A859',
  'PP': '#0066CC',
  'PSD': '#FF6B00',
  'PSDB': '#0080FF',
  'PDT': '#FF0000',
  'PODEMOS': '#6B21A8',
  'REPUBLICANOS': '#1E40AF',
  'PSB': '#FFD700',
  'CIDADANIA': '#E91E63',
  'SOLIDARIEDADE': '#FF5722',
  'PSOL': '#FFEB3B',
  'PCdoB': '#B71C1C',
  'REDE': '#00BCD4',
  'NOVO': '#FF6F00',
  'AVANTE': '#FF9800',
  'PMB': '#9C27B0',
  'DC': '#4CAF50',
  'PATRIOTA': '#2E7D32',
  'PROS': '#F44336',
  'PTB': '#000000',
  'PSC': '#4CAF50',
  'default': '#6B7280'
}

function getCorPartido(partido: string): string {
  if (!partido) return coresPartidos['default']
  const partidoUpper = partido.toUpperCase()
  for (const [key, color] of Object.entries(coresPartidos)) {
    if (partidoUpper.includes(key)) return color
  }
  return coresPartidos['default']
}

export default function Resultados() {
  const [resultados, setResultados] = useState<ResultadoCandidato[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtroAno, setFiltroAno] = useState(2024)
  const [filtroTurno, setFiltroTurno] = useState(1)
  const [mostrarTodos, setMostrarTodos] = useState(false)

  const fetchResultados = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: rpcError } = await supabase.rpc('get_resultados_candidatos', {
        p_ano: filtroAno,
        p_turno: filtroTurno
      })

      if (rpcError) {
        console.error('Erro ao buscar resultados:', rpcError)
        setError(rpcError.message)
        return
      }

      // Filtrar votos nulos e brancos para o ranking principal
      const candidatosValidos = (data || []).filter((r: ResultadoCandidato) => 
        r.nm_votavel && 
        !r.nm_votavel.toLowerCase().includes('nulo') && 
        !r.nm_votavel.toLowerCase().includes('branco')
      )

      setResultados(candidatosValidos)
    } catch (err) {
      console.error('Erro:', err)
      setError('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResultados()
  }, [filtroAno, filtroTurno])

  const totalVotos = resultados.reduce((acc, r) => acc + r.total_votos, 0)
  const top10 = resultados.slice(0, 10)
  const displayResults = mostrarTodos ? resultados : resultados.slice(0, 20)

  // Dados para o gráfico de pizza (top 5 + outros)
  const top5 = resultados.slice(0, 5)
  const outrosVotos = resultados.slice(5).reduce((acc, r) => acc + r.total_votos, 0)
  const pieData = [
    ...top5.map(r => ({
      name: r.nm_votavel,
      value: r.total_votos,
      color: getCorPartido(r.nm_partido)
    })),
    ...(outrosVotos > 0 ? [{ name: 'Outros', value: outrosVotos, color: '#9CA3AF' }] : [])
  ]

  const exportarCSV = () => {
    const headers = ['Posição', 'Candidato', 'Partido', 'Votos', 'Percentual']
    const rows = resultados.map((r, i) => [
      i + 1,
      r.nm_votavel,
      r.nm_partido || '-',
      r.total_votos,
      `${r.percentual}%`
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `resultados_${filtroAno}_turno${filtroTurno}.csv`
    link.click()
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Resultados Eleitorais</h1>
          <p className="text-[var(--text-secondary)]">Análise de resultados por candidato - Dados do TSE</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filtroAno}
            onChange={(e) => setFiltroAno(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-sm"
          >
            <option value={2024}>2024</option>
            <option value={2022}>2022</option>
            <option value={2020}>2020</option>
          </select>
          
          <select
            value={filtroTurno}
            onChange={(e) => setFiltroTurno(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-sm"
          >
            <option value={1}>1º Turno</option>
            <option value={2}>2º Turno</option>
          </select>

          <button
            onClick={fetchResultados}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
          {error}
        </div>
      )}

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-[var(--text-secondary)]">Total de Votos</p>
          <p className="text-2xl font-bold text-emerald-500">{totalVotos.toLocaleString('pt-BR')}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--text-secondary)]">Candidatos</p>
          <p className="text-2xl font-bold text-blue-500">{resultados.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--text-secondary)]">Líder</p>
          <p className="text-lg font-bold text-amber-500 truncate">{resultados[0]?.nm_votavel || '-'}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-[var(--text-secondary)]">% do Líder</p>
          <p className="text-2xl font-bold text-purple-500">{resultados[0]?.percentual || 0}%</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de barras */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                Top 10 - Votos por Candidato
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={top10} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis 
                      type="number" 
                      stroke="var(--text-secondary)" 
                      tickFormatter={(value) => value >= 1000000 ? `${(value/1000000).toFixed(1)}M` : value >= 1000 ? `${(value/1000).toFixed(0)}K` : value}
                    />
                    <YAxis 
                      dataKey="nm_votavel" 
                      type="category" 
                      stroke="var(--text-secondary)" 
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Votos']}
                      labelFormatter={(label) => `${label}`}
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

            {/* Ranking de Candidatos */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  Ranking de Candidatos
                </h2>
                <button
                  onClick={exportarCSV}
                  className="flex items-center gap-1 px-3 py-1 text-sm border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  CSV
                </button>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {top10.map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={`text-xl font-bold w-8 ${i < 3 ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}>
                      {i + 1}º
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <div className="truncate">
                          <span className="font-medium">{r.nm_votavel}</span>
                          <span className="text-xs text-[var(--text-muted)] ml-2">({r.nm_partido || 'N/A'})</span>
                        </div>
                        <span className="text-sm font-semibold ml-2">{r.percentual}%</span>
                      </div>
                      <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all"
                          style={{ 
                            width: `${Math.min((r.percentual / (resultados[0]?.percentual || 1)) * 100, 100)}%`, 
                            backgroundColor: getCorPartido(r.nm_partido) 
                          }}
                        />
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {r.total_votos.toLocaleString('pt-BR')} votos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabela completa */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Tabela Completa de Resultados</h2>
              <button
                onClick={() => setMostrarTodos(!mostrarTodos)}
                className="text-sm text-emerald-500 hover:underline"
              >
                {mostrarTodos ? 'Mostrar menos' : `Ver todos (${resultados.length})`}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-3 px-2">#</th>
                    <th className="text-left py-3 px-2">Candidato</th>
                    <th className="text-left py-3 px-2">Partido</th>
                    <th className="text-right py-3 px-2">Votos</th>
                    <th className="text-right py-3 px-2">%</th>
                  </tr>
                </thead>
                <tbody>
                  {displayResults.map((r, i) => (
                    <tr key={i} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]">
                      <td className="py-2 px-2 font-medium">{i + 1}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: getCorPartido(r.nm_partido) }}
                          />
                          {r.nm_votavel}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-[var(--text-secondary)]">{r.nm_partido || '-'}</td>
                      <td className="py-2 px-2 text-right font-mono">{r.total_votos.toLocaleString('pt-BR')}</td>
                      <td className="py-2 px-2 text-right font-semibold">{r.percentual}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!mostrarTodos && resultados.length > 20 && (
              <p className="text-center text-sm text-[var(--text-muted)] mt-4">
                Mostrando 20 de {resultados.length} candidatos
              </p>
            )}
          </div>

          {/* Fonte dos dados */}
          <div className="text-sm text-[var(--text-muted)] text-center">
            <strong>Fonte dos dados:</strong> Portal de Dados Abertos do TSE - Boletins de Urna consolidados.
          </div>
        </>
      )}
    </div>
  )
}
