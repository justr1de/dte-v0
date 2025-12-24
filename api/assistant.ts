import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { messages } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' })
    }

    const userQuery = messages[messages.length - 1]?.content || ''
    
    // Buscar dados relevantes do banco de dados
    const dbContext = await fetchDatabaseContext(userQuery)

    if (!OPENAI_API_KEY) {
      // Fallback response when no API key - usar dados do banco
      return res.status(200).json({
        content: generateFallbackResponse(userQuery, dbContext)
      })
    }

    // Preparar mensagens com contexto do banco
    const systemMessage = {
      role: 'system',
      content: `Você é o Assistente DTE (Data Tracking Eleitoral), um especialista em dados eleitorais do estado de Rondônia.

CONTEXTO DOS DADOS ENCONTRADOS:
${JSON.stringify(dbContext, null, 2)}

INSTRUÇÕES:
- Responda sempre em português brasileiro
- Use os dados fornecidos no contexto para responder
- Formate números com separadores de milhar (ex: 1.234.567)
- Use emojis para tornar as respostas mais visuais
- Se não encontrar dados específicos, informe ao usuário
- Seja preciso e informativo`
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [systemMessage, ...messages],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      return res.status(200).json({
        content: generateFallbackResponse(userQuery, dbContext)
      })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua consulta.'

    return res.status(200).json({ content })
  } catch (error) {
    console.error('Error in assistant API:', error)
    return res.status(200).json({
      content: generateFallbackResponse('', {})
    })
  }
}

async function fetchDatabaseContext(query: string): Promise<any> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return {}
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const context: any = {}
  const lowerQuery = query.toLowerCase()

  try {
    // Detectar se é uma busca por candidato específico
    const candidatoMatch = extractCandidatoName(query)
    
    if (candidatoMatch) {
      // Buscar candidato específico
      const { data: candidatoData } = await supabase
        .from('boletins_urna')
        .select('nm_votavel, sg_partido, nm_municipio, cd_cargo_pergunta, ds_cargo_pergunta, qt_votos, ano_eleicao')
        .ilike('nm_votavel', `%${candidatoMatch}%`)
        .eq('sg_uf', 'RO')
        .order('qt_votos', { ascending: false })
        .limit(500)

      if (candidatoData && candidatoData.length > 0) {
        // Agrupar por candidato, cargo e ano
        const candidatoInfo: any = {}
        candidatoData.forEach(row => {
          const key = `${row.nm_votavel}-${row.cd_cargo_pergunta}-${row.ano_eleicao}`
          if (!candidatoInfo[key]) {
            candidatoInfo[key] = {
              nome: row.nm_votavel,
              partido: row.sg_partido,
              cargo: row.ds_cargo_pergunta,
              ano: row.ano_eleicao,
              totalVotos: 0,
              votosPorMunicipio: []
            }
          }
          candidatoInfo[key].totalVotos += row.qt_votos || 0
          candidatoInfo[key].votosPorMunicipio.push({
            municipio: row.nm_municipio,
            votos: row.qt_votos
          })
        })

        // Ordenar votos por município
        Object.values(candidatoInfo).forEach((info: any) => {
          info.votosPorMunicipio.sort((a: any, b: any) => b.votos - a.votos)
          info.votosPorMunicipio = info.votosPorMunicipio.slice(0, 10) // Top 10 municípios
        })

        context.candidatoEncontrado = Object.values(candidatoInfo)
      }
    }

    // Buscar deputados federais se mencionado
    if (lowerQuery.includes('deputado federal') || lowerQuery.includes('deputados federais')) {
      const { data: deputados } = await supabase
        .from('boletins_urna')
        .select('nm_votavel, sg_partido, qt_votos')
        .eq('sg_uf', 'RO')
        .eq('cd_cargo_pergunta', 6)
        .eq('ano_eleicao', 2022)
        .order('qt_votos', { ascending: false })
        .limit(1000)

      if (deputados) {
        const deputadoTotals: { [key: string]: { nome: string, partido: string, votos: number } } = {}
        deputados.forEach(d => {
          if (d.nm_votavel && d.nm_votavel !== 'Branco' && d.nm_votavel !== 'Nulo') {
            const key = d.nm_votavel
            if (!deputadoTotals[key]) {
              deputadoTotals[key] = { nome: d.nm_votavel, partido: d.sg_partido, votos: 0 }
            }
            deputadoTotals[key].votos += d.qt_votos || 0
          }
        })
        context.topDeputadosFederais2022 = Object.values(deputadoTotals)
          .sort((a, b) => b.votos - a.votos)
          .slice(0, 15)
      }
    }

    // Buscar deputados estaduais se mencionado
    if (lowerQuery.includes('deputado estadual') || lowerQuery.includes('deputados estaduais')) {
      const { data: deputados } = await supabase
        .from('boletins_urna')
        .select('nm_votavel, sg_partido, qt_votos')
        .eq('sg_uf', 'RO')
        .eq('cd_cargo_pergunta', 7)
        .eq('ano_eleicao', 2022)
        .order('qt_votos', { ascending: false })
        .limit(1000)

      if (deputados) {
        const deputadoTotals: { [key: string]: { nome: string, partido: string, votos: number } } = {}
        deputados.forEach(d => {
          if (d.nm_votavel && d.nm_votavel !== 'Branco' && d.nm_votavel !== 'Nulo') {
            const key = d.nm_votavel
            if (!deputadoTotals[key]) {
              deputadoTotals[key] = { nome: d.nm_votavel, partido: d.sg_partido, votos: 0 }
            }
            deputadoTotals[key].votos += d.qt_votos || 0
          }
        })
        context.topDeputadosEstaduais2022 = Object.values(deputadoTotals)
          .sort((a, b) => b.votos - a.votos)
          .slice(0, 15)
      }
    }

    // Buscar governador se mencionado
    if (lowerQuery.includes('governador')) {
      const { data: governadores } = await supabase
        .from('boletins_urna')
        .select('nm_votavel, sg_partido, qt_votos, nr_turno')
        .eq('sg_uf', 'RO')
        .eq('cd_cargo_pergunta', 3)
        .eq('ano_eleicao', 2022)
        .order('qt_votos', { ascending: false })
        .limit(500)

      if (governadores) {
        const govTotals: { [key: string]: { nome: string, partido: string, votos1t: number, votos2t: number } } = {}
        governadores.forEach(g => {
          if (g.nm_votavel && g.nm_votavel !== 'Branco' && g.nm_votavel !== 'Nulo') {
            if (!govTotals[g.nm_votavel]) {
              govTotals[g.nm_votavel] = { nome: g.nm_votavel, partido: g.sg_partido, votos1t: 0, votos2t: 0 }
            }
            if (g.nr_turno === 1) {
              govTotals[g.nm_votavel].votos1t += g.qt_votos || 0
            } else {
              govTotals[g.nm_votavel].votos2t += g.qt_votos || 0
            }
          }
        })
        context.governador2022 = Object.values(govTotals).sort((a, b) => (b.votos1t + b.votos2t) - (a.votos1t + a.votos2t))
      }
    }

    // Buscar senador se mencionado
    if (lowerQuery.includes('senador')) {
      const { data: senadores } = await supabase
        .from('boletins_urna')
        .select('nm_votavel, sg_partido, qt_votos')
        .eq('sg_uf', 'RO')
        .eq('cd_cargo_pergunta', 5)
        .eq('ano_eleicao', 2022)
        .order('qt_votos', { ascending: false })
        .limit(500)

      if (senadores) {
        const senTotals: { [key: string]: { nome: string, partido: string, votos: number } } = {}
        senadores.forEach(s => {
          if (s.nm_votavel && s.nm_votavel !== 'Branco' && s.nm_votavel !== 'Nulo') {
            if (!senTotals[s.nm_votavel]) {
              senTotals[s.nm_votavel] = { nome: s.nm_votavel, partido: s.sg_partido, votos: 0 }
            }
            senTotals[s.nm_votavel].votos += s.qt_votos || 0
          }
        })
        context.senador2022 = Object.values(senTotals).sort((a, b) => b.votos - a.votos)
      }
    }

    // Buscar prefeitos se mencionado
    if (lowerQuery.includes('prefeito') || lowerQuery.includes('top')) {
      const { data: prefeitos } = await supabase
        .from('boletins_urna')
        .select('nm_votavel, sg_partido, nm_municipio, qt_votos')
        .eq('sg_uf', 'RO')
        .eq('cd_cargo_pergunta', 11)
        .eq('ano_eleicao', 2024)
        .eq('nr_turno', 1)
        .order('qt_votos', { ascending: false })
        .limit(500)

      if (prefeitos) {
        const prefTotals: { [key: string]: { nome: string, partido: string, municipio: string, votos: number } } = {}
        prefeitos.forEach(p => {
          if (p.nm_votavel && p.nm_votavel !== 'Branco' && p.nm_votavel !== 'Nulo') {
            const key = `${p.nm_votavel}-${p.nm_municipio}`
            if (!prefTotals[key]) {
              prefTotals[key] = { nome: p.nm_votavel, partido: p.sg_partido, municipio: p.nm_municipio, votos: 0 }
            }
            prefTotals[key].votos += p.qt_votos || 0
          }
        })
        context.topPrefeitos2024 = Object.values(prefTotals)
          .sort((a, b) => b.votos - a.votos)
          .slice(0, 10)
      }
    }

    // Buscar resumo geral se mencionado
    if (lowerQuery.includes('resumo') || lowerQuery.includes('2024') || lowerQuery.includes('eleições')) {
      const { data: resumo } = await supabase
        .from('comparecimento_abstencao')
        .select('qt_aptos, qt_comparecimento, qt_abstencoes')
        .eq('sg_uf', 'RO')
        .eq('ano_eleicao', 2024)
        .eq('nr_turno', 1)
        .limit(100)

      if (resumo) {
        const totalAptos = resumo.reduce((acc, r) => acc + (r.qt_aptos || 0), 0)
        const totalComparecimento = resumo.reduce((acc, r) => acc + (r.qt_comparecimento || 0), 0)
        const totalAbstencao = resumo.reduce((acc, r) => acc + (r.qt_abstencoes || 0), 0)
        context.resumo2024 = {
          totalEleitores: totalAptos,
          comparecimento: totalComparecimento,
          abstencoes: totalAbstencao,
          taxaParticipacao: totalAptos > 0 ? ((totalComparecimento / totalAptos) * 100).toFixed(1) : 0
        }
      }
    }

    // Buscar partidos se mencionado
    if (lowerQuery.includes('partido')) {
      const { data: partidos } = await supabase
        .from('boletins_urna')
        .select('sg_partido, qt_votos')
        .eq('sg_uf', 'RO')
        .eq('cd_cargo_pergunta', 11)
        .eq('ano_eleicao', 2024)
        .eq('nr_turno', 1)
        .limit(5000)

      if (partidos) {
        const partidoTotals: { [key: string]: number } = {}
        partidos.forEach(p => {
          if (p.sg_partido && p.sg_partido !== '#NULO#') {
            partidoTotals[p.sg_partido] = (partidoTotals[p.sg_partido] || 0) + (p.qt_votos || 0)
          }
        })
        context.topPartidos2024 = Object.entries(partidoTotals)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([partido, votos]) => ({ partido, votos }))
      }
    }

    // Buscar município específico se mencionado
    const municipioMatch = extractMunicipioName(query)
    if (municipioMatch) {
      const { data: municipioData } = await supabase
        .from('comparecimento_abstencao')
        .select('*')
        .eq('sg_uf', 'RO')
        .ilike('nm_municipio', `%${municipioMatch}%`)
        .eq('ano_eleicao', 2024)
        .eq('nr_turno', 1)
        .limit(10)

      if (municipioData && municipioData.length > 0) {
        const totalAptos = municipioData.reduce((acc, r) => acc + (r.qt_aptos || 0), 0)
        const totalComparecimento = municipioData.reduce((acc, r) => acc + (r.qt_comparecimento || 0), 0)
        const totalAbstencao = municipioData.reduce((acc, r) => acc + (r.qt_abstencoes || 0), 0)
        context.municipio = {
          nome: municipioData[0].nm_municipio,
          totalEleitores: totalAptos,
          comparecimento: totalComparecimento,
          abstencoes: totalAbstencao,
          taxaParticipacao: totalAptos > 0 ? ((totalComparecimento / totalAptos) * 100).toFixed(1) : 0
        }
      }
    }

  } catch (error) {
    console.error('Error fetching database context:', error)
  }

  return context
}

function extractCandidatoName(query: string): string | null {
  // Padrões comuns para identificar nomes de candidatos
  const patterns = [
    /sobre\s+(?:o\s+)?(?:candidato\s+)?(?:deputado\s+)?(?:federal\s+)?(?:estadual\s+)?(.+?)(?:\?|$)/i,
    /informações\s+(?:sobre\s+)?(?:o\s+)?(.+?)(?:\?|$)/i,
    /dados\s+(?:de|do|da)\s+(.+?)(?:\?|$)/i,
    /(?:quem\s+é|quem\s+foi)\s+(.+?)(?:\?|$)/i,
    /rafael\s+(?:fera|bento)/i,
    /(\w+\s+fera)/i
  ]

  for (const pattern of patterns) {
    const match = query.match(pattern)
    if (match && match[1]) {
      const name = match[1].trim()
      // Filtrar palavras comuns que não são nomes
      if (name.length > 2 && !['o', 'a', 'os', 'as', 'de', 'da', 'do', 'em', 'no', 'na'].includes(name.toLowerCase())) {
        return name
      }
    }
  }

  // Buscar por nomes específicos conhecidos
  const lowerQuery = query.toLowerCase()
  if (lowerQuery.includes('rafael fera') || lowerQuery.includes('rafael bento')) {
    return 'RAFAEL FERA'
  }

  return null
}

function extractMunicipioName(query: string): string | null {
  const municipios = [
    'porto velho', 'ji-paraná', 'ariquemes', 'cacoal', 'vilhena', 'rolim de moura',
    'guajará-mirim', 'jaru', 'ouro preto do oeste', 'pimenta bueno', 'buritis',
    'nova mamoré', 'machadinho', 'espigão do oeste', 'alta floresta', 'colorado',
    'presidente médici', 'são miguel do guaporé', 'cerejeiras', 'costa marques'
  ]

  const lowerQuery = query.toLowerCase()
  for (const municipio of municipios) {
    if (lowerQuery.includes(municipio)) {
      return municipio
    }
  }

  return null
}

function generateFallbackResponse(query: string, context: any): string {
  const lowerQuery = query.toLowerCase()

  // Se encontrou candidato específico
  if (context.candidatoEncontrado && context.candidatoEncontrado.length > 0) {
    const candidatos = context.candidatoEncontrado
    let response = ''
    
    candidatos.forEach((c: any) => {
      response += `📊 **${c.nome}**\n`
      response += `🏛️ Partido: ${c.partido}\n`
      response += `📋 Cargo: ${c.cargo}\n`
      response += `📅 Ano: ${c.ano}\n`
      response += `🗳️ Total de Votos: ${c.totalVotos.toLocaleString('pt-BR')}\n\n`
      
      if (c.votosPorMunicipio && c.votosPorMunicipio.length > 0) {
        response += `📍 **Top Municípios:**\n`
        c.votosPorMunicipio.slice(0, 5).forEach((m: any, i: number) => {
          response += `${i + 1}. ${m.municipio}: ${m.votos.toLocaleString('pt-BR')} votos\n`
        })
      }
      response += '\n'
    })

    return response
  }

  // Deputados federais
  if (context.topDeputadosFederais2022) {
    let response = `🏛️ **Top Deputados Federais - Eleições 2022 RO**\n\n`
    context.topDeputadosFederais2022.slice(0, 10).forEach((d: any, i: number) => {
      const eleito = i < 8 ? '✅' : ''
      response += `${i + 1}. **${d.nome}** (${d.partido}) ${eleito}\n   📊 ${d.votos.toLocaleString('pt-BR')} votos\n\n`
    })
    response += `\n*Rondônia elegeu 8 deputados federais em 2022.*`
    return response
  }

  // Deputados estaduais
  if (context.topDeputadosEstaduais2022) {
    let response = `🏛️ **Top Deputados Estaduais - Eleições 2022 RO**\n\n`
    context.topDeputadosEstaduais2022.slice(0, 10).forEach((d: any, i: number) => {
      response += `${i + 1}. **${d.nome}** (${d.partido})\n   📊 ${d.votos.toLocaleString('pt-BR')} votos\n\n`
    })
    return response
  }

  // Governador
  if (context.governador2022) {
    let response = `🏛️ **Eleição para Governador - 2022 RO**\n\n`
    context.governador2022.slice(0, 5).forEach((g: any, i: number) => {
      response += `${i + 1}. **${g.nome}** (${g.partido})\n`
      response += `   📊 1º Turno: ${g.votos1t.toLocaleString('pt-BR')} votos\n`
      if (g.votos2t > 0) {
        response += `   📊 2º Turno: ${g.votos2t.toLocaleString('pt-BR')} votos\n`
      }
      response += '\n'
    })
    return response
  }

  // Senador
  if (context.senador2022) {
    let response = `🏛️ **Eleição para Senador - 2022 RO**\n\n`
    context.senador2022.slice(0, 5).forEach((s: any, i: number) => {
      const eleito = i < 1 ? '✅ Eleito' : ''
      response += `${i + 1}. **${s.nome}** (${s.partido}) ${eleito}\n   📊 ${s.votos.toLocaleString('pt-BR')} votos\n\n`
    })
    return response
  }

  // Prefeitos
  if (context.topPrefeitos2024) {
    let response = `🏆 **Top 10 Prefeitos Mais Votados - 2024 RO**\n\n`
    context.topPrefeitos2024.forEach((p: any, i: number) => {
      response += `${i + 1}. **${p.nome}** (${p.partido}) - ${p.municipio}\n   📊 ${p.votos.toLocaleString('pt-BR')} votos\n\n`
    })
    return response
  }

  // Resumo
  if (context.resumo2024) {
    return `📊 **Resumo das Eleições 2024 - Rondônia (1º Turno)**

🗳️ **Participação Eleitoral:**
- Total de Eleitores: ${context.resumo2024.totalEleitores.toLocaleString('pt-BR')}
- Comparecimento: ${context.resumo2024.comparecimento.toLocaleString('pt-BR')} (${context.resumo2024.taxaParticipacao}%)
- Abstenções: ${context.resumo2024.abstencoes.toLocaleString('pt-BR')}

📍 **Abrangência:**
- 52 municípios
- 29 zonas eleitorais

💡 *Para consultas mais detalhadas, pergunte sobre candidatos específicos, partidos ou municípios!*`
  }

  // Partidos
  if (context.topPartidos2024) {
    let response = `🏛️ **Partidos Mais Votados - Prefeito 2024 RO**\n\n`
    context.topPartidos2024.forEach((p: any, i: number) => {
      response += `${i + 1}. **${p.partido}** - ${p.votos.toLocaleString('pt-BR')} votos\n`
    })
    return response
  }

  // Município específico
  if (context.municipio) {
    return `📍 **${context.municipio.nome} - Eleições 2024**

🗳️ **Eleitorado:**
- Total de Eleitores: ${context.municipio.totalEleitores.toLocaleString('pt-BR')}
- Comparecimento: ${context.municipio.comparecimento.toLocaleString('pt-BR')} (${context.municipio.taxaParticipacao}%)
- Abstenções: ${context.municipio.abstencoes.toLocaleString('pt-BR')}`
  }

  // Resposta padrão
  return `👋 **Olá! Sou o Assistente DTE**

Posso ajudar você com informações sobre:

📊 **Dados Gerais**
- Resumo das eleições 2024
- Taxa de participação e abstenção
- Votos nulos e brancos

🏆 **Candidatos**
- Top prefeitos mais votados
- Deputados federais e estaduais
- Governador e senador
- Busca por candidato específico (ex: "Rafael Fera")

🏛️ **Partidos**
- Partidos mais votados
- Desempenho por região

📍 **Municípios**
- Dados de Porto Velho
- Informações por cidade

💡 **Exemplos de perguntas:**
- "Qual foi o resumo das eleições 2024?"
- "Quais os deputados federais eleitos em 2022?"
- "Me traga informações sobre Rafael Fera"
- "Mostre dados de Porto Velho"

*Digite sua pergunta e eu buscarei os dados para você!*`
}
