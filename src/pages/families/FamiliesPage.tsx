import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Trash2, X, ArrowLeft, Users } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { getInitials } from '@/lib/utils'

interface Family { id: string; name: string; headName?: string; rosterSize?: number }
interface FamilyDetail { id: string; name: string; headId?: string; headName?: string; roster: { memberId: string; memberName: string; relationship: string; phone?: string; email?: string }[] }
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

export function FamiliesPage() {
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null)
  const [createDrawer, setCreateDrawer] = useState(false)
  const [editDrawer, setEditDrawer] = useState(false)
  const [addMemberDrawer, setAddMemberDrawer] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', headId: '' })
  const [editForm, setEditForm] = useState({ name: '', headId: '' })
  const [addMemberForm, setAddMemberForm] = useState({ memberId: '', relationship: 'HUSBAND' })

  const { data: listData, isLoading } = useQuery({
    queryKey: ['families'],
    queryFn: () => api.get('/api/families').then(r => r.data as { families: Family[], members: Member[] }),
  })

  const { data: detailData, isError: detailError } = useQuery({
    queryKey: ['family', selectedFamilyId],
    queryFn: () => api.get(`/api/families/${selectedFamilyId}`).then(r => r.data as { family: FamilyDetail, members: Member[] }),
    enabled: !!selectedFamilyId,
  })

  const toQS = (obj: Record<string, string>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v) p.append(k, v) }); return p.toString() }
  const createMutation = useMutation({
    mutationFn: () => api.post(`/api/families?${toQS(createForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['families'] }); setCreateDrawer(false); setCreateForm({ name: '', headId: '' }) },
  })
  const editMutation = useMutation({
    mutationFn: () => api.post(`/api/families/${selectedFamilyId}/edit?${toQS(editForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['families'] }); queryClient.invalidateQueries({ queryKey: ['family', selectedFamilyId] }); setEditDrawer(false) },
  })
  const addMemberMutation = useMutation({
    mutationFn: () => api.post(`/api/families/${selectedFamilyId}/members?${toQS(addMemberForm)}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['family', selectedFamilyId] }); setAddMemberDrawer(false); setAddMemberForm({ memberId: '', relationship: 'SPOUSE' }) },
  })
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => api.post(`/api/families/${selectedFamilyId}/members/remove?memberId=${memberId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['family', selectedFamilyId] }),
  })

  const families = listData?.families ?? []
  const members = listData?.members ?? []
  const familyDetail = detailData?.family
  const detailMembers = detailData?.members ?? members

  if (selectedFamilyId && !familyDetail) {
    return (
      <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15 }}>{detailError ? 'Failed to load family details.' : 'Loading family details...'}</p>
        <button onClick={() => setSelectedFamilyId(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.5)', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 14 }}>← Back to Families</button>
      </div>
    )
  }

  if (selectedFamilyId && familyDetail) {
    const roster = familyDetail.roster ?? []
    return (
      <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326' }}>
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setSelectedFamilyId(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: 'rgba(255,255,255,0.6)', borderRadius: 10, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>{familyDetail.name}</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>{familyDetail.headName ? `Head of House: ${familyDetail.headName}` : 'Household'}</p>
          </div>
          <div className="flex gap-3 ml-auto">
            <button onClick={() => { setEditForm({ name: familyDetail.name, headId: familyDetail.headId ?? '' }); setEditDrawer(true) }} style={outlineBtn}>Edit Family</button>
            <button onClick={() => setAddMemberDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> Add Member</button>
          </div>
        </div>

        <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                {['MEMBER', 'RELATIONSHIP', 'CONTACT', 'ACTIONS'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{col}</th>
                ))}
              </tr></thead>
              <tbody>
                {roster.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>No household members yet</td></tr>}
                {roster.map(r => (
                  <tr key={r.memberId} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #7c6bff, #6456e8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700 }}>
                          {getInitials(r.memberName)}
                        </div>
                        <span style={{ color: 'white', fontWeight: 500 }}>{r.memberName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4"><span style={{ backgroundColor: 'rgba(124,107,255,0.15)', color: '#7c6bff', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600 }}>{r.relationship}</span></td>
                    <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{r.phone || r.email || '—'}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => { if (confirm('Remove from household?')) removeMemberMutation.mutate(r.memberId) }}
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

        <Drawer open={editDrawer} onClose={() => setEditDrawer(false)} title="Edit Family"
          footer={<>
            <button onClick={() => setEditDrawer(false)} style={outlineBtn}>Cancel</button>
            <button onClick={() => editMutation.mutate()} disabled={!editForm.name || editMutation.isPending} style={gradientBtn}>{editMutation.isPending ? 'Saving...' : 'Save Changes'}</button>
          </>}>
          <div><label style={labelStyle}>FAMILY NAME <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>HEAD OF HOUSE</label>
            <select value={editForm.headId} onChange={e => setEditForm(f => ({ ...f, headId: e.target.value }))} style={inputStyle}>
              <option value="">Select member...</option>
              {detailMembers.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
            </select></div>
        </Drawer>

        <Drawer open={addMemberDrawer} onClose={() => setAddMemberDrawer(false)} title="Add Household Member"
          footer={<>
            <button onClick={() => setAddMemberDrawer(false)} style={outlineBtn}>Cancel</button>
            <button onClick={() => addMemberMutation.mutate()} disabled={!addMemberForm.memberId || addMemberMutation.isPending} style={gradientBtn}>{addMemberMutation.isPending ? 'Adding...' : 'Add Member'}</button>
          </>}>
          <div><label style={labelStyle}>MEMBER <span style={{ color: '#f87171' }}>*</span></label>
            <select value={addMemberForm.memberId} onChange={e => setAddMemberForm(f => ({ ...f, memberId: e.target.value }))} style={inputStyle}>
              <option value="">Select member...</option>
              {detailMembers.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
            </select></div>
          <div><label style={labelStyle}>RELATIONSHIP</label>
            <select value={addMemberForm.relationship} onChange={e => setAddMemberForm(f => ({ ...f, relationship: e.target.value }))} style={inputStyle}>
              {['HUSBAND', 'WIFE', 'CHILD', 'SIBLING', 'PARENT', 'GRANDPARENT', 'OTHER'].map(r => <option key={r}>{r}</option>)}
            </select></div>
        </Drawer>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>Family Directory</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Household Registry · Family Groups</p>
        </div>
        <button onClick={() => setCreateDrawer(true)} style={{ ...gradientBtn, display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> Add Family</button>
      </div>

      {isLoading && <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading...</p></div>}

      {!isLoading && families.length === 0 && (
        <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 60, textAlign: 'center' }}>
          <Users size={32} style={{ color: '#7c6bff', margin: '0 auto 12px' }} />
          <p style={{ color: 'white', fontWeight: 600 }}>No families registered</p>
          <button onClick={() => setCreateDrawer(true)} style={{ marginTop: 12, ...gradientBtn }}>Add Family</button>
        </div>
      )}

      {!isLoading && families.length > 0 && (
        <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b" style={{ borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.03)' }}>
                {['HOUSEHOLD NAME', 'HEAD OF HOUSE', 'ROSTER SIZE', 'ACTIONS'].map(col => (
                  <th key={col} className="text-left px-5 py-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.4)' }}>{col}</th>
                ))}
              </tr></thead>
              <tbody>
                {families.map(f => (
                  <tr key={f.id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                    <td className="px-5 py-4" style={{ color: 'white', fontWeight: 600, fontSize: 15 }}>{f.name}</td>
                    <td className="px-5 py-4" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{f.headName || '—'}</td>
                    <td className="px-5 py-4"><span style={{ backgroundColor: 'rgba(124,107,255,0.15)', color: '#7c6bff', borderRadius: 20, padding: '3px 14px', fontSize: 13, fontWeight: 700 }}>{f.rosterSize ?? 0}</span></td>
                    <td className="px-5 py-4">
                      <button onClick={() => setSelectedFamilyId(f.id)}
                        style={{ backgroundColor: 'rgba(124,107,255,0.15)', border: 'none', color: '#7c6bff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Drawer open={createDrawer} onClose={() => setCreateDrawer(false)} title="Create Family"
        footer={<>
          <button onClick={() => setCreateDrawer(false)} style={outlineBtn}>Cancel</button>
          <button onClick={() => createMutation.mutate()} disabled={!createForm.name || createMutation.isPending} style={gradientBtn}>{createMutation.isPending ? 'Creating...' : 'Create Family'}</button>
        </>}>
        <div><label style={labelStyle}>FAMILY NAME <span style={{ color: '#f87171' }}>*</span></label><input type="text" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. The Johnson Family" style={inputStyle} /></div>
        <div><label style={labelStyle}>HEAD OF HOUSE</label>
          <select value={createForm.headId} onChange={e => setCreateForm(f => ({ ...f, headId: e.target.value }))} style={inputStyle}>
            <option value="">Select member...</option>
            {members.map(m => <option key={m.id} value={m.id}>{m.fullName}</option>)}
          </select></div>
      </Drawer>
    </div>
  )
}
