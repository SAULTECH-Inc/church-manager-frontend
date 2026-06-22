import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, X, Eye, Pencil, Copy, Zap, FileText } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'

interface Template {
  id: string
  name: string
  description?: string
  templateType: string
  isSystemTemplate: boolean
  aiScanStatus: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED'
  htmlContent?: string
  placeholders?: string
  originalFileUrl?: string
  originalFileName?: string
  createdAt?: string
}

interface IssueData {
  template: Template
  placeholderList: string[]
  prefilled: Record<string, string>
  members: Array<{ id: string; fullName: string }>
}

const TYPES = ['ALL', 'LETTER', 'CERTIFICATE', 'CONTRACT', 'PRINTOUT', 'REQUEST', 'MEMORANDUM'] as const
const TYPE_LABELS: Record<string, string> = {
  LETTER: 'Letters', CERTIFICATE: 'Certificates', CONTRACT: 'Contracts',
  PRINTOUT: 'Printouts', LETTERHEAD: 'Printouts', REQUEST: 'Requests', MEMORANDUM: 'Memorandums',
}
const TYPE_COLORS: Record<string, string> = {
  LETTER: '#60a5fa', CERTIFICATE: '#f59e0b', CONTRACT: '#f87171',
  PRINTOUT: '#34d399', LETTERHEAD: '#34d399', REQUEST: '#a78bfa', MEMORANDUM: '#7c6bff',
}
const SCAN_STATUS: Record<string, { color: string; bg: string; label: string }> = {
  PENDING:    { color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', label: 'Not Scanned' },
  PROCESSING: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  label: 'Scanning…' },
  DONE:       { color: '#34d399', bg: 'rgba(52,211,153,0.12)',  label: 'Ready' },
  FAILED:     { color: '#f87171', bg: 'rgba(248,113,113,0.12)', label: 'Scan Failed' },
}

const labelStyle: React.CSSProperties = { display: 'block', color: 'rgb(var(--inv) / 0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }
const inputStyle: React.CSSProperties = { backgroundColor: 'var(--input-bg)', border: '1px solid rgb(var(--inv) / 0.10)', color: 'var(--text-primary)', borderRadius: 12, width: '100%', padding: '10px 14px', fontSize: 14, outline: 'none' }
const outlineBtn: React.CSSProperties = { border: '1px solid rgb(var(--inv) / 0.15)', backgroundColor: 'transparent', color: 'var(--text-primary)', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }
const gradientBtn: React.CSSProperties = { background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--text-primary)', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }

interface DrawerProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode; maxWidth?: number }
function Drawer({ open, onClose, title, children, footer, maxWidth = 520 }: DrawerProps) {
  if (!open) return null
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
        <div style={{ backgroundColor: 'var(--drawer-bg)', borderRadius: 24, width: '100%', maxWidth, maxHeight: '90vh', border: '1px solid rgb(var(--inv) / 0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', pointerEvents: 'auto' }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgb(var(--inv) / 0.08)' }}>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, margin: 0 }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgb(var(--inv) / 0.5)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>
          <div style={{ flexShrink: 0, display: 'flex', gap: 12, padding: '16px 24px', borderTop: '1px solid rgb(var(--inv) / 0.08)' }}>{footer}</div>
        </div>
      </div>
    </>
  )
}

export function TemplatesPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [uploadDrawer, setUploadDrawer] = useState(false)
  const [uploadForm, setUploadForm] = useState({ name: '', templateType: 'LETTER', description: '' })
  const [editTemplate, setEditTemplate] = useState<Template | null>(null)
  const [editForm, setEditForm] = useState({ name: '', description: '', templateType: '' })
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [issueTemplate, setIssueTemplate] = useState<Template | null>(null)
  const [issueForm, setIssueForm] = useState<Record<string, string>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get('/api/templates').then(r => r.data as {
      templates: Template[]
      totalTemplates: number
      letterCount: number
      certificateCount: number
      pendingScans: number
    }),
  })

  const { data: issueData } = useQuery({
    queryKey: ['template-issue', issueTemplate?.id],
    queryFn: () => issueTemplate
      ? api.get(`/api/templates/${issueTemplate.id}/issue`).then(r => r.data as IssueData)
      : null,
    enabled: !!issueTemplate,
  })

  useEffect(() => {
    if (issueData?.prefilled) setIssueForm(issueData.prefilled)
  }, [issueData])

  const uploadMutation = useMutation({
    mutationFn: () => {
      const fd = new FormData()
      fd.append('name', uploadForm.name)
      fd.append('templateType', uploadForm.templateType)
      if (uploadForm.description) fd.append('description', uploadForm.description)
      if (fileRef.current?.files?.[0]) fd.append('file', fileRef.current.files[0])
      return api.post('/api/templates/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      setUploadDrawer(false)
      setUploadForm({ name: '', templateType: 'LETTER', description: '' })
      if (fileRef.current) fileRef.current.value = ''
    },
  })

  const editMutation = useMutation({
    mutationFn: () => {
      const p = new URLSearchParams()
      if (editForm.name) p.append('name', editForm.name)
      if (editForm.description !== undefined) p.append('description', editForm.description)
      if (editForm.templateType) p.append('templateType', editForm.templateType)
      return api.post(`/api/templates/${editTemplate?.id}/edit?${p}`)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setEditTemplate(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/templates/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  })

  const cloneMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/templates/${id}/clone`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  })

  const scanMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/templates/${id}/scan`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  })

  const issuePdfMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams()
      Object.entries(issueForm).forEach(([k, v]) => { if (v) params.append(`ph_${k}`, v) })
      const res = await api.post(
        `/api/templates/${issueTemplate?.id}/issue/pdf?${params}`,
        null,
        { responseType: 'blob' }
      )
      const url = URL.createObjectURL(res.data as Blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${issueTemplate?.name ?? 'document'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    },
  })

  const openEdit = (t: Template) => {
    setEditTemplate(t)
    setEditForm({ name: t.name, description: t.description ?? '', templateType: t.templateType })
  }

  const templates = data?.templates ?? []

  const filtered = typeFilter === 'ALL'
    ? templates
    : templates.filter(t => t.templateType === typeFilter || (typeFilter === 'PRINTOUT' && t.templateType === 'LETTERHEAD'))

  const typeCounts = TYPES.reduce<Record<string, number>>((acc, tp) => {
    if (tp === 'ALL') acc[tp] = templates.length
    else if (tp === 'PRINTOUT') acc[tp] = templates.filter(t => t.templateType === 'PRINTOUT' || t.templateType === 'LETTERHEAD').length
    else acc[tp] = templates.filter(t => t.templateType === tp).length
    return acc
  }, {})

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: 'var(--page-bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 26, margin: 0 }}>Document Templates</h1>
          <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 14, marginTop: 4 }}>Letters · Certificates · Contracts · Printouts</p>
        </div>
        <button onClick={() => setUploadDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> Upload Template
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Templates', value: data?.totalTemplates ?? templates.length },
          { label: 'Letters', value: data?.letterCount ?? typeCounts['LETTER'] ?? 0 },
          { label: 'Certificates', value: data?.certificateCount ?? typeCounts['CERTIFICATE'] ?? 0 },
          { label: 'Pending Scans', value: data?.pendingScans ?? 0 },
        ].map(k => (
          <div key={k.label} style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 20 }}>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 26, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 13, margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Type filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TYPES.map(tp => (
          <button key={tp} onClick={() => setTypeFilter(tp)}
            style={{
              padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: 13,
              border: `1px solid ${typeFilter === tp ? '#7c6bff' : 'rgb(var(--inv) / 0.1)'}`,
              backgroundColor: typeFilter === tp ? 'rgba(124,107,255,0.15)' : 'rgb(var(--inv) / 0.04)',
              color: typeFilter === tp ? '#7c6bff' : 'rgb(var(--inv) / 0.5)',
            }}>
            {tp === 'ALL' ? 'All' : TYPE_LABELS[tp] ?? tp}{' '}
            <span style={{ opacity: 0.7 }}>{typeCounts[tp] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Cards */}
      {isLoading && (
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 40, textAlign: 'center' }}>
          <p style={{ color: 'rgb(var(--inv) / 0.4)' }}>Loading...</p>
        </div>
      )}

      {!isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
          {filtered.length === 0 && (
            <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 48, textAlign: 'center', gridColumn: '1/-1' }}>
              <FileText size={36} style={{ color: 'rgb(var(--inv) / 0.2)', marginBottom: 12 }} />
              <p style={{ color: 'rgb(var(--inv) / 0.4)', margin: 0 }}>No templates in this category yet.</p>
            </div>
          )}
          {filtered.map(tmpl => {
            const catColor = TYPE_COLORS[tmpl.templateType] ?? '#7c6bff'
            const scan = SCAN_STATUS[tmpl.aiScanStatus] ?? SCAN_STATUS.PENDING
            const canPreview = tmpl.aiScanStatus === 'DONE' && !!tmpl.htmlContent
            return (
              <div key={tmpl.id} style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Color stripe */}
                <div style={{ height: 4, backgroundColor: catColor }} />
                <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Title row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: '0 0 5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tmpl.name}</p>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        <span style={{ backgroundColor: `${catColor}20`, color: catColor, borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>
                          {TYPE_LABELS[tmpl.templateType] ?? tmpl.templateType}
                        </span>
                        {tmpl.isSystemTemplate && (
                          <span style={{ backgroundColor: 'rgba(245,158,11,0.12)', color: '#f59e0b', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>
                            🔒 System
                          </span>
                        )}
                        <span style={{ backgroundColor: scan.bg, color: scan.color, borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 600 }}>
                          {scan.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {tmpl.description && (
                    <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 13, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2 }}>
                      {tmpl.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 10, borderTop: '1px solid rgb(var(--inv) / 0.06)', flexWrap: 'wrap' }}>
                    {/* Preview — only if HTML is ready */}
                    {canPreview && (
                      <button onClick={() => setPreviewTemplate(tmpl)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: 'rgba(96,165,250,0.1)', border: 'none', color: '#60a5fa', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        <Eye size={12} /> Preview
                      </button>
                    )}
                    {/* Issue — only if HTML ready */}
                    {canPreview && (
                      <button onClick={() => setIssueTemplate(tmpl)}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: 'rgba(52,211,153,0.1)', border: 'none', color: '#34d399', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        <FileText size={12} /> Issue
                      </button>
                    )}
                    {/* Scan trigger — if not done */}
                    {!tmpl.isSystemTemplate && tmpl.aiScanStatus !== 'DONE' && tmpl.aiScanStatus !== 'PROCESSING' && (
                      <button onClick={() => scanMutation.mutate(tmpl.id)}
                        disabled={scanMutation.isPending}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: 'rgba(245,158,11,0.1)', border: 'none', color: '#f59e0b', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        <Zap size={12} /> Scan
                      </button>
                    )}
                    {/* Clone — system templates */}
                    {tmpl.isSystemTemplate && (
                      <button onClick={() => cloneMutation.mutate(tmpl.id)}
                        disabled={cloneMutation.isPending}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: 'rgba(124,107,255,0.1)', border: 'none', color: '#a5b4fc', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        <Copy size={12} /> Clone
                      </button>
                    )}
                    {/* Edit — non-system templates */}
                    {!tmpl.isSystemTemplate && (
                      <button onClick={() => openEdit(tmpl)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: 'rgba(124,107,255,0.1)', border: 'none', color: '#a5b4fc', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', flexShrink: 0 }}>
                        <Pencil size={12} />
                      </button>
                    )}
                    {/* Delete — non-system templates */}
                    {!tmpl.isSystemTemplate && (
                      <button onClick={() => { if (confirm(`Delete "${tmpl.name}"?`)) deleteMutation.mutate(tmpl.id) }}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', flexShrink: 0 }}>
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Preview Modal ── */}
      {previewTemplate && (
        <div onClick={() => setPreviewTemplate(null)} style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }} />
      )}
      {previewTemplate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}>
          <div style={{ backgroundColor: 'var(--drawer-bg)', borderRadius: 20, width: '100%', maxWidth: 900, height: '88vh', border: '1px solid rgb(var(--inv) / 0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', pointerEvents: 'auto' }}>
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgb(var(--inv) / 0.08)' }}>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16, margin: 0 }}>{previewTemplate.name}</h2>
              <button onClick={() => setPreviewTemplate(null)} style={{ background: 'none', border: 'none', color: 'rgb(var(--inv) / 0.5)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', backgroundColor: 'white' }}>
              <iframe
                src={`/api/templates/${previewTemplate.id}/preview-html`}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                title={previewTemplate.name}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Upload Drawer ── */}
      <Drawer open={uploadDrawer} onClose={() => setUploadDrawer(false)} title="Upload Template"
        footer={<>
          <button onClick={() => setUploadDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => uploadMutation.mutate()} disabled={!uploadForm.name || uploadMutation.isPending} style={gradientBtn}>
            {uploadMutation.isPending ? 'Uploading...' : 'Upload Template'}
          </button>
        </>}>
        <div>
          <label style={labelStyle}>TEMPLATE NAME <span style={{ color: '#f87171' }}>*</span></label>
          <input type="text" value={uploadForm.name} onChange={e => setUploadForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="e.g. Membership Certificate" />
        </div>
        <div>
          <label style={labelStyle}>TYPE</label>
          <select value={uploadForm.templateType} onChange={e => setUploadForm(f => ({ ...f, templateType: e.target.value }))} style={{ ...inputStyle, appearance: 'none' }}>
            {TYPES.filter(t => t !== 'ALL').map(t => <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>DESCRIPTION</label>
          <textarea rows={3} value={uploadForm.description} onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
        <div>
          <label style={labelStyle}>FILE (PDF, DOCX, Image)</label>
          <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.png,.jpg,.jpeg" style={{ ...inputStyle, padding: '8px 12px', cursor: 'pointer' }} />
        </div>
        <div style={{ backgroundColor: 'rgba(124,107,255,0.08)', border: '1px solid rgba(124,107,255,0.2)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <FileText size={16} style={{ color: '#a78bfa', flexShrink: 0, marginTop: 1 }} />
          <p style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13, margin: 0 }}>After upload, click "Scan" on the card to extract the template's placeholders with AI.</p>
        </div>
      </Drawer>

      {/* ── Edit Drawer ── */}
      <Drawer open={!!editTemplate} onClose={() => setEditTemplate(null)} title="Edit Template"
        footer={<>
          <button onClick={() => setEditTemplate(null)} style={outlineBtn}>Cancel</button>
          <button onClick={() => editMutation.mutate()} disabled={editMutation.isPending} style={gradientBtn}>
            {editMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </>}>
        <div>
          <label style={labelStyle}>TEMPLATE NAME</label>
          <input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>TYPE</label>
          <select value={editForm.templateType} onChange={e => setEditForm(f => ({ ...f, templateType: e.target.value }))} style={{ ...inputStyle, appearance: 'none' }}>
            {TYPES.filter(t => t !== 'ALL').map(t => <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>DESCRIPTION</label>
          <textarea rows={3} value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
        </div>
      </Drawer>

      {/* ── Issue Document Drawer ── */}
      <Drawer open={!!issueTemplate} onClose={() => setIssueTemplate(null)} title={`Issue: ${issueTemplate?.name ?? ''}`} maxWidth={600}
        footer={<>
          <button onClick={() => setIssueTemplate(null)} style={outlineBtn}>Cancel</button>
          <button onClick={() => issuePdfMutation.mutate()} disabled={issuePdfMutation.isPending} style={gradientBtn}>
            {issuePdfMutation.isPending ? 'Generating...' : 'Download PDF'}
          </button>
        </>}>
        {!issueData && <p style={{ color: 'rgb(var(--inv) / 0.4)', textAlign: 'center' }}>Loading fields…</p>}
        {issueData && issueData.placeholderList.length === 0 && (
          <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 13 }}>This template has no fillable placeholders. Click Download PDF to generate it with branding.</p>
        )}
        {issueData && issueData.members.length > 0 && (
          <div>
            <label style={labelStyle}>AUTO-FILL FOR MEMBER</label>
            <select style={{ ...inputStyle, appearance: 'none' }} onChange={e => {
              const m = issueData.members.find(x => x.id === e.target.value)
              if (m) {
                setIssueForm(f => ({
                  ...f,
                  member_name: m.fullName, recipient_name: m.fullName,
                  applicant_name: m.fullName, volunteer_name: m.fullName,
                  employee_name: m.fullName,
                }))
              }
            }}>
              <option value="">Select member to auto-fill…</option>
              {issueData.members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
            </select>
          </div>
        )}
        {issueData && issueData.placeholderList.map(ph => (
          <div key={ph}>
            <label style={labelStyle}>{ph.replace(/_/g, ' ').toUpperCase()}</label>
            <input
              type="text"
              value={issueForm[ph] ?? ''}
              onChange={e => setIssueForm(f => ({ ...f, [ph]: e.target.value }))}
              style={inputStyle}
              placeholder={ph.replace(/_/g, ' ')}
            />
          </div>
        ))}
      </Drawer>
    </div>
  )
}
