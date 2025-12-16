import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  MapPin,
  Users,
  Target,
  Brain,
  RefreshCw,
  Download,
  Filter
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'

interface AnaliseRegiao {
  bairro: string
  zona: string
  score_potencial: number
  tendencia: 'alta' | 'estavel' | 'baixa'
  perfil_predominante: {
    faixa_etaria: string
    genero: string
    escolaridade: string
  }
  recomendacoes: string[]
}

export default function AnalisePreditiva() {
  const [loading, setLoading] = useState(true)
  const [analises, setAnalises] = useState<AnaliseRegiao[]>([])
  const [selectedZona, setSelectedZona] = useState('todas')
  const [processando, setProcessando] = useState(false)

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  useEffect(() => {
    fetchAnalises()
  }, [])

  const fetchAnalises = async () => {
    try {
      const { data, error } = await supabase
        .from('analises_preditivas')
        .select('*')
        .order('score_potencial', { ascending: false })

      if (error) throw error
      
      // Mapear dados para o formato esperado
      const mapped = (data || []).map(d => ({
        bairro: d.bairro,
        zona: d.zona,
        score_potencial: d.score_potencial,
        tendencia: (d.score_potencial > 70 ? 'alta' : d.score_potencial > 40 ? 'estavel' : 'baixa') as 'alta' | 'estavel' | 'baixa',
        perfil_predominante: d.perfil_predominante || {},
        recomendacoes: d.recomendacoes || []
      }))
      
      setAnalises(mapped.length > 0 ? mapped : gerarDadosDemo())
    } catch (error) {
      console.error('Erro ao carregar análises:', error)
      setAnalises(gerarDadosDemo())
    } finally {
      setLoading(false)
    }
  }

  const gerarDadosDemo = (): AnaliseRegiao[] => [
    {
      bairro: 'Centro',
      zona: '001',
      score_potencial: 85,
      tendencia: 'alta',
      perfil_predominante: { faixa_etaria: '35-44', genero: 'Feminino', escolaridade: 'Superior' },
      recomendacoes: ['Focar em propostas de mobilidade urbana', 'Eventos em horário comercial', 'Comunicação via redes sociais']
    },
    {
      bairro: 'Zona Sul',
      zona: '002',
      score_potencial: 72,
      tendencia: 'alta',
      perfil_predominante: { faixa_etaria: '25-34', genero: 'Masculino', escolaridade: 'Médio' },
      recomendacoes: ['Propostas de emprego e renda', 'Presença em eventos esportivos', 'Panfletagem em pontos de ônibus']
    },
    {
      bairro: 'Zona Norte',
      zona: '003',
      score_potencial: 58,
      tendencia: 'estavel',
      perfil_predominante: { faixa_etaria: '45-59', genero: 'Feminino', escolaridade: 'Fundamental' },
      recomendacoes: ['Propostas de saúde e segurança', 'Visitas porta a porta', 'Rádio e TV local']
    },
    {
      bairro: 'Zona Leste',
      zona: '004',
      score_potencial: 45,
      tendencia: 'baixa',
      perfil_predominante: { faixa_etaria: '18-24', genero: 'Masculino', escolaridade: 'Médio' },
      recomendacoes: ['Propostas de educação e primeiro emprego', 'Presença em universidades', 'TikTok e Instagram']
    },
    {
      bairro: 'Zona Oeste',
      zona: '005',
      score_potencial: 63,
      tendencia: 'estavel',
      perfil_predominante: { faixa_etaria: '35-44', genero: 'Feminino', escolaridade: 'Superior' },
      recomendacoes: ['Propostas de infraestrutura', 'Eventos comunitários', 'WhatsApp e grupos locais']
    }
  ]

  const processarAnalise = async () => {
    setProcessando(true)
    // Simular processamento de ML
    await new Promise(resolve => setTimeout(resolve, 3000))
    await fetchAnalises()
    setProcessando(false)
  }

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'alta': return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'baixa': return <TrendingDown className="w-5 h-5 text-red-500" />
      default: return <Minus className="w-5 h-5 text-yellow-500" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500'
    if (score >= 40) return 'text-yellow-500'
    return 'text-red-500'
  }

  const filteredAnalises = selectedZona === 'todas' 
    ? analises 
    : analises.filter(a => a.zona === selectedZona)

  // Dados para gráficos
  const dadosBarras = filteredAnalises.map(a => ({
    name: a.bairro,
    score: a.score_potencial
  }))

  const dadosPizza = [
    { name: 'Alto Potencial', value: analises.filter(a => a.score_potencial >= 70).length },
    { name: 'Médio Potencial', value: analises.filter(a => a.score_potencial >= 40 && a.score_potencial < 70).length },
    { name: 'Baixo Potencial', value: analises.filter(a => a.score_potencial < 40).length }
  ]

  const dadosRadar = [
    { subject: 'Engajamento', A: 85, fullMark: 100 },
    { subject: 'Alcance', A: 72, fullMark: 100 },
    { subject: 'Conversão', A: 65, fullMark: 100 },
    { subject: 'Retenção', A: 78, fullMark: 100 },
    { subject: 'Satisfação', A: 82, fullMark: 100 },
  ]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-7 h-7 text-emerald-500" />
              Análise Preditiva
            </h1>
            <p className="text-[var(--text-muted)]">
              Inteligência artificial para identificar oportunidades eleitorais
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={processarAnalise}
              disabled={processando}
              className="btn-primary flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${processando ? 'animate-spin' : ''}`} />
              {processando ? 'Processando...' : 'Atualizar Análise'}
            </button>
            <button className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="card p-4">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-[var(--text-muted)]" />
            <select
              value={selectedZona}
              onChange={(e) => setSelectedZona(e.target.value)}
              className="input"
            >
              <option value="todas">Todas as Zonas</option>
              {[...new Set(analises.map(a => a.zona))].map(zona => (
                <option key={zona} value={zona}>Zona {zona}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Alto Potencial</p>
                <p className="text-xl font-bold">{analises.filter(a => a.score_potencial >= 70).length} regiões</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Minus className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Médio Potencial</p>
                <p className="text-xl font-bold">{analises.filter(a => a.score_potencial >= 40 && a.score_potencial < 70).length} regiões</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Score Médio</p>
                <p className="text-xl font-bold">
                  {analises.length > 0 
                    ? Math.round(analises.reduce((acc, a) => acc + a.score_potencial, 0) / analises.length)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <MapPin className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-muted)]">Regiões Analisadas</p>
                <p className="text-xl font-bold">{analises.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score por Região */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Score de Potencial por Região</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dadosBarras}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="score" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribuição de Potencial */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Distribuição de Potencial</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dadosPizza}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dadosPizza.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Radar de Performance */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Indicadores de Campanha</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={dadosRadar}>
                <PolarGrid stroke="var(--border-color)" />
                <PolarAngleAxis dataKey="subject" stroke="var(--text-muted)" fontSize={12} />
                <PolarRadiusAxis stroke="var(--text-muted)" fontSize={10} />
                <Radar name="Performance" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Tendências */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Evolução do Engajamento</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={[
                { mes: 'Jan', engajamento: 45 },
                { mes: 'Fev', engajamento: 52 },
                { mes: 'Mar', engajamento: 58 },
                { mes: 'Abr', engajamento: 63 },
                { mes: 'Mai', engajamento: 71 },
                { mes: 'Jun', engajamento: 78 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="mes" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                />
                <Line type="monotone" dataKey="engajamento" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lista de Regiões */}
        <div className="card">
          <div className="p-4 border-b border-[var(--border-color)]">
            <h3 className="text-lg font-semibold">Análise Detalhada por Região</h3>
          </div>
          <div className="divide-y divide-[var(--border-color)]">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-4 text-[var(--text-muted)]">Carregando análises...</p>
              </div>
            ) : (
              filteredAnalises.map((analise, index) => (
                <div key={index} className="p-4 hover:bg-[var(--bg-secondary)] transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <MapPin className="w-5 h-5 text-emerald-500" />
                        <h4 className="font-semibold">{analise.bairro}</h4>
                        <span className="text-sm text-[var(--text-muted)]">Zona {analise.zona}</span>
                        {getTendenciaIcon(analise.tendencia)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {analise.perfil_predominante.faixa_etaria} anos
                        </span>
                        <span>{analise.perfil_predominante.genero}</span>
                        <span>{analise.perfil_predominante.escolaridade}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm text-[var(--text-muted)]">Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(analise.score_potencial)}`}>
                          {analise.score_potencial}%
                        </p>
                      </div>
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            analise.score_potencial >= 70 ? 'bg-green-500' :
                            analise.score_potencial >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${analise.score_potencial}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  {analise.recomendacoes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[var(--border-color)]">
                      <p className="text-sm font-medium mb-2">Recomendações:</p>
                      <div className="flex flex-wrap gap-2">
                        {analise.recomendacoes.map((rec, i) => (
                          <span key={i} className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded">
                            {rec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
