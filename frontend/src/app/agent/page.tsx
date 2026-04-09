'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { 
  getAgentLogs, 
  getAgentConfig, 
  toggleAgentWorkflow, 
  getApprovalQueue, 
  approveAgentDraft, 
  triggerAgentWorkflow 
} from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Zap, 
  History, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Sparkles, 
  Calendar, 
  Mail, 
  AlertCircle,
  Loader2,
  Send
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AgentPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [config, setConfig] = useState<any[]>([])
  const [queue, setQueue] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [triggering, setTriggering] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [l, c, q] = await Promise.all([
        getAgentLogs(),
        getAgentConfig(),
        getApprovalQueue()
      ])
      setLogs(l)
      setConfig(c)
      setQueue(q)
    } catch (err) {
      console.error('Failed to fetch agent data', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000) // Poll for updates
    return () => clearInterval(interval)
  }, [])

  const handleToggle = async (workflowName: string, enabled: boolean) => {
    try {
      await toggleAgentWorkflow(workflowName, enabled)
      fetchData()
    } catch (err) {
      alert('Failed to update config')
    }
  }

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    try {
      await approveAgentDraft(id)
      fetchData()
    } catch (err) {
      alert('Failed to approve draft')
    } finally {
      setProcessingId(null)
    }
  }

  const handleTrigger = async (name: string) => {
    setTriggering(name)
    try {
      await triggerAgentWorkflow(name)
      fetchData()
    } catch (err) {
      alert('Failed to trigger workflow')
    } finally {
      setTriggering(null)
    }
  }

  if (loading && config.length === 0) {
    return (
      <div className="flex min-h-screen bg-slate-950 items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <main className="flex-1 ms-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-blue-600/20 rounded-lg">
                <Sparkles className="w-8 h-8 text-blue-400" />
              </div>
              Agent Control Center
            </h1>
            <p className="text-slate-400 mt-2">Manage autonomous sales workflows and approve AI actions.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-800" onClick={fetchData}>
              <History className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-500 font-bold" onClick={() => window.location.reload()}>
              <Zap className="w-4 h-4 mr-2" /> Live Status: Active
            </Button>
          </div>
        </header>

        {/* Workflow Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { id: 'daily_briefing', name: 'Daily Briefing', icon: Calendar, desc: 'Google + Zoho Summary' },
            { id: 'lead_reactivation', name: 'Lead Nudge', icon: Zap, desc: 'Reactivate cold leads' },
            { id: 'autonomous_scheduler', name: 'Auto-Scheduler', icon: Mail, desc: 'Email -> Calendar flow' },
            { id: 'post_meeting_cleanup', name: 'Meeting Cleanup', icon: CheckCircle2, desc: 'Post-talk CRM updates' },
          ].map(wf => {
            const isEnabled = config.find(c => c.workflow_name === wf.id)?.is_enabled ?? false
            const isTriggering = triggering === wf.id
            return (
              <Card key={wf.id} className="bg-slate-900 border-slate-800">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-800 rounded-md">
                      <wf.icon className={`w-5 h-5 ${isEnabled ? 'text-blue-400' : 'text-slate-500'}`} />
                    </div>
                    <button 
                      onClick={() => handleToggle(wf.id, !isEnabled)}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        isEnabled ? "bg-blue-600" : "bg-slate-700"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform",
                          isEnabled ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                  <h3 className="font-bold text-slate-200">{wf.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{wf.desc}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-4 text-blue-400 hover:bg-blue-400/10"
                    disabled={!isEnabled || isTriggering}
                    onClick={() => handleTrigger(wf.id)}
                  >
                    {isTriggering ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 mr-2" />} 
                    Run Now
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Approval Queue */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Human-in-the-Loop Approval Queue
              <Badge variant="outline" className="ml-2 border-slate-800 text-slate-400">{queue.length} Pending</Badge>
            </h2>

            {queue.length === 0 ? (
              <Card className="bg-slate-900/50 border-dashed border-slate-800 py-12 text-center">
                <CardContent>
                  <AlertCircle className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500">No pending drafts to review.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {queue.map(item => (
                  <Card key={item.id} className="bg-slate-900 border-slate-800 overflow-hidden">
                    <CardHeader className="bg-slate-800/50 py-3 flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">{item.source}</Badge>
                        <CardTitle className="text-sm font-bold text-slate-200">{item.subject}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                         <Button variant="ghost" size="sm" className="h-8 text-slate-400 hover:text-red-400">Reject</Button>
                         <Button 
                          size="sm" 
                          className="h-8 bg-green-600 hover:bg-green-700 text-white"
                          disabled={processingId === item.id}
                          onClick={() => handleApprove(item.id)}
                         >
                          {processingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 mr-2" />} 
                          Approve & Send
                         </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 bg-slate-950/50">
                      <pre className="text-sm text-slate-400 font-sans whitespace-pre-wrap leading-relaxed">
                        {item.content}
                      </pre>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Shadow Activity Feed */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              Shadow Activity Feed
            </h2>
            <Card className="bg-slate-900 border-slate-800 h-[600px] flex flex-col">
              <CardHeader className="py-3 bg-slate-800/30 border-b border-slate-800">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Live Feed
                   </div>
                   <span className="text-[10px] text-slate-600 font-mono uppercase tracking-widest">Agent System Core v1.0</span>
                </div>
              </CardHeader>
              <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                <div className="space-y-3">
                  {logs.map((log, i) => (
                    <div key={log.id} className="text-xs flex gap-3 group">
                      <span className="text-slate-600 font-mono whitespace-nowrap">
                        {new Date(log.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <div>
                        {log.workflow_name && (
                           <span className="text-[10px] bg-slate-800 text-slate-500 px-1 rounded mr-2 uppercase">
                             {log.workflow_name}
                           </span>
                        )}
                        <span className="text-slate-300 group-hover:text-white transition-colors">{log.message}</span>
                      </div>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <p className="text-slate-600 text-center mt-8 italic">Awaiting autonomous actions...</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
