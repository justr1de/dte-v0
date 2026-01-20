'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import {
  Calculator,
  Target,
  Users,
  TrendingUp,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Percent,
  Award,
  HelpCircle,
  Info,
  Sliders
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'

interface MetaCalculada {
  cargo: string
  totalEleitores: number
  comparecimentoEstimado: number
  votosNecessarios: number
  percentualNecessario: number
  margemSeguranca: number
  metaFinal: number
  distribuicaoPorZona: { zona: string; meta: number; eleitores: number }[]
}

interface Cenario {
  id: string
  nome: string
  comparecimento: number
  margem: number
  distribuicao: number[]
  resultado: MetaCalculada | null
}

export default function CalculadoraMetas() {
  const [loading, setLoading] = useState(true)
  const [dadosEleitorais, setDadosEleitorais] = useState<any[]>([])
  const [mostrarGraficoDistribuicao, setMostrarGraficoDistribuicao] = useState(true)
  const [mostrarDistribuicaoVotos, setMostrarDistribuicaoVotos] = useState(false)
  
  // Parâmetros de entrada
  const [cargo, setCargo] = useState('prefeito')
  const [taxaComparecimento, setTaxaComparecimento] = useState(80)
  const [margemSeguranca, setMargemSeguranca] = useState(5)
  const [concorrentes, setConcorrentes] = useState(5)
  const [metaPercentual, setMetaPercentual] = useState(0)
  
  // Distribuição de votos
  const [distribuicao, setDistribuicao] = useState<number[]>(Array(5).fill(100 / 5))
  
  // Resultado e cenários
  const [resultado, setResultado] = useState<MetaCalculada | null>(null)
  const [cenarios, setCenarios] = useState<Cenario[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: comparecimentoData } = await supabase
        .from('comparecimento_abstencao')
        .select('*')
        .eq('ano', 2022)

      const { data: perfilData } = await supabase
        .from('perfil_eleitorado')
        .select('*')
        .eq('ano', 2022)

      setDadosEleitorais([
        ...(comparecimentoData || []),
        ...(perfilData || [])
      ])

      if (comparecimentoData && comparecimentoData.length > 0) {
        calcularMeta(comparecimentoData)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const calcularMeta = (dados?: any[]) => {
    const dadosBase = dados || dadosEleitorais

    const zonaMap = new Map<string, { eleitores: number; comparecimento: number }>()
    
    dadosBase.forEach(item => {
      const zona = item.zona_eleitoral?.toString() || 'N/A'
      if (!zonaMap.has(zona)) {
        zonaMap.set(zona, { eleitores: 0, comparecimento: 0 })
      }
      const zonaData = zonaMap.get(zona)!
      zonaData.eleitores += item.aptos || item.quantidade || 0
      zonaData.comparecimento += item.comparecimento || 0
    })

    let totalEleitores = 0
    let totalComparecimento = 0
    zonaMap.forEach(z => {
      totalEleitores += z.eleitores
      totalComparecimento += z.comparecimento
    })

    if (totalEleitores === 0) {
      totalEleitores = 150000
      totalComparecimento = 120000
    }

    const comparecimentoEstimado = Math.round(totalEleitores * (taxaComparecimento / 100))

    let percentualBase: number
    switch (cargo) {
      case 'prefeito':
        percentualBase = metaPercentual > 0 ? metaPercentual : 50.1
        break
      case 'vereador':
        percentualBase = metaPercentual > 0 ? metaPercentual : Math.max(5, 100 / (concorrentes * 3))
        break
      case 'governador':
        percentualBase = metaPercentual > 0 ? metaPercentual : 50.1
        break
      case 'deputado_estadual':
        percentualBase = metaPercentual > 0 ? metaPercentual : 2.5
        break
      case 'deputado_federal':
        percentualBase = metaPercentual > 0 ? metaPercentual : 1.5
        break
      default:
        percentualBase = metaPercentual > 0 ? metaPercentual : 50.1
    }

    const votosNecessarios = Math.ceil(comparecimentoEstimado * (percentualBase / 100))
    const metaFinal = Math.ceil(votosNecessarios * (1 + margemSeguranca / 100))

    const distribuicaoPorZona = Array.from(zonaMap.entries()).map(([zona, data]) => {
      const proporcao = totalEleitores > 0 ? data.eleitores / totalEleitores : 0
      return {
        zona,
        meta: Math.ceil(metaFinal * proporcao),
        eleitores: data.eleitores
      }
    }).filter(z => z.eleitores > 0).sort((a, b) => b.eleitores - a.eleitores)

    setResultado({
      cargo,
      totalEleitores,
      comparecimentoEstimado,
      votosNecessarios,
      percentualNecessario: percentualBase,
      margemSeguranca,
      metaFinal,
      distribuicaoPorZona
    })
  }

  // Adicionar cenário
  const adicionarCenario = () => {
    if (!resultado) return
    
    const novoCenario: Cenario = {
      id: Date.now().toString(),
      nome: `Cenário ${cenarios.length + 1}`,
      comparecimento: taxaComparecimento,
      margem: margemSeguranca,
      distribuicao: [...distribuicao],
      resultado: { ...resultado }
    }
    setCenarios([...cenarios, novoCenario])
  }

  // Atualizar distribuição
  const atualizarDistribuicao = (index: number, valor: number) => {
    const novaDistribuicao = [...distribuicao]
    novaDistribuicao[index] = Math.max(0, Math.min(100, valor))
    
    const soma = novaDistribuicao.reduce((a, b) => a + b, 0)
    if (soma > 0) {
      setDistribuicao(novaDistribuicao.map(v => (v / soma) * 100))
    }
  }

  const barData = resultado?.distribuicaoPorZona.slice(0, 10).map(z => ({
    zona: `Z${z.zona}`,
    meta: z.meta,
    eleitores: z.eleitores
  })) || []

  const pieData = [
    { name: 'Meta de Votos', value: resultado?.metaFinal || 0, color: '#10B981' },
    { name: 'Outros', value: (resultado?.comparecimentoEstimado || 0) - (resultado?.metaFinal || 0), color: '#E5E7EB' }
  ]

  const distribuicaoConcorrentes = () => {
    if (!resultado) return []
    const votosDisponiveis = resultado.comparecimentoEstimado
    const votosCandidata = resultado.metaFinal
    const votosPorConcorrente = Math.floor((votosDisponiveis - votosCandidata) / (concorrentes - 1))
    const data = [{ nome: 'Você', votos: votosCandidata, percentual: ((votosCandidata / votosDisponiveis) * 100).toFixed(1) }]
    for (let i = 1; i < concorrentes; i++) {
      data.push({ nome: `Concorrente ${i}`, votos: votosPorConcorrente, percentual: ((votosPorConcorrente / votosDisponiveis) * 100).toFixed(1) })
    }
    return data
  }
  const distribuicaoData = distribuicaoConcorrentes()

  const cenarioComparison = cenarios.map((c, idx) => ({
    nome: c.nome,
    votos: c.resultado?.metaFinal || 0,
    percentual: c.resultado?.percentualNecessario || 0
  }))

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

  const getCargoLabel = (cargo: string) => {
    const labels: { [key: string]: string } = {
      'prefeito': 'Prefeito',
      'vereador': 'Vereador',
      'governador': 'Governador',
      'deputado_estadual': 'Deputado Estadual',
      'deputado_federal': 'Deputado Federal'
    }
    return labels[cargo] || cargo
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
            <Calculator className="w-8 h-8 text-cyan-500" />
            Calculadora de Meta de Votos
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 mt-2">
            Calcule a meta de votos necessária para vencer a eleição com segurança
          </p>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => calcularMeta()}
              className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg"
            >
              <RefreshCw className="w-4 h-4" />
              Recalcular
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Recalcula a meta com os parâmetros atuais</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      ) : (
        <>
          {/* Gráfico de Distribuição entre Concorrentes */}
          {mostrarGraficoDistribuicao && resultado && (
            <div className="card p-6 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                  <Users className="w-5 h-5 text-cyan-500" />
                  Distribuição de Votos entre Concorrentes
                </h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Distribuição estimada de votos entre você e os concorrentes</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distribuicaoData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => (value as number).toLocaleString('pt-BR')} />
                  <Bar dataKey="votos" fill="#10B981" name="Votos" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {distribuicaoData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className={idx === 0 ? 'font-semibold text-green-600' : 'text-gray-700 dark:text-gray-300'}>{item.nome}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className={`h-2 rounded-full ${idx === 0 ? 'bg-green-500' : 'bg-gray-400'}`} style={{ width: `${item.percentual}%` }} />
                      </div>
                      <span className="text-right w-16 font-medium text-gray-900 dark:text-white">{item.percentual}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Card Explicativo */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-3">Como Usar a Calculadora de Metas</h3>
                
                <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                  <div>
                    <p className="font-semibold mb-1">📋 O que é?</p>
                    <p>A Calculadora de Metas ajuda você a determinar quantos votos são necessários para vencer a eleição, considerando o cargo, taxa de comparecimento e margem de segurança.</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-1">💡 Exemplo Prático:</p>
                    <div className="bg-white dark:bg-gray-800 bg-opacity-70 rounded p-3 space-y-1 text-xs">
                      <p><strong>Cenário:</strong> Candidato a Prefeito em município com 100.000 eleitores</p>
                      <p><strong>Parâmetros:</strong> 80% comparecimento, 5% margem de segurança</p>
                      <p><strong>Cálculo:</strong></p>
                      <ul className="list-disc list-inside ml-2 space-y-0.5">
                        <li>Eleitores que votarão: 100.000 × 80% = 80.000</li>
                        <li>Votos necessários (50%+1): 80.000 × 50.1% = 40.080</li>
                        <li>Com margem de 5%: 40.080 × 1.05 = 42.084 votos</li>
                      </ul>
                      <p className="font-semibold mt-1">✓ Meta Final: 42.084 votos</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-1">🎯 Dicas de Uso:</p>
                    <ul className="list-disc list-inside space-y-0.5">
                      <li>Ajuste a taxa de comparecimento baseado em eleições anteriores</li>
                      <li>Aumente a margem de segurança em disputas acirradas</li>
                      <li>Use a distribuição por zona para focar em regiões estratégicas</li>
                      <li>Revise a meta conforme a campanha avança</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Configuração */}
          <div className="space-y-4">
            <div className="card p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <Target className="w-5 h-5 text-cyan-500" />
                Parâmetros
              </h3>

              <div className="space-y-5">
                {/* Cargo */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">Cargo Pretendido</label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Selecione o cargo que você pretende concorrer</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <select
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="input w-full bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2"
                  >
                    <option value="prefeito">Prefeito</option>
                    <option value="vereador">Vereador</option>
                    <option value="governador">Governador</option>
                    <option value="deputado_estadual">Deputado Estadual</option>
                    <option value="deputado_federal">Deputado Federal</option>
                  </select>
                </div>

                {/* Taxa de Comparecimento */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Taxa de Comparecimento: <span className="text-cyan-600 font-bold">{taxaComparecimento}%</span>
                    </label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Porcentagem estimada de eleitores que irão votar</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="95"
                    value={taxaComparecimento}
                    onChange={(e) => setTaxaComparecimento(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>60%</span>
                    <span>95%</span>
                  </div>
                </div>

                {/* Margem de Segurança */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Margem de Segurança: <span className="text-green-600 font-bold">{margemSeguranca}%</span>
                    </label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Margem extra para garantir a vitória em caso de variações</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={margemSeguranca}
                    onChange={(e) => setMargemSeguranca(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Adiciona uma margem extra à meta calculada
                  </p>
                </div>

                {/* Número de Concorrentes */}
                {cargo === 'vereador' && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Número de Concorrentes: <span className="text-purple-600 font-bold">{concorrentes}</span>
                      </label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Número estimado de candidatos concorrendo</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="20"
                      value={concorrentes}
                      onChange={(e) => setConcorrentes(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>2</span>
                      <span>20</span>
                    </div>
                  </div>
                )}

                {/* Distribuição de Votos */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Distribuição de Votos
                      </label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Ajuste o percentual de votos esperado para cada concorrente</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <button
                      onClick={() => setMostrarDistribuicaoVotos(!mostrarDistribuicaoVotos)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        mostrarDistribuicaoVotos
                          ? 'bg-cyan-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Sliders className="w-4 h-4 inline mr-1" />
                      {mostrarDistribuicaoVotos ? 'Ocultar' : 'Mostrar'}
                    </button>
                  </div>

                  {mostrarDistribuicaoVotos && (
                    <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      {distribuicao.slice(0, concorrentes).map((pct, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                              Concorrente {idx + 1}
                            </label>
                            <span className="text-xs font-bold text-cyan-600">{pct.toFixed(1)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="0.1"
                            value={pct}
                            onChange={(e) => atualizarDistribuicao(idx, parseFloat(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Botões de Ação */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => calcularMeta()}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition-colors"
                  >
                    <Calculator className="w-4 h-4" />
                    Calcular Meta
                  </button>
                  <button
                    onClick={adicionarCenario}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Salvar Cenário
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-2 space-y-4">
            {resultado && (
              <>
                {/* Card de Resumo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="card p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900 dark:to-emerald-900 border border-green-200 dark:border-green-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="text-xs text-green-600 dark:text-green-400 font-semibold">Meta Final</p>
                        <p className="text-2xl font-bold text-green-900 dark:text-green-100">{resultado.metaFinal.toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">{resultado.percentualNecessario.toFixed(1)}% dos votos</p>
                      </div>
                    </div>
                  </div>

                  <div className="card p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900 dark:to-cyan-900 border border-blue-200 dark:border-blue-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold">Comparecimento Estimado</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{resultado.comparecimentoEstimado.toLocaleString('pt-BR')}</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">{taxaComparecimento}% de {resultado.totalEleitores.toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gráfico Pizza */}
                <div className="card p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <h4 className="font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                    <TrendingUp className="w-4 h-4 text-cyan-500" />
                    Proporção de Votos
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => (value as number).toLocaleString('pt-BR')} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Distribuição por Zona */}
                <div className="card p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                  <h4 className="font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                    <MapPin className="w-4 h-4 text-cyan-500" />
                    Top 10 Zonas Eleitorais
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="zona" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => (value as number).toLocaleString('pt-BR')} />
                      <Legend />
                      <Bar dataKey="meta" fill="#10B981" name="Meta" />
                      <Bar dataKey="eleitores" fill="#3B82F6" name="Eleitores" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
          </div>

          {/* Comparação de Cenários */}
          {cenarios.length > 0 && (
            <div className="card p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
              <h4 className="font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                <TrendingUp className="w-4 h-4 text-cyan-500" />
                Comparação de Cenários
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cenarioComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="nome" />
                  <YAxis />
                  <RechartsTooltip formatter={(value) => (value as number).toLocaleString('pt-BR')} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="votos"
                    stroke="#3b82f6"
                    name="Votos Necessários"
                  />
                  <Line
                    type="monotone"
                    dataKey="percentual"
                    stroke="#10b981"
                    name="Percentual (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Video Tutorial - Full Width */}
          <div className="card p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-gray-900 dark:text-white">
              <Info className="w-5 h-5 text-cyan-500" />
              Tutorial de Uso
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Assista ao vídeo para aprender como usar a calculadora de forma precisa
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-lg">
                  <video
                    width="100%"
                    height="auto"
                    controls
                    className="w-full h-auto"
                  >
                    <source src="/tutorial_calculadora_metas.mp4" type="video/mp4" />
                    Seu navegador não suporta o elemento de vídeo.
                  </video>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
                  <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Passo 1: Configure os Parâmetros</h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Selecione o cargo, município e defina o total de eleitores
                  </p>
                </div>

                <div className="space-y-2 p-4 bg-green-50 dark:bg-green-900 rounded-lg border border-green-200 dark:border-green-700">
                  <h4 className="font-semibold text-sm text-green-900 dark:text-green-100">Passo 2: Ajuste os Indicadores</h4>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    Use os sliders para definir comparecimento e margem de segurança
                  </p>
                </div>

                <div className="space-y-2 p-4 bg-purple-50 dark:bg-purple-900 rounded-lg border border-purple-200 dark:border-purple-700">
                  <h4 className="font-semibold text-sm text-purple-900 dark:text-purple-100">Passo 3: Distribua os Votos</h4>
                  <p className="text-xs text-purple-700 dark:text-purple-300">
                    Ajuste a distribuição esperada entre concorrentes
                  </p>
                </div>

                <div className="space-y-2 p-4 bg-orange-50 dark:bg-orange-900 rounded-lg border border-orange-200 dark:border-orange-700">
                  <h4 className="font-semibold text-sm text-orange-900 dark:text-orange-100">Passo 4: Analise Cenários</h4>
                  <p className="text-xs text-orange-700 dark:text-orange-300">
                    Salve diferentes cenários para comparar estratégias
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
