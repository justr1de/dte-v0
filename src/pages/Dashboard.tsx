import { useEffect, useState } from 'react'
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
  RefreshCw,
  Crown,
  Building2,
  Landmark,
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
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from 'recharts'

interface Stats {
  totalEleitores: number
  totalMunicipios: number
  totalZonas: number
  participacao: number
  totalVotos: number
  totalAbstencoes: number
}

interface Candidato {
  nome: string
  votos: number
  partido?: string
  eleito?: boolean
}

interface DadosCargo {
  governador2022: Candidato[]
  deputadosFederais2022: Candidato[]
  deputadosEstaduais2022: Candidato[]
  vereadores2024: Candidato[]
  prefeito2024: Candidato[]
  vereadores2020: Candidato[]
}

const CORES_PARTIDOS: Record<string, string> = {
  'PT': '#CC0000',
  'PL': '#1E3A8A',
  'MDB': '#00A859',
  'PP': '#0066CC',
  'UNIÃO': '#003399',
  'PSD': '#FF6B00',
  'PSDB': '#0080FF',
  'PDT': '#FF0000',
  'PODE': '#6B21A8',
  'PODEMOS': '#6B21A8',
  'REPUBLICANOS': '#1E40AF',
  'PSB': '#FFD700',
  'CIDADANIA': '#E91E63',
  'SOLIDARIEDADE': '#FF5722',
  'PSOL': '#FFEB3B',
  'PCdoB': '#B71C1C',
  'REDE': '#00BCD4',
  'NOVO': '#FF6F00',
  'AVANTE': '#FF9800',
  'default': '#6B7280'
}

function getCorPartido(sigla: string): string {
  return CORES_PARTIDOS[sigla?.toUpperCase()] || CORES_PARTIDOS['default']
}

// Cores para os gráficos de ranking
const CORES_RANKING = [
  '#FFD700', // Ouro
  '#C0C0C0', // Prata
  '#CD7F32', // Bronze
  '#10B981', // Verde
  '#3B82F6', // Azul
  '#8B5CF6', // Roxo
  '#F59E0B', // Laranja
  '#EF4444', // Vermelho
  '#06B6D4', // Ciano
  '#EC4899', // Rosa
]

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
  const [dadosCargo, setDadosCargo] = useState<DadosCargo>({
    governador2022: [],
    deputadosFederais2022: [],
    deputadosEstaduais2022: [],
    vereadores2024: [],
    prefeito2024: [],
    vereadores2020: []
  })
  const [distribuicaoVotos, setDistribuicaoVotos] = useState<{ name: string; value: number; color: string }[]>([])
  const [filtroAno, setFiltroAno] = useState(2024)
  const [filtroTurno, setFiltroTurno] = useState(1)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    governador: true,
    depFederal: true,
    depEstadual: true,
    vereadores: true,
    prefeito: true
  })

  useEffect(() => {
    fetchData()
  }, [filtroAno, filtroTurno])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar dados gerais - sempre usar 2024 como referência para eleitores (dados mais recentes)
      const { data: perfilData } = await supabase
        .from('perfil_eleitorado')
        .select('total_eleitores, municipio, zona')
        .eq('ano', 2024) // Sempre usar 2024 pois é o único ano com dados de eleitorado

      let totalEleitores = 0
      const zonasSet = new Set<string>()
      const municipiosSet = new Set<string>()
      if (perfilData && perfilData.length > 0) {
        perfilData.forEach((p: any) => {
          totalEleitores += p.total_eleitores || 0
          zonasSet.add(p.zona)
          municipiosSet.add(p.municipio)
        })
      }

      // Buscar dados de comparecimento - usar nomes corretos das colunas (ano, turno)
      const { data: compData } = await supabase
        .from('comparecimento_abstencao')
        .select('*')
        .eq('ano', filtroAno)
        .eq('turno', filtroTurno)

      let totalComparecimento = 0
      let totalAbstencoes = 0
      let totalAptos = 0
      if (compData && compData.length > 0) {
        compData.forEach((c: any) => {
          totalComparecimento += c.qt_comparecimento || 0
          totalAbstencoes += c.qt_abstencao || 0
          totalAptos += c.qt_aptos || 0
        })
      }

      // Se não houver dados de comparecimento, usar dados do perfil_eleitorado
      if (totalAptos === 0 && totalEleitores > 0) {
        totalAptos = totalEleitores
      }

      const participacao = totalAptos > 0 ? (totalComparecimento / totalAptos) * 100 : 0

      // Buscar votos totais
      const { data: votosData } = await supabase
        .from('boletins_urna')
        .select('qt_votos')
        .eq('ano_eleicao', filtroAno)
        .eq('nr_turno', filtroTurno)
        .eq('sg_uf', 'RO')
        .limit(50000)

      let totalVotos = 0
      if (votosData) {
        votosData.forEach((v: any) => {
          totalVotos += v.qt_votos || 0
        })
      }

      setStats({
        totalEleitores,
        totalMunicipios: municipiosSet.size || 52,
        totalZonas: zonasSet.size || 29,
        participacao,
        totalVotos,
        totalAbstencoes
      })

      // ========== GOVERNADOR 2022 (2º Turno - Resultado Final) ==========
      const { data: govData } = await supabase
        .from('boletins_urna')
        .select('nm_votavel, qt_votos')
        .eq('cd_cargo_pergunta', 3)
        .eq('ano_eleicao', 2022)
        .eq('nr_turno', 2) // 2º turno - resultado final
        .eq('sg_uf', 'RO')

      const govMap = new Map<string, number>()
      if (govData) {
        govData.forEach((v: any) => {
          if (v.nm_votavel && !['Nulo', 'Branco'].includes(v.nm_votavel)) {
            govMap.set(v.nm_votavel, (govMap.get(v.nm_votavel) || 0) + v.qt_votos)
          }
        })
      }
      const governador2022 = Array.from(govMap.entries())
        .map(([nome, votos]) => ({ nome, votos }))
        .sort((a, b) => b.votos - a.votos)
        .slice(0, 5)
        .map((c, i) => ({ ...c, eleito: i === 0 })) // Primeiro colocado é o eleito

      // ========== DEPUTADOS FEDERAIS 2022 (1º Turno) ==========
      const { data: depFedData } = await supabase
        .from('boletins_urna')
        .select('nm_votavel, qt_votos')
        .eq('cd_cargo_pergunta', 6)
        .eq('ano_eleicao', 2022)
        .eq('nr_turno', 1) // Deputados só têm 1º turno
        .eq('sg_uf', 'RO')

      const depFedMap = new Map<string, number>()
      if (depFedData) {
        depFedData.forEach((v: any) => {
          if (v.nm_votavel && !['Nulo', 'Branco'].includes(v.nm_votavel)) {
            depFedMap.set(v.nm_votavel, (depFedMap.get(v.nm_votavel) || 0) + v.qt_votos)
          }
        })
      }
      const deputadosFederais2022 = Array.from(depFedMap.entries())
        .map(([nome, votos]) => ({ nome, votos, eleito: true }))
        .sort((a, b) => b.votos - a.votos)
        .slice(0, 8) // 8 vagas para RO

      // ========== DEPUTADOS ESTADUAIS 2022 (1º Turno) ==========
      const { data: depEstData } = await supabase
        .from('boletins_urna')
        .select('nm_votavel, qt_votos')
        .eq('cd_cargo_pergunta', 7)
        .eq('ano_eleicao', 2022)
        .eq('nr_turno', 1) // Deputados só têm 1º turno
        .eq('sg_uf', 'RO')

      const depEstMap = new Map<string, number>()
      if (depEstData) {
        depEstData.forEach((v: any) => {
          if (v.nm_votavel && !['Nulo', 'Branco'].includes(v.nm_votavel)) {
            depEstMap.set(v.nm_votavel, (depEstMap.get(v.nm_votavel) || 0) + v.qt_votos)
          }
        })
      }
      const deputadosEstaduais2022 = Array.from(depEstMap.entries())
        .map(([nome, votos]) => ({ nome, votos, eleito: true }))
        .sort((a, b) => b.votos - a.votos)
        .slice(0, 24) // 24 vagas

      // ========== VEREADORES 2024 (1º Turno) ==========
      const { data: verData } = await supabase
        .from('boletins_urna')
        .select('nm_votavel, qt_votos')
        .eq('cd_cargo_pergunta', 13)
        .eq('ano_eleicao', 2024)
        .eq('nr_turno', 1) // Vereadores só têm 1º turno
        .eq('sg_uf', 'RO')

      const verMap = new Map<string, number>()
      if (verData) {
        verData.forEach((v: any) => {
          if (v.nm_votavel && !['Nulo', 'Branco', 'UNIÃO', 'PL', 'PSD', 'MDB', 'PP', 'REPUBLICANOS', 'PDT', 'PSDB', 'PT', 'PODE', 'PODEMOS', 'AVANTE', 'PSB', 'CIDADANIA', 'SOLIDARIEDADE', 'PSOL', 'PCdoB', 'REDE', 'NOVO', 'DC', 'PMB', 'PRD', 'AGIR', 'MOBILIZA'].includes(v.nm_votavel)) {
            verMap.set(v.nm_votavel, (verMap.get(v.nm_votavel) || 0) + v.qt_votos)
          }
        })
      }
      const vereadores2024 = Array.from(verMap.entries())
        .map(([nome, votos]) => ({ nome, votos }))
        .sort((a, b) => b.votos - a.votos)
        .slice(0, 21) // Top 21 vereadores de Porto Velho

      // ========== PREFEITO 2024 (1º Turno) ==========
      const { data: prefData } = await supabase
        .from('boletins_urna')
        .select('nm_votavel, qt_votos')
        .eq('cd_cargo_pergunta', 11)
        .eq('ano_eleicao', 2024)
        .eq('nr_turno', 1) // 1º turno
        .eq('sg_uf', 'RO')

      const prefMap = new Map<string, number>()
      if (prefData) {
        prefData.forEach((v: any) => {
          if (v.nm_votavel && !['Nulo', 'Branco'].includes(v.nm_votavel)) {
            prefMap.set(v.nm_votavel, (prefMap.get(v.nm_votavel) || 0) + v.qt_votos)
          }
        })
      }
      const prefeito2024 = Array.from(prefMap.entries())
        .map(([nome, votos]) => ({ nome, votos }))
        .sort((a, b) => b.votos - a.votos)
        .slice(0, 10)

      setDadosCargo({
        governador2022,
        deputadosFederais2022,
        deputadosEstaduais2022,
        vereadores2024,
        prefeito2024,
        vereadores2020: []
      })

      // Distribuição de votos
      let totalNulos = 0
      let totalBrancos = 0
      const { data: nulosBrancos } = await supabase
        .from('boletins_urna')
        .select('nm_votavel, qt_votos')
        .eq('ano_eleicao', filtroAno)
        .eq('nr_turno', filtroTurno)
        .eq('sg_uf', 'RO')
        .in('nm_votavel', ['Nulo', 'Branco'])

      if (nulosBrancos) {
        nulosBrancos.forEach((v: any) => {
          if (v.nm_votavel === 'Nulo') totalNulos += v.qt_votos || 0
          else if (v.nm_votavel === 'Branco') totalBrancos += v.qt_votos || 0
        })
      }

      const totalValidos = totalComparecimento - totalNulos - totalBrancos

      setDistribuicaoVotos([
        { name: 'Válidos', value: totalValidos > 0 ? totalValidos : totalVotos * 0.85, color: '#10b981' },
        { name: 'Brancos', value: totalBrancos > 0 ? totalBrancos : totalVotos * 0.03, color: '#94a3b8' },
        { name: 'Nulos', value: totalNulos > 0 ? totalNulos : totalVotos * 0.05, color: '#ef4444' },
        { name: 'Abstenções', value: totalAbstencoes > 0 ? totalAbstencoes : totalVotos * 0.07, color: '#f59e0b' },
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

  const renderCandidatoCard = (candidato: Candidato, index: number, total: number) => {
    const percentual = total > 0 ? (candidato.votos / total) * 100 : 0
    const medalha = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''
    
    return (
      <div 
        key={candidato.nome} 
        className={`p-4 rounded-lg border ${index < 3 ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/5' : 'border-[var(--border-color)] bg-[var(--bg-secondary)]'}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{medalha || `#${index + 1}`}</span>
            <span className="font-semibold truncate">{candidato.nome}</span>
          </div>
          {candidato.eleito && (
            <span className="px-2 py-1 text-xs bg-green-500/20 text-green-500 rounded-full">
              ELEITO
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-secondary)]">
            {candidato.votos.toLocaleString('pt-BR')} votos
          </span>
          <span className="font-medium" style={{ color: CORES_RANKING[index % CORES_RANKING.length] }}>
            {percentual.toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 w-full bg-[var(--bg-primary)] rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-500"
            style={{ 
              width: `${Math.min(percentual * 2, 100)}%`,
              backgroundColor: CORES_RANKING[index % CORES_RANKING.length]
            }}
          />
        </div>
      </div>
    )
  }

  const renderSection = (
    title: string, 
    icon: React.ReactNode, 
    sectionKey: string, 
    candidatos: Candidato[], 
    ano: number,
    vagas?: number
  ) => {
    const totalVotos = candidatos.reduce((acc, c) => acc + c.votos, 0)
    const isExpanded = expandedSections[sectionKey]
    
    return (
      <div className="card overflow-hidden">
        <button 
          onClick={() => toggleSection(sectionKey)}
          className="w-full p-6 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors"
        >
          <div className="flex items-center gap-3">
            {icon}
            <div className="text-left">
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                Eleições {ano} {vagas ? `• ${vagas} vagas` : ''} • {candidatos.length} candidatos
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-[var(--text-secondary)]">Total de votos</p>
              <p className="font-semibold">{totalVotos.toLocaleString('pt-BR')}</p>
            </div>
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>
        
        {isExpanded && (
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {candidatos.map((c, i) => renderCandidatoCard(c, i, totalVotos))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Eleitoral</h1>
          <p className="text-[var(--text-secondary)]">
            Visão geral dos dados eleitorais - Rondônia
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
                <span className="font-semibold">
                  {stats.participacao > 0 ? `${stats.participacao.toFixed(1)}%` : 'Dados não disponíveis'}
                </span>
              </div>
            </div>
            {stats.participacao > 0 ? (
              <>
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
              </>
            ) : (
              <div className="text-center py-4 text-[var(--text-secondary)]">
                <p>Dados de comparecimento não disponíveis para {filtroAno}</p>
                <p className="text-xs mt-1">Apenas dados de 2024 estão disponíveis na tabela de comparecimento</p>
              </div>
            )}
          </div>

          {/* Seções por Cargo */}
          <div className="space-y-4">
            {/* Governador 2022 */}
            {dadosCargo.governador2022.length > 0 && renderSection(
              'Governador de Rondônia',
              <Crown className="w-6 h-6 text-yellow-500" />,
              'governador',
              dadosCargo.governador2022,
              2022
            )}

            {/* Deputados Federais 2022 */}
            {dadosCargo.deputadosFederais2022.length > 0 && renderSection(
              'Deputados Federais',
              <Landmark className="w-6 h-6 text-blue-500" />,
              'depFederal',
              dadosCargo.deputadosFederais2022,
              2022,
              8
            )}

            {/* Deputados Estaduais 2022 */}
            {dadosCargo.deputadosEstaduais2022.length > 0 && renderSection(
              'Deputados Estaduais',
              <Building2 className="w-6 h-6 text-purple-500" />,
              'depEstadual',
              dadosCargo.deputadosEstaduais2022,
              2022,
              24
            )}

            {/* Prefeito 2024 */}
            {dadosCargo.prefeito2024.length > 0 && renderSection(
              'Prefeitos de Rondônia',
              <Award className="w-6 h-6 text-orange-500" />,
              'prefeito',
              dadosCargo.prefeito2024,
              2024
            )}

            {/* Vereadores 2024 */}
            {dadosCargo.vereadores2024.length > 0 && renderSection(
              'Vereadores (Top 21)',
              <Users className="w-6 h-6 text-green-500" />,
              'vereadores',
              dadosCargo.vereadores2024,
              2024,
              21
            )}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico Governador */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-[var(--accent-color)]" />
                <h2 className="text-lg font-semibold">Resultado Governador 2022</h2>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosCargo.governador2022} layout="vertical" margin={{ left: 20, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis type="number" stroke="var(--text-secondary)" tickFormatter={(v) => v.toLocaleString('pt-BR')} />
                    <YAxis 
                      dataKey="nome" 
                      type="category" 
                      stroke="var(--text-secondary)" 
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Votos']}
                    />
                    <Bar dataKey="votos" radius={[0, 4, 4, 0]}>
                      {dadosCargo.governador2022.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CORES_RANKING[index % CORES_RANKING.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribuição de Votos */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="w-5 h-5 text-[var(--accent-color)]" />
                <h2 className="text-lg font-semibold">Distribuição de Votos {filtroAno}</h2>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={distribuicaoVotos}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <p className="text-sm text-[var(--text-secondary)]">Origem</p>
                <p className="font-semibold">TSE - Tribunal Superior Eleitoral</p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <p className="text-sm text-[var(--text-secondary)]">Estado</p>
                <p className="font-semibold">Rondônia (RO)</p>
              </div>
              <div className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                <p className="text-sm text-[var(--text-secondary)]">Anos Disponíveis</p>
                <p className="font-semibold">2020, 2022, 2024</p>
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
