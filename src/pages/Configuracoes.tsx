import { Settings, Database, Bell, Shield, Palette } from 'lucide-react'

export default function Configuracoes() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-[var(--text-secondary)]">Configurações do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Database className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold">Banco de Dados</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">URL do Supabase</label>
              <input type="text" className="input" value="https://uttvovuufyhqxjmqqbuk.supabase.co" readOnly />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <span className="badge badge-success">Conectado</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold">Notificações</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 rounded" defaultChecked />
              <span>Notificar novas importações</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 rounded" defaultChecked />
              <span>Alertas de erros</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 rounded" />
              <span>Relatórios semanais</span>
            </label>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Palette className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-lg font-semibold">Aparência</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Tema Padrão</label>
              <select className="input">
                <option>Escuro</option>
                <option>Claro</option>
                <option>Sistema</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-red-500/10">
              <Shield className="w-5 h-5 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold">Segurança</h2>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 rounded" defaultChecked />
              <span>Autenticação de dois fatores</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="checkbox" className="w-4 h-4 rounded" defaultChecked />
              <span>Sessões seguras</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-primary">Salvar Configurações</button>
      </div>
    </div>
  )
}
