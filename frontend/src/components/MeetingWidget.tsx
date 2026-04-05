'use client'
import { useState } from 'react'
import API from '@/lib/api'

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

  const closeModal = () => { setActiveMeeting(null); setBrief([]) }

  if (!events.length) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
        📅 No upcoming meetings in the next 48 hours.
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {events.map(ev => (
          <div key={ev.id}
            onClick={() => handleFetchBrief(ev)}
            style={{
              padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
              background: 'var(--bg-glass)',
              border: '1px solid var(--border)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ev.subject}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {fmtDate(ev.start.dateTime)} • {fmt(ev.start.dateTime)} – {fmt(ev.end.dateTime)}
                  {ev.location?.displayName ? ` • ${ev.location.displayName}` : ''}
                </div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                background: 'rgba(212,175,55,0.12)', color: '#D4AF37', marginLeft: 8, flexShrink: 0
              }}>
                ⚡ Brief
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Tear Sheet Modal */}
      {activeMeeting && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}
          onClick={closeModal}
        >
          <div
            style={{
              background: 'var(--bg-secondary)', borderRadius: 16, padding: '28px 32px',
              maxWidth: 520, width: '100%', border: '1px solid rgba(212,175,55,0.25)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, color: '#D4AF37', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>PRE-MEETING BRIEF</div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{activeMeeting.subject}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {fmtDate(activeMeeting.start.dateTime)} • {fmt(activeMeeting.start.dateTime)}
                </div>
              </div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1 }}>✕</button>
            </div>

            {/* Attendees */}
            {activeMeeting.attendees && activeMeeting.attendees.length > 0 && (
              <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {activeMeeting.attendees.slice(0, 5).map((a: Attendee, i: number) => (
                  <span key={i} style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 20,
                    background: 'rgba(59,130,246,0.1)', color: '#3B82F6', border: '1px solid rgba(59,130,246,0.2)'
                  }}>
                    {a.emailAddress?.name || a.emailAddress?.address}
                  </span>
                ))}
              </div>
            )}

            {/* Brief bullets */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 13 }}>
                  <div style={{ width: 16, height: 16, border: '2px solid #D4AF37', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Generating AI brief...
                </div>
              ) : (
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {brief.map((bullet, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <span style={{ color: '#D4AF37', fontWeight: 800, fontSize: 15, lineHeight: 1.3 }}>{i + 1}.</span>
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
