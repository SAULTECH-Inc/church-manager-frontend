import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, X, Trash2, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Pencil } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'

interface WorkflowForm { id: string; title: string; description?: string; category: string; status: string; isPublic: boolean; submissionCount: number; fields?: FormField[] }
interface FormField    { id: string; fieldLabel: string; fieldType: string; fieldKey: string; placeholder?: string; isRequired: boolean; fieldOrder: number }
interface ApprovalChain { id: string; name: string; description?: string; triggerModule?: string; triggerAction?: string; isActive: boolean; steps?: ApprovalStep[] }
interface ApprovalStep  { id: string; stepOrder: number; approverType: string; staticRole?: string; isRequired: boolean; timeoutHours?: number }
interface Stats { totalForms: number; activeForms: number; draftForms: number }

const PAGE_BG   = '#131326'
const CARD      = '#13152e'
const DRAWER_BG = '#1a1b3a'
const INPUT_BG  = '#1e2248'
const ACCENT    = '#7c6bff'

const inputStyle: React.CSSProperties = { backgroundColor: INPUT_BG, border: '1px solid rgba(255,255,255,0.10)', color: 'white', borderRadius: 12, width: '100%', padding: '10px 14px', fontSize: 14, outline: 'none' }
const labelStyle: React.CSSProperties = { display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }
const gradientBtn: React.CSSProperties = { background: 'linear-gradient(135deg,#7c6bff,#6456e8)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }
const outlineBtn: React.CSSProperties  = { border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', color: 'white', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }

const FORM_STATUS_COLORS: Record<string, string> = { DRAFT: '#f59e0b', ACTIVE: '#10b981', ARCHIVED: '#6b7280' }
const CAT_COLORS: Record<string, string> = { MEMBERSHIP: '#7c6bff', EVENT: '#60a5fa', WELFARE: '#10b981', SURVEY: '#f59e0b', FEEDBACK: '#a78bfa', OTHER: '#94a3b8' }
const FIELD_TYPES = ['TEXT', 'EMAIL', 'NUMBER', 'PHONE', 'DATE', 'DROPDOWN', 'CHECKBOX', 'TEXTAREA', 'FILE']
const CATEGORIES  = ['MEMBERSHIP', 'EVENT', 'WELFARE', 'SURVEY', 'FEEDBACK', 'OTHER']
const MODULES     = ['members', 'pastors', 'expenses', 'finance', 'events', 'fellowships', 'hr', 'facilities', 'lms', 'assets', 'templates', 'communications', 'collections']
const ACTIONS     = ['create', 'edit', 'delete', 'approve', 'export', 'send', 'publish']

function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode }) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: 20, pointerEvents: 'none' }}>
        <div className="flex flex-col overflow-hidden" style={{ backgroundColor: DRAWER_BG, borderRadius: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'auto' }}>
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

const EMPTY_FORM_FORM = { title: '', description: '', category: 'OTHER', isPublic: false }
const EMPTY_FIELD = { fieldLabel: '', fieldType: 'TEXT', fieldKey: '', placeholder: '', isRequired: false, fieldOrder: 0 }
const EMPTY_CHAIN = { name: '', description: '', triggerModule: '', triggerAction: '', triggerCondition: '' }
const EMPTY_STEP  = { approverType: 'STATIC_ROLE', staticRole: 'ADMIN', timeoutHours: '', required: true }

export function WorkflowsPage() {
  const [tab, setTab]                 = useState<'forms' | 'chains'>('forms')
  const [createForm, setCreateForm]   = useState(false)
  const [createChain, setCreateChain] = useState(false)
  const [expandedForm,  setExpandedForm]  = useState<string | null>(null)
  const [expandedChain, setExpandedChain] = useState<string | null>(null)
  const [addFieldFor,   setAddFieldFor]   = useState<string | null>(null)
  const [addStepFor,    setAddStepFor]    = useState<string | null>(null)

  const [editFormItem, setEditFormItem] = useState<WorkflowForm | null>(null)
  const [editFormData, setEditFormData] = useState({ title: '', description: '', category: 'OTHER', isPublic: false })
  const [formForm, setFormForm]   = useState(EMPTY_FORM_FORM)
  const [fieldForm, setFieldForm] = useState(EMPTY_FIELD)
  const [chainForm, setChainForm] = useState(EMPTY_CHAIN)
  const [stepForm,  setStepForm]  = useState(EMPTY_STEP)

  const { data, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => api.get('/api/workflows').then(r => r.data as { forms: WorkflowForm[]; approvalChains: ApprovalChain[]; stats: Stats }),
  })

  const createFormMut = useMutation({
    mutationFn: () => api.post('/api/workflows/forms/create', null, { params: formForm }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); setCreateForm(false); setFormForm(EMPTY_FORM_FORM) },
  })
  const editFormMut = useMutation({
    mutationFn: () => api.post(`/api/workflows/forms/${editFormItem!.id}/edit`, null, { params: editFormData }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); setEditFormItem(null) },
  })
  const deleteFormMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/workflows/forms/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  })
  const statusFormMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.post(`/api/workflows/forms/${id}/status`, null, { params: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  })
  const addFieldMut = useMutation({
    mutationFn: () => api.post(`/api/workflows/forms/${addFieldFor}/fields/add`, null, { params: fieldForm }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); setAddFieldFor(null); setFieldForm(EMPTY_FIELD) },
  })
  const deleteFieldMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/workflows/fields/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  })
  const createChainMut = useMutation({
    mutationFn: () => api.post('/api/workflows/chains/create', null, { params: chainForm }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); setCreateChain(false); setChainForm(EMPTY_CHAIN) },
  })
  const deleteChainMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/workflows/chains/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  })
  const toggleChainMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/workflows/chains/${id}/toggle`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  })
  const addStepMut = useMutation({
    mutationFn: () => api.post(`/api/workflows/chains/${addStepFor}/steps/add`, null, { params: { ...stepForm, timeoutHours: stepForm.timeoutHours || undefined } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); setAddStepFor(null); setStepForm(EMPTY_STEP) },
  })
  const deleteStepMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/workflows/steps/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
  })

  const forms  = data?.forms          ?? []
  const chains = data?.approvalChains ?? []
  const stats  = data?.stats

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: PAGE_BG }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>Workflows & Forms</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Approval Chains · Dynamic Form Builder · Process Automation</p>
        </div>
        <button onClick={() => tab === 'forms' ? setCreateForm(true) : setCreateChain(true)}
          style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> {tab === 'forms' ? 'New Form' : 'New Chain'}
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Forms',       value: stats?.totalForms  ?? 0, color: '#7c6bff' },
          { label: 'Active Forms',      value: stats?.activeForms ?? 0, color: '#10b981' },
          { label: 'Draft Forms',       value: stats?.draftForms  ?? 0, color: '#f59e0b' },
          { label: 'Approval Chains',   value: chains.length,           color: '#60a5fa' },
        ].map(k => (
          <div key={k.label} style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 22, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {(['forms', 'chains'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            color: tab === t ? ACCENT : 'rgba(255,255,255,0.4)',
            borderBottom: `2px solid ${tab === t ? ACCENT : 'transparent'}`,
          }}>{t === 'forms' ? 'Form Builder' : 'Approval Chains'}</button>
        ))}
      </div>

      {isLoading && <div style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>}

      {/* Forms tab */}
      {!isLoading && tab === 'forms' && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {forms.length === 0 && (
            <div style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>No forms yet. Create your first dynamic form.</p>
            </div>
          )}
          {forms.map(f => {
            const isOpen = expandedForm === f.id
            const fields = f.fields ?? []
            return (
              <div key={f.id} style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                {/* Form header */}
                <div style={{ padding: '16px 22px' }}>
                  <div className="flex items-center justify-between gap-4">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span style={{ backgroundColor: `${CAT_COLORS[f.category] ?? '#94a3b8'}20`, color: CAT_COLORS[f.category] ?? '#94a3b8', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{f.category}</span>
                        <span style={{ backgroundColor: `${FORM_STATUS_COLORS[f.status] ?? '#94a3b8'}20`, color: FORM_STATUS_COLORS[f.status] ?? '#94a3b8', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{f.status}</span>
                        {f.isPublic && <span style={{ backgroundColor: 'rgba(96,165,250,0.15)', color: '#60a5fa', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>PUBLIC</span>}
                      </div>
                      <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: '4px 0' }}>{f.title}</p>
                      {f.description && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: 0 }}>{f.description}</p>}
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 4 }}>{fields.length} field{fields.length !== 1 ? 's' : ''} · {f.submissionCount} submission{f.submissionCount !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {f.status === 'DRAFT'  && <button onClick={() => statusFormMut.mutate({ id: f.id, status: 'ACTIVE' })}   style={{ ...gradientBtn, padding: '5px 12px', fontSize: 12 }}>Publish</button>}
                      {f.status === 'ACTIVE' && <button onClick={() => statusFormMut.mutate({ id: f.id, status: 'ARCHIVED' })} style={{ ...outlineBtn, padding: '5px 12px', fontSize: 12 }}>Archive</button>}
                      <button onClick={() => setExpandedForm(isOpen ? null : f.id)} style={{ ...outlineBtn, padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button onClick={() => { setEditFormItem(f); setEditFormData({ title: f.title, description: f.description ?? '', category: f.category, isPublic: f.isPublic }) }}
                        style={{ background: 'rgba(124,107,255,0.1)', border: 'none', color: '#a78bfa', borderRadius: 10, padding: '5px 9px', cursor: 'pointer' }}><Pencil size={13} /></button>
                      <button onClick={() => { if (confirm('Delete form?')) deleteFormMut.mutate(f.id) }}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 10, padding: '5px 9px', cursor: 'pointer' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>

                {/* Fields */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 22px' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0 }}>Form Fields</h4>
                      <button onClick={() => setAddFieldFor(f.id)} style={{ ...gradientBtn, padding: '5px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={12} /> Add Field</button>
                    </div>
                    {fields.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No fields yet. Add your first field.</p>}
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                      {fields.map((ff, i) => (
                        <div key={ff.id} className="flex items-center justify-between" style={{ padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex items-center gap-3">
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700, minWidth: 20 }}>{i + 1}</span>
                            <div>
                              <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{ff.fieldLabel}</span>
                              {ff.isRequired && <span style={{ color: '#f87171', marginLeft: 4, fontSize: 11 }}>*</span>}
                            </div>
                            <span style={{ backgroundColor: 'rgba(124,107,255,0.15)', color: '#a78bfa', borderRadius: 6, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>{ff.fieldType}</span>
                          </div>
                          <button onClick={() => deleteFieldMut.mutate(ff.id)} style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)', cursor: 'pointer', padding: 0 }}><Trash2 size={13} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Approval Chains tab */}
      {!isLoading && tab === 'chains' && (
        <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
          {chains.length === 0 && (
            <div style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>No approval chains yet. Create one to automate multi-step approvals.</p>
            </div>
          )}
          {chains.map(c => {
            const isOpen = expandedChain === c.id
            const steps  = c.steps ?? []
            return (
              <div key={c.id} style={{ backgroundColor: CARD, borderRadius: 20, border: `1px solid ${c.isActive ? 'rgba(124,107,255,0.2)' : 'rgba(255,255,255,0.08)'}`, overflow: 'hidden' }}>
                <div style={{ padding: '16px 22px' }}>
                  <div className="flex items-center justify-between gap-4">
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c.isActive ? '#10b981' : '#6b7280', display: 'inline-block' }} />
                        <p style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: 0 }}>{c.name}</p>
                      </div>
                      {c.description && <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '2px 0' }}>{c.description}</p>}
                      <div className="flex gap-3 mt-1">
                        {c.triggerModule && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Module: <span style={{ color: '#a78bfa' }}>{c.triggerModule}</span></span>}
                        {c.triggerAction && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>Action: <span style={{ color: '#60a5fa' }}>{c.triggerAction}</span></span>}
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 4 }}>{steps.length} step{steps.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => toggleChainMut.mutate(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        {c.isActive ? <ToggleRight size={28} color={ACCENT} /> : <ToggleLeft size={28} color="rgba(255,255,255,0.3)" />}
                      </button>
                      <button onClick={() => setExpandedChain(isOpen ? null : c.id)} style={{ ...outlineBtn, padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button onClick={() => { if (confirm('Delete chain?')) deleteChainMut.mutate(c.id) }}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 10, padding: '5px 9px', cursor: 'pointer' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>

                {/* Steps */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '16px 22px' }}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: 0 }}>Approval Steps</h4>
                      <button onClick={() => setAddStepFor(c.id)} style={{ ...gradientBtn, padding: '5px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={12} /> Add Step</button>
                    </div>
                    {steps.length === 0 && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>No steps defined. Add the first approver.</p>}
                    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                      {steps.map(s => (
                        <div key={s.id} className="flex items-center justify-between" style={{ padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex items-center gap-3">
                            <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: 'rgba(124,107,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ACCENT, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{s.stepOrder}</div>
                            <div>
                              <p style={{ color: 'white', fontSize: 13, fontWeight: 600, margin: 0 }}>{s.staticRole ?? s.approverType}</p>
                              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: 0 }}>
                                {s.approverType} · {s.isRequired ? 'Required' : 'Optional'}{s.timeoutHours ? ` · ${s.timeoutHours}h timeout` : ''}
                              </p>
                            </div>
                          </div>
                          <button onClick={() => deleteStepMut.mutate(s.id)} style={{ background: 'none', border: 'none', color: 'rgba(239,68,68,0.5)', cursor: 'pointer', padding: 0 }}><Trash2 size={13} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Form Drawer */}
      <Drawer open={!!editFormItem} onClose={() => setEditFormItem(null)} title="Edit Form"
        footer={<><button onClick={() => setEditFormItem(null)} style={outlineBtn}>Cancel</button><button onClick={() => editFormMut.mutate()} disabled={!editFormData.title || editFormMut.isPending} style={gradientBtn}>{editFormMut.isPending ? 'Saving…' : 'Save Changes'}</button></>}>
        <div><label style={labelStyle}>FORM TITLE *</label><input value={editFormData.title} onChange={e => setEditFormData(f => ({ ...f, title: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>DESCRIPTION</label><textarea rows={3} value={editFormData.description} onChange={e => setEditFormData(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
        <div><label style={labelStyle}>CATEGORY</label>
          <select value={editFormData.category} onChange={e => setEditFormData(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select></div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="editIsPublic" checked={editFormData.isPublic} onChange={e => setEditFormData(f => ({ ...f, isPublic: e.target.checked }))} />
          <label htmlFor="editIsPublic" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>Make this form publicly accessible</label>
        </div>
      </Drawer>

      {/* Create Form Drawer */}
      <Drawer open={createForm} onClose={() => setCreateForm(false)} title="Create Form"
        footer={<><button onClick={() => setCreateForm(false)} style={outlineBtn}>Cancel</button><button onClick={() => createFormMut.mutate()} disabled={!formForm.title || createFormMut.isPending} style={gradientBtn}>{createFormMut.isPending ? 'Creating…' : 'Create Form'}</button></>}>
        <div><label style={labelStyle}>FORM TITLE *</label><input value={formForm.title} onChange={e => setFormForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} placeholder="e.g. New Member Registration" /></div>
        <div><label style={labelStyle}>DESCRIPTION</label><textarea rows={3} value={formForm.description} onChange={e => setFormForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
        <div><label style={labelStyle}>CATEGORY</label>
          <select value={formForm.category} onChange={e => setFormForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select></div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="isPublic" checked={formForm.isPublic} onChange={e => setFormForm(f => ({ ...f, isPublic: e.target.checked }))} />
          <label htmlFor="isPublic" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>Make this form publicly accessible</label>
        </div>
      </Drawer>

      {/* Add Field Drawer */}
      <Drawer open={!!addFieldFor} onClose={() => setAddFieldFor(null)} title="Add Form Field"
        footer={<><button onClick={() => setAddFieldFor(null)} style={outlineBtn}>Cancel</button><button onClick={() => addFieldMut.mutate()} disabled={!fieldForm.fieldLabel || addFieldMut.isPending} style={gradientBtn}>{addFieldMut.isPending ? 'Adding…' : 'Add Field'}</button></>}>
        <div><label style={labelStyle}>FIELD LABEL *</label><input value={fieldForm.fieldLabel} onChange={e => setFieldForm(f => ({ ...f, fieldLabel: e.target.value }))} style={inputStyle} placeholder="e.g. Full Name" /></div>
        <div><label style={labelStyle}>FIELD TYPE</label>
          <select value={fieldForm.fieldType} onChange={e => setFieldForm(f => ({ ...f, fieldType: e.target.value }))} style={inputStyle}>
            {FIELD_TYPES.map(t => <option key={t}>{t}</option>)}
          </select></div>
        <div><label style={labelStyle}>FIELD KEY</label><input value={fieldForm.fieldKey} onChange={e => setFieldForm(f => ({ ...f, fieldKey: e.target.value }))} style={inputStyle} placeholder="auto-generated if blank" /></div>
        <div><label style={labelStyle}>PLACEHOLDER</label><input value={fieldForm.placeholder} onChange={e => setFieldForm(f => ({ ...f, placeholder: e.target.value }))} style={inputStyle} /></div>
        {(fieldForm.fieldType === 'DROPDOWN') && (
          <div><label style={labelStyle}>OPTIONS (comma-separated)</label><input value={fieldForm.fieldOrder.toString()} onChange={e => setFieldForm(f => ({ ...f, fieldOrder: parseInt(e.target.value) || 0 }))} style={inputStyle} placeholder="Option 1, Option 2, Option 3" /></div>
        )}
        <div className="flex items-center gap-3">
          <input type="checkbox" id="isRequired" checked={fieldForm.isRequired} onChange={e => setFieldForm(f => ({ ...f, isRequired: e.target.checked }))} />
          <label htmlFor="isRequired" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>Required field</label>
        </div>
        <div><label style={labelStyle}>FIELD ORDER</label><input type="number" value={fieldForm.fieldOrder} onChange={e => setFieldForm(f => ({ ...f, fieldOrder: parseInt(e.target.value) || 0 }))} style={inputStyle} /></div>
      </Drawer>

      {/* Create Chain Drawer */}
      <Drawer open={createChain} onClose={() => setCreateChain(false)} title="New Approval Chain"
        footer={<><button onClick={() => setCreateChain(false)} style={outlineBtn}>Cancel</button><button onClick={() => createChainMut.mutate()} disabled={!chainForm.name || createChainMut.isPending} style={gradientBtn}>{createChainMut.isPending ? 'Creating…' : 'Create Chain'}</button></>}>
        <div><label style={labelStyle}>CHAIN NAME *</label><input value={chainForm.name} onChange={e => setChainForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="e.g. Expense Approval" /></div>
        <div><label style={labelStyle}>DESCRIPTION</label><textarea rows={3} value={chainForm.description} onChange={e => setChainForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>TRIGGER MODULE</label>
            <select value={chainForm.triggerModule} onChange={e => setChainForm(f => ({ ...f, triggerModule: e.target.value }))} style={inputStyle}>
              <option value="">— Any —</option>
              {MODULES.map(m => <option key={m}>{m}</option>)}
            </select></div>
          <div><label style={labelStyle}>TRIGGER ACTION</label>
            <select value={chainForm.triggerAction} onChange={e => setChainForm(f => ({ ...f, triggerAction: e.target.value }))} style={inputStyle}>
              <option value="">— Any —</option>
              {ACTIONS.map(a => <option key={a}>{a}</option>)}
            </select></div>
        </div>
        <div><label style={labelStyle}>CONDITION (optional)</label><input value={chainForm.triggerCondition} onChange={e => setChainForm(f => ({ ...f, triggerCondition: e.target.value }))} style={inputStyle} placeholder="e.g. amount > 50000" /></div>
      </Drawer>

      {/* Add Step Drawer */}
      <Drawer open={!!addStepFor} onClose={() => setAddStepFor(null)} title="Add Approval Step"
        footer={<><button onClick={() => setAddStepFor(null)} style={outlineBtn}>Cancel</button><button onClick={() => addStepMut.mutate()} disabled={addStepMut.isPending} style={gradientBtn}>{addStepMut.isPending ? 'Adding…' : 'Add Step'}</button></>}>
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
        <div><label style={labelStyle}>TIMEOUT (hours)</label><input type="number" value={stepForm.timeoutHours} onChange={e => setStepForm(f => ({ ...f, timeoutHours: e.target.value }))} style={inputStyle} placeholder="Leave blank for no timeout" /></div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="stepRequired" checked={stepForm.required} onChange={e => setStepForm(f => ({ ...f, required: e.target.checked }))} />
          <label htmlFor="stepRequired" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, cursor: 'pointer' }}>Required step (must be approved to proceed)</label>
        </div>
      </Drawer>
    </div>
  )
}
