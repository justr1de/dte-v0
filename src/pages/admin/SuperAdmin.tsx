import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Shield, 
  Search, 
  Users,
  Activity,
  Download,
  RefreshCw,
  Clock,
  Globe,
  Monitor,
  Database,
  FileText,
  CheckCircle,
  XCircle,
  LogIn,
  Settings,
  BarChart3,
  Calendar,
  Ban,
  UserCheck,
  Smartphone,
  Laptop,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

interface LoginAttempt {
  id: number
  user_email: string
  user_name: string
  resultado: string
  ip_address: string
  user_agent: string
  created_at: string
}

interface UserSession {
  id: string
  user_id: string
  email: string
  user_name: string
  ip: string
  user_agent: string
  created_at: string
  updated_at: string
}

interface SystemUser {
  id: string
  email: string
  name: string
  role: string
  created_at: string
  last_sign_in_at: string
  banned_until: string | null
}

const SUPERADMIN_EMAIL = 'contato@dataro-it.com.br'

export default function SuperAdmin() {
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'sessions' | 'users' | 'analytics'>('overview')
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([])
  const [sessions, setSessions] = useState<UserSession[]>([])
  const [users, setUsers] = useState<SystemUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFilter, setDateFilter] = useState('30days')
  const [isAuthorized, setIsAuthorized] = useState(false)

  // Verificar se o usuário é o superadmin
  useEffect(() => {
    const checkAuthorization = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email === SUPERADMIN_EMAIL) {
        setIsAuthorized(true)
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
      // Carregar logs de login
      const { data: logsData, error: logsError } = await supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)
      
      if (logsError) console.error('Erro ao carregar logs:', logsError)
      setLoginAttempts(logsData || [])

      // Carregar sessões ativas via RPC
      const { data: sessionsData, error: sessionsError } = await supabase.rpc('get_active_sessions')
      
      if (sessionsError) {
        console.error('Erro ao carregar sessões:', sessionsError)
        // Fallback: tentar buscar diretamente
        setSessions([])
      } else {
        setSessions(sessionsData || [])
      }

      // Carregar usuários via RPC
      const { data: usersData, error: usersError } = await supabase.rpc('get_all_users')
      
      if (usersError) {
        console.error('Erro ao carregar usuários:', usersError)
        setUsers([])
      } else {
        setUsers(usersData || [])
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }, [isAuthorized])

  useEffect(() => {
    if (isAuthorized) {
      loadData()
    }
  }, [isAuthorized, loadData])

  // Formatar User Agent
  const formatUserAgent = (ua: string) => {
    if (!ua) return { device: 'Desconhecido', browser: 'N/A', icon: Monitor }
    
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua)
    const isTablet = /iPad|Tablet/i.test(ua)
    
    let browser = 'Desconhecido'
    if (ua.includes('Firefox')) browser = 'Firefox'
    else if (ua.includes('Chrome')) browser = 'Chrome'
    else if (ua.includes('Safari')) browser = 'Safari'
    else if (ua.includes('Edge')) browser = 'Edge'
    else if (ua.includes('curl')) browser = 'API/curl'
    
    let os = ''
    if (ua.includes('Windows')) os = 'Windows'
    else if (ua.includes('Mac OS')) os = 'macOS'
    else if (ua.includes('Linux')) os = 'Linux'
    else if (ua.includes('Android')) os = 'Android'
    else if (ua.includes('iPhone') || ua.includes('iOS')) os = 'iOS'
    
    return {
      device: isMobile ? (isTablet ? 'Tablet' : 'Mobile') : 'Desktop',
      browser: `${browser} (${os || 'N/A'})`,
      icon: isMobile ? Smartphone : Laptop
    }
  }

  // Filtrar logs
  const filteredLogs = loginAttempts.filter(log => {
    const matchesSearch = 
      log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address?.includes(searchTerm)
    return matchesSearch
  })

  // Exportar logs
  const exportLogs = () => {
    const csv = [
      ['ID', 'Data/Hora', 'Usuário', 'Email', 'Resultado', 'IP', 'Navegador'],
      ...filteredLogs.map(log => [
        log.id,
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.user_name || '-',
        log.user_email || '-',
        log.resultado,
        log.ip_address || '-',
        log.user_agent || '-'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Relatório exportado!')
  }

  // Banir/Desbanir usuário
  const toggleUserBan = async (userId: string, email: string, isBanned: boolean) => {
    try {
      const { error } = await supabase.rpc('toggle_user_ban', {
        target_user_id: userId,
        should_ban: !isBanned
      })

      if (error) throw error

      toast.success(`Usuário ${isBanned ? 'desbloqueado' : 'bloqueado'} com sucesso!`)
      loadData()
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status do usuário')
    }
  }

  // Estatísticas
  const stats = {
    totalLogs: loginAttempts.length,
    totalUsers: users.length,
    activeUsers: users.filter(u => !u.banned_until).length,
    bannedUsers: users.filter(u => u.banned_until).length,
    activeSessions: sessions.length,
    successLogins: loginAttempts.filter(l => l.resultado === 'sucesso').length,
    failedLogins: loginAttempts.filter(l => l.resultado === 'falha').length,
    uniqueUsers: new Set(loginAttempts.map(l => l.user_email)).size
  }

  // Logins por dia (últimos 7 dias)
  const loginsByDay = () => {
    const days: { [key: string]: number } = {}
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      days[key] = 0
    }
    
    loginAttempts.forEach(log => {
      const date = new Date(log.created_at)
      const key = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      if (days[key] !== undefined) {
        days[key]++
      }
    })
    
    return Object.entries(days).map(([date, count]) => ({ date, count }))
  }

  if (!isAuthorized && !loading) {
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
            onClick={exportLogs}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--border-color)] pb-2">
        {[
          { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
          { id: 'audit', label: 'Logs de Auditoria', icon: FileText },
          { id: 'sessions', label: 'Sessões Ativas', icon: Monitor },
          { id: 'users', label: 'Usuários', icon: Users },
          { id: 'analytics', label: 'Analytics', icon: TrendingUp },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-emerald-500 text-white'
                : 'bg-[var(--card-bg)] hover:bg-[var(--hover-bg)]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Total de Eventos</p>
                  <p className="text-3xl font-bold">{stats.totalLogs}</p>
                </div>
                <Activity className="w-10 h-10 text-emerald-500 opacity-50" />
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Usuários Únicos</p>
                  <p className="text-3xl font-bold">{stats.uniqueUsers}</p>
                </div>
                <Users className="w-10 h-10 text-blue-500 opacity-50" />
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Usuários Ativos</p>
                  <p className="text-3xl font-bold">{stats.activeUsers}</p>
                </div>
                <UserCheck className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">Sessões Ativas</p>
                  <p className="text-3xl font-bold">{stats.activeSessions}</p>
                </div>
                <Monitor className="w-10 h-10 text-purple-500 opacity-50" />
              </div>
            </div>
          </div>

          {/* Resumo de Logins */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <LogIn className="w-5 h-5 text-emerald-500" />
                Resumo de Logins
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Logins bem-sucedidos</span>
                  <span className="font-semibold text-green-500">{stats.successLogins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Logins falhados</span>
                  <span className="font-semibold text-red-500">{stats.failedLogins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Taxa de sucesso</span>
                  <span className="font-semibold">
                    {stats.totalLogs > 0 
                      ? ((stats.successLogins / stats.totalLogs) * 100).toFixed(1) 
                      : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Resumo de Usuários
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Total de usuários</span>
                  <span className="font-semibold">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Usuários ativos</span>
                  <span className="font-semibold text-green-500">{stats.activeUsers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">Usuários bloqueados</span>
                  <span className="font-semibold text-red-500">{stats.bannedUsers}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Últimos Logins */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Últimos Logins
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-2 px-3 text-sm font-medium text-[var(--text-muted)]">Usuário</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-[var(--text-muted)]">Email</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-[var(--text-muted)]">Status</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-[var(--text-muted)]">IP</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-[var(--text-muted)]">Data/Hora</th>
                  </tr>
                </thead>
                <tbody>
                  {loginAttempts.slice(0, 5).map(log => (
                    <tr key={log.id} className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)]">
                      <td className="py-2 px-3">{log.user_name || '-'}</td>
                      <td className="py-2 px-3 text-sm text-[var(--text-muted)]">{log.user_email}</td>
                      <td className="py-2 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          log.resultado === 'sucesso' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {log.resultado === 'sucesso' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {log.resultado}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-sm font-mono text-[var(--text-muted)]">
                        {log.ip_address?.replace('/32', '') || '-'}
                      </td>
                      <td className="py-2 px-3 text-sm text-[var(--text-muted)]">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="card p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Buscar por usuário, email ou IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)]"
                />
              </div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--input-bg)]"
              >
                <option value="7days">Últimos 7 dias</option>
                <option value="30days">Últimos 30 dias</option>
                <option value="90days">Últimos 90 dias</option>
              </select>
            </div>
          </div>

          {/* Tabela de Logs */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)]">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                Logs de Auditoria ({filteredLogs.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--hover-bg)]">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium">Data/Hora</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Usuário</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Resultado</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">IP</th>
                    <th className="text-left py-3 px-4 text-sm font-medium">Dispositivo</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map(log => {
                    const uaInfo = formatUserAgent(log.user_agent)
                    return (
                      <tr key={log.id} className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)]">
                        <td className="py-3 px-4 text-sm">
                          {new Date(log.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{log.user_name || '-'}</p>
                            <p className="text-xs text-[var(--text-muted)]">{log.user_email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            log.resultado === 'sucesso' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {log.resultado === 'sucesso' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {log.resultado}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm font-mono text-[var(--text-muted)]">
                          {log.ip_address?.replace('/32', '') || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <uaInfo.icon className="w-4 h-4 text-[var(--text-muted)]" />
                            <span className="text-sm">{uaInfo.browser}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filteredLogs.length === 0 && (
              <div className="p-12 text-center text-[var(--text-muted)]">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum log encontrado</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)]">
            <h3 className="font-semibold flex items-center gap-2">
              <Monitor className="w-5 h-5 text-emerald-500" />
              Sessões Ativas ({sessions.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--hover-bg)]">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium">Usuário</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">IP</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Dispositivo</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Iniciada em</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Última atividade</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => {
                  const uaInfo = formatUserAgent(session.user_agent)
                  return (
                    <tr key={session.id} className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)]">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{session.user_name || '-'}</p>
                          <p className="text-xs text-[var(--text-muted)]">{session.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm font-mono text-[var(--text-muted)]">
                        {session.ip?.replace('/32', '') || '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <uaInfo.icon className="w-4 h-4 text-[var(--text-muted)]" />
                          <span className="text-sm">{uaInfo.browser}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--text-muted)]">
                        {new Date(session.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--text-muted)]">
                        {new Date(session.updated_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {sessions.length === 0 && (
            <div className="p-12 text-center text-[var(--text-muted)]">
              <Monitor className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma sessão ativa encontrada</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)]">
            <h3 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              Usuários do Sistema ({users.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--hover-bg)]">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium">Nome</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Criado em</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Último login</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const isBanned = user.banned_until && new Date(user.banned_until) > new Date()
                  const isSuperAdmin = user.email === SUPERADMIN_EMAIL
                  return (
                    <tr key={user.id} className="border-b border-[var(--border-color)] hover:bg-[var(--hover-bg)]">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.name || '-'}</span>
                          {isSuperAdmin && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                              Super Admin
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--text-muted)]">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                          isBanned 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {isBanned ? <Ban className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
                          {isBanned ? 'Bloqueado' : 'Ativo'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--text-muted)]">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--text-muted)]">
                        {user.last_sign_in_at 
                          ? new Date(user.last_sign_in_at).toLocaleString('pt-BR')
                          : 'Nunca'
                        }
                      </td>
                      <td className="py-3 px-4">
                        {!isSuperAdmin && (
                          <button
                            onClick={() => toggleUserBan(user.id, user.email, !!isBanned)}
                            className={`px-3 py-1 rounded text-xs font-medium ${
                              isBanned
                                ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {isBanned ? 'Desbloquear' : 'Bloquear'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="p-12 text-center text-[var(--text-muted)]">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum usuário encontrado</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Gráfico de Logins por Dia */}
          <div className="card p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Logins nos Últimos 7 Dias
            </h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {loginsByDay().map((day, index) => {
                const maxCount = Math.max(...loginsByDay().map(d => d.count), 1)
                const height = (day.count / maxCount) * 100
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-emerald-500 rounded-t transition-all duration-300"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-xs text-[var(--text-muted)]">{day.date}</span>
                    <span className="text-xs font-medium">{day.count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Estatísticas Detalhadas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5">
              <h4 className="text-sm text-[var(--text-muted)] mb-2">Dispositivos</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <Laptop className="w-4 h-4" /> Desktop
                  </span>
                  <span className="font-medium">
                    {loginAttempts.filter(l => !l.user_agent?.includes('Mobile')).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" /> Mobile
                  </span>
                  <span className="font-medium">
                    {loginAttempts.filter(l => l.user_agent?.includes('Mobile')).length}
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h4 className="text-sm text-[var(--text-muted)] mb-2">Navegadores</h4>
              <div className="space-y-2">
                {['Chrome', 'Firefox', 'Safari', 'Edge'].map(browser => (
                  <div key={browser} className="flex justify-between">
                    <span>{browser}</span>
                    <span className="font-medium">
                      {loginAttempts.filter(l => l.user_agent?.includes(browser)).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5">
              <h4 className="text-sm text-[var(--text-muted)] mb-2">Horários de Pico</h4>
              <div className="space-y-2">
                {['Manhã (6-12h)', 'Tarde (12-18h)', 'Noite (18-24h)', 'Madrugada (0-6h)'].map((period, index) => {
                  const ranges = [[6, 12], [12, 18], [18, 24], [0, 6]]
                  const count = loginAttempts.filter(l => {
                    const hour = new Date(l.created_at).getHours()
                    return hour >= ranges[index][0] && hour < ranges[index][1]
                  }).length
                  return (
                    <div key={period} className="flex justify-between">
                      <span>{period}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
