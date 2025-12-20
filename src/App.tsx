import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Eleitorado from './pages/Eleitorado'
import Candidatos from './pages/Candidatos'
import Resultados from './pages/Resultados'
import VotosNulos from './pages/VotosNulos'
import Mapas from './pages/Mapas'
import LocaisVotacao from './pages/LocaisVotacao'
import MapasCalor from './pages/MapasCalor'
import MapaInterativo from './pages/MapaInterativo'
import MapaCalorGoogle from './pages/MapaCalorGoogle'
import MapaCalorLeaflet from './pages/MapaCalorLeaflet'
import Relatorios from './pages/Relatorios'
import Importar from './pages/Importar'
import Usuarios from './pages/Usuarios'
import Configuracoes from './pages/Configuracoes'

// Fase 2 - Pesquisas
import Pesquisas from './pages/Pesquisas'
import CriarPesquisa from './pages/CriarPesquisa'

// Fase 3 - Inteligência Estratégica
import AnalisePreditiva from './pages/AnalisePreditiva'
import Recomendacoes from './pages/Recomendacoes'
import AcoesCampanha from './pages/AcoesCampanha'

// Novas Funcionalidades Estratégicas
import RadarEleitoral from './pages/RadarEleitoral'
import SimuladorCenarios from './pages/SimuladorCenarios'
import PerfilEleitor from './pages/PerfilEleitor'
import MonitorConcorrencia from './pages/MonitorConcorrencia'
import CalculadoraMetas from './pages/CalculadoraMetas'

// Central de Insights
import InteligenciaTerritorial from './pages/insights/InteligenciaTerritorial'
import AnaliseAbstencao from './pages/insights/AnaliseAbstencao'
import CompetitividadeEleitoral from './pages/insights/CompetitividadeEleitoral'
import DashboardInsights from './pages/insights/DashboardInsights'

// Admin
import GerenciarUsuarios from './pages/admin/GerenciarUsuarios'
import ControleAcessos from './pages/admin/ControleAcessos'
import AuditoriaLogin from './pages/admin/AuditoriaLogin'

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // For demo purposes, allow access without authentication
  // In production, uncomment the redirect
  // if (!user) {
  //   return <Navigate to="/login" replace />
  // }

  return <Layout>{children}</Layout>
}

// Admin Route Component
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // For demo purposes, allow access
  // In production, check admin role
  // if (!isAdmin) {
  //   return <Navigate to="/dashboard" replace />
  // }

  return <Layout>{children}</Layout>
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/eleitorado" element={<ProtectedRoute><Eleitorado /></ProtectedRoute>} />
      <Route path="/candidatos" element={<ProtectedRoute><Candidatos /></ProtectedRoute>} />
      <Route path="/resultados" element={<ProtectedRoute><Resultados /></ProtectedRoute>} />
      <Route path="/votos-nulos" element={<ProtectedRoute><VotosNulos /></ProtectedRoute>} />
      <Route path="/mapas" element={<ProtectedRoute><Mapas /></ProtectedRoute>} />
      <Route path="/locais-votacao" element={<ProtectedRoute><LocaisVotacao /></ProtectedRoute>} />
      <Route path="/mapas-calor" element={<ProtectedRoute><MapasCalor /></ProtectedRoute>} />
      <Route path="/mapa-interativo" element={<ProtectedRoute><MapaInterativo /></ProtectedRoute>} />
      <Route path="/mapa-calor-google" element={<ProtectedRoute><MapaCalorGoogle /></ProtectedRoute>} />
      <Route path="/mapa-calor-leaflet" element={<ProtectedRoute><MapaCalorLeaflet /></ProtectedRoute>} />
      <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
      <Route path="/importar" element={<ProtectedRoute><Importar /></ProtectedRoute>} />

      {/* Fase 2 - Pesquisas */}
      <Route path="/pesquisas" element={<ProtectedRoute><Pesquisas /></ProtectedRoute>} />
      <Route path="/pesquisas/criar" element={<ProtectedRoute><CriarPesquisa /></ProtectedRoute>} />

      {/* Fase 3 - Inteligência Estratégica */}
      <Route path="/analise-preditiva" element={<ProtectedRoute><AnalisePreditiva /></ProtectedRoute>} />
      <Route path="/recomendacoes" element={<ProtectedRoute><Recomendacoes /></ProtectedRoute>} />
      <Route path="/acoes-campanha" element={<ProtectedRoute><AcoesCampanha /></ProtectedRoute>} />

      {/* Novas Funcionalidades Estratégicas */}
      <Route path="/radar-eleitoral" element={<ProtectedRoute><RadarEleitoral /></ProtectedRoute>} />
      <Route path="/simulador-cenarios" element={<ProtectedRoute><SimuladorCenarios /></ProtectedRoute>} />
      <Route path="/perfil-eleitor" element={<ProtectedRoute><PerfilEleitor /></ProtectedRoute>} />
      <Route path="/monitor-concorrencia" element={<ProtectedRoute><MonitorConcorrencia /></ProtectedRoute>} />
      <Route path="/calculadora-metas" element={<ProtectedRoute><CalculadoraMetas /></ProtectedRoute>} />

      {/* Central de Insights */}
      <Route path="/insights" element={<ProtectedRoute><DashboardInsights /></ProtectedRoute>} />
      <Route path="/insights/territorial" element={<ProtectedRoute><InteligenciaTerritorial /></ProtectedRoute>} />
      <Route path="/insights/abstencao" element={<ProtectedRoute><AnaliseAbstencao /></ProtectedRoute>} />
      <Route path="/insights/competitividade" element={<ProtectedRoute><CompetitividadeEleitoral /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/usuarios" element={<AdminRoute><Usuarios /></AdminRoute>} />
      <Route path="/configuracoes" element={<AdminRoute><Configuracoes /></AdminRoute>} />
      <Route path="/admin/usuarios" element={<AdminRoute><GerenciarUsuarios /></AdminRoute>} />
      <Route path="/admin/permissoes" element={<AdminRoute><ControleAcessos /></AdminRoute>} />
      <Route path="/admin/auditoria" element={<AdminRoute><AuditoriaLogin /></AdminRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
