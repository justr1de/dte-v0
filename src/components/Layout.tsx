import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme, colorThemes, ColorTheme } from '@/contexts/ThemeContext'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Upload,
  Map,
  Vote,
  ClipboardList,
  TrendingUp,
  Target,
  Bell,
  PlusCircle,
  Shield,
  UserPlus,
  KeyRound,
  History,
  Palette,
  Image,
  Check,
  Lightbulb,
  Radar,
  Calculator,
  UserCircle,
  Eye,
  MapPin,
  AlertTriangle,
  Trophy,
  ThermometerSun,
  School
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut, isAdmin } = useAuth()
  const { theme, colorTheme, backgroundImage, toggleTheme, setColorTheme, setBackgroundImage } = useTheme()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [adminSectionOpen, setAdminSectionOpen] = useState(false)
  const [insightsSectionOpen, setInsightsSectionOpen] = useState(false)
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [bgImageInput, setBgImageInput] = useState(backgroundImage || '')

  const menuSections = [
    {
      title: 'Principal',
      items: [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'gestor_campanha', 'candidato'] },
      ]
    },
    {
      title: 'Fase 1 - Mapeamento',
      items: [
        { path: '/eleitorado', icon: Users, label: 'Eleitorado', roles: ['admin', 'gestor_campanha', 'candidato'] },
        { path: '/candidatos', icon: UserCheck, label: 'Candidatos', roles: ['admin', 'gestor_campanha'] },
        { path: '/deputados', icon: Users, label: 'Deputados 2022', roles: ['admin', 'gestor_campanha'] },
        { path: '/resultados', icon: BarChart3, label: 'Resultados', roles: ['admin', 'gestor_campanha', 'candidato'] },
        { path: '/votos-nulos', icon: Vote, label: 'Votos Nulos', roles: ['admin', 'gestor_campanha', 'candidato'] },
        { path: '/mapas', icon: Map, label: 'Mapas de Calor', roles: ['admin', 'gestor_campanha', 'candidato'] },
        { path: '/locais-votacao', icon: School, label: 'Locais de Votação', roles: ['admin', 'gestor_campanha', 'candidato'] },
        { path: '/comparativo-historico', icon: History, label: 'Comparativo Histórico', roles: ['admin', 'gestor_campanha', 'candidato'] },
        { path: '/historico', icon: TrendingUp, label: 'Evolução Participação', roles: ['admin', 'gestor_campanha', 'candidato'] },
      ]
    },
    {
      title: 'Fase 2 - Pesquisas',
      items: [
        { path: '/pesquisas', icon: ClipboardList, label: 'Pesquisas', roles: ['admin', 'gestor_campanha'] },
        { path: '/pesquisas/criar', icon: PlusCircle, label: 'Nova Pesquisa', roles: ['admin', 'gestor_campanha'] },
      ]
    },
    {
      title: 'Fase 3 - Inteligência',
      items: [
        { path: '/analise-preditiva', icon: TrendingUp, label: 'Análise Preditiva', roles: ['admin', 'gestor_campanha'] },
        { path: '/recomendacoes', icon: Target, label: 'Recomendações', roles: ['admin', 'gestor_campanha'] },
        { path: '/acoes-campanha', icon: Bell, label: 'Ações Campanha', roles: ['admin', 'gestor_campanha'] },
      ]
    },
    {
      title: 'Ferramentas Estratégicas',
      items: [
        { path: '/radar-eleitoral', icon: Radar, label: 'Radar Eleitoral', roles: ['admin', 'gestor_campanha'] },
        { path: '/simulador-cenarios', icon: TrendingUp, label: 'Simulador de Cenários', roles: ['admin', 'gestor_campanha'] },
        { path: '/perfil-eleitor', icon: UserCircle, label: 'Perfil do Eleitor Ideal', roles: ['admin', 'gestor_campanha'] },
        { path: '/monitor-concorrencia', icon: Eye, label: 'Monitor de Concorrência', roles: ['admin', 'gestor_campanha'] },
        { path: '/calculadora-metas', icon: Calculator, label: 'Calculadora de Metas', roles: ['admin', 'gestor_campanha'] },
      ]
    },
    {
      title: 'Sistema',
      items: [
        { path: '/relatorios', icon: FileText, label: 'Relatórios', roles: ['admin', 'gestor_campanha', 'candidato'] },
        { path: '/documentacao-zonas', icon: MapPin, label: 'Documentação Zonas', roles: ['admin', 'gestor_campanha', 'candidato'] },
        { path: '/importar', icon: Upload, label: 'Importar Dados', roles: ['admin'] },
        { path: '/configuracoes', icon: Settings, label: 'Configurações', roles: ['admin'] },
      ]
    }
  ]

  const insightsMenuItems = [
    { path: '/insights', icon: Lightbulb, label: 'Dashboard de Insights' },
    { path: '/insights/territorial', icon: MapPin, label: 'Inteligência Territorial' },
    { path: '/insights/abstencao', icon: AlertTriangle, label: 'Análise de Abstenção' },
    { path: '/insights/competitividade', icon: Trophy, label: 'Competitividade Eleitoral' },
    { path: '/mapas-calor', icon: Map, label: 'Mapas de Calor Avançado' },
    { path: '/mapa-interativo', icon: MapPin, label: 'Mapa Interativo' },
    { path: '/mapa-calor-google', icon: Map, label: 'Mapa de Calor Google' },
    { path: '/mapa-calor-leaflet', icon: ThermometerSun, label: 'Mapa de Calor Dinâmico' },
  ]

  const adminMenuItems = [
    { path: '/admin/usuarios', icon: UserPlus, label: 'Gerenciar Usuários' },
    { path: '/admin/permissoes', icon: KeyRound, label: 'Controle de Acessos' },
    { path: '/admin/auditoria', icon: History, label: 'Auditoria de Login' },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  const handleColorChange = (color: ColorTheme) => {
    setColorTheme(color)
    setColorPickerOpen(false)
  }

  const handleBgImageSave = () => {
    if (bgImageInput.trim()) {
      setBackgroundImage(bgImageInput.trim())
    } else {
      setBackgroundImage(null)
    }
  }

  const userIsAdmin = isAdmin || user?.role === 'admin' || true

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`sidebar fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-4 border-b border-[var(--border-color)]">
            <img src="/logo-dte.png" alt="DTE" className="w-10 h-10 rounded-lg" />
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-sm gradient-text">DATA TRACKING</h1>
                <h1 className="font-bold text-sm gradient-text">ELEITORAL</h1>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
            {menuSections.map((section) => {
              // Se for admin, mostra todos os itens; caso contrário, filtra por role
              const effectiveRole = isAdmin ? 'admin' : (user?.role || 'candidato')
              const sectionItems = section.items.filter(item => 
                item.roles.includes(effectiveRole)
              )
              if (sectionItems.length === 0) return null
              return (
                <div key={section.title}>
                  {sidebarOpen && (
                    <h3 className="px-3 mb-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      {section.title}
                    </h3>
                  )}
                  <div className="space-y-1">
                    {sectionItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {sidebarOpen && <span>{item.label}</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Central de Insights */}
            <div className="pt-2 border-t border-[var(--border-color)]">
              <button
                onClick={() => setInsightsSectionOpen(!insightsSectionOpen)}
                className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  {sidebarOpen && (
                    <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                      Central de Insights
                    </span>
                  )}
                </div>
                {sidebarOpen && (
                  insightsSectionOpen ? <ChevronDown className="w-4 h-4 text-amber-500" /> : <ChevronRight className="w-4 h-4 text-amber-500" />
                )}
              </button>

              {insightsSectionOpen && sidebarOpen && (
                <div className="mt-2 space-y-1 pl-2">
                  {insightsMenuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}

              {!sidebarOpen && (
                <div className="mt-2 space-y-1">
                  {insightsMenuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                      title={item.label}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Admin Section - No Rodapé */}
          {userIsAdmin && (
            <div className="border-t border-[var(--border-color)]">
              <button
                onClick={() => setAdminSectionOpen(!adminSectionOpen)}
                className="flex items-center justify-between w-full px-4 py-3 hover:bg-[var(--bg-card)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-red-500" />
                  {sidebarOpen && (
                    <span className="text-xs font-semibold text-red-500 uppercase tracking-wider">
                      Administrador
                    </span>
                  )}
                </div>
                {sidebarOpen && (
                  adminSectionOpen ? <ChevronDown className="w-4 h-4 text-red-500" /> : <ChevronUp className="w-4 h-4 text-red-500" />
                )}
              </button>

              {adminSectionOpen && sidebarOpen && (
                <div className="pb-2 px-2 space-y-1">
                  {adminMenuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}

              {!sidebarOpen && adminSectionOpen && (
                <div className="pb-2 px-2 space-y-1">
                  {adminMenuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
                      title={item.label}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User Section with Logout Button */}
          <div className="p-4 border-t border-[var(--border-color)]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white font-medium flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              {sidebarOpen && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.display_name || user?.name || 'Usuário'}</p>
                    <p className="text-xs text-[var(--text-muted)] capitalize">{user?.role?.replace('_', ' ') || 'Candidato'}</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                    title="Sair"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              )}
              {!sidebarOpen && (
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {/* Seletor de Cor */}
            <div className="relative">
              <button
                onClick={() => setColorPickerOpen(!colorPickerOpen)}
                className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors flex items-center gap-2"
                title="Cor do Tema"
              >
                <div 
                  className="w-5 h-5 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: colorThemes.find(t => t.id === colorTheme)?.color }}
                />
                <Palette className="w-4 h-4 hidden sm:block" />
              </button>

              {colorPickerOpen && (
                <div className="absolute right-0 top-full mt-2 p-4 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xl z-50 w-80">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Escolha a Cor do Tema
                  </h3>
                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {colorThemes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleColorChange(t.id)}
                        className={`w-10 h-10 rounded-lg border-2 transition-all hover:scale-110 flex items-center justify-center ${
                          colorTheme === t.id ? 'border-[var(--text-primary)] ring-2 ring-offset-2' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: t.color }}
                        title={t.name}
                      >
                        {colorTheme === t.id && <Check className="w-5 h-5 text-white" />}
                      </button>
                    ))}
                  </div>
                  
                  {/* Imagem de Fundo */}
                  <div className="pt-3 border-t border-[var(--border-color)]">
                    <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                      <Image className="w-4 h-4" />
                      Imagem de Fundo (Partido/Candidato)
                    </h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="URL da imagem..."
                        value={bgImageInput}
                        onChange={(e) => setBgImageInput(e.target.value)}
                        className="input flex-1 text-sm"
                      />
                      <button
                        onClick={handleBgImageSave}
                        className="btn-primary text-sm px-3"
                      >
                        Aplicar
                      </button>
                    </div>
                    {backgroundImage && (
                      <button
                        onClick={() => {
                          setBackgroundImage(null)
                          setBgImageInput('')
                        }}
                        className="text-xs text-red-500 mt-2 hover:underline"
                      >
                        Remover imagem de fundo
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Toggle Tema Claro/Escuro */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
              title={theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Color Picker Overlay */}
      {colorPickerOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setColorPickerOpen(false)}
        />
      )}
    </div>
  )
}
