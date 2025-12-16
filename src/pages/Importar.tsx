import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react'

export default function Importar() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">Importar Dados</h1>
        <p className="text-[var(--text-secondary)]">Upload de arquivos de dados eleitorais</p>
      </div>

      <div className="card p-8">
        <div className="border-2 border-dashed border-[var(--border-color)] rounded-xl p-12 text-center hover:border-emerald-500 transition-colors cursor-pointer">
          <Upload className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
          <p className="text-lg font-medium mb-2">Arraste arquivos aqui ou clique para selecionar</p>
          <p className="text-sm text-[var(--text-secondary)]">Suporta CSV, XLSX, JSON (máx. 50MB)</p>
          <input type="file" className="hidden" accept=".csv,.xlsx,.json" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Tipos de Dados Aceitos</h2>
          <ul className="space-y-3">
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span>Dados do TSE (formato oficial)</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span>Planilhas de eleitores</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span>Resultados de votação</span>
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span>Dados demográficos</span>
            </li>
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4">Últimas Importações</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">eleitores_2024.csv</p>
                <p className="text-xs text-[var(--text-muted)]">Importado há 2 dias</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex items-center gap-3 p-3 bg-[var(--bg-secondary)] rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">resultados_zona1.xlsx</p>
                <p className="text-xs text-[var(--text-muted)]">Importado há 5 dias</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
