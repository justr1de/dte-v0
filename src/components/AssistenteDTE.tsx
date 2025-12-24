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
  Check
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
}

const SUGGESTION_CHIPS: SuggestionChip[] = [
  { label: '📊 Resumo eleições 2024', query: 'Qual foi o resumo das eleições de 2024?' },
  { label: '🗳️ Top prefeitos', query: 'Quais foram os prefeitos mais votados em 2024?' },
  { label: '🏛️ Deputados federais', query: 'Quais os deputados federais eleitos em 2022?' },
  { label: '📈 Taxa de abstenção', query: 'Qual foi a taxa de abstenção em 2024?' },
  { label: '🏆 Partidos mais votados', query: 'Quais partidos mais votados em 2024?' },
  { label: '📍 Dados de Porto Velho', query: 'Mostre dados de Porto Velho' },
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

  // Função para extrair nome de candidato da query
  const extractCandidatoName = (query: string): string | null => {
    const lowerQuery = query.toLowerCase()
    
    // Nomes específicos conhecidos
    if (lowerQuery.includes('rafael fera') || lowerQuery.includes('rafael bento')) {
      return 'RAFAEL FERA'
    }
    if (lowerQuery.includes('fernando máximo') || lowerQuery.includes('dr fernando')) {
      return 'DR FERNANDO MÁXIMO'
    }
    if (lowerQuery.includes('silvia cristina')) {
      return 'SILVIA CRISTINA'
    }
    if (lowerQuery.includes('lucio mosquini')) {
      return 'LUCIO MOSQUINI'
    }
    if (lowerQuery.includes('mariana carvalho')) {
      return 'MARIANA CARVALHO'
    }
    if (lowerQuery.includes('marcos rocha')) {
      return 'MARCOS ROCHA'
    }

    // Padrões para extrair nomes
    const patterns = [
      /sobre\s+(?:o\s+)?(?:candidato\s+)?(?:deputado\s+)?(?:federal\s+)?(?:estadual\s+)?([A-Za-zÀ-ÿ\s]+?)(?:\?|$|,|do\s+|da\s+)/i,
      /informações\s+(?:sobre\s+)?(?:o\s+)?([A-Za-zÀ-ÿ\s]+?)(?:\?|$|,)/i,
      /dados\s+(?:de|do|da)\s+([A-Za-zÀ-ÿ\s]+?)(?:\?|$|,)/i,
    ]

    for (const pattern of patterns) {
      const match = query.match(pattern)
      if (match && match[1]) {
        const name = match[1].trim()
        if (name.length > 3 && !['o', 'a', 'os', 'as', 'de', 'da', 'do', 'em', 'no', 'na', 'que', 'como'].includes(name.toLowerCase())) {
          return name.toUpperCase()
        }
      }
    }

    return null
  }

  // Função para extrair nome de município
  const extractMunicipioName = (query: string): string | null => {
    const municipios = [
      'porto velho', 'ji-paraná', 'ariquemes', 'cacoal', 'vilhena', 'rolim de moura',
      'guajará-mirim', 'jaru', 'ouro preto do oeste', 'pimenta bueno', 'buritis',
      'nova mamoré', 'machadinho', 'espigão do oeste', 'alta floresta', 'colorado'
    ]
    const lowerQuery = query.toLowerCase()
    for (const municipio of municipios) {
      if (lowerQuery.includes(municipio)) {
        return municipio.toUpperCase()
      }
    }
    return null
  }

  // Buscar candidato específico
  const buscarCandidato = async (nome: string) => {
    const { data, error } = await supabase
      .from('boletins_urna')
      .select('nm_votavel, sg_partido, nm_municipio, cd_cargo_pergunta, ds_cargo_pergunta, qt_votos, ano_eleicao')
      .ilike('nm_votavel', `%${nome}%`)
      .eq('sg_uf', 'RO')
      .order('qt_votos', { ascending: false })
      .limit(500)

    if (error || !data || data.length === 0) return null

    // Agrupar por candidato, cargo e ano
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
          votosPorMunicipio: [] as any[]
        }
      }
      candidatoInfo[key].totalVotos += row.qt_votos || 0
      candidatoInfo[key].votosPorMunicipio.push({
        municipio: row.nm_municipio,
        votos: row.qt_votos
      })
    })

    // Ordenar e limitar municípios
    Object.values(candidatoInfo).forEach((info: any) => {
      info.votosPorMunicipio.sort((a: any, b: any) => b.votos - a.votos)
      info.votosPorMunicipio = info.votosPorMunicipio.slice(0, 10)
    })

    return Object.values(candidatoInfo)
  }

  // Buscar deputados federais
  const buscarDeputadosFederais = async () => {
    const { data, error } = await supabase
      .from('boletins_urna')
      .select('nm_votavel, sg_partido, qt_votos')
      .eq('sg_uf', 'RO')
      .eq('cd_cargo_pergunta', 6)
      .eq('ano_eleicao', 2022)
      .order('qt_votos', { ascending: false })
      .limit(1000)

    if (error || !data) return null

    const deputadoTotals: { [key: string]: { nome: string, partido: string, votos: number } } = {}
    data.forEach(d => {
      if (d.nm_votavel && d.nm_votavel !== 'Branco' && d.nm_votavel !== 'Nulo') {
        if (!deputadoTotals[d.nm_votavel]) {
          deputadoTotals[d.nm_votavel] = { nome: d.nm_votavel, partido: d.sg_partido, votos: 0 }
        }
        deputadoTotals[d.nm_votavel].votos += d.qt_votos || 0
      }
    })

    return Object.values(deputadoTotals).sort((a, b) => b.votos - a.votos).slice(0, 15)
  }

  // Buscar deputados estaduais
  const buscarDeputadosEstaduais = async () => {
    const { data, error } = await supabase
      .from('boletins_urna')
      .select('nm_votavel, sg_partido, qt_votos')
      .eq('sg_uf', 'RO')
      .eq('cd_cargo_pergunta', 7)
      .eq('ano_eleicao', 2022)
      .order('qt_votos', { ascending: false })
      .limit(1000)

    if (error || !data) return null

    const deputadoTotals: { [key: string]: { nome: string, partido: string, votos: number } } = {}
    data.forEach(d => {
      if (d.nm_votavel && d.nm_votavel !== 'Branco' && d.nm_votavel !== 'Nulo') {
        if (!deputadoTotals[d.nm_votavel]) {
          deputadoTotals[d.nm_votavel] = { nome: d.nm_votavel, partido: d.sg_partido, votos: 0 }
        }
        deputadoTotals[d.nm_votavel].votos += d.qt_votos || 0
      }
    })

    return Object.values(deputadoTotals).sort((a, b) => b.votos - a.votos).slice(0, 15)
  }

  // Buscar prefeitos
  const buscarPrefeitos = async () => {
    const { data, error } = await supabase
      .from('boletins_urna')
      .select('nm_votavel, sg_partido, nm_municipio, qt_votos')
      .eq('sg_uf', 'RO')
      .eq('cd_cargo_pergunta', 11)
      .eq('ano_eleicao', 2024)
      .eq('nr_turno', 1)
      .order('qt_votos', { ascending: false })
      .limit(500)

    if (error || !data) return null

    const prefTotals: { [key: string]: { nome: string, partido: string, municipio: string, votos: number } } = {}
    data.forEach(p => {
      if (p.nm_votavel && p.nm_votavel !== 'Branco' && p.nm_votavel !== 'Nulo') {
        const key = `${p.nm_votavel}-${p.nm_municipio}`
        if (!prefTotals[key]) {
          prefTotals[key] = { nome: p.nm_votavel, partido: p.sg_partido, municipio: p.nm_municipio, votos: 0 }
        }
        prefTotals[key].votos += p.qt_votos || 0
      }
    })

    return Object.values(prefTotals).sort((a, b) => b.votos - a.votos).slice(0, 10)
  }

  // Buscar resumo 2024
  const buscarResumo2024 = async () => {
    const { data, error } = await supabase
      .from('comparecimento_abstencao')
      .select('qt_aptos, qt_comparecimento, qt_abstencoes')
      .eq('sg_uf', 'RO')
      .eq('ano_eleicao', 2024)
      .eq('nr_turno', 1)
      .limit(100)

    if (error || !data) return null

    const totalAptos = data.reduce((acc, r) => acc + (r.qt_aptos || 0), 0)
    const totalComparecimento = data.reduce((acc, r) => acc + (r.qt_comparecimento || 0), 0)
    const totalAbstencao = data.reduce((acc, r) => acc + (r.qt_abstencoes || 0), 0)

    return {
      totalEleitores: totalAptos,
      comparecimento: totalComparecimento,
      abstencoes: totalAbstencao,
      taxaParticipacao: totalAptos > 0 ? ((totalComparecimento / totalAptos) * 100).toFixed(1) : '0'
    }
  }

  // Buscar partidos
  const buscarPartidos = async () => {
    const { data, error } = await supabase
      .from('boletins_urna')
      .select('sg_partido, qt_votos')
      .eq('sg_uf', 'RO')
      .eq('cd_cargo_pergunta', 11)
      .eq('ano_eleicao', 2024)
      .eq('nr_turno', 1)
      .limit(5000)

    if (error || !data) return null

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

  // Buscar município
  const buscarMunicipio = async (nome: string) => {
    const { data, error } = await supabase
      .from('comparecimento_abstencao')
      .select('nm_municipio, qt_aptos, qt_comparecimento, qt_abstencoes')
      .eq('sg_uf', 'RO')
      .ilike('nm_municipio', `%${nome}%`)
      .eq('ano_eleicao', 2024)
      .eq('nr_turno', 1)
      .limit(10)

    if (error || !data || data.length === 0) return null

    const totalAptos = data.reduce((acc, r) => acc + (r.qt_aptos || 0), 0)
    const totalComparecimento = data.reduce((acc, r) => acc + (r.qt_comparecimento || 0), 0)
    const totalAbstencao = data.reduce((acc, r) => acc + (r.qt_abstencoes || 0), 0)

    return {
      nome: data[0].nm_municipio,
      totalEleitores: totalAptos,
      comparecimento: totalComparecimento,
      abstencoes: totalAbstencao,
      taxaParticipacao: totalAptos > 0 ? ((totalComparecimento / totalAptos) * 100).toFixed(1) : '0'
    }
  }

  // Buscar governador
  const buscarGovernador = async () => {
    const { data, error } = await supabase
      .from('boletins_urna')
      .select('nm_votavel, sg_partido, qt_votos, nr_turno')
      .eq('sg_uf', 'RO')
      .eq('cd_cargo_pergunta', 3)
      .eq('ano_eleicao', 2022)
      .order('qt_votos', { ascending: false })
      .limit(500)

    if (error || !data) return null

    const govTotals: { [key: string]: { nome: string, partido: string, votos1t: number, votos2t: number } } = {}
    data.forEach(g => {
      if (g.nm_votavel && g.nm_votavel !== 'Branco' && g.nm_votavel !== 'Nulo') {
        if (!govTotals[g.nm_votavel]) {
          govTotals[g.nm_votavel] = { nome: g.nm_votavel, partido: g.sg_partido, votos1t: 0, votos2t: 0 }
        }
        if (g.nr_turno === 1) {
          govTotals[g.nm_votavel].votos1t += g.qt_votos || 0
        } else {
          govTotals[g.nm_votavel].votos2t += g.qt_votos || 0
        }
      }
    })

    return Object.values(govTotals).sort((a, b) => (b.votos1t + b.votos2t) - (a.votos1t + a.votos2t))
  }

  // Processar a consulta e gerar resposta
  const processarConsulta = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase()

    try {
      // Verificar se é busca por candidato específico
      const candidatoNome = extractCandidatoName(query)
      if (candidatoNome) {
        const candidatos = await buscarCandidato(candidatoNome)
        if (candidatos && candidatos.length > 0) {
          let response = ''
          candidatos.forEach((c: any) => {
            response += `📊 **${c.nome}**\n\n`
            response += `🏛️ **Partido:** ${c.partido}\n`
            response += `📋 **Cargo:** ${c.cargo}\n`
            response += `📅 **Ano:** ${c.ano}\n`
            response += `🗳️ **Total de Votos:** ${c.totalVotos.toLocaleString('pt-BR')}\n\n`
            
            if (c.votosPorMunicipio && c.votosPorMunicipio.length > 0) {
              response += `📍 **Top Municípios:**\n`
              c.votosPorMunicipio.slice(0, 5).forEach((m: any, i: number) => {
                response += `${i + 1}. ${m.municipio}: ${m.votos.toLocaleString('pt-BR')} votos\n`
              })
            }
            response += '\n---\n\n'
          })
          return response
        }
      }

      // Deputados federais
      if (lowerQuery.includes('deputado federal') || lowerQuery.includes('deputados federais')) {
        const deputados = await buscarDeputadosFederais()
        if (deputados) {
          let response = `🏛️ **Top Deputados Federais - Eleições 2022 RO**\n\n`
          deputados.slice(0, 10).forEach((d: any, i: number) => {
            const eleito = i < 8 ? ' ✅' : ''
            response += `${i + 1}. **${d.nome}** (${d.partido})${eleito}\n   📊 ${d.votos.toLocaleString('pt-BR')} votos\n\n`
          })
          response += `\n*Rondônia elegeu 8 deputados federais em 2022.*`
          return response
        }
      }

      // Deputados estaduais
      if (lowerQuery.includes('deputado estadual') || lowerQuery.includes('deputados estaduais')) {
        const deputados = await buscarDeputadosEstaduais()
        if (deputados) {
          let response = `🏛️ **Top Deputados Estaduais - Eleições 2022 RO**\n\n`
          deputados.slice(0, 10).forEach((d: any, i: number) => {
            response += `${i + 1}. **${d.nome}** (${d.partido})\n   📊 ${d.votos.toLocaleString('pt-BR')} votos\n\n`
          })
          return response
        }
      }

      // Governador
      if (lowerQuery.includes('governador')) {
        const governadores = await buscarGovernador()
        if (governadores) {
          let response = `🏛️ **Eleição para Governador - 2022 RO**\n\n`
          governadores.slice(0, 5).forEach((g: any, i: number) => {
            response += `${i + 1}. **${g.nome}** (${g.partido})\n`
            response += `   📊 1º Turno: ${g.votos1t.toLocaleString('pt-BR')} votos\n`
            if (g.votos2t > 0) {
              response += `   📊 2º Turno: ${g.votos2t.toLocaleString('pt-BR')} votos\n`
            }
            response += '\n'
          })
          return response
        }
      }

      // Prefeitos
      if (lowerQuery.includes('prefeito') || lowerQuery.includes('top')) {
        const prefeitos = await buscarPrefeitos()
        if (prefeitos) {
          let response = `🏆 **Top 10 Prefeitos Mais Votados - 2024 RO**\n\n`
          prefeitos.forEach((p: any, i: number) => {
            response += `${i + 1}. **${p.nome}** (${p.partido}) - ${p.municipio}\n   📊 ${p.votos.toLocaleString('pt-BR')} votos\n\n`
          })
          return response
        }
      }

      // Município específico
      const municipioNome = extractMunicipioName(query)
      if (municipioNome) {
        const municipio = await buscarMunicipio(municipioNome)
        if (municipio) {
          return `📍 **${municipio.nome} - Eleições 2024**\n\n🗳️ **Eleitorado:**\n- Total de Eleitores: ${municipio.totalEleitores.toLocaleString('pt-BR')}\n- Comparecimento: ${municipio.comparecimento.toLocaleString('pt-BR')} (${municipio.taxaParticipacao}%)\n- Abstenções: ${municipio.abstencoes.toLocaleString('pt-BR')}`
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

      // Abstenção
      if (lowerQuery.includes('abstenção') || lowerQuery.includes('participação')) {
        const resumo = await buscarResumo2024()
        if (resumo) {
          const taxaAbstencao = (100 - parseFloat(resumo.taxaParticipacao)).toFixed(1)
          return `📈 **Taxa de Participação - Eleições 2024 RO**\n\n✅ **Comparecimento:** ${resumo.comparecimento.toLocaleString('pt-BR')} eleitores (${resumo.taxaParticipacao}%)\n❌ **Abstenções:** ${resumo.abstencoes.toLocaleString('pt-BR')} eleitores (${taxaAbstencao}%)\n\n📊 **Total de Eleitores Aptos:** ${resumo.totalEleitores.toLocaleString('pt-BR')}`
        }
      }

      // Resumo geral
      if (lowerQuery.includes('resumo') || lowerQuery.includes('2024') || lowerQuery.includes('eleições')) {
        const resumo = await buscarResumo2024()
        if (resumo) {
          return `📊 **Resumo das Eleições 2024 - Rondônia (1º Turno)**\n\n🗳️ **Participação Eleitoral:**\n- Total de Eleitores: ${resumo.totalEleitores.toLocaleString('pt-BR')}\n- Comparecimento: ${resumo.comparecimento.toLocaleString('pt-BR')} (${resumo.taxaParticipacao}%)\n- Abstenções: ${resumo.abstencoes.toLocaleString('pt-BR')}\n\n📍 **Abrangência:**\n- 52 municípios\n- 29 zonas eleitorais\n\n💡 *Para consultas mais detalhadas, pergunte sobre candidatos específicos, partidos ou municípios!*`
        }
      }

      // Resposta padrão
      return `👋 **Olá! Sou o Assistente DTE**\n\nPosso ajudar você com informações sobre:\n\n📊 **Dados Gerais**\n- Resumo das eleições 2024\n- Taxa de participação e abstenção\n\n🏆 **Candidatos**\n- Top prefeitos mais votados\n- Deputados federais e estaduais (ex: "Rafael Fera")\n- Governador e senador\n\n🏛️ **Partidos**\n- Partidos mais votados\n\n📍 **Municípios**\n- Dados de Porto Velho\n- Informações por cidade\n\n💡 **Exemplos de perguntas:**\n- "Qual foi o resumo das eleições 2024?"\n- "Quais os deputados federais eleitos em 2022?"\n- "Me traga informações sobre Rafael Fera"\n- "Mostre dados de Porto Velho"\n\n*Digite sua pergunta e eu buscarei os dados para você!*`

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
        content: '❌ Desculpe, ocorreu um erro ao processar sua consulta. Por favor, tente novamente.',
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
              : 'bottom-6 right-6 w-[400px] h-[600px] max-h-[80vh]'
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
                <p className="text-xs text-white/80">Inteligência Eleitoral</p>
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
                title={isExpanded ? 'Minimizar' : 'Expandir'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-6 rounded-xl mb-4">
                  <Bot className="w-12 h-12 mx-auto text-emerald-500 mb-3" />
                  <h4 className="font-semibold mb-2">Bem-vindo ao Assistente DTE!</h4>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Faça perguntas sobre dados eleitorais de Rondônia (2020-2024)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTION_CHIPS.map((chip, i) => (
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
                  className={`max-w-[80%] rounded-xl p-3 ${
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
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--accent-color)]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          {messages.length > 0 && (
            <div className="px-4 py-2 border-t border-[var(--border-color)] overflow-x-auto">
              <div className="flex gap-2">
                {SUGGESTION_CHIPS.slice(0, 3).map((chip, i) => (
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
              Pressione Enter para enviar • Dados de RO 2020-2024
            </p>
          </div>
        </div>
      )}
    </>
  )
}
