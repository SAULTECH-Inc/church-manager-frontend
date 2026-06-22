import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, X, ChevronDown, ChevronUp, ToggleLeft, ToggleRight } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'

interface RoleGroup { id: string; name: string; description?: string; roleCount: number }
interface DynamicRole { id: string; name: string; description?: string; permissions: string[]; groupName?: string }
interface Permission { id: string; name: string; module: string; description?: string }
interface UserAssignment { userId: string; displayName: string; email: string; role: string; assignedAt: string }
interface EndpointGuard { id: string; method: string; pathPattern: string; permissionGate?: string; roleGate?: string }
interface ApprovalChain { id: string; name: string; description?: string; triggerModule?: string; triggerAction?: string; isActive: boolean; steps?: ApprovalStep[] }
interface ApprovalStep  { id: string; stepOrder: number; approverType: string; staticRole?: string; isRequired: boolean; timeoutHours?: number }

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

const httpMethodColor: Record<string, { color: string; bg: string }> = {
  GET: { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  POST: { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  PUT: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  PATCH: { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  DELETE: { color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
}

const TABS = ['Role Groups', 'Dynamic Roles', 'Permissions', 'User Assignments', 'Endpoint Guards', 'Approval Chains']

export function RolesPage() {
  const [activeTab, setActiveTab] = useState(0)
  const [groupDrawer, setGroupDrawer] = useState(false)
  const [roleDrawer, setRoleDrawer] = useState(false)
  const [permDrawer, setPermDrawer] = useState(false)
  const [guardDrawer, setGuardDrawer] = useState(false)
  const [chainDrawer, setChainDrawer] = useState(false)
  const [stepFor, setStepFor]         = useState<string | null>(null)
  const [expandedRole, setExpandedRole]   = useState<string | null>(null)
  const [expandedChain, setExpandedChain] = useState<string | null>(null)

  const [groupForm, setGroupForm] = useState({ name: '', description: '' })
  const [roleForm, setRoleForm] = useState({ name: '', description: '', groupId: '', permissions: '' })
  const [permForm, setPermForm] = useState({ name: '', module: '', description: '' })
  const [guardForm, setGuardForm] = useState({ method: 'GET', pathPattern: '', permissionGate: '', roleGate: '' })
  const [chainForm, setChainForm] = useState({ name: '', description: '', triggerModule: '', triggerAction: '', triggerCondition: '' })
  const [stepForm,  setStepForm]  = useState({ approverType: 'STATIC_ROLE', staticRole: 'ADMIN', timeoutHours: '', required: true })

  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/api/roles').then(r => r.data as {
      groups: RoleGroup[], roles: DynamicRole[], permissions: Permission[], assignments: UserAssignment[], guards: EndpointGuard[],
      approvalChains: ApprovalChain[], stats: Record<string, number>
    }),
  })

  const toQS = (obj: Record<string, string>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v) p.append(k, v) }); return p.toString() }
  const createGroup = useMutation({ mutationFn: () => api.post(`/api/roles/groups?${toQS(groupForm)}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); setGroupDrawer(false); setGroupForm({ name: '', description: '' }) } })
  const createRole = useMutation({ mutationFn: () => api.post(`/api/roles/create?${toQS(roleForm)}`), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); setRoleDrawer(false); setRoleForm({ name: '', description: '', groupId: '', permissions: '' }) } })
  const createPerm = useMutation({ mutationFn: () => { const p = new URLSearchParams(); if (permForm.name) p.append('permissionKey', permForm.name); if (permForm.module) p.append('module', permForm.module); if (permForm.description) p.append('description', permForm.description); return api.post(`/api/roles/permissions/create?${p}`) }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); setPermDrawer(false); setPermForm({ name: '', module: '', description: '' }) } })
  const createGuard = useMutation({ mutationFn: () => { const p = new URLSearchParams(); if (guardForm.method) p.append('httpMethod', guardForm.method); if (guardForm.pathPattern) p.append('pathPattern', guardForm.pathPattern); if (guardForm.permissionGate) p.append('permissionGate', guardForm.permissionGate); if (guardForm.roleGate) p.append('roleGate', guardForm.roleGate); return api.post(`/api/roles/endpoints/create?${p}`) }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); setGuardDrawer(false); setGuardForm({ method: 'GET', pathPattern: '', permissionGate: '', roleGate: '' }) } })
  const deleteGroup = useMutation({ mutationFn: (id: string) => api.post(`/api/roles/groups/${id}/delete`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }) })
  const deleteRole = useMutation({ mutationFn: (id: string) => api.post(`/api/roles/${id}/delete`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }) })
  const deleteGuard    = useMutation({ mutationFn: (id: string) => api.post(`/api/roles/endpoints/${id}/delete`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }) })
  const createChain   = useMutation({ mutationFn: () => api.post('/api/roles/chains/create', null, { params: chainForm }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); setChainDrawer(false); setChainForm({ name: '', description: '', triggerModule: '', triggerAction: '', triggerCondition: '' }) } })
  const deleteChain   = useMutation({ mutationFn: (id: string) => api.post(`/api/roles/chains/${id}/delete`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }) })
  const toggleChain   = useMutation({ mutationFn: (id: string) => api.post(`/api/roles/chains/${id}/toggle`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }) })
  const addStep       = useMutation({ mutationFn: () => api.post(`/api/roles/chains/${stepFor}/steps/add`, null, { params: { ...stepForm, timeoutHours: stepForm.timeoutHours || undefined } }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['roles'] }); setStepFor(null); setStepForm({ approverType: 'STATIC_ROLE', staticRole: 'ADMIN', timeoutHours: '', required: true }) } })
  const deleteStep    = useMutation({ mutationFn: (id: string) => api.post(`/api/roles/steps/${id}/delete`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }) })

  const groups = data?.groups ?? []
  const roles = data?.roles ?? []
  const permissions = data?.permissions ?? []
  const assignments = data?.assignments ?? []
  const guards = data?.guards ?? []
  const chains = data?.approvalChains ?? []
  const stats = data?.stats ?? {}

  const permByModule = permissions.reduce<Record<string, Permission[]>>((acc, p) => { (acc[p.module] = acc[p.module] ?? []).push(p); return acc }, {})

  const addBtn = [
    { label: 'Add Group', action: () => setGroupDrawer(true) },
    { label: 'Add Role', action: () => setRoleDrawer(true) },
    { label: 'Add Permission', action: () => setPermDrawer(true) },
    null,
    { label: 'Add Guard', action: () => setGuardDrawer(true) },
    null,
  ][activeTab]

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>Roles & Permissions</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Access Control · Role Groups · Endpoint Guards</p>
        </div>
        {addBtn && <button onClick={addBtn.action} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> {addBtn.label}</button>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Role Groups', value: stats.groups ?? groups.length },
          { label: 'Dynamic Roles', value: stats.roles ?? roles.length },
          { label: 'Permissions', value: stats.permissions ?? permissions.length },
          { label: 'User Assignments', value: stats.assignments ?? assignments.length },
        ].map(k => (
          <div key={k.label} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Underline tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 20, gap: 4 }}>
        {TABS.map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(i)}
            style={{ padding: '10px 18px', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, color: activeTab === i ? '#7c6bff' : 'rgba(255,255,255,0.4)', borderBottom: `2px solid ${activeTab === i ? '#7c6bff' : 'transparent'}`, transition: 'all 0.15s' }}>
            {tab}
          </button>
        ))}
      </div>

      {isLoading && <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>}

      {!isLoading && activeTab === 0 && (
        <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              {['GROUP NAME', 'DESCRIPTION', 'ROLES', 'ACTIONS'].map(col => <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{col}</th>)}
            </tr></thead>
            <tbody>
              {groups.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>No role groups yet</td></tr>}
              {groups.map(g => (
                <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-4" style={{ color: 'white', fontWeight: 600 }}>{g.name}</td>
                  <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{g.description || '—'}</td>
                  <td className="px-5 py-4"><span style={{ backgroundColor: 'rgba(124,107,255,0.15)', color: '#a78bfa', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{g.roleCount}</span></td>
                  <td className="px-5 py-4">
                    <button onClick={() => { if (confirm('Delete group?')) deleteGroup.mutate(g.id) }} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && activeTab === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {roles.length === 0 && <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 32, textAlign: 'center', gridColumn: '1/-1' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>No roles yet</p></div>}
          {roles.map(role => (
            <div key={role.id} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: 0 }}>{role.name}</p>
                  {role.groupName && <p style={{ color: '#7c6bff', fontSize: 12, margin: '2px 0 0' }}>{role.groupName}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}
                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.6)', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronDown size={13} style={{ transform: expandedRole === role.id ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                  </button>
                  <button onClick={() => { if (confirm('Delete role?')) deleteRole.mutate(role.id) }} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={12} /></button>
                </div>
              </div>
              {role.description && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, padding: '10px 20px 0', margin: 0 }}>{role.description}</p>}
              {expandedRole === role.id && (
                <div style={{ padding: '12px 20px 16px' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', marginBottom: 8 }}>Permissions ({role.permissions.length})</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
                    {role.permissions.map(p => <span key={p} style={{ backgroundColor: 'rgba(124,107,255,0.1)', color: '#a78bfa', borderRadius: 6, padding: '3px 8px', fontSize: 11 }}>{p}</span>)}
                    {role.permissions.length === 0 && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No permissions assigned</span>}
                  </div>
                </div>
              )}
              <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && activeTab === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
          {Object.keys(permByModule).length === 0 && <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>No permissions defined</p></div>}
          {Object.entries(permByModule).map(([module, perms]) => (
            <div key={module} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <span style={{ color: '#7c6bff', fontWeight: 700, fontSize: 14 }}>{module}</span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginLeft: 8 }}>{perms.length} permissions</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, padding: 16 }}>
                {perms.map(p => (
                  <div key={p.id} style={{ backgroundColor: 'rgba(124,107,255,0.08)', border: '1px solid rgba(124,107,255,0.2)', borderRadius: 10, padding: '7px 12px' }}>
                    <p style={{ color: '#a78bfa', fontWeight: 600, fontSize: 13, margin: 0 }}>{p.name}</p>
                    {p.description && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '2px 0 0' }}>{p.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && activeTab === 3 && (
        <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              {['USER', 'ROLE', 'ASSIGNED AT'].map(col => <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{col}</th>)}
            </tr></thead>
            <tbody>
              {assignments.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>No assignments</td></tr>}
              {assignments.map(a => (
                <tr key={a.userId} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td className="px-5 py-4">
                    <p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{a.displayName}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>{a.email}</p>
                  </td>
                  <td className="px-5 py-4"><span style={{ backgroundColor: 'rgba(124,107,255,0.15)', color: '#a78bfa', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{a.role}</span></td>
                  <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{a.assignedAt ? new Date(a.assignedAt).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && activeTab === 4 && (
        <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <table className="w-full text-sm">
            <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
              {['METHOD', 'PATH PATTERN', 'PERMISSION GATE', 'ROLE GATE', 'ACTIONS'].map(col => <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{col}</th>)}
            </tr></thead>
            <tbody>
              {guards.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>No endpoint guards</td></tr>}
              {guards.map(g => {
                const mc = httpMethodColor[g.method] ?? { color: 'white', bg: 'rgba(255,255,255,0.1)' }
                return (
                  <tr key={g.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-4"><span style={{ backgroundColor: mc.bg, color: mc.color, borderRadius: 6, padding: '3px 8px', fontSize: 11, fontWeight: 700 }}>{g.method}</span></td>
                    <td className="px-5 py-4" style={{ fontFamily: 'monospace', color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{g.pathPattern}</td>
                    <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{g.permissionGate || <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>}</td>
                    <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{g.roleGate || <span style={{ color: 'rgba(255,255,255,0.25)' }}>—</span>}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => { if (confirm('Delete guard?')) deleteGuard.mutate(g.id) }} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && activeTab === 5 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>Define multi-step approval workflows that trigger on specific module actions.</p>
            <button onClick={() => setChainDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}><Plus size={14} /> New Chain</button>
          </div>
          {chains.length === 0 && (
            <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}>
              <p style={{ fontSize: 36, margin: '0 0 10px' }}>🔗</p>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>No Approval Chains</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>Create your first approval chain to automate multi-step approvals.</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {chains.map(c => {
              const isOpen = expandedChain === c.id
              const steps  = c.steps ?? []
              return (
                <div key={c.id} style={{ backgroundColor: '#13152e', borderRadius: 16, border: `1px solid ${c.isActive ? 'rgba(124,107,255,0.25)' : 'rgba(255,255,255,0.08)'}`, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px' }}>
                    <div className="flex items-center justify-between gap-4">
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-2 mb-1">
                          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c.isActive ? '#10b981' : '#6b7280', display: 'inline-block', flexShrink: 0 }} />
                          <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>{c.name}</p>
                        </div>
                        {c.description && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '2px 0 0 16px' }}>{c.description}</p>}
                        <div className="flex gap-3 mt-1 ml-4">
                          {c.triggerModule && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Module: <span style={{ color: '#a78bfa' }}>{c.triggerModule}</span></span>}
                          {c.triggerAction && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Action: <span style={{ color: '#60a5fa' }}>{c.triggerAction}</span></span>}
                          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>{steps.length} step{steps.length !== 1 ? 's' : ''}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => toggleChain.mutate(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          {c.isActive ? <ToggleRight size={26} color="#7c6bff" /> : <ToggleLeft size={26} color="rgba(255,255,255,0.3)" />}
                        </button>
                        <button onClick={() => setExpandedChain(isOpen ? null : c.id)} style={{ ...outlineBtn, padding: '4px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}>
                          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                        <button onClick={() => { if (confirm('Delete chain?')) deleteChain.mutate(c.id) }}
                          style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  </div>
                  {isOpen && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 20px' }}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0 }}>Steps</h4>
                        <button onClick={() => setStepFor(c.id)} style={{ ...gradientBtn, padding: '4px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 3 }}><Plus size={12} /> Add Step</button>
                      </div>
                      {steps.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No steps yet. Add the first approver.</p>}
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                        {steps.map(s => (
                          <div key={s.id} className="flex items-center justify-between" style={{ padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex items-center gap-3">
                              <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: 'rgba(124,107,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7c6bff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{s.stepOrder}</div>
                              <div>
                                <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{s.staticRole ?? s.approverType}</p>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
                                  {s.approverType} · {s.isRequired ? 'Required' : 'Optional'}{s.timeoutHours ? ` · ${s.timeoutHours}h timeout` : ''}
                                </p>
                              </div>
                            </div>
                            <button onClick={() => deleteStep.mutate(s.id)} style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)', cursor: 'pointer', padding: 0 }}><Trash2 size={13} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Drawer open={groupDrawer} onClose={() => setGroupDrawer(false)} title="Add Role Group"
        footer={<><button onClick={() => setGroupDrawer(false)} style={outlineBtn}>Cancel</button><button onClick={() => createGroup.mutate()} disabled={!groupForm.name || createGroup.isPending} style={gradientBtn}>{createGroup.isPending ? 'Saving...' : 'Create Group'}</button></>}>
        <div><label style={labelStyle}>GROUP NAME <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={groupForm.name} onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>DESCRIPTION</label><textarea rows={3} value={groupForm.description} onChange={e => setGroupForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      </Drawer>

      <Drawer open={roleDrawer} onClose={() => setRoleDrawer(false)} title="Add Dynamic Role"
        footer={<><button onClick={() => setRoleDrawer(false)} style={outlineBtn}>Cancel</button><button onClick={() => createRole.mutate()} disabled={!roleForm.name || createRole.isPending} style={gradientBtn}>{createRole.isPending ? 'Saving...' : 'Create Role'}</button></>}>
        <div><label style={labelStyle}>ROLE NAME <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={roleForm.name} onChange={e => setRoleForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>DESCRIPTION</label><textarea rows={3} value={roleForm.description} onChange={e => setRoleForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
        <div><label style={labelStyle}>GROUP</label>
          <select value={roleForm.groupId} onChange={e => setRoleForm(f => ({ ...f, groupId: e.target.value }))} style={inputStyle}>
            <option value="">No group...</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select></div>
        <div><label style={labelStyle}>PERMISSIONS (comma-separated)</label><input type="text" value={roleForm.permissions} onChange={e => setRoleForm(f => ({ ...f, permissions: e.target.value }))} placeholder="READ_MEMBERS, MANAGE_COLLECTIONS, ..." style={inputStyle} /></div>
      </Drawer>

      <Drawer open={permDrawer} onClose={() => setPermDrawer(false)} title="Add Permission"
        footer={<><button onClick={() => setPermDrawer(false)} style={outlineBtn}>Cancel</button><button onClick={() => createPerm.mutate()} disabled={!permForm.name || !permForm.module || createPerm.isPending} style={gradientBtn}>{createPerm.isPending ? 'Saving...' : 'Create Permission'}</button></>}>
        <div><label style={labelStyle}>PERMISSION NAME <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={permForm.name} onChange={e => setPermForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. READ_MEMBERS" style={inputStyle} /></div>
        <div><label style={labelStyle}>MODULE <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={permForm.module} onChange={e => setPermForm(f => ({ ...f, module: e.target.value }))} placeholder="e.g. MEMBERS" style={inputStyle} /></div>
        <div><label style={labelStyle}>DESCRIPTION</label><input type="text" value={permForm.description} onChange={e => setPermForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} /></div>
      </Drawer>

      <Drawer open={chainDrawer} onClose={() => setChainDrawer(false)} title="New Approval Chain"
        footer={<><button onClick={() => setChainDrawer(false)} style={outlineBtn}>Cancel</button><button onClick={() => createChain.mutate()} disabled={!chainForm.name || createChain.isPending} style={gradientBtn}>{createChain.isPending ? 'Creating…' : 'Create Chain'}</button></>}>
        <div><label style={labelStyle}>CHAIN NAME <span style={{ color: '#f87171' }}>*</span></label><input value={chainForm.name} onChange={e => setChainForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="e.g. Expense Approval" /></div>
        <div><label style={labelStyle}>DESCRIPTION</label><textarea rows={3} value={chainForm.description} onChange={e => setChainForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>TRIGGER MODULE</label>
            <select value={chainForm.triggerModule} onChange={e => setChainForm(f => ({ ...f, triggerModule: e.target.value }))} style={inputStyle}>
              <option value="">— Any —</option>
              {['members','pastors','expenses','finance','events','fellowships','hr','facilities','lms','assets','templates','communications','collections'].map(m => <option key={m}>{m}</option>)}
            </select></div>
          <div><label style={labelStyle}>TRIGGER ACTION</label>
            <select value={chainForm.triggerAction} onChange={e => setChainForm(f => ({ ...f, triggerAction: e.target.value }))} style={inputStyle}>
              <option value="">— Any —</option>
              {['create','edit','delete','approve','export','send','publish'].map(a => <option key={a}>{a}</option>)}
            </select></div>
        </div>
        <div><label style={labelStyle}>CONDITION (optional)</label><input value={chainForm.triggerCondition} onChange={e => setChainForm(f => ({ ...f, triggerCondition: e.target.value }))} style={inputStyle} placeholder="e.g. amount > 50000" /></div>
      </Drawer>

      <Drawer open={!!stepFor} onClose={() => setStepFor(null)} title="Add Approval Step"
        footer={<><button onClick={() => setStepFor(null)} style={outlineBtn}>Cancel</button><button onClick={() => addStep.mutate()} disabled={addStep.isPending} style={gradientBtn}>{addStep.isPending ? 'Adding…' : 'Add Step'}</button></>}>
        <div><label style={labelStyle}>APPROVER TYPE</label>
          <select value={stepForm.approverType} onChange={e => setStepForm(f => ({ ...f, approverType: e.target.value }))} style={inputStyle}>
            {['STATIC_ROLE', 'USER', 'DYNAMIC_ROLE'].map(t => <option key={t}>{t}</option>)}
          </select></div>
        {stepForm.approverType === 'STATIC_ROLE' && (
          <div><label style={labelStyle}>ROLE</label>
            <select value={stepForm.staticRole} onChange={e => setStepForm(f => ({ ...f, staticRole: e.target.value }))} style={inputStyle}>
              {['ADMIN', 'PASTOR', 'MINISTER', 'MEMBER'].map(r => <option key={r}>{r}</option>)}
            </select></div>
        )}
        <div><label style={labelStyle}>TIMEOUT (hours, optional)</label><input type="number" value={stepForm.timeoutHours} onChange={e => setStepForm(f => ({ ...f, timeoutHours: e.target.value }))} style={inputStyle} placeholder="Leave blank for no timeout" /></div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="roleStepRequired" checked={stepForm.required} onChange={e => setStepForm(f => ({ ...f, required: e.target.checked }))} />
          <label htmlFor="roleStepRequired" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>Required (must be approved to proceed)</label>
        </div>
      </Drawer>

      <Drawer open={guardDrawer} onClose={() => setGuardDrawer(false)} title="Add Endpoint Guard"
        footer={<><button onClick={() => setGuardDrawer(false)} style={outlineBtn}>Cancel</button><button onClick={() => createGuard.mutate()} disabled={!guardForm.pathPattern || createGuard.isPending} style={gradientBtn}>{createGuard.isPending ? 'Saving...' : 'Create Guard'}</button></>}>
        <div><label style={labelStyle}>HTTP METHOD</label>
          <select value={guardForm.method} onChange={e => setGuardForm(f => ({ ...f, method: e.target.value }))} style={inputStyle}>
            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => <option key={m}>{m}</option>)}
          </select></div>
        <div><label style={labelStyle}>PATH PATTERN <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={guardForm.pathPattern} onChange={e => setGuardForm(f => ({ ...f, pathPattern: e.target.value }))} placeholder="/api/members/**" style={{ ...inputStyle, fontFamily: 'monospace' }} /></div>
        <div><label style={labelStyle}>PERMISSION GATE</label><input type="text" value={guardForm.permissionGate} onChange={e => setGuardForm(f => ({ ...f, permissionGate: e.target.value }))} placeholder="READ_MEMBERS" style={inputStyle} /></div>
        <div><label style={labelStyle}>ROLE GATE</label><input type="text" value={guardForm.roleGate} onChange={e => setGuardForm(f => ({ ...f, roleGate: e.target.value }))} placeholder="ADMIN,PASTOR" style={inputStyle} /></div>
      </Drawer>
    </div>
  )
}
