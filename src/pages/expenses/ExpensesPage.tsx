import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, X, Check, Download, ChevronDown } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'

interface Expense { id: string; categoryName?: string; recipientOrVendor: string; amount: number; paymentMethod: string; expenseDate: string; description?: string; status: string }
interface Category { id: string; name: string; description?: string; expenseCount?: number; allocatedTotal?: number }
interface Budget { id: string; categoryName?: string; allocatedAmount: number; spentAmount: number; remainingAmount: number; startDate: string; endDate: string }

const labelStyle: React.CSSProperties = { display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }
const inputStyle: React.CSSProperties = { backgroundColor: '#1e2248', border: '1px solid rgba(255,255,255,0.10)', color: 'white', borderRadius: 12, width: '100%', padding: '10px 14px', fontSize: 14, outline: 'none' }
const outlineBtn: React.CSSProperties = { border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', color: 'white', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }
const gradientBtn: React.CSSProperties = { background: 'linear-gradient(135deg, #7c6bff, #6456e8)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }

interface DrawerProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode }
function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: 20, pointerEvents: 'none' }}>
        <div className="flex flex-col overflow-hidden" style={{ backgroundColor: '#1a1b3a', borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'auto' }}>
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-5">{children}</div>
          <div className="shrink-0 flex gap-3 px-6 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>{footer}</div>
        </div>
      </div>
    </>
  )
}

const statusColors: Record<string, { color: string; bg: string }> = {
  PENDING: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  APPROVED: { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  PAID: { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  REJECTED: { color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
}
const fmt = (n: number) => `₦${n.toLocaleString()}`

export function ExpensesPage() {
  const [tab, setTab] = useState<'expenses' | 'categories' | 'budgets'>('expenses')
  const [expDrawer, setExpDrawer] = useState(false)
  const [catDrawer, setCatDrawer] = useState(false)
  const [budDrawer, setBudDrawer] = useState(false)
  const [exportMenu, setExportMenu] = useState(false)
  const [expForm, setExpForm] = useState({ categoryId: '', recipientOrVendor: '', amount: '', paymentMethod: 'CASH', expenseDate: '', description: '' })
  const [catForm, setCatForm] = useState({ name: '', description: '' })
  const [budForm, setBudForm] = useState({ categoryId: '', allocatedAmount: '', startDate: '', endDate: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => api.get('/api/expenses').then(r => r.data as { expenses: Expense[], categories: Category[], budgets: Budget[] }),
  })

  const toQS = (obj: Record<string, string>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v) p.append(k, v) }); return p.toString() }
  const logMutation = useMutation({
    mutationFn: () => api.post(`/api/expenses/create?${toQS(expForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); setExpDrawer(false); setExpForm({ categoryId: '', recipientOrVendor: '', amount: '', paymentMethod: 'CASH', expenseDate: '', description: '' }) },
  })
  const catMutation = useMutation({
    mutationFn: () => api.post(`/api/expenses/category?${toQS(catForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); setCatDrawer(false); setCatForm({ name: '', description: '' }) },
  })
  const budMutation = useMutation({
    mutationFn: () => api.post(`/api/expenses/budget?${toQS(budForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['expenses'] }); setBudDrawer(false); setBudForm({ categoryId: '', allocatedAmount: '', startDate: '', endDate: '' }) },
  })
  const approveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/expenses/approve/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  })
  const delExpMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/expenses/deactivate?ids=${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['expenses'] }),
  })

  const expenses = data?.expenses ?? []
  const categories = data?.categories ?? []
  const budgets = data?.budgets ?? []

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>Expenses</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Expense Tracking · Categories · Budgets</p>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ position: 'relative' }}>
            <button onClick={() => setExportMenu(v => !v)} style={{ ...outlineBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}>
              <Download size={14} /> Export <ChevronDown size={13} />
            </button>
            {exportMenu && (
              <div style={{ position: 'absolute', top: '110%', right: 0, backgroundColor: '#1a1b3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 6, zIndex: 100, minWidth: 100 }}>
                {['xlsx', 'csv', 'pdf'].map(fmt => (
                  <button key={fmt} onClick={() => { window.location.href = `/api/expenses/export?format=${fmt}`; setExportMenu(false) }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', borderRadius: 8, fontSize: 13 }}>
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setBudDrawer(true)} style={{ ...outlineBtn, fontSize: 13, padding: '8px 14px' }}>Allocate Budget</button>
          <button onClick={() => setCatDrawer(true)} style={{ ...outlineBtn, fontSize: 13, padding: '8px 14px' }}>Add Category</button>
          <button onClick={() => setExpDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}><Plus size={14} /> Log Expense</button>
        </div>
      </div>

      <div className="flex gap-1 mb-6" style={{ backgroundColor: '#13152e', borderRadius: 14, padding: 4, width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['expenses', 'categories', 'budgets'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, backgroundColor: tab === t ? '#7c6bff' : 'transparent', color: tab === t ? 'white' : 'rgba(255,255,255,0.5)' }}>
            {t === 'expenses' ? '💸 Expenses' : t === 'categories' ? '🗂️ Categories' : '📊 Budgets'}
          </button>
        ))}
      </div>

      {isLoading && <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>}

      {!isLoading && tab === 'expenses' && (
        <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                {['CATEGORY', 'RECIPIENT/VENDOR', 'AMOUNT', 'METHOD', 'DATE', 'STATUS', 'ACTIONS'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{col}</th>
                ))}
              </tr></thead>
              <tbody>
                {expenses.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>No expenses logged yet</td></tr>}
                {expenses.map(e => {
                  const sc = statusColors[e.status] ?? { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.06)' }
                  return (
                    <tr key={e.id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-4"><span style={{ backgroundColor: 'rgba(124,107,255,0.15)', color: '#7c6bff', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{e.categoryName ?? '—'}</span></td>
                      <td className="px-5 py-4" style={{ color: 'white', fontWeight: 500 }}>{e.recipientOrVendor}</td>
                      <td className="px-5 py-4" style={{ color: '#f87171', fontWeight: 700 }}>{fmt(e.amount)}</td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{e.paymentMethod}</td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{new Date(e.expenseDate).toLocaleDateString()}</td>
                      <td className="px-5 py-4"><span style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{e.status}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {e.status === 'PENDING' && <button onClick={() => approveMutation.mutate(e.id)}
                            style={{ backgroundColor: 'rgba(52,211,153,0.1)', border: 'none', color: '#34d399', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Check size={13} /></button>}
                          <button onClick={() => { if (confirm('Delete?')) delExpMutation.mutate(e.id) }}
                            style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && tab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {categories.length === 0 && <div style={{ gridColumn: '1/-1', backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 60, textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>No categories yet</p>
            <button onClick={() => setCatDrawer(true)} style={{ marginTop: 12, ...gradientBtn }}>Add Category</button>
          </div>}
          {categories.map(c => (
            <div key={c.id} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: 0 }}>{c.name}</h3>
              </div>
              {c.description && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 12px' }}>{c.description}</p>}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '0 0 4px' }}>EXPENSES</p>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 18, margin: 0 }}>{c.expenseCount ?? 0}</p>
                </div>
                <div style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '0 0 4px' }}>ALLOCATED</p>
                  <p style={{ color: '#7c6bff', fontWeight: 700, fontSize: 18, margin: 0 }}>{fmt(c.allocatedTotal ?? 0)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && tab === 'budgets' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {budgets.length === 0 && <div style={{ gridColumn: '1/-1', backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 60, textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)' }}>No budgets allocated yet</p>
            <button onClick={() => setBudDrawer(true)} style={{ marginTop: 12, ...gradientBtn }}>Allocate Budget</button>
          </div>}
          {budgets.map(b => {
            const pct = b.allocatedAmount > 0 ? Math.min(100, (b.spentAmount / b.allocatedAmount) * 100) : 0
            const barColor = pct > 90 ? '#f87171' : pct > 70 ? '#f59e0b' : '#7c6bff'
            return (
              <div key={b.id} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: '0 0 4px' }}>{b.categoryName ?? 'Category'}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 16px' }}>{new Date(b.startDate).toLocaleDateString()} – {new Date(b.endDate).toLocaleDateString()}</p>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Spent {fmt(b.spentAmount)}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{pct.toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div style={{ height: '100%', borderRadius: 3, backgroundColor: barColor, width: `${pct}%` }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div><p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>ALLOCATED</p><p style={{ color: 'white', fontWeight: 600, fontSize: 15, margin: 0 }}>{fmt(b.allocatedAmount)}</p></div>
                  <div style={{ textAlign: 'right' }}><p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>REMAINING</p><p style={{ color: b.remainingAmount >= 0 ? '#34d399' : '#f87171', fontWeight: 600, fontSize: 15, margin: 0 }}>{fmt(b.remainingAmount)}</p></div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Drawer open={expDrawer} onClose={() => setExpDrawer(false)} title="Log Expense"
        footer={<>
          <button onClick={() => setExpDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => logMutation.mutate()} disabled={!expForm.categoryId || !expForm.recipientOrVendor || !expForm.amount || logMutation.isPending} style={gradientBtn}>{logMutation.isPending ? 'Logging...' : 'Log Expense'}</button>
        </>}>
        <div><label style={labelStyle}>CATEGORY <span style={{ color: '#f87171' }}>*</span></label>
          <select value={expForm.categoryId} onChange={e => setExpForm(f => ({ ...f, categoryId: e.target.value }))} style={inputStyle}>
            <option value="">Select category...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
        <div><label style={labelStyle}>RECIPIENT / VENDOR <span style={{ color: '#f87171' }}>*</span></label>
          <input type="text" value={expForm.recipientOrVendor} onChange={e => setExpForm(f => ({ ...f, recipientOrVendor: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>AMOUNT <span style={{ color: '#f87171' }}>*</span></label>
          <input type="number" min="0" step="0.01" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>PAYMENT METHOD</label>
          <select value={expForm.paymentMethod} onChange={e => setExpForm(f => ({ ...f, paymentMethod: e.target.value }))} style={inputStyle}>
            {['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'ONLINE', 'OTHER'].map(m => <option key={m}>{m}</option>)}
          </select></div>
        <div><label style={labelStyle}>DATE <span style={{ color: '#f87171' }}>*</span></label>
          <input type="date" value={expForm.expenseDate} onChange={e => setExpForm(f => ({ ...f, expenseDate: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>DESCRIPTION</label>
          <textarea rows={3} value={expForm.description} onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      </Drawer>

      <Drawer open={catDrawer} onClose={() => setCatDrawer(false)} title="Add Category"
        footer={<>
          <button onClick={() => setCatDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => catMutation.mutate()} disabled={!catForm.name || catMutation.isPending} style={gradientBtn}>{catMutation.isPending ? 'Saving...' : 'Add Category'}</button>
        </>}>
        <div><label style={labelStyle}>NAME <span style={{ color: '#f87171' }}>*</span></label>
          <input type="text" value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Utilities, Maintenance" style={inputStyle} /></div>
        <div><label style={labelStyle}>DESCRIPTION</label>
          <textarea rows={3} value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      </Drawer>

      <Drawer open={budDrawer} onClose={() => setBudDrawer(false)} title="Allocate Budget"
        footer={<>
          <button onClick={() => setBudDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => budMutation.mutate()} disabled={!budForm.categoryId || !budForm.allocatedAmount || budMutation.isPending} style={gradientBtn}>{budMutation.isPending ? 'Saving...' : 'Allocate Budget'}</button>
        </>}>
        <div><label style={labelStyle}>CATEGORY <span style={{ color: '#f87171' }}>*</span></label>
          <select value={budForm.categoryId} onChange={e => setBudForm(f => ({ ...f, categoryId: e.target.value }))} style={inputStyle}>
            <option value="">Select category...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></div>
        <div><label style={labelStyle}>ALLOCATED AMOUNT <span style={{ color: '#f87171' }}>*</span></label>
          <input type="number" min="0" step="0.01" value={budForm.allocatedAmount} onChange={e => setBudForm(f => ({ ...f, allocatedAmount: e.target.value }))} style={inputStyle} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>START DATE <span style={{ color: '#f87171' }}>*</span></label>
            <input type="date" value={budForm.startDate} onChange={e => setBudForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>END DATE <span style={{ color: '#f87171' }}>*</span></label>
            <input type="date" value={budForm.endDate} onChange={e => setBudForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} /></div>
        </div>
      </Drawer>
    </div>
  )
}
