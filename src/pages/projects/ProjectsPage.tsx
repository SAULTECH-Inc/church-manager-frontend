import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, X, ChevronDown, ChevronUp, Trash2, CheckCircle, Circle, DollarSign } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { RichTextDisplay } from '@/components/editor/RichTextDisplay'

interface Project {
  id: string; name: string; projectType: string; description?: string; location?: string
  startDate?: string; endDate?: string; status: string; budget?: number; spent?: number
  projectManager?: string; contractorName?: string; contractorContact?: string; notes?: string
  milestones?: Milestone[]; donations?: Donation[]
}
interface Milestone { id: string; title: string; description?: string; dueDate?: string; completed: boolean; completedDate?: string }
interface Donation  { id: string; donorName?: string; amount: number; donationDate: string; notes?: string }
interface Stats     { total: number; active: number; completed: number; totalBudget: number; totalSpent: number }

const PAGE_BG = 'var(--page-bg)'
const CARD    = 'var(--card-bg)'
const DRAWER_BG = 'var(--drawer-bg)'
const INPUT_BG  = 'var(--input-bg)'
const ACCENT    = '#7c6bff'

const inputStyle: React.CSSProperties = { backgroundColor: INPUT_BG, border: '1px solid rgb(var(--inv) / 0.10)', color: 'var(--text-primary)', borderRadius: 12, width: '100%', padding: '10px 14px', fontSize: 14, outline: 'none' }
const labelStyle: React.CSSProperties = { display: 'block', color: 'rgb(var(--inv) / 0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }
const gradientBtn: React.CSSProperties = { background: 'linear-gradient(135deg,var(--accent),var(--accent-dark))', color: 'var(--text-primary)', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }
const outlineBtn: React.CSSProperties  = { border: '1px solid rgb(var(--inv) / 0.15)', backgroundColor: 'transparent', color: 'var(--text-primary)', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }

const STATUS_COLORS: Record<string, string> = {
  PLANNING: '#f59e0b', ACTIVE: '#10b981', ON_HOLD: '#6b7280', COMPLETED: '#7c6bff', CANCELLED: '#ef4444'
}
const TYPE_COLORS: Record<string, string> = {
  BUILDING: '#60a5fa', MISSION: '#f59e0b', CHARITY: '#10b981', OUTREACH: '#a78bfa', INFRASTRUCTURE: '#fb923c', OTHER: '#94a3b8'
}

function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode }) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: 20, pointerEvents: 'none' }}>
        <div className="flex flex-col overflow-hidden" style={{ backgroundColor: DRAWER_BG, borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', border: '1px solid rgb(var(--inv) / 0.1)', pointerEvents: 'auto' }}>
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

const EMPTY_FORM = { name: '', projectType: 'OTHER', description: '', location: '', startDate: '', endDate: '', status: 'PLANNING', budget: '', projectManager: '', contractorName: '', contractorContact: '', notes: '' }

export function ProjectsPage() {
  const [createOpen, setCreateOpen]   = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [expanded, setExpanded]       = useState<string | null>(null)
  const [donateId, setDonateId]       = useState<string | null>(null)
  const [milestoneId, setMilestoneId] = useState<string | null>(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [donateForm, setDonateForm]   = useState({ donorName: '', amount: '', donationDate: '', notes: '' })
  const [msForm, setMsForm]           = useState({ title: '', description: '', dueDate: '' })
  const [filter, setFilter]           = useState('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/api/projects').then(r => r.data as { projects: Project[]; stats: Stats }),
  })

  const createMut = useMutation({
    mutationFn: () => api.post('/api/projects/create', null, { params: { ...form, budget: form.budget || undefined } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); setCreateOpen(false); setForm(EMPTY_FORM) },
  })
  const editMut = useMutation({
    mutationFn: () => api.post(`/api/projects/${editProject!.id}/edit`, null, { params: { ...form, budget: form.budget || undefined } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); setEditProject(null) },
  })
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/projects/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
  const toggleMs = useMutation({
    mutationFn: (id: string) => api.post(`/api/projects/milestones/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
  const deleteMs = useMutation({
    mutationFn: (id: string) => api.post(`/api/projects/milestones/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['projects'] }),
  })
  const addMs = useMutation({
    mutationFn: () => api.post(`/api/projects/${milestoneId}/milestones/add`, null, { params: msForm }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); setMilestoneId(null); setMsForm({ title: '', description: '', dueDate: '' }) },
  })
  const addDonate = useMutation({
    mutationFn: () => api.post(`/api/projects/${donateId}/donations/add`, null, { params: { ...donateForm, amount: parseFloat(donateForm.amount) } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['projects'] }); setDonateId(null); setDonateForm({ donorName: '', amount: '', donationDate: '', notes: '' }) },
  })

  const projects = data?.projects ?? []
  const stats    = data?.stats
  const filtered = filter === 'ALL' ? projects : projects.filter(p => p.status === filter)

  const openEdit = (p: Project) => {
    setForm({ name: p.name, projectType: p.projectType, description: p.description ?? '', location: p.location ?? '', startDate: p.startDate ?? '', endDate: p.endDate ?? '', status: p.status, budget: p.budget?.toString() ?? '', projectManager: p.projectManager ?? '', contractorName: p.contractorName ?? '', contractorContact: p.contractorContact ?? '', notes: p.notes ?? '' })
    setEditProject(p)
  }

  const fmt = (n?: number) => n != null ? `₦${n.toLocaleString()}` : '—'

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: PAGE_BG }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 26, margin: 0 }}>Project Management</h1>
          <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 14, marginTop: 4 }}>Building · Mission · Charity · Outreach</p>
        </div>
        <button onClick={() => setCreateOpen(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> New Project</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Projects', value: stats?.total ?? 0, color: 'var(--accent)' },
          { label: 'Active',         value: stats?.active ?? 0, color: '#10b981' },
          { label: 'Completed',      value: stats?.completed ?? 0, color: '#60a5fa' },
          { label: 'Total Budget',   value: fmt(stats?.totalBudget), color: '#f59e0b' },
          { label: 'Total Spent',    value: fmt(stats?.totalSpent), color: '#ef4444' },
        ].map(k => (
          <div key={k.label} style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 20 }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 22, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 13, margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' as const }}>
        {['ALL', 'PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            border: `1px solid ${filter === s ? ACCENT : 'rgb(var(--inv) / 0.1)'}`,
            backgroundColor: filter === s ? 'rgba(124,107,255,0.15)' : 'rgb(var(--inv) / 0.04)',
            color: filter === s ? ACCENT : 'rgb(var(--inv) / 0.5)',
          }}>{s.replace('_', ' ')}</button>
        ))}
      </div>

      {isLoading && <div style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgb(var(--inv) / 0.4)' }}>Loading...</p></div>}

      {/* Project list */}
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16 }}>
        {filtered.length === 0 && !isLoading && (
          <div style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 40, textAlign: 'center' }}>
            <p style={{ color: 'rgb(var(--inv) / 0.4)' }}>No projects yet. Create your first project.</p>
          </div>
        )}
        {filtered.map(p => {
          const isOpen = expanded === p.id
          const milestones = p.milestones ?? []
          const donations  = p.donations  ?? []
          const done = milestones.filter(m => m.completed).length
          return (
            <div key={p.id} style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', overflow: 'hidden' }}>
              {/* Project header */}
              <div style={{ padding: '18px 24px' }}>
                <div className="flex items-start justify-between gap-4">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span style={{ backgroundColor: `${TYPE_COLORS[p.projectType] ?? '#94a3b8'}20`, color: TYPE_COLORS[p.projectType] ?? '#94a3b8', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{p.projectType}</span>
                      <span style={{ backgroundColor: `${STATUS_COLORS[p.status] ?? '#94a3b8'}20`, color: STATUS_COLORS[p.status] ?? '#94a3b8', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{p.status.replace('_', ' ')}</span>
                    </div>
                    <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16, margin: '4px 0' }}>{p.name}</h3>
                    {p.description && <RichTextDisplay html={p.description} clamp={2} style={{ margin: '4px 0 0' }} />}
                    <div className="flex flex-wrap gap-4 mt-2">
                      {p.location      && <span style={{ color: 'rgb(var(--inv) / 0.45)', fontSize: 12 }}>📍 {p.location}</span>}
                      {p.projectManager && <span style={{ color: 'rgb(var(--inv) / 0.45)', fontSize: 12 }}>👤 {p.projectManager}</span>}
                      {p.startDate     && <span style={{ color: 'rgb(var(--inv) / 0.45)', fontSize: 12 }}>📅 {p.startDate}{p.endDate ? ` → ${p.endDate}` : ''}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex gap-2">
                      {p.budget != null && <span style={{ color: '#f59e0b', fontSize: 13, fontWeight: 700 }}>Budget: {fmt(p.budget)}</span>}
                      {p.spent  != null && p.spent > 0 && <span style={{ color: '#ef4444', fontSize: 13, fontWeight: 700 }}>Spent: {fmt(p.spent)}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} style={{ ...outlineBtn, padding: '6px 14px', fontSize: 12 }}>Edit</button>
                      <button onClick={() => setExpanded(isOpen ? null : p.id)} style={{ ...outlineBtn, padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />} Details
                      </button>
                      <button onClick={() => { if (confirm('Delete this project?')) deleteMut.mutate(p.id) }}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 10, padding: '6px 10px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>

                {/* Milestone progress bar */}
                {milestones.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'rgb(var(--inv) / 0.45)' }}>
                      <span>Milestones: {done}/{milestones.length}</span>
                      <span>{Math.round((done / milestones.length) * 100)}%</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 4, backgroundColor: 'rgb(var(--inv) / 0.08)' }}>
                      <div style={{ height: '100%', borderRadius: 4, backgroundColor: ACCENT, width: `${(done / milestones.length) * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded details */}
              {isOpen && (
                <div style={{ borderTop: '1px solid rgb(var(--inv) / 0.06)', padding: '18px 24px' }}>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Milestones */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13, margin: 0 }}>Milestones</h4>
                        <button onClick={() => setMilestoneId(p.id)} style={{ ...gradientBtn, padding: '4px 10px', fontSize: 11 }}><Plus size={11} style={{ display: 'inline' }} /> Add</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                        {milestones.length === 0 && <p style={{ color: 'rgb(var(--inv) / 0.3)', fontSize: 12 }}>No milestones yet.</p>}
                        {milestones.map(m => (
                          <div key={m.id} className="flex items-start gap-2">
                            <button onClick={() => toggleMs.mutate(m.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 1, flexShrink: 0 }}>
                              {m.completed ? <CheckCircle size={16} color="#10b981" /> : <Circle size={16} color="rgb(var(--inv) / 0.3)" />}
                            </button>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ color: m.completed ? 'rgb(var(--inv) / 0.4)' : 'white', fontSize: 13, margin: 0, textDecoration: m.completed ? 'line-through' : 'none' }}>{m.title}</p>
                              {m.dueDate && <p style={{ color: 'rgb(var(--inv) / 0.35)', fontSize: 11, margin: '2px 0 0' }}>Due: {m.dueDate}</p>}
                            </div>
                            <button onClick={() => deleteMs.mutate(m.id)} style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.6)', cursor: 'pointer', padding: 0 }}><Trash2 size={12} /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Donations */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 13, margin: 0 }}>Donations</h4>
                        <button onClick={() => setDonateId(p.id)} style={{ ...gradientBtn, padding: '4px 10px', fontSize: 11 }}><DollarSign size={11} style={{ display: 'inline' }} /> Record</button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                        {donations.length === 0 && <p style={{ color: 'rgb(var(--inv) / 0.3)', fontSize: 12 }}>No donations recorded.</p>}
                        {donations.map(d => (
                          <div key={d.id} className="flex items-center justify-between">
                            <div>
                              <p style={{ color: 'var(--text-primary)', fontSize: 13, margin: 0 }}>{d.donorName ?? 'Anonymous'}</p>
                              <p style={{ color: 'rgb(var(--inv) / 0.35)', fontSize: 11, margin: 0 }}>{d.donationDate}</p>
                            </div>
                            <span style={{ color: '#10b981', fontWeight: 700, fontSize: 13 }}>₦{d.amount.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Contractor info */}
                  {(p.contractorName || p.contractorContact) && (
                    <div style={{ marginTop: 16, padding: '12px 16px', backgroundColor: 'rgb(var(--inv) / 0.03)', borderRadius: 12, border: '1px solid rgb(var(--inv) / 0.06)' }}>
                      <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Contractor</p>
                      <p style={{ color: 'var(--text-primary)', fontSize: 13, margin: 0 }}>{p.contractorName}</p>
                      {p.contractorContact && <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 12, margin: '2px 0 0' }}>{p.contractorContact}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Create Project Drawer */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="New Project"
        footer={<><button onClick={() => setCreateOpen(false)} style={outlineBtn}>Cancel</button><button onClick={() => createMut.mutate()} disabled={!form.name || createMut.isPending} style={gradientBtn}>{createMut.isPending ? 'Creating…' : 'Create Project'}</button></>}>
        <ProjectForm form={form} setForm={setForm} />
      </Drawer>

      {/* Edit Project Drawer */}
      <Drawer open={!!editProject} onClose={() => setEditProject(null)} title="Edit Project"
        footer={<><button onClick={() => setEditProject(null)} style={outlineBtn}>Cancel</button><button onClick={() => editMut.mutate()} disabled={editMut.isPending} style={gradientBtn}>{editMut.isPending ? 'Saving…' : 'Save Changes'}</button></>}>
        <ProjectForm form={form} setForm={setForm} />
      </Drawer>

      {/* Add Milestone Drawer */}
      <Drawer open={!!milestoneId} onClose={() => setMilestoneId(null)} title="Add Milestone"
        footer={<><button onClick={() => setMilestoneId(null)} style={outlineBtn}>Cancel</button><button onClick={() => addMs.mutate()} disabled={!msForm.title || addMs.isPending} style={gradientBtn}>{addMs.isPending ? 'Adding…' : 'Add Milestone'}</button></>}>
        <div><label style={labelStyle}>TITLE *</label><input value={msForm.title} onChange={e => setMsForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>DESCRIPTION</label><textarea rows={3} value={msForm.description} onChange={e => setMsForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
        <div><label style={labelStyle}>DUE DATE</label><input type="date" value={msForm.dueDate} onChange={e => setMsForm(f => ({ ...f, dueDate: e.target.value }))} style={inputStyle} /></div>
      </Drawer>

      {/* Record Donation Drawer */}
      <Drawer open={!!donateId} onClose={() => setDonateId(null)} title="Record Donation"
        footer={<><button onClick={() => setDonateId(null)} style={outlineBtn}>Cancel</button><button onClick={() => addDonate.mutate()} disabled={!donateForm.amount || addDonate.isPending} style={gradientBtn}>{addDonate.isPending ? 'Recording…' : 'Record Donation'}</button></>}>
        <div><label style={labelStyle}>DONOR NAME</label><input value={donateForm.donorName} onChange={e => setDonateForm(f => ({ ...f, donorName: e.target.value }))} style={inputStyle} placeholder="Anonymous" /></div>
        <div><label style={labelStyle}>AMOUNT (₦) *</label><input type="number" value={donateForm.amount} onChange={e => setDonateForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>DATE</label><input type="date" value={donateForm.donationDate} onChange={e => setDonateForm(f => ({ ...f, donationDate: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>NOTES</label><textarea rows={2} value={donateForm.notes} onChange={e => setDonateForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      </Drawer>
    </div>
  )
}

function ProjectForm({ form, setForm }: { form: typeof EMPTY_FORM; setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_FORM>> }) {
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))
  return (
    <>
      <div><label style={labelStyle}>PROJECT NAME *</label><input value={form.name} onChange={e => set('name', e.target.value)} style={inputStyle} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={labelStyle}>TYPE</label>
          <select value={form.projectType} onChange={e => set('projectType', e.target.value)} style={inputStyle}>
            {['BUILDING','MISSION','CHARITY','OUTREACH','INFRASTRUCTURE','OTHER'].map(t => <option key={t}>{t}</option>)}
          </select></div>
        <div><label style={labelStyle}>STATUS</label>
          <select value={form.status} onChange={e => set('status', e.target.value)} style={inputStyle}>
            {['PLANNING','ACTIVE','ON_HOLD','COMPLETED','CANCELLED'].map(s => <option key={s}>{s}</option>)}
          </select></div>
      </div>
      <div><label style={labelStyle}>DESCRIPTION</label><RichTextEditor value={form.description ?? ''} onChange={v => set('description', v)} placeholder="Project description, objectives..." minHeight={100} /></div>
      <div><label style={labelStyle}>LOCATION</label><input value={form.location} onChange={e => set('location', e.target.value)} style={inputStyle} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={labelStyle}>START DATE</label><input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} style={inputStyle} /></div>
        <div><label style={labelStyle}>END DATE</label><input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)} style={inputStyle} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={labelStyle}>BUDGET (₦)</label><input type="number" value={form.budget} onChange={e => set('budget', e.target.value)} style={inputStyle} /></div>
        <div><label style={labelStyle}>PROJECT MANAGER</label><input value={form.projectManager} onChange={e => set('projectManager', e.target.value)} style={inputStyle} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={labelStyle}>CONTRACTOR NAME</label><input value={form.contractorName} onChange={e => set('contractorName', e.target.value)} style={inputStyle} /></div>
        <div><label style={labelStyle}>CONTRACTOR CONTACT</label><input value={form.contractorContact} onChange={e => set('contractorContact', e.target.value)} style={inputStyle} /></div>
      </div>
      <div><label style={labelStyle}>NOTES</label><RichTextEditor value={form.notes ?? ''} onChange={v => set('notes', v)} placeholder="Additional notes..." minHeight={80} /></div>
    </>
  )
}
