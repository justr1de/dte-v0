import { useState, useEffect, useMemo } from 'react'
import { 
  BarChart3, TrendingUp, RefreshCw, Download, Users, Award, 
  MapPin, Building2, Filter, ChevronDown, Trophy, Medal, Search
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts'
import { supabase } from '../lib/supabase'

// Interfaces
interface PrefeitorDetalhado {
  nm_votavel: string
  nm_municipio: string
  nm_partido: string
  total_votos: number
}

interface VereadorDetalhado {
  nm_votavel: string
  nm_municipio: string
  nm_partido: string
  total_votos: number
}

interface CandidatoTSE {
  nm_urna_candidato: string
  nm_municipio: string
  sg_partido: string
  nm_partido: string
  ds_cargo: string
  ds_sit_tot_turno: string
  status: string
}

// Cores por partido
const coresPartidos: Record<string, string> = {
  'PT': '#CC0000',
  'PL': '#1E3A8A',
  'UNIÃO BRASIL': '#0066CC',
  'UNIÃO': '#0066CC',
  'MDB': '#00A859',
  'PP': '#0066CC',
  'PSD': '#FF6B00',
  'PSDB': '#0080FF',
  'PDT': '#FF0000',
  'PODEMOS': '#6B21A8',
  'PODE': '#6B21A8',
  'REPUBLICANOS': '#1E40AF',
  'PSB': '#FFD700',
  'CIDADANIA': '#E91E63',
  'SOLIDARIEDADE': '#FF5722',
  'PSOL': '#FFEB3B',
  'PCdoB': '#B71C1C',
  'REDE': '#00BCD4',
  'NOVO': '#FF6F00',
  'AVANTE': '#FF9800',
  'PMB': '#9C27B0',
  'DC': '#4CAF50',
  'PATRIOTA': '#2E7D32',
  'PROS': '#F44336',
  'PTB': '#000000',
  'PSC': '#4CAF50',
  'default': '#6B7280'
}

function getCorPartido(partido: string): string {
  if (!partido) return coresPartidos['default']
  const partidoUpper = partido.toUpperCase()
  for (const [key, color] of Object.entries(coresPartidos)) {
    if (partidoUpper.includes(key)) return color
  }
  return coresPartidos['default']
}

// Lista de municípios de Rondônia
const MUNICIPIOS_RO = [
  "ALTA FLORESTA D'OESTE", "ALTO ALEGRE DOS PARECIS", "ALTO PARAÍSO", "ALVORADA DO OESTE",
  "ARIQUEMES", "BURITIS", "CABIXI", "CACAULÂNDIA", "CACOAL", "CAMPO NOVO DE RONDÔNIA",
  "CANDEIAS DO JAMARI", "CASTANHEIRAS", "CEREJEIRAS", "CHUPINGUAIA", "COLORADO DO OESTE",
  "CORUMBIARA", "COSTA MARQUES", "CUJUBIM", "ESPIGÃO DO OESTE", "GOVERNADOR JORGE TEIXEIRA",
  "GUAJARÁ-MIRIM", "ITAPUÃ DO OESTE", "JARU", "JI-PARANÁ", "MACHADINHO D'OESTE",
  "MINISTRO ANDREAZZA", "MIRANTE DA SERRA", "MONTE NEGRO", "NOVA BRASILÂNDIA D'OESTE",
  "NOVA MAMORÉ", "NOVA UNIÃO", "NOVO HORIZONTE DO OESTE", "OURO PRETO DO OESTE",
  "PARECIS", "PIMENTA BUENO", "PIMENTEIRAS DO OESTE", "PORTO VELHO", "PRESIDENTE MÉDICI",
  "PRIMAVERA DE RONDÔNIA", "RIO CRESPO", "ROLIM DE MOURA", "SANTA LUZIA D'OESTE",
  "SERINGUEIRAS", "SÃO FELIPE D'OESTE", "SÃO FRANCISCO DO GUAPORÉ", "SÃO MIGUEL DO GUAPORÉ",
  "TEIXEIRÓPOLIS", "THEOBROMA", "URUPÁ", "VALE DO ANARI", "VALE DO PARAÍSO", "VILHENA"
]

export default function Resultados() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filtros
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('TODOS')
  const [filtroCargo, setFiltroCargo] = useState<'PREFEITO' | 'VEREADOR'>('PREFEITO')
  const [searchMunicipio, setSearchMunicipio] = useState('')
  const [showMunicipioDropdown, setShowMunicipioDropdown] = useState(false)
  
  // Dados
  const [prefeitos, setPrefeitos] = useState<PrefeitorDetalhado[]>([])
  const [vereadores, setVereadores] = useState<VereadorDetalhado[]>([])
  const [candidatosTSE, setCandidatosTSE] = useState<CandidatoTSE[]>([])

  // Buscar dados
  const fetchDados = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Buscar prefeitos 2024
      const { data: prefeitosData, error: prefError } = await supabase
        .from('votos_prefeitos_2024_detalhado')
        .select('*')
        .order('total_votos', { ascending: false })
      
      if (prefError) throw prefError
      setPrefeitos(prefeitosData || [])

      // Buscar vereadores 2024
      const { data: vereadoresData, error: verError } = await supabase
        .from('votos_vereadores_2024_detalhado')
        .select('*')
        .order('total_votos', { ascending: false })
      
      if (verError) throw verError
      setVereadores(vereadoresData || [])

      // Buscar candidatos TSE para status de eleito
      const { data: tseData, error: tseError } = await supabase
        .from('candidatos_tse')
        .select('nm_urna_candidato, nm_municipio, sg_partido, nm_partido, ds_cargo, ds_sit_tot_turno, status')
        .in('ds_cargo', ['PREFEITO', 'VEREADOR'])
      
      if (tseError) throw tseError
      setCandidatosTSE(tseData || [])

    } catch (err: any) {
      console.error('Erro ao buscar dados:', err)
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDados()
  }, [])

  // Filtrar municípios para dropdown
  const municipiosFiltrados = useMemo(() => {
    if (!searchMunicipio) return MUNICIPIOS_RO
    return MUNICIPIOS_RO.filter(m => 
      m.toLowerCase().includes(searchMunicipio.toLowerCase())
    )
  }, [searchMunicipio])

  // Verificar se candidato foi eleito
  const isEleito = (nome: string, municipio: string, cargo: string): boolean => {
    const candidato = candidatosTSE.find(c => 
      c.nm_urna_candidato?.toUpperCase() === nome?.toUpperCase() &&
      c.nm_municipio?.toUpperCase() === municipio?.toUpperCase() &&
      c.ds_cargo === cargo
    )
    return candidato?.ds_sit_tot_turno === 'ELEITO' || candidato?.status === 'eleito'
  }

  // Dados filtrados
  const dadosFiltrados = useMemo(() => {
    const dados = filtroCargo === 'PREFEITO' ? prefeitos : vereadores
    
    if (filtroMunicipio === 'TODOS') {
      return dados
    }
    
    return dados.filter(d => d.nm_municipio === filtroMunicipio)
  }, [prefeitos, vereadores, filtroMunicipio, filtroCargo])

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    const totalVotos = dadosFiltrados.reduce((acc, d) => acc + d.total_votos, 0)
    const totalCandidatos = dadosFiltrados.length
    const lider = dadosFiltrados[0]
    
    // Distribuição por partido
    const porPartido: Record<string, number> = {}
    dadosFiltrados.forEach(d => {
      const partido = d.nm_partido || 'Outros'
      porPartido[partido] = (porPartido[partido] || 0) + d.total_votos
    })
    
    const distribuicaoPartido = Object.entries(porPartido)
      .map(([partido, votos]) => ({
        partido,
        votos,
        percentual: totalVotos > 0 ? ((votos / totalVotos) * 100).toFixed(1) : '0'
      }))
      .sort((a, b) => b.votos - a.votos)
      .slice(0, 10)

    return {
      totalVotos,
      totalCandidatos,
      lider,
      distribuicaoPartido
    }
  }, [dadosFiltrados])

  // Candidatos eleitos do município
  const candidatosEleitos = useMemo(() => {
    if (filtroMunicipio === 'TODOS') return []
    
    return dadosFiltrados.filter(d => 
      isEleito(d.nm_votavel, d.nm_municipio, filtroCargo)
    )
  }, [dadosFiltrados, filtroMunicipio, filtroCargo, candidatosTSE])

  // Exportar CSV
  const exportarCSV = () => {
    const headers = ['Posição', 'Candidato', 'Município', 'Partido', 'Votos', 'Percentual', 'Eleito']
    const totalVotos = dadosFiltrados.reduce((acc, d) => acc + d.total_votos, 0)
    
    const rows = dadosFiltrados.map((d, i) => [
      i + 1,
      d.nm_votavel,
      d.nm_municipio,
      d.nm_partido || '-',
      d.total_votos,
      `${totalVotos > 0 ? ((d.total_votos / totalVotos) * 100).toFixed(2) : 0}%`,
      isEleito(d.nm_votavel, d.nm_municipio, filtroCargo) ? 'SIM' : 'NÃO'
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `resultados_${filtroCargo.toLowerCase()}_${filtroMunicipio}_2024.csv`
    link.click()
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Resultados Eleitorais 2024</h1>
          <p className="text-[var(--text-secondary)]">
            Análise detalhada por município - Prefeitos e Vereadores
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDados}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
          <button
            onClick={exportarCSV}
            disabled={loading || dadosFiltrados.length === 0}
            className="flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-emerald-500" />
          <h2 className="font-semibold">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro de Cargo */}
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Cargo</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFiltroCargo('PREFEITO')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  filtroCargo === 'PREFEITO' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <Award className="w-4 h-4" />
                Prefeito
              </button>
              <button
                onClick={() => setFiltroCargo('VEREADOR')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  filtroCargo === 'VEREADOR' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
                }`}
              >
                <Users className="w-4 h-4" />
                Vereador
              </button>
            </div>
          </div>

          {/* Filtro de Município */}
          <div className="relative">
            <label className="block text-sm text-[var(--text-secondary)] mb-2">Município</label>
            <div className="relative">
              <button
                onClick={() => setShowMunicipioDropdown(!showMunicipioDropdown)}
                className="w-full flex items-center justify-between px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  {filtroMunicipio === 'TODOS' ? 'Todos os Municípios (52)' : filtroMunicipio}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showMunicipioDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showMunicipioDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-lg max-h-80 overflow-hidden">
                  <div className="p-2 border-b border-[var(--border-color)]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        placeholder="Buscar município..."
                        value={searchMunicipio}
                        onChange={(e) => setSearchMunicipio(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <button
                      onClick={() => {
                        setFiltroMunicipio('TODOS')
                        setShowMunicipioDropdown(false)
                        setSearchMunicipio('')
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-[var(--bg-secondary)] transition-colors ${
                        filtroMunicipio === 'TODOS' ? 'bg-emerald-500/10 text-emerald-500' : ''
                      }`}
                    >
                      Todos os Municípios (52)
                    </button>
                    {municipiosFiltrados.map(municipio => (
                      <button
                        key={municipio}
                        onClick={() => {
                          setFiltroMunicipio(municipio)
                          setShowMunicipioDropdown(false)
                          setSearchMunicipio('')
                        }}
                        className={`w-full px-4 py-2 text-left hover:bg-[var(--bg-secondary)] transition-colors ${
                          filtroMunicipio === municipio ? 'bg-emerald-500/10 text-emerald-500' : ''
                        }`}
                      >
                        {municipio}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
      ) : (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-sm text-[var(--text-secondary)]">Total de Votos</p>
              <p className="text-2xl font-bold text-emerald-500">
                {estatisticas.totalVotos.toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-[var(--text-secondary)]">Candidatos</p>
              <p className="text-2xl font-bold text-blue-500">
                {estatisticas.totalCandidatos}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-[var(--text-secondary)]">Mais Votado</p>
              <p className="text-lg font-bold text-amber-500 truncate">
                {estatisticas.lider?.nm_votavel || '-'}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-[var(--text-secondary)]">
                {filtroMunicipio !== 'TODOS' ? 'Eleitos' : 'Municípios'}
              </p>
              <p className="text-2xl font-bold text-purple-500">
                {filtroMunicipio !== 'TODOS' ? candidatosEleitos.length : '52'}
              </p>
            </div>
          </div>

          {/* Seção de Eleitos (quando município selecionado) */}
          {filtroMunicipio !== 'TODOS' && candidatosEleitos.length > 0 && (
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-semibold">
                  {filtroCargo === 'PREFEITO' ? 'Prefeito Eleito' : 'Vereadores Eleitos'} - {filtroMunicipio}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {candidatosEleitos.map((candidato, index) => (
                  <div 
                    key={index}
                    className="p-4 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20">
                        {filtroCargo === 'PREFEITO' ? (
                          <Award className="w-5 h-5 text-amber-500" />
                        ) : (
                          <Medal className="w-5 h-5 text-amber-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{candidato.nm_votavel}</p>
                        <p className="text-sm text-[var(--text-secondary)]">{candidato.nm_partido}</p>
                        <p className="text-lg font-bold text-emerald-500 mt-1">
                          {candidato.total_votos.toLocaleString('pt-BR')} votos
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {estatisticas.totalVotos > 0 
                            ? ((candidato.total_votos / estatisticas.totalVotos) * 100).toFixed(1) 
                            : 0}% dos votos
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráficos e Tabela */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Barras - Top 10 */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                Top 10 - {filtroCargo === 'PREFEITO' ? 'Prefeitos' : 'Vereadores'}
                {filtroMunicipio !== 'TODOS' && ` de ${filtroMunicipio}`}
              </h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosFiltrados.slice(0, 10)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                    <XAxis 
                      type="number" 
                      stroke="var(--text-secondary)" 
                      tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}K` : value}
                    />
                    <YAxis 
                      dataKey="nm_votavel" 
                      type="category" 
                      stroke="var(--text-secondary)" 
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'var(--bg-card)', 
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Votos']}
                    />
                    <Bar dataKey="total_votos" radius={[0, 4, 4, 0]}>
                      {dadosFiltrados.slice(0, 10).map((entry, index) => (
                        <Cell key={index} fill={getCorPartido(entry.nm_partido)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Distribuição por Partido */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-purple-500" />
                Distribuição por Partido
              </h2>
              <div className="space-y-3">
                {estatisticas.distribuicaoPartido.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getCorPartido(item.partido) }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium truncate">{item.partido}</span>
                        <span className="text-sm text-[var(--text-muted)]">{item.percentual}%</span>
                      </div>
                      <div className="w-full bg-[var(--bg-secondary)] rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all"
                          style={{ 
                            width: `${Math.min(parseFloat(item.percentual), 100)}%`,
                            backgroundColor: getCorPartido(item.partido)
                          }}
                        />
                      </div>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {item.votos.toLocaleString('pt-BR')} votos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabela Completa */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                Ranking Completo - {dadosFiltrados.length} candidatos
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">#</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">Candidato</th>
                    {filtroMunicipio === 'TODOS' && (
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">Município</th>
                    )}
                    <th className="text-left py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">Partido</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">Votos</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">%</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold text-[var(--text-secondary)]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosFiltrados.slice(0, 50).map((candidato, index) => {
                    const percentual = estatisticas.totalVotos > 0 
                      ? ((candidato.total_votos / estatisticas.totalVotos) * 100).toFixed(2)
                      : '0.00'
                    const eleito = isEleito(candidato.nm_votavel, candidato.nm_municipio, filtroCargo)
                    
                    return (
                      <tr 
                        key={index}
                        className={`border-b border-[var(--border-color)] hover:bg-[var(--bg-secondary)] transition-colors ${
                          eleito ? 'bg-emerald-500/5' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className={`font-bold ${index < 3 ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}>
                            {index + 1}º
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">{candidato.nm_votavel}</span>
                        </td>
                        {filtroMunicipio === 'TODOS' && (
                          <td className="py-3 px-4 text-sm text-[var(--text-secondary)]">
                            {candidato.nm_municipio}
                          </td>
                        )}
                        <td className="py-3 px-4">
                          <span 
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{ 
                              backgroundColor: `${getCorPartido(candidato.nm_partido)}20`,
                              color: getCorPartido(candidato.nm_partido)
                            }}
                          >
                            {candidato.nm_partido || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {candidato.total_votos.toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 text-right text-[var(--text-secondary)]">
                          {percentual}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          {eleito ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-500 rounded text-xs font-medium">
                              <Trophy className="w-3 h-3" />
                              ELEITO
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {dadosFiltrados.length > 50 && (
              <div className="mt-4 text-center text-sm text-[var(--text-muted)]">
                Mostrando 50 de {dadosFiltrados.length} candidatos. Exporte o CSV para ver todos.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
