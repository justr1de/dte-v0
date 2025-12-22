import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Target,
  MapPin,
  Users,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Save,
  Download,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Award,
  Percent,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar,
  Flag
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
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Area
} from 'recharts'

// Interfaces
interface MetaZona {
  id?: number
  zona: number
  municipio: string
  metaVotos: number
  metaPercentual: number
  votosAnteriores: number
  totalEleitores: number
  prioridade: 'alta' | 'media' | 'baixa'
  estrategia: string
  responsavel: string
  status: 'pendente' | 'em_andamento' | 'concluida'
  progresso: number
  observacoes: string
  created_at?: string
  updated_at?: string
}

interface MetaBairro {
  id?: number
  zona: number
  bairro: string
  metaVotos: number
  totalEleitores: number
  votosAnteriores: number
  prioridade: 'alta' | 'media' | 'baixa'
  acoes: string[]
  progresso: number
}

interface DadosHistoricos {
  ano: number
  zona: number
  votos: number
  percentual: number
  posicao: number
}

interface ResumoEstrategia {
  totalMetas: number
  metaGeral: number
  progressoGeral: number
  zonasAlta: number
  zonasMedia: number
  zonasBaixa: number
  votosAnterioresTotal: number
  crescimentoNecessario: number
}

const CORES_PRIORIDADE = {
  alta: '#EF4444',
  media: '#F59E0B',
  baixa: '#10B981'
}

const CORES_STATUS = {
  pendente: '#6B7280',
  em_andamento: '#3B82F6',
  concluida: '#10B981'
}

export default function EstrategiaTerritorial() {
  const [loading, setLoading] = useState(true)
  const [metas, setMetas] = useState<MetaZona[]>([])
  const [metasBairro, setMetasBairro] = useState<MetaBairro[]>([])
  const [historico, setHistorico] = useState<DadosHistoricos[]>([])
  const [resumo, setResumo] = useState<ResumoEstrategia | null>(null)
  
  // Filtros
  const [filtroZona, setFiltroZona] = useState<number | null>(null)
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>('todas')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  
  // Modal de edição
  const [modalAberto, setModalAberto] = useState(false)
  const [metaEditando, setMetaEditando] = useState<MetaZona | null>(null)
  const [expandedZonas, setExpandedZonas] = useState<Set<number>>(new Set())
  
  // Abas
  const [abaAtiva, setAbaAtiva] = useState<'zonas' | 'bairros' | 'historico' | 'dashboard'>('dashboard')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar metas existentes (se houver tabela)
      const { data: metasData, error: metasError } = await supabase
        .from('metas_territoriais')
        .select('*')
        .order('zona')

      if (metasData && !metasError) {
        setMetas(metasData.map(m => ({
          id: m.id,
          zona: m.zona,
          municipio: m.municipio || 'Porto Velho',
          metaVotos: m.meta_votos || 0,
          metaPercentual: m.meta_percentual || 0,
          votosAnteriores: m.votos_anteriores || 0,
          totalEleitores: m.total_eleitores || 0,
          prioridade: m.prioridade || 'media',
          estrategia: m.estrategia || '',
          responsavel: m.responsavel || '',
          status: m.status || 'pendente',
          progresso: m.progresso || 0,
          observacoes: m.observacoes || '',
          created_at: m.created_at,
          updated_at: m.updated_at
        })))
      } else {
        // Se não houver tabela, criar dados de exemplo baseados nos dados eleitorais
        await carregarDadosExemplo()
      }

      // Buscar dados históricos
      await carregarHistorico()
      
      // Calcular resumo
      calcularResumo()
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
      await carregarDadosExemplo()
    } finally {
      setLoading(false)
    }
  }

  const carregarDadosExemplo = async () => {
    // Buscar dados do perfil do eleitorado para criar metas baseadas em dados reais
    const { data: perfilData } = await supabase
      .from('perfil_eleitorado')
      .select('*')
      .eq('ano', 2024)

    // Buscar dados de votos anteriores
    const { data: votosData } = await supabase
      .from('boletins_urna')
      .select('nr_zona, qt_votos')
      .eq('ano_eleicao', 2022)
      .eq('cd_cargo_pergunta', 7) // Deputado Estadual
      .limit(10000)

    // Agregar por zona
    const zonaMap = new Map<number, { eleitores: number; votos: number }>()
    
    perfilData?.forEach(item => {
      const zona = item.zona || 0
      if (!zonaMap.has(zona)) {
        zonaMap.set(zona, { eleitores: 0, votos: 0 })
      }
      zonaMap.get(zona)!.eleitores += item.total_eleitores || 0
    })

    votosData?.forEach(item => {
      const zona = item.nr_zona
      if (zonaMap.has(zona)) {
        zonaMap.get(zona)!.votos += item.qt_votos || 0
      }
    })

    // Criar metas de exemplo
    const metasExemplo: MetaZona[] = Array.from(zonaMap.entries())
      .filter(([_, data]) => data.eleitores > 0)
      .map(([zona, data], index) => {
        const metaBase = Math.ceil(data.eleitores * 0.03) // 3% do eleitorado como meta base
        return {
          zona,
          municipio: 'Porto Velho',
          metaVotos: metaBase,
          metaPercentual: 3,
          votosAnteriores: Math.floor(metaBase * 0.7), // Simulando 70% da meta como votos anteriores
          totalEleitores: data.eleitores,
          prioridade: (index < 5 ? 'alta' : index < 15 ? 'media' : 'baixa') as 'alta' | 'media' | 'baixa',
          estrategia: '',
          responsavel: '',
          status: 'pendente' as 'pendente' | 'em_andamento' | 'concluida',
          progresso: 0,
          observacoes: ''
        }
      })
      .sort((a, b) => b.totalEleitores - a.totalEleitores)

    setMetas(metasExemplo)
  }

  const carregarHistorico = async () => {
    // Buscar dados históricos de eleições anteriores
    const anos = [2018, 2020, 2022, 2024]
    const historicoData: DadosHistoricos[] = []

    for (const ano of anos) {
      const { data } = await supabase
        .from('boletins_urna')
        .select('nr_zona, qt_votos')
        .eq('ano_eleicao', ano)
        .eq('cd_cargo_pergunta', 7)
        .limit(5000)

      if (data) {
        const zonaVotos = new Map<number, number>()
        data.forEach(item => {
          const zona = item.nr_zona
          zonaVotos.set(zona, (zonaVotos.get(zona) || 0) + item.qt_votos)
        })

        zonaVotos.forEach((votos, zona) => {
          historicoData.push({
            ano,
            zona,
            votos,
            percentual: 0,
            posicao: 0
          })
        })
      }
    }

    setHistorico(historicoData)
  }

  const calcularResumo = () => {
    if (metas.length === 0) return

    const totalMetas = metas.length
    const metaGeral = metas.reduce((acc, m) => acc + m.metaVotos, 0)
    const progressoTotal = metas.reduce((acc, m) => acc + (m.metaVotos * m.progresso / 100), 0)
    const progressoGeral = metaGeral > 0 ? (progressoTotal / metaGeral) * 100 : 0
    const zonasAlta = metas.filter(m => m.prioridade === 'alta').length
    const zonasMedia = metas.filter(m => m.prioridade === 'media').length
    const zonasBaixa = metas.filter(m => m.prioridade === 'baixa').length
    const votosAnterioresTotal = metas.reduce((acc, m) => acc + m.votosAnteriores, 0)
    const crescimentoNecessario = votosAnterioresTotal > 0 
      ? ((metaGeral - votosAnterioresTotal) / votosAnterioresTotal) * 100 
      : 0

    setResumo({
      totalMetas,
      metaGeral,
      progressoGeral,
      zonasAlta,
      zonasMedia,
      zonasBaixa,
      votosAnterioresTotal,
      crescimentoNecessario
    })
  }

  useEffect(() => {
    calcularResumo()
  }, [metas])

  const salvarMeta = async (meta: MetaZona) => {
    try {
      if (meta.id) {
        // Atualizar meta existente
        const { error } = await supabase
          .from('metas_territoriais')
          .update({
            meta_votos: meta.metaVotos,
            meta_percentual: meta.metaPercentual,
            prioridade: meta.prioridade,
            estrategia: meta.estrategia,
            responsavel: meta.responsavel,
            status: meta.status,
            progresso: meta.progresso,
            observacoes: meta.observacoes,
            updated_at: new Date().toISOString()
          })
          .eq('id', meta.id)

        if (error) throw error
      } else {
        // Criar nova meta
        const { error } = await supabase
          .from('metas_territoriais')
          .insert({
            zona: meta.zona,
            municipio: meta.municipio,
            meta_votos: meta.metaVotos,
            meta_percentual: meta.metaPercentual,
            votos_anteriores: meta.votosAnteriores,
            total_eleitores: meta.totalEleitores,
            prioridade: meta.prioridade,
            estrategia: meta.estrategia,
            responsavel: meta.responsavel,
            status: meta.status,
            progresso: meta.progresso,
            observacoes: meta.observacoes
          })

        if (error) throw error
      }

      // Atualizar estado local
      setMetas(prev => {
        if (meta.id) {
          return prev.map(m => m.id === meta.id ? meta : m)
        }
        return [...prev, { ...meta, id: Date.now() }]
      })

      setModalAberto(false)
      setMetaEditando(null)
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
      // Salvar localmente mesmo se falhar no banco
      setMetas(prev => {
        if (meta.id) {
          return prev.map(m => m.id === meta.id ? meta : m)
        }
        return [...prev, { ...meta, id: Date.now() }]
      })
      setModalAberto(false)
      setMetaEditando(null)
    }
  }

  const exportarMetas = () => {
    const csv = [
      ['Zona', 'Município', 'Meta Votos', 'Meta %', 'Votos Anteriores', 'Total Eleitores', 'Prioridade', 'Status', 'Progresso %', 'Responsável', 'Estratégia'].join(','),
      ...metas.map(m => [
        m.zona,
        m.municipio,
        m.metaVotos,
        m.metaPercentual,
        m.votosAnteriores,
        m.totalEleitores,
        m.prioridade,
        m.status,
        m.progresso,
        m.responsavel,
        `"${m.estrategia}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `metas_territoriais_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const toggleZonaExpanded = (zona: number) => {
    setExpandedZonas(prev => {
      const newSet = new Set(prev)
      if (newSet.has(zona)) {
        newSet.delete(zona)
      } else {
        newSet.add(zona)
      }
      return newSet
    })
  }

  // Filtrar metas
  const metasFiltradas = metas.filter(m => {
    if (filtroZona && m.zona !== filtroZona) return false
    if (filtroPrioridade !== 'todas' && m.prioridade !== filtroPrioridade) return false
    if (filtroStatus !== 'todos' && m.status !== filtroStatus) return false
    return true
  })

  // Dados para gráficos
  const dadosBarras = metasFiltradas.slice(0, 10).map(m => ({
    zona: `Z${m.zona}`,
    meta: m.metaVotos,
    anterior: m.votosAnteriores,
    progresso: Math.round(m.metaVotos * m.progresso / 100)
  }))

  const dadosPizza = [
    { name: 'Alta Prioridade', value: metas.filter(m => m.prioridade === 'alta').length, color: CORES_PRIORIDADE.alta },
    { name: 'Média Prioridade', value: metas.filter(m => m.prioridade === 'media').length, color: CORES_PRIORIDADE.media },
    { name: 'Baixa Prioridade', value: metas.filter(m => m.prioridade === 'baixa').length, color: CORES_PRIORIDADE.baixa }
  ]

  const dadosStatus = [
    { name: 'Pendente', value: metas.filter(m => m.status === 'pendente').length, color: CORES_STATUS.pendente },
    { name: 'Em Andamento', value: metas.filter(m => m.status === 'em_andamento').length, color: CORES_STATUS.em_andamento },
    { name: 'Concluída', value: metas.filter(m => m.status === 'concluida').length, color: CORES_STATUS.concluida }
  ]

  // Dados históricos por zona selecionada
  const dadosHistoricoZona = filtroZona 
    ? historico.filter(h => h.zona === filtroZona).sort((a, b) => a.ano - b.ano)
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-7 h-7 text-emerald-500" />
            Estratégia Territorial
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Defina e acompanhe metas de votos por zona eleitoral e bairro
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setMetaEditando({
                zona: 0,
                municipio: 'Porto Velho',
                metaVotos: 0,
                metaPercentual: 0,
                votosAnteriores: 0,
                totalEleitores: 0,
                prioridade: 'media',
                estrategia: '',
                responsavel: '',
                status: 'pendente',
                progresso: 0,
                observacoes: ''
              })
              setModalAberto(true)
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Meta
          </button>
          <button
            onClick={exportarMetas}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-2 border-b border-[var(--border-color)]">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
          { id: 'zonas', label: 'Metas por Zona', icon: MapPin },
          { id: 'bairros', label: 'Metas por Bairro', icon: Users },
          { id: 'historico', label: 'Comparativo Histórico', icon: TrendingUp }
        ].map(aba => (
          <button
            key={aba.id}
            onClick={() => setAbaAtiva(aba.id as any)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              abaAtiva === aba.id 
                ? 'border-emerald-500 text-emerald-500' 
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <aba.icon className="w-4 h-4" />
            {aba.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <>
          {/* Dashboard */}
          {abaAtiva === 'dashboard' && resumo && (
            <div className="space-y-6">
              {/* Cards de Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-muted)]">Meta Geral de Votos</p>
                      <p className="text-2xl font-bold text-emerald-500">
                        {resumo.metaGeral.toLocaleString()}
                      </p>
                    </div>
                    <Target className="w-10 h-10 text-emerald-500 opacity-20" />
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>Progresso</span>
                      <span>{resumo.progressoGeral.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(resumo.progressoGeral, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-muted)]">Votos Anteriores</p>
                      <p className="text-2xl font-bold">
                        {resumo.votosAnterioresTotal.toLocaleString()}
                      </p>
                    </div>
                    <BarChart3 className="w-10 h-10 text-blue-500 opacity-20" />
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    {resumo.crescimentoNecessario > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4 text-amber-500" />
                        <span className="text-sm text-amber-500">
                          +{resumo.crescimentoNecessario.toFixed(1)}% necessário
                        </span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm text-emerald-500">Meta atingível</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-muted)]">Zonas Mapeadas</p>
                      <p className="text-2xl font-bold">{resumo.totalMetas}</p>
                    </div>
                    <MapPin className="w-10 h-10 text-purple-500 opacity-20" />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                      {resumo.zonasAlta} alta
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700">
                      {resumo.zonasMedia} média
                    </span>
                    <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-700">
                      {resumo.zonasBaixa} baixa
                    </span>
                  </div>
                </div>

                <div className="card p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[var(--text-muted)]">Status das Metas</p>
                      <p className="text-2xl font-bold">
                        {metas.filter(m => m.status === 'concluida').length}/{resumo.totalMetas}
                      </p>
                    </div>
                    <Flag className="w-10 h-10 text-cyan-500 opacity-20" />
                  </div>
                  <div className="mt-2 text-sm text-[var(--text-muted)]">
                    {metas.filter(m => m.status === 'em_andamento').length} em andamento
                  </div>
                </div>
              </div>

              {/* Gráficos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Metas vs Votos Anteriores */}
                <div className="card p-4">
                  <h3 className="text-lg font-semibold mb-4">Metas vs Votos Anteriores (Top 10 Zonas)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={dadosBarras}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="zona" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--bg-card)', 
                          border: '1px solid var(--border-color)' 
                        }}
                      />
                      <Legend />
                      <Bar dataKey="anterior" name="Votos Anteriores" fill="#6B7280" />
                      <Bar dataKey="meta" name="Meta" fill="#10B981" />
                      <Line type="monotone" dataKey="progresso" name="Progresso" stroke="#3B82F6" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                {/* Distribuição por Prioridade */}
                <div className="card p-4">
                  <h3 className="text-lg font-semibold mb-4">Distribuição por Prioridade</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={dadosPizza}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {dadosPizza.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={dadosStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {dadosStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-around mt-4">
                    <div className="text-center">
                      <p className="text-xs text-[var(--text-muted)]">Por Prioridade</p>
                      <div className="flex gap-2 mt-1">
                        {dadosPizza.map((item, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs">{item.name.split(' ')[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[var(--text-muted)]">Por Status</p>
                      <div className="flex gap-2 mt-1">
                        {dadosStatus.map((item, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs">{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top 5 Zonas Prioritárias */}
              <div className="card p-4">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Top 5 Zonas Prioritárias
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {metas
                    .filter(m => m.prioridade === 'alta')
                    .sort((a, b) => b.metaVotos - a.metaVotos)
                    .slice(0, 5)
                    .map((meta, index) => (
                      <div 
                        key={meta.zona}
                        className="p-4 rounded-lg border-2 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl font-bold text-red-600">#{index + 1}</span>
                          <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                            Zona {meta.zona}
                          </span>
                        </div>
                        <p className="text-lg font-semibold">{meta.metaVotos.toLocaleString()} votos</p>
                        <p className="text-sm text-[var(--text-muted)]">
                          {meta.totalEleitores.toLocaleString()} eleitores
                        </p>
                        <div className="mt-2">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progresso</span>
                            <span>{meta.progresso}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-red-500 h-1.5 rounded-full"
                              style={{ width: `${meta.progresso}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Metas por Zona */}
          {abaAtiva === 'zonas' && (
            <div className="space-y-4">
              {/* Filtros */}
              <div className="card p-4">
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Zona</label>
                    <select
                      value={filtroZona || ''}
                      onChange={(e) => setFiltroZona(e.target.value ? parseInt(e.target.value) : null)}
                      className="input w-40"
                    >
                      <option value="">Todas</option>
                      {Array.from(new Set(metas.map(m => m.zona))).sort((a, b) => a - b).map(zona => (
                        <option key={zona} value={zona}>Zona {zona}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Prioridade</label>
                    <select
                      value={filtroPrioridade}
                      onChange={(e) => setFiltroPrioridade(e.target.value)}
                      className="input w-40"
                    >
                      <option value="todas">Todas</option>
                      <option value="alta">Alta</option>
                      <option value="media">Média</option>
                      <option value="baixa">Baixa</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      value={filtroStatus}
                      onChange={(e) => setFiltroStatus(e.target.value)}
                      className="input w-40"
                    >
                      <option value="todos">Todos</option>
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="concluida">Concluída</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Lista de Metas */}
              <div className="space-y-2">
                {metasFiltradas.map(meta => (
                  <div key={meta.zona} className="card">
                    <div 
                      className="p-4 cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors"
                      onClick={() => toggleZonaExpanded(meta.zona)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {expandedZonas.has(meta.zona) ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                            <MapPin className="w-5 h-5 text-emerald-500" />
                            <span className="font-semibold">Zona {meta.zona}</span>
                          </div>
                          <span 
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{ 
                              backgroundColor: `${CORES_PRIORIDADE[meta.prioridade]}20`,
                              color: CORES_PRIORIDADE[meta.prioridade]
                            }}
                          >
                            {meta.prioridade.charAt(0).toUpperCase() + meta.prioridade.slice(1)}
                          </span>
                          <span 
                            className="px-2 py-0.5 text-xs rounded-full"
                            style={{ 
                              backgroundColor: `${CORES_STATUS[meta.status]}20`,
                              color: CORES_STATUS[meta.status]
                            }}
                          >
                            {meta.status === 'em_andamento' ? 'Em Andamento' : 
                             meta.status.charAt(0).toUpperCase() + meta.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm text-[var(--text-muted)]">Meta</p>
                            <p className="font-semibold text-emerald-500">{meta.metaVotos.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-[var(--text-muted)]">Anterior</p>
                            <p className="font-semibold">{meta.votosAnteriores.toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-[var(--text-muted)]">Eleitores</p>
                            <p className="font-semibold">{meta.totalEleitores.toLocaleString()}</p>
                          </div>
                          <div className="w-32">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progresso</span>
                              <span>{meta.progresso}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full transition-all"
                                style={{ 
                                  width: `${meta.progresso}%`,
                                  backgroundColor: CORES_PRIORIDADE[meta.prioridade]
                                }}
                              />
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setMetaEditando(meta)
                              setModalAberto(true)
                            }}
                            className="p-2 hover:bg-[var(--bg-card)] rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Detalhes expandidos */}
                    {expandedZonas.has(meta.zona) && (
                      <div className="px-4 pb-4 border-t border-[var(--border-color)]">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <p className="text-sm font-medium text-[var(--text-muted)]">Estratégia</p>
                            <p className="mt-1">{meta.estrategia || 'Não definida'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-muted)]">Responsável</p>
                            <p className="mt-1">{meta.responsavel || 'Não atribuído'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[var(--text-muted)]">Observações</p>
                            <p className="mt-1">{meta.observacoes || 'Nenhuma'}</p>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-[var(--bg-card)] rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Percent className="w-4 h-4 text-blue-500" />
                              <span className="text-sm">Meta representa {meta.metaPercentual}% do eleitorado</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {meta.metaVotos > meta.votosAnteriores ? (
                                <>
                                  <TrendingUp className="w-4 h-4 text-amber-500" />
                                  <span className="text-sm text-amber-500">
                                    +{((meta.metaVotos - meta.votosAnteriores) / meta.votosAnteriores * 100).toFixed(1)}% de crescimento necessário
                                  </span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                                  <span className="text-sm text-emerald-500">Meta conservadora</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metas por Bairro */}
          {abaAtiva === 'bairros' && (
            <div className="card p-6">
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 mx-auto text-[var(--text-muted)] opacity-50" />
                <h3 className="text-xl font-semibold mt-4">Metas por Bairro</h3>
                <p className="text-[var(--text-muted)] mt-2">
                  Funcionalidade em desenvolvimento. Em breve você poderá definir metas específicas por bairro dentro de cada zona eleitoral.
                </p>
                <button className="btn-primary mt-4" disabled>
                  Em Breve
                </button>
              </div>
            </div>
          )}

          {/* Comparativo Histórico */}
          {abaAtiva === 'historico' && (
            <div className="space-y-6">
              <div className="card p-4">
                <div className="flex items-center gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Selecione a Zona</label>
                    <select
                      value={filtroZona || ''}
                      onChange={(e) => setFiltroZona(e.target.value ? parseInt(e.target.value) : null)}
                      className="input w-48"
                    >
                      <option value="">Selecione uma zona</option>
                      {Array.from(new Set(metas.map(m => m.zona))).sort((a, b) => a - b).map(zona => (
                        <option key={zona} value={zona}>Zona {zona}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {filtroZona ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Evolução Histórica - Zona {filtroZona}
                    </h3>
                    {dadosHistoricoZona.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dadosHistoricoZona}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis dataKey="ano" />
                          <YAxis />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--bg-card)', 
                              border: '1px solid var(--border-color)' 
                            }}
                          />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="votos" 
                            name="Votos" 
                            stroke="#10B981" 
                            strokeWidth={2}
                            dot={{ fill: '#10B981', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-8 text-[var(--text-muted)]">
                        Não há dados históricos disponíveis para esta zona.
                      </div>
                    )}

                    {/* Comparativo com Meta */}
                    {metas.find(m => m.zona === filtroZona) && (
                      <div className="mt-6 p-4 bg-[var(--bg-card)] rounded-lg">
                        <h4 className="font-semibold mb-3">Comparativo com Meta Atual</h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-[var(--text-muted)]">Último Resultado</p>
                            <p className="text-xl font-bold">
                              {dadosHistoricoZona[dadosHistoricoZona.length - 1]?.votos.toLocaleString() || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-[var(--text-muted)]">Meta Atual</p>
                            <p className="text-xl font-bold text-emerald-500">
                              {metas.find(m => m.zona === filtroZona)?.metaVotos.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-[var(--text-muted)]">Variação Necessária</p>
                            {(() => {
                              const meta = metas.find(m => m.zona === filtroZona)
                              const ultimo = dadosHistoricoZona[dadosHistoricoZona.length - 1]?.votos || 0
                              const variacao = ultimo > 0 ? ((meta?.metaVotos || 0) - ultimo) / ultimo * 100 : 0
                              return (
                                <p className={`text-xl font-bold ${variacao > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                  {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
                                </p>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[var(--text-muted)]">
                    <Calendar className="w-12 h-12 mx-auto opacity-50 mb-4" />
                    <p>Selecione uma zona para ver o histórico de desempenho eleitoral.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Edição */}
      {modalAberto && metaEditando && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--bg-card)] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--border-color)]">
              <h2 className="text-xl font-bold">
                {metaEditando.id ? 'Editar Meta' : 'Nova Meta'}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Zona Eleitoral</label>
                  <input
                    type="number"
                    value={metaEditando.zona}
                    onChange={(e) => setMetaEditando({ ...metaEditando, zona: parseInt(e.target.value) || 0 })}
                    className="input w-full"
                    disabled={!!metaEditando.id}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Município</label>
                  <input
                    type="text"
                    value={metaEditando.municipio}
                    onChange={(e) => setMetaEditando({ ...metaEditando, municipio: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Meta de Votos</label>
                  <input
                    type="number"
                    value={metaEditando.metaVotos}
                    onChange={(e) => setMetaEditando({ ...metaEditando, metaVotos: parseInt(e.target.value) || 0 })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Meta Percentual (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={metaEditando.metaPercentual}
                    onChange={(e) => setMetaEditando({ ...metaEditando, metaPercentual: parseFloat(e.target.value) || 0 })}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Votos Anteriores</label>
                  <input
                    type="number"
                    value={metaEditando.votosAnteriores}
                    onChange={(e) => setMetaEditando({ ...metaEditando, votosAnteriores: parseInt(e.target.value) || 0 })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total de Eleitores</label>
                  <input
                    type="number"
                    value={metaEditando.totalEleitores}
                    onChange={(e) => setMetaEditando({ ...metaEditando, totalEleitores: parseInt(e.target.value) || 0 })}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Prioridade</label>
                  <select
                    value={metaEditando.prioridade}
                    onChange={(e) => setMetaEditando({ ...metaEditando, prioridade: e.target.value as any })}
                    className="input w-full"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Média</option>
                    <option value="baixa">Baixa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={metaEditando.status}
                    onChange={(e) => setMetaEditando({ ...metaEditando, status: e.target.value as any })}
                    className="input w-full"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluida">Concluída</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Progresso (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={metaEditando.progresso}
                    onChange={(e) => setMetaEditando({ ...metaEditando, progresso: parseInt(e.target.value) || 0 })}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Responsável</label>
                <input
                  type="text"
                  value={metaEditando.responsavel}
                  onChange={(e) => setMetaEditando({ ...metaEditando, responsavel: e.target.value })}
                  className="input w-full"
                  placeholder="Nome do responsável pela zona"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Estratégia</label>
                <textarea
                  value={metaEditando.estrategia}
                  onChange={(e) => setMetaEditando({ ...metaEditando, estrategia: e.target.value })}
                  className="input w-full h-24"
                  placeholder="Descreva a estratégia para atingir a meta nesta zona..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Observações</label>
                <textarea
                  value={metaEditando.observacoes}
                  onChange={(e) => setMetaEditando({ ...metaEditando, observacoes: e.target.value })}
                  className="input w-full h-20"
                  placeholder="Observações adicionais..."
                />
              </div>
            </div>
            <div className="p-6 border-t border-[var(--border-color)] flex justify-end gap-3">
              <button
                onClick={() => {
                  setModalAberto(false)
                  setMetaEditando(null)
                }}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button
                onClick={() => salvarMeta(metaEditando)}
                className="btn-primary flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
