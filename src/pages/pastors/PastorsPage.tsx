import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, Plus, Crown, ChevronLeft, ChevronRight, X, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { formatDate, getInitials } from '@/lib/utils'

interface Pastor {
  id: string
  title: string
  status: string
  ordinationDate?: string
  appointmentDate?: string
  member: { id: string; fullName: string; email?: string; phoneNumber?: string }
}
interface EligibleMember { id: string; fullName: string; email?: string }

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

function titleBadge(title: string) {
  const seniorTypes = ['SENIOR_PASTOR', 'BISHOP', 'ASSOCIATE_PASTOR', 'YOUTH_PASTOR', 'CHILDREN_PASTOR', 'WORSHIP_PASTOR', 'ASSISTANT_PASTOR']
  const isAmber = title === 'DEACON' || title === 'ELDER'
  return isAmber
    ? { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' }
    : { bg: 'rgba(124,107,255,0.15)', color: '#a78bfa' }
}

function statusBadge(status: string) {
  return status === 'ACTIVE'
    ? { bg: 'rgba(16,185,129,0.15)', color: '#34d399' }
    : { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24' }
}

const TITLES = ['SENIOR_PASTOR','ASSOCIATE_PASTOR','YOUTH_PASTOR','CHILDREN_PASTOR','WORSHIP_PASTOR','ASSISTANT_PASTOR','BISHOP','DEACON','ELDER']
const TITLE_LABELS: Record<string, string> = {
  SENIOR_PASTOR: 'Senior Pastor', ASSOCIATE_PASTOR: 'Associate Pastor', YOUTH_PASTOR: 'Youth Pastor',
  CHILDREN_PASTOR: 'Children Pastor', WORSHIP_PASTOR: 'Worship Pastor', ASSISTANT_PASTOR: 'Assistant Pastor',
  BISHOP: 'Bishop', DEACON: 'Deacon', ELDER: 'Elder',
}

export function PastorsPage() {
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [form, setForm] = useState({ memberId: '', title: '', status: 'ACTIVE', ordinationDateStr: '', appointmentDateStr: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['pastors'],
    queryFn: () => api.get('/api/pastors').then(r => r.data as { pastors: Pastor[], eligibleMembers: EligibleMember[], totalPages?: number }),
  })

  const createMutation = useMutation({
    mutationFn: () => {
      const params = new URLSearchParams()
      Object.entries(form).forEach(([k, v]) => { if (v) params.append(k, v) })
      return api.post(`/api/pastors?${params.toString()}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastors'] })
      setDrawerOpen(false)
      setForm({ memberId: '', title: '', status: 'ACTIVE', ordinationDateStr: '', appointmentDateStr: '' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/pastors/${id}/remove`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pastors'] }),
  })

  const toggleStatusMutation = useMutation({
    mutationFn: ({ p, newStatus }: { p: Pastor; newStatus: string }) => {
      const params = new URLSearchParams()
      params.append('title', p.title)
      params.append('status', newStatus)
      if (p.ordinationDate) params.append('ordinationDateStr', p.ordinationDate.slice(0, 10))
      if (p.appointmentDate) params.append('appointmentDateStr', p.appointmentDate.slice(0, 10))
      return api.post(`/api/pastors/${p.id}/edit?${params.toString()}`)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pastors'] }),
  })

  const pastors = data?.pastors ?? []
  const eligibleMembers = data?.eligibleMembers ?? []
  const totalPages = data?.totalPages ?? 1

  const filtered = pastors.filter(p =>
    p.member?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.title?.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = () => {
    if (!form.memberId || !form.title || !form.appointmentDateStr) return
    createMutation.mutate()
  }

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: 'var(--page-bg)' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 26, margin: 0 }}>Pastoral Leadership</h1>
          <p style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 14, marginTop: 4 }}>Ordained pastors, elders and deacons</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgb(var(--inv) / 0.4)' }} />
            <input type="text" placeholder="Search pastors..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ ...inputStyle, width: 220, paddingLeft: 36 }} />
          </div>
          <button onClick={() => setDrawerOpen(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={15} /> Appoint Pastor
          </button>
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', overflow: 'hidden' }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="animate-pulse flex items-center gap-4 px-5 py-4 border-b" style={{ borderColor: 'rgb(var(--inv) / 0.04)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgb(var(--inv) / 0.06)' }} />
              <div style={{ flex: 1, height: 14, borderRadius: 6, backgroundColor: 'rgb(var(--inv) / 0.06)' }} />
              <div style={{ width: 80, height: 14, borderRadius: 6, backgroundColor: 'rgb(var(--inv) / 0.06)' }} />
              <div style={{ width: 60, height: 14, borderRadius: 6, backgroundColor: 'rgb(var(--inv) / 0.06)' }} />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 60, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(124,107,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Crown size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 16 }}>{search ? 'No pastors found' : 'No pastors appointed yet'}</p>
          <p style={{ color: 'rgb(var(--inv) / 0.45)', fontSize: 14, marginTop: 4 }}>
            {search ? 'Try adjusting your search' : 'Appoint your first pastor to get started'}
          </p>
          {!search && (
            <button onClick={() => setDrawerOpen(true)} style={{ marginTop: 16, ...gradientBtn }}>Appoint Pastor</button>
          )}
        </div>
      )}

      {/* Table */}
      {!isLoading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-2xl border" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'rgb(var(--inv) / 0.08)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: 'rgb(var(--inv) / 0.06)', backgroundColor: 'rgb(var(--inv) / 0.03)' }}>
                  {['PASTOR NAME','TITLE / OFFICE','ORDINATION DATE','APPOINTMENT DATE','STATUS','ACTIONS'].map(col => (
                    <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgb(var(--inv) / 0.4)' }}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'rgb(var(--inv) / 0.04)' }}>
                {filtered.map(p => {
                  const tb = titleBadge(p.title)
                  const sb = statusBadge(p.status)
                  return (
                    <tr key={p.id} style={{ borderColor: 'rgb(var(--inv) / 0.04)' }}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                            {getInitials(p.member?.fullName ?? 'P')}
                          </div>
                          <div>
                            <p style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14, margin: 0 }}>{p.member?.fullName}</p>
                            {p.member?.email && <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 12, margin: 0 }}>{p.member.email}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span style={{ backgroundColor: tb.bg, color: tb.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                          {TITLE_LABELS[p.title] ?? p.title}
                        </span>
                      </td>
                      <td className="px-5 py-4" style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13 }}>{formatDate(p.ordinationDate ?? null)}</td>
                      <td className="px-5 py-4" style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13 }}>{formatDate(p.appointmentDate ?? null)}</td>
                      <td className="px-5 py-4">
                        <span style={{ backgroundColor: sb.bg, color: sb.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            onClick={() => toggleStatusMutation.mutate({ p, newStatus: p.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' })}
                            disabled={toggleStatusMutation.isPending}
                            style={{ background: p.status === 'ACTIVE' ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', border: 'none', color: p.status === 'ACTIVE' ? '#fbbf24' : '#34d399', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                          </button>
                          <Link to={`/pastors/${p.id}`} style={{ color: 'var(--accent)', fontWeight: 500, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' }}>View →</Link>
                          <button onClick={() => { if (confirm(`Remove ${p.member?.fullName}?`)) deleteMutation.mutate(p.id) }}
                            disabled={deleteMutation.isPending}
                            style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t" style={{ borderColor: 'rgb(var(--inv) / 0.06)' }}>
              <span style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 13 }}>Page {page + 1} of {totalPages}</span>
              <div className="flex gap-2">
                <button disabled={page === 0} onClick={() => setPage(p => p - 1)} style={{ ...outlineBtn, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 4, opacity: page === 0 ? 0.4 : 1 }}>
                  <ChevronLeft size={15} /> Prev
                </button>
                <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} style={{ ...outlineBtn, padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 4, opacity: page >= totalPages - 1 ? 0.4 : 1 }}>
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Appoint Pastor Modal */}
      {drawerOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setDrawerOpen(false)} />}
      {drawerOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
        <div style={{ backgroundColor: 'var(--drawer-bg)', borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', border: '1px solid rgb(var(--inv) / 0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', pointerEvents: 'auto' }}>
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgb(var(--inv) / 0.08)' }}>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18 }}>Appoint Pastor</h2>
          <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', color: 'rgb(var(--inv) / 0.5)', cursor: 'pointer', padding: 4 }}>
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label style={labelStyle}>SELECT MEMBER <span style={{ color: '#f87171' }}>*</span></label>
            <select value={form.memberId} onChange={e => setForm(f => ({ ...f, memberId: e.target.value }))} style={inputStyle}>
              <option value="">Choose eligible member...</option>
              {eligibleMembers.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>PASTOR TITLE / OFFICE <span style={{ color: '#f87171' }}>*</span></label>
            <select value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle}>
              <option value="">Select title...</option>
              {TITLES.map(t => <option key={t} value={t}>{TITLE_LABELS[t]}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>OFFICE STATUS <span style={{ color: '#f87171' }}>*</span></label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>ORDINATION DATE</label>
            <input type="date" value={form.ordinationDateStr} onChange={e => setForm(f => ({ ...f, ordinationDateStr: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>APPOINTMENT DATE <span style={{ color: '#f87171' }}>*</span></label>
            <input type="date" value={form.appointmentDateStr} onChange={e => setForm(f => ({ ...f, appointmentDateStr: e.target.value }))} style={inputStyle} />
          </div>
        </div>
        <div className="shrink-0 flex gap-3 px-6 py-4 border-t" style={{ borderColor: 'rgb(var(--inv) / 0.08)' }}>
          <button onClick={() => setDrawerOpen(false)} style={outlineBtn}>Cancel</button>
          <button onClick={handleSubmit} disabled={!form.memberId || !form.title || !form.appointmentDateStr || createMutation.isPending} style={gradientBtn}>
            {createMutation.isPending ? 'Appointing...' : 'Appoint Pastor'}
          </button>
        </div>
      </div>
    </div>}
    </div>
  )
}
