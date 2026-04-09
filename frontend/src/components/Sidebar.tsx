'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Layers, LayoutDashboard, Target, KanbanSquare, Mail, 
  Activity, Bell, Settings, Sparkles, CalendarDays, BarChart3, Wrench, Sun, Moon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

import { useLanguage } from '@/context/LanguageContext'
import { useTheme } from '@/context/ThemeContext'

// NAV_ITEMS moved inside component to use translations

export default function Sidebar() {
  const pathname = usePathname()
  const { lang, setLanguage, dir, t } = useLanguage()
  const { theme, toggleTheme } = useTheme()

  const NAV_ITEMS = [
    { href: '/', icon: LayoutDashboard, label: t('dashboard') },
    { href: '/leads', icon: Target, label: t('leads'), badge: null },
    { href: '/pipeline', icon: KanbanSquare, label: t('pipeline') },
    { href: '/inbox', icon: Mail, label: t('inbox'), badge: '5', badgeType: '' },
    { href: '/activities', icon: Activity, label: t('activities') },
    { href: '/meetings', icon: CalendarDays, label: 'Meetings' },
    { href: '/reminders', icon: Bell, label: t('reminders'), badge: '2', badgeType: 'hot' },
    { href: '/reports', icon: BarChart3, label: 'Reports' },
    { href: '/ai-tools', icon: Wrench, label: 'AI Tools' },
    { href: '/agent', icon: Sparkles, label: t('agent') },
  ]
  
  const BOTTOM_ITEMS = [
    { href: '/settings', icon: Settings, label: t('settings') },
  ]

  return (
    <aside className={cn(
      "w-64 border-slate-700/30 flex flex-col fixed inset-y-0 overflow-y-auto z-50 dark-sidebar",
      dir === 'rtl' ? "right-0 border-l" : "left-0 border-r"
    )} style={{ background: theme === 'light' ? 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)' : 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)', borderColor: theme === 'light' ? '#E2E8F0' : undefined }}>
      {/* Header & Logo */}
      <div className="px-5 pt-6 pb-4 border-b shrink-0" style={{ borderColor: theme === 'light' ? '#E2E8F0' : 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700">
            <Layers className="w-5 h-5" fill="currentColor" />
          </div>
          <div className="flex flex-col">
            <span className={cn("text-lg font-bold tracking-tight leading-none", theme === 'light' ? 'text-slate-900' : 'text-white')}>SalesHub</span>
            <span className={cn("text-[10px] tracking-[0.1em] mt-1 font-medium uppercase", theme === 'light' ? 'text-slate-500' : 'text-slate-500')}>Intelligent Suite</span>
          </div>
        </div>
      </div>

      {/* Language + Theme Toggle Row */}
      <div className="px-5 py-3 shrink-0 flex items-center gap-2">
        <div className="inline-flex rounded-lg overflow-hidden border p-0.5 flex-1" style={{ borderColor: theme === 'light' ? '#E2E8F0' : 'rgba(255,255,255,0.05)', background: theme === 'light' ? '#F1F5F9' : 'rgba(15,23,42,0.5)' }}>
          {(['EN', 'AR'] as const).map(l => (
            <button key={l} onClick={() => setLanguage(l)} className={cn(
              "px-4 py-1 text-[11px] font-bold tracking-wider rounded-md transition-all flex-1",
              lang === l ? "bg-blue-600/20 text-blue-400 shadow-sm" : `hover:bg-white/5 ${theme === 'light' ? 'text-slate-500' : 'text-slate-500'}`
            )}>
              {l}
            </button>
          ))}
        </div>
        <button
          onClick={toggleTheme}
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all",
            theme === 'light' ? 'bg-slate-200 text-slate-600 hover:bg-slate-300' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
          )}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-8 overflow-y-auto">
        <div className="space-y-1">
          <p className={cn("px-3 text-[10px] font-bold tracking-widest mb-3 uppercase", theme === 'light' ? 'text-slate-400' : 'text-slate-500')}>{t('workspace')}</p>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-blue-600/10 text-blue-500 shadow-[inset_2px_0_0_#2563EB]" 
                  : theme === 'light' ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}>
                <Icon className={cn("w-4 h-4 transition-colors", isActive ? "text-blue-500" : theme === 'light' ? "text-slate-400 group-hover:text-slate-600" : "text-slate-500 group-hover:text-slate-300")} />
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
          <p className={cn("px-3 text-[10px] font-bold tracking-widest mb-3 uppercase", theme === 'light' ? 'text-slate-400' : 'text-slate-500')}>{t('system')}</p>
          {BOTTOM_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href} className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive ? "bg-blue-600/10 text-blue-500 shadow-[inset_2px_0_0_#2563EB]" : theme === 'light' ? "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60" : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              )}>
                <Icon className={cn("w-4 h-4", isActive ? "text-blue-500" : theme === 'light' ? "text-slate-400 group-hover:text-slate-600" : "text-slate-500 group-hover:text-slate-300")} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* User Profile */}
       <div className="shrink-0 p-4 space-y-4" style={{ borderTop: theme === 'light' ? '1px solid #E2E8F0' : '1px solid rgba(255,255,255,0.05)' }}>
        {/* User Badge */}
        <div className="flex items-center gap-3 px-1">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-lg">
            F
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-bold truncate", theme === 'light' ? 'text-slate-800' : 'text-slate-200')}>Fadil Anwar</p>
            <p className={cn("text-xs flex items-center gap-1", theme === 'light' ? 'text-slate-500' : 'text-slate-500')}>
               Account Manager
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
