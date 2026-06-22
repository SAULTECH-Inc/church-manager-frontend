import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, X, Check } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'

interface Facility { id: string; name: string; facilityType: string; capacity?: number; location?: string; hourlyRate?: number; amenities?: string; description?: string; available: boolean }
interface Booking { id: string; facilityName?: string; facilityType?: string; bookerName?: string; bookerContact?: string; purpose?: string; bookingDate?: string; startTime?: string; endTime?: string; cost?: number; attendees?: number; status: string; memberId?: string }
interface Member { id: string; fullName: string }

const labelStyle: React.CSSProperties = { display: 'block', color: 'rgb(var(--inv) / 0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }
const inputStyle: React.CSSProperties = { backgroundColor: 'var(--input-bg)', border: '1px solid rgb(var(--inv) / 0.10)', color: 'var(--text-primary)', borderRadius: 12, width: '100%', padding: '10px 14px', fontSize: 14, outline: 'none' }
const outlineBtn: React.CSSProperties = { border: '1px solid rgb(var(--inv) / 0.15)', backgroundColor: 'transparent', color: 'var(--text-primary)', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }
const gradientBtn: React.CSSProperties = { background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--text-primary)', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }

interface DrawerProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode }
function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  if (!open) return null
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
        <div style={{ backgroundColor: 'var(--drawer-bg)', borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', border: '1px solid rgb(var(--inv) / 0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', pointerEvents: 'auto' }}>
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgb(var(--inv) / 0.08)' }}>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18 }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgb(var(--inv) / 0.5)', cursor: 'pointer' }}><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-5">{children}</div>
          <div className="shrink-0 flex gap-3 px-6 py-4 border-t" style={{ borderColor: 'rgb(var(--inv) / 0.08)' }}>{footer}</div>
        </div>
      </div>
    </>
  )
}

const facilityTypeStripe = (t: string) => {
  if (t === 'AUDITORIUM') return 'linear-gradient(135deg, #6456e8, #4c3fda)'
  if (t === 'HALL') return 'linear-gradient(135deg, #0d9488, #0891b2)'
  if (t === 'CHAPEL') return 'linear-gradient(135deg, #d97706, #ea580c)'
  return 'linear-gradient(135deg, #374151, #4b5563)'
}

const bookingStatusColors: Record<string, { color: string; bg: string }> = {
  PENDING: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  APPROVED: { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  COMPLETED: { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  REJECTED: { color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
  CANCELLED: { color: 'rgb(var(--inv) / 0.4)', bg: 'rgb(var(--inv) / 0.06)' },
}

export function FacilityPage() {
  const [tab, setTab] = useState<'bookings' | 'facilities'>('bookings')
  const [addFacDrawer, setAddFacDrawer] = useState(false)
  const [bookDrawer, setBookDrawer] = useState(false)
  const [preBookId, setPreBookId] = useState('')
  const [facForm, setFacForm] = useState({ name: '', facilityType: 'AUDITORIUM', capacity: '', location: '', hourlyRate: '', amenities: '', description: '' })
  const [bookForm, setBookForm] = useState({ facilityId: '', memberId: '', bookerName: '', bookerContact: '', purpose: '', bookingDate: '', startTime: '', endTime: '', attendees: '', notes: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['facility'],
    queryFn: () => api.get('/api/facility').then(r => r.data as { bookings: Booking[], facilities: Facility[], members: Member[], stats: Record<string, number> }),
  })

  const toQS = (obj: Record<string, string>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v) p.append(k, v) }); return p.toString() }
  const createFacility = useMutation({
    mutationFn: () => api.post(`/api/facility/create?${toQS(facForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['facility'] }); setAddFacDrawer(false); setFacForm({ name: '', facilityType: 'AUDITORIUM', capacity: '', location: '', hourlyRate: '', amenities: '', description: '' }) },
  })
  const createBooking = useMutation({
    mutationFn: () => api.post(`/api/facility/book?${toQS(bookForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['facility'] }); setBookDrawer(false); setBookForm({ facilityId: '', memberId: '', bookerName: '', bookerContact: '', purpose: '', bookingDate: '', startTime: '', endTime: '', attendees: '', notes: '' }) },
  })
  const approveBooking = useMutation({ mutationFn: (id: string) => api.post(`/api/facility/booking/${id}/approve`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['facility'] }) })
  const rejectBooking = useMutation({ mutationFn: (id: string) => api.post(`/api/facility/booking/${id}/reject`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['facility'] }) })
  const completeBooking = useMutation({ mutationFn: (id: string) => api.post(`/api/facility/booking/${id}/complete`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['facility'] }) })
  const cancelBooking = useMutation({ mutationFn: (id: string) => api.post(`/api/facility/booking/${id}/cancel`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['facility'] }) })
  const deleteFacility = useMutation({ mutationFn: (id: string) => api.post(`/api/facility/${id}/delete`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['facility'] }) })

  const bookings = data?.bookings ?? []
  const facilities = data?.facilities ?? []
  const members = data?.members ?? []
  const stats = data?.stats ?? {}

  const openBook = (facilityId = '') => { setPreBookId(facilityId); setBookForm(f => ({ ...f, facilityId })); setBookDrawer(true) }

  const kpis = [
    { label: 'Total Facilities', value: stats.totalFacilities ?? facilities.length, icon: '🏢' },
    { label: 'Available', value: stats.available ?? 0, icon: '✅' },
    { label: 'Total Bookings', value: stats.totalBookings ?? bookings.length, icon: '📅' },
    { label: 'Pending', value: stats.pending ?? 0, icon: '⏳' },
    { label: 'Approved', value: stats.approved ?? 0, icon: '🔑' },
    { label: 'Completed', value: stats.completed ?? 0, icon: '🏁' },
  ]

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: 'var(--page-bg)' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 26, margin: 0 }}>Facility Management</h1>
          <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 14, marginTop: 4 }}>Bookings · Facilities · Scheduling</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setAddFacDrawer(true)} style={{ ...outlineBtn }}>Add Facility</button>
          <button onClick={() => openBook()} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> Book Facility</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14, marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ backgroundColor: 'var(--card-bg)', borderRadius: 18, border: '1px solid rgb(var(--inv) / 0.08)', padding: 18 }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{k.icon}</div>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 22, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 11, margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-6" style={{ backgroundColor: 'var(--card-bg)', borderRadius: 14, padding: 4, width: 'fit-content', border: '1px solid rgb(var(--inv) / 0.06)' }}>
        {(['bookings', 'facilities'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, backgroundColor: tab === t ? '#7c6bff' : 'transparent', color: tab === t ? 'white' : 'rgb(var(--inv) / 0.5)' }}>
            {t === 'bookings' ? '📅 Bookings' : '🏢 Facilities'}
          </button>
        ))}
      </div>

      {isLoading && <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgb(var(--inv) / 0.4)' }}>Loading...</p></div>}

      {!isLoading && tab === 'bookings' && (
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b" style={{ borderColor: 'rgb(var(--inv) / 0.06)', backgroundColor: 'rgb(var(--inv) / 0.03)' }}>
                {['FACILITY', 'BOOKER', 'PURPOSE', 'DATE & TIME', 'COST', 'STATUS', 'ACTIONS'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgb(var(--inv) / 0.4)' }}>{col}</th>
                ))}
              </tr></thead>
              <tbody>
                {bookings.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'rgb(var(--inv) / 0.4)' }}>No bookings yet</td></tr>}
                {bookings.map(b => {
                  const sc = bookingStatusColors[b.status] ?? { color: 'rgb(var(--inv) / 0.4)', bg: 'rgb(var(--inv) / 0.06)' }
                  return (
                    <tr key={b.id} className="border-b" style={{ borderColor: 'rgb(var(--inv) / 0.04)' }}>
                      <td className="px-5 py-4">
                        <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: 0 }}>{b.facilityName || '—'}</p>
                        {b.facilityType && <span style={{ backgroundColor: 'rgba(124,107,255,0.15)', color: 'var(--accent)', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{b.facilityType}</span>}
                      </td>
                      <td className="px-5 py-4">
                        <p style={{ color: 'var(--text-primary)', fontWeight: 500, margin: 0 }}>{b.bookerName || '—'}</p>
                        {b.bookerContact && <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 12, margin: 0 }}>{b.bookerContact}</p>}
                      </td>
                      <td className="px-5 py-4" style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.purpose || '—'}{b.attendees ? ` · ${b.attendees} pax` : ''}</td>
                      <td className="px-5 py-4">
                        {b.bookingDate && <p style={{ color: 'var(--text-primary)', fontSize: 13, margin: 0 }}>{new Date(b.bookingDate).toLocaleDateString()}</p>}
                        {(b.startTime || b.endTime) && <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 12, margin: 0 }}>{b.startTime}{b.endTime ? ` – ${b.endTime}` : ''}</p>}
                      </td>
                      <td className="px-5 py-4" style={{ color: b.cost ? '#34d399' : 'rgb(var(--inv) / 0.4)', fontWeight: b.cost ? 700 : 400, fontSize: 13 }}>{b.cost ? `₦${b.cost.toLocaleString()}` : 'Free'}</td>
                      <td className="px-5 py-4"><span style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{b.status}</span></td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1">
                          {b.status === 'PENDING' && <>
                            <button onClick={() => approveBooking.mutate(b.id)} style={{ backgroundColor: 'rgba(52,211,153,0.1)', border: 'none', color: '#34d399', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={12} /></button>
                            <button onClick={() => rejectBooking.mutate(b.id)} style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: 'none', color: '#f87171', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>Reject</button>
                          </>}
                          {b.status === 'APPROVED' && <button onClick={() => completeBooking.mutate(b.id)} style={{ backgroundColor: 'rgba(96,165,250,0.1)', border: 'none', color: '#60a5fa', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>Done</button>}
                          {(b.status === 'PENDING' || b.status === 'APPROVED') && <button onClick={() => cancelBooking.mutate(b.id)} style={{ backgroundColor: 'rgb(var(--inv) / 0.06)', border: 'none', color: 'rgb(var(--inv) / 0.4)', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>Cancel</button>}
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

      {!isLoading && tab === 'facilities' && (
        facilities.length === 0
          ? <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 60, textAlign: 'center' }}>
              <p style={{ color: 'rgb(var(--inv) / 0.4)' }}>No facilities added yet</p>
              <button onClick={() => setAddFacDrawer(true)} style={{ marginTop: 12, ...gradientBtn }}>Add Facility</button>
            </div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {facilities.map(f => (
                <div key={f.id} style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', overflow: 'hidden' }}>
                  <div style={{ height: 6, background: facilityTypeStripe(f.facilityType) }} />
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16, margin: 0 }}>{f.name}</h3>
                      <button onClick={() => { if (confirm('Delete?')) deleteFacility.mutate(f.id) }}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {f.location && <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 13, margin: '0 0 10px' }}>📍 {f.location}</p>}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 10 }}>
                      <span style={{ backgroundColor: 'rgba(124,107,255,0.15)', color: 'var(--accent)', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{f.facilityType}</span>
                      {f.capacity && <span style={{ backgroundColor: 'rgb(var(--inv) / 0.06)', color: 'rgb(var(--inv) / 0.5)', borderRadius: 20, padding: '2px 8px', fontSize: 11 }}>👥 {f.capacity}</span>}
                      {f.hourlyRate ? <span style={{ backgroundColor: 'rgba(52,211,153,0.1)', color: '#34d399', borderRadius: 20, padding: '2px 8px', fontSize: 11 }}>₦{f.hourlyRate.toLocaleString()}/hr</span> : <span style={{ backgroundColor: 'rgb(var(--inv) / 0.06)', color: 'rgb(var(--inv) / 0.4)', borderRadius: 20, padding: '2px 8px', fontSize: 11 }}>Free</span>}
                    </div>
                    {f.description && <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 13, margin: '0 0 10px' }}>{f.description}</p>}
                    {f.amenities && <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 12, margin: '0 0 12px' }}>{f.amenities}</p>}
                    <button onClick={() => openBook(f.id)} style={{ ...gradientBtn, width: '100%', fontSize: 13, padding: '8px 16px' }}>📅 Book This</button>
                  </div>
                </div>
              ))}
            </div>
      )}

      <Drawer open={addFacDrawer} onClose={() => setAddFacDrawer(false)} title="Add Facility"
        footer={<>
          <button onClick={() => setAddFacDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => createFacility.mutate()} disabled={!facForm.name || createFacility.isPending} style={gradientBtn}>{createFacility.isPending ? 'Adding...' : 'Add Facility'}</button>
        </>}>
        <div><label style={labelStyle}>NAME <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={facForm.name} onChange={e => setFacForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>TYPE</label>
          <select value={facForm.facilityType} onChange={e => setFacForm(f => ({ ...f, facilityType: e.target.value }))} style={inputStyle}>
            {['AUDITORIUM', 'HALL', 'CHAPEL', 'CLASSROOM', 'OFFICE', 'MEETING_ROOM', 'OUTDOOR', 'OTHER'].map(t => <option key={t}>{t}</option>)}
          </select></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>CAPACITY</label><input type="number" min="0" value={facForm.capacity} onChange={e => setFacForm(f => ({ ...f, capacity: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>HOURLY RATE (₦)</label><input type="number" min="0" step="0.01" value={facForm.hourlyRate} onChange={e => setFacForm(f => ({ ...f, hourlyRate: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>LOCATION</label><input type="text" value={facForm.location} onChange={e => setFacForm(f => ({ ...f, location: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>AMENITIES</label><input type="text" value={facForm.amenities} onChange={e => setFacForm(f => ({ ...f, amenities: e.target.value }))} placeholder="Projector, AC, Microphone..." style={inputStyle} /></div>
        <div><label style={labelStyle}>DESCRIPTION</label><textarea rows={3} value={facForm.description} onChange={e => setFacForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      </Drawer>

      <Drawer open={bookDrawer} onClose={() => setBookDrawer(false)} title="Book Facility"
        footer={<>
          <button onClick={() => setBookDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => createBooking.mutate()} disabled={!bookForm.facilityId || !bookForm.bookerName || !bookForm.purpose || !bookForm.bookingDate || createBooking.isPending} style={gradientBtn}>{createBooking.isPending ? 'Booking...' : 'Submit Booking'}</button>
        </>}>
        <div><label style={labelStyle}>FACILITY <span style={{ color: '#f87171' }}>*</span></label>
          <select value={bookForm.facilityId} onChange={e => setBookForm(f => ({ ...f, facilityId: e.target.value }))} style={inputStyle}>
            <option value="">Select facility...</option>
            {facilities.map(f => <option key={f.id} value={f.id}>{f.name} ({f.facilityType})</option>)}
          </select></div>
        <div><label style={labelStyle}>MEMBER (OPTIONAL)</label>
          <select value={bookForm.memberId} onChange={e => setBookForm(f => ({ ...f, memberId: e.target.value }))} style={inputStyle}>
            <option value="">Select member...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>BOOKER NAME <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={bookForm.bookerName} onChange={e => setBookForm(f => ({ ...f, bookerName: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>CONTACT</label><input type="text" value={bookForm.bookerContact} onChange={e => setBookForm(f => ({ ...f, bookerContact: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>PURPOSE <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={bookForm.purpose} onChange={e => setBookForm(f => ({ ...f, purpose: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>BOOKING DATE <span style={{ color: '#f87171' }}>*</span></label><input type="date" value={bookForm.bookingDate} onChange={e => setBookForm(f => ({ ...f, bookingDate: e.target.value }))} style={inputStyle} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div><label style={labelStyle}>START TIME <span style={{ color: '#f87171' }}>*</span></label><input type="time" value={bookForm.startTime} onChange={e => setBookForm(f => ({ ...f, startTime: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>END TIME <span style={{ color: '#f87171' }}>*</span></label><input type="time" value={bookForm.endTime} onChange={e => setBookForm(f => ({ ...f, endTime: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>ATTENDEES</label><input type="number" min="0" value={bookForm.attendees} onChange={e => setBookForm(f => ({ ...f, attendees: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>NOTES</label><textarea rows={2} value={bookForm.notes} onChange={e => setBookForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
        <div style={{ backgroundColor: 'rgba(124,107,255,0.1)', borderRadius: 12, padding: '12px 16px' }}>
          <p style={{ color: 'var(--accent)', fontSize: 13, margin: 0 }}>ℹ️ Bookings require approval. Cost is auto-calculated based on facility rate and duration.</p>
        </div>
      </Drawer>
    </div>
  )
}
