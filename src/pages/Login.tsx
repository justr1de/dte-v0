import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Eye, EyeOff, Sun, Moon, LogIn, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

export default function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { signIn, signUp } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) {
          toast.error('Erro ao fazer login: ' + error.message)
        } else {
          toast.success('Login realizado com sucesso!')
          navigate('/dashboard')
        }
      } else {
        const { error } = await signUp(email, password, name, 'candidato')
        if (error) {
          toast.error('Erro ao criar conta: ' + error.message)
        } else {
          toast.success('Conta criada com sucesso! Verifique seu email.')
          setIsLogin(true)
        }
      }
    } catch (error) {
      toast.error('Erro inesperado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Demo login
  const handleDemoLogin = () => {
    toast.success('Entrando em modo demonstração...')
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 xl:px-24">
        <div className="max-w-md w-full mx-auto">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="absolute top-6 right-6 p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-4 mb-8">
            <img src="/logo-dte.png" alt="DTE" className="w-16 h-16 rounded-xl" />
            <div>
              <h1 className="text-2xl font-bold gradient-text">DATA TRACKING</h1>
              <h1 className="text-2xl font-bold gradient-text">ELEITORAL</h1>
            </div>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">
              {isLogin ? 'Bem-vindo de volta!' : 'Criar conta'}
            </h2>
            <p className="text-[var(--text-secondary)]">
              {isLogin 
                ? 'Entre com suas credenciais para acessar o sistema' 
                : 'Preencha os dados para criar sua conta'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-2">Nome completo</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  placeholder="Seu nome"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  {isLogin ? 'Entrar' : 'Criar conta'}
                </>
              )}
            </button>
          </form>

          {/* Demo Button */}
          <button
            onClick={handleDemoLogin}
            className="btn-secondary w-full mt-4"
          >
            Acessar Demonstração
          </button>

          {/* Toggle Login/Register */}
          <p className="text-center mt-6 text-[var(--text-secondary)]">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-[var(--accent-color)] hover:underline font-medium"
            >
              {isLogin ? 'Criar conta' : 'Fazer login'}
            </button>
          </p>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <h2 className="text-4xl font-bold mb-4">
            Sistema de Inteligência Eleitoral
          </h2>
          <p className="text-xl text-white/80 mb-8 max-w-lg">
            Plataforma completa para rastreamento e análise de dados eleitorais, 
            com foco em votos nulos, perfil demográfico e visualizações geográficas.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-md">
            {[
              { value: '1.2M+', label: 'Eleitores' },
              { value: '52', label: 'Municípios' },
              { value: '56', label: 'Zonas' },
              { value: '8+', label: 'Anos de dados' },
            ].map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
