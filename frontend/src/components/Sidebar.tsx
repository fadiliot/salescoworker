'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  Layers, LayoutDashboard, Target, KanbanSquare, Mail, 
  Activity, Bell, Settings, PhoneCall, CheckCircle2, Sparkles 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

import { useLanguage } from '@/context/LanguageContext'

// NAV_ITEMS moved inside component to use translations

export default function Sidebar() {
  const pathname = usePathname()
  const { lang, setLanguage, dir, t } = useLanguage()

  const NAV_ITEMS = [
    { href: '/', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/leads', icon: Target, label: t('leads'), badge: null },
    { href: '/pipeline', icon: KanbanSquare, label: t('pipeline') },
    { href: '/inbox', icon: Mail, label: t('inbox'), badge: '5', badgeType: '' },
    { href: '/activities', icon: Activity, label: t('activities') },
    { href: '/reminders', icon: Bell, label: t('reminders'), badge: '2', badgeType: 'hot' },
    { href: '/agent', icon: Sparkles, label: t('agent') },
  ]
  
  const BOTTOM_ITEMS = [
    { href: '/settings', icon: Settings, label: t('settings') },
  ]

  return (
    <aside className={cn(
      "w-64 border-slate-700/30 flex flex-col fixed inset-y-0 overflow-y-auto z-50",
      dir === 'rtl' ? "right-0 border-l" : "left-0 border-r"
    )} style={{ background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' }}>
      {/* Header & Logo */}
      <div className="px-5 pt-6 pb-4 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700">
            <Layers className="w-5 h-5" fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white leading-none">SalesHub</span>
            <span className="text-[10px] text-slate-500 tracking-[0.1em] mt-1 font-medium uppercase">Intelligent Suite</span>
          </div>
        </div>
      </div>

      {/* Language Toggle */}
      <div className="px-5 py-3 shrink-0">
        <div className="inline-flex rounded-lg overflow-hidden border border-white/5 p-0.5 bg-slate-900/50">
          {(['EN', 'AR'] as const).map(l => (
            <button key={l} onClick={() => setLanguage(l)} className={cn(
              "px-4 py-1 text-[11px] font-bold tracking-wider rounded-md transition-all",
              lang === l ? "bg-blue-600/20 text-blue-400 shadow-sm" : "hover:bg-white/5 text-slate-500"
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
                  ? "bg-blue-600/10 text-blue-400 shadow-[inset_2px_0_0_#2563EB]" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}>
                <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-blue-500" : "text-slate-500 group-hover:text-slate-300")} />
                {item.label}
                {item.badge && (
                  <Badge variant={item.badgeType === 'hot' ? 'destructive' : 'default'} className={cn("ml-auto h-5 px-1.5 text-[10px] font-bold shadow-none", item.badgeType === 'hot' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 text-white hover:bg-blue-500')}>
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
                isActive ? "bg-blue-600/10 text-blue-400 shadow-[inset_2px_0_0_#2563EB]" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}>
                <Icon className={cn("w-4 h-4", isActive ? "text-blue-500" : "text-slate-500 group-hover:text-slate-300")} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Profile */}
       <div className="shrink-0 p-4 border-t border-white/5 space-y-4">
        {/* User Badge */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            F
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-200 truncate">Fadil Anwar</p>
            <p className="text-xs text-slate-500 flex items-center gap-1">
               Account Manager
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
