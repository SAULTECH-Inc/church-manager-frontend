import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, X, Edit2, Download, Upload, ChevronDown } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'

interface Asset { id: string; name: string; category: string; serialNumber?: string; location?: string; assignedTo?: string; assetCondition?: string; status: string; acquisitionCost?: number; currentValue?: number; acquisitionDate?: string; maintenanceDueDate?: string; description?: string; notes?: string }

const labelStyle: React.CSSProperties = { display: 'block', color: 'rgb(var(--inv) / 0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }
const inputStyle: React.CSSProperties = { backgroundColor: 'var(--input-bg)', border: '1px solid rgb(var(--inv) / 0.10)', color: 'var(--text-primary)', borderRadius: 12, width: '100%', padding: '10px 14px', fontSize: 14, outline: 'none' }
const outlineBtn: React.CSSProperties = { border: '1px solid rgb(var(--inv) / 0.15)', backgroundColor: 'transparent', color: 'var(--text-primary)', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }
const gradientBtn: React.CSSProperties = { background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--text-primary)', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }

interface DrawerProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode }
function Drawer({ open, onClose, title, children, footer }: DrawerProps) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: 20, pointerEvents: 'none' }}>
        <div className="flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--drawer-bg)', borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', border: '1px solid rgb(var(--inv) / 0.1)', pointerEvents: 'auto' }}>
          <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgb(var(--inv) / 0.08)' }}>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18 }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgb(var(--inv) / 0.5)', cursor: 'pointer', padding: 4 }}><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-5">{children}</div>
          <div className="shrink-0 flex gap-3 px-6 py-4 border-t" style={{ borderColor: 'rgb(var(--inv) / 0.08)' }}>{footer}</div>
        </div>
      </div>
    </>
  )
}

const categoryColors: Record<string, { color: string; bg: string }> = {
  BUILDING: { color: '#818cf8', bg: 'rgba(129,140,248,0.15)' },
  LAND: { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  VEHICLE: { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  EQUIPMENT: { color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
  FURNITURE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  MUSICAL_INSTRUMENT: { color: '#a78bfa', bg: 'rgba(167,139,250,0.15)' },
  TECHNOLOGY: { color: '#22d3ee', bg: 'rgba(34,211,238,0.15)' },
}
const conditionColors: Record<string, string> = {
  EXCELLENT: '#34d399', GOOD: '#60a5fa', FAIR: '#f59e0b', POOR: '#fb923c', NEEDS_REPAIR: '#f87171',
}
const assetStatusColors: Record<string, { color: string; bg: string }> = {
  ACTIVE: { color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  IN_MAINTENANCE: { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  DISPOSED: { color: 'rgb(var(--inv) / 0.4)', bg: 'rgb(var(--inv) / 0.06)' },
  LOST: { color: '#f87171', bg: 'rgba(248,113,113,0.15)' },
}
const fmt = (n?: number | null) => n != null ? `₦${n.toLocaleString()}` : '—'

const EMPTY_FORM = { name: '', category: 'EQUIPMENT', assetCondition: 'GOOD', status: 'ACTIVE', serialNumber: '', location: '', assignedTo: '', acquisitionCost: '', currentValue: '', acquisitionDate: '', maintenanceDueDate: '', description: '', notes: '' }

function AssetForm({ f, set }: { f: typeof EMPTY_FORM; set: (fn: (prev: typeof EMPTY_FORM) => typeof EMPTY_FORM) => void }) {
  return (
    <>
      <div><label style={labelStyle}>ASSET NAME <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={f.name} onChange={e => set(p => ({ ...p, name: e.target.value }))} style={inputStyle} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={labelStyle}>CATEGORY <span style={{ color: '#f87171' }}>*</span></label>
          <select value={f.category} onChange={e => set(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
            {['BUILDING', 'LAND', 'VEHICLE', 'EQUIPMENT', 'FURNITURE', 'MUSICAL_INSTRUMENT', 'TECHNOLOGY', 'OTHER'].map(c => <option key={c}>{c}</option>)}
          </select></div>
        <div><label style={labelStyle}>CONDITION</label>
          <select value={f.assetCondition} onChange={e => set(p => ({ ...p, assetCondition: e.target.value }))} style={inputStyle}>
            {['EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'NEEDS_REPAIR'].map(c => <option key={c}>{c}</option>)}
          </select></div>
      </div>
      <div><label style={labelStyle}>STATUS</label>
        <select value={f.status} onChange={e => set(p => ({ ...p, status: e.target.value }))} style={inputStyle}>
          {['ACTIVE', 'IN_MAINTENANCE', 'DISPOSED', 'LOST'].map(s => <option key={s}>{s}</option>)}
        </select></div>
      <div><label style={labelStyle}>SERIAL NUMBER</label><input type="text" value={f.serialNumber} onChange={e => set(p => ({ ...p, serialNumber: e.target.value }))} style={inputStyle} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={labelStyle}>LOCATION</label><input type="text" value={f.location} onChange={e => set(p => ({ ...p, location: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>ASSIGNED TO</label><input type="text" value={f.assignedTo} onChange={e => set(p => ({ ...p, assignedTo: e.target.value }))} style={inputStyle} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={labelStyle}>ACQ. COST</label><input type="number" min="0" value={f.acquisitionCost} onChange={e => set(p => ({ ...p, acquisitionCost: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>CURRENT VALUE</label><input type="number" min="0" value={f.currentValue} onChange={e => set(p => ({ ...p, currentValue: e.target.value }))} style={inputStyle} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div><label style={labelStyle}>ACQUISITION DATE</label><input type="date" value={f.acquisitionDate} onChange={e => set(p => ({ ...p, acquisitionDate: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>MAINTENANCE DUE</label><input type="date" value={f.maintenanceDueDate} onChange={e => set(p => ({ ...p, maintenanceDueDate: e.target.value }))} style={inputStyle} /></div>
      </div>
      <div><label style={labelStyle}>DESCRIPTION</label><textarea rows={2} value={f.description} onChange={e => set(p => ({ ...p, description: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      <div><label style={labelStyle}>NOTES</label><textarea rows={2} value={f.notes} onChange={e => set(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
    </>
  )
}

export function PropertyPage() {
  const [createDrawer, setCreateDrawer] = useState(false)
  const [editDrawer, setEditDrawer] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [exportMenu, setExportMenu] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [editForm, setEditForm] = useState({ ...EMPTY_FORM })

  const { data, isLoading } = useQuery({
    queryKey: ['property'],
    queryFn: () => api.get('/api/property').then(r => r.data as { assets: Asset[], stats: Record<string, number> }),
  })

  const toQS = (obj: Record<string, unknown>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) p.append(k, String(v)) }); return p.toString() }
  const createMutation = useMutation({
    mutationFn: () => api.post(`/api/property/create?${toQS(form as unknown as Record<string, unknown>)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['property'] }); setCreateDrawer(false); setForm({ ...EMPTY_FORM }) },
  })
  const editMutation = useMutation({
    mutationFn: () => api.post(`/api/property/${editId}/update?${toQS(editForm as unknown as Record<string, unknown>)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['property'] }); setEditDrawer(false); setEditId(null) },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/property/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['property'] }),
  })
  const importMut = useMutation({
    mutationFn: async () => {
      const fd = new FormData(); fd.append('file', importFile!)
      await api.post('/api/property/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['property'] }); setImportOpen(false); setImportFile(null) },
  })

  const assets = data?.assets ?? []
  const stats = data?.stats ?? {}

  const openEdit = (a: Asset) => {
    setEditId(a.id)
    setEditForm({ name: a.name, category: a.category, assetCondition: a.assetCondition ?? 'GOOD', status: a.status, serialNumber: a.serialNumber ?? '', location: a.location ?? '', assignedTo: a.assignedTo ?? '', acquisitionCost: a.acquisitionCost?.toString() ?? '', currentValue: a.currentValue?.toString() ?? '', acquisitionDate: a.acquisitionDate ?? '', maintenanceDueDate: a.maintenanceDueDate ?? '', description: a.description ?? '', notes: a.notes ?? '' })
    setEditDrawer(true)
  }

  const isDueSoon = (d?: string) => {
    if (!d) return false
    const days = (new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return days >= 0 && days <= 30
  }

  const kpis = [
    { label: 'Total Assets', value: stats.total ?? assets.length, icon: '🏛️' },
    { label: 'Active', value: stats.active ?? 0, icon: '✅' },
    { label: 'In Maintenance', value: stats.inMaintenance ?? 0, icon: '🔧' },
    { label: 'Disposed', value: stats.disposed ?? 0, icon: '📦' },
  ]

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: 'var(--page-bg)' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 26, margin: 0 }}>Property & Assets</h1>
          <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 14, marginTop: 4 }}>Asset Registry · Maintenance · Valuations</p>
        </div>
        <div className="flex items-center gap-2">
          <div style={{ position: 'relative' }}>
            <button onClick={() => setExportMenu(v => !v)} style={{ ...outlineBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}>
              <Download size={14} /> Export <ChevronDown size={13} />
            </button>
            {exportMenu && (
              <div style={{ position: 'absolute', top: '110%', right: 0, backgroundColor: 'var(--drawer-bg)', border: '1px solid rgb(var(--inv) / 0.1)', borderRadius: 12, padding: 6, zIndex: 100, minWidth: 100 }}>
                {['xlsx', 'csv', 'pdf'].map(fmt => (
                  <button key={fmt} onClick={() => { window.location.href = `/api/property/export?format=${fmt}`; setExportMenu(false) }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '7px 12px', background: 'none', border: 'none', color: 'rgb(var(--inv) / 0.7)', cursor: 'pointer', borderRadius: 8, fontSize: 13 }}>
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => setImportOpen(true)} style={{ ...outlineBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}>
            <Upload size={14} /> Import
          </button>
          <button onClick={() => setCreateDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '8px 14px' }}><Plus size={14} /> Add Asset</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 20 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{k.icon}</div>
            <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 26, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 13, margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {isLoading && <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgb(var(--inv) / 0.4)' }}>Loading...</p></div>}

      {!isLoading && (
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b" style={{ borderColor: 'rgb(var(--inv) / 0.06)', backgroundColor: 'rgb(var(--inv) / 0.03)' }}>
                {['ASSET NAME', 'CATEGORY', 'LOCATION', 'ASSIGNED TO', 'CONDITION', 'STATUS', 'ACQ. COST', 'CURRENT VALUE', 'MAINT. DUE', 'ACTIONS'].map(col => (
                  <th key={col} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgb(var(--inv) / 0.4)' }}>{col}</th>
                ))}
              </tr></thead>
              <tbody>
                {assets.length === 0 && <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'rgb(var(--inv) / 0.4)' }}>No assets registered yet</td></tr>}
                {assets.map(a => {
                  const cc = categoryColors[a.category] ?? { color: 'rgb(var(--inv) / 0.5)', bg: 'rgb(var(--inv) / 0.08)' }
                  const sc = assetStatusColors[a.status] ?? { color: 'rgb(var(--inv) / 0.4)', bg: 'rgb(var(--inv) / 0.06)' }
                  const condColor = conditionColors[a.assetCondition ?? ''] ?? 'rgb(var(--inv) / 0.4)'
                  const dueSoon = isDueSoon(a.maintenanceDueDate)
                  return (
                    <tr key={a.id} className="border-b" style={{ borderColor: 'rgb(var(--inv) / 0.04)' }}>
                      <td className="px-4 py-4">
                        <p style={{ color: 'var(--text-primary)', fontWeight: 600, margin: 0 }}>{a.name}</p>
                        {a.serialNumber && <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 11, margin: 0 }}>S/N: {a.serialNumber}</p>}
                      </td>
                      <td className="px-4 py-4"><span style={{ backgroundColor: cc.bg, color: cc.color, borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>{a.category}</span></td>
                      <td className="px-4 py-4" style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13 }}>{a.location || '—'}</td>
                      <td className="px-4 py-4" style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13 }}>{a.assignedTo || '—'}</td>
                      <td className="px-4 py-4"><span style={{ color: condColor, fontSize: 13, fontWeight: 600 }}>{a.assetCondition ?? '—'}</span></td>
                      <td className="px-4 py-4"><span style={{ backgroundColor: sc.bg, color: sc.color, borderRadius: 20, padding: '3px 8px', fontSize: 11, fontWeight: 600 }}>{a.status}</span></td>
                      <td className="px-4 py-4" style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13 }}>{fmt(a.acquisitionCost)}</td>
                      <td className="px-4 py-4" style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13 }}>{fmt(a.currentValue)}</td>
                      <td className="px-4 py-4" style={{ color: dueSoon ? '#f87171' : 'rgb(var(--inv) / 0.6)', fontSize: 13, fontWeight: dueSoon ? 700 : 400 }}>
                        {a.maintenanceDueDate ? new Date(a.maintenanceDueDate).toLocaleDateString() : '—'}
                        {dueSoon && <span style={{ marginLeft: 4, fontSize: 10 }}>⚠️</span>}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(a)} style={{ background: 'rgb(var(--inv) / 0.06)', border: 'none', color: 'rgb(var(--inv) / 0.6)', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit2 size={13} /></button>
                          <button onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(a.id) }} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
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

      <Drawer open={importOpen} onClose={() => setImportOpen(false)} title="Import Assets"
        footer={<>
          <button onClick={() => setImportOpen(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => importMut.mutate()} disabled={!importFile || importMut.isPending} style={gradientBtn}>{importMut.isPending ? 'Importing...' : 'Import'}</button>
        </>}>
        <p style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13, margin: '0 0 16px' }}>Upload a CSV or Excel file to bulk-import asset records.</p>
        <div><label style={labelStyle}>FILE (CSV / XLSX)</label>
          <input type="file" accept=".csv,.xlsx" onChange={e => setImportFile(e.target.files?.[0] ?? null)} style={inputStyle} /></div>
        <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 12, marginTop: 12 }}>
          Need a template?{' '}
          <a href="/api/property/import/template" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>Download Template</a>
        </p>
      </Drawer>

      <Drawer open={createDrawer} onClose={() => setCreateDrawer(false)} title="Add Asset"
        footer={<>
          <button onClick={() => setCreateDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => createMutation.mutate()} disabled={!form.name || createMutation.isPending} style={gradientBtn}>{createMutation.isPending ? 'Adding...' : 'Add Asset'}</button>
        </>}>
        <AssetForm f={form} set={setForm} />
      </Drawer>

      <Drawer open={editDrawer} onClose={() => { setEditDrawer(false); setEditId(null) }} title="Edit Asset"
        footer={<>
          <button onClick={() => { setEditDrawer(false); setEditId(null) }} style={outlineBtn}>Cancel</button>
          <button onClick={() => editMutation.mutate()} disabled={!editForm.name || editMutation.isPending} style={gradientBtn}>{editMutation.isPending ? 'Saving...' : 'Save Changes'}</button>
        </>}>
        <AssetForm f={editForm} set={setEditForm} />
      </Drawer>
    </div>
  )
}
