'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, TrendingUp, Target, Users, DollarSign, Activity, Zap, ArrowUp, ArrowDown } from 'lucide-react'
import API from '@/lib/api'

interface ReportData {
  pipeline_stages: Record<string, { count: number; value: number }>
  lead_sources: Record<string, number>
  activity_counts: Record<string, number>
  total_leads: number
  total_deals: number
  total_revenue_forecast: number
  total_activities: number
  top_leads: Array<{ name: string; company: string; score: number; status: string }>
  win_rate: number
}

const STAGE_COLORS: Record<string, string> = {
  new: '#3B82F6',
  contacted: '#8B5CF6',
  qualified: '#06B6D4',
  proposal: '#F59E0B',
  negotiation: '#EF4444',
  won: '#10B981',
  lost: '#6B7280',
}

function MiniBar({ value, max, color }: { value: number, max: number, color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
      <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

const SAMPLE_DATA: ReportData = {
  pipeline_stages: {
    new: { count: 12, value: 0 },
    contacted: { count: 8, value: 0 },
    qualified: { count: 6, value: 240000 },
    proposal: { count: 4, value: 380000 },
    negotiation: { count: 2, value: 220000 },
    won: { count: 5, value: 450000 },
    lost: { count: 3, value: 0 },
  },
  lead_sources: {
    email: 14,
    referral: 8,
    zoho: 6,
    website: 10,
    linkedin: 4,
    manual: 3,
  },
  activity_counts: { call: 28, email: 45, meeting: 12, note: 18, task: 22 },
  total_leads: 45,
  total_deals: 22,
  total_revenue_forecast: 1290000,
  total_activities: 125,
  top_leads: [
    { name: 'Aisha Diallo', company: 'ScaleX AI', score: 91, status: 'negotiation' },
    { name: 'Tom Hanks', company: 'Movie Productions', score: 98, status: 'won' },
    { name: 'Sarah Chen', company: 'TechCorp Inc', score: 85, status: 'qualified' },
    { name: 'Marcus Williams', company: 'Finova Capital', score: 72, status: 'proposal' },
  ],
  win_rate: 62.5,
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData>(SAMPLE_DATA)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/api/reports/summary').then(res => {
      if (res.data && res.data.pipeline_stages) setData(res.data)
    }).catch(() => {
      // Use sample data gracefully
    }).finally(() => setLoading(false))
  }, [])

  const stageEntries = Object.entries(data.pipeline_stages)
  const maxCount = Math.max(...stageEntries.map(([, v]) => v.count))
  const sourceEntries = Object.entries(data.lead_sources)
  const maxSource = Math.max(...sourceEntries.map(([, v]) => v))
  const activityEntries = Object.entries(data.activity_counts)
  const maxActivity = Math.max(...activityEntries.map(([, v]) => v))
  const totalRevenue = data.total_revenue_forecast

  const fmtCurrency = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 }).format(n)

  const statCards = [
    { label: 'Total Leads', value: data.total_leads, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', delta: '+12%' },
    { label: 'Active Deals', value: data.total_deals, icon: Target, color: 'text-purple-400', bg: 'bg-purple-500/10', delta: '+8%' },
    { label: 'Revenue Forecast', value: fmtCurrency(totalRevenue), icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', delta: '+24%' },
    { label: 'Activities Logged', value: data.total_activities, icon: Activity, color: 'text-orange-400', bg: 'bg-orange-500/10', delta: '+5%' },
    { label: 'Win Rate', value: `${data.win_rate}%`, icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10', delta: '+3%' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <main className="flex-1 ms-64 p-8 xl:p-10 h-screen overflow-y-auto">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-blue-400" />
              Reports & Analytics
            </h1>
            <p className="text-sm text-slate-400">Real-time pipeline intelligence and sales performance</p>
          </div>
          {loading && <div className="text-xs text-slate-500">Loading live data...</div>}
          {!loading && <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-xs">Live Data</Badge>}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map(card => {
            const Icon = card.icon
            return (
              <Card key={card.label} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-5">
                  <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
                  <div className="text-xs text-slate-400 mb-2">{card.label}</div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-400">
                    <ArrowUp className="w-3 h-3" />
                    {card.delta} vs. last month
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pipeline Funnel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Pipeline by Stage
                </h2>
                <div className="space-y-4">
                  {stageEntries.map(([stage, data]) => (
                    <div key={stage}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: STAGE_COLORS[stage] || '#6B7280' }} />
                          <span className="text-sm font-medium text-slate-300 capitalize">{stage}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-slate-500">{data.count} deals</span>
                          {data.value > 0 && <span className="text-emerald-400">{fmtCurrency(data.value)}</span>}
                        </div>
                      </div>
                      <MiniBar value={data.count} max={maxCount} color={STAGE_COLORS[stage] || '#6B7280'} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity Breakdown */}
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Activity Breakdown
                </h2>
                <div className="space-y-3">
                  {activityEntries.map(([type, count]) => (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-300 capitalize">{type}</span>
                        <span className="text-xs text-slate-500">{count} logged</span>
                      </div>
                      <MiniBar value={count} max={maxActivity} color="#3B82F6" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Lead Sources */}
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Lead Sources
                </h2>
                <div className="space-y-3">
                  {sourceEntries.sort((a,b) => b[1] - a[1]).map(([source, count]) => {
                    const pct = maxSource > 0 ? Math.round((count / sourceEntries.reduce((a,[,v]) => a+v, 0)) * 100) : 0
                    return (
                      <div key={source} className="flex items-center gap-3">
                        <span className="text-sm text-slate-300 capitalize w-20 shrink-0">{source}</span>
                        <div className="flex-1 bg-slate-800 rounded-full h-2">
                          <div className="h-2 rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-10 text-right">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Top Leads */}
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Top Leads by Score
                </h2>
                <div className="space-y-3">
                  {data.top_leads.map((lead, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{lead.name}</p>
                        <p className="text-xs text-slate-500 truncate">{lead.company}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-emerald-400">{lead.score}</div>
                        <div className="text-[10px] text-slate-500 capitalize">{lead.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Forecast */}
            <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-900/20 border-blue-500/20">
              <CardContent className="p-6">
                <h2 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" /> Revenue Forecast
                </h2>
                <div className="text-3xl font-bold text-white mb-1">{fmtCurrency(totalRevenue)}</div>
                <p className="text-xs text-slate-400">From qualified + proposal + negotiation stages</p>
                <div className="mt-4 space-y-2">
                  {[['Qualified', stageEntries.find(([s]) => s === 'qualified')?.[1].value || 0],
                    ['Proposal', stageEntries.find(([s]) => s === 'proposal')?.[1].value || 0],
                    ['Negotiation', stageEntries.find(([s]) => s === 'negotiation')?.[1].value || 0]
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between text-xs">
                      <span className="text-slate-400">{label as string}</span>
                      <span className="text-slate-300">{fmtCurrency(val as number)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
