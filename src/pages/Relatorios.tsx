import { FileText, Download, Calendar, Filter } from 'lucide-react'

const relatorios = [
  { id: 1, nome: 'Relatório Geral - Eleições 2024', tipo: 'Completo', data: '15/12/2024', tamanho: '2.4 MB' },
  { id: 2, nome: 'Análise de Votos Nulos', tipo: 'Específico', data: '14/12/2024', tamanho: '1.2 MB' },
  { id: 3, nome: 'Perfil Demográfico', tipo: 'Demográfico', data: '13/12/2024', tamanho: '3.1 MB' },
  { id: 4, nome: 'Comparativo 2020-2024', tipo: 'Comparativo', data: '12/12/2024', tamanho: '1.8 MB' },
]

export default function Relatorios() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-[var(--text-secondary)]">Geração e download de relatórios</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Gerar Novo Relatório
        </button>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Gerar Relatório Personalizado</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Tipo de Relatório</label>
            <select className="input">
              <option>Relatório Completo</option>
              <option>Votos por Candidato</option>
              <option>Análise Demográfica</option>
              <option>Votos Nulos e Brancos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Período</label>
            <select className="input">
              <option>Eleições 2024</option>
              <option>Eleições 2022</option>
              <option>Eleições 2020</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Formato</label>
            <select className="input">
              <option>PDF</option>
              <option>Excel</option>
              <option>CSV</option>
            </select>
          </div>
        </div>
        <button className="btn-primary mt-4">Gerar Relatório</button>
      </div>

      <div className="card">
        <div className="p-4 border-b border-[var(--border-color)]">
          <h2 className="font-semibold">Relatórios Recentes</h2>
        </div>
        <div className="divide-y divide-[var(--border-color)]">
          {relatorios.map((r) => (
            <div key={r.id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-secondary)] transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <FileText className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium">{r.nome}</p>
                  <p className="text-sm text-[var(--text-secondary)]">{r.tipo} • {r.data} • {r.tamanho}</p>
                </div>
              </div>
              <button className="btn-secondary flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
