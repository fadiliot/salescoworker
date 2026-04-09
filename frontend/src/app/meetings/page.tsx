'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CalendarDays, Plus, ChevronLeft, ChevronRight, Clock, Users, 
  Video, Phone, CheckSquare, X, Loader2, Zap, MapPin, Link as LinkIcon
} from 'lucide-react'
import API from '@/lib/api'

interface CalEvent {
  id: string
  subject: string
  start: string
  end: string
  source: 'google' | 'microsoft' | 'zoho'
  attendees?: string[]
  link?: string
  type?: string
}

const MEETING_TYPES = [
  { value: 'meeting', label: 'Meeting', icon: Video },
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'task', label: 'Task', icon: CheckSquare },
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function MeetingsPage() {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formType, setFormType] = useState<'google' | 'zoho'>('google')
  const [creating, setCreating] = useState(false)
  const [flash, setFlash] = useState('')
  const [leads, setLeads] = useState<any[]>([])

  const [form, setForm] = useState({
    subject: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    duration: '60',
    attendees: '',
    type: 'meeting',
    description: '',
    lead_id: '',
  })

  useEffect(() => {
    setLoading(true)
    API.get('/api/meetings').then(res => {
      setEvents(res.data.events || generateSampleEvents())
    }).catch(() => {
      setEvents(generateSampleEvents())
    }).finally(() => setLoading(false))

    API.get('/api/leads').then(res => {
      if (Array.isArray(res.data)) setLeads(res.data)
    }).catch(() => {})
  }, [])

  const generateSampleEvents = (): CalEvent[] => {
    const now = new Date()
    return [
      { id: '1', subject: 'Demo Call - TechCorp', start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 10, 0).toISOString(), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 11, 0).toISOString(), source: 'google', type: 'meeting', attendees: ['sarah.chen@techcorp.io'], link: 'https://meet.google.com/abc-defg-hij' },
      { id: '2', subject: 'Contract Review - Finova', start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 14, 0).toISOString(), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 15, 0).toISOString(), source: 'zoho', type: 'call', attendees: ['m.williams@finova.com'] },
      { id: '3', subject: 'Pipeline Review - Internal', start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4, 9, 0).toISOString(), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4, 9, 30).toISOString(), source: 'microsoft', type: 'meeting', attendees: [] },
      { id: '4', subject: 'Follow up - ScaleX AI', start: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 15, 0).toISOString(), end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5, 15, 30).toISOString(), source: 'zoho', type: 'task', attendees: ['aisha.d@scalex.ai'] },
    ]
  }

  const handleCreate = async () => {
    if (!form.subject || !form.date) return
    setCreating(true)
    try {
      const startISO = new Date(`${form.date}T${form.time}:00`).toISOString()
      const endISO = new Date(new Date(`${form.date}T${form.time}:00`).getTime() + parseInt(form.duration) * 60000).toISOString()
      const attendeeList = form.attendees.split(',').map(a => a.trim()).filter(Boolean)

      if (formType === 'google') {
        await API.post('/api/meetings/google', {
          subject: form.subject,
          start: startISO,
          end: endISO,
          attendees: attendeeList,
          description: form.description,
        })
        setFlash('✅ Google Meet event created!')
      } else {
        await API.post('/api/meetings/zoho', {
          subject: form.subject,
          start: startISO,
          end: endISO,
          type: form.type,
          attendees: attendeeList,
          description: form.description,
          lead_id: form.lead_id || null,
        })
        setFlash(`✅ Zoho CRM ${form.type} created!`)
      }

      // Add locally for immediate UI feedback
      setEvents(prev => [...prev, {
        id: Date.now().toString(),
        subject: form.subject,
        start: startISO,
        end: endISO,
        source: formType,
        type: form.type,
        attendees: attendeeList,
      }])
      setShowForm(false)
      setForm({ subject: '', date: new Date().toISOString().split('T')[0], time: '10:00', duration: '60', attendees: '', type: 'meeting', description: '', lead_id: '' })
    } catch {
      setFlash('⚠️ Could not create event via API — added locally. Check backend connection.')
    }
    setTimeout(() => setFlash(''), 4000)
    setCreating(false)
  }

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  const eventsThisMonth = events.filter(e => {
    const d = new Date(e.start)
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth
  })

  const getEventsForDay = (day: number) => {
    return eventsThisMonth.filter(e => new Date(e.start).getDate() === day)
  }

  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit', hour12: true })
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })

  const upcomingEvents = [...events].filter(e => new Date(e.start) >= new Date()).sort((a,b) => new Date(a.start).getTime() - new Date(b.start).getTime()).slice(0, 8)

  const sourceColor = (src: string) => src === 'google' ? 'bg-emerald-500' : src === 'microsoft' ? 'bg-blue-500' : 'bg-orange-500'
  const typeIcon = (t: string) => t === 'call' ? <Phone className="w-3 h-3" /> : t === 'task' ? <CheckSquare className="w-3 h-3" /> : <Video className="w-3 h-3" />

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <main className="flex-1 ms-64 p-8 xl:p-10 h-screen overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Meetings & Calendar</h1>
            <p className="text-sm text-slate-400">{events.length} events · {upcomingEvents.length} upcoming</p>
          </div>
          <Button className="bg-blue-600 text-white hover:bg-blue-500" onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" /> Schedule Event
          </Button>
        </div>

        {flash && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 text-sm text-blue-300">
            {flash}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-6">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-lg font-bold text-white">{MONTH_NAMES[currentMonth]} {currentYear}</h2>
                  <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 mb-2">
                  {DAY_NAMES.map(d => (
                    <div key={d} className="text-center text-[11px] font-bold text-slate-500 uppercase py-2">{d}</div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-16" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const dayEvents = getEventsForDay(day)
                    const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day
                    return (
                      <div key={day} className={`h-16 rounded-lg p-1.5 text-xs cursor-default group border transition-colors ${isToday ? 'bg-blue-600/20 border-blue-600/50' : 'border-transparent hover:border-slate-700 hover:bg-slate-800/30'}`}>
                        <span className={`font-semibold block mb-1 ${isToday ? 'text-blue-400' : 'text-slate-400'}`}>{day}</span>
                        <div className="space-y-0.5 overflow-hidden">
                          {dayEvents.slice(0, 2).map(ev => (
                            <div key={ev.id} title={ev.subject} className={`w-full text-[9px] leading-tight px-1 py-0.5 rounded truncate text-white flex items-center gap-1 ${sourceColor(ev.source)}`}>
                              {typeIcon(ev.type || 'meeting')}
                              <span className="truncate">{ev.subject}</span>
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-[9px] text-slate-500 pl-1">+{dayEvents.length - 2} more</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-800">
                  <span className="text-[11px] text-slate-500 font-medium">Sources:</span>
                  {[['Google', 'bg-emerald-500'], ['Microsoft', 'bg-blue-500'], ['Zoho CRM', 'bg-orange-500']].map(([label, cls]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${cls}`} />
                      <span className="text-[11px] text-slate-400">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Events Sidebar */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Upcoming Events</h3>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : upcomingEvents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">No upcoming events</div>
            ) : (
              upcomingEvents.map(ev => (
                <div key={ev.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg ${sourceColor(ev.source)} flex items-center justify-center text-white shrink-0 mt-0.5`}>
                      {typeIcon(ev.type || 'meeting')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{ev.subject}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <CalendarDays className="w-3 h-3" />
                        <span>{fmtDate(ev.start)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3" />
                        <span>{fmtTime(ev.start)} – {fmtTime(ev.end)}</span>
                      </div>
                      {ev.attendees && ev.attendees.length > 0 && (
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <Users className="w-3 h-3" />
                          <span className="truncate">{ev.attendees.join(', ')}</span>
                        </div>
                      )}
                      {ev.link && (
                        <a href={ev.link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 mt-1.5 text-[11px] text-blue-400 hover:text-blue-300">
                          <LinkIcon className="w-3 h-3" /> Join Meeting
                        </a>
                      )}
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[9px] border-slate-700 text-slate-500 capitalize">
                      {ev.source}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Schedule Event Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
            <Card className="w-full max-w-lg bg-slate-900 border border-slate-700 shadow-2xl">
              <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Schedule Event</h2>
                  <p className="text-sm text-slate-400 mt-0.5">Create via Google Meet or Zoho CRM</p>
                </div>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <CardContent className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">

                {/* Source Selector */}
                <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setFormType('google')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${formType === 'google' ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Video className="w-4 h-4" /> Google Meet
                  </button>
                  <button
                    onClick={() => setFormType('zoho')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${formType === 'zoho' ? 'bg-orange-600/20 text-orange-400 border border-orange-600/30' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <Zap className="w-4 h-4" /> Zoho CRM
                  </button>
                </div>

                {/* Meeting Type (Zoho only) */}
                {formType === 'zoho' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Type</label>
                    <div className="flex gap-2">
                      {MEETING_TYPES.map(mt => {
                        const Icon = mt.icon
                        return (
                          <button
                            key={mt.value}
                            onClick={() => setForm(f => ({ ...f, type: mt.value }))}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium border transition-all ${form.type === mt.value ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                          >
                            <Icon className="w-3.5 h-3.5" /> {mt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Subject *</label>
                  <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" placeholder="Meeting subject..." value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Date *</label>
                    <input type="date" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Time</label>
                    <input type="time" className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Duration (minutes)</label>
                  <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}>
                    {['15','30','45','60','90','120'].map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Attendees (emails, comma-separated)</label>
                  <input className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" placeholder="john@example.com, jane@example.com" value={form.attendees} onChange={e => setForm(f => ({ ...f, attendees: e.target.value }))} />
                </div>

                {formType === 'zoho' && leads.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Link to Lead</label>
                    <select className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50" value={form.lead_id} onChange={e => setForm(f => ({ ...f, lead_id: e.target.value }))}>
                      <option value="">No linked lead</option>
                      {leads.map((l: any) => <option key={l.id} value={l.id}>{l.first_name} {l.last_name} — {l.company}</option>)}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">Description (optional)</label>
                  <textarea className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 min-h-[80px]" placeholder="Agenda, talking points..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>

                <div className="flex gap-3 pt-2 border-t border-slate-800">
                  <Button variant="ghost" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button
                    className={`flex-1 ${formType === 'google' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-orange-600 hover:bg-orange-500 text-white'}`}
                    onClick={handleCreate}
                    disabled={creating || !form.subject}
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : formType === 'google' ? <Video className="w-4 h-4 mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                    {creating ? 'Creating...' : formType === 'google' ? 'Create Google Event' : `Create Zoho ${form.type}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
