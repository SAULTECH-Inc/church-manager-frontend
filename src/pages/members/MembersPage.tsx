import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Search, Download, Upload, Plus, Users, X, ChevronRight, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { formatDate, getInitials } from '@/lib/utils'

interface Member {
  id: string
  fullName: string
  email?: string
  phoneNumber?: string
  gender?: string
  dateOfBirth?: string
  maritalStatus?: string
  occupation?: string
  nationality?: string
  emergencyContact?: string
  baptismDate?: string
  baptismType?: string
  confirmationDate?: string
  membershipStatus: string
  membershipType?: string
  memberCategory?: string
  createdAt: string
  dateJoined?: string
}

const defaultForm = {
  fullName: '',
  email: '',
  phoneNumber: '',
  gender: '',
  maritalStatus: '',
  dateOfBirth: '',
  occupation: '',
  nationality: '',
  emergencyContact: '',
  baptismDate: '',
  membershipStatus: 'ACTIVE',
  membershipType: '',
  memberCategory: '',
}

function statusBadgeStyle(status: string): React.CSSProperties {
  if (status === 'ACTIVE') return { backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399' }
  if (status === 'INACTIVE') return { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
  if (status === 'PENDING') return { backgroundColor: 'rgba(245,158,11,0.15)', color: '#fbbf24' }
  return { backgroundColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }
}

const badgeBase: React.CSSProperties = {
  borderRadius: 20,
  padding: '2px 10px',
  fontSize: 11,
  fontWeight: 600,
  display: 'inline-block',
}

const inputStyle: React.CSSProperties = {
  backgroundColor: '#1e2248',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 10,
  color: 'white',
  padding: '8px 12px',
  width: '100%',
  fontSize: 14,
  outline: 'none',
}

const labelStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.3)',
  fontSize: 12,
  fontWeight: 600,
  display: 'block',
  marginBottom: 6,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

export function MembersPage() {
  const [activeTab, setActiveTab] = useState<'members' | 'baptism'>('members')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [exportMenu, setExportMenu] = useState(false)
  const [form, setForm] = useState(defaultForm)

  const { data, isLoading } = useQuery({
    queryKey: ['members'],
    queryFn: () => api.get('/api/members').then(r => r.data as { members: Member[] }),
  })

  const createMutation = useMutation({
    mutationFn: (formData: typeof defaultForm) => {
      const clean = Object.fromEntries(Object.entries(formData).filter(([, v]) => v !== '' && v !== null && v !== undefined))
      return api.post('/api/members', clean)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      setAddOpen(false)
      setForm(defaultForm)
    },
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/members/${id}/toggle-status`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['members'] }),
  })

  const handleImport = async () => {
    if (!importFile) return
    const fd = new FormData()
    fd.append('file', importFile)
    await api.post('/api/members/import', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    queryClient.invalidateQueries({ queryKey: ['members'] })
    setImportOpen(false)
    setImportFile(null)
  }

  const members = data?.members ?? []
  const filtered = members.filter(m => {
    const q = search.toLowerCase()
    return (
      m.fullName.toLowerCase().includes(q) ||
      (m.email ?? '').toLowerCase().includes(q) ||
      (m.phoneNumber ?? '').includes(q)
    )
  })

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const allSelected = filtered.length > 0 && filtered.every(m => selected.includes(m.id))
  const toggleAll = () => {
    if (allSelected) setSelected([])
    else setSelected(filtered.map(m => m.id))
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#131326', padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 700, margin: 0 }}>Members Directory</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 4 }}>
            Manage church membership, track baptisms and confirmations
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
            <input
              type="text"
              placeholder="Search members..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                ...inputStyle,
                width: 220,
                paddingLeft: 36,
                borderRadius: 12,
                padding: '8px 14px 8px 36px',
              }}
            />
          </div>
          {/* Export dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setExportMenu(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                backgroundColor: 'rgba(16,185,129,0.15)',
                color: '#34d399',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              <Download size={14} /> Export <ChevronDown size={13} />
            </button>
            {exportMenu && (
              <div style={{ position: 'absolute', right: 0, top: '110%', backgroundColor: '#1a1b3a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, overflow: 'hidden', zIndex: 50, minWidth: 130 }}>
                {['xlsx', 'csv', 'pdf'].map(fmt => (
                  <button key={fmt} onClick={() => { window.location.href = `/api/members/export?format=${fmt}`; setExportMenu(false) }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 16px', background: 'none', border: 'none', color: 'white', fontSize: 13, cursor: 'pointer' }}>
                    {fmt.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Import */}
          <button
            onClick={() => setImportOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              backgroundColor: 'rgba(99,102,241,0.15)',
              color: '#818cf8',
              border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            <Upload size={14} /> Import
          </button>
          {/* Add Member */}
          <button
            onClick={() => setAddOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(135deg, #7c6bff, #6456e8)',
              color: '#fff',
              border: 'none',
              borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >
            <Plus size={14} /> Add Member
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 }}>
        {(['members', 'baptism'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #7c6bff' : '2px solid transparent',
              color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.5)',
              fontWeight: activeTab === tab ? 600 : 400,
              fontSize: 14,
              padding: '10px 20px',
              cursor: 'pointer',
              marginBottom: -1,
              transition: 'color 0.2s',
            }}
          >
            {tab === 'members' ? 'Members Directory' : 'Baptism & Confirmation'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ backgroundColor: '#13152e', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className="animate-pulse" style={{ height: 52, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(124,107,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Users size={28} style={{ color: '#7c6bff' }} />
            </div>
            <p style={{ color: 'white', fontWeight: 600, fontSize: 16 }}>No members yet</p>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginTop: 4 }}>Add your first member to get started</p>
            <button
              onClick={() => setAddOpen(true)}
              style={{ marginTop: 16, background: 'linear-gradient(135deg, #7c6bff, #6456e8)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}
            >
              Add First Member
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            {activeTab === 'members' ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', width: 36 }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        style={{ accentColor: '#7c6bff', cursor: 'pointer' }}
                      />
                    </th>
                    {['Name', 'Contact Details', 'Gender & Category', 'Role & Status', 'Joined Date', ''].map(col => (
                      <th key={col} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr
                      key={m.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <input
                          type="checkbox"
                          checked={selected.includes(m.id)}
                          onChange={() => toggleSelect(m.id)}
                          style={{ accentColor: '#7c6bff', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c6bff, #6456e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                            {getInitials(m.fullName)}
                          </div>
                          <div>
                            <div style={{ color: 'white', fontWeight: 600 }}>{m.fullName}</div>
                            {m.occupation && <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>{m.occupation}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{m.email || '—'}</div>
                        {m.phoneNumber && <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>{m.phoneNumber}</div>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.7)' }}>{m.gender || '—'}</div>
                        {m.memberCategory && <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, marginTop: 2 }}>{m.memberCategory}</div>}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontSize: 12 }}>{m.membershipType || '—'}</div>
                        <span style={{ ...badgeBase, ...statusBadgeStyle(m.membershipStatus) }}>{m.membershipStatus}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>
                        {formatDate(m.dateJoined ?? m.createdAt)}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <Link to={`/members/${m.id}`} style={{ color: '#7c6bff', fontSize: 13, fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                          View <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', width: 36 }}>
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ accentColor: '#7c6bff', cursor: 'pointer' }} />
                    </th>
                    {['Name', 'Baptism Date', 'Baptism Type', 'Confirmation Date', 'Status', ''].map(col => (
                      <th key={col} style={{ padding: '12px 16px', textAlign: 'left', color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(m => (
                    <tr
                      key={m.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <input type="checkbox" checked={selected.includes(m.id)} onChange={() => toggleSelect(m.id)} style={{ accentColor: '#7c6bff', cursor: 'pointer' }} />
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #7c6bff, #6456e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
                            {getInitials(m.fullName)}
                          </div>
                          <span style={{ color: 'white', fontWeight: 600 }}>{m.fullName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.7)' }}>
                        {m.baptismDate ? formatDate(m.baptismDate) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {m.baptismType ? (
                          <span style={{
                            ...badgeBase,
                            ...(m.baptismType === 'WATER'
                              ? { backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa' }
                              : { backgroundColor: 'rgba(168,85,247,0.15)', color: '#c084fc' }),
                          }}>
                            {m.baptismType === 'WATER' ? 'Water' : 'Holy Ghost'}
                          </span>
                        ) : <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.7)' }}>
                        {m.confirmationDate ? formatDate(m.confirmationDate) : '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ ...badgeBase, ...statusBadgeStyle(m.membershipStatus) }}>{m.membershipStatus}</span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <Link to={`/members/${m.id}`} style={{ color: '#7c6bff', fontSize: 13, fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
                          View <ChevronRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
          backgroundColor: '#1a1b3a',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <span style={{ color: 'white', fontWeight: 600, fontSize: 14, flex: 1 }}>
            {selected.length} selected
          </span>
          <button
            onClick={() => selected.forEach(id => toggleMutation.mutate(id))}
            style={{
              backgroundColor: 'rgba(245,158,11,0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245,158,11,0.2)',
              borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            }}
          >
            Deactivate Selected
          </button>
          <button
            onClick={() => setSelected([])}
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
            }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Add Member Modal */}
      {addOpen && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setAddOpen(false)} />
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
            <div style={{ backgroundColor: '#1a1b3a', borderRadius: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', pointerEvents: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                <h2 style={{ color: 'white', fontWeight: 700, fontSize: 18, margin: 0 }}>Add New Member</h2>
                <button onClick={() => setAddOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Full Name *</label>
                    <input style={inputStyle} value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} placeholder="John Doe" />
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="email" style={inputStyle} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input style={inputStyle} value={form.phoneNumber} onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))} placeholder="+234..." />
                  </div>
                  <div>
                    <label style={labelStyle}>Gender *</label>
                    <select style={{ ...inputStyle, appearance: 'none' as const }} value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Marital Status *</label>
                    <select style={{ ...inputStyle, appearance: 'none' as const }} value={form.maritalStatus} onChange={e => setForm(f => ({ ...f, maritalStatus: e.target.value }))}>
                      <option value="">Select status</option>
                      <option value="SINGLE">Single</option>
                      <option value="MARRIED">Married</option>
                      <option value="DIVORCED">Divorced</option>
                      <option value="WIDOWED">Widowed</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Date of Birth *</label>
                    <input type="date" style={{ ...inputStyle, colorScheme: 'dark' as const }} value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                  </div>
                  <div>
                    <label style={labelStyle}>Occupation</label>
                    <input style={inputStyle} value={form.occupation} onChange={e => setForm(f => ({ ...f, occupation: e.target.value }))} placeholder="e.g. Engineer" />
                  </div>
                  <div>
                    <label style={labelStyle}>Nationality</label>
                    <input style={inputStyle} value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} placeholder="e.g. Nigerian" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Emergency Contact</label>
                    <input style={inputStyle} value={form.emergencyContact} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} placeholder="Name and phone number" />
                  </div>
                  <div>
                    <label style={labelStyle}>Baptism Date</label>
                    <input style={inputStyle} value={form.baptismDate} onChange={e => setForm(f => ({ ...f, baptismDate: e.target.value }))} placeholder="Dec 25, 2020" />
                  </div>
                  <div>
                    <label style={labelStyle}>Membership Status *</label>
                    <select style={{ ...inputStyle, appearance: 'none' as const }} value={form.membershipStatus} onChange={e => setForm(f => ({ ...f, membershipStatus: e.target.value }))}>
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Membership Type *</label>
                    <select style={{ ...inputStyle, appearance: 'none' as const }} value={form.membershipType} onChange={e => setForm(f => ({ ...f, membershipType: e.target.value }))}>
                      <option value="">Select type</option>
                      <option value="REGULAR_MEMBER">Regular Member</option>
                      <option value="WORKER">Worker</option>
                      <option value="VOLUNTEER">Volunteer</option>
                      <option value="MINISTER">Minister</option>
                      <option value="PASTOR">Pastor</option>
                      <option value="EVANGELIST">Evangelist</option>
                      <option value="MISSIONARY">Missionary</option>
                      <option value="ELDER">Elder</option>
                      <option value="DEACON">Deacon</option>
                      <option value="DEACONESS">Deaconess</option>
                      <option value="VISITOR">Visitor</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Member Category *</label>
                    <select style={{ ...inputStyle, appearance: 'none' as const }} value={form.memberCategory} onChange={e => setForm(f => ({ ...f, memberCategory: e.target.value }))}>
                      <option value="">Select category</option>
                      <option value="ADULT">Adult</option>
                      <option value="YOUTH">Youth</option>
                      <option value="CHILDREN">Children</option>
                      <option value="SENIOR">Senior</option>
                      <option value="NEW_CONVERT">New Convert</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 12, justifyContent: 'flex-end', flexShrink: 0 }}>
                <button
                  onClick={() => { setAddOpen(false); setForm(defaultForm) }}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  disabled={createMutation.isPending}
                  onClick={() => createMutation.mutate(form)}
                  style={{ background: 'linear-gradient(135deg, #7c6bff, #6456e8)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 13, opacity: createMutation.isPending ? 0.7 : 1 }}
                >
                  {createMutation.isPending ? 'Saving...' : 'Save Member'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Import Modal */}
      {importOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div style={{ backgroundColor: '#1a1b3a', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', width: 440, padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: 18, margin: 0 }}>Import Members</h2>
              <button onClick={() => setImportOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center' }}>
                <X size={20} />
              </button>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
              Download our template to format your data correctly.{' '}
              <a href="/api/members/import/template" style={{ color: '#7c6bff', textDecoration: 'none', fontWeight: 600 }}>
                Download Template
              </a>
            </p>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Select File</label>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={e => setImportFile(e.target.files?.[0] ?? null)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              />
              {importFile && (
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 8 }}>
                  Selected: {importFile.name}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setImportOpen(false); setImportFile(null) }}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'white', borderRadius: 10, padding: '9px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                disabled={!importFile}
                onClick={handleImport}
                style={{ background: 'linear-gradient(135deg, #7c6bff, #6456e8)', color: 'white', border: 'none', borderRadius: 10, padding: '9px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 13, opacity: !importFile ? 0.5 : 1 }}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
