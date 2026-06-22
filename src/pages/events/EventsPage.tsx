import { useState } from 'react'
import { Link } from 'react-router-dom'
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

interface Event {
  id: string
  name: string
  description?: string
  eventType?: string
  startDate: string
  endDate?: string
  location?: string
  maxCapacity?: number
  registrationCount?: number
  budgetAllocated?: number
  budgetSpent?: number
  status?: string
}

const EVENT_TYPES = [
  'SUNDAY_SERVICE',
  'CONFERENCE',
  'CRUSADE',
  'RETREAT',
  'CAMP',
  'WEDDING',
  'FUNERAL',
  'TRAINING',
] as const
type EventType = typeof EVENT_TYPES[number]

const schema = z.object({
  name: z.string().min(1, 'Event name is required'),
  eventType: z.string().min(1, 'Event type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  location: z.string().optional(),
  maxCapacity: z.coerce.number().optional(),
  budgetAllocated: z.coerce.number().optional(),
  description: z.string().optional(),
})

type FormData = z.infer<typeof schema>

function typeBadgeStyle(type?: string): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  }
  switch (type) {
    case 'SUNDAY_SERVICE': return { ...base, background: 'rgba(99,102,241,0.18)',  color: '#a5b4fc' }
    case 'CONFERENCE':     return { ...base, background: 'rgba(59,130,246,0.18)',  color: '#93c5fd' }
    case 'CRUSADE':        return { ...base, background: 'rgba(245,158,11,0.18)',  color: '#fcd34d' }
    case 'RETREAT':        return { ...base, background: 'rgba(16,185,129,0.18)',  color: '#6ee7b7' }
    case 'CAMP':           return { ...base, background: 'rgba(20,184,166,0.18)',  color: '#5eead4' }
    case 'WEDDING':        return { ...base, background: 'rgba(236,72,153,0.18)',  color: '#f9a8d4' }
    case 'FUNERAL':        return { ...base, background: 'rgba(100,116,139,0.18)', color: '#cbd5e1' }
    case 'TRAINING':       return { ...base, background: 'rgba(139,92,246,0.18)', color: '#c4b5fd' }
    default:               return { ...base, background: 'rgba(100,116,139,0.14)', color: TEXT_MUTED }
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

function formatEventType(t: string) {
  return t.replace(/_/g, ' ')
}

export function EventsPage() {
  const queryClient = useQueryClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [typeFilter, setTypeFilter] = useState<'ALL' | EventType>('ALL')

  const toQS = (obj: Record<string, unknown>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) p.append(k, String(v)) }); return p.toString() }

  const { data: eventsData, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const res = await api.get('/api/events')
      return res.data as { events: Event[] }
    },
  })

  const createMutation = useMutation({
    mutationFn: (d: FormData) => api.post(`/api/events?${toQS(d as unknown as Record<string, unknown>)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setDrawerOpen(false)
      form.reset()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/events/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  })

  const form = useForm<FormData>({ resolver: zodResolver(schema) })

  const events = eventsData?.events ?? []
  const filtered = typeFilter === 'ALL' ? events : events.filter(e => e.eventType === typeFilter)

  return (
    <div style={{ minHeight: '100vh', background: PAGE_BG, color: TEXT, padding: '32px 24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: TEXT, margin: 0 }}>Event Programs</h1>
          <p style={{ fontSize: '13px', color: TEXT_MUTED, marginTop: '4px' }}>Services · Conferences · Crusades</p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
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
          <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span> New Event
        </button>
      </div>

      {/* Event type filter pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {(['ALL', ...EVENT_TYPES] as const).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            style={{
              padding: '6px 16px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: `1px solid ${typeFilter === t ? ACCENT : BORDER}`,
              background: typeFilter === t ? 'rgba(124,107,255,0.18)' : 'transparent',
              color: typeFilter === t ? '#a5b4fc' : TEXT_MUTED,
              transition: 'all 0.15s',
              whiteSpace: 'nowrap',
            }}
          >
            {t === 'ALL' ? 'ALL' : formatEventType(t)}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div style={{ color: TEXT_MUTED, padding: '60px 0', textAlign: 'center' }}>Loading events...</div>
      ) : filtered.length === 0 ? (
        <div style={{ color: TEXT_MUTED, padding: '60px 0', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📅</div>
          <div style={{ fontWeight: 600, color: TEXT }}>No events found</div>
          <div style={{ fontSize: '13px', marginTop: '4px' }}>Schedule your first event program</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: `1px solid ${BORDER}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${BORDER}` }}>
                {['Event Program', 'Type', 'Date & Schedule', 'Location', 'Registrations', 'Budget', 'Actions'].map(col => (
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
              {filtered.map((e, i) => {
                const budgetPct = e.budgetAllocated && e.budgetAllocated > 0
                  ? Math.min(100, Math.round(((e.budgetSpent ?? 0) / e.budgetAllocated) * 100))
                  : 0

                return (
                  <tr
                    key={e.id}
                    style={{
                      background: CARD,
                      borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={ev => (ev.currentTarget.style.background = '#171934')}
                    onMouseLeave={ev => (ev.currentTarget.style.background = CARD)}
                  >
                    {/* Event Program */}
                    <td style={{ padding: '14px 16px', maxWidth: '220px' }}>
                      <div style={{ fontWeight: 600, color: TEXT, fontSize: '14px' }}>{e.name}</div>
                      {e.description && (
                        <div style={{ fontSize: '12px', color: TEXT_MUTED, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.description}
                        </div>
                      )}
                    </td>

                    {/* Type badge */}
                    <td style={{ padding: '14px 16px' }}>
                      {e.eventType
                        ? <span style={typeBadgeStyle(e.eventType)}>{formatEventType(e.eventType)}</span>
                        : <span style={{ color: TEXT_MUTED, fontSize: '13px' }}>—</span>
                      }
                    </td>

                    {/* Date & Schedule */}
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: TEXT, whiteSpace: 'nowrap' }}>
                      <div>{new Date(e.startDate).toLocaleString()}</div>
                      {e.endDate && (
                        <div style={{ color: TEXT_MUTED, fontSize: '12px', marginTop: '2px' }}>
                          to {new Date(e.endDate).toLocaleString()}
                        </div>
                      )}
                    </td>

                    {/* Location */}
                    <td style={{ padding: '14px 16px', color: TEXT_MUTED, fontSize: '13px', maxWidth: '160px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {e.location ?? '—'}
                      </div>
                    </td>

                    {/* Registrations */}
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: TEXT, whiteSpace: 'nowrap' }}>
                      {e.maxCapacity
                        ? (
                          <span>
                            <span style={{ fontWeight: 600 }}>{(e.registrationCount ?? 0).toLocaleString()}</span>
                            <span style={{ color: TEXT_MUTED }}>/{e.maxCapacity.toLocaleString()}</span>
                          </span>
                        )
                        : <span style={{ color: TEXT_MUTED }}>{(e.registrationCount ?? 0).toLocaleString()}</span>
                      }
                    </td>

                    {/* Budget progress */}
                    <td style={{ padding: '14px 16px', minWidth: '140px' }}>
                      {e.budgetAllocated ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '12px', color: TEXT_MUTED }}>
                              ₦{(e.budgetSpent ?? 0).toLocaleString()}
                            </span>
                            <span style={{ fontSize: '12px', color: TEXT_MUTED }}>
                              ₦{e.budgetAllocated.toLocaleString()}
                            </span>
                          </div>
                          <div style={{ height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '999px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${budgetPct}%`,
                                background: budgetPct >= 90
                                  ? 'linear-gradient(90deg,#f87171,#ef4444)'
                                  : budgetPct >= 60
                                    ? 'linear-gradient(90deg,#fcd34d,#f59e0b)'
                                    : `linear-gradient(90deg,${ACCENT},${ACCENT_DARK})`,
                                borderRadius: '999px',
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                          <div style={{ fontSize: '11px', color: TEXT_MUTED, marginTop: '3px' }}>{budgetPct}% used</div>
                        </div>
                      ) : (
                        <span style={{ color: TEXT_MUTED, fontSize: '13px' }}>—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Link
                          to={`/events/${e.id}`}
                          style={{
                            background: 'rgba(124,107,255,0.12)',
                            color: '#a5b4fc',
                            border: '1px solid rgba(124,107,255,0.25)',
                            borderRadius: '6px',
                            padding: '5px 14px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            textDecoration: 'none',
                            display: 'inline-block',
                          }}
                        >
                          Manage
                        </Link>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${e.name}"?`)) {
                              deleteMutation.mutate(e.id)
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          style={{
                            background: 'rgba(239,68,68,0.10)',
                            color: '#fca5a5',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Event Modal ── */}
      {drawerOpen && <div onClick={() => { setDrawerOpen(false); form.reset() }} style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />}
      {drawerOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
      <div
        style={{
          backgroundColor: DRAWER_BG,
          borderRadius: 24,
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          border: `1px solid rgba(255,255,255,0.1)`,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ padding: '24px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0 }}>
          <h2 style={{ color: TEXT, fontSize: '18px', fontWeight: 700, margin: 0 }}>New Event</h2>
          <p style={{ color: TEXT_MUTED, fontSize: '13px', marginTop: '4px' }}>Schedule a new church event program</p>
        </div>

        <form
          onSubmit={form.handleSubmit(d => createMutation.mutate(d))}
          style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}
        >
          <div>
            <label style={labelStyle}>Event Name *</label>
            <input {...form.register('name')} placeholder="e.g. Annual Conference 2026" style={inputStyle} />
            {form.formState.errors.name && (
              <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{form.formState.errors.name.message}</p>
            )}
          </div>

          <div>
            <label style={labelStyle}>Event Type *</label>
            <select {...form.register('eventType')} style={{ ...inputStyle, appearance: 'none' }}>
              <option value="">Select type...</option>
              {EVENT_TYPES.map(t => (
                <option key={t} value={t}>{formatEventType(t)}</option>
              ))}
            </select>
            {form.formState.errors.eventType && (
              <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{form.formState.errors.eventType.message}</p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Start Date *</label>
              <input {...form.register('startDate')} type="datetime-local" style={inputStyle} />
              {form.formState.errors.startDate && (
                <p style={{ color: '#f87171', fontSize: '12px', marginTop: '4px' }}>{form.formState.errors.startDate.message}</p>
              )}
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input {...form.register('endDate')} type="datetime-local" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <input {...form.register('location')} placeholder="Venue or address" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Max Capacity</label>
              <input {...form.register('maxCapacity')} type="number" min={0} placeholder="e.g. 500" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Budget Allocated (₦)</label>
              <input {...form.register('budgetAllocated')} type="number" min={0} placeholder="e.g. 200000" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              {...form.register('description')}
              placeholder="Brief description of the event..."
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: 'auto', paddingTop: '8px' }}>
            <button
              type="button"
              onClick={() => { setDrawerOpen(false); form.reset() }}
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
              {createMutation.isPending ? 'Creating...' : 'Save Event'}
            </button>
          </div>
        </form>
      </div>
      </div>}
    </div>
  )
}
