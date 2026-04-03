'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { getDashboardStats, getReminders, completeReminder, syncIntegrations, getPipelineInsights } from '@/lib/api'
import { format, formatDistanceToNow } from 'date-fns'

const DUMMY_STATS = {
  summary: { total_leads: 10, hot_leads: 4, new_leads: 3, total_deals: 8, won_deals: 1, win_rate: 12.5, total_emails: 5, unread_emails: 3, pending_reminders: 5, overdue_reminders: 0 },
  deal_stages: { new: 2, contacted: 2, proposal: 2, negotiation: 2, won: 1, lost: 0 },
  recent_leads: [
    { id: '1', name: 'Sarah Chen', company: 'TechCorp Inc', email: 'sarah@techcorp.io', score: 85, status: 'qualified', is_hot: 'true', created_at: new Date(Date.now()-3600000).toISOString() },
    { id: '2', name: 'Aisha Diallo', company: 'ScaleX AI', email: 'aisha@scalex.ai', score: 91, status: 'negotiation', is_hot: 'true', created_at: new Date(Date.now()-7200000).toISOString() },
    { id: '3', name: 'Marcus Williams', company: 'Finova Capital', email: 'm.williams@finova.com', score: 72, status: 'proposal', is_hot: 'true', created_at: new Date(Date.now()-86400000).toISOString() },
    { id: '4', name: 'David Kim', company: 'NexaCloud', email: 'dkim@nexacloud.com', score: 79, status: 'proposal', is_hot: 'true', created_at: new Date(Date.now()-172800000).toISOString() },
    { id: '5', name: 'Priya Patel', company: 'GrowthLab', email: 'priya@growthlab.co', score: 61, status: 'contacted', is_hot: 'false', created_at: new Date(Date.now()-259200000).toISOString() },
  ],
  recent_emails: [
    { id: 'e1', from: 'sarah.chen@techcorp.io', subject: 'Re: Enterprise License Pricing', summary: 'Sarah wants to discuss implementation timeline before committing.', is_read: false, received_at: new Date(Date.now()-3600000).toISOString() },
    { id: 'e2', from: 'aisha.d@scalex.ai', subject: 'Final approval pending board sign-off', summary: 'Board approved the deal! Contract needs to be prepared urgently.', is_read: false, received_at: new Date(Date.now()-7200000).toISOString() },
    { id: 'e3', from: 'm.williams@finova.com', subject: 'Urgent: Contract Terms Review', summary: 'Legal team flagged contract clauses 4.2 and 7.1.', is_read: false, received_at: new Date(Date.now()-14400000).toISOString() },
  ],
}

const DUMMY_REMINDERS = [
  { id: 'r1', title: 'Call Sarah Chen re: timeline', message: 'Follow up on implementation timeline discussion', due_at: new Date(Date.now()+7200000).toISOString(), is_completed: false },
  { id: 'r2', title: 'Send revised contract to Finova', message: 'Address sections 4.2 and 7.1', due_at: new Date(Date.now()+18000000).toISOString(), is_completed: false },
  { id: 'r3', title: 'Contract prep for ScaleX AI', message: 'Finalize contract terms for board approval', due_at: new Date(Date.now()+3600000).toISOString(), is_completed: false },
  { id: 'r4', title: 'Demo prep for NexaCloud', message: 'Personalized demo for David Kim', due_at: new Date(Date.now()+86400000).toISOString(), is_completed: false },
]

const DUMMY_INSIGHTS = {
  health_score: 74,
  insights: [
    '🔥 4 hot leads require immediate attention today',
    '📧 3 unread emails with high-priority replies needed',
    '📈 Win rate at 12.5% — focus on pushing proposals to close',
  ],
  focus_areas: ['Hot lead follow-ups', 'Contract finalization'],
}

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 70 ? 'score-high' : score >= 40 ? 'score-mid' : 'score-low'
  return <span className={`score-badge ${cls}`}>{score}</span>
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status}`}>{status}</span>
}

export default function Dashboard() {
  const [stats, setStats] = useState(DUMMY_STATS)
  const [reminders, setReminders] = useState(DUMMY_REMINDERS)
  const [insights, setInsights] = useState(DUMMY_INSIGHTS)
  const [syncing, setSyncing] = useState(false)
  const [flash, setFlash] = useState('')

  useEffect(() => {
    getDashboardStats().then(setStats).catch(() => {})
    getReminders({ upcoming_only: true }).then((data: any) => { if (Array.isArray(data) && data.length) setReminders(data) }).catch(() => {})
    getPipelineInsights().then(setInsights).catch(() => {})
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    try { await syncIntegrations(); setFlash('Sync started in background') } catch { setFlash('Sync failed — check integrations') }
    setTimeout(() => setFlash(''), 3000)
    setSyncing(false)
  }

  const handleComplete = async (id: string) => {
    setReminders(r => r.filter(x => x.id !== id))
    try { await completeReminder(id) } catch {}
  }

  const isDue = (due: string) => new Date(due) < new Date()
  const isSoon = (due: string) => new Date(due) < new Date(Date.now() + 3 * 3600 * 1000)

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {flash && (
          <div style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: 'var(--accent)' }}>
            ✅ {flash}
          </div>
        )}

        <div className="page-header">
          <div>
            <h1 className="page-title">Good afternoon, Sales Team 👋</h1>
            <p className="page-subtitle">{format(new Date(), 'EEEE, MMMM d, yyyy')} — Here's your pipeline overview</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={handleSync} disabled={syncing}>
              {syncing ? '⏳ Syncing…' : '🔄 Sync All'}
            </button>
            <button className="btn btn-primary" onClick={() => window.location.href = '/leads'}>
              + New Lead
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple">👥</div>
            <div className="stat-value">{stats.summary.total_leads}</div>
            <div className="stat-label">Total Leads</div>
            <div className="stat-change">↑ {stats.summary.new_leads} new this week</div>
          </div>
          <div className="stat-card hot">
            <div className="stat-icon orange">🔥</div>
            <div className="stat-value" style={{ color: 'var(--hot)' }}>{stats.summary.hot_leads}</div>
            <div className="stat-label">Hot Leads</div>
            <div className="stat-change" style={{ color: 'var(--hot)' }}>Action required now</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">💰</div>
            <div className="stat-value">{stats.summary.total_deals}</div>
            <div className="stat-label">Active Deals</div>
            <div className="stat-change">{stats.summary.win_rate}% win rate</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue">📧</div>
            <div className="stat-value">{stats.summary.unread_emails}</div>
            <div className="stat-label">Unread Emails</div>
            <div className="stat-change">Awaiting reply</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon red">🔔</div>
            <div className="stat-value">{stats.summary.pending_reminders}</div>
            <div className="stat-label">Reminders</div>
            <div className="stat-change" style={{ color: 'var(--warning)' }}>{stats.summary.overdue_reminders} overdue</div>
          </div>
        </div>

        {/* Main grid */}
        <div className="two-col" style={{ marginBottom: 20 }}>

          {/* Recent Leads */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>🔥 Hot Leads</h2>
              <a href="/leads" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>View all →</a>
            </div>
            <div>
              {stats.recent_leads.map((lead: any) => (
                <div key={lead.id} onClick={() => window.location.href = `/leads/${lead.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {lead.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {lead.name}
                      {lead.is_hot === 'true' && <span className="hot-badge">🔥 Hot</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lead.company}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <ScoreBadge score={lead.score} />
                    <StatusBadge status={lead.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="ai-panel">
              <div className="ai-panel-header">
                ⚡ AI Pipeline Insights
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>Health Score</span>
                <span style={{ fontSize: 20, fontWeight: 800, color: insights.health_score >= 70 ? 'var(--success)' : 'var(--warning)', marginLeft: 4 }}>{insights.health_score}</span>
              </div>
              <div className="progress-bar" style={{ marginBottom: 16 }}>
                <div className="progress-fill" style={{ width: `${insights.health_score}%` }} />
              </div>
              {insights.insights.map((ins: string, i: number) => (
                <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '6px 0', borderBottom: i < insights.insights.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  {ins}
                </div>
              ))}
            </div>

            {/* Reminders */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>🔔 Today's Reminders</h2>
                <a href="/reminders" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>View all →</a>
              </div>
              {reminders.slice(0, 4).map((rem: any) => (
                <div key={rem.id} className="reminder-item">
                  <div className={`reminder-dot ${isDue(rem.due_at) ? 'urgent' : isSoon(rem.due_at) ? 'soon' : 'later'}`} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{rem.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      {isDue(rem.due_at) ? '⚠️ Overdue' : `Due ${formatDistanceToNow(new Date(rem.due_at), { addSuffix: true })}`}
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleComplete(rem.id)}>✓</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Emails */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>📧 Recent Emails</h2>
            <a href="/inbox" style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>Open Inbox →</a>
          </div>
          {stats.recent_emails.map((email: any) => (
            <div key={email.id} className={`email-item${email.is_read ? '' : ' unread'}`} onClick={() => window.location.href = '/inbox'}>
              <div className="email-avatar">{email.from?.[0]?.toUpperCase() || '?'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="email-subject">{email.subject}</div>
                <div className="email-from">{email.from}</div>
                {email.summary && (
                  <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 3 }}>💡 {email.summary}</div>
                )}
              </div>
              {!email.is_read && <span style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%', flexShrink: 0, marginTop: 6 }} />}
              <div className="email-time">{email.received_at ? formatDistanceToNow(new Date(email.received_at), { addSuffix: true }) : ''}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
