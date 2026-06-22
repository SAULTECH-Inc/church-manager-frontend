import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, X, Trash2 } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'

interface BurialPlot {
  id: string; plotNumber: string; section?: string; rowNumber?: string; status: string
  occupantName?: string; dateOfBirth?: string; dateOfDeath?: string; dateOfBurial?: string
  graveType: string; notes?: string
}
interface Reservation {
  id: string; plot?: { plotNumber: string; section?: string }; reservedForName?: string
  reservedDate: string; amountPaid?: number; status: string; notes?: string
}
interface Stats { totalPlots: number; available: number; occupied: number; reserved: number; pendingReservations: number }

const PAGE_BG   = '#131326'
const CARD      = '#13152e'
const DRAWER_BG = '#1a1b3a'
const INPUT_BG  = '#1e2248'
const ACCENT    = '#7c6bff'

const inputStyle: React.CSSProperties = { backgroundColor: INPUT_BG, border: '1px solid rgba(255,255,255,0.10)', color: 'white', borderRadius: 12, width: '100%', padding: '10px 14px', fontSize: 14, outline: 'none' }
const labelStyle: React.CSSProperties = { display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }
const gradientBtn: React.CSSProperties = { background: 'linear-gradient(135deg,#7c6bff,#6456e8)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }
const outlineBtn: React.CSSProperties  = { border: '1px solid rgba(255,255,255,0.15)', backgroundColor: 'transparent', color: 'white', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }

const PLOT_STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#10b981', OCCUPIED: '#ef4444', RESERVED: '#f59e0b'
}
const RESERVATION_STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b', CONFIRMED: '#10b981', CANCELLED: '#6b7280'
}

function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode }) {
  if (!open) return null
  return (
    <>
      <div className="fixed inset-0 z-40" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ padding: 20, pointerEvents: 'none' }}>
        <div className="flex flex-col overflow-hidden" style={{ backgroundColor: DRAWER_BG, borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'auto' }}>
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

export function CemeteryPage() {
  const [tab, setTab]                 = useState<'plots' | 'reservations'>('plots')
  const [createPlot, setCreatePlot]   = useState(false)
  const [buryPlotId, setBuryPlotId]   = useState<string | null>(null)
  const [reserveOpen, setReserveOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('ALL')

  const [plotForm,    setPlotForm]    = useState({ plotNumber: '', section: '', rowNumber: '', graveType: 'ADULT', notes: '' })
  const [buryForm,    setBuryForm]    = useState({ occupantName: '', dateOfBirth: '', dateOfDeath: '', dateOfBurial: '', notes: '' })
  const [reserveForm, setReserveForm] = useState({ plotId: '', reservedForName: '', reservedDate: '', amountPaid: '', notes: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['cemetery'],
    queryFn: () => api.get('/api/cemetery').then(r => r.data as { plots: BurialPlot[]; reservations: Reservation[]; stats: Stats }),
  })

  const createPlotMut = useMutation({
    mutationFn: () => api.post('/api/cemetery/plots/create', null, { params: plotForm }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cemetery'] }); setCreatePlot(false); setPlotForm({ plotNumber: '', section: '', rowNumber: '', graveType: 'ADULT', notes: '' }) },
  })
  const buryMut = useMutation({
    mutationFn: () => api.post(`/api/cemetery/plots/${buryPlotId}/bury`, null, { params: buryForm }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cemetery'] }); setBuryPlotId(null); setBuryForm({ occupantName: '', dateOfBirth: '', dateOfDeath: '', dateOfBurial: '', notes: '' }) },
  })
  const deletePlotMut = useMutation({
    mutationFn: (id: string) => api.post(`/api/cemetery/plots/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cemetery'] }),
  })
  const reserveMut = useMutation({
    mutationFn: () => api.post('/api/cemetery/reservations/create', null, { params: { ...reserveForm, amountPaid: reserveForm.amountPaid || undefined } }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['cemetery'] }); setReserveOpen(false); setReserveForm({ plotId: '', reservedForName: '', reservedDate: '', amountPaid: '', notes: '' }) },
  })
  const updateResMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.post(`/api/cemetery/reservations/${id}/status`, null, { params: { status } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cemetery'] }),
  })

  const plots        = data?.plots        ?? []
  const reservations = data?.reservations ?? []
  const stats        = data?.stats
  const availablePlots = plots.filter(p => p.status === 'AVAILABLE')

  const filteredPlots = filterStatus === 'ALL' ? plots : plots.filter(p => p.status === filterStatus)

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: PAGE_BG }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>Cemetery Management</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Burial Plots · Reservations · Denominational Register</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setReserveOpen(true)} style={{ ...outlineBtn, fontSize: 13 }}>Reserve Plot</button>
          <button onClick={() => setCreatePlot(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><Plus size={14} /> Add Plot</button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Plots',     value: stats?.totalPlots          ?? 0, color: '#7c6bff' },
          { label: 'Available',       value: stats?.available           ?? 0, color: '#10b981' },
          { label: 'Occupied',        value: stats?.occupied            ?? 0, color: '#ef4444' },
          { label: 'Reserved',        value: stats?.reserved            ?? 0, color: '#f59e0b' },
          { label: 'Pending Reserv.', value: stats?.pendingReservations ?? 0, color: '#60a5fa' },
        ].map(k => (
          <div key={k.label} style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 22, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 0 }}>
        {(['plots', 'reservations'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
            color: tab === t ? ACCENT : 'rgba(255,255,255,0.4)',
            borderBottom: `2px solid ${tab === t ? ACCENT : 'transparent'}`,
          }}>{t === 'plots' ? 'Burial Plots' : 'Reservations'}</button>
        ))}
      </div>

      {isLoading && <div style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>}

      {/* Plots tab */}
      {!isLoading && tab === 'plots' && (
        <>
          {/* Status filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' as const }}>
            {['ALL', 'AVAILABLE', 'OCCUPIED', 'RESERVED'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                border: `1px solid ${filterStatus === s ? ACCENT : 'rgba(255,255,255,0.1)'}`,
                backgroundColor: filterStatus === s ? 'rgba(124,107,255,0.15)' : 'rgba(255,255,255,0.04)',
                color: filterStatus === s ? ACCENT : 'rgba(255,255,255,0.5)',
              }}>{s}</button>
            ))}
          </div>

          <div style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            {filteredPlots.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>No plots found.</p></div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  {['Plot #', 'Section', 'Row', 'Type', 'Status', 'Occupant / Reserved', 'Burial Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {filteredPlots.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 16px', color: 'white', fontWeight: 700, fontSize: 14 }}>{p.plotNumber}</td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{p.section ?? '—'}</td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{p.rowNumber ?? '—'}</td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{p.graveType}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ backgroundColor: `${PLOT_STATUS_COLORS[p.status] ?? '#94a3b8'}20`, color: PLOT_STATUS_COLORS[p.status] ?? '#94a3b8', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{p.status}</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{p.occupantName ?? '—'}</td>
                      <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{p.dateOfBurial ?? '—'}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div className="flex gap-2">
                          {p.status === 'AVAILABLE' && (
                            <button onClick={() => setBuryPlotId(p.id)} style={{ ...gradientBtn, padding: '5px 12px', fontSize: 12 }}>Record Burial</button>
                          )}
                          <button onClick={() => { if (confirm('Delete this plot?')) deletePlotMut.mutate(p.id) }}
                            style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, padding: '5px 10px', cursor: 'pointer' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Reservations tab */}
      {!isLoading && tab === 'reservations' && (
        <div style={{ backgroundColor: CARD, borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          {reservations.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>No reservations yet.</p></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Plot', 'Reserved For', 'Date', 'Amount Paid', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {reservations.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '12px 16px', color: 'white', fontWeight: 700, fontSize: 14 }}>{r.plot?.plotNumber ?? '—'}{r.plot?.section ? ` (${r.plot.section})` : ''}</td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{r.reservedForName ?? '—'}</td>
                    <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{r.reservedDate}</td>
                    <td style={{ padding: '12px 16px', color: r.amountPaid ? '#10b981' : 'rgba(255,255,255,0.3)', fontSize: 13, fontWeight: 600 }}>{r.amountPaid ? `₦${r.amountPaid.toLocaleString()}` : '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ backgroundColor: `${RESERVATION_STATUS_COLORS[r.status] ?? '#94a3b8'}20`, color: RESERVATION_STATUS_COLORS[r.status] ?? '#94a3b8', borderRadius: 8, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{r.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div className="flex gap-2">
                        {r.status === 'PENDING' && (
                          <>
                            <button onClick={() => updateResMut.mutate({ id: r.id, status: 'CONFIRMED' })} style={{ ...gradientBtn, padding: '4px 10px', fontSize: 11 }}>Confirm</button>
                            <button onClick={() => updateResMut.mutate({ id: r.id, status: 'CANCELLED' })} style={{ background: 'rgba(239,68,68,0.12)', border: 'none', color: '#f87171', borderRadius: 8, padding: '4px 10px', fontSize: 11, cursor: 'pointer' }}>Cancel</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Add Plot Drawer */}
      <Drawer open={createPlot} onClose={() => setCreatePlot(false)} title="Add Burial Plot"
        footer={<><button onClick={() => setCreatePlot(false)} style={outlineBtn}>Cancel</button><button onClick={() => createPlotMut.mutate()} disabled={!plotForm.plotNumber || createPlotMut.isPending} style={gradientBtn}>{createPlotMut.isPending ? 'Creating…' : 'Add Plot'}</button></>}>
        <div><label style={labelStyle}>PLOT NUMBER *</label><input value={plotForm.plotNumber} onChange={e => setPlotForm(f => ({ ...f, plotNumber: e.target.value }))} style={inputStyle} placeholder="e.g. A-001" /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>SECTION</label><input value={plotForm.section} onChange={e => setPlotForm(f => ({ ...f, section: e.target.value }))} style={inputStyle} placeholder="e.g. Block A" /></div>
          <div><label style={labelStyle}>ROW</label><input value={plotForm.rowNumber} onChange={e => setPlotForm(f => ({ ...f, rowNumber: e.target.value }))} style={inputStyle} placeholder="e.g. Row 3" /></div>
        </div>
        <div><label style={labelStyle}>GRAVE TYPE</label>
          <select value={plotForm.graveType} onChange={e => setPlotForm(f => ({ ...f, graveType: e.target.value }))} style={inputStyle}>
            {['ADULT', 'CHILD', 'INFANT'].map(t => <option key={t}>{t}</option>)}
          </select></div>
        <div><label style={labelStyle}>NOTES</label><textarea rows={3} value={plotForm.notes} onChange={e => setPlotForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      </Drawer>

      {/* Record Burial Drawer */}
      <Drawer open={!!buryPlotId} onClose={() => setBuryPlotId(null)} title="Record Burial"
        footer={<><button onClick={() => setBuryPlotId(null)} style={outlineBtn}>Cancel</button><button onClick={() => buryMut.mutate()} disabled={!buryForm.occupantName || buryMut.isPending} style={gradientBtn}>{buryMut.isPending ? 'Saving…' : 'Record Burial'}</button></>}>
        <div><label style={labelStyle}>OCCUPANT NAME *</label><input value={buryForm.occupantName} onChange={e => setBuryForm(f => ({ ...f, occupantName: e.target.value }))} style={inputStyle} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>DATE OF BIRTH</label><input type="date" value={buryForm.dateOfBirth} onChange={e => setBuryForm(f => ({ ...f, dateOfBirth: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>DATE OF DEATH</label><input type="date" value={buryForm.dateOfDeath} onChange={e => setBuryForm(f => ({ ...f, dateOfDeath: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>DATE OF BURIAL</label><input type="date" value={buryForm.dateOfBurial} onChange={e => setBuryForm(f => ({ ...f, dateOfBurial: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>NOTES</label><textarea rows={3} value={buryForm.notes} onChange={e => setBuryForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      </Drawer>

      {/* Reserve Plot Drawer */}
      <Drawer open={reserveOpen} onClose={() => setReserveOpen(false)} title="Reserve Burial Plot"
        footer={<><button onClick={() => setReserveOpen(false)} style={outlineBtn}>Cancel</button><button onClick={() => reserveMut.mutate()} disabled={!reserveForm.plotId || !reserveForm.reservedForName || reserveMut.isPending} style={gradientBtn}>{reserveMut.isPending ? 'Saving…' : 'Reserve Plot'}</button></>}>
        <div><label style={labelStyle}>SELECT PLOT *</label>
          <select value={reserveForm.plotId} onChange={e => setReserveForm(f => ({ ...f, plotId: e.target.value }))} style={inputStyle}>
            <option value="">— Select available plot —</option>
            {availablePlots.map(p => <option key={p.id} value={p.id}>Plot {p.plotNumber}{p.section ? ` · ${p.section}` : ''}</option>)}
          </select></div>
        <div><label style={labelStyle}>RESERVED FOR *</label><input value={reserveForm.reservedForName} onChange={e => setReserveForm(f => ({ ...f, reservedForName: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>RESERVATION DATE</label><input type="date" value={reserveForm.reservedDate} onChange={e => setReserveForm(f => ({ ...f, reservedDate: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>AMOUNT PAID (₦)</label><input type="number" value={reserveForm.amountPaid} onChange={e => setReserveForm(f => ({ ...f, amountPaid: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>NOTES</label><textarea rows={3} value={reserveForm.notes} onChange={e => setReserveForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
      </Drawer>
    </div>
  )
}
