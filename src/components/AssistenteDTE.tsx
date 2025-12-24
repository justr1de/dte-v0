import { useState, useRef, useEffect } from 'react'
import { 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2,
  Sparkles,
  Minimize2,
  Maximize2,
  Trash2,
  Copy,
  Check,
  TrendingUp,
  MapPin,
  Users,
  Target,
  BarChart3,
  AlertTriangle,
  Zap
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface SuggestionChip {
  label: string
  query: string
  icon?: string
}

const SUGGESTION_CHIPS: SuggestionChip[] = [
  { label: '📊 Resumo 2024', query: 'Resumo das eleições 2024' },
  { label: '🎯 Análise territorial', query: 'Análise territorial de Porto Velho' },
  { label: '👥 Perfil eleitorado', query: 'Perfil do eleitorado de Rondônia' },
  { label: '📈 Comparativo histórico', query: 'Comparativo de votos 2020 vs 2024' },
  { label: '🏆 Top candidatos', query: 'Top 10 prefeitos mais votados 2024' },
  { label: '🗳️ Zonas eleitorais', query: 'Análise por zona eleitoral de Porto Velho' },
  { label: '⚡ Zonas prioritárias', query: 'Quais são as zonas prioritárias para campanha?' },
  { label: '📍 Mapa de força', query: 'Mapa de força eleitoral de Ji-Paraná' },
]

export default function AssistenteDTE() {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { user } = useAuth()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  useEffect(() => {
    const saved = localStorage.getItem('dte-assistant-messages')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })))
      } catch (e) {
        console.error('Error loading messages:', e)
      }
    }
  }, [])

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('dte-assistant-messages', JSON.stringify(messages))
    }
  }, [messages])

  const clearMessages = () => {
    setMessages([])
    localStorage.removeItem('dte-assistant-messages')
  }

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Função para extrair nome de candidato
  const extractCandidatoName = (query: string): string | null => {
    const lowerQuery = query.toLowerCase()
    const nomes = [
      { search: ['rafael fera', 'rafael bento'], name: 'RAFAEL FERA' },
      { search: ['mariana carvalho'], name: 'MARIANA CARVALHO' },
      { search: ['marcos rocha'], name: 'MARCOS ROCHA' },
      { search: ['hildon chaves'], name: 'HILDON CHAVES' },
      { search: ['léo moraes', 'leo moraes'], name: 'LÉO MORAES' },
      { search: ['fernando máximo', 'dr fernando'], name: 'DR FERNANDO MÁXIMO' },
      { search: ['silvia cristina'], name: 'SILVIA CRISTINA' },
      { search: ['lucio mosquini'], name: 'LUCIO MOSQUINI' },
    ]
    for (const n of nomes) {
      if (n.search.some(s => lowerQuery.includes(s))) return n.name
    }
    
    const patterns = [
      /sobre\s+(?:o\s+)?(?:candidato\s+)?([A-Za-zÀ-ÿ\s]+?)(?:\?|$|,|do\s+)/i,
      /informações\s+(?:de|sobre)\s+([A-Za-zÀ-ÿ\s]+?)(?:\?|$|,)/i,
      /dados\s+(?:de|do|da)\s+([A-Za-zÀ-ÿ\s]+?)(?:\?|$|,)/i,
      /votos\s+(?:de|do|da)\s+([A-Za-zÀ-ÿ\s]+?)(?:\?|$|,)/i,
    ]
    for (const pattern of patterns) {
      const match = query.match(pattern)
      if (match && match[1] && match[1].trim().length > 3) {
        const name = match[1].trim()
        if (!['o', 'a', 'os', 'as', 'de', 'da', 'do', 'em', 'no', 'na', 'que', 'como', 'qual', 'quais'].includes(name.toLowerCase())) {
          return name.toUpperCase()
        }
      }
    }
    return null
  }

  // Função para extrair município
  const extractMunicipioName = (query: string): string | null => {
    const municipios = [
      'porto velho', 'ji-paraná', 'ariquemes', 'cacoal', 'vilhena', 'rolim de moura',
      'guajará-mirim', 'jaru', 'ouro preto do oeste', 'pimenta bueno', 'buritis',
      'nova mamoré', 'machadinho', 'espigão do oeste', 'alta floresta', 'colorado',
      'cerejeiras', 'são miguel do guaporé', 'presidente médici', 'alto alegre',
      'candeias do jamari', 'itapuã do oeste', 'nova união', 'mirante da serra',
      'monte negro', 'cujubim', 'governador jorge teixeira', 'theobroma', 'vale do paraíso',
      'teixeirópolis', 'urupá', 'primavera de rondônia', 'castanheiras', 'parecis',
      'alto paraíso', 'são francisco do guaporé', 'seringueiras', 'costa marques',
      'são felipe do oeste', 'novo horizonte do oeste', 'santa luzia do oeste',
      'alvorada do oeste', 'campo novo de rondônia', 'cacaulândia', 'chupinguaia',
      'corumbiara', 'pimenteiras do oeste', 'cabixi', 'ministro andreazza'
    ]
    const lowerQuery = query.toLowerCase()
    for (const municipio of municipios) {
      if (lowerQuery.includes(municipio)) {
        return municipio.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').toUpperCase()
      }
    }
    return null
  }

  // ==================== FUNÇÕES DE BUSCA ====================

  // Buscar candidato específico
  const buscarCandidato = async (nome: string) => {
    const { data } = await supabase
      .from('boletins_urna')
      .select('nm_votavel, sg_partido, nm_municipio, cd_cargo_pergunta, ds_cargo_pergunta, qt_votos, ano_eleicao, nr_zona')
      .ilike('nm_votavel', `%${nome}%`)
      .eq('sg_uf', 'RO')
      .order('qt_votos', { ascending: false })
      .limit(1000)

    if (!data || data.length === 0) return null

    const candidatoInfo: any = {}
    data.forEach(row => {
      const key = `${row.nm_votavel}-${row.cd_cargo_pergunta}-${row.ano_eleicao}`
      if (!candidatoInfo[key]) {
        candidatoInfo[key] = {
          nome: row.nm_votavel,
          partido: row.sg_partido,
          cargo: row.ds_cargo_pergunta,
          ano: row.ano_eleicao,
          totalVotos: 0,
          votosPorMunicipio: {} as any,
          votosPorZona: {} as any
        }
      }
      candidatoInfo[key].totalVotos += row.qt_votos || 0
      
      // Agrupar por município
      if (!candidatoInfo[key].votosPorMunicipio[row.nm_municipio]) {
        candidatoInfo[key].votosPorMunicipio[row.nm_municipio] = 0
      }
      candidatoInfo[key].votosPorMunicipio[row.nm_municipio] += row.qt_votos || 0
      
      // Agrupar por zona
      const zonaKey = `${row.nm_municipio}-Z${row.nr_zona}`
      if (!candidatoInfo[key].votosPorZona[zonaKey]) {
        candidatoInfo[key].votosPorZona[zonaKey] = 0
      }
      candidatoInfo[key].votosPorZona[zonaKey] += row.qt_votos || 0
    })

    return Object.values(candidatoInfo)
  }

  // Análise territorial por município
  const analiseTerritorial = async (municipio: string) => {
    // Buscar dados de comparecimento
    const { data: comparecimento } = await supabase
      .from('comparecimento_abstencao')
      .select('*')
      .ilike('nm_municipio', `%${municipio}%`)
      .eq('sg_uf', 'RO')
      .eq('ano_eleicao', 2024)
      .eq('nr_turno', 1)

    // Buscar top candidatos do município
    const { data: candidatos } = await supabase
      .from('boletins_urna')
      .select('nm_votavel, sg_partido, qt_votos, cd_cargo_pergunta')
      .ilike('nm_municipio', `%${municipio}%`)
      .eq('sg_uf', 'RO')
      .eq('ano_eleicao', 2024)
      .eq('nr_turno', 1)
      .order('qt_votos', { ascending: false })
      .limit(500)

    if (!comparecimento || comparecimento.length === 0) return null

    const totalAptos = comparecimento.reduce((acc, r) => acc + (r.qt_aptos || 0), 0)
    const totalComparecimento = comparecimento.reduce((acc, r) => acc + (r.qt_comparecimento || 0), 0)
    const totalAbstencao = comparecimento.reduce((acc, r) => acc + (r.qt_abstencoes || 0), 0)

    // Agrupar candidatos por cargo
    const prefeitos: any = {}
    const vereadores: any = {}
    candidatos?.forEach(c => {
      if (c.nm_votavel && c.nm_votavel !== 'Branco' && c.nm_votavel !== 'Nulo') {
        if (c.cd_cargo_pergunta === 11) {
          if (!prefeitos[c.nm_votavel]) prefeitos[c.nm_votavel] = { nome: c.nm_votavel, partido: c.sg_partido, votos: 0 }
          prefeitos[c.nm_votavel].votos += c.qt_votos || 0
        } else if (c.cd_cargo_pergunta === 13) {
          if (!vereadores[c.nm_votavel]) vereadores[c.nm_votavel] = { nome: c.nm_votavel, partido: c.sg_partido, votos: 0 }
          vereadores[c.nm_votavel].votos += c.qt_votos || 0
        }
      }
    })

    return {
      municipio: comparecimento[0]?.nm_municipio || municipio,
      eleitorado: {
        total: totalAptos,
        comparecimento: totalComparecimento,
        abstencao: totalAbstencao,
        taxaParticipacao: totalAptos > 0 ? ((totalComparecimento / totalAptos) * 100).toFixed(1) : '0'
      },
      prefeitos: Object.values(prefeitos).sort((a: any, b: any) => b.votos - a.votos).slice(0, 5),
      vereadores: Object.values(vereadores).sort((a: any, b: any) => b.votos - a.votos).slice(0, 10)
    }
  }

  // Análise por zona eleitoral
  const analiseZonaEleitoral = async (municipio: string) => {
    const { data } = await supabase
      .from('boletins_urna')
      .select('nr_zona, nm_votavel, sg_partido, qt_votos, cd_cargo_pergunta')
      .ilike('nm_municipio', `%${municipio}%`)
      .eq('sg_uf', 'RO')
      .eq('ano_eleicao', 2024)
      .eq('nr_turno', 1)
      .eq('cd_cargo_pergunta', 11)
      .order('nr_zona')
      .limit(2000)

    if (!data || data.length === 0) return null

    const zonas: any = {}
    data.forEach(row => {
      if (!zonas[row.nr_zona]) {
        zonas[row.nr_zona] = { zona: row.nr_zona, candidatos: {}, totalVotos: 0 }
      }
      if (row.nm_votavel && row.nm_votavel !== 'Branco' && row.nm_votavel !== 'Nulo') {
        if (!zonas[row.nr_zona].candidatos[row.nm_votavel]) {
          zonas[row.nr_zona].candidatos[row.nm_votavel] = { nome: row.nm_votavel, partido: row.sg_partido, votos: 0 }
        }
        zonas[row.nr_zona].candidatos[row.nm_votavel].votos += row.qt_votos || 0
        zonas[row.nr_zona].totalVotos += row.qt_votos || 0
      }
    })

    return Object.values(zonas).map((z: any) => ({
      zona: z.zona,
      totalVotos: z.totalVotos,
      candidatos: Object.values(z.candidatos).sort((a: any, b: any) => b.votos - a.votos).slice(0, 3)
    }))
  }

  // Zonas prioritárias para campanha
  const buscarZonasPrioritarias = async () => {
    const { data } = await supabase
      .from('comparecimento_abstencao')
      .select('nr_zona, nm_municipio, qt_aptos, qt_comparecimento, qt_abstencoes')
      .eq('sg_uf', 'RO')
      .eq('ano_eleicao', 2024)
      .eq('nr_turno', 1)
      .order('qt_aptos', { ascending: false })
      .limit(100)

    if (!data || data.length === 0) return null

    // Agrupar por zona
    const zonas: any = {}
    data.forEach(row => {
      if (!zonas[row.nr_zona]) {
        zonas[row.nr_zona] = {
          zona: row.nr_zona,
          municipios: [],
          totalAptos: 0,
          totalComparecimento: 0,
          totalAbstencao: 0
        }
      }
      zonas[row.nr_zona].totalAptos += row.qt_aptos || 0
      zonas[row.nr_zona].totalComparecimento += row.qt_comparecimento || 0
      zonas[row.nr_zona].totalAbstencao += row.qt_abstencoes || 0
      if (!zonas[row.nr_zona].municipios.includes(row.nm_municipio)) {
        zonas[row.nr_zona].municipios.push(row.nm_municipio)
      }
    })

    // Calcular métricas e classificar
    const zonasArray = Object.values(zonas).map((z: any) => {
      const taxaParticipacao = z.totalAptos > 0 ? (z.totalComparecimento / z.totalAptos) * 100 : 0
      const taxaAbstencao = z.totalAptos > 0 ? (z.totalAbstencao / z.totalAptos) * 100 : 0
      
      let prioridade = 'MÉDIA'
      let motivo = ''
      
      if (z.totalAptos > 50000 && taxaParticipacao < 75) {
        prioridade = 'ALTA'
        motivo = 'Grande eleitorado com participação abaixo da média'
      } else if (taxaAbstencao > 28) {
        prioridade = 'ALTA'
        motivo = 'Alta taxa de abstenção - potencial de mobilização'
      } else if (z.totalAptos > 30000) {
        prioridade = 'MÉDIA-ALTA'
        motivo = 'Eleitorado significativo'
      }

      return {
        ...z,
        taxaParticipacao: taxaParticipacao.toFixed(1),
        taxaAbstencao: taxaAbstencao.toFixed(1),
        prioridade,
        motivo
      }
    })

    return zonasArray.sort((a: any, b: any) => b.totalAptos - a.totalAptos)
  }

  // Mapa de força eleitoral
  const mapaForcaEleitoral = async (municipio: string) => {
    // Buscar votos por candidato e zona
    const { data: votos } = await supabase
      .from('boletins_urna')
      .select('nr_zona, nr_secao, nm_votavel, sg_partido, qt_votos')
      .ilike('nm_municipio', `%${municipio}%`)
      .eq('sg_uf', 'RO')
      .eq('ano_eleicao', 2024)
      .eq('nr_turno', 1)
      .eq('cd_cargo_pergunta', 11)
      .limit(3000)

    // Buscar comparecimento
    const { data: comparecimento } = await supabase
      .from('comparecimento_abstencao')
      .select('nr_zona, qt_aptos, qt_comparecimento')
      .ilike('nm_municipio', `%${municipio}%`)
      .eq('sg_uf', 'RO')
      .eq('ano_eleicao', 2024)
      .eq('nr_turno', 1)

    if (!votos || votos.length === 0) return null

    // Agrupar por zona
    const zonas: any = {}
    votos.forEach(v => {
      if (!zonas[v.nr_zona]) {
        zonas[v.nr_zona] = { zona: v.nr_zona, candidatos: {}, totalVotos: 0 }
      }
      if (v.nm_votavel && v.nm_votavel !== 'Branco' && v.nm_votavel !== 'Nulo') {
        if (!zonas[v.nr_zona].candidatos[v.nm_votavel]) {
          zonas[v.nr_zona].candidatos[v.nm_votavel] = { nome: v.nm_votavel, partido: v.sg_partido, votos: 0 }
        }
        zonas[v.nr_zona].candidatos[v.nm_votavel].votos += v.qt_votos || 0
        zonas[v.nr_zona].totalVotos += v.qt_votos || 0
      }
    })

    // Adicionar dados de comparecimento
    comparecimento?.forEach(c => {
      if (zonas[c.nr_zona]) {
        zonas[c.nr_zona].eleitores = c.qt_aptos
        zonas[c.nr_zona].comparecimento = c.qt_comparecimento
      }
    })

    // Analisar força por zona
    return Object.values(zonas).map((z: any) => {
      const candidatosOrdenados = Object.values(z.candidatos).sort((a: any, b: any) => b.votos - a.votos)
      const lider = candidatosOrdenados[0] as any
      const segundo = candidatosOrdenados[1] as any
      
      const vantagem = lider && segundo ? ((lider.votos - segundo.votos) / z.totalVotos * 100).toFixed(1) : '100'
      const dominio = lider ? ((lider.votos / z.totalVotos) * 100).toFixed(1) : '0'

      return {
        zona: z.zona,
        eleitores: z.eleitores || 0,
        totalVotos: z.totalVotos,
        lider: lider?.nome || 'N/A',
        partidoLider: lider?.partido || 'N/A',
        votosLider: lider?.votos || 0,
        dominio: dominio,
        vantagem: vantagem,
        segundo: segundo?.nome || 'N/A',
        votosSegundo: segundo?.votos || 0
      }
    }).sort((a: any, b: any) => b.eleitores - a.eleitores)
  }

  // Comparativo histórico
  const comparativoHistorico = async (municipio?: string) => {
    const anos = [2020, 2024]
    const resultados: any = {}

    for (const ano of anos) {
      let query = supabase
        .from('comparecimento_abstencao')
        .select('qt_aptos, qt_comparecimento, qt_abstencoes')
        .eq('sg_uf', 'RO')
        .eq('ano_eleicao', ano)
        .eq('nr_turno', 1)

      if (municipio) {
        query = query.ilike('nm_municipio', `%${municipio}%`)
      }

      const { data } = await query.limit(100)

      if (data) {
        resultados[ano] = {
          eleitores: data.reduce((acc, r) => acc + (r.qt_aptos || 0), 0),
          comparecimento: data.reduce((acc, r) => acc + (r.qt_comparecimento || 0), 0),
          abstencao: data.reduce((acc, r) => acc + (r.qt_abstencoes || 0), 0)
        }
      }
    }

    return resultados
  }

  // Top prefeitos 2024
  const buscarTopPrefeitos = async (limite: number = 10) => {
    const { data } = await supabase
      .from('boletins_urna')
      .select('nm_votavel, sg_partido, nm_municipio, qt_votos')
      .eq('sg_uf', 'RO')
      .eq('cd_cargo_pergunta', 11)
      .eq('ano_eleicao', 2024)
      .eq('nr_turno', 1)
      .order('qt_votos', { ascending: false })
      .limit(500)

    if (!data) return null

    const prefTotals: any = {}
    data.forEach(p => {
      if (p.nm_votavel && p.nm_votavel !== 'Branco' && p.nm_votavel !== 'Nulo') {
        const key = `${p.nm_votavel}-${p.nm_municipio}`
        if (!prefTotals[key]) {
          prefTotals[key] = { nome: p.nm_votavel, partido: p.sg_partido, municipio: p.nm_municipio, votos: 0 }
        }
        prefTotals[key].votos += p.qt_votos || 0
      }
    })

    return Object.values(prefTotals).sort((a: any, b: any) => b.votos - a.votos).slice(0, limite)
  }

  // Top vereadores 2024
  const buscarTopVereadores = async (municipio?: string, limite: number = 10) => {
    let query = supabase
      .from('boletins_urna')
      .select('nm_votavel, sg_partido, nm_municipio, qt_votos')
      .eq('sg_uf', 'RO')
      .eq('cd_cargo_pergunta', 13)
      .eq('ano_eleicao', 2024)
      .eq('nr_turno', 1)
      .order('qt_votos', { ascending: false })

    if (municipio) {
      query = query.ilike('nm_municipio', `%${municipio}%`)
    }

    const { data } = await query.limit(500)

    if (!data) return null

    const verTotals: any = {}
    data.forEach(v => {
      if (v.nm_votavel && v.nm_votavel !== 'Branco' && v.nm_votavel !== 'Nulo') {
        const key = `${v.nm_votavel}-${v.nm_municipio}`
        if (!verTotals[key]) {
          verTotals[key] = { nome: v.nm_votavel, partido: v.sg_partido, municipio: v.nm_municipio, votos: 0 }
        }
        verTotals[key].votos += v.qt_votos || 0
      }
    })

    return Object.values(verTotals).sort((a: any, b: any) => b.votos - a.votos).slice(0, limite)
  }

  // Deputados federais
  const buscarDeputadosFederais = async () => {
    const { data } = await supabase
      .from('boletins_urna')
      .select('nm_votavel, sg_partido, qt_votos')
      .eq('sg_uf', 'RO')
      .eq('cd_cargo_pergunta', 6)
      .eq('ano_eleicao', 2022)
      .order('qt_votos', { ascending: false })
      .limit(1000)

    if (!data) return null

    const deputadoTotals: any = {}
    data.forEach(d => {
      if (d.nm_votavel && d.nm_votavel !== 'Branco' && d.nm_votavel !== 'Nulo') {
        if (!deputadoTotals[d.nm_votavel]) {
          deputadoTotals[d.nm_votavel] = { nome: d.nm_votavel, partido: d.sg_partido, votos: 0 }
        }
        deputadoTotals[d.nm_votavel].votos += d.qt_votos || 0
      }
    })

    return Object.values(deputadoTotals).sort((a: any, b: any) => b.votos - a.votos).slice(0, 15)
  }

  // Deputados estaduais
  const buscarDeputadosEstaduais = async () => {
    const { data } = await supabase
      .from('boletins_urna')
      .select('nm_votavel, sg_partido, qt_votos')
      .eq('sg_uf', 'RO')
      .eq('cd_cargo_pergunta', 7)
      .eq('ano_eleicao', 2022)
      .order('qt_votos', { ascending: false })
      .limit(1000)

    if (!data) return null

    const deputadoTotals: any = {}
    data.forEach(d => {
      if (d.nm_votavel && d.nm_votavel !== 'Branco' && d.nm_votavel !== 'Nulo') {
        if (!deputadoTotals[d.nm_votavel]) {
          deputadoTotals[d.nm_votavel] = { nome: d.nm_votavel, partido: d.sg_partido, votos: 0 }
        }
        deputadoTotals[d.nm_votavel].votos += d.qt_votos || 0
      }
    })

    return Object.values(deputadoTotals).sort((a: any, b: any) => b.votos - a.votos).slice(0, 15)
  }

  // Governador 2022
  const buscarGovernador = async () => {
    const { data } = await supabase
      .from('boletins_urna')
      .select('nm_votavel, sg_partido, qt_votos')
      .eq('sg_uf', 'RO')
      .eq('cd_cargo_pergunta', 3)
      .eq('ano_eleicao', 2022)
      .order('qt_votos', { ascending: false })
      .limit(500)

    if (!data) return null

    const govTotals: any = {}
    data.forEach(g => {
      if (g.nm_votavel && g.nm_votavel !== 'Branco' && g.nm_votavel !== 'Nulo') {
        if (!govTotals[g.nm_votavel]) {
          govTotals[g.nm_votavel] = { nome: g.nm_votavel, partido: g.sg_partido, votos: 0 }
        }
        govTotals[g.nm_votavel].votos += g.qt_votos || 0
      }
    })

    return Object.values(govTotals).sort((a: any, b: any) => b.votos - a.votos).slice(0, 10)
  }

  // Resumo geral 2024
  const buscarResumo2024 = async () => {
    const { data } = await supabase
      .from('comparecimento_abstencao')
      .select('qt_aptos, qt_comparecimento, qt_abstencoes')
      .eq('sg_uf', 'RO')
      .eq('ano_eleicao', 2024)
      .eq('nr_turno', 1)
      .limit(100)

    if (!data) return null

    return {
      totalEleitores: data.reduce((acc, r) => acc + (r.qt_aptos || 0), 0),
      comparecimento: data.reduce((acc, r) => acc + (r.qt_comparecimento || 0), 0),
      abstencoes: data.reduce((acc, r) => acc + (r.qt_abstencoes || 0), 0)
    }
  }

  // Partidos mais votados
  const buscarPartidos = async () => {
    const { data } = await supabase
      .from('boletins_urna')
      .select('sg_partido, qt_votos')
      .eq('sg_uf', 'RO')
      .eq('cd_cargo_pergunta', 11)
      .eq('ano_eleicao', 2024)
      .eq('nr_turno', 1)
      .limit(5000)

    if (!data) return null

    const partidoTotals: { [key: string]: number } = {}
    data.forEach(p => {
      if (p.sg_partido && p.sg_partido !== '#NULO#') {
        partidoTotals[p.sg_partido] = (partidoTotals[p.sg_partido] || 0) + (p.qt_votos || 0)
      }
    })

    return Object.entries(partidoTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([partido, votos]) => ({ partido, votos }))
  }

  // ==================== PROCESSAMENTO DE CONSULTAS ====================

  const processarConsulta = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase()

    try {
      // Candidato específico
      const candidatoNome = extractCandidatoName(query)
      if (candidatoNome && !lowerQuery.includes('prefeito') && !lowerQuery.includes('vereador') && !lowerQuery.includes('top')) {
        const candidatos = await buscarCandidato(candidatoNome)
        if (candidatos && candidatos.length > 0) {
          let response = ''
          candidatos.forEach((c: any) => {
            response += `📊 **${c.nome}**\n\n`
            response += `🏛️ **Partido:** ${c.partido}\n`
            response += `📋 **Cargo:** ${c.cargo}\n`
            response += `📅 **Ano:** ${c.ano}\n`
            response += `🗳️ **Total de Votos:** ${c.totalVotos.toLocaleString('pt-BR')}\n\n`
            
            const municipios = Object.entries(c.votosPorMunicipio)
              .sort((a: any, b: any) => b[1] - a[1])
              .slice(0, 5)
            
            if (municipios.length > 0) {
              response += `📍 **Top Municípios:**\n`
              municipios.forEach(([mun, votos]: any, i: number) => {
                const pct = ((votos / c.totalVotos) * 100).toFixed(1)
                response += `${i + 1}. ${mun}: ${votos.toLocaleString('pt-BR')} votos (${pct}%)\n`
              })
            }
            response += '\n'
          })
          return response
        }
      }

      // Zonas prioritárias
      if (lowerQuery.includes('zona') && (lowerQuery.includes('prioritária') || lowerQuery.includes('prioritaria') || lowerQuery.includes('prioridade'))) {
        const zonas = await buscarZonasPrioritarias()
        if (zonas && zonas.length > 0) {
          let response = `⚡ **Zonas Prioritárias para Campanha - RO 2024**\n\n`
          response += `*Análise baseada em eleitorado e taxa de participação*\n\n`
          
          const altaPrioridade = zonas.filter((z: any) => z.prioridade === 'ALTA')
          const mediaAlta = zonas.filter((z: any) => z.prioridade === 'MÉDIA-ALTA')
          
          if (altaPrioridade.length > 0) {
            response += `🔴 **ALTA PRIORIDADE:**\n`
            altaPrioridade.slice(0, 5).forEach((z: any) => {
              response += `• **Zona ${z.zona}** (${z.municipios.slice(0, 2).join(', ')})\n`
              response += `  Eleitores: ${z.totalAptos.toLocaleString('pt-BR')} | Participação: ${z.taxaParticipacao}%\n`
              response += `  📌 ${z.motivo}\n\n`
            })
          }
          
          if (mediaAlta.length > 0) {
            response += `🟡 **MÉDIA-ALTA PRIORIDADE:**\n`
            mediaAlta.slice(0, 5).forEach((z: any) => {
              response += `• **Zona ${z.zona}** (${z.municipios.slice(0, 2).join(', ')})\n`
              response += `  Eleitores: ${z.totalAptos.toLocaleString('pt-BR')} | Participação: ${z.taxaParticipacao}%\n\n`
            })
          }
          
          response += `\n💡 **Recomendação:** Foque recursos nas zonas de alta prioridade - grande eleitorado com potencial de mobilização.`
          return response
        }
      }

      // Mapa de força
      if (lowerQuery.includes('mapa') && lowerQuery.includes('força') || lowerQuery.includes('força eleitoral')) {
        const municipio = extractMunicipioName(query) || 'PORTO VELHO'
        const mapa = await mapaForcaEleitoral(municipio)
        if (mapa && mapa.length > 0) {
          let response = `🗺️ **Mapa de Força Eleitoral - ${municipio}**\n\n`
          response += `*Análise por zona eleitoral - Prefeito 2024*\n\n`
          
          mapa.forEach((z: any) => {
            const emoji = parseFloat(z.dominio) > 50 ? '🟢' : parseFloat(z.dominio) > 40 ? '🟡' : '🔴'
            response += `${emoji} **Zona ${z.zona}** (${z.eleitores.toLocaleString('pt-BR')} eleitores)\n`
            response += `   Líder: **${z.lider}** (${z.partidoLider}) - ${z.dominio}% dos votos\n`
            response += `   2º lugar: ${z.segundo} - Vantagem: ${z.vantagem}pp\n\n`
          })
          
          response += `\n📊 **Legenda:** 🟢 Domínio forte (>50%) | 🟡 Disputa acirrada | 🔴 Zona disputada`
          return response
        }
      }

      // Análise territorial
      if (lowerQuery.includes('análise territorial') || lowerQuery.includes('analise territorial')) {
        const municipio = extractMunicipioName(query) || 'PORTO VELHO'
        const analise = await analiseTerritorial(municipio)
        if (analise) {
          let response = `🎯 **Análise Territorial - ${analise.municipio}**\n\n`
          response += `👥 **Eleitorado:**\n`
          response += `- Total de Eleitores: ${analise.eleitorado.total.toLocaleString('pt-BR')}\n`
          response += `- Comparecimento: ${analise.eleitorado.comparecimento.toLocaleString('pt-BR')} (${analise.eleitorado.taxaParticipacao}%)\n`
          response += `- Abstenção: ${analise.eleitorado.abstencao.toLocaleString('pt-BR')}\n\n`
          
          if (analise.prefeitos.length > 0) {
            response += `🏆 **Top Candidatos a Prefeito:**\n`
            analise.prefeitos.forEach((p: any, i: number) => {
              response += `${i + 1}. ${p.nome} (${p.partido}) - ${p.votos.toLocaleString('pt-BR')} votos\n`
            })
            response += '\n'
          }
          
          if (analise.vereadores.length > 0) {
            response += `📋 **Top 10 Vereadores:**\n`
            analise.vereadores.forEach((v: any, i: number) => {
              response += `${i + 1}. ${v.nome} (${v.partido}) - ${v.votos.toLocaleString('pt-BR')} votos\n`
            })
          }
          
          return response
        }
      }

      // Análise por zona eleitoral
      if (lowerQuery.includes('zona eleitoral') || lowerQuery.includes('zonas eleitorais')) {
        const municipio = extractMunicipioName(query) || 'PORTO VELHO'
        const zonas = await analiseZonaEleitoral(municipio)
        if (zonas && zonas.length > 0) {
          let response = `🗳️ **Análise por Zona Eleitoral - ${municipio}**\n\n`
          zonas.forEach((z: any) => {
            response += `**Zona ${z.zona}** (${z.totalVotos.toLocaleString('pt-BR')} votos):\n`
            z.candidatos.forEach((c: any, i: number) => {
              const pct = ((c.votos / z.totalVotos) * 100).toFixed(1)
              response += `  ${i + 1}. ${c.nome} (${c.partido}): ${c.votos.toLocaleString('pt-BR')} (${pct}%)\n`
            })
            response += '\n'
          })
          return response
        }
      }

      // Comparativo histórico
      if (lowerQuery.includes('comparativo') || lowerQuery.includes('histórico') || lowerQuery.includes('2020 vs 2024')) {
        const municipio = extractMunicipioName(query)
        const comparativo = await comparativoHistorico(municipio || undefined)
        if (comparativo && comparativo[2020] && comparativo[2024]) {
          const crescimento = ((comparativo[2024].eleitores - comparativo[2020].eleitores) / comparativo[2020].eleitores * 100).toFixed(1)
          const varParticipacao = (
            (comparativo[2024].comparecimento / comparativo[2024].eleitores * 100) -
            (comparativo[2020].comparecimento / comparativo[2020].eleitores * 100)
          ).toFixed(1)
          
          let response = `📈 **Comparativo Histórico${municipio ? ` - ${municipio}` : ' - Rondônia'}**\n\n`
          response += `| Métrica | 2020 | 2024 | Variação |\n`
          response += `|---------|------|------|----------|\n`
          response += `| Eleitores | ${comparativo[2020].eleitores.toLocaleString('pt-BR')} | ${comparativo[2024].eleitores.toLocaleString('pt-BR')} | ${crescimento}% |\n`
          response += `| Comparecimento | ${comparativo[2020].comparecimento.toLocaleString('pt-BR')} | ${comparativo[2024].comparecimento.toLocaleString('pt-BR')} | - |\n`
          response += `| Abstenção | ${comparativo[2020].abstencao.toLocaleString('pt-BR')} | ${comparativo[2024].abstencao.toLocaleString('pt-BR')} | - |\n\n`
          response += `📊 **Análise:**\n`
          response += `- Crescimento do eleitorado: **${crescimento}%**\n`
          response += `- Variação na participação: **${varParticipacao}pp**\n`
          
          return response
        }
      }

      // Top prefeitos
      if ((lowerQuery.includes('prefeito') && lowerQuery.includes('top')) || lowerQuery.includes('mais votado')) {
        const prefeitos = await buscarTopPrefeitos(10)
        if (prefeitos && prefeitos.length > 0) {
          let response = `🏆 **Top 10 Prefeitos Mais Votados - 2024 RO**\n\n`
          prefeitos.forEach((p: any, i: number) => {
            response += `${i + 1}. **${p.nome}** (${p.partido})\n`
            response += `   📍 ${p.municipio} - ${p.votos.toLocaleString('pt-BR')} votos\n\n`
          })
          return response
        }
      }

      // Vereadores
      if (lowerQuery.includes('vereador') || lowerQuery.includes('vereadores')) {
        const municipio = extractMunicipioName(query)
        const vereadores = await buscarTopVereadores(municipio || undefined, 15)
        if (vereadores && vereadores.length > 0) {
          let response = `📋 **Top Vereadores${municipio ? ` - ${municipio}` : ''} - 2024 RO**\n\n`
          vereadores.forEach((v: any, i: number) => {
            response += `${i + 1}. **${v.nome}** (${v.partido})\n`
            response += `   📍 ${v.municipio} - ${v.votos.toLocaleString('pt-BR')} votos\n\n`
          })
          return response
        }
      }

      // Deputados federais
      if (lowerQuery.includes('deputado federal') || lowerQuery.includes('deputados federais')) {
        const deputados = await buscarDeputadosFederais()
        if (deputados && deputados.length > 0) {
          let response = `🏛️ **Deputados Federais - Eleições 2022 RO**\n\n`
          deputados.forEach((d: any, i: number) => {
            const eleito = i < 8 ? ' ✅' : ''
            response += `${i + 1}. **${d.nome}** (${d.partido})${eleito}\n`
            response += `   📊 ${d.votos.toLocaleString('pt-BR')} votos\n\n`
          })
          response += `\n*Rondônia elegeu 8 deputados federais em 2022.*`
          return response
        }
      }

      // Deputados estaduais
      if (lowerQuery.includes('deputado estadual') || lowerQuery.includes('deputados estaduais')) {
        const deputados = await buscarDeputadosEstaduais()
        if (deputados && deputados.length > 0) {
          let response = `🏛️ **Deputados Estaduais - Eleições 2022 RO**\n\n`
          deputados.forEach((d: any, i: number) => {
            response += `${i + 1}. **${d.nome}** (${d.partido})\n`
            response += `   📊 ${d.votos.toLocaleString('pt-BR')} votos\n\n`
          })
          return response
        }
      }

      // Governador
      if (lowerQuery.includes('governador')) {
        const governadores = await buscarGovernador()
        if (governadores && governadores.length > 0) {
          let response = `🏛️ **Eleição para Governador - 2022 RO**\n\n`
          governadores.forEach((g: any, i: number) => {
            response += `${i + 1}. **${g.nome}** (${g.partido})\n`
            response += `   📊 ${g.votos.toLocaleString('pt-BR')} votos\n\n`
          })
          return response
        }
      }

      // Partidos
      if (lowerQuery.includes('partido')) {
        const partidos = await buscarPartidos()
        if (partidos) {
          let response = `🏛️ **Partidos Mais Votados - Prefeito 2024 RO**\n\n`
          partidos.forEach((p: any, i: number) => {
            response += `${i + 1}. **${p.partido}** - ${p.votos.toLocaleString('pt-BR')} votos\n`
          })
          return response
        }
      }

      // Município específico
      const municipioNome = extractMunicipioName(query)
      if (municipioNome && !lowerQuery.includes('análise') && !lowerQuery.includes('zona') && !lowerQuery.includes('mapa')) {
        const analise = await analiseTerritorial(municipioNome)
        if (analise) {
          let response = `📍 **${analise.municipio} - Eleições 2024**\n\n`
          response += `👥 **Eleitorado:**\n`
          response += `- Total: ${analise.eleitorado.total.toLocaleString('pt-BR')}\n`
          response += `- Comparecimento: ${analise.eleitorado.comparecimento.toLocaleString('pt-BR')} (${analise.eleitorado.taxaParticipacao}%)\n`
          response += `- Abstenção: ${analise.eleitorado.abstencao.toLocaleString('pt-BR')}\n\n`
          
          if (analise.prefeitos.length > 0) {
            response += `🏆 **Candidatos a Prefeito:**\n`
            analise.prefeitos.forEach((p: any, i: number) => {
              response += `${i + 1}. ${p.nome} (${p.partido}) - ${p.votos.toLocaleString('pt-BR')} votos\n`
            })
          }
          return response
        }
      }

      // Resumo geral
      if (lowerQuery.includes('resumo') || lowerQuery.includes('2024') || lowerQuery.includes('eleições')) {
        const resumo = await buscarResumo2024()
        if (resumo) {
          const taxaParticipacao = ((resumo.comparecimento / resumo.totalEleitores) * 100).toFixed(1)
          return `📊 **Resumo das Eleições 2024 - Rondônia (1º Turno)**\n\n🗳️ **Participação Eleitoral:**\n- Total de Eleitores: ${resumo.totalEleitores.toLocaleString('pt-BR')}\n- Comparecimento: ${resumo.comparecimento.toLocaleString('pt-BR')} (${taxaParticipacao}%)\n- Abstenções: ${resumo.abstencoes.toLocaleString('pt-BR')}\n\n📍 **Abrangência:**\n- 52 municípios\n- 29 zonas eleitorais\n\n💡 *Pergunte sobre análise territorial, zonas prioritárias, ou mapa de força!*`
        }
      }

      // Resposta padrão
      return `👋 **Olá! Sou o Assistente DTE**\n\nPosso ajudar gestores de campanha com:\n\n🎯 **Análise Estratégica**\n- "Zonas prioritárias para campanha"\n- "Mapa de força de Porto Velho"\n- "Análise territorial de Cacoal"\n\n👥 **Inteligência Eleitoral**\n- "Análise por zona eleitoral"\n- "Comparativo 2020 vs 2024"\n- "Perfil do eleitorado"\n\n🏆 **Candidatos e Resultados**\n- "Top prefeitos 2024"\n- "Vereadores de Ji-Paraná"\n- "Deputados federais 2022"\n\n📊 **Dados Gerais**\n- "Resumo eleições 2024"\n- "Partidos mais votados"\n\n*Digite sua pergunta!*`

    } catch (error) {
      console.error('Erro ao processar consulta:', error)
      return '❌ Desculpe, ocorreu um erro ao processar sua consulta. Por favor, tente novamente.'
    }
  }

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim()
    if (!text || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await processarConsulta(text)
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Desculpe, ocorreu um erro. Por favor, tente novamente.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!user) return null

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
        >
          <div className="relative">
            <Bot className="w-6 h-6" />
            <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Assistente DTE
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`fixed z-50 bg-[var(--bg-primary)] rounded-xl shadow-2xl border border-[var(--border-color)] flex flex-col transition-all duration-300 ${
            isExpanded 
              ? 'inset-4' 
              : 'bottom-6 right-6 w-[420px] h-[650px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Assistente DTE</h3>
                <p className="text-xs text-white/80">Inteligência para Gestores de Campanha</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearMessages}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                title="Limpar conversa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-6 rounded-xl mb-4">
                  <Bot className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                  <h4 className="font-semibold mb-2">Assistente para Gestores de Campanha</h4>
                  <p className="text-sm text-[var(--text-secondary)] mb-4">
                    Análises territoriais, zonas prioritárias e insights estratégicos
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                      <Target className="w-4 h-4 text-emerald-500" />
                      <span>Análise Territorial</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span>Zonas Prioritárias</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                      <MapPin className="w-4 h-4 text-blue-500" />
                      <span>Mapa de Força</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/50 dark:bg-gray-800/50 p-2 rounded">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      <span>Comparativos</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTION_CHIPS.slice(0, 6).map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(chip.query)}
                      className="text-xs px-3 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--accent-color)] hover:text-white rounded-full transition-colors"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl p-3 ${
                    message.role === 'user'
                      ? 'bg-[var(--accent-color)] text-white'
                      : 'bg-[var(--bg-secondary)]'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                    <span className="text-xs opacity-60">
                      {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {message.role === 'assistant' && (
                      <button
                        onClick={() => copyToClipboard(message.content, message.id)}
                        className="text-xs opacity-60 hover:opacity-100 flex items-center gap-1"
                      >
                        {copiedId === message.id ? (
                          <><Check className="w-3 h-3" /> Copiado</>
                        ) : (
                          <><Copy className="w-3 h-3" /> Copiar</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-[var(--accent-color)] rounded-lg flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[var(--bg-secondary)] rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-color)]" />
                    <span className="text-sm text-[var(--text-secondary)]">Analisando dados...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          {messages.length > 0 && (
            <div className="px-4 py-2 border-t border-[var(--border-color)] overflow-x-auto">
              <div className="flex gap-2">
                {SUGGESTION_CHIPS.slice(0, 4).map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(chip.query)}
                    className="text-xs px-3 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--accent-color)] hover:text-white rounded-full transition-colors whitespace-nowrap"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-[var(--border-color)]">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Pergunte sobre dados eleitorais..."
                className="flex-1 px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:outline-none focus:border-[var(--accent-color)]"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-[var(--accent-color)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-center text-[var(--text-secondary)] mt-2">
              Dados de RO 2020-2024 • Análises para Gestores de Campanha
            </p>
          </div>
        </div>
      )}
    </>
  )
}
