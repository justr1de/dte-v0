import { useState } from 'react'
import { Users, Search, Filter, Download, MapPin } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

const faixaEtaria = [
  { faixa: '16-17', total: 12500, cor: '#10b981' },
  { faixa: '18-24', total: 145000, cor: '#3b82f6' },
  { faixa: '25-34', total: 198000, cor: '#8b5cf6' },
  { faixa: '35-44', total: 210000, cor: '#f59e0b' },
  { faixa: '45-59', total: 285000, cor: '#ef4444' },
  { faixa: '60+', total: 415000, cor: '#ec4899' },
]

const genero = [
  { name: 'Feminino', value: 52.3, color: '#ec4899' },
  { name: 'Masculino', value: 47.7, color: '#3b82f6' },
]

const escolaridade = [
  { nivel: 'Fundamental', total: 320000 },
  { nivel: 'Médio', total: 480000 },
  { nivel: 'Superior', total: 350000 },
  { nivel: 'Pós-graduação', total: 116000 },
]

export default function Eleitorado() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Perfil do Eleitorado</h1>
          <p className="text-[var(--text-secondary)]">Análise demográfica dos eleitores</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar
        </button>
      </div>

      {/* Filtros */}
      <div className="card p-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Buscar por município ou zona..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
        <select className="input w-auto">
          <option>Todos os municípios</option>
          <option>Porto Velho</option>
          <option>Ji-Paraná</option>
          <option>Ariquemes</option>
        </select>
        <select className="input w-auto">
          <option>Todas as zonas</option>
          <option>Zona 1</option>
          <option>Zona 2</option>
          <option>Zona 3</option>
        </select>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faixa Etária */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-500" />
            Distribuição por Faixa Etária
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={faixaEtaria}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis dataKey="faixa" stroke="var(--text-secondary)" />
                <YAxis stroke="var(--text-secondary)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Eleitores']}
                />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {faixaEtaria.map((entry, index) => (
                    <Cell key={index} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gênero */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Distribuição por Gênero</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genero}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {genero.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Escolaridade */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Distribuição por Escolaridade</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={escolaridade} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-secondary)" />
                <YAxis dataKey="nivel" type="category" stroke="var(--text-secondary)" width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Eleitores']}
                />
                <Bar dataKey="total" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
