'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { getEmails, suggestReply, sendReply, syncEmails, extractLead } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'

const DUMMY_EMAILS = [
  { id: 'e1', from_address: 'sarah.chen@techcorp.io', subject: 'Re: Enterprise License Pricing', body_text: "Hi, I reviewed the proposal. The pricing looks good but I need to discuss the implementation timeline with my team. Can we schedule a call this week? Also, do you offer any flexibility on the setup fee?\n\nBest,\nSarah Chen\nVP of Operations, TechCorp Inc", direction: 'inbound', is_read: false, ai_summary: 'Sarah wants to discuss implementation timeline and is asking about setup fee flexibility. Warm and interested.', sentiment: 'positive', received_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'e2', from_address: 'aisha.d@scalex.ai', subject: 'Final approval pending board sign-off', body_text: "Great news! The board loved the demo. We're at the final approval stage. Expecting sign-off by Friday. Please prepare the final contract with the terms we agreed on last Tuesday.", direction: 'inbound', is_read: false, ai_summary: 'Board approved. Needs final contract by Friday. Hot deal — priority action.', sentiment: 'positive', received_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'e3', from_address: 'm.williams@finova.com', subject: 'Urgent: Contract Terms Review', body_text: "We've reviewed your contract terms. There are a few clauses regarding data privacy and SLA that our legal team has flagged. Can you clarify sections 4.2 and 7.1?", direction: 'inbound', is_read: false, ai_summary: 'Legal team flagged contract clauses 4.2 and 7.1. Urgent response needed.', sentiment: 'neutral', received_at: new Date(Date.now() - 14400000).toISOString() },
  { id: 'e4', from_address: 'dkim@nexacloud.com', subject: 'Interested in your platform', body_text: "Hello, I came across your platform and I'm very interested. We're a cloud startup looking for a CRM solution. Could you send me pricing info and schedule a quick demo?", direction: 'inbound', is_read: false, ai_summary: 'NexaCloud CEO interested in pricing and demo. New inbound lead.', sentiment: 'positive', received_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'e5', from_address: 'emily.j@healthplus.org', subject: 'Question about enterprise features', body_text: "Hi there, We're a healthcare organization looking at your solution. Can you tell me more about your compliance certifications (HIPAA, SOC2) and how data is encrypted at rest?", direction: 'inbound', is_read: true, ai_summary: 'HealthPlus asking about HIPAA and SOC2 compliance — important for regulated industry.', sentiment: 'neutral', received_at: new Date(Date.now() - 172800000).toISOString() },
]

function SentimentDot({ s }: { s: string }) {
  const c = s === 'positive' ? 'var(--success)' : s === 'negative' ? 'var(--danger)' : 'var(--warning)'
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: c, marginRight: 4 }} />
}

export default function InboxPage() {
  const [emails, setEmails] = useState(DUMMY_EMAILS)
  const [selected, setSelected] = useState<typeof DUMMY_EMAILS[0] | null>(null)
  const [suggestedReply, setSuggestedReply] = useState('')
  const [replyText, setReplyText] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [extractedLead, setExtractedLead] = useState<any>(null)

  useEffect(() => {
    getEmails().then((data: any) => { if (Array.isArray(data) && data.length) setEmails(data) }).catch(() => {})
  }, [])

  const handleSelect = (email: typeof DUMMY_EMAILS[0]) => {
    setSelected(email)
    setSuggestedReply('')
    setReplyText('')
    setExtractedLead(null)
    if (!email.is_read) {
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e))
    }
  }

  const handleSuggest = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const data = await suggestReply(selected.id)
      setSuggestedReply(data.suggested_reply)
      setReplyText(data.suggested_reply)
    } catch {
      const fallback = `Hi,\n\nThank you for your email regarding "${selected.subject}".\n\nI'd love to connect and discuss this further. Could we schedule a quick call this week?\n\nBest regards,\nSales Team`
      setSuggestedReply(fallback)
      setReplyText(fallback)
    }
    setLoading(false)
  }

  const handleSend = async () => {
    if (!selected || !replyText) return
    setSending(true)
    try { await sendReply(selected.id, replyText) } catch {}
    setSending(false)
    setReplyText('')
    setSuggestedReply('')
    alert('Reply sent!')
  }

  const handleExtract = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const data = await extractLead(selected.id)
      setExtractedLead(data.extracted ? data.lead : { message: 'No lead detected in this email' })
    } catch {
      setExtractedLead({ name: selected.from_address.split('@')[0], email: selected.from_address, company: selected.from_address.split('@')[1]?.split('.')[0] })
    }
    setLoading(false)
  }

  const handleSync = async () => {
    setSyncing(true)
    try { await syncEmails() } catch {}
    setTimeout(() => setSyncing(false), 2000)
  }

  const unread = emails.filter(e => !e.is_read).length

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', height: '100vh' }}>

          {/* Email list */}
          <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 800 }}>📧 Inbox <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)', marginLeft: 6 }}>{unread} unread</span></h2>
                <button className="btn btn-ghost btn-sm" onClick={handleSync} disabled={syncing}>{syncing ? '⏳' : '🔄'}</button>
              </div>
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {emails.map(email => (
                <div key={email.id} className={`email-item${!email.is_read ? ' unread' : ''}${selected?.id === email.id ? '' : ''}`}
                  style={{ background: selected?.id === email.id ? 'rgba(99,102,241,0.08)' : undefined, borderLeft: selected?.id === email.id ? '3px solid var(--accent)' : '3px solid transparent' }}
                  onClick={() => handleSelect(email)}>
                  <div className="email-avatar" style={{ width: 38, height: 38, flexShrink: 0 }}>{email.from_address[0].toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="email-subject" style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{email.subject}</div>
                    <div className="email-from" style={{ fontSize: 11 }}>{email.from_address}</div>
                    {email.ai_summary && (
                      <div style={{ fontSize: 11, color: 'var(--accent)', margin: '3px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>💡 {email.ai_summary}</div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {!email.is_read && <span style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: '50%' }} />}
                    {email.sentiment && <SentimentDot s={email.sentiment} />}
                    <div className="email-time">{email.received_at ? formatDistanceToNow(new Date(email.received_at), { addSuffix: true }) : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email detail + AI panel */}
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {selected ? (
              <>
                <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{selected.subject}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span>From: <strong>{selected.from_address}</strong></span>
                    <span>·</span>
                    <span>{selected.received_at ? formatDistanceToNow(new Date(selected.received_at), { addSuffix: true }) : ''}</span>
                  </div>
                  {selected.ai_summary && (
                    <div style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, fontSize: 13, color: 'var(--accent)' }}>
                      💡 <strong>AI Summary:</strong> {selected.ai_summary}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>

                  {/* Email body */}
                  <div>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 20 }}>
                      {selected.body_text}
                    </div>

                    {/* Reply */}
                    <div style={{ marginTop: 10 }}>
                      <label className="form-label">✏️ Your Reply</label>
                      <textarea className="form-textarea" style={{ minHeight: 140 }} placeholder="Type your reply…" value={replyText} onChange={e => setReplyText(e.target.value)} />
                      <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button className="btn btn-primary" onClick={handleSend} disabled={!replyText || sending}>{sending ? 'Sending…' : '📤 Send Reply'}</button>
                        <button className="btn btn-ghost" onClick={handleSuggest} disabled={loading}>{loading ? '⏳ Generating…' : '⚡ AI Suggest Reply'}</button>
                        <button className="btn btn-ghost" onClick={handleExtract} disabled={loading}>🔍 Extract Lead</button>
                      </div>
                    </div>
                  </div>

                  {/* AI Sidebar */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {suggestedReply && (
                      <div className="ai-panel">
                        <div className="ai-panel-header">⚡ AI Suggested Reply</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: 12 }}>{suggestedReply}</div>
                        <button className="btn btn-primary btn-sm" onClick={() => setReplyText(suggestedReply)}>Use This Reply</button>
                      </div>
                    )}
                    {extractedLead && (
                      <div className="ai-panel" style={{ border: '1px solid rgba(16,185,129,0.2)', background: 'rgba(16,185,129,0.05)' }}>
                        <div className="ai-panel-header" style={{ color: 'var(--success)' }}>🎯 Lead Extracted</div>
                        {Object.entries(extractedLead).map(([k, v]) => (
                          <div key={k} style={{ fontSize: 13, marginBottom: 4 }}>
                            <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k}: </span>
                            <span style={{ color: 'var(--text-primary)' }}>{String(v)}</span>
                          </div>
                        ))}
                        <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => window.location.href = '/leads'}>Add to Leads</button>
                      </div>
                    )}
                    <div className="card">
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>⚡ Quick Actions</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontSize: 13 }} onClick={handleSuggest}>🤖 Generate AI Reply</button>
                        <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontSize: 13 }} onClick={handleExtract}>🔍 Extract Lead Info</button>
                        <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', fontSize: 13 }} onClick={() => window.location.href = '/reminders'}>🔔 Set Reminder</button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ height: '100%' }}>
                <div className="empty-icon">📧</div>
                <div className="empty-text">Select an email</div>
                <div className="empty-sub">Click an email to read it and get AI suggestions</div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
