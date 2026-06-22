import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Edit2, UserCheck, UserX, Camera, FileText, Trash2 } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { formatDate, getInitials } from '@/lib/utils'

interface Member {
  id: string; fullName: string; email?: string; phoneNumber?: string; gender?: string
  dateOfBirth?: string; maritalStatus?: string; occupation?: string; nationality?: string
  address?: string; emergencyContact?: string; baptismDate?: string; baptismType?: string
  membershipStatus: string; membershipType?: string; memberCategory?: string; createdAt: string; dateJoined?: string
}
interface GivingRecord { id: string; amount: number; givingDate: string; givingType?: string }
interface FellowshipGroup { id: string; name: string; type?: string; role?: string; status?: string }
interface LMSEnrollment { id: string; courseTitle?: string; instructorName?: string; progressPercent?: number; status?: string }
interface CounselingRecord { id: string; type?: string; pastorName?: string; sessionDate?: string; notes?: string }
interface PrayerRequest { id: string; title: string; category?: string; urgencyLevel?: string; status?: string; createdAt: string }
interface Attachment { id: string; fileName: string; fileUrl?: string }
interface DetailData {
  member: Member; givingHistory: GivingRecord[]; fellowshipGroups: FellowshipGroup[]
  lmsEnrollments: LMSEnrollment[]; counselingRecords: CounselingRecord[]
  prayerRequests: PrayerRequest[]; attachments: Attachment[]
}

function fieldStyle(): React.CSSProperties {
  return { backgroundColor: 'var(--input-bg)', border: '1px solid rgb(var(--inv) / 0.10)', color: 'var(--text-primary)', borderRadius: 12, width: '100%', padding: '10px 14px', fontSize: 14, outline: 'none' }
}

function badge(bg: string, color: string, text: string) {
  return <span style={{ backgroundColor: bg, color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{text}</span>
}

function statusBadge(status: string) {
  if (status === 'ACTIVE') return badge('rgba(16,185,129,0.15)', '#34d399', 'ACTIVE')
  return badge('rgb(var(--inv) / 0.08)', 'rgb(var(--inv) / 0.5)', status)
}

function roleBadge(role?: string) {
  if (role === 'LEADER') return badge('rgba(245,158,11,0.15)', '#fbbf24', role)
  if (role === 'CO_LEADER') return badge('rgba(99,102,241,0.15)', '#818cf8', role)
  return badge('rgb(var(--inv) / 0.08)', 'rgb(var(--inv) / 0.5)', role || 'MEMBER')
}

function urgencyBadge(urgency?: string) {
  if (urgency === 'CRITICAL') return badge('rgba(239,68,68,0.15)', '#f87171', urgency)
  if (urgency === 'URGENT') return badge('rgba(245,158,11,0.15)', '#fbbf24', urgency)
  return badge('rgb(var(--inv) / 0.08)', 'rgb(var(--inv) / 0.5)', urgency || 'NORMAL')
}

function prayerStatusBadge(status?: string) {
  if (status === 'ANSWERED') return badge('rgba(16,185,129,0.15)', '#34d399', status)
  if (status === 'IN_PRAYER') return badge('rgba(59,130,246,0.15)', '#60a5fa', status)
  return badge('rgb(var(--inv) / 0.08)', 'rgb(var(--inv) / 0.5)', status || '—')
}

const cardStyle: React.CSSProperties = { backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 24 }
const sectionLabel: React.CSSProperties = { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'rgb(var(--inv) / 0.4)', marginBottom: 12, letterSpacing: 1 }
const outlineBtn: React.CSSProperties = { border: '1px solid rgb(var(--inv) / 0.15)', background: 'transparent', color: 'var(--text-primary)', borderRadius: 12, padding: '8px 16px', fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }
const gradientBtn: React.CSSProperties = { background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--text-primary)', border: 'none', borderRadius: 12, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editMode, setEditMode] = useState(false)
  const [activeEditTab, setActiveEditTab] = useState<'personal' | 'church' | 'contact'>('personal')
  const [editForm, setEditForm] = useState<Partial<Member>>({})
  const passportRef = useRef<HTMLInputElement>(null)
  const signatureRef = useRef<HTMLInputElement>(null)
  const uploadRef = useRef<HTMLInputElement>(null)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['member', id],
    queryFn: () => api.get(`/api/members/${id}`).then(r => r.data as DetailData),
  })

  useEffect(() => {
    if (data?.member && !editMode) setEditForm(data.member)
  }, [data])

  const editMutation = useMutation({
    mutationFn: (form: Partial<Member>) => {
      const clean = Object.fromEntries(Object.entries(form).filter(([, v]) => v !== '' && v !== null && v !== undefined))
      return api.post(`/api/members/${id}/edit`, clean)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['member', id] }); setEditMode(false) },
  })

  const toggleMutation = useMutation({
    mutationFn: () => api.post(`/api/members/${id}/toggle-status`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['member', id] }) },
  })

  const deleteMutation = useMutation({
    mutationFn: (attachmentId: string) => api.post(`/api/members/${id}/attachments/${attachmentId}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['member', id] }),
  })

  if (isLoading) return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: 'var(--page-bg)', color: 'rgb(var(--inv) / 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      Loading member details…
    </div>
  )

  if (isError || !data) return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: 'var(--page-bg)', color: '#f87171' }}>
      Failed to load member data.
    </div>
  )

  const {
    member,
    givingHistory = [],
    fellowshipGroups = [],
    lmsEnrollments = [],
    counselingRecords = [],
    prayerRequests = [],
    attachments = [],
  } = data ?? {}

  if (!member) return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: 'var(--page-bg)', color: '#f87171' }}>
      Member not found.
    </div>
  )

  const isActive = member.membershipStatus === 'ACTIVE'
  const totalGiven = (givingHistory as GivingRecord[]).reduce((s, g) => s + (g.amount ?? 0), 0)

  function field(label: string, key: keyof Member, type = 'text') {
    return (
      <div>
        <label style={{ fontSize: 11, color: 'rgb(var(--inv) / 0.5)', display: 'block', marginBottom: 4 }}>{label}</label>
        <input type={type} value={(editForm[key] as string) ?? ''} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} style={fieldStyle()} />
      </div>
    )
  }

  function selectField(label: string, key: keyof Member, options: string[]) {
    return (
      <div>
        <label style={{ fontSize: 11, color: 'rgb(var(--inv) / 0.5)', display: 'block', marginBottom: 4 }}>{label}</label>
        <select value={(editForm[key] as string) ?? ''} onChange={e => setEditForm(p => ({ ...p, [key]: e.target.value }))} style={{ ...fieldStyle(), appearance: 'none' }}>
          <option value="">Select…</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    )
  }

  const tabBtn = (tab: typeof activeEditTab, label: string) => (
    <button onClick={() => setActiveEditTab(tab)} style={{ background: activeEditTab === tab ? '#7c6bff' : 'transparent', color: activeEditTab === tab ? 'white' : 'rgb(var(--inv) / 0.5)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}>
      {label}
    </button>
  )

  const infoItem = (label: string, value?: string) => (
    <div>
      <dt style={{ fontSize: 10, textTransform: 'uppercase', color: 'rgb(var(--inv) / 0.4)', letterSpacing: 0.8 }}>{label}</dt>
      <dd style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 500, marginTop: 2 }}>{value || '—'}</dd>
    </div>
  )

  const uploadBox = (height: number) => (
    <div style={{ width: '100%', height, backgroundColor: 'rgb(var(--inv) / 0.04)', borderRadius: 12, border: '1px dashed rgb(var(--inv) / 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Camera size={20} color="rgb(var(--inv) / 0.3)" />
    </div>
  )

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: 'var(--page-bg)' }}>
      {/* Breadcrumb + Header */}
      <div style={{ marginBottom: 6, fontSize: 13, color: 'rgb(var(--inv) / 0.45)' }}>
        <Link to="/members" style={{ color: 'rgb(var(--inv) / 0.45)', textDecoration: 'none' }}>Members</Link>
        {' / '}
        <span style={{ color: 'rgb(var(--inv) / 0.7)' }}>{member.fullName}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{member.fullName}</h1>
          {(member.membershipType || member.memberCategory) && (
            <p style={{ fontSize: 13, color: 'rgb(var(--inv) / 0.5)', marginTop: 4 }}>
              {[member.membershipType, member.memberCategory].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button style={outlineBtn}>Attendance</button>
          <button style={outlineBtn} onClick={() => { setEditForm(member); setEditMode(e => !e) }}>
            <Edit2 size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Edit Member
          </button>
          {isActive
            ? <button onClick={() => toggleMutation.mutate()} style={{ ...outlineBtn, backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                <UserX size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Deactivate
              </button>
            : <button onClick={() => toggleMutation.mutate()} style={{ ...outlineBtn, backgroundColor: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)' }}>
                <UserCheck size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Activate
              </button>
          }
        </div>
      </div>

      {/* Main 3-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 240px 1fr', gap: 24, marginTop: 24 }}>
        {/* Profile Card */}
        <div style={cardStyle}>
          <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 24 }}>{getInitials(member.fullName)}</span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text-primary)', marginTop: 12 }}>{member.fullName}</div>
          {member.email && <div style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13, marginTop: 2 }}>{member.email}</div>}
          {member.phoneNumber && <div style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13, marginTop: 2 }}>{member.phoneNumber}</div>}
          <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {statusBadge(member.membershipStatus)}
            {member.memberCategory && badge('rgb(var(--inv) / 0.06)', 'rgb(var(--inv) / 0.6)', member.memberCategory)}
          </div>
          <div style={{ marginTop: 16, borderTop: '1px solid rgb(var(--inv) / 0.06)', paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 8px' }}>
            {[
              ['Joined', formatDate(member.dateJoined || member.createdAt)],
              ['Type', member.membershipType || '—'],
              ['Gender', member.gender || '—'],
              ['Nationality', member.nationality || '—'],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 10, textTransform: 'uppercase', color: 'rgb(var(--inv) / 0.4)', letterSpacing: 0.8 }}>{label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Digital Assets */}
        <div style={cardStyle}>
          <div style={sectionLabel}>Digital Assets</div>
          <div style={{ marginBottom: 6, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'rgb(var(--inv) / 0.4)' }}>Passport Photo</div>
          {uploadBox(80)}
          <button onClick={() => passportRef.current?.click()} style={{ ...outlineBtn, marginTop: 8, width: '100%', fontSize: 12, padding: '6px 12px' }}>Upload Photo</button>
          <input ref={passportRef} type="file" accept="image/*" style={{ display: 'none' }} />
          <div style={{ borderTop: '1px solid rgb(var(--inv) / 0.06)', margin: '16px 0' }} />
          <div style={{ marginBottom: 6, fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: 'rgb(var(--inv) / 0.4)' }}>Signature</div>
          {uploadBox(56)}
          <button onClick={() => signatureRef.current?.click()} style={{ ...outlineBtn, marginTop: 8, width: '100%', fontSize: 12, padding: '6px 12px' }}>Upload Signature</button>
          <input ref={signatureRef} type="file" accept="image/*" style={{ display: 'none' }} />
        </div>

        {/* Detail Panel */}
        <div style={{ ...cardStyle, padding: 28 }}>
          {!editMode ? (
            <>
              <div style={sectionLabel}>Personal Information</div>
              <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 32px', margin: 0 }}>
                {infoItem('Full Name', member.fullName)}
                {infoItem('Email', member.email)}
                {infoItem('Phone', member.phoneNumber)}
                {infoItem('Date of Birth', member.dateOfBirth ? formatDate(member.dateOfBirth) : undefined)}
                {infoItem('Marital Status', member.maritalStatus)}
                {infoItem('Occupation', member.occupation)}
                {infoItem('Address', member.address)}
                {infoItem('Emergency Contact', member.emergencyContact)}
                {infoItem('Baptism Type', member.baptismType)}
                {infoItem('Baptism Date', member.baptismDate ? formatDate(member.baptismDate) : undefined)}
                {infoItem('Membership Status', member.membershipStatus)}
                {infoItem('Membership Type', member.membershipType)}
              </dl>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgb(var(--inv) / 0.04)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
                {tabBtn('personal', 'Personal')}
                {tabBtn('church', 'Church')}
                {tabBtn('contact', 'Contact & Emergency')}
              </div>

              {activeEditTab === 'personal' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {field('Full Name', 'fullName')}
                  {field('Email', 'email')}
                  {field('Phone Number', 'phoneNumber')}
                  {field('Date of Birth', 'dateOfBirth', 'date')}
                  {selectField('Gender', 'gender', ['MALE', 'FEMALE'])}
                  {selectField('Marital Status', 'maritalStatus', ['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED'])}
                  {field('Occupation', 'occupation')}
                  {field('Nationality', 'nationality')}
                </div>
              )}

              {activeEditTab === 'church' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {selectField('Membership Status', 'membershipStatus', ['ACTIVE', 'INACTIVE', 'PENDING'])}
                  {selectField('Membership Type', 'membershipType', ['REGULAR_MEMBER', 'WORKER', 'VOLUNTEER', 'MINISTER', 'PASTOR', 'EVANGELIST', 'MISSIONARY', 'ELDER', 'DEACON', 'DEACONESS', 'VISITOR'])}
                  {selectField('Member Category', 'memberCategory', ['ADULT', 'YOUTH', 'CHILDREN', 'SENIOR', 'NEW_CONVERT'])}
                  {field('Baptism Type', 'baptismType')}
                  {field('Baptism Date', 'baptismDate', 'date')}
                </div>
              )}

              {activeEditTab === 'contact' && (
                <div style={{ display: 'grid', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'rgb(var(--inv) / 0.5)', display: 'block', marginBottom: 4 }}>Address</label>
                    <textarea rows={3} value={editForm.address ?? ''} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} style={{ ...fieldStyle(), resize: 'vertical' }} />
                  </div>
                  {field('Emergency Contact', 'emergencyContact')}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
                <button onClick={() => setEditMode(false)} style={outlineBtn}>Cancel</button>
                <button onClick={() => editMutation.mutate(editForm)} disabled={editMutation.isPending} style={gradientBtn}>
                  {editMutation.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Related Data 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
        {/* Giving History */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Giving History</div>
          {givingHistory.length === 0
            ? <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 14 }}>No giving records</p>
            : <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <tbody>
                    {givingHistory.map(g => (
                      <tr key={g.id} style={{ borderBottom: '1px solid rgb(var(--inv) / 0.05)' }}>
                        <td style={{ padding: '8px 0', color: 'rgb(var(--inv) / 0.7)' }}>{formatDate(g.givingDate)}</td>
                        <td style={{ padding: '8px 4px' }}>{g.givingType && badge('rgba(124,107,255,0.15)', '#a78bfa', g.givingType)}</td>
                        <td style={{ padding: '8px 0', textAlign: 'right', color: '#34d399', fontWeight: 600 }}>₦{g.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'right', marginTop: 8, fontSize: 13, color: 'rgb(var(--inv) / 0.6)' }}>
                  Total Given: <span style={{ color: '#34d399', fontWeight: 700 }}>₦{totalGiven.toLocaleString()}</span>
                </div>
              </>
          }
        </div>

        {/* Fellowship Groups */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Fellowship Groups</div>
          {fellowshipGroups.length === 0
            ? <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 14 }}>No fellowship groups</p>
            : fellowshipGroups.map(g => (
                <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgb(var(--inv) / 0.05)' }}>
                  <div>
                    <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14 }}>{g.name}</div>
                    {g.type && <div style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 12 }}>{g.type}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {g.role && roleBadge(g.role)}
                    {g.status && statusBadge(g.status)}
                  </div>
                </div>
              ))
          }
        </div>

        {/* Bible School */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Bible School</div>
          {lmsEnrollments.length === 0
            ? <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 14 }}>No enrollments</p>
            : lmsEnrollments.map(e => (
                <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid rgb(var(--inv) / 0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div>
                      <div style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: 14 }}>{e.courseTitle || '—'}</div>
                      {e.instructorName && <div style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 12 }}>{e.instructorName}</div>}
                    </div>
                    {e.status && statusBadge(e.status)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, backgroundColor: 'rgb(var(--inv) / 0.08)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${e.progressPercent ?? 0}%`, height: '100%', backgroundColor: '#7c6bff', borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 12, color: 'rgb(var(--inv) / 0.5)', minWidth: 30 }}>{e.progressPercent ?? 0}%</span>
                  </div>
                </div>
              ))
          }
        </div>

        {/* Counseling Records */}
        <div style={cardStyle}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Counseling Records</div>
          {counselingRecords.length === 0
            ? <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 14 }}>No counseling records</p>
            : counselingRecords.map(c => (
                <div key={c.id} style={{ padding: '8px 0', borderBottom: '1px solid rgb(var(--inv) / 0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    {c.type && badge('rgba(124,107,255,0.15)', '#a78bfa', c.type)}
                    {c.pastorName && <span style={{ color: 'rgb(var(--inv) / 0.7)', fontSize: 13 }}>{c.pastorName}</span>}
                    {c.sessionDate && <span style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 12, marginLeft: 'auto' }}>{formatDate(c.sessionDate)}</span>}
                  </div>
                  {c.notes && <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 12, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{c.notes}</p>}
                </div>
              ))
          }
        </div>
      </div>

      {/* Prayer Requests */}
      <div style={{ ...cardStyle, marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 16 }}>Prayer Requests</span>
          <span style={{ backgroundColor: 'rgba(124,107,255,0.15)', color: '#a78bfa', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>{prayerRequests.length}</span>
        </div>
        {prayerRequests.length === 0
          ? <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 14 }}>No prayer requests</p>
          : <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgb(var(--inv) / 0.06)' }}>
                  {['Title', 'Category', 'Urgency', 'Status', 'Date'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', fontSize: 10, textTransform: 'uppercase', color: 'rgb(var(--inv) / 0.4)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prayerRequests.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgb(var(--inv) / 0.04)' }}>
                    <td style={{ padding: '10px 8px', color: 'var(--text-primary)', fontWeight: 500 }}>{p.title}</td>
                    <td style={{ padding: '10px 8px', color: 'rgb(var(--inv) / 0.6)', fontSize: 13 }}>{p.category || '—'}</td>
                    <td style={{ padding: '10px 8px' }}>{urgencyBadge(p.urgencyLevel)}</td>
                    <td style={{ padding: '10px 8px' }}>{prayerStatusBadge(p.status)}</td>
                    <td style={{ padding: '10px 8px', color: 'rgb(var(--inv) / 0.5)' }}>{formatDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        }
      </div>

      {/* Documents & Files */}
      <div style={{ ...cardStyle, marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 16 }}>Documents &amp; Files</span>
          <button onClick={() => uploadRef.current?.click()} style={{ ...gradientBtn, padding: '6px 14px', fontSize: 13 }}>Upload File</button>
          <input ref={uploadRef} type="file" style={{ display: 'none' }} onChange={e => {
            const file = e.target.files?.[0]
            if (!file) return
            const fd = new FormData(); fd.append('file', file)
            api.post(`/api/members/${id}/attachments`, fd)
              .then(() => queryClient.invalidateQueries({ queryKey: ['member', id] }))
          }} />
        </div>
        {attachments.length === 0
          ? <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 14 }}>No files uploaded</p>
          : attachments.map(a => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgb(var(--inv) / 0.05)', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} color="#7c6bff" />
                  <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>{a.fileName}</span>
                </div>
                <button onClick={() => deleteMutation.mutate(a.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <Trash2 size={15} color="rgba(239,68,68,0.7)" />
                </button>
              </div>
            ))
        }
      </div>
    </div>
  )
}
