import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Banknote, CalendarPlus, TrendingUp, TrendingDown, Minus, Users, DollarSign, Heart, Calendar, BookOpen, Handshake } from 'lucide-react'
import { api } from '@/api/client'
import { formatDate } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardData {
  totalMembers: string
  totalMembersRaw: number
  activeMembers: string
  activeMembersRaw: number
  inactiveMembers: number
  activePercent: number
  newThisMonth: number
  newLastMonth: number
  malePercent: number
  femalePercent: number
  maleCount: number
  femaleCount: number
  kidsPercent: number
  youthPercent: number
  adultPercent: number
  seniorPercent: number
  membershipTypeBreakdown: Record<string, number>
  recentMembers: Array<{ id: string; fullName: string; email?: string; membershipStatus: string; createdAt: string }>
  memberGrowth: number[]
  growthMonths: string[]
  monthlyIncome: string
  monthlyIncomeRaw: number
  lastMonthIncome: string
  totalIncome: string
  ytdIncome: string
  incomeChangePercent: number
  collectionByType: Record<string, string>
  chartMonths: string[]
  incomeData: number[]
  expenseData: number[]
  netSurplus: string
  netSurplusRaw: number
  monthlyExpenses: string
  pendingExpenseCount: number
  pendingExpenses: Array<{ id: string; description?: string; amount: number; category?: string }>
  upcomingEvents: Array<{ id: string; name: string; startDate: string; location?: string; status: string }>
  upcomingEventCount: number
  eventsThisMonth: number
  openPrayers: Array<{ id: string; title: string; urgency: string; category?: string; createdAt: string }>
  openPrayerCount: number
  answeredPrayers: number
  branchStats: Array<{ name: string; memberCount: number; giving: string }>
  fellowshipGroupCount: number
  membersInGroups: number
  volunteerCount: number
  // Extended module stats
  staffCount: number
  activeStaffCount: number
  pendingLeaveCount: number
  childrenCount: number
  pastorCount: number
  familyCount: number
  courseCount: number
  activeCourseCount: number
  enrollmentCount: number
  totalPlots: number
  occupiedPlots: number
}

// ─── Colour tokens ───────────────────────────────────────────────────────────

const PAGE_BG    = 'var(--page-bg)'
const CARD       = 'var(--card-bg)'
const CARD_INNER = 'var(--drawer-bg)'
const BORDER     = 'rgb(var(--inv) / 0.07)'
const ACCENT     = '#7c6bff'
const GREEN      = '#10b981'
const AMBER      = '#f59e0b'
const RED        = '#ef4444'
const BLUE       = '#60a5fa'
const PINK       = '#f472b6'

// ─── Utility helpers ─────────────────────────────────────────────────────────

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

function todayLabel() {
  const d = new Date()
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()} ${d.getFullYear()}`
}

function getInitials(name: string) {
  return name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function BarChart({ months, income, expenses }: { months: string[]; income: number[]; expenses: number[] }) {
  const max = Math.max(...income, ...expenses, 1)
  const H = 120
  const W = 56
  const GAP = 8
  const total = months.length * (W + GAP)

  return (
    <svg width="100%" viewBox={`0 0 ${total} ${H + 36}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
      {[0, 0.25, 0.5, 0.75, 1].map(p => (
        <line key={p} x1={0} y1={H * (1 - p)} x2={total} y2={H * (1 - p)}
          stroke="rgb(var(--inv) / 0.05)" strokeWidth={1} />
      ))}
      {months.map((m, i) => {
        const x = i * (W + GAP)
        const iH = Math.max((income[i] / max) * H, income[i] > 0 ? 3 : 0)
        const eH = Math.max((expenses[i] / max) * H, expenses[i] > 0 ? 3 : 0)
        return (
          <g key={m}>
            <rect x={x} y={H - iH} width={24} height={iH} fill={ACCENT} rx={4} opacity={0.85} />
            <rect x={x + 28} y={H - eH} width={24} height={eH} fill={GREEN} rx={4} opacity={0.75} />
            <text x={x + W / 2} y={H + 16} textAnchor="middle" fill="rgb(var(--inv) / 0.4)" fontSize={10} fontFamily="inherit">{m}</text>
          </g>
        )
      })}
    </svg>
  )
}

function SparkLine({ values, color = ACCENT }: { values: number[]; color?: string }) {
  if (!values.length) return null
  const max = Math.max(...values, 1)
  const W = 200
  const H = 40
  const step = W / (values.length - 1 || 1)
  const pts = values.map((v, i) => `${i * step},${H - (v / max) * H}`).join(' ')
  return (
    <svg width="100%" viewBox={`-2 -4 ${W + 4} ${H + 8}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {values.map((v, i) => (
        <circle key={i} cx={i * step} cy={H - (v / max) * H} r={3} fill={color} />
      ))}
    </svg>
  )
}

function HorizBar({ label, value, max, color, sub }: { label: string; value: number; max: number; color: string; sub?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ color: 'rgb(var(--inv) / 0.7)', fontSize: 12 }}>{label}</span>
        <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{value.toLocaleString()} <span style={{ color: 'rgb(var(--inv) / 0.35)', fontWeight: 400 }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 6, borderRadius: 4, backgroundColor: 'rgb(var(--inv) / 0.07)' }}>
        <div style={{ height: '100%', borderRadius: 4, backgroundColor: color, width: `${pct}%`, transition: 'width 0.6s ease' }} />
      </div>
      {sub && <p style={{ color: 'rgb(var(--inv) / 0.3)', fontSize: 10, marginTop: 3 }}>{sub}</p>}
    </div>
  )
}

function StatCard({
  label, value, sub, icon: Icon, color, badge, trend, onClick,
}: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string
  badge?: string; trend?: { pct: number; label: string }; onClick?: () => void
}) {
  const trendUp = (trend?.pct ?? 0) > 0
  const trendFlat = (trend?.pct ?? 0) === 0
  return (
    <div onClick={onClick} style={{
      backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '18px 20px',
      cursor: onClick ? 'pointer' : undefined,
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => onClick && ((e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,107,255,0.3)')}
      onMouseLeave={e => onClick && ((e.currentTarget as HTMLElement).style.borderColor = BORDER)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}22`, flexShrink: 0 }}>
          <Icon size={18} color={color} />
        </div>
        {badge && (
          <span style={{ backgroundColor: `${color}22`, color, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{badge}</span>
        )}
      </div>
      <p style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700, margin: '0 0 2px' }}>{value}</p>
      <p style={{ color: 'rgb(var(--inv) / 0.45)', fontSize: 12, margin: 0 }}>{label}</p>
      {(sub || trend) && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          {trend && !trendFlat && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, fontWeight: 600, color: trendUp ? GREEN : RED }}>
              {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(trend.pct)}%
            </span>
          )}
          {trend && trendFlat && <Minus size={11} color="rgb(var(--inv) / 0.3)" />}
          {sub && <span style={{ color: 'rgb(var(--inv) / 0.35)', fontSize: 11 }}>{sub}</span>}
        </div>
      )}
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate()

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/dashboard').then(r => r.data as DashboardData),
  })

  if (isLoading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⛪</div>
          <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 14 }}>Loading dashboard…</p>
        </div>
      </div>
    )
  }

  const d = data!

  const FUND_COLORS: Record<string, string> = {
    TITHES: ACCENT, OFFERING: GREEN, FIRST_FRUITS: AMBER,
    THANKSGIVING: BLUE, PLEDGE: PINK, BUILDING_FUND: RED, MISSION_FUND: '#a78bfa',
  }
  const FUND_LABELS: Record<string, string> = {
    TITHES: 'Tithes', OFFERING: 'Offering', FIRST_FRUITS: 'First Fruits',
    THANKSGIVING: 'Thanksgiving', PLEDGE: 'Pledge', BUILDING_FUND: 'Building Fund', MISSION_FUND: 'Mission Fund',
  }
  const memberTypeColors: Record<string, string> = {
    REGULAR_MEMBER: ACCENT, WORKER: GREEN, VOLUNTEER: AMBER, MINISTER: BLUE, PASTOR: PINK,
    EVANGELIST: '#fb923c', MISSIONARY: '#34d399', ELDER: '#a78bfa',
    DEACON: '#f87171', DEACONESS: '#e879f9', VISITOR: 'rgb(var(--inv) / 0.4)',
  }
  const memberTypeLabels: Record<string, string> = {
    REGULAR_MEMBER: 'Regular Member', WORKER: 'Worker', VOLUNTEER: 'Volunteer',
    MINISTER: 'Minister', PASTOR: 'Pastor', EVANGELIST: 'Evangelist',
    MISSIONARY: 'Missionary', ELDER: 'Elder', DEACON: 'Deacon',
    DEACONESS: 'Deaconess', VISITOR: 'Visitor',
  }

  const maxMemberType = Math.max(...Object.values(d?.membershipTypeBreakdown ?? {}), 1)

  const surplusPositive = (d?.netSurplusRaw ?? 0) >= 0

  return (
    <div style={{ minHeight: '100vh', backgroundColor: PAGE_BG, padding: '28px 24px' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 700, margin: 0 }}>Dashboard</h1>
          <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 13, marginTop: 3 }}>{todayLabel()}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Add Member', icon: UserPlus, path: '/members' },
            { label: 'Record Offering', icon: Banknote, path: '/collections' },
            { label: 'New Event', icon: CalendarPlus, path: '/events' },
          ].map(({ label, icon: Icon, path }) => (
            <button key={label} onClick={() => navigate(path)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', color: 'var(--text-primary)',
              border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              <Icon size={14} />{label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Row 1 — 6 KPI cards ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard
          label="Total Members" value={d?.totalMembers ?? '0'} icon={Users} color={ACCENT}
          sub={`${d?.newThisMonth ?? 0} joined this month`}
          trend={d?.newLastMonth ? { pct: Math.round(((d.newThisMonth - d.newLastMonth) / (d.newLastMonth || 1)) * 100), label: 'vs last month' } : undefined}
          onClick={() => navigate('/members')}
        />
        <StatCard
          label="Active Members" value={d?.activeMembers ?? '0'} icon={Heart} color={GREEN}
          badge={`${d?.activePercent ?? 0}%`}
          sub={`${d?.inactiveMembers ?? 0} inactive`}
        />
        <StatCard
          label="Monthly Collections" value={d?.monthlyIncome ?? '₦0'} icon={DollarSign} color={AMBER}
          trend={d?.incomeChangePercent !== undefined ? { pct: d.incomeChangePercent, label: 'vs last month' } : undefined}
          sub={`YTD: ${d?.ytdIncome ?? '₦0'}`}
          onClick={() => navigate('/collections')}
        />
        <StatCard
          label="Monthly Expenses" value={d?.monthlyExpenses ?? '₦0'} icon={Banknote} color={RED}
          badge={surplusPositive ? 'Surplus' : 'Deficit'}
          sub={`Net: ${d?.netSurplus ?? '₦0'}`}
          onClick={() => navigate('/expenses')}
        />
        <StatCard
          label="Fellowship Groups" value={String(d?.fellowshipGroupCount ?? 0)} icon={BookOpen} color={BLUE}
          sub={`${d?.membersInGroups ?? 0} members enrolled`}
          onClick={() => navigate('/fellowships')}
        />
        <StatCard
          label="Volunteers" value={String(d?.volunteerCount ?? 0)} icon={Handshake} color={PINK}
          sub={`${d?.eventsThisMonth ?? 0} events this month`}
          onClick={() => navigate('/volunteers')}
        />
      </div>

      {/* ── Module counts row ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Staff', value: d?.staffCount ?? 0, sub: `${d?.activeStaffCount ?? 0} active`, color: '#34d399', path: '/hr' },
          { label: 'Children', value: d?.childrenCount ?? 0, sub: 'registered', color: '#fb923c', path: '/children' },
          { label: 'Pastors', value: d?.pastorCount ?? 0, sub: 'ordained', color: '#a78bfa', path: '/pastors' },
          { label: 'Families', value: d?.familyCount ?? 0, sub: 'household units', color: '#60a5fa', path: '/families' },
          { label: 'Courses', value: d?.courseCount ?? 0, sub: `${d?.activeCourseCount ?? 0} active · ${d?.enrollmentCount ?? 0} enrolled`, color: '#f59e0b', path: '/lms' },
          { label: 'Cemetery Plots', value: d?.totalPlots ?? 0, sub: `${d?.occupiedPlots ?? 0} occupied`, color: '#94a3b8', path: '/cemetery' },
        ].map(m => (
          <div key={m.label} onClick={() => navigate(m.path)} style={{
            backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 16px',
            cursor: 'pointer', transition: 'border-color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = `${m.color}40`}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = BORDER}
          >
            <p style={{ color: m.color, fontSize: 22, fontWeight: 700, margin: '0 0 2px' }}>{m.value.toLocaleString()}</p>
            <p style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, margin: '0 0 2px' }}>{m.label}</p>
            <p style={{ color: 'rgb(var(--inv) / 0.35)', fontSize: 11, margin: 0 }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Row 2 — Financial chart + fund type breakdown ──────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Income vs Expenses bar chart */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: 0 }}>Income vs Expenses</h3>
              <p style={{ color: 'rgb(var(--inv) / 0.35)', fontSize: 12, marginTop: 3 }}>6-month financial trend</p>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              {[{ label: 'Income', color: ACCENT }, { label: 'Expenses', color: GREEN }].map(l => (
                <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'rgb(var(--inv) / 0.45)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: l.color, display: 'inline-block' }} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
          {(d?.incomeData?.some(v => v > 0) || d?.expenseData?.some(v => v > 0)) ? (
            <BarChart months={d.chartMonths ?? []} income={d.incomeData ?? []} expenses={d.expenseData ?? []} />
          ) : (
            <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgb(var(--inv) / 0.2)', fontSize: 13 }}>
              No financial data recorded yet
            </div>
          )}
          <div style={{ display: 'flex', gap: 20, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
            {[
              { label: 'Total Income', value: d?.totalIncome ?? '₦0', color: ACCENT },
              { label: 'YTD Income', value: d?.ytdIncome ?? '₦0', color: GREEN },
              { label: 'Net Surplus', value: d?.netSurplus ?? '₦0', color: surplusPositive ? GREEN : RED },
            ].map(s => (
              <div key={s.label}>
                <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 11, margin: '0 0 2px' }}>{s.label}</p>
                <p style={{ color: s.color, fontSize: 15, fontWeight: 700, margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Collection by fund type */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>Collections by Fund</h3>
          <p style={{ color: 'rgb(var(--inv) / 0.35)', fontSize: 12, margin: '0 0 20px' }}>All time totals</p>
          {Object.keys(d?.collectionByType ?? {}).length === 0 ? (
            <div style={{ color: 'rgb(var(--inv) / 0.2)', fontSize: 13, textAlign: 'center', paddingTop: 40 }}>No collections recorded</div>
          ) : (
            Object.entries(d?.collectionByType ?? {}).map(([type, amount]) => (
              <div key={type} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgb(var(--inv) / 0.7)', fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: FUND_COLORS[type] ?? ACCENT, display: 'inline-block', flexShrink: 0 }} />
                    {FUND_LABELS[type] ?? type}
                  </span>
                  <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{amount}</span>
                </div>
                <div style={{ height: 5, borderRadius: 3, backgroundColor: 'rgb(var(--inv) / 0.07)' }}>
                  <div style={{ height: '100%', borderRadius: 3, backgroundColor: FUND_COLORS[type] ?? ACCENT, width: '70%' }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Row 3 — Demographics + growth ─────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Member growth sparkline */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>Member Growth</h3>
          <p style={{ color: 'rgb(var(--inv) / 0.35)', fontSize: 12, margin: '0 0 16px' }}>New members per month (6 months)</p>
          <SparkLine values={d?.memberGrowth ?? []} color={ACCENT} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
            {(d?.growthMonths ?? []).map((m, i) => (
              <span key={m} style={{ color: 'rgb(var(--inv) / 0.3)', fontSize: 10, textAlign: 'center' }}>
                {m}<br /><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{d?.memberGrowth[i] ?? 0}</span>
              </span>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 11, margin: '0 0 2px' }}>This Month</p>
              <p style={{ color: ACCENT, fontSize: 18, fontWeight: 700, margin: 0 }}>+{d?.newThisMonth ?? 0}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 11, margin: '0 0 2px' }}>Last Month</p>
              <p style={{ color: GREEN, fontSize: 18, fontWeight: 700, margin: 0 }}>+{d?.newLastMonth ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Gender + Age groups */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: '0 0 16px' }}>Demographics</h3>

          <p style={{ color: 'rgb(var(--inv) / 0.3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px' }}>Gender</p>
          <HorizBar label="Female" value={d?.femaleCount ?? 0} max={d?.totalMembersRaw ?? 1} color={PINK} />
          <HorizBar label="Male" value={d?.maleCount ?? 0} max={d?.totalMembersRaw ?? 1} color={BLUE} />

          <p style={{ color: 'rgb(var(--inv) / 0.3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '16px 0 10px' }}>Age Groups</p>
          {[
            { label: 'Youth (18–35)', pct: d?.youthPercent ?? 0, color: ACCENT },
            { label: 'Adults (36–50)', pct: d?.adultPercent ?? 0, color: GREEN },
            { label: 'Children (<18)', pct: d?.kidsPercent ?? 0, color: AMBER },
            { label: 'Seniors (51+)', pct: d?.seniorPercent ?? 0, color: RED },
          ].map(g => (
            <div key={g.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: g.color, flexShrink: 0 }} />
              <span style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 12, flex: 1 }}>{g.label}</span>
              <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{g.pct}%</span>
            </div>
          ))}
        </div>

        {/* Membership type breakdown */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>Membership Types</h3>
          <p style={{ color: 'rgb(var(--inv) / 0.35)', fontSize: 12, margin: '0 0 16px' }}>Classification breakdown</p>
          {Object.entries(d?.membershipTypeBreakdown ?? {}).map(([type, count]) => (
            <HorizBar
              key={type}
              label={memberTypeLabels[type] ?? type}
              value={count}
              max={maxMemberType}
              color={memberTypeColors[type] ?? ACCENT}
            />
          ))}
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 11, margin: '0 0 2px' }}>Active</p>
                <p style={{ color: GREEN, fontSize: 16, fontWeight: 700, margin: 0 }}>{d?.activeMembers ?? '0'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 11, margin: '0 0 2px' }}>Inactive</p>
                <p style={{ color: 'rgb(var(--inv) / 0.5)', fontSize: 16, fontWeight: 700, margin: 0 }}>{d?.inactiveMembers ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 4 — Branch stats + Upcoming events + Recent members ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>

        {/* Branch performance */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: 0 }}>Branch Performance</h3>
            <button onClick={() => navigate('/branches')} style={{ background: 'none', border: 'none', color: ACCENT, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>See all</button>
          </div>
          {(d?.branchStats ?? []).length === 0 ? (
            <p style={{ color: 'rgb(var(--inv) / 0.2)', fontSize: 13, textAlign: 'center', paddingTop: 30 }}>No branches configured</p>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '6px 12px', marginBottom: 8 }}>
                {['Branch', 'Members', 'Giving'].map(h => (
                  <span key={h} style={{ color: 'rgb(var(--inv) / 0.3)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
                ))}
              </div>
              {(d?.branchStats ?? []).map((b, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '6px 12px', padding: '9px 0', borderTop: `1px solid ${BORDER}` }}>
                  <span style={{ color: 'rgb(var(--inv) / 0.8)', fontSize: 12, fontWeight: 500 }}>{b.name}</span>
                  <span style={{ color: BLUE, fontSize: 12, fontWeight: 600 }}>{b.memberCount}</span>
                  <span style={{ color: GREEN, fontSize: 12, fontWeight: 600 }}>{b.giving}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming events */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: 0 }}>Upcoming Events</h3>
            <button onClick={() => navigate('/events')} style={{ background: 'none', border: 'none', color: ACCENT, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>See all</button>
          </div>
          {(d?.upcomingEvents ?? []).length === 0 ? (
            <div style={{ paddingTop: 30, textAlign: 'center', color: 'rgb(var(--inv) / 0.2)', fontSize: 13 }}>No upcoming events</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(d?.upcomingEvents ?? []).slice(0, 5).map(e => {
                const dt = new Date(e.startDate)
                const day = dt.getDate()
                const mon = MONTHS[dt.getMonth()].slice(0, 3).toUpperCase()
                return (
                  <div key={e.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.15)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ color: AMBER, fontSize: 13, fontWeight: 700, lineHeight: 1 }}>{day}</span>
                      <span style={{ color: 'rgba(245,158,11,0.6)', fontSize: 8, fontWeight: 700 }}>{mon}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</p>
                      <p style={{ color: 'rgb(var(--inv) / 0.35)', fontSize: 11, margin: '2px 0 0' }}>{e.location ?? formatDate(e.startDate)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent members */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: 0 }}>Recent Members</h3>
            <button onClick={() => navigate('/members')} style={{ background: 'none', border: 'none', color: ACCENT, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View all</button>
          </div>
          {(d?.recentMembers ?? []).length === 0 ? (
            <div style={{ paddingTop: 30, textAlign: 'center', color: 'rgb(var(--inv) / 0.2)', fontSize: 13 }}>No members yet</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(d?.recentMembers ?? []).slice(0, 5).map(m => (
                <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {getInitials(m.fullName)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.fullName}</p>
                    <p style={{ color: 'rgb(var(--inv) / 0.35)', fontSize: 11, margin: '1px 0 0' }}>{formatDate(m.createdAt)}</p>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, flexShrink: 0,
                    backgroundColor: m.membershipStatus === 'ACTIVE' ? 'rgba(16,185,129,0.15)' : 'rgb(var(--inv) / 0.07)',
                    color: m.membershipStatus === 'ACTIVE' ? GREEN : 'rgb(var(--inv) / 0.4)',
                  }}>{m.membershipStatus}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Row 5 — Prayer + Pending expenses + Prayer answered ───── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

        {/* Prayer requests */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: 0 }}>Prayer Requests</h3>
            <button onClick={() => navigate('/prayer')} style={{ background: 'none', border: 'none', color: ACCENT, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>See all</button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <div style={{ flex: 1, backgroundColor: CARD_INNER, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              <p style={{ color: RED, fontSize: 20, fontWeight: 700, margin: 0 }}>{d?.openPrayerCount ?? 0}</p>
              <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 11, margin: '2px 0 0' }}>Open</p>
            </div>
            <div style={{ flex: 1, backgroundColor: CARD_INNER, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              <p style={{ color: GREEN, fontSize: 20, fontWeight: 700, margin: 0 }}>{d?.answeredPrayers ?? 0}</p>
              <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 11, margin: '2px 0 0' }}>Answered</p>
            </div>
          </div>

          {(d?.openPrayers ?? []).length === 0 ? (
            <p style={{ color: 'rgb(var(--inv) / 0.2)', fontSize: 13, textAlign: 'center', paddingTop: 10 }}>No open prayer requests</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(d?.openPrayers ?? []).slice(0, 4).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, flexShrink: 0, marginTop: 1,
                    backgroundColor: p.urgency === 'CRITICAL' ? 'rgba(239,68,68,0.2)' : p.urgency === 'URGENT' ? 'rgba(245,158,11,0.2)' : 'rgb(var(--inv) / 0.07)',
                    color: p.urgency === 'CRITICAL' ? RED : p.urgency === 'URGENT' ? AMBER : 'rgb(var(--inv) / 0.45)',
                  }}>{p.urgency}</span>
                  <p style={{ color: 'rgb(var(--inv) / 0.75)', fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending approvals */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: 0 }}>Pending Expenses</h3>
            <button onClick={() => navigate('/expenses')} style={{ background: 'none', border: 'none', color: ACCENT, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Review</button>
          </div>

          <div style={{ backgroundColor: CARD_INNER, borderRadius: 10, padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: AMBER, fontSize: 16 }}>📋</span>
            </div>
            <div>
              <p style={{ color: AMBER, fontSize: 18, fontWeight: 700, margin: 0 }}>{d?.pendingExpenseCount ?? 0}</p>
              <p style={{ color: 'rgb(var(--inv) / 0.4)', fontSize: 11, margin: '1px 0 0' }}>awaiting approval</p>
            </div>
          </div>

          {(d?.pendingExpenses ?? []).length === 0 ? (
            <div style={{ paddingTop: 16, textAlign: 'center' }}>
              <p style={{ color: GREEN, fontSize: 13, margin: 0 }}>✓ All clear</p>
              <p style={{ color: 'rgb(var(--inv) / 0.25)', fontSize: 12 }}>No pending items</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(d?.pendingExpenses ?? []).slice(0, 4).map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: 'rgb(var(--inv) / 0.8)', fontSize: 12, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.description ?? 'Expense'}</p>
                    <p style={{ color: 'rgb(var(--inv) / 0.3)', fontSize: 11, margin: '1px 0 0' }}>{e.category}</p>
                  </div>
                  <span style={{ color: AMBER, fontSize: 12, fontWeight: 700, flexShrink: 0, marginLeft: 10 }}>₦{e.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats summary */}
        <div style={{ backgroundColor: CARD, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 20 }}>
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: '0 0 16px' }}>Ministry Overview</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Members in Fellowship Groups', value: d?.membersInGroups ?? 0, total: d?.totalMembersRaw ?? 1, color: BLUE, suffix: '' },
              { label: 'Active Volunteers', value: d?.volunteerCount ?? 0, total: d?.totalMembersRaw ?? 1, color: PINK, suffix: '' },
              { label: 'Active Members', value: d?.activeMembersRaw ?? 0, total: d?.totalMembersRaw ?? 1, color: GREEN, suffix: '' },
            ].map(s => {
              const pct = s.total > 0 ? Math.min(Math.round((s.value / s.total) * 100), 100) : 0
              return (
                <div key={s.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ color: 'rgb(var(--inv) / 0.6)', fontSize: 12 }}>{s.label}</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: 12, fontWeight: 600 }}>{s.value.toLocaleString()} <span style={{ color: 'rgb(var(--inv) / 0.3)', fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, backgroundColor: 'rgb(var(--inv) / 0.07)' }}>
                    <div style={{ height: '100%', borderRadius: 3, backgroundColor: s.color, width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
            <p style={{ color: 'rgb(var(--inv) / 0.3)', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>Giving per Active Member</p>
            <p style={{ color: AMBER, fontSize: 22, fontWeight: 700, margin: 0 }}>
              {(d?.activeMembersRaw ?? 0) > 0 && (d?.monthlyIncomeRaw ?? 0) > 0
                ? `₦${Math.round((d.monthlyIncomeRaw) / d.activeMembersRaw).toLocaleString()}`
                : '₦0'}
            </p>
            <p style={{ color: 'rgb(var(--inv) / 0.3)', fontSize: 11, margin: '3px 0 0' }}>average this month</p>
          </div>
        </div>
      </div>
    </div>
  )
}
