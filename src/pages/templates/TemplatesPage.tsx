import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, X, Download, FileText } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'

interface Template { id: string; name: string; category: string; fileType: string; description?: string; fileUrl?: string; uploadedAt?: string; uploadedBy?: string; usageCount?: number }

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

const CATEGORIES = ['All', 'Letters', 'Certificates', 'Contracts', 'Printouts', 'Requests', 'Memorandums']

const fileTypeIcon = (ft: string) => {
  if (ft === 'PDF') return { icon: '📄', color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
  if (ft === 'DOCX' || ft === 'DOC') return { icon: '📝', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' }
  if (ft === 'XLSX' || ft === 'XLS') return { icon: '📊', color: '#34d399', bg: 'rgba(52,211,153,0.12)' }
  if (ft === 'PPTX' || ft === 'PPT') return { icon: '🎞️', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
  return { icon: '📎', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' }
}

const CATEGORY_COLORS: Record<string, string> = {
  Letters: '#60a5fa',
  Certificates: '#f59e0b',
  Contracts: '#f87171',
  Printouts: '#34d399',
  Requests: '#a78bfa',
  Memorandums: '#7c6bff',
}

export function TemplatesPage() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [uploadDrawer, setUploadDrawer] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Letters', fileType: 'PDF', description: '', fileUrl: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get('/api/templates').then(r => r.data as { templates: Template[], stats: Record<string, number> }),
  })

  const uploadMutation = useMutation({
    mutationFn: () => api.post('/api/templates/upload', form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['templates'] }); setUploadDrawer(false); setForm({ name: '', category: 'Letters', fileType: 'PDF', description: '', fileUrl: '' }) },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/templates/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['templates'] }),
  })

  const templates = data?.templates ?? []
  const stats = data?.stats ?? {}

  const categoryCounts = CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = cat === 'All' ? templates.length : templates.filter(t => t.category === cat).length
    return acc
  }, {})

  const filtered = activeCategory === 'All' ? templates : templates.filter(t => t.category === activeCategory)

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>Document Templates</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Letters · Certificates · Contracts · Printouts</p>
        </div>
        <button onClick={() => setUploadDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> Upload Template</button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Templates', value: stats.total ?? templates.length },
          { label: 'Letters', value: stats.letters ?? (categoryCounts['Letters'] ?? 0) },
          { label: 'Certificates', value: stats.certificates ?? (categoryCounts['Certificates'] ?? 0) },
          { label: 'Total Downloads', value: stats.downloads ?? 0 },
        ].map(k => (
          <div key={k.label} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' as const }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            style={{
              padding: '7px 16px', borderRadius: 20, border: `1px solid ${activeCategory === cat ? '#7c6bff' : 'rgba(255,255,255,0.1)'}`,
              cursor: 'pointer', fontWeight: 600, fontSize: 13,
              backgroundColor: activeCategory === cat ? 'rgba(124,107,255,0.15)' : 'rgba(255,255,255,0.04)',
              color: activeCategory === cat ? '#7c6bff' : 'rgba(255,255,255,0.5)',
            }}>
            {cat} <span style={{ marginLeft: 4, opacity: 0.7 }}>{categoryCounts[cat] ?? 0}</span>
          </button>
        ))}
      </div>

      {isLoading && <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>}

      {!isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
          {filtered.length === 0 && (
            <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center', gridColumn: '1/-1' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>No templates in this category yet.</p>
            </div>
          )}
          {filtered.map(tmpl => {
            const fi = fileTypeIcon(tmpl.fileType)
            const catColor = CATEGORY_COLORS[tmpl.category] ?? '#7c6bff'
            return (
              <div key={tmpl.id} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
                {/* Header stripe */}
                <div style={{ height: 4, backgroundColor: catColor }} />
                <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' as const }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: fi.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {fi.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tmpl.name}</p>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <span style={{ backgroundColor: fi.bg, color: fi.color, borderRadius: 6, padding: '2px 6px', fontSize: 11, fontWeight: 700 }}>{tmpl.fileType}</span>
                        <span style={{ backgroundColor: `${catColor}20`, color: catColor, borderRadius: 6, padding: '2px 6px', fontSize: 11, fontWeight: 600 }}>{tmpl.category}</span>
                      </div>
                    </div>
                  </div>
                  {tmpl.description && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 10px', flex: 1, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical' as const, WebkitLineClamp: 2 }}>{tmpl.description}</p>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 'auto' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                      {tmpl.uploadedAt ? new Date(tmpl.uploadedAt).toLocaleDateString() : ''}
                      {tmpl.usageCount !== undefined && <span style={{ marginLeft: 6 }}>· {tmpl.usageCount} uses</span>}
                    </span>
                    <div className="flex gap-1">
                      {tmpl.fileUrl && (
                        <a href={tmpl.fileUrl} download
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(124,107,255,0.1)', color: '#7c6bff', textDecoration: 'none' }}>
                          <Download size={13} />
                        </a>
                      )}
                      <button onClick={() => { if (confirm('Delete template?')) deleteMutation.mutate(tmpl.id) }}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Drawer open={uploadDrawer} onClose={() => setUploadDrawer(false)} title="Upload Template"
        footer={<><button onClick={() => setUploadDrawer(false)} style={outlineBtn}>Cancel</button><button onClick={() => uploadMutation.mutate()} disabled={!form.name || uploadMutation.isPending} style={gradientBtn}>{uploadMutation.isPending ? 'Uploading...' : 'Upload Template'}</button></>}>
        <div><label style={labelStyle}>TEMPLATE NAME <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>CATEGORY</label>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
            {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
          </select></div>
        <div><label style={labelStyle}>FILE TYPE</label>
          <select value={form.fileType} onChange={e => setForm(f => ({ ...f, fileType: e.target.value }))} style={inputStyle}>
            {['PDF', 'DOCX', 'DOC', 'XLSX', 'PPTX'].map(ft => <option key={ft}>{ft}</option>)}
          </select></div>
        <div><label style={labelStyle}>DESCRIPTION</label><textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
        <div><label style={labelStyle}>FILE URL</label><input type="url" value={form.fileUrl} onChange={e => setForm(f => ({ ...f, fileUrl: e.target.value }))} placeholder="https://..." style={inputStyle} /></div>
        <div style={{ backgroundColor: 'rgba(124,107,255,0.08)', border: '1px solid rgba(124,107,255,0.2)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <FileText size={16} style={{ color: '#a78bfa', flexShrink: 0, marginTop: 1 }} />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>Templates are stored externally. Paste the file's public URL above so members can download it directly.</p>
        </div>
      </Drawer>
    </div>
  )
}
