import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Shield, 
  Search, 
  Filter,
  Users,
  Activity,
  Eye,
  Download,
  RefreshCw,
  Clock,
  Globe,
  Monitor,
  Database,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Settings,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Trash2,
  Ban,
  UserCheck,
  MousePointer,
  Navigation,
  Layers
} from 'lucide-react'
import { toast } from 'sonner'

interface AuditLog {
  id: number
  user_id: string
  user_email: string
  user_name: string
  user_role: string
  action_type: string
  action_category: string
  resource_type: string
  resource_id: string
  description: string
  metadata: any
  ip_address: string
  user_agent: string
  session_id: string
  request_path: string
  request_method: string
  response_status: number
  duration_ms: number
  created_at: string
}

interface UserSession {
  id: string
  user_id: string
  created_at: string
  updated_at: string
  user_agent: string
  ip: string
  user?: {
    email: string
    raw_user_meta_data: any
  }
}

interface SystemUser {
  id: string
  open_id: string
  name: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  last_signed_in: string
}

const SUPERADMIN_EMAIL = 'contato@dataro-it.com.br'

export default function SuperAdmin() {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'sessions' | 'users' | 'analytics'>('overview')
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('7days')
  const [expandedLog, setExpandedLog] = useState<number | null>(null)
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('')
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Verificar se o usuário é o superadmin
  useEffect(() => {
    const checkAuthorization = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email === SUPERADMIN_EMAIL) {
        setIsAuthorized(true)
        setCurrentUserEmail(user.email)
      } else {
        setIsAuthorized(false)
        toast.error('Acesso negado. Esta página é exclusiva para o Super Administrador.')
      }
      setLoading(false)
    }
    checkAuthorization()
  }, [])

  // Carregar dados
  const loadData = useCallback(async () => {
    if (!isAuthorized) return
    
    setLoading(true)
    try {
      // Carregar logs de auditoria
      const startDate = getStartDate(dateFilter)
      const { data: logsData } = await supabase
        .from('audit_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(1000)
      
      setAuditLogs(logsData || [])

      // Carregar sessões ativas
      const { data: sessionsData } = await supabase
        .from('auth.sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      setSessions(sessionsData || [])

      // Carregar usuários
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      setUsers(usersData || [])

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }, [isAuthorized, dateFilter])

  useEffect(() => {
    if (isAuthorized) {
      loadData()
    }
  }, [isAuthorized, loadData])

  const getStartDate = (filter: string): Date => {
    const now = new Date()
    switch (filter) {
      case '1hour': return new Date(now.getTime() - 60 * 60 * 1000)
      case '24hours': return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case '7days': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case '30days': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      case '90days': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth': return <LogIn className="w-4 h-4" />
      case 'navigation': return <Navigation className="w-4 h-4" />
      case 'data': return <Database className="w-4 h-4" />
      case 'action': return <MousePointer className="w-4 h-4" />
      case 'system': return <Settings className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'auth': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'navigation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'data': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'action': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
      case 'system': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'gestor_campanha': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'candidato': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address?.includes(searchTerm)
    const matchesCategory = categoryFilter === 'all' || log.action_category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const exportAuditLogs = () => {
    const csv = [
      ['ID', 'Data/Hora', 'Usuário', 'Email', 'Role', 'Categoria', 'Ação', 'Descrição', 'IP', 'Path', 'Status', 'Duração (ms)'],
      ...filteredLogs.map(log => [
        log.id,
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.user_name || '-',
        log.user_email || '-',
        log.user_role || '-',
        log.action_category || '-',
        log.action_type || '-',
        log.description || '-',
        log.ip_address || '-',
        log.request_path || '-',
        log.response_status || '-',
        log.duration_ms || '-'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria_completa_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Relatório de auditoria exportado!')
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('id', userId)

      if (error) throw error

      // Registrar ação de auditoria
      await logAuditAction(
        currentStatus ? 'user_deactivated' : 'user_activated',
        'system',
        'user',
        userId,
        `Usuário ${currentStatus ? 'desativado' : 'ativado'} pelo superadmin`
      )

      toast.success(`Usuário ${currentStatus ? 'desativado' : 'ativado'} com sucesso!`)
      loadData()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status do usuário')
    }
  }

  const logAuditAction = async (
    actionType: string,
    category: string,
    resourceType: string,
    resourceId: string,
    description: string
  ) => {
    try {
      await supabase.from('audit_logs').insert({
        user_email: currentUserEmail,
        user_name: 'Super Administrador',
        user_role: 'superadmin',
        action_type: actionType,
        action_category: category,
        resource_type: resourceType,
        resource_id: resourceId,
        description: description,
        ip_address: 'N/A',
        user_agent: navigator.userAgent
      })
    } catch (error) {
      console.error('Erro ao registrar auditoria:', error)
    }
  }

  // Estatísticas
  const stats = {
    totalLogs: auditLogs.length,
    totalUsers: users.length,
    activeUsers: users.filter(u => u.is_active).length,
    activeSessions: sessions.length,
    authEvents: auditLogs.filter(l => l.action_category === 'auth').length,
    dataEvents: auditLogs.filter(l => l.action_category === 'data').length,
    navigationEvents: auditLogs.filter(l => l.action_category === 'navigation').length,
    actionEvents: auditLogs.filter(l => l.action_category === 'action').length,
  }

  // Usuários únicos por período
  const uniqueUsers = new Set(auditLogs.map(l => l.user_email)).size

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-red-500">Acesso Negado</h1>
          <p className="text-[var(--text-muted)]">
            Esta página é exclusiva para o Super Administrador do sistema.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-7 h-7 text-red-500" />
            Super Administração
          </h1>
          <p className="text-[var(--text-muted)]">
            Painel exclusivo de monitoramento e auditoria do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={exportAuditLogs}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
          { id: 'audit', label: 'Logs de Auditoria', icon: FileText },
          { id: 'sessions', label: 'Sessões Ativas', icon: Monitor },
          { id: 'users', label: 'Usuários', icon: Users },
          { id: 'analytics', label: 'Analytics', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-red-500 text-white'
                : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                  <Activity className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalLogs}</p>
                  <p className="text-sm text-[var(--text-muted)]">Total de Eventos</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{uniqueUsers}</p>
                  <p className="text-sm text-[var(--text-muted)]">Usuários Únicos</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <UserCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeUsers}</p>
                  <p className="text-sm text-[var(--text-muted)]">Usuários Ativos</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Monitor className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeSessions}</p>
                  <p className="text-sm text-[var(--text-muted)]">Sessões Ativas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Events by Category */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium">Autenticação</span>
                </div>
                <span className="text-lg font-bold">{stats.authEvents}</span>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">Navegação</span>
                </div>
                <span className="text-lg font-bold">{stats.navigationEvents}</span>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium">Dados</span>
                </div>
                <span className="text-lg font-bold">{stats.dataEvents}</span>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MousePointer className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium">Ações</span>
                </div>
                <span className="text-lg font-bold">{stats.actionEvents}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="p-4 border-b border-[var(--border-color)]">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Atividade Recente
              </h3>
            </div>
            <div className="divide-y divide-[var(--border-color)]">
              {auditLogs.slice(0, 10).map(log => (
                <div key={log.id} className="p-4 hover:bg-[var(--bg-secondary)] transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getCategoryColor(log.action_category)}`}>
                        {getCategoryIcon(log.action_category)}
                      </div>
                      <div>
                        <p className="font-medium">{log.description || log.action_type}</p>
                        <p className="text-sm text-[var(--text-muted)]">
                          {log.user_name || log.user_email} • {log.ip_address}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="card p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Buscar por usuário, email, descrição ou IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input"
              >
                <option value="all">Todas as categorias</option>
                <option value="auth">Autenticação</option>
                <option value="navigation">Navegação</option>
                <option value="data">Dados</option>
                <option value="action">Ações</option>
                <option value="system">Sistema</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="input"
              >
                <option value="1hour">Última hora</option>
                <option value="24hours">Últimas 24 horas</option>
                <option value="7days">Últimos 7 dias</option>
                <option value="30days">Últimos 30 dias</option>
                <option value="90days">Últimos 90 dias</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium">Data/Hora</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Usuário</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Categoria</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Ação</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">IP</th>
                    <th className="px-4 py-3 text-left text-sm font-medium">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filteredLogs.map(log => (
                    <>
                      <tr 
                        key={log.id} 
                        className="hover:bg-[var(--bg-secondary)] cursor-pointer"
                        onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      >
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm">{log.user_name || '-'}</p>
                            <p className="text-xs text-[var(--text-muted)]">{log.user_email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(log.user_role)}`}>
                            {log.user_role || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getCategoryColor(log.action_category)}`}>
                            {getCategoryIcon(log.action_category)}
                            {log.action_category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">{log.action_type}</td>
                        <td className="px-4 py-3 text-sm font-mono">{log.ip_address || '-'}</td>
                        <td className="px-4 py-3">
                          <button className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                            {expandedLog === log.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                      {expandedLog === log.id && (
                        <tr>
                          <td colSpan={7} className="px-4 py-4 bg-[var(--bg-secondary)]">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-[var(--text-muted)]">Descrição</p>
                                <p className="font-medium">{log.description || '-'}</p>
                              </div>
                              <div>
                                <p className="text-[var(--text-muted)]">Path</p>
                                <p className="font-mono text-xs">{log.request_path || '-'}</p>
                              </div>
                              <div>
                                <p className="text-[var(--text-muted)]">Método</p>
                                <p className="font-medium">{log.request_method || '-'}</p>
                              </div>
                              <div>
                                <p className="text-[var(--text-muted)]">Status</p>
                                <p className="font-medium">{log.response_status || '-'}</p>
                              </div>
                              <div>
                                <p className="text-[var(--text-muted)]">Duração</p>
                                <p className="font-medium">{log.duration_ms ? `${log.duration_ms}ms` : '-'}</p>
                              </div>
                              <div>
                                <p className="text-[var(--text-muted)]">Session ID</p>
                                <p className="font-mono text-xs truncate">{log.session_id || '-'}</p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-[var(--text-muted)]">User Agent</p>
                                <p className="font-mono text-xs truncate">{log.user_agent || '-'}</p>
                              </div>
                              {log.metadata && Object.keys(log.metadata).length > 0 && (
                                <div className="col-span-4">
                                  <p className="text-[var(--text-muted)]">Metadata</p>
                                  <pre className="font-mono text-xs bg-[var(--bg-tertiary)] p-2 rounded mt-1 overflow-x-auto">
                                    {JSON.stringify(log.metadata, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredLogs.length === 0 && (
              <div className="p-8 text-center text-[var(--text-muted)]">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum log encontrado para os filtros selecionados</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)]">
            <h3 className="font-semibold flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Sessões Ativas ({sessions.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-secondary)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Usuário</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">IP</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Dispositivo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Iniciada em</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Última atividade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {sessions.map(session => (
                  <tr key={session.id} className="hover:bg-[var(--bg-secondary)]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm">{session.user?.raw_user_meta_data?.name || '-'}</p>
                      <p className="text-xs text-[var(--text-muted)]">{session.user?.email || session.user_id}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">{session.ip || '-'}</td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate">{session.user_agent || '-'}</td>
                    <td className="px-4 py-3 text-sm">{new Date(session.created_at).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3 text-sm">{new Date(session.updated_at).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sessions.length === 0 && (
            <div className="p-8 text-center text-[var(--text-muted)]">
              <Monitor className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma sessão ativa encontrada</p>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)]">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Gerenciamento de Usuários ({users.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-secondary)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Usuário</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Criado em</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Último acesso</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {users.map(user => (
                  <tr key={user.id} className="hover:bg-[var(--bg-secondary)]">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-sm">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3 text-sm">
                      {user.last_signed_in ? new Date(user.last_signed_in).toLocaleString('pt-BR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      {user.email !== SUPERADMIN_EMAIL && (
                        <button
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.is_active 
                              ? 'hover:bg-red-100 text-red-600 dark:hover:bg-red-900/30' 
                              : 'hover:bg-green-100 text-green-600 dark:hover:bg-green-900/30'
                          }`}
                          title={user.is_active ? 'Desativar usuário' : 'Ativar usuário'}
                        >
                          {user.is_active ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Análise de Uso do Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Eventos por Categoria */}
              <div>
                <h4 className="text-sm font-medium mb-3">Eventos por Categoria</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Autenticação', value: stats.authEvents, color: 'bg-green-500' },
                    { label: 'Navegação', value: stats.navigationEvents, color: 'bg-blue-500' },
                    { label: 'Dados', value: stats.dataEvents, color: 'bg-purple-500' },
                    { label: 'Ações', value: stats.actionEvents, color: 'bg-amber-500' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-24 text-sm">{item.label}</div>
                      <div className="flex-1 bg-[var(--bg-secondary)] rounded-full h-4 overflow-hidden">
                        <div 
                          className={`h-full ${item.color}`} 
                          style={{ width: `${stats.totalLogs > 0 ? (item.value / stats.totalLogs) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="w-16 text-sm text-right">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usuários por Role */}
              <div>
                <h4 className="text-sm font-medium mb-3">Usuários por Tipo</h4>
                <div className="space-y-2">
                  {[
                    { label: 'Super Admin', value: users.filter(u => u.role === 'superadmin').length, color: 'bg-red-500' },
                    { label: 'Admin', value: users.filter(u => u.role === 'admin').length, color: 'bg-purple-500' },
                    { label: 'Gestor', value: users.filter(u => u.role === 'gestor_campanha').length, color: 'bg-blue-500' },
                    { label: 'Candidato', value: users.filter(u => u.role === 'candidato').length, color: 'bg-green-500' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="w-24 text-sm">{item.label}</div>
                      <div className="flex-1 bg-[var(--bg-secondary)] rounded-full h-4 overflow-hidden">
                        <div 
                          className={`h-full ${item.color}`} 
                          style={{ width: `${users.length > 0 ? (item.value / users.length) * 100 : 0}%` }}
                        />
                      </div>
                      <div className="w-16 text-sm text-right">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Usuários */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Top Usuários por Atividade</h3>
            <div className="space-y-3">
              {Object.entries(
                auditLogs.reduce((acc, log) => {
                  const key = log.user_email || 'Anônimo'
                  acc[key] = (acc[key] || 0) + 1
                  return acc
                }, {} as Record<string, number>)
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([email, count], index) => (
                  <div key={email} className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold text-[var(--text-muted)]">{index + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium">{email}</p>
                    </div>
                    <span className="font-bold">{count} eventos</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
