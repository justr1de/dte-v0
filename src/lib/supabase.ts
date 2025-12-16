import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Using demo mode.')
}

export const supabase = createClient(
  supabaseUrl || 'https://demo.supabase.co',
  supabaseAnonKey || 'demo-key'
)

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
