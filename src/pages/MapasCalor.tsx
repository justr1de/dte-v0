import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, RefreshCw, Download, Filter, ThermometerSun, TrendingUp, MapPin, ChevronLeft, ChevronRight, LayoutGrid, List } from 'lucide-react';

// Interface para dados agregados por município
interface DadosMunicipio {
  cd_municipio: number;
  nm_municipio: string;
  total_votos: number;
  total_aptos: number;
  total_comparecimento: number;
  total_abstencoes: number;
  participacao: number;
  abstencao: number;
}

// Interface para dados detalhados por seção
interface DadosSecao {
  cd_municipio: number;
  nm_municipio: string;
  nr_zona: number;
  nr_secao: number;
  total_votos: number;
  qt_aptos: number;
  qt_comparecimento: number;
  qt_abstencoes: number;
  participacao: number;
  abstencao: number;
}

export default function MapasCalor() {
  // Estados para dados por município
  const [dadosMunicipios, setDadosMunicipios] = useState<DadosMunicipio[]>([]);
  // Estados para dados por seção
  const [dadosSecoes, setDadosSecoes] = useState<DadosSecao[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [maxVotos, setMaxVotos] = useState(0);
  const [filtroAno, setFiltroAno] = useState<number>(2024);
  const [filtroTurno, setFiltroTurno] = useState<number>(1);
  const [filtroMunicipio, setFiltroMunicipio] = useState<string>('todos');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [abaAtiva, setAbaAtiva] = useState<'municipio' | 'secao'>('municipio');
  
  const itensPorPaginaMunicipio = 18;
  const itensPorPaginaSecao = 20;

  useEffect(() => {
    fetchDados();
  }, [filtroAno, filtroTurno]);

  useEffect(() => {
    // Buscar seções quando mudar o filtro de município na aba de seções
    if (abaAtiva === 'secao') {
      fetchDadosSecoes();
    }
  }, [filtroMunicipio, abaAtiva, filtroAno, filtroTurno]);

  async function fetchDados() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_mapa_eleitoral', { p_ano: filtroAno, p_turno: filtroTurno });

      if (error) throw error;

      if (data) {
        const dadosOrdenados = data.sort((a: DadosMunicipio, b: DadosMunicipio) => b.total_votos - a.total_votos);
        const max = Math.max(...data.map((d: DadosMunicipio) => d.total_votos));
        setMaxVotos(max);
        setDadosMunicipios(dadosOrdenados);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDadosSecoes() {
    try {
      setLoading(true);
      const municipioId = filtroMunicipio === 'todos' ? null : 
        dadosMunicipios.find(m => m.nm_municipio === filtroMunicipio)?.cd_municipio || null;
      
      const { data, error } = await supabase
        .rpc('get_mapa_eleitoral_secoes', { 
          p_ano: filtroAno, 
          p_turno: filtroTurno,
          p_municipio: municipioId
        });

      if (error) throw error;

      if (data) {
        setDadosSecoes(data);
      }
    } catch (error) {
      console.error("Erro ao buscar dados de seções:", error);
    } finally {
      setLoading(false);
    }
  }

  // Função para gerar a cor baseada na intensidade
  const getHeatColor = (valor: number, max: number) => {
    const ratio = valor / max;
    if (ratio > 0.8) return 'bg-red-600 text-white border-red-700';
    if (ratio > 0.6) return 'bg-orange-500 text-white border-orange-600';
    if (ratio > 0.4) return 'bg-yellow-400 text-black border-yellow-500';
    if (ratio > 0.2) return 'bg-blue-300 text-black border-blue-400';
    return 'bg-slate-200 text-slate-700 border-slate-300';
  };

  // Filtrar dados de municípios
  const dadosFiltradosMunicipios = filtroMunicipio === 'todos' 
    ? dadosMunicipios 
    : dadosMunicipios.filter(m => m.nm_municipio === filtroMunicipio);

  // Paginação para municípios
  const totalPaginasMunicipios = Math.ceil(dadosFiltradosMunicipios.length / itensPorPaginaMunicipio);
  const indiceInicioMunicipios = (paginaAtual - 1) * itensPorPaginaMunicipio;
  const indiceFimMunicipios = indiceInicioMunicipios + itensPorPaginaMunicipio;
  const dadosPaginadosMunicipios = dadosFiltradosMunicipios.slice(indiceInicioMunicipios, indiceFimMunicipios);

  // Paginação para seções
  const totalPaginasSecoes = Math.ceil(dadosSecoes.length / itensPorPaginaSecao);
  const indiceInicioSecoes = (paginaAtual - 1) * itensPorPaginaSecao;
  const indiceFimSecoes = indiceInicioSecoes + itensPorPaginaSecao;
  const dadosPaginadosSecoes = dadosSecoes.slice(indiceInicioSecoes, indiceFimSecoes);

  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroMunicipio, filtroAno, filtroTurno, abaAtiva]);

  // Estatísticas
  const totalVotos = dadosMunicipios.reduce((acc, m) => acc + m.total_votos, 0);
  const totalEleitores = dadosMunicipios.reduce((acc, m) => acc + m.total_aptos, 0);
  const participacaoMedia = totalEleitores > 0 
    ? (dadosMunicipios.reduce((acc, m) => acc + m.total_comparecimento, 0) / totalEleitores) * 100 
    : 0;

  // Exportar CSV
  const exportarCSV = () => {
    if (abaAtiva === 'municipio') {
      const headers = ['#', 'Município', 'Total Votos', 'Eleitores Aptos', 'Participação (%)', 'Abstenção (%)'];
      const rows = dadosFiltradosMunicipios.map((m, i) => [
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
      link.download = `mapa_calor_municipios_${filtroAno}_turno${filtroTurno}.csv`;
      link.click();
    } else {
      const headers = ['#', 'Município', 'Zona', 'Seção', 'Total Votos', 'Eleitores Aptos', 'Participação (%)', 'Abstenção (%)'];
      const rows = dadosSecoes.map((s, i) => [
        i + 1,
        s.nm_municipio,
        s.nr_zona,
        s.nr_secao,
        s.total_votos,
        s.qt_aptos,
        s.participacao.toFixed(2),
        s.abstencao.toFixed(2)
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `mapa_calor_secoes_${filtroAno}_turno${filtroTurno}.csv`;
      link.click();
    }
  };

  // Componente de Paginação
  const Paginacao = ({ totalPaginas, totalItens, itensPorPagina }: { totalPaginas: number, totalItens: number, itensPorPagina: number }) => {
    const indiceInicio = (paginaAtual - 1) * itensPorPagina + 1;
    const indiceFim = Math.min(paginaAtual * itensPorPagina, totalItens);

    const gerarNumerosPaginas = () => {
      const paginas = [];
      const maxPaginasVisiveis = 5;
      let inicio = Math.max(1, paginaAtual - Math.floor(maxPaginasVisiveis / 2));
      let fim = Math.min(totalPaginas, inicio + maxPaginasVisiveis - 1);
      if (fim - inicio + 1 < maxPaginasVisiveis) {
        inicio = Math.max(1, fim - maxPaginasVisiveis + 1);
      }
      for (let i = inicio; i <= fim; i++) {
        paginas.push(i);
      }
      return paginas;
    };

    if (totalPaginas <= 1) return null;

    return (
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
        <p className="text-sm text-[var(--text-secondary)]">
          Mostrando {indiceInicio} a {indiceFim} de {totalItens} {abaAtiva === 'municipio' ? 'municípios' : 'seções'}
        </p>
        <div className="flex items-center gap-1">
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
            className="p-1 rounded border border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {gerarNumerosPaginas().map(num => (
            <button
              key={num}
              onClick={() => setPaginaAtual(num)}
              className={`px-3 py-1 rounded border ${
                paginaAtual === num
                  ? 'bg-[var(--accent-color)] text-white border-[var(--accent-color)]'
                  : 'border-[var(--border-color)] hover:bg-[var(--bg-secondary)]'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
            disabled={paginaAtual === totalPaginas}
            className="p-1 rounded border border-[var(--border-color)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--bg-secondary)]"
          >
            <ChevronRight className="w-5 h-5" />
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
    );
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
            Visualização da intensidade de votação - Eleições {filtroAno}
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
            onClick={() => {
              fetchDados();
              if (abaAtiva === 'secao') fetchDadosSecoes();
            }}
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
              <p className="text-sm text-[var(--text-secondary)]">
                {abaAtiva === 'municipio' ? 'Municípios' : 'Seções'}
              </p>
              <p className="text-xl font-bold">
                {abaAtiva === 'municipio' ? dadosMunicipios.length : dadosSecoes.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Abas */}
      <div className="card p-1">
        <div className="flex gap-1">
          <button
            onClick={() => setAbaAtiva('municipio')}
            className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              abaAtiva === 'municipio'
                ? 'bg-[var(--accent-color)] text-white'
                : 'hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            Por Município (Agregado)
          </button>
          <button
            onClick={() => setAbaAtiva('secao')}
            className={`flex-1 px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              abaAtiva === 'secao'
                ? 'bg-[var(--accent-color)] text-white'
                : 'hover:bg-[var(--bg-secondary)]'
            }`}
          >
            <List className="w-5 h-5" />
            Por Seção (Detalhado)
          </button>
        </div>
      </div>

      {/* Legenda de Cores (apenas para aba de municípios) */}
      {abaAtiva === 'municipio' && (
        <div className="card p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-semibold">Legenda de Intensidade:</span>
              <div className="flex items-center gap-3 flex-wrap">
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
      )}

      {/* Filtro de Município */}
      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Filter className="w-5 h-5 text-[var(--accent-color)]" />
          <span className="font-semibold">Filtrar:</span>
          <select
            value={filtroMunicipio}
            onChange={(e) => setFiltroMunicipio(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] flex-1 md:flex-none md:w-64"
          >
            <option value="todos">Todos os municípios ({dadosMunicipios.length})</option>
            {dadosMunicipios.map(m => (
              <option key={m.cd_municipio} value={m.nm_municipio}>{m.nm_municipio}</option>
            ))}
          </select>
          {abaAtiva === 'secao' && (
            <button 
              onClick={exportarCSV}
              className="px-4 py-2 rounded-lg border border-[var(--border-color)] flex items-center gap-2 hover:bg-[var(--bg-secondary)]"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Conteúdo das Abas */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-color)]"></div>
        </div>
      ) : abaAtiva === 'municipio' ? (
        /* Grid de Cards (Mapa de Calor por Município) */
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {dadosPaginadosMunicipios.map((municipio, index) => {
              const colorClass = getHeatColor(municipio.total_votos, maxVotos);
              const globalIndex = indiceInicioMunicipios + index + 1;
              
              return (
                <div 
                  key={municipio.cd_municipio}
                  className={`p-4 rounded-lg shadow-sm border transition-all hover:scale-105 cursor-default ${colorClass}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold opacity-70">#{globalIndex}</span>
                    <Users className="w-4 h-4 opacity-50" />
                  </div>
                  <h3 className="font-bold text-sm mb-1 truncate" title={municipio.nm_municipio}>
                    {municipio.nm_municipio}
                  </h3>
                  <p className="text-2xl font-bold">
                    {municipio.total_votos.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs opacity-80">votos computados</p>
                  
                  {/* Barra de progresso relativa */}
                  <div className="mt-2 h-1 bg-black/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white/50 rounded-full"
                      style={{ width: `${(municipio.total_votos / maxVotos) * 100}%` }}
                    />
                  </div>
                  
                  <div className="mt-2 flex justify-between text-xs opacity-80">
                    <span>Part: {municipio.participacao.toFixed(1)}%</span>
                    <span>Abs: {municipio.abstencao.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Paginacao 
            totalPaginas={totalPaginasMunicipios} 
            totalItens={dadosFiltradosMunicipios.length}
            itensPorPagina={itensPorPaginaMunicipio}
          />
        </>
      ) : (
        /* Tabela de Seções (Detalhado) */
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[var(--bg-secondary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Município</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Zona</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Seção</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Total Votos</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Eleitores Aptos</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Comparecimento</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Participação</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Abstenção</th>
                  </tr>
                </thead>
                <tbody>
                  {dadosPaginadosSecoes.map((secao, index) => {
                    const globalIndex = indiceInicioSecoes + index + 1;
                    return (
                      <tr 
                        key={`${secao.cd_municipio}-${secao.nr_zona}-${secao.nr_secao}`}
                        className={`border-t border-[var(--border-color)] ${index % 2 === 0 ? '' : 'bg-[var(--bg-secondary)]/30'} hover:bg-[var(--bg-secondary)]/50`}
                      >
                        <td className="px-4 py-3 text-sm text-[var(--text-secondary)]">{globalIndex}</td>
                        <td className="px-4 py-3 text-sm font-medium">{secao.nm_municipio}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-600 font-medium">
                            {secao.nr_zona}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-600 font-medium">
                            {secao.nr_secao}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-bold">
                          {secao.total_votos.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {secao.qt_aptos.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {secao.qt_comparecimento.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className="text-green-600 font-medium">{secao.participacao.toFixed(1)}%</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span className="text-red-500">{secao.abstencao.toFixed(1)}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <Paginacao 
            totalPaginas={totalPaginasSecoes} 
            totalItens={dadosSecoes.length}
            itensPorPagina={itensPorPaginaSecao}
          />
        </>
      )}

      {/* Rodapé informativo */}
      <div className="card p-4 bg-blue-500/5 border-blue-500/20">
        <h3 className="font-semibold text-blue-600 mb-2 flex items-center gap-2">
          <ThermometerSun className="w-5 h-5" />
          Sobre a Visualização
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">
          {abaAtiva === 'municipio' ? (
            <>
              Este mapa de calor em grid utiliza dados oficiais do TSE (Tribunal Superior Eleitoral) agregados por município.
              Os cards são ordenados do município com mais votos (mais "quente") para o com menos votos (mais "frio"),
              criando uma visualização intuitiva da concentração eleitoral em Rondônia.
            </>
          ) : (
            <>
              Esta visualização detalhada mostra os dados de cada seção eleitoral individualmente.
              Você pode filtrar por município para ver apenas as seções de uma cidade específica.
              Os dados incluem zona, seção, votos, eleitores aptos, comparecimento, participação e abstenção.
            </>
          )}
        </p>
        <p className="text-sm text-[var(--text-secondary)] mt-2">
          <strong>Fonte dos dados:</strong> Portal de Dados Abertos do TSE - Boletins de Urna consolidados.
        </p>
      </div>
    </div>
  );
}
