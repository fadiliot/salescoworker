'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { getLeads, createLead, deleteLead, rescoreLead, scoreAllLeads } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Filter, Bot, Mail, Trash2, Zap } from 'lucide-react'

const DUMMY_LEADS = [
  { id: '550e8400-e29b-41d4-a716-446655440001', first_name: 'Sarah', last_name: 'Chen', email: 'sarah.chen@techcorp.io', company: 'TechCorp Inc', title: 'VP of Operations', status: 'qualified', source: 'email', score: 85, is_hot: 'true', phone: '+1-555-0101', created_at: "2026-04-05T10:00:00Z" },
  { id: '550e8400-e29b-41d4-a716-446655440002', first_name: 'Marcus', last_name: 'Williams', email: 'm.williams@finova.com', company: 'Finova Capital', title: 'CFO', status: 'proposal', source: 'referral', score: 72, is_hot: 'true', phone: '+1-555-0102', created_at: "2026-04-05T09:00:00Z" },
  { id: '550e8400-e29b-41d4-a716-446655440003', first_name: 'Priya', last_name: 'Patel', email: 'priya@growthlab.co', company: 'GrowthLab', title: 'CEO', status: 'contacted', source: 'website', score: 61, is_hot: 'false', phone: '+1-555-0103', created_at: "2026-04-04T12:00:00Z" },
  { id: '550e8400-e29b-41d4-a716-446655440004', first_name: 'James', last_name: "O'Brien", email: 'jobrien@retailmax.com', company: 'RetailMax', title: 'Procurement Manager', status: 'new', source: 'linkedin', score: 45, is_hot: 'false', phone: '+1-555-0104', created_at: "2026-04-04T11:00:00Z" },
  { id: '550e8400-e29b-41d4-a716-446655440005', first_name: 'Aisha', last_name: 'Diallo', email: 'aisha.d@scalex.ai', company: 'ScaleX AI', title: 'CTO', status: 'negotiation', source: 'email', score: 91, is_hot: 'true', phone: '+1-555-0105', created_at: "2026-04-03T15:00:00Z" },
  { id: '550e8400-e29b-41d4-a716-446655440006', first_name: 'Tom', last_name: 'Hanks', email: 'tom.hanks@movieprod.net', company: 'Movie Productions', title: 'Director', status: 'won', source: 'referral', score: 98, is_hot: 'false', phone: '+1-555-0106', created_at: "2026-04-01T09:00:00Z" },
]

const STATUSES = ['all', 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost']

function ScoreBadge({ score }: { score: number }) {
  if (score >= 70) return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">{score}</Badge>
  if (score >= 40) return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">{score}</Badge>
  return <Badge className="bg-slate-500/10 text-slate-400 border-slate-500/20">{score}</Badge>
}

function StatusBadge({ status }: { status: string }) {
  const cmap: Record<string, string> = {
    new: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    contacted: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    qualified: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    proposal: 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20',
    negotiation: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    won: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    lost: 'text-red-400 bg-red-400/10 border-red-400/20',
  }
  return <Badge variant="outline" className={`uppercase tracking-wider text-[10px] font-bold ${cmap[status] || 'text-slate-400 border-slate-700'}`}>{status}</Badge>
}

export default function LeadsPage() {
  const [leads, setLeads] = useState(DUMMY_LEADS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', company: '', title: '', status: 'new', source: 'manual' })
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    getLeads().then((data: any) => { if (Array.isArray(data) && data.length) setLeads(data) }).catch(() => {})
  }, [])

  if (!isMounted) return <div className="min-h-screen bg-slate-950" />

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
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <main className="flex-1 ms-64 p-8 xl:p-10 flex flex-col h-screen overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 shrink-0 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Leads</h1>
            <p className="text-sm text-slate-400">{filtered.length} leads matching criteria</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800" onClick={handleScoreAll} disabled={scoring}>
              <Bot className="w-4 h-4 mr-2 text-indigo-400" /> {scoring ? 'Scoring...' : 'AI Score All'}
            </Button>
            <Button className="bg-gradient-to-r from-[#D4AF37] to-[#B8963E] text-slate-950 hover:opacity-90 transition-opacity" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Lead
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col xl:flex-row gap-4 mb-6 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              className="w-full xl:w-80 bg-slate-900 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 transition-all placeholder:text-slate-600"
              placeholder="Search leads, companies..." 
              value={search} onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <Button key={s} variant="outline" size="sm" 
                onClick={() => setStatusFilter(s)}
                className={`text-xs capitalize h-9 ${statusFilter === s ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 text-[#D4AF37]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="flex-1 overflow-hidden flex flex-col border border-slate-800 bg-slate-900 rounded-xl relative">
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
                <tr>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-800">Lead</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-800">Company</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-800">Phone</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-800">Source</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-800">Status</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-800">Score</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-800 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filtered.map(lead => (
                  <tr key={lead.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-[#D4AF37] shrink-0 border border-slate-700">
                          {lead.first_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-slate-200 group-hover:text-white flex items-center gap-2">
                            {lead.first_name} {lead.last_name}
                            {lead.is_hot === 'true' && <Zap className="w-3 h-3 text-orange-500 fill-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />}
                          </div>
                          <div className="text-xs text-slate-500">{lead.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm text-slate-300">{lead.company}</div>
                      <div className="text-xs text-slate-500">{lead.title}</div>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-400">{lead.phone}</td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-xs">{lead.source}</span>
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={lead.status} /></td>
                    <td className="py-3 px-4"><ScoreBadge score={lead.score} /></td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-400 hover:bg-slate-800" title="Rescore" onClick={() => rescoreLead(lead.id).catch(() => {})}>
                          <Bot className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800" title="Email" onClick={() => window.location.href = '/inbox'}>
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/30" title="Delete" onClick={async () => { try { await deleteLead(lead.id) } catch {} setLeads(prev => prev.filter(l => l.id !== lead.id)) }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filtered.length === 0 && (
               <div className="p-12 flex flex-col items-center justify-center text-center">
                 <Filter className="w-12 h-12 text-slate-800 mb-4" />
                 <h3 className="text-slate-300 font-semibold">No leads found</h3>
                 <p className="text-slate-500 text-sm mt-1">Try adjusting your search or status filters</p>
               </div>
            )}
          </div>
        </div>

        {/* Modal Overlay */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
            <Card className="w-full max-w-lg bg-slate-900 border border-slate-700 shadow-2xl overflow-y-auto max-h-screen">
              <div className="p-6 border-b border-slate-800">
                <h2 className="text-xl font-bold text-white">Create New Lead</h2>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">First Name *</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                           value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Last Name</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                           value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Email</label>
                  <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                         type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Phone</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                           value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Company</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                           value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Title</label>
                  <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                         value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                            value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      {['new','contacted','qualified','proposal','negotiation'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Source</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                            value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                      {['manual','email','phone','website','referral','linkedin','zoho','other'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                  <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button className="bg-[#D4AF37] text-slate-950 hover:bg-[#D4AF37]/90" onClick={handleCreate} disabled={!form.first_name}>Create Lead</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
