'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  Diamond, LayoutDashboard, Target, KanbanSquare, Mail, 
  Activity, Bell, Settings, PhoneCall, CheckCircle2 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

import { useLanguage } from '@/context/LanguageContext'

// NAV_ITEMS moved inside component to use translations

export default function Sidebar() {
  const pathname = usePathname()
  const { lang, setLanguage, dir, t } = useLanguage()
  const [pbxOnline, setPbxOnline] = useState(true)
  const [timeStr, setTimeStr] = useState('')

  const NAV_ITEMS = [
    { href: '/', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/leads', icon: Target, label: t('leads'), badge: null },
    { href: '/pipeline', icon: KanbanSquare, label: t('pipeline') },
    { href: '/inbox', icon: Mail, label: t('inbox'), badge: '5', badgeType: '' },
    { href: '/activities', icon: Activity, label: t('activities') },
    { href: '/reminders', icon: Bell, label: t('reminders'), badge: '2', badgeType: 'hot' },
  ]
  
  const BOTTOM_ITEMS = [
    { href: '/settings', icon: Settings, label: t('settings') },
  ]

  useEffect(() => {
    const tick = () => setTimeStr(new Date().toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Dubai' }))
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [])

  return (
    <aside className={cn(
      "w-64 border-slate-700/30 flex flex-col fixed inset-y-0 overflow-y-auto z-50",
      dir === 'rtl' ? "right-0 border-l" : "left-0 border-r"
    )} style={{ background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' }}>
      {/* Header & Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-[#D4AF37]/10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-black font-bold shadow-[0_0_20px_rgba(212,175,55,0.3)] bg-gradient-to-br from-[#D4AF37] to-[#B8963E]">
            <Diamond className="w-5 h-5" fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-widest text-[#D4AF37] leading-none uppercase">SalesAI</span>
            <span className="text-[10px] text-[#D4AF37]/50 tracking-[0.1em] mt-1 font-semibold">DUBAI GOLD</span>
          </div>
        </div>

        {/* Dubai Live Context */}
        <div className="mt-5 p-3 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/10 flex flex-col gap-1">
          <div className="text-xs font-semibold text-[#D4AF37]/80 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-40"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
            </span>
            </span>
            {t('dubai')} — {timeStr}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">{t('next')}: {t('maghrib')} ~18:43</div>
        </div>
      </div>

      {/* Language Toggle */}
      <div className="px-5 py-3 shrink-0">
        <div className="inline-flex rounded-lg overflow-hidden border border-[#D4AF37]/20 p-0.5 bg-slate-900/50">
          {(['EN', 'AR'] as const).map(l => (
            <button key={l} onClick={() => setLanguage(l)} className={cn(
              "px-4 py-1 text-[11px] font-bold tracking-wider rounded-md transition-all",
              lang === l ? "bg-[#D4AF37]/20 text-[#D4AF37] shadow-sm" : "hover:bg-white/5 text-slate-500"
            )}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-8 overflow-y-auto">
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold tracking-widest text-slate-500 mb-3 uppercase">{t('workspace')}</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-[#D4AF37]/10 text-[#D4AF37] shadow-[inset_2px_0_0_#D4AF37]" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}>
                <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-[#D4AF37]" : "text-slate-500 group-hover:text-slate-300")} />
                {item.label}
                {item.badge && (
                  <Badge variant={item.badgeType === 'hot' ? 'destructive' : 'default'} className={cn("ml-auto h-5 px-1.5 text-[10px] font-bold shadow-none", item.badgeType === 'hot' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#D4AF37] text-slate-900 hover:bg-[#D4AF37]/90')}>
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </div>

        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold tracking-widest text-slate-500 mb-3 uppercase">{t('system')}</p>
          {BOTTOM_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive ? "bg-[#D4AF37]/10 text-[#D4AF37] shadow-[inset_2px_0_0_#D4AF37]" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}>
                <Icon className={cn("w-4 h-4", isActive ? "text-[#D4AF37]" : "text-slate-500 group-hover:text-slate-300")} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* PBX & User Profile */}
      <div className="shrink-0 p-4 border-t border-[#D4AF37]/10 space-y-4">
        {/* PBX Pill */}
        <button 
          onClick={() => setPbxOnline(p => !p)} 
          className={cn(
            "w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-300",
            pbxOnline ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"
          )}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              {pbxOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
              <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", pbxOnline ? "bg-emerald-500" : "bg-red-500")}></span>
            </span>
            <div className="text-left">
              <p className={cn("text-xs font-bold", pbxOnline ? "text-emerald-500" : "text-red-500")}>
                {pbxOnline ? t('pbx_online') : t('pbx_offline')}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">{t('yeastar_int')}</p>
            </div>
          </div>
          <PhoneCall className={cn("w-4 h-4", pbxOnline ? "text-emerald-500/50" : "text-red-500/50")} />
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8963E] flex items-center justify-center text-slate-900 font-bold text-sm shadow-lg">
            F
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-200 truncate">Fadil Anwar</p>
            <p className="text-xs text-[#D4AF37] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {t('gold_tier')}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
