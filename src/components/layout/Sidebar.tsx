import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, Network, Calendar, Activity,
  Wallet, Banknote, UserCog, ShieldCheck, BarChart2, CreditCard,
  MessageSquare, Heart, BookOpen, FileText, ChevronDown, ChevronLeft,
  ChevronRight, Settings, Compass, ClipboardList, Baby, Building,
  Briefcase, Zap, Cross, BookMarked, MessagesSquare,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

type NavItem = { to: string; label: string }
type NavGroup = { type: 'group'; label: string; icon: React.ElementType; items: NavItem[] }
type NavSection = { type: 'section'; label: string }
type NavFlat = { type: 'item'; to: string; label: string; icon: React.ElementType }
type NavEntry = NavGroup | NavSection | NavFlat

const NAV: NavEntry[] = [
  { type: 'item', to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },

  { type: 'group', label: 'Fellowship Management', icon: Users, items: [
    { to: '/members', label: 'Members Directory' },
    { to: '/pastors', label: 'Pastoral Leadership' },
    { to: '/fellowships', label: 'Groups & Fellowships' },
    { to: '/volunteers', label: 'Volunteers' },
  ]},

  { type: 'group', label: 'Church Management', icon: Building2, items: [
    { to: '/families', label: 'Family Records' },
    { to: '/pastoral', label: 'Pastoral Care' },
    { to: '/property', label: 'Asset & Property' },
  ]},

  { type: 'group', label: 'Diocese & Branches', icon: Network, items: [
    { to: '/branches', label: 'Branches & Regions' },
  ]},

  { type: 'group', label: 'Event Management', icon: Calendar, items: [
    { to: '/events', label: 'Events' },
  ]},

  { type: 'group', label: 'Project Management', icon: ClipboardList, items: [
    { to: '/projects', label: 'Projects' },
  ]},

  { type: 'group', label: 'Service Management', icon: BookMarked, items: [
    { to: '/service', label: 'Services & Sermons' },
  ]},

  { type: 'group', label: 'Activity Management', icon: Activity, items: [
    { to: '/activity', label: 'Activities & Outreach' },
  ]},

  { type: 'group', label: 'Expense Management', icon: Wallet, items: [
    { to: '/expenses', label: 'Expenses & Budgets' },
  ]},

  { type: 'group', label: 'Collections & Income', icon: Banknote, items: [
    { to: '/collections', label: 'Tithes & Offerings' },
  ]},

  { type: 'group', label: 'User Management', icon: UserCog, items: [
    { to: '/users', label: 'User Accounts' },
  ]},

  { type: 'group', label: 'Role Management', icon: ShieldCheck, items: [
    { to: '/roles', label: 'Roles & Permissions' },
  ]},

  { type: 'group', label: 'Report Generation', icon: BarChart2, items: [
    { to: '/reports', label: 'Reports & Analytics' },
  ]},

  { type: 'group', label: 'Billing & Subscription', icon: CreditCard, items: [
    { to: '/billing', label: 'Plans & Invoices' },
  ]},

  { type: 'section', label: 'GLOBAL MODULES' },

  { type: 'item', to: '/chat', label: 'Staff Chat', icon: MessagesSquare },

  { type: 'group', label: 'Communication', icon: MessageSquare, items: [
    { to: '/communication', label: 'Messages & Campaigns' },
  ]},

  { type: 'group', label: 'Prayer & Testimonies', icon: Heart, items: [
    { to: '/prayer', label: 'Prayer & Testimonies' },
  ]},

  { type: 'group', label: 'Children Management', icon: Baby, items: [
    { to: '/children', label: 'Children Directory' },
  ]},

  { type: 'group', label: 'Facility Booking', icon: Building, items: [
    { to: '/facility', label: 'Facilities & Bookings' },
  ]},

  { type: 'group', label: 'Human Resources', icon: Briefcase, items: [
    { to: '/hr', label: 'Staff & HR' },
  ]},

  { type: 'group', label: 'Bible School (LMS)', icon: BookOpen, items: [
    { to: '/lms', label: 'Courses & Curriculum' },
  ]},

  { type: 'group', label: 'Document Templates', icon: FileText, items: [
    { to: '/templates', label: 'Templates Library' },
  ]},

  { type: 'group', label: 'Workflows & Forms', icon: Zap, items: [
    { to: '/workflows', label: 'Workflows & Forms' },
  ]},

  { type: 'group', label: 'Cemetery Management', icon: Cross, items: [
    { to: '/cemetery', label: 'Cemetery Records' },
  ]},
]

const SIDEBAR_BG = '#0d0f23'
const ACTIVE_BG = 'rgba(124, 107, 255, 0.18)'
const HOVER_BG = 'rgba(255, 255, 255, 0.05)'
const ACCENT = '#7c6bff'

export function Sidebar() {
  const { user } = useAuthStore()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const isGroupActive = (items: NavItem[]) =>
    items.some(i => location.pathname === i.to || location.pathname.startsWith(i.to + '/'))

  const [openGroups, setOpenGroups] = useState<string[]>(() =>
    NAV.filter((e): e is NavGroup => e.type === 'group')
      .filter(g => isGroupActive(g.items))
      .map(g => g.label)
  )

  const toggleGroup = (label: string) =>
    setOpenGroups(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )

  return (
    <div
      className="flex flex-col shrink-0 h-screen transition-all duration-300 border-r"
      style={{
        width: collapsed ? 64 : 256,
        backgroundColor: SIDEBAR_BG,
        borderColor: 'rgba(255,255,255,0.06)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center justify-between p-4 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.06)', minHeight: 64 }}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #7c6bff, #6456e8)' }}>
              <Compass size={18} color="white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight">ChurchOS</p>
              <p className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.45)' }}>ADMIN</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto shrink-0" style={{ background: 'linear-gradient(135deg, #7c6bff, #6456e8)' }}>
            <Compass size={18} color="white" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="rounded-lg p-1 transition-colors shrink-0"
            style={{ color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = HOVER_BG)}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <ChevronLeft size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin" style={{ paddingLeft: collapsed ? 8 : 12, paddingRight: collapsed ? 8 : 12 }}>
        {NAV.map((entry, i) => {
          if (entry.type === 'section') {
            if (collapsed) return null
            return (
              <p key={i} className="text-[10px] font-semibold tracking-widest px-2 pt-4 pb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {entry.label}
              </p>
            )
          }

          if (entry.type === 'item') {
            const Icon = entry.icon
            const active = location.pathname === entry.to
            return (
              <NavLink
                key={entry.to}
                to={entry.to}
                end
                className="flex items-center gap-2.5 rounded-xl mb-0.5 transition-colors text-sm font-medium"
                style={({ isActive }) => ({
                  backgroundColor: isActive ? ACTIVE_BG : 'transparent',
                  color: isActive ? ACCENT : 'rgba(255,255,255,0.75)',
                  padding: collapsed ? '8px' : '8px 10px',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                })}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = HOVER_BG }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && <span>{entry.label}</span>}
              </NavLink>
            )
          }

          if (entry.type === 'group') {
            const Icon = entry.icon
            const isActive = isGroupActive(entry.items)
            const isOpen = openGroups.includes(entry.label)

            if (collapsed) {
              return (
                <div key={entry.label} className="relative group mb-0.5">
                  <button
                    className="flex items-center justify-center w-full rounded-xl p-2 transition-colors"
                    style={{ backgroundColor: isActive ? ACTIVE_BG : 'transparent', color: isActive ? ACCENT : 'rgba(255,255,255,0.65)' }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = HOVER_BG }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <Icon size={16} />
                  </button>
                </div>
              )
            }

            return (
              <div key={entry.label} className="mb-0.5">
                <button
                  onClick={() => toggleGroup(entry.label)}
                  className="flex items-center gap-2.5 w-full rounded-xl px-2.5 py-2 text-sm transition-colors text-left"
                  style={{
                    backgroundColor: isActive && !isOpen ? ACTIVE_BG : 'transparent',
                    color: isActive ? ACCENT : 'rgba(255,255,255,0.75)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = HOVER_BG}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = (isActive && !isOpen) ? ACTIVE_BG : 'transparent'}
                >
                  <Icon size={15} style={{ flexShrink: 0 }} />
                  <span className="flex-1 text-sm font-medium">{entry.label}</span>
                  <ChevronDown
                    size={14}
                    style={{
                      color: 'rgba(255,255,255,0.4)',
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>
                {isOpen && (
                  <div className="pl-6 mt-0.5 space-y-0.5">
                    {entry.items.map(item => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors"
                        style={({ isActive }) => ({
                          backgroundColor: isActive ? ACTIVE_BG : 'transparent',
                          color: isActive ? ACCENT : 'rgba(255,255,255,0.6)',
                        })}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = HOVER_BG}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
                        {item.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            )
          }
          return null
        })}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t p-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'rgba(124,107,255,0.2)', color: ACCENT }}>
              {(user?.displayName ?? user?.email ?? 'A')[0].toUpperCase()}
            </div>
            <button
              onClick={() => setCollapsed(false)}
              className="rounded-lg p-1.5 transition-colors"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = HOVER_BG)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: 'rgba(124,107,255,0.2)', color: ACCENT }}>
              {(user?.displayName ?? user?.email ?? 'A')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate text-white">{user?.displayName ?? user?.email ?? 'Admin'}</p>
              <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{user?.role ?? 'ROLE_ADMIN'}</p>
            </div>
            <NavLink to="/settings" className="rounded-lg p-1.5 transition-colors flex items-center"
              style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = HOVER_BG)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              <Settings size={14} />
            </NavLink>
          </div>
        )}
      </div>
    </div>
  )
}
