import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  AlertTriangle,
  Users,
  TrendingDown,
  TrendingUp,
  MapPin,
  Calendar,
  Target,
  Download,
  RefreshCw,
  Percent,
  BarChart3
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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  ComposedChart
} from 'recharts'

interface DadosAbstencao {
  zona: string
  ano: number
  aptos: number
  comparecimento: number
  abstencao: number
  taxaAbstencao: number
  variacao: number
  turno: number
}

interface ResumoAnual {
  ano: number
  totalAptos: number
  totalComparecimento: number
  totalAbstencao: number
  taxaAbstencao: number
}

export default function AnaliseAbstencao() {
  const [loading, setLoading] = useState(true)
  const [dadosAbstencao, setDadosAbstencao] = useState<DadosAbstencao[]>([])
  const [resumoAnual, setResumoAnual] = useState<ResumoAnual[]>([])
  const [anoSelecionado, setAnoSelecionado] = useState('2022')
  const [turnoSelecionado, setTurnoSelecionado] = useState('1')

  useEffect(() => {
    fetchData()
  }, [anoSelecionado, turnoSelecionado])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar dados de comparecimento/abstenção
      const { data: comparecimentoData } = await supabase
        .from('comparecimento_abstencao')
        .select('*')
        .order('ano', { ascending: true })

      if (comparecimentoData && comparecimentoData.length > 0) {
        // Processar dados por zona e ano
        const processedData: DadosAbstencao[] = comparecimentoData
          .filter(item => item.turno?.toString() === turnoSelecionado || turnoSelecionado === 'todos')
          .map(item => ({
            zona: item.zona_eleitoral?.toString() || 'N/A',
            ano: item.ano || 2022,
            aptos: item.aptos || 0,
            comparecimento: item.comparecimento || 0,
            abstencao: item.abstencao || 0,
            taxaAbstencao: item.aptos > 0 ? ((item.abstencao || 0) / item.aptos) * 100 : 0,
            variacao: 0,
            turno: item.turno || 1
          }))

        // Filtrar por ano selecionado
        const dadosAno = processedData.filter(d => d.ano.toString() === anoSelecionado)
        setDadosAbstencao(dadosAno)

        // Calcular resumo anual
        const anosUnicos = [...new Set(comparecimentoData.map(d => d.ano))].sort()
        const resumos: ResumoAnual[] = anosUnicos.map(ano => {
          const dadosAnoAtual = comparecimentoData.filter(d => d.ano === ano)
          const totalAptos = dadosAnoAtual.reduce((acc, d) => acc + (d.aptos || 0), 0)
          const totalComparecimento = dadosAnoAtual.reduce((acc, d) => acc + (d.comparecimento || 0), 0)
          const totalAbstencao = dadosAnoAtual.reduce((acc, d) => acc + (d.abstencao || 0), 0)
          return {
            ano,
            totalAptos,
            totalComparecimento,
            totalAbstencao,
            taxaAbstencao: totalAptos > 0 ? (totalAbstencao / totalAptos) * 100 : 0
          }
        })
        setResumoAnual(resumos)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cálculos de resumo
  const totalAptos = dadosAbstencao.reduce((acc, d) => acc + d.aptos, 0)
  const totalComparecimento = dadosAbstencao.reduce((acc, d) => acc + d.comparecimento, 0)
  const totalAbstencao = dadosAbstencao.reduce((acc, d) => acc + d.abstencao, 0)
  const taxaAbstencaoGeral = totalAptos > 0 ? (totalAbstencao / totalAptos) * 100 : 0

  // Dados para gráficos
  const barDataZonas = dadosAbstencao
    .sort((a, b) => b.taxaAbstencao - a.taxaAbstencao)
    .slice(0, 12)
    .map(d => ({
      zona: `Z${d.zona}`,
      taxaAbstencao: parseFloat(d.taxaAbstencao.toFixed(1)),
      abstencao: d.abstencao,
      comparecimento: d.comparecimento
    }))

  const lineDataHistorico = resumoAnual.map(r => ({
    ano: r.ano.toString(),
    taxaAbstencao: parseFloat(r.taxaAbstencao.toFixed(1)),
    totalAbstencao: r.totalAbstencao
  }))

  const pieData = [
    { name: 'Compareceram', value: totalComparecimento, color: '#10B981' },
    { name: 'Abstiveram', value: totalAbstencao, color: '#EF4444' }
  ]

  // Classificar zonas por nível de abstenção
  const zonasAltaAbstencao = dadosAbstencao.filter(d => d.taxaAbstencao > 25)
  const zonasMediaAbstencao = dadosAbstencao.filter(d => d.taxaAbstencao > 15 && d.taxaAbstencao <= 25)
  const zonasBaixaAbstencao = dadosAbstencao.filter(d => d.taxaAbstencao <= 15)

  const distribuicaoRisco = [
    { name: 'Alta (>25%)', value: zonasAltaAbstencao.length, color: '#EF4444' },
    { name: 'Média (15-25%)', value: zonasMediaAbstencao.length, color: '#F59E0B' },
    { name: 'Baixa (<15%)', value: zonasBaixaAbstencao.length, color: '#10B981' }
  ]

  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="w-7 h-7 text-red-500" />
            Análise de Abstenção
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Identifique padrões de abstenção e oportunidades de mobilização
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(e.target.value)}
            className="input"
          >
            {resumoAnual.map(r => (
              <option key={r.ano} value={r.ano.toString()}>{r.ano}</option>
            ))}
          </select>
          <select
            value={turnoSelecionado}
            onChange={(e) => setTurnoSelecionado(e.target.value)}
            className="input"
          >
            <option value="1">1º Turno</option>
            <option value="2">2º Turno</option>
            <option value="todos">Todos</option>
          </select>
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Eleitores Aptos</p>
                  <p className="text-2xl font-bold">{totalAptos.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Compareceram</p>
                  <p className="text-2xl font-bold">{totalComparecimento.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-red-100 text-red-600">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Abstiveram</p>
                  <p className="text-2xl font-bold">{totalAbstencao.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="card p-4 bg-red-50 border-red-200">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-red-200 text-red-700">
                  <Percent className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-red-700">Taxa Abstenção</p>
                  <p className="text-2xl font-bold text-red-700">{taxaAbstencaoGeral.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Zonas Críticas</p>
                  <p className="text-2xl font-bold">{zonasAltaAbstencao.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos Principais */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Taxa de Abstenção por Zona */}
            <div className="lg:col-span-2 card p-6">
              <h3 className="text-lg font-semibold mb-4">Taxa de Abstenção por Zona</h3>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={barDataZonas}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="zona" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="abstencao" name="Abstenção" fill="#EF4444" />
                  <Bar yAxisId="left" dataKey="comparecimento" name="Comparecimento" fill="#10B981" />
                  <Line yAxisId="right" type="monotone" dataKey="taxaAbstencao" name="Taxa %" stroke="#F59E0B" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Distribuição Geral */}
            <div className="space-y-4">
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Comparecimento vs Abstenção</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
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

              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Classificação de Risco</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={distribuicaoRisco}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, value }) => `${value}`}
                    >
                      {distribuicaoRisco.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Evolução Histórica */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Evolução Histórica da Abstenção</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={lineDataHistorico}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ano" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="taxaAbstencao" 
                  name="Taxa de Abstenção %" 
                  stroke="#EF4444" 
                  fill="#FEE2E2" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela de Zonas Críticas */}
          <div className="card">
            <div className="p-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold">Zonas com Alta Abstenção (Prioridade de Mobilização)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Zona</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Eleitores Aptos</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Comparecimento</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Abstenção</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Taxa</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Nível</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Ação Sugerida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {dadosAbstencao
                    .sort((a, b) => b.taxaAbstencao - a.taxaAbstencao)
                    .slice(0, 10)
                    .map((zona) => {
                      const nivel = zona.taxaAbstencao > 25 ? 'Crítico' : zona.taxaAbstencao > 15 ? 'Atenção' : 'Normal'
                      const nivelColor = zona.taxaAbstencao > 25 ? 'text-red-600 bg-red-100' : zona.taxaAbstencao > 15 ? 'text-amber-600 bg-amber-100' : 'text-green-600 bg-green-100'
                      const acao = zona.taxaAbstencao > 25 
                        ? 'Mobilização intensiva' 
                        : zona.taxaAbstencao > 15 
                          ? 'Campanha de conscientização'
                          : 'Manutenção'
                      
                      return (
                        <tr key={zona.zona} className="hover:bg-[var(--bg-secondary)]">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-red-500" />
                              <span className="font-medium">Zona {zona.zona}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">{zona.aptos.toLocaleString('pt-BR')}</td>
                          <td className="px-4 py-3 text-right text-green-600">
                            {zona.comparecimento.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-right text-red-500">
                            {zona.abstencao.toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            {zona.taxaAbstencao.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${nivelColor}`}>
                              {nivel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-[var(--text-muted)]">
                            {acao}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights e Recomendações */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4 bg-red-50 border-red-200">
              <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Alerta Crítico
              </h4>
              <p className="text-sm text-red-700">
                {zonasAltaAbstencao.length} zonas apresentam taxa de abstenção acima de 25%. 
                Estas áreas representam {zonasAltaAbstencao.reduce((acc, z) => acc + z.abstencao, 0).toLocaleString('pt-BR')} eleitores 
                que não compareceram às urnas.
              </p>
            </div>
            <div className="card p-4 bg-amber-50 border-amber-200">
              <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Oportunidade
              </h4>
              <p className="text-sm text-amber-700">
                Mobilizar apenas 10% dos abstencionistas pode adicionar aproximadamente{' '}
                {Math.round(totalAbstencao * 0.1).toLocaleString('pt-BR')} votos à sua campanha.
              </p>
            </div>
            <div className="card p-4 bg-blue-50 border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Estratégia
              </h4>
              <p className="text-sm text-blue-700">
                Foque em campanhas de transporte e conscientização nas zonas críticas. 
                Considere parcerias com associações de bairro e igrejas locais.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
