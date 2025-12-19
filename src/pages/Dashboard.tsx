import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Users,
  UserCheck,
  MapPin,
  TrendingUp,
  Vote,
  BarChart3,
  PieChart,
  Activity,
  Loader2,
  RefreshCw
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  LabelList
} from 'recharts'

interface Stats {
  totalEleitores: number
  totalMunicipios: number
  totalZonas: number
  participacao: number
  totalVotos: number
  totalAbstencoes: number
}

interface VotoPartido {
  sigla: string
  nome: string
  votos: number
  cor: string
}

const CORES_PARTIDOS: Record<string, { cor: string; nome: string }> = {
  'PT': { cor: '#CC0000', nome: 'Partido dos Trabalhadores' },
  'PL': { cor: '#1E3A8A', nome: 'Partido Liberal' },
  'MDB': { cor: '#00A859', nome: 'Movimento Democrático Brasileiro' },
  'PP': { cor: '#0066CC', nome: 'Progressistas' },
  'UNIÃO': { cor: '#003399', nome: 'União Brasil' },
  'PSD': { cor: '#FF6B00', nome: 'Partido Social Democrático' },
  'PSDB': { cor: '#0080FF', nome: 'Partido da Social Democracia Brasileira' },
  'PDT': { cor: '#FF0000', nome: 'Partido Democrático Trabalhista' },
  'PODE': { cor: '#6B21A8', nome: 'Podemos' },
  'PODEMOS': { cor: '#6B21A8', nome: 'Podemos' },
  'REPUBLICANOS': { cor: '#1E40AF', nome: 'Republicanos' },
  'PSB': { cor: '#FFD700', nome: 'Partido Socialista Brasileiro' },
  'CIDADANIA': { cor: '#E91E63', nome: 'Cidadania' },
  'SOLIDARIEDADE': { cor: '#FF5722', nome: 'Solidariedade' },
  'PSOL': { cor: '#FFEB3B', nome: 'Partido Socialismo e Liberdade' },
  'PCdoB': { cor: '#B71C1C', nome: 'Partido Comunista do Brasil' },
  'REDE': { cor: '#00BCD4', nome: 'Rede Sustentabilidade' },
  'NOVO': { cor: '#FF6F00', nome: 'Partido Novo' },
  'AVANTE': { cor: '#FF9800', nome: 'Avante' },
  'PMB': { cor: '#9C27B0', nome: 'Partido da Mulher Brasileira' },
  'DC': { cor: '#4CAF50', nome: 'Democracia Cristã' },
  'PRD': { cor: '#795548', nome: 'Partido Renovação Democrática' },
  'AGIR': { cor: '#607D8B', nome: 'Agir' },
  'MOBILIZA': { cor: '#009688', nome: 'Mobiliza' },
  'default': { cor: '#6B7280', nome: 'Outros' }
}

function getCorPartido(sigla: string): string {
  return CORES_PARTIDOS[sigla?.toUpperCase()]?.cor || CORES_PARTIDOS['default'].cor
}

function getNomePartido(sigla: string): string {
  return CORES_PARTIDOS[sigla?.toUpperCase()]?.nome || sigla
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    totalEleitores: 0,
    totalMunicipios: 0,
    totalZonas: 0,
    participacao: 0,
    totalVotos: 0,
    totalAbstencoes: 0
  })
  const [votosPartido, setVotosPartido] = useState<VotoPartido[]>([])
  const [distribuicaoVotos, setDistribuicaoVotos] = useState<{ name: string; value: number; color: string }[]>([])
  const [filtroAno, setFiltroAno] = useState(2024)
  const [filtroTurno, setFiltroTurno] = useState(1)

  useEffect(() => {
    fetchData()
  }, [filtroAno, filtroTurno])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar dados do mapa eleitoral (totais por município)
      const { data: mapaData, error: mapaError } = await supabase.rpc('get_mapa_eleitoral', {
        p_ano: filtroAno,
        p_turno: filtroTurno
      })

      if (mapaError) throw mapaError

      // Buscar dados do perfil do eleitorado
      const { data: perfilData, error: perfilError } = await supabase
        .from('perfil_eleitorado')
        .select('total_eleitores, municipio, zona')
        .eq('ano', filtroAno)

      if (perfilError) throw perfilError

      // Buscar votos por partido via função RPC (agregação no banco)
      const { data: votosData, error: votosError } = await supabase.rpc('get_votos_por_partido', {
        p_ano: filtroAno,
        p_turno: filtroTurno
      })

      if (votosError) throw votosError

      // Buscar votos nulos e brancos - CORRIGIDO: filtrar por UF
      const { data: nulosBrancos, error: nbError } = await supabase
        .from('boletins_urna')
        .select('ds_tipo_votavel, qt_votos')
        .eq('ano_eleicao', filtroAno)
        .eq('nr_turno', filtroTurno)
        .eq('sg_uf', 'RO')  // FILTRO POR RONDÔNIA
        .in('ds_tipo_votavel', ['Nulo', 'Branco'])

      // Calcular estatísticas
      let totalVotos = 0
      let totalComparecimento = 0
      let totalAbstencoes = 0
      let totalAptos = 0
      const municipiosSet = new Set<string>()

      if (mapaData) {
        mapaData.forEach((m: any) => {
          totalVotos += Number(m.total_votos) || 0
          totalComparecimento += Number(m.total_comparecimento) || 0
          totalAbstencoes += Number(m.total_abstencoes) || 0
          totalAptos += Number(m.total_aptos) || 0
          municipiosSet.add(m.nm_municipio)
        })
      }

      // Calcular total de eleitores do perfil
      let totalEleitores = 0
      const zonasSet = new Set<string>()
      if (perfilData) {
        perfilData.forEach((p: any) => {
          totalEleitores += p.total_eleitores || 0
          zonasSet.add(p.zona)
        })
      }

      const participacao = totalAptos > 0 ? (totalComparecimento / totalAptos) * 100 : 0

      setStats({
        totalEleitores,
        totalMunicipios: municipiosSet.size,
        totalZonas: zonasSet.size,
        participacao,
        totalVotos,
        totalAbstencoes
      })

      // Processar votos por partido (já vem agregado do banco)
      const votosPartidoArr = (votosData || [])
        .slice(0, 10)
        .map((v: any) => ({
          sigla: v.sg_partido,
          nome: v.nm_partido || getNomePartido(v.sg_partido),
          votos: Number(v.total_votos) || 0,
          cor: getCorPartido(v.sg_partido)
        }))

      setVotosPartido(votosPartidoArr)

      // Calcular distribuição de votos
      let totalNulos = 0
      let totalBrancos = 0
      if (nulosBrancos) {
        nulosBrancos.forEach((v: any) => {
          if (v.ds_tipo_votavel === 'Nulo') {
            totalNulos += v.qt_votos || 0
          } else if (v.ds_tipo_votavel === 'Branco') {
            totalBrancos += v.qt_votos || 0
          }
        })
      }

      const totalValidos = totalComparecimento - totalNulos - totalBrancos

      setDistribuicaoVotos([
        { name: 'Válidos', value: totalValidos, color: '#10b981' },
        { name: 'Brancos', value: totalBrancos, color: '#94a3b8' },
        { name: 'Nulos', value: totalNulos, color: '#ef4444' },
        { name: 'Abstenções', value: totalAbstencoes, color: '#f59e0b' },
      ])

    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { 
      label: 'Total de Eleitores', 
      value: stats.totalEleitores.toLocaleString('pt-BR'), 
      icon: Users, 
      color: 'from-emerald-500 to-teal-500',
      subtitle: 'Cadastrados no TSE'
    },
    { 
      label: 'Total de Votos', 
      value: stats.totalVotos.toLocaleString('pt-BR'), 
      icon: Vote, 
      color: 'from-blue-500 to-indigo-500',
      subtitle: `${filtroTurno}º Turno ${filtroAno}`
    },
    { 
      label: 'Municípios', 
      value: stats.totalMunicipios.toString(), 
      icon: MapPin, 
      color: 'from-purple-500 to-pink-500',
      subtitle: 'Com dados disponíveis'
    },
    { 
      label: 'Zonas Eleitorais', 
      value: stats.totalZonas.toString(), 
      icon: UserCheck, 
      color: 'from-orange-500 to-red-500',
      subtitle: 'Rondônia'
    },
  ]

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-[var(--text-secondary)]">
            Visão geral dos dados eleitorais - Rondônia {filtroAno}
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={filtroAno}
            onChange={(e) => setFiltroAno(Number(e.target.value))}
            className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
          >
            <option value={2024}>2024</option>
            <option value={2022}>2022</option>
            <option value={2020}>2020</option>
          </select>
          <select
            value={filtroTurno}
            onChange={(e) => setFiltroTurno(Number(e.target.value))}
            className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
          >
            <option value={1}>1º Turno</option>
            <option value={2}>2º Turno</option>
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-[var(--accent-color)] text-white flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Atualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-color)]" />
          <span className="ml-2">Carregando dados do dashboard...</span>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Participação */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Taxa de Participação</h2>
                <p className="text-sm text-[var(--text-secondary)]">
                  Eleições {filtroAno} - {filtroTurno}º Turno
                </p>
              </div>
              <div className="flex items-center gap-2 text-emerald-500">
                <TrendingUp className="w-5 h-5" />
                <span className="font-semibold">{stats.participacao.toFixed(1)}%</span>
              </div>
            </div>
            <div className="w-full bg-[var(--bg-secondary)] rounded-full h-4">
              <div 
                className="h-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000"
                style={{ width: `${Math.min(stats.participacao, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-[var(--text-secondary)]">
              <span>Comparecimento: {(stats.totalEleitores - stats.totalAbstencoes).toLocaleString('pt-BR')}</span>
              <span>Abstenções: {stats.totalAbstencoes.toLocaleString('pt-BR')}</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Votos por Partido - COM LEGENDA DOS NOMES */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-[var(--accent-color)]" />
                <h2 className="text-lg font-semibold">Top 10 Partidos por Votos</h2>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={votosPartido} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis type="number" stroke="var(--text-secondary)" tickFormatter={(v) => v.toLocaleString('pt-BR')} />
                    <YAxis 
                      dataKey="sigla" 
                      type="category" 
                      stroke="var(--text-secondary)" 
                      width={80}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string, props: any) => [
                        value.toLocaleString('pt-BR'), 
                        props.payload.nome
                      ]}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar dataKey="votos" radius={[0, 4, 4, 0]}>
                      {votosPartido.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              {/* Legenda com nomes dos partidos */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {votosPartido.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: p.cor }} 
                    />
                    <span className="font-medium">{p.sigla}</span>
                    <span className="text-[var(--text-secondary)] truncate">- {p.nome}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Distribuição de Votos */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-[var(--accent-color)]" />
                <h2 className="text-lg font-semibold">Distribuição de Votos</h2>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={distribuicaoVotos}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    >
                      {distribuicaoVotos.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Votos']}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {distribuicaoVotos.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-sm">{d.name}: {d.value.toLocaleString('pt-BR')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Informações Adicionais */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-[var(--accent-color)]" />
              <h2 className="text-lg font-semibold">Fonte dos Dados</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <p className="text-sm text-[var(--text-secondary)]">Origem</p>
                <p className="font-semibold">TSE - Tribunal Superior Eleitoral</p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <p className="text-sm text-[var(--text-secondary)]">Estado</p>
                <p className="font-semibold">Rondônia (RO)</p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <p className="text-sm text-[var(--text-secondary)]">Última Atualização</p>
                <p className="font-semibold">Dezembro 2024</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
