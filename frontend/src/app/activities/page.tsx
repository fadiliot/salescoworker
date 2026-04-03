'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { getActivities, createActivity, getRecentCalls } from '@/lib/api'
import { format } from 'date-fns'

const DUMMY_ACTIVITIES = [
  { id: 'a1', activity_type: 'call', title: 'Discovery call with Sarah Chen', description: 'Discussed enterprise plan features and pricing', outcome: 'Positive - scheduling demo next week', occurred_at: new Date(Date.now() - 3600000).toISOString(), caller_number: '+1-555-0101', duration_seconds: '840' },
  { id: 'a2', activity_type: 'email', title: 'Sent proposal to Finova Capital', description: 'Sent detailed 3-year contract proposal', outcome: 'Delivered successfully', occurred_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'a3', activity_type: 'meeting', title: 'Product demo for ScaleX AI', description: 'Full platform walkthrough for the board', outcome: 'Board approved! Contract coming soon', occurred_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'a4', activity_type: 'call', title: 'Follow-up call with NexaCloud', description: 'Discussed cloud integration requirements', outcome: 'Moving to proposal stage', occurred_at: new Date(Date.now() - 172800000).toISOString(), duration_seconds: '600' },
  { id: 'a5', activity_type: 'note', title: 'Research - AutoHaus GmbH', description: 'Researched company background and key decision makers', occurred_at: new Date(Date.now() - 259200000).toISOString() },
]

const TYPE_ICONS: Record<string, string> = { call: '📞', email: '📧', meeting: '🤝', note: '📝', task: '✅' }
const TYPE_COLORS: Record<string, string> = { call: '#6366f1', email: '#60a5fa', meeting: '#10b981', note: '#f59e0b', task: '#f97316' }

export default function ActivitiesPage() {
  const [activities, setActivities] = useState(DUMMY_ACTIVITIES)
  const [calls, setCalls] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ activity_type: 'call', title: '', description: '', outcome: '' })

  useEffect(() => {
    getActivities().then((data: any) => { if (Array.isArray(data) && data.length) setActivities(data) }).catch(() => {})
    getRecentCalls().then((d: any) => { if (d.calls?.length) setCalls(d.calls) }).catch(() => {})
  }, [])

  const filtered = activities.filter(a => filter === 'all' || a.activity_type === filter)

  const handleCreate = async () => {
    try {
      const data = await createActivity({ ...form, occurred_at: new Date().toISOString() })
      setActivities(prev => [data, ...prev])
    } catch {
      setActivities(prev => [{ id: Date.now().toString(), ...form, occurred_at: new Date().toISOString() } as any, ...prev])
    }
    setShowForm(false)
    setForm({ activity_type: 'call', title: '', description: '', outcome: '' })
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Activities</h1>
            <p className="page-subtitle">Track all calls, emails, meetings, and tasks</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Log Activity</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {['all', 'call', 'email', 'meeting', 'note', 'task'].map(t => (
            <button key={t} onClick={() => setFilter(t)} className={`btn btn-sm ${filter === t ? 'btn-primary' : 'btn-ghost'}`}>
              {TYPE_ICONS[t] || '📋'} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />
          {filtered.map((act, i) => (
            <div key={act.id} style={{ display: 'flex', gap: 20, marginBottom: 24, position: 'relative' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: TYPE_COLORS[act.activity_type] + '20', border: `2px solid ${TYPE_COLORS[act.activity_type]}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, flexShrink: 0, zIndex: 1 }}>
                {TYPE_ICONS[act.activity_type]}
              </div>
              <div className="card" style={{ flex: 1, padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{act.title}</div>
                    {act.description && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{act.description}</div>}
                    {act.outcome && <div style={{ fontSize: 12, color: 'var(--success)', padding: '3px 10px', background: 'rgba(16,185,129,0.1)', borderRadius: 12, display: 'inline-block' }}>✓ {act.outcome}</div>}
                    {'duration_seconds' in act && act.duration_seconds && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>⏱ {Math.round(parseInt(String(act.duration_seconds)) / 60)} min call</div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {act.occurred_at ? format(new Date(act.occurred_at), 'MMM d, h:mm a') : ''}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PBX Call Logs */}
        {calls.length > 0 && (
          <div className="card" style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>📞 Yeastar PBX Recent Calls</h3>
            {calls.slice(0, 5).map((call: any, i: number) => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span>{call.calltype === 'inbound' ? '📲' : '📤'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{call.callid || 'Call #' + (i + 1)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{call.callernum} → {call.calleenum} · {call.duration}s</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{call.calldate}</div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
            <div className="modal">
              <div className="modal-title">Log Activity</div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-input form-select" value={form.activity_type} onChange={e => setForm(f => ({ ...f, activity_type: e.target.value }))}>
                  {['call', 'email', 'meeting', 'note', 'task'].map(t => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Outcome</label><input className="form-input" value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={!form.title}>Log Activity</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
