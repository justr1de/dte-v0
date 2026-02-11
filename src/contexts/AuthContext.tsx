import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, User, UserRole } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'

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
      return { error: new Error(LOCKDOWN_MESSAGE) }
    }
    
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error }
    } catch (error) {
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
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
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
