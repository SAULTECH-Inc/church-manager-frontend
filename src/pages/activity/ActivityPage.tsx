import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, X } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'

interface Activity { id: string; title: string; activityType: string; targetAudience?: string; location?: string; activityDate: string; endDate?: string; leaderName?: string; budget?: number; participantCount?: number }
interface Participant { id: string; activityTitle?: string; memberName?: string; name?: string; phone?: string; role?: string; attended: boolean; notes?: string; activityId: string }
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

const activityTypeColor = (t: string) => {
  const map: Record<string, { color: string; bg: string }> = {
    EVANGELISM: { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
    OUTREACH: { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
    CAMP: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    CONFERENCE: { color: '#7c6bff', bg: 'rgba(124,107,255,0.15)' },
    SEMINAR: { color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
    CRUSADE: { color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
    MISSION_TRIP: { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  }
  return map[t] ?? { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.08)' }
}

export function ActivityPage() {
  const [tab, setTab] = useState<'activities' | 'participants'>('activities')
  const [actDrawer, setActDrawer] = useState(false)
  const [parDrawer, setParDrawer] = useState(false)
  const [actForm, setActForm] = useState({ title: '', activityType: 'EVANGELISM', targetAudience: '', location: '', activityDate: '', endDate: '', leaderMemberId: '', leaderName: '', budget: '', description: '' })
  const [parForm, setParForm] = useState({ activityId: '', memberId: '', name: '', phone: '', role: '', attended: false, notes: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['activity'],
    queryFn: () => api.get('/api/activity').then(r => r.data as { activities: Activity[], participants: Participant[], members: Member[], stats: Record<string, number> }),
  })

  const toQS = (obj: Record<string, unknown>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) p.append(k, String(v)) }); return p.toString() }
  const createActivity = useMutation({
    mutationFn: () => api.post(`/api/activity/create?${toQS(actForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['activity'] }); setActDrawer(false); setActForm({ title: '', activityType: 'EVANGELISM', targetAudience: '', location: '', activityDate: '', endDate: '', leaderMemberId: '', leaderName: '', budget: '', description: '' }) },
  })
  const createParticipant = useMutation({
    mutationFn: () => { const { activityId, ...rest } = parForm; return api.post(`/api/activity/${activityId}/participants/add?${toQS(rest as unknown as Record<string, unknown>)}`) },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['activity'] }); setParDrawer(false); setParForm({ activityId: '', memberId: '', name: '', phone: '', role: '', attended: false, notes: '' }) },
  })
  const deleteActivity = useMutation({
    mutationFn: (id: string) => api.post(`/api/activity/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activity'] }),
  })
  const deleteParticipant = useMutation({
    mutationFn: (id: string) => api.post(`/api/activity/participants/${id}/remove`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activity'] }),
  })

  const activities = data?.activities ?? []
  const participants = data?.participants ?? []
  const members = data?.members ?? []
  const stats = data?.stats ?? {}

  const kpis = [
    { label: 'Total Activities', value: stats.total ?? activities.length },
    { label: 'Planned', value: stats.planned ?? 0 },
    { label: 'Completed', value: stats.completed ?? 0 },
    { label: 'Souls Won', value: stats.soulsWon ?? 0 },
    { label: 'Participants', value: stats.participants ?? participants.length },
    { label: 'Enrolment Records', value: stats.enrolmentRecords ?? 0 },
  ]

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>Activities</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Evangelism · Outreach · Camp · Conference</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setParDrawer(true)} style={outlineBtn}>Add Participant</button>
          <button onClick={() => setActDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> Create Activity</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 24, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-6" style={{ backgroundColor: '#13152e', borderRadius: 14, padding: 4, width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['activities', 'participants'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, backgroundColor: tab === t ? '#7c6bff' : 'transparent', color: tab === t ? 'white' : 'rgba(255,255,255,0.5)' }}>
            {t === 'activities' ? '📋 Activities' : '👥 Participants'}
          </button>
        ))}
      </div>

      {isLoading && <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>}

      {!isLoading && tab === 'activities' && (
        <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                {['TITLE', 'TYPE', 'AUDIENCE', 'LOCATION', 'DATE', 'LEADER', 'BUDGET', 'PAX', 'ACTIONS'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{col}</th>
                ))}
              </tr></thead>
              <tbody>
                {activities.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>No activities yet</td></tr>}
                {activities.map(a => {
                  const tc = activityTypeColor(a.activityType)
                  return (
                    <tr key={a.id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-4" style={{ color: 'white', fontWeight: 600 }}>{a.title}</td>
                      <td className="px-5 py-4"><span style={{ backgroundColor: tc.bg, color: tc.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{a.activityType}</span></td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{a.targetAudience || '—'}</td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{a.location || '—'}</td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{new Date(a.activityDate).toLocaleDateString()}{a.endDate ? ` – ${new Date(a.endDate).toLocaleDateString()}` : ''}</td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{a.leaderName || '—'}</td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{a.budget ? `₦${a.budget.toLocaleString()}` : '—'}</td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{a.participantCount ?? 0}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => { if (confirm('Delete activity?')) deleteActivity.mutate(a.id) }}
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
      )}

      {!isLoading && tab === 'participants' && (
        <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                {['ACTIVITY', 'NAME', 'PHONE', 'ROLE', 'ATTENDED', 'NOTES', 'ACTIONS'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{col}</th>
                ))}
              </tr></thead>
              <tbody>
                {participants.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>No participants yet</td></tr>}
                {participants.map(p => (
                  <tr key={p.id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{p.activityTitle || '—'}</td>
                    <td className="px-5 py-4" style={{ color: 'white', fontWeight: 500 }}>{p.memberName ?? p.name ?? '—'}</td>
                    <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{p.phone || '—'}</td>
                    <td className="px-5 py-4">{p.role ? <span style={{ backgroundColor: 'rgba(124,107,255,0.15)', color: '#7c6bff', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{p.role}</span> : <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}</td>
                    <td className="px-5 py-4"><span style={{ color: p.attended ? '#34d399' : '#f87171', fontSize: 16 }}>{p.attended ? '✓' : '✗'}</span></td>
                    <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.notes || '—'}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => { if (confirm('Remove?')) deleteParticipant.mutate(p.id) }}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Drawer open={actDrawer} onClose={() => setActDrawer(false)} title="Create Activity"
        footer={<>
          <button onClick={() => setActDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => createActivity.mutate()} disabled={!actForm.title || !actForm.activityDate || createActivity.isPending} style={gradientBtn}>{createActivity.isPending ? 'Creating...' : 'Create Activity'}</button>
        </>}>
        <div><label style={labelStyle}>TITLE <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={actForm.title} onChange={e => setActForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>TYPE</label>
          <select value={actForm.activityType} onChange={e => setActForm(f => ({ ...f, activityType: e.target.value }))} style={inputStyle}>
            {['EVANGELISM', 'OUTREACH', 'CAMP', 'CONFERENCE', 'SEMINAR', 'CRUSADE', 'MISSION_TRIP', 'OTHER'].map(t => <option key={t}>{t}</option>)}
          </select></div>
        <div><label style={labelStyle}>TARGET AUDIENCE</label>
          <input type="text" list="audience-list" value={actForm.targetAudience} onChange={e => setActForm(f => ({ ...f, targetAudience: e.target.value }))} style={inputStyle} />
          <datalist id="audience-list"><option value="Youth" /><option value="Men" /><option value="Women" /><option value="All Members" /><option value="Children" /></datalist>
        </div>
        <div><label style={labelStyle}>LOCATION</label><input type="text" value={actForm.location} onChange={e => setActForm(f => ({ ...f, location: e.target.value }))} style={inputStyle} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>START DATE <span style={{ color: '#f87171' }}>*</span></label><input type="date" value={actForm.activityDate} onChange={e => setActForm(f => ({ ...f, activityDate: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>END DATE</label><input type="date" value={actForm.endDate} onChange={e => setActForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>LEADER (MEMBER)</label>
          <select value={actForm.leaderMemberId} onChange={e => setActForm(f => ({ ...f, leaderMemberId: e.target.value }))} style={inputStyle}>
            <option value="">Select member...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
        <div><label style={labelStyle}>LEADER NAME (OVERRIDE)</label><input type="text" value={actForm.leaderName} onChange={e => setActForm(f => ({ ...f, leaderName: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>BUDGET</label><input type="number" min="0" step="0.01" value={actForm.budget} onChange={e => setActForm(f => ({ ...f, budget: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>DESCRIPTION</label><textarea rows={3} value={actForm.description} onChange={e => setActForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      </Drawer>

      <Drawer open={parDrawer} onClose={() => setParDrawer(false)} title="Add Participant"
        footer={<>
          <button onClick={() => setParDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => createParticipant.mutate()} disabled={!parForm.activityId || createParticipant.isPending} style={gradientBtn}>{createParticipant.isPending ? 'Adding...' : 'Add Participant'}</button>
        </>}>
        <div><label style={labelStyle}>ACTIVITY <span style={{ color: '#f87171' }}>*</span></label>
          <select value={parForm.activityId} onChange={e => setParForm(f => ({ ...f, activityId: e.target.value }))} style={inputStyle}>
            <option value="">Select activity...</option>
            {activities.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
          </select></div>
        <div><label style={labelStyle}>MEMBER (OPTIONAL)</label>
          <select value={parForm.memberId} onChange={e => setParForm(f => ({ ...f, memberId: e.target.value }))} style={inputStyle}>
            <option value="">Select member...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
        <div><label style={labelStyle}>NAME (IF NOT MEMBER)</label><input type="text" value={parForm.name} onChange={e => setParForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>PHONE</label><input type="text" value={parForm.phone} onChange={e => setParForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>ROLE</label>
          <input type="text" list="role-list" value={parForm.role} onChange={e => setParForm(f => ({ ...f, role: e.target.value }))} style={inputStyle} />
          <datalist id="role-list"><option value="Volunteer" /><option value="Coordinator" /><option value="Speaker" /><option value="Musician" /><option value="Intercessor" /><option value="Usher" /></datalist>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px' }}>
          <input type="checkbox" id="attended" checked={parForm.attended} onChange={e => setParForm(f => ({ ...f, attended: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#7c6bff' }} />
          <label htmlFor="attended" style={{ color: 'white', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>Attended</label>
        </div>
        <div><label style={labelStyle}>NOTES</label><textarea rows={2} value={parForm.notes} onChange={e => setParForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      </Drawer>
    </div>
  )
}
