import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Vote, AlertTriangle, Loader2, RefreshCw, Download, Filter, MapPin, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'

interface VotosData {
  nm_municipio: string
  nr_zona: number
  ds_tipo_votavel: string
  qt_votos: number
  ds_cargo_pergunta: string
}

interface DadosAgregados {
  totalNulos: number
  totalBrancos: number
  totalValidos: number
  totalAbstencoes: number
  totalComparecimento: number
  percentualNulos: number
  percentualBrancos: number
  distribuicao: { name: string; value: number; color: string }[]
  porZona: { zona: string; nulos: number; brancos: number; total: number }[]
  porMunicipio: { municipio: string; nulos: number; brancos: number }[]
  porCargo: { cargo: string; nulos: number; brancos: number }[]
}

export default function VotosNulos() {
  const [loading, setLoading] = useState(true)
  const [votosData, setVotosData] = useState<VotosData[]>([])
  const [filtroAno, setFiltroAno] = useState(2024)
  const [filtroTurno, setFiltroTurno] = useState(1)
  const [filtroCargo, setFiltroCargo] = useState<string>('todos')
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('todos')
  const [municipios, setMunicipios] = useState<string[]>([])
  const [cargos, setCargos] = useState<string[]>([])
  const [totaisGerais, setTotaisGerais] = useState({ comparecimento: 0, abstencoes: 0 })
  
  // Paginação para zonas
  const [zonasPage, setZonasPage] = useState(1)
  const zonasPerPage = 10

  useEffect(() => {
    fetchData()
  }, [filtroAno, filtroTurno])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar votos nulos e brancos
      const { data: nulosBrancos, error: nbError } = await supabase
        .from('boletins_urna')
        .select('nm_municipio, nr_zona, ds_tipo_votavel, qt_votos, ds_cargo_pergunta')
        .eq('ano_eleicao', filtroAno)
        .eq('nr_turno', filtroTurno)
        .in('ds_tipo_votavel', ['Nulo', 'Branco'])

      if (nbError) throw nbError

      // Buscar totais gerais usando a função existente
      const { data: mapaData, error: mapaError } = await supabase.rpc('get_mapa_eleitoral', {
        p_ano: filtroAno,
        p_turno: filtroTurno
      })

      if (mapaError) throw mapaError

      // Calcular totais gerais
      let totalComparecimento = 0
      let totalAbstencoes = 0
      const munSet = new Set<string>()

      if (mapaData) {
        mapaData.forEach((m: any) => {
          totalComparecimento += Number(m.total_comparecimento) || 0
          totalAbstencoes += Number(m.total_abstencoes) || 0
          munSet.add(m.nm_municipio)
        })
      }

      setTotaisGerais({ comparecimento: totalComparecimento, abstencoes: totalAbstencoes })
      setMunicipios(Array.from(munSet).sort())

      // Extrair cargos únicos
      if (nulosBrancos) {
        const cargosSet = new Set<string>()
        nulosBrancos.forEach(v => {
          if (v.ds_cargo_pergunta) cargosSet.add(v.ds_cargo_pergunta)
        })
        setCargos(Array.from(cargosSet).sort())
        setVotosData(nulosBrancos)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar e agregar dados
  const dadosAgregados = useMemo((): DadosAgregados => {
    let filtered = votosData

    if (filtroCargo !== 'todos') {
      filtered = filtered.filter(v => v.ds_cargo_pergunta === filtroCargo)
    }

    if (filtroMunicipio !== 'todos') {
      filtered = filtered.filter(v => v.nm_municipio === filtroMunicipio)
    }

    // Calcular totais
    let totalNulos = 0
    let totalBrancos = 0

    const porZonaMap: Record<number, { nulos: number; brancos: number }> = {}
    const porMunicipioMap: Record<string, { nulos: number; brancos: number }> = {}
    const porCargoMap: Record<string, { nulos: number; brancos: number }> = {}

    filtered.forEach(v => {
      const votos = v.qt_votos || 0

      if (v.ds_tipo_votavel === 'Nulo') {
        totalNulos += votos
      } else if (v.ds_tipo_votavel === 'Branco') {
        totalBrancos += votos
      }

      // Por zona
      if (!porZonaMap[v.nr_zona]) {
        porZonaMap[v.nr_zona] = { nulos: 0, brancos: 0 }
      }
      if (v.ds_tipo_votavel === 'Nulo') {
        porZonaMap[v.nr_zona].nulos += votos
      } else {
        porZonaMap[v.nr_zona].brancos += votos
      }

      // Por município
      if (!porMunicipioMap[v.nm_municipio]) {
        porMunicipioMap[v.nm_municipio] = { nulos: 0, brancos: 0 }
      }
      if (v.ds_tipo_votavel === 'Nulo') {
        porMunicipioMap[v.nm_municipio].nulos += votos
      } else {
        porMunicipioMap[v.nm_municipio].brancos += votos
      }

      // Por cargo
      if (!porCargoMap[v.ds_cargo_pergunta]) {
        porCargoMap[v.ds_cargo_pergunta] = { nulos: 0, brancos: 0 }
      }
      if (v.ds_tipo_votavel === 'Nulo') {
        porCargoMap[v.ds_cargo_pergunta].nulos += votos
      } else {
        porCargoMap[v.ds_cargo_pergunta].brancos += votos
      }
    })

    const totalComparecimento = totaisGerais.comparecimento
    const totalAbstencoes = totaisGerais.abstencoes
    const totalValidos = totalComparecimento - totalNulos - totalBrancos

    const percentualNulos = totalComparecimento > 0 ? (totalNulos / totalComparecimento) * 100 : 0
    const percentualBrancos = totalComparecimento > 0 ? (totalBrancos / totalComparecimento) * 100 : 0

    const distribuicao = [
      { name: 'Válidos', value: totalValidos, color: '#10b981' },
      { name: 'Brancos', value: totalBrancos, color: '#94a3b8' },
      { name: 'Nulos', value: totalNulos, color: '#ef4444' },
      { name: 'Abstenções', value: totalAbstencoes, color: '#f59e0b' },
    ]

    // Todas as zonas ordenadas por total de votos inválidos
    const porZona = Object.entries(porZonaMap)
      .map(([zona, dados]) => ({
        zona: `Zona ${zona}`,
        nulos: dados.nulos,
        brancos: dados.brancos,
        total: dados.nulos + dados.brancos
      }))
      .sort((a, b) => b.total - a.total)

    const porMunicipio = Object.entries(porMunicipioMap)
      .map(([municipio, dados]) => ({
        municipio,
        nulos: dados.nulos,
        brancos: dados.brancos
      }))
      .sort((a, b) => (b.nulos + b.brancos) - (a.nulos + a.brancos))
      .slice(0, 10)

    const porCargo = Object.entries(porCargoMap)
      .map(([cargo, dados]) => ({
        cargo,
        nulos: dados.nulos,
        brancos: dados.brancos
      }))
      .sort((a, b) => (b.nulos + b.brancos) - (a.nulos + a.brancos))

    return {
      totalNulos,
      totalBrancos,
      totalValidos,
      totalAbstencoes,
      totalComparecimento,
      percentualNulos,
      percentualBrancos,
      distribuicao,
      porZona,
      porMunicipio,
      porCargo
    }
  }, [votosData, filtroCargo, filtroMunicipio, totaisGerais])

  // Paginação das zonas
  const totalZonasPages = Math.ceil(dadosAgregados.porZona.length / zonasPerPage)
  const zonasPaginadas = dadosAgregados.porZona.slice(
    (zonasPage - 1) * zonasPerPage,
    zonasPage * zonasPerPage
  )

  // Reset página quando filtros mudam
  useEffect(() => {
    setZonasPage(1)
  }, [filtroCargo, filtroMunicipio, filtroAno, filtroTurno])

  const exportToCSV = () => {
    const headers = ['Município', 'Zona', 'Cargo', 'Tipo', 'Votos']
    const rows = votosData.map(v => [
      v.nm_municipio,
      v.nr_zona,
      v.ds_cargo_pergunta,
      v.ds_tipo_votavel,
      v.qt_votos
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `votos_nulos_brancos_${filtroAno}_turno${filtroTurno}.csv`
    link.click()
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-red-500" />
            Votos Nulos e Brancos
          </h1>
          <p className="text-[var(--text-secondary)]">
            Análise detalhada de votos inválidos - Rondônia {filtroAno}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={fetchData}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Atualizar
          </button>
          <button 
            onClick={exportToCSV}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[var(--accent-color)]" />
          <span className="font-semibold">Filtros:</span>
        </div>
        <select
          value={filtroAno}
          onChange={(e) => setFiltroAno(Number(e.target.value))}
          className="input w-auto"
        >
          <option value={2024}>2024</option>
          <option value={2022}>2022</option>
          <option value={2020}>2020</option>
        </select>
        <select
          value={filtroTurno}
          onChange={(e) => setFiltroTurno(Number(e.target.value))}
          className="input w-auto"
        >
          <option value={1}>1º Turno</option>
          <option value={2}>2º Turno</option>
        </select>
        <select
          value={filtroCargo}
          onChange={(e) => setFiltroCargo(e.target.value)}
          className="input w-auto"
        >
          <option value="todos">Todos os cargos</option>
          {cargos.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={filtroMunicipio}
          onChange={(e) => setFiltroMunicipio(e.target.value)}
          className="input w-auto"
        >
          <option value="todos">Todos os municípios</option>
          {municipios.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
          <span className="ml-2">Carregando dados...</span>
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-red-500/10">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Votos Nulos</p>
                  <p className="text-2xl font-bold">{dadosAgregados.totalNulos.toLocaleString('pt-BR')}</p>
                  <p className="text-sm text-red-500">{dadosAgregados.percentualNulos.toFixed(2)}% do total</p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-slate-500/10">
                  <Vote className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Votos Brancos</p>
                  <p className="text-2xl font-bold">{dadosAgregados.totalBrancos.toLocaleString('pt-BR')}</p>
                  <p className="text-sm text-slate-500">{dadosAgregados.percentualBrancos.toFixed(2)}% do total</p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10">
                  <Vote className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Votos Válidos</p>
                  <p className="text-2xl font-bold">{dadosAgregados.totalValidos.toLocaleString('pt-BR')}</p>
                  <p className="text-sm text-emerald-500">
                    {dadosAgregados.totalComparecimento > 0 
                      ? ((dadosAgregados.totalValidos / dadosAgregados.totalComparecimento) * 100).toFixed(2)
                      : 0}% do total
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10">
                  <MapPin className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Abstenções</p>
                  <p className="text-2xl font-bold">{dadosAgregados.totalAbstencoes.toLocaleString('pt-BR')}</p>
                  <p className="text-sm text-amber-500">Eleitores ausentes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Distribuição de Votos */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Distribuição de Votos</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosAgregados.distribuicao}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    >
                      {dadosAgregados.distribuicao.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Votos']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {dadosAgregados.distribuicao.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-sm">{d.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Por Cargo */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Votos Inválidos por Cargo</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosAgregados.porCargo} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis type="number" stroke="var(--text-secondary)" />
                    <YAxis dataKey="cargo" type="category" stroke="var(--text-secondary)" width={100} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value.toLocaleString('pt-BR'), '']}
                    />
                    <Legend />
                    <Bar dataKey="nulos" fill="#ef4444" name="Nulos" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="brancos" fill="#94a3b8" name="Brancos" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Detalhamento por Zona - COM PAGINAÇÃO */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Detalhamento por Zona</h2>
              <span className="text-sm text-[var(--text-secondary)]">
                Total: {dadosAgregados.porZona.length} zonas
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-3 px-4">#</th>
                    <th className="text-left py-3 px-4">Zona</th>
                    <th className="text-right py-3 px-4">Votos Nulos</th>
                    <th className="text-right py-3 px-4">Votos Brancos</th>
                    <th className="text-right py-3 px-4">Total Inválidos</th>
                    <th className="text-right py-3 px-4">% do Total</th>
                  </tr>
                </thead>
                <tbody>
                  {zonasPaginadas.map((z, index) => {
                    const globalIndex = (zonasPage - 1) * zonasPerPage + index
                    const percentual = dadosAgregados.totalNulos + dadosAgregados.totalBrancos > 0
                      ? (z.total / (dadosAgregados.totalNulos + dadosAgregados.totalBrancos)) * 100
                      : 0
                    return (
                      <tr 
                        key={z.zona} 
                        className={`border-b border-[var(--border-color)]/50 hover:bg-[var(--bg-secondary)]/50 transition-colors ${globalIndex % 2 === 0 ? 'bg-[var(--bg-secondary)]/30' : ''}`}
                      >
                        <td className="py-3 px-4 text-[var(--text-muted)]">{globalIndex + 1}</td>
                        <td className="py-3 px-4 font-medium">{z.zona}</td>
                        <td className="py-3 px-4 text-right text-red-500 font-medium">{z.nulos.toLocaleString('pt-BR')}</td>
                        <td className="py-3 px-4 text-right text-slate-400">{z.brancos.toLocaleString('pt-BR')}</td>
                        <td className="py-3 px-4 text-right font-bold">{z.total.toLocaleString('pt-BR')}</td>
                        <td className="py-3 px-4 text-right">
                          <span className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-sm">
                            {percentual.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Controles de Paginação */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border-color)]">
              <p className="text-sm text-[var(--text-secondary)]">
                Mostrando {((zonasPage - 1) * zonasPerPage) + 1} a {Math.min(zonasPage * zonasPerPage, dadosAgregados.porZona.length)} de {dadosAgregados.porZona.length} zonas
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZonasPage(1)}
                  disabled={zonasPage === 1}
                  className="px-3 py-1.5 rounded bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  Primeira
                </button>
                <button
                  onClick={() => setZonasPage(p => Math.max(1, p - 1))}
                  disabled={zonasPage === 1}
                  className="p-1.5 rounded bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalZonasPages) }, (_, i) => {
                    let pageNum
                    if (totalZonasPages <= 5) {
                      pageNum = i + 1
                    } else if (zonasPage <= 3) {
                      pageNum = i + 1
                    } else if (zonasPage >= totalZonasPages - 2) {
                      pageNum = totalZonasPages - 4 + i
                    } else {
                      pageNum = zonasPage - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setZonasPage(pageNum)}
                        className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                          zonasPage === pageNum 
                            ? 'bg-[var(--accent-color)] text-white' 
                            : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setZonasPage(p => Math.min(totalZonasPages, p + 1))}
                  disabled={zonasPage === totalZonasPages}
                  className="p-1.5 rounded bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setZonasPage(totalZonasPages)}
                  disabled={zonasPage === totalZonasPages}
                  className="px-3 py-1.5 rounded bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  Última
                </button>
              </div>
            </div>
          </div>

          {/* Top 10 Municípios */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Top 10 Municípios com Mais Votos Inválidos</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-2 px-3">#</th>
                    <th className="text-left py-2 px-3">Município</th>
                    <th className="text-right py-2 px-3">Nulos</th>
                    <th className="text-right py-2 px-3">Brancos</th>
                    <th className="text-right py-2 px-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosAgregados.porMunicipio.map((m, index) => (
                    <tr key={m.municipio} className={index % 2 === 0 ? 'bg-[var(--bg-secondary)]' : ''}>
                      <td className="py-2 px-3 text-[var(--text-secondary)]">{index + 1}</td>
                      <td className="py-2 px-3 font-medium">{m.municipio}</td>
                      <td className="py-2 px-3 text-right text-red-500">{m.nulos.toLocaleString('pt-BR')}</td>
                      <td className="py-2 px-3 text-right text-slate-500">{m.brancos.toLocaleString('pt-BR')}</td>
                      <td className="py-2 px-3 text-right font-semibold">{(m.nulos + m.brancos).toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
