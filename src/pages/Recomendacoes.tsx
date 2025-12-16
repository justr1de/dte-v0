import { useState } from 'react'
import Layout from '@/components/Layout'
import { 
  Target, 
  Lightbulb, 
  TrendingUp, 
  Users, 
  MapPin,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  Zap,
  MessageSquare,
  Share2,
  ThumbsUp
} from 'lucide-react'

interface Recomendacao {
  id: number
  titulo: string
  descricao: string
  tipo: 'estrategia' | 'comunicacao' | 'territorio' | 'evento'
  prioridade: 'alta' | 'media' | 'baixa'
  impacto_estimado: number
  publico_alvo: string
  prazo: string
  status: 'pendente' | 'em_andamento' | 'concluida'
  acoes: string[]
}

export default function Recomendacoes() {
  const [filtroTipo, setFiltroTipo] = useState('todos')
  const [filtroPrioridade, setFiltroPrioridade] = useState('todas')

  const recomendacoes: Recomendacao[] = [
    {
      id: 1,
      titulo: 'Intensificar presença na Zona Sul',
      descricao: 'Análise preditiva identificou alto potencial de conversão na Zona Sul. Recomenda-se aumentar a frequência de eventos e visitas na região.',
      tipo: 'territorio',
      prioridade: 'alta',
      impacto_estimado: 85,
      publico_alvo: 'Eleitores 25-44 anos',
      prazo: '2 semanas',
      status: 'pendente',
      acoes: [
        'Agendar 3 eventos comunitários',
        'Distribuir material em pontos estratégicos',
        'Parcerias com lideranças locais'
      ]
    },
    {
      id: 2,
      titulo: 'Campanha digital focada em jovens',
      descricao: 'Dados mostram baixo engajamento do público 18-24 anos. Criar conteúdo específico para TikTok e Instagram Reels.',
      tipo: 'comunicacao',
      prioridade: 'alta',
      impacto_estimado: 78,
      publico_alvo: 'Jovens 18-24 anos',
      prazo: '1 semana',
      status: 'em_andamento',
      acoes: [
        'Criar 10 vídeos curtos por semana',
        'Contratar influenciadores locais',
        'Responder comentários em até 2h'
      ]
    },
    {
      id: 3,
      titulo: 'Debate sobre saúde pública',
      descricao: 'Pesquisas indicam que saúde é a principal preocupação dos eleitores. Organizar debate público sobre o tema.',
      tipo: 'evento',
      prioridade: 'media',
      impacto_estimado: 72,
      publico_alvo: 'Eleitores 45+ anos',
      prazo: '3 semanas',
      status: 'pendente',
      acoes: [
        'Reservar local para evento',
        'Convidar especialistas',
        'Divulgar nas mídias tradicionais'
      ]
    },
    {
      id: 4,
      titulo: 'Reforçar proposta de emprego',
      descricao: 'Análise SWOT identificou oportunidade em propostas de geração de emprego. Destacar plano de desenvolvimento econômico.',
      tipo: 'estrategia',
      prioridade: 'alta',
      impacto_estimado: 90,
      publico_alvo: 'Desempregados e trabalhadores informais',
      prazo: '1 semana',
      status: 'concluida',
      acoes: [
        'Elaborar documento detalhado',
        'Gravar vídeo explicativo',
        'Preparar respostas para entrevistas'
      ]
    },
    {
      id: 5,
      titulo: 'Visitas a bairros periféricos',
      descricao: 'Baixa presença em bairros da periferia. Agendar caminhadas e visitas porta a porta.',
      tipo: 'territorio',
      prioridade: 'media',
      impacto_estimado: 65,
      publico_alvo: 'Moradores de áreas periféricas',
      prazo: '4 semanas',
      status: 'pendente',
      acoes: [
        'Mapear 10 bairros prioritários',
        'Organizar equipes de voluntários',
        'Preparar material específico'
      ]
    }
  ]

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'estrategia': return <Lightbulb className="w-5 h-5" />
      case 'comunicacao': return <MessageSquare className="w-5 h-5" />
      case 'territorio': return <MapPin className="w-5 h-5" />
      case 'evento': return <Calendar className="w-5 h-5" />
      default: return <Target className="w-5 h-5" />
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'estrategia': return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
      case 'comunicacao': return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
      case 'territorio': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
      case 'evento': return 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case 'alta': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
      case 'media': return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'baixa': return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'concluida': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'em_andamento': return <Clock className="w-5 h-5 text-yellow-500" />
      default: return <AlertTriangle className="w-5 h-5 text-gray-400" />
    }
  }

  const filteredRecomendacoes = recomendacoes.filter(r => {
    const matchesTipo = filtroTipo === 'todos' || r.tipo === filtroTipo
    const matchesPrioridade = filtroPrioridade === 'todas' || r.prioridade === filtroPrioridade
    return matchesTipo && matchesPrioridade
  })

  const stats = {
    total: recomendacoes.length,
    pendentes: recomendacoes.filter(r => r.status === 'pendente').length,
    emAndamento: recomendacoes.filter(r => r.status === 'em_andamento').length,
    concluidas: recomendacoes.filter(r => r.status === 'concluida').length,
    altaPrioridade: recomendacoes.filter(r => r.prioridade === 'alta').length
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-7 h-7 text-emerald-500" />
              Recomendações Estratégicas
            </h1>
            <p className="text-[var(--text-muted)]">
              Ações sugeridas baseadas em análise de dados e inteligência artificial
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-[var(--text-muted)]">Total</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.altaPrioridade}</p>
            <p className="text-sm text-[var(--text-muted)]">Alta Prioridade</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-500">{stats.pendentes}</p>
            <p className="text-sm text-[var(--text-muted)]">Pendentes</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-yellow-500">{stats.emAndamento}</p>
            <p className="text-sm text-[var(--text-muted)]">Em Andamento</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.concluidas}</p>
            <p className="text-sm text-[var(--text-muted)]">Concluídas</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm text-[var(--text-muted)] mb-1 block">Tipo</label>
              <select
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="input"
              >
                <option value="todos">Todos os tipos</option>
                <option value="estrategia">Estratégia</option>
                <option value="comunicacao">Comunicação</option>
                <option value="territorio">Território</option>
                <option value="evento">Evento</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-[var(--text-muted)] mb-1 block">Prioridade</label>
              <select
                value={filtroPrioridade}
                onChange={(e) => setFiltroPrioridade(e.target.value)}
                className="input"
              >
                <option value="todas">Todas</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Recomendações */}
        <div className="space-y-4">
          {filteredRecomendacoes.map((rec) => (
            <div key={rec.id} className="card p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Conteúdo Principal */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`p-2 rounded-lg ${getTipoColor(rec.tipo)}`}>
                      {getTipoIcon(rec.tipo)}
                    </span>
                    <h3 className="text-lg font-semibold">{rec.titulo}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPrioridadeColor(rec.prioridade)}`}>
                      {rec.prioridade.charAt(0).toUpperCase() + rec.prioridade.slice(1)} Prioridade
                    </span>
                    {getStatusIcon(rec.status)}
                  </div>

                  <p className="text-[var(--text-muted)] mb-4">{rec.descricao}</p>

                  <div className="flex flex-wrap gap-4 text-sm mb-4">
                    <span className="flex items-center gap-1 text-[var(--text-muted)]">
                      <Users className="w-4 h-4" />
                      {rec.publico_alvo}
                    </span>
                    <span className="flex items-center gap-1 text-[var(--text-muted)]">
                      <Clock className="w-4 h-4" />
                      Prazo: {rec.prazo}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600">
                      <TrendingUp className="w-4 h-4" />
                      Impacto: {rec.impacto_estimado}%
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Ações Recomendadas:</p>
                    {rec.acoes.map((acao, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <ArrowRight className="w-4 h-4 text-emerald-500" />
                        {acao}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Barra de Impacto e Ações */}
                <div className="lg:w-48 flex flex-col items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${rec.impacto_estimado * 2.51} 251`}
                          className="text-emerald-500"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xl font-bold">{rec.impacto_estimado}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mt-2">Impacto Estimado</p>
                  </div>

                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors" title="Aprovar">
                      <ThumbsUp className="w-5 h-5 text-green-500" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors" title="Executar">
                      <Zap className="w-5 h-5 text-yellow-500" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors" title="Compartilhar">
                      <Share2 className="w-5 h-5 text-blue-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
