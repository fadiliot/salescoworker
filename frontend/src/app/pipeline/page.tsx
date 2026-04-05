'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import StakeholderMap from '@/components/StakeholderMap'
import { getDeals, updateDealStage, createDeal } from '@/lib/api'
import { Plus, Users, LayoutList, Target, CircleDollarSign } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const STAGES = [
  { key: 'new', label: 'New', color: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-500' },
  { key: 'contacted', label: 'Contacted', color: 'border-cyan-500', bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
  { key: 'proposal', label: 'Proposal', color: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-500' },
  { key: 'negotiation', label: 'Negotiation', color: 'border-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-500' },
  { key: 'won', label: 'Won 🎉', color: 'border-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  { key: 'lost', label: 'Lost', color: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-500' },
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

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 xl:p-10 flex flex-col h-screen overflow-hidden">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 shrink-0 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Pipeline</h1>
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-[#D4AF37]">AED {totalPipeline.toLocaleString()}</span> total pipeline · <span className="text-emerald-400 font-semibold">AED {wonValue.toLocaleString()}</span> won
            </p>
          </div>
          <Button className="bg-gradient-to-r from-[#D4AF37] to-[#B8963E] text-slate-950 hover:opacity-90 transition-opacity whitespace-nowrap" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Deal
          </Button>
        </div>

        {/* Summary Metric Board */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6 shrink-0">
          {STAGES.map(s => {
            const stageDeals = dealsByStage(s.key)
            const val = stageDeals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)
            return (
              <Card key={s.key} className={`bg-slate-900 border-t-2 border-r-0 border-l-0 border-b-0 border-slate-800 ${s.color}`}>
                <CardContent className="p-4 flex flex-col justify-between h-full">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">{s.label}</div>
                  <div>
                    <div className="text-2xl font-black text-white leading-none mb-1">{stageDeals.length}</div>
                    <div className="text-xs text-slate-400">AED {val.toLocaleString()}</div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Kanban Board Area */}
        <div className="flex-1 flex gap-5 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <div key={stage.key} className="flex flex-col w-[300px] shrink-0"
              onDragOver={e => { e.preventDefault(); setDragOver(stage.key) }}
              onDrop={() => handleDrop(stage.key)}>
              
              {/* Column Header */}
              <div className={`mb-3 pb-2 flex items-center justify-between border-b-2 ${dragOver === stage.key ? `border-b` : ''} ${stage.color}`}>
                <div className={`font-semibold text-sm ${stage.text}`}>{stage.label}</div>
                <Badge variant="outline" className="border-slate-700 bg-slate-800/50 text-slate-400">{dealsByStage(stage.key).length}</Badge>
              </div>

              {/* Column Content */}
              <div className={`flex-1 overflow-y-auto space-y-3 p-1 rounded-xl transition-colors ${dragOver === stage.key ? 'bg-slate-800/80 ring-1 ring-[#D4AF37]/50' : ''}`}>
                {dealsByStage(stage.key).map(deal => (
                  <Card key={deal.id} draggable
                    className="bg-slate-900 border-slate-700 hover:border-[#D4AF37]/50 hover:shadow-[0_4px_12px_rgba(212,175,55,0.05)] transition-all cursor-grab active:cursor-grabbing"
                    onDragStart={() => handleDragStart(deal.id)}
                    onDragEnd={() => { setDragging(null); setDragOver(null) }}>
                    <CardContent className="p-4">
                      {/* Deal Title */}
                      <div className="font-semibold text-sm text-slate-100 mb-2 leading-snug">{deal.title}</div>
                      
                      {/* Meta Info */}
                      <div className="flex items-end justify-between mb-3">
                        <div className="text-lg font-black text-emerald-400 leading-none">
                          <span className="text-[10px] text-emerald-400/60 font-semibold mr-1">AED</span>
                          {parseFloat(deal.amount || '0').toLocaleString()}
                        </div>
                        {deal.probability && (
                          <div className="flex items-center text-[10px] text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded bg-slate-950">
                            <Target className="w-3 h-3 mr-1 text-[#D4AF37]" /> {deal.probability}%
                          </div>
                        )}
                      </div>

                      {/* Notes snippet */}
                      {deal.notes && (
                        <div className="text-[11px] text-slate-400 bg-slate-950 p-2 rounded-md border border-slate-800 mb-3 truncate hover:whitespace-normal transition-all">
                          {deal.notes}
                        </div>
                      )}

                      {/* View Stakeholders Action */}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full h-8 text-[11px] font-bold tracking-wider uppercase text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37]/10"
                        onClick={e => { e.stopPropagation(); setSelectedDeal(deal) }}>
                        <Users className="w-3 h-3 mr-2" /> Stakeholders
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                
                {dealsByStage(stage.key).length === 0 && (
                  <div className="py-8 px-4 text-center border-2 border-dashed border-slate-800 rounded-xl">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Drop deal here</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Stakeholder Map Overlay */}
        {selectedDeal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8 overflow-y-auto w-screen" onClick={() => setSelectedDeal(null)}>
            <div className="bg-slate-950 border border-[#D4AF37]/30 rounded-2xl w-full max-w-4xl shadow-[0_24px_80px_rgba(0,0,0,0.5)] my-auto" onClick={e => e.stopPropagation()}>
              <div className="p-6 border-b border-slate-800 flex justify-between items-start">
                <div>
                  <div className="text-[10px] text-[#D4AF37] font-bold tracking-[0.2em] mb-1">STAKEHOLDER MAP</div>
                  <h2 className="text-xl md:text-2xl font-bold text-white">{selectedDeal.title}</h2>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge variant="outline" className={`${STAGES.find(s => s.key === selectedDeal.stage)?.text} ${STAGES.find(s => s.key === selectedDeal.stage)?.bg} ${STAGES.find(s => s.key === selectedDeal.stage)?.color} uppercase tracking-wider text-[10px]`}>
                      {selectedDeal.stage}
                    </Badge>
                    <span className="text-sm font-semibold text-[#D4AF37]">
                      AED {parseFloat(selectedDeal.amount || '0').toLocaleString()}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="hover:bg-slate-800 rounded-full" onClick={() => setSelectedDeal(null)}>
                  ✕
                </Button>
              </div>
              <div className="p-6">
                <StakeholderMap
                  contacts={DUMMY_CONTACTS[selectedDeal.id] || []}
                  dealStage={selectedDeal.stage}
                  onRoleChange={(contactId, role) => {
                    console.log(`Contact ${contactId} role updated to ${role}`)
                    // API request logic goes here
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Add Deal Modal Overlay */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
            <Card className="w-full max-w-lg bg-slate-900 border-slate-700 shadow-xl">
              <CardHeader className="border-b border-slate-800 mb-4 pb-4">
                <CardTitle>Create New Deal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Deal Title</label>
                  <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                         placeholder="e.g. Al Habtoor Group — Enterprise" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Amount (AED)</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                           type="number" placeholder="50000" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Probability %</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                           type="number" placeholder="70" value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Stage</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                          value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                    {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Notes</label>
                  <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 min-h-[80px]" 
                            placeholder="Any notes about this deal…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button className="bg-[#D4AF37] text-slate-950 hover:bg-[#D4AF37]/90" onClick={handleCreate} disabled={!form.title}>Create Deal</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
