import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Search, Filter, Download, MapPin, Loader2, RefreshCw, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

interface PerfilEleitorado {
  id: number
  municipio: string
  zona: string
  total_eleitores: number
  dados_genero: string
  dados_faixa_etaria: string
  dados_escolaridade: string
  ano: number
  uf: string
}

interface DadosAgregados {
  faixaEtaria: { faixa: string; total: number; cor: string }[]
  genero: { name: string; value: number; color: string }[]
  escolaridade: { nivel: string; total: number }[]
  totalEleitores: number
}

const CORES_FAIXA_ETARIA = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16']
const CORES_GENERO = { 'FEMININO': '#ec4899', 'MASCULINO': '#3b82f6' }

export default function Eleitorado() {
  const [loading, setLoading] = useState(true)
  const [perfis, setPerfis] = useState<PerfilEleitorado[]>([])
  const [municipios, setMunicipios] = useState<string[]>([])
  const [zonas, setZonas] = useState<string[]>([])
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('todos')
  const [filtroZona, setFiltroZona] = useState<string>('todas')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Paginação
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('perfil_eleitorado')
        .select('*')
        .eq('ano', 2024)
        .order('municipio')

      if (error) throw error

      if (data && data.length > 0) {
        setPerfis(data)
        
        // Extrair municípios únicos
        const munUnicos = [...new Set(data.map(p => p.municipio))].sort()
        setMunicipios(munUnicos)
        
        // Extrair zonas únicas
        const zonasUnicas = [...new Set(data.map(p => p.zona))].sort((a, b) => Number(a) - Number(b))
        setZonas(zonasUnicas)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar perfis baseado nos filtros selecionados
  const perfisFiltrados = useMemo(() => {
    let filtered = perfis

    if (filtroMunicipio !== 'todos') {
      filtered = filtered.filter(p => p.municipio === filtroMunicipio)
    }

    if (filtroZona !== 'todas') {
      filtered = filtered.filter(p => p.zona === filtroZona)
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p => 
        p.municipio.toLowerCase().includes(term) || 
        p.zona.includes(term)
      )
    }

    return filtered
  }, [perfis, filtroMunicipio, filtroZona, searchTerm])

  // Reset página quando filtros mudam
  useEffect(() => {
    setPage(1)
  }, [filtroMunicipio, filtroZona, searchTerm])

  // Paginação
  const totalPages = Math.ceil(perfisFiltrados.length / itemsPerPage)
  const perfisPaginados = perfisFiltrados.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  // Agregar dados dos perfis filtrados
  const dadosAgregados = useMemo((): DadosAgregados => {
    if (perfisFiltrados.length === 0) {
      return {
        faixaEtaria: [],
        genero: [],
        escolaridade: [],
        totalEleitores: 0
      }
    }

    // Agregar gênero
    const generoAgg: Record<string, number> = {}
    perfisFiltrados.forEach(p => {
      try {
        const dados = JSON.parse(p.dados_genero)
        Object.entries(dados).forEach(([key, value]) => {
          generoAgg[key] = (generoAgg[key] || 0) + (value as number)
        })
      } catch (e) {
        console.error('Erro ao parsear dados_genero:', e)
      }
    })

    const totalGenero = Object.values(generoAgg).reduce((a, b) => a + b, 0)
    const genero = Object.entries(generoAgg).map(([name, value]) => ({
      name: name === 'FEMININO' ? 'Feminino' : 'Masculino',
      value: totalGenero > 0 ? Number(((value / totalGenero) * 100).toFixed(1)) : 0,
      color: CORES_GENERO[name as keyof typeof CORES_GENERO] || '#6b7280'
    }))

    // Agregar faixa etária
    const faixaAgg: Record<string, number> = {}
    perfisFiltrados.forEach(p => {
      try {
        const dados = JSON.parse(p.dados_faixa_etaria)
        Object.entries(dados).forEach(([key, value]) => {
          faixaAgg[key] = (faixaAgg[key] || 0) + (value as number)
        })
      } catch (e) {
        console.error('Erro ao parsear dados_faixa_etaria:', e)
      }
    })

    // Agrupar faixas etárias em categorias maiores
    const faixasAgrupadas: Record<string, number> = {
      '16-17': 0,
      '18-24': 0,
      '25-34': 0,
      '35-44': 0,
      '45-59': 0,
      '60-69': 0,
      '70-79': 0,
      '80+': 0
    }

    Object.entries(faixaAgg).forEach(([faixa, total]) => {
      if (faixa.includes('16') || faixa.includes('17')) {
        faixasAgrupadas['16-17'] += total
      } else if (faixa.includes('18') || faixa.includes('19') || faixa.includes('20') || faixa.includes('21') || faixa.includes('24')) {
        faixasAgrupadas['18-24'] += total
      } else if (faixa.includes('25') || faixa.includes('29') || faixa.includes('30') || faixa.includes('34')) {
        faixasAgrupadas['25-34'] += total
      } else if (faixa.includes('35') || faixa.includes('39') || faixa.includes('40') || faixa.includes('44')) {
        faixasAgrupadas['35-44'] += total
      } else if (faixa.includes('45') || faixa.includes('49') || faixa.includes('50') || faixa.includes('54') || faixa.includes('55') || faixa.includes('59')) {
        faixasAgrupadas['45-59'] += total
      } else if (faixa.includes('60') || faixa.includes('64') || faixa.includes('65') || faixa.includes('69')) {
        faixasAgrupadas['60-69'] += total
      } else if (faixa.includes('70') || faixa.includes('74') || faixa.includes('75') || faixa.includes('79')) {
        faixasAgrupadas['70-79'] += total
      } else if (faixa.includes('80') || faixa.includes('84') || faixa.includes('85') || faixa.includes('89') || faixa.includes('90') || faixa.includes('94') || faixa.includes('95') || faixa.includes('99') || faixa.includes('100')) {
        faixasAgrupadas['80+'] += total
      }
    })

    const faixaEtaria = Object.entries(faixasAgrupadas).map(([faixa, total], index) => ({
      faixa,
      total,
      cor: CORES_FAIXA_ETARIA[index % CORES_FAIXA_ETARIA.length]
    }))

    // Agregar escolaridade
    const escolaridadeAgg: Record<string, number> = {}
    perfisFiltrados.forEach(p => {
      try {
        const dados = JSON.parse(p.dados_escolaridade)
        Object.entries(dados).forEach(([key, value]) => {
          escolaridadeAgg[key] = (escolaridadeAgg[key] || 0) + (value as number)
        })
      } catch (e) {
        console.error('Erro ao parsear dados_escolaridade:', e)
      }
    })

    // Ordenar escolaridade por nível
    const ordemEscolaridade = [
      'ANALFABETO',
      'LÊ E ESCREVE',
      'ENSINO FUNDAMENTAL INCOMPLETO',
      'ENSINO FUNDAMENTAL COMPLETO',
      'ENSINO MÉDIO INCOMPLETO',
      'ENSINO MÉDIO COMPLETO',
      'SUPERIOR INCOMPLETO',
      'SUPERIOR COMPLETO'
    ]

    const escolaridade = ordemEscolaridade
      .filter(nivel => escolaridadeAgg[nivel])
      .map(nivel => ({
        nivel: nivel.replace('ENSINO ', '').replace('INCOMPLETO', 'Inc.').replace('COMPLETO', 'Comp.'),
        total: escolaridadeAgg[nivel]
      }))

    // Total de eleitores
    const totalEleitores = perfisFiltrados.reduce((acc, p) => acc + p.total_eleitores, 0)

    return {
      faixaEtaria,
      genero,
      escolaridade,
      totalEleitores
    }
  }, [perfisFiltrados])

  const exportToCSV = () => {
    const headers = ['Município', 'Zona', 'Total Eleitores', 'Feminino', 'Masculino']
    const rows = perfisFiltrados.map(p => {
      const genero = JSON.parse(p.dados_genero)
      return [
        p.municipio,
        p.zona,
        p.total_eleitores,
        genero.FEMININO || 0,
        genero.MASCULINO || 0
      ]
    })
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `perfil_eleitorado_${filtroMunicipio}_${filtroZona}.csv`
    link.click()
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-[var(--accent-color)]" />
            Perfil do Eleitorado
          </h1>
          <p className="text-[var(--text-secondary)]">
            Análise demográfica dos eleitores de Rondônia - Dados TSE 2024
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

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm">Total de Eleitores</span>
          </div>
          <p className="text-2xl font-bold">{dadosAgregados.totalEleitores.toLocaleString('pt-BR')}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">Municípios</span>
          </div>
          <p className="text-2xl font-bold">{municipios.length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Zonas Eleitorais</span>
          </div>
          <p className="text-2xl font-bold">{zonas.length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-1">
            <GraduationCap className="w-4 h-4" />
            <span className="text-sm">Registros Analisados</span>
          </div>
          <p className="text-2xl font-bold">{perfisFiltrados.length}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar por município ou zona..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
        <select 
          className="input w-auto"
          value={filtroMunicipio}
          onChange={(e) => setFiltroMunicipio(e.target.value)}
        >
          <option value="todos">Todos os municípios ({municipios.length})</option>
          {municipios.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select 
          className="input w-auto"
          value={filtroZona}
          onChange={(e) => setFiltroZona(e.target.value)}
        >
          <option value="todas">Todas as zonas ({zonas.length})</option>
          {zonas.map(z => (
            <option key={z} value={z}>Zona {z}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
          <span className="ml-2">Carregando dados do eleitorado...</span>
        </div>
      ) : (
        <>
          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Faixa Etária */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-500" />
                Distribuição por Faixa Etária
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosAgregados.faixaEtaria}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis dataKey="faixa" stroke="var(--text-secondary)" />
                    <YAxis stroke="var(--text-secondary)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Eleitores']}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {dadosAgregados.faixaEtaria.map((entry, index) => (
                        <Cell key={index} fill={entry.cor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gênero */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">Distribuição por Gênero</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dadosAgregados.genero}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {dadosAgregados.genero.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value}%`, 'Percentual']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                {dadosAgregados.genero.map((g, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color }} />
                    <span className="text-sm">{g.name}: {g.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Escolaridade */}
            <div className="card p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-blue-500" />
                Distribuição por Escolaridade
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosAgregados.escolaridade} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis type="number" stroke="var(--text-secondary)" />
                    <YAxis dataKey="nivel" type="category" stroke="var(--text-secondary)" width={150} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Eleitores']}
                    />
                    <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabela de Detalhes por Município/Zona - COM PAGINAÇÃO */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Detalhamento por Município/Zona</h2>
              <span className="text-sm text-[var(--text-secondary)]">
                Total: {perfisFiltrados.length} registros
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-3 px-4">#</th>
                    <th className="text-left py-3 px-4">Município</th>
                    <th className="text-center py-3 px-4">Zona</th>
                    <th className="text-right py-3 px-4">Total Eleitores</th>
                    <th className="text-right py-3 px-4">Feminino</th>
                    <th className="text-right py-3 px-4">Masculino</th>
                  </tr>
                </thead>
                <tbody>
                  {perfisPaginados.map((p, index) => {
                    const globalIndex = (page - 1) * itemsPerPage + index
                    const genero = JSON.parse(p.dados_genero)
                    return (
                      <tr 
                        key={p.id} 
                        className={`border-b border-[var(--border-color)]/50 hover:bg-[var(--bg-secondary)]/50 transition-colors ${globalIndex % 2 === 0 ? 'bg-[var(--bg-secondary)]/30' : ''}`}
                      >
                        <td className="py-3 px-4 text-[var(--text-muted)]">{globalIndex + 1}</td>
                        <td className="py-3 px-4 font-medium">{p.municipio}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-1 rounded bg-[var(--bg-tertiary)] text-sm">
                            {p.zona}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold">{p.total_eleitores.toLocaleString('pt-BR')}</td>
                        <td className="py-3 px-4 text-right text-pink-500 font-medium">
                          {(genero.FEMININO || 0).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-right text-blue-500 font-medium">
                          {(genero.MASCULINO || 0).toLocaleString('pt-BR')}
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
                Mostrando {((page - 1) * itemsPerPage) + 1} a {Math.min(page * itemsPerPage, perfisFiltrados.length)} de {perfisFiltrados.length} registros
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
                >
                  Primeira
                </button>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (page <= 3) {
                      pageNum = i + 1
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = page - 2 + i
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                          page === pageNum 
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
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded bg-[var(--bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
                >
                  Última
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
