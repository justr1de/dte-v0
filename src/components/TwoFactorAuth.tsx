import { useState, useEffect, useRef } from 'react'
import { Shield, Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'

interface TwoFactorAuthProps {
  email: string
  onVerified: () => void
  onCancel: () => void
  onSendCode: (email: string) => Promise<boolean>
  onVerifyCode: (email: string, code: string) => Promise<boolean>
}

export default function TwoFactorAuth({ 
  email, 
  onVerified, 
  onCancel, 
  onSendCode, 
  onVerifyCode 
}: TwoFactorAuthProps) {
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Enviar código automaticamente ao montar
  useEffect(() => {
    sendCode()
  }, [])

  // Countdown para reenvio
  useEffect(() => {
    if (countdown > 0 && codeSent) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      setCanResend(true)
    }
  }, [countdown, codeSent])

  const sendCode = async () => {
    setResending(true)
    setError('')
    try {
      const success = await onSendCode(email)
      if (success) {
        setCodeSent(true)
        setCountdown(60)
        setCanResend(false)
      } else {
        setError('Erro ao enviar código. Tente novamente.')
      }
    } catch {
      setError('Erro ao enviar código. Tente novamente.')
    } finally {
      setResending(false)
    }
  }

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Colar código completo
      const pasted = value.replace(/\D/g, '').slice(0, 6).split('')
      const newCode = [...code]
      pasted.forEach((char, i) => {
        if (index + i < 6) newCode[index + i] = char
      })
      setCode(newCode)
      const nextIndex = Math.min(index + pasted.length, 5)
      inputRefs.current[nextIndex]?.focus()
      
      // Auto-verificar se todos os 6 dígitos foram preenchidos
      if (newCode.every(c => c !== '')) {
        verifyCode(newCode.join(''))
      }
      return
    }

    const newCode = [...code]
    newCode[index] = value.replace(/\D/g, '')
    setCode(newCode)

    // Mover para próximo input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-verificar se todos os 6 dígitos foram preenchidos
    if (newCode.every(c => c !== '')) {
      verifyCode(newCode.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const verifyCode = async (fullCode: string) => {
    setLoading(true)
    setError('')
    try {
      const success = await onVerifyCode(email, fullCode)
      if (success) {
        onVerified()
      } else {
        setError('Código inválido ou expirado. Tente novamente.')
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch {
      setError('Erro ao verificar código. Tente novamente.')
      setCode(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--bg-primary)] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-[var(--border-color)]">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Verificação em Duas Etapas</h2>
          <p className="text-[var(--text-secondary)] text-sm">
            Para sua segurança, enviamos um código de verificação para:
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Mail className="w-4 h-4 text-emerald-500" />
            <span className="font-medium text-emerald-500">{maskedEmail}</span>
          </div>
        </div>

        {/* Code Input */}
        <div className="flex justify-center gap-3 mb-6">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={loading}
              className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 
                border-[var(--border-color)] bg-[var(--bg-secondary)] 
                focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 
                outline-none transition-all disabled:opacity-50"
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm mb-4 justify-center">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center gap-2 text-emerald-500 text-sm mb-4 justify-center">
            <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            <span>Verificando código...</span>
          </div>
        )}

        {/* Resend Code */}
        <div className="text-center mb-6">
          {canResend ? (
            <button
              onClick={sendCode}
              disabled={resending}
              className="flex items-center gap-2 mx-auto text-sm text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
              {resending ? 'Enviando...' : 'Reenviar código'}
            </button>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              Reenviar código em <span className="font-medium text-[var(--text-primary)]">{countdown}s</span>
            </p>
          )}
        </div>

        {/* LGPD Notice */}
        <div className="text-center mb-4">
          <p className="text-xs text-[var(--text-muted)]">
            🔒 Todos os dados coletados respeitam às Normas da LGPD. O código expira em 10 minutos.
          </p>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancel}
          className="w-full py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors text-sm"
        >
          Cancelar e voltar ao login
        </button>
      </div>
    </div>
  )
}
