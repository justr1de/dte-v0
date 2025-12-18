import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, RefreshCw, Download, Filter, ThermometerSun, TrendingUp, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';

// Interface baseada no retorno da RPC documentada
interface DadosEleitorais {
  cd_municipio: number;
  nm_municipio: string;
  total_votos: number;
  total_aptos: number;
  total_comparecimento: number;
  total_abstencoes: number;
  participacao: number;
  abstencao: number;
}

export default function MapasCalor() {
  const [dados, setDados] = useState<DadosEleitorais[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxVotos, setMaxVotos] = useState(0);
  const [filtroAno, setFiltroAno] = useState<number>(2024);
  const [filtroTurno, setFiltroTurno] = useState<number>(1);
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('todos');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 18; // 6 colunas x 3 linhas

  useEffect(() => {
    fetchDados();
  }, [filtroAno, filtroTurno]);

  async function fetchDados() {
    try {
      setLoading(true);
      // RPC documentada na página 7 do PDF
      const { data, error } = await supabase
        .rpc('get_mapa_eleitoral', { p_ano: filtroAno, p_turno: filtroTurno });

      if (error) throw error;

      if (data) {
        // Ordena por total de votos para o grid ficar organizado do "mais quente" para o "mais frio"
        const dadosOrdenados = data.sort((a: DadosEleitorais, b: DadosEleitorais) => b.total_votos - a.total_votos);
        
        // Encontra o maior valor para calcular a escala de cor (0 a 100%)
        const max = Math.max(...data.map((d: DadosEleitorais) => d.total_votos));
        
        setMaxVotos(max);
        setDados(dadosOrdenados);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  // Função para gerar a cor baseada na intensidade (Heatmap Logic)
  const getHeatColor = (valor: number, max: number) => {
    const ratio = valor / max;
    
    // Escala de cor: 
    // < 10% (Muito Frio - Cinza/Azul Claro)
    // > 80% (Muito Quente - Vermelho Intenso)
    if (ratio > 0.8) return 'bg-red-600 text-white border-red-700';
    if (ratio > 0.6) return 'bg-orange-500 text-white border-orange-600';
    if (ratio > 0.4) return 'bg-yellow-400 text-black border-yellow-500';
    if (ratio > 0.2) return 'bg-blue-300 text-black border-blue-400';
    return 'bg-slate-200 text-slate-700 border-slate-300';
  };

  // Filtrar dados
  const dadosFiltrados = filtroMunicipio === 'todos' 
    ? dados 
    : dados.filter(m => m.nm_municipio === filtroMunicipio);

  // Paginação
  const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina);
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const indiceFim = indiceInicio + itensPorPagina;
  const dadosPaginados = dadosFiltrados.slice(indiceInicio, indiceFim);

  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroMunicipio, filtroAno, filtroTurno]);

  // Estatísticas
  const totalVotos = dados.reduce((acc, m) => acc + m.total_votos, 0);
  const totalEleitores = dados.reduce((acc, m) => acc + m.total_aptos, 0);
  const participacaoMedia = totalEleitores > 0 
    ? (dados.reduce((acc, m) => acc + m.total_comparecimento, 0) / totalEleitores) * 100 
    : 0;

  // Exportar CSV
  const exportarCSV = () => {
    const headers = ['#', 'Município', 'Total Votos', 'Eleitores Aptos', 'Participação (%)', 'Abstenção (%)'];
    const rows = dadosFiltrados.map((m, i) => [
      i + 1,
      m.nm_municipio,
      m.total_votos,
      m.total_aptos,
      m.participacao.toFixed(2),
      m.abstencao.toFixed(2)
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mapa_calor_ro_${filtroAno}_turno${filtroTurno}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ThermometerSun className="w-7 h-7 text-[var(--accent-color)]" />
            Mapa de Calor: Concentração de Votos
          </h1>
          <p className="text-[var(--text-secondary)]">
            Visualização da intensidade de votação por município - Eleições {filtroAno}
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={filtroAno}
            onChange={(e) => setFiltroAno(Number(e.target.value))}
            className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
          >
            <option value={2024}>2024</option>
            <option value={2022}>2022</option>
          </select>
          <select
            value={filtroTurno}
            onChange={(e) => setFiltroTurno(Number(e.target.value))}
            className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)]"
          >
            <option value={1}>1º Turno</option>
            <option value={2}>2º Turno</option>
          </select>
          <button
            onClick={fetchDados}
            className="px-4 py-2 rounded-lg bg-[var(--accent-color)] text-white flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Total de Votos</p>
              <p className="text-xl font-bold">{totalVotos.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Eleitores Aptos</p>
              <p className="text-xl font-bold">{totalEleitores.toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Participação Média</p>
              <p className="text-xl font-bold">{participacaoMedia.toFixed(1)}%</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <MapPin className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Municípios</p>
              <p className="text-xl font-bold">{dados.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Legenda de Cores */}
      <div className="card p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-semibold">Legenda de Intensidade:</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded bg-red-600"></div>
                <span className="text-sm">Muito Alto (&gt;80%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded bg-orange-500"></div>
                <span className="text-sm">Alto (60-80%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded bg-yellow-400"></div>
                <span className="text-sm">Médio (40-60%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded bg-blue-300"></div>
                <span className="text-sm">Baixo (20-40%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 rounded bg-slate-200"></div>
                <span className="text-sm">Muito Baixo (&lt;20%)</span>
              </div>
            </div>
          </div>
          <button 
            onClick={exportarCSV}
            className="px-4 py-2 rounded-lg border border-[var(--border-color)] flex items-center gap-2 hover:bg-[var(--bg-secondary)]"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filtro de Município */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-[var(--accent-color)]" />
          <span className="font-semibold">Filtrar:</span>
          <select
            value={filtroMunicipio}
            onChange={(e) => setFiltroMunicipio(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] flex-1 md:flex-none md:w-64"
          >
            <option value="todos">Todos os municípios ({dados.length})</option>
            {dados.map(m => (
              <option key={m.cd_municipio} value={m.nm_municipio}>{m.nm_municipio}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Cards (Mapa de Calor) */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-color)]"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {dadosPaginados.map((municipio, index) => {
              const colorClass = getHeatColor(municipio.total_votos, maxVotos);
              const globalIndex = indiceInicio + index + 1;
              
              return (
                <div 
                  key={municipio.cd_municipio}
                  className={`p-4 rounded-lg shadow-sm border transition-all hover:scale-105 cursor-default ${colorClass}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold bg-black/20 px-1.5 py-0.5 rounded">
                      #{globalIndex}
                    </span>
                    {/* Ícone muda se for "quente" ou "frio" */}
                    {municipio.total_votos > (maxVotos * 0.5) && <Users size={16} className="opacity-70" />}
                  </div>
                  
                  <div className="mb-2">
                    <span className="text-xs font-semibold uppercase leading-tight block">
                      {municipio.nm_municipio}
                    </span>
                  </div>
                  
                  <div className="mt-2">
                    <span className="text-2xl font-bold block">
                      {municipio.total_votos.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs opacity-75">votos computados</span>
                  </div>

                  {/* Barra de progresso visual relativa ao maior colégio */}
                  <div className="w-full bg-black/10 h-1.5 mt-4 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-current opacity-80" 
                      style={{ width: `${(municipio.total_votos / maxVotos) * 100}%` }}
                    />
                  </div>
                  
                  <div className="mt-3 flex gap-2 text-[10px] opacity-80">
                     <span className="text-green-900">Part: {municipio.participacao?.toFixed(1) || 0}%</span>
                     <span>•</span>
                     <span className="text-red-900">Abs: {municipio.abstencao?.toFixed(1) || 0}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="card p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">
                  Mostrando {indiceInicio + 1} a {Math.min(indiceFim, dadosFiltrados.length)} de {dadosFiltrados.length} municípios
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPaginaAtual(1)}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1 rounded border border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]"
                  >
                    Primeira
                  </button>
                  <button
                    onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                    disabled={paginaAtual === 1}
                    className="p-2 rounded border border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    let pageNum;
                    if (totalPaginas <= 5) {
                      pageNum = i + 1;
                    } else if (paginaAtual <= 3) {
                      pageNum = i + 1;
                    } else if (paginaAtual >= totalPaginas - 2) {
                      pageNum = totalPaginas - 4 + i;
                    } else {
                      pageNum = paginaAtual - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPaginaAtual(pageNum)}
                        className={`px-3 py-1 rounded border ${
                          paginaAtual === pageNum
                            ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)]'
                            : 'border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="p-2 rounded border border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPaginaAtual(totalPaginas)}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1 rounded border border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]"
                  >
                    Última
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Informações sobre a visualização */}
      <div className="card p-6 bg-blue-500/10 border-blue-500/20">
        <div className="flex items-start gap-3">
          <ThermometerSun className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-500 mb-2">Sobre a Visualização</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Este mapa de calor em grid utiliza dados oficiais do TSE (Tribunal Superior Eleitoral) agregados pela função 
              <code className="mx-1 px-1 py-0.5 bg-[var(--bg-secondary)] rounded">get_mapa_eleitoral</code>.
              Os cards são ordenados do município com mais votos (mais "quente") para o com menos votos (mais "frio"),
              criando uma visualização intuitiva da concentração eleitoral em Rondônia.
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              <strong>Interpretação:</strong> Cards vermelhos/laranjas indicam municípios com alta concentração de votos,
              enquanto cards azuis/cinzas indicam menor concentração. A barra de progresso mostra a proporção relativa
              ao município com mais votos.
            </p>
            <p className="text-sm text-[var(--text-secondary)] mt-2">
              <strong>Fonte dos dados:</strong> Portal de Dados Abertos do TSE - Boletins de Urna consolidados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
