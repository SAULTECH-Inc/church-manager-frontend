import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { X, Upload } from 'lucide-react'
import { api } from '@/api/client'
import { queryClient } from '@/lib/queryClient'
import { useThemeStore, THEMES, getTheme, applyTheme } from '@/store/themeStore'

interface OrgSettings { name?: string; email?: string; phone?: string; address?: string; website?: string; logoUrl?: string; primaryColor?: string; tagline?: string }
interface UserProfile { displayName?: string; email?: string; phone?: string; bio?: string; avatarUrl?: string }
interface NotifSettings { emailDigest: boolean; smsAlerts: boolean; attendanceReminders: boolean; paymentAlerts: boolean; prayerUpdates: boolean }
interface SecuritySettings { twoFactorEnabled: boolean; sessionTimeout: number; passwordExpiry: number }
interface PrintoutSettings { letterheadHeader?: string; letterheadFooter?: string; currency?: string; timezone?: string }

const labelStyle: React.CSSProperties = { display: 'block', color: 'rgb(var(--inv) / 0.5)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }
const inputStyle: React.CSSProperties = { backgroundColor: 'var(--input-bg)', border: '1px solid rgb(var(--inv) / 0.10)', color: 'var(--text-primary)', borderRadius: 12, width: '100%', padding: '10px 14px', fontSize: 14, outline: 'none' }
const outlineBtn: React.CSSProperties = { border: '1px solid rgb(var(--inv) / 0.15)', backgroundColor: 'transparent', color: 'var(--text-primary)', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 500, fontSize: 14 }
const gradientBtn: React.CSSProperties = { background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--text-primary)', border: 'none', borderRadius: 12, padding: '10px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }

const NAV_ITEMS = [
  { key: 'profile', label: 'Profile', icon: '👤' },
  { key: 'appearance', label: 'Appearance', icon: '🎨' },
  { key: 'branding', label: 'Branding', icon: '🏢' },
  { key: 'printouts', label: 'Printouts', icon: '🖨️' },
  { key: 'notifications', label: 'Notifications', icon: '🔔' },
  { key: 'security', label: 'Security', icon: '🔒' },
  { key: 'integrations', label: 'Integrations', icon: '🔗' },
  { key: 'billing', label: 'Billing', icon: '💳' },
]

function ToggleSwitch({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgb(var(--inv) / 0.05)' }}>
      <span style={{ color: 'rgb(var(--inv) / 0.8)', fontSize: 14 }}>{label}</span>
      <button onClick={() => onChange(!value)}
        style={{ width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer', position: 'relative', backgroundColor: value ? '#7c6bff' : 'rgb(var(--inv) / 0.15)', transition: 'background-color 0.2s' }}>
        <span style={{ position: 'absolute', top: 3, left: value ? 22 : 3, width: 18, height: 18, borderRadius: '50%', backgroundColor: 'white', transition: 'left 0.2s' }} />
      </button>
    </div>
  )
}

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile')
  const { themeKey, setTheme } = useThemeStore()
  const [profileForm, setProfileForm] = useState<UserProfile>({ displayName: '', email: '', phone: '', bio: '', avatarUrl: '' })
  const [orgForm, setOrgForm] = useState<OrgSettings>({ name: '', email: '', phone: '', address: '', website: '', logoUrl: '', primaryColor: '#7c6bff', tagline: '' })
  const [notifForm, setNotifForm] = useState<NotifSettings>({ emailDigest: true, smsAlerts: false, attendanceReminders: true, paymentAlerts: true, prayerUpdates: false })
  const [securityForm, setSecurityForm] = useState<SecuritySettings>({ twoFactorEnabled: false, sessionTimeout: 60, passwordExpiry: 90 })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [printoutForm, setPrintoutForm] = useState<PrintoutSettings>({ letterheadHeader: '', letterheadFooter: '', currency: 'NGN', timezone: 'Africa/Lagos' })

  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.get('/api/settings').then(r => {
      const d = r.data
      if (d.profile) setProfileForm(d.profile)
      if (d.org) setOrgForm(d.org)
      if (d.notifications) setNotifForm(d.notifications)
      if (d.security) setSecurityForm(d.security)
      if (d.printout) setPrintoutForm(d.printout)
      return d
    }),
  })

  const toQS = (obj: Record<string, unknown>) => { const p = new URLSearchParams(); Object.entries(obj).forEach(([k, v]) => { if (v !== '' && v !== null && v !== undefined) p.append(k, String(v)) }); return p.toString() }
  const saveProfile = useMutation({ mutationFn: () => api.post(`/api/settings/profile?${toQS(profileForm as unknown as Record<string, unknown>)}`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }) })
  const saveOrg = useMutation({ mutationFn: () => api.post(`/api/settings/branding?${toQS(orgForm as unknown as Record<string, unknown>)}`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }) })
  const saveNotif = useMutation({ mutationFn: () => api.post(`/api/settings/notifications?${toQS(notifForm as unknown as Record<string, unknown>)}`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }) })
  const saveSecurity = useMutation({ mutationFn: () => api.post(`/api/settings/security?${toQS(securityForm as unknown as Record<string, unknown>)}`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }) })
  const savePrintout = useMutation({ mutationFn: () => api.post(`/api/settings/printout?${toQS(printoutForm as unknown as Record<string, unknown>)}`), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }) })
  const changePassword = useMutation({ mutationFn: () => api.post(`/api/settings/change-password?${toQS(pwForm as unknown as Record<string, unknown>)}`), onSuccess: () => setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' }) })

  const pwMatch = pwForm.newPassword === pwForm.confirmPassword && pwForm.confirmPassword !== ''

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: 'var(--page-bg)' }}>
      <div className="mb-6">
        <h1 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 26, margin: 0 }}>Settings</h1>
        <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 14, marginTop: 4 }}>Account · Organisation · Security</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>
        {/* Sidebar nav */}
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 8, height: 'fit-content' }}>
          {NAV_ITEMS.map(item => (
            <button key={item.key} onClick={() => setActiveSection(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 16px', borderRadius: 12, border: 'none', cursor: 'pointer', textAlign: 'left',
                backgroundColor: activeSection === item.key ? 'rgba(124,107,255,0.15)' : 'transparent',
                color: activeSection === item.key ? '#7c6bff' : 'rgb(var(--inv) / 0.6)',
                fontWeight: activeSection === item.key ? 700 : 500, fontSize: 14,
              }}>
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: 20, border: '1px solid rgb(var(--inv) / 0.08)', padding: 28 }}>

          {/* PROFILE */}
          {activeSection === 'profile' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, margin: '0 0 20px' }}>Profile Settings</h2>
              {profileForm.avatarUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <img src={profileForm.avatarUrl} alt="avatar" style={{ width: 64, height: 64, borderRadius: 16, objectFit: 'cover' }} />
                  <button style={{ ...outlineBtn, padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Upload size={13} /> Change Photo</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>👤</div>
                  <button style={{ ...outlineBtn, padding: '8px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Upload size={13} /> Upload Photo</button>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={labelStyle}>DISPLAY NAME</label><input type="text" value={profileForm.displayName ?? ''} onChange={e => setProfileForm(f => ({ ...f, displayName: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>EMAIL</label><input type="email" value={profileForm.email ?? ''} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} /></div>
              </div>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>PHONE</label><input type="tel" value={profileForm.phone ?? ''} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} /></div>
              <div style={{ marginBottom: 20 }}><label style={labelStyle}>BIO</label><textarea rows={4} value={profileForm.bio ?? ''} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>AVATAR URL</label><input type="url" value={profileForm.avatarUrl ?? ''} onChange={e => setProfileForm(f => ({ ...f, avatarUrl: e.target.value }))} placeholder="https://..." style={inputStyle} /></div>
              <button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending} style={gradientBtn}>{saveProfile.isPending ? 'Saving...' : 'Save Profile'}</button>
              {saveProfile.isSuccess && <span style={{ color: '#34d399', fontSize: 13, marginLeft: 12 }}>✓ Saved</span>}
            </div>
          )}

          {/* APPEARANCE */}
          {activeSection === 'appearance' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, margin: '0 0 6px' }}>Appearance</h2>
              <p style={{ color: 'rgb(var(--inv) / 0.45)', fontSize: 13, margin: '0 0 24px' }}>Choose a theme for your ChurchOS workspace. Changes apply instantly.</p>
              {(['dark', 'light'] as const).map(mode => (
                <div key={mode} style={{ marginBottom: 24 }}>
                  <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                    {mode === 'dark' ? '🌙 Dark' : '☀️ Light'}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 14 }}>
                    {THEMES.filter(theme => theme.mode === mode).map(theme => {
                      const active = themeKey === theme.key
                      return (
                        <button key={theme.key} onClick={() => { setTheme(theme.key); applyTheme(theme) }}
                          style={{
                            border: active ? `2px solid ${theme.accent}` : `2px solid ${mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: 16, padding: 0, cursor: 'pointer', overflow: 'hidden', backgroundColor: 'transparent',
                            boxShadow: active ? `0 0 0 4px ${theme.accent}22` : 'none',
                            transition: 'all 0.15s',
                          }}>
                          <div style={{ backgroundColor: theme.pageBg, padding: '12px 12px 8px' }}>
                            <div style={{ display: 'flex', gap: 6, height: 56 }}>
                              <div style={{ width: 22, backgroundColor: theme.sidebarBg, borderRadius: 6, flexShrink: 0, border: mode === 'light' ? '1px solid rgba(0,0,0,0.06)' : 'none' }} />
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ height: 7, backgroundColor: theme.cardBg, borderRadius: 4, border: mode === 'light' ? '1px solid rgba(0,0,0,0.06)' : 'none' }} />
                                <div style={{ height: 7, backgroundColor: theme.cardBg, borderRadius: 4, width: '70%', border: mode === 'light' ? '1px solid rgba(0,0,0,0.06)' : 'none' }} />
                                <div style={{ height: 18, borderRadius: 6, marginTop: 4, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentDark})`, opacity: 0.9 }} />
                              </div>
                            </div>
                          </div>
                          <div style={{ padding: '7px 12px 9px', backgroundColor: theme.cardBg, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: mode === 'light' ? '1px solid rgba(0,0,0,0.06)' : 'none' }}>
                            <span style={{ color: active ? theme.accent : mode === 'light' ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: active ? 700 : 500 }}>{theme.name}</span>
                            {active && <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: theme.accent, flexShrink: 0 }} />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 24, backgroundColor: 'rgb(var(--inv) / 0.04)', borderRadius: 14, padding: '14px 18px' }}>
                <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 13, margin: 0 }}>
                  Current theme: <strong style={{ color: 'var(--text-primary)' }}>{getTheme(themeKey).name}</strong>
                </p>
              </div>
            </div>
          )}

          {/* BRANDING */}
          {activeSection === 'branding' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, margin: '0 0 20px' }}>Organisation Branding</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={labelStyle}>CHURCH NAME</label><input type="text" value={orgForm.name ?? ''} onChange={e => setOrgForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>EMAIL</label><input type="email" value={orgForm.email ?? ''} onChange={e => setOrgForm(f => ({ ...f, email: e.target.value }))} style={inputStyle} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={labelStyle}>PHONE</label><input type="tel" value={orgForm.phone ?? ''} onChange={e => setOrgForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} /></div>
                <div><label style={labelStyle}>WEBSITE</label><input type="url" value={orgForm.website ?? ''} onChange={e => setOrgForm(f => ({ ...f, website: e.target.value }))} placeholder="https://..." style={inputStyle} /></div>
              </div>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>ADDRESS</label><textarea rows={2} value={orgForm.address ?? ''} onChange={e => setOrgForm(f => ({ ...f, address: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' as const }} /></div>
              <div style={{ marginBottom: 16 }}><label style={labelStyle}>TAGLINE</label><input type="text" value={orgForm.tagline ?? ''} onChange={e => setOrgForm(f => ({ ...f, tagline: e.target.value }))} style={inputStyle} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={labelStyle}>LOGO URL</label><input type="url" value={orgForm.logoUrl ?? ''} onChange={e => setOrgForm(f => ({ ...f, logoUrl: e.target.value }))} placeholder="https://..." style={inputStyle} /></div>
                <div>
                  <label style={labelStyle}>BRAND COLOR</label>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input type="color" value={orgForm.primaryColor ?? '#7c6bff'} onChange={e => setOrgForm(f => ({ ...f, primaryColor: e.target.value }))}
                      style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid rgb(var(--inv) / 0.1)', backgroundColor: 'transparent', cursor: 'pointer', padding: 2 }} />
                    <input type="text" value={orgForm.primaryColor ?? '#7c6bff'} onChange={e => setOrgForm(f => ({ ...f, primaryColor: e.target.value }))} style={{ ...inputStyle }} />
                  </div>
                </div>
              </div>
              <button onClick={() => saveOrg.mutate()} disabled={saveOrg.isPending} style={gradientBtn}>{saveOrg.isPending ? 'Saving...' : 'Save Branding'}</button>
              {saveOrg.isSuccess && <span style={{ color: '#34d399', fontSize: 13, marginLeft: 12 }}>✓ Saved</span>}
            </div>
          )}

          {/* PRINTOUTS */}
          {activeSection === 'printouts' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, margin: '0 0 4px' }}>Printout Settings</h2>
              <p style={{ color: 'rgb(var(--inv) / 0.45)', fontSize: 13, margin: '0 0 24px' }}>Letterhead text and locale settings appear on all exported PDFs and printed documents.</p>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>LETTERHEAD HEADER</label>
                <textarea rows={3} value={printoutForm.letterheadHeader ?? ''} onChange={e => setPrintoutForm(f => ({ ...f, letterheadHeader: e.target.value }))}
                  placeholder="e.g. House of Glory International Church&#10;123 Faith Avenue, Lagos · Tel: 0800 000 0000"
                  style={{ ...inputStyle, resize: 'vertical' as const }} />
                <p style={{ color: 'rgb(var(--inv) / 0.3)', fontSize: 12, marginTop: 4 }}>Appears at the top of every printed document. Supports line breaks.</p>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>LETTERHEAD FOOTER</label>
                <textarea rows={2} value={printoutForm.letterheadFooter ?? ''} onChange={e => setPrintoutForm(f => ({ ...f, letterheadFooter: e.target.value }))}
                  placeholder="e.g. www.hogchurch.org | info@hogchurch.org | RC: 12345678"
                  style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>CURRENCY</label>
                  <select value={printoutForm.currency ?? 'NGN'} onChange={e => setPrintoutForm(f => ({ ...f, currency: e.target.value }))} style={inputStyle}>
                    {['NGN', 'USD', 'GBP', 'EUR', 'GHS', 'KES', 'ZAR', 'UGX'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>TIMEZONE</label>
                  <select value={printoutForm.timezone ?? 'Africa/Lagos'} onChange={e => setPrintoutForm(f => ({ ...f, timezone: e.target.value }))} style={inputStyle}>
                    {['Africa/Lagos', 'Africa/Accra', 'Africa/Nairobi', 'Africa/Johannesburg', 'Europe/London', 'America/New_York', 'America/Chicago'].map(tz => <option key={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ backgroundColor: 'rgba(124,107,255,0.08)', border: '1px solid rgba(124,107,255,0.15)', borderRadius: 14, padding: '14px 18px', marginBottom: 24 }}>
                <p style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 13, margin: 0 }}>
                  <strong style={{ color: '#a78bfa' }}>Logo & branding</strong> for printed documents is taken from the <button onClick={() => setActiveSection('branding')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: 0, fontSize: 13, fontWeight: 600, textDecoration: 'underline' }}>Branding</button> section (Logo URL).
                </p>
              </div>
              <button onClick={() => savePrintout.mutate()} disabled={savePrintout.isPending} style={gradientBtn}>{savePrintout.isPending ? 'Saving...' : 'Save Printout Settings'}</button>
              {savePrintout.isSuccess && <span style={{ color: '#34d399', fontSize: 13, marginLeft: 12 }}>✓ Saved</span>}
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === 'notifications' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, margin: '0 0 20px' }}>Notification Preferences</h2>
              <ToggleSwitch value={notifForm.emailDigest} onChange={v => setNotifForm(f => ({ ...f, emailDigest: v }))} label="Weekly email digest" />
              <ToggleSwitch value={notifForm.smsAlerts} onChange={v => setNotifForm(f => ({ ...f, smsAlerts: v }))} label="SMS alerts for critical updates" />
              <ToggleSwitch value={notifForm.attendanceReminders} onChange={v => setNotifForm(f => ({ ...f, attendanceReminders: v }))} label="Attendance reminder notifications" />
              <ToggleSwitch value={notifForm.paymentAlerts} onChange={v => setNotifForm(f => ({ ...f, paymentAlerts: v }))} label="Payment and collection alerts" />
              <ToggleSwitch value={notifForm.prayerUpdates} onChange={v => setNotifForm(f => ({ ...f, prayerUpdates: v }))} label="Prayer request updates" />
              <div style={{ marginTop: 24 }}>
                <button onClick={() => saveNotif.mutate()} disabled={saveNotif.isPending} style={gradientBtn}>{saveNotif.isPending ? 'Saving...' : 'Save Preferences'}</button>
                {saveNotif.isSuccess && <span style={{ color: '#34d399', fontSize: 13, marginLeft: 12 }}>✓ Saved</span>}
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeSection === 'security' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, margin: '0 0 20px' }}>Security Settings</h2>
              <ToggleSwitch value={securityForm.twoFactorEnabled} onChange={v => setSecurityForm(f => ({ ...f, twoFactorEnabled: v }))} label="Two-factor authentication (2FA)" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: '20px 0' }}>
                <div>
                  <label style={labelStyle}>SESSION TIMEOUT (MINUTES)</label>
                  <input type="number" min={5} max={480} value={securityForm.sessionTimeout} onChange={e => setSecurityForm(f => ({ ...f, sessionTimeout: Number(e.target.value) }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>PASSWORD EXPIRY (DAYS)</label>
                  <input type="number" min={0} max={365} value={securityForm.passwordExpiry} onChange={e => setSecurityForm(f => ({ ...f, passwordExpiry: Number(e.target.value) }))} style={inputStyle} />
                  <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 12, marginTop: 4 }}>Set to 0 to never expire</p>
                </div>
              </div>
              <button onClick={() => saveSecurity.mutate()} disabled={saveSecurity.isPending} style={gradientBtn}>{saveSecurity.isPending ? 'Saving...' : 'Save Security Settings'}</button>
              {saveSecurity.isSuccess && <span style={{ color: '#34d399', fontSize: 13, marginLeft: 12 }}>✓ Saved</span>}

              <div style={{ borderTop: '1px solid rgb(var(--inv) / 0.08)', marginTop: 28, paddingTop: 28 }}>
                <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15, margin: '0 0 16px' }}>Change Password</h3>
                <div style={{ maxWidth: 360, display: 'flex', flexDirection: 'column' as const, gap: 14 }}>
                  <div><label style={labelStyle}>CURRENT PASSWORD</label><input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} style={inputStyle} /></div>
                  <div><label style={labelStyle}>NEW PASSWORD</label><input type="password" value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} placeholder="Min 6 characters" style={inputStyle} /></div>
                  <div>
                    <label style={labelStyle}>CONFIRM NEW PASSWORD</label>
                    <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))}
                      style={{ ...inputStyle, borderColor: pwForm.confirmPassword && !pwMatch ? '#f87171' : 'rgb(var(--inv) / 0.10)' }} />
                    {pwForm.confirmPassword && !pwMatch && <p style={{ color: '#f87171', fontSize: 12, marginTop: 6 }}>Passwords do not match</p>}
                    {pwMatch && <p style={{ color: '#34d399', fontSize: 12, marginTop: 6 }}>✓ Passwords match</p>}
                  </div>
                  <div>
                    <button onClick={() => changePassword.mutate()} disabled={!pwMatch || !pwForm.currentPassword || changePassword.isPending} style={gradientBtn}>
                      {changePassword.isPending ? 'Changing...' : 'Change Password'}
                    </button>
                    {changePassword.isSuccess && <span style={{ color: '#34d399', fontSize: 13, marginLeft: 12 }}>✓ Password changed</span>}
                    {changePassword.isError && <span style={{ color: '#f87171', fontSize: 13, marginLeft: 12 }}>Failed — check current password</span>}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* INTEGRATIONS */}
          {activeSection === 'integrations' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, margin: '0 0 20px' }}>Integrations</h2>
              {[
                { name: 'PayStack', desc: 'Accept online tithes and offerings via PayStack', icon: '💳', connected: false },
                { name: 'Stripe', desc: 'Payment processing for donations and events', icon: '⚡', connected: false },
                { name: 'Mailchimp', desc: 'Sync members to Mailchimp for email campaigns', icon: '🐵', connected: false },
                { name: 'Zoom', desc: 'Schedule and auto-link Zoom meetings for services', icon: '🎥', connected: false },
                { name: 'Google Calendar', desc: 'Sync church events to Google Calendar', icon: '📅', connected: false },
              ].map(intg => (
                <div key={intg.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgb(var(--inv) / 0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 22 }}>{intg.icon}</span>
                    <div>
                      <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, margin: 0 }}>{intg.name}</p>
                      <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 13, margin: 0 }}>{intg.desc}</p>
                    </div>
                  </div>
                  <button style={{ ...outlineBtn, padding: '7px 14px', fontSize: 13 }}>{intg.connected ? 'Disconnect' : 'Connect'}</button>
                </div>
              ))}
            </div>
          )}

          {/* BILLING */}
          {activeSection === 'billing' && (
            <div>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, margin: '0 0 20px' }}>Billing & Plan</h2>
              <div style={{ backgroundColor: 'rgba(124,107,255,0.1)', border: '1px solid rgba(124,107,255,0.2)', borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: '#a78bfa', fontWeight: 700, fontSize: 20, margin: 0 }}>Pro Plan</p>
                    <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 14, margin: '4px 0 0' }}>All features · Unlimited members · Priority support</p>
                  </div>
                  <span style={{ backgroundColor: 'rgba(52,211,153,0.15)', color: '#34d399', borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 700 }}>Active</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 24 }}>
                {[
                  { label: 'Next Billing', value: 'Jul 1, 2026' },
                  { label: 'Monthly Cost', value: '$49 / mo' },
                  { label: 'Members', value: `${data?.membership?.total ?? '—'} / Unlimited` },
                ].map(s => (
                  <div key={s.label} style={{ backgroundColor: 'rgb(var(--inv) / 0.04)', borderRadius: 12, padding: 14 }}>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 16, margin: 0 }}>{s.value}</p>
                    <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 12, margin: '4px 0 0' }}>{s.label}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button style={gradientBtn}>Upgrade Plan</button>
                <button style={outlineBtn}>View Invoices</button>
                <button style={{ ...outlineBtn, color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}>Cancel Plan</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
