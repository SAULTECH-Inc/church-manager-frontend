import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { api } from '@/api/client'

interface ReportData {
  financial: { totalIncome: number; totalExpense: number; netBalance: number; pendingExpenses: number; paidExpenses: number }
  membership: { total: number; active: number; inactive: number; male: number; female: number; elders: number; ministers: number; deacons: number; volunteers: number }
  activeGroups: number
  collectionBreakdown: { type: string; count: number; amount: number; pct: number }[]
  expenseBreakdown: { category: string; budget: number; spent: number; pctUsed: number }[]
  trendData: { labels: string[]; incomeData: number[]; expenseData: number[] }
}

const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}`

export function ReportsPage() {
  const [exportOpen, setExportOpen] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => api.get('/api/reports').then(r => r.data as ReportData),
  })

  const fin = data?.financial ?? { totalIncome: 0, totalExpense: 0, netBalance: 0, pendingExpenses: 0, paidExpenses: 0 }
  const mem = data?.membership ?? { total: 0, active: 0, inactive: 0, male: 0, female: 0, elders: 0, ministers: 0, deacons: 0, volunteers: 0 }
  const cb = data?.collectionBreakdown ?? []
  const eb = data?.expenseBreakdown ?? []
  const trend = data?.trendData ?? { labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], incomeData: Array(12).fill(0), expenseData: Array(12).fill(0) }

  const maxTrend = Math.max(...trend.incomeData, ...trend.expenseData, 1)
  const trendH = 140

  const totalGender = mem.male + mem.female || 1
  const femPct = (mem.female / totalGender) * 100
  const malePct = (mem.male / totalGender) * 100
  const donutR = 52, donutCirc = 2 * Math.PI * donutR
  const femaleDash = (femPct / 100) * donutCirc

  const ExportDropdown = ({ label, endpoint }: { label: string; endpoint: string }) => (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setExportOpen(exportOpen === label ? null : label)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 13 }}>
        {label} <ChevronDown size={13} />
      </button>
      {exportOpen === label && (
        <div style={{ position: 'absolute', top: '110%', right: 0, backgroundColor: '#1a1b3a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, zIndex: 20, minWidth: 120, overflow: 'hidden' }}
          onMouseLeave={() => setExportOpen(null)}>
          {['xlsx', 'csv', 'pdf'].map(fmt => (
            <button key={fmt} onClick={() => { window.location.href = `/api/reports/export/${endpoint}?format=${fmt}`; setExportOpen(null) }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.8)', cursor: 'pointer', fontSize: 13, textTransform: 'uppercase' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}>
              {fmt}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', backgroundColor: '#131326' }}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 style={{ color: 'white', fontWeight: 700, fontSize: 26, margin: 0 }}>Reports & Analytics</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Financial Overview · Membership · Trends</p>
        </div>
        <div className="flex gap-2">
          <ExportDropdown label="Members" endpoint="members" />
          <ExportDropdown label="Collections" endpoint="collections" />
          <ExportDropdown label="Expenses" endpoint="expenses" />
        </div>
      </div>

      {isLoading && <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 40, textAlign: 'center' }}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading report data...</p></div>}

      {!isLoading && (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Income', value: fmt(fin.totalIncome), color: '#34d399' },
              { label: 'Total Expenses', value: fmt(fin.totalExpense), color: '#f87171' },
              { label: 'Net Balance', value: fmt(fin.netBalance), color: fin.netBalance >= 0 ? '#34d399' : '#f87171' },
              { label: 'Total Members', value: mem.total.toLocaleString(), color: '#7c6bff' },
              { label: 'Active Members', value: mem.active.toLocaleString(), color: '#60a5fa' },
              { label: 'Active Groups', value: (data?.activeGroups ?? 0).toLocaleString(), color: '#f59e0b' },
            ].map(k => (
              <div key={k.label} style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 20 }}>
                <p style={{ color: k.color, fontWeight: 700, fontSize: 20, margin: '0 0 4px' }}>{k.value}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: 0 }}>{k.label}</p>
              </div>
            ))}
          </div>

          {/* Trend Chart */}
          <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 24, marginBottom: 24 }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: '0 0 20px' }}>12-Month Financial Trend</h2>
            <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}><span style={{ width: 24, height: 2, backgroundColor: '#6456e8', display: 'inline-block' }} />Income</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}><span style={{ width: 24, height: 2, backgroundColor: '#a78bfa', borderBottom: '2px dashed #a78bfa', display: 'inline-block' }} />Expenses</span>
            </div>
            <svg width="100%" height={trendH + 40} viewBox={`0 0 ${trend.labels.length * 60} ${trendH + 40}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6456e8" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#6456e8" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Income area */}
              <polygon
                points={[
                  ...trend.incomeData.map((v, i) => `${i * 60 + 30},${trendH - (v / maxTrend) * trendH}`),
                  `${(trend.labels.length - 1) * 60 + 30},${trendH}`,
                  `30,${trendH}`
                ].join(' ')}
                fill="url(#incomeGrad)" />
              {/* Income line */}
              <polyline
                points={trend.incomeData.map((v, i) => `${i * 60 + 30},${trendH - (v / maxTrend) * trendH}`).join(' ')}
                fill="none" stroke="#6456e8" strokeWidth="2.5" strokeLinejoin="round" />
              {/* Expense dashed line */}
              <polyline
                points={trend.expenseData.map((v, i) => `${i * 60 + 30},${trendH - (v / maxTrend) * trendH}`).join(' ')}
                fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="6,4" strokeLinejoin="round" />
              {/* X-axis labels */}
              {trend.labels.map((l, i) => (
                <text key={l} x={i * 60 + 30} y={trendH + 30} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11">{l}</text>
              ))}
            </svg>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
            {/* Income Breakdown */}
            <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 24 }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: '0 0 16px' }}>Income by Type</h2>
              {cb.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No data</p>}
              {cb.map(item => (
                <div key={item.type} style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'white', fontWeight: 500, fontSize: 14 }}>{item.type}</span>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{item.count} · {fmt(item.amount)} · {item.pct?.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(135deg, #7c6bff, #6456e8)', width: `${Math.min(100, item.pct ?? 0)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Expense Breakdown */}
            <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 24 }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: 16, margin: '0 0 16px' }}>Expenses by Category</h2>
              {eb.length === 0 && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No data</p>}
              {eb.map(item => {
                const barColor = item.pctUsed > 90 ? '#f87171' : item.pctUsed > 70 ? '#f59e0b' : '#7c6bff'
                return (
                  <div key={item.category} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: 'white', fontWeight: 500, fontSize: 14 }}>{item.category}</span>
                      <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{fmt(item.spent)} / {fmt(item.budget)} · {item.pctUsed?.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)' }}>
                      <div style={{ height: '100%', borderRadius: 3, backgroundColor: barColor, width: `${Math.min(100, item.pctUsed ?? 0)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Membership */}
          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24, marginBottom: 24 }}>
            {/* Donut */}
            <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 24, display: 'flex', flexDirection: 'column' as const, alignItems: 'center' }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: '0 0 16px', textAlign: 'center' }}>Gender Ratio</h2>
              <svg width="130" height="130" viewBox="0 0 130 130">
                <circle cx="65" cy="65" r={donutR} fill="none" stroke="#374151" strokeWidth="16" />
                <circle cx="65" cy="65" r={donutR} fill="none" stroke="#a78bfa" strokeWidth="16"
                  strokeDasharray={`${femaleDash} ${donutCirc - femaleDash}`} strokeDashoffset={donutCirc * 0.25} strokeLinecap="round" />
                <circle cx="65" cy="65" r={donutR} fill="none" stroke="#64748b" strokeWidth="16"
                  strokeDasharray={`${(malePct / 100) * donutCirc} ${donutCirc - (malePct / 100) * donutCirc}`}
                  strokeDashoffset={donutCirc * 0.25 - femaleDash} strokeLinecap="round" />
                <text x="65" y="61" textAnchor="middle" fill="white" fontWeight="700" fontSize="18">{mem.total}</text>
                <text x="65" y="76" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="11">Total</text>
              </svg>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#a78bfa', display: 'inline-block' }} />Female {femPct.toFixed(0)}%</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}><span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#64748b', display: 'inline-block' }} />Male {malePct.toFixed(0)}%</span>
              </div>
            </div>

            {/* Categories table */}
            <div style={{ backgroundColor: '#13152e', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: 24 }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: 15, margin: '0 0 16px' }}>Membership Categories</h2>
              {[
                { label: 'Elders', value: mem.elders, color: '#f59e0b' },
                { label: 'Ministers', value: mem.ministers, color: '#7c6bff' },
                { label: 'Deacons', value: mem.deacons, color: '#60a5fa' },
                { label: 'Volunteers', value: mem.volunteers, color: '#34d399' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, width: 80 }}>{row.label}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.06)' }}>
                    <div style={{ height: '100%', borderRadius: 4, backgroundColor: row.color, width: `${mem.total > 0 ? Math.min(100, (row.value / mem.total) * 100) : 0}%` }} />
                  </div>
                  <span style={{ color: 'white', fontWeight: 700, fontSize: 15, width: 40, textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}

              {/* Quick stats footer */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { label: 'Pending Expenses', value: fin.pendingExpenses },
                  { label: 'Paid Expenses', value: fin.paidExpenses },
                  { label: 'Inactive Members', value: mem.inactive },
                  { label: 'Active Groups', value: data?.activeGroups ?? 0 },
                ].map(s => (
                  <div key={s.label} style={{ textAlign: 'center' }}>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 20, margin: 0 }}>{s.value}</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, margin: '4px 0 0' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
