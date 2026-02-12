import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, User, UserRole } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import { logAuditDirect } from '@/hooks/useAudit'
import { clear2FASession } from '@/services/twoFactorService'

// Lista de emails que são sempre admin
const ADMIN_EMAILS = [
  'contato@dataro-it.com.br'
]

// ========================================
// CONTROLE DE ACESSO - MODO RESTRITO
// Apenas emails na lista ALLOWED_EMAILS
// podem acessar o sistema
// ========================================
const SYSTEM_LOCKED = false
const ALLOWED_EMAILS = [
  'contato@dataro-it.com.br'
]
const LOCKDOWN_MESSAGE = 'Acesso restrito. Apenas administradores autorizados podem acessar o sistema no momento.'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, name: string, role: UserRole) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  isAdmin: boolean
  isGestor: boolean
  isCandidato: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session?.user) {
        if (_event === 'TOKEN_REFRESHED') {
          // Registrar renovação de sessão
          logAuditDirect({
            userEmail: session.user.email || '',
            actionType: 'session_refresh',
            actionCategory: 'auth',
            description: 'Sessão renovada automaticamente'
          })
        }
        fetchUserProfile(session.user.id, session.user.email)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserProfile = async (userId: string, email?: string | null) => {
    // CONTROLE DE ACESSO: Apenas emails permitidos
    if (email && !ALLOWED_EMAILS.includes(email.toLowerCase())) {
      // Registrar tentativa de acesso bloqueada
      logAuditDirect({
        userEmail: email,
        actionType: 'forced_logout',
        actionCategory: 'security',
        description: `Sessão encerrada forçadamente - email ${email} não está na lista de permitidos`,
        metadata: { reason: 'not_in_allowed_list', email }
      })

      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
      setLoading(false)
      throw new Error(LOCKDOWN_MESSAGE)
    }
    
    // Verificar se o email está na lista de admins
    const isAdminEmail = email && ADMIN_EMAILS.includes(email.toLowerCase())
    
    try {
      // Primeiro tenta buscar por ID
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      // Se não encontrou por ID, tenta buscar por email
      if (error && email) {
        const emailResult = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()
        
        data = emailResult.data
        error = emailResult.error
      }

      if (error) throw error
      
      // Forçar role admin para emails na lista ADMIN_EMAILS
      if (data) {
        if (isAdminEmail) {
          data.role = 'admin'
        }
        setUser(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Create default user from auth data - FORÇAR ADMIN SE EMAIL ESTIVER NA LISTA
      setUser({
        id: userId,
        email: email || '',
        name: email?.split('@')[0] || 'Usuário',
        role: isAdminEmail ? 'admin' : 'candidato',
        created_at: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    // CONTROLE DE ACESSO: Apenas emails permitidos podem fazer login
    if (!ALLOWED_EMAILS.includes(email.toLowerCase())) {
      // Registrar tentativa de login bloqueada
      logAuditDirect({
        userEmail: email,
        actionType: 'login_blocked',
        actionCategory: 'security',
        description: `Tentativa de login bloqueada - email ${email} não autorizado`,
        metadata: { 
          reason: 'not_in_allowed_list', 
          email,
          attempted_at: new Date().toISOString()
        }
      })
      return { error: new Error(LOCKDOWN_MESSAGE) }
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      
      if (error) {
        // Registrar falha de login
        logAuditDirect({
          userEmail: email,
          actionType: 'login_failed',
          actionCategory: 'auth',
          description: `Falha no login para ${email}: ${error.message}`,
          metadata: { 
            error_message: error.message,
            email,
            attempted_at: new Date().toISOString()
          }
        })
        return { error }
      }

      // Registrar login bem-sucedido
      logAuditDirect({
        userEmail: email,
        actionType: 'login',
        actionCategory: 'auth',
        description: `Login realizado com sucesso por ${email}`,
        metadata: { 
          email,
          login_method: 'email_password',
          success: true,
          login_at: new Date().toISOString()
        }
      })

      return { error: null }
    } catch (error) {
      // Registrar erro inesperado
      logAuditDirect({
        userEmail: email,
        actionType: 'login_error',
        actionCategory: 'system',
        description: `Erro inesperado no login para ${email}`,
        metadata: { 
          error: (error as Error).message,
          email
        }
      })
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, name: string, role: UserRole) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, role }
        }
      })

      if (error) throw error

      // Create user profile in database
      if (data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          email,
          name,
          role,
          created_at: new Date().toISOString()
        })

        // Registrar criação de conta
        logAuditDirect({
          userEmail: email,
          userName: name,
          userRole: role,
          actionType: 'account_created',
          actionCategory: 'auth',
          description: `Nova conta criada: ${name} (${email}) com role ${role}`,
          metadata: { email, name, role }
        })
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    // Registrar logout antes de desconectar
    if (user) {
      logAuditDirect({
        userEmail: user.email,
        userName: user.name,
        userRole: user.role,
        actionType: 'logout',
        actionCategory: 'auth',
        description: `Logout voluntário de ${user.name} (${user.email})`,
        metadata: {
          email: user.email,
          session_duration: session?.expires_at 
            ? `Sessão expira em: ${new Date((session.expires_at || 0) * 1000).toLocaleString('pt-BR')}`
            : 'N/A'
        }
      })
    }

    clear2FASession()
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    window.location.href = '/login'
  }

  // Verificar se é admin pelo email OU pelo role
  const isAdminByEmail = Boolean(user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase()))

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin: user?.role === 'admin' || isAdminByEmail,
    isGestor: user?.role === 'gestor_campanha',
    isCandidato: user?.role === 'candidato' && !isAdminByEmail
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
