// src/lib/coordenadasRO.ts
// Coordenadas geográficas dos 52 municípios de Rondônia

export const COORDENADAS_RO: Record<string, [number, number]> = {
  // Principais Polos
  "PORTO VELHO": [-8.7612, -63.9039],
  "JI-PARANÁ": [-10.8739, -61.9519],
  "ARIQUEMES": [-9.9133, -63.0408],
  "CACOAL": [-11.4386, -61.4472],
  "VILHENA": [-12.7408, -60.1264],

  // Demais Municípios (Ordem Alfabética)
  "ALTA FLORESTA D'OESTE": [-11.9355, -61.9998],
  "ALTO ALEGRE DOS PARECIS": [-12.1319, -61.8531],
  "ALTO PARAÍSO": [-9.7127, -63.3188],
  "ALVORADA D'OESTE": [-11.3441, -62.2907],
  "BURITIS": [-10.2037, -63.8315],
  "CABIXI": [-13.4997, -60.5443],
  "CACAULÂNDIA": [-10.3382, -62.9056],
  "CAMPO NOVO DE RONDÔNIA": [-10.5700, -63.6293],
  "CANDEIAS DO JAMARI": [-8.7850, -63.7001],
  "CASTANHEIRAS": [-11.4243, -61.9472],
  "CEREJEIRAS": [-13.1870, -60.8168],
  "CHUPINGUAIA": [-12.5606, -60.8947],
  "COLORADO DO OESTE": [-13.1235, -60.5485],
  "CORUMBIARA": [-13.3417, -60.9525],
  "COSTA MARQUES": [-12.4367, -64.2280],
  "CUJUBIM": [-9.3639, -62.5843],
  "ESPIGÃO D'OESTE": [-11.5283, -61.0252],
  "GOVERNADOR JORGE TEIXEIRA": [-10.6120, -62.7242],
  "GUAJARÁ-MIRIM": [-10.7768, -65.3291],
  "ITAPUÃ DO OESTE": [-9.1969, -63.1815],
  "JARU": [-10.4358, -62.4717],
  "MACHADINHO D'OESTE": [-9.4253, -61.9818],
  "MINISTRO ANDREAZZA": [-11.1962, -61.5173],
  "MIRANTE DA SERRA": [-11.0287, -62.6723],
  "MONTE NEGRO": [-10.2974, -63.3082],
  "NOVA BRASILÂNDIA D'OESTE": [-11.7214, -62.3082],
  "NOVA MAMORÉ": [-10.4136, -65.3347],
  "NOVA UNIÃO": [-10.9059, -62.5591],
  "NOVO HORIZONTE DO OESTE": [-11.6967, -61.9961],
  "OURO PRETO DO OESTE": [-10.7481, -62.2159],
  "PARECIS": [-12.1798, -61.5983],
  "PIMENTA BUENO": [-11.6775, -61.1835],
  "PIMENTEIRAS DO OESTE": [-13.4823, -60.6032],
  "PRESIDENTE MÉDICI": [-11.1751, -61.9015],
  "PRIMAVERA DE RONDÔNIA": [-11.8306, -61.3235],
  "RIO CRESPO": [-9.7055, -62.9090],
  "ROLIM DE MOURA": [-11.7271, -61.7806],
  "SANTA LUZIA D'OESTE": [-11.9079, -61.7770],
  "SÃO FELIPE D'OESTE": [-11.9041, -61.5036],
  "SÃO FRANCISCO DO GUAPORÉ": [-12.0526, -63.5686],
  "SÃO MIGUEL DO GUAPORÉ": [-11.6933, -62.7153],
  "SERINGUEIRAS": [-11.7928, -63.0292],
  "TEIXEIRÓPOLIS": [-10.9254, -62.2474],
  "THEOBROMA": [-10.2435, -62.3516],
  "URUPÁ": [-11.1293, -62.3619],
  "VALE DO ANARI": [-9.8660, -62.1764],
  "VALE DO PARAÍSO": [-10.4484, -62.1332]
};

// Centro geográfico de Rondônia para inicialização do mapa
export const CENTRO_RONDONIA: [number, number] = [-10.9472, -62.8278];

// Função auxiliar para normalizar nomes de municípios
export function normalizarNomeMunicipio(nome: string): string {
  return nome
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .trim();
}

// Função para obter coordenadas de um município
export function getCoordenadas(municipio: string): [number, number] | null {
  const nomeNormalizado = municipio.toUpperCase().trim();
  
  // Tenta encontrar diretamente
  if (COORDENADAS_RO[nomeNormalizado]) {
    return COORDENADAS_RO[nomeNormalizado];
  }
  
  // Tenta encontrar com variações comuns
  const variacoes: Record<string, string> = {
    "JI-PARANA": "JI-PARANÁ",
    "JIPARANA": "JI-PARANÁ",
    "ALTA FLORESTA DOESTE": "ALTA FLORESTA D'OESTE",
    "ALVORADA DOESTE": "ALVORADA D'OESTE",
    "ESPIGAO DOESTE": "ESPIGÃO D'OESTE",
    "NOVA BRASILANDIA DOESTE": "NOVA BRASILÂNDIA D'OESTE",
    "NOVO HORIZONTE DOESTE": "NOVO HORIZONTE DO OESTE",
    "OURO PRETO DOESTE": "OURO PRETO DO OESTE",
    "SANTA LUZIA DOESTE": "SANTA LUZIA D'OESTE",
    "SAO FELIPE DOESTE": "SÃO FELIPE D'OESTE",
    "SAO FRANCISCO DO GUAPORE": "SÃO FRANCISCO DO GUAPORÉ",
    "SAO MIGUEL DO GUAPORE": "SÃO MIGUEL DO GUAPORÉ",
    "GUAJARA-MIRIM": "GUAJARÁ-MIRIM",
    "GUAJARAMIRIM": "GUAJARÁ-MIRIM",
    "ITAPUA DO OESTE": "ITAPUÃ DO OESTE",
    "MACHADINHO DOESTE": "MACHADINHO D'OESTE",
    "CAMPO NOVO DE RONDONIA": "CAMPO NOVO DE RONDÔNIA",
    "PRIMAVERA DE RONDONIA": "PRIMAVERA DE RONDÔNIA",
    "ALTO PARAISO": "ALTO PARAÍSO",
  };
  
  const nomeCorrigido = variacoes[nomeNormalizado];
  if (nomeCorrigido && COORDENADAS_RO[nomeCorrigido]) {
    return COORDENADAS_RO[nomeCorrigido];
  }
  
  // Busca parcial
  for (const [key, coords] of Object.entries(COORDENADAS_RO)) {
    if (key.includes(nomeNormalizado) || nomeNormalizado.includes(key)) {
      return coords;
    }
  }
  
  return null;
}
