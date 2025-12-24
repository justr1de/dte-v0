import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Shield, 
  Search, 
  Calendar,
  CheckCircle,
  XCircle,
  Users,
  Activity,
  Download,
  RefreshCw,
  Filter,
  X
} from 'lucide-react'
import { toast } from 'sonner'

interface LoginAttempt {
  id: number
  user_id: string
  user_email: string
  user_name: string
  resultado: 'sucesso' | 'falha'
  ip_address: string
  user_agent: string
  motivo_falha: string | null
  created_at: string
}

const SUPERADMIN_EMAIL = 'contato@dataro-it.com.br'

export default function LogsAuditoria() {
  const [logs, setLogs] = useState<LoginAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  // Filtros
  const [searchUser, setSearchUser] = useState('')
  const [resultadoFilter, setResultadoFilter] = useState<'todos' | 'sucesso' | 'falha'>('todos')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')

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
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500)

      if (dataInicial) {
        query = query.gte('created_at', new Date(dataInicial).toISOString())
      }
      if (dataFinal) {
        const endDate = new Date(dataFinal)
        endDate.setHours(23, 59, 59, 999)
        query = query.lte('created_at', endDate.toISOString())
      }
      if (resultadoFilter !== 'todos') {
        query = query.eq('resultado', resultadoFilter)
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
  }, [isAuthorized, dataInicial, dataFinal, resultadoFilter])

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
      log.user_name?.toLowerCase().includes(search)
    )
  })

  // Estatísticas
  const stats = {
    total: logs.length,
    sucesso: logs.filter(l => l.resultado === 'sucesso').length,
    falha: logs.filter(l => l.resultado === 'falha').length,
    usuariosUnicos: new Set(logs.map(l => l.user_email)).size
  }

  // Limpar filtros
  const limparFiltros = () => {
    setSearchUser('')
    setResultadoFilter('todos')
    setDataInicial('')
    setDataFinal('')
  }

  // Exportar CSV
  const exportarCSV = () => {
    const csv = [
      ['Data/Hora', 'Usuário', 'Email', 'Resultado', 'IP', 'Navegador', 'Motivo da Falha'],
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.user_name || '-',
        log.user_email || '-',
        log.resultado === 'sucesso' ? 'Sucesso' : 'Falha',
        log.ip_address || '-',
        log.user_agent || '-',
        log.motivo_falha || '-'
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `logs_auditoria_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    toast.success('Relatório exportado com sucesso!')
  }

  // Formatar User Agent para exibição resumida
  const formatUserAgent = (ua: string) => {
    if (!ua) return '-'
    // Extrair navegador e sistema operacional
    const match = ua.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)[\s/]?(\d+)?/)
    const osMatch = ua.match(/(Windows|Mac OS X|Linux|Android|iOS|iPhone)[\s]?([0-9._]+)?/)
    
    let browser = match ? `${match[1]}${match[2] ? '/' + match[2] : ''}` : 'Desconhecido'
    let os = osMatch ? osMatch[1] : ''
    
    if (ua.includes('Mobile')) os += ' Mobile'
    
    return `${browser} (${os || 'N/A'})`
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
            Logs de Auditoria
          </h1>
          <p className="text-[var(--text-muted)]">
            Histórico de tentativas de login no sistema
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
            Exportar
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-5 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Total de Tentativas</p>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Logins Bem-Sucedidos</p>
          <p className="text-3xl font-bold text-emerald-400">{stats.sucesso}</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Logins Falhados</p>
          <p className="text-3xl font-bold text-red-400">{stats.falha}</p>
        </div>
        <div className="card p-5 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
          <p className="text-sm text-slate-400 mb-1">Usuários Únicos</p>
          <p className="text-3xl font-bold text-cyan-400">{stats.usuariosUnicos}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-5 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-white">Filtros</h3>
        </div>
        <p className="text-sm text-slate-400 mb-4">Filtrar logs por usuário, resultado ou período</p>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          {/* Buscar Usuário */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Usuário</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar usuário..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Resultado */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Resultado</label>
            <select
              value={resultadoFilter}
              onChange={(e) => setResultadoFilter(e.target.value as any)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="todos">Todos</option>
              <option value="sucesso">Sucesso</option>
              <option value="falha">Falha</option>
            </select>
          </div>

          {/* Data Inicial */}
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

          {/* Data Final */}
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

          {/* Limpar Filtros */}
          <div>
            <button
              onClick={limparFiltros}
              className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-slate-300 transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Histórico */}
      <div className="card overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <div className="p-5 border-b border-slate-700">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Histórico de Tentativas
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {filteredLogs.length} registro(s) encontrado(s)
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Data/Hora</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Usuário</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Resultado</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">IP</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Navegador</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">Motivo da Falha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-300 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">
                    {log.user_name || log.user_email || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      log.resultado === 'sucesso' 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {log.resultado === 'sucesso' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {log.resultado === 'sucesso' ? 'Sucesso' : 'Falha'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 font-mono">
                    {log.ip_address || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400 max-w-xs truncate" title={log.user_agent}>
                    {formatUserAgent(log.user_agent)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">
                    {log.motivo_falha || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <Activity className="w-12 h-12 mx-auto mb-3 text-slate-600" />
            <p className="text-slate-400">Nenhum registro encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}
