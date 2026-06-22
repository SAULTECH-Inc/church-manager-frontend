import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, X } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { getInitials } from '@/lib/utils'

interface Child { id: string; fullName: string; dateOfBirth?: string; gender?: string; classGroup?: string; fatherName?: string; motherName?: string; guardianName?: string; status?: string }
interface AttendanceRecord { id: string; childName?: string; attendanceDate: string; classGroup?: string; present: boolean; recordedBy?: string; notes?: string }
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

const classColors: Record<string, { color: string; bg: string }> = {
  NURSERY: { color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
  TODDLERS: { color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
  JUNIOR: { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  SENIOR: { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  TEENS: { color: '#7c6bff', bg: 'rgba(124,107,255,0.15)' },
}

function calcAge(dob?: string) {
  if (!dob) return null
  const ms = Date.now() - new Date(dob).getTime()
  const yrs = Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25))
  return `${yrs}y`
}

export function ChildrenPage() {
  const [tab, setTab] = useState<'children' | 'attendance'>('children')
  const [registerDrawer, setRegisterDrawer] = useState(false)
  const [attendanceDrawer, setAttendanceDrawer] = useState(false)
  const [regForm, setRegForm] = useState({ fullName: '', dateOfBirth: '', gender: 'MALE', classGroup: 'NURSERY', fatherId: '', motherId: '', guardianName: '', guardianRelation: '', guardianPhone: '', dedicationDate: '', baptismDate: '', allergies: '', medicalNotes: '' })
  const [attForm, setAttForm] = useState({ childId: '', attendanceDate: '', classGroup: 'NURSERY', present: true, recordedBy: '', notes: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['children'],
    queryFn: () => api.get('/api/children').then(r => r.data as { children: Child[], attendance: AttendanceRecord[], members: Member[], stats: Record<string, number> }),
  })

  const registerMutation = useMutation({
    mutationFn: () => {
      const p = new URLSearchParams()
      Object.entries(regForm).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) p.append(k, String(v)) })
      return api.post(`/api/children/register?${p}`)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['children'] }); setRegisterDrawer(false); setRegForm({ fullName: '', dateOfBirth: '', gender: 'MALE', classGroup: 'NURSERY', fatherId: '', motherId: '', guardianName: '', guardianRelation: '', guardianPhone: '', dedicationDate: '', baptismDate: '', allergies: '', medicalNotes: '' }) },
  })
  const attendanceMutation = useMutation({
    mutationFn: () => {
      const p = new URLSearchParams()
      Object.entries(attForm).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) p.append(k, String(v)) })
      return api.post(`/api/children/attendance?${p}`)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['children'] }); setAttendanceDrawer(false); setAttForm({ childId: '', attendanceDate: '', classGroup: 'NURSERY', present: true, recordedBy: '', notes: '' }) },
  })
  const deleteChild = useMutation({
    mutationFn: (id: string) => api.post(`/api/children/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['children'] }),
  })

  const children = data?.children ?? []
  const attendance = data?.attendance ?? []
  const members = data?.members ?? []
  const stats = data?.stats ?? {}

  const kpis = [
    { label: 'Total Children', value: stats.total ?? children.length },
    { label: 'Active', value: stats.active ?? 0 },
    { label: 'Graduated', value: stats.graduated ?? 0 },
    { label: 'Present Today', value: stats.presentToday ?? 0 },
    { label: 'Attendance Records', value: stats.attendanceRecords ?? attendance.length },
    { label: 'Classes', value: stats.classes ?? Object.keys(classColors).length },
  ]

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>Children</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Children's Church · Classes · Attendance</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setAttendanceDrawer(true)} style={outlineBtn}>Mark Attendance</button>
          <button onClick={() => setRegisterDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> Register Child</button>
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
        {(['children', 'attendance'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, backgroundColor: tab === t ? '#7c6bff' : 'transparent', color: tab === t ? 'white' : 'rgba(255,255,255,0.5)' }}>
            {t === 'children' ? '👶 Children' : '📊 Attendance'}
          </button>
        ))}
      </div>

      {isLoading && <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>}

      {!isLoading && tab === 'children' && (
        children.length === 0
          ? <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 60, textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>No children registered yet</p>
              <button onClick={() => setRegisterDrawer(true)} style={{ marginTop: 12, ...gradientBtn }}>Register Child</button>
            </div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {children.map(c => {
                const cc = classColors[c.classGroup ?? ''] ?? { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.08)' }
                return (
                  <div key={c.id} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 20, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #7c6bff, #6456e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                        {getInitials(c.fullName)}
                      </div>
                      <div>
                        <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: 0 }}>{c.fullName}</p>
                        {c.dateOfBirth && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '2px 0 0' }}>{new Date(c.dateOfBirth).toLocaleDateString()} · {calcAge(c.dateOfBirth)}</p>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const, marginBottom: 10 }}>
                      {c.classGroup && <span style={{ backgroundColor: cc.bg, color: cc.color, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>{c.classGroup}</span>}
                      {c.gender && <span style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', borderRadius: 20, padding: '2px 10px', fontSize: 11 }}>{c.gender}</span>}
                    </div>
                    {c.fatherName && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 2px' }}>👨 {c.fatherName}</p>}
                    {c.motherName && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 2px' }}>👩 {c.motherName}</p>}
                    {c.guardianName && !c.fatherName && !c.motherName && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '0 0 2px' }}>👤 {c.guardianName}</p>}
                    <button onClick={() => { if (confirm('Delete record?')) deleteChild.mutate(c.id) }}
                      style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })}
            </div>
      )}

      {!isLoading && tab === 'attendance' && (
        <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                {['CHILD', 'DATE', 'CLASS GROUP', 'PRESENT', 'RECORDED BY', 'NOTES', 'ACTIONS'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{col}</th>
                ))}
              </tr></thead>
              <tbody>
                {attendance.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>No attendance records yet</td></tr>}
                {attendance.map(a => {
                  const cc = classColors[a.classGroup ?? ''] ?? { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.08)' }
                  return (
                    <tr key={a.id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-4" style={{ color: 'white', fontWeight: 500 }}>{a.childName || '—'}</td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{new Date(a.attendanceDate).toLocaleDateString()}</td>
                      <td className="px-5 py-4">{a.classGroup ? <span style={{ backgroundColor: cc.bg, color: cc.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{a.classGroup}</span> : '—'}</td>
                      <td className="px-5 py-4"><span style={{ color: a.present ? '#34d399' : '#f87171', fontSize: 16 }}>{a.present ? '✓' : '✗'}</span></td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{a.recordedBy || '—'}</td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{a.notes || '—'}</td>
                      <td className="px-5 py-4"></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Drawer open={registerDrawer} onClose={() => setRegisterDrawer(false)} title="Register Child"
        footer={<>
          <button onClick={() => setRegisterDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => registerMutation.mutate()} disabled={!regForm.fullName || !regForm.dateOfBirth || registerMutation.isPending} style={gradientBtn}>{registerMutation.isPending ? 'Registering...' : 'Register Child'}</button>
        </>}>
        <div><label style={labelStyle}>FULL NAME <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={regForm.fullName} onChange={e => setRegForm(f => ({ ...f, fullName: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>DATE OF BIRTH <span style={{ color: '#f87171' }}>*</span></label><input type="date" value={regForm.dateOfBirth} onChange={e => setRegForm(f => ({ ...f, dateOfBirth: e.target.value }))} style={inputStyle} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>GENDER</label>
            <select value={regForm.gender} onChange={e => setRegForm(f => ({ ...f, gender: e.target.value }))} style={inputStyle}>
              <option value="MALE">Male</option><option value="FEMALE">Female</option>
            </select></div>
          <div><label style={labelStyle}>CLASS GROUP</label>
            <select value={regForm.classGroup} onChange={e => setRegForm(f => ({ ...f, classGroup: e.target.value }))} style={inputStyle}>
              {['NURSERY', 'TODDLERS', 'JUNIOR', 'SENIOR', 'TEENS'].map(g => <option key={g}>{g}</option>)}
            </select></div>
        </div>
        <div><label style={labelStyle}>FATHER (MEMBER)</label>
          <select value={regForm.fatherId} onChange={e => setRegForm(f => ({ ...f, fatherId: e.target.value }))} style={inputStyle}>
            <option value="">Optional...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
        <div><label style={labelStyle}>MOTHER (MEMBER)</label>
          <select value={regForm.motherId} onChange={e => setRegForm(f => ({ ...f, motherId: e.target.value }))} style={inputStyle}>
            <option value="">Optional...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div><label style={labelStyle}>GUARDIAN NAME</label><input type="text" value={regForm.guardianName} onChange={e => setRegForm(f => ({ ...f, guardianName: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>RELATION</label><input type="text" value={regForm.guardianRelation} onChange={e => setRegForm(f => ({ ...f, guardianRelation: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>PHONE</label><input type="text" value={regForm.guardianPhone} onChange={e => setRegForm(f => ({ ...f, guardianPhone: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>DEDICATION DATE</label><input type="date" value={regForm.dedicationDate} onChange={e => setRegForm(f => ({ ...f, dedicationDate: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>BAPTISM DATE</label><input type="date" value={regForm.baptismDate} onChange={e => setRegForm(f => ({ ...f, baptismDate: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>ALLERGIES</label><textarea rows={2} value={regForm.allergies} onChange={e => setRegForm(f => ({ ...f, allergies: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
        <div><label style={labelStyle}>MEDICAL NOTES</label><textarea rows={2} value={regForm.medicalNotes} onChange={e => setRegForm(f => ({ ...f, medicalNotes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      </Drawer>

      <Drawer open={attendanceDrawer} onClose={() => setAttendanceDrawer(false)} title="Mark Attendance"
        footer={<>
          <button onClick={() => setAttendanceDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => attendanceMutation.mutate()} disabled={!attForm.childId || !attForm.attendanceDate || attendanceMutation.isPending} style={gradientBtn}>{attendanceMutation.isPending ? 'Saving...' : 'Mark Attendance'}</button>
        </>}>
        <div><label style={labelStyle}>CHILD <span style={{ color: '#f87171' }}>*</span></label>
          <select value={attForm.childId} onChange={e => setAttForm(f => ({ ...f, childId: e.target.value }))} style={inputStyle}>
            <option value="">Select child...</option>
            {children.map(c => <option key={c.id} value={c.id}>{c.fullName}</option>)}
          </select></div>
        <div><label style={labelStyle}>DATE <span style={{ color: '#f87171' }}>*</span></label><input type="date" value={attForm.attendanceDate} onChange={e => setAttForm(f => ({ ...f, attendanceDate: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>CLASS GROUP</label>
          <select value={attForm.classGroup} onChange={e => setAttForm(f => ({ ...f, classGroup: e.target.value }))} style={inputStyle}>
            {['NURSERY', 'TODDLERS', 'JUNIOR', 'SENIOR', 'TEENS'].map(g => <option key={g}>{g}</option>)}
          </select></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '12px 16px' }}>
          <input type="checkbox" id="present" checked={attForm.present} onChange={e => setAttForm(f => ({ ...f, present: e.target.checked }))} style={{ width: 16, height: 16, accentColor: '#7c6bff' }} />
          <label htmlFor="present" style={{ color: 'white', fontWeight: 500, fontSize: 14, cursor: 'pointer' }}>Present</label>
        </div>
        <div><label style={labelStyle}>RECORDED BY</label><input type="text" value={attForm.recordedBy} onChange={e => setAttForm(f => ({ ...f, recordedBy: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>NOTES</label><textarea rows={2} value={attForm.notes} onChange={e => setAttForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      </Drawer>
    </div>
  )
}
