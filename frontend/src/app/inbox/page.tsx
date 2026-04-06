'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { getEmails, suggestReply, sendReply, syncEmails, extractLead, sendEmail } from '@/lib/api'
import { formatDistanceToNow } from 'date-fns'
import { Mail, Edit3, RefreshCw, Zap, Search, AlertCircle, FileText, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const DUMMY_EMAILS = [
  { id: 'a1828062-8e7a-4c28-9844-3158c5c7d0a1', from_address: 'sarah.chen@techcorp.io', subject: 'Re: Enterprise License Pricing', body_text: "Hi, I reviewed the proposal. The pricing looks good but I need to discuss the implementation timeline with my team. Can we schedule a call this week? Also, do you offer any flexibility on the setup fee?", direction: 'inbound', is_read: false, ai_summary: 'Sarah wants to discuss implementation timeline and setup fee flexibility.', sentiment: 'positive', received_at: "2026-04-06T10:00:00Z" },
  { id: 'a1828062-8e7a-4c28-9844-3158c5c7d0a2', from_address: 'aisha.d@scalex.ai', subject: 'Final approval pending board sign-off', body_text: "Great news! The board loved the demo. We're at the final approval stage. Expecting sign-off by Friday. Please prepare the final contract with the terms we agreed on last Tuesday.", direction: 'inbound', is_read: false, ai_summary: 'Board approved. Needs final contract by Friday. Hot deal — priority action.', sentiment: 'positive', received_at: "2026-04-06T09:00:00Z" },
  { id: 'a1828062-8e7a-4c28-9844-3158c5c7d0a3', from_address: 'm.williams@finova.com', subject: 'Urgent: Contract Terms Review', body_text: "We've reviewed your contract terms. There are a few clauses regarding data privacy and SLA that our legal team has flagged. Can you clarify sections 4.2 and 7.1?", direction: 'inbound', is_read: false, ai_summary: 'Legal team flagged contract clauses 4.2 and 7.1. Urgent response needed.', sentiment: 'neutral', received_at: "2026-04-06T07:00:00Z" },
  { id: 'a1828062-8e7a-4c28-9844-3158c5c7d0a4', from_address: 'dkim@nexacloud.com', subject: 'Interested in your platform', body_text: "Hello, I came across your platform and I'm very interested. We're a cloud startup looking for a CRM solution. Could you send me pricing info and schedule a quick demo?", direction: 'inbound', is_read: false, ai_summary: 'NexaCloud CEO interested in pricing and demo. New inbound lead.', sentiment: 'positive', received_at: "2026-04-05T12:00:00Z" },
  { id: 'a1828062-8e7a-4c28-9844-3158c5c7d0a5', from_address: 'emily.j@healthplus.org', subject: 'Question about enterprise features', body_text: "Hi there, We're a healthcare organization looking at your solution. Can you tell me more about your compliance certifications (HIPAA, SOC2) and how data is encrypted at rest?", direction: 'inbound', is_read: true, ai_summary: 'HealthPlus asking about HIPAA and SOC2 compliance.', sentiment: 'neutral', received_at: "2026-04-04T15:00:00Z" },
]

function SentimentIndicator({ s }: { s: string }) {
  if (s === 'positive') return <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
  if (s === 'negative') return <div className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
  return <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
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
  const [isComposing, setIsComposing] = useState(false)
  const [composeTo, setComposeTo] = useState('')
  const [composeSubject, setComposeSubject] = useState('')
  const [composeBody, setComposeBody] = useState('')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    getEmails().then((data: any) => { 
      if (Array.isArray(data) && data.length) {
        const normalized = data.map((e: any) => ({
          ...e, id: e.id || e.conversationId || Math.random().toString(),
          from_address: e.from_address || e.from?.emailAddress?.address || 'unknown@example.com',
          subject: e.subject || 'No Subject', body_text: e.body_text || e.bodyPreview || '',
          received_at: e.received_at || e.receivedDateTime || new Date().toISOString(),
          is_read: e.is_read !== undefined ? e.is_read : (e.isRead || false),
        }))
        setEmails(normalized)
      }
    }).catch(() => {})
  }, [])

  const handleSelect = (email: typeof DUMMY_EMAILS[0]) => {
    setSelected(email); setIsComposing(false); setSuggestedReply(''); setReplyText(''); setExtractedLead(null)
    if (!email.is_read) setEmails(prev => prev.map(e => e.id === email.id ? { ...e, is_read: true } : e))
  }

  const handleCompose = () => { setSelected(null); setIsComposing(true); setComposeTo(''); setComposeSubject(''); setComposeBody('') }

  const handleSendNew = async () => {
    if (!composeTo || !composeSubject || !composeBody) return alert('Please fill in all fields')
    setSending(true)
    try { await sendEmail({ to: composeTo, subject: composeSubject, body: composeBody }); alert('Sent successfully!'); setIsComposing(false) } catch { alert('Failed to send.') }
    setSending(false)
  }

  const handleSuggest = async () => {
    if (!selected) return; setLoading(true)
    try {
      const data = await suggestReply(selected.id)
      setSuggestedReply(data.suggested_reply); setReplyText(data.suggested_reply)
    } catch {
      const fallback = `Hi,\n\nThank you for reaching out regarding "${selected.subject}".\n\nCould we schedule a quick call to discuss this further?\n\nBest regards,\nSales Team`
      setSuggestedReply(fallback); setReplyText(fallback)
    }
    setLoading(false)
  }

  const handleSend = async () => {
    if (!selected || !replyText) return; setSending(true)
    try { await sendReply(selected.id, replyText); alert('Reply sent!') } catch {}
    setSending(false); setReplyText(''); setSuggestedReply('')
  }

  const handleExtract = async () => {
    if (!selected) return; setLoading(true)
    try {
      const data = await extractLead(selected.id)
      setExtractedLead(data.extracted ? data.lead : { message: 'No exact lead format detected' })
    } catch {
      setExtractedLead({ name: selected.from_address.split('@')[0], email: selected.from_address })
    }
    setLoading(false)
  }

  const handleSync = async () => { setSyncing(true); try { await syncEmails() } catch {}; setTimeout(() => setSyncing(false), 2000) }
  const unreadCount = emails.filter(e => !e.is_read).length

  if (!isMounted) return <div className="min-h-screen bg-slate-950" />

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <main className="flex-1 ms-64 flex flex-col h-screen overflow-hidden">
        
        <div className="flex flex-1 overflow-hidden h-full">
          {/* Email List Panel */}
          <div className="w-[400px] shrink-0 border-r border-slate-800 flex flex-col bg-slate-900/50">
            <div className="p-6 border-b border-slate-800 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-white flex items-center">
                    Inbox <Badge className="ml-3 bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20 pointer-events-none hover:bg-[#D4AF37]/10 text-xs px-2">{unreadCount} unread</Badge>
                  </h1>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline" className="border-slate-800 bg-slate-900 text-slate-400 hover:text-white shrink-0" onClick={handleSync} disabled={syncing}>
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button size="icon" className="bg-[#D4AF37] hover:bg-[#B8963E] text-slate-950 shrink-0" onClick={handleCompose}>
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[#D4AF37]/50" placeholder="Search emails..." />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto w-full">
              {emails.map(email => (
                <div key={email.id} onClick={() => handleSelect(email)}
                  className={`p-4 border-b border-slate-800/50 cursor-pointer transition-colors ${selected?.id === email.id ? 'bg-[#D4AF37]/5 border-l-2 border-l-[#D4AF37]' : 'hover:bg-slate-800/30 border-l-2 border-l-transparent'} ${!email.is_read ? 'bg-slate-900' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-[#D4AF37] shrink-0 border border-slate-700">
                      {email.from_address?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <span className={`text-sm truncate ${email.is_read ? 'text-slate-300 font-medium' : 'text-slate-100 font-bold'}`}>{email.from_address}</span>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap">{email.received_at ? formatDistanceToNow(new Date(email.received_at)) : ''}</span>
                      </div>
                      <div className={`text-[13px] truncate mb-1.5 ${email.is_read ? 'text-slate-400' : 'text-slate-200 font-medium'}`}>{email.subject}</div>
                      {email.ai_summary ? (
                        <div className="text-[11px] text-[#D4AF37] flex items-start gap-1.5 mt-2 bg-slate-950 px-2 py-1.5 rounded-md border border-slate-800">
                          <Zap className="w-3 h-3 shrink-0 mt-[1px]" />
                          <span className="line-clamp-2 leading-relaxed opacity-90">{email.ai_summary}</span>
                        </div>
                      ) : (
                        <div className="text-[12px] text-slate-500 line-clamp-1">{email.body_text}</div>
                      )}
                    </div>
                    {!email.is_read && <div className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0 mt-1" />}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Reading Pane */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 relative">
            {isComposing ? (
              <div className="p-10 max-w-3xl mx-auto w-full flex flex-col h-full overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-white">New Message</h2>
                  <Button variant="ghost" onClick={() => setIsComposing(false)}>Cancel</Button>
                </div>
                <div className="space-y-4">
                  <input className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" placeholder="To: recipient@example.com" value={composeTo} onChange={e => setComposeTo(e.target.value)} />
                  <input className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50" placeholder="Subject" value={composeSubject} onChange={e => setComposeSubject(e.target.value)} />
                  <textarea className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 min-h-[300px]" placeholder="Type your message here..." value={composeBody} onChange={e => setComposeBody(e.target.value)} />
                  <div className="pt-2">
                    <Button className="bg-[#D4AF37] text-slate-950 hover:bg-[#D4AF37]/90 px-8" onClick={handleSendNew} disabled={sending}>{sending ? 'Sending...' : 'Send Message'}</Button>
                  </div>
                </div>
              </div>
            ) : selected ? (
              <div className="flex flex-1 overflow-hidden h-full">
                <div className="flex-1 flex flex-col overflow-y-auto p-8 border-r border-slate-800/60 custom-scrollbar">
                  {/* Email Header */}
                  <div className="mb-8">
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4 leading-snug">{selected.subject}</h2>
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-[#D4AF37] shrink-0">
                          {selected.from_address?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-200">{selected.from_address}</div>
                          <div className="text-xs text-slate-500">{selected.received_at ? formatDistanceToNow(new Date(selected.received_at), { addSuffix: true }) : ''}</div>
                        </div>
                      </div>
                      {selected.sentiment && (
                        <Badge variant="outline" className="border-slate-800 bg-slate-900 gap-1.5 font-medium uppercase tracking-wider text-[10px]">
                          <SentimentIndicator s={selected.sentiment} /> {selected.sentiment}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="text-[14px] leading-relaxed text-slate-300 whitespace-pre-wrap mb-10 selection:bg-[#D4AF37]/30">
                    {selected.body_text}
                  </div>

                  {/* Reply Action */}
                  <div className="mt-auto border-t border-slate-800 pt-6">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Compose Reply</h3>
                    <textarea 
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-[#D4AF37]/50 min-h-[140px] mb-4 placeholder:text-slate-600" 
                      placeholder="Type your reply here..." 
                      value={replyText} 
                      onChange={e => setReplyText(e.target.value)} 
                    />
                    <div className="flex gap-3">
                      <Button className="bg-[#D4AF37] text-slate-950 hover:bg-[#D4AF37]/90 px-6" onClick={handleSend} disabled={!replyText || sending}>{sending ? 'Sending...' : 'Send Reply'}</Button>
                      <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-300" onClick={handleSuggest} disabled={loading}>
                        {loading ? 'Thinking...' : <><Zap className="w-4 h-4 mr-2" /> Auto-Draft AI Reply</>}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* AI Assistant Right Sidebar */}
                <div className="w-[320px] bg-slate-950 p-6 overflow-y-auto flex flex-col gap-6 shrink-0 custom-scrollbar">
                  <div className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-widest flex items-center gap-2 mb-2">
                    <Bot className="w-3.5 h-3.5" /> Sales Co-worker
                  </div>

                  {/* AI Summary Card */}
                  {selected.ai_summary && (
                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Intel</h3>
                      <p className="text-[13px] text-indigo-200/80 leading-relaxed">{selected.ai_summary}</p>
                    </div>
                  )}

                  {/* Generated Suggested Reply */}
                  {suggestedReply && (
                    <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/30 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider mb-3 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Draft Ready</h3>
                      <p className="text-[12px] text-slate-300 leading-relaxed italic border-l-2 border-[#D4AF37]/50 pl-3 mb-4 line-clamp-6">{suggestedReply}</p>
                      <Button variant="outline" size="sm" className="w-full border-[#D4AF37]/50 text-[#D4AF37] hover:bg-[#D4AF37]/10" onClick={() => setReplyText(suggestedReply)}>Apply Draft</Button>
                    </div>
                  )}

                  {/* Extracted Lead Output */}
                  {extractedLead && (
                    <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-xl p-4">
                      <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Lead Extracted</h3>
                      <div className="space-y-2 mb-4">
                        {Object.entries(extractedLead).map(([k, v]) => (
                          <div key={k} className="flex flex-col">
                            <span className="text-[10px] uppercase text-slate-500 font-bold">{k}</span>
                            <span className="text-xs text-slate-200 truncate">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                      <Button className="w-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/30" onClick={() => window.location.href = '/leads'} size="sm">Add to CRM</Button>
                    </div>
                  )}

                  {/* Quick Toolbox */}
                  <div className="mt-auto pt-6 border-t border-slate-800">
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">Toolbox</h3>
                    <div className="space-y-2">
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-slate-400 hover:text-white" onClick={handleSuggest}>
                        <Zap className="mr-2 w-3.5 h-3.5" /> Generate AI Reply
                      </Button>
                      <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-slate-400 hover:text-white" onClick={handleExtract}>
                        <Search className="mr-2 w-3.5 h-3.5" /> Parse Lead Data
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-950">
                <Mail className="w-16 h-16 text-slate-800 mb-6" />
                <h3 className="text-xl font-bold text-white mb-2">Your Sales Inbox</h3>
                <p className="text-slate-500 text-sm max-w-xs">Select an email from the list to read it, generate AI drafts, and automatically extract pipeline leads.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function Bot(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
}
