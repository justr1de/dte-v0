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
  Percent,
  AlertTriangle,
  UserPlus,
  GraduationCap,
  TrendingDown,
  Zap,
  Award,
  ChevronDown,
  ChevronUp
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
  Treemap,
  RadialBarChart,
  RadialBar
} from 'recharts'

interface DadosTerritorial {
  zona: number
  municipio: string
  totalEleitores: number
  eleitoresMasculino: number
  eleitoresFeminino: number
  faixaEtaria: { [key: string]: number }
  escolaridade: { [key: string]: number }
  comparecimento: number
  abstencao: number
  votosBrancos: number
  votosNulos: number
  taxaAlienacao: number
  novosEleitores: number
  indiceRenovacao: number
  potencialVotos: number
  densidadeEleitores: number
}

interface DadosBoletim {
  nr_zona: number
  nm_municipio: string
  qt_aptos: number
  qt_comparecimento: number
  qt_abstencoes: number
  nr_votavel: string
  qt_votos: number
}

export default function InteligenciaTerritorial() {
  const [loading, setLoading] = useState(true)
  const [dadosTerritoriais, setDadosTerritoriais] = useState<DadosTerritorial[]>([])
  const [zonaSelecionada, setZonaSelecionada] = useState<number | null>(null)
  const [anoSelecionado, setAnoSelecionado] = useState('2024')
  const [turnoSelecionado, setTurnoSelecionado] = useState('1')
  const [expandedZonas, setExpandedZonas] = useState<Set<number>>(new Set())

  useEffect(() => {
    fetchData()
  }, [anoSelecionado, turnoSelecionado])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar perfil do eleitorado (dados demográficos)
      const { data: perfilData } = await supabase
        .from('perfil_eleitorado')
        .select('*')
        .eq('ano', parseInt(anoSelecionado))

      // Buscar dados agregados dos boletins de urna
      const { data: boletinsData } = await supabase
        .rpc('get_dados_territoriais', { 
          p_ano: parseInt(anoSelecionado), 
          p_turno: parseInt(turnoSelecionado) 
        })

      // Processar dados por zona
      const zonaMap = new Map<number, DadosTerritorial>()

      // Processar perfil do eleitorado
      perfilData?.forEach(item => {
        const zona = item.zona || 0
        if (!zonaMap.has(zona)) {
          zonaMap.set(zona, {
            zona,
            municipio: item.municipio || 'Rondônia',
            totalEleitores: item.total_eleitores || 0,
            eleitoresMasculino: 0,
            eleitoresFeminino: 0,
            faixaEtaria: {},
            escolaridade: {},
            comparecimento: 0,
            abstencao: 0,
            votosBrancos: 0,
            votosNulos: 0,
            taxaAlienacao: 0,
            novosEleitores: 0,
            indiceRenovacao: 0,
            potencialVotos: 0,
            densidadeEleitores: 0
          })
        }
        
        const zonaData = zonaMap.get(zona)!
        
        // Processar dados de gênero
        if (item.dados_genero) {
          const genero = typeof item.dados_genero === 'string' 
            ? JSON.parse(item.dados_genero) 
            : item.dados_genero
          zonaData.eleitoresMasculino = genero.MASCULINO || 0
          zonaData.eleitoresFeminino = genero.FEMININO || 0
        }
        
        // Processar faixa etária
        if (item.dados_faixa_etaria) {
          zonaData.faixaEtaria = typeof item.dados_faixa_etaria === 'string'
            ? JSON.parse(item.dados_faixa_etaria)
            : item.dados_faixa_etaria
          
          // Calcular novos eleitores (16-18 anos)
          zonaData.novosEleitores = (zonaData.faixaEtaria['16 anos'] || 0) + 
                                    (zonaData.faixaEtaria['17 anos'] || 0) + 
                                    (zonaData.faixaEtaria['18 anos'] || 0)
          zonaData.indiceRenovacao = zonaData.totalEleitores > 0 
            ? (zonaData.novosEleitores / zonaData.totalEleitores) * 100 
            : 0
        }
        
        // Processar escolaridade
        if (item.dados_escolaridade) {
          zonaData.escolaridade = typeof item.dados_escolaridade === 'string'
            ? JSON.parse(item.dados_escolaridade)
            : item.dados_escolaridade
        }
      })

      // Processar dados dos boletins (comparecimento, abstenção, votos)
      if (boletinsData) {
        boletinsData.forEach((item: any) => {
          const zona = item.nr_zona
          if (zonaMap.has(zona)) {
            const zonaData = zonaMap.get(zona)!
            zonaData.comparecimento = item.total_comparecimento || 0
            zonaData.abstencao = item.total_abstencoes || 0
            zonaData.votosBrancos = item.votos_brancos || 0
            zonaData.votosNulos = item.votos_nulos || 0
            
            // Calcular taxa de alienação (abstenção + brancos + nulos)
            const totalAptos = item.total_aptos || zonaData.totalEleitores
            zonaData.taxaAlienacao = totalAptos > 0
              ? ((zonaData.abstencao + zonaData.votosBrancos + zonaData.votosNulos) / totalAptos) * 100
              : 0
            
            // Calcular potencial de votos (eleitores - votos do oponente - abstenção histórica)
            zonaData.potencialVotos = Math.max(0, zonaData.totalEleitores - zonaData.abstencao)
          }
        })
      }

      // Se não houver dados dos boletins, buscar diretamente
      if (!boletinsData || boletinsData.length === 0) {
        // Buscar dados agregados manualmente
        const { data: rawBoletins } = await supabase
          .from('boletins_urna')
          .select('nr_zona, qt_aptos, qt_comparecimento, qt_abstencoes, nr_votavel, qt_votos')
          .eq('ano_eleicao', parseInt(anoSelecionado))
          .eq('nr_turno', parseInt(turnoSelecionado))
          .eq('cd_cargo_pergunta', 11) // Prefeito
          .limit(100000)

        if (rawBoletins) {
          // Agregar por zona
          const zonaStats = new Map<number, { comp: number, abst: number, brancos: number, nulos: number, aptos: Set<string> }>()
          
          rawBoletins.forEach((item: any) => {
            const zona = item.nr_zona
            if (!zonaStats.has(zona)) {
              zonaStats.set(zona, { comp: 0, abst: 0, brancos: 0, nulos: 0, aptos: new Set() })
            }
            const stats = zonaStats.get(zona)!
            
            // Usar seção única para evitar duplicação
            const secaoKey = `${item.nr_zona}-${item.nr_secao}`
            if (!stats.aptos.has(secaoKey)) {
              stats.aptos.add(secaoKey)
              stats.comp += item.qt_comparecimento || 0
              stats.abst += item.qt_abstencoes || 0
            }
            
            // Contar votos brancos e nulos
            if (item.nr_votavel === '95') {
              stats.brancos += item.qt_votos || 0
            } else if (item.nr_votavel === '96') {
              stats.nulos += item.qt_votos || 0
            }
          })

          // Atualizar zonas com os dados
          zonaStats.forEach((stats, zona) => {
            if (zonaMap.has(zona)) {
              const zonaData = zonaMap.get(zona)!
              zonaData.comparecimento = stats.comp
              zonaData.abstencao = stats.abst
              zonaData.votosBrancos = stats.brancos
              zonaData.votosNulos = stats.nulos
              
              const totalAptos = zonaData.totalEleitores || (stats.comp + stats.abst)
              zonaData.taxaAlienacao = totalAptos > 0
                ? ((stats.abst + stats.brancos + stats.nulos) / totalAptos) * 100
                : 0
              
              zonaData.potencialVotos = Math.max(0, zonaData.totalEleitores - stats.abst)
            }
          })
        }
      }

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

  // Cálculos agregados
  const totalEleitores = dadosTerritoriais.reduce((acc, z) => acc + z.totalEleitores, 0)
  const totalMasculino = dadosTerritoriais.reduce((acc, z) => acc + z.eleitoresMasculino, 0)
  const totalFeminino = dadosTerritoriais.reduce((acc, z) => acc + z.eleitoresFeminino, 0)
  const totalComparecimento = dadosTerritoriais.reduce((acc, z) => acc + z.comparecimento, 0)
  const totalAbstencao = dadosTerritoriais.reduce((acc, z) => acc + z.abstencao, 0)
  const totalBrancos = dadosTerritoriais.reduce((acc, z) => acc + z.votosBrancos, 0)
  const totalNulos = dadosTerritoriais.reduce((acc, z) => acc + z.votosNulos, 0)
  const totalNovosEleitores = dadosTerritoriais.reduce((acc, z) => acc + z.novosEleitores, 0)
  
  // Taxa de alienação geral
  const taxaAlienacaoGeral = totalEleitores > 0
    ? ((totalAbstencao + totalBrancos + totalNulos) / totalEleitores) * 100
    : 0

  // Índice de renovação geral
  const indiceRenovacaoGeral = totalEleitores > 0
    ? (totalNovosEleitores / totalEleitores) * 100
    : 0

  // Top 5 Zonas Críticas (maior alienação)
  const zonasCriticas = [...dadosTerritoriais]
    .sort((a, b) => b.taxaAlienacao - a.taxaAlienacao)
    .slice(0, 5)

  // Dados para pirâmide etária
  const faixaEtariaTotal: { [key: string]: { masculino: number, feminino: number } } = {}
  dadosTerritoriais.forEach(z => {
    const propMasc = z.totalEleitores > 0 ? z.eleitoresMasculino / z.totalEleitores : 0.5
    Object.entries(z.faixaEtaria).forEach(([faixa, qtd]) => {
      if (!faixaEtariaTotal[faixa]) {
        faixaEtariaTotal[faixa] = { masculino: 0, feminino: 0 }
      }
      faixaEtariaTotal[faixa].masculino += Math.round(qtd * propMasc)
      faixaEtariaTotal[faixa].feminino += Math.round(qtd * (1 - propMasc))
    })
  })

  const ordemFaixas = ['16 anos', '17 anos', '18 anos', '19 anos', '20 anos', '21 a 24 anos', '25 a 29 anos', '30 a 34 anos', '35 a 39 anos', '40 a 44 anos', '45 a 49 anos', '50 a 54 anos', '55 a 59 anos', '60 a 64 anos', '65 a 69 anos', '70 a 74 anos', '75 a 79 anos', '80 a 84 anos', '85 a 89 anos', '90 a 94 anos', '95 a 99 anos', '100 anos ou mais']
  
  const piramideData = ordemFaixas
    .filter(faixa => faixaEtariaTotal[faixa])
    .map(faixa => ({
      faixa,
      masculino: -(faixaEtariaTotal[faixa]?.masculino || 0),
      feminino: faixaEtariaTotal[faixa]?.feminino || 0
    }))

  // Dados de escolaridade agregados
  const escolaridadeTotal: { [key: string]: number } = {}
  dadosTerritoriais.forEach(z => {
    Object.entries(z.escolaridade).forEach(([nivel, qtd]) => {
      escolaridadeTotal[nivel] = (escolaridadeTotal[nivel] || 0) + qtd
    })
  })

  const escolaridadeData = Object.entries(escolaridadeTotal)
    .map(([nivel, qtd]) => ({ nivel, quantidade: qtd }))
    .sort((a, b) => b.quantidade - a.quantidade)

  // Gráfico de barras por zona
  const barData = dadosTerritoriais.slice(0, 15).map(z => ({
    zona: `Z${z.zona}`,
    eleitores: z.totalEleitores,
    alienacao: z.taxaAlienacao.toFixed(1)
  }))

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16']

  const toggleZonaExpanded = (zona: number) => {
    const newExpanded = new Set(expandedZonas)
    if (newExpanded.has(zona)) {
      newExpanded.delete(zona)
    } else {
      newExpanded.add(zona)
    }
    setExpandedZonas(newExpanded)
  }

  const exportarCSV = () => {
    const headers = ['Zona', 'Município', 'Eleitores', 'Masculino', 'Feminino', 'Comparecimento', 'Abstenção', 'Brancos', 'Nulos', 'Taxa Alienação', 'Novos Eleitores', 'Índice Renovação']
    const rows = dadosTerritoriais.map(z => [
      z.zona,
      z.municipio,
      z.totalEleitores,
      z.eleitoresMasculino,
      z.eleitoresFeminino,
      z.comparecimento,
      z.abstencao,
      z.votosBrancos,
      z.votosNulos,
      z.taxaAlienacao.toFixed(2),
      z.novosEleitores,
      z.indiceRenovacao.toFixed(2)
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inteligencia_territorial_${anoSelecionado}_T${turnoSelecionado}.csv`
    a.click()
  }

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
          <select
            value={turnoSelecionado}
            onChange={(e) => setTurnoSelecionado(e.target.value)}
            className="input"
          >
            <option value="1">1º Turno</option>
            <option value="2">2º Turno</option>
          </select>
          <button
            onClick={fetchData}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
          <button 
            onClick={exportarCSV}
            className="btn-primary flex items-center gap-2"
          >
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
          {/* Cards de Resumo - Linha 1 */}
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
                <div className="p-3 rounded-lg bg-red-100 text-red-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Índice Alienação</p>
                  <p className="text-2xl font-bold">{taxaAlienacaoGeral.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Novos Eleitores</p>
                  <p className="text-2xl font-bold">{totalNovosEleitores.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-[var(--text-muted)]">{indiceRenovacaoGeral.toFixed(1)}% do total</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Potencial de Votos</p>
                  <p className="text-2xl font-bold">
                    {dadosTerritoriais.reduce((acc, z) => acc + z.potencialVotos, 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top 5 Zonas Críticas */}
          <div className="card p-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-5 h-5" />
              Top 5 Zonas Críticas (Maior Alienação)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {zonasCriticas.map((zona, index) => (
                <div key={zona.zona} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-red-500' : index === 1 ? 'bg-orange-500' : 'bg-amber-500'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-semibold">Zona {zona.zona}</span>
                  </div>
                  <p className="text-sm text-gray-600">{zona.municipio}</p>
                  <div className="mt-2">
                    <p className="text-2xl font-bold text-red-600">{zona.taxaAlienacao.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">
                      {(zona.abstencao + zona.votosBrancos + zona.votosNulos).toLocaleString('pt-BR')} votos perdidos
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráficos Principais */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pirâmide Etária */}
            <div className="lg:col-span-2 card p-6">
              <h3 className="text-lg font-semibold mb-4">Pirâmide Etária por Gênero</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={piramideData} layout="vertical" stackOffset="sign">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => Math.abs(value).toLocaleString('pt-BR')}
                  />
                  <YAxis dataKey="faixa" type="category" width={90} tick={{ fontSize: 10 }} />
                  <Tooltip 
                    formatter={(value: number) => Math.abs(value).toLocaleString('pt-BR')}
                    labelFormatter={(label) => `Faixa: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="masculino" name="Masculino" fill="#3B82F6" stackId="stack" />
                  <Bar dataKey="feminino" name="Feminino" fill="#EC4899" stackId="stack" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráficos de Distribuição */}
            <div className="space-y-4">
              {/* Alienação Eleitoral */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Composição da Alienação</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Abstenção', value: totalAbstencao, color: '#EF4444' },
                        { name: 'Brancos', value: totalBrancos, color: '#9CA3AF' },
                        { name: 'Nulos', value: totalNulos, color: '#6B7280' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="#EF4444" />
                      <Cell fill="#9CA3AF" />
                      <Cell fill="#6B7280" />
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Distribuição por Gênero */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold mb-4">Distribuição por Gênero</h3>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Masculino', value: totalMasculino, color: '#3B82F6' },
                        { name: 'Feminino', value: totalFeminino, color: '#EC4899' }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      <Cell fill="#3B82F6" />
                      <Cell fill="#EC4899" />
                    </Pie>
                    <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Grau de Instrução */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-purple-500" />
              Grau de Instrução do Eleitorado
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={escolaridadeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => v.toLocaleString('pt-BR')} />
                <YAxis dataKey="nivel" type="category" width={180} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => value.toLocaleString('pt-BR')} />
                <Bar dataKey="quantidade" name="Eleitores" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Eleitores por Zona com Taxa de Alienação */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Eleitores por Zona (Top 15)</h3>
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zona" />
                <YAxis yAxisId="left" tickFormatter={(v) => v.toLocaleString('pt-BR')} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 50]} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  formatter={(value: any, name: string) => {
                    if (name === 'Alienação') return [`${value}%`, name]
                    return [Number(value).toLocaleString('pt-BR'), name]
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="eleitores" name="Eleitores" fill="#10B981" />
                <Line yAxisId="right" type="monotone" dataKey="alienacao" name="Alienação" stroke="#EF4444" strokeWidth={2} dot={{ fill: '#EF4444' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Tabela de Zonas Detalhada */}
          <div className="card">
            <div className="p-4 border-b border-[var(--border-color)]">
              <h3 className="text-lg font-semibold">Detalhamento por Zona</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Zona</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Município</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Eleitores</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Comparecimento</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Abstenção</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Alienação</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Novos Eleitores</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {dadosTerritoriais.map((zona) => (
                    <>
                      <tr 
                        key={zona.zona}
                        className={`hover:bg-[var(--bg-secondary)] cursor-pointer ${
                          expandedZonas.has(zona.zona) ? 'bg-emerald-50' : ''
                        }`}
                        onClick={() => toggleZonaExpanded(zona.zona)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            <span className="font-medium">Zona {zona.zona}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">{zona.municipio}</td>
                        <td className="px-4 py-3 text-right font-medium">
                          {zona.totalEleitores.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600">
                          {zona.comparecimento.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-right text-red-500">
                          {zona.abstencao.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            zona.taxaAlienacao > 30 ? 'bg-red-100 text-red-700' :
                            zona.taxaAlienacao > 20 ? 'bg-amber-100 text-amber-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {zona.taxaAlienacao.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-purple-600 font-medium">
                            {zona.novosEleitores.toLocaleString('pt-BR')}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">
                            ({zona.indiceRenovacao.toFixed(1)}%)
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {expandedZonas.has(zona.zona) ? (
                            <ChevronUp className="w-4 h-4 mx-auto text-gray-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 mx-auto text-gray-500" />
                          )}
                        </td>
                      </tr>
                      {expandedZonas.has(zona.zona) && (
                        <tr key={`${zona.zona}-details`}>
                          <td colSpan={8} className="px-4 py-4 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Gênero */}
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <h4 className="font-medium mb-2">Distribuição por Gênero</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-blue-600">Masculino</span>
                                    <span className="font-medium">{zona.eleitoresMasculino.toLocaleString('pt-BR')}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-pink-600">Feminino</span>
                                    <span className="font-medium">{zona.eleitoresFeminino.toLocaleString('pt-BR')}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Votos Perdidos */}
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <h4 className="font-medium mb-2">Composição da Alienação</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-red-500">Abstenções</span>
                                    <span className="font-medium">{zona.abstencao.toLocaleString('pt-BR')}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-500">Brancos</span>
                                    <span className="font-medium">{zona.votosBrancos.toLocaleString('pt-BR')}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Nulos</span>
                                    <span className="font-medium">{zona.votosNulos.toLocaleString('pt-BR')}</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Escolaridade */}
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <h4 className="font-medium mb-2">Top 3 Escolaridades</h4>
                                <div className="space-y-2">
                                  {Object.entries(zona.escolaridade)
                                    .sort(([,a], [,b]) => b - a)
                                    .slice(0, 3)
                                    .map(([nivel, qtd]) => (
                                      <div key={nivel} className="flex justify-between text-sm">
                                        <span className="text-gray-600 truncate max-w-[150px]">{nivel}</span>
                                        <span className="font-medium">{qtd.toLocaleString('pt-BR')}</span>
                                      </div>
                                    ))
                                  }
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Insights Estratégicos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
              <h4 className="font-medium text-emerald-800 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Zonas Prioritárias
              </h4>
              <p className="text-sm text-emerald-700">
                As {Math.min(3, dadosTerritoriais.length)} maiores zonas concentram{' '}
                <span className="font-bold">
                  {((dadosTerritoriais.slice(0, 3).reduce((acc, z) => acc + z.totalEleitores, 0) / totalEleitores) * 100).toFixed(1)}%
                </span>{' '}
                do eleitorado total.
              </p>
            </div>
            
            <div className="card p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
              <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                Foco em Primeiro Voto
              </h4>
              <p className="text-sm text-purple-700">
                <span className="font-bold">{totalNovosEleitores.toLocaleString('pt-BR')}</span> eleitores de 16-18 anos 
                representam oportunidade de conquistar novos votos com campanhas direcionadas.
              </p>
            </div>
            
            <div className="card p-4 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
              <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Alerta de Alienação
              </h4>
              <p className="text-sm text-red-700">
                <span className="font-bold">{dadosTerritoriais.filter(z => z.taxaAlienacao > 30).length}</span> zonas 
                apresentam alienação acima de 30%, indicando necessidade de ações de mobilização.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
