'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { getActivities, createActivity, getRecentCalls } from '@/lib/api'
import { format } from 'date-fns'
import { Phone, Mail, Users, CheckSquare, FileText, Plus, Filter, Smartphone, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const DUMMY_ACTIVITIES = [
  { id: '8c2a9d8f-4e1b-4f7c-9b1d-2a8b3c4d5e61', activity_type: 'call', title: 'Discovery call with Sarah Chen', description: 'Discussed enterprise plan features and pricing', outcome: 'Positive - scheduling demo next week', occurred_at: "2026-04-06T11:00:00Z", caller_number: '+1-555-0101', duration_seconds: '840' },
  { id: '8c2a9d8f-4e1b-4f7c-9b1d-2a8b3c4d5e62', activity_type: 'email', title: 'Sent proposal to Finova Capital', description: 'Sent detailed 3-year contract proposal', outcome: 'Delivered successfully', occurred_at: "2026-04-06T10:00:00Z" },
  { id: '8c2a9d8f-4e1b-4f7c-9b1d-2a8b3c4d5e63', activity_type: 'meeting', title: 'Product demo for ScaleX AI', description: 'Full platform walkthrough for the board', outcome: 'Board approved! Contract coming soon', occurred_at: "2026-04-05T14:00:00Z" },
  { id: '8c2a9d8f-4e1b-4f7c-9b1d-2a8b3c4d5e64', activity_type: 'call', title: 'Follow-up call with NexaCloud', description: 'Discussed cloud integration requirements', outcome: 'Moving to proposal stage', occurred_at: "2026-04-04T11:00:00Z", duration_seconds: '600' },
  { id: '8c2a9d8f-4e1b-4f7c-9b1d-2a8b3c4d5e65', activity_type: 'note', title: 'Research - AutoHaus GmbH', description: 'Researched company background and key decision makers', occurred_at: "2026-04-03T09:00:00Z" },
]

const ActivityIcons: any = { call: Phone, email: Mail, meeting: Users, note: FileText, task: CheckSquare }
const ActivityStyles: any = { 
  call: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30', 
  email: 'bg-sky-500/10 text-sky-500 border-sky-500/30', 
  meeting: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', 
  note: 'bg-amber-500/10 text-amber-500 border-amber-500/30', 
  task: 'bg-orange-500/10 text-orange-500 border-orange-500/30' 
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState(DUMMY_ACTIVITIES)
  const [calls, setCalls] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ activity_type: 'call', title: '', description: '', outcome: '' })
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    getActivities().then((data: any) => { if (Array.isArray(data) && data.length) setActivities(data) }).catch(() => {})
    getRecentCalls().then((d: any) => { if (d.calls?.length) setCalls(d.calls) }).catch(() => {})
  }, [])

  if (!isMounted) return <div className="min-h-screen bg-slate-950" />

  const filtered = activities.filter(a => filter === 'all' || a.activity_type === filter)

  const handleCreate = async () => {
    try {
      const data = await createActivity({ ...form, occurred_at: new Date().toISOString() })
      setActivities(prev => [data, ...prev])
    } catch {
      setActivities(prev => [{ id: Date.now().toString(), ...form, occurred_at: new Date().toISOString() } as any, ...prev])
    }
    setShowForm(false); setForm({ activity_type: 'call', title: '', description: '', outcome: '' })
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <main className="flex-1 ms-64 p-8 xl:p-10 flex flex-col h-screen overflow-hidden">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Activity Stream</h1>
            <p className="text-sm text-slate-400">Track and log your sales calls, emails, and meetings.</p>
          </div>
          <Button className="bg-gradient-to-r from-[#D4AF37] to-[#B8963E] text-slate-950 hover:opacity-90 transition-opacity mt-4 md:mt-0" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Log Activity
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8 shrink-0">
          {['all', 'call', 'email', 'meeting', 'note', 'task'].map(t => (
            <Button key={t} variant="outline" size="sm" onClick={() => setFilter(t)} 
              className={`capitalize text-xs h-9 ${filter === t ? 'bg-[#D4AF37]/10 border-[#D4AF37]/50 text-[#D4AF37]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}>
              {t === 'all' ? <Filter className="w-3.5 h-3.5 mr-2" /> : null}
              {t}
            </Button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col xl:flex-row gap-10 custom-scrollbar pr-4 pb-12">
          
          {/* Timeline Stream */}
          <div className="flex-1 relative border-l border-slate-800 ml-5 space-y-6">
            {filtered.map(act => {
              const Icon = ActivityIcons[act.activity_type] || FileText
              return (
                <div key={act.id} className="relative pl-8">
                  <div className={`absolute -left-[18px] top-4 w-9 h-9 rounded-full flex items-center justify-center border-4 border-slate-950 ${ActivityStyles[act.activity_type] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <Card className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors shadow-none">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-base font-bold text-slate-100">{act.title}</h3>
                        <span className="text-[11px] text-slate-500 font-medium whitespace-nowrap pl-4 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" /> {act.occurred_at ? format(new Date(act.occurred_at), 'MMM d, h:mm a') : ''}
                        </span>
                      </div>
                      {act.description && <p className="text-sm text-slate-400 mb-3 leading-relaxed">{act.description}</p>}
                      
                      <div className="flex flex-wrap gap-3 mt-3">
                        {act.outcome && (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5">
                            ✓ {act.outcome}
                          </Badge>
                        )}
                        {'duration_seconds' in act && act.duration_seconds && (
                          <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700 text-[10px] font-semibold tracking-wider">
                            ⏱ {Math.round(parseInt(String(act.duration_seconds)) / 60)} min call
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div className="pl-12 py-10 text-slate-500 text-sm">No activities matching this filter.</div>
            )}
          </div>

          {/* PBX Sync Panel */}
          {calls.length > 0 && (
            <div className="w-full xl:w-[350px] shrink-0">
               <Card className="bg-slate-900 border-slate-800 sticky top-0">
                 <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                   <h3 className="text-[13px] font-bold text-white tracking-wide flex items-center gap-2">
                     <Smartphone className="w-4 h-4 text-indigo-400" /> PBX Integration
                   </h3>
                   <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-[10px]">Live Sync</Badge>
                 </div>
                 <div className="p-0">
                   {calls.slice(0, 5).map((call: any, i: number) => (
                     <div key={i} className="p-4 border-b border-slate-800/50 last:border-b-0 flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-slate-950 flex items-center justify-center shrink-0 border border-slate-800">
                         {call.calltype === 'inbound' ? <Phone className="w-3.5 h-3.5 text-blue-400" /> : <Phone className="w-3.5 h-3.5 text-orange-400" />}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="text-xs font-bold text-slate-200 mb-0.5">{call.callid || 'PBX Call'}</div>
                         <div className="text-[10px] text-slate-500 truncate">{call.callernum} → {call.calleenum}</div>
                       </div>
                       <div className="text-right shrink-0">
                         <div className="text-[11px] text-slate-400 mb-1">{call.duration}s</div>
                         <div className="text-[9px] text-slate-600">{call.calldate?.split(' ')[0]}</div>
                       </div>
                     </div>
                   ))}
                 </div>
               </Card>
            </div>
          )}
        </div>

        {/* Modal form */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
             <Card className="w-full max-w-md bg-slate-900 border border-slate-700 shadow-2xl">
               <div className="p-6 border-b border-slate-800">
                 <h2 className="text-lg font-bold text-white">Log External Activity</h2>
               </div>
               <CardContent className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Type</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                            value={form.activity_type} onChange={e => setForm(f => ({ ...f, activity_type: e.target.value }))}>
                      {['call', 'email', 'meeting', 'note', 'task'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Title / Subject *</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                           value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Details</label>
                    <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 min-h-[100px]" 
                           value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Outcome (Optional)</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                           placeholder="e.g. Left voicemail" value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} />
                 </div>
                 <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-2">
                   <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                   <Button className="bg-[#D4AF37] text-slate-950 hover:bg-[#D4AF37]/90" onClick={handleCreate} disabled={!form.title}>Save Log</Button>
                 </div>
               </CardContent>
             </Card>
          </div>
        )}
      </main>
    </div>
  )
}
