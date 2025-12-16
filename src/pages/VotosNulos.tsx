import { Vote, AlertTriangle } from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'

const distribuicao = [
  { name: 'Válidos', value: 892456, color: '#10b981' },
  { name: 'Brancos', value: 45678, color: '#94a3b8' },
  { name: 'Nulos', value: 67890, color: '#ef4444' },
]

const nulosPorZona = [
  { zona: 'Zona 1', nulos: 5678, brancos: 3456 },
  { zona: 'Zona 2', nulos: 4567, brancos: 2345 },
  { zona: 'Zona 3', nulos: 6789, brancos: 4567 },
  { zona: 'Zona 4', nulos: 3456, brancos: 2234 },
  { zona: 'Zona 5', nulos: 7890, brancos: 5678 },
]

export default function VotosNulos() {
  const totalNulos = 67890
  const totalBrancos = 45678
  const percentualNulos = 6.7
  const percentualBrancos = 4.5

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">Votos Nulos e Brancos</h1>
        <p className="text-[var(--text-secondary)]">Análise detalhada de votos inválidos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500/10">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Votos Nulos</p>
              <p className="text-2xl font-bold">{totalNulos.toLocaleString('pt-BR')}</p>
              <p className="text-sm text-red-500">{percentualNulos}% do total</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-500/10">
              <Vote className="w-6 h-6 text-slate-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Votos Brancos</p>
              <p className="text-2xl font-bold">{totalBrancos.toLocaleString('pt-BR')}</p>
              <p className="text-sm text-slate-500">{percentualBrancos}% do total</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Distribuição de Votos</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distribuicao}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                >
                  {distribuicao.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Nulos e Brancos por Zona</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={nulosPorZona}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="zona" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="nulos" fill="#ef4444" name="Nulos" radius={[4, 4, 0, 0]} />
                <Bar dataKey="brancos" fill="#94a3b8" name="Brancos" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
