import { useState } from 'react'
import { UserCheck, Search, Plus, Edit, Trash2 } from 'lucide-react'

const candidatosData = [
  { id: 1, nome: 'João Silva', partido: 'MDB', numero: 15, cargo: 'Prefeito', votos: 45678, status: 'ativo' },
  { id: 2, nome: 'Maria Santos', partido: 'PL', numero: 22, cargo: 'Vereador', votos: 12345, status: 'ativo' },
  { id: 3, nome: 'Pedro Costa', partido: 'PT', numero: 13, cargo: 'Vereador', votos: 9876, status: 'ativo' },
  { id: 4, nome: 'Ana Oliveira', partido: 'PP', numero: 11, cargo: 'Prefeito', votos: 38765, status: 'inativo' },
]

export default function Candidatos() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Candidatos</h1>
          <p className="text-[var(--text-secondary)]">Gerenciamento de candidatos</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Candidato
        </button>
      </div>

      <div className="card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar candidato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-medium">Nome</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Partido</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Número</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Cargo</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Votos</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {candidatosData.map((c) => (
              <tr key={c.id} className="table-row">
                <td className="px-6 py-4 font-medium">{c.nome}</td>
                <td className="px-6 py-4">{c.partido}</td>
                <td className="px-6 py-4">{c.numero}</td>
                <td className="px-6 py-4">{c.cargo}</td>
                <td className="px-6 py-4">{c.votos.toLocaleString('pt-BR')}</td>
                <td className="px-6 py-4">
                  <span className={`badge ${c.status === 'ativo' ? 'badge-success' : 'badge-danger'}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-[var(--bg-secondary)] rounded-lg text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
