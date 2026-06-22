import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, Settings, LogOut, Search, CheckCheck, X } from 'lucide-react'
import { logout } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/api/client'
import { useState, useRef, useEffect } from 'react'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function todayString() {
  const d = new Date()
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const SEVERITY_COLOR: Record<string, string> = {
  INFO: '#7c6bff',
  SUCCESS: '#34d399',
  WARNING: '#fbbf24',
  ERROR: '#f87171',
}

interface Notification {
  id: string
  title: string
  message: string
  severity: string
  actionUrl?: string
  read: boolean
  createdAt: string
}

export function Topbar() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user, logout: clearAuth } = useAuthStore()
  const [notifOpen, setNotifOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => { clearAuth(); navigate('/login') },
  })

  // Close panel on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    if (notifOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [notifOpen])

  const { data: unreadData } = useQuery({
    queryKey: ['notif-count'],
    queryFn: () => api.get('/api/notifications/in-app/unread-count').then(r => r.data as { count: number }),
    refetchInterval: 30000,
  })

  const { data: notifPage } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/api/notifications/in-app?size=20').then(r => r.data),
    enabled: notifOpen,
  })

  const notifications: Notification[] = notifPage?.content ?? []
  const unreadCount = unreadData?.count ?? 0

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/api/notifications/in-app/${id}/read`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['notif-count'] }) },
  })

  const markAll = useMutation({
    mutationFn: () => api.post('/api/notifications/in-app/read-all'),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); qc.invalidateQueries({ queryKey: ['notif-count'] }) },
  })

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Admin'

  return (
    <header
      className="flex items-center justify-between px-6 shrink-0 border-b"
      style={{ backgroundColor: 'var(--sidebar-bg, #0d0f23)', borderColor: 'rgba(255,255,255,0.06)', height: 56 }}
    >
      {/* Left: greeting */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white truncate">Hello! {displayName}</span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: 'rgba(var(--accent-rgb, 124,107,255),0.2)', color: 'var(--accent, #7c6bff)' }}
          >
            {(user?.role ?? 'ADMIN').replace('ROLE_', '')}
          </span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{todayString()}</p>
      </div>

      {/* Right: search + icons */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={14} className="absolute left-3" style={{ color: 'rgba(255,255,255,0.35)' }} />
          <input
            type="text"
            placeholder="Search members, events, branches..."
            className="text-sm rounded-xl pl-9 pr-4 py-2 outline-none focus:ring-1 transition-all"
            style={{
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'white',
              width: 280,
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(var(--accent-rgb,124,107,255),0.5)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
            onKeyDown={e => { if (e.key === 'Enter') navigate('/search') }}
          />
        </div>

        {/* Settings */}
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          onClick={() => navigate('/settings')}
        >
          <Settings size={16} />
        </button>

        {/* Notifications */}
        <div className="relative" ref={panelRef}>
          <button
            className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)', backgroundColor: notifOpen ? 'rgba(255,255,255,0.06)' : 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => { if (!notifOpen) e.currentTarget.style.backgroundColor = 'transparent' }}
            onClick={() => setNotifOpen(o => !o)}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ backgroundColor: '#ef4444' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown panel */}
          {notifOpen && (
            <div style={{
              position: 'absolute', top: 44, right: 0, width: 360, zIndex: 200,
              backgroundColor: 'var(--drawer-bg, #1a1b3a)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: 14 }}>Notifications</span>
                  {unreadCount > 0 && (
                    <span style={{ backgroundColor: 'rgba(var(--accent-rgb,124,107,255),0.2)', color: 'var(--accent,#7c6bff)', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {unreadCount > 0 && (
                    <button onClick={() => markAll.mutate()}
                      style={{ background: 'none', border: 'none', color: 'var(--accent,#7c6bff)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8 }}>
                      <CheckCheck size={12} /> Mark all read
                    </button>
                  )}
                  <button onClick={() => setNotifOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4, borderRadius: 8 }}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>🔔</div>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id}
                      onClick={() => {
                        if (!n.read) markRead.mutate(n.id)
                        if (n.actionUrl) navigate(n.actionUrl)
                        setNotifOpen(false)
                      }}
                      style={{
                        padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: n.actionUrl ? 'pointer' : 'default',
                        backgroundColor: n.read ? 'transparent' : 'rgba(var(--accent-rgb,124,107,255),0.05)',
                        transition: 'background-color 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = n.read ? 'transparent' : 'rgba(var(--accent-rgb,124,107,255),0.05)')}
                    >
                      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: SEVERITY_COLOR[n.severity] ?? '#7c6bff', flexShrink: 0, marginTop: 5 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                            <p style={{ color: n.read ? 'rgba(255,255,255,0.7)' : 'white', fontWeight: n.read ? 400 : 600, fontSize: 13, margin: 0, lineHeight: 1.3 }}>{n.title}</p>
                            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
                          </div>
                          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '3px 0 0', lineHeight: 1.4 }}>{n.message}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444' }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          onClick={() => logoutMutation.mutate()}
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
