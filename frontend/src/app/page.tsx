'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import MeetingWidget from '@/components/MeetingWidget'
import { getDashboardStats, getReminders, completeReminder, syncIntegrations, getPipelineInsights, getUpcomingMeetings } from '@/lib/api'
import { format, formatDistanceToNow } from 'date-fns'
import { 
  Users, DollarSign, Activity, Mail, CheckCircle2, 
  Flame, Bell, ArrowRight, ArrowUpRight, Plus, RefreshCw, Presentation
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const DUMMY_STATS = {
  summary: { total_leads: 10, hot_leads: 4, new_leads: 3, total_deals: 8, won_deals: 1, win_rate: 12.5, total_emails: 5, unread_emails: 3, pending_reminders: 5, overdue_reminders: 0 },
  recent_leads: [
    { id: '1', name: 'Sarah Chen', company: 'Al Habtoor Group', email: 'sarah@alhabtoor.ae', score: 85, status: 'qualified', is_hot: 'true', created_at: new Date(Date.now()-3600000).toISOString() },
    { id: '2', name: 'Aisha Diallo', company: 'Emirates NBD', email: 'aisha@emiratesnbd.ae', score: 91, status: 'negotiation', is_hot: 'true', created_at: new Date(Date.now()-7200000).toISOString() },
    { id: '3', name: 'Marcus Williams', company: 'Damac Properties', email: 'm.williams@damac.com', score: 72, status: 'proposal', is_hot: 'true', created_at: new Date(Date.now()-86400000).toISOString() },
    { id: '4', name: 'David Kim', company: 'Majid Al Futtaim', email: 'dkim@maf.ae', score: 79, status: 'proposal', is_hot: 'true', created_at: new Date(Date.now()-172800000).toISOString() },
    { id: '5', name: 'Priya Patel', company: 'Dubai Holding', email: 'priya@dubaiholding.co', score: 61, status: 'contacted', is_hot: 'false', created_at: new Date(Date.now()-259200000).toISOString() },
  ],
  recent_emails: [
    { id: 'e1', from: 'sarah@alhabtoor.ae', subject: 'Re: Enterprise License Pricing', summary: 'Wants to discuss implementation timeline.', is_read: false, received_at: new Date(Date.now()-3600000).toISOString() },
    { id: 'e2', from: 'aisha@emiratesnbd.ae', subject: 'Final approval pending board sign-off', summary: 'Board approved the deal! Contract needed.', is_read: false, received_at: new Date(Date.now()-7200000).toISOString() },
    { id: 'e3', from: 'm.williams@damac.com', subject: 'Urgent: Contract Terms Review', summary: 'Legal team flagged contract clauses 4.2.', is_read: false, received_at: new Date(Date.now()-14400000).toISOString() },
  ],
}

const DUMMY_REMINDERS = [
  { id: 'r1', title: 'Call Sarah Chen re: timeline', message: 'Follow up on implementation timeline discussion', due_at: new Date(Date.now()+7200000).toISOString(), is_completed: false },
  { id: 'r2', title: 'Send revised contract to Emirates NBD', message: 'Address sections 4.2 and 7.1', due_at: new Date(Date.now()+18000000).toISOString(), is_completed: false },
  { id: 'r3', title: 'Contract prep for Damac', message: 'Finalize contract terms for board approval', due_at: new Date(Date.now()+3600000).toISOString(), is_completed: false },
  { id: 'r4', title: 'Demo prep for MAF', message: 'Personalized demo for David Kim', due_at: new Date(Date.now()+86400000).toISOString(), is_completed: false },
]

const DUMMY_INSIGHTS = {
  health_score: 74,
  insights: [
    '🔥 4 hot leads require immediate attention today',
    '📧 3 unread emails with high-priority replies needed',
    '📈 Win rate at 12.5% — focus on pushing proposals to close',
  ]
}

export default function Dashboard() {
  const [stats, setStats] = useState(DUMMY_STATS)
  const [reminders, setReminders] = useState(DUMMY_REMINDERS)
  const [insights, setInsights] = useState(DUMMY_INSIGHTS)
  const [meetings, setMeetings] = useState<any[]>([])
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => {})
    getReminders({ upcoming_only: true }).then((data: any) => { if (Array.isArray(data) && data.length) setReminders(data) }).catch(() => {})
    getPipelineInsights().then(setInsights).catch(() => {})
    getUpcomingMeetings().then((data: any) => { if (Array.isArray(data?.events)) setMeetings(data.events) }).catch(() => {})
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try { await syncIntegrations() } catch {}
    setSyncing(false)
  }

  const handleComplete = async (id: string) => {
    setReminders(r => r.filter(x => x.id !== id))
    try { await completeReminder(id) } catch {}
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 xl:p-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Dashboard</h1>
            <p className="text-sm text-slate-400">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} — Here's your UAE pipeline overview.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-[#D4AF37]/20 text-[#D4AF37] hover:bg-[#D4AF37]/10 bg-transparent" onClick={handleSync} disabled={syncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Data'}
            </Button>
            <Button className="bg-gradient-to-r from-[#D4AF37] to-[#B8963E] text-slate-950 hover:opacity-90 transition-opacity">
              <Plus className="mr-2 h-4 w-4" /> New Lead
            </Button>
          </div>
        </div>

        {/* 4-Card Stats Grid (Shadcn Dashboard Example Style) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-slate-900 border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#D4AF37] to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Pipeline</CardTitle>
              <DollarSign className="h-4 w-4 text-[#D4AF37]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">AED 2.5M</div>
              <p className="text-xs text-emerald-500 mt-1 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-1" /> +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-orange-500 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Hot Leads</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.summary.hot_leads}</div>
              <p className="text-xs text-orange-400 mt-1">Action required immediately</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Active Deals</CardTitle>
              <Activity className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.summary.total_deals}</div>
              <p className="text-xs text-slate-500 mt-1">{stats.summary.win_rate}% current period win rate</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Unread Emails</CardTitle>
              <Mail className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.summary.unread_emails}</div>
              <p className="text-xs text-slate-500 mt-1">Awaiting your reply</p>
            </CardContent>
          </Card>
        </div>

        {/* 2-Column Layout */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7 mb-8">
          
          {/* Main Hot Leads List (takes 4 columns) */}
          <Card className="col-span-4 bg-slate-900 border-slate-800 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" /> Hot Leads
              </CardTitle>
              <CardDescription>Accounts showing the highest intent score this week.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-6">
                {stats.recent_leads.map(lead => (
                  <div key={lead.id} className="flex items-center group cursor-pointer" onClick={() => window.location.href = `/leads/${lead.id}`}>
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-[#D4AF37]">
                      {lead.name.charAt(0)}
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none text-slate-200 group-hover:text-[#D4AF37] transition-colors">
                        {lead.name}
                      </p>
                      <p className="text-xs text-slate-500">{lead.company}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-3">
                      <Badge variant="outline" className={lead.is_hot === 'true' ? 'border-orange-500/50 text-orange-400 bg-orange-500/10' : 'border-slate-700 text-slate-400'}>
                        {lead.status}
                      </Badge>
                      <div className="font-medium text-sm text-emerald-400">
                        {lead.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Right Column: Meetings & AI Insights (takes 3 columns) */}
          <div className="col-span-3 space-y-6">
            
            {/* AI Insights Card */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-[#D4AF37]/20 shadow-[0_0_30px_rgba(212,175,55,0.05)]">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-[#D4AF37]">
                  <span className="flex items-center gap-2 text-sm font-semibold tracking-wide uppercase"><Presentation className="w-4 h-4" /> AI Pipeline Analysis</span>
                  <span className="text-2xl font-black">{insights.health_score}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full h-1.5 bg-slate-800 rounded-full mb-4 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#D4AF37] to-emerald-500 rounded-full" style={{ width: `${insights.health_score}%` }}></div>
                </div>
                <ul className="space-y-3">
                  {insights.insights.map((ins, i) => (
                    <li key={i} className="text-xs text-slate-300 leading-relaxed border-l-2 border-[#D4AF37]/30 pl-3 py-0.5">
                      {ins}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Upcoming Meetings Card */}
            <Card className="bg-slate-900 border-slate-800 flex flex-col h-full">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Upcoming Meetings</CardTitle>
                  <CardDescription>Click for AI Pre-Meeting Tear Sheets</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-[#D4AF37] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10">See all <ArrowRight className="w-3 h-3 ml-1" /></Button>
              </CardHeader>
              <CardContent>
                <MeetingWidget events={meetings} />
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Bottom Section: Reminders & Inbox */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Reminders */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" /> Today's Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reminders.map(rem => {
                  const isOverdue = new Date(rem.due_at) < new Date()
                  return (
                    <div key={rem.id} className="flex items-start justify-between gap-4 py-2 border-b border-slate-800 last:border-0 group">
                      <div className="flex items-start gap-3">
                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${isOverdue ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-emerald-500'}`} />
                        <div>
                          <p className="text-sm font-medium text-slate-200">{rem.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{isOverdue ? 'Overdue' : 'Due today'} — {rem.message}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-emerald-400 hover:bg-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleComplete(rem.id)}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Emails */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400" /> Recent Emails
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-400 hover:text-white">Open Inbox</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-0">
                {stats.recent_emails.map(email => (
                  <div key={email.id} className="flex items-start gap-3 p-3 -mx-3 rounded-lg hover:bg-slate-800/50 cursor-pointer transition-colors" onClick={() => window.location.href = '/inbox'}>
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-blue-400 shrink-0">
                      {email.from.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${email.is_read ? 'text-slate-300' : 'text-white font-semibold'}`}>
                        {email.subject}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">{email.from}</p>
                      <p className="text-[11px] text-[#D4AF37]/80 mt-1.5 flex items-center gap-1.5 line-clamp-1">
                        <span className="flex w-3 h-3 rotate-180 items-center justify-center bg-[#D4AF37]/20 rounded text-[8px]">💡</span> 
                        {email.summary}
                      </p>
                    </div>
                    <div className="text-[10px] text-slate-600 whitespace-nowrap">
                      {formatDistanceToNow(new Date(email.received_at))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  )
}
