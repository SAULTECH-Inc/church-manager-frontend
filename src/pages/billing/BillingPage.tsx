import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { CreditCard, CheckCircle2, Zap, Crown, Star } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Plan {
  id: string
  name: string
  price: number
  billingCycle?: string
  features?: string[]
  maxMembers?: number
  maxBranches?: number
  isPopular?: boolean
  isCurrent?: boolean
}

interface BillingData {
  plans: Plan[]
  currentPlan?: Plan
  nextBillingDate?: string
  billingHistory?: Array<{ id: string; amount: number; date: string; status: string; description?: string }>
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

const planIcon = (name: string) => {
  if (name.toLowerCase().includes('enterprise') || name.toLowerCase().includes('premium')) return Crown
  if (name.toLowerCase().includes('pro') || name.toLowerCase().includes('growth')) return Zap
  return Star
}

export function BillingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['billing'],
    queryFn: async () => {
      const res = await api.get('/api/billing/plans')
      const d = res.data
      return {
        plans: d.plans ?? [],
        currentPlan: d.currentSubscription?.plan ?? null,
        billingHistory: [],
      } as BillingData
    },
  })

  const subscribeMutation = useMutation({
    mutationFn: (planId: string) => api.post(`/api/billing/subscribe/${planId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['billing'] }),
  })

  const plans = data?.plans ?? []
  const currentPlan = data?.currentPlan
  const billingHistory = data?.billingHistory ?? []

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl">
      <motion.div variants={item}>
        <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
        <p className="text-sm text-slate-400 mt-0.5">Manage your plan and billing history</p>
      </motion.div>

      {/* Current Plan Summary */}
      {currentPlan && (
        <motion.div variants={item}>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-lg">Current Plan: {currentPlan.name}</p>
                    <p className="text-sm text-slate-400">
                      {formatCurrency(currentPlan.price)}/{currentPlan.billingCycle ?? 'month'}
                      {data?.nextBillingDate && <span> · Next billing: {formatDate(data.nextBillingDate)}</span>}
                    </p>
                  </div>
                </div>
                <Badge variant="success" className="text-sm">Active</Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Plans */}
      <motion.div variants={item}>
        <h2 className="text-lg font-semibold text-white mb-4">Available Plans</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="animate-pulse h-80 bg-white/10 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(p => {
              const Icon = planIcon(p.name)
              return (
                <Card
                  key={p.id}
                  className={`relative hover:shadow-lg transition-shadow ${
                    p.isPopular ? 'border-blue-500 shadow-md' : ''
                  } ${p.isCurrent ? 'border-green-400' : ''}`}
                >
                  {p.isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full">Most Popular</span>
                    </div>
                  )}
                  <CardHeader className="pb-4 pt-8">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-3 ${p.isPopular ? 'bg-blue-100' : 'bg-white/10'}`}>
                      <Icon className={`h-6 w-6 ${p.isPopular ? 'text-blue-600' : 'text-slate-300'}`} />
                    </div>
                    <CardTitle>{p.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold text-white">{formatCurrency(p.price)}</span>
                      <span className="text-slate-400 text-sm">/{p.billingCycle ?? 'month'}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(p.features ?? []).length > 0 && (
                      <ul className="space-y-2">
                        {(Array.isArray(p.features) ? p.features : []).map(f => (
                          <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    {(p.maxMembers !== undefined || p.maxBranches !== undefined) && (
                      <div className="text-sm text-slate-400 pt-2 border-t border-white/[0.06] space-y-1">
                        {p.maxMembers && <p>Up to {p.maxMembers.toLocaleString()} members</p>}
                        {p.maxBranches && <p>Up to {p.maxBranches} branches</p>}
                      </div>
                    )}
                    <Button
                      className="w-full"
                      variant={p.isCurrent ? 'outline' : p.isPopular ? 'default' : 'outline'}
                      onClick={() => !p.isCurrent && subscribeMutation.mutate(p.id)}
                      disabled={p.isCurrent || subscribeMutation.isPending}
                    >
                      {p.isCurrent ? 'Current Plan' : 'Upgrade to ' + p.name}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* Billing History */}
      {billingHistory.length > 0 && (
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Billing History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] bg-white/[0.04]">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Description</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {billingHistory.map(b => (
                    <tr key={b.id} className="hover:bg-white/[0.04]">
                      <td className="px-6 py-4 text-slate-200">{b.description ?? 'Subscription payment'}</td>
                      <td className="px-6 py-4 text-slate-400">{formatDate(b.date)}</td>
                      <td className="px-6 py-4">
                        <Badge variant={b.status === 'PAID' ? 'success' : b.status === 'FAILED' ? 'destructive' : 'warning'} className="text-xs">
                          {b.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-white">{formatCurrency(b.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  )
}
