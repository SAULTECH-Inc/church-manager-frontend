import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Plus, Users, Calendar, MapPin, UserCheck, X, Search, Check } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { formatDate, getInitials } from '@/lib/utils'

// ─── Interfaces ────────────────────────────────────────────────────────────────

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
  createdAt?: string
}

interface GroupMember {
  id: string
  member: { id: string; fullName: string; email?: string; phoneNumber?: string }
  role: string
  joinedAt?: string
}

interface AttendanceSession {
  id: string
  meetingDate: string
  topic?: string
  notes?: string
}

interface AttendanceRollCall {
  memberId: string
  memberName: string
  present: boolean
}

interface GroupStats {
  memberCount: number
  averageAttendanceRate: number
  sessionsLogged: number
}

interface Member {
  id: string
  fullName: string
}

interface DetailData {
  group: Group
  groupMembers: GroupMember[]
  attendanceHistory: AttendanceSession[]
  attendanceDetailsMap: Record<string, AttendanceRollCall[]>
  groupStats: GroupStats
  allMembers: Member[]
  prospectiveMembers: Member[]
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function typeBadge(type: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    CELL_GROUP: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', label: 'Cell Group' },
    HOUSE_FELLOWSHIP: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', label: 'House Fellowship' },
    SMALL_GROUP: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', label: 'Small Group' },
    MINISTRY: { bg: 'rgba(168,85,247,0.15)', color: '#c084fc', label: 'Ministry' },
    DISCIPLESHIP_CLASS: { bg: 'rgba(124,107,255,0.15)', color: '#a78bfa', label: 'Discipleship Class' },
  }
  return map[type] ?? { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', label: type }
}

function roleBadge(role: string) {
  if (role === 'LEADER')
    return { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', label: 'Leader' }
  if (role === 'CO_LEADER')
    return { bg: 'rgba(99,102,241,0.15)', color: '#818cf8', label: 'Co-Leader' }
  return { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', label: 'Member' }
}

// ─── Drawer component ──────────────────────────────────────────────────────────

function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  if (!open) return null
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
      <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, pointerEvents: 'none' }}>
        <div style={{ backgroundColor: '#1a1b3a', borderRadius: 24, width: '100%', maxWidth: 520, maxHeight: '90vh', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden', pointerEvents: 'auto' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: 18, margin: 0 }}>{title}</h2>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            {children}
          </div>
          <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 12, justifyContent: 'flex-end', flexShrink: 0 }}>
            {footer}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Field helpers ─────────────────────────────────────────────────────────────

const fieldLabel: React.CSSProperties = {
  display: 'block',
  color: 'rgba(255,255,255,0.5)',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#1e2248',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 10,
  padding: '10px 14px',
  color: 'white',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  cursor: 'pointer',
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={fieldLabel}>{label}</label>
      {children}
    </div>
  )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326' }}>
      <div
        style={{
          height: 16,
          width: 140,
          borderRadius: 8,
          backgroundColor: 'rgba(255,255,255,0.08)',
          marginBottom: 24,
        }}
      />
      <div
        style={{
          backgroundColor: '#13152e',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: 28,
          marginBottom: 24,
        }}
      >
        {[200, 300, 160, 400].map((w, i) => (
          <div
            key={i}
            style={{
              height: i === 1 ? 32 : 14,
              width: w,
              borderRadius: 8,
              backgroundColor: 'rgba(255,255,255,0.08)',
              marginBottom: 16,
            }}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export function FellowshipDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'members' | 'attendance'>('members')
  const [memberSearch, setMemberSearch] = useState('')
  const [editDrawerOpen, setEditDrawerOpen] = useState(false)
  const [addMemberDrawerOpen, setAddMemberDrawerOpen] = useState(false)
  const [rollCallModal, setRollCallModal] = useState<string | null>(null)
  const [removeConfirmId, setRemoveConfirmId] = useState<string | null>(null)

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    type: '',
    leaderId: '',
    coLeaderId: '',
    meetingLocation: '',
    meetingDay: '',
    meetingTime: '',
  })

  const [addMemberForm, setAddMemberForm] = useState({
    memberId: '',
    role: 'MEMBER',
  })

  // ── Query ──────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery({
    queryKey: ['fellowship', id],
    queryFn: () =>
      api.get(`/api/fellowships/${id}`).then((r) => r.data as DetailData),
    enabled: !!id,
  })

  // Populate edit form when data loads
  useEffect(() => {
    if (data?.group) {
      const g = data.group
      setEditForm({
        name: g.name ?? '',
        description: g.description ?? '',
        type: g.type ?? '',
        leaderId: g.leader?.id ?? '',
        coLeaderId: g.coLeader?.id ?? '',
        meetingLocation: g.meetingLocation ?? '',
        meetingDay: g.meetingDay ?? '',
        meetingTime: g.meetingTime ?? '',
      })
    }
  }, [data?.group])

  // ── Mutations ──────────────────────────────────────────────────────────────
  const toQS = (obj: Record<string, string>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v) p.append(k, v) }); return p.toString() }

  const editMutation = useMutation({
    mutationFn: () => api.post(`/api/fellowships/${id}/edit?${toQS(editForm)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fellowship', id] })
      setEditDrawerOpen(false)
    },
  })

  const addMemberMutation = useMutation({
    mutationFn: () => api.post(`/api/fellowships/${id}/members?${toQS(addMemberForm)}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fellowship', id] })
      setAddMemberDrawerOpen(false)
      setAddMemberForm({ memberId: '', role: 'MEMBER' })
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      api.post(`/api/fellowships/${id}/members/remove?memberId=${memberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fellowship', id] })
      setRemoveConfirmId(null)
    },
  })

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading || !data) return <Skeleton />

  const { group, groupMembers, attendanceHistory, attendanceDetailsMap, groupStats, allMembers, prospectiveMembers } = data

  const badge = typeBadge(group.type)

  const filteredMembers = groupMembers.filter(
    (gm) =>
      !memberSearch ||
      gm.member.fullName.toLowerCase().includes(memberSearch.toLowerCase()) ||
      (gm.member.email ?? '').toLowerCase().includes(memberSearch.toLowerCase()),
  )

  const rollCallSession = rollCallModal
    ? attendanceHistory.find((s) => s.id === rollCallModal)
    : null

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326' }}>

      {/* Back link */}
      <Link
        to="/fellowships"
        style={{
          color: '#7c6bff',
          textDecoration: 'none',
          fontSize: 14,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <ArrowLeft size={16} />
        Back to Fellowships
      </Link>

      {/* ── Banner card ────────────────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 20,
          backgroundColor: '#13152e',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: 28,
          display: 'flex',
          gap: 32,
          alignItems: 'flex-start',
        }}
      >
        {/* Left column */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Type badge + established date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span
              style={{
                backgroundColor: badge.bg,
                color: badge.color,
                borderRadius: 20,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {badge.label}
            </span>
            {group.createdAt && (
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
                Established {formatDate(group.createdAt)}
              </span>
            )}
          </div>

          {/* Group name */}
          <h1
            style={{
              color: 'white',
              fontWeight: 700,
              fontSize: 28,
              margin: '10px 0 4px',
              lineHeight: 1.2,
            }}
          >
            {group.name}
          </h1>

          {/* Description */}
          {group.description && (
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, margin: '0 0 16px' }}>
              {group.description}
            </p>
          )}

          {/* 4-box info grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 16,
              marginTop: 16,
            }}
          >
            {/* Location */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <MapPin size={14} color="rgba(255,255,255,0.4)" />
                <span
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Location
                </span>
              </div>
              <p style={{ color: 'white', fontSize: 13, fontWeight: 500, margin: 0 }}>
                {group.meetingLocation || '—'}
              </p>
            </div>

            {/* Schedule */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Calendar size={14} color="rgba(255,255,255,0.4)" />
                <span
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Schedule
                </span>
              </div>
              <p style={{ color: 'white', fontSize: 13, fontWeight: 500, margin: 0 }}>
                {group.meetingDay && group.meetingTime
                  ? `${group.meetingDay} @ ${group.meetingTime}`
                  : group.meetingDay || group.meetingTime || '—'}
              </p>
            </div>

            {/* Leader */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <UserCheck size={14} color="rgba(255,255,255,0.4)" />
                <span
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Leader
                </span>
              </div>
              <p style={{ color: 'white', fontSize: 13, fontWeight: 500, margin: 0 }}>
                {group.leader?.fullName || '—'}
              </p>
            </div>

            {/* Co-Leader */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Users size={14} color="rgba(255,255,255,0.4)" />
                <span
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Co-Leader
                </span>
              </div>
              <p style={{ color: 'white', fontSize: 13, fontWeight: 500, margin: 0 }}>
                {group.coLeader?.fullName || '—'}
              </p>
            </div>
          </div>

          {/* Edit button */}
          <button
            onClick={() => setEditDrawerOpen(true)}
            style={{
              marginTop: 20,
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              color: 'rgba(255,255,255,0.7)',
              fontSize: 13,
              fontWeight: 500,
              padding: '8px 16px',
              cursor: 'pointer',
            }}
          >
            Edit Group Details
          </button>
        </div>

        {/* Right column — stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>
          {/* Group Size */}
          <div
            style={{
              backgroundColor: 'rgba(124,107,255,0.1)',
              borderRadius: 16,
              padding: '16px 20px',
              textAlign: 'center',
              minWidth: 120,
            }}
          >
            <p style={{ color: 'white', fontWeight: 700, fontSize: 28, margin: 0 }}>
              {groupStats.memberCount}
            </p>
            <p
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                margin: '4px 0 0',
              }}
            >
              Members
            </p>
          </div>

          {/* Avg Attendance */}
          <div
            style={{
              backgroundColor: 'rgba(16,185,129,0.1)',
              borderRadius: 16,
              padding: '16px 20px',
              textAlign: 'center',
              minWidth: 120,
            }}
          >
            <p style={{ color: 'white', fontWeight: 700, fontSize: 28, margin: 0 }}>
              {groupStats.averageAttendanceRate.toFixed(0)}%
            </p>
            <p
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                margin: '4px 0 0',
              }}
            >
              Avg Attendance
            </p>
          </div>

          {/* Sessions */}
          <div
            style={{
              backgroundColor: 'rgba(245,158,11,0.1)',
              borderRadius: 16,
              padding: '16px 20px',
              textAlign: 'center',
              minWidth: 120,
            }}
          >
            <p style={{ color: 'white', fontWeight: 700, fontSize: 28, margin: 0 }}>
              {groupStats.sessionsLogged}
            </p>
            <p
              style={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                margin: '4px 0 0',
              }}
            >
              Sessions
            </p>
          </div>
        </div>
      </div>

      {/* ── Tab navigation ──────────────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 0,
        }}
      >
        {/* Tab buttons */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            onClick={() => setActiveTab('members')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'members' ? '2px solid #7c6bff' : '2px solid transparent',
              color: activeTab === 'members' ? 'white' : 'rgba(255,255,255,0.5)',
              fontSize: 14,
              fontWeight: activeTab === 'members' ? 600 : 400,
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            <Users size={16} />
            Members Directory
          </button>

          <button
            onClick={() => setActiveTab('attendance')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'attendance' ? '2px solid #7c6bff' : '2px solid transparent',
              color: activeTab === 'attendance' ? 'white' : 'rgba(255,255,255,0.5)',
              fontSize: 14,
              fontWeight: activeTab === 'attendance' ? 600 : 400,
              cursor: 'pointer',
              marginBottom: -1,
            }}
          >
            <Calendar size={16} />
            Attendance Logs
          </button>
        </div>

        {/* Action button */}
        <div>
          {activeTab === 'members' ? (
            <button
              onClick={() => setAddMemberDrawerOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                background: 'linear-gradient(135deg, #7c6bff, #6456e8)',
                border: 'none',
                borderRadius: 10,
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={15} />
              Add Member
            </button>
          ) : (
            <button
              onClick={() => navigate(`/fellowships/${id}/attendance/new`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 18px',
                background: 'transparent',
                border: '1px solid rgba(124,107,255,0.5)',
                borderRadius: 10,
                color: '#7c6bff',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Plus size={15} />
              Record Session
            </button>
          )}
        </div>
      </div>

      {/* ── Tab 1 — Members Directory ────────────────────────────────────────── */}
      {activeTab === 'members' && (
        <div style={{ marginTop: 20 }}>
          {/* Search */}
          <div style={{ position: 'relative', marginBottom: 16, maxWidth: 360 }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.35)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              placeholder="Search members..."
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              style={{
                ...inputStyle,
                paddingLeft: 36,
              }}
            />
          </div>

          {/* Table */}
          {filteredMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Users
                size={40}
                style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 12px' }}
              />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                {memberSearch ? 'No members match your search.' : 'No members in this group yet.'}
              </p>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#13152e',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Name', 'Email', 'Phone Number', 'Group Role', 'Date Joined', 'Remove'].map(
                      (col) => (
                        <th
                          key={col}
                          style={{
                            padding: '12px 16px',
                            color: 'rgba(255,255,255,0.4)',
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            textAlign: 'left',
                          }}
                        >
                          {col}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((gm) => {
                    const rb = roleBadge(gm.role)
                    return (
                      <tr
                        key={gm.id}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                      >
                        {/* Name */}
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 30,
                                height: 30,
                                borderRadius: 8,
                                background: 'linear-gradient(135deg, #7c6bff, #6456e8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 11,
                                fontWeight: 700,
                                color: 'white',
                                flexShrink: 0,
                              }}
                            >
                              {getInitials(gm.member.fullName)}
                            </div>
                            <div>
                              <p style={{ color: 'white', fontSize: 14, fontWeight: 500, margin: 0 }}>
                                {gm.member.fullName}
                              </p>
                              {gm.member.email && (
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: 0 }}>
                                  {gm.member.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                          {gm.member.email || '—'}
                        </td>

                        {/* Phone */}
                        <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                          {gm.member.phoneNumber || '—'}
                        </td>

                        {/* Role */}
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              backgroundColor: rb.bg,
                              color: rb.color,
                              borderRadius: 20,
                              padding: '3px 10px',
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {rb.label}
                          </span>
                        </td>

                        {/* Date Joined */}
                        <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                          {gm.joinedAt ? formatDate(gm.joinedAt) : '—'}
                        </td>

                        {/* Remove */}
                        <td style={{ padding: '14px 16px' }}>
                          <button
                            onClick={() => setRemoveConfirmId(gm.member.id)}
                            style={{
                              background: 'rgba(239,68,68,0.08)',
                              border: '1px solid rgba(239,68,68,0.2)',
                              borderRadius: 8,
                              color: '#f87171',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 30,
                              height: 30,
                            }}
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 2 — Attendance Logs ──────────────────────────────────────────── */}
      {activeTab === 'attendance' && (
        <div style={{ marginTop: 20 }}>
          {attendanceHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <Calendar
                size={40}
                style={{ color: 'rgba(255,255,255,0.2)', margin: '0 auto 12px' }}
              />
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
                No attendance sessions recorded yet.
              </p>
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#13152e',
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Meeting Date', 'Topic / Discussion', 'Notes', 'View Roll Call'].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: '12px 16px',
                          color: 'rgba(255,255,255,0.4)',
                          fontSize: 11,
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                          textAlign: 'left',
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map((session) => (
                    <tr
                      key={session.id}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                    >
                      <td style={{ padding: '14px 16px', color: 'white', fontSize: 14 }}>
                        {formatDate(session.meetingDate)}
                      </td>
                      <td style={{ padding: '14px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                        {session.topic || '—'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            color: 'rgba(255,255,255,0.5)',
                            fontSize: 13,
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block',
                          }}
                        >
                          {session.notes || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <button
                          onClick={() => setRollCallModal(session.id)}
                          style={{
                            background: 'rgba(124,107,255,0.1)',
                            border: '1px solid rgba(124,107,255,0.3)',
                            borderRadius: 8,
                            color: '#7c6bff',
                            fontSize: 12,
                            fontWeight: 600,
                            padding: '6px 12px',
                            cursor: 'pointer',
                          }}
                        >
                          View Roll Call
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Remove Confirm Modal ─────────────────────────────────────────────── */}
      {removeConfirmId !== null && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1b3a',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.08)',
              padding: 28,
              width: 380,
              maxWidth: '90vw',
            }}
          >
            <h3 style={{ color: 'white', fontWeight: 700, fontSize: 18, margin: '0 0 10px' }}>
              Remove Member?
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, margin: '0 0 24px' }}>
              Are you sure you want to remove this member from the group?
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRemoveConfirmId(null)}
                style={{
                  padding: '9px 18px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => removeMemberMutation.mutate(removeConfirmId)}
                disabled={removeMemberMutation.isPending}
                style={{
                  padding: '9px 18px',
                  background: 'rgba(239,68,68,0.85)',
                  border: 'none',
                  borderRadius: 10,
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {removeMemberMutation.isPending ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Roll Call Modal ──────────────────────────────────────────────────── */}
      {rollCallModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1b3a',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.08)',
              width: 480,
              maxWidth: '90vw',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Modal header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: 0 }}>
                  Roll Call Details
                </h3>
                {rollCallSession && (
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13, margin: '4px 0 0' }}>
                    {rollCallSession.topic && `${rollCallSession.topic} · `}
                    {formatDate(rollCallSession.meetingDate)}
                  </p>
                )}
              </div>
              <button
                onClick={() => setRollCallModal(null)}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: 'none',
                  borderRadius: 8,
                  color: 'rgba(255,255,255,0.6)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
              {(attendanceDetailsMap[rollCallModal] ?? []).length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
                  No roll call data for this session.
                </p>
              ) : (
                (attendanceDetailsMap[rollCallModal] ?? []).map((entry) => (
                  <div
                    key={entry.memberId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span style={{ color: 'white', fontSize: 14 }}>{entry.memberName}</span>
                    {entry.present ? (
                      <span
                        style={{
                          backgroundColor: 'rgba(16,185,129,0.15)',
                          color: '#34d399',
                          borderRadius: 20,
                          padding: '2px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        ✓ Present
                      </span>
                    ) : (
                      <span
                        style={{
                          backgroundColor: 'rgba(239,68,68,0.15)',
                          color: '#f87171',
                          borderRadius: 20,
                          padding: '2px 10px',
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        ✗ Absent
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Group Drawer ────────────────────────────────────────────────── */}
      <Drawer
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        title="Edit Group Details"
        footer={
          <>
            <button
              onClick={() => setEditDrawerOpen(false)}
              style={{
                padding: '9px 18px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                color: 'rgba(255,255,255,0.7)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => editMutation.mutate()}
              disabled={editMutation.isPending}
              style={{
                padding: '9px 20px',
                background: 'linear-gradient(135deg, #7c6bff, #6456e8)',
                border: 'none',
                borderRadius: 10,
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {editMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <FieldGroup label="Group Name *">
          <input
            style={inputStyle}
            value={editForm.name}
            onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Tuesday Cell Group"
          />
        </FieldGroup>

        <FieldGroup label="Description">
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={editForm.description}
            onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief description..."
          />
        </FieldGroup>

        <FieldGroup label="Group Type *">
          <select
            style={selectStyle}
            value={editForm.type}
            onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="">Select type</option>
            <option value="CELL_GROUP">Cell Group</option>
            <option value="HOUSE_FELLOWSHIP">House Fellowship</option>
            <option value="SMALL_GROUP">Small Group</option>
            <option value="MINISTRY">Ministry</option>
            <option value="DISCIPLESHIP_CLASS">Discipleship Class</option>
          </select>
        </FieldGroup>

        <FieldGroup label="Leader">
          <select
            style={selectStyle}
            value={editForm.leaderId}
            onChange={(e) => setEditForm((f) => ({ ...f, leaderId: e.target.value }))}
          >
            <option value="">Select leader</option>
            {allMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
          </select>
        </FieldGroup>

        <FieldGroup label="Co-Leader">
          <select
            style={selectStyle}
            value={editForm.coLeaderId}
            onChange={(e) => setEditForm((f) => ({ ...f, coLeaderId: e.target.value }))}
          >
            <option value="">Select co-leader</option>
            {allMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
          </select>
        </FieldGroup>

        <FieldGroup label="Meeting Location">
          <input
            style={inputStyle}
            value={editForm.meetingLocation}
            onChange={(e) => setEditForm((f) => ({ ...f, meetingLocation: e.target.value }))}
            placeholder="e.g. Hall B"
          />
        </FieldGroup>

        <FieldGroup label="Meeting Day">
          <select
            style={selectStyle}
            value={editForm.meetingDay}
            onChange={(e) => setEditForm((f) => ({ ...f, meetingDay: e.target.value }))}
          >
            <option value="">Select day</option>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(
              (d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ),
            )}
          </select>
        </FieldGroup>

        <FieldGroup label="Meeting Time">
          <input
            style={inputStyle}
            type="time"
            value={editForm.meetingTime}
            onChange={(e) => setEditForm((f) => ({ ...f, meetingTime: e.target.value }))}
          />
        </FieldGroup>
      </Drawer>

      {/* ── Add Member Drawer ────────────────────────────────────────────────── */}
      <Drawer
        open={addMemberDrawerOpen}
        onClose={() => {
          setAddMemberDrawerOpen(false)
          setAddMemberForm({ memberId: '', role: 'MEMBER' })
        }}
        title="Add Member to Group"
        footer={
          <>
            <button
              onClick={() => {
                setAddMemberDrawerOpen(false)
                setAddMemberForm({ memberId: '', role: 'MEMBER' })
              }}
              style={{
                padding: '9px 18px',
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 10,
                color: 'rgba(255,255,255,0.7)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => addMemberMutation.mutate()}
              disabled={addMemberMutation.isPending || !addMemberForm.memberId}
              style={{
                padding: '9px 20px',
                background: 'linear-gradient(135deg, #7c6bff, #6456e8)',
                border: 'none',
                borderRadius: 10,
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: !addMemberForm.memberId ? 0.5 : 1,
              }}
            >
              {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
            </button>
          </>
        }
      >
        <FieldGroup label="Select Member *">
          <select
            style={selectStyle}
            value={addMemberForm.memberId}
            onChange={(e) => setAddMemberForm((f) => ({ ...f, memberId: e.target.value }))}
          >
            <option value="">Choose a member</option>
            {prospectiveMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
          </select>
        </FieldGroup>

        <FieldGroup label="Role in Group *">
          <select
            style={selectStyle}
            value={addMemberForm.role}
            onChange={(e) => setAddMemberForm((f) => ({ ...f, role: e.target.value }))}
          >
            <option value="MEMBER">Member</option>
            <option value="CO_LEADER">Co-Leader</option>
            <option value="LEADER">Leader</option>
          </select>
        </FieldGroup>
      </Drawer>
    </div>
  )
}
