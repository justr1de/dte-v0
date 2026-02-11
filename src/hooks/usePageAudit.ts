import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAudit } from './useAudit'

// Mapeamento de rotas para nomes amigáveis
const PAGE_NAMES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/eleitorado': 'Eleitorado',
  '/candidatos': 'Candidatos',
  '/deputados': 'Deputados',
  '/resultados': 'Resultados',
  '/votos-nulos': 'Votos Nulos',
  '/mapas': 'Mapas',
  '/locais-votacao': 'Locais de Votação',
  '/comparativo-historico': 'Comparativo Histórico',
  '/historico': 'Histórico',
  '/documentacao-zonas': 'Documentação Zonas',
  '/mapas-calor': 'Mapas de Calor',
  '/mapa-interativo': 'Mapa Interativo',
  '/mapa-calor-google': 'Mapa de Calor Google',
  '/mapa-calor-leaflet': 'Mapa de Calor Leaflet',
  '/mapa-calor-cidades': 'Mapa de Calor por Cidades',
  '/relatorios': 'Relatórios',
  '/importar': 'Importar Dados',
  '/usuarios': 'Usuários',
  '/configuracoes': 'Configurações',
  '/sobre': 'Sobre o Projeto',
  '/manual-assistente': 'Manual do Assistente',
  '/pesquisas': 'Pesquisas',
  '/criar-pesquisa': 'Criar Pesquisa',
  '/analise-preditiva': 'Análise Preditiva',
  '/recomendacoes': 'Recomendações',
  '/acoes-campanha': 'Ações de Campanha',
  '/radar-eleitoral': 'Radar Eleitoral',
  '/simulador-cenarios': 'Simulador de Cenários',
  '/perfil-eleitor': 'Perfil do Eleitor',
  '/monitor-concorrencia': 'Monitor de Concorrência',
  '/calculadora-metas': 'Calculadora de Metas',
  '/estrategia-territorial': 'Estratégia Territorial',
  '/vereadores-2024': 'Vereadores 2024',
  '/insights/inteligencia-territorial': 'Inteligência Territorial',
  '/insights/analise-abstencao': 'Análise de Abstenção',
  '/insights/competitividade': 'Competitividade Eleitoral',
  '/insights/dashboard': 'Dashboard de Insights',
  '/admin/usuarios': 'Gerenciar Usuários',
  '/admin/controle-acessos': 'Controle de Acessos',
  '/admin/auditoria': 'Auditoria de Login',
  '/admin/super-admin': 'Super Administração',
  '/admin/logs-auditoria': 'Logs de Auditoria',
  '/login': 'Login',
}

export function usePageAudit() {
  const location = useLocation()
  const { logNavigation } = useAudit()

  useEffect(() => {
    const path = location.pathname
    const pageName = PAGE_NAMES[path] || `Página: ${path}`
    
    // Não registrar a página de login (será registrado pelo AuthContext)
    if (path === '/login') return

    // Registrar navegação com um pequeno delay para evitar registros durante redirecionamentos
    const timer = setTimeout(() => {
      logNavigation(pageName, path)
    }, 500)

    return () => clearTimeout(timer)
  }, [location.pathname, logNavigation])
}
