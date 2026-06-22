import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Bell, Settings, LogOut, Search } from 'lucide-react'
import { logout } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function todayString() {
  const d = new Date()
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`
}

export function Topbar() {
  const navigate = useNavigate()
  const { user, logout: clearAuth } = useAuthStore()

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => { clearAuth(); navigate('/login') },
  })

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? 'Admin'

  return (
    <header
      className="flex items-center justify-between px-6 shrink-0 border-b"
      style={{ backgroundColor: '#0d0f23', borderColor: 'rgba(255,255,255,0.06)', height: 56 }}
    >
      {/* Left: greeting */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white truncate">Hello! {displayName}</span>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: 'rgba(124,107,255,0.2)', color: '#7c6bff' }}
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
            onFocus={e => (e.currentTarget.style.borderColor = 'rgba(124,107,255,0.5)')}
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
        <button
          className="relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
          style={{ color: 'rgba(255,255,255,0.5)' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <Bell size={16} />
          <span
            className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
            style={{ backgroundColor: '#ef4444' }}
          >
            0
          </span>
        </button>

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
