'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { getDeals, updateDealStage, createDeal } from '@/lib/api'

const STAGES = [
  { key: 'new', label: 'New', color: '#6366f1' },
  { key: 'contacted', label: 'Contacted', color: '#60a5fa' },
  { key: 'proposal', label: 'Proposal', color: '#c084fc' },
  { key: 'negotiation', label: 'Negotiation', color: '#f97316' },
  { key: 'won', label: 'Won 🎉', color: '#10b981' },
  { key: 'lost', label: 'Lost', color: '#ef4444' },
]

const DUMMY_DEALS = [
  { id: '1', title: 'TechCorp Enterprise License', stage: 'proposal', amount: '45000', currency: 'USD', probability: '70', notes: 'Discussing implementation timeline' },
  { id: '2', title: 'Finova Capital Integration Suite', stage: 'negotiation', amount: '120000', currency: 'USD', probability: '85', notes: 'Legal reviewing contract clauses' },
  { id: '3', title: 'GrowthLab Starter Package', stage: 'contacted', amount: '8500', currency: 'USD', probability: '40', notes: 'Initial interest shown' },
  { id: '4', title: 'ScaleX AI Platform Deal', stage: 'negotiation', amount: '95000', currency: 'USD', probability: '90', notes: 'Board sign-off pending this Friday' },
  { id: '5', title: 'Movie Productions Media Suite', stage: 'won', amount: '22000', currency: 'USD', probability: '100', notes: 'Contract signed!' },
  { id: '6', title: 'AutoHaus CRM Deal', stage: 'new', amount: '18000', currency: 'USD', probability: '20', notes: 'Early exploratory stage' },
  { id: '7', title: 'NexaCloud Annual Contract', stage: 'proposal', amount: '62000', currency: 'USD', probability: '65', notes: 'Personalised proposal sent' },
  { id: '8', title: 'RetailMax POS Integration', stage: 'contacted', amount: '15000', currency: 'USD', probability: '35', notes: 'Demo scheduled' },
]

export default function PipelinePage() {
  const [deals, setDeals] = useState(DUMMY_DEALS)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', stage: 'new', amount: '', currency: 'USD', probability: '', notes: '' })

  useEffect(() => {
    getDeals().then((data: any) => { if (Array.isArray(data) && data.length) setDeals(data) }).catch(() => {})
  }, [])

  const dealsByStage = (stage: string) => deals.filter(d => d.stage === stage)
  const totalPipeline = deals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
  const wonValue = deals.filter(d => d.stage === 'won').reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)

  const handleDragStart = (id: string) => setDragging(id)
  const handleDrop = async (stage: string) => {
    if (!dragging) return
    setDeals(prev => prev.map(d => d.id === dragging ? { ...d, stage } : d))
    try { await updateDealStage(dragging, stage) } catch {}
    setDragging(null)
    setDragOver(null)
  }

  const handleCreate = async () => {
    try {
      const deal = await createDeal(form)
      setDeals(prev => [...prev, deal])
    } catch {
      setDeals(prev => [...prev, { id: Date.now().toString(), ...form } as any])
    }
    setShowForm(false)
    setForm({ title: '', stage: 'new', amount: '', currency: 'USD', probability: '', notes: '' })
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Pipeline</h1>
            <p className="page-subtitle">${totalPipeline.toLocaleString()} total pipeline · ${wonValue.toLocaleString()} won</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ New Deal</button>
        </div>

        {/* Summary bar */}
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)', marginBottom: 24 }}>
          {STAGES.map(s => {
            const stageDeals = dealsByStage(s.key)
            const val = stageDeals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
            return (
              <div key={s.key} className="card" style={{ padding: '14px 16px', borderTop: `2px solid ${s.color}` }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{stageDeals.length}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>${val.toLocaleString()}</div>
              </div>
            )
          })}
        </div>

        {/* Kanban board */}
        <div className="pipeline-board">
          {STAGES.map(stage => (
            <div key={stage.key} className="pipeline-col"
              onDragOver={e => { e.preventDefault(); setDragOver(stage.key) }}
              onDrop={() => handleDrop(stage.key)}
              style={{ borderTop: `3px solid ${stage.color}`, opacity: dragOver === stage.key ? 0.85 : 1, background: dragOver === stage.key ? 'rgba(99,102,241,0.05)' : undefined }}>
              <div className="pipeline-col-header">
                <div className="pipeline-col-title" style={{ color: stage.color }}>{stage.label}</div>
                <div className="pipeline-col-count">{dealsByStage(stage.key).length}</div>
              </div>
              {dealsByStage(stage.key).map(deal => (
                <div key={deal.id} className="deal-card" draggable
                  onDragStart={() => handleDragStart(deal.id)}
                  onDragEnd={() => { setDragging(null); setDragOver(null) }}>
                  <div className="deal-title">{deal.title}</div>
                  <div className="deal-amount">${parseFloat(deal.amount || '0').toLocaleString()}</div>
                  <div className="deal-meta">
                    {deal.probability && <span>🎯 {deal.probability}% probability</span>}
                  </div>
                  {deal.notes && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, padding: '6px 8px', background: 'var(--bg-glass)', borderRadius: 6 }}>
                      {deal.notes}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>⋮ Drag to move stage</div>
                </div>
              ))}
              {dealsByStage(stage.key).length === 0 && (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)' }}>
                  Drop deals here
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Deal Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
            <div className="modal">
              <div className="modal-title">Create New Deal</div>
              <div className="form-group"><label className="form-label">Deal Title *</label><input className="form-input" placeholder="e.g. Acme Corp - Enterprise" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="two-col">
                <div className="form-group"><label className="form-label">Amount (USD)</label><input className="form-input" type="number" placeholder="50000" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Probability %</label><input className="form-input" type="number" placeholder="70" value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))} /></div>
              </div>
              <div className="form-group">
                <label className="form-label">Stage</label>
                <select className="form-input form-select" value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                  {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div className="form-group"><label className="form-label">Notes</label><textarea className="form-textarea" placeholder="Any notes about this deal…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={!form.title}>Create Deal</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
