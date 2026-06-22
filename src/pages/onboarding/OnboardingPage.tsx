import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, Palette, CheckCircle2, ArrowRight, ArrowLeft, Church } from 'lucide-react'
import { api } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useNavigate } from 'react-router-dom'

const step1Schema = z.object({
  churchName: z.string().min(2, 'Church name required'),
  churchEmail: z.string().email('Valid email required').optional().or(z.literal('')),
  churchPhone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
})

const step2Schema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  logoUrl: z.string().optional(),
})

type Step1Data = z.infer<typeof step1Schema>
type Step2Data = z.infer<typeof step2Schema>

const STEPS = [
  { number: 1, label: 'Church Identity', icon: Building2 },
  { number: 2, label: 'Branding', icon: Palette },
  { number: 3, label: 'Complete', icon: CheckCircle2 },
]

const PRESET_COLORS = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'
]

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 40 : -40, opacity: 0 }),
}

export function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null)
  const navigate = useNavigate()

  const { register: reg1, handleSubmit: submit1, formState: { errors: err1 } } = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
  })

  const { register: reg2, handleSubmit: submit2, watch: watch2, setValue: setVal2 } = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { primaryColor: '#3b82f6', secondaryColor: '#10b981' },
  })

  const primaryColor = watch2('primaryColor')

  const onboardMutation = useMutation({
    mutationFn: (data: { step1: Step1Data; step2: Step2Data }) =>
      api.post('/onboarding/complete', data),
    onSuccess: () => {
      setDirection(1)
      setStep(3)
    },
  })

  const handleStep1 = (data: Step1Data) => {
    setStep1Data(data)
    setDirection(1)
    setStep(2)
  }

  const handleStep2 = (data: Step2Data) => {
    if (!step1Data) return
    onboardMutation.mutate({ step1: step1Data, step2: data })
  }

  const goBack = () => {
    setDirection(-1)
    setStep(s => Math.max(1, s - 1))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 mb-4">
            <Church className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Welcome to ChurchOS</h1>
          <p className="text-slate-400 mt-1">Let's get your church set up in minutes</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-between mb-8 px-4">
          {STEPS.map((s, i) => (
            <div key={s.number} className="flex items-center">
              <div className={`flex items-center gap-2 ${step >= s.number ? 'text-blue-600' : 'text-slate-500'}`}>
                <div className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  step > s.number ? 'bg-blue-600 text-white' :
                  step === s.number ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-600 ring-offset-2' :
                  'bg-white/10 text-slate-500'
                }`}>
                  {step > s.number ? <CheckCircle2 className="h-5 w-5" /> : s.number}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step >= s.number ? 'text-blue-600' : 'text-slate-500'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-3 transition-colors ${step > s.number ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ minWidth: 32 }} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-[#13152e] rounded-2xl shadow-xl border border-white/[0.06] overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Church Identity</h2>
                    <p className="text-sm text-slate-400">Basic information about your church</p>
                  </div>
                </div>
                <form onSubmit={submit1(handleStep1)} className="space-y-4">
                  <div className="space-y-1">
                    <Label>Church Name *</Label>
                    <Input {...reg1('churchName')} placeholder="e.g. Grace Bible Church" autoFocus />
                    {err1.churchName && <p className="text-xs text-red-500">{err1.churchName.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Email</Label>
                      <Input {...reg1('churchEmail')} type="email" placeholder="church@email.com" />
                      {err1.churchEmail && <p className="text-xs text-red-500">{err1.churchEmail.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label>Phone</Label>
                      <Input {...reg1('churchPhone')} placeholder="Phone number" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>Address</Label>
                    <Input {...reg1('address')} placeholder="Street address" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>City</Label>
                      <Input {...reg1('city')} placeholder="City" />
                    </div>
                    <div className="space-y-1">
                      <Label>State</Label>
                      <Input {...reg1('state')} placeholder="State" />
                    </div>
                    <div className="space-y-1">
                      <Label>Country</Label>
                      <Input {...reg1('country')} placeholder="Country" defaultValue="Nigeria" />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-end">
                    <Button type="submit" size="lg">
                      Next <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Palette className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Branding</h2>
                    <p className="text-sm text-slate-400">Customize your church's look</p>
                  </div>
                </div>
                <form onSubmit={submit2(handleStep2)} className="space-y-6">
                  <div className="space-y-3">
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-3 flex-wrap">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setVal2('primaryColor', c)}
                          className={`h-9 w-9 rounded-full transition-transform ${primaryColor === c ? 'scale-125 ring-2 ring-offset-2 ring-blue-600' : 'hover:scale-110'}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        {...reg2('primaryColor')}
                        type="color"
                        className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input {...reg2('primaryColor')} placeholder="#3b82f6" className="w-32" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Logo URL (optional)</Label>
                    <Input {...reg2('logoUrl')} placeholder="https://yourchurch.com/logo.png" />
                    <p className="text-xs text-slate-500">You can upload a logo later in settings</p>
                  </div>

                  {/* Preview */}
                  <div className="rounded-xl border border-white/10 p-4 bg-white/[0.04]">
                    <p className="text-xs text-slate-400 mb-3 font-medium">PREVIEW</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                        <Church className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{step1Data?.churchName ?? 'Your Church'}</p>
                        <p className="text-xs text-slate-500">ChurchOS</p>
                      </div>
                    </div>
                    <button type="button" className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90" style={{ backgroundColor: primaryColor }}>
                      Primary Button
                    </button>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={goBack} size="lg">
                      <ArrowLeft className="h-4 w-4" /> Back
                    </Button>
                    <Button type="submit" size="lg" className="flex-1" disabled={onboardMutation.isPending}>
                      {onboardMutation.isPending ? 'Setting up...' : 'Complete Setup'} <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="p-8 text-center"
              >
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">You're all set!</h2>
                <p className="text-slate-400 mb-2">
                  <span className="font-semibold text-slate-200">{step1Data?.churchName ?? 'Your church'}</span> is ready to go on ChurchOS.
                </p>
                <p className="text-sm text-slate-500 mb-8">
                  Start by adding your members, setting up branches, and exploring all the features.
                </p>
                <div className="space-y-3">
                  <Button size="lg" className="w-full" onClick={() => navigate('/dashboard')}>
                    Go to Dashboard <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="lg" className="w-full" onClick={() => navigate('/members')}>
                    Add First Member
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {step < 3 && (
          <p className="text-center text-sm text-slate-500 mt-4">
            Step {step} of 2 ·{' '}
            <button type="button" className="text-blue-500 hover:underline" onClick={() => navigate('/dashboard')}>
              Skip for now
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
