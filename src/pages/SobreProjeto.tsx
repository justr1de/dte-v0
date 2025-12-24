import { 
  Building2, 
  Target, 
  Briefcase,
  Globe,
  Mail,
  Instagram,
  Phone,
  MapPin,
  Database,
  BarChart3,
  Map,
  Users,
  Shield,
  Zap
} from 'lucide-react'

export default function SobreProjeto() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Sobre o Projeto</h1>
        <p className="text-[var(--text-muted)]">
          Conheça a instituição por trás do Data Tracking Eleitoral
        </p>
      </div>

      {/* Card do Projeto DTE */}
      <div className="card p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Data Tracking Eleitoral</h2>
            <p className="text-slate-400 text-sm">Sistema de Análise e Inteligência Eleitoral</p>
          </div>
        </div>

        <p className="text-slate-300 mb-4 leading-relaxed">
          O Data Tracking Eleitoral (DTE) nasceu da necessidade de democratizar o acesso a dados eleitorais oficiais, 
          tornando informações do TSE e TRE-RO acessíveis de forma rápida, organizada e confiável. Desenvolvido pela 
          DATA-RO Inteligência Territorial, o sistema combina expertise em análise de dados territoriais com tecnologia 
          de ponta para oferecer insights estratégicos para campanhas eleitorais.
        </p>

        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
            Análise de Dados
          </span>
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
            Inteligência Eleitoral
          </span>
          <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
            Inteligência Territorial
          </span>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-medium">
            Open Data
          </span>
        </div>
      </div>

      {/* Card DATA-RO */}
      <div className="card p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">DATA-RO Inteligência Territorial</h2>
            <p className="text-slate-400 text-sm">Análise de Dados e Inteligência Geoespacial</p>
          </div>
        </div>

        {/* Missão */}
        <div className="mb-6">
          <h3 className="flex items-center gap-2 text-amber-400 font-semibold mb-3">
            <Target className="w-5 h-5" />
            Missão
          </h3>
          <p className="text-slate-300 leading-relaxed">
            A DATA-RO é especializada em inteligência territorial e análise de dados geoespaciais, oferecendo soluções 
            inovadoras para gestão pública, planejamento urbano e análise eleitoral. Com expertise em automação de coleta 
            de dados e desenvolvimento de sistemas de informação geográfica, a DATA-RO transforma dados complexos em 
            insights acionáveis para tomada de decisões estratégicas.
          </p>
        </div>

        {/* Áreas de Atuação */}
        <div className="mb-6">
          <h3 className="flex items-center gap-2 text-amber-400 font-semibold mb-3">
            <Briefcase className="w-5 h-5" />
            Áreas de Atuação
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
              Inteligência Territorial e Geoespacial
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
              Automação de Coleta de Dados
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
              Análise Eleitoral e Política
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
              Desenvolvimento de Sistemas GIS
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
              Consultoria em Dados Públicos
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div>
              Visualização de Dados e Dashboards
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-700">
          <a 
            href="https://dataro-it.com.br" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <Globe className="w-4 h-4" />
            Site Institucional
          </a>
          <a 
            href="mailto:contato@dataro-it.com.br"
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <Mail className="w-4 h-4" />
            contato@dataro-it.com.br
          </a>
          <a 
            href="https://instagram.com/dataro_it" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <Instagram className="w-4 h-4" />
            @dataro_it
          </a>
          <a 
            href="tel:+5569999452678"
            className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <Phone className="w-4 h-4" />
            (69) 99945-2678
          </a>
        </div>
      </div>

      {/* Funcionalidades do Sistema */}
      <div className="card p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <h3 className="flex items-center gap-2 text-white font-semibold mb-4">
          <Zap className="w-5 h-5 text-amber-400" />
          Funcionalidades do Sistema
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          Recursos disponíveis no Data Tracking Eleitoral
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <Database className="w-8 h-8 text-emerald-400 mb-2" />
            <h4 className="font-medium text-white mb-1">Dados Eleitorais</h4>
            <p className="text-sm text-slate-400">
              Acesso a dados oficiais do TSE e TRE-RO de múltiplas eleições
            </p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <BarChart3 className="w-8 h-8 text-blue-400 mb-2" />
            <h4 className="font-medium text-white mb-1">Análise de Resultados</h4>
            <p className="text-sm text-slate-400">
              Visualização detalhada de votações por candidato, partido e região
            </p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <Map className="w-8 h-8 text-purple-400 mb-2" />
            <h4 className="font-medium text-white mb-1">Mapas de Calor</h4>
            <p className="text-sm text-slate-400">
              Visualização geográfica de concentração de votos e eleitorado
            </p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <Users className="w-8 h-8 text-cyan-400 mb-2" />
            <h4 className="font-medium text-white mb-1">Perfil do Eleitorado</h4>
            <p className="text-sm text-slate-400">
              Análise demográfica e comportamental dos eleitores
            </p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <Target className="w-8 h-8 text-amber-400 mb-2" />
            <h4 className="font-medium text-white mb-1">Estratégia Territorial</h4>
            <p className="text-sm text-slate-400">
              Ferramentas para planejamento de campanhas por região
            </p>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <Shield className="w-8 h-8 text-red-400 mb-2" />
            <h4 className="font-medium text-white mb-1">Segurança de Dados</h4>
            <p className="text-sm text-slate-400">
              Proteção e controle de acesso às informações sensíveis
            </p>
          </div>
        </div>
      </div>

      {/* Entre em Contato */}
      <div className="card p-6 bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
        <h3 className="font-semibold text-white mb-2">Entre em Contato</h3>
        <p className="text-slate-400 text-sm">
          Para dúvidas, sugestões ou parcerias relacionadas ao Data Tracking Eleitoral, entre em contato através 
          dos canais da DATA-RO listados acima.
        </p>
      </div>

      {/* Footer */}
      <div className="text-center text-slate-500 text-sm py-4">
        © {new Date().getFullYear()} DATA-RO Inteligência Territorial. Todos os direitos reservados.
      </div>
    </div>
  )
}
