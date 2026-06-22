import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { UserCheck, MessageSquare, Plus, X } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { formatDate } from '@/lib/utils'

interface Visitor {
  id: string
  fullName: string
  phoneNumber?: string
  email?: string
  visitDate: string
  invitedBy?: string
  followUpStatus?: string
  notes?: string
}

interface CounselingRecord {
  id: string
  sessionDate: string
  member?: { fullName: string }
  pastor?: { fullName: string }
  counselingType?: string
  status?: string
  notes?: string
}

interface Member { id: string; fullName: string }

const PAGE_BG = '#131326'
const CARD = '#13152e'
const CARD_INNER = '#1a1b3a'
const ACCENT = '#7c6bff'

const labelStyle: React.CSSProperties = { display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }
const inputStyle: React.CSSProperties = { backgroundColor: '#1e2248', border: '1px solid rgba(255,255,255,0.10)', color: 'white', borderRadius: 12, width: '100%', padding: '10px 14px', fontSize: 14, outline: 'none' }
const outlineBtn: React.CSSProperties = { border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', color: 'white', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }
const gradientBtn: React.CSSProperties = { background: 'linear-gradient(135deg, #7c6bff, #6456e8)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }

const toQS = (obj: Record<string, string | boolean | undefined>) => {
  const p = new URLSearchParams()
  Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) p.append(k, String(v)) })
  return p.toString()
}

interface DrawerProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode }
function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  if (!open) return null
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
        <div style={{ backgroundColor: CARD_INNER, borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: 18, margin: 0 }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
          <div style={{ display: 'flex', gap: 10, padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>{footer}</div>
        </div>
      </div>
    </>
  )
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } }
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }

export function PastoralPage() {
  const [tab, setTab] = useState<'visitors' | 'counseling'>('visitors')
  const [visitorDrawer, setVisitorDrawer] = useState(false)
  const [counselDrawer, setCounselDrawer] = useState(false)

  const [visitorForm, setVisitorForm] = useState({ fullName: '', phoneNumber: '', email: '', visitDateStr: '', invitedBy: '', notes: '' })
  const [counselForm, setCounselForm] = useState({ memberId: '', sessionDateStr: '', counselingType: 'GENERAL', notes: '', actionItems: '', followUpDateStr: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['pastoral'],
    queryFn: () => api.get('/api/pastoral').then(r => r.data as { visitors: Visitor[]; counselingRecords: CounselingRecord[]; members: Member[] }),
  })

  const addVisitor = useMutation({
    mutationFn: () => api.post(`/api/pastoral/visitors?${toQS(visitorForm)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastoral'] })
      setVisitorDrawer(false)
      setVisitorForm({ fullName: '', phoneNumber: '', email: '', visitDateStr: '', invitedBy: '', notes: '' })
    },
  })

  const addCounseling = useMutation({
    mutationFn: () => api.post(`/api/pastoral/counseling?${toQS(counselForm)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastoral'] })
      setCounselDrawer(false)
      setCounselForm({ memberId: '', sessionDateStr: '', counselingType: 'GENERAL', notes: '', actionItems: '', followUpDateStr: '' })
    },
  })

  const followUpMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/pastoral/visitors/status?visitorId=${id}&status=CONTACTED`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pastoral'] }),
  })

  const visitors = data?.visitors ?? []
  const counselingRecords = data?.counselingRecords ?? []
  const members = data?.members ?? []

  const statusBadge = (status?: string) => {
    const s = status ?? 'PENDING'
    const greenStatuses = ['CONVERTED', 'JOINED_MEMBERSHIP']
    const yellowStatuses = ['CONTACTED']
    const bg = greenStatuses.includes(s) ? 'rgba(34,197,94,0.15)' : yellowStatuses.includes(s) ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)'
    const color = greenStatuses.includes(s) ? '#22c55e' : yellowStatuses.includes(s) ? '#f59e0b' : 'rgba(255,255,255,0.5)'
    return <span style={{ backgroundColor: bg, color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{s}</span>
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: PAGE_BG }}>
      <motion.div variants={item} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>Pastoral Care</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Visitors, counseling &amp; welfare</p>
        </div>
        <button
          onClick={() => tab === 'visitors' ? setVisitorDrawer(true) : setCounselDrawer(true)}
          style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={15} /> {tab === 'visitors' ? 'Add Visitor' : 'New Session'}
        </button>
      </motion.div>

      <motion.div variants={item} style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
        {(['visitors', 'counseling'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none',
            color: tab === t ? ACCENT : 'rgba(255,255,255,0.4)',
            borderBottom: tab === t ? `2px solid ${ACCENT}` : '2px solid transparent',
            marginBottom: -1, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {t === 'visitors' ? <UserCheck size={15} /> : <MessageSquare size={15} />}
            {t === 'visitors' ? `Visitors (${visitors.length})` : `Counseling (${counselingRecords.length})`}
          </button>
        ))}
      </motion.div>

      {tab === 'visitors' && (
        <motion.div variants={item}>
          {isLoading && <div style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>}
          {!isLoading && visitors.length === 0 && (
            <div style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 60, textAlign: 'center' }}>
              <UserCheck size={32} style={{ color: ACCENT, margin: '0 auto 12px' }} />
              <p style={{ color: 'white', fontWeight: 600 }}>No visitors recorded</p>
              <button onClick={() => setVisitorDrawer(true)} style={{ marginTop: 12, ...gradientBtn }}>Add Visitor</button>
            </div>
          )}
          {!isLoading && visitors.length > 0 && (
            <div style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                      {['NAME', 'CONTACT', 'VISIT DATE', 'FOLLOW-UP', 'ACTIONS'].map(col => (
                        <th key={col} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.4)' }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visitors.map(v => (
                      <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{v.fullName}</p>
                          {v.invitedBy && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>Invited by: {v.invitedBy}</p>}
                        </td>
                        <td style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                          <p style={{ margin: 0 }}>{v.phoneNumber ?? '-'}</p>
                          <p style={{ margin: 0, fontSize: 12 }}>{v.email ?? ''}</p>
                        </td>
                        <td style={{ padding: '16px 20px', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{formatDate(v.visitDate)}</td>
                        <td style={{ padding: '16px 20px' }}>{statusBadge(v.followUpStatus)}</td>
                        <td style={{ padding: '16px 20px' }}>
                          <button
                            onClick={() => followUpMutation.mutate(v.id)}
                            disabled={followUpMutation.isPending || v.followUpStatus === 'JOINED_MEMBERSHIP' || v.followUpStatus === 'CONVERTED'}
                            style={{ ...outlineBtn, padding: '6px 14px', fontSize: 12, opacity: (v.followUpStatus === 'JOINED_MEMBERSHIP' || v.followUpStatus === 'CONVERTED') ? 0.4 : 1 }}
                          >
                            Follow Up
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {tab === 'counseling' && (
        <motion.div variants={item}>
          {isLoading && <div style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>}
          {!isLoading && counselingRecords.length === 0 && (
            <div style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 60, textAlign: 'center' }}>
              <MessageSquare size={32} style={{ color: ACCENT, margin: '0 auto 12px' }} />
              <p style={{ color: 'white', fontWeight: 600 }}>No counseling sessions recorded</p>
              <button onClick={() => setCounselDrawer(true)} style={{ marginTop: 12, ...gradientBtn }}>New Session</button>
            </div>
          )}
          {!isLoading && counselingRecords.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {counselingRecords.map(r => (
                <div key={r.id} style={{ backgroundColor: CARD, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        {r.counselingType && (
                          <span style={{ backgroundColor: 'rgba(124,107,255,0.15)', color: ACCENT, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{r.counselingType}</span>
                        )}
                        {r.status && (
                          <span style={{ backgroundColor: r.status === 'RESOLVED' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: r.status === 'RESOLVED' ? '#22c55e' : '#f59e0b', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{r.status}</span>
                        )}
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>
                        {r.member && <span>Member: {r.member.fullName} · </span>}
                        {r.pastor && <span>Pastor: {r.pastor.fullName} · </span>}
                        {formatDate(r.sessionDate)}
                      </p>
                      {r.notes && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 6 }}>{r.notes}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Add Visitor Drawer */}
      <Drawer open={visitorDrawer} onClose={() => setVisitorDrawer(false)} title="Record Visitor"
        footer={<>
          <button onClick={() => setVisitorDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => addVisitor.mutate()} disabled={!visitorForm.fullName || !visitorForm.visitDateStr || addVisitor.isPending} style={gradientBtn}>
            {addVisitor.isPending ? 'Saving...' : 'Record Visitor'}
          </button>
        </>}>
        <div><label style={labelStyle}>FULL NAME <span style={{ color: '#f87171' }}>*</span></label>
          <input value={visitorForm.fullName} onChange={e => setVisitorForm(f => ({ ...f, fullName: e.target.value }))} placeholder="Visitor's full name" style={inputStyle} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>PHONE</label>
            <input value={visitorForm.phoneNumber} onChange={e => setVisitorForm(f => ({ ...f, phoneNumber: e.target.value }))} placeholder="Phone number" style={inputStyle} /></div>
          <div><label style={labelStyle}>EMAIL</label>
            <input type="email" value={visitorForm.email} onChange={e => setVisitorForm(f => ({ ...f, email: e.target.value }))} placeholder="Email address" style={inputStyle} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>VISIT DATE <span style={{ color: '#f87171' }}>*</span></label>
            <input type="date" value={visitorForm.visitDateStr} onChange={e => setVisitorForm(f => ({ ...f, visitDateStr: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>INVITED BY</label>
            <input value={visitorForm.invitedBy} onChange={e => setVisitorForm(f => ({ ...f, invitedBy: e.target.value }))} placeholder="Who invited them?" style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>NOTES</label>
          <input value={visitorForm.notes} onChange={e => setVisitorForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes" style={inputStyle} /></div>
      </Drawer>

      {/* Add Counseling Drawer */}
      <Drawer open={counselDrawer} onClose={() => setCounselDrawer(false)} title="New Counseling Session"
        footer={<>
          <button onClick={() => setCounselDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => addCounseling.mutate()} disabled={!counselForm.memberId || !counselForm.sessionDateStr || !counselForm.notes || addCounseling.isPending} style={gradientBtn}>
            {addCounseling.isPending ? 'Saving...' : 'Save Session'}
          </button>
        </>}>
        <div><label style={labelStyle}>MEMBER <span style={{ color: '#f87171' }}>*</span></label>
          <select value={counselForm.memberId} onChange={e => setCounselForm(f => ({ ...f, memberId: e.target.value }))} style={inputStyle}>
            <option value="">Select member...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>SESSION DATE <span style={{ color: '#f87171' }}>*</span></label>
            <input type="date" value={counselForm.sessionDateStr} onChange={e => setCounselForm(f => ({ ...f, sessionDateStr: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>TYPE</label>
            <select value={counselForm.counselingType} onChange={e => setCounselForm(f => ({ ...f, counselingType: e.target.value }))} style={inputStyle}>
              {['MARRIAGE', 'GRIEF', 'ADDICTION', 'FINANCIAL', 'SPIRITUAL', 'GENERAL'].map(t => <option key={t}>{t}</option>)}
            </select></div>
        </div>
        <div><label style={labelStyle}>NOTES <span style={{ color: '#f87171' }}>*</span></label>
          <input value={counselForm.notes} onChange={e => setCounselForm(f => ({ ...f, notes: e.target.value }))} placeholder="Session notes (confidential)" style={inputStyle} /></div>
        <div><label style={labelStyle}>ACTION ITEMS</label>
          <input value={counselForm.actionItems} onChange={e => setCounselForm(f => ({ ...f, actionItems: e.target.value }))} placeholder="Follow-up action items" style={inputStyle} /></div>
        <div><label style={labelStyle}>FOLLOW-UP DATE</label>
          <input type="date" value={counselForm.followUpDateStr} onChange={e => setCounselForm(f => ({ ...f, followUpDateStr: e.target.value }))} style={inputStyle} /></div>
      </Drawer>
    </motion.div>
  )
}
