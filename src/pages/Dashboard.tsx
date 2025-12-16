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
  Activity
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
  Legend
} from 'recharts'

interface Stats {
  totalEleitores: number
  totalCandidatos: number
  totalMunicipios: number
  totalZonas: number
  participacao: number
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

// Dados de exemplo - Rondônia 2024
const votosPartido = [
  { sigla: 'MDB', votos: 185432, cor: '#00A859' },
  { sigla: 'PL', votos: 156789, cor: '#1E3A8A' },
  { sigla: 'PP', votos: 98765, cor: '#0066CC' },
  { sigla: 'UNIÃO', votos: 87654, cor: '#003399' },
  { sigla: 'PSD', votos: 76543, cor: '#FF6600' },
  { sigla: 'PT', votos: 65432, cor: '#CC0000' },
]

const evolucaoEleitoral = [
  { ano: '2016', eleitores: 1050000, participacao: 82 },
  { ano: '2018', eleitores: 1120000, participacao: 79 },
  { ano: '2020', eleitores: 1180000, participacao: 76 },
  { ano: '2022', eleitores: 1230000, participacao: 80 },
  { ano: '2024', eleitores: 1266546, participacao: 78 },
]

const distribuicaoVotos = [
  { name: 'Válidos', value: 892456, color: '#10b981' },
  { name: 'Brancos', value: 45678, color: '#94a3b8' },
  { name: 'Nulos', value: 67890, color: '#ef4444' },
  { name: 'Abstenções', value: 260522, color: '#f59e0b' },
]

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalEleitores: 1266546,
    totalCandidatos: 45,
    totalMunicipios: 52,
    totalZonas: 56,
    participacao: 78.5
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      // Tentar buscar dados do Supabase
      const { data: eleitores } = await supabase.from('eleitores').select('id', { count: 'exact' })
      const { data: candidatos } = await supabase.from('candidatos').select('id', { count: 'exact' })
      
      // Se tiver dados, atualizar stats
      if (eleitores || candidatos) {
        setStats(prev => ({
          ...prev,
          totalEleitores: eleitores?.length || prev.totalEleitores,
          totalCandidatos: candidatos?.length || prev.totalCandidatos
        }))
      }
    } catch (error) {
      console.log('Usando dados de demonstração')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total de Eleitores', value: stats.totalEleitores.toLocaleString('pt-BR'), icon: Users, color: 'from-emerald-500 to-teal-500' },
    { label: 'Candidatos', value: stats.totalCandidatos.toString(), icon: UserCheck, color: 'from-blue-500 to-indigo-500' },
    { label: 'Municípios', value: stats.totalMunicipios.toString(), icon: MapPin, color: 'from-purple-500 to-pink-500' },
    { label: 'Zonas Eleitorais', value: stats.totalZonas.toString(), icon: Vote, color: 'from-orange-500 to-red-500' },
  ]

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--text-secondary)]">Visão geral dos dados eleitorais - Rondônia 2024</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
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
            <p className="text-sm text-[var(--text-secondary)]">Eleições 2024</p>
          </div>
          <div className="flex items-center gap-2 text-emerald-500">
            <TrendingUp className="w-5 h-5" />
            <span className="font-semibold">{stats.participacao}%</span>
          </div>
        </div>
        <div className="w-full bg-[var(--bg-secondary)] rounded-full h-4">
          <div 
            className="h-4 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000"
            style={{ width: `${stats.participacao}%` }}
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Votos por Partido */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[var(--accent-color)]" />
            <h2 className="text-lg font-semibold">Votos por Partido</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={votosPartido} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-secondary)" />
                <YAxis dataKey="sigla" type="category" stroke="var(--text-secondary)" width={60} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Votos']}
                />
                <Bar dataKey="votos" radius={[0, 4, 4, 0]}>
                  {votosPartido.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
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
        </div>
      </div>

      {/* Evolução Eleitoral */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-[var(--accent-color)]" />
          <h2 className="text-lg font-semibold">Evolução do Eleitorado</h2>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolucaoEleitoral}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="ano" stroke="var(--text-secondary)" />
              <YAxis yAxisId="left" stroke="var(--text-secondary)" />
              <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--bg-card)', 
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="eleitores" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
                name="Eleitores"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="participacao" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6' }}
                name="Participação (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
