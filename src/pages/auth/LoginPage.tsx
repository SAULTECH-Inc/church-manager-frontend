import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Mail, Lock, ArrowRight, Compass } from 'lucide-react'
import { login } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

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

export function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const loginMutation = useMutation({
    mutationFn: (d: FormData) => login(d.email, d.password),
    onSuccess: (user) => { setUser(user); navigate('/') },
    onError: () => setError('root', { message: 'Invalid email or password' }),
  })

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: '#131326' }}>
      {/* Decorative blobs */}
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'rgba(124,107,255,0.15)', filter: 'blur(100px)' }} />
      <div className="absolute -bottom-20 -right-20 w-[30rem] h-[30rem] rounded-full pointer-events-none" style={{ background: 'rgba(124,107,255,0.10)', filter: 'blur(120px)' }} />

      <div className="w-full max-w-md relative z-10">
        <div
          className="p-10 md:p-12"
          style={{
            backgroundColor: 'rgba(19,21,46,0.3)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 40,
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          }}
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #7c6bff, #6456e8)', boxShadow: '0 8px 20px rgba(100,86,232,0.3)' }}>
              <Compass size={22} color="white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
            <p className="text-sm mt-1.5" style={{ color: 'rgba(255,255,255,0.5)' }}>Sign in to manage your church operations</p>
          </div>

          {errors.root && (
            <div className="mb-5 px-4 py-3 rounded-2xl text-sm" style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(d => loginMutation.mutate(d))} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>EMAIL ADDRESS</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <input
                  type="email"
                  {...register('email')}
                  placeholder="name@domain.com"
                  style={INPUT_STYLE}
                  onFocus={e => (e.currentTarget.style.borderColor = '#7c6bff')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#252855')}
                />
              </div>
              {errors.email && <p className="text-xs mt-1.5" style={{ color: '#fca5a5' }}>{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>PASSWORD</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }} />
                <input
                  type="password"
                  {...register('password')}
                  placeholder="••••••••"
                  style={INPUT_STYLE}
                  onFocus={e => (e.currentTarget.style.borderColor = '#7c6bff')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#252855')}
                />
              </div>
              {errors.password && <p className="text-xs mt-1.5" style={{ color: '#fca5a5' }}>{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full flex items-center justify-center gap-2 font-bold py-4 rounded-2xl transition-all disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #7c6bff, #6456e8)',
                color: '#131326',
                boxShadow: '0 8px 20px rgba(100,86,232,0.3)',
              }}
            >
              {loginMutation.isPending ? 'Signing in…' : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Don't have a church account?{' '}
            <Link to="/signup" className="font-semibold" style={{ color: '#7c6bff' }}>Register Church</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
