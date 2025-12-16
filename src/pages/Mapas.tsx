import { Map, Layers, ZoomIn } from 'lucide-react'

export default function Mapas() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold">Mapas Eleitorais</h1>
        <p className="text-[var(--text-secondary)]">Visualização geográfica dos dados</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <select className="input w-auto">
            <option>Mapa de Calor - Votos</option>
            <option>Distribuição por Zona</option>
            <option>Densidade Eleitoral</option>
          </select>
          <select className="input w-auto">
            <option>Todos os municípios</option>
            <option>Porto Velho</option>
            <option>Ji-Paraná</option>
          </select>
        </div>

        <div className="h-[500px] bg-[var(--bg-secondary)] rounded-xl flex items-center justify-center border border-[var(--border-color)]">
          <div className="text-center">
            <Map className="w-16 h-16 mx-auto mb-4 text-[var(--text-muted)]" />
            <p className="text-[var(--text-secondary)]">Mapa interativo será carregado aqui</p>
            <p className="text-sm text-[var(--text-muted)]">Integração com Google Maps ou Leaflet</p>
          </div>
        </div>

        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm">Alta concentração</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-sm">Média concentração</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-sm">Baixa concentração</span>
          </div>
        </div>
      </div>
    </div>
  )
}
