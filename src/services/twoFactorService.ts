import { supabase } from '@/lib/supabase'

// Gerar código de 6 dígitos
function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Enviar código 2FA por email usando Supabase Edge Function ou tabela temporária
export async function send2FACode(email: string): Promise<boolean> {
  try {
    const code = generateCode()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutos

    // Remover códigos anteriores deste email
    await supabase
      .from('two_factor_codes')
      .delete()
      .eq('email', email.toLowerCase())

    // Inserir novo código
    const { error } = await supabase
      .from('two_factor_codes')
      .insert({
        email: email.toLowerCase(),
        code,
        expires_at: expiresAt,
        verified: false,
        attempts: 0
      })

    if (error) {
      console.error('Erro ao salvar código 2FA:', error)
      // Se a tabela não existir, criar automaticamente via fallback
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('Tabela two_factor_codes não existe. Usando localStorage como fallback.')
        return send2FACodeFallback(email, code, expiresAt)
      }
      return false
    }

    // Enviar email com o código usando a função de email do Supabase
    // Como alternativa, armazenamos o código e o usuário recebe via notificação
    try {
      await supabase.functions.invoke('send-2fa-email', {
        body: { email, code }
      })
    } catch {
      // Se a edge function não existir, usar método alternativo
      console.warn('Edge function send-2fa-email não disponível. Código salvo na tabela.')
    }

    return true
  } catch (error) {
    console.error('Erro ao enviar código 2FA:', error)
    return false
  }
}

// Fallback: armazenar código no localStorage (para desenvolvimento)
function send2FACodeFallback(email: string, code: string, expiresAt: string): boolean {
  try {
    const data = { email: email.toLowerCase(), code, expiresAt, verified: false, attempts: 0 }
    localStorage.setItem(`2fa_${email.toLowerCase()}`, JSON.stringify(data))
    // Em modo fallback, mostrar o código no console para teste
    console.info(`[2FA FALLBACK] Código para ${email}: ${code}`)
    return true
  } catch {
    return false
  }
}

// Verificar código 2FA
export async function verify2FACode(email: string, inputCode: string): Promise<boolean> {
  try {
    // Tentar verificar no Supabase primeiro
    const { data, error } = await supabase
      .from('two_factor_codes')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error || !data) {
      // Fallback para localStorage
      return verify2FACodeFallback(email, inputCode)
    }

    // Verificar se expirou
    if (new Date(data.expires_at) < new Date()) {
      // Código expirado - remover
      await supabase
        .from('two_factor_codes')
        .delete()
        .eq('id', data.id)
      return false
    }

    // Verificar tentativas (máximo 5)
    if (data.attempts >= 5) {
      await supabase
        .from('two_factor_codes')
        .delete()
        .eq('id', data.id)
      return false
    }

    // Incrementar tentativas
    await supabase
      .from('two_factor_codes')
      .update({ attempts: (data.attempts || 0) + 1 })
      .eq('id', data.id)

    // Verificar código
    if (data.code === inputCode) {
      // Marcar como verificado e limpar
      await supabase
        .from('two_factor_codes')
        .update({ verified: true })
        .eq('id', data.id)
      
      // Salvar sessão 2FA verificada (válida por 24h)
      const session2FA = {
        email: email.toLowerCase(),
        verifiedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
      localStorage.setItem('2fa_session', JSON.stringify(session2FA))
      
      return true
    }

    return false
  } catch (error) {
    console.error('Erro ao verificar código 2FA:', error)
    return verify2FACodeFallback(email, inputCode)
  }
}

// Fallback: verificar código no localStorage
function verify2FACodeFallback(email: string, inputCode: string): boolean {
  try {
    const stored = localStorage.getItem(`2fa_${email.toLowerCase()}`)
    if (!stored) return false

    const data = JSON.parse(stored)
    
    // Verificar expiração
    if (new Date(data.expiresAt) < new Date()) {
      localStorage.removeItem(`2fa_${email.toLowerCase()}`)
      return false
    }

    // Verificar tentativas
    if (data.attempts >= 5) {
      localStorage.removeItem(`2fa_${email.toLowerCase()}`)
      return false
    }

    // Incrementar tentativas
    data.attempts = (data.attempts || 0) + 1
    localStorage.setItem(`2fa_${email.toLowerCase()}`, JSON.stringify(data))

    if (data.code === inputCode) {
      localStorage.removeItem(`2fa_${email.toLowerCase()}`)
      
      // Salvar sessão 2FA verificada
      const session2FA = {
        email: email.toLowerCase(),
        verifiedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
      localStorage.setItem('2fa_session', JSON.stringify(session2FA))
      
      return true
    }

    return false
  } catch {
    return false
  }
}

// Verificar se a sessão 2FA ainda é válida
export function is2FASessionValid(email: string): boolean {
  try {
    const stored = localStorage.getItem('2fa_session')
    if (!stored) return false

    const session = JSON.parse(stored)
    
    if (session.email !== email.toLowerCase()) return false
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem('2fa_session')
      return false
    }

    return true
  } catch {
    return false
  }
}

// Limpar sessão 2FA (no logout)
export function clear2FASession(): void {
  localStorage.removeItem('2fa_session')
}
