import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Users,
  Vote,
  MapPin,
  TrendingUp,
  TrendingDown,
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
  XCircle,
  Percent,
  Target,
  AlertTriangle
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

interface Candidato {
  id: number
  nr_votavel: string
  nm_votavel: string
  ds_cargo: string
  partido_num: string
  votos_total: number
}

interface VotacaoZona {
  nr_zona: number
  nm_municipio: string
  total_votos: number
  total_secoes: number
}

interface VotacaoSecao {
  nr_zona: number
  nr_secao: number
  nm_municipio: string
  nm_local_votacao: string
  qt_votos: number
}

const CORES_PARTIDOS: Record<string, string> = {
  '44': '#1E3A8A', // UNIÃO
  '22': '#16A34A', // PL
  '15': '#DC2626', // MDB
  '55': '#7C3AED', // PSD
  '13': '#EF4444', // PT
  '45': '#F59E0B', // PSDB
  '11': '#3B82F6', // PP
  '12': '#10B981', // PDT
  '40': '#6366F1', // PSB
  '20': '#EC4899', // PODE
  '19': '#14B8A6', // PODE
  '10': '#8B5CF6', // REPUBLICANOS
  '33': '#F97316', // PMN
  '23': '#06B6D4', // CIDADANIA
  '43': '#84CC16', // PV
  '50': '#A855F7', // PSOL
  '65': '#0EA5E9', // PC do B
  '70': '#D946EF', // AVANTE
  '77': '#F43F5E', // SOLIDARIEDADE
  '80': '#22C55E', // UP
}

const NOMES_PARTIDOS: Record<string, string> = {
  '44': 'UNIÃO',
  '22': 'PL',
  '15': 'MDB',
  '55': 'PSD',
  '13': 'PT',
  '45': 'PSDB',
  '11': 'PP',
  '12': 'PDT',
  '40': 'PSB',
  '20': 'PODE',
  '19': 'PODE',
  '10': 'REPUBLICANOS',
  '33': 'PMN',
  '23': 'CIDADANIA',
  '43': 'PV',
  '50': 'PSOL',
  '65': 'PC do B',
  '70': 'AVANTE',
  '77': 'SOLIDARIEDADE',
  '80': 'UP',
}

// Número de vagas por cargo
const VAGAS_CARGO: Record<string, number> = {
  'DEPUTADO FEDERAL': 8,
  'DEPUTADO ESTADUAL': 24
}

export default function Deputados() {
  const [loading, setLoading] = useState(true)
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [votacaoZonas, setVotacaoZonas] = useState<VotacaoZona[]>([])
  const [votacaoSecoes, setVotacaoSecoes] = useState<VotacaoSecao[]>([])
  const [tipoCargo, setTipoCargo] = useState<'DEPUTADO FEDERAL' | 'DEPUTADO ESTADUAL'>('DEPUTADO FEDERAL')
  const [candidatoSelecionado, setCandidatoSelecionado] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [expandedZona, setExpandedZona] = useState<number | null>(null)
  const [municipioFiltro, setMunicipioFiltro] = useState<string>('todos')
  const [municipios, setMunicipios] = useState<string[]>([])
  const [visualizacao, setVisualizacao] = useState<'eleitos' | 'nao_eleitos'>('eleitos')

  const vagasDisponiveis = VAGAS_CARGO[tipoCargo] || 24

  useEffect(() => {
    fetchCandidatos()
    fetchMunicipios()
  }, [tipoCargo])

  useEffect(() => {
    if (candidatoSelecionado) {
      fetchVotacaoPorZona()
    }
  }, [candidatoSelecionado, municipioFiltro])

  const fetchCandidatos = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('candidatos_2022')
        .select('*')
        .eq('ds_cargo', tipoCargo)
        .order('votos_total', { ascending: false })

      if (error) throw error
      
      // Filtrar votos brancos e nulos
      const candidatosFiltrados = (data || []).filter(c => 
        !['95', '96'].includes(c.nr_votavel) &&
        !['VOTO BRANCO', 'VOTO NULO'].includes(c.nm_votavel)
      )
      
      setCandidatos(candidatosFiltrados)
      
      // Selecionar o primeiro candidato por padrão
      if (candidatosFiltrados.length > 0 && !candidatoSelecionado) {
        setCandidatoSelecionado(candidatosFiltrados[0].nr_votavel)
      }
    } catch (error) {
      console.error('Erro ao buscar candidatos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMunicipios = async () => {
    try {
      const { data, error } = await supabase
        .from('votacao_deputados_2022')
        .select('nm_municipio')
        .eq('ds_cargo', tipoCargo)

      if (error) throw error
      
      const uniqueMunicipios = [...new Set((data || []).map(d => d.nm_municipio))].sort()
      setMunicipios(uniqueMunicipios)
    } catch (error) {
      console.error('Erro ao buscar municípios:', error)
    }
  }

  const fetchVotacaoPorZona = async () => {
    if (!candidatoSelecionado) return
    
    try {
      let query = supabase
        .from('votacao_deputados_2022')
        .select('nr_zona, nm_municipio, nr_secao, qt_votos')
        .eq('ds_cargo', tipoCargo)
        .eq('nr_votavel', candidatoSelecionado)

      if (municipioFiltro !== 'todos') {
        query = query.eq('nm_municipio', municipioFiltro)
      }

      const { data, error } = await query

      if (error) throw error

      // Agregar por zona
      const zonasMap: Record<number, VotacaoZona> = {}
      const secoesSet = new Set<string>()
      
      ;(data || []).forEach(v => {
        if (!zonasMap[v.nr_zona]) {
          zonasMap[v.nr_zona] = {
            nr_zona: v.nr_zona,
            nm_municipio: v.nm_municipio,
            total_votos: 0,
            total_secoes: 0
          }
        }
        zonasMap[v.nr_zona].total_votos += v.qt_votos
        
        const secaoKey = `${v.nr_zona}-${v.nr_secao}`
        if (!secoesSet.has(secaoKey)) {
          secoesSet.add(secaoKey)
          zonasMap[v.nr_zona].total_secoes++
        }
      })

      setVotacaoZonas(Object.values(zonasMap).sort((a, b) => b.total_votos - a.total_votos))
    } catch (error) {
      console.error('Erro ao buscar votação por zona:', error)
    }
  }

  const fetchVotacaoPorSecao = async (zona: number) => {
    if (!candidatoSelecionado) return
    
    try {
      let query = supabase
        .from('votacao_deputados_2022')
        .select('nr_zona, nr_secao, nm_municipio, nm_local_votacao, qt_votos')
        .eq('ds_cargo', tipoCargo)
        .eq('nr_votavel', candidatoSelecionado)
        .eq('nr_zona', zona)

      if (municipioFiltro !== 'todos') {
        query = query.eq('nm_municipio', municipioFiltro)
      }

      const { data, error } = await query.order('qt_votos', { ascending: false })

      if (error) throw error
      setVotacaoSecoes(data || [])
    } catch (error) {
      console.error('Erro ao buscar votação por seção:', error)
    }
  }

  const handleZonaClick = (zona: number) => {
    if (expandedZona === zona) {
      setExpandedZona(null)
      setVotacaoSecoes([])
    } else {
      setExpandedZona(zona)
      fetchVotacaoPorSecao(zona)
    }
  }

  // Separar eleitos e não eleitos
  const candidatosEleitos = candidatos.slice(0, vagasDisponiveis)
  const candidatosNaoEleitos = candidatos.slice(vagasDisponiveis)

  // Candidatos a exibir baseado na visualização
  const candidatosExibidos = visualizacao === 'eleitos' ? candidatosEleitos : candidatosNaoEleitos

  // Métricas avançadas
  const totalVotos = candidatos.reduce((acc, c) => acc + c.votos_total, 0)
  const linhaDeCorte = candidatosEleitos[candidatosEleitos.length - 1]?.votos_total || 0
  const mediaVotosEleitos = candidatosEleitos.length > 0 
    ? Math.round(candidatosEleitos.reduce((acc, c) => acc + c.votos_total, 0) / candidatosEleitos.length)
    : 0
  const medianaVotosEleitos = candidatosEleitos.length > 0
    ? candidatosEleitos[Math.floor(candidatosEleitos.length / 2)]?.votos_total || 0
    : 0
  const concentracaoTop5 = candidatos.length > 0
    ? ((candidatos.slice(0, 5).reduce((acc, c) => acc + c.votos_total, 0) / totalVotos) * 100).toFixed(1)
    : '0'

  // Dados para gráfico de partidos
  const dadosPartidos = () => {
    const partidos: Record<string, number> = {}
    candidatos.forEach(c => {
      const partido = c.partido_num
      if (!partidos[partido]) partidos[partido] = 0
      partidos[partido] += c.votos_total
    })
    
    return Object.entries(partidos)
      .map(([partido, votos]) => ({
        partido: NOMES_PARTIDOS[partido] || partido,
        votos,
        cor: CORES_PARTIDOS[partido] || '#6B7280'
      }))
      .sort((a, b) => b.votos - a.votos)
      .slice(0, 10)
  }

  // Filtrar candidatos pela busca
  const candidatosFiltrados = candidatosExibidos.filter(c =>
    c.nm_votavel.toLowerCase().includes(busca.toLowerCase()) ||
    c.nr_votavel.includes(busca)
  )

  const candidatoAtual = candidatos.find(c => c.nr_votavel === candidatoSelecionado)
  const posicaoCandidatoAtual = candidatos.findIndex(c => c.nr_votavel === candidatoSelecionado) + 1

  const exportarCSV = () => {
    if (!candidatoAtual || votacaoZonas.length === 0) return
    
    const headers = ['Zona', 'Município', 'Total de Votos', 'Total de Seções']
    const rows = votacaoZonas.map(z => [
      z.nr_zona,
      z.nm_municipio,
      z.total_votos,
      z.total_secoes
    ])
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `votacao_${candidatoAtual.nm_votavel.replace(/\s/g, '_')}_2022.csv`
    link.click()
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-[var(--accent-color)]" />
            Análise de Deputados - 2022
          </h1>
          <p className="text-[var(--text-secondary)]">
            Votação detalhada por candidato, zona e seção eleitoral
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={tipoCargo}
            onChange={(e) => {
              setTipoCargo(e.target.value as any)
              setCandidatoSelecionado(null)
            }}
            className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
          >
            <option value="DEPUTADO FEDERAL">Deputado Federal</option>
            <option value="DEPUTADO ESTADUAL">Deputado Estadual</option>
          </select>
          <button
            onClick={() => {
              fetchCandidatos()
              if (candidatoSelecionado) fetchVotacaoPorZona()
            }}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Cards de Resumo - Expandido */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Candidatos</p>
              <p className="text-xl font-bold">{candidatos.length}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {candidatosEleitos.length} eleitos • {candidatosNaoEleitos.length} não eleitos
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Vote className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Total de Votos</p>
              <p className="text-xl font-bold">{totalVotos.toLocaleString()}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                Média eleitos: {mediaVotosEleitos.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Target className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Linha de Corte</p>
              <p className="text-xl font-bold">{linhaDeCorte.toLocaleString()}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                Mínimo para eleição ({vagasDisponiveis}ª vaga)
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Building2 className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Partidos</p>
              <p className="text-xl font-bold">
                {new Set(candidatos.map(c => c.partido_num)).size}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                Top 5 = {concentracaoTop5}% dos votos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Card Top 5 Mais Votados */}
      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Top 5 Mais Votados - {tipoCargo}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {candidatos.slice(0, 5).map((c, index) => (
            <div 
              key={c.id} 
              className={`p-4 rounded-lg border-2 ${
                index === 0 ? 'border-yellow-500 bg-yellow-500/5' :
                index === 1 ? 'border-gray-400 bg-gray-400/5' :
                index === 2 ? 'border-amber-600 bg-amber-600/5' :
                'border-[var(--border-color)] bg-[var(--bg-secondary)]'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-2xl font-bold ${
                  index === 0 ? 'text-yellow-500' :
                  index === 1 ? 'text-gray-400' :
                  index === 2 ? 'text-amber-600' :
                  'text-[var(--text-secondary)]'
                }`}>#{index + 1}</span>
                <span
                  className="px-2 py-0.5 rounded text-xs font-bold text-white"
                  style={{ backgroundColor: CORES_PARTIDOS[c.partido_num] || '#6B7280' }}
                >
                  {NOMES_PARTIDOS[c.partido_num] || c.partido_num}
                </span>
              </div>
              <p className="font-semibold text-sm truncate" title={c.nm_votavel}>
                {c.nm_votavel}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Nº {c.nr_votavel}</p>
              <p className="text-xl font-bold text-[var(--accent-color)] mt-2">
                {c.votos_total.toLocaleString()}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {((c.votos_total / totalVotos) * 100).toFixed(1)}% do total
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Métricas Avançadas */}
      <div className="card p-4">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Métricas de Análise
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
            <p className="text-2xl font-bold text-blue-500">{vagasDisponiveis}</p>
            <p className="text-xs text-[var(--text-secondary)]">Vagas Disponíveis</p>
          </div>
          <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
            <p className="text-2xl font-bold text-green-500">{mediaVotosEleitos.toLocaleString()}</p>
            <p className="text-xs text-[var(--text-secondary)]">Média Eleitos</p>
          </div>
          <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
            <p className="text-2xl font-bold text-purple-500">{medianaVotosEleitos.toLocaleString()}</p>
            <p className="text-xs text-[var(--text-secondary)]">Mediana Eleitos</p>
          </div>
          <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
            <p className="text-2xl font-bold text-red-500">{linhaDeCorte.toLocaleString()}</p>
            <p className="text-xs text-[var(--text-secondary)]">Linha de Corte</p>
          </div>
          <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
            <p className="text-2xl font-bold text-orange-500">{candidatos[0]?.votos_total.toLocaleString() || 0}</p>
            <p className="text-xs text-[var(--text-secondary)]">Maior Votação</p>
          </div>
          <div className="text-center p-3 bg-[var(--bg-secondary)] rounded-lg">
            <p className="text-2xl font-bold text-cyan-500">
              {candidatosNaoEleitos[0]?.votos_total.toLocaleString() || 0}
            </p>
            <p className="text-xs text-[var(--text-secondary)]">1º Suplente</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
          <span className="ml-3">Carregando dados...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Candidatos */}
          <div className="card p-4">
            {/* Tabs Eleitos/Não Eleitos */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setVisualizacao('eleitos')}
                className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  visualizacao === 'eleitos'
                    ? 'bg-green-500 text-white'
                    : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <Trophy className="w-4 h-4" />
                Eleitos ({candidatosEleitos.length})
              </button>
              <button
                onClick={() => setVisualizacao('nao_eleitos')}
                className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                  visualizacao === 'nao_eleitos'
                    ? 'bg-red-500 text-white'
                    : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <XCircle className="w-4 h-4" />
                Não Eleitos ({candidatosNaoEleitos.length})
              </button>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input
                type="text"
                placeholder="Buscar candidato..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
              />
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {candidatosFiltrados.slice(0, 50).map((c) => {
                const posicaoGeral = candidatos.findIndex(cand => cand.nr_votavel === c.nr_votavel) + 1
                const isEleito = posicaoGeral <= vagasDisponiveis
                
                return (
                  <button
                    key={c.id}
                    onClick={() => setCandidatoSelecionado(c.nr_votavel)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      candidatoSelecionado === c.nr_votavel
                        ? 'bg-[var(--accent-color)] text-white'
                        : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                          isEleito ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                        }`}>
                          #{posicaoGeral}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-bold text-white"
                          style={{ backgroundColor: CORES_PARTIDOS[c.partido_num] || '#6B7280' }}
                        >
                          {NOMES_PARTIDOS[c.partido_num] || c.partido_num}
                        </span>
                      </div>
                      <span className="text-sm font-semibold">
                        {c.votos_total.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium mt-1 truncate">{c.nm_votavel}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs opacity-70">Nº {c.nr_votavel}</p>
                      {!isEleito && (
                        <p className="text-xs text-red-400">
                          -{(linhaDeCorte - c.votos_total).toLocaleString()} votos
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Votação por Zona */}
          <div className="lg:col-span-2 space-y-6">
            {candidatoAtual && (
              <>
                {/* Info do Candidato Selecionado */}
                <div className="card p-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold text-white"
                        style={{ backgroundColor: CORES_PARTIDOS[candidatoAtual.partido_num] || '#6B7280' }}
                      >
                        {candidatoAtual.partido_num}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{candidatoAtual.nm_votavel}</h3>
                        <p className="text-[var(--text-secondary)]">
                          Nº {candidatoAtual.nr_votavel} • {NOMES_PARTIDOS[candidatoAtual.partido_num] || candidatoAtual.partido_num}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            posicaoCandidatoAtual <= vagasDisponiveis
                              ? 'bg-green-500/20 text-green-500'
                              : 'bg-red-500/20 text-red-500'
                          }`}>
                            {posicaoCandidatoAtual <= vagasDisponiveis ? '✓ ELEITO' : '✗ NÃO ELEITO'}
                          </span>
                          <span className="text-xs text-[var(--text-secondary)]">
                            {posicaoCandidatoAtual}º lugar
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-[var(--accent-color)]">
                        {candidatoAtual.votos_total.toLocaleString()}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">votos totais</p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {((candidatoAtual.votos_total / totalVotos) * 100).toFixed(2)}% do total
                      </p>
                    </div>
                  </div>
                </div>

                {/* Filtros e Exportar */}
                <div className="flex flex-wrap gap-3">
                  <select
                    value={municipioFiltro}
                    onChange={(e) => setMunicipioFiltro(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
                  >
                    <option value="todos">Todos os municípios</option>
                    {municipios.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <button
                    onClick={exportarCSV}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                  </button>
                </div>

                {/* Tabela de Votação por Zona */}
                <div className="card p-4">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Votação por Zona Eleitoral
                  </h3>
                  
                  <div className="space-y-2">
                    {votacaoZonas.map(zona => (
                      <div key={zona.nr_zona} className="border border-[var(--border-color)] rounded-lg overflow-hidden">
                        <button
                          onClick={() => handleZonaClick(zona.nr_zona)}
                          className="w-full p-4 flex items-center justify-between bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <span className="text-lg font-bold text-[var(--accent-color)]">
                              Zona {zona.nr_zona}
                            </span>
                            <span className="text-sm text-[var(--text-secondary)]">
                              {zona.nm_municipio}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="font-semibold">{zona.total_votos.toLocaleString()} votos</p>
                              <p className="text-xs text-[var(--text-secondary)]">{zona.total_secoes} seções</p>
                            </div>
                            {expandedZona === zona.nr_zona ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </div>
                        </button>
                        
                        {expandedZona === zona.nr_zona && votacaoSecoes.length > 0 && (
                          <div className="p-4 bg-[var(--bg-primary)] border-t border-[var(--border-color)]">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-left text-[var(--text-secondary)]">
                                  <th className="pb-2">Seção</th>
                                  <th className="pb-2">Local</th>
                                  <th className="pb-2 text-right">Votos</th>
                                </tr>
                              </thead>
                              <tbody>
                                {votacaoSecoes.slice(0, 20).map((s, i) => (
                                  <tr key={i} className="border-t border-[var(--border-color)]">
                                    <td className="py-2 font-mono">{s.nr_secao}</td>
                                    <td className="py-2 truncate max-w-[200px]" title={s.nm_local_votacao}>
                                      {s.nm_local_votacao}
                                    </td>
                                    <td className="py-2 text-right font-semibold">{s.qt_votos}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {votacaoSecoes.length > 20 && (
                              <p className="text-center text-sm text-[var(--text-secondary)] mt-2">
                                ... e mais {votacaoSecoes.length - 20} seções
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Gráfico de Votos por Partido */}
            <div className="card p-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Votos por Partido (Top 10)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosPartidos()} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" tickFormatter={(v) => v.toLocaleString()} />
                  <YAxis type="category" dataKey="partido" width={80} />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), 'Votos']}
                    contentStyle={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="votos" radius={[0, 4, 4, 0]}>
                    {dadosPartidos().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
