import { useState, useRef, useEffect } from 'react'
import { 
  MessageCircle, 
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
  { label: '📊 Resumo eleições 2024', query: 'Qual foi o resumo das eleições de 2024 em Rondônia?' },
  { label: '🗳️ Top 5 prefeitos', query: 'Quais foram os 5 prefeitos mais votados em 2024?' },
  { label: '📈 Taxa de abstenção', query: 'Qual foi a taxa de abstenção nas eleições de 2024?' },
  { label: '🏆 Partidos mais votados', query: 'Quais partidos tiveram mais votos em 2024?' },
  { label: '📍 Dados de Porto Velho', query: 'Mostre os dados eleitorais de Porto Velho em 2024' },
  { label: '🔢 Votos nulos e brancos', query: 'Quantos votos nulos e brancos tivemos em 2024?' },
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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Load messages from localStorage
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

  // Save messages to localStorage
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

  const fetchDatabaseContext = async (query: string) => {
    // Buscar dados relevantes do banco baseado na consulta
    const context: any = {}
    
    try {
      // Buscar resumo geral
      const { data: resumo } = await supabase
        .from('comparecimento_abstencao')
        .select('*')
        .eq('sg_uf', 'RO')
        .eq('ano_eleicao', 2024)
        .eq('nr_turno', 1)
        .limit(100)
      
      if (resumo) {
        const totalAptos = resumo.reduce((acc, r) => acc + (r.qt_aptos || 0), 0)
        const totalComparecimento = resumo.reduce((acc, r) => acc + (r.qt_comparecimento || 0), 0)
        const totalAbstencao = resumo.reduce((acc, r) => acc + (r.qt_abstencoes || 0), 0)
        context.resumo2024 = {
          totalEleitores: totalAptos,
          comparecimento: totalComparecimento,
          abstencoes: totalAbstencao,
          taxaParticipacao: ((totalComparecimento / totalAptos) * 100).toFixed(1)
        }
      }

      // Buscar municípios
      const { data: municipios } = await supabase
        .from('comparecimento_abstencao')
        .select('nm_municipio')
        .eq('sg_uf', 'RO')
        .eq('ano_eleicao', 2024)
      
      if (municipios) {
        const uniqueMunicipios = [...new Set(municipios.map(m => m.nm_municipio))]
        context.totalMunicipios = uniqueMunicipios.length
      }

      // Buscar votos por partido (prefeitos)
      const { data: votosPartido } = await supabase
        .from('boletins_urna')
        .select('sg_partido, qt_votos')
        .eq('sg_uf', 'RO')
        .eq('ano_eleicao', 2024)
        .eq('nr_turno', 1)
        .eq('cd_cargo_pergunta', 11)
        .limit(10000)

      if (votosPartido) {
        const partidoTotals: { [key: string]: number } = {}
        votosPartido.forEach(v => {
          if (v.sg_partido) {
            partidoTotals[v.sg_partido] = (partidoTotals[v.sg_partido] || 0) + (v.qt_votos || 0)
          }
        })
        const sortedPartidos = Object.entries(partidoTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
        context.topPartidos = sortedPartidos.map(([partido, votos]) => ({ partido, votos }))
      }

      // Buscar top candidatos prefeitos
      const { data: candidatos } = await supabase
        .from('boletins_urna')
        .select('nm_votavel, sg_partido, nm_municipio, qt_votos')
        .eq('sg_uf', 'RO')
        .eq('ano_eleicao', 2024)
        .eq('nr_turno', 1)
        .eq('cd_cargo_pergunta', 11)
        .order('qt_votos', { ascending: false })
        .limit(100)

      if (candidatos) {
        // Agrupar votos por candidato
        const candidatoTotals: { [key: string]: { nome: string, partido: string, municipio: string, votos: number } } = {}
        candidatos.forEach(c => {
          const key = `${c.nm_votavel}-${c.nm_municipio}`
          if (!candidatoTotals[key]) {
            candidatoTotals[key] = { nome: c.nm_votavel, partido: c.sg_partido, municipio: c.nm_municipio, votos: 0 }
          }
          candidatoTotals[key].votos += c.qt_votos || 0
        })
        context.topPrefeitos = Object.values(candidatoTotals)
          .sort((a, b) => b.votos - a.votos)
          .slice(0, 10)
      }

      // Buscar dados de votos nulos e brancos
      const { data: votosEspeciais } = await supabase
        .from('boletins_urna')
        .select('qt_votos_nominais, qt_votos_brancos, qt_votos_nulos')
        .eq('sg_uf', 'RO')
        .eq('ano_eleicao', 2024)
        .eq('nr_turno', 1)
        .eq('cd_cargo_pergunta', 11)
        .limit(10000)

      if (votosEspeciais) {
        const totais = votosEspeciais.reduce((acc, v) => ({
          nominais: acc.nominais + (v.qt_votos_nominais || 0),
          brancos: acc.brancos + (v.qt_votos_brancos || 0),
          nulos: acc.nulos + (v.qt_votos_nulos || 0)
        }), { nominais: 0, brancos: 0, nulos: 0 })
        context.votosEspeciais = totais
      }

    } catch (error) {
      console.error('Error fetching context:', error)
    }

    return context
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
      // Buscar contexto do banco de dados
      const dbContext = await fetchDatabaseContext(text)

      // Preparar o prompt com contexto
      const systemPrompt = `Você é o Assistente DTE (Data Tracking Eleitoral), um especialista em dados eleitorais do estado de Rondônia. 
Você tem acesso aos dados eleitorais de 2020, 2022 e 2024.

CONTEXTO ATUAL DOS DADOS (2024 - 1º Turno - Rondônia):
${JSON.stringify(dbContext, null, 2)}

INSTRUÇÕES:
- Responda sempre em português brasileiro
- Seja preciso e use os dados fornecidos no contexto
- Formate números grandes com separadores de milhar (ex: 1.234.567)
- Use emojis para tornar as respostas mais visuais
- Se não tiver dados suficientes, informe ao usuário
- Sugira consultas relacionadas quando apropriado
- Mantenha respostas concisas mas informativas`

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: text }
          ]
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao processar consulta')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.content || 'Desculpe, não consegui processar sua consulta. Tente novamente.',
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
          className={`fixed z-50 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${
            isExpanded 
              ? 'inset-4 md:inset-8' 
              : 'bottom-6 right-6 w-[400px] h-[600px] max-h-[80vh]'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)] bg-gradient-to-r from-emerald-500 to-teal-500 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Assistente DTE</h3>
                <p className="text-xs text-white/70">Inteligência Eleitoral</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearMessages}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/70 hover:text-white"
                title="Limpar conversa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/70 hover:text-white"
                title={isExpanded ? 'Minimizar' : 'Expandir'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white/70 hover:text-white"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Olá! Sou o Assistente DTE 👋</h4>
                <p className="text-sm text-[var(--text-secondary)] mb-6">
                  Posso ajudar você a consultar dados eleitorais, fazer análises e cruzamentos de informações.
                </p>
                
                {/* Suggestion Chips */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {SUGGESTION_CHIPS.map((chip, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(chip.query)}
                      className="text-xs px-3 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-full transition-colors border border-[var(--border-color)]"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    message.role === 'user' 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-[var(--bg-secondary)]'
                  }`}>
                    {message.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-3 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-emerald-500 text-white rounded-tr-sm'
                        : 'bg-[var(--bg-secondary)] rounded-tl-sm'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <div className={`flex items-center gap-2 mt-1 ${message.role === 'user' ? 'justify-end' : ''}`}>
                      <span className="text-xs text-[var(--text-muted)]">
                        {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {message.role === 'assistant' && (
                        <button
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                          title="Copiar"
                        >
                          {copiedId === message.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-secondary)]">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-[var(--bg-secondary)] p-3 rounded-2xl rounded-tl-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analisando dados...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions (when there are messages) */}
          {messages.length > 0 && !isLoading && (
            <div className="px-4 pb-2">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {SUGGESTION_CHIPS.slice(0, 3).map((chip, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(chip.query)}
                    className="text-xs px-3 py-1 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-full transition-colors whitespace-nowrap border border-[var(--border-color)]"
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
                className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                disabled={isLoading}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-2 text-center">
              Pressione Enter para enviar • Dados de RO 2020-2024
            </p>
          </div>
        </div>
      )}
    </>
  )
}
