'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { getLeads, createLead, deleteLead, rescoreLead, scoreAllLeads } from '@/lib/api'

const DUMMY_LEADS = [
  { id: '1', first_name: 'Sarah', last_name: 'Chen', email: 'sarah.chen@techcorp.io', company: 'TechCorp Inc', title: 'VP of Operations', status: 'qualified', source: 'email', score: 85, is_hot: 'true', phone: '+1-555-0101', created_at: new Date().toISOString() },
  { id: '2', first_name: 'Marcus', last_name: 'Williams', email: 'm.williams@finova.com', company: 'Finova Capital', title: 'CFO', status: 'proposal', source: 'referral', score: 72, is_hot: 'true', phone: '+1-555-0102', created_at: new Date().toISOString() },
  { id: '3', first_name: 'Priya', last_name: 'Patel', email: 'priya@growthlab.co', company: 'GrowthLab', title: 'CEO', status: 'contacted', source: 'website', score: 61, is_hot: 'false', phone: '+1-555-0103', created_at: new Date().toISOString() },
  { id: '4', first_name: 'James', last_name: "O'Brien", email: 'jobrien@retailmax.com', company: 'RetailMax', title: 'Procurement Manager', status: 'new', source: 'linkedin', score: 45, is_hot: 'false', phone: '+1-555-0104', created_at: new Date().toISOString() },
  { id: '5', first_name: 'Aisha', last_name: 'Diallo', email: 'aisha.d@scalex.ai', company: 'ScaleX AI', title: 'CTO', status: 'negotiation', source: 'email', score: 91, is_hot: 'true', phone: '+1-555-0105', created_at: new Date().toISOString() },
  { id: '6', first_name: 'Tom', last_name: 'Hanks', email: 'tom.hanks@movieprod.net', company: 'Movie Productions', title: 'Director', status: 'won', source: 'referral', score: 98, is_hot: 'false', phone: '+1-555-0106', created_at: new Date().toISOString() },
  { id: '7', first_name: 'Lena', last_name: 'Müller', email: 'lena.muller@autohaus.de', company: 'AutoHaus GmbH', title: 'General Manager', status: 'contacted', source: 'phone', score: 55, is_hot: 'false', phone: '+49-555-0107', created_at: new Date().toISOString() },
  { id: '8', first_name: 'Carlos', last_name: 'Rivera', email: 'carlos@logipro.mx', company: 'LogiPro', title: 'Logistics Director', status: 'qualified', source: 'website', score: 68, is_hot: 'false', phone: '+52-555-0108', created_at: new Date().toISOString() },
  { id: '9', first_name: 'Emily', last_name: 'Johnson', email: 'emily.j@healthplus.org', company: 'HealthPlus', title: 'Procurement Lead', status: 'new', source: 'email', score: 38, is_hot: 'false', phone: '+1-555-0109', created_at: new Date().toISOString() },
  { id: '10', first_name: 'David', last_name: 'Kim', email: 'dkim@nexacloud.com', company: 'NexaCloud', title: 'Founder & CEO', status: 'proposal', source: 'linkedin', score: 79, is_hot: 'true', phone: '+1-555-0110', created_at: new Date().toISOString() },
]

const STATUSES = ['all', 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 70 ? 'score-high' : score >= 40 ? 'score-mid' : 'score-low'
  return <span className={`score-badge ${cls}`}>{score}</span>
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status}`}>{status}</span>
}

export default function LeadsPage() {
  const [leads, setLeads] = useState(DUMMY_LEADS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', company: '', title: '', status: 'new', source: 'manual' })

  useEffect(() => {
    getLeads().then((data: any) => { if (Array.isArray(data) && data.length) setLeads(data) }).catch(() => {})
  }, [])

  const filtered = leads.filter(l => {
    const name = `${l.first_name} ${l.last_name}`.toLowerCase()
    const matchSearch = !search || name.includes(search.toLowerCase()) || l.email?.toLowerCase().includes(search.toLowerCase()) || l.company?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || l.status === statusFilter
    return matchSearch && matchStatus
  })

  const handleCreate = async () => {
    try {
      const newLead = await createLead(form)
      setLeads(prev => [newLead, ...prev])
    } catch {
      setLeads(prev => [{ id: Date.now().toString(), ...form, score: 30, is_hot: 'false', created_at: new Date().toISOString() } as any, ...prev])
    }
    setShowForm(false)
    setForm({ first_name: '', last_name: '', email: '', phone: '', company: '', title: '', status: 'new', source: 'manual' })
  }

  const handleScoreAll = async () => {
    setScoring(true)
    try { await scoreAllLeads(); const data = await getLeads(); if (Array.isArray(data)) setLeads(data) } catch {}
    setScoring(false)
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Leads</h1>
            <p className="page-subtitle">{filtered.length} leads shown</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-ghost" onClick={handleScoreAll} disabled={scoring}>{scoring ? '⏳ Scoring…' : '🤖 AI Score All'}</button>
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Lead</button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input className="search-input" placeholder="🔍 Search leads…" value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 240 }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`} style={{ textTransform: 'capitalize' }}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Company</th>
                  <th>Phone</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => (
                  <tr key={lead.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                          {lead.first_name[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {lead.first_name} {lead.last_name}
                            {lead.is_hot === 'true' && <span className="hot-badge pulse">🔥</span>}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lead.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 13 }}>{lead.company}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lead.title}</div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{lead.phone}</td>
                    <td style={{ fontSize: 13 }}><span style={{ background: 'var(--bg-glass)', padding: '2px 8px', borderRadius: 6, fontSize: 12 }}>{lead.source}</span></td>
                    <td><StatusBadge status={lead.status} /></td>
                    <td><ScoreBadge score={lead.score} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Rescore" onClick={() => rescoreLead(lead.id).catch(() => {})}>🤖</button>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Email" onClick={() => window.location.href = '/inbox'}>📧</button>
                        <button className="btn btn-danger btn-sm btn-icon" title="Delete" onClick={async () => { try { await deleteLead(lead.id) } catch {} setLeads(prev => prev.filter(l => l.id !== lead.id)) }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <div className="empty-text">No leads found</div>
                <div className="empty-sub">Try adjusting your filters</div>
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
            <div className="modal">
              <div className="modal-title">Create New Lead</div>
              <div className="two-col">
                <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="two-col">
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Company</label><input className="form-input" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
              </div>
              <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="two-col">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-input form-select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {['new','contacted','qualified','proposal','negotiation'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Source</label>
                  <select className="form-input form-select" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                    {['manual','email','phone','website','referral','linkedin','zoho','other'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={!form.first_name}>Create Lead</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
