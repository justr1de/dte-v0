import { BarChart3, TrendingUp } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

const resultados = [
  { candidato: 'João Silva', partido: 'MDB', votos: 45678, percentual: 35.2, cor: '#00A859' },
  { candidato: 'Ana Oliveira', partido: 'PP', votos: 38765, percentual: 29.9, cor: '#0066CC' },
  { candidato: 'Carlos Souza', partido: 'PL', votos: 25432, percentual: 19.6, cor: '#1E3A8A' },
  { candidato: 'Maria Santos', partido: 'PT', votos: 19876, percentual: 15.3, cor: '#CC0000' },
]

export default function Resultados() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">Resultados Eleitorais</h1>
        <p className="text-[var(--text-secondary)]">Análise de resultados por candidato</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            Votos por Candidato
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resultados} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis type="number" stroke="var(--text-secondary)" />
                <YAxis dataKey="candidato" type="category" stroke="var(--text-secondary)" width={100} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--bg-card)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="votos" radius={[0, 4, 4, 0]}>
                  {resultados.map((entry, index) => (
                    <Cell key={index} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Ranking de Candidatos</h2>
          <div className="space-y-4">
            {resultados.map((r, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-2xl font-bold text-[var(--text-muted)] w-8">{i + 1}º</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">{r.candidato}</span>
                    <span className="text-sm text-[var(--text-secondary)]">{r.percentual}%</span>
                  </div>
                  <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${r.percentual}%`, backgroundColor: r.cor }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
