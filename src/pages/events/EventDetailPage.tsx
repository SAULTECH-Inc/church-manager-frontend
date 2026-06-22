import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Plus, X, UserCheck, Calendar, MapPin, Users, DollarSign } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'

interface EventDetail {
  id: string; name: string; description?: string; eventType: string
  startDate: string; endDate?: string; location?: string; maxCapacity?: number
  budgetAllocated?: number | null; budgetSpent?: number | null; status: string
}
interface EventSession {
  id: string; title: string; description?: string; speakerName?: string
  startTime?: string; endTime?: string
}
interface EventRegistration {
  id: string; visitorName?: string; visitorEmail?: string
  registrationDate?: string; ticketNumber?: string; checkedIn?: boolean
  member?: { id: string; fullName: string }
}
interface Member { id: string; fullName: string }

const PAGE_BG = 'var(--page-bg)'
const CARD = 'var(--card-bg)'
const CARD_INNER = 'var(--drawer-bg)'
const ACCENT = '#7c6bff'

const labelStyle: React.CSSProperties = { display: 'block', color: 'rgb(var(--inv) / 0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }
const inputStyle: React.CSSProperties = { backgroundColor: 'var(--input-bg)', border: '1px solid rgb(var(--inv) / 0.10)', color: 'var(--text-primary)', borderRadius: 12, width: '100%', padding: '10px 14px', fontSize: 14, outline: 'none' }
const outlineBtn: React.CSSProperties = { border: '1px solid rgb(var(--inv) / 0.15)', backgroundColor: 'transparent', color: 'var(--text-primary)', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }
const gradientBtn: React.CSSProperties = { background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--text-primary)', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }

const toQS = (obj: Record<string, string | number | undefined>) => {
  const p = new URLSearchParams()
  Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) p.append(k, String(v)) })
  return p.toString()
}

const fmt = (n?: number | null) => n != null ? `₦${n.toLocaleString()}` : '—'

const fmtDt = (s?: string | null) => {
  if (!s) return '—'
  try { return new Date(s).toLocaleString() } catch { return s }
}

interface DrawerProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode }
function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  if (!open) return null
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
        <div style={{ backgroundColor: CARD_INNER, borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', border: '1px solid rgb(var(--inv) / 0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgb(var(--inv) / 0.08)' }}>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, margin: 0 }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgb(var(--inv) / 0.5)', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>{children}</div>
          <div style={{ display: 'flex', gap: 10, padding: '16px 24px', borderTop: '1px solid rgb(var(--inv) / 0.08)' }}>{footer}</div>
        </div>
      </div>
    </>
  )
}

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  PUBLISHED: { color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  DRAFT: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  COMPLETED: { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  CANCELLED: { color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
}
const TYPE_COLOR = { color: ACCENT, bg: 'rgba(124,107,255,0.15)' }

export function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [tab, setTab] = useState<'sessions' | 'registrations'>('sessions')
  const [sessionDrawer, setSessionDrawer] = useState(false)
  const [registerDrawer, setRegisterDrawer] = useState(false)
  const [editDrawer, setEditDrawer] = useState(false)

  const [sessionForm, setSessionForm] = useState({ title: '', description: '', speakerName: '', startTime: '', endTime: '' })
  const [registerForm, setRegisterForm] = useState({ memberId: '', visitorName: '', visitorEmail: '' })
  const [editForm, setEditForm] = useState({ name: '', description: '', eventType: '', startDate: '', endDate: '', location: '', maxCapacity: '', budgetAllocated: '', status: '' })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get(`/api/events/${id}`).then(r => r.data as {
      event: EventDetail; sessions: EventSession[]; registrations: EventRegistration[]
      stats: Record<string, unknown>; allMembers: Member[]
    }),
    enabled: !!id,
  })

  const addSession = useMutation({
    mutationFn: () => api.post(`/api/events/${id}/sessions?${toQS(sessionForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['event', id] }); setSessionDrawer(false); setSessionForm({ title: '', description: '', speakerName: '', startTime: '', endTime: '' }) },
  })

  const register = useMutation({
    mutationFn: () => api.post(`/api/events/${id}/register?${toQS(registerForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['event', id] }); setRegisterDrawer(false); setRegisterForm({ memberId: '', visitorName: '', visitorEmail: '' }) },
  })

  const checkIn = useMutation({
    mutationFn: (ticketNumber: string) => api.post(`/api/events/${id}/checkin?ticketNumber=${encodeURIComponent(ticketNumber)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event', id] }),
  })

  const editEvent = useMutation({
    mutationFn: () => api.post(`/api/events/${id}/edit?${toQS(editForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['event', id] }); queryClient.invalidateQueries({ queryKey: ['events'] }); setEditDrawer(false) },
  })

  if (isLoading) return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: PAGE_BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgb(var(--inv) / 0.4)' }}>Loading event...</p>
    </div>
  )

  if (isError || !data?.event) return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: PAGE_BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ color: 'rgb(var(--inv) / 0.4)' }}>Event not found.</p>
      <button onClick={() => navigate('/events')} style={outlineBtn}>← Back to Events</button>
    </div>
  )

  const { event, sessions = [], registrations = [], allMembers = [] } = data

  const openEdit = () => {
    setEditForm({
      name: event.name, description: event.description ?? '', eventType: event.eventType,
      startDate: event.startDate?.slice(0, 16) ?? '', endDate: event.endDate?.slice(0, 16) ?? '',
      location: event.location ?? '', maxCapacity: event.maxCapacity?.toString() ?? '',
      budgetAllocated: event.budgetAllocated?.toString() ?? '', status: event.status,
    })
    setEditDrawer(true)
  }

  const sc = STATUS_COLORS[event.status] ?? { color: 'rgb(var(--inv) / 0.5)', bg: 'rgb(var(--inv) / 0.06)' }

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: PAGE_BG }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <button onClick={() => navigate('/events')} style={{ background: 'rgb(var(--inv) / 0.06)', border: 'none', color: 'rgb(var(--inv) / 0.6)', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <ArrowLeft size={16} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <h1 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 26, margin: 0 }}>{event.name}</h1>
            <span style={{ backgroundColor: TYPE_COLOR.bg, color: TYPE_COLOR.color, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>{event.eventType}</span>
            <span style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>{event.status}</span>
          </div>
          {event.description && <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 14, margin: 0 }}>{event.description}</p>}
        </div>
        <button onClick={openEdit} style={outlineBtn}>Edit Event</button>
      </div>

      {/* Info cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: <Calendar size={18} />, label: 'Start', value: fmtDt(event.startDate) },
          { icon: <MapPin size={18} />, label: 'Location', value: event.location ?? '—' },
          { icon: <Users size={18} />, label: 'Registrations', value: `${registrations.length}${event.maxCapacity ? ` / ${event.maxCapacity}` : ''}` },
          { icon: <DollarSign size={18} />, label: 'Budget', value: `${fmt(event.budgetAllocated)} alloc · ${fmt(event.budgetSpent)} spent` },
        ].map(c => (
          <div key={c.label} style={{ backgroundColor: CARD, borderRadius: 16, border: '1px solid rgb(var(--inv) / 0.08)', padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: ACCENT, marginTop: 2 }}>{c.icon}</span>
            <div>
              <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{c.label}</p>
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, margin: 0 }}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid rgb(var(--inv) / 0.08)', marginBottom: 20 }}>
        {(['sessions', 'registrations'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer', border: 'none', background: 'none',
            color: tab === t ? ACCENT : 'rgb(var(--inv) / 0.4)',
            borderBottom: tab === t ? `2px solid ${ACCENT}` : '2px solid transparent',
            marginBottom: -1, textTransform: 'capitalize',
          }}>
            {t === 'sessions' ? `Sessions (${sessions.length})` : `Registrations (${registrations.length})`}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {tab === 'sessions' && (
          <button onClick={() => setSessionDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, marginBottom: 4 }}>
            <Plus size={14} /> Add Session
          </button>
        )}
        {tab === 'registrations' && (
          <button onClick={() => setRegisterDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, marginBottom: 4 }}>
            <Plus size={14} /> Register Attendee
          </button>
        )}
      </div>

      {/* Sessions tab */}
      {tab === 'sessions' && (
        <div style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', overflow: 'hidden' }}>
          {sessions.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <Calendar size={32} style={{ color: ACCENT, margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 4px' }}>No sessions yet</p>
              <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 13, margin: 0 }}>Add programme sessions for this event</p>
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgb(var(--inv) / 0.06)', backgroundColor: 'rgb(var(--inv) / 0.03)' }}>
                  {['TITLE', 'SPEAKER', 'START TIME', 'END TIME'].map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgb(var(--inv) / 0.4)' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgb(var(--inv) / 0.04)' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: 0 }}>{s.title}</p>
                      {s.description && <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 12, margin: 0 }}>{s.description}</p>}
                    </td>
                    <td style={{ padding: '14px 20px', color: 'rgb(var(--inv) / 0.6)', fontSize: 13 }}>{s.speakerName ?? '—'}</td>
                    <td style={{ padding: '14px 20px', color: 'rgb(var(--inv) / 0.6)', fontSize: 13 }}>{fmtDt(s.startTime)}</td>
                    <td style={{ padding: '14px 20px', color: 'rgb(var(--inv) / 0.6)', fontSize: 13 }}>{fmtDt(s.endTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Registrations tab */}
      {tab === 'registrations' && (
        <div style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', overflow: 'hidden' }}>
          {registrations.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <Users size={32} style={{ color: ACCENT, margin: '0 auto 12px' }} />
              <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: '0 0 4px' }}>No registrations yet</p>
              <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 13, margin: 0 }}>Register attendees for this event</p>
            </div>
          ) : (
            <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgb(var(--inv) / 0.06)', backgroundColor: 'rgb(var(--inv) / 0.03)' }}>
                  {['ATTENDEE', 'TICKET #', 'REGISTERED', 'STATUS', 'ACTIONS'].map(col => (
                    <th key={col} style={{ textAlign: 'left', padding: '12px 20px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgb(var(--inv) / 0.4)' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrations.map(r => {
                  const name = r.member?.fullName ?? r.visitorName ?? 'Unknown'
                  const email = r.visitorEmail
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid rgb(var(--inv) / 0.04)' }}>
                      <td style={{ padding: '14px 20px' }}>
                        <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: 0 }}>{name}</p>
                        {email && <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 12, margin: 0 }}>{email}</p>}
                      </td>
                      <td style={{ padding: '14px 20px', color: 'rgb(var(--inv) / 0.5)', fontSize: 13, fontFamily: 'monospace' }}>{r.ticketNumber ?? '—'}</td>
                      <td style={{ padding: '14px 20px', color: 'rgb(var(--inv) / 0.5)', fontSize: 13 }}>{fmtDt(r.registrationDate)}</td>
                      <td style={{ padding: '14px 20px' }}>
                        {r.checkedIn
                          ? <span style={{ backgroundColor: 'rgba(34,197,94,0.15)', color: '#22c55e', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>Checked In</span>
                          : <span style={{ backgroundColor: 'rgb(var(--inv) / 0.06)', color: 'rgb(var(--inv) / 0.4)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>Pending</span>
                        }
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        {!r.checkedIn && r.ticketNumber && (
                          <button onClick={() => checkIn.mutate(r.ticketNumber!)} disabled={checkIn.isPending}
                            style={{ background: 'rgba(34,197,94,0.1)', border: 'none', color: '#22c55e', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <UserCheck size={13} /> Check In
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Session Drawer */}
      <Drawer open={sessionDrawer} onClose={() => setSessionDrawer(false)} title="Add Session"
        footer={<>
          <button onClick={() => setSessionDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => addSession.mutate()} disabled={!sessionForm.title || addSession.isPending} style={gradientBtn}>
            {addSession.isPending ? 'Adding...' : 'Add Session'}
          </button>
        </>}>
        <div><label style={labelStyle}>TITLE <span style={{ color: '#f87171' }}>*</span></label>
          <input value={sessionForm.title} onChange={e => setSessionForm(f => ({ ...f, title: e.target.value }))} placeholder="Session title" style={inputStyle} /></div>
        <div><label style={labelStyle}>SPEAKER</label>
          <input value={sessionForm.speakerName} onChange={e => setSessionForm(f => ({ ...f, speakerName: e.target.value }))} placeholder="Speaker name" style={inputStyle} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>START TIME</label>
            <input type="datetime-local" value={sessionForm.startTime} onChange={e => setSessionForm(f => ({ ...f, startTime: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>END TIME</label>
            <input type="datetime-local" value={sessionForm.endTime} onChange={e => setSessionForm(f => ({ ...f, endTime: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>DESCRIPTION</label>
          <input value={sessionForm.description} onChange={e => setSessionForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" style={inputStyle} /></div>
      </Drawer>

      {/* Register Attendee Drawer */}
      <Drawer open={registerDrawer} onClose={() => setRegisterDrawer(false)} title="Register Attendee"
        footer={<>
          <button onClick={() => setRegisterDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => register.mutate()} disabled={(!registerForm.memberId && !registerForm.visitorName) || register.isPending} style={gradientBtn}>
            {register.isPending ? 'Registering...' : 'Register'}
          </button>
        </>}>
        <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 13, margin: 0 }}>Select a member OR enter visitor details.</p>
        <div><label style={labelStyle}>MEMBER</label>
          <select value={registerForm.memberId} onChange={e => setRegisterForm(f => ({ ...f, memberId: e.target.value, visitorName: '', visitorEmail: '' }))} style={inputStyle}>
            <option value="">— Select member —</option>
            {allMembers.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
        <p style={{ color: 'rgb(var(--inv) / 0.3)', fontSize: 12, textAlign: 'center', margin: 0 }}>— or walk-in visitor —</p>
        <div><label style={labelStyle}>VISITOR NAME</label>
          <input value={registerForm.visitorName} onChange={e => setRegisterForm(f => ({ ...f, visitorName: e.target.value, memberId: '' }))} placeholder="Full name" style={inputStyle} /></div>
        <div><label style={labelStyle}>VISITOR EMAIL</label>
          <input type="email" value={registerForm.visitorEmail} onChange={e => setRegisterForm(f => ({ ...f, visitorEmail: e.target.value }))} placeholder="Email address" style={inputStyle} /></div>
      </Drawer>

      {/* Edit Event Drawer */}
      <Drawer open={editDrawer} onClose={() => setEditDrawer(false)} title="Edit Event"
        footer={<>
          <button onClick={() => setEditDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => editEvent.mutate()} disabled={!editForm.name || editEvent.isPending} style={gradientBtn}>
            {editEvent.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </>}>
        <div><label style={labelStyle}>EVENT NAME <span style={{ color: '#f87171' }}>*</span></label>
          <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>TYPE</label>
          <select value={editForm.eventType} onChange={e => setEditForm(f => ({ ...f, eventType: e.target.value }))} style={inputStyle}>
            {['SUNDAY_SERVICE', 'CONFERENCE', 'CRUSADE', 'RETREAT', 'CAMP', 'WEDDING', 'FUNERAL', 'TRAINING', 'OTHER'].map(t => <option key={t}>{t}</option>)}
          </select></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>START DATE <span style={{ color: '#f87171' }}>*</span></label>
            <input type="datetime-local" value={editForm.startDate} onChange={e => setEditForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>END DATE</label>
            <input type="datetime-local" value={editForm.endDate} onChange={e => setEditForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>LOCATION</label>
          <input value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} style={inputStyle} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>MAX CAPACITY</label>
            <input type="number" min="0" value={editForm.maxCapacity} onChange={e => setEditForm(f => ({ ...f, maxCapacity: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>BUDGET ALLOCATED</label>
            <input type="number" min="0" value={editForm.budgetAllocated} onChange={e => setEditForm(f => ({ ...f, budgetAllocated: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>STATUS</label>
          <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
            {['DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED'].map(s => <option key={s}>{s}</option>)}
          </select></div>
        <div><label style={labelStyle}>DESCRIPTION</label>
          <input value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} /></div>
      </Drawer>
    </div>
  )
}
