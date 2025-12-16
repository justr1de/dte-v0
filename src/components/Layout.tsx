import { ReactNode, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
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
  History
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [adminSectionOpen, setAdminSectionOpen] = useState(false)

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
        { path: '/resultados', icon: BarChart3, label: 'Resultados', roles: ['admin', 'gestor_campanha', 'candidato'] },
        { path: '/votos-nulos', icon: Vote, label: 'Votos Nulos', roles: ['admin', 'gestor_campanha', 'candidato'] },
        { path: '/mapas', icon: Map, label: 'Mapas de Calor', roles: ['admin', 'gestor_campanha', 'candidato'] },
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
      title: 'Sistema',
      items: [
        { path: '/relatorios', icon: FileText, label: 'Relatórios', roles: ['admin', 'gestor_campanha', 'candidato'] },
        { path: '/importar', icon: Upload, label: 'Importar Dados', roles: ['admin'] },
        { path: '/configuracoes', icon: Settings, label: 'Configurações', roles: ['admin'] },
      ]
    }
  ]

  // Itens do menu Administrador (apenas para admin)
  const adminMenuItems = [
    { path: '/admin/usuarios', icon: UserPlus, label: 'Gerenciar Usuários' },
    { path: '/admin/permissoes', icon: KeyRound, label: 'Controle de Acessos' },
    { path: '/admin/auditoria', icon: History, label: 'Auditoria de Login' },
  ]

  const handleSignOut = async () => {
    await signOut()
  }

  // Verificar se o usuário é admin (para demonstração, considerar todos como admin temporariamente)
  const userIsAdmin = isAdmin || user?.role === 'admin' || true // Remover "|| true" em produção

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
              const sectionItems = section.items.filter(item => 
                item.roles.includes(user?.role || 'candidato')
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

            {/* Seção Administrador - Minimizável */}
            {userIsAdmin && (
              <div className="pt-2 border-t border-[var(--border-color)]">
                <button
                  onClick={() => setAdminSectionOpen(!adminSectionOpen)}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
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
                    adminSectionOpen ? (
                      <ChevronDown className="w-4 h-4 text-red-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-red-500" />
                    )
                  )}
                </button>

                {adminSectionOpen && sidebarOpen && (
                  <div className="mt-2 space-y-1 pl-2">
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

                {!sidebarOpen && (
                  <div className="mt-2 space-y-1">
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
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-[var(--border-color)]">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 w-full p-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-medium">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                {sidebarOpen && (
                  <>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium truncate">{user?.name || 'Usuário'}</p>
                      <p className="text-xs text-[var(--text-muted)] capitalize">{user?.role?.replace('_', ' ') || 'Candidato'}</p>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] shadow-lg">
                  <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {theme === 'dark' ? 'Tema Claro' : 'Tema Escuro'}
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-500 hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
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
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors lg:hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
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
    </div>
  )
}
