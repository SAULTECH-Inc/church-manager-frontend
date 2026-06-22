import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, Plus, Users, X, Trash2, Pencil } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { getInitials } from '@/lib/utils'
import { RichTextEditor } from '@/components/editor/RichTextEditor'

interface Group {
  id: string
  name: string
  type: string
  description?: string
  leader?: { id: string; fullName: string }
  coLeader?: { id: string; fullName: string }
  meetingDay?: string
  meetingTime?: string
  meetingLocation?: string
}

interface GroupStats {
  memberCount: number
  averageAttendanceRate: number
  sessionsLogged: number
}

interface GlobalStats {
  totalGroups: number
  activeMembersInGroups: number
  averageAttendanceRate: number
}

interface Member {
  id: string
  fullName: string
}

function typeBadge(type: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    CELL_GROUP: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', label: 'Cell Group' },
    HOUSE_FELLOWSHIP: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', label: 'House Fellowship' },
    SMALL_GROUP: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', label: 'Small Group' },
    MINISTRY: { bg: 'rgba(168,85,247,0.15)', color: '#c084fc', label: 'Ministry' },
    DISCIPLESHIP_CLASS: { bg: 'rgba(124,107,255,0.15)', color: '#a78bfa', label: 'Discipleship Class' },
  }
  return map[type] ?? { bg: 'rgb(var(--inv) / 0.08)', color: 'rgb(var(--inv) / 0.6)', label: type }
}

const emptyForm = {
  name: '',
  description: '',
  type: '',
  leaderId: '',
  coLeaderId: '',
  meetingLocation: '',
  meetingDay: '',
  meetingTime: '',
}

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'CELL_GROUP', label: 'Cell Group' },
  { value: 'HOUSE_FELLOWSHIP', label: 'House Fellowship' },
  { value: 'SMALL_GROUP', label: 'Small Group' },
  { value: 'MINISTRY', label: 'Ministry' },
  { value: 'DISCIPLESHIP_CLASS', label: 'Discipleship Class' },
]

export function FellowshipsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [selected, setSelected] = useState<string[]>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editGroup, setEditGroup] = useState<Group | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [editForm, setEditForm] = useState(emptyForm)

  const { data, isLoading } = useQuery({
    queryKey: ['fellowships'],
    queryFn: () =>
      api.get('/api/fellowships').then(
        (r) =>
          r.data as {
            groups: Group[]
            globalStats: GlobalStats
            groupStatsMap: Record<string, GroupStats>
            members: Member[]
          }
      ),
  })

  const toQS = (obj: Record<string, string>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v) p.append(k, v) }); return p.toString() }
  const createMutation = useMutation({
    mutationFn: () => api.post(`/api/fellowships?${toQS(form)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fellowships'] })
      setDrawerOpen(false)
      setForm(emptyForm)
    },
  })
  const editMutation = useMutation({
    mutationFn: () => api.post(`/api/fellowships/${editGroup?.id}/edit?${toQS(editForm)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fellowships'] })
      setEditGroup(null)
      setEditForm(emptyForm)
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/fellowships/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fellowships'] }),
  })

  function openEdit(g: Group) {
    setEditForm({
      name: g.name,
      description: g.description ?? '',
      type: g.type,
      leaderId: g.leader?.id ?? '',
      coLeaderId: g.coLeader?.id ?? '',
      meetingLocation: g.meetingLocation ?? '',
      meetingDay: g.meetingDay ?? '',
      meetingTime: g.meetingTime ?? '',
    })
    setEditGroup(g)
  }

  const groups = data?.groups ?? []
  const globalStats = data?.globalStats ?? { totalGroups: 0, activeMembersInGroups: 0, averageAttendanceRate: 0 }
  const groupStatsMap = data?.groupStatsMap ?? {}
  const members = data?.members ?? []

  const filteredGroups = groups.filter((g) => {
    const matchSearch = g.name.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'ALL' || g.type === typeFilter
    return matchSearch && matchType
  })

  const allSelected = filteredGroups.length > 0 && filteredGroups.every((g) => selected.includes(g.id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !filteredGroups.some((g) => g.id === id)))
    } else {
      setSelected((prev) => {
        const newIds = filteredGroups.map((g) => g.id).filter((id) => !prev.includes(id))
        return [...prev, ...newIds]
      })
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.type) return
    createMutation.mutate()
  }

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--input-bg)',
    border: '1px solid rgb(var(--inv) / 0.10)',
    borderRadius: 10,
    color: 'var(--text-primary)',
    padding: '9px 14px',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    color: 'rgb(var(--inv) / 0.6)',
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 6,
    display: 'block',
  }

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: 'var(--page-bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 24, margin: 0 }}>Fellowship Management</h1>
          <p style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 14, marginTop: 4 }}>
            Cell groups, house fellowships, ministry groups and discipleship classes
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
            color: 'var(--text-primary)',
            border: 'none',
            borderRadius: 12,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Plus size={16} />
          Create Group
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
        {/* Total Groups */}
        <div
          style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: 20,
            border: '1px solid rgb(var(--inv) / 0.08)',
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(124,107,255,0.1)',
              borderRadius: 12,
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users size={22} color="#7c6bff" />
          </div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 24 }}>
              {globalStats.totalGroups ?? groups.length}
            </div>
            <div style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 13 }}>Total Groups</div>
          </div>
        </div>

        {/* Members in Fellowships */}
        <div
          style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: 20,
            border: '1px solid rgb(var(--inv) / 0.08)',
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(16,185,129,0.1)',
              borderRadius: 12,
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users size={22} color="#34d399" />
          </div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 24 }}>
              {globalStats.activeMembersInGroups ?? 0}
            </div>
            <div style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 13 }}>Members in Fellowships</div>
          </div>
        </div>

        {/* Average Attendance */}
        <div
          style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: 20,
            border: '1px solid rgb(var(--inv) / 0.08)',
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(124,107,255,0.1)',
              borderRadius: 12,
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Users size={22} color="#7c6bff" />
          </div>
          <div>
            <div style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 24 }}>
              {(globalStats.averageAttendanceRate ?? 0).toFixed(0)}%
            </div>
            <div style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 13 }}>Average Attendance</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value)}
              style={{
                borderRadius: 20,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                ...(typeFilter === opt.value
                  ? {
                      background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                      color: 'var(--text-primary)',
                      boxShadow: '0 2px 8px rgba(124,107,255,0.3)',
                    }
                  : {
                      background: 'transparent',
                      color: 'rgb(var(--inv) / 0.5)',
                      border: '1px solid rgb(var(--inv) / 0.1)',
                    }),
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ marginLeft: 'auto', position: 'relative' }}>
          <Search
            size={16}
            color="rgb(var(--inv) / 0.4)"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              backgroundColor: 'var(--input-bg)',
              border: '1px solid rgb(var(--inv) / 0.10)',
              color: 'var(--text-primary)',
              borderRadius: 12,
              padding: '8px 16px 8px 40px',
              width: 260,
              fontSize: 14,
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="overflow-hidden rounded-2xl border mt-6"
        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'rgb(var(--inv) / 0.08)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'rgb(var(--inv) / 0.06)', backgroundColor: 'rgb(var(--inv) / 0.03)' }}>
                <th className="px-5 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    style={{ accentColor: '#7c6bff', cursor: 'pointer', width: 15, height: 15 }}
                  />
                </th>
                {['GROUP DETAILS', 'TYPE', 'LEADER', 'SCHEDULE', 'MEETING PLACE', 'MEMBERS', 'AVG ATTENDANCE', 'MANAGE'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider"
                      style={{ color: 'rgb(var(--inv) / 0.4)' }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b animate-pulse" style={{ borderColor: 'rgb(var(--inv) / 0.04)' }}>
                      <td className="px-5 py-4">
                        <div style={{ width: 15, height: 15, backgroundColor: 'rgb(var(--inv) / 0.08)', borderRadius: 3 }} />
                      </td>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div style={{ height: 14, backgroundColor: 'rgb(var(--inv) / 0.08)', borderRadius: 6, width: '70%' }} />
                        </td>
                      ))}
                    </tr>
                  ))
                : filteredGroups.map((g) => {
                    const stats = groupStatsMap[g.id] ?? { memberCount: 0, averageAttendanceRate: 0, sessionsLogged: 0 }
                    const badge = typeBadge(g.type)
                    const attendRate = stats.averageAttendanceRate
                    const attendColor =
                      attendRate >= 70 ? '#34d399' : attendRate >= 40 ? '#fbbf24' : '#f87171'
                    const isSelected = selected.includes(g.id)
                    return (
                      <tr
                        key={g.id}
                        className="border-b"
                        style={{
                          borderColor: 'rgb(var(--inv) / 0.04)',
                          backgroundColor: isSelected ? 'rgba(124,107,255,0.06)' : 'transparent',
                        }}
                      >
                        <td className="px-5 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(g.id)}
                            style={{ accentColor: '#7c6bff', cursor: 'pointer', width: 15, height: 15 }}
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div
                            style={{
                              color: 'var(--text-primary)',
                              fontWeight: 500,
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {g.name}
                          </div>
                          {g.description && (
                            <div
                              style={{
                                color: 'rgb(var(--inv) / 0.5)',
                                fontSize: 12,
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                marginTop: 2,
                              }}
                            >
                              {g.description}
                            </div>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            style={{
                              backgroundColor: badge.bg,
                              color: badge.color,
                              borderRadius: 8,
                              padding: '3px 10px',
                              fontSize: 12,
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Users size={14} color="rgb(var(--inv) / 0.4)" />
                            <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                              {g.leader?.fullName ?? '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 12 }}>
                            {g.meetingDay ?? '—'} @ {g.meetingTime ?? '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 12 }}>
                            {g.meetingLocation ?? '—'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{stats.memberCount}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span style={{ color: attendColor, fontWeight: 500 }}>
                            {attendRate.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'nowrap' }}>
                            <button onClick={() => openEdit(g)}
                              style={{ background: 'rgba(124,107,255,0.12)', border: '1px solid rgba(124,107,255,0.25)', color: '#a78bfa', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => { if (confirm(`Delete "${g.name}"?`)) deleteMutation.mutate(g.id) }}
                              style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 8, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Trash2 size={12} />
                            </button>
                            <Link to={`/fellowships/${g.id}`}
                              style={{ background: 'rgba(124,107,255,0.15)', color: '#a78bfa', borderRadius: 12, padding: '6px 12px', fontSize: 12, fontWeight: 500, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                              Manage
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>

          {/* Empty state */}
          {!isLoading && filteredGroups.length === 0 && (
            <div className="py-20 text-center">
              <div
                style={{
                  backgroundColor: 'rgba(124,107,255,0.1)',
                  borderRadius: 20,
                  width: 72,
                  height: 72,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <Users size={32} color="#7c6bff" />
              </div>
              <p style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 15, marginBottom: 16 }}>No fellowship groups</p>
              <button
                onClick={() => setDrawerOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                  color: 'var(--text-primary)',
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Plus size={16} />
                Create Group
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'var(--drawer-bg)',
            borderTop: '1px solid rgb(var(--inv) / 0.08)',
            padding: '14px 32px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            zIndex: 30,
          }}
        >
          <span style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14 }}>{selected.length} selected</span>
          <button
            style={{
              backgroundColor: 'transparent',
              color: 'rgb(var(--inv) / 0.7)',
              border: '1px solid rgb(var(--inv) / 0.2)',
              borderRadius: 10,
              padding: '7px 16px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Export Selected
          </button>
          <button
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10,
              padding: '7px 16px',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Trash2 size={14} />
            Delete Selected
          </button>
          <button
            onClick={() => setSelected([])}
            style={{
              backgroundColor: 'transparent',
              color: 'rgb(var(--inv) / 0.5)',
              border: 'none',
              padding: '7px 12px',
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <X size={14} />
            Clear
          </button>
        </div>
      )}

      {/* Edit Group Modal */}
      {editGroup && <div onClick={() => { setEditGroup(null); setEditForm(emptyForm) }} style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />}
      {editGroup && <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
      <div style={{ backgroundColor: 'var(--drawer-bg)', borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', border: '1px solid rgb(var(--inv) / 0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', pointerEvents: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgb(var(--inv) / 0.08)' }}>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, margin: 0 }}>Edit Group</h2>
          <button onClick={() => { setEditGroup(null); setEditForm(emptyForm) }} style={{ backgroundColor: 'rgb(var(--inv) / 0.06)', border: 'none', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgb(var(--inv) / 0.6)' }}><X size={16} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div><label style={labelStyle}>Group Name *</label><input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Description</label><RichTextEditor value={editForm.description ?? ''} onChange={v => setEditForm(f => ({ ...f, description: v }))} placeholder="Describe this group..." minHeight={100} /></div>
            <div><label style={labelStyle}>Group Type *</label>
              <select value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="" disabled>Select type</option>
                <option value="CELL_GROUP">Cell Group</option><option value="HOUSE_FELLOWSHIP">House Fellowship</option>
                <option value="SMALL_GROUP">Small Group</option><option value="MINISTRY">Ministry</option>
                <option value="DISCIPLESHIP_CLASS">Discipleship Class</option>
              </select></div>
            <div><label style={labelStyle}>Leader</label>
              <select value={editForm.leaderId} onChange={e => setEditForm(f => ({ ...f, leaderId: e.target.value }))} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="">Select leader</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
              </select></div>
            <div><label style={labelStyle}>Co-Leader</label>
              <select value={editForm.coLeaderId} onChange={e => setEditForm(f => ({ ...f, coLeaderId: e.target.value }))} style={{ ...inputStyle, appearance: 'none' }}>
                <option value="">Select co-leader</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
              </select></div>
            <div><label style={labelStyle}>Meeting Location</label><input type="text" value={editForm.meetingLocation} onChange={e => setEditForm(f => ({ ...f, meetingLocation: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Meeting Day</label><input type="text" value={editForm.meetingDay} onChange={e => setEditForm(f => ({ ...f, meetingDay: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Meeting Time</label><input type="text" value={editForm.meetingTime} onChange={e => setEditForm(f => ({ ...f, meetingTime: e.target.value }))} style={inputStyle} /></div>
          </div>
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgb(var(--inv) / 0.08)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button onClick={() => { setEditGroup(null); setEditForm(emptyForm) }} style={{ backgroundColor: 'transparent', color: 'rgb(var(--inv) / 0.6)', border: '1px solid rgb(var(--inv) / 0.15)', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
          <button onClick={() => { if (!editForm.name.trim() || !editForm.type) return; editMutation.mutate() }} disabled={editMutation.isPending}
            style={{ background: editMutation.isPending ? 'rgba(124,107,255,0.5)' : 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--text-primary)', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: editMutation.isPending ? 'not-allowed' : 'pointer' }}>
            {editMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
      </div>}

      {/* Create Group Modal */}
      {drawerOpen && <div onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />}
      {drawerOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
      <div
        style={{
          backgroundColor: 'var(--drawer-bg)',
          borderRadius: 24,
          width: '100%',
          maxWidth: 520,
          maxHeight: '90vh',
          border: '1px solid rgb(var(--inv) / 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}
      >
        {/* Drawer header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgb(var(--inv) / 0.08)',
          }}
        >
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, margin: 0 }}>Create Group</h2>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{
              backgroundColor: 'rgb(var(--inv) / 0.06)',
              border: 'none',
              borderRadius: 8,
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgb(var(--inv) / 0.6)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Group Name */}
            <div>
              <label style={labelStyle}>Group Name *</label>
              <input
                type="text"
                placeholder="e.g. Tuesday Cell Group"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                style={inputStyle}
              />
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <RichTextEditor value={form.description ?? ''} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Brief description of this group..." minHeight={100} />
            </div>

            {/* Group Type */}
            <div>
              <label style={labelStyle}>Group Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                style={{ ...inputStyle, appearance: 'none' }}
              >
                <option value="" disabled>Select type</option>
                <option value="CELL_GROUP">Cell Group</option>
                <option value="HOUSE_FELLOWSHIP">House Fellowship</option>
                <option value="SMALL_GROUP">Small Group</option>
                <option value="MINISTRY">Ministry</option>
                <option value="DISCIPLESHIP_CLASS">Discipleship Class</option>
              </select>
            </div>

            {/* Leader */}
            <div>
              <label style={labelStyle}>Leader</label>
              <select
                value={form.leaderId}
                onChange={(e) => setForm((f) => ({ ...f, leaderId: e.target.value }))}
                style={{ ...inputStyle, appearance: 'none' }}
              >
                <option value="">Select leader</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Co-Leader */}
            <div>
              <label style={labelStyle}>Co-Leader</label>
              <select
                value={form.coLeaderId}
                onChange={(e) => setForm((f) => ({ ...f, coLeaderId: e.target.value }))}
                style={{ ...inputStyle, appearance: 'none' }}
              >
                <option value="">Select co-leader</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Meeting Location */}
            <div>
              <label style={labelStyle}>Meeting Location</label>
              <input
                type="text"
                placeholder="e.g. Hall B, Room 204"
                value={form.meetingLocation}
                onChange={(e) => setForm((f) => ({ ...f, meetingLocation: e.target.value }))}
                style={inputStyle}
              />
            </div>

            {/* Meeting Day */}
            <div>
              <label style={labelStyle}>Meeting Day</label>
              <input
                type="text"
                placeholder="e.g. Wednesday"
                value={form.meetingDay}
                onChange={(e) => setForm((f) => ({ ...f, meetingDay: e.target.value }))}
                style={inputStyle}
              />
            </div>

            {/* Meeting Time */}
            <div>
              <label style={labelStyle}>Meeting Time</label>
              <input
                type="text"
                placeholder="e.g. 19:00"
                value={form.meetingTime}
                onChange={(e) => setForm((f) => ({ ...f, meetingTime: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Drawer footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid rgb(var(--inv) / 0.08)',
            display: 'flex',
            gap: 12,
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={() => { setDrawerOpen(false); setForm(emptyForm) }}
            style={{
              backgroundColor: 'transparent',
              color: 'rgb(var(--inv) / 0.6)',
              border: '1px solid rgb(var(--inv) / 0.15)',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            style={{
              background: createMutation.isPending ? 'rgba(124,107,255,0.5)' : 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              color: 'var(--text-primary)',
              border: 'none',
              borderRadius: 10,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 600,
              cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
            }}
          >
            {createMutation.isPending ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
      </div>}
    </div>
  )
}
