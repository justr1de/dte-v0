import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Shield, 
  Search, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Activity,
  Download,
  RefreshCw,
  Filter,
  X,
  Eye,
  Monitor,
  Globe,
  Clock,
  MapPin,
  Smartphone,
  LogIn,
  LogOut,
  Navigation,
  Database,
  Lock,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'

interface AuditLog {
  id: number
  user_id: string | null
  user_email: string
  user_name: string
  user_role: string
  action_type: string
  action_category: string
  resource_type: string | null
  resource_id: string | null
  description: string | null
  metadata: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  session_id: string | null
  request_path: string | null
  request_method: string | null
  response_status: number | null
  duration_ms: number | null
  created_at: string
}

const SUPERADMIN_EMAIL = 'contato@dataro-it.com.br'

// Cores e ícones por categoria
const CATEGORY_CONFIG: Record<string, { color: string; bgColor: string; icon: any; label: string }> = {
  auth: { color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: LogIn, label: 'Autenticação' },
  navigation: { color: 'text-cyan-400', bgColor: 'bg-cyan-500/20', icon: Navigation, label: 'Navegação' },
  data: { color: 'text-purple-400', bgColor: 'bg-purple-500/20', icon: Database, label: 'Dados' },
  action: { color: 'text-amber-400', bgColor: 'bg-amber-500/20', icon: Activity, label: 'Ação' },
  system: { color: 'text-slate-400', bgColor: 'bg-slate-500/20', icon: Monitor, label: 'Sistema' },
  security: { color: 'text-red-400', bgColor: 'bg-red-500/20', icon: Lock, label: 'Segurança' },
}

const ACTION_LABELS: Record<string, string> = {
  login: 'Login',
  logout: 'Logout',
  login_failed: 'Login Falhou',
  login_blocked: 'Login Bloqueado',
  login_error: 'Erro no Login',
  forced_logout: 'Logout Forçado',
  session_refresh: 'Sessão Renovada',
  session_expired: 'Sessão Expirada',
  account_created: 'Conta Criada',
  page_view: 'Visualização de Página',
  data_access: 'Acesso a Dados',
  data_export: 'Exportação de Dados',
  search: 'Pesquisa',
  filter_applied: 'Filtro Aplicado',
  error: 'Erro do Sistema',
}

export default function LogsAuditoria() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  
  // Filtros
  const [searchUser, setSearchUser] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('todos')
  const [actionFilter, setActionFilter] = useState<string>('todos')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [limit, setLimit] = useState(200)

  // Verificar autorização
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email === SUPERADMIN_EMAIL) {
        setIsAuthorized(true)
      } else {
        setIsAuthorized(false)
        toast.error('Acesso negado. Esta página é exclusiva para o Super Administrador.')
      }
      setLoading(false)
    }
    checkAuth()
  }, [])

  // Carregar logs
  const loadLogs = useCallback(async () => {
    if (!isAuthorized) return
    
    setLoading(true)
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (dataInicial) {
        query = query.gte('created_at', new Date(dataInicial).toISOString())
      }
      if (dataFinal) {
        const endDate = new Date(dataFinal)
        endDate.setHours(23, 59, 59, 999)
        query = query.lte('created_at', endDate.toISOString())
      }
      if (categoryFilter !== 'todos') {
        query = query.eq('action_category', categoryFilter)
      }
      if (actionFilter !== 'todos') {
        query = query.eq('action_type', actionFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error('Erro ao carregar logs:', error)
      toast.error('Erro ao carregar logs de auditoria')
    } finally {
      setLoading(false)
    }
  }, [isAuthorized, dataInicial, dataFinal, categoryFilter, actionFilter, limit])

  useEffect(() => {
    if (isAuthorized) {
      loadLogs()
    }
  }, [isAuthorized, loadLogs])

  // Filtrar por usuário localmente
  const filteredLogs = logs.filter(log => {
    if (!searchUser) return true
    const search = searchUser.toLowerCase()
    return (
      log.user_email?.toLowerCase().includes(search) ||
      log.user_name?.toLowerCase().includes(search) ||
      log.ip_address?.toLowerCase().includes(search) ||
      log.description?.toLowerCase().includes(search)
    )
  })

  // Estatísticas
  const stats = {
    total: logs.length,
    auth: logs.filter(l => l.action_category === 'auth').length,
    navigation: logs.filter(l => l.action_category === 'navigation').length,
    security: logs.filter(l => l.action_category === 'security').length,
    data: logs.filter(l => l.action_category === 'data').length,
    logins: logs.filter(l => l.action_type === 'login').length,
    loginsFailed: logs.filter(l => l.action_type === 'login_failed' || l.action_type === 'login_blocked').length,
    usuariosUnicos: new Set(logs.map(l => l.user_email).filter(e => e !== 'anonymous')).size,
    paginasMaisAcessadas: Object.entries(
      logs.filter(l => l.action_type === 'page_view')
        .reduce((acc, l) => {
          const page = l.resource_id || l.request_path || 'N/A'
          acc[page] = (acc[page] || 0) + 1
          return acc
        }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1]).slice(0, 5)
  }

  // Ações únicas para filtro
  const uniqueActions = [...new Set(logs.map(l => l.action_type))].sort()

  // Limpar filtros
  const limparFiltros = () => {
    setSearchUser('')
    setCategoryFilter('todos')
    setActionFilter('todos')
    setDataInicial('')
    setDataFinal('')
  }

  // Exportar CSV
  const exportarCSV = () => {
    const csv = [
      ['Data/Hora', 'Usuário', 'Email', 'Role', 'Categoria', 'Ação', 'Descrição', 'IP', 'Navegador', 'Dispositivo', 'SO', 'Resolução', 'Timezone', 'Página', 'Session ID', 'Status'],
      ...filteredLogs.map(log => {
        const deviceInfo = log.metadata?.device_info || {}
        return [
          new Date(log.created_at).toLocaleString('pt-BR'),
          log.user_name || '-',
          log.user_email || '-',
          log.user_role || '-',
          CATEGORY_CONFIG[log.action_category]?.label || log.action_category,
          ACTION_LABELS[log.action_type] || log.action_type,
          log.description || '-',
          log.ip_address || '-',
          deviceInfo.browser || '-',
          deviceInfo.device || '-',
          deviceInfo.os || '-',
          deviceInfo.screenResolution || '-',
          deviceInfo.timezone || '-',
          log.request_path || '-',
          log.session_id || '-',
          log.response_status?.toString() || '-'
        ]
      })
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `auditoria_completa_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Relatório completo exportado com sucesso!')
  }

  // Formatar detalhes do dispositivo
  const getDeviceInfo = (log: AuditLog) => {
    const info = log.metadata?.device_info
    if (!info) return { browser: '-', os: '-', device: '-', screen: '-' }
    return {
      browser: info.browser || '-',
      os: info.os || '-',
      device: info.device || '-',
      screen: info.screenResolution || '-',
      viewport: info.viewportSize || '-',
      language: info.language || '-',
      timezone: info.timezone || '-',
      platform: info.platform || '-',
      colorDepth: info.colorDepth || '-',
      pixelRatio: info.pixelRatio || '-',
      cookiesEnabled: info.cookiesEnabled,
      onLine: info.onLine
    }
  }

  // Ícone de status da ação
  const getActionIcon = (log: AuditLog) => {
    const config = CATEGORY_CONFIG[log.action_category] || CATEGORY_CONFIG.system
    const Icon = config.icon
    return <Icon className={`w-4 h-4 ${config.color}`} />
  }

  // Badge de status
  const getStatusBadge = (log: AuditLog) => {
    if (log.response_status) {
      if (log.response_status >= 200 && log.response_status < 300) {
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400"><CheckCircle className="w-3 h-3" />{log.response_status}</span>
      } else if (log.response_status >= 400) {
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400"><XCircle className="w-3 h-3" />{log.response_status}</span>
      }
    }
    
    if (log.action_type === 'login' || log.action_type === 'page_view') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400"><CheckCircle className="w-3 h-3" />OK</span>
    }
    if (log.action_type === 'login_failed' || log.action_type === 'login_blocked') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400"><XCircle className="w-3 h-3" />Bloqueado</span>
    }
    if (log.action_type === 'logout' || log.action_type === 'forced_logout') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400"><LogOut className="w-3 h-3" />Saiu</span>
    }
    if (log.action_category === 'security') {
      return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400"><AlertTriangle className="w-3 h-3" />Alerta</span>
    }
    
    return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400">-</span>
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
            <Shield className="w-7 h-7 text-emerald-500" />
            Módulo de Auditoria Completa
          </h1>
          <p className="text-[var(--text-muted)]">
            Registro detalhado de todas as ações, acessos e eventos do sistema
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Dados coletados em conformidade com a LGPD - uso exclusivo para auditoria e segurança do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadLogs}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={exportarCSV}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="card p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Total Eventos</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Logins OK</p>
          <p className="text-2xl font-bold text-emerald-400">{stats.logins}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Logins Falhos</p>
          <p className="text-2xl font-bold text-red-400">{stats.loginsFailed}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Navegações</p>
          <p className="text-2xl font-bold text-cyan-400">{stats.navigation}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Dados</p>
          <p className="text-2xl font-bold text-purple-400">{stats.data}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Segurança</p>
          <p className="text-2xl font-bold text-red-400">{stats.security}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Autenticação</p>
          <p className="text-2xl font-bold text-blue-400">{stats.auth}</p>
        </div>
        <div className="card p-4 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <p className="text-xs text-slate-400 mb-1">Usuários</p>
          <p className="text-2xl font-bold text-amber-400">{stats.usuariosUnicos}</p>
        </div>
      </div>

      {/* Páginas Mais Acessadas */}
      {stats.paginasMaisAcessadas.length > 0 && (
        <div className="card p-5 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-3">
            <Eye className="w-5 h-5 text-cyan-500" />
            Top 5 Páginas Mais Acessadas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {stats.paginasMaisAcessadas.map(([page, count], i) => (
              <div key={page} className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3">
                <span className="text-lg font-bold text-emerald-400">#{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{page}</p>
                  <p className="text-xs text-slate-400">{count} acessos</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="card p-5 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-white">Filtros Avançados</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Email, nome, IP..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Categoria</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="todos">Todas</option>
              <option value="auth">Autenticação</option>
              <option value="navigation">Navegação</option>
              <option value="data">Dados</option>
              <option value="action">Ação</option>
              <option value="security">Segurança</option>
              <option value="system">Sistema</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Tipo de Ação</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="todos">Todas</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{ACTION_LABELS[action] || action}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Data Inicial</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Data Final</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <button
              onClick={limparFiltros}
              className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Logs */}
      <div className="card overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              Registro de Eventos
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {filteredLogs.length} registro(s) encontrado(s)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-400">Exibir:</label>
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="px-3 py-1 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-300 w-8"></th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-300">Data/Hora</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-300">Usuário</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-300">Categoria</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-300">Ação</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-300">Descrição</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-300">IP</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-slate-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredLogs.map(log => {
                const isExpanded = expandedRow === log.id
                const deviceInfo = getDeviceInfo(log)
                const catConfig = CATEGORY_CONFIG[log.action_category] || CATEGORY_CONFIG.system

                return (
                  <>
                    <tr 
                      key={log.id} 
                      className={`hover:bg-slate-700/30 transition-colors cursor-pointer ${isExpanded ? 'bg-slate-700/40' : ''}`}
                      onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                    >
                      <td className="px-3 py-3 text-center">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(log.created_at).toLocaleString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', second: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-300">
                        <div>
                          <span className="font-medium">{log.user_name || '-'}</span>
                          <br />
                          <span className="text-slate-500">{log.user_email}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${catConfig.bgColor} ${catConfig.color}`}>
                          {getActionIcon(log)}
                          {catConfig.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-300">
                        {ACTION_LABELS[log.action_type] || log.action_type}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400 max-w-xs truncate" title={log.description || ''}>
                        {log.description || '-'}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-400 font-mono">
                        {log.ip_address || '-'}
                      </td>
                      <td className="px-3 py-3">
                        {getStatusBadge(log)}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${log.id}-detail`} className="bg-slate-800/80">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                            {/* Informações do Dispositivo */}
                            <div className="space-y-2">
                              <h4 className="font-semibold text-emerald-400 flex items-center gap-1">
                                <Smartphone className="w-4 h-4" /> Dispositivo
                              </h4>
                              <div className="space-y-1 text-slate-400">
                                <p><span className="text-slate-500">Navegador:</span> {deviceInfo.browser}</p>
                                <p><span className="text-slate-500">Sistema Operacional:</span> {deviceInfo.os}</p>
                                <p><span className="text-slate-500">Tipo:</span> {deviceInfo.device}</p>
                                <p><span className="text-slate-500">Plataforma:</span> {deviceInfo.platform}</p>
                                <p><span className="text-slate-500">Tela:</span> {deviceInfo.screen}</p>
                                <p><span className="text-slate-500">Viewport:</span> {deviceInfo.viewport}</p>
                                <p><span className="text-slate-500">Cor:</span> {deviceInfo.colorDepth}bit | Pixel Ratio: {deviceInfo.pixelRatio}</p>
                              </div>
                            </div>

                            {/* Informações de Rede */}
                            <div className="space-y-2">
                              <h4 className="font-semibold text-cyan-400 flex items-center gap-1">
                                <Globe className="w-4 h-4" /> Rede & Localização
                              </h4>
                              <div className="space-y-1 text-slate-400">
                                <p><span className="text-slate-500">IP:</span> {log.ip_address || '-'}</p>
                                <p><span className="text-slate-500">Idioma:</span> {deviceInfo.language}</p>
                                <p><span className="text-slate-500">Timezone:</span> {deviceInfo.timezone}</p>
                                <p><span className="text-slate-500">Cookies:</span> {deviceInfo.cookiesEnabled ? 'Habilitados' : 'Desabilitados'}</p>
                                <p><span className="text-slate-500">Online:</span> {deviceInfo.onLine ? 'Sim' : 'Não'}</p>
                                <p><span className="text-slate-500">Conexão:</span> {log.metadata?.connection_type || '-'}</p>
                                <p><span className="text-slate-500">Memória:</span> {log.metadata?.memory || '-'}</p>
                              </div>
                            </div>

                            {/* Informações da Sessão */}
                            <div className="space-y-2">
                              <h4 className="font-semibold text-purple-400 flex items-center gap-1">
                                <MapPin className="w-4 h-4" /> Sessão & Contexto
                              </h4>
                              <div className="space-y-1 text-slate-400">
                                <p><span className="text-slate-500">Session ID:</span> <span className="font-mono text-[10px]">{log.session_id || '-'}</span></p>
                                <p><span className="text-slate-500">Página:</span> {log.request_path || '-'}</p>
                                <p><span className="text-slate-500">URL Completa:</span> <span className="break-all">{log.metadata?.full_url || '-'}</span></p>
                                <p><span className="text-slate-500">Referrer:</span> {log.metadata?.referrer || 'Acesso direto'}</p>
                                <p><span className="text-slate-500">Título:</span> {log.metadata?.page_title || '-'}</p>
                                <p><span className="text-slate-500">Hora Local:</span> {log.metadata?.timestamp_local || '-'}</p>
                                <p><span className="text-slate-500">Role:</span> {log.user_role || '-'}</p>
                              </div>
                            </div>
                          </div>

                          {/* User Agent Completo */}
                          <div className="mt-3 pt-3 border-t border-slate-700">
                            <p className="text-[10px] text-slate-500 font-mono break-all">
                              <span className="text-slate-400">User-Agent:</span> {log.user_agent || '-'}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">Nenhum registro encontrado</p>
            <p className="text-xs text-slate-500 mt-1">Ajuste os filtros ou aguarde novos eventos</p>
          </div>
        )}
      </div>
    </div>
  )
}
