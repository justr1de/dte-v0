import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  School,
  MapPin,
  Filter,
  RefreshCw,
  Loader2,
  Users,
  Vote,
  TrendingUp,
  Download,
  Search,
  Building2,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Hash,
  List
} from 'lucide-react'

interface SecaoInfo {
  nr_secao: number
  qt_aptos: number
  qt_comparecimento: number
}

interface LocalVotacao {
  nr_local_votacao: number
  nm_local_votacao: string
  ds_endereco: string
  nm_municipio: string
  nr_zona: number
  total_votos: number
  total_secoes: number
  total_eleitores: number
  participacao: number
  secoes: SecaoInfo[]
}

interface MunicipioGroup {
  nm_municipio: string
  locais: LocalVotacao[]
  total_votos: number
  total_locais: number
  total_secoes: number
}

export default function LocaisVotacao() {
  const [loading, setLoading] = useState(true)
  const [locais, setLocais] = useState<LocalVotacao[]>([])
  const [filtroAno, setFiltroAno] = useState<number>(2024)
  const [filtroTurno, setFiltroTurno] = useState<number>(1)
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('todos')
  const [filtroZona, setFiltroZona] = useState<string>('todas')
  const [busca, setBusca] = useState('')
  const [municipios, setMunicipios] = useState<string[]>([])
  const [zonas, setZonas] = useState<number[]>([])
  const [expandedMunicipio, setExpandedMunicipio] = useState<string | null>(null)
  const [expandedLocal, setExpandedLocal] = useState<string | null>(null)
  const [ordenacao, setOrdenacao] = useState<'votos' | 'nome' | 'secoes'>('votos')
  const [totalVotos, setTotalVotos] = useState(0)
  const [totalLocais, setTotalLocais] = useState(0)
  const [totalSecoes, setTotalSecoes] = useState(0)

  useEffect(() => {
    fetchData()
  }, [filtroAno, filtroTurno])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar dados em múltiplas páginas para pegar todos os registros
      let allBoletins: any[] = []
      let page = 0
      const pageSize = 50000
      let hasMore = true

      while (hasMore) {
        const { data: boletins, error } = await supabase
          .from('boletins_urna')
          .select('nr_local_votacao, nm_local_votacao, ds_endereco_local, nm_municipio, nr_zona, nr_secao, qt_votos, qt_aptos, qt_comparecimento, sg_uf')
          .eq('ano_eleicao', filtroAno)
          .eq('nr_turno', filtroTurno)
          .eq('cd_cargo_pergunta', 13) // Vereador - cargo com dados mais completos
          .eq('sg_uf', 'RO') // Apenas Rondônia
          .range(page * pageSize, (page + 1) * pageSize - 1)

        if (error) throw error

        if (boletins && boletins.length > 0) {
          allBoletins = [...allBoletins, ...boletins]
          hasMore = boletins.length === pageSize
          page++
        } else {
          hasMore = false
        }
      }

      console.log(`Total de registros carregados: ${allBoletins.length}`)

      if (allBoletins.length > 0) {
        // Agregar por local de votação
        const locaisMap: Record<string, {
          nr_local_votacao: number
          nm_local_votacao: string
          ds_endereco: string
          nm_municipio: string
          nr_zona: number
          total_votos: number
          secoes: Map<number, SecaoInfo>
          total_eleitores: number
          total_comparecimento: number
        }> = {}

        const municipiosSet = new Set<string>()
        const zonasSet = new Set<number>()
        const secoesGlobal = new Set<string>()

        allBoletins.forEach(b => {
          if (!b.nm_municipio) return
          
          const key = `${b.nm_municipio}-${b.nr_zona}-${b.nr_local_votacao}`
          
          municipiosSet.add(b.nm_municipio)
          zonasSet.add(b.nr_zona)
          secoesGlobal.add(`${b.nr_zona}-${b.nr_secao}`)
          
          if (!locaisMap[key]) {
            locaisMap[key] = {
              nr_local_votacao: b.nr_local_votacao,
              nm_local_votacao: b.nm_local_votacao || `Local ${b.nr_local_votacao}`,
              ds_endereco: b.ds_endereco_local || '',
              nm_municipio: b.nm_municipio,
              nr_zona: b.nr_zona,
              total_votos: 0,
              secoes: new Map(),
              total_eleitores: 0,
              total_comparecimento: 0
            }
          }
          
          locaisMap[key].total_votos += b.qt_votos || 0
          
          // Agregar seções
          if (!locaisMap[key].secoes.has(b.nr_secao)) {
            locaisMap[key].secoes.set(b.nr_secao, {
              nr_secao: b.nr_secao,
              qt_aptos: b.qt_aptos || 0,
              qt_comparecimento: b.qt_comparecimento || 0
            })
            locaisMap[key].total_eleitores += b.qt_aptos || 0
            locaisMap[key].total_comparecimento += b.qt_comparecimento || 0
          }
        })

        // Converter para array
        const locaisArray: LocalVotacao[] = Object.values(locaisMap).map(l => ({
          nr_local_votacao: l.nr_local_votacao,
          nm_local_votacao: l.nm_local_votacao,
          ds_endereco: l.ds_endereco,
          nm_municipio: l.nm_municipio,
          nr_zona: l.nr_zona,
          total_votos: l.total_comparecimento,
          total_secoes: l.secoes.size,
          total_eleitores: l.total_eleitores,
          participacao: l.total_eleitores > 0 ? (l.total_comparecimento / l.total_eleitores) * 100 : 0,
          secoes: Array.from(l.secoes.values()).sort((a, b) => a.nr_secao - b.nr_secao)
        }))

        setLocais(locaisArray)
        setMunicipios(Array.from(municipiosSet).sort())
        setZonas(Array.from(zonasSet).sort((a, b) => a - b))
        setTotalVotos(locaisArray.reduce((acc, l) => acc + l.total_votos, 0))
        setTotalLocais(locaisArray.length)
        setTotalSecoes(secoesGlobal.size)
      } else {
        setLocais([])
        setMunicipios([])
        setZonas([])
        setTotalVotos(0)
        setTotalLocais(0)
        setTotalSecoes(0)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtrar e agrupar locais
  const getFilteredLocais = () => {
    let filtered = [...locais]
    
    if (filtroMunicipio !== 'todos') {
      filtered = filtered.filter(l => l.nm_municipio === filtroMunicipio)
    }
    
    if (filtroZona !== 'todas') {
      filtered = filtered.filter(l => l.nr_zona === Number(filtroZona))
    }
    
    if (busca) {
      const searchLower = busca.toLowerCase()
      filtered = filtered.filter(l => 
        l.nm_local_votacao.toLowerCase().includes(searchLower) ||
        l.ds_endereco.toLowerCase().includes(searchLower) ||
        l.nm_municipio.toLowerCase().includes(searchLower)
      )
    }
    
    // Ordenar
    filtered.sort((a, b) => {
      switch (ordenacao) {
        case 'votos': return b.total_votos - a.total_votos
        case 'nome': return a.nm_local_votacao.localeCompare(b.nm_local_votacao)
        case 'secoes': return b.total_secoes - a.total_secoes
        default: return 0
      }
    })
    
    return filtered
  }

  // Agrupar por município
  const getGroupedByMunicipio = () => {
    const filtered = getFilteredLocais()
    const groups: Record<string, MunicipioGroup> = {}
    
    filtered.forEach(local => {
      if (!groups[local.nm_municipio]) {
        groups[local.nm_municipio] = {
          nm_municipio: local.nm_municipio,
          locais: [],
          total_votos: 0,
          total_locais: 0,
          total_secoes: 0
        }
      }
      groups[local.nm_municipio].locais.push(local)
      groups[local.nm_municipio].total_votos += local.total_votos
      groups[local.nm_municipio].total_locais++
      groups[local.nm_municipio].total_secoes += local.total_secoes
    })
    
    return Object.values(groups).sort((a, b) => b.total_votos - a.total_votos)
  }

  const exportarCSV = () => {
    const filtered = getFilteredLocais()
    const headers = ['Município', 'Zona', 'Nº Local', 'Nome do Local', 'Endereço', 'Seções', 'Nº das Seções', 'Eleitores', 'Votos', 'Participação (%)']
    const rows = filtered.map(l => [
      l.nm_municipio,
      l.nr_zona,
      l.nr_local_votacao,
      l.nm_local_votacao,
      l.ds_endereco,
      l.total_secoes,
      l.secoes.map(s => s.nr_secao).join('; '),
      l.total_eleitores,
      l.total_votos,
      l.participacao.toFixed(2)
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `locais_votacao_${filtroAno}_turno${filtroTurno}.csv`
    link.click()
  }

  const filteredLocais = getFilteredLocais()
  const groupedByMunicipio = getGroupedByMunicipio()

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <School className="w-7 h-7 text-[var(--accent-color)]" />
            Locais de Votação
          </h1>
          <p className="text-[var(--text-secondary)]">Visualização dos locais de votação e seus quantitativos de votos</p>
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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <School className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[var(--text-secondary)]">Total de Locais</span>
          </div>
          <p className="text-2xl font-bold">{totalLocais.toLocaleString('pt-BR')}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Vote className="w-5 h-5 text-green-500" />
            <span className="text-sm text-[var(--text-secondary)]">Total de Votos</span>
          </div>
          <p className="text-2xl font-bold">{totalVotos.toLocaleString('pt-BR')}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-[var(--text-secondary)]">Municípios</span>
          </div>
          <p className="text-2xl font-bold">{municipios.length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-[var(--text-secondary)]">Zonas Eleitorais</span>
          </div>
          <p className="text-2xl font-bold">{zonas.length}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="w-5 h-5 text-cyan-500" />
            <span className="text-sm text-[var(--text-secondary)]">Total de Seções</span>
          </div>
          <p className="text-2xl font-bold">{totalSecoes.toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-[var(--accent-color)]" />
          <span className="font-semibold">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">Buscar</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Nome ou endereço..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">Município</label>
            <select
              value={filtroMunicipio}
              onChange={(e) => setFiltroMunicipio(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
            >
              <option value="todos">Todos os municípios</option>
              {municipios.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">Zona Eleitoral</label>
            <select
              value={filtroZona}
              onChange={(e) => setFiltroZona(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
            >
              <option value="todas">Todas as zonas</option>
              {zonas.map(z => (
                <option key={z} value={z}>Zona {z}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)] mb-1 block">Ordenar por</label>
            <select
              value={ordenacao}
              onChange={(e) => setOrdenacao(e.target.value as any)}
              className="w-full px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
            >
              <option value="votos">Maior nº de votos</option>
              <option value="nome">Nome do local</option>
              <option value="secoes">Nº de seções</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Locais Agrupados por Município */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-lg font-semibold">
              Locais de Votação ({filteredLocais.length} encontrados)
            </h2>
          </div>
          <button 
            onClick={exportarCSV}
            className="px-4 py-2 rounded-lg border border-[var(--border-color)] flex items-center gap-2 hover:bg-[var(--bg-secondary)]"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
            <span className="ml-2">Carregando dados...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedByMunicipio.map((grupo) => (
              <div key={grupo.nm_municipio} className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                {/* Cabeçalho do Município */}
                <div 
                  className="p-4 bg-[var(--bg-secondary)] cursor-pointer hover:bg-[var(--bg-secondary)]/80 transition-colors"
                  onClick={() => setExpandedMunicipio(expandedMunicipio === grupo.nm_municipio ? null : grupo.nm_municipio)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-[var(--accent-color)]" />
                      <div>
                        <h3 className="font-semibold">{grupo.nm_municipio}</h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {grupo.total_locais} {grupo.total_locais === 1 ? 'local' : 'locais'} • {grupo.total_secoes} seções
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-[var(--text-secondary)]">Total de Votos</p>
                        <p className="font-bold text-lg">{grupo.total_votos.toLocaleString('pt-BR')}</p>
                      </div>
                      {expandedMunicipio === grupo.nm_municipio ? (
                        <ChevronUp className="w-5 h-5 text-[var(--text-secondary)]" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-[var(--text-secondary)]" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Lista de Locais */}
                {expandedMunicipio === grupo.nm_municipio && (
                  <div className="border-t border-[var(--border-color)]">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-[var(--bg-primary)]">
                            <th className="text-left p-3 font-semibold text-sm">Local de Votação</th>
                            <th className="text-left p-3 font-semibold text-sm">Endereço</th>
                            <th className="text-center p-3 font-semibold text-sm">Zona</th>
                            <th className="text-center p-3 font-semibold text-sm">Seções</th>
                            <th className="text-right p-3 font-semibold text-sm">Eleitores</th>
                            <th className="text-right p-3 font-semibold text-sm">Votos</th>
                            <th className="text-right p-3 font-semibold text-sm">Participação</th>
                            <th className="text-center p-3 font-semibold text-sm">Detalhes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {grupo.locais.map((local, idx) => {
                            const localKey = `${local.nr_zona}-${local.nr_local_votacao}`
                            const isExpanded = expandedLocal === localKey
                            
                            return (
                              <>
                                <tr 
                                  key={localKey} 
                                  className={`border-t border-[var(--border-color)] hover:bg-[var(--bg-secondary)]/50 ${idx % 2 === 0 ? '' : 'bg-[var(--bg-primary)]/50'}`}
                                >
                                  <td className="p-3">
                                    <div className="flex items-center gap-2">
                                      <School className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                      <div>
                                        <span className="font-medium">{local.nm_local_votacao}</span>
                                        <span className="text-xs text-[var(--text-secondary)] ml-2">#{local.nr_local_votacao}</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="p-3 text-sm text-[var(--text-secondary)]">
                                    {local.ds_endereco || '-'}
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-sm">
                                      {local.nr_zona}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-medium">
                                    {local.total_secoes}
                                  </td>
                                  <td className="p-3 text-right">
                                    {local.total_eleitores.toLocaleString('pt-BR')}
                                  </td>
                                  <td className="p-3 text-right font-bold">
                                    {local.total_votos.toLocaleString('pt-BR')}
                                  </td>
                                  <td className="p-3 text-right">
                                    <span className={`px-2 py-1 rounded text-sm ${
                                      local.participacao >= 75 ? 'bg-green-500/20 text-green-500' : 
                                      local.participacao >= 60 ? 'bg-yellow-500/20 text-yellow-500' : 
                                      'bg-red-500/20 text-red-500'
                                    }`}>
                                      {local.participacao.toFixed(1)}%
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setExpandedLocal(isExpanded ? null : localKey)
                                      }}
                                      className="p-1 rounded hover:bg-[var(--bg-secondary)]"
                                    >
                                      <List className="w-4 h-4 text-[var(--accent-color)]" />
                                    </button>
                                  </td>
                                </tr>
                                {/* Detalhes das Seções */}
                                {isExpanded && (
                                  <tr>
                                    <td colSpan={8} className="p-0">
                                      <div className="bg-[var(--bg-primary)] p-4 border-t border-[var(--border-color)]">
                                        <div className="flex items-center gap-2 mb-3">
                                          <Hash className="w-4 h-4 text-[var(--accent-color)]" />
                                          <span className="font-semibold text-sm">Seções Eleitorais ({local.secoes.length})</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                                          {local.secoes.map(secao => (
                                            <div 
                                              key={secao.nr_secao}
                                              className="p-2 bg-[var(--bg-secondary)] rounded border border-[var(--border-color)]"
                                            >
                                              <div className="flex items-center justify-between">
                                                <span className="font-bold text-[var(--accent-color)]">
                                                  Seção {secao.nr_secao}
                                                </span>
                                              </div>
                                              <div className="text-xs text-[var(--text-secondary)] mt-1">
                                                <div>Eleitores: {secao.qt_aptos.toLocaleString('pt-BR')}</div>
                                                <div>Comparecimento: {secao.qt_comparecimento.toLocaleString('pt-BR')}</div>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top 10 Locais por Votos */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[var(--accent-color)]" />
          <h2 className="text-lg font-semibold">Top 10 Locais com Mais Votos</h2>
        </div>
        <div className="space-y-3">
          {filteredLocais.slice(0, 10).map((local, index) => (
            <div key={`${local.nr_zona}-${local.nr_local_votacao}`} className="flex items-center gap-4 p-3 bg-[var(--bg-secondary)] rounded-lg">
              <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                index === 0 ? 'bg-yellow-500 text-black' :
                index === 1 ? 'bg-gray-400 text-black' :
                index === 2 ? 'bg-orange-600 text-white' :
                'bg-[var(--bg-primary)] text-[var(--text-secondary)]'
              }`}>
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{local.nm_local_votacao}</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {local.nm_municipio} • Zona {local.nr_zona} • {local.total_secoes} seções
                </p>
                {local.ds_endereco && (
                  <p className="text-xs text-[var(--text-secondary)] truncate">
                    <MapPin className="w-3 h-3 inline mr-1" />
                    {local.ds_endereco}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{local.total_votos.toLocaleString('pt-BR')}</p>
                <p className="text-sm text-[var(--text-secondary)]">votos</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
