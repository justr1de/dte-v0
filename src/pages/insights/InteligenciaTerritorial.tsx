import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  MapPin,
  Users,
  TrendingUp,
  Target,
  BarChart3,
  Filter,
  Download,
  RefreshCw,
  Layers,
  Percent
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
  ComposedChart,
  Line,
  Area,
  Treemap
} from 'recharts'

interface DadosTerritorial {
  zona: string
  municipio: string
  totalEleitores: number
  eleitoresMasculino: number
  eleitoresFeminino: number
  faixaEtaria: { [key: string]: number }
  escolaridade: { [key: string]: number }
  comparecimento: number
  abstencao: number
  potencialConquista: number
}

export default function InteligenciaTerritorial() {
  const [loading, setLoading] = useState(true)
  const [dadosTerritoriais, setDadosTerritoriais] = useState<DadosTerritorial[]>([])
  const [zonaSelecionada, setZonaSelecionada] = useState<string | null>(null)
  const [anoSelecionado, setAnoSelecionado] = useState('2022')
  const [filtroMunicipio, setFiltroMunicipio] = useState('todos')

  useEffect(() => {
    fetchData()
  }, [anoSelecionado])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar perfil do eleitorado
      const { data: perfilData } = await supabase
        .from('perfil_eleitorado')
        .select('*')
        .eq('ano', parseInt(anoSelecionado))

      // Buscar dados de comparecimento
      const { data: comparecimentoData } = await supabase
        .from('comparecimento_abstencao')
        .select('*')
        .eq('ano', parseInt(anoSelecionado))

      // Processar dados por zona
      const zonaMap = new Map<string, DadosTerritorial>()

      perfilData?.forEach(item => {
        const zona = item.zona_eleitoral?.toString() || 'N/A'
        if (!zonaMap.has(zona)) {
          zonaMap.set(zona, {
            zona,
            municipio: item.municipio || 'Rondônia',
            totalEleitores: 0,
            eleitoresMasculino: 0,
            eleitoresFeminino: 0,
            faixaEtaria: {},
            escolaridade: {},
            comparecimento: 0,
            abstencao: 0,
            potencialConquista: 0
          })
        }
        const zonaData = zonaMap.get(zona)!
        zonaData.totalEleitores += item.quantidade || 0

        // Agregar por sexo
        if (item.sexo === 'MASCULINO') {
          zonaData.eleitoresMasculino += item.quantidade || 0
        } else if (item.sexo === 'FEMININO') {
          zonaData.eleitoresFeminino += item.quantidade || 0
        }

        // Agregar por faixa etária
        if (item.faixa_etaria) {
          zonaData.faixaEtaria[item.faixa_etaria] = (zonaData.faixaEtaria[item.faixa_etaria] || 0) + (item.quantidade || 0)
        }

        // Agregar por escolaridade
        if (item.escolaridade) {
          zonaData.escolaridade[item.escolaridade] = (zonaData.escolaridade[item.escolaridade] || 0) + (item.quantidade || 0)
        }
      })

      // Adicionar dados de comparecimento
      comparecimentoData?.forEach(item => {
        const zona = item.zona_eleitoral?.toString() || 'N/A'
        if (zonaMap.has(zona)) {
          const zonaData = zonaMap.get(zona)!
          zonaData.comparecimento += item.comparecimento || 0
          zonaData.abstencao += item.abstencao || 0
        }
      })

      // Calcular potencial de conquista
      zonaMap.forEach(zona => {
        const taxaAbstencao = zona.totalEleitores > 0 
          ? (zona.abstencao / zona.totalEleitores) * 100 
          : 0
        zona.potencialConquista = Math.min(100, Math.round(50 + taxaAbstencao * 0.8))
      })

      const processedData = Array.from(zonaMap.values())
        .filter(z => z.totalEleitores > 0)
        .sort((a, b) => b.totalEleitores - a.totalEleitores)

      setDadosTerritoriais(processedData)
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalEleitores = dadosTerritoriais.reduce((acc, z) => acc + z.totalEleitores, 0)
  const totalMasculino = dadosTerritoriais.reduce((acc, z) => acc + z.eleitoresMasculino, 0)
  const totalFeminino = dadosTerritoriais.reduce((acc, z) => acc + z.eleitoresFeminino, 0)
  const totalComparecimento = dadosTerritoriais.reduce((acc, z) => acc + z.comparecimento, 0)
  const totalAbstencao = dadosTerritoriais.reduce((acc, z) => acc + z.abstencao, 0)

  const barData = dadosTerritoriais.slice(0, 10).map(z => ({
    zona: `Z${z.zona}`,
    eleitores: z.totalEleitores,
    masculino: z.eleitoresMasculino,
    feminino: z.eleitoresFeminino
  }))

  const pieDataGenero = [
    { name: 'Masculino', value: totalMasculino, color: '#3B82F6' },
    { name: 'Feminino', value: totalFeminino, color: '#EC4899' }
  ]

  const pieDataComparecimento = [
    { name: 'Comparecimento', value: totalComparecimento, color: '#10B981' },
    { name: 'Abstenção', value: totalAbstencao, color: '#EF4444' }
  ]

  // Agregar faixas etárias de todas as zonas
  const faixaEtariaTotal: { [key: string]: number } = {}
  dadosTerritoriais.forEach(z => {
    Object.entries(z.faixaEtaria).forEach(([faixa, qtd]) => {
      faixaEtariaTotal[faixa] = (faixaEtariaTotal[faixa] || 0) + qtd
    })
  })

  const faixaEtariaData = Object.entries(faixaEtariaTotal)
    .map(([faixa, qtd]) => ({ faixa, quantidade: qtd }))
    .sort((a, b) => {
      const ordem = ['16 a 17', '18 a 20', '21 a 24', '25 a 29', '30 a 34', '35 a 39', '40 a 44', '45 a 49', '50 a 54', '55 a 59', '60 a 64', '65 a 69', '70 a 74', '75 a 79', '80 a 84', '85 a 89', '90 a 94', '95 a 99', '100 ou mais']
      return ordem.indexOf(a.faixa) - ordem.indexOf(b.faixa)
    })

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

  const zonaDetalhe = zonaSelecionada 
    ? dadosTerritoriais.find(z => z.zona === zonaSelecionada)
    : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="w-7 h-7 text-emerald-500" />
            Inteligência Territorial
          </h1>
          <p className="text-[var(--text-muted)] mt-1">
            Análise detalhada do eleitorado por zona e região
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(e.target.value)}
            className="input"
          >
            <option value="2024">2024</option>
            <option value="2022">2022</option>
            <option value="2020">2020</option>
          </select>
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Zonas</p>
                  <p className="text-2xl font-bold">{dadosTerritoriais.length}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Total Eleitores</p>
                  <p className="text-2xl font-bold">{totalEleitores.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-pink-100 text-pink-600">
                  <Percent className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">% Feminino</p>
                  <p className="text-2xl font-bold">
                    {totalEleitores > 0 ? ((totalFeminino / totalEleitores) * 100).toFixed(1) : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100 text-green-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Comparecimento</p>
                  <p className="text-2xl font-bold">
                    {(totalComparecimento + totalAbstencao) > 0 
                      ? ((totalComparecimento / (totalComparecimento + totalAbstencao)) * 100).toFixed(1) 
                      : 0}%
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Potencial Médio</p>
                  <p className="text-2xl font-bold">
                    {Math.round(dadosTerritoriais.reduce((acc, z) => acc + z.potencialConquista, 0) / dadosTerritoriais.length || 0)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Gráficos Principais */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Eleitores por Zona */}
            <div className="lg:col-span-2 card p-6">
              <h3 className="text-lg font-semibold mb-4">Distribuição por Zona Eleitoral</h3>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="zona" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                  <Legend />
                  <Bar dataKey="masculino" name="Masculino" stackId="a" fill="#3B82F6" />
                  <Bar dataKey="feminino" name="Feminino" stackId="a" fill="#EC4899" />
                  <Line type="monotone" dataKey="eleitores" name="Total" stroke="#10B981" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Gráficos de Pizza */}
            <div className="space-y-4">
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Distribuição por Gênero</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={pieDataGenero}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieDataGenero.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Comparecimento vs Abstenção</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={pieDataComparecimento}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieDataComparecimento.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Pirâmide Etária */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Distribuição por Faixa Etária</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={faixaEtariaData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="faixa" type="category" width={80} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                <Bar dataKey="quantidade" name="Eleitores" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela de Zonas */}
          <div className="card">
            <div className="p-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold">Detalhamento por Zona</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Zona</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Eleitores</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Masculino</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Feminino</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Comparecimento</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Abstenção</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Potencial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {dadosTerritoriais.map((zona) => (
                    <tr 
                      key={zona.zona}
                      className={`hover:bg-[var(--bg-secondary)] cursor-pointer ${
                        zonaSelecionada === zona.zona ? 'bg-emerald-50' : ''
                      }`}
                      onClick={() => setZonaSelecionada(zona.zona)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-500" />
                          <span className="font-medium">Zona {zona.zona}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {zona.totalEleitores.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right text-blue-600">
                        {zona.eleitoresMasculino.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right text-pink-600">
                        {zona.eleitoresFeminino.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right text-green-600">
                        {zona.comparecimento.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-right text-red-500">
                        {zona.abstencao.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${zona.potencialConquista}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{zona.potencialConquista}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4 bg-emerald-50 border-emerald-200">
              <h4 className="font-medium text-emerald-800 mb-2">Zonas Prioritárias</h4>
              <p className="text-sm text-emerald-700">
                As {Math.min(3, dadosTerritoriais.length)} maiores zonas concentram{' '}
                {((dadosTerritoriais.slice(0, 3).reduce((acc, z) => acc + z.totalEleitores, 0) / totalEleitores) * 100).toFixed(1)}%{' '}
                do eleitorado total.
              </p>
            </div>
            <div className="card p-4 bg-blue-50 border-blue-200">
              <h4 className="font-medium text-blue-800 mb-2">Perfil Demográfico</h4>
              <p className="text-sm text-blue-700">
                O eleitorado é composto por{' '}
                {((totalFeminino / totalEleitores) * 100).toFixed(1)}% de mulheres e{' '}
                {((totalMasculino / totalEleitores) * 100).toFixed(1)}% de homens.
              </p>
            </div>
            <div className="card p-4 bg-amber-50 border-amber-200">
              <h4 className="font-medium text-amber-800 mb-2">Oportunidade</h4>
              <p className="text-sm text-amber-700">
                {dadosTerritoriais.filter(z => z.potencialConquista > 60).length} zonas apresentam 
                potencial de conquista acima de 60%, representando oportunidades estratégicas.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
