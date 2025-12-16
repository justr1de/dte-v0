import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import {
  ArrowRight,
  BarChart3,
  Users,
  Map,
  FileText,
  Shield,
  Vote,
  Sun,
  Moon,
  Target,
  Palette,
  Check
} from 'lucide-react'

// Temas disponíveis
const themes = [
  { id: 'emerald', name: 'Esmeralda', primary: '#10b981', secondary: '#14b8a6', gradient: 'from-emerald-500 to-teal-500' },
  { id: 'blue', name: 'Azul', primary: '#3b82f6', secondary: '#6366f1', gradient: 'from-blue-500 to-indigo-500' },
  { id: 'purple', name: 'Roxo', primary: '#8b5cf6', secondary: '#a855f7', gradient: 'from-violet-500 to-purple-500' },
  { id: 'orange', name: 'Laranja', primary: '#f97316', secondary: '#ef4444', gradient: 'from-orange-500 to-red-500' },
  { id: 'pink', name: 'Rosa', primary: '#ec4899', secondary: '#f43f5e', gradient: 'from-pink-500 to-rose-500' },
]

export default function Home() {
  const { theme, toggleTheme } = useTheme()
  const [selectedTheme, setSelectedTheme] = useState(themes[0])
  const [showThemeSelector, setShowThemeSelector] = useState(false)

  const features = [
    {
      icon: Users,
      title: 'Perfil do Eleitorado',
      description: 'Análise demográfica completa por faixa etária, gênero, escolaridade e renda',
    },
    {
      icon: BarChart3,
      title: 'Resultados Eleitorais',
      description: 'Visualização de resultados por partido e candidato com comparação entre eleições',
    },
    {
      icon: Vote,
      title: 'Votos Nulos e Brancos',
      description: 'Rastreamento detalhado de votos nulos, brancos e abstenções por região',
    },
    {
      icon: Map,
      title: 'Mapas de Calor',
      description: 'Visualização geográfica interativa da distribuição eleitoral',
    },
    {
      icon: FileText,
      title: 'Relatórios PDF',
      description: 'Geração de relatórios customizáveis com análises eleitorais detalhadas',
    },
    {
      icon: Shield,
      title: 'Controle de Acesso',
      description: 'Sistema com 3 níveis: Administrador, Gestor de Campanha e Candidato',
    }
  ]

  const stats = [
    { value: '245K+', label: 'Eleitores Analisados' },
    { value: '45', label: 'Zonas Eleitorais' },
    { value: '52', label: 'Bairros Mapeados' },
    { value: '8+', label: 'Anos de Dados' }
  ]

  const accessLevels = [
    {
      title: 'Administrador',
      description: 'Acesso total ao sistema, gerenciamento de usuários e importação de dados',
      features: ['Gerenciar usuários', 'Importar dados', 'Configurar sistema'],
    },
    {
      title: 'Gestor de Campanha',
      description: 'Importação de dados, visualização de relatórios e gestão de campanhas',
      features: ['Importar datasets', 'Gerar relatórios', 'Analisar dados'],
    },
    {
      title: 'Candidato',
      description: 'Visualização de dashboards e relatórios personalizados',
      features: ['Ver dashboards', 'Acessar relatórios', 'Consultar mapas'],
    },
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-x-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-[120px] opacity-30 transition-colors duration-500"
          style={{ backgroundColor: selectedTheme.primary }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-[100px] opacity-20 transition-colors duration-500"
          style={{ backgroundColor: selectedTheme.secondary }}
        />
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(${selectedTheme.primary} 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo-dte.png" alt="DTE" className="w-12 h-12 rounded-xl shadow-lg" />
            <h1 className="font-bold text-lg whitespace-nowrap">DATA TRACKING ELEITORAL - DTE</h1>
          </div>

          <nav className="flex items-center gap-3">
            {/* Theme Selector */}
            <div className="relative">
              <button
                onClick={() => setShowThemeSelector(!showThemeSelector)}
                className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-2"
              >
                <Palette className="w-5 h-5" />
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: selectedTheme.primary }}
                />
              </button>
              
              {showThemeSelector && (
                <div className="absolute top-full right-0 mt-2 p-3 rounded-xl bg-slate-800 border border-white/10 shadow-2xl min-w-[200px]">
                  <p className="text-xs text-white/50 mb-2 px-2">Escolher tema</p>
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTheme(t)
                        setShowThemeSelector(false)
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      <div 
                        className="w-5 h-5 rounded-full"
                        style={{ background: `linear-gradient(135deg, ${t.primary}, ${t.secondary})` }}
                      />
                      <span className="flex-1 text-left text-sm">{t.name}</span>
                      {selectedTheme.id === t.id && (
                        <Check className="w-4 h-4" style={{ color: t.primary }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark/Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            <Link 
              to="/login" 
              className="px-4 py-2 text-white/80 hover:text-white transition-colors"
            >
              Demonstração
            </Link>
            <Link 
              to="/login" 
              className="px-5 py-2.5 rounded-lg font-medium transition-all duration-300 hover:scale-105"
              style={{ 
                background: `linear-gradient(135deg, ${selectedTheme.primary}, ${selectedTheme.secondary})`,
                boxShadow: `0 4px 20px ${selectedTheme.primary}40`
              }}
            >
              Acessar Sistema
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium mb-8 border"
            style={{ 
              backgroundColor: `${selectedTheme.primary}15`,
              borderColor: `${selectedTheme.primary}30`,
              color: selectedTheme.primary
            }}
          >
            <Target className="w-4 h-4" />
            Sistema de Inteligência Eleitoral para Campanhas 2026
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            <span className="text-white">Data Tracking</span>
            <br />
            <span 
              className="bg-clip-text text-transparent"
              style={{ 
                backgroundImage: `linear-gradient(135deg, ${selectedTheme.primary}, ${selectedTheme.secondary})`
              }}
            >
              Eleitoral
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed">
            Plataforma completa de <strong className="text-white">rastreamento e análise de dados eleitorais</strong>, 
            com foco especial em votos nulos e brancos, perfil demográfico e visualizações geográficas interativas.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link 
              to="/login" 
              className="px-8 py-4 rounded-lg font-medium text-lg flex items-center justify-center gap-2 transition-all duration-300 hover:scale-105"
              style={{ 
                background: `linear-gradient(135deg, ${selectedTheme.primary}, ${selectedTheme.secondary})`,
                boxShadow: `0 8px 30px ${selectedTheme.primary}40`
              }}
            >
              Acessar Sistema
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              to="/login" 
              className="px-8 py-4 rounded-lg font-medium text-lg bg-white/5 border border-white/20 hover:bg-white/10 transition-all"
            >
              Ver Demonstração
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-colors"
              >
                <p 
                  className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent"
                  style={{ 
                    backgroundImage: `linear-gradient(135deg, ${selectedTheme.primary}, ${selectedTheme.secondary})`
                  }}
                >
                  {stat.value}
                </p>
                <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Funcionalidades Principais</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Ferramentas poderosas para análise e visualização de dados eleitorais
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300 group hover:bg-white/[0.07]"
              >
                <div 
                  className="p-3 rounded-xl w-fit mb-4 transition-transform group-hover:scale-110"
                  style={{ 
                    background: `linear-gradient(135deg, ${selectedTheme.primary}, ${selectedTheme.secondary})`
                  }}
                >
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 
                  className="font-semibold text-lg mb-2 transition-colors"
                  style={{ color: showThemeSelector ? selectedTheme.primary : 'white' }}
                >
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Access Levels Section */}
      <section className="py-24 px-6 bg-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Níveis de Acesso</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              Sistema de permissões granular para diferentes perfis de usuário
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {accessLevels.map((level, index) => (
              <div 
                key={index} 
                className="bg-white/5 rounded-2xl overflow-hidden border border-white/10"
              >
                <div 
                  className="h-2"
                  style={{ 
                    background: `linear-gradient(90deg, ${selectedTheme.primary}, ${selectedTheme.secondary})`
                  }}
                />
                <div className="p-6">
                  <h3 className="font-semibold text-xl mb-2">{level.title}</h3>
                  <p className="text-sm text-slate-400 mb-4">{level.description}</p>
                  <ul className="space-y-2">
                    {level.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4" style={{ color: selectedTheme.primary }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-slate-400 text-lg mb-8">
            Acesse o sistema e comece a analisar dados eleitorais de forma inteligente
          </p>
          <Link 
            to="/login" 
            className="inline-flex items-center gap-2 px-8 py-4 rounded-lg font-medium text-lg transition-all duration-300 hover:scale-105"
            style={{ 
              background: `linear-gradient(135deg, ${selectedTheme.primary}, ${selectedTheme.secondary})`,
              boxShadow: `0 8px 30px ${selectedTheme.primary}40`
            }}
          >
            Começar Agora
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-3">
            <img src="/logo-dte.png" alt="DATA-RO" className="w-16 h-16 rounded-xl" />
            <div className="text-center">
              <p className="font-semibold text-white">DATA-RO INTELIGÊNCIA TERRITORIAL</p>
              <p className="text-sm text-slate-400">2025</p>
            </div>
          </div>
          
          {/* Contact Info */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-slate-400">
            <a href="mailto:contato@dataro-it.com.br" className="hover:text-white transition-colors">
              contato@dataro-it.com.br
            </a>
            <span className="hidden sm:block">•</span>
            <a 
              href="https://wa.me/5569999089202" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              (69) 9 9908-9202
            </a>
          </div>
          
          <div className="text-center text-sm text-slate-500">
            <p>© Copyright - Todos os Direitos Reservados</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
