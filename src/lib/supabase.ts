import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uttvovuufyhqxjmqqbuk.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dHZvdnV1ZnlocXhqbXFxYnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NzQ0NzgsImV4cCI6MjA4MTQ1MDQ3OH0.2TkAgL0vR62FqBzIS7Z2JLpeqHnpoM3AxVE9y8xNifE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'admin' | 'gestor_campanha' | 'candidato'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar_url?: string
  created_at: string
}

export interface Candidato {
  id: number
  nome: string
  nome_urna: string
  numero: number
  partido_id: number
  cargo: string
  foto_url?: string
  propostas?: string
  biografia?: string
  status: 'ativo' | 'inativo' | 'eleito' | 'nao_eleito'
  created_at: string
}

export interface Eleitor {
  id: number
  nome: string
  cpf?: string
  email?: string
  telefone?: string
  cidade: string
  bairro?: string
  zona_eleitoral?: number
  secao?: number
  faixa_etaria?: string
  genero?: string
  escolaridade?: string
  status: 'ativo' | 'inativo'
  created_at: string
}

export interface Partido {
  id: number
  nome: string
  sigla: string
  numero: number
  cor: string
  logo_url?: string
}

export interface Campanha {
  id: number
  nome: string
  candidato_id: number
  ano_eleicao: number
  cargo: string
  status: 'planejamento' | 'ativa' | 'encerrada' | 'vitoriosa' | 'derrotada'
  orcamento?: number
  meta_votos?: number
  created_at: string
}

// Funções para chamar Edge Functions
export async function createUserViaEdgeFunction(data: {
  email: string
  password: string
  name: string
  role: string
}) {
  const { data: session } = await supabase.auth.getSession()
  
  const response = await fetch(`${supabaseUrl}/functions/v1/create-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.session?.access_token}`,
      'apikey': supabaseAnonKey
    },
    body: JSON.stringify(data)
  })

  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.error || 'Erro ao criar usuário')
  }
  
  return result
}

export async function deleteUserViaEdgeFunction(userId: string, openId: string) {
  const { data: session } = await supabase.auth.getSession()
  
  const response = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.session?.access_token}`,
      'apikey': supabaseAnonKey
    },
    body: JSON.stringify({ userId, openId })
  })

  const result = await response.json()
  
  if (!response.ok) {
    throw new Error(result.error || 'Erro ao deletar usuário')
  }
  
  return result
}
