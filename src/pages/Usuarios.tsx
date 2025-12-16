import { useState } from 'react'
import { Users, Search, Plus, Edit, Trash2, Shield } from 'lucide-react'

const usuariosData = [
  { id: 1, nome: 'Admin Principal', email: 'admin@dte.com', role: 'admin', status: 'ativo' },
  { id: 2, nome: 'Gestor Campanha 1', email: 'gestor1@dte.com', role: 'gestor_campanha', status: 'ativo' },
  { id: 3, nome: 'Candidato Silva', email: 'silva@dte.com', role: 'candidato', status: 'ativo' },
  { id: 4, nome: 'Gestor Campanha 2', email: 'gestor2@dte.com', role: 'gestor_campanha', status: 'inativo' },
]

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  gestor_campanha: 'Gestor de Campanha',
  candidato: 'Candidato'
}

const roleBadgeClass: Record<string, string> = {
  admin: 'badge-danger',
  gestor_campanha: 'badge-warning',
  candidato: 'badge-info'
}

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-[var(--text-secondary)]">Gerenciamento de usuários e permissões</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Usuário
        </button>
      </div>

      <div className="card p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar usuário..."
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
              <th className="px-6 py-4 text-left text-sm font-medium">Email</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Nível</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuariosData.map((u) => (
              <tr key={u.id} className="table-row">
                <td className="px-6 py-4 font-medium">{u.nome}</td>
                <td className="px-6 py-4 text-[var(--text-secondary)]">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`badge ${roleBadgeClass[u.role]}`}>
                    {roleLabels[u.role]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`badge ${u.status === 'ativo' ? 'badge-success' : 'badge-danger'}`}>
                    {u.status}
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
