import { useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface AuditLogParams {
  actionType: string
  actionCategory: 'auth' | 'navigation' | 'data' | 'action' | 'system' | 'security'
  resourceType?: string
  resourceId?: string
  description?: string
  metadata?: Record<string, any>
  responseStatus?: number
  durationMs?: number
}

// Detectar informações do dispositivo
function getDeviceInfo() {
  const ua = navigator.userAgent
  let device = 'Desktop'
  let os = 'Desconhecido'
  let browser = 'Desconhecido'

  // Detectar dispositivo
  if (/Mobi|Android/i.test(ua)) device = 'Mobile'
  else if (/Tablet|iPad/i.test(ua)) device = 'Tablet'

  // Detectar SO
  if (/Windows NT 10/i.test(ua)) os = 'Windows 10/11'
  else if (/Windows NT/i.test(ua)) os = 'Windows'
  else if (/Mac OS X/i.test(ua)) os = 'macOS'
  else if (/Android/i.test(ua)) os = 'Android'
  else if (/iPhone|iPad/i.test(ua)) os = 'iOS'
  else if (/Linux/i.test(ua)) os = 'Linux'

  // Detectar navegador
  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge'
  else if (/Chrome/i.test(ua) && !/Chromium/i.test(ua)) browser = 'Google Chrome'
  else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox'
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari'
  else if (/Opera|OPR/i.test(ua)) browser = 'Opera'

  // Resolução da tela
  const screenResolution = `${window.screen.width}x${window.screen.height}`
  const viewportSize = `${window.innerWidth}x${window.innerHeight}`

  // Idioma
  const language = navigator.language || 'pt-BR'

  // Timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  // Plataforma
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || 'Desconhecido'

  return {
    device,
    os,
    browser,
    screenResolution,
    viewportSize,
    language,
    timezone,
    platform,
    cookiesEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    colorDepth: window.screen.colorDepth,
    pixelRatio: window.devicePixelRatio
  }
}

// Cache de IP para não fazer múltiplas requisições
let cachedIp: string | null = null
let ipFetchPromise: Promise<string> | null = null

async function getPublicIP(): Promise<string> {
  if (cachedIp) return cachedIp
  if (ipFetchPromise) return ipFetchPromise

  ipFetchPromise = fetch('https://api.ipify.org?format=json')
    .then(res => res.json())
    .then(data => {
      cachedIp = data.ip
      return data.ip
    })
    .catch(() => {
      cachedIp = 'não-detectado'
      return 'não-detectado'
    })

  return ipFetchPromise
}

// Gerar ID de sessão único para a sessão do navegador
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('dte_session_id')
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    sessionStorage.setItem('dte_session_id', sessionId)
  }
  return sessionId
}

export function useAudit() {
  const { user } = useAuth()
  const lastNavRef = useRef<string>('')

  const logAction = useCallback(async ({
    actionType,
    actionCategory,
    resourceType,
    resourceId,
    description,
    metadata = {},
    responseStatus,
    durationMs
  }: AuditLogParams) => {
    try {
      const deviceInfo = getDeviceInfo()
      const ip = await getPublicIP()
      const sessionId = getSessionId()
      const userAgent = navigator.userAgent
      const requestPath = window.location.pathname
      const fullUrl = window.location.href
      const referrer = document.referrer || null

      // Montar metadata enriquecido
      const enrichedMetadata = {
        ...metadata,
        device_info: deviceInfo,
        full_url: fullUrl,
        referrer: referrer,
        timestamp_local: new Date().toLocaleString('pt-BR', { timeZone: deviceInfo.timezone }),
        page_title: document.title,
        connection_type: (navigator as any).connection?.effectiveType || 'desconhecido',
        memory: (navigator as any).deviceMemory ? `${(navigator as any).deviceMemory}GB` : 'N/A'
      }

      await supabase.from('audit_logs').insert({
        user_id: user?.id || null,
        user_email: user?.email || 'anonymous',
        user_name: user?.name || user?.display_name || 'Anônimo',
        user_role: user?.role || 'guest',
        action_type: actionType,
        action_category: actionCategory,
        resource_type: resourceType || null,
        resource_id: resourceId || null,
        description: description || null,
        metadata: enrichedMetadata,
        user_agent: userAgent,
        request_path: requestPath,
        ip_address: ip,
        session_id: sessionId,
        request_method: actionCategory === 'navigation' ? 'GET' : 'POST',
        response_status: responseStatus || null,
        duration_ms: durationMs || null
      })
    } catch (error) {
      console.error('Erro ao registrar auditoria:', error)
    }
  }, [user])

  // ===== Funções de conveniência =====

  const logNavigation = useCallback((pageName: string, path: string) => {
    // Evitar duplicatas de navegação para a mesma página
    if (lastNavRef.current === path) return
    lastNavRef.current = path

    logAction({
      actionType: 'page_view',
      actionCategory: 'navigation',
      resourceType: 'page',
      resourceId: path,
      description: `Acessou a página: ${pageName}`,
      responseStatus: 200
    })
  }, [logAction])

  const logDataAccess = useCallback((dataType: string, filters?: Record<string, any>, recordCount?: number) => {
    logAction({
      actionType: 'data_access',
      actionCategory: 'data',
      resourceType: dataType,
      description: `Consultou dados de: ${dataType}${recordCount ? ` (${recordCount} registros)` : ''}`,
      metadata: { filters, recordCount }
    })
  }, [logAction])

  const logDataExport = useCallback((dataType: string, format: string, recordCount?: number) => {
    logAction({
      actionType: 'data_export',
      actionCategory: 'data',
      resourceType: dataType,
      description: `Exportou ${recordCount || 'N/A'} registros de ${dataType} em formato ${format}`,
      metadata: { format, recordCount }
    })
  }, [logAction])

  const logUserAction = useCallback((action: string, details?: string, metadata?: Record<string, any>) => {
    logAction({
      actionType: action,
      actionCategory: 'action',
      description: details,
      metadata
    })
  }, [logAction])

  const logAuth = useCallback((
    action: 'login' | 'logout' | 'login_failed' | 'login_blocked' | 'session_refresh' | 'session_expired' | 'forced_logout',
    extra?: Record<string, any>
  ) => {
    const descriptions: Record<string, string> = {
      login: 'Usuário realizou login com sucesso',
      logout: 'Usuário realizou logout voluntário',
      login_failed: 'Tentativa de login falhou - credenciais inválidas',
      login_blocked: 'Tentativa de login bloqueada - usuário não autorizado',
      session_refresh: 'Sessão do usuário foi renovada automaticamente',
      session_expired: 'Sessão do usuário expirou',
      forced_logout: 'Usuário foi desconectado forçadamente pelo sistema'
    }

    logAction({
      actionType: action,
      actionCategory: action === 'login_blocked' ? 'security' : 'auth',
      description: descriptions[action] || action,
      metadata: extra || {},
      responseStatus: action === 'login' ? 200 : action === 'login_failed' ? 401 : action === 'login_blocked' ? 403 : undefined
    })
  }, [logAction])

  const logSecurity = useCallback((event: string, details: string, metadata?: Record<string, any>) => {
    logAction({
      actionType: event,
      actionCategory: 'security',
      description: details,
      metadata,
      responseStatus: 403
    })
  }, [logAction])

  const logSearch = useCallback((searchTerm: string, resultCount: number, searchContext: string) => {
    logAction({
      actionType: 'search',
      actionCategory: 'data',
      resourceType: searchContext,
      description: `Pesquisou "${searchTerm}" em ${searchContext} - ${resultCount} resultados`,
      metadata: { searchTerm, resultCount, searchContext }
    })
  }, [logAction])

  const logFilter = useCallback((filterType: string, filterValues: Record<string, any>, context: string) => {
    logAction({
      actionType: 'filter_applied',
      actionCategory: 'data',
      resourceType: context,
      description: `Aplicou filtro em ${context}`,
      metadata: { filterType, filterValues, context }
    })
  }, [logAction])

  const logError = useCallback((errorMessage: string, errorStack?: string, context?: string) => {
    logAction({
      actionType: 'error',
      actionCategory: 'system',
      description: `Erro: ${errorMessage}`,
      metadata: { errorMessage, errorStack, context },
      responseStatus: 500
    })
  }, [logAction])

  return {
    logAction,
    logNavigation,
    logDataAccess,
    logDataExport,
    logUserAction,
    logAuth,
    logSecurity,
    logSearch,
    logFilter,
    logError
  }
}

// Exportar funções utilitárias para uso fora de componentes React
export async function logAuditDirect(params: {
  userEmail?: string
  userName?: string
  userRole?: string
  actionType: string
  actionCategory: string
  description?: string
  metadata?: Record<string, any>
}) {
  try {
    const deviceInfo = getDeviceInfo()
    const ip = await getPublicIP()
    const sessionId = getSessionId()

    await supabase.from('audit_logs').insert({
      user_email: params.userEmail || 'anonymous',
      user_name: params.userName || 'Anônimo',
      user_role: params.userRole || 'guest',
      action_type: params.actionType,
      action_category: params.actionCategory,
      description: params.description || null,
      metadata: {
        ...params.metadata,
        device_info: deviceInfo,
        full_url: window.location.href,
        timestamp_local: new Date().toLocaleString('pt-BR')
      },
      user_agent: navigator.userAgent,
      request_path: window.location.pathname,
      ip_address: ip,
      session_id: sessionId
    })
  } catch (error) {
    console.error('Erro ao registrar auditoria direta:', error)
  }
}
