'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { getReminders, createReminder, completeReminder } from '@/lib/api'
import { format, formatDistanceToNow, isPast } from 'date-fns'

const DUMMY_REMINDERS = [
  { id: 'r1', title: 'Call Sarah Chen re: timeline', message: 'Follow up on implementation timeline discussion', due_at: new Date(Date.now() + 7200000).toISOString(), is_completed: false, lead_id: null },
  { id: 'r2', title: 'Send revised contract to Finova', message: 'Address sections 4.2 and 7.1 raised by legal', due_at: new Date(Date.now() + 18000000).toISOString(), is_completed: false, lead_id: null },
  { id: 'r3', title: 'Contract prep for ScaleX AI ⚡', message: 'Finalize contract terms for board approval — urgent!', due_at: new Date(Date.now() + 3600000).toISOString(), is_completed: false, lead_id: null },
  { id: 'r4', title: 'Demo prep for NexaCloud', message: 'Personalized demo for David Kim', due_at: new Date(Date.now() + 86400000).toISOString(), is_completed: false, lead_id: null },
  { id: 'r5', title: 'Follow up with Carlos Rivera', message: 'Check logistics integration requirements', due_at: new Date(Date.now() + 172800000).toISOString(), is_completed: false, lead_id: null },
  { id: 'r6', title: 'Check in with HealthPlus', message: 'Send HIPAA compliance documentation', due_at: new Date(Date.now() - 3600000).toISOString(), is_completed: false, lead_id: null },
]

export default function RemindersPage() {
  const [reminders, setReminders] = useState(DUMMY_REMINDERS)
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState<'active' | 'completed'>('active')
  const [form, setForm] = useState({ title: '', message: '', due_at: '' })

  useEffect(() => {
    getReminders().then((data: any) => { if (Array.isArray(data) && data.length) setReminders(data) }).catch(() => {})
  }, [])

  const active = reminders.filter(r => !r.is_completed)
  const completed = reminders.filter(r => r.is_completed)
  const overdue = active.filter(r => isPast(new Date(r.due_at)))

  const handleComplete = async (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, is_completed: true } : r))
    try { await completeReminder(id) } catch {}
  }

  const handleCreate = async () => {
    try {
      const data = await createReminder(form)
      setReminders(prev => [...prev, data])
    } catch {
      setReminders(prev => [...prev, { id: Date.now().toString(), ...form, is_completed: false, lead_id: null }])
    }
    setShowForm(false)
    setForm({ title: '', message: '', due_at: '' })
  }

  const urgencyColor = (due: string, completed: boolean) => {
    if (completed) return 'var(--success)'
    if (isPast(new Date(due))) return 'var(--danger)'
    const diff = new Date(due).getTime() - Date.now()
    if (diff < 3 * 3600000) return 'var(--warning)'
    return 'var(--text-muted)'
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Reminders</h1>
            <p className="page-subtitle">{active.length} active · {overdue.length} overdue</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Reminder</button>
        </div>

        {overdue.length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius)', padding: '12px 20px', marginBottom: 20, fontSize: 13, color: 'var(--danger)' }}>
            ⚠️ You have <strong>{overdue.length}</strong> overdue reminder{overdue.length > 1 ? 's' : ''} — take action now!
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button onClick={() => setTab('active')} className={`btn btn-sm ${tab === 'active' ? 'btn-primary' : 'btn-ghost'}`}>Active ({active.length})</button>
          <button onClick={() => setTab('completed')} className={`btn btn-sm ${tab === 'completed' ? 'btn-primary' : 'btn-ghost'}`}>Completed ({completed.length})</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(tab === 'active' ? active : completed).map(rem => (
            <div key={rem.id} className="card" style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 20px', borderLeft: `3px solid ${urgencyColor(rem.due_at, rem.is_completed)}` }}>
              <div style={{ paddingTop: 2 }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${urgencyColor(rem.due_at, rem.is_completed)}`, background: rem.is_completed ? urgencyColor(rem.due_at, rem.is_completed) : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s' }}
                  onClick={() => !rem.is_completed && handleComplete(rem.id)}>
                  {rem.is_completed && <span style={{ color: 'white', fontSize: 12 }}>✓</span>}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, textDecoration: rem.is_completed ? 'line-through' : 'none', color: rem.is_completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>{rem.title}</div>
                {rem.message && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>{rem.message}</div>}
                <div style={{ fontSize: 12, color: urgencyColor(rem.due_at, rem.is_completed), fontWeight: 600 }}>
                  {rem.is_completed ? '✓ Completed' : isPast(new Date(rem.due_at)) ? `⚠️ Overdue — was due ${formatDistanceToNow(new Date(rem.due_at), { addSuffix: true })}` : `⏰ Due ${formatDistanceToNow(new Date(rem.due_at), { addSuffix: true })}`}
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'right', whiteSpace: 'nowrap' }}>
                {format(new Date(rem.due_at), 'MMM d, h:mm a')}
                {!rem.is_completed && (
                  <div style={{ marginTop: 8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleComplete(rem.id)}>Mark Done</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {(tab === 'active' ? active : completed).length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">{tab === 'active' ? '🎉' : '📋'}</div>
              <div className="empty-text">{tab === 'active' ? 'All caught up!' : 'No completed reminders yet'}</div>
              <div className="empty-sub">{tab === 'active' ? 'No pending reminders.' : 'Complete reminders to see them here.'}</div>
            </div>
          )}
        </div>

        {showForm && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
            <div className="modal">
              <div className="modal-title">New Reminder</div>
              <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Message</label><textarea className="form-textarea" style={{ minHeight: 80 }} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Due Date & Time *</label><input className="form-input" type="datetime-local" value={form.due_at} onChange={e => setForm(f => ({ ...f, due_at: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={!form.title || !form.due_at}>Create Reminder</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
