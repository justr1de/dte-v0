import { useState } from 'react'
import Layout from '@/components/Layout'
import { 
  KeyRound, 
  Shield, 
  ShieldCheck, 
  ShieldAlert,
  Check,
  X,
  Info
} from 'lucide-react'

interface Permissao {
  id: string
  nome: string
  descricao: string
  admin: boolean
  gestor: boolean
  candidato: boolean
}

const permissoesIniciais: Permissao[] = [
  { id: 'dashboard', nome: 'Dashboard', descricao: 'Visualizar dashboard principal', admin: true, gestor: true, candidato: true },
  { id: 'eleitorado', nome: 'Eleitorado', descricao: 'Visualizar dados do eleitorado', admin: true, gestor: true, candidato: true },
  { id: 'candidatos', nome: 'Candidatos', descricao: 'Gerenciar candidatos', admin: true, gestor: true, candidato: false },
  { id: 'resultados', nome: 'Resultados', descricao: 'Visualizar resultados eleitorais', admin: true, gestor: true, candidato: true },
  { id: 'votos_nulos', nome: 'Votos Nulos', descricao: 'Análise de votos nulos e brancos', admin: true, gestor: true, candidato: true },
  { id: 'mapas', nome: 'Mapas de Calor', descricao: 'Visualizar mapas geográficos', admin: true, gestor: true, candidato: true },
  { id: 'pesquisas', nome: 'Pesquisas', descricao: 'Criar e gerenciar pesquisas', admin: true, gestor: true, candidato: false },
  { id: 'analise_preditiva', nome: 'Análise Preditiva', descricao: 'Visualizar análises preditivas', admin: true, gestor: true, candidato: false },
  { id: 'recomendacoes', nome: 'Recomendações', descricao: 'Visualizar recomendações estratégicas', admin: true, gestor: true, candidato: false },
  { id: 'acoes_campanha', nome: 'Ações de Campanha', descricao: 'Gerenciar ações de campanha', admin: true, gestor: true, candidato: false },
  { id: 'relatorios', nome: 'Relatórios', descricao: 'Gerar e exportar relatórios', admin: true, gestor: true, candidato: true },
  { id: 'importar', nome: 'Importar Dados', descricao: 'Importar dados do TSE', admin: true, gestor: false, candidato: false },
  { id: 'usuarios', nome: 'Gerenciar Usuários', descricao: 'Criar e editar usuários', admin: true, gestor: false, candidato: false },
  { id: 'configuracoes', nome: 'Configurações', descricao: 'Configurações do sistema', admin: true, gestor: false, candidato: false },
  { id: 'auditoria', nome: 'Auditoria', descricao: 'Visualizar logs de auditoria', admin: true, gestor: false, candidato: false },
]

export default function ControleAcessos() {
  const [permissoes, setPermissoes] = useState<Permissao[]>(permissoesIniciais)

  const togglePermissao = (id: string, role: 'admin' | 'gestor' | 'candidato') => {
    // Admin sempre tem todas as permissões
    if (role === 'admin') return

    setPermissoes(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, [role]: !p[role] }
      }
      return p
    }))
  }

  const roleInfo = [
    {
      key: 'admin',
      label: 'Administrador',
      icon: ShieldAlert,
      color: 'text-red-500',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      description: 'Acesso total ao sistema. Pode gerenciar usuários, configurações e todos os módulos.'
    },
    {
      key: 'gestor',
      label: 'Gestor de Campanha',
      icon: ShieldCheck,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      description: 'Acesso a pesquisas, análises e gestão de campanha. Não pode gerenciar usuários.'
    },
    {
      key: 'candidato',
      label: 'Candidato',
      icon: Shield,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100 dark:bg-gray-700',
      description: 'Acesso básico para visualização de dados e relatórios.'
    }
  ]

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <KeyRound className="w-7 h-7 text-red-500" />
            Controle de Acessos
          </h1>
          <p className="text-[var(--text-muted)]">
            Configure as permissões de cada nível de usuário
          </p>
        </div>

        {/* Níveis de Acesso */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roleInfo.map((role) => (
            <div key={role.key} className="card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${role.bgColor}`}>
                  <role.icon className={`w-6 h-6 ${role.color}`} />
                </div>
                <h3 className="font-semibold">{role.label}</h3>
              </div>
              <p className="text-sm text-[var(--text-muted)]">{role.description}</p>
            </div>
          ))}
        </div>

        {/* Matriz de Permissões */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-[var(--border-color)]">
            <h2 className="font-semibold">Matriz de Permissões</h2>
            <p className="text-sm text-[var(--text-muted)]">
              Clique nas células para ativar/desativar permissões (exceto Admin)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--bg-secondary)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Módulo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Descrição</th>
                  <th className="px-4 py-3 text-center text-sm font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                      Admin
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-blue-500" />
                      Gestor
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium">
                    <div className="flex items-center justify-center gap-1">
                      <Shield className="w-4 h-4 text-gray-500" />
                      Candidato
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]">
                {permissoes.map((permissao) => (
                  <tr key={permissao.id} className="hover:bg-[var(--bg-secondary)] transition-colors">
                    <td className="px-4 py-3 font-medium">{permissao.nome}</td>
                    <td className="px-4 py-3 text-sm text-[var(--text-muted)]">{permissao.descricao}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center cursor-not-allowed">
                          <Check className="w-5 h-5 text-green-600" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => togglePermissao(permissao.id, 'gestor')}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            permissao.gestor 
                              ? 'bg-green-100 dark:bg-green-900/30' 
                              : 'bg-red-100 dark:bg-red-900/30'
                          }`}
                        >
                          {permissao.gestor 
                            ? <Check className="w-5 h-5 text-green-600" />
                            : <X className="w-5 h-5 text-red-600" />
                          }
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center">
                        <button
                          onClick={() => togglePermissao(permissao.id, 'candidato')}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            permissao.candidato 
                              ? 'bg-green-100 dark:bg-green-900/30' 
                              : 'bg-red-100 dark:bg-red-900/30'
                          }`}
                        >
                          {permissao.candidato 
                            ? <Check className="w-5 h-5 text-green-600" />
                            : <X className="w-5 h-5 text-red-600" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info */}
        <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-800 dark:text-blue-300">Sobre as Permissões</p>
              <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                As permissões do Administrador não podem ser alteradas pois este nível tem acesso total ao sistema.
                As alterações nas permissões de Gestor e Candidato são aplicadas imediatamente para todos os usuários
                com esses níveis de acesso.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
