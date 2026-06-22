import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Mail, ArrowLeft, Compass, CheckCircle } from 'lucide-react'
import { api } from '@/api/client'

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: 'rgba(19,21,46,0.6)',
  border: '1px solid #252855',
  color: 'var(--text-primary)',
  borderRadius: 16,
  width: '100%',
  padding: '12px 14px 12px 42px',
  fontSize: 14,
  outline: 'none',
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')

  const mutation = useMutation({
    mutationFn: (e: string) => api.post(`/api/auth/forgot-password?email=${encodeURIComponent(e)}`),
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email.trim()) mutation.mutate(email.trim())
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: 'var(--page-bg)' }}>
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'rgba(124,107,255,0.15)', filter: 'blur(100px)' }} />
      <div className="absolute -bottom-20 -right-20 w-[30rem] h-[30rem] rounded-full pointer-events-none" style={{ background: 'rgba(124,107,255,0.10)', filter: 'blur(120px)' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="p-10 md:p-12" style={{
          backgroundColor: 'rgba(19,21,46,0.3)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgb(var(--inv) / 0.10)',
          borderRadius: 40,
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }}>
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', boxShadow: '0 8px 20px rgba(100,86,232,0.3)' }}>
              <Compass size={22} color="white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-white">ChurchOS</h1>
          </div>

          {mutation.isSuccess ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={28} style={{ color: '#34d399' }} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
              <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 14, lineHeight: 1.6 }}>
                If <strong style={{ color: 'var(--text-primary)' }}>{email}</strong> is registered, we've sent a password reset link. It expires in 1 hour.
              </p>
              <p style={{ color: 'rgb(var(--inv) / 0.35)', fontSize: 12, marginTop: 12 }}>
                Didn't receive it? Check your spam folder.
              </p>
              <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'rgb(var(--inv) / 0.5)', fontSize: 13, marginTop: 24, textDecoration: 'none' }}>
                <ArrowLeft size={14} /> Back to login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-1 text-center">Forgot password?</h2>
              <p style={{ color: 'rgb(var(--inv) / 0.45)', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>
                Enter your email and we'll send a reset link.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgb(var(--inv) / 0.35)', pointerEvents: 'none' }} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    style={INPUT_STYLE}
                    onFocus={e => (e.currentTarget.style.borderColor = '#7c6bff')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#252855')}
                  />
                </div>

                <button type="submit" disabled={mutation.isPending || !email.trim()}
                  className="w-full py-3 rounded-2xl font-semibold text-sm text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', border: 'none', cursor: mutation.isPending ? 'not-allowed' : 'pointer', opacity: mutation.isPending ? 0.7 : 1 }}>
                  {mutation.isPending ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'rgb(var(--inv) / 0.5)', fontSize: 13, marginTop: 20, textDecoration: 'none' }}>
                <ArrowLeft size={14} /> Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
