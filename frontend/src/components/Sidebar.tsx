'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV_ITEMS = [
  { href: '/', icon: '◆', label: 'Dashboard' },
  { href: '/leads', icon: '◈', label: 'Leads', badge: null },
  { href: '/pipeline', icon: '⬡', label: 'Pipeline' },
  { href: '/inbox', icon: '✉', label: 'Inbox', badge: '5', badgeType: '' },
  { href: '/activities', icon: '◷', label: 'Activities' },
  { href: '/reminders', icon: '◉', label: 'Reminders', badge: '2', badgeType: 'hot' },
]

const BOTTOM_ITEMS = [
  { href: '/settings', icon: '◎', label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [pbxOnline, setPbxOnline] = useState(true)
  const [lang, setLang] = useState<'EN' | 'AR'>('EN')
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    const tick = () => setTimeStr(new Date().toLocaleTimeString('en-AE', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Dubai' }))
    tick()
    const t = setInterval(tick, 30000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 100%)' }}>
      {/* Logo */}
      <div style={{ padding: '22px 20px 14px', borderBottom: '1px solid rgba(212,175,55,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #D4AF37, #B8963E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 0 18px rgba(212,175,55,0.35)',
          }}>🦅</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 900, letterSpacing: 1, color: '#D4AF37', lineHeight: 1 }}>SalesAI</div>
            <div style={{ fontSize: 10, color: 'rgba(212,175,55,0.5)', letterSpacing: 0.8 }}>UAE EDITION</div>
          </div>
        </div>
        {/* Time widget */}
        <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 8, background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.1)', fontSize: 11 }}>
          <div style={{ color: 'rgba(212,175,55,0.8)', fontWeight: 600 }}>🕐 Dubai, UAE — {timeStr}</div>
          <div style={{ color: 'rgba(100,116,139,0.8)', marginTop: 2 }}>Next: Maghrib ~18:43</div>
        </div>
      </div>

      {/* EN/AR toggle */}
      <div style={{ padding: '10px 20px' }}>
        <div style={{ display: 'inline-flex', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(212,175,55,0.2)' }}>
          {(['EN', 'AR'] as const).map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              padding: '4px 14px', fontSize: 11, fontWeight: 700,
              background: lang === l ? 'rgba(212,175,55,0.15)' : 'transparent',
              color: lang === l ? '#D4AF37' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer', letterSpacing: 0.8,
            }}>{l}</button>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" style={{ flex: 1 }}>
        <div className="nav-section">
          <div className="nav-label" style={{ color: 'rgba(212,175,55,0.4)', letterSpacing: 1 }}>WORKSPACE</div>
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href}
              className={`nav-item${pathname === item.href ? ' active' : ''}`}
              style={pathname === item.href ? { background: 'rgba(212,175,55,0.1)', color: '#D4AF37', borderLeft: '3px solid #D4AF37' } : {}}>
              <span style={{ fontSize: 13, opacity: 0.8 }}>{item.icon}</span>
              {item.label}
              {item.badge && (
                <span className={`nav-badge${item.badgeType === 'hot' ? ' hot' : ''}`}>{item.badge}</span>
              )}
            </Link>
          ))}
        </div>
        <div className="nav-section">
          <div className="nav-label" style={{ color: 'rgba(212,175,55,0.4)', letterSpacing: 1 }}>SYSTEM</div>
          {BOTTOM_ITEMS.map(item => (
            <Link key={item.href} href={item.href} className={`nav-item${pathname === item.href ? ' active' : ''}`}>
              <span style={{ fontSize: 13, opacity: 0.8 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* PBX status pill */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(212,175,55,0.1)', margin: '0 4px' }}>
        <div onClick={() => setPbxOnline(p => !p)} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
          borderRadius: 10,
          background: pbxOnline ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.07)',
          border: `1px solid ${pbxOnline ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          cursor: 'pointer', transition: 'all 0.2s',
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: pbxOnline ? '#10B981' : '#EF4444',
            boxShadow: `0 0 8px ${pbxOnline ? '#10B981' : '#EF4444'}`,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: pbxOnline ? '#10B981' : '#EF4444' }}>
              {pbxOnline ? 'PBX Online' : 'PBX Offline'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Yeastar PBX</div>
          </div>
          <span style={{ fontSize: 14 }}>📞</span>
        </div>

        {/* Agent card */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px', marginTop: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #D4AF37, #B8963E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#000',
          }}>F</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Sales Agent</div>
            <div style={{ fontSize: 10, color: '#D4AF37' }}>✓ Verified</div>
          </div>
        </div>
      </div>
    </div>
  )
}
