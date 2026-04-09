'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { getLead, getLeadNextActions, getActivities } from '@/lib/api'
import { format } from 'date-fns'
import { 
  User, Building2, Mail, Phone, Globe, Calendar, 
  Zap, MessageSquare, Sparkles, ArrowLeft, MoreHorizontal,
  ChevronRight, PhoneCall
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useLanguage } from '@/context/LanguageContext'

export default function LeadDetailPage() {
  const { id } = useParams()
  const { t } = useLanguage()
  const [lead, setLead] = useState<any>(null)
  const [actions, setActions] = useState<string[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      getLead(id as string),
      getLeadNextActions(id as string),
      getActivities() // Simple fallback for timeline
    ]).then(([leadData, actionData, activityData]) => {
      setLead(leadData)
      if (actionData?.actions) setActions(actionData.actions)
      setActivities(activityData.filter((a: any) => a.lead_id === id))
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>
  if (!lead) return <div className="min-h-screen bg-slate-950 text-white p-20 text-center">Lead not found</div>

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <main className="flex-1 ms-64 p-8 xl:p-10 flex flex-col h-screen overflow-hidden">
        
        {/* Breadcrumbs / Back */}
        <div className="flex items-center gap-2 mb-6 text-sm text-slate-500">
          <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent text-slate-400" onClick={() => window.location.href = '/leads'}>
             {t('leads')}
          </Button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-200 font-medium">{lead.first_name} {lead.last_name}</span>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 mb-8">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-2xl text-white shadow-xl">
              {lead.first_name?.charAt(0)}{lead.last_name?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-3xl font-bold text-white">{lead.first_name} {lead.last_name}</h1>
                <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest">
                  {lead.is_hot === 'true' ? 'HOT LEAD' : lead.status}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm">
                <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {lead.company}</span>
                <span className="flex items-center gap-1.5 text-slate-600">|</span>
                <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> Dubai, UAE</span>
              </div>
            </div>
          </div>
           <div className="flex gap-3">
             <Button variant="outline" className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300">
               <Sparkles className="w-4 h-4 mr-2" /> {t('ai_analysis')}
             </Button>
             <Button className="bg-blue-600 text-white hover:bg-blue-500">
               <PhoneCall className="w-4 h-4 mr-2" /> {t('call')}
             </Button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
          
          {/* Left Column: Contact & Info */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-800/50">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">{t('profile')}</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-5">
                 <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">{t('email')}</p>
                    <p className="text-sm text-slate-200">{lead.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">{t('phone')}</p>
                    <p className="text-sm text-slate-200">{lead.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold">{t('due')}</p>
                    <p className="text-sm text-slate-200">Added {format(new Date(lead.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-indigo-500/5 border-indigo-500/20">
               <CardHeader className="pb-3">
                 <CardTitle className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                   <Zap className="w-3.5 h-3.5" /> Intelligence Score
                 </CardTitle>
               </CardHeader>
               <CardContent>
                  <div className="flex items-end gap-2 mb-4">
                    <span className="text-4xl font-black text-indigo-300">{lead.score}</span>
                    <span className="text-xs text-indigo-500/70 mb-1.5 font-bold">/ 100</span>
                  </div>
                  <div className="w-full h-2 bg-indigo-500/10 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${lead.score}%` }}></div>
                  </div>
               </CardContent>
            </Card>
          </div>

          {/* Middle Column: AI Actions & Details */}
          <div className="lg:col-span-2 space-y-6">
            
            <Card className="bg-slate-900 border-slate-800 shadow-xl overflow-hidden relative">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
              <CardHeader className="pb-4">
                 <CardTitle className="flex items-center gap-2 text-white">
                   <Sparkles className="w-5 h-5 text-blue-400" /> AI Recommended Actions
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {actions.length > 0 ? actions.map((action, i) => (
                  <div key={i} className="bg-slate-950/50 border border-slate-800 p-4 rounded-xl flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                     <p className="text-sm text-slate-200 leading-relaxed">{action}</p>
                     <Button size="sm" variant="ghost" className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                       Done
                     </Button>
                  </div>
                )) : (
                  <p className="text-sm text-slate-500 italic">No recommendations available at this time.</p>
                )}
              </CardContent>
            </Card>

            {/* Timeline Fallback */}
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-600 mt-10 mb-4">{t('activities')}</h3>
            <div className="relative border-l border-slate-800 ml-3 space-y-8 pb-10">
               {activities.length > 0 ? activities.map((act, i) => (
                 <div key={i} className="relative pl-8">
                    <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-slate-950 border-2 border-slate-700" />
                    <div className="text-xs text-slate-500 mb-1">{format(new Date(act.occurred_at), 'MMM d')}</div>
                    <div className="bg-slate-900/30 border border-slate-800/50 p-4 rounded-xl">
                       <p className="text-sm font-bold text-slate-200 mb-1">{act.title}</p>
                       <p className="text-xs text-slate-400">{act.description}</p>
                    </div>
                 </div>
               )) : (
                 <div className="pl-8 text-sm text-slate-600">No activity history for this lead.</div>
               )}
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
