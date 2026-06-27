import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, Compass } from 'lucide-react'
import { signup } from '@/api/auth'

const schema = z.object({
  name: z.string().min(2, 'Church name required'),
  subdomain: z.string().min(2, 'Subdomain required').regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  adminEmail: z.string().email('Valid admin email required'),
  adminPassword: z.string().min(6, 'Minimum 6 characters'),
})
type FormData = z.infer<typeof schema>

const CARD_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--glass-bg)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgb(var(--inv) / 0.10)',
  borderRadius: 40,
  boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
}

const INPUT_STYLE: React.CSSProperties = {
  backgroundColor: 'var(--input-fill)',
  border: '1px solid rgb(var(--inv) / 0.12)',
  color: 'var(--text-primary)',
  borderRadius: 14,
  width: '100%',
  padding: '10px 14px',
  fontSize: 14,
  outline: 'none',
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-widest mb-1.5" style={{ color: 'rgb(var(--inv) / 0.5)' }}>{label}</label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: '#fca5a5' }}>{error}</p>}
    </div>
  )
}

export function SignupPage() {
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { ref: subRef, onChange: subOnChange, ...subRest } = register('subdomain')

  const signupMutation = useMutation({
    mutationFn: (d: FormData) => signup(d.name, d.adminEmail, d.adminPassword, d.subdomain, d.email, d.phone),
    onSuccess: () => navigate('/login'),
    onError: (e: Error) => setError('root', { message: e.message }),
  })

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden" style={{ backgroundColor: 'var(--page-bg)' }}>
      {/* Decorative blobs */}
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'rgba(124,107,255,0.15)', filter: 'blur(100px)' }} />
      <div className="absolute -bottom-20 -right-20 w-[30rem] h-[30rem] rounded-full pointer-events-none" style={{ background: 'rgba(124,107,255,0.10)', filter: 'blur(120px)' }} />

      <div className="w-full max-w-xl relative z-10">
        <div style={CARD_STYLE} className="p-10">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', boxShadow: '0 8px 20px rgba(100,86,232,0.3)' }}>
              <Compass size={22} color="white" />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Get Started with ChurchOS</h1>
            <p className="text-sm mt-1.5" style={{ color: 'rgb(var(--inv) / 0.5)' }}>Set up your multi-tenant global church platform</p>
          </div>

          {errors.root && (
            <div className="mb-5 px-4 py-3 rounded-2xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(d => signupMutation.mutate(d))} className="space-y-6">
            {/* Church details */}
            <div>
              <p className="text-xs font-bold tracking-widest mb-4" style={{ color: 'var(--accent)' }}>CHURCH ORGANIZATION DETAILS</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="CHURCH NAME" error={errors.name?.message}>
                  <input {...register('name')} placeholder="e.g. Grace Assembly" style={INPUT_STYLE}
                    onFocus={e => (e.currentTarget.style.borderColor = '#7c6bff')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgb(var(--inv) / 0.12)')} />
                </Field>
                <Field label="SUBDOMAIN" error={errors.subdomain?.message}>
                  <div className="flex">
                    <input
                      ref={subRef}
                      {...subRest}
                      onChange={e => {
                        e.target.value = e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, '-')
                          .replace(/[^a-z0-9-]/g, '')
                        subOnChange(e)
                      }}
                      placeholder="grace-assembly"
                      style={{ ...INPUT_STYLE, borderRadius: '14px 0 0 14px' }}
                      onFocus={e => (e.currentTarget.style.borderColor = '#7c6bff')}
                      onBlur={e => (e.currentTarget.style.borderColor = 'rgb(var(--inv) / 0.12)')}
                    />
                    <span className="flex items-center px-3 text-xs font-medium whitespace-nowrap" style={{ backgroundColor: '#252643', border: '1px solid #252855', borderLeft: 'none', borderRadius: '0 14px 14px 0', color: 'rgb(var(--inv) / 0.5)' }}>
                      .churchos.org
                    </span>
                  </div>
                </Field>
                <Field label="CONTACT EMAIL" error={errors.email?.message}>
                  <input type="email" {...register('email')} placeholder="contact@grace.org" style={INPUT_STYLE}
                    onFocus={e => (e.currentTarget.style.borderColor = '#7c6bff')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgb(var(--inv) / 0.12)')} />
                </Field>
                <Field label="PHONE NUMBER">
                  <input {...register('phone')} placeholder="+1 (555) 019-2834" style={INPUT_STYLE}
                    onFocus={e => (e.currentTarget.style.borderColor = '#7c6bff')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgb(var(--inv) / 0.12)')} />
                </Field>
              </div>
            </div>

            {/* Admin credentials */}
            <div>
              <p className="text-xs font-bold tracking-widest mb-4" style={{ color: 'var(--accent)' }}>ADMINISTRATOR ACCOUNT</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="ADMIN EMAIL ADDRESS" error={errors.adminEmail?.message}>
                  <input type="email" {...register('adminEmail')} placeholder="admin@domain.com" style={INPUT_STYLE}
                    onFocus={e => (e.currentTarget.style.borderColor = '#7c6bff')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgb(var(--inv) / 0.12)')} />
                </Field>
                <Field label="ADMIN PASSWORD" error={errors.adminPassword?.message}>
                  <input type="password" {...register('adminPassword')} placeholder="••••••••" style={INPUT_STYLE}
                    onFocus={e => (e.currentTarget.style.borderColor = '#7c6bff')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'rgb(var(--inv) / 0.12)')} />
                </Field>
              </div>
            </div>

            <button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'white', boxShadow: '0 8px 20px rgba(100,86,232,0.3)' }}
            >
              {signupMutation.isPending ? 'Creating church…' : <>Register Church & Administrator <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: 'rgb(var(--inv) / 0.45)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: 'var(--accent)' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
