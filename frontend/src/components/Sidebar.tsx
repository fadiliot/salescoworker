'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', icon: '🏠', label: 'Dashboard' },
  { href: '/leads', icon: '👥', label: 'Leads', badge: null },
  { href: '/pipeline', icon: '📊', label: 'Pipeline' },
  { href: '/inbox', icon: '📧', label: 'Inbox', badge: '5', badgeType: '' },
  { href: '/activities', icon: '📅', label: 'Activities' },
  { href: '/reminders', icon: '🔔', label: 'Reminders', badge: '2', badgeType: 'hot' },
]

const BOTTOM_ITEMS = [
  { href: '/settings', icon: '⚙️', label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-badge">
          <div className="logo-icon">⚡</div>
          SalesAI
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, marginLeft: 46 }}>
          Co-worker v1.0
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-label">Workspace</div>
          {NAV_ITEMS.map(item => (
            <Link key={item.href} href={item.href} className={`nav-item${pathname === item.href ? ' active' : ''}`}>
              <span className="icon">{item.icon}</span>
              {item.label}
              {item.badge && (
                <span className={`nav-badge${item.badgeType === 'hot' ? ' hot' : ''}`}>{item.badge}</span>
              )}
            </Link>
          ))}
        </div>

        <div className="nav-section">
          <div className="nav-label">System</div>
          {BOTTOM_ITEMS.map(item => (
            <Link key={item.href} href={item.href} className={`nav-item${pathname === item.href ? ' active' : ''}`}>
              <span className="icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', margin: '0 4px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-glass)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent-2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
            A
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Sales Agent</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>agent@company.com</div>
          </div>
        </div>
      </div>
    </div>
  )
}
