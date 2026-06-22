import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, X, Download, Upload, ChevronDown, FileText } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'

interface Contribution { id: string; donorName?: string; type: string; paymentMethod: string; amount: number; givingDate: string; notes?: string; member?: { fullName: string } }
interface Pledge { id: string; purpose: string; targetAmount: number; amountPaid: number; balance: number; dueDate: string; status: string; member?: { fullName: string } }
interface Member { id: string; fullName: string }

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

const pledgeStatusColor = (s: string) => {
  if (s === 'FULFILLED') return { color: '#34d399', bg: 'rgba(52,211,153,0.15)' }
  if (s === 'OVERDUE') return { color: '#f87171', bg: 'rgba(248,113,113,0.15)' }
  return { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' }
}
const fmt = (n: number) => `₦${n.toLocaleString()}`

export function CollectionsPage() {
  const [tab, setTab] = useState<'income' | 'pledges'>('income')
  const [logDrawer, setLogDrawer] = useState(false)
  const [pledgeDrawer, setPledgeDrawer] = useState(false)
  const [payDrawer, setPayDrawer] = useState(false)
  const [payPledgeId, setPayPledgeId] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [exportMenu, setExportMenu] = useState(false)
  const [stmtOpen, setStmtOpen] = useState(false)
  const [stmtForm, setStmtForm] = useState({ memberId: '', startDate: '', endDate: '' })
  const [logForm, setLogForm] = useState({ isAnonymous: false, memberId: '', donorName: '', type: 'TITHE', paymentMethod: 'CASH', amount: '', givingDateStr: '', notes: '' })
  const [pledgeForm, setPledgeForm] = useState({ memberId: '', purpose: '', targetAmount: '', dueDateStr: '' })
  const [payForm, setPayForm] = useState({ paymentAmount: '', paymentMethod: 'CASH' })

  const { data, isLoading } = useQuery({
    queryKey: ['collections'],
    queryFn: () => api.get('/api/collections').then(r => r.data as { contributions: Contribution[], pledges: Pledge[], members: Member[], stats: Record<string, number> }),
  })

  const toQS = (obj: Record<string, unknown>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) p.append(k, String(v)) }); return p.toString() }
  const logMutation = useMutation({
    mutationFn: () => api.post(`/api/collections?${toQS(logForm as unknown as Record<string, unknown>)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['collections'] }); setLogDrawer(false); setLogForm({ isAnonymous: false, memberId: '', donorName: '', type: 'TITHE', paymentMethod: 'CASH', amount: '', givingDateStr: '', notes: '' }) },
  })
  const pledgeMutation = useMutation({
    mutationFn: () => api.post(`/api/collections/pledges?${toQS(pledgeForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['collections'] }); setPledgeDrawer(false); setPledgeForm({ memberId: '', purpose: '', targetAmount: '', dueDateStr: '' }) },
  })
  const payMutation = useMutation({
    mutationFn: () => api.post(`/api/collections/pledges/pay?${toQS({ ...payForm, pledgeId: payPledgeId })}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['collections'] }); setPayDrawer(false); setPayForm({ paymentAmount: '', paymentMethod: 'CASH' }); setPayPledgeId('') },
  })
  const importMut = useMutation({
    mutationFn: async () => {
      const fd = new FormData(); fd.append('file', importFile!)
      await api.post('/api/collections/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['collections'] }); setImportOpen(false); setImportFile(null) },
  })

  const contributions = data?.contributions ?? []
  const pledges = data?.pledges ?? []
  const members = data?.members ?? []
  const stats = data?.stats ?? {}

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>Collections</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Income Register · Pledges · Contributions</p>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ position: 'relative' }}>
            <button onClick={() => setExportMenu(v => !v)} style={{ ...outlineBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}>
              <Download size={14} /> Export <ChevronDown size={13} />
            </button>
            {exportMenu && (
              <div style={{ position: 'absolute', top: '110%', right: 0, backgroundColor: '#1a1b3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 6, zIndex: 100, minWidth: 100 }}>
                {['xlsx', 'csv', 'pdf'].map(fmt => (
                  <button key={fmt} onClick={() => { window.location.href = `/api/collections/export?format=${fmt}`; setExportMenu(false) }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', borderRadius: 8, fontSize: 13 }}>
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setImportOpen(true)} style={{ ...outlineBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}>
            <Upload size={14} /> Import
          </button>
          <button onClick={() => setStmtOpen(true)} style={{ ...outlineBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}>
            <FileText size={14} /> Statement
          </button>
          <button onClick={() => setPledgeDrawer(true)} style={{ ...outlineBtn, fontSize: 13, padding: '8px 14px' }}>Register Pledge</button>
          <button onClick={() => setLogDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}><Plus size={14} /> Log Contribution</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Income', value: fmt(stats.totalIncome ?? 0), color: '#34d399' },
          { label: 'Total Pledges', value: fmt(stats.totalPledges ?? 0), color: '#7c6bff' },
          { label: 'Cash & Transfer', value: fmt(stats.cashTransferTotal ?? 0), color: '#60a5fa' },
          { label: 'Online & Other', value: fmt(stats.onlineOtherTotal ?? 0), color: '#f59e0b' },
        ].map(k => (
          <div key={k.label} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
            <p style={{ color: k.color, fontWeight: 700, fontSize: 22, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-6" style={{ backgroundColor: '#13152e', borderRadius: 14, padding: 4, width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['income', 'pledges'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, backgroundColor: tab === t ? '#7c6bff' : 'transparent', color: tab === t ? 'white' : 'rgba(255,255,255,0.5)' }}>
            {t === 'income' ? '💰 Income Register' : '🤝 Pledges'}
          </button>
        ))}
      </div>

      {isLoading && <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>}

      {!isLoading && tab === 'income' && (
        <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                {['DONOR', 'TYPE', 'METHOD', 'AMOUNT', 'DATE', 'NOTE', 'ACTIONS'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{col}</th>
                ))}
              </tr></thead>
              <tbody>
                {contributions.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>No contributions logged yet</td></tr>}
                {contributions.map(c => (
                  <tr key={c.id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-4" style={{ color: 'white', fontWeight: 500 }}>{c.member?.fullName ?? c.donorName ?? 'Anonymous'}</td>
                    <td className="px-5 py-4"><span style={{ backgroundColor: 'rgba(124,107,255,0.15)', color: '#7c6bff', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{c.type}</span></td>
                    <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{c.paymentMethod}</td>
                    <td className="px-5 py-4" style={{ color: '#34d399', fontWeight: 700 }}>{fmt(c.amount)}</td>
                    <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{new Date(c.givingDate).toLocaleDateString()}</td>
                    <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.notes || '—'}</td>
                    <td className="px-5 py-4"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!isLoading && tab === 'pledges' && (
        <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                {['MEMBER', 'PURPOSE', 'TARGET', 'PAID', 'BALANCE', 'DUE DATE', 'STATUS', 'ACTIONS'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{col}</th>
                ))}
              </tr></thead>
              <tbody>
                {pledges.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>No pledges registered yet</td></tr>}
                {pledges.map(p => {
                  const sc = pledgeStatusColor(p.status)
                  return (
                    <tr key={p.id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-4" style={{ color: 'white', fontWeight: 500 }}>{p.member?.fullName ?? '—'}</td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{p.purpose}</td>
                      <td className="px-5 py-4" style={{ color: 'white', fontWeight: 600 }}>{fmt(p.targetAmount)}</td>
                      <td className="px-5 py-4" style={{ color: '#34d399', fontWeight: 600 }}>{fmt(p.amountPaid)}</td>
                      <td className="px-5 py-4" style={{ color: p.balance > 0 ? '#f59e0b' : '#34d399', fontWeight: 600 }}>{fmt(p.balance)}</td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{new Date(p.dueDate).toLocaleDateString()}</td>
                      <td className="px-5 py-4"><span style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{p.status}</span></td>
                      <td className="px-5 py-4">
                        <button onClick={() => { setPayPledgeId(p.id); setPayDrawer(true) }}
                          style={{ backgroundColor: 'rgba(52,211,153,0.1)', border: 'none', color: '#34d399', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap' }}>
                          Log Payment
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Drawer open={stmtOpen} onClose={() => setStmtOpen(false)} title="Member Giving Statement"
        footer={<>
          <button onClick={() => setStmtOpen(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => {
            if (!stmtForm.memberId) return
            const p = new URLSearchParams({ memberId: stmtForm.memberId })
            if (stmtForm.startDate) p.append('startDateStr', stmtForm.startDate)
            if (stmtForm.endDate) p.append('endDateStr', stmtForm.endDate)
            window.location.href = `/api/collections/statement/pdf?${p.toString()}`
          }} disabled={!stmtForm.memberId} style={gradientBtn}>
            <Download size={14} style={{ display: 'inline', marginRight: 6 }} /> Download PDF
          </button>
        </>}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 4px' }}>Generate a personalised giving statement for a member — useful for tax receipts and annual summaries.</p>
        <div><label style={labelStyle}>MEMBER *</label>
          <select value={stmtForm.memberId} onChange={e => setStmtForm(f => ({ ...f, memberId: e.target.value }))} style={inputStyle}>
            <option value="">— Select member —</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>FROM DATE</label><input type="date" value={stmtForm.startDate} onChange={e => setStmtForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>TO DATE</label><input type="date" value={stmtForm.endDate} onChange={e => setStmtForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} /></div>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, margin: 0 }}>Leave dates blank to include all contributions.</p>
      </Drawer>

      <Drawer open={importOpen} onClose={() => setImportOpen(false)} title="Import Contributions"
        footer={<>
          <button onClick={() => setImportOpen(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => importMut.mutate()} disabled={!importFile || importMut.isPending} style={gradientBtn}>{importMut.isPending ? 'Importing...' : 'Import'}</button>
        </>}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 16px' }}>Upload a CSV or Excel file to bulk-import contribution records.</p>
        <div><label style={labelStyle}>FILE (CSV / XLSX)</label>
          <input type="file" accept=".csv,.xlsx" onChange={e => setImportFile(e.target.files?.[0] ?? null)} style={inputStyle} /></div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 12 }}>
          Need a template?{' '}
          <a href="/api/collections/import/template" style={{ color: '#7c6bff', textDecoration: 'none', fontWeight: 600 }}>Download Template</a>
        </p>
      </Drawer>

      <Drawer open={logDrawer} onClose={() => setLogDrawer(false)} title="Log Contribution"
        footer={<>
          <button onClick={() => setLogDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => logMutation.mutate()} disabled={!logForm.amount || !logForm.givingDateStr || logMutation.isPending} style={gradientBtn}>{logMutation.isPending ? 'Logging...' : 'Log Contribution'}</button>
        </>}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px' }}>
          <div><p style={{ color: 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>Anonymous Donation</p><p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '2px 0 0' }}>Hide donor identity</p></div>
          <button onClick={() => setLogForm(f => ({ ...f, isAnonymous: !f.isAnonymous }))}
            style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', backgroundColor: logForm.isAnonymous ? '#7c6bff' : 'rgba(255,255,255,0.1)', position: 'relative' }}>
            <span style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: 'white', left: logForm.isAnonymous ? 23 : 3 }} />
          </button>
        </div>
        {!logForm.isAnonymous && <div><label style={labelStyle}>CHURCH MEMBER</label>
          <select value={logForm.memberId} onChange={e => setLogForm(f => ({ ...f, memberId: e.target.value }))} style={inputStyle}>
            <option value="">Select member...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>}
        {logForm.isAnonymous && <div><label style={labelStyle}>DONOR NAME</label>
          <input type="text" value={logForm.donorName} onChange={e => setLogForm(f => ({ ...f, donorName: e.target.value }))} placeholder="Optional" style={inputStyle} /></div>}
        <div><label style={labelStyle}>TYPE <span style={{ color: '#f87171' }}>*</span></label>
          <select value={logForm.type} onChange={e => setLogForm(f => ({ ...f, type: e.target.value }))} style={inputStyle}>
            {['TITHE', 'OFFERING', 'DONATION', 'BUILDING_FUND', 'WELFARE', 'PROJECT', 'SPECIAL', 'OTHER'].map(t => <option key={t}>{t}</option>)}
          </select></div>
        <div><label style={labelStyle}>PAYMENT METHOD</label>
          <select value={logForm.paymentMethod} onChange={e => setLogForm(f => ({ ...f, paymentMethod: e.target.value }))} style={inputStyle}>
            {['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'ONLINE', 'OTHER'].map(m => <option key={m}>{m}</option>)}
          </select></div>
        <div><label style={labelStyle}>AMOUNT <span style={{ color: '#f87171' }}>*</span></label>
          <input type="number" min="0" step="0.01" value={logForm.amount} onChange={e => setLogForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>DATE <span style={{ color: '#f87171' }}>*</span></label>
          <input type="date" value={logForm.givingDateStr} onChange={e => setLogForm(f => ({ ...f, givingDateStr: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>NOTES</label>
          <textarea rows={2} value={logForm.notes} onChange={e => setLogForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      </Drawer>

      <Drawer open={pledgeDrawer} onClose={() => setPledgeDrawer(false)} title="Register Pledge"
        footer={<>
          <button onClick={() => setPledgeDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => pledgeMutation.mutate()} disabled={!pledgeForm.memberId || !pledgeForm.purpose || !pledgeForm.targetAmount || pledgeMutation.isPending} style={gradientBtn}>{pledgeMutation.isPending ? 'Registering...' : 'Register Pledge'}</button>
        </>}>
        <div><label style={labelStyle}>MEMBER <span style={{ color: '#f87171' }}>*</span></label>
          <select value={pledgeForm.memberId} onChange={e => setPledgeForm(f => ({ ...f, memberId: e.target.value }))} style={inputStyle}>
            <option value="">Select member...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
        <div><label style={labelStyle}>PURPOSE <span style={{ color: '#f87171' }}>*</span></label>
          <input type="text" value={pledgeForm.purpose} onChange={e => setPledgeForm(f => ({ ...f, purpose: e.target.value }))} placeholder="e.g. Building Fund 2025" style={inputStyle} /></div>
        <div><label style={labelStyle}>TARGET AMOUNT <span style={{ color: '#f87171' }}>*</span></label>
          <input type="number" min="0" step="0.01" value={pledgeForm.targetAmount} onChange={e => setPledgeForm(f => ({ ...f, targetAmount: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>DUE DATE <span style={{ color: '#f87171' }}>*</span></label>
          <input type="date" value={pledgeForm.dueDateStr} onChange={e => setPledgeForm(f => ({ ...f, dueDateStr: e.target.value }))} style={inputStyle} /></div>
      </Drawer>

      <Drawer open={payDrawer} onClose={() => setPayDrawer(false)} title="Log Pledge Payment"
        footer={<>
          <button onClick={() => setPayDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => payMutation.mutate()} disabled={!payPledgeId || !payForm.paymentAmount || payMutation.isPending} style={gradientBtn}>{payMutation.isPending ? 'Logging...' : 'Log Payment'}</button>
        </>}>
        <div><label style={labelStyle}>PLEDGE <span style={{ color: '#f87171' }}>*</span></label>
          <select value={payPledgeId} onChange={e => setPayPledgeId(e.target.value)} style={inputStyle}>
            <option value="">Select pledge...</option>
            {pledges.map(p => <option key={p.id} value={p.id}>{p.member?.fullName ?? 'Member'} — {p.purpose} (Balance: {fmt(p.balance)})</option>)}
          </select></div>
        <div><label style={labelStyle}>AMOUNT <span style={{ color: '#f87171' }}>*</span></label>
          <input type="number" min="0" step="0.01" value={payForm.paymentAmount} onChange={e => setPayForm(f => ({ ...f, paymentAmount: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>METHOD</label>
          <select value={payForm.paymentMethod} onChange={e => setPayForm(f => ({ ...f, paymentMethod: e.target.value }))} style={inputStyle}>
            {['CASH', 'BANK_TRANSFER', 'CARD', 'CHEQUE', 'ONLINE', 'OTHER'].map(m => <option key={m}>{m}</option>)}
          </select></div>
      </Drawer>
    </div>
  )
}
