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
  Upload,
  Map,
  Vote
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, signOut, isAdmin, isGestor } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'gestor_campanha', 'candidato'] },
    { path: '/eleitorado', icon: Users, label: 'Eleitorado', roles: ['admin', 'gestor_campanha', 'candidato'] },
    { path: '/candidatos', icon: UserCheck, label: 'Candidatos', roles: ['admin', 'gestor_campanha'] },
    { path: '/resultados', icon: BarChart3, label: 'Resultados', roles: ['admin', 'gestor_campanha', 'candidato'] },
    { path: '/votos-nulos', icon: Vote, label: 'Votos Nulos', roles: ['admin', 'gestor_campanha', 'candidato'] },
    { path: '/mapas', icon: Map, label: 'Mapas', roles: ['admin', 'gestor_campanha', 'candidato'] },
    { path: '/relatorios', icon: FileText, label: 'Relatórios', roles: ['admin', 'gestor_campanha', 'candidato'] },
    { path: '/importar', icon: Upload, label: 'Importar', roles: ['admin', 'gestor_campanha'] },
    { path: '/usuarios', icon: Users, label: 'Usuários', roles: ['admin'] },
    { path: '/configuracoes', icon: Settings, label: 'Configurações', roles: ['admin'] },
  ]

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role || 'candidato')
  )

  const handleSignOut = async () => {
    await signOut()
  }

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
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredMenuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            ))}
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
