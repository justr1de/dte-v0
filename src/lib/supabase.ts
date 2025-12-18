import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uttvovuufyhqxjmqqbuk.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0dHZvdnV1ZnlocXhqbXFxYnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NzQ0NzgsImV4cCI6MjA4MTQ1MDQ3OH0.2TkAgL0vR62FqBzIS7Z2JLpeqHnpoM3AxVE9y8xNifE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'admin' | 'gestor_campanha' | 'candidato'

export interface User {
  id: string
  email: string
  name: string
  display_name?: string | null
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

// Função para criar usuário via Database Function (RPC)
export async function createUserViaEdgeFunction(data: {
  email: string
  password: string
  name: string
  role: string
  display_name?: string
}) {
  // Usar a função SQL create_dte_user via RPC
  const { data: result, error } = await supabase.rpc('create_dte_user', {
    p_email: data.email,
    p_password: data.password,
    p_name: data.name,
    p_role: data.role,
    p_display_name: data.display_name || null
  })

  if (error) {
    console.error('Erro ao criar usuário:', error)
    throw new Error(error.message || 'Erro ao criar usuário')
  }

  // O resultado é um JSON retornado pela função
  if (result && !result.success) {
    throw new Error(result.error || 'Erro ao criar usuário')
  }

  return result
}

// Função para deletar usuário
export async function deleteUserViaEdgeFunction(userId: string, openId: string) {
  // Primeiro, deletar da tabela users
  const { error: dbError } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (dbError) {
    console.error('Erro ao deletar usuário da tabela:', dbError)
    throw new Error(dbError.message || 'Erro ao deletar usuário')
  }

  // Nota: A deleção do auth.users requer service_role key
  // Por enquanto, apenas desativamos o usuário na tabela users
  // O usuário do auth.users pode ser deletado manualmente no painel do Supabase
  
  return { success: true }
}
