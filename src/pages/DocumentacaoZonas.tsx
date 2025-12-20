import { useState } from 'react'
import {
  FileText,
  MapPin,
  History,
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react'

interface ZonaInfo {
  zona: number
  municipios: string[]
  secoes2024?: number
  status: 'ativa' | 'extinta'
}

const zonasAtivas: ZonaInfo[] = [
  { zona: 1, municipios: ['Guajará-Mirim', 'Nova Mamoré'], status: 'ativa' },
  { zona: 2, municipios: ['Porto Velho (Centro, Caiari, Arigolândia, Mocambo, Esperança da Comunidade)'], secoes2024: 340, status: 'ativa' },
  { zona: 3, municipios: ['Ji-Paraná', 'Presidente Médici'], status: 'ativa' },
  { zona: 4, municipios: ['Vilhena'], status: 'ativa' },
  { zona: 5, municipios: ['Costa Marques', 'São Francisco do Guaporé'], status: 'ativa' },
  { zona: 6, municipios: ['Porto Velho (Areal, Jaci-Paraná e áreas rurais)'], secoes2024: 301, status: 'ativa' },
  { zona: 7, municipios: ['Ariquemes'], status: 'ativa' },
  { zona: 8, municipios: ['Cacoal'], status: 'ativa' },
  { zona: 9, municipios: ['Pimenta Bueno'], status: 'ativa' },
  { zona: 10, municipios: ['Rolim de Moura'], status: 'ativa' },
  { zona: 11, municipios: ['Ouro Preto do Oeste'], status: 'ativa' },
  { zona: 12, municipios: ['Jaru'], status: 'ativa' },
  { zona: 13, municipios: ['Espigão do Oeste'], status: 'ativa' },
  { zona: 15, municipios: ['Colorado do Oeste'], status: 'ativa' },
  { zona: 16, municipios: ['Cerejeiras'], status: 'ativa' },
  { zona: 17, municipios: ['Alta Floresta d\'Oeste'], status: 'ativa' },
  { zona: 18, municipios: ['Machadinho d\'Oeste'], status: 'ativa' },
  { zona: 19, municipios: ['Buritis'], status: 'ativa' },
  { zona: 20, municipios: ['Porto Velho (Zona Sul/Leste - Cohab, Caladinho, Jardim Santana)'], secoes2024: 293, status: 'ativa' },
  { zona: 21, municipios: ['Porto Velho (Zona Leste - Tancredo Neves)'], secoes2024: 247, status: 'ativa' },
  { zona: 25, municipios: ['Alvorada d\'Oeste'], status: 'ativa' },
  { zona: 26, municipios: ['São Miguel do Guaporé'], status: 'ativa' },
  { zona: 27, municipios: ['Novo Horizonte do Oeste'], status: 'ativa' },
  { zona: 28, municipios: ['Mirante da Serra'], status: 'ativa' },
  { zona: 29, municipios: ['Monte Negro'], status: 'ativa' },
  { zona: 30, municipios: ['Candeias do Jamari'], status: 'ativa' },
  { zona: 32, municipios: ['Cujubim'], status: 'ativa' },
  { zona: 34, municipios: ['Itapuã do Oeste'], status: 'ativa' },
  { zona: 35, municipios: ['Rio Crespo'], status: 'ativa' },
]

const zonasExtintas = [14, 22, 23, 24, 31, 33]

const rezoneamento23 = {
  zonaOrigem: 23,
  zonaDestino: 2,
  areaOriginal: 'Bairro Flodoaldo Pontes Pinto e adjacências',
  novoLocal: 'Escola Flora Calheiros Cotrin',
  endereco: 'Rua Assis Chateaubriand, 7643 – Bairro Esperança da Comunidade'
}

const rezoneamento24 = [
  {
    localidadeOriginal: 'Jaci-Paraná',
    novoLocal: 'Escola Municipal Cora Coralina',
    endereco: 'Rua Ilário Maia, s/n – Distrito de Jaci-Paraná'
  },
  {
    localidadeOriginal: 'Cachoeira do Teotônio',
    novoLocal: 'Escola Padre Mário Castagna',
    endereco: 'Av. Campos Sales, 395 – Bairro Areal'
  },
  {
    localidadeOriginal: 'Vila Franciscana / KM 24',
    novoLocal: 'Escola Padre Mário Castagna',
    endereco: 'Av. Campos Sales, 395 – Bairro Areal'
  },
  {
    localidadeOriginal: 'União Bandeirantes',
    novoLocal: 'Agregada à 6ª Zona',
    endereco: 'Verificar no e-Título'
  },
  {
    localidadeOriginal: 'Nova Mutum',
    novoLocal: 'Agregada à 6ª Zona',
    endereco: 'Verificar no e-Título'
  },
  {
    localidadeOriginal: 'Extrema',
    novoLocal: 'Agregada à 6ª Zona',
    endereco: 'Verificar no e-Título'
  }
]

export default function DocumentacaoZonas() {
  const [expandedSection, setExpandedSection] = useState<string | null>('porto-velho')

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="w-7 h-7 text-[var(--accent-color)]" />
          Documentação - Zonas Eleitorais de Rondônia
        </h1>
        <p className="text-[var(--text-secondary)]">
          Informações sobre as zonas eleitorais do estado, incluindo histórico de rezoneamento
        </p>
      </div>

      {/* Aviso importante */}
      <div className="card p-4 bg-amber-500/10 border-amber-500/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-500">Aviso Importante</p>
            <p className="text-sm text-[var(--text-secondary)]">
              As Zonas Eleitorais 23ª e 24ª de Porto Velho foram <strong>extintas e rezoneadas</strong>. 
              Eleitores cujos títulos ainda mostram essas zonas devem atualizar seus dados no aplicativo e-Título.
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-green-500" />
            <span className="text-sm text-[var(--text-secondary)]">Zonas Ativas</span>
          </div>
          <p className="text-2xl font-bold text-green-500">29</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-5 h-5 text-red-500" />
            <span className="text-sm text-[var(--text-secondary)]">Zonas Extintas</span>
          </div>
          <p className="text-2xl font-bold text-red-500">6</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-[var(--text-secondary)]">Municípios</span>
          </div>
          <p className="text-2xl font-bold text-blue-500">52</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-[var(--text-secondary)]">Zonas Porto Velho</span>
          </div>
          <p className="text-2xl font-bold text-orange-500">4</p>
        </div>
      </div>

      {/* Seção Porto Velho */}
      <div className="card">
        <button
          onClick={() => toggleSection('porto-velho')}
          className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-secondary)]/50"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[var(--accent-color)]" />
            <span className="font-semibold">Porto Velho - Zonas Eleitorais</span>
          </div>
          {expandedSection === 'porto-velho' ? <ChevronUp /> : <ChevronDown />}
        </button>
        
        {expandedSection === 'porto-velho' && (
          <div className="p-4 pt-0 space-y-4">
            <p className="text-[var(--text-secondary)]">
              Porto Velho é atendido por 4 zonas eleitorais ativas:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {zonasAtivas.filter(z => z.municipios[0].includes('Porto Velho')).map(zona => (
                <div key={zona.zona} className="p-4 bg-[var(--bg-secondary)] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-lg">{zona.zona}ª Zona</span>
                    {zona.secoes2024 && (
                      <span className="text-sm text-[var(--text-secondary)]">
                        {zona.secoes2024} seções
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{zona.municipios[0]}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Seção Rezoneamento */}
      <div className="card">
        <button
          onClick={() => toggleSection('rezoneamento')}
          className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-secondary)]/50"
        >
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-red-500" />
            <span className="font-semibold">Histórico de Rezoneamento - Zonas 23 e 24</span>
          </div>
          {expandedSection === 'rezoneamento' ? <ChevronUp /> : <ChevronDown />}
        </button>
        
        {expandedSection === 'rezoneamento' && (
          <div className="p-4 pt-0 space-y-6">
            {/* Zona 23 */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded text-sm">EXTINTA</span>
                Antiga 23ª Zona Eleitoral
              </h3>
              <div className="bg-[var(--bg-secondary)] rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Área original</p>
                    <p className="font-medium">{rezoneamento23.areaOriginal}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Transferida para</p>
                    <p className="font-medium text-green-500">{rezoneamento23.zonaDestino}ª Zona Eleitoral</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Novo local de votação</p>
                    <p className="font-medium">{rezoneamento23.novoLocal}</p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-secondary)]">Endereço</p>
                    <p className="font-medium">{rezoneamento23.endereco}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Zona 24 */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded text-sm">EXTINTA</span>
                Antiga 24ª Zona Eleitoral
              </h3>
              <p className="text-[var(--text-secondary)] mb-3">
                Esta zona cobria grandes áreas rurais e distritos. Os eleitores foram transferidos para a <strong className="text-green-500">6ª Zona Eleitoral</strong>.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      <th className="text-left p-3 font-semibold">Localidade Original</th>
                      <th className="text-left p-3 font-semibold">Novo Local de Votação</th>
                      <th className="text-left p-3 font-semibold">Endereço</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rezoneamento24.map((item, idx) => (
                      <tr key={idx} className="border-b border-[var(--border-color)]">
                        <td className="p-3">{item.localidadeOriginal}</td>
                        <td className="p-3">{item.novoLocal}</td>
                        <td className="p-3 text-[var(--text-secondary)]">{item.endereco}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Seção Todas as Zonas */}
      <div className="card">
        <button
          onClick={() => toggleSection('todas-zonas')}
          className="w-full p-4 flex items-center justify-between hover:bg-[var(--bg-secondary)]/50"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[var(--accent-color)]" />
            <span className="font-semibold">Todas as Zonas Eleitorais de Rondônia</span>
          </div>
          {expandedSection === 'todas-zonas' ? <ChevronUp /> : <ChevronDown />}
        </button>
        
        {expandedSection === 'todas-zonas' && (
          <div className="p-4 pt-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left p-3 font-semibold">Zona</th>
                    <th className="text-left p-3 font-semibold">Municípios Atendidos</th>
                    <th className="text-center p-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {zonasAtivas.map(zona => (
                    <tr key={zona.zona} className="border-b border-[var(--border-color)]">
                      <td className="p-3 font-medium">{zona.zona}ª</td>
                      <td className="p-3">{zona.municipios.join(', ')}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded text-sm">
                          Ativa
                        </span>
                      </td>
                    </tr>
                  ))}
                  {zonasExtintas.map(zona => (
                    <tr key={zona} className="border-b border-[var(--border-color)] opacity-60">
                      <td className="p-3 font-medium">{zona}ª</td>
                      <td className="p-3 text-[var(--text-secondary)]">-</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded text-sm">
                          Extinta
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Fonte dos dados */}
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Fonte dos Dados</p>
            <p className="text-sm text-[var(--text-secondary)]">
              Tribunal Superior Eleitoral (TSE) e Tribunal Regional Eleitoral de Rondônia (TRE-RO).
              Dados baseados nos boletins de urna oficiais das eleições de 2022 e 2024.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
