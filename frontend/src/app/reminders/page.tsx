'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { getReminders, createReminder, completeReminder } from '@/lib/api'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { Bell, CheckCircle2, Clock, AlertTriangle, Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const DUMMY_REMINDERS = [
  { id: '7b2b6c7a-5b6d-47a3-b4d5-8f6a39d89b11', title: 'Call Sarah Chen re: timeline', message: 'Follow up on implementation timeline discussion', due_at: "2026-04-10T10:00:00Z", is_completed: false, lead_id: null },
  { id: '7b2b6c7a-5b6d-47a3-b4d5-8f6a39d89b12', title: 'Send revised contract to Finova', message: 'Address sections 4.2 and 7.1 raised by legal', due_at: "2026-04-11T14:30:00Z", is_completed: false, lead_id: null },
  { id: '7b2b6c7a-5b6d-47a3-b4d5-8f6a39d89b13', title: 'Contract prep for ScaleX AI', message: 'Finalize contract terms for board approval — urgent!', due_at: "2026-04-09T09:00:00Z", is_completed: false, lead_id: null },
  { id: '7b2b6c7a-5b6d-47a3-b4d5-8f6a39d89b14', title: 'Demo prep for NexaCloud', message: 'Personalized demo for David Kim', due_at: "2026-04-12T11:00:00Z", is_completed: false, lead_id: null },
  { id: '7b2b6c7a-5b6d-47a3-b4d5-8f6a39d89b15', title: 'Follow up with Carlos Rivera', message: 'Check logistics integration requirements', due_at: "2026-04-15T08:00:00Z", is_completed: false, lead_id: null },
  { id: '7b2b6c7a-5b6d-47a3-b4d5-8f6a39d89b16', title: 'Check in with HealthPlus', message: 'Send HIPAA compliance documentation', due_at: "2026-04-05T16:00:00Z", is_completed: false, lead_id: null },
]

export default function RemindersPage() {
  const [reminders, setReminders] = useState(DUMMY_REMINDERS)
  const [showForm, setShowForm] = useState(false)
  const [tab, setTab] = useState<'active' | 'completed'>('active')
  const [form, setForm] = useState({ title: '', message: '', due_at: '' })
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    getReminders().then((data: any) => { if (Array.isArray(data) && data.length) setReminders(data) }).catch(() => {})
  }, [])

  if (!isMounted) return <div className="min-h-screen bg-slate-950" />

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
    setShowForm(false); setForm({ title: '', message: '', due_at: '' })
  }

  const getUrgencyConfig = (due: string, isCompleted: boolean) => {
    if (isCompleted) return { color: 'text-slate-500', border: 'border-slate-800', bg: 'bg-slate-900' }
    if (isPast(new Date(due))) return { color: 'text-red-400', border: 'border-red-500/50', bg: 'bg-red-500/10' }
    const diff = new Date(due).getTime() - Date.now()
    if (diff < 3 * 3600000) return { color: 'text-amber-400', border: 'border-amber-500/50', bg: 'bg-amber-500/10' }
    return { color: 'text-[#D4AF37]', border: 'border-[#D4AF37]/30', bg: 'bg-[#D4AF37]/10' }
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <main className="flex-1 ms-64 p-8 xl:p-10 flex flex-col h-screen overflow-hidden">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Reminders</h1>
            <p className="text-sm text-slate-400">Never miss a follow-up. You have {active.length} active tasks.</p>
          </div>
          <Button className="bg-gradient-to-r from-[#D4AF37] to-[#B8963E] text-slate-950 hover:opacity-90 transition-opacity mt-4 md:mt-0" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Reminder
          </Button>
        </div>

        {overdue.length > 0 && (
           <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 mb-6 flex items-start gap-3 shrink-0">
             <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
             <div>
               <h4 className="text-sm font-bold text-red-400">Overdue Tasks</h4>
               <p className="text-xs text-red-300/80 mt-1">You have {overdue.length} priority task{overdue.length > 1 ? 's' : ''} past due. Please action them immediately to clear your pipeline.</p>
             </div>
           </div>
        )}

        <div className="flex gap-2 mb-6 shrink-0 border-b border-slate-800 pb-4">
          <Button variant="ghost" onClick={() => setTab('active')} 
            className={`text-sm ${tab === 'active' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}>
            <Bell className="w-4 h-4 mr-2" /> Pending ({active.length})
          </Button>
          <Button variant="ghost" onClick={() => setTab('completed')} 
            className={`text-sm ${tab === 'completed' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}>
             <CheckCircle2 className="w-4 h-4 mr-2" /> Completed ({completed.length})
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-4 custom-scrollbar">
           {(tab === 'active' ? active : completed).map(rem => {
             const u = getUrgencyConfig(rem.due_at, rem.is_completed)
             return (
               <Card key={rem.id} className={`bg-slate-900/50 border-l-4 ${u.border} border-t-slate-800 border-r-slate-800 border-b-slate-800`}>
                 <CardContent className="p-5 flex items-start gap-4">
                   <div 
                     className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${rem.is_completed ? 'bg-slate-700 border-slate-700' : `border-emerald-500 hover:bg-emerald-500/20`}`}
                     onClick={() => !rem.is_completed && handleComplete(rem.id)}
                   >
                     {rem.is_completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                   </div>
                   <div className="flex-1 min-w-0">
                     <h3 className={`text-base font-bold mb-1.5 ${rem.is_completed ? 'text-slate-500 line-through' : 'text-slate-100'}`}>{rem.title}</h3>
                     {rem.message && <p className="text-sm text-slate-400 mb-3">{rem.message}</p>}
                     <div className="flex items-center gap-2">
                       <Badge variant="outline" className={`text-[10px] font-semibold border-transparent uppercase tracking-wider px-2 py-0.5 ${u.bg} ${u.color}`}>
                         {rem.is_completed ? 'Finished' : isPast(new Date(rem.due_at)) ? 'Overdue' : 'Scheduled'}
                       </Badge>
                       <span className={`text-[11px] font-bold flex items-center gap-1 ${u.color}`}>
                         <Clock className="w-3 h-3" /> 
                         {formatDistanceToNow(new Date(rem.due_at), { addSuffix: true })}
                       </span>
                     </div>
                   </div>
                   <div className="text-right shrink-0">
                     <div className="text-[12px] font-medium text-slate-500 mb-2 flex items-center justify-end gap-1.5">
                       <Calendar className="w-3.5 h-3.5" /> {format(new Date(rem.due_at), 'MMM d, h:mm a')}
                     </div>
                     {!rem.is_completed && (
                       <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs px-3 h-8" onClick={() => handleComplete(rem.id)}>
                         Mark Done
                       </Button>
                     )}
                   </div>
                 </CardContent>
               </Card>
             )
           })}

           {(tab === 'active' ? active : completed).length === 0 && (
             <div className="p-16 text-center text-slate-500">
               <CheckCircle2 className="w-16 h-16 mx-auto text-slate-800 mb-4" />
               <h3 className="text-slate-300 font-semibold mb-1">Queue Empty</h3>
               <p className="text-sm">No tasks found for this view.</p>
             </div>
           )}
        </div>

        {/* Modal form */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
             <Card className="w-full max-w-md bg-slate-900 border border-slate-700 shadow-2xl">
               <div className="p-6 border-b border-slate-800">
                 <h2 className="text-lg font-bold text-white">Create Reminder</h2>
               </div>
               <CardContent className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Action Title *</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                           value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Context</label>
                    <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 min-h-[80px]" 
                           value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} />
                 </div>
                 <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Due Date & Time *</label>
                    <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" 
                           type="datetime-local" value={form.due_at} onChange={e => setForm(f => ({ ...f, due_at: e.target.value }))} />
                 </div>
                 <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-2">
                   <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                   <Button className="bg-[#D4AF37] text-slate-950 hover:bg-[#D4AF37]/90" onClick={handleCreate} disabled={!form.title || !form.due_at}>Save</Button>
                 </div>
               </CardContent>
             </Card>
          </div>
        )}

      </main>
    </div>
  )
}
