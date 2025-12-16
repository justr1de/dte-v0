import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { 
  ArrowLeft, 
  Save, 
  PlusCircle, 
  Trash2, 
  GripVertical,
  CheckSquare,
  AlignLeft,
  ListOrdered,
  ToggleLeft
} from 'lucide-react'

interface Pergunta {
  id: string
  texto: string
  tipo: 'multipla_escolha' | 'texto_livre' | 'escala_likert' | 'sim_nao' | 'ordenacao'
  obrigatoria: boolean
  opcoes: string[]
}

export default function CriarPesquisa() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'info' | 'perguntas' | 'config'>('info')
  
  const [pesquisa, setPesquisa] = useState({
    titulo: '',
    descricao: '',
    publico_alvo: '',
    data_inicio: '',
    data_fim: '',
    margem_erro: 3.5,
    nivel_confianca: 95,
    registro_tse: ''
  })

  const [perguntas, setPerguntas] = useState<Pergunta[]>([])

  const tiposPergunta = [
    { value: 'multipla_escolha', label: 'Múltipla Escolha', icon: CheckSquare },
    { value: 'texto_livre', label: 'Texto Livre', icon: AlignLeft },
    { value: 'escala_likert', label: 'Escala Likert', icon: ListOrdered },
    { value: 'sim_nao', label: 'Sim/Não', icon: ToggleLeft },
  ]

  const addPergunta = (tipo: Pergunta['tipo']) => {
    const novaPergunta: Pergunta = {
      id: Date.now().toString(),
      texto: '',
      tipo,
      obrigatoria: true,
      opcoes: tipo === 'multipla_escolha' ? ['Opção 1', 'Opção 2'] : 
              tipo === 'escala_likert' ? ['1 - Muito Insatisfeito', '2 - Insatisfeito', '3 - Neutro', '4 - Satisfeito', '5 - Muito Satisfeito'] :
              tipo === 'sim_nao' ? ['Sim', 'Não'] : []
    }
    setPerguntas([...perguntas, novaPergunta])
  }

  const updatePergunta = (id: string, field: keyof Pergunta, value: any) => {
    setPerguntas(perguntas.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ))
  }

  const removePergunta = (id: string) => {
    setPerguntas(perguntas.filter(p => p.id !== id))
  }

  const addOpcao = (perguntaId: string) => {
    setPerguntas(perguntas.map(p => 
      p.id === perguntaId 
        ? { ...p, opcoes: [...p.opcoes, `Opção ${p.opcoes.length + 1}`] }
        : p
    ))
  }

  const updateOpcao = (perguntaId: string, index: number, value: string) => {
    setPerguntas(perguntas.map(p => 
      p.id === perguntaId 
        ? { ...p, opcoes: p.opcoes.map((o, i) => i === index ? value : o) }
        : p
    ))
  }

  const removeOpcao = (perguntaId: string, index: number) => {
    setPerguntas(perguntas.map(p => 
      p.id === perguntaId 
        ? { ...p, opcoes: p.opcoes.filter((_, i) => i !== index) }
        : p
    ))
  }

  const handleSave = async (status: 'rascunho' | 'ativa') => {
    setSaving(true)
    try {
      // Salvar pesquisa
      const { data: pesquisaData, error: pesquisaError } = await supabase
        .from('pesquisas')
        .insert({
          ...pesquisa,
          status,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (pesquisaError) throw pesquisaError

      // Salvar perguntas
      if (perguntas.length > 0 && pesquisaData) {
        const perguntasToInsert = perguntas.map((p, index) => ({
          pesquisa_id: pesquisaData.id,
          texto: p.texto,
          tipo: p.tipo,
          obrigatoria: p.obrigatoria,
          ordem: index,
          opcoes: p.opcoes
        }))

        const { error: perguntasError } = await supabase
          .from('pesquisa_perguntas')
          .insert(perguntasToInsert)

        if (perguntasError) throw perguntasError
      }

      navigate('/pesquisas')
    } catch (error) {
      console.error('Erro ao salvar pesquisa:', error)
      alert('Erro ao salvar pesquisa. Verifique se as tabelas foram criadas no Supabase.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/pesquisas')}
              className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Nova Pesquisa</h1>
              <p className="text-[var(--text-muted)]">Configure sua pesquisa eleitoral</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSave('rascunho')}
              disabled={saving}
              className="btn-secondary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Salvar Rascunho
            </button>
            <button
              onClick={() => handleSave('ativa')}
              disabled={saving || !pesquisa.titulo}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? 'Salvando...' : 'Publicar Pesquisa'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="flex border-b border-[var(--border-color)]">
            {[
              { id: 'info', label: 'Informações' },
              { id: 'perguntas', label: 'Perguntas' },
              { id: 'config', label: 'Configurações' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-emerald-600 border-b-2 border-emerald-600'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Tab: Informações */}
            {activeTab === 'info' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Título da Pesquisa *</label>
                  <input
                    type="text"
                    value={pesquisa.titulo}
                    onChange={(e) => setPesquisa({ ...pesquisa, titulo: e.target.value })}
                    placeholder="Ex: Pesquisa de Intenção de Voto - Porto Velho 2024"
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Descrição</label>
                  <textarea
                    value={pesquisa.descricao}
                    onChange={(e) => setPesquisa({ ...pesquisa, descricao: e.target.value })}
                    placeholder="Descreva o objetivo e metodologia da pesquisa..."
                    rows={4}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Público-Alvo</label>
                  <input
                    type="text"
                    value={pesquisa.publico_alvo}
                    onChange={(e) => setPesquisa({ ...pesquisa, publico_alvo: e.target.value })}
                    placeholder="Ex: Eleitores de Porto Velho maiores de 16 anos"
                    className="input w-full"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Data de Início</label>
                    <input
                      type="date"
                      value={pesquisa.data_inicio}
                      onChange={(e) => setPesquisa({ ...pesquisa, data_inicio: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Data de Término</label>
                    <input
                      type="date"
                      value={pesquisa.data_fim}
                      onChange={(e) => setPesquisa({ ...pesquisa, data_fim: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Perguntas */}
            {activeTab === 'perguntas' && (
              <div className="space-y-6">
                {/* Adicionar Pergunta */}
                <div className="flex flex-wrap gap-2">
                  {tiposPergunta.map((tipo) => (
                    <button
                      key={tipo.value}
                      onClick={() => addPergunta(tipo.value as Pergunta['tipo'])}
                      className="btn-secondary flex items-center gap-2 text-sm"
                    >
                      <tipo.icon className="w-4 h-4" />
                      {tipo.label}
                    </button>
                  ))}
                </div>

                {/* Lista de Perguntas */}
                {perguntas.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-[var(--border-color)] rounded-lg">
                    <PlusCircle className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Nenhuma pergunta adicionada</h3>
                    <p className="text-[var(--text-muted)]">
                      Clique nos botões acima para adicionar perguntas à sua pesquisa
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {perguntas.map((pergunta, index) => (
                      <div key={pergunta.id} className="border border-[var(--border-color)] rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 cursor-move text-[var(--text-muted)]">
                            <GripVertical className="w-5 h-5" />
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-[var(--text-muted)]">
                                Pergunta {index + 1}
                              </span>
                              <span className="text-xs px-2 py-1 bg-[var(--bg-secondary)] rounded">
                                {tiposPergunta.find(t => t.value === pergunta.tipo)?.label}
                              </span>
                              <label className="flex items-center gap-2 text-sm ml-auto">
                                <input
                                  type="checkbox"
                                  checked={pergunta.obrigatoria}
                                  onChange={(e) => updatePergunta(pergunta.id, 'obrigatoria', e.target.checked)}
                                  className="rounded"
                                />
                                Obrigatória
                              </label>
                            </div>

                            <input
                              type="text"
                              value={pergunta.texto}
                              onChange={(e) => updatePergunta(pergunta.id, 'texto', e.target.value)}
                              placeholder="Digite a pergunta..."
                              className="input w-full"
                            />

                            {/* Opções para múltipla escolha e likert */}
                            {(pergunta.tipo === 'multipla_escolha' || pergunta.tipo === 'escala_likert') && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Opções de Resposta</label>
                                {pergunta.opcoes.map((opcao, opIndex) => (
                                  <div key={opIndex} className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={opcao}
                                      onChange={(e) => updateOpcao(pergunta.id, opIndex, e.target.value)}
                                      className="input flex-1"
                                    />
                                    <button
                                      onClick={() => removeOpcao(pergunta.id, opIndex)}
                                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => addOpcao(pergunta.id)}
                                  className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                                >
                                  <PlusCircle className="w-4 h-4" />
                                  Adicionar opção
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removePergunta(pergunta.id)}
                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab: Configurações */}
            {activeTab === 'config' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Margem de Erro (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={pesquisa.margem_erro}
                      onChange={(e) => setPesquisa({ ...pesquisa, margem_erro: parseFloat(e.target.value) })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nível de Confiança (%)</label>
                    <input
                      type="number"
                      value={pesquisa.nivel_confianca}
                      onChange={(e) => setPesquisa({ ...pesquisa, nivel_confianca: parseFloat(e.target.value) })}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Número de Registro TSE</label>
                  <input
                    type="text"
                    value={pesquisa.registro_tse}
                    onChange={(e) => setPesquisa({ ...pesquisa, registro_tse: e.target.value })}
                    placeholder="Ex: RO-00001/2024"
                    className="input w-full"
                  />
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    Conforme Resolução TSE nº 23.600/2019
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Requisitos para Registro no TSE
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <li>• Identificação do contratante e do contratado</li>
                    <li>• Período de realização da pesquisa</li>
                    <li>• Metodologia utilizada</li>
                    <li>• Margem de erro e nível de confiança</li>
                    <li>• Plano amostral e ponderação</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
