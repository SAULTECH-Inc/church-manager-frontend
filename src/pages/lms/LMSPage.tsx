import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, X, ExternalLink, Pencil } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { RichTextEditor } from '@/components/editor/RichTextEditor'
import { RichTextDisplay } from '@/components/editor/RichTextDisplay'

interface Course { id: string; title: string; description?: string; instructor?: string; level: string; status: string; enrolledCount: number; completedCount: number; classroomUrl?: string; thumbnailUrl?: string; category?: string }
interface LMSMember { id: string; fullName: string }

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

const statusBadge = (s: string) => {
  if (s === 'ACTIVE') return { color: '#34d399', bg: 'rgba(52,211,153,0.15)' }
  if (s === 'COMPLETED') return { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' }
  if (s === 'DRAFT') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
  return { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.08)' }
}
const levelBadge = (l: string) => {
  if (l === 'BEGINNER') return { color: '#34d399', bg: 'rgba(52,211,153,0.12)' }
  if (l === 'INTERMEDIATE') return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
  if (l === 'ADVANCED') return { color: '#f87171', bg: 'rgba(248,113,113,0.12)' }
  return { color: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.08)' }
}
const LEVEL_GRADIENTS: Record<string, string> = {
  BEGINNER: 'linear-gradient(135deg, #10b981, #34d399)',
  INTERMEDIATE: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
  ADVANCED: 'linear-gradient(135deg, #ef4444, #f87171)',
}

export function LMSPage() {
  const [courseDrawer, setCourseDrawer] = useState(false)
  const [editCourse, setEditCourse] = useState<Course | null>(null)
  const [editCourseForm, setEditCourseForm] = useState({ title: '', description: '', instructor: '', level: 'BEGINNER', status: 'ACTIVE', category: '', classroomUrl: '', thumbnailUrl: '' })
  const [enrollDrawer, setEnrollDrawer] = useState(false)
  const [enrollCourseId, setEnrollCourseId] = useState('')
  const [courseForm, setCourseForm] = useState({ title: '', description: '', instructor: '', level: 'BEGINNER', category: '', classroomUrl: '', thumbnailUrl: '' })
  const [enrollForm, setEnrollForm] = useState({ memberId: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['lms'],
    queryFn: () => api.get('/api/lms').then(r => r.data as { courses: Course[], members: LMSMember[], stats: Record<string, number> }),
  })

  const createCourse = useMutation({
    mutationFn: () => {
      const p = new URLSearchParams()
      Object.entries(courseForm).forEach(([k, v]) => { if (v) p.append(k, v) })
      return api.post(`/api/lms/courses?${p}`)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lms'] }); setCourseDrawer(false); setCourseForm({ title: '', description: '', instructor: '', level: 'BEGINNER', category: '', classroomUrl: '', thumbnailUrl: '' }) },
  })
  const enrollMutation = useMutation({
    mutationFn: () => {
      const p = new URLSearchParams()
      if (enrollCourseId) p.append('courseId', enrollCourseId)
      if (enrollForm.memberId) p.append('memberId', enrollForm.memberId)
      return api.post(`/api/lms/enroll?${p}`)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lms'] }); setEnrollDrawer(false); setEnrollForm({ memberId: '' }); setEnrollCourseId('') },
  })
  const editCourseMut = useMutation({
    mutationFn: () => {
      const p = new URLSearchParams()
      Object.entries(editCourseForm).forEach(([k, v]) => { if (v) p.append(k, v) })
      return api.post(`/api/lms/courses/${editCourse!.id}/edit?${p}`)
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['lms'] }); setEditCourse(null) },
  })
  const deleteCourse = useMutation({
    mutationFn: (id: string) => api.post(`/api/lms/courses/${id}/delete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lms'] }),
  })

  const courses = data?.courses ?? []
  const members = data?.members ?? []
  const stats = data?.stats ?? {}

  const openEnroll = (id: string) => { setEnrollCourseId(id); setEnrollDrawer(true) }

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>Learning Management</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Courses · Enrolments · Progress</p>
        </div>
        <button onClick={() => setCourseDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> New Course</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Courses', value: stats.total ?? courses.length },
          { label: 'Active Courses', value: stats.active ?? 0 },
          { label: 'Total Enrolments', value: stats.enrolments ?? 0 },
          { label: 'Completions', value: stats.completions ?? 0 },
        ].map(k => (
          <div key={k.label} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: '0 0 4px' }}>{k.value}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, margin: 0 }}>{k.label}</p>
          </div>
        ))}
      </div>

      {isLoading && <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>}

      {!isLoading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {courses.length === 0 && (
            <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center', gridColumn: '1/-1' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>No courses yet. Create your first course to get started.</p>
            </div>
          )}
          {courses.map(course => {
            const sb = statusBadge(course.status)
            const lb = levelBadge(course.level)
            const grad = LEVEL_GRADIENTS[course.level] ?? 'linear-gradient(135deg, #7c6bff, #6456e8)'
            const completePct = course.enrolledCount > 0 ? Math.round((course.completedCount / course.enrolledCount) * 100) : 0
            return (
              <div key={course.id} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', display: 'flex', flexDirection: 'column' as const }}>
                <div style={{ height: 100, background: course.thumbnailUrl ? `url(${course.thumbnailUrl}) center/cover` : grad, position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'flex-end', padding: '10px 14px', gap: 6 }}>
                    <span style={{ backgroundColor: sb.bg, color: sb.color, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{course.status}</span>
                    <span style={{ backgroundColor: lb.bg, color: lb.color, borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{course.level}</span>
                  </div>
                </div>
                <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column' as const }}>
                  {course.category && <p style={{ color: '#7c6bff', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', margin: '0 0 4px' }}>{course.category}</p>}
                  <h3 style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>{course.title}</h3>
                  {course.instructor && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '0 0 8px' }}>by {course.instructor}</p>}
                  {course.description && <RichTextDisplay html={course.description} clamp={2} style={{ margin: '0 0 12px' }} />}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{course.enrolledCount} enrolled · {course.completedCount} completed</span>
                      <span style={{ color: '#7c6bff', fontSize: 12, fontWeight: 700 }}>{completePct}%</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(135deg, #7c6bff, #6456e8)', width: `${completePct}%` }} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => openEnroll(course.id)} style={{ ...gradientBtn, flex: 1, padding: '8px 12px', fontSize: 13 }}>Enrol Student</button>
                    {course.classroomUrl && (
                      <a href={course.classroomUrl} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', borderRadius: 12, padding: '8px 12px', cursor: 'pointer', fontWeight: 500, fontSize: 13, textDecoration: 'none' }}>
                        <ExternalLink size={13} /> Classroom
                      </a>
                    )}
                    <button onClick={() => { setEditCourse(course); setEditCourseForm({ title: course.title, description: course.description ?? '', instructor: course.instructor ?? '', level: course.level, status: course.status, category: course.category ?? '', classroomUrl: course.classroomUrl ?? '', thumbnailUrl: course.thumbnailUrl ?? '' }) }}
                      style={{ backgroundColor: 'rgba(124,107,255,0.1)', border: 'none', color: '#a78bfa', borderRadius: 12, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => { if (confirm('Delete course?')) deleteCourse.mutate(course.id) }}
                      style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: 'none', color: '#f87171', borderRadius: 12, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Drawer open={!!editCourse} onClose={() => setEditCourse(null)} title="Edit Course"
        footer={<><button onClick={() => setEditCourse(null)} style={outlineBtn}>Cancel</button><button onClick={() => editCourseMut.mutate()} disabled={!editCourseForm.title || editCourseMut.isPending} style={gradientBtn}>{editCourseMut.isPending ? 'Saving...' : 'Save Changes'}</button></>}>
        <div><label style={labelStyle}>COURSE TITLE <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={editCourseForm.title} onChange={e => setEditCourseForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>DESCRIPTION</label><RichTextEditor value={editCourseForm.description} onChange={v => setEditCourseForm(f => ({ ...f, description: v }))} placeholder="Course description..." minHeight={100} /></div>
        <div><label style={labelStyle}>INSTRUCTOR <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={editCourseForm.instructor} onChange={e => setEditCourseForm(f => ({ ...f, instructor: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>CATEGORY</label><input type="text" value={editCourseForm.category} onChange={e => setEditCourseForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Bible Study, Leadership" style={inputStyle} /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={labelStyle}>LEVEL</label>
            <select value={editCourseForm.level} onChange={e => setEditCourseForm(f => ({ ...f, level: e.target.value }))} style={inputStyle}>
              {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map(l => <option key={l}>{l}</option>)}
            </select></div>
          <div><label style={labelStyle}>STATUS</label>
            <select value={editCourseForm.status} onChange={e => setEditCourseForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
              {['DRAFT', 'ACTIVE', 'COMPLETED'].map(s => <option key={s}>{s}</option>)}
            </select></div>
        </div>
        <div><label style={labelStyle}>CLASSROOM URL</label><input type="url" value={editCourseForm.classroomUrl} onChange={e => setEditCourseForm(f => ({ ...f, classroomUrl: e.target.value }))} placeholder="https://..." style={inputStyle} /></div>
        <div><label style={labelStyle}>THUMBNAIL URL</label><input type="url" value={editCourseForm.thumbnailUrl} onChange={e => setEditCourseForm(f => ({ ...f, thumbnailUrl: e.target.value }))} placeholder="https://..." style={inputStyle} /></div>
      </Drawer>

      <Drawer open={courseDrawer} onClose={() => setCourseDrawer(false)} title="New Course"
        footer={<><button onClick={() => setCourseDrawer(false)} style={outlineBtn}>Cancel</button><button onClick={() => createCourse.mutate()} disabled={!courseForm.title || createCourse.isPending} style={gradientBtn}>{createCourse.isPending ? 'Creating...' : 'Create Course'}</button></>}>
        <div><label style={labelStyle}>COURSE TITLE <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>DESCRIPTION</label><RichTextEditor value={courseForm.description} onChange={v => setCourseForm(f => ({ ...f, description: v }))} placeholder="Course description..." minHeight={100} /></div>
        <div><label style={labelStyle}>INSTRUCTOR</label><input type="text" value={courseForm.instructor} onChange={e => setCourseForm(f => ({ ...f, instructor: e.target.value }))} style={inputStyle} /></div>
        <div><label style={labelStyle}>CATEGORY</label><input type="text" value={courseForm.category} onChange={e => setCourseForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Bible Study, Leadership" style={inputStyle} /></div>
        <div><label style={labelStyle}>LEVEL</label>
          <select value={courseForm.level} onChange={e => setCourseForm(f => ({ ...f, level: e.target.value }))} style={inputStyle}>
            {['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map(l => <option key={l}>{l}</option>)}
          </select></div>
        <div><label style={labelStyle}>CLASSROOM URL</label><input type="url" value={courseForm.classroomUrl} onChange={e => setCourseForm(f => ({ ...f, classroomUrl: e.target.value }))} placeholder="https://..." style={inputStyle} /></div>
        <div><label style={labelStyle}>THUMBNAIL URL</label><input type="url" value={courseForm.thumbnailUrl} onChange={e => setCourseForm(f => ({ ...f, thumbnailUrl: e.target.value }))} placeholder="https://..." style={inputStyle} /></div>
      </Drawer>

      <Drawer open={enrollDrawer} onClose={() => { setEnrollDrawer(false); setEnrollCourseId('') }} title="Enrol Student"
        footer={<><button onClick={() => { setEnrollDrawer(false); setEnrollCourseId('') }} style={outlineBtn}>Cancel</button><button onClick={() => enrollMutation.mutate()} disabled={!enrollForm.memberId || enrollMutation.isPending} style={gradientBtn}>{enrollMutation.isPending ? 'Enrolling...' : 'Enrol'}</button></>}>
        <div style={{ backgroundColor: 'rgba(124,107,255,0.1)', borderRadius: 12, padding: '12px 16px' }}>
          <p style={{ color: '#a78bfa', fontSize: 13, margin: 0 }}>ℹ️ The selected member will be enrolled in this course. They will receive access immediately.</p>
        </div>
        <div><label style={labelStyle}>SELECT MEMBER <span style={{ color: '#f87171' }}>*</span></label>
          <select value={enrollForm.memberId} onChange={e => setEnrollForm({ memberId: e.target.value })} style={inputStyle}>
            <option value="">Choose member...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
      </Drawer>
    </div>
  )
}
