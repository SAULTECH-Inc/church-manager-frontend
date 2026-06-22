import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { api } from '@/api/client'

// Design system constants
const PAGE_BG = '#131326'
const CARD = '#13152e'
const DRAWER_BG = '#1a1b3a'
const INPUT_BG = '#1e2248'
const BORDER = 'rgba(255,255,255,0.08)'
const ACCENT = '#7c6bff'
const ACCENT_DARK = '#6456e8'
const TEXT = '#e2e8f0'
const TEXT_MUTED = '#94a3b8'

interface Branch {
  id: string
  name: string
  description?: string
  level?: string
  parentBranchId?: string
  parentBranch?: { name: string }
  leaderId?: string
  leader?: { fullName: string }
  address?: string
  email?: string
  phone?: string
  memberCount?: number
  totalGivings?: number
}

interface Member {
  id: string
  fullName: string
}

const LEVELS = ['HEADQUARTER', 'REGION', 'DIOCESE', 'DISTRICT', 'PARISH', 'BRANCH'] as const
type Level = typeof LEVELS[number]

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  level: z.string().optional(),
  parentBranchId: z.string().optional(),
  leaderId: z.string().optional(),
  address: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function levelBadgeStyle(level?: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  }
  switch (level) {
    case 'HEADQUARTER': return { ...base, background: 'rgba(99,102,241,0.18)', color: '#a5b4fc' }
    case 'REGION':      return { ...base, background: 'rgba(59,130,246,0.18)', color: '#93c5fd' }
    case 'DIOCESE':     return { ...base, background: 'rgba(139,92,246,0.18)', color: '#c4b5fd' }
    case 'DISTRICT':    return { ...base, background: 'rgba(245,158,11,0.18)', color: '#fcd34d' }
    case 'PARISH':      return { ...base, background: 'rgba(16,185,129,0.18)', color: '#6ee7b7' }
    case 'BRANCH':      return { ...base, background: 'rgba(100,116,139,0.18)', color: '#cbd5e1' }
    default:            return { ...base, background: 'rgba(100,116,139,0.14)', color: TEXT_MUTED }
  }
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: INPUT_BG,
  border: `1px solid ${BORDER}`,
  borderRadius: '8px',
  padding: '8px 12px',
  color: TEXT,
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  color: TEXT_MUTED,
  marginBottom: '5px',
  fontWeight: 500,
}

export function BranchesPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editBranch, setEditBranch] = useState<Branch | null>(null)
  const [levelFilter, setLevelFilter] = useState<'ALL' | Level>('ALL')

  const toQS = (obj: Record<string, string | undefined>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v) p.append(k, v) }); return p.toString() }

  const { data: branchesData, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/api/branches')
      return res.data as { branches: Branch[] }
    },
  })

  const { data: membersData } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await api.get('/api/members')
      return res.data as { members: Member[] }
    },
  })

  const createMutation = useMutation({
    mutationFn: (d: FormData) => api.post(`/api/branches?${toQS(d)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      setCreateOpen(false)
      createForm.reset()
    },
  })

  const editMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FormData }) => api.post(`/api/branches/${id}/edit?${toQS(data)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      setEditBranch(null)
      editForm.reset()
    },
  })

  const createForm = useForm<FormData>({ resolver: zodResolver(schema) })
  const editForm = useForm<FormData>({ resolver: zodResolver(schema) })

  const branches = branchesData?.branches ?? []
  const members = membersData?.members ?? []
  const filtered = levelFilter === 'ALL' ? branches : branches.filter(b => b.level === levelFilter)

  const openEdit = (b: Branch) => {
    setEditBranch(b)
    editForm.reset({
      name: b.name,
      description: b.description ?? '',
      level: b.level ?? '',
      parentBranchId: b.parentBranchId ?? '',
      leaderId: b.leaderId ?? '',
      address: b.address ?? '',
      email: b.email ?? '',
      phone: b.phone ?? '',
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: PAGE_BG, color: TEXT, padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: TEXT, margin: 0 }}>Offices & Jurisdictions</h1>
          <p style={{ fontSize: '13px', color: TEXT_MUTED, marginTop: '4px' }}>Branches · Dioceses · Districts · Parishes</p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          style={{
            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '9px 18px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> Create Office
        </button>
      </div>

      {/* Level filter tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {(['ALL', ...LEVELS] as const).map(lv => (
          <button
            key={lv}
            onClick={() => setLevelFilter(lv)}
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${levelFilter === lv ? ACCENT : BORDER}`,
              background: levelFilter === lv ? 'rgba(124,107,255,0.18)' : 'transparent',
              color: levelFilter === lv ? '#a5b4fc' : TEXT_MUTED,
              transition: 'all 0.15s',
            }}
          >
            {lv}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ color: TEXT_MUTED, padding: '60px 0', textAlign: 'center' }}>Loading offices...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: TEXT_MUTED, padding: '60px 0', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏛️</div>
          <div style={{ fontWeight: 600, color: TEXT }}>No offices found</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>Create your first office or jurisdiction</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: `1px solid ${BORDER}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${BORDER}` }}>
                {['Office / Jurisdiction', 'Level', 'Overseer / Bishop', 'Parent Jurisdiction', 'Roster Size', 'Total Givings', 'Actions'].map(col => (
                  <th
                    key={col}
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: TEXT_MUTED,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b, i) => (
                <tr
                  key={b.id}
                  style={{
                    background: CARD,
                    borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#171934')}
                  onMouseLeave={e => (e.currentTarget.style.background = CARD)}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600, color: TEXT, fontSize: '14px' }}>{b.name}</div>
                    {b.description && (
                      <div style={{ fontSize: '12px', color: TEXT_MUTED, marginTop: '2px' }}>{b.description}</div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {b.level
                      ? <span style={levelBadgeStyle(b.level)}>{b.level}</span>
                      : <span style={{ color: TEXT_MUTED, fontSize: '13px' }}>—</span>
                    }
                  </td>
                  <td style={{ padding: '14px 16px', color: TEXT, fontSize: '13px' }}>
                    {b.leader?.fullName ?? <span style={{ color: TEXT_MUTED }}>—</span>}
                  </td>
                  <td style={{ padding: '14px 16px', color: TEXT_MUTED, fontSize: '13px' }}>
                    {b.parentBranch?.name ?? '—'}
                  </td>
                  <td style={{ padding: '14px 16px', color: TEXT, fontSize: '13px', fontWeight: 500 }}>
                    {(b.memberCount ?? 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px', color: '#6ee7b7', fontSize: '13px', fontWeight: 500 }}>
                    ₦{(b.totalGivings ?? 0).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() => openEdit(b)}
                      style={{
                        background: 'rgba(124,107,255,0.12)',
                        color: '#a5b4fc',
                        border: '1px solid rgba(124,107,255,0.25)',
                        borderRadius: '6px',
                        padding: '5px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Office Modal ── */}
      {createOpen && <div onClick={() => { setCreateOpen(false); createForm.reset() }} style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />}
      {createOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
      <div
        style={{
          backgroundColor: DRAWER_BG,
          borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '90vh',
          border: `1px solid rgba(255,255,255,0.1)`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ padding: '24px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <h2 style={{ color: TEXT, fontSize: '18px', fontWeight: 700, margin: 0 }}>Create Office</h2>
          <p style={{ color: TEXT_MUTED, fontSize: '13px', marginTop: '4px' }}>Add a new branch or jurisdiction</p>
        </div>
        <form
          onSubmit={createForm.handleSubmit(d => createMutation.mutate(d))}
          style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}
        >
          <div>
            <label style={labelStyle}>Office Name *</label>
            <input {...createForm.register('name')} placeholder="e.g. Lagos Diocese" style={inputStyle} />
            {createForm.formState.errors.name && (
              <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{createForm.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              {...createForm.register('description')}
              placeholder="Brief description..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Level</label>
            <select {...createForm.register('level')} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="">Select level...</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Parent Jurisdiction</label>
            <select {...createForm.register('parentBranchId')} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="">None (top-level)</option>
              {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Overseer / Leader</label>
            <select {...createForm.register('leaderId')} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="">Select leader...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Address</label>
            <input {...createForm.register('address')} placeholder="Street address" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input {...createForm.register('email')} type="email" placeholder="office@church.org" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input {...createForm.register('phone')} placeholder="+234..." style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '8px' }}>
            <button
              type="button"
              onClick={() => { setCreateOpen(false); createForm.reset() }}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                color: TEXT_MUTED,
                border: `1px solid ${BORDER}`,
                borderRadius: '8px',
                padding: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              style={{
                flex: 1,
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: createMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: createMutation.isPending ? 0.7 : 1,
              }}
            >
              {createMutation.isPending ? 'Saving...' : 'Save Office'}
            </button>
          </div>
        </form>
      </div>
      </div>}

      {/* ── Edit Office Modal ── */}
      {!!editBranch && <div onClick={() => { setEditBranch(null); editForm.reset() }} style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />}
      {!!editBranch && <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
      <div
        style={{
          backgroundColor: DRAWER_BG,
          borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '90vh',
          border: `1px solid rgba(255,255,255,0.1)`,
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ padding: '24px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <h2 style={{ color: TEXT, fontSize: '18px', fontWeight: 700, margin: 0 }}>Edit Office</h2>
          <p style={{ color: TEXT_MUTED, fontSize: '13px', marginTop: '4px' }}>Update jurisdiction details</p>
        </div>
        <form
          onSubmit={editForm.handleSubmit(d => editBranch && editMutation.mutate({ id: editBranch.id, data: d }))}
          style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}
        >
          <div>
            <label style={labelStyle}>Office Name *</label>
            <input {...editForm.register('name')} placeholder="e.g. Lagos Diocese" style={inputStyle} />
            {editForm.formState.errors.name && (
              <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{editForm.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              {...editForm.register('description')}
              placeholder="Brief description..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
          <div>
            <label style={labelStyle}>Level</label>
            <select {...editForm.register('level')} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="">Select level...</option>
              {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Parent Jurisdiction</label>
            <select {...editForm.register('parentBranchId')} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="">None (top-level)</option>
              {branches.filter(b => b.id !== editBranch?.id).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Overseer / Leader</label>
            <select {...editForm.register('leaderId')} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="">Select leader...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Address</label>
            <input {...editForm.register('address')} placeholder="Street address" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input {...editForm.register('email')} type="email" placeholder="office@church.org" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input {...editForm.register('phone')} placeholder="+234..." style={inputStyle} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '8px' }}>
            <button
              type="button"
              onClick={() => { setEditBranch(null); editForm.reset() }}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                color: TEXT_MUTED,
                border: `1px solid ${BORDER}`,
                borderRadius: '8px',
                padding: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editMutation.isPending}
              style={{
                flex: 1,
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DARK})`,
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: editMutation.isPending ? 'not-allowed' : 'pointer',
                opacity: editMutation.isPending ? 0.7 : 1,
              }}
            >
              {editMutation.isPending ? 'Updating...' : 'Update Office'}
            </button>
          </div>
        </form>
      </div>
      </div>}
    </div>
  )
}
