import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { HandHeart, Plus, Upload, Download, Edit2, Trash2, ToggleLeft, X, ChevronDown, Users } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { getInitials } from '@/lib/utils'

interface Volunteer {
  id: string
  ministry?: string
  skills?: string
  availabilityDays?: string
  availabilityNotes?: string
  status: string
  member: { id: string; fullName: string }
}
interface Member { id: string; fullName: string }

const labelStyle: React.CSSProperties = {
  display: 'block', color: 'rgb(var(--inv) / 0.5)', fontSize: 10,
  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6,
}
const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--input-bg)', border: '1px solid rgb(var(--inv) / 0.10)', color: 'var(--text-primary)',
  borderRadius: 12, width: '100%', padding: '10px 14px', fontSize: 14, outline: 'none',
}
const outlineBtn: React.CSSProperties = {
  border: '1px solid rgb(var(--inv) / 0.15)', backgroundColor: 'transparent', color: 'var(--text-primary)',
  borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 500, fontSize: 14,
}
const gradientBtn: React.CSSProperties = {
  background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--text-primary)',
  border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14,
}

function statusDot(status: string) {
  if (status === 'ACTIVE') return { color: '#34d399', label: 'Active', dot: '#10b981' }
  if (status === 'ON_LEAVE') return { color: '#60a5fa', label: 'On Leave', dot: '#3b82f6' }
  return { color: 'rgb(var(--inv) / 0.5)', label: 'Inactive', dot: 'rgb(var(--inv) / 0.3)' }
}

interface DrawerProps {
  open: boolean; onClose: () => void; title: string
  children: React.ReactNode; footer: React.ReactNode
}
function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  if (!open) return null
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
        <div style={{ backgroundColor: 'var(--drawer-bg)', borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', border: '1px solid rgb(var(--inv) / 0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', pointerEvents: 'auto' }}>
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgb(var(--inv) / 0.08)' }}>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18 }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgb(var(--inv) / 0.5)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-5">{children}</div>
          <div className="shrink-0 flex gap-3 px-6 py-4 border-t" style={{ borderColor: 'rgb(var(--inv) / 0.08)' }}>
            {footer}
          </div>
        </div>
      </div>
    </>
  )
}

export function VolunteersPage() {
  const [registerDrawerOpen, setRegisterDrawerOpen] = useState(false)
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Volunteer | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const [registerForm, setRegisterForm] = useState({ memberId: '', ministry: '', skills: '', availabilityDays: '', availabilityNotes: '' })
  const [editForm, setEditForm] = useState({ ministry: '', skills: '', availabilityDays: '', availabilityNotes: '', status: 'ACTIVE' })

  const { data, isLoading } = useQuery({
    queryKey: ['volunteers'],
    queryFn: () => api.get('/api/volunteers').then(r => r.data as { volunteers: Volunteer[], members: Member[] }),
  })

  const toQS = (obj: Record<string, string>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v) p.append(k, v) }); return p.toString() }
  const createMutation = useMutation({
    mutationFn: () => api.post(`/api/volunteers/create?${toQS(registerForm)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] })
      setRegisterDrawerOpen(false)
      setRegisterForm({ memberId: '', ministry: '', skills: '', availabilityDays: '', availabilityNotes: '' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/volunteers/${id}/update?${toQS(editForm)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] })
      setEditDrawerOpen(false); setEditTarget(null)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/volunteers/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['volunteers'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/volunteers/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['volunteers'] }),
  })

  const volunteers = data?.volunteers ?? []
  const members = data?.members ?? []
  const active = volunteers.filter(v => v.status === 'ACTIVE').length
  const inactive = volunteers.filter(v => v.status === 'INACTIVE').length
  const onLeave = volunteers.filter(v => v.status === 'ON_LEAVE').length

  const handleImport = async () => {
    if (!importFile) return
    const fd = new FormData(); fd.append('file', importFile)
    await api.post('/api/volunteers/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    queryClient.invalidateQueries({ queryKey: ['volunteers'] })
    setImportOpen(false); setImportFile(null)
  }

  const openEdit = (v: Volunteer) => {
    setEditTarget(v)
    setEditForm({ ministry: v.ministry ?? '', skills: v.skills ?? '', availabilityDays: v.availabilityDays ?? '', availabilityNotes: v.availabilityNotes ?? '', status: v.status })
    setEditDrawerOpen(true)
  }

  const kpiCards = [
    { label: 'Total Volunteers', value: volunteers.length, iconColor: '#7c6bff', iconBg: 'rgba(124,107,255,0.1)', Icon: HandHeart },
    { label: 'Active', value: active, iconColor: '#34d399', iconBg: 'rgba(16,185,129,0.1)', Icon: Users },
    { label: 'Inactive', value: inactive, iconColor: 'rgb(var(--inv) / 0.5)', iconBg: 'rgb(var(--inv) / 0.06)', Icon: Users },
    { label: 'On Leave', value: onLeave, iconColor: '#60a5fa', iconBg: 'rgba(59,130,246,0.1)', Icon: Users },
  ]

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: 'var(--page-bg)' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 26, margin: 0 }}>Volunteer Register</h1>
          <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 14, marginTop: 4 }}>Member Volunteers · Ministry Areas · Availability Tracking</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Export dropdown */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setExportMenuOpen(v => !v)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgb(var(--inv) / 0.06)', border: '1px solid rgb(var(--inv) / 0.1)', color: 'var(--text-primary)', borderRadius: 12, padding: '9px 14px', cursor: 'pointer', fontSize: 14 }}>
              <Download size={15} /> Export <ChevronDown size={14} />
            </button>
            {exportMenuOpen && (
              <div style={{ position: 'absolute', top: '110%', right: 0, backgroundColor: 'var(--drawer-bg)', border: '1px solid rgb(var(--inv) / 0.08)', borderRadius: 12, zIndex: 20, minWidth: 140, overflow: 'hidden' }}
                onMouseLeave={() => setExportMenuOpen(false)}>
                {['XLSX', 'CSV', 'DOCX', 'JPEG', 'PDF'].map(fmt => (
                  <button key={fmt}
                    onClick={() => { window.location.href = `/api/volunteers/export?format=${fmt.toLowerCase()}`; setExportMenuOpen(false) }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 16px', background: 'none', border: 'none', color: 'rgb(var(--inv) / 0.8)', cursor: 'pointer', fontSize: 14 }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgb(var(--inv) / 0.06)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
                    {fmt}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Import */}
          <button onClick={() => setImportOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: 12, padding: '9px 14px', cursor: 'pointer', fontSize: 14 }}>
            <Upload size={15} /> Import
          </button>
          {/* Register */}
          <button onClick={() => setRegisterDrawerOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, ...gradientBtn, padding: '9px 16px' }}>
            <Plus size={15} /> Register Volunteer
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {kpiCards.map(({ label, value, iconColor, iconBg, Icon }) => (
          <div key={label} style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Icon size={18} style={{ color: iconColor }} />
            </div>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 28, margin: 0 }}>{value}</p>
            <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 13, marginTop: 4 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', overflow: 'hidden' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse flex items-center gap-4 px-5 py-4 border-b" style={{ borderColor: 'rgb(var(--inv) / 0.04)' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgb(var(--inv) / 0.06)' }} />
              <div style={{ flex: 1, height: 14, borderRadius: 6, backgroundColor: 'rgb(var(--inv) / 0.06)' }} />
              <div style={{ width: 80, height: 14, borderRadius: 6, backgroundColor: 'rgb(var(--inv) / 0.06)' }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && volunteers.length === 0 && (
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 60, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(124,107,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <HandHeart size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 16 }}>No volunteers registered yet</p>
          <p style={{ color: 'rgb(var(--inv) / 0.45)', fontSize: 14, marginTop: 4 }}>Register your first volunteer to get started</p>
          <button onClick={() => setRegisterDrawerOpen(true)} style={{ marginTop: 16, ...gradientBtn }}>Register Volunteer</button>
        </div>
      )}

      {/* Table */}
      {!isLoading && volunteers.length > 0 && (
        <div className="overflow-hidden rounded-2xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'rgb(var(--inv) / 0.08)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgb(var(--inv) / 0.06)', backgroundColor: 'rgb(var(--inv) / 0.03)' }}>
                  {['MEMBER','MINISTRY','SKILLS','AVAILABILITY','STATUS','ACTIONS'].map(col => (
                    <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgb(var(--inv) / 0.4)' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgb(var(--inv) / 0.04)' }}>
                {volunteers.map(v => {
                  const { color, label, dot } = statusDot(v.status)
                  return (
                    <tr key={v.id} style={{ borderColor: 'rgb(var(--inv) / 0.04)' }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                            {getInitials(v.member.fullName)}
                          </div>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14 }}>{v.member.fullName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {v.ministry
                          ? <span style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8b5cf6', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{v.ministry}</span>
                          : <span style={{ color: 'rgb(var(--inv) / 0.3)' }}>—</span>}
                      </td>
                      <td className="px-5 py-4" style={{ maxWidth: 200 }}>
                        <span style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          {v.skills || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13 }}>{v.availabilityDays || '—'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: dot, display: 'inline-block' }} />
                          {label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(v)} title="Edit"
                            style={{ background: 'rgb(var(--inv) / 0.06)', border: 'none', color: 'rgb(var(--inv) / 0.6)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => toggleMutation.mutate(v.id)} title="Toggle status" disabled={toggleMutation.isPending}
                            style={{ background: 'rgb(var(--inv) / 0.06)', border: 'none', color: 'rgb(var(--inv) / 0.6)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ToggleLeft size={13} />
                          </button>
                          <button onClick={() => { if (confirm('Delete this volunteer?')) deleteMutation.mutate(v.id) }} title="Delete" disabled={deleteMutation.isPending}
                            style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 size={13} />
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
      )}

      {/* Register Drawer */}
      <Drawer open={registerDrawerOpen} onClose={() => setRegisterDrawerOpen(false)} title="Register Volunteer"
        footer={<>
          <button onClick={() => setRegisterDrawerOpen(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => createMutation.mutate()} disabled={!registerForm.memberId || createMutation.isPending} style={gradientBtn}>
            {createMutation.isPending ? 'Registering...' : 'Register Volunteer'}
          </button>
        </>}>
        <div>
          <label style={labelStyle}>CHURCH MEMBER <span style={{ color: '#f87171' }}>*</span></label>
          <select value={registerForm.memberId} onChange={e => setRegisterForm(f => ({ ...f, memberId: e.target.value }))} style={inputStyle}>
            <option value="">Select a member...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>MINISTRY / DEPARTMENT</label>
          <input type="text" placeholder="e.g. Children's Ministry, Choir…" value={registerForm.ministry}
            onChange={e => setRegisterForm(f => ({ ...f, ministry: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>SKILLS</label>
          <textarea rows={2} placeholder="List key skills…" value={registerForm.skills}
            onChange={e => setRegisterForm(f => ({ ...f, skills: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} />
        </div>
        <div>
          <label style={labelStyle}>AVAILABILITY DAYS</label>
          <input type="text" placeholder="e.g. Saturdays, Weekends, Mon-Wed…" value={registerForm.availabilityDays}
            onChange={e => setRegisterForm(f => ({ ...f, availabilityDays: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>AVAILABILITY NOTES</label>
          <textarea rows={2} placeholder="Any additional availability details…" value={registerForm.availabilityNotes}
            onChange={e => setRegisterForm(f => ({ ...f, availabilityNotes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} />
        </div>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer open={editDrawerOpen} onClose={() => { setEditDrawerOpen(false); setEditTarget(null) }} title="Edit Volunteer Record"
        footer={<>
          <button onClick={() => { setEditDrawerOpen(false); setEditTarget(null) }} style={outlineBtn}>Cancel</button>
          <button onClick={() => editTarget && updateMutation.mutate(editTarget.id)} disabled={updateMutation.isPending} style={gradientBtn}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </>}>
        <div>
          <label style={labelStyle}>MINISTRY / DEPARTMENT</label>
          <input type="text" value={editForm.ministry} onChange={e => setEditForm(f => ({ ...f, ministry: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>SKILLS</label>
          <textarea rows={2} value={editForm.skills} onChange={e => setEditForm(f => ({ ...f, skills: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} />
        </div>
        <div>
          <label style={labelStyle}>AVAILABILITY DAYS</label>
          <input type="text" value={editForm.availabilityDays} onChange={e => setEditForm(f => ({ ...f, availabilityDays: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>AVAILABILITY NOTES</label>
          <textarea rows={2} value={editForm.availabilityNotes} onChange={e => setEditForm(f => ({ ...f, availabilityNotes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} />
        </div>
        <div>
          <label style={labelStyle}>STATUS</label>
          <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>
        </div>
      </Drawer>

      {/* Import Modal */}
      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: 'var(--drawer-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', width: 440, padding: 32 }}>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Import Volunteers</h2>
            <p style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 14, marginBottom: 16 }}>
              Download our template to format your data correctly.{' '}
              <a href="/api/volunteers/import/template" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Download Template</a>
            </p>
            <input type="file" accept=".csv,.xlsx,.xls"
              onChange={e => setImportFile(e.target.files?.[0] ?? null)}
              style={{ color: 'rgb(var(--inv) / 0.7)', fontSize: 14, marginBottom: 4 }} />
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setImportOpen(false)} style={outlineBtn}>Cancel</button>
              <button onClick={handleImport} disabled={!importFile} style={gradientBtn}>Import Volunteers</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
