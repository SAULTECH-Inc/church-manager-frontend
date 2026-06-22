import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, X, Send } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { RichTextDisplay } from '@/components/editor/RichTextDisplay'

interface Message { id: string; subject: string; body?: string; channel: string; audienceFilter?: string; recipientCount?: number; status: string; sentAt?: string; createdAt?: string }

const labelStyle: React.CSSProperties = { display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }
const inputStyle: React.CSSProperties = { backgroundColor: '#1e2248', border: '1px solid rgba(255,255,255,0.10)', color: 'white', borderRadius: 12, width: '100%', padding: '10px 14px', fontSize: 14, outline: 'none' }
const outlineBtn: React.CSSProperties = { border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', color: 'white', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }
const gradientBtn: React.CSSProperties = { background: 'linear-gradient(135deg, #7c6bff, #6456e8)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }

interface DrawerProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode }
function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  if (!open) return null
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
        <div style={{ backgroundColor: '#1a1b3a', borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', pointerEvents: 'auto' }}>
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: 18 }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-5">{children}</div>
          <div className="shrink-0 flex gap-3 px-6 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>{footer}</div>
        </div>
      </div>
    </>
  )
}

const msgStatusColor = (s: string) => {
  if (s === 'SENT') return { color: '#34d399', bg: 'rgba(52,211,153,0.15)' }
  if (s === 'DRAFT') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
  if (s === 'SCHEDULED') return { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' }
  if (s === 'FAILED') return { color: '#f87171', bg: 'rgba(248,113,113,0.15)' }
  return { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' }
}
const channelIcon = (c: string) => c === 'EMAIL' ? '✉️' : c === 'SMS' ? '📱' : '🔔'

export function CommunicationPage() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [composeDrawer, setComposeDrawer] = useState(false)
  const [form, setForm] = useState({ subject: '', channel: 'EMAIL', audienceFilter: 'ALL', filterValue: '', body: '' })
  const [sendMode, setSendMode] = useState<'draft' | 'send'>('send')

  const { data, isLoading } = useQuery({
    queryKey: ['communication'],
    queryFn: () => api.get('/api/communication').then(r => r.data as { messages: Message[], stats: Record<string, number> }),
  })

  const toQS = (obj: Record<string, string>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v) p.append(k, v) }); return p.toString() }
  const sendMutation = useMutation({
    mutationFn: (draft: boolean) => api.post(`${draft ? '/api/communication/draft' : '/api/communication/send'}?${toQS(form)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['communication'] }); setComposeDrawer(false); setForm({ subject: '', channel: 'EMAIL', audienceFilter: 'ALL', filterValue: '', body: '' }) },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/communication/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communication'] }),
  })

  const messages = data?.messages ?? []
  const stats = data?.stats ?? {}

  const filtered = statusFilter === 'ALL' ? messages : messages.filter(m => m.status === statusFilter)

  const kpis = [
    { label: 'Total Messages', value: stats.total ?? messages.length, color: '#7c6bff' },
    { label: 'Sent', value: stats.sent ?? 0, color: '#34d399' },
    { label: 'Drafts', value: stats.drafts ?? 0, color: '#f59e0b' },
    { label: 'Failed', value: stats.failed ?? 0, color: '#f87171' },
    { label: 'People Reached', value: stats.totalReached ?? 0, color: '#60a5fa' },
  ]

  const charCount = form.body.length
  const smsCredits = form.channel === 'SMS' ? Math.ceil(charCount / 160) : 0

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>Communication</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Messages · Email · SMS · Notifications</p>
        </div>
        <button onClick={() => setComposeDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> Compose Message</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
            <p style={{ color: k.color, fontWeight: 700, fontSize: 26, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['ALL', 'SENT', 'DRAFT', 'FAILED'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, backgroundColor: statusFilter === s ? '#7c6bff' : 'rgba(255,255,255,0.06)', color: statusFilter === s ? 'white' : 'rgba(255,255,255,0.5)' }}>
              {s}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              {['SUBJECT', 'CHANNEL', 'AUDIENCE', 'RECIPIENTS', 'STATUS', 'DATE', 'ACTIONS'].map(col => (
                <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{col}</th>
              ))}
            </tr></thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>Loading...</td></tr>}
              {!isLoading && filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>No messages yet</td></tr>}
              {filtered.map(m => {
                const sc = msgStatusColor(m.status)
                return (
                  <tr key={m.id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-4">
                      <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{m.subject}</p>
                      {m.body && <RichTextDisplay html={m.body} clamp={2} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '2px 0 0', maxWidth: 220 }} />}
                    </td>
                    <td className="px-5 py-4"><span style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'white', borderRadius: 20, padding: '3px 10px', fontSize: 12 }}>{channelIcon(m.channel)} {m.channel}</span></td>
                    <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{m.audienceFilter || 'ALL'}</td>
                    <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{m.recipientCount ?? '—'}</td>
                    <td className="px-5 py-4"><span style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{m.status}</span></td>
                    <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{m.sentAt ? new Date(m.sentAt).toLocaleDateString() : m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(m.id) }}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Drawer open={composeDrawer} onClose={() => setComposeDrawer(false)} title="Compose Message"
        footer={<>
          <button onClick={() => setComposeDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => { setSendMode('draft'); sendMutation.mutate(true) }} disabled={!form.subject || sendMutation.isPending} style={{ ...outlineBtn }}>Save Draft</button>
          <button onClick={() => { setSendMode('send'); sendMutation.mutate(false) }} disabled={!form.subject || !form.body || sendMutation.isPending} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}><Send size={14} /> Send Now</button>
        </>}>
        <div><label style={labelStyle}>SUBJECT <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Message subject" style={inputStyle} /></div>
        <div>
          <label style={labelStyle}>CHANNEL</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {(['EMAIL', 'SMS', 'IN_APP'] as const).map(ch => (
              <button key={ch} onClick={() => setForm(f => ({ ...f, channel: ch }))}
                style={{ padding: '12px 8px', borderRadius: 12, border: `1px solid ${form.channel === ch ? '#7c6bff' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', backgroundColor: form.channel === ch ? 'rgba(124,107,255,0.15)' : 'rgba(255,255,255,0.04)', color: form.channel === ch ? '#7c6bff' : 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                {channelIcon(ch)} {ch.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
        <div><label style={labelStyle}>AUDIENCE</label>
          <select value={form.audienceFilter} onChange={e => setForm(f => ({ ...f, audienceFilter: e.target.value, filterValue: '' }))} style={inputStyle}>
            {['ALL', 'BRANCH', 'GROUP', 'GENDER', 'STATUS', 'CUSTOM'].map(a => <option key={a}>{a}</option>)}
          </select></div>
        {form.audienceFilter === 'GENDER' && (
          <div><label style={labelStyle}>GENDER</label>
            <select value={form.filterValue} onChange={e => setForm(f => ({ ...f, filterValue: e.target.value }))} style={inputStyle}>
              <option value="">Select...</option><option value="MALE">Male</option><option value="FEMALE">Female</option>
            </select></div>
        )}
        {form.audienceFilter === 'STATUS' && (
          <div><label style={labelStyle}>MEMBER STATUS</label>
            <select value={form.filterValue} onChange={e => setForm(f => ({ ...f, filterValue: e.target.value }))} style={inputStyle}>
              <option value="">Select...</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="VISITOR">Visitor</option>
            </select></div>
        )}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>MESSAGE BODY <span style={{ color: '#f87171' }}>*</span></label>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{charCount}{form.channel === 'SMS' && ` · ${smsCredits} SMS credit${smsCredits !== 1 ? 's' : ''}`}</span>
          </div>
          <RichTextEditor value={form.body} onChange={v => setForm(f => ({ ...f, body: v }))} placeholder="Type your message here..." minHeight={180} />
        </div>
        <div style={{ backgroundColor: 'rgba(124,107,255,0.1)', borderRadius: 12, padding: '12px 16px' }}>
          <p style={{ color: '#7c6bff', fontSize: 13, margin: 0 }}>ℹ️ Recipients are resolved from the church directory based on your audience selection at send time.</p>
        </div>
      </Drawer>
    </div>
  )
}
