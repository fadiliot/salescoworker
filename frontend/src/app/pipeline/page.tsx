'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import StakeholderMap from '@/components/StakeholderMap'
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
  { id: '1', title: 'Al Habtoor Group — CRM Suite', stage: 'proposal', amount: '165000', currency: 'AED', probability: '70', notes: 'Discussing implementation timeline', lead_id: '1' },
  { id: '2', title: 'Emirates NBD — Integration Platform', stage: 'negotiation', amount: '440000', currency: 'AED', probability: '85', notes: 'Legal reviewing contract clauses', lead_id: '2' },
  { id: '3', title: 'Damac Properties — Lead Mgmt', stage: 'contacted', amount: '31000', currency: 'AED', probability: '40', notes: 'Initial interest shown', lead_id: '3' },
  { id: '4', title: 'Majid Al Futtaim — AI Platform', stage: 'negotiation', amount: '349000', currency: 'AED', probability: '90', notes: 'Board sign-off pending this Friday', lead_id: '4' },
  { id: '5', title: 'Dubai Holding — SaaS Bundle', stage: 'won', amount: '80000', currency: 'AED', probability: '100', notes: 'Contract signed!', lead_id: '5' },
  { id: '6', title: 'ADNOC Digital — Workflow Tool', stage: 'new', amount: '66000', currency: 'AED', probability: '20', notes: 'Early exploratory stage', lead_id: '6' },
]

const DUMMY_CONTACTS: Record<string, any[]> = {
  '1': [
    { id: 'c1', first_name: 'Khalid', last_name: 'Al Habtoor', title: 'Group CEO', email: 'k.habtoor@alhabtoor.ae', role_type: 'Economic Buyer' },
    { id: 'c2', first_name: 'Sara', last_name: 'Al Mansoori', title: 'IT Director', email: 'sara.m@alhabtoor.ae', role_type: 'Champion' },
  ],
  '2': [
    { id: 'c3', first_name: 'Mohammed', last_name: 'Al Gergawi', title: 'SVP Technology', email: 'm.gergawi@emiratesnbd.com', role_type: 'Economic Buyer' },
    { id: 'c4', first_name: 'Fatima', last_name: 'Al Rashidi', title: 'Procurement Manager', email: 'fatima.r@emiratesnbd.com', role_type: 'Gatekeeper' },
    { id: 'c5', first_name: 'Rania', last_name: 'Khouri', title: 'Legal Counsel', email: 'r.khouri@emiratesnbd.com', role_type: 'Legal' },
  ],
  '4': [
    { id: 'c6', first_name: 'Alain', last_name: 'Bejjani', title: 'Group CEO', email: 'a.bejjani@maf.ae', role_type: 'Economic Buyer' },
    { id: 'c7', first_name: 'Nour', last_name: 'Saleh', title: 'Head of Innovation', email: 'n.saleh@maf.ae', role_type: 'Evaluator' },
  ],
}

export default function PipelinePage() {
  const [deals, setDeals] = useState(DUMMY_DEALS)
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null)
  const [form, setForm] = useState({ title: '', stage: 'new', amount: '', currency: 'AED', probability: '', notes: '' })

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
    setForm({ title: '', stage: 'new', amount: '', currency: 'AED', probability: '', notes: '' })
  }

  const stageColor = (stage: string) => STAGES.find(s => s.key === stage)?.color || 'var(--accent)'

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Pipeline</h1>
            <p className="page-subtitle">AED {totalPipeline.toLocaleString()} total · AED {wonValue.toLocaleString()} won</p>
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
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>AED {val.toLocaleString()}</div>
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
                  <div className="deal-amount">AED {parseFloat(deal.amount || '0').toLocaleString()}</div>
                  <div className="deal-meta">
                    {deal.probability && <span>🎯 {deal.probability}% probability</span>}
                  </div>
                  {deal.notes && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, padding: '6px 8px', background: 'var(--bg-glass)', borderRadius: 6 }}>
                      {deal.notes}
                    </div>
                  )}
                  {/* Stakeholder peek */}
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedDeal(deal) }}
                    style={{
                      marginTop: 10, width: '100%', padding: '5px', borderRadius: 6, fontSize: 11,
                      background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)',
                      color: '#D4AF37', cursor: 'pointer', fontWeight: 600,
                    }}>
                    👥 View Stakeholders
                  </button>
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

        {/* Stakeholder Map Panel */}
        {selectedDeal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }} onClick={() => setSelectedDeal(null)}>
            <div style={{
              background: 'var(--bg-secondary)', borderRadius: 16, padding: '28px 32px',
              maxWidth: 640, width: '100%', maxHeight: '80vh', overflowY: 'auto',
              border: '1px solid rgba(212,175,55,0.2)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            }} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#D4AF37', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>STAKEHOLDER MAP</div>
                  <div style={{ fontSize: 17, fontWeight: 800 }}>{selectedDeal.title}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: stageColor(selectedDeal.stage), fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: `${stageColor(selectedDeal.stage)}18`, border: `1px solid ${stageColor(selectedDeal.stage)}30` }}>
                      {selectedDeal.stage}
                    </span>
                    <span style={{ fontSize: 12, color: '#D4AF37', fontWeight: 600 }}>AED {parseFloat(selectedDeal.amount || '0').toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedDeal(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
              </div>

              <StakeholderMap
                contacts={DUMMY_CONTACTS[selectedDeal.id] || []}
                dealStage={selectedDeal.stage}
                onRoleChange={(contactId, role) => {
                  console.log(`Contact ${contactId} role updated to ${role}`)
                  // TODO: persist via API /api/contacts/{id}/role
                }}
              />
            </div>
          </div>
        )}

        {/* Add Deal Modal */}
        {showForm && (
          <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
            <div className="modal">
              <div className="modal-title">Create New Deal</div>
              <div className="form-group"><label className="form-label">Deal Title *</label><input className="form-input" placeholder="e.g. Al Habtoor Group — Enterprise" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div className="two-col">
                <div className="form-group"><label className="form-label">Amount (AED)</label><input className="form-input" type="number" placeholder="50000" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
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
