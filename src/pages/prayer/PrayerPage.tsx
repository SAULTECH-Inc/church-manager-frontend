import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, X } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'

interface PrayerRequest { id: string; title: string; requesterName?: string; anonymous: boolean; category?: string; urgency?: string; description?: string; status: string; answeredNote?: string; createdAt?: string; publicRequest?: boolean }
interface Testimony { id: string; title: string; authorName?: string; anonymous: boolean; category?: string; body?: string; status: string; createdAt?: string }
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

const urgencyBar = (urgency?: string) => {
  if (urgency === 'CRITICAL') return '#ef4444'
  if (urgency === 'URGENT') return '#f59e0b'
  return '#6456e8'
}

const prayerStatusColor = (s: string) => {
  if (s === 'OPEN') return { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' }
  if (s === 'IN_PRAYER') return { color: '#7c6bff', bg: 'rgba(124,107,255,0.15)' }
  if (s === 'ANSWERED') return { color: '#34d399', bg: 'rgba(52,211,153,0.15)' }
  return { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' }
}

const testimonyStatusColor = (s: string) => {
  if (s === 'FEATURED') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
  if (s === 'APPROVED') return { color: '#34d399', bg: 'rgba(52,211,153,0.15)' }
  if (s === 'REJECTED') return { color: '#f87171', bg: 'rgba(248,113,113,0.15)' }
  return { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' }
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px' }}>
      <span style={{ color: 'white', fontWeight: 500, fontSize: 14 }}>{label}</span>
      <button onClick={() => onChange(!value)} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', backgroundColor: value ? '#7c6bff' : 'rgba(255,255,255,0.1)', position: 'relative' }}>
        <span style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: 'white', left: value ? 23 : 3, transition: 'left 0.2s' }} />
      </button>
    </div>
  )
}

export function PrayerPage() {
  const [tab, setTab] = useState<'requests' | 'testimonies'>('requests')
  const [prayerDrawer, setPrayerDrawer] = useState(false)
  const [testimonyDrawer, setTestimonyDrawer] = useState(false)
  const [prForm, setPrForm] = useState({ memberId: '', anonymous: false, requesterName: '', title: '', category: 'GENERAL', urgency: 'NORMAL', description: '', publicRequest: true })
  const [teForm, setTeForm] = useState({ memberId: '', anonymous: false, authorName: '', title: '', category: 'HEALING', body: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['prayer'],
    queryFn: () => api.get('/api/prayer').then(r => r.data as { requests: PrayerRequest[], testimonies: Testimony[], members: Member[], stats: Record<string, number> }),
  })

  const toQS = (obj: Record<string, unknown>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) p.append(k, String(v)) }); return p.toString() }
  const createPrayer = useMutation({
    mutationFn: () => api.post(`/api/prayer/request?${toQS(prForm as unknown as Record<string, unknown>)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['prayer'] }); setPrayerDrawer(false); setPrForm({ memberId: '', anonymous: false, requesterName: '', title: '', category: 'GENERAL', urgency: 'NORMAL', description: '', publicRequest: true }) },
  })
  const createTestimony = useMutation({
    mutationFn: () => api.post(`/api/prayer/testimony?${toQS(teForm as unknown as Record<string, unknown>)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['prayer'] }); setTestimonyDrawer(false); setTeForm({ memberId: '', anonymous: false, authorName: '', title: '', category: 'HEALING', body: '' }) },
  })
  const prayerStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.post(`/api/prayer/request/${id}/status?status=${encodeURIComponent(status)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prayer'] }),
  })
  const testimonyMod = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.post(`/api/prayer/testimony/${id}/moderate?status=${encodeURIComponent(status)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prayer'] }),
  })
  const deletePrayer = useMutation({ mutationFn: (id: string) => api.post(`/api/prayer/request/${id}/delete`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prayer'] }) })
  const deleteTestimony = useMutation({ mutationFn: (id: string) => api.post(`/api/prayer/testimony/${id}/delete`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prayer'] }) })

  const requests = data?.requests ?? []
  const testimonies = data?.testimonies ?? []
  const members = data?.members ?? []
  const stats = data?.stats ?? {}

  const kpis = [
    { label: 'Total Requests', value: stats.total ?? requests.length },
    { label: 'Open', value: stats.open ?? 0 },
    { label: 'In Prayer', value: stats.inPrayer ?? 0 },
    { label: 'Answered', value: stats.answered ?? 0 },
    { label: 'Testimonies', value: stats.testimonies ?? testimonies.length },
    { label: 'Pending Review', value: stats.pendingReview ?? 0 },
    { label: 'Featured', value: stats.featured ?? 0 },
  ]

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>Prayer & Testimonies</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Prayer Requests · Testimonies · Intercession</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setPrayerDrawer(true)} style={{ ...outlineBtn }}>🙏 Prayer Request</button>
          <button onClick={() => setTestimonyDrawer(true)} style={{ ...gradientBtn }}>📖 Share Testimony</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 14, marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ backgroundColor: '#13152e', borderRadius: 18, border: '1px solid rgba(255,255,255,0.08)', padding: 18 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 22, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-6" style={{ backgroundColor: '#13152e', borderRadius: 14, padding: 4, width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['requests', 'testimonies'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, backgroundColor: tab === t ? '#7c6bff' : 'transparent', color: tab === t ? 'white' : 'rgba(255,255,255,0.5)' }}>
            {t === 'requests' ? '🙏 Prayer Requests' : '📖 Testimonies'}
          </button>
        ))}
      </div>

      {isLoading && <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>}

      {!isLoading && tab === 'requests' && (
        requests.length === 0
          ? <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 60, textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>No prayer requests yet</p>
            </div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {requests.map(r => {
                const sc = prayerStatusColor(r.status)
                return (
                  <div key={r.id} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: 4, backgroundColor: urgencyBar(r.urgency) }} />
                    <div style={{ padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{r.status.replace('_', ' ')}</span>
                        <button onClick={() => { if (confirm('Delete?')) deletePrayer.mutate(r.id) }}
                          style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <h3 style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>{r.title}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 8px' }}>{r.anonymous ? 'Anonymous' : (r.requesterName || 'Member')} {r.createdAt ? '· ' + new Date(r.createdAt).toLocaleDateString() : ''}</p>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                        {r.category && <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', borderRadius: 20, padding: '2px 8px', fontSize: 11 }}>{r.category}</span>}
                        {r.urgency && r.urgency !== 'NORMAL' && <span style={{ backgroundColor: r.urgency === 'CRITICAL' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)', color: r.urgency === 'CRITICAL' ? '#f87171' : '#f59e0b', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{r.urgency}</span>}
                      </div>
                      {r.description && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 10px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const }}>{r.description}</p>}
                      {r.answeredNote && <div style={{ backgroundColor: 'rgba(52,211,153,0.1)', borderRadius: 10, padding: '8px 12px', marginBottom: 10 }}><p style={{ color: '#34d399', fontSize: 12, margin: 0 }}>✅ {r.answeredNote}</p></div>}
                      <div style={{ display: 'flex', gap: 6 }}>
                        {r.status === 'OPEN' && <button onClick={() => prayerStatus.mutate({ id: r.id, status: 'IN_PRAYER' })} style={{ backgroundColor: 'rgba(124,107,255,0.15)', border: 'none', color: '#7c6bff', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 11 }}>🕊️ In Prayer</button>}
                        {r.status !== 'ANSWERED' && r.status !== 'CLOSED' && <button onClick={() => prayerStatus.mutate({ id: r.id, status: 'ANSWERED' })} style={{ backgroundColor: 'rgba(52,211,153,0.1)', border: 'none', color: '#34d399', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 11 }}>✅ Answered</button>}
                        {r.status !== 'CLOSED' && <button onClick={() => prayerStatus.mutate({ id: r.id, status: 'CLOSED' })} style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 11 }}>Close</button>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
      )}

      {!isLoading && tab === 'testimonies' && (
        testimonies.length === 0
          ? <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 60, textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>No testimonies yet</p>
            </div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {testimonies.map(t => {
                const sc = testimonyStatusColor(t.status)
                return (
                  <div key={t.id} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <div style={{ height: 4, background: t.status === 'FEATURED' ? 'linear-gradient(135deg, #f59e0b, #ef4444)' : t.status === 'APPROVED' ? '#34d399' : t.status === 'REJECTED' ? '#f87171' : 'rgba(255,255,255,0.1)' }} />
                    <div style={{ padding: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{t.status}</span>
                        <button onClick={() => { if (confirm('Delete?')) deleteTestimony.mutate(t.id) }}
                          style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <h3 style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>{t.title}</h3>
                      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 8px' }}>{t.anonymous ? 'Anonymous' : (t.authorName || 'Member')} {t.createdAt ? '· ' + new Date(t.createdAt).toLocaleDateString() : ''}</p>
                      {t.category && <span style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', borderRadius: 20, padding: '2px 8px', fontSize: 11, display: 'inline-block', marginBottom: 10 }}>{t.category}</span>}
                      {t.body && <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 10px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' as const }}>{t.body}</p>}
                      <div style={{ display: 'flex', gap: 6 }}>
                        {t.status !== 'APPROVED' && t.status !== 'FEATURED' && <button onClick={() => testimonyMod.mutate({ id: t.id, status: 'APPROVED' })} style={{ backgroundColor: 'rgba(52,211,153,0.1)', border: 'none', color: '#34d399', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 11 }}>Approve</button>}
                        {t.status !== 'FEATURED' && <button onClick={() => testimonyMod.mutate({ id: t.id, status: 'FEATURED' })} style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: 'none', color: '#f59e0b', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 11 }}>⭐ Feature</button>}
                        {t.status !== 'REJECTED' && <button onClick={() => testimonyMod.mutate({ id: t.id, status: 'REJECTED' })} style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: 'none', color: '#f87171', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: 11 }}>Reject</button>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
      )}

      <Drawer open={prayerDrawer} onClose={() => setPrayerDrawer(false)} title="Submit Prayer Request"
        footer={<>
          <button onClick={() => setPrayerDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => createPrayer.mutate()} disabled={!prForm.title || !prForm.description || createPrayer.isPending} style={gradientBtn}>{createPrayer.isPending ? 'Submitting...' : 'Submit Request'}</button>
        </>}>
        <div><label style={labelStyle}>MEMBER (OPTIONAL)</label>
          <select value={prForm.memberId} onChange={e => setPrForm(f => ({ ...f, memberId: e.target.value }))} style={inputStyle}>
            <option value="">Select member...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
        <Toggle value={prForm.anonymous} onChange={v => setPrForm(f => ({ ...f, anonymous: v }))} label="Anonymous Request" />
        {!prForm.anonymous && <div><label style={labelStyle}>REQUESTER NAME</label><input type="text" value={prForm.requesterName} onChange={e => setPrForm(f => ({ ...f, requesterName: e.target.value }))} style={inputStyle} /></div>}
        <div><label style={labelStyle}>TITLE <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={prForm.title} onChange={e => setPrForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>CATEGORY</label>
          <select value={prForm.category} onChange={e => setPrForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
            {['GENERAL', 'HEALING', 'PROVISION', 'PROTECTION', 'GUIDANCE', 'FAMILY', 'RELATIONSHIPS', 'WORK', 'OTHER'].map(c => <option key={c}>{c}</option>)}
          </select></div>
        <div><label style={labelStyle}>URGENCY</label>
          <select value={prForm.urgency} onChange={e => setPrForm(f => ({ ...f, urgency: e.target.value }))} style={inputStyle}>
            <option value="NORMAL">Normal</option><option value="URGENT">Urgent</option><option value="CRITICAL">Critical</option>
          </select></div>
        <div><label style={labelStyle}>DESCRIPTION <span style={{ color: '#f87171' }}>*</span></label><textarea rows={4} value={prForm.description} onChange={e => setPrForm(f => ({ ...f, description: e.target.value }))} placeholder="Share the prayer request..." style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
        <Toggle value={prForm.publicRequest} onChange={v => setPrForm(f => ({ ...f, publicRequest: v }))} label="Make Public to Church" />
      </Drawer>

      <Drawer open={testimonyDrawer} onClose={() => setTestimonyDrawer(false)} title="Share Testimony"
        footer={<>
          <button onClick={() => setTestimonyDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => createTestimony.mutate()} disabled={!teForm.title || !teForm.body || createTestimony.isPending} style={gradientBtn}>{createTestimony.isPending ? 'Submitting...' : 'Share Testimony'}</button>
        </>}>
        <div><label style={labelStyle}>MEMBER (OPTIONAL)</label>
          <select value={teForm.memberId} onChange={e => setTeForm(f => ({ ...f, memberId: e.target.value }))} style={inputStyle}>
            <option value="">Select member...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
        <Toggle value={teForm.anonymous} onChange={v => setTeForm(f => ({ ...f, anonymous: v }))} label="Share Anonymously" />
        {!teForm.anonymous && <div><label style={labelStyle}>AUTHOR NAME</label><input type="text" value={teForm.authorName} onChange={e => setTeForm(f => ({ ...f, authorName: e.target.value }))} style={inputStyle} /></div>}
        <div><label style={labelStyle}>TITLE <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={teForm.title} onChange={e => setTeForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>CATEGORY</label>
          <select value={teForm.category} onChange={e => setTeForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
            {['HEALING', 'PROVISION', 'PROTECTION', 'SALVATION', 'RESTORATION', 'FINANCIAL', 'MARRIAGE', 'OTHER'].map(c => <option key={c}>{c}</option>)}
          </select></div>
        <div><label style={labelStyle}>YOUR STORY <span style={{ color: '#f87171' }}>*</span></label><textarea rows={5} value={teForm.body} onChange={e => setTeForm(f => ({ ...f, body: e.target.value }))} placeholder="Share what God has done..." style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
        <div style={{ backgroundColor: 'rgba(124,107,255,0.1)', borderRadius: 12, padding: '12px 16px' }}>
          <p style={{ color: '#7c6bff', fontSize: 13, margin: 0 }}>ℹ️ Testimonies are reviewed before being published to the church community.</p>
        </div>
      </Drawer>
    </div>
  )
}
