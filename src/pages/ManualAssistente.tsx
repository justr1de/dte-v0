import { 
  Bot, 
  MessageCircle, 
  Sparkles, 
  Send, 
  Copy, 
  Maximize2, 
  Minimize2, 
  Trash2,
  HelpCircle,
  Lightbulb,
  Search,
  BarChart3,
  Users,
  MapPin,
  Vote,
  TrendingUp,
  FileText,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Info,
  Keyboard,
  MousePointer,
  Zap,
  MessageSquarePlus,
  Mail,
  Phone,
  Star,
  ThumbsUp,
  ThumbsDown,
  ExternalLink
} from 'lucide-react'

export default function ManualAssistente() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center py-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-white">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="bg-white/20 p-4 rounded-2xl">
            <Bot className="w-12 h-12" />
          </div>
          <Sparkles className="w-6 h-6 text-yellow-300 animate-pulse" />
        </div>
        <h1 className="text-4xl font-bold mb-2">Manual do Assistente DTE</h1>
        <p className="text-xl text-white/80">
          Guia completo para utilizar o assistente de inteligência eleitoral
        </p>
      </div>

      {/* Índice */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-500" />
          Índice
        </h2>
        <div className="grid md:grid-cols-2 gap-2">
          {[
            { id: 'introducao', label: '1. Introdução' },
            { id: 'acesso', label: '2. Como Acessar' },
            { id: 'interface', label: '3. Interface do Assistente' },
            { id: 'consultas', label: '4. Tipos de Consultas' },
            { id: 'exemplos', label: '5. Exemplos de Uso' },
            { id: 'dicas', label: '6. Dicas e Boas Práticas' },
            { id: 'atalhos', label: '7. Atalhos e Comandos' },
            { id: 'faq', label: '8. Perguntas Frequentes' },
            { id: 'feedback', label: '9. Feedback e Sugestões' },
          ].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="flex items-center gap-2 p-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-emerald-500" />
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* 1. Introdução */}
      <section id="introducao" className="card p-6 space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <span className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
          Introdução
        </h2>
        <p className="text-[var(--text-secondary)] leading-relaxed">
          O <strong>Assistente DTE</strong> é uma ferramenta de inteligência artificial integrada ao sistema 
          Data Tracking Eleitoral, projetada para facilitar consultas, análises e cruzamentos de dados 
          eleitorais do estado de Rondônia.
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="bg-[var(--bg-secondary)] p-4 rounded-xl">
            <Search className="w-8 h-8 text-emerald-500 mb-2" />
            <h3 className="font-semibold mb-1">Consultas Rápidas</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Faça perguntas em linguagem natural e receba respostas instantâneas
            </p>
          </div>
          <div className="bg-[var(--bg-secondary)] p-4 rounded-xl">
            <BarChart3 className="w-8 h-8 text-emerald-500 mb-2" />
            <h3 className="font-semibold mb-1">Análise de Dados</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Obtenha estatísticas e comparativos de eleições passadas
            </p>
          </div>
          <div className="bg-[var(--bg-secondary)] p-4 rounded-xl">
            <Zap className="w-8 h-8 text-emerald-500 mb-2" />
            <h3 className="font-semibold mb-1">Respostas Inteligentes</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              IA treinada com dados eleitorais de 2020, 2022 e 2024
            </p>
          </div>
        </div>
      </section>

      {/* 2. Como Acessar */}
      <section id="acesso" className="card p-6 space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <span className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
          Como Acessar
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl">
            <div className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div>
              <h3 className="font-semibold mb-1">Faça login no sistema</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Acesse o DTE com suas credenciais. O assistente está disponível apenas para usuários autenticados.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl">
            <div className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div>
              <h3 className="font-semibold mb-1">Localize o botão flutuante</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                No canto inferior direito da tela, você verá um botão verde com o ícone de robô. 
                Este botão está presente em todas as páginas do sistema.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl">
            <div className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div>
              <h3 className="font-semibold mb-1">Clique para abrir</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                Ao clicar no botão, a janela do assistente será aberta e você poderá começar a fazer suas consultas.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <Info className="w-5 h-5" />
            <span className="font-semibold">Dica</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Passe o mouse sobre o botão para ver a dica "Assistente DTE" antes de clicar.
          </p>
        </div>
      </section>

      {/* 3. Interface do Assistente */}
      <section id="interface" className="card p-6 space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <span className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
          Interface do Assistente
        </h2>
        <p className="text-[var(--text-secondary)]">
          A interface do assistente foi projetada para ser intuitiva e fácil de usar:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-500" />
              Cabeçalho
            </h3>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                <span><strong>Limpar:</strong> Apaga todo o histórico da conversa</span>
              </li>
              <li className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4" />
                <span><strong>Expandir:</strong> Aumenta a janela para tela cheia</span>
              </li>
              <li className="flex items-center gap-2">
                <Minimize2 className="w-4 h-4" />
                <span><strong>Minimizar:</strong> Retorna ao tamanho normal</span>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Send className="w-5 h-5 text-emerald-500" />
              Área de Mensagens
            </h3>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                <span><strong>Respostas:</strong> Mensagens do assistente (esquerda)</span>
              </li>
              <li className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span><strong>Perguntas:</strong> Suas mensagens (direita)</span>
              </li>
              <li className="flex items-center gap-2">
                <Copy className="w-4 h-4" />
                <span><strong>Copiar:</strong> Copie respostas para a área de transferência</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-4 bg-[var(--bg-secondary)] rounded-xl">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            Sugestões Rápidas
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-3">
            Na tela inicial e durante a conversa, você verá chips de sugestão com consultas comuns:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              '📊 Resumo eleições 2024',
              '🗳️ Top 5 prefeitos',
              '📈 Taxa de abstenção',
              '🏆 Partidos mais votados',
              '📍 Dados de Porto Velho',
              '🔢 Votos nulos e brancos',
            ].map((chip, index) => (
              <span
                key={index}
                className="text-xs px-3 py-1.5 bg-[var(--bg-tertiary)] rounded-full border border-[var(--border-color)]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Tipos de Consultas */}
      <section id="consultas" className="card p-6 space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <span className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
          Tipos de Consultas
        </h2>
        <p className="text-[var(--text-secondary)]">
          O assistente pode responder diversos tipos de perguntas sobre dados eleitorais:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 border border-[var(--border-color)] rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-6 h-6 text-blue-500" />
              <h3 className="font-semibold">Estatísticas Gerais</h3>
            </div>
            <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
              <li>• Resumo das eleições por ano</li>
              <li>• Total de eleitores</li>
              <li>• Taxa de participação</li>
              <li>• Número de municípios e zonas</li>
            </ul>
          </div>
          <div className="p-4 border border-[var(--border-color)] rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-6 h-6 text-green-500" />
              <h3 className="font-semibold">Candidatos</h3>
            </div>
            <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
              <li>• Candidatos mais votados</li>
              <li>• Resultados por cargo</li>
              <li>• Prefeitos e vereadores eleitos</li>
              <li>• Votação por candidato</li>
            </ul>
          </div>
          <div className="p-4 border border-[var(--border-color)] rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Vote className="w-6 h-6 text-purple-500" />
              <h3 className="font-semibold">Partidos</h3>
            </div>
            <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
              <li>• Partidos mais votados</li>
              <li>• Desempenho por região</li>
              <li>• Coligações</li>
              <li>• Comparativo entre partidos</li>
            </ul>
          </div>
          <div className="p-4 border border-[var(--border-color)] rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-6 h-6 text-red-500" />
              <h3 className="font-semibold">Municípios</h3>
            </div>
            <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
              <li>• Dados por cidade</li>
              <li>• Resultados locais</li>
              <li>• Comparativo entre municípios</li>
              <li>• Zonas eleitorais</li>
            </ul>
          </div>
          <div className="p-4 border border-[var(--border-color)] rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-6 h-6 text-orange-500" />
              <h3 className="font-semibold">Abstenção e Votos Especiais</h3>
            </div>
            <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
              <li>• Taxa de abstenção</li>
              <li>• Votos nulos</li>
              <li>• Votos brancos</li>
              <li>• Comparativo histórico</li>
            </ul>
          </div>
          <div className="p-4 border border-[var(--border-color)] rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="w-6 h-6 text-teal-500" />
              <h3 className="font-semibold">Comparativos</h3>
            </div>
            <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
              <li>• Evolução entre eleições</li>
              <li>• 2020 vs 2022 vs 2024</li>
              <li>• Tendências eleitorais</li>
              <li>• Análise de crescimento</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Exemplos de Uso */}
      <section id="exemplos" className="card p-6 space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <span className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
          Exemplos de Uso
        </h2>
        <p className="text-[var(--text-secondary)]">
          Veja alguns exemplos de perguntas que você pode fazer ao assistente:
        </p>
        <div className="space-y-4">
          {[
            {
              pergunta: 'Qual foi o resumo das eleições de 2024 em Rondônia?',
              resposta: 'O assistente retornará estatísticas gerais incluindo total de eleitores, comparecimento, abstenções e taxa de participação.',
              categoria: 'Estatísticas'
            },
            {
              pergunta: 'Quais foram os 5 prefeitos mais votados em 2024?',
              resposta: 'Lista dos candidatos a prefeito com maior votação, incluindo partido, município e número de votos.',
              categoria: 'Candidatos'
            },
            {
              pergunta: 'Qual a taxa de abstenção nas eleições de 2024?',
              resposta: 'Percentual de abstenção com comparativo histórico (2020, 2022, 2024).',
              categoria: 'Abstenção'
            },
            {
              pergunta: 'Quais partidos tiveram mais votos em 2024?',
              resposta: 'Ranking dos partidos mais votados com número total de votos para prefeito.',
              categoria: 'Partidos'
            },
            {
              pergunta: 'Mostre os dados eleitorais de Porto Velho em 2024',
              resposta: 'Informações completas do município: eleitorado, comparecimento, resultado do 1º e 2º turno.',
              categoria: 'Municípios'
            },
            {
              pergunta: 'Quantos votos nulos e brancos tivemos em 2024?',
              resposta: 'Total de votos nulos e brancos para prefeito e vereador, com percentuais.',
              categoria: 'Votos Especiais'
            },
          ].map((exemplo, index) => (
            <div key={index} className="p-4 bg-[var(--bg-secondary)] rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-500 rounded-full">
                  {exemplo.categoria}
                </span>
              </div>
              <div className="flex items-start gap-3 mb-2">
                <Users className="w-5 h-5 text-emerald-500 mt-0.5" />
                <p className="font-medium">"{exemplo.pergunta}"</p>
              </div>
              <div className="flex items-start gap-3 ml-8">
                <Bot className="w-5 h-5 text-[var(--text-muted)] mt-0.5" />
                <p className="text-sm text-[var(--text-secondary)]">{exemplo.resposta}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Dicas e Boas Práticas */}
      <section id="dicas" className="card p-6 space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <span className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">6</span>
          Dicas e Boas Práticas
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-2 text-green-500 mb-3">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Faça assim</span>
            </div>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li>✅ Seja específico: "Votos do UNIÃO em Porto Velho 2024"</li>
              <li>✅ Mencione o ano: "Eleições 2024" ou "Eleições 2022"</li>
              <li>✅ Use os chips de sugestão para consultas comuns</li>
              <li>✅ Faça perguntas diretas e objetivas</li>
              <li>✅ Copie respostas importantes para referência</li>
            </ul>
          </div>
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-2 text-red-500 mb-3">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Evite</span>
            </div>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li>❌ Perguntas muito vagas: "Me fale sobre eleições"</li>
              <li>❌ Múltiplas perguntas de uma vez</li>
              <li>❌ Perguntas sobre outros estados (apenas RO)</li>
              <li>❌ Dados de eleições anteriores a 2020</li>
              <li>❌ Informações pessoais de eleitores</li>
            </ul>
          </div>
        </div>
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Lightbulb className="w-5 h-5" />
            <span className="font-semibold">Dica Pro</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            O histórico de conversas é salvo localmente no seu navegador. Você pode retomar uma conversa 
            anterior mesmo após fechar o assistente. Para começar uma nova conversa limpa, use o botão 
            de lixeira no cabeçalho.
          </p>
        </div>
      </section>

      {/* 7. Atalhos e Comandos */}
      <section id="atalhos" className="card p-6 space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <span className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">7</span>
          Atalhos e Comandos
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-emerald-500" />
              Teclado
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                <span className="text-sm">Enviar mensagem</span>
                <kbd className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs font-mono">Enter</kbd>
              </div>
              <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                <span className="text-sm">Nova linha</span>
                <kbd className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs font-mono">Shift + Enter</kbd>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <MousePointer className="w-5 h-5 text-emerald-500" />
              Mouse
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                <span className="text-sm">Abrir assistente</span>
                <span className="text-xs text-[var(--text-muted)]">Clique no botão verde</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-[var(--bg-secondary)] rounded-lg">
                <span className="text-sm">Copiar resposta</span>
                <span className="text-xs text-[var(--text-muted)]">Ícone de cópia na mensagem</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Perguntas Frequentes */}
      <section id="faq" className="card p-6 space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <span className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">8</span>
          Perguntas Frequentes
        </h2>
        <div className="space-y-4">
          {[
            {
              pergunta: 'O assistente funciona offline?',
              resposta: 'Não. O assistente precisa de conexão com a internet para consultar os dados do banco de dados e processar as respostas.'
            },
            {
              pergunta: 'Os dados são atualizados em tempo real?',
              resposta: 'Os dados são provenientes do banco de dados do DTE, que é atualizado periodicamente com informações do TSE. As consultas refletem os dados mais recentes disponíveis no sistema.'
            },
            {
              pergunta: 'Posso consultar dados de outros estados?',
              resposta: 'Atualmente, o assistente está configurado apenas para dados eleitorais do estado de Rondônia (RO).'
            },
            {
              pergunta: 'O histórico de conversas é salvo?',
              resposta: 'Sim, o histórico é salvo localmente no seu navegador. Ele persiste mesmo após fechar a janela, mas será perdido se você limpar os dados do navegador.'
            },
            {
              pergunta: 'Quantas perguntas posso fazer?',
              resposta: 'Não há limite de perguntas. Você pode fazer quantas consultas precisar durante sua sessão.'
            },
            {
              pergunta: 'O assistente pode gerar relatórios?',
              resposta: 'O assistente fornece informações textuais. Para relatórios formatados, utilize a seção de Relatórios do sistema DTE.'
            },
          ].map((faq, index) => (
            <div key={index} className="p-4 border border-[var(--border-color)] rounded-xl">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-500" />
                {faq.pergunta}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] ml-7">{faq.resposta}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 9. Feedback e Sugestões */}
      <section id="feedback" className="card p-6 space-y-4">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <span className="bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">9</span>
          Feedback e Sugestões
        </h2>
        <p className="text-[var(--text-secondary)]">
          Sua opinião é fundamental para melhorarmos o Assistente DTE. Queremos saber o que está funcionando bem 
          e o que pode ser aprimorado.
        </p>

        {/* Como Avaliar */}
        <div className="p-4 bg-[var(--bg-secondary)] rounded-xl">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Como Avaliar as Respostas
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Ao receber uma resposta do assistente, avalie se ela foi útil:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <ThumbsUp className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-green-500">Resposta Útil</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  A informação estava correta e respondeu sua dúvida
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <ThumbsDown className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-medium text-red-500">Resposta Inadequada</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  A informação estava incorreta ou incompleta
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tipos de Feedback */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 border border-[var(--border-color)] rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquarePlus className="w-6 h-6 text-blue-500" />
              <h3 className="font-semibold">Sugerir Funcionalidade</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Tem uma ideia de nova consulta ou recurso? Envie sua sugestão para que possamos avaliar a implementação.
            </p>
          </div>
          <div className="p-4 border border-[var(--border-color)] rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              <h3 className="font-semibold">Reportar Problema</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Encontrou um erro ou comportamento inesperado? Nos informe para que possamos corrigir rapidamente.
            </p>
          </div>
          <div className="p-4 border border-[var(--border-color)] rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-6 h-6 text-yellow-500" />
              <h3 className="font-semibold">Elogiar</h3>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              O assistente te ajudou? Compartilhe sua experiência positiva conosco!
            </p>
          </div>
        </div>

        {/* Canais de Contato */}
        <div className="p-4 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-500" />
            Canais de Contato para Feedback
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <a 
              href="mailto:contato@dataro-it.com.br?subject=Feedback%20Assistente%20DTE" 
              className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors group"
            >
              <div className="bg-emerald-500/20 p-2 rounded-lg">
                <Mail className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-medium">E-mail</p>
                <p className="text-sm text-[var(--text-secondary)]">contato@dataro-it.com.br</p>
              </div>
              <ExternalLink className="w-4 h-4 text-[var(--text-muted)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
            <a 
              href="https://wa.me/5569999089202?text=Olá!%20Gostaria%20de%20enviar%20um%20feedback%20sobre%20o%20Assistente%20DTE" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-[var(--bg-primary)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors group"
            >
              <div className="bg-green-500/20 p-2 rounded-lg">
                <Phone className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">WhatsApp</p>
                <p className="text-sm text-[var(--text-secondary)]">(69) 9 9908-9202</p>
              </div>
              <ExternalLink className="w-4 h-4 text-[var(--text-muted)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>

        {/* O que incluir no feedback */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <div className="flex items-center gap-2 text-amber-500 mb-3">
            <Lightbulb className="w-5 h-5" />
            <span className="font-semibold">O que incluir no seu feedback</span>
          </div>
          <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span><strong>Descrição clara:</strong> Explique o que aconteceu ou o que você gostaria de ver</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span><strong>Pergunta feita:</strong> Copie a pergunta que você fez ao assistente</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span><strong>Resposta recebida:</strong> Se for um problema, inclua a resposta que recebeu</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5" />
              <span><strong>Resultado esperado:</strong> O que você esperava que acontecesse</span>
            </li>
          </ul>
        </div>

        {/* Compromisso */}
        <div className="text-center p-6 bg-[var(--bg-secondary)] rounded-xl">
          <h3 className="font-semibold mb-2">Nosso Compromisso</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-2xl mx-auto">
            Todos os feedbacks são lidos e considerados pela equipe de desenvolvimento. 
            Trabalhamos continuamente para melhorar o Assistente DTE e oferecer a melhor 
            experiência possível aos usuários do sistema.
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center py-8 text-[var(--text-secondary)]">
        <p className="text-sm">
          Desenvolvido por <strong>DATA-RO Inteligência Territorial</strong>
        </p>
        <p className="text-xs mt-2">
          Versão 1.0 • Última atualização: Dezembro 2024
        </p>
      </div>
    </div>
  )
}
