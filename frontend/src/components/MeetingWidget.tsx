'use client'
import { useState } from 'react'
import API from '@/lib/api'
import { Calendar as CalendarIcon, Clock, X, Zap, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface Attendee {
  emailAddress: { address: string; name?: string }
}

interface MeetingEvent {
  id: string
  subject: string
  start: { dateTime: string }
  end: { dateTime: string }
  attendees?: Attendee[]
  location?: { displayName?: string }
  bodyPreview?: string
}

interface MeetingWidgetProps {
  events: MeetingEvent[]
}

export default function MeetingWidget({ events }: MeetingWidgetProps) {
  const [activeMeeting, setActiveMeeting] = useState<MeetingEvent | null>(null)
  const [brief, setBrief] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const fmt = (d: string) => {
    const dt = new Date(d)
    return dt.toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true })
  }
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-AE', { weekday: 'short', month: 'short', day: 'numeric' })

  const handleFetchBrief = async (event: MeetingEvent) => {
    setActiveMeeting(event)
    setBrief([])
    setLoading(true)
    try {
      const attendeeEmails = (event.attendees || [])
        .map((a: Attendee) => a.emailAddress?.address)
        .filter(Boolean)
        .join(',')
      const res = await API.get(`/api/ai/tear-sheet/${event.id}`, { params: { attendee_emails: attendeeEmails } })
      setBrief(res.data.brief || [])
    } catch {
      setBrief([
        'Could not generate brief — check backend connection.',
        'Review attendee history manually before the call.',
        'Prepare discovery questions for first-contact meetings.',
        'Check open deals in the Pipeline before joining.',
      ])
    }
    setLoading(false)
  }

  if (!events.length) {
    return (
      <div className="py-6 text-center text-slate-500 text-[13px] bg-slate-900 rounded-lg border border-dashed border-slate-700">
        <CalendarIcon className="w-6 h-6 mx-auto mb-2 opacity-30" />
        No upcoming meetings in the next 48 hours.
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {events.map(ev => (
          <div key={ev.id}
            onClick={() => handleFetchBrief(ev)}
            className="group flex items-start justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-[#D4AF37]/50 hover:bg-slate-900 transition-all cursor-pointer shadow-sm"
          >
            <div className="flex-1 min-w-0 pr-3">
              <div className="text-[13px] font-bold text-slate-200 group-hover:text-white truncate transition-colors">
                {ev.subject}
              </div>
              <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {fmtDate(ev.start.dateTime)}</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {fmt(ev.start.dateTime)} – {fmt(ev.end.dateTime)}</span>
              </div>
            </div>
            
            <Badge variant="outline" className="shrink-0 bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30 px-2 py-0 h-6 text-[10px] font-bold tracking-wider rounded-md group-hover:bg-[#D4AF37]/20 transition-colors">
              <Zap className="w-3 h-3 mr-1" /> Brief
            </Badge>
          </div>
        ))}
      </div>

      <Dialog open={!!activeMeeting} onOpenChange={(open) => !open && setActiveMeeting(null)}>
         <DialogContent className="sm:max-w-[550px] bg-slate-950 border border-[#D4AF37]/30 shadow-[0_24px_80px_rgba(0,0,0,0.5)] p-0 overflow-hidden text-left">
           {activeMeeting && (
             <>
              <div className="p-6 border-b border-slate-800 bg-slate-900/50 relative">
                <div className="text-[10px] text-[#D4AF37] font-bold tracking-[0.2em] mb-1.5 flex items-center gap-2">
                  <Zap className="w-3 h-3" fill="currentColor" /> AI PRE-MEETING TEAR SHEET
                </div>
                <DialogTitle className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight pr-8">
                  {activeMeeting.subject}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-3 text-[12px] text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> {fmtDate(activeMeeting.start.dateTime)}</div>
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {fmt(activeMeeting.start.dateTime)} – {fmt(activeMeeting.end.dateTime)}</div>
                </div>

                {/* Attendees */}
                {activeMeeting.attendees && activeMeeting.attendees.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activeMeeting.attendees.slice(0, 5).map((a: Attendee, i: number) => (
                      <Badge key={i} variant="secondary" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[10px]">
                        {a.emailAddress?.name || a.emailAddress?.address}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-950 max-h-[50vh] overflow-y-auto">
                {loading ? (
                   <div className="flex flex-col flex-1 items-center justify-center py-8 text-slate-400">
                     <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37] mb-4" />
                     <p className="text-sm font-medium tracking-wide">Generating executive brief...</p>
                     <p className="text-xs text-slate-500 mt-1">Analyzing recent emails and deals</p>
                   </div>
                ) : (
                  <div className="space-y-4">
                    {brief.map((bullet, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="shrink-0 w-6 h-6 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30">
                          <span className="text-[#D4AF37] font-black text-xs">{i + 1}</span>
                        </div>
                        <p className="text-[13px] leading-relaxed text-slate-300 pt-0.5">
                          {bullet}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
             </>
           )}
         </DialogContent>
      </Dialog>
    </>
  )
}
