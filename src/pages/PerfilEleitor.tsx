import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  UserCircle,
  Save,
  Download,
  Plus,
  Trash2,
  Edit,
  Users,
  MapPin,
  GraduationCap,
  Calendar,
  Target,
  Lightbulb,
  Heart,
  Briefcase,
  MessageSquare
} from 'lucide-react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts'

interface Persona {
  id: string
  nome: string
  idade: string
  genero: string
  escolaridade: string
  profissao: string
  renda: string
  bairro: string
  zona: string
  interesses: string[]
  preocupacoes: string[]
  canaisComunicacao: string[]
  comportamentoVoto: string
  potencialConversao: number
  mensagemChave: string
  cor: string
}

const coresDisponiveis = [
  '#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
]

const interessesOpcoes = [
  'Saúde', 'Educação', 'Segurança', 'Emprego', 'Infraestrutura',
  'Meio Ambiente', 'Transporte', 'Cultura', 'Esporte', 'Tecnologia',
  'Assistência Social', 'Economia', 'Agricultura', 'Turismo'
]

const canaisOpcoes = [
  'WhatsApp', 'Facebook', 'Instagram', 'TikTok', 'YouTube',
  'Rádio', 'TV', 'Jornal', 'Panfletos', 'Eventos Presenciais',
  'Carro de Som', 'Boca a Boca'
]

export default function PerfilEleitor() {
  const [loading, setLoading] = useState(true)
  const [personas, setPersonas] = useState<Persona[]>([])
  const [personaSelecionada, setPersonaSelecionada] = useState<Persona | null>(null)
  const [editando, setEditando] = useState(false)
  const [dadosEleitorado, setDadosEleitorado] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar dados do perfil do eleitorado para sugestões
      const { data: perfilData } = await supabase
        .from('perfil_eleitorado')
        .select('*')
        .eq('ano', 2022)

      setDadosEleitorado(perfilData || [])

      // Carregar personas salvas (localStorage por enquanto)
      const personasSalvas = localStorage.getItem('dte_personas')
      if (personasSalvas) {
        setPersonas(JSON.parse(personasSalvas))
      } else {
        // Personas de exemplo
        const exemplos: Persona[] = [
          {
            id: '1',
            nome: 'Maria Trabalhadora',
            idade: '35-44',
            genero: 'Feminino',
            escolaridade: 'Ensino Médio Completo',
            profissao: 'Comerciante',
            renda: 'R$ 2.000 - R$ 4.000',
            bairro: 'Centro',
            zona: '1',
            interesses: ['Saúde', 'Educação', 'Segurança'],
            preocupacoes: ['Custo de vida', 'Saúde pública', 'Educação dos filhos'],
            canaisComunicacao: ['WhatsApp', 'Facebook', 'Rádio'],
            comportamentoVoto: 'Vota por indicação de conhecidos e avalia propostas para a família',
            potencialConversao: 75,
            mensagemChave: 'Compromisso com saúde e educação de qualidade para sua família',
            cor: '#EC4899'
          },
          {
            id: '2',
            nome: 'João Jovem',
            idade: '18-24',
            genero: 'Masculino',
            escolaridade: 'Ensino Superior Incompleto',
            profissao: 'Estudante/Estagiário',
            renda: 'Até R$ 2.000',
            bairro: 'Zona Sul',
            zona: '3',
            interesses: ['Emprego', 'Tecnologia', 'Cultura'],
            preocupacoes: ['Primeiro emprego', 'Custo da faculdade', 'Transporte'],
            canaisComunicacao: ['Instagram', 'TikTok', 'YouTube'],
            comportamentoVoto: 'Pesquisa candidatos na internet e valoriza autenticidade',
            potencialConversao: 60,
            mensagemChave: 'Oportunidades de emprego e investimento em tecnologia e inovação',
            cor: '#3B82F6'
          },
          {
            id: '3',
            nome: 'Sr. Aposentado',
            idade: '60+',
            genero: 'Masculino',
            escolaridade: 'Ensino Fundamental',
            profissao: 'Aposentado',
            renda: 'R$ 1.500 - R$ 3.000',
            bairro: 'Bairro Tradicional',
            zona: '2',
            interesses: ['Saúde', 'Segurança', 'Assistência Social'],
            preocupacoes: ['Atendimento médico', 'Medicamentos', 'Segurança'],
            canaisComunicacao: ['TV', 'Rádio', 'WhatsApp'],
            comportamentoVoto: 'Fiel a partidos tradicionais, valoriza experiência política',
            potencialConversao: 45,
            mensagemChave: 'Respeito aos idosos e melhoria no atendimento de saúde',
            cor: '#10B981'
          }
        ]
        setPersonas(exemplos)
        localStorage.setItem('dte_personas', JSON.stringify(exemplos))
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const criarNovaPersona = () => {
    const novaPersona: Persona = {
      id: Date.now().toString(),
      nome: 'Nova Persona',
      idade: '25-34',
      genero: 'Não definido',
      escolaridade: 'Ensino Médio Completo',
      profissao: '',
      renda: 'R$ 2.000 - R$ 4.000',
      bairro: '',
      zona: '',
      interesses: [],
      preocupacoes: [],
      canaisComunicacao: [],
      comportamentoVoto: '',
      potencialConversao: 50,
      mensagemChave: '',
      cor: coresDisponiveis[personas.length % coresDisponiveis.length]
    }
    setPersonaSelecionada(novaPersona)
    setEditando(true)
  }

  const salvarPersona = () => {
    if (!personaSelecionada) return

    const novasPersonas = personas.some(p => p.id === personaSelecionada.id)
      ? personas.map(p => p.id === personaSelecionada.id ? personaSelecionada : p)
      : [...personas, personaSelecionada]

    setPersonas(novasPersonas)
    localStorage.setItem('dte_personas', JSON.stringify(novasPersonas))
    setEditando(false)
  }

  const excluirPersona = (id: string) => {
    const novasPersonas = personas.filter(p => p.id !== id)
    setPersonas(novasPersonas)
    localStorage.setItem('dte_personas', JSON.stringify(novasPersonas))
    if (personaSelecionada?.id === id) {
      setPersonaSelecionada(null)
    }
  }

  const toggleInteresse = (interesse: string) => {
    if (!personaSelecionada) return
    const novosInteresses = personaSelecionada.interesses.includes(interesse)
      ? personaSelecionada.interesses.filter(i => i !== interesse)
      : [...personaSelecionada.interesses, interesse]
    setPersonaSelecionada({ ...personaSelecionada, interesses: novosInteresses })
  }

  const toggleCanal = (canal: string) => {
    if (!personaSelecionada) return
    const novosCanais = personaSelecionada.canaisComunicacao.includes(canal)
      ? personaSelecionada.canaisComunicacao.filter(c => c !== canal)
      : [...personaSelecionada.canaisComunicacao, canal]
    setPersonaSelecionada({ ...personaSelecionada, canaisComunicacao: novosCanais })
  }

  const radarData = personaSelecionada ? [
    { subject: 'Engajamento', value: personaSelecionada.potencialConversao },
    { subject: 'Alcance Digital', value: personaSelecionada.canaisComunicacao.filter(c => ['WhatsApp', 'Facebook', 'Instagram', 'TikTok', 'YouTube'].includes(c)).length * 20 },
    { subject: 'Interesses', value: personaSelecionada.interesses.length * 15 },
    { subject: 'Preocupações', value: personaSelecionada.preocupacoes.length * 20 },
    { subject: 'Acessibilidade', value: personaSelecionada.canaisComunicacao.length * 10 }
  ] : []

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCircle className="w-7 h-7 text-purple-500" />
            Perfil do Eleitor Ideal
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Crie personas para direcionar sua comunicação de campanha
          </p>
        </div>

        <button
          onClick={criarNovaPersona}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nova Persona
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Personas */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Suas Personas</h3>
            {personas.map(persona => (
              <div
                key={persona.id}
                onClick={() => { setPersonaSelecionada(persona); setEditando(false); }}
                className={`card p-4 cursor-pointer transition-all hover:shadow-lg ${
                  personaSelecionada?.id === persona.id ? 'ring-2 ring-purple-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: persona.cor }}
                  >
                    {persona.nome.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{persona.nome}</h4>
                    <p className="text-sm text-[var(--text-muted)]">{persona.idade} • {persona.genero}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full"
                          style={{ width: `${persona.potencialConversao}%`, backgroundColor: persona.cor }}
                        />
                      </div>
                      <span className="text-xs font-medium">{persona.potencialConversao}%</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); excluirPersona(persona.id); }}
                    className="p-1 text-red-500 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {personas.length === 0 && (
              <div className="card p-8 text-center">
                <UserCircle className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">Nenhuma persona criada</p>
                <button
                  onClick={criarNovaPersona}
                  className="btn-primary mt-4"
                >
                  Criar Primeira Persona
                </button>
              </div>
            )}
          </div>

          {/* Detalhes da Persona */}
          <div className="lg:col-span-2">
            {personaSelecionada ? (
              <div className="card">
                <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: personaSelecionada.cor }}
                    >
                      {personaSelecionada.nome.charAt(0)}
                    </div>
                    {editando ? (
                      <input
                        type="text"
                        value={personaSelecionada.nome}
                        onChange={(e) => setPersonaSelecionada({ ...personaSelecionada, nome: e.target.value })}
                        className="input font-semibold"
                      />
                    ) : (
                      <h3 className="font-semibold text-lg">{personaSelecionada.nome}</h3>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {editando ? (
                      <button onClick={salvarPersona} className="btn-primary flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Salvar
                      </button>
                    ) : (
                      <button onClick={() => setEditando(true)} className="btn-secondary flex items-center gap-2">
                        <Edit className="w-4 h-4" />
                        Editar
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Dados Demográficos */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Idade
                      </label>
                      {editando ? (
                        <select
                          value={personaSelecionada.idade}
                          onChange={(e) => setPersonaSelecionada({ ...personaSelecionada, idade: e.target.value })}
                          className="input mt-1"
                        >
                          <option value="18-24">18-24 anos</option>
                          <option value="25-34">25-34 anos</option>
                          <option value="35-44">35-44 anos</option>
                          <option value="45-59">45-59 anos</option>
                          <option value="60+">60+ anos</option>
                        </select>
                      ) : (
                        <p className="font-medium">{personaSelecionada.idade}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <Users className="w-3 h-3" /> Gênero
                      </label>
                      {editando ? (
                        <select
                          value={personaSelecionada.genero}
                          onChange={(e) => setPersonaSelecionada({ ...personaSelecionada, genero: e.target.value })}
                          className="input mt-1"
                        >
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Não definido">Não definido</option>
                        </select>
                      ) : (
                        <p className="font-medium">{personaSelecionada.genero}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" /> Escolaridade
                      </label>
                      {editando ? (
                        <select
                          value={personaSelecionada.escolaridade}
                          onChange={(e) => setPersonaSelecionada({ ...personaSelecionada, escolaridade: e.target.value })}
                          className="input mt-1"
                        >
                          <option value="Ensino Fundamental">Ensino Fundamental</option>
                          <option value="Ensino Médio Incompleto">Ensino Médio Incompleto</option>
                          <option value="Ensino Médio Completo">Ensino Médio Completo</option>
                          <option value="Ensino Superior Incompleto">Ensino Superior Incompleto</option>
                          <option value="Ensino Superior Completo">Ensino Superior Completo</option>
                          <option value="Pós-graduação">Pós-graduação</option>
                        </select>
                      ) : (
                        <p className="font-medium text-sm">{personaSelecionada.escolaridade}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Zona Eleitoral
                      </label>
                      {editando ? (
                        <input
                          type="text"
                          value={personaSelecionada.zona}
                          onChange={(e) => setPersonaSelecionada({ ...personaSelecionada, zona: e.target.value })}
                          className="input mt-1"
                          placeholder="Ex: 1, 2, 3..."
                        />
                      ) : (
                        <p className="font-medium">Zona {personaSelecionada.zona || 'N/A'}</p>
                      )}
                    </div>
                  </div>

                  {/* Interesses */}
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <Heart className="w-4 h-4 text-red-500" />
                      Interesses Principais
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {interessesOpcoes.map(interesse => (
                        <button
                          key={interesse}
                          onClick={() => editando && toggleInteresse(interesse)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            personaSelecionada.interesses.includes(interesse)
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          } ${!editando && 'cursor-default'}`}
                        >
                          {interesse}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Canais de Comunicação */}
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      Canais de Comunicação
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {canaisOpcoes.map(canal => (
                        <button
                          key={canal}
                          onClick={() => editando && toggleCanal(canal)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            personaSelecionada.canaisComunicacao.includes(canal)
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          } ${!editando && 'cursor-default'}`}
                        >
                          {canal}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Potencial e Mensagem */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-emerald-500" />
                        Potencial de Conversão: {personaSelecionada.potencialConversao}%
                      </label>
                      {editando ? (
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={personaSelecionada.potencialConversao}
                          onChange={(e) => setPersonaSelecionada({ ...personaSelecionada, potencialConversao: parseInt(e.target.value) })}
                          className="w-full"
                        />
                      ) : (
                        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full"
                            style={{ width: `${personaSelecionada.potencialConversao}%`, backgroundColor: personaSelecionada.cor }}
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium flex items-center gap-2 mb-3">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        Mensagem-Chave
                      </label>
                      {editando ? (
                        <textarea
                          value={personaSelecionada.mensagemChave}
                          onChange={(e) => setPersonaSelecionada({ ...personaSelecionada, mensagemChave: e.target.value })}
                          className="input w-full h-20"
                          placeholder="A mensagem principal para esta persona..."
                        />
                      ) : (
                        <p className="text-sm bg-amber-50 p-3 rounded-lg border border-amber-200">
                          "{personaSelecionada.mensagemChave || 'Nenhuma mensagem definida'}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Gráfico Radar */}
                  {!editando && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-4">Análise da Persona</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar
                            name="Perfil"
                            dataKey="value"
                            stroke={personaSelecionada.cor}
                            fill={personaSelecionada.cor}
                            fillOpacity={0.5}
                          />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center">
                <UserCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-500 mb-2">
                  Selecione uma persona para ver os detalhes
                </h3>
                <p className="text-sm text-gray-400">
                  Ou crie uma nova persona para começar
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
