import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  UserCheck, 
  Search, 
  Filter,
  Download,
  Loader2,
  Users,
  Award,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface Candidato {
  id: number
  sq_candidato: string
  ano_eleicao: number
  nm_municipio: string
  ds_cargo: string
  nr_candidato: string
  nm_candidato: string
  nm_urna_candidato: string
  sg_partido: string
  nm_partido: string
  ds_genero: string
  ds_grau_instrucao: string
  ds_cor_raca: string
  ds_ocupacao: string
  ds_sit_tot_turno: string
  status: string
}

const CORES_PARTIDOS: Record<string, string> = {
  'PT': '#CC0000',
  'PL': '#1E3A8A',
  'MDB': '#00A859',
  'PP': '#0066CC',
  'UNIÃO': '#003399',
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
  'PRTB': '#795548',
  'PMN': '#607D8B',
  'AGIR': '#9E9E9E',
  'PRD': '#3F51B5'
}

function getCorPartido(sigla: string): string {
  return CORES_PARTIDOS[sigla?.toUpperCase()] || '#6B7280'
}

function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'eleito': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    case 'nao_eleito': return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'suplente': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    case 'segundo_turno': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

function getStatusLabel(status: string): string {
  switch (status?.toLowerCase()) {
    case 'eleito': return 'Eleito'
    case 'nao_eleito': return 'Não Eleito'
    case 'suplente': return 'Suplente'
    case 'segundo_turno': return '2º Turno'
    default: return status || 'Ativo'
  }
}

export default function Candidatos() {
  const [loading, setLoading] = useState(true)
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroCargo, setFiltroCargo] = useState('todos')
  const [filtroPartido, setFiltroPartido] = useState('todos')
  const [filtroMunicipio, setFiltroMunicipio] = useState('todos')
  const [filtroStatus, setFiltroStatus] = useState('todos')
  const [sortField, setSortField] = useState<string>('nm_urna_candidato')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const itemsPerPage = 20

  // Listas para filtros
  const [municipios, setMunicipios] = useState<string[]>([])
  const [partidos, setPartidos] = useState<string[]>([])

  useEffect(() => {
    fetchCandidatos()
  }, [])

  const fetchCandidatos = async () => {
    setLoading(true)
    try {
      // Buscar candidatos
      const { data, error } = await supabase
        .from('candidatos_tse')
        .select('*')
        .eq('ano_eleicao', 2024)
        .order('nm_urna_candidato')

      if (error) throw error

      setCandidatos(data || [])

      // Extrair listas únicas para filtros
      const municipiosUnicos = [...new Set(data?.map(c => c.nm_municipio) || [])].sort()
      const partidosUnicos = [...new Set(data?.map(c => c.sg_partido) || [])].sort()
      
      setMunicipios(municipiosUnicos)
      setPartidos(partidosUnicos)

    } catch (error) {
      console.error('Erro ao buscar candidatos:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar e ordenar candidatos
  const candidatosFiltrados = useMemo(() => {
    let filtered = candidatos.filter(c => {
      const matchSearch = searchTerm === '' || 
        c.nm_urna_candidato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nm_candidato?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nr_candidato?.includes(searchTerm)
      
      const matchCargo = filtroCargo === 'todos' || c.ds_cargo === filtroCargo
      const matchPartido = filtroPartido === 'todos' || c.sg_partido === filtroPartido
      const matchMunicipio = filtroMunicipio === 'todos' || c.nm_municipio === filtroMunicipio
      const matchStatus = filtroStatus === 'todos' || c.status === filtroStatus

      return matchSearch && matchCargo && matchPartido && matchMunicipio && matchStatus
    })

    // Ordenar
    filtered.sort((a, b) => {
      const aVal = a[sortField as keyof Candidato] || ''
      const bVal = b[sortField as keyof Candidato] || ''
      
      if (sortDirection === 'asc') {
        return String(aVal).localeCompare(String(bVal))
      } else {
        return String(bVal).localeCompare(String(aVal))
      }
    })

    return filtered
  }, [candidatos, searchTerm, filtroCargo, filtroPartido, filtroMunicipio, filtroStatus, sortField, sortDirection])

  // Paginação
  const totalPages = Math.ceil(candidatosFiltrados.length / itemsPerPage)
  const candidatosPaginados = candidatosFiltrados.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  )

  // Estatísticas
  const stats = useMemo(() => {
    const total = candidatosFiltrados.length
    const eleitos = candidatosFiltrados.filter(c => c.status === 'eleito').length
    const prefeitos = candidatosFiltrados.filter(c => c.ds_cargo === 'PREFEITO').length
    const vereadores = candidatosFiltrados.filter(c => c.ds_cargo === 'VEREADOR').length
    
    return { total, eleitos, prefeitos, vereadores }
  }, [candidatosFiltrados])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const exportCSV = () => {
    const headers = ['Nome Urna', 'Nome Completo', 'Número', 'Partido', 'Cargo', 'Município', 'Status', 'Gênero', 'Escolaridade']
    const rows = candidatosFiltrados.map(c => [
      c.nm_urna_candidato,
      c.nm_candidato,
      c.nr_candidato,
      c.sg_partido,
      c.ds_cargo,
      c.nm_municipio,
      getStatusLabel(c.status),
      c.ds_genero,
      c.ds_grau_instrucao
    ])

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `candidatos_ro_2024.csv`
    a.click()
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Candidatos</h1>
          <p className="text-[var(--text-secondary)]">
            Eleições Municipais 2024 - Rondônia
          </p>
        </div>
        <button 
          onClick={exportCSV}
          className="btn-primary flex items-center gap-2"
          disabled={loading}
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
          <span className="ml-2">Carregando candidatos...</span>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Total</p>
                  <p className="text-xl font-bold">{stats.total.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <Award className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Eleitos</p>
                  <p className="text-xl font-bold">{stats.eleitos.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <UserCheck className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Prefeitos</p>
                  <p className="text-xl font-bold">{stats.prefeitos.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/20">
                  <TrendingUp className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-secondary)]">Vereadores</p>
                  <p className="text-xl font-bold">{stats.vereadores.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Filter className="w-5 h-5 text-[var(--accent-color)]" />
              <h2 className="font-semibold">Filtros</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Buscar candidato..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                  className="input pl-10 w-full"
                />
              </div>
              <select
                value={filtroCargo}
                onChange={(e) => { setFiltroCargo(e.target.value); setPage(1) }}
                className="input"
              >
                <option value="todos">Todos os Cargos</option>
                <option value="PREFEITO">Prefeito</option>
                <option value="VICE-PREFEITO">Vice-Prefeito</option>
                <option value="VEREADOR">Vereador</option>
              </select>
              <select
                value={filtroPartido}
                onChange={(e) => { setFiltroPartido(e.target.value); setPage(1) }}
                className="input"
              >
                <option value="todos">Todos os Partidos</option>
                {partidos.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <select
                value={filtroMunicipio}
                onChange={(e) => { setFiltroMunicipio(e.target.value); setPage(1) }}
                className="input"
              >
                <option value="todos">Todos os Municípios</option>
                {municipios.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={filtroStatus}
                onChange={(e) => { setFiltroStatus(e.target.value); setPage(1) }}
                className="input"
              >
                <option value="todos">Todos os Status</option>
                <option value="eleito">Eleitos</option>
                <option value="nao_eleito">Não Eleitos</option>
                <option value="suplente">Suplentes</option>
              </select>
            </div>
          </div>

          {/* Tabela */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)]">
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-[var(--bg-tertiary)]"
                      onClick={() => handleSort('nm_urna_candidato')}
                    >
                      Nome Urna <SortIcon field="nm_urna_candidato" />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-[var(--bg-tertiary)]"
                      onClick={() => handleSort('nr_candidato')}
                    >
                      Número <SortIcon field="nr_candidato" />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-[var(--bg-tertiary)]"
                      onClick={() => handleSort('sg_partido')}
                    >
                      Partido <SortIcon field="sg_partido" />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-[var(--bg-tertiary)]"
                      onClick={() => handleSort('ds_cargo')}
                    >
                      Cargo <SortIcon field="ds_cargo" />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-sm font-medium cursor-pointer hover:bg-[var(--bg-tertiary)]"
                      onClick={() => handleSort('nm_municipio')}
                    >
                      Município <SortIcon field="nm_municipio" />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {candidatosPaginados.map((c) => (
                    <tr key={c.id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/50 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{c.nm_urna_candidato}</p>
                          <p className="text-xs text-[var(--text-muted)]">{c.nm_candidato}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">{c.nr_candidato}</td>
                      <td className="px-4 py-3">
                        <span 
                          className="px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: getCorPartido(c.sg_partido) }}
                        >
                          {c.sg_partido}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">{c.ds_cargo}</td>
                      <td className="px-4 py-3 text-sm">{c.nm_municipio}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(c.status)}`}>
                          {getStatusLabel(c.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-color)]">
              <p className="text-sm text-[var(--text-secondary)]">
                Mostrando {((page - 1) * itemsPerPage) + 1} a {Math.min(page * itemsPerPage, candidatosFiltrados.length)} de {candidatosFiltrados.length} candidatos
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded bg-[var(--bg-secondary)] disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 rounded bg-[var(--bg-secondary)] disabled:opacity-50"
                >
                  Próximo
                </button>
              </div>
            </div>
          </div>

          {/* Fonte */}
          <div className="text-center text-sm text-[var(--text-muted)]">
            Fonte: TSE - Tribunal Superior Eleitoral | Eleições Municipais 2024
          </div>
        </>
      )}
    </div>
  )
}
