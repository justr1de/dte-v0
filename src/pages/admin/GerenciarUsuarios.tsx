import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { supabase, createUserViaEdgeFunction, deleteUserViaEdgeFunction } from '@/lib/supabase'
import { 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Check,
  X,
  Eye,
  EyeOff,
  Mail,
  User,
  Lock
} from 'lucide-react'
import { toast } from 'sonner'

interface Usuario {
  id: string
  open_id: string
  name: string
  email: string
  role: 'admin' | 'gestor_campanha' | 'candidato'
  is_active: boolean
  created_at: string
  last_signed_in: string
}

export default function GerenciarUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('todos')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<Usuario | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'candidato' as 'admin' | 'gestor_campanha' | 'candidato'
  })

  useEffect(() => {
    fetchUsuarios()
  }, [])

  const fetchUsuarios = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsuarios(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Criar usuário via Edge Function (usa service_role key no servidor)
      await createUserViaEdgeFunction({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role
      })

      toast.success('Usuário criado com sucesso!')
      setShowModal(false)
      setFormData({ name: '', email: '', password: '', role: 'candidato' })
      fetchUsuarios()
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error)
      toast.error(error.message || 'Erro ao criar usuário')
    }
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingUser) {
      // Atualizar usuário existente
      try {
        const { error } = await supabase
          .from('users')
          .update({
            name: formData.name,
            role: formData.role
          })
          .eq('id', editingUser.id)

        if (error) throw error

        toast.success('Usuário atualizado com sucesso!')
        setShowModal(false)
        setEditingUser(null)
        setFormData({ name: '', email: '', password: '', role: 'candidato' })
        fetchUsuarios()
      } catch (error: any) {
        console.error('Erro ao atualizar usuário:', error)
        toast.error(error.message || 'Erro ao atualizar usuário')
      }
    } else {
      // Criar novo usuário
      await handleCreateUser(e)
    }
  }

  const handleUpdateUser = async (userId: string, updates: Partial<Usuario>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)

      if (error) throw error

      toast.success('Usuário atualizado com sucesso!')
      fetchUsuarios()
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      toast.error('Erro ao atualizar usuário')
    }
  }

  const handleToggleActive = async (user: Usuario) => {
    await handleUpdateUser(user.id, { is_active: !user.is_active })
  }

  const handleDeleteUser = async (user: Usuario) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${user.name}?`)) return

    try {
      // Deletar via Edge Function (usa service_role key no servidor)
      await deleteUserViaEdgeFunction(user.id, user.open_id)

      toast.success('Usuário excluído com sucesso!')
      fetchUsuarios()
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      toast.error('Erro ao excluir usuário')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldAlert className="w-4 h-4 text-red-500" />
      case 'gestor_campanha': return <ShieldCheck className="w-4 h-4 text-blue-500" />
      default: return <Shield className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'gestor_campanha': return 'Gestor de Campanha'
      default: return 'Candidato'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'gestor_campanha': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const filteredUsuarios = usuarios.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'todos' || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  const stats = {
    total: usuarios.length,
    admins: usuarios.filter(u => u.role === 'admin').length,
    gestores: usuarios.filter(u => u.role === 'gestor_campanha').length,
    candidatos: usuarios.filter(u => u.role === 'candidato').length,
    ativos: usuarios.filter(u => u.is_active).length
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserPlus className="w-7 h-7 text-red-500" />
              Gerenciar Usuários
            </h1>
            <p className="text-[var(--text-muted)]">
              Adicione, edite e gerencie os usuários do sistema
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2 w-fit"
          >
            <UserPlus className="w-5 h-5" />
            Novo Usuário
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-[var(--text-muted)]">Total</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-red-500">{stats.admins}</p>
            <p className="text-sm text-[var(--text-muted)]">Admins</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{stats.gestores}</p>
            <p className="text-sm text-[var(--text-muted)]">Gestores</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-gray-500">{stats.candidatos}</p>
            <p className="text-sm text-[var(--text-muted)]">Candidatos</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{stats.ativos}</p>
            <p className="text-sm text-[var(--text-muted)]">Ativos</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input"
            >
              <option value="todos">Todos os níveis</option>
              <option value="admin">Administradores</option>
              <option value="gestor_campanha">Gestores de Campanha</option>
              <option value="candidato">Candidatos</option>
            </select>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-secondary)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Usuário</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Nível</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Último Acesso</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
                    </td>
                  </tr>
                ) : filteredUsuarios.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)]">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  filteredUsuarios.map((user) => (
                    <tr key={user.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-medium">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <span className="font-medium">{user.name || 'Sem nome'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {user.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {user.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--text-muted)]">
                        {user.last_signed_in 
                          ? new Date(user.last_signed_in).toLocaleString('pt-BR')
                          : 'Nunca'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.is_active 
                                ? 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600' 
                                : 'hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600'
                            }`}
                            title={user.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {user.is_active ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(user)
                              setFormData({
                                name: user.name || '',
                                email: user.email || '',
                                password: '',
                                role: user.role
                              })
                              setShowModal(true)
                            }}
                            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Criar/Editar Usuário */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[var(--bg-card)] rounded-xl max-w-md w-full">
              <div className="p-6 border-b border-[var(--border-color)]">
                <h2 className="text-xl font-bold">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
              </div>
              <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <User className="w-4 h-4 inline mr-2" />
                    Nome Completo
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input w-full"
                    placeholder="Nome do usuário"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input w-full"
                    placeholder="email@exemplo.com"
                    required
                    disabled={!!editingUser}
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Senha
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input w-full pr-10"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    <Shield className="w-4 h-4 inline mr-2" />
                    Nível de Acesso
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="input w-full"
                  >
                    <option value="candidato">Candidato</option>
                    <option value="gestor_campanha">Gestor de Campanha</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {formData.role === 'admin' && 'Acesso total ao sistema'}
                    {formData.role === 'gestor_campanha' && 'Acesso a pesquisas e inteligência'}
                    {formData.role === 'candidato' && 'Acesso básico de visualização'}
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingUser(null)
                      setFormData({ name: '', email: '', password: '', role: 'candidato' })
                    }}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
