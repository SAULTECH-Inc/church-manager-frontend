import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, X, Calendar, BookOpen } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { RichTextEditor } from '@/components/editor/RichTextEditor'

interface ServiceSchedule { id: string; title: string; serviceType: string; serviceDate: string; startTime?: string; endTime?: string; theme?: string; preacherName?: string; notes?: string }
interface Sermon { id: string; title: string; series?: string; sermonDate: string; preacherName?: string; scriptureRef?: string; summary?: string }
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

const SERVICE_TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  SUNDAY_SERVICE: { label: 'Sunday Service', color: '#7c6bff', bg: 'rgba(124,107,255,0.15)' },
  MIDWEEK:        { label: 'Midweek', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  PRAYER:         { label: 'Prayer', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  SPECIAL:        { label: 'Special Service', color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  YOUTH:          { label: 'Youth Service', color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
  WOMEN:          { label: "Women's Service", color: '#e879f9', bg: 'rgba(232,121,249,0.15)' },
  MEN:            { label: "Men's Service", color: '#38bdf8', bg: 'rgba(56,189,248,0.15)' },
  CHILDREN:       { label: "Children's Service", color: '#fb923c', bg: 'rgba(251,146,60,0.15)' },
}

export function ServicePage() {
  const [tab, setTab] = useState<'schedule' | 'sermons'>('schedule')
  const [scheduleDrawer, setScheduleDrawer] = useState(false)
  const [sermonDrawer, setSermonDrawer] = useState(false)
  const [schedForm, setSchedForm] = useState({ title: '', serviceDate: '', serviceType: 'SUNDAY_SERVICE', startTime: '', endTime: '', theme: '', preacherId: '', preacherName: '', notes: '' })
  const [sermonForm, setSermonForm] = useState({ title: '', series: '', sermonDate: '', preacherId: '', preacherName: '', scriptureRef: '', summary: '', audioUrl: '', videoUrl: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['service'],
    queryFn: () => api.get('/api/service').then(r => r.data as { schedules: ServiceSchedule[], sermons: Sermon[], members: Member[], stats: Record<string, number> }),
  })

  const toQS = (obj: Record<string, string>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v) p.append(k, v) }); return p.toString() }
  const createSchedule = useMutation({
    mutationFn: () => api.post(`/api/service/schedule?${toQS(schedForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service'] }); setScheduleDrawer(false); setSchedForm({ title: '', serviceDate: '', serviceType: 'SUNDAY_SERVICE', startTime: '', endTime: '', theme: '', preacherId: '', preacherName: '', notes: '' }) },
  })
  const createSermon = useMutation({
    mutationFn: () => api.post(`/api/service/sermon?${toQS(sermonForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['service'] }); setSermonDrawer(false); setSermonForm({ title: '', series: '', sermonDate: '', preacherId: '', preacherName: '', scriptureRef: '', summary: '', audioUrl: '', videoUrl: '' }) },
  })
  const deleteSchedule = useMutation({
    mutationFn: (id: string) => api.post(`/api/service/schedule/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service'] }),
  })
  const deleteSermon = useMutation({
    mutationFn: (id: string) => api.post(`/api/service/sermon/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['service'] }),
  })

  const schedules = data?.schedules ?? []
  const sermons = data?.sermons ?? []
  const members = data?.members ?? []
  const stats = data?.stats ?? {}

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>Service Management</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Schedule · Sermons · Series</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setSermonDrawer(true)} style={{ ...outlineBtn, display: 'flex', alignItems: 'center', gap: 6 }}><BookOpen size={15} /> Add Sermon</button>
          <button onClick={() => setScheduleDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> Schedule Service</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Services', value: stats.totalServices ?? schedules.length, color: '#7c6bff' },
          { label: 'This Month', value: stats.thisMonth ?? 0, color: '#60a5fa' },
          { label: 'Total Sermons', value: stats.totalSermons ?? sermons.length, color: '#34d399' },
          { label: 'Series', value: stats.totalSeries ?? 0, color: '#f59e0b' },
          { label: 'Avg Attendance', value: stats.avgAttendance ?? '—', color: '#f472b6' },
        ].map(k => (
          <div key={k.label} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-6" style={{ backgroundColor: '#13152e', borderRadius: 14, padding: 4, width: 'fit-content', border: '1px solid rgba(255,255,255,0.06)' }}>
        {(['schedule', 'sermons'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, backgroundColor: tab === t ? '#7c6bff' : 'transparent', color: tab === t ? 'white' : 'rgba(255,255,255,0.5)' }}>
            {t === 'schedule' ? '📅 Schedule' : '📖 Sermon Library'}
          </button>
        ))}
      </div>

      {isLoading && <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>}

      {!isLoading && tab === 'schedule' && (
        schedules.length === 0
          ? <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 60, textAlign: 'center' }}>
              <Calendar size={32} style={{ color: '#7c6bff', margin: '0 auto 12px' }} />
              <p style={{ color: 'white', fontWeight: 600 }}>No services scheduled</p>
              <button onClick={() => setScheduleDrawer(true)} style={{ marginTop: 12, ...gradientBtn }}>Schedule Service</button>
            </div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {schedules.map(s => {
                const stype = SERVICE_TYPE_LABELS[s.serviceType] ?? { label: s.serviceType, color: '#7c6bff', bg: 'rgba(124,107,255,0.15)' }
                return (
                  <div key={s.id} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <span style={{ backgroundColor: stype.bg, color: stype.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>{stype.label}</span>
                      <button onClick={() => { if (confirm('Delete?')) deleteSchedule.mutate(s.id) }}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <h3 style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: '0 0 8px' }}>{s.title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 3px' }}>📅 {new Date(s.serviceDate).toLocaleDateString()}</p>
                    {(s.startTime || s.endTime) && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 3px' }}>🕐 {s.startTime}{s.endTime ? ` – ${s.endTime}` : ''}</p>}
                    {s.theme && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: '0 0 3px' }}>✨ {s.theme}</p>}
                    {s.preacherName && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>🎤 {s.preacherName}</p>}
                  </div>
                )
              })}
            </div>
      )}

      {!isLoading && tab === 'sermons' && (
        <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  {['SERMON TITLE', 'SERIES', 'DATE', 'PREACHER', 'SCRIPTURE', 'ACTIONS'].map(col => (
                    <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sermons.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>No sermons added yet</td></tr>}
                {sermons.map(s => (
                  <tr key={s.id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-4"><p style={{ color: 'white', fontWeight: 600, margin: 0 }}>{s.title}</p>{s.summary && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{s.summary}</p>}</td>
                    <td className="px-5 py-4">{s.series ? <span style={{ backgroundColor: 'rgba(139,92,246,0.15)', color: '#8b5cf6', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{s.series}</span> : <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}</td>
                    <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{new Date(s.sermonDate).toLocaleDateString()}</td>
                    <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{s.preacherName || '—'}</td>
                    <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{s.scriptureRef || '—'}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => { if (confirm('Delete sermon?')) deleteSermon.mutate(s.id) }}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Drawer open={scheduleDrawer} onClose={() => setScheduleDrawer(false)} title="Schedule Service"
        footer={<>
          <button onClick={() => setScheduleDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => createSchedule.mutate()} disabled={!schedForm.title || !schedForm.serviceDate || !schedForm.startTime || createSchedule.isPending} style={gradientBtn}>{createSchedule.isPending ? 'Saving...' : 'Schedule Service'}</button>
        </>}>
        <div><label style={labelStyle}>SERVICE TITLE <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={schedForm.title} onChange={e => setSchedForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Sunday Morning Service" style={inputStyle} /></div>
        <div><label style={labelStyle}>DATE <span style={{ color: '#f87171' }}>*</span></label><input type="date" value={schedForm.serviceDate} onChange={e => setSchedForm(f => ({ ...f, serviceDate: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>SERVICE TYPE</label>
          <select value={schedForm.serviceType} onChange={e => setSchedForm(f => ({ ...f, serviceType: e.target.value }))} style={inputStyle}>
            {Object.entries(SERVICE_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>START TIME</label><input type="time" value={schedForm.startTime} onChange={e => setSchedForm(f => ({ ...f, startTime: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>END TIME</label><input type="time" value={schedForm.endTime} onChange={e => setSchedForm(f => ({ ...f, endTime: e.target.value }))} style={inputStyle} /></div>
        </div>
        <div><label style={labelStyle}>THEME</label><input type="text" value={schedForm.theme} onChange={e => setSchedForm(f => ({ ...f, theme: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>PREACHER (MEMBER)</label>
          <select value={schedForm.preacherId} onChange={e => setSchedForm(f => ({ ...f, preacherId: e.target.value }))} style={inputStyle}>
            <option value="">Select member...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
        <div><label style={labelStyle}>PREACHER NAME (GUEST)</label><input type="text" value={schedForm.preacherName} onChange={e => setSchedForm(f => ({ ...f, preacherName: e.target.value }))} placeholder="Guest preacher name" style={inputStyle} /></div>
        <div><label style={labelStyle}>NOTES</label><RichTextEditor value={schedForm.notes ?? ''} onChange={v => setSchedForm(f => ({ ...f, notes: v }))} placeholder="Service notes..." minHeight={100} /></div>
      </Drawer>

      <Drawer open={sermonDrawer} onClose={() => setSermonDrawer(false)} title="Add Sermon"
        footer={<>
          <button onClick={() => setSermonDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => createSermon.mutate()} disabled={!sermonForm.title || !sermonForm.sermonDate || createSermon.isPending} style={gradientBtn}>{createSermon.isPending ? 'Saving...' : 'Add Sermon'}</button>
        </>}>
        <div><label style={labelStyle}>TITLE <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={sermonForm.title} onChange={e => setSermonForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>SERIES</label>
          <input type="text" list="series-list" value={sermonForm.series} onChange={e => setSermonForm(f => ({ ...f, series: e.target.value }))} placeholder="Series name" style={inputStyle} />
          <datalist id="series-list">{[...new Set(sermons.map(s => s.series).filter(Boolean))].map(s => <option key={s} value={s!} />)}</datalist>
        </div>
        <div><label style={labelStyle}>DATE <span style={{ color: '#f87171' }}>*</span></label><input type="date" value={sermonForm.sermonDate} onChange={e => setSermonForm(f => ({ ...f, sermonDate: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>PREACHER (MEMBER)</label>
          <select value={sermonForm.preacherId} onChange={e => setSermonForm(f => ({ ...f, preacherId: e.target.value }))} style={inputStyle}>
            <option value="">Select member...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
        <div><label style={labelStyle}>PREACHER NAME (GUEST)</label><input type="text" value={sermonForm.preacherName} onChange={e => setSermonForm(f => ({ ...f, preacherName: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>SCRIPTURE REFERENCE</label><input type="text" value={sermonForm.scriptureRef} onChange={e => setSermonForm(f => ({ ...f, scriptureRef: e.target.value }))} placeholder="e.g. John 3:16" style={inputStyle} /></div>
        <div><label style={labelStyle}>SUMMARY</label><RichTextEditor value={sermonForm.summary ?? ''} onChange={v => setSermonForm(f => ({ ...f, summary: v }))} placeholder="Sermon summary, key points..." minHeight={120} /></div>
        <div><label style={labelStyle}>AUDIO URL</label><input type="url" value={sermonForm.audioUrl} onChange={e => setSermonForm(f => ({ ...f, audioUrl: e.target.value }))} placeholder="https://..." style={inputStyle} /></div>
        <div><label style={labelStyle}>VIDEO URL</label><input type="url" value={sermonForm.videoUrl} onChange={e => setSermonForm(f => ({ ...f, videoUrl: e.target.value }))} placeholder="https://..." style={inputStyle} /></div>
      </Drawer>
    </div>
  )
}
