'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { getAuthStatus, getZohoAuthUrl, getMicrosoftAuthUrl, getGoogleAuthUrl, syncIntegrations, seedSampleData } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, CheckCircle2, Zap, Settings, ArrowRight, Server, Link as LinkIcon } from 'lucide-react'

import { useLanguage } from '@/context/LanguageContext'

const INTEGRATIONS = [
  { key: 'zoho_crm', name: 'Zoho CRM', icon: '🔵', desc: 'Sync leads, contacts, and deals bidirectionally', authKey: 'zoho' },
  { key: 'zoho_books', name: 'Zoho Books', icon: '📚', desc: 'Sync invoices and customer financial data', authKey: 'zoho' },
  { key: 'microsoft_outlook', name: 'Microsoft Outlook', icon: '🟦', desc: 'Read emails, send replies via Microsoft Graph API', authKey: 'microsoft' },
  { key: 'google_meet', name: 'Google Meet', icon: '🟢', desc: 'Fetch meetings and generate briefs from Google Calendar', authKey: 'google' },
  { key: 'yeastar_pbx', name: 'Yeastar PBX', icon: '📞', desc: 'Call logs, CDR, click-to-call (configured server-side)', authKey: null },
]

export default function SettingsPage() {
  const { t } = useLanguage()
  const [statuses, setStatuses] = useState<Record<string, boolean>>({})
  const [syncing, setSyncing] = useState(false)
  const [flash, setFlash] = useState('')

  useEffect(() => {
    getAuthStatus().then(setStatuses).catch(() => {})

    // Check URL params for connection success
    const params = new URLSearchParams(window.location.search)
    if (params.get('zoho') === 'connected') setFlash('✅ Zoho CRM connected successfully!')
    if (params.get('microsoft') === 'connected') setFlash('✅ Microsoft Outlook connected successfully!')
    if (params.get('google') === 'connected') setFlash('✅ Google Meet connected successfully!')
  }, [])

  const handleConnect = async (authKey: string | null) => {
    if (!authKey) return
    try {
      let fn;
      if (authKey === 'zoho') fn = getZohoAuthUrl
      else if (authKey === 'microsoft') fn = getMicrosoftAuthUrl
      else if (authKey === 'google') fn = getGoogleAuthUrl
      
      if (!fn) return
      const { auth_url } = await fn()
      window.location.href = auth_url
    } catch {
      alert('Could not get auth URL — make sure backend is running and credentials are set in .env')
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try { await syncIntegrations(); setFlash('✅ Sync started — data will update shortly') } catch { setFlash('❌ Sync failed — check backend') }
    setTimeout(() => setFlash(''), 4000)
    setSyncing(false)
  }

  const handleSeed = async () => {
    if (!confirm('This will CLEAR all your current leads, deals, and emails and replace them with sample data. Continue?')) {
      return
    }
    setSyncing(true)
    try {
      await seedSampleData()
      setFlash('✅ Sample data seeded! Redirecting to Dashboard...')
      setTimeout(() => window.location.href = '/', 2000)
    } catch {
      setFlash('❌ Seeding failed — check backend logs')
    }
    setSyncing(false)
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <main className="flex-1 ms-64 p-8 xl:p-10 flex flex-col h-screen overflow-y-auto custom-scrollbar">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 shrink-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">{t('settings')}</h1>
            <p className="text-sm text-slate-400">{t('uae_overview')}</p>
          </div>
          <Button className="bg-[#D4AF37] text-slate-950 hover:bg-[#B8963E] transition-colors mt-4 md:mt-0" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? '...' : t('sync_data')}
          </Button>
        </div>

        {flash && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 mb-6 relative overflow-hidden">
             <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
             <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
             <div className="text-sm font-medium text-emerald-300">{flash}</div>
          </div>
        )}

        <div className="max-w-4xl space-y-10 pb-12">
          
          {/* Active Integrations */}
          <section>
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2"><LinkIcon className="w-5 h-5 text-[#D4AF37]" /> {t('workspace')}</h2>
            <div className="grid gap-4">
              {INTEGRATIONS.map(intg => {
                const connected = statuses[intg.key]
                return (
                  <Card key={intg.key} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all hover:shadow-lg shadow-none">
                    <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`text-3xl w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${connected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950 border-slate-800'}`}>
                          {intg.icon}
                        </div>
                        <div>
                          <div className="font-bold text-white text-base mb-1">{intg.name}</div>
                          <div className="text-sm text-slate-400 leading-relaxed">{intg.desc}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 sm:ml-4">
                        <Badge variant="outline" className={`shrink-0 ${connected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-950 text-slate-500 border-slate-800'}`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${connected ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          {connected ? t('completed') : t('pending')}
                        </Badge>
                        {intg.authKey ? (
                           <Button variant={connected ? "outline" : "default"} size="sm" 
                             className={connected ? "border-slate-700 hover:bg-slate-800 text-slate-300" : "bg-[#D4AF37] text-slate-950 hover:bg-[#B8963E]"}
                             onClick={() => handleConnect(intg.authKey)}>
                             {connected ? 'Reconnect' : 'Connect'}
                           </Button>
                        ) : (
                           <Button disabled variant="outline" size="sm" className="bg-slate-950 border-slate-800 text-slate-600">
                             <Server className="w-3.5 h-3.5 mr-2" /> Server Config
                           </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>

          {/* Development / Auth Config */}
          <section>
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2"><Settings className="w-5 h-5 text-slate-400" /> {t('system')}</h2>
            <Card className="bg-slate-900 border-slate-800 shadow-none">
              <CardContent className="p-6">
                <p className="text-sm text-slate-400 mb-6">
                  Add these keys directly to your <code className="bg-slate-950 px-1.5 py-0.5 rounded text-slate-300 font-mono text-xs border border-slate-800">backend/.env</code> file to enable API access.
                </p>
                <div className="space-y-6">
                  {[
                    { label: 'Zoho CRM + Books', vars: ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_ORGANIZATION_ID'], link: 'https://api-console.zoho.com/' },
                    { label: 'Microsoft Outlook', vars: ['MS_CLIENT_ID', 'MS_CLIENT_SECRET', 'MS_TENANT_ID'], link: 'https://portal.azure.com' },
                    { label: 'Yeastar PBX', vars: ['YEASTAR_HOST', 'YEASTAR_USERNAME', 'YEASTAR_PASSWORD'], link: null },
                    { label: 'Google Meet', vars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'], link: 'https://console.cloud.google.com/' },
                    { label: 'Google Gemini AI', vars: ['GEMINI_API_KEY'], link: 'https://aistudio.google.com/app/apikey' },
                    { label: 'Database', vars: ['DATABASE_URL'], link: null },
                  ].map(section => (
                     <div key={section.label} className="border-l-2 border-slate-800 pl-4 py-1">
                       <div className="flex items-center gap-3 mb-3">
                         <div className="text-sm font-bold text-slate-200">{section.label}</div>
                         {section.link && (
                           <a href={section.link} target="_blank" rel="noreferrer" className="text-xs text-[#D4AF37] hover:text-[#B8963E] flex items-center gap-1 transition-colors">
                             Get Credentials <ArrowRight className="w-3 h-3" />
                           </a>
                         )}
                       </div>
                       <div className="flex flex-wrap gap-2">
                         {section.vars.map(v => (
                           <code key={v} className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-xs font-mono text-slate-400">{v}</code>
                         ))}
                       </div>
                     </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-slate-200">Demo Mode</div>
                    <div className="text-xs text-slate-500">Wipe current state and populate with realistic sample data</div>
                  </div>
                  <Button variant="outline" size="sm" className="border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10" onClick={handleSeed} disabled={syncing}>
                    <Zap className="w-3.5 h-3.5 mr-2" /> Seed Sample Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* AI Features Scope */}
          <section>
            <h2 className="text-lg font-bold text-slate-200 mb-4 flex items-center gap-2"><Zap className="w-5 h-5 text-indigo-400" /> Active AI Workflows</h2>
            <Card className="bg-slate-900 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.05)]">
              <CardContent className="p-6">
                <p className="text-sm text-slate-400 mb-5 leading-relaxed">
                  Your AI copilot is currently utilizing <strong>Google Gemini 1.5 Flash</strong>. It falls back to internal mock patterns gracefully if rate limited or unconfigured.
                </p>
                <div className="flex flex-wrap gap-3">
                  {['Intelligent Email Summarization', 'Contextual Reply Generation', 'Automatic Lead Qualification', 'PBX Call Transcript Parsing', 'Deal Pipeline Insights', 'Next-Action Reminders'].map(f => (
                    <Badge key={f} variant="outline" className="bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 px-3 py-1 text-xs">
                      <Zap className="w-3 h-3 mr-1.5" /> {f}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

        </div>
      </main>
    </div>
  )
}
