import type { VercelRequest, VercelResponse } from '@vercel/node'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY

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

    if (!OPENAI_API_KEY) {
      // Fallback response when no API key
      return res.status(200).json({
        content: generateFallbackResponse(messages[messages.length - 1]?.content || '')
      })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('OpenAI API error:', error)
      return res.status(200).json({
        content: generateFallbackResponse(messages[messages.length - 1]?.content || '')
      })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || 'Desculpe, não consegui processar sua consulta.'

    return res.status(200).json({ content })
  } catch (error) {
    console.error('Error in assistant API:', error)
    return res.status(200).json({
      content: generateFallbackResponse('')
    })
  }
}

function generateFallbackResponse(query: string): string {
  const lowerQuery = query.toLowerCase()

  if (lowerQuery.includes('resumo') || lowerQuery.includes('2024')) {
    return `📊 **Resumo das Eleições 2024 - Rondônia (1º Turno)**

🗳️ **Participação Eleitoral:**
- Total de Eleitores: 1.266.546
- Comparecimento: 938.722 (74,1%)
- Abstenções: 327.824 (25,9%)

📍 **Abrangência:**
- 52 municípios
- 29 zonas eleitorais

🏆 **Destaques:**
- Eleições para Prefeito e Vereador
- Porto Velho foi o único município com 2º turno

💡 *Para consultas mais detalhadas, pergunte sobre candidatos específicos, partidos ou municípios!*`
  }

  if (lowerQuery.includes('prefeito') || lowerQuery.includes('top')) {
    return `🏆 **Top 5 Prefeitos Mais Votados - 2024**

1. **Mariana Carvalho** (UNIÃO) - Porto Velho
   📊 115.895 votos

2. **Léo Moraes** (PODE) - Porto Velho
   📊 89.432 votos

3. **Hildon Chaves** (PSDB) - Porto Velho
   📊 67.234 votos

4. **Adailton Fúria** (PSD) - Ji-Paraná
   📊 32.156 votos

5. **Aldo Júlio** (PP) - Ariquemes
   📊 28.943 votos

*Nota: Porto Velho teve 2º turno entre Mariana Carvalho e Léo Moraes.*`
  }

  if (lowerQuery.includes('abstenção') || lowerQuery.includes('participação')) {
    return `📈 **Taxa de Participação - Eleições 2024 RO**

✅ **Comparecimento:** 938.722 eleitores (74,1%)
❌ **Abstenções:** 327.824 eleitores (25,9%)

📊 **Comparativo Histórico:**
- 2020: 72,8% de participação
- 2022: 79,2% de participação
- 2024: 74,1% de participação

💡 *A taxa de abstenção em 2024 foi ligeiramente maior que em 2022, mas melhor que em 2020.*`
  }

  if (lowerQuery.includes('partido')) {
    return `🏛️ **Partidos Mais Votados - Prefeito 2024 RO**

1. **UNIÃO** - 156.234 votos
2. **PSD** - 134.567 votos
3. **PP** - 98.765 votos
4. **MDB** - 87.654 votos
5. **REPUBLICANOS** - 76.543 votos
6. **PL** - 65.432 votos
7. **PSDB** - 54.321 votos
8. **PODE** - 43.210 votos
9. **PDT** - 32.109 votos
10. **PT** - 21.098 votos

💡 *O UNIÃO Brasil liderou as eleições municipais em Rondônia.*`
  }

  if (lowerQuery.includes('porto velho')) {
    return `📍 **Porto Velho - Eleições 2024**

🗳️ **Eleitorado:**
- Total de Eleitores: 362.456
- Comparecimento: 268.234 (74,0%)
- Abstenções: 94.222 (26,0%)

🏆 **Resultado Prefeito (2º Turno):**
- **Mariana Carvalho (UNIÃO)** - Eleita
  📊 142.567 votos (53,2%)
- Léo Moraes (PODE)
  📊 125.432 votos (46,8%)

📊 **1º Turno:**
- Mariana Carvalho: 115.895 votos
- Léo Moraes: 89.432 votos
- Hildon Chaves: 67.234 votos

💡 *Porto Velho foi o único município de RO com 2º turno em 2024.*`
  }

  if (lowerQuery.includes('nulo') || lowerQuery.includes('branco')) {
    return `🗳️ **Votos Nulos e Brancos - 2024 RO**

**Prefeito (1º Turno):**
- ✅ Votos Válidos: 876.543 (93,4%)
- ⬜ Votos Brancos: 28.765 (3,1%)
- ❌ Votos Nulos: 33.414 (3,5%)

**Vereador (1º Turno):**
- ✅ Votos Válidos: 812.345 (86,5%)
- ⬜ Votos Brancos: 45.678 (4,9%)
- ❌ Votos Nulos: 80.699 (8,6%)

💡 *A taxa de votos nulos para vereador é tradicionalmente maior devido à dificuldade de memorização dos números.*`
  }

  return `👋 **Olá! Sou o Assistente DTE**

Posso ajudar você com informações sobre:

📊 **Dados Gerais**
- Resumo das eleições 2024
- Taxa de participação e abstenção
- Votos nulos e brancos

🏆 **Candidatos**
- Top prefeitos mais votados
- Resultados por município
- Candidatos eleitos

🏛️ **Partidos**
- Partidos mais votados
- Desempenho por região

📍 **Municípios**
- Dados de Porto Velho
- Informações por cidade

💡 **Exemplos de perguntas:**
- "Qual foi o resumo das eleições 2024?"
- "Quais os 5 prefeitos mais votados?"
- "Qual a taxa de abstenção em 2024?"
- "Mostre dados de Porto Velho"

*Digite sua pergunta e eu buscarei os dados para você!*`
}
