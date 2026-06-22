import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Lock, ArrowLeft, Compass, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '@/api/client'

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: 'rgba(19,21,46,0.6)',
  border: '1px solid #252855',
  color: 'white',
  borderRadius: 16,
  width: '100%',
  padding: '12px 14px 12px 42px',
  fontSize: 14,
  outline: 'none',
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')

  const mutation = useMutation({
    mutationFn: () => api.post(`/api/auth/reset-password?token=${encodeURIComponent(token)}&newPassword=${encodeURIComponent(newPassword)}`),
    onSuccess: () => { setTimeout(() => navigate('/login'), 2000) },
  })

  const match = newPassword.length >= 6 && newPassword === confirm

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!match) return
    mutation.mutate()
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#131326' }}>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <AlertCircle size={40} style={{ color: '#f87171', margin: '0 auto 16px' }} />
          <p style={{ color: 'white', fontSize: 16, fontWeight: 600 }}>Invalid reset link</p>
          <Link to="/forgot-password" style={{ color: '#7c6bff', fontSize: 14, marginTop: 12, display: 'block' }}>Request a new one</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: '#131326' }}>
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'rgba(124,107,255,0.15)', filter: 'blur(100px)' }} />
      <div className="absolute -bottom-20 -right-20 w-[30rem] h-[30rem] rounded-full pointer-events-none" style={{ background: 'rgba(124,107,255,0.10)', filter: 'blur(120px)' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="p-10 md:p-12" style={{
          backgroundColor: 'rgba(19,21,46,0.3)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 40,
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }}>
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #7c6bff, #6456e8)', boxShadow: '0 8px 20px rgba(100,86,232,0.3)' }}>
              <Compass size={22} color="white" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-white">ChurchOS</h1>
          </div>

          {mutation.isSuccess ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 60, height: 60, borderRadius: 16, background: 'rgba(52,211,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={28} style={{ color: '#34d399' }} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Password reset!</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Redirecting you to login…</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-1 text-center">Set new password</h2>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>
                Choose a strong password of at least 6 characters.
              </p>

              {mutation.isError && (
                <div style={{ backgroundColor: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={14} style={{ color: '#f87171', flexShrink: 0 }} />
                  <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>This reset link is invalid or has expired.</p>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New password (min 6 chars)"
                    required
                    style={INPUT_STYLE}
                    onFocus={e => (e.currentTarget.style.borderColor = '#7c6bff')}
                    onBlur={e => (e.currentTarget.style.borderColor = '#252855')}
                  />
                </div>

                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
                  <input
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    style={{
                      ...INPUT_STYLE,
                      borderColor: confirm && !match ? '#f87171' : confirm && match ? '#34d399' : '#252855',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = confirm && !match ? '#f87171' : '#7c6bff')}
                    onBlur={e => (e.currentTarget.style.borderColor = confirm && !match ? '#f87171' : confirm && match ? '#34d399' : '#252855')}
                  />
                  {confirm && !match && <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>Passwords don't match</p>}
                  {match && <p style={{ color: '#34d399', fontSize: 12, marginTop: 4 }}>✓ Passwords match</p>}
                </div>

                <button type="submit" disabled={!match || mutation.isPending}
                  className="w-full py-3 rounded-2xl font-semibold text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #7c6bff, #6456e8)', border: 'none', cursor: !match || mutation.isPending ? 'not-allowed' : 'pointer', opacity: !match || mutation.isPending ? 0.7 : 1 }}>
                  {mutation.isPending ? 'Resetting...' : 'Reset password'}
                </button>
              </form>

              <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 20, textDecoration: 'none' }}>
                <ArrowLeft size={14} /> Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
