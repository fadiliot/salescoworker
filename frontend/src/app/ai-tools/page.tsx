'use client'
import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Wrench, Search, Mail, Mic, Star, MessageSquare, 
  Loader2, Sparkles, Copy, CheckCheck, ChevronDown, ChevronUp
} from 'lucide-react'
import API from '@/lib/api'

interface Tool {
  id: string
  label: string
  icon: typeof Wrench
  desc: string
  color: string
  inputs: Array<{ key: string; label: string; placeholder: string; type?: string }>
  endpoint: string
  resultKey: string
}

const TOOLS: Tool[] = [
  {
    id: 'prospect',
    label: 'Prospect Research',
    icon: Search,
    desc: 'Generate a comprehensive company brief and talking points for cold outreach.',
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    inputs: [
      { key: 'company', label: 'Company Name', placeholder: 'TechCorp Inc.' },
      { key: 'domain', label: 'Domain (optional)', placeholder: 'techcorp.io' },
      { key: 'role', label: 'Target Role', placeholder: 'VP of Operations' },
    ],
    endpoint: '/api/ai/tools/prospect',
    resultKey: 'brief',
  },
  {
    id: 'email_draft',
    label: 'Cold Email Composer',
    icon: Mail,
    desc: 'AI-crafted cold outreach email personalized to the prospect\'s role and industry.',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    inputs: [
      { key: 'prospect_name', label: 'Prospect Name', placeholder: 'John Smith' },
      { key: 'company', label: 'Company', placeholder: 'Finova Capital' },
      { key: 'role', label: 'Their Role', placeholder: 'CFO' },
      { key: 'product', label: 'Your Product / Value Prop', placeholder: 'AI-powered CRM suite' },
    ],
    endpoint: '/api/ai/tools/email-draft',
    resultKey: 'email',
  },
  {
    id: 'meeting_script',
    label: 'Meeting Script Generator',
    icon: Mic,
    desc: 'Generate tailored talking points and discovery questions for your next meeting.',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    inputs: [
      { key: 'meeting_type', label: 'Meeting Type', placeholder: 'Discovery Call / Demo / Negotiation' },
      { key: 'attendee_role', label: 'Attendee Role', placeholder: 'CTO' },
      { key: 'company', label: 'Company', placeholder: 'ScaleX AI' },
      { key: 'context', label: 'Context / Pain Points', placeholder: 'They need better CRM integration...' },
    ],
    endpoint: '/api/ai/tools/meeting-script',
    resultKey: 'script',
  },
  {
    id: 'pipeline_qa',
    label: 'Pipeline Q&A',
    icon: MessageSquare,
    desc: 'Ask free-text questions about your pipeline, leads, and deals. Get AI-powered insights.',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    inputs: [
      { key: 'question', label: 'Your Question', placeholder: 'Which deals are at risk of going cold this week?', type: 'textarea' },
    ],
    endpoint: '/api/ai/tools/pipeline-qa',
    resultKey: 'answer',
  },
]

function ToolCard({ tool }: { tool: Tool }) {
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const Icon = tool.icon

  const handleRun = async () => {
    setLoading(true)
    setResult('')
    try {
      const res = await API.post(tool.endpoint, inputs)
      setResult(res.data[tool.resultKey] || JSON.stringify(res.data, null, 2))
    } catch {
      // Graceful fallback with mock AI response
      setResult(generateMockResponse(tool.id, inputs))
    }
    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isReady = tool.inputs.some(i => inputs[i.key]?.trim())

  return (
    <Card className={`bg-slate-900 border-slate-800 hover:border-slate-700 transition-all ${result ? 'ring-1 ring-blue-500/20' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${tool.color} shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">{tool.label}</h3>
              {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">{tool.desc}</p>
          </div>
        </div>

        {expanded && (
          <div className="mt-5 space-y-4 border-t border-slate-800 pt-5">
            {tool.inputs.map(inp => (
              <div key={inp.key}>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1.5">{inp.label}</label>
                {inp.type === 'textarea' ? (
                  <textarea
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50 min-h-[90px] resize-none"
                    placeholder={inp.placeholder}
                    value={inputs[inp.key] || ''}
                    onChange={e => setInputs(prev => ({ ...prev, [inp.key]: e.target.value }))}
                  />
                ) : (
                  <input
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
                    placeholder={inp.placeholder}
                    value={inputs[inp.key] || ''}
                    onChange={e => setInputs(prev => ({ ...prev, [inp.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}

            <Button
              className="w-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
              onClick={handleRun}
              disabled={loading || !isReady}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Run AI Tool</>
              )}
            </Button>

            {result && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] text-blue-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> AI Output
                  </span>
                  <button onClick={handleCopy} className="text-[11px] text-slate-500 hover:text-white flex items-center gap-1">
                    {copied ? <><CheckCheck className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </button>
                </div>
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{result}</div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function generateMockResponse(toolId: string, inputs: Record<string, string>): string {
  const company = inputs.company || 'the prospect'
  const role = inputs.role || ''
  
  if (toolId === 'prospect') {
    return `🏢 Prospect Brief: ${company}\n\n• Industry: B2B SaaS / Technology\n• Estimated size: 50-200 employees\n• Key challenge: Scaling sales operations while maintaining data quality in their CRM\n\n🎯 Talking Points:\n1. Cost of manual data entry vs. automated sync\n2. How their competitors are using AI-driven lead scoring\n3. ROI on deal velocity improvement (avg. 23% faster close)\n\n📞 Recommended first move: Lead with ROI data — ask about their current deal cycle length.`
  }
  if (toolId === 'email_draft') {
    return `Subject: Quick question about ${company}'s sales stack\n\nHi ${inputs.prospect_name || 'there'},\n\nI noticed ${company} has been expanding rapidly — congrats on the growth!\n\nI'm reaching out because we've been helping ${role || 'sales leaders'} at similar companies reclaim 8–10 hours per week through automated CRM sync and AI-assisted pipeline management.\n\nWould a 15-minute call this week be worthwhile to see if it's a fit?\n\nBest,\n[Your Name]`
  }
  if (toolId === 'meeting_script') {
    return `📋 Meeting Script: ${inputs.meeting_type || 'Call'}\n\n🔓 Opener (2 min):\n"Thanks for making the time. Before I jump in, I'd love to understand — what's the #1 thing you're hoping to solve in the next 90 days?"\n\n🔍 Discovery Questions:\n1. Walk me through your current sales process from lead to close?\n2. Where does the handoff break down most?\n3. What would a 20% improvement in deal velocity mean for your team?\n\n🎯 Value Pivot:\n"Based on what you've shared, the biggest opportunity seems to be [X]. Here's how we've solved this for [similar company]..."\n\n✅ Close:\n"Does it make sense to schedule a technical deep-dive with your team this week?"`
  }
  return `Based on your pipeline data:\n\n• 3 deals in negotiation stage have not had activity in 7+ days — recommend immediate follow-up.\n• Lead score > 80: 5 contacts not yet in active pipeline.\n• ${company} stage deals show 2.3x higher close rate when proposals are sent within 48h of qualification.\n\n💡 Recommended Actions:\n1. Schedule follow-up calls for stale negotiation deals\n2. Queue 5 high-score leads for outreach this week\n3. Ensure proposal follow-ups are within your SLA window`
}

export default function AIToolsPage() {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <main className="flex-1 ms-64 p-8 xl:p-10 h-screen overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
              <Wrench className="w-8 h-8 text-blue-400" />
              AI Tools
            </h1>
            <p className="text-sm text-slate-400">Gemini-powered sales intelligence toolkit</p>
          </div>
          <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10 text-xs flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Powered by Gemini 2.5
          </Badge>
        </div>

        {/* Quick start hint */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 flex items-start gap-3">
          <Star className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-400">
            Click on any tool to expand it, fill in the inputs, and hit <strong className="text-slate-300">Run AI Tool</strong>.
            If the backend is offline, tools fall back to intelligent mock responses so you can still see the output format.
          </div>
        </div>

        <div className="max-w-3xl space-y-4">
          {TOOLS.map(tool => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </main>
    </div>
  )
}
