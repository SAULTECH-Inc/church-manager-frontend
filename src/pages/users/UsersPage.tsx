import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, X, Edit2, Key, ToggleLeft } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { getInitials } from '@/lib/utils'

interface AppUser { id: string; email: string; displayName?: string; role: string; memberName?: string; memberId?: string; active: boolean; lastLogin?: string }
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

const roleColors: Record<string, { color: string; bg: string }> = {
  ADMIN: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  PASTOR: { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  MINISTER: { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  MEMBER: { color: 'rgb(var(--inv) / 0.5)', bg: 'rgb(var(--inv) / 0.08)' },
}

export function UsersPage() {
  const [createDrawer, setCreateDrawer] = useState(false)
  const [editDrawer, setEditDrawer] = useState(false)
  const [resetDrawer, setResetDrawer] = useState(false)
  const [editUser, setEditUser] = useState<AppUser | null>(null)
  const [resetUserId, setResetUserId] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [createForm, setCreateForm] = useState({ email: '', password: '', displayName: '', role: 'MEMBER', memberId: '' })
  const [editForm, setEditForm] = useState({ displayName: '', role: 'MEMBER', memberId: '' })
  const [resetForm, setResetForm] = useState({ newPassword: '', confirmPassword: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/api/users').then(r => r.data as { users: AppUser[], members: Member[], stats: Record<string, number> }),
  })

  const toQS = (obj: Record<string, string>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v) p.append(k, v) }); return p.toString() }
  const createMutation = useMutation({
    mutationFn: () => api.post(`/api/users?${toQS(createForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setCreateDrawer(false); setCreateForm({ email: '', password: '', displayName: '', role: 'MEMBER', memberId: '' }) },
  })
  const editMutation = useMutation({
    mutationFn: () => api.post(`/api/users/${editUser?.id}/edit?${toQS(editForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setEditDrawer(false); setEditUser(null) },
  })
  const resetMutation = useMutation({
    mutationFn: () => api.post(`/api/users/${resetUserId}/reset-password?newPassword=${encodeURIComponent(resetForm.newPassword)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setResetDrawer(false); setResetForm({ newPassword: '', confirmPassword: '' }); setResetUserId('') },
  })
  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/users/${id}/toggle-status`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/users/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
  const bulkDeactivate = useMutation({
    mutationFn: () => Promise.all([...selected].map(id => api.post(`/api/users/${id}/toggle-status`))),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setSelected(new Set()) },
  })

  const users = data?.users ?? []
  const members = data?.members ?? []
  const stats = data?.stats ?? {}

  const allChecked = users.length > 0 && users.every(u => selected.has(u.id))
  const toggleAll = () => setSelected(allChecked ? new Set() : new Set(users.map(u => u.id)))
  const toggleOne = (id: string) => setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s })

  const passwordsMatch = resetForm.newPassword === resetForm.confirmPassword && resetForm.confirmPassword !== ''

  const openEdit = (u: AppUser) => { setEditUser(u); setEditForm({ displayName: u.displayName ?? '', role: u.role, memberId: u.memberId ?? '' }); setEditDrawer(true) }
  const openReset = (id: string) => { setResetUserId(id); setResetDrawer(true) }

  const kpis = [
    { label: 'Total Users', value: stats.total ?? users.length },
    { label: 'Active Accounts', value: stats.active ?? 0 },
    { label: 'Administrators', value: stats.admins ?? 0 },
    { label: 'Ministers & Pastors', value: stats.clergy ?? 0 },
  ]

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: 'var(--page-bg)' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 26, margin: 0 }}>User Accounts</h1>
          <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 14, marginTop: 4 }}>System Users · Roles · Permissions</p>
        </div>
        <button onClick={() => setCreateDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> New User</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 20 }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 26, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 13, margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {selected.size > 0 && (
        <div style={{ backgroundColor: 'rgba(124,107,255,0.1)', border: '1px solid rgba(124,107,255,0.3)', borderRadius: 14, padding: '12px 20px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#a78bfa', fontWeight: 600, fontSize: 14 }}>{selected.size} user{selected.size > 1 ? 's' : ''} selected</span>
          <div className="flex gap-2">
            <button onClick={() => setSelected(new Set())} style={{ ...outlineBtn, padding: '7px 14px', fontSize: 13 }}>Clear</button>
            <button onClick={() => bulkDeactivate.mutate()} disabled={bulkDeactivate.isPending}
              style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 10, padding: '7px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              Deactivate Selected
            </button>
          </div>
        </div>
      )}

      {isLoading && <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgb(var(--inv) / 0.4)' }}>Loading...</p></div>}

      {!isLoading && (
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b" style={{ borderColor: 'rgb(var(--inv) / 0.06)', backgroundColor: 'rgb(var(--inv) / 0.03)' }}>
                <th className="px-5 py-3 w-10">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} style={{ accentColor: '#7c6bff', width: 15, height: 15, cursor: 'pointer' }} />
                </th>
                {['USER', 'ROLE', 'LINKED MEMBER', 'STATUS', 'LAST LOGIN', 'ACTIONS'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgb(var(--inv) / 0.4)' }}>{col}</th>
                ))}
              </tr></thead>
              <tbody>
                {users.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'rgb(var(--inv) / 0.4)' }}>No users yet</td></tr>}
                {users.map(u => {
                  const rc = roleColors[u.role] ?? roleColors.MEMBER
                  return (
                    <tr key={u.id} className="border-b" style={{ borderColor: 'rgb(var(--inv) / 0.04)', backgroundColor: selected.has(u.id) ? 'rgba(124,107,255,0.05)' : undefined }}>
                      <td className="px-5 py-4">
                        <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleOne(u.id)} style={{ accentColor: '#7c6bff', width: 15, height: 15, cursor: 'pointer' }} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {getInitials(u.displayName ?? u.email)}
                          </div>
                          <div>
                            <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: 0, fontSize: 14 }}>{u.displayName || '—'}</p>
                            <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 12, margin: 0 }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4"><span style={{ backgroundColor: rc.bg, color: rc.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{u.role}</span></td>
                      <td className="px-5 py-4" style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13 }}>{u.memberName || <span style={{ color: 'rgb(var(--inv) / 0.3)', fontStyle: 'italic' }}>Unlinked</span>}</td>
                      <td className="px-5 py-4">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: u.active ? '#10b981' : 'rgb(var(--inv) / 0.3)', display: 'inline-block', boxShadow: u.active ? '0 0 6px #10b981' : 'none' }} />
                          <span style={{ color: u.active ? '#34d399' : 'rgb(var(--inv) / 0.4)' }}>{u.active ? 'Active' : 'Inactive'}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4" style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 13 }}>{u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(u)} style={{ background: 'rgb(var(--inv) / 0.06)', border: 'none', color: 'rgb(var(--inv) / 0.6)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit2 size={13} /></button>
                          <button onClick={() => openReset(u.id)} style={{ background: 'rgba(245,158,11,0.1)', border: 'none', color: '#f59e0b', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Key size={13} /></button>
                          <button onClick={() => toggleMutation.mutate(u.id)} style={{ background: 'rgba(96,165,250,0.1)', border: 'none', color: '#60a5fa', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ToggleLeft size={13} /></button>
                          <button onClick={() => { if (confirm('Delete user?')) deleteMutation.mutate(u.id) }} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
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

      <Drawer open={createDrawer} onClose={() => setCreateDrawer(false)} title="Create User Account"
        footer={<>
          <button onClick={() => setCreateDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => createMutation.mutate()} disabled={!createForm.email || !createForm.password || createMutation.isPending} style={gradientBtn}>{createMutation.isPending ? 'Creating...' : 'Create User'}</button>
        </>}>
        <div><label style={labelStyle}>EMAIL ADDRESS <span style={{ color: '#f87171' }}>*</span></label><input type="email" value={createForm.email} onChange={e => setCreateForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>PASSWORD <span style={{ color: '#f87171' }}>*</span></label><input type="password" value={createForm.password} onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" style={inputStyle} /></div>
        <div><label style={labelStyle}>DISPLAY NAME</label><input type="text" value={createForm.displayName} onChange={e => setCreateForm(f => ({ ...f, displayName: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>ROLE <span style={{ color: '#f87171' }}>*</span></label>
          <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))} style={inputStyle}>
            {['ADMIN', 'PASTOR', 'MINISTER', 'MEMBER'].map(r => <option key={r}>{r}</option>)}
          </select></div>
        <div><label style={labelStyle}>LINKED MEMBER (OPTIONAL)</label>
          <select value={createForm.memberId} onChange={e => setCreateForm(f => ({ ...f, memberId: e.target.value }))} style={inputStyle}>
            <option value="">No link...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
      </Drawer>

      <Drawer open={editDrawer} onClose={() => { setEditDrawer(false); setEditUser(null) }} title="Edit User"
        footer={<>
          <button onClick={() => { setEditDrawer(false); setEditUser(null) }} style={outlineBtn}>Cancel</button>
          <button onClick={() => editMutation.mutate()} disabled={editMutation.isPending} style={gradientBtn}>{editMutation.isPending ? 'Saving...' : 'Save Changes'}</button>
        </>}>
        <div><label style={labelStyle}>DISPLAY NAME</label><input type="text" value={editForm.displayName} onChange={e => setEditForm(f => ({ ...f, displayName: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>ROLE</label>
          <select value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} style={inputStyle}>
            {['ADMIN', 'PASTOR', 'MINISTER', 'MEMBER'].map(r => <option key={r}>{r}</option>)}
          </select></div>
        <div><label style={labelStyle}>LINKED MEMBER</label>
          <select value={editForm.memberId} onChange={e => setEditForm(f => ({ ...f, memberId: e.target.value }))} style={inputStyle}>
            <option value="">No link...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
      </Drawer>

      <Drawer open={resetDrawer} onClose={() => { setResetDrawer(false); setResetForm({ newPassword: '', confirmPassword: '' }); setResetUserId('') }} title="Reset Password"
        footer={<>
          <button onClick={() => setResetDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => resetMutation.mutate()} disabled={!passwordsMatch || resetMutation.isPending} style={gradientBtn}>{resetMutation.isPending ? 'Resetting...' : 'Reset Password'}</button>
        </>}>
        <div style={{ backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 12, padding: '12px 16px' }}>
          <p style={{ color: '#f59e0b', fontSize: 13, margin: 0 }}>⚠️ This will immediately change the user's password. They will need to use the new password on their next login.</p>
        </div>
        <div><label style={labelStyle}>NEW PASSWORD <span style={{ color: '#f87171' }}>*</span></label>
          <input type="password" value={resetForm.newPassword} onChange={e => setResetForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Min 6 characters" style={inputStyle} /></div>
        <div>
          <label style={labelStyle}>CONFIRM PASSWORD <span style={{ color: '#f87171' }}>*</span></label>
          <input type="password" value={resetForm.confirmPassword} onChange={e => setResetForm(f => ({ ...f, confirmPassword: e.target.value }))}
            style={{ ...inputStyle, borderColor: resetForm.confirmPassword && !passwordsMatch ? '#f87171' : 'rgb(var(--inv) / 0.10)' }} />
          {resetForm.confirmPassword && !passwordsMatch && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>Passwords do not match</p>}
          {passwordsMatch && <p style={{ color: '#34d399', fontSize: 12, marginTop: 6 }}>✓ Passwords match</p>}
        </div>
      </Drawer>
    </div>
  )
}
