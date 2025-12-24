import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface AuditLogParams {
  actionType: string
  actionCategory: 'auth' | 'navigation' | 'data' | 'action' | 'system'
  resourceType?: string
  resourceId?: string
  description?: string
  metadata?: Record<string, any>
}

export function useAudit() {
  const { user } = useAuth()

  const logAction = useCallback(async ({
    actionType,
    actionCategory,
    resourceType,
    resourceId,
    description,
    metadata = {}
  }: AuditLogParams) => {
    try {
      // Obter informações do navegador
      const userAgent = navigator.userAgent
      const requestPath = window.location.pathname

      await supabase.from('audit_logs').insert({
        user_id: user?.id || null,
        user_email: user?.email || 'anonymous',
        user_name: user?.name || user?.display_name || 'Anônimo',
        user_role: user?.role || 'guest',
        action_type: actionType,
        action_category: actionCategory,
        resource_type: resourceType,
        resource_id: resourceId,
        description: description,
        metadata: metadata,
        user_agent: userAgent,
        request_path: requestPath,
        ip_address: 'client-side' // IP será capturado pelo backend se necessário
      })
    } catch (error) {
      console.error('Erro ao registrar auditoria:', error)
    }
  }, [user])

  // Funções de conveniência para tipos comuns de ações
  const logNavigation = useCallback((pageName: string, path: string) => {
    logAction({
      actionType: 'page_view',
      actionCategory: 'navigation',
      resourceType: 'page',
      resourceId: path,
      description: `Acessou a página: ${pageName}`
    })
  }, [logAction])

  const logDataAccess = useCallback((dataType: string, filters?: Record<string, any>) => {
    logAction({
      actionType: 'data_access',
      actionCategory: 'data',
      resourceType: dataType,
      description: `Consultou dados de: ${dataType}`,
      metadata: { filters }
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

  const logAuth = useCallback((action: 'login' | 'logout' | 'login_failed' | 'session_refresh') => {
    logAction({
      actionType: action,
      actionCategory: 'auth',
      description: action === 'login' ? 'Usuário realizou login' :
                   action === 'logout' ? 'Usuário realizou logout' :
                   action === 'login_failed' ? 'Tentativa de login falhou' :
                   'Sessão atualizada'
    })
  }, [logAction])

  return {
    logAction,
    logNavigation,
    logDataAccess,
    logDataExport,
    logUserAction,
    logAuth
  }
}
