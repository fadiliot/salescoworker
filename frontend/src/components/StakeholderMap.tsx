'use client'
import { useState } from 'react'
import { updateContactRole, analyzeContactRole } from '@/lib/api'
import { User, Shield, Briefcase, Glasses, Scale, Crown, AlertTriangle, Sparkles, Loader2, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type StakeholderRole = 'Economic Buyer' | 'Champion' | 'Gatekeeper' | 'Evaluator' | 'Legal' | 'Unknown'

interface Stakeholder {
  id: string
  first_name: string
  last_name?: string
  title?: string
  email?: string
  role_type?: StakeholderRole
}

interface StakeholderMapProps {
  contacts: Stakeholder[]
  dealStage?: string
  onRoleChange?: (contactId: string, role: StakeholderRole) => void
}

const ROLE_CONFIG: Record<StakeholderRole, { color: string; bg: string; iconBase: any }> = {
  'Economic Buyer': { color: '#D4AF37', bg: 'bg-[#D4AF37]/10', iconBase: Crown },
  'Champion':       { color: '#3B82F6', bg: 'bg-blue-500/10', iconBase: Shield },
  'Gatekeeper':     { color: '#F97316', bg: 'bg-orange-500/10', iconBase: Briefcase },
  'Evaluator':      { color: '#8B5CF6', bg: 'bg-purple-500/10', iconBase: Glasses },
  'Legal':          { color: '#10B981', bg: 'bg-emerald-500/10', iconBase: Scale },
  'Unknown':        { color: '#64748B', bg: 'bg-slate-500/10', iconBase: User },
}

const ROLES: StakeholderRole[] = ['Economic Buyer', 'Champion', 'Gatekeeper', 'Evaluator', 'Legal', 'Unknown']

export default function StakeholderMap({ contacts, dealStage, onRoleChange }: StakeholderMapProps) {
  const [localContacts, setLocalContacts] = useState(contacts)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)

  const hasEconomicBuyer = localContacts.some(c => c.role_type === 'Economic Buyer')
  const showWarning = !hasEconomicBuyer && dealStage === 'negotiation'

  const handleRoleChange = async (id: string, role: StakeholderRole) => {
    setLocalContacts(prev => prev.map(c => c.id === id ? { ...c, role_type: role } : c))
    onRoleChange?.(id, role)
    try {
      await updateContactRole(id, role)
    } catch {
      // silent optimistic update
    }
  }

  const handleAnalyze = async (id: string) => {
    setAnalyzingId(id)
    try {
      const result = await analyzeContactRole(id)
      if (result.role_type) {
        setLocalContacts(prev => prev.map(c => c.id === id ? { ...c, role_type: result.role_type } : c))
        onRoleChange?.(id, result.role_type)
      }
    } catch (err) {
      console.error("AI Analysis failed:", err)
    } finally {
      setAnalyzingId(null)
    }
  }

  if (!localContacts.length) {
    return (
      <div className="py-8 text-center text-slate-500 text-sm border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
        <Users className="w-8 h-8 opacity-20 mx-auto mb-2" />
        No contacts linked to this deal yet.
      </div>
    )
  }

  return (
    <div className="space-y-4 text-left">
      {showWarning && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-sm text-red-400 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            <strong className="text-red-500">Risk Alert:</strong> Deal is in Negotiation but no Economic Buyer has been tagged. Close rate drops significantly without buyer engagement.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {localContacts.map(contact => {
          const role = (contact.role_type || 'Unknown') as StakeholderRole
          const cfg = ROLE_CONFIG[role]
          const Icon = cfg.iconBase
          const isEB = role === 'Economic Buyer'

          return (
            <Card key={contact.id} className={`border ${isEB ? 'border-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.15)] bg-[#D4AF37]/5' : 'border-slate-800 bg-slate-900'} transition-all`}>
              <CardContent className="p-4 flex flex-col h-full justify-between">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-full flex flex-col items-center justify-center shrink-0 border-2 ${isEB ? 'border-[#D4AF37]' : 'border-transparent'} ${cfg.bg}`}>
                    <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold truncate text-slate-100 group-hover:text-white transition-colors" style={{ color: isEB ? cfg.color : '' }}>
                      {contact.first_name} {contact.last_name}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {contact.title || contact.email}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-purple-400 hover:bg-purple-400/10 shrink-0"
                    disabled={analyzingId === contact.id}
                    onClick={() => handleAnalyze(contact.id)}
                    title="Analyze with AI"
                  >
                    {analyzingId === contact.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  </Button>
                </div>

                <div className="relative">
                  <select
                    value={role}
                    onChange={e => handleRoleChange(contact.id, e.target.value as StakeholderRole)}
                    className={`w-full appearance-none bg-slate-950 border border-slate-800 rounded-lg py-2 pl-3 pr-8 text-xs font-semibold cursor-pointer outline-none focus:ring-1`}
                    style={{ color: cfg.color, borderColor: isEB ? `${cfg.color}50` : 'true' }}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-600">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
