import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Edit2, Trash2, X } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { formatDate, getInitials } from '@/lib/utils'

interface Pastor {
  id: string
  title: string
  status: string
  ordinationDate?: string
  appointmentDate?: string
  member: {
    id: string
    fullName: string
    email?: string
    phoneNumber?: string
    gender?: string
    occupation?: string
    nationality?: string
  }
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  color: 'rgb(var(--inv) / 0.5)',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  backgroundColor: 'var(--input-bg)',
  border: '1px solid rgb(var(--inv) / 0.10)',
  color: 'var(--text-primary)',
  borderRadius: 12,
  width: '100%',
  padding: '10px 14px',
  fontSize: 14,
  outline: 'none',
}

const outlineButtonStyle: React.CSSProperties = {
  border: '1px solid rgb(var(--inv) / 0.15)',
  backgroundColor: 'transparent',
  color: 'var(--text-primary)',
  borderRadius: 12,
  padding: '10px 20px',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: 14,
}

export function PastorDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [editMode, setEditMode] = useState(false)
  const [removeModalOpen, setRemoveModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    status: '',
    ordinationDateStr: '',
    appointmentDateStr: '',
  })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['pastor', id],
    queryFn: () => api.get(`/api/pastors/${id}`).then(r => r.data as { pastor: Pastor }),
  })

  useEffect(() => {
    if (data?.pastor) {
      const p = data.pastor
      setEditForm({
        title: p.title ?? '',
        status: p.status ?? '',
        ordinationDateStr: p.ordinationDate ? p.ordinationDate.slice(0, 10) : '',
        appointmentDateStr: p.appointmentDate ? p.appointmentDate.slice(0, 10) : '',
      })
    }
  }, [data?.pastor])

  const editMutation = useMutation({
    mutationFn: () => {
      const params = new URLSearchParams()
      Object.entries(editForm).forEach(([k, v]) => { if (v) params.append(k, String(v)) })
      return api.post(`/api/pastors/${id}/edit?${params.toString()}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pastor', id] })
      setEditMode(false)
    },
  })

  const removeMutation = useMutation({
    mutationFn: () => api.post(`/api/pastors/${id}/remove`),
    onSuccess: () => { navigate('/pastors') },
  })

  if (isLoading) {
    return (
      <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: 'var(--page-bg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, marginTop: 24 }}>
          <div
            style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: 20,
              border: '1px solid rgb(var(--inv) / 0.08)',
              padding: 24,
            }}
          >
            <div
              className="animate-pulse"
              style={{ width: 80, height: 80, borderRadius: 16, backgroundColor: 'var(--input-bg)' }}
            />
            <div
              className="animate-pulse"
              style={{ width: '70%', height: 20, borderRadius: 8, backgroundColor: 'var(--input-bg)', marginTop: 16 }}
            />
            <div
              className="animate-pulse"
              style={{ width: '50%', height: 14, borderRadius: 8, backgroundColor: 'var(--input-bg)', marginTop: 10 }}
            />
            <div
              className="animate-pulse"
              style={{ width: '60%', height: 14, borderRadius: 8, backgroundColor: 'var(--input-bg)', marginTop: 8 }}
            />
          </div>
          <div
            style={{
              backgroundColor: 'var(--card-bg)',
              borderRadius: 20,
              border: '1px solid rgb(var(--inv) / 0.08)',
              padding: 28,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px' }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i}>
                  <div
                    className="animate-pulse"
                    style={{ width: '40%', height: 10, borderRadius: 6, backgroundColor: 'var(--input-bg)', marginBottom: 8 }}
                  />
                  <div
                    className="animate-pulse"
                    style={{ width: '80%', height: 16, borderRadius: 6, backgroundColor: 'var(--input-bg)' }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: 'var(--page-bg)' }}>
        <p style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 14 }}>
          Failed to load pastor details. Please try again.
        </p>
      </div>
    )
  }

  const pastor = data.pastor
  const member = pastor.member

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: 'var(--page-bg)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <Link to="/pastors" style={{ color: 'var(--accent)', textDecoration: 'none', fontSize: 14 }}>
            ← Pastoral Leadership
          </Link>
          <h1
            style={{
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: 24,
              margin: '4px 0 0 0',
            }}
          >
            {member.fullName}
          </h1>
          <p style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 14, margin: '4px 0 0 0' }}>
            {pastor.title}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button
            onClick={() => setEditMode(true)}
            style={{
              ...outlineButtonStyle,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Edit2 size={14} />
            Edit Record
          </button>
          <button
            onClick={() => setRemoveModalOpen(true)}
            style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              color: '#f87171',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 12,
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Trash2 size={14} />
            Remove Pastor
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: 24,
          marginTop: 24,
        }}
      >
        {/* Left: Profile Card */}
        <div
          style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: 20,
            border: '1px solid rgb(var(--inv) / 0.08)',
            padding: 24,
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 16,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
              fontWeight: 700,
              fontSize: 24,
            }}
          >
            {getInitials(member.fullName)}
          </div>

          {/* Name */}
          <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, margin: '12px 0 0 0' }}>
            {member.fullName}
          </p>

          {/* Email */}
          {member.email && (
            <p style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13, margin: '4px 0 0 0' }}>
              {member.email}
            </p>
          )}

          {/* Phone */}
          {member.phoneNumber && (
            <p style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13, margin: '4px 0 0 0' }}>
              {member.phoneNumber}
            </p>
          )}

          {/* Title badge */}
          <div style={{ marginTop: 12 }}>
            <span
              style={{
                backgroundColor: 'rgba(124,107,255,0.15)',
                color: '#a78bfa',
                borderRadius: 999,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                display: 'inline-block',
              }}
            >
              {pastor.title}
            </span>
          </div>

          {/* Status badge */}
          <div style={{ marginTop: 6 }}>
            <span
              style={{
                backgroundColor:
                  pastor.status === 'ACTIVE'
                    ? 'rgba(16,185,129,0.15)'
                    : 'rgb(var(--inv) / 0.08)',
                color:
                  pastor.status === 'ACTIVE' ? '#34d399' : 'rgb(var(--inv) / 0.5)',
                borderRadius: 999,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                display: 'inline-block',
              }}
            >
              {pastor.status}
            </span>
          </div>

          {/* Stats */}
          <div
            style={{
              borderTop: '1px solid rgb(var(--inv) / 0.08)',
              marginTop: 16,
              paddingTop: 16,
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 16,
            }}
          >
            <div>
              <p
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  color: 'rgb(var(--inv) / 0.4)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  margin: 0,
                }}
              >
                Ordination Date
              </p>
              <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, margin: '4px 0 0 0' }}>
                {pastor.ordinationDate ? formatDate(pastor.ordinationDate) : '—'}
              </p>
            </div>
            <div>
              <p
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  color: 'rgb(var(--inv) / 0.4)',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  margin: 0,
                }}
              >
                Appointment Date
              </p>
              <p style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, margin: '4px 0 0 0' }}>
                {pastor.appointmentDate ? formatDate(pastor.appointmentDate) : '—'}
              </p>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <Link
                to={`/members/${member.id}`}
                style={{ color: 'var(--accent)', fontSize: 13, textDecoration: 'none' }}
              >
                View Member Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Detail Panel */}
        <div
          style={{
            backgroundColor: 'var(--card-bg)',
            borderRadius: 20,
            border: '1px solid rgb(var(--inv) / 0.08)',
            padding: 28,
          }}
        >
          {!editMode ? (
            /* View mode */
            <div>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: 'rgb(var(--inv) / 0.4)',
                  letterSpacing: '0.1em',
                  margin: '0 0 16px 0',
                }}
              >
                Pastor Information
              </p>
              <dl
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  columnGap: 32,
                  rowGap: 16,
                  margin: 0,
                }}
              >
                {[
                  { label: 'Full Name', value: member.fullName },
                  { label: 'Email', value: member.email || '—' },
                  { label: 'Phone', value: member.phoneNumber || '—' },
                  { label: 'Title', value: pastor.title },
                  { label: 'Status', value: pastor.status },
                  {
                    label: 'Ordination Date',
                    value: pastor.ordinationDate ? formatDate(pastor.ordinationDate) : '—',
                  },
                  {
                    label: 'Appointment Date',
                    value: pastor.appointmentDate ? formatDate(pastor.appointmentDate) : '—',
                  },
                  { label: 'Gender', value: member.gender || '—' },
                  { label: 'Occupation', value: member.occupation || '—' },
                  { label: 'Nationality', value: member.nationality || '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt
                      style={{
                        fontSize: 10,
                        textTransform: 'uppercase',
                        color: 'rgb(var(--inv) / 0.4)',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                      }}
                    >
                      {label}
                    </dt>
                    <dd
                      style={{
                        color: 'var(--text-primary)',
                        fontSize: 14,
                        fontWeight: 500,
                        marginTop: 2,
                        marginLeft: 0,
                      }}
                    >
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              {/* Member Profile link */}
              <div style={{ marginTop: 24, borderTop: '1px solid rgb(var(--inv) / 0.08)', paddingTop: 16 }}>
                <span style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 12 }}>Member Profile — </span>
                <Link
                  to={`/members/${member.id}`}
                  style={{ color: 'var(--accent)', fontSize: 12, textDecoration: 'none' }}
                >
                  View full member profile
                </Link>
              </div>
            </div>
          ) : (
            /* Edit mode */
            <div>
              <p
                style={{
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: 16,
                  margin: '0 0 16px 0',
                }}
              >
                Edit Pastor Record
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 20,
                }}
              >
                {/* Title/Office */}
                <div>
                  <label style={labelStyle}>Title / Office</label>
                  <select
                    value={editForm.title}
                    onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Select title</option>
                    <option value="SENIOR_PASTOR">Senior Pastor</option>
                    <option value="ASSOCIATE_PASTOR">Associate Pastor</option>
                    <option value="YOUTH_PASTOR">Youth Pastor</option>
                    <option value="CHILDREN_PASTOR">Children Pastor</option>
                    <option value="WORSHIP_PASTOR">Worship Pastor</option>
                    <option value="ASSISTANT_PASTOR">Assistant Pastor</option>
                    <option value="BISHOP">Bishop</option>
                    <option value="DEACON">Deacon</option>
                    <option value="ELDER">Elder</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label style={labelStyle}>Status</label>
                  <select
                    value={editForm.status}
                    onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Select status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>

                {/* Ordination Date */}
                <div>
                  <label style={labelStyle}>Ordination Date</label>
                  <input
                    type="date"
                    value={editForm.ordinationDateStr}
                    onChange={e =>
                      setEditForm(f => ({ ...f, ordinationDateStr: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </div>

                {/* Appointment Date */}
                <div>
                  <label style={labelStyle}>Appointment Date</label>
                  <input
                    type="date"
                    value={editForm.appointmentDateStr}
                    onChange={e =>
                      setEditForm(f => ({ ...f, appointmentDateStr: e.target.value }))
                    }
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Footer buttons */}
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'flex-end',
                  marginTop: 28,
                  borderTop: '1px solid rgb(var(--inv) / 0.08)',
                  paddingTop: 20,
                }}
              >
                <button
                  onClick={() => setEditMode(false)}
                  style={outlineButtonStyle}
                >
                  Cancel
                </button>
                <button
                  onClick={() => editMutation.mutate()}
                  disabled={editMutation.isPending}
                  style={{
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                    color: 'var(--text-primary)',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 24px',
                    cursor: editMutation.isPending ? 'not-allowed' : 'pointer',
                    fontWeight: 600,
                    fontSize: 14,
                    opacity: editMutation.isPending ? 0.7 : 1,
                  }}
                >
                  {editMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Remove confirmation modal */}
      {removeModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div
            style={{
              backgroundColor: 'var(--drawer-bg)',
              borderRadius: 20,
              border: '1px solid rgb(var(--inv) / 0.08)',
              width: 400,
              padding: 32,
            }}
          >
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
              Remove Pastor?
            </h3>
            <p style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 14, marginBottom: 24 }}>
              This will remove {pastor?.member.fullName} from the pastoral registry. Their member
              profile will remain intact.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setRemoveModalOpen(false)}
                style={{ ...outlineButtonStyle }}
              >
                Cancel
              </button>
              <button
                onClick={() => removeMutation.mutate()}
                disabled={removeMutation.isPending}
                style={{
                  backgroundColor: 'rgba(239,68,68,0.2)',
                  color: '#f87171',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 12,
                  padding: '10px 20px',
                  cursor: removeMutation.isPending ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  opacity: removeMutation.isPending ? 0.7 : 1,
                }}
              >
                {removeMutation.isPending ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
