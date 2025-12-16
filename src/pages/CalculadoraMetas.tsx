import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
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
  Award
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

export default function CalculadoraMetas() {
  const [loading, setLoading] = useState(true)
  const [dadosEleitorais, setDadosEleitorais] = useState<any[]>([])
  
  // Parâmetros de entrada
  const [cargo, setCargo] = useState('prefeito')
  const [taxaComparecimento, setTaxaComparecimento] = useState(80)
  const [margemSeguranca, setMargemSeguranca] = useState(5)
  const [concorrentes, setConcorrentes] = useState(5)
  const [metaPercentual, setMetaPercentual] = useState(0) // 0 = calcular automaticamente
  
  // Resultado
  const [resultado, setResultado] = useState<MetaCalculada | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar dados de comparecimento/abstenção
      const { data: comparecimentoData } = await supabase
        .from('comparecimento_abstencao')
        .select('*')
        .eq('ano', 2022)

      // Buscar perfil do eleitorado
      const { data: perfilData } = await supabase
        .from('perfil_eleitorado')
        .select('*')
        .eq('ano', 2022)

      setDadosEleitorais([
        ...(comparecimentoData || []),
        ...(perfilData || [])
      ])

      // Calcular automaticamente ao carregar
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

    // Calcular total de eleitores por zona
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

    // Calcular totais
    let totalEleitores = 0
    let totalComparecimento = 0
    zonaMap.forEach(z => {
      totalEleitores += z.eleitores
      totalComparecimento += z.comparecimento
    })

    // Se não tiver dados, usar valores de exemplo
    if (totalEleitores === 0) {
      totalEleitores = 150000
      totalComparecimento = 120000
    }

    // Calcular comparecimento estimado
    const comparecimentoEstimado = Math.round(totalEleitores * (taxaComparecimento / 100))

    // Calcular votos necessários baseado no cargo
    let percentualBase: number
    switch (cargo) {
      case 'prefeito':
        // Precisa de maioria absoluta (50% + 1) ou maioria simples em cidades pequenas
        percentualBase = metaPercentual > 0 ? metaPercentual : 50.1
        break
      case 'vereador':
        // Quociente eleitoral: votos válidos / número de vagas
        // Estimativa: 5-8% dependendo do número de candidatos
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

    // Calcular votos necessários
    const votosNecessarios = Math.ceil(comparecimentoEstimado * (percentualBase / 100))
    
    // Aplicar margem de segurança
    const metaFinal = Math.ceil(votosNecessarios * (1 + margemSeguranca / 100))

    // Distribuir meta por zona (proporcional ao número de eleitores)
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

  const barData = resultado?.distribuicaoPorZona.slice(0, 10).map(z => ({
    zona: `Z${z.zona}`,
    meta: z.meta,
    eleitores: z.eleitores
  })) || []

  const pieData = [
    { name: 'Meta de Votos', value: resultado?.metaFinal || 0, color: '#10B981' },
    { name: 'Outros', value: (resultado?.comparecimentoEstimado || 0) - (resultado?.metaFinal || 0), color: '#E5E7EB' }
  ]

  const progressData = resultado?.distribuicaoPorZona.slice(0, 8).map((z, i) => ({
    zona: `Zona ${z.zona}`,
    progresso: 0, // Seria atualizado com dados reais de campanha
    meta: z.meta
  })) || []

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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calculator className="w-7 h-7 text-cyan-500" />
            Calculadora de Meta de Votos
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Calcule a meta de votos necessária para vencer a eleição
          </p>
        </div>

        <button
          onClick={() => calcularMeta()}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Recalcular
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Configuração */}
          <div className="space-y-4">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Parâmetros
              </h3>

              <div className="space-y-5">
                {/* Cargo */}
                <div>
                  <label className="block text-sm font-medium mb-2">Cargo Pretendido</label>
                  <select
                    value={cargo}
                    onChange={(e) => setCargo(e.target.value)}
                    className="input w-full"
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
                  <label className="block text-sm font-medium mb-2">
                    Taxa de Comparecimento Estimada: {taxaComparecimento}%
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="95"
                    value={taxaComparecimento}
                    onChange={(e) => setTaxaComparecimento(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                    <span>60%</span>
                    <span>95%</span>
                  </div>
                </div>

                {/* Margem de Segurança */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Margem de Segurança: {margemSeguranca}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={margemSeguranca}
                    onChange={(e) => setMargemSeguranca(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Adiciona uma margem extra à meta calculada
                  </p>
                </div>

                {/* Número de Concorrentes (para vereador) */}
                {cargo === 'vereador' && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Número de Concorrentes: {concorrentes}
                    </label>
                    <input
                      type="range"
                      min="3"
                      max="30"
                      value={concorrentes}
                      onChange={(e) => setConcorrentes(parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Meta Percentual Manual */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Meta Percentual Manual: {metaPercentual > 0 ? `${metaPercentual}%` : 'Automático'}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    value={metaPercentual}
                    onChange={(e) => setMetaPercentual(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    0 = calcular automaticamente baseado no cargo
                  </p>
                </div>

                <button
                  onClick={() => calcularMeta()}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Calculator className="w-4 h-4" />
                  Calcular Meta
                </button>
              </div>
            </div>

            {/* Dicas */}
            <div className="card p-4 bg-cyan-50 border-cyan-200">
              <h4 className="font-medium text-cyan-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Dicas
              </h4>
              <ul className="text-sm text-cyan-700 space-y-1">
                <li>• Prefeito: maioria absoluta (50%+1)</li>
                <li>• Vereador: quociente eleitoral</li>
                <li>• Deputado: cláusula de barreira</li>
                <li>• Adicione margem de segurança</li>
              </ul>
            </div>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-2 space-y-4">
            {resultado && (
              <>
                {/* Cards de Resultado */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-blue-500" />
                      <span className="text-xs text-[var(--text-muted)]">Total Eleitores</span>
                    </div>
                    <p className="text-xl font-bold">{resultado.totalEleitores.toLocaleString('pt-BR')}</p>
                  </div>

                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-amber-500" />
                      <span className="text-xs text-[var(--text-muted)]">Comparecimento Est.</span>
                    </div>
                    <p className="text-xl font-bold">{resultado.comparecimentoEstimado.toLocaleString('pt-BR')}</p>
                  </div>

                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Percent className="w-5 h-5 text-purple-500" />
                      <span className="text-xs text-[var(--text-muted)]">% Necessário</span>
                    </div>
                    <p className="text-xl font-bold">{resultado.percentualNecessario.toFixed(1)}%</p>
                  </div>

                  <div className="card p-4 bg-emerald-50 border-emerald-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-emerald-600" />
                      <span className="text-xs text-emerald-700">META FINAL</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-700">
                      {resultado.metaFinal.toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                {/* Gráficos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Gráfico de Pizza */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4">Proporção da Meta</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${(value / resultado.comparecimentoEstimado * 100).toFixed(1)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Gráfico de Barras por Zona */}
                  <div className="card p-6">
                    <h3 className="text-lg font-semibold mb-4">Meta por Zona</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="zona" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                        <Bar dataKey="meta" name="Meta" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Tabela de Distribuição */}
                <div className="card">
                  <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Distribuição de Metas por Zona</h3>
                    <button className="btn-secondary flex items-center gap-2 text-sm">
                      <Download className="w-4 h-4" />
                      Exportar
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[var(--bg-secondary)]">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Zona</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Eleitores</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">Meta de Votos</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold">% do Total</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Progresso</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)]">
                        {resultado.distribuicaoPorZona.map((zona, index) => (
                          <tr key={zona.zona} className="hover:bg-[var(--bg-secondary)]">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-cyan-500" />
                                <span className="font-medium">Zona {zona.zona}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right">
                              {zona.eleitores.toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-emerald-600">
                              {zona.meta.toLocaleString('pt-BR')}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {((zona.meta / resultado.metaFinal) * 100).toFixed(1)}%
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-cyan-500 rounded-full"
                                    style={{ width: '0%' }}
                                  />
                                </div>
                                <span className="text-xs text-[var(--text-muted)]">0%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-[var(--bg-secondary)] font-semibold">
                        <tr>
                          <td className="px-4 py-3">TOTAL</td>
                          <td className="px-4 py-3 text-right">
                            {resultado.totalEleitores.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-600">
                            {resultado.metaFinal.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-right">100%</td>
                          <td className="px-4 py-3">-</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Insights */}
                <div className="card p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    Resumo da Estratégia
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <h4 className="font-medium text-emerald-800 mb-2">Meta Principal</h4>
                      <p className="text-sm text-emerald-700">
                        Para vencer como <strong>{getCargoLabel(cargo)}</strong>, você precisa conquistar 
                        aproximadamente <strong>{resultado.metaFinal.toLocaleString('pt-BR')} votos</strong>, 
                        o que representa <strong>{resultado.percentualNecessario.toFixed(1)}%</strong> dos 
                        votos válidos (já com margem de segurança de {margemSeguranca}%).
                      </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-800 mb-2">Média por Zona</h4>
                      <p className="text-sm text-blue-700">
                        Distribuindo proporcionalmente, cada zona deve contribuir em média com 
                        <strong> {Math.round(resultado.metaFinal / resultado.distribuicaoPorZona.length).toLocaleString('pt-BR')} votos</strong>. 
                        Foque nas zonas com maior número de eleitores para maximizar resultados.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
