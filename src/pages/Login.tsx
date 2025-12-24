import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { 
  Eye, 
  EyeOff, 
  Sun, 
  Moon, 
  LogIn, 
  Lock,
  BarChart3,
  MapPin,
  Users,
  TrendingUp,
  Target,
  Shield,
  Database,
  Zap,
  PieChart,
  Map,
  FileText,
  Brain
} from 'lucide-react'
import { toast } from 'sonner'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { signIn } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        toast.error('Erro ao fazer login: ' + error.message)
      } else {
        toast.success('Login realizado com sucesso!')
        navigate('/dashboard')
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
            <h1 className="text-2xl font-bold gradient-text">DATA TRACKING ELEITORAL - DTE</h1>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Bem-vindo!</h2>
            <p className="text-[var(--text-secondary)]">
              Entre com suas credenciais para acessar o sistema
            </p>
          </div>

          {/* Access Restricted Notice */}
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-500">Acesso Restrito</p>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Este sistema é de uso exclusivo. Apenas usuários autorizados pelos administradores podem acessar.
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  <LogIn className="w-5 h-5" />
                  Entrar
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

          {/* Contact Info */}
          <div className="mt-8 pt-6 border-t border-[var(--border-color)]">
            <p className="text-sm text-center text-[var(--text-secondary)] mb-2">
              Para solicitar acesso, entre em contato:
            </p>
            <p className="text-sm text-center text-[var(--text-secondary)]">
              contato@dataro-it.com.br
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-white rounded-full blur-2xl transform -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white overflow-y-auto py-12">
          <h2 className="text-3xl xl:text-4xl font-bold mb-4">
            SISTEMA DE INTELIGÊNCIA ELEITORAL E GESTÃO DE CAMPANHA
          </h2>
          <p className="text-lg text-white/80 mb-6 max-w-lg">
            Plataforma completa para rastreamento e análise de dados eleitorais, 
            com foco em votos nulos, perfil demográfico e visualizações geográficas.
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 max-w-md mb-8">
            {[
              { value: '1.2M+', label: 'Eleitores', icon: Users },
              { value: '52', label: 'Municípios', icon: MapPin },
              { value: '29', label: 'Zonas Eleitorais', icon: Map },
              { value: '8+', label: 'Anos de dados', icon: Database },
            ].map((stat, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center gap-3">
                <stat.icon className="w-8 h-8 text-white/70" />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-white/70">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Features Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Funcionalidades Principais
            </h3>
            
            <div className="grid grid-cols-1 gap-2">
              {[
                { icon: BarChart3, title: 'Dashboard Analítico', desc: 'Visão geral com métricas em tempo real' },
                { icon: Map, title: 'Mapas de Calor', desc: 'Visualização geográfica de votos e abstenções' },
                { icon: PieChart, title: 'Análise de Resultados', desc: 'Comparativo entre candidatos e partidos' },
                { icon: Target, title: 'Metas Territoriais', desc: 'Definição e acompanhamento de metas por região' },
                { icon: Brain, title: 'Análise Preditiva', desc: 'Projeções baseadas em dados históricos' },
                { icon: FileText, title: 'Relatórios Detalhados', desc: 'Exportação de dados em múltiplos formatos' },
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                  <feature.icon className="w-5 h-5 text-white/70 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{feature.title}</p>
                    <p className="text-xs text-white/60">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-white/70" />
                <div>
                  <p className="text-sm font-medium">Dados Seguros</p>
                  <p className="text-xs text-white/60">Criptografia de ponta</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-white/70" />
                <div>
                  <p className="text-sm font-medium">Atualização Constante</p>
                  <p className="text-xs text-white/60">Dados do TSE</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-xs text-white/50 text-center">
              Desenvolvido por DATA-RO Inteligência Territorial
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
