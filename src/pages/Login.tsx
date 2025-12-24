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
  Brain,
  Mail,
  Phone
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
            <p className="text-sm text-center text-[var(--text-secondary)] mb-3">
              Para solicitar acesso, entre em contato:
            </p>
            <div className="flex flex-col items-center gap-2">
              <a 
                href="mailto:contato@dataro-it.com.br" 
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-emerald-500 transition-colors"
              >
                <Mail className="w-4 h-4" />
                contato@dataro-it.com.br
              </a>
              <a 
                href="https://wa.me/5569999089202" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-green-500 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                (69) 9 9908-9202
              </a>
            </div>
            <p className="text-xs text-center text-[var(--text-muted)] mt-4 flex items-center justify-center gap-1">
              <span>©</span> {new Date().getFullYear()} DATA-RO. Todos os direitos reservados.
            </p>
            <div className="mt-4 flex justify-center">
              <a 
                href="https://dataro-it.com.br" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white rounded-xl p-3 shadow-md hover:shadow-lg transition-shadow"
              >
                <img 
                  src="/logo-dataro.jpeg" 
                  alt="DATA-RO Inteligência Territorial" 
                  className="h-20 w-auto object-contain"
                />
              </a>
            </div>
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
