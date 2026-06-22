import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, X, Check, Download, Upload, ChevronDown, Pencil } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { getInitials } from '@/lib/utils'

interface StaffMember { id: string; fullName: string; email?: string; phone?: string; department?: string; jobTitle?: string; employmentType?: string; salary?: number; salaryFrequency?: string; startDate?: string; status: string; memberName?: string }
interface LeaveRequest { id: string; staffName?: string; staffTitle?: string; leaveType: string; startDate: string; endDate: string; dayCount?: number; reason?: string; status: string }
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

const staffStatusColor = (s: string) => {
  if (s === 'ACTIVE') return { color: '#34d399', bg: 'rgba(52,211,153,0.15)' }
  if (s === 'ON_LEAVE') return { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' }
  if (s === 'SUSPENDED') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
  return { color: '#f87171', bg: 'rgba(248,113,113,0.15)' }
}
const leaveStatusColor = (s: string) => {
  if (s === 'APPROVED') return { color: '#34d399', bg: 'rgba(52,211,153,0.15)' }
  if (s === 'PENDING') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
  if (s === 'REJECTED') return { color: '#f87171', bg: 'rgba(248,113,113,0.15)' }
  return { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.06)' }
}

function calcTenure(startDate?: string) {
  if (!startDate) return '—'
  const ms = Date.now() - new Date(startDate).getTime()
  const yrs = Math.floor(ms / (1000 * 60 * 60 * 24 * 365.25))
  const mos = Math.floor((ms % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44))
  return yrs > 0 ? `${yrs}y ${mos}m` : `${mos}m`
}

export function HRPage() {
  const [tab, setTab] = useState<'staff' | 'leave'>('staff')
  const [staffDrawer, setStaffDrawer] = useState(false)
  const [leaveDrawer, setLeaveDrawer] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [exportMenu, setExportMenu] = useState(false)
  const [deptFilter, setDeptFilter] = useState('')
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null)
  const [editStaffForm, setEditStaffForm] = useState({ fullName: '', email: '', phone: '', department: '', jobTitle: '', employmentType: 'FULL_TIME', salary: '', salaryFrequency: 'MONTHLY', bankName: '', accountNumber: '', emergencyContact: '', emergencyPhone: '', qualifications: '' })
  const [staffForm, setStaffForm] = useState({ memberId: '', fullName: '', email: '', phone: '', department: '', jobTitle: '', employmentType: 'FULL_TIME', startDate: '', salary: '', salaryFrequency: 'MONTHLY', bankName: '', accountNumber: '', emergencyContact: '', emergencyPhone: '', qualifications: '' })
  const [leaveForm, setLeaveForm] = useState({ staffId: '', leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['hr'],
    queryFn: () => api.get('/api/hr').then(r => r.data as { staff: StaffMember[], leaveRequests: LeaveRequest[], members: Member[], stats: Record<string, number> }),
  })

  const toQS = (obj: Record<string, string>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v) p.append(k, v) }); return p.toString() }
  const editStaffMut = useMutation({
    mutationFn: () => api.post(`/api/hr/${editStaff!.id}/edit?${toQS(editStaffForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hr'] }); setEditStaff(null) },
  })
  const createStaff = useMutation({
    mutationFn: () => api.post(`/api/hr/create?${toQS(staffForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hr'] }); setStaffDrawer(false); setStaffForm({ memberId: '', fullName: '', email: '', phone: '', department: '', jobTitle: '', employmentType: 'FULL_TIME', startDate: '', salary: '', salaryFrequency: 'MONTHLY', bankName: '', accountNumber: '', emergencyContact: '', emergencyPhone: '', qualifications: '' }) },
  })
  const createLeave = useMutation({
    mutationFn: () => api.post(`/api/hr/leave/request?${toQS(leaveForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hr'] }); setLeaveDrawer(false); setLeaveForm({ staffId: '', leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' }) },
  })
  const changeStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.post(`/api/hr/${id}/status?status=${encodeURIComponent(status)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr'] }),
  })
  const approveLeave = useMutation({ mutationFn: (id: string) => api.post(`/api/hr/leave/${id}/approve`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr'] }) })
  const rejectLeave = useMutation({ mutationFn: (id: string) => api.post(`/api/hr/leave/${id}/reject`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr'] }) })
  const deleteStaff = useMutation({ mutationFn: (id: string) => api.post(`/api/hr/${id}/delete`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hr'] }) })
  const importMut = useMutation({
    mutationFn: async () => {
      const fd = new FormData(); fd.append('file', importFile!)
      await api.post('/api/hr/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['hr'] }); setImportOpen(false); setImportFile(null) },
  })

  const staff = data?.staff ?? []
  const leaveRequests = data?.leaveRequests ?? []
  const members = data?.members ?? []
  const stats = data?.stats ?? {}

  const filteredStaff = deptFilter ? staff.filter(s => s.department === deptFilter) : staff
  const departments = [...new Set(staff.map(s => s.department).filter(Boolean))]

  const kpis = [
    { label: 'Total Staff', value: stats.totalStaff ?? staff.length },
    { label: 'Active', value: stats.active ?? 0 },
    { label: 'On Leave', value: stats.onLeave ?? 0 },
    { label: 'Pending Leave', value: stats.pendingLeave ?? 0 },
    { label: 'Leave Approved', value: stats.approvedLeave ?? 0 },
    { label: 'Departments', value: stats.departments ?? departments.length },
  ]

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>Human Resources</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Staff Management · Leave Requests · Payroll</p>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ position: 'relative' }}>
            <button onClick={() => setExportMenu(v => !v)} style={{ ...outlineBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}>
              <Download size={14} /> Export <ChevronDown size={13} />
            </button>
            {exportMenu && (
              <div style={{ position: 'absolute', top: '110%', right: 0, backgroundColor: '#1a1b3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 6, zIndex: 100, minWidth: 100 }}>
                {['xlsx', 'csv', 'pdf'].map(fmt => (
                  <button key={fmt} onClick={() => { window.location.href = `/api/hr/export?format=${fmt}`; setExportMenu(false) }}
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
          <button onClick={() => setLeaveDrawer(true)} style={{ ...gradientBtn, background: 'linear-gradient(135deg, #6456e8, #4c3fda)', fontSize: 13, padding: '8px 14px' }}>Leave Request</button>
          <button onClick={() => setStaffDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}><Plus size={14} /> Add Staff</button>
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
        {(['staff', 'leave'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, backgroundColor: tab === t ? '#7c6bff' : 'transparent', color: tab === t ? 'white' : 'rgba(255,255,255,0.5)' }}>
            {t === 'staff' ? '👔 Staff' : '🏖️ Leave Requests'}
          </button>
        ))}
      </div>

      {!isLoading && tab === 'staff' && (
        <>
          <div className="flex gap-3 mb-4">
            <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
              style={{ ...inputStyle, width: 200 }}>
              <option value="">All Departments</option>
              {departments.map(d => <option key={d} value={d!}>{d}</option>)}
            </select>
          </div>
          <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  {['STAFF MEMBER', 'DEPARTMENT', 'JOB TITLE', 'TYPE', 'SALARY', 'TENURE', 'STATUS', 'ACTIONS'].map(col => (
                    <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{col}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filteredStaff.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>No staff yet</td></tr>}
                  {filteredStaff.map(s => {
                    const sc = staffStatusColor(s.status)
                    return (
                      <tr key={s.id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #7c6bff, #6456e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                              {getInitials(s.fullName)}
                            </div>
                            <div><p style={{ color: 'white', fontWeight: 500, fontSize: 14, margin: 0 }}>{s.fullName}</p>{s.email && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>{s.email}</p>}</div>
                          </div>
                        </td>
                        <td className="px-5 py-4">{s.department ? <span style={{ backgroundColor: 'rgba(124,107,255,0.15)', color: '#7c6bff', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{s.department}</span> : '—'}</td>
                        <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.7)' }}>{s.jobTitle || '—'}</td>
                        <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{s.employmentType?.replace('_', ' ') || '—'}</td>
                        <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{s.salary ? `₦${s.salary.toLocaleString()}/${s.salaryFrequency?.slice(0, 2).toLowerCase() ?? 'mo'}` : '—'}</td>
                        <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{calcTenure(s.startDate)}</td>
                        <td className="px-5 py-4"><span style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{s.status}</span></td>
                        <td className="px-5 py-4">
                          <div className="flex gap-1">
                            {s.status === 'ACTIVE' && <button onClick={() => changeStatus.mutate({ id: s.id, status: 'SUSPENDED' })} style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: 'none', color: '#f59e0b', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>Suspend</button>}
                            {s.status === 'SUSPENDED' && <button onClick={() => changeStatus.mutate({ id: s.id, status: 'ACTIVE' })} style={{ backgroundColor: 'rgba(52,211,153,0.1)', border: 'none', color: '#34d399', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>Reactivate</button>}
                            {s.status !== 'TERMINATED' && <button onClick={() => { if (confirm('Terminate staff?')) changeStatus.mutate({ id: s.id, status: 'TERMINATED' }) }} style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: 'none', color: '#f87171', borderRadius: 8, padding: '4px 8px', cursor: 'pointer', fontSize: 11 }}>Terminate</button>}
                            <button onClick={() => { setEditStaff(s); setEditStaffForm({ fullName: s.fullName, email: s.email ?? '', phone: s.phone ?? '', department: s.department ?? '', jobTitle: s.jobTitle ?? '', employmentType: s.employmentType ?? 'FULL_TIME', salary: s.salary?.toString() ?? '', salaryFrequency: s.salaryFrequency ?? 'MONTHLY', bankName: '', accountNumber: '', emergencyContact: '', emergencyPhone: '', qualifications: '' }) }}
                              style={{ background: 'rgba(124,107,255,0.1)', border: 'none', color: '#a78bfa', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Pencil size={11} />
                            </button>
                            <button onClick={() => { if (confirm('Delete?')) deleteStaff.mutate(s.id) }}
                              style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!isLoading && tab === 'leave' && (
        <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                {['STAFF MEMBER', 'TYPE', 'START', 'END', 'DAYS', 'REASON', 'STATUS', 'ACTIONS'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{col}</th>
                ))}
              </tr></thead>
              <tbody>
                {leaveRequests.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>No leave requests</td></tr>}
                {leaveRequests.map(l => {
                  const sc = leaveStatusColor(l.status)
                  return (
                    <tr key={l.id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="px-5 py-4"><p style={{ color: 'white', fontWeight: 500, margin: 0 }}>{l.staffName || '—'}</p>{l.staffTitle && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>{l.staffTitle}</p>}</td>
                      <td className="px-5 py-4"><span style={{ backgroundColor: 'rgba(96,165,250,0.15)', color: '#60a5fa', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{l.leaveType}</span></td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{new Date(l.startDate).toLocaleDateString()}</td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{new Date(l.endDate).toLocaleDateString()}</td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{l.dayCount ?? '—'}</td>
                      <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason || '—'}</td>
                      <td className="px-5 py-4"><span style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{l.status}</span></td>
                      <td className="px-5 py-4">
                        {l.status === 'PENDING' && (
                          <div className="flex gap-1">
                            <button onClick={() => approveLeave.mutate(l.id)} style={{ backgroundColor: 'rgba(52,211,153,0.1)', border: 'none', color: '#34d399', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Check size={12} />
                            </button>
                            <button onClick={() => rejectLeave.mutate(l.id)} style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <X size={12} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Drawer open={!!editStaff} onClose={() => setEditStaff(null)} title="Edit Staff Member"
        footer={<>
          <button onClick={() => setEditStaff(null)} style={outlineBtn}>Cancel</button>
          <button onClick={() => editStaffMut.mutate()} disabled={!editStaffForm.fullName || editStaffMut.isPending} style={gradientBtn}>{editStaffMut.isPending ? 'Saving...' : 'Save Changes'}</button>
        </>}>
        <div><label style={labelStyle}>FULL NAME <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={editStaffForm.fullName} onChange={e => setEditStaffForm(f => ({ ...f, fullName: e.target.value }))} style={inputStyle} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>EMAIL</label><input type="email" value={editStaffForm.email} onChange={e => setEditStaffForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>PHONE</label><input type="text" value={editStaffForm.phone} onChange={e => setEditStaffForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>DEPARTMENT</label>
          <input type="text" list="edit-dept-list" value={editStaffForm.department} onChange={e => setEditStaffForm(f => ({ ...f, department: e.target.value }))} style={inputStyle} />
          <datalist id="edit-dept-list"><option value="Administration" /><option value="Finance" /><option value="Media" /><option value="Music" /><option value="Children's Ministry" /><option value="Youth Ministry" /><option value="Maintenance" /><option value="Security" /></datalist>
        </div>
        <div><label style={labelStyle}>JOB TITLE</label><input type="text" value={editStaffForm.jobTitle} onChange={e => setEditStaffForm(f => ({ ...f, jobTitle: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>EMPLOYMENT TYPE</label>
          <select value={editStaffForm.employmentType} onChange={e => setEditStaffForm(f => ({ ...f, employmentType: e.target.value }))} style={inputStyle}>
            {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER'].map(t => <option key={t}>{t}</option>)}
          </select></div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>SALARY</label><input type="number" min="0" step="0.01" value={editStaffForm.salary} onChange={e => setEditStaffForm(f => ({ ...f, salary: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>FREQUENCY</label>
            <select value={editStaffForm.salaryFrequency} onChange={e => setEditStaffForm(f => ({ ...f, salaryFrequency: e.target.value }))} style={inputStyle}>
              {['MONTHLY', 'WEEKLY', 'ANNUALLY'].map(t => <option key={t}>{t}</option>)}
            </select></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>BANK NAME</label><input type="text" value={editStaffForm.bankName} onChange={e => setEditStaffForm(f => ({ ...f, bankName: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>ACCOUNT NUMBER</label><input type="text" value={editStaffForm.accountNumber} onChange={e => setEditStaffForm(f => ({ ...f, accountNumber: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>EMERGENCY CONTACT</label><input type="text" value={editStaffForm.emergencyContact} onChange={e => setEditStaffForm(f => ({ ...f, emergencyContact: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>EMERGENCY PHONE</label><input type="text" value={editStaffForm.emergencyPhone} onChange={e => setEditStaffForm(f => ({ ...f, emergencyPhone: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>QUALIFICATIONS</label><textarea rows={2} value={editStaffForm.qualifications} onChange={e => setEditStaffForm(f => ({ ...f, qualifications: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      </Drawer>

      <Drawer open={importOpen} onClose={() => setImportOpen(false)} title="Import Staff Records"
        footer={<>
          <button onClick={() => setImportOpen(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => importMut.mutate()} disabled={!importFile || importMut.isPending} style={gradientBtn}>{importMut.isPending ? 'Importing...' : 'Import'}</button>
        </>}>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: '0 0 16px' }}>Upload a CSV or Excel file to bulk-import staff records.</p>
        <div><label style={labelStyle}>FILE (CSV / XLSX)</label>
          <input type="file" accept=".csv,.xlsx" onChange={e => setImportFile(e.target.files?.[0] ?? null)} style={inputStyle} /></div>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 12 }}>
          Need a template?{' '}
          <a href="/api/hr/import/template" style={{ color: '#7c6bff', textDecoration: 'none', fontWeight: 600 }}>Download Template</a>
        </p>
      </Drawer>

      <Drawer open={staffDrawer} onClose={() => setStaffDrawer(false)} title="Add Staff Member"
        footer={<>
          <button onClick={() => setStaffDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => createStaff.mutate()} disabled={!staffForm.fullName || !staffForm.jobTitle || !staffForm.startDate || createStaff.isPending} style={gradientBtn}>{createStaff.isPending ? 'Adding...' : 'Add Staff'}</button>
        </>}>
        <div><label style={labelStyle}>LINKED MEMBER (OPTIONAL)</label>
          <select value={staffForm.memberId} onChange={e => setStaffForm(f => ({ ...f, memberId: e.target.value }))} style={inputStyle}>
            <option value="">Select member...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
        <div><label style={labelStyle}>FULL NAME <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={staffForm.fullName} onChange={e => setStaffForm(f => ({ ...f, fullName: e.target.value }))} style={inputStyle} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>EMAIL</label><input type="email" value={staffForm.email} onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>PHONE</label><input type="text" value={staffForm.phone} onChange={e => setStaffForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>DEPARTMENT <span style={{ color: '#f87171' }}>*</span></label>
          <input type="text" list="dept-list" value={staffForm.department} onChange={e => setStaffForm(f => ({ ...f, department: e.target.value }))} style={inputStyle} />
          <datalist id="dept-list"><option value="Administration" /><option value="Finance" /><option value="Media" /><option value="Music" /><option value="Children's Ministry" /><option value="Youth Ministry" /><option value="Maintenance" /><option value="Security" /></datalist>
        </div>
        <div><label style={labelStyle}>JOB TITLE <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={staffForm.jobTitle} onChange={e => setStaffForm(f => ({ ...f, jobTitle: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>EMPLOYMENT TYPE</label>
          <select value={staffForm.employmentType} onChange={e => setStaffForm(f => ({ ...f, employmentType: e.target.value }))} style={inputStyle}>
            {['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VOLUNTEER'].map(t => <option key={t}>{t}</option>)}
          </select></div>
        <div><label style={labelStyle}>START DATE <span style={{ color: '#f87171' }}>*</span></label><input type="date" value={staffForm.startDate} onChange={e => setStaffForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>SALARY</label><input type="number" min="0" step="0.01" value={staffForm.salary} onChange={e => setStaffForm(f => ({ ...f, salary: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>FREQUENCY</label>
            <select value={staffForm.salaryFrequency} onChange={e => setStaffForm(f => ({ ...f, salaryFrequency: e.target.value }))} style={inputStyle}>
              {['MONTHLY', 'WEEKLY', 'ANNUALLY'].map(t => <option key={t}>{t}</option>)}
            </select></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>BANK NAME</label><input type="text" value={staffForm.bankName} onChange={e => setStaffForm(f => ({ ...f, bankName: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>ACCOUNT NUMBER</label><input type="text" value={staffForm.accountNumber} onChange={e => setStaffForm(f => ({ ...f, accountNumber: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>EMERGENCY CONTACT</label><input type="text" value={staffForm.emergencyContact} onChange={e => setStaffForm(f => ({ ...f, emergencyContact: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>EMERGENCY PHONE</label><input type="text" value={staffForm.emergencyPhone} onChange={e => setStaffForm(f => ({ ...f, emergencyPhone: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>QUALIFICATIONS</label><textarea rows={2} value={staffForm.qualifications} onChange={e => setStaffForm(f => ({ ...f, qualifications: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      </Drawer>

      <Drawer open={leaveDrawer} onClose={() => setLeaveDrawer(false)} title="Submit Leave Request"
        footer={<>
          <button onClick={() => setLeaveDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => createLeave.mutate()} disabled={!leaveForm.staffId || !leaveForm.startDate || !leaveForm.endDate || createLeave.isPending} style={gradientBtn}>{createLeave.isPending ? 'Submitting...' : 'Submit Request'}</button>
        </>}>
        <div><label style={labelStyle}>STAFF MEMBER <span style={{ color: '#f87171' }}>*</span></label>
          <select value={leaveForm.staffId} onChange={e => setLeaveForm(f => ({ ...f, staffId: e.target.value }))} style={inputStyle}>
            <option value="">Select staff...</option>
            {staff.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
          </select></div>
        <div><label style={labelStyle}>LEAVE TYPE</label>
          <select value={leaveForm.leaveType} onChange={e => setLeaveForm(f => ({ ...f, leaveType: e.target.value }))} style={inputStyle}>
            {['ANNUAL', 'SICK', 'MATERNITY', 'PATERNITY', 'COMPASSIONATE', 'OTHER'].map(t => <option key={t}>{t}</option>)}
          </select></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>START DATE <span style={{ color: '#f87171' }}>*</span></label><input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm(f => ({ ...f, startDate: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>END DATE <span style={{ color: '#f87171' }}>*</span></label><input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm(f => ({ ...f, endDate: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>REASON</label><textarea rows={3} value={leaveForm.reason} onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      </Drawer>
    </div>
  )
}
