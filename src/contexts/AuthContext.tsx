import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase, User, UserRole } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'

// Lista de emails que são sempre admin
const ADMIN_EMAILS = [
  'contato@dataro-it.com.br',
  'hugonsilva@gmail.com',
  'ranieri.braga@hotmail.com'
]

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
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      
      // Forçar role admin para emails na lista ADMIN_EMAILS
      if (data && email && ADMIN_EMAILS.includes(email.toLowerCase())) {
        data.role = 'admin'
      }
      
      setUser(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Create default user from auth data
      const authUser = session?.user
      if (authUser) {
        // Verificar se o email está na lista de admins
        const isAdminEmail = authUser.email && ADMIN_EMAILS.includes(authUser.email.toLowerCase())
        
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Usuário',
          role: isAdminEmail ? 'admin' : 'candidato',
          created_at: authUser.created_at
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
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
