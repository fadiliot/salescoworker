'use client'
import { useState } from 'react'

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

const ROLE_CONFIG: Record<StakeholderRole, { color: string; icon: string; bg: string }> = {
  'Economic Buyer': { color: '#D4AF37', icon: '👑', bg: 'rgba(212,175,55,0.12)' },
  'Champion':       { color: '#3B82F6', icon: '⚡', bg: 'rgba(59,130,246,0.1)' },
  'Gatekeeper':     { color: '#F97316', icon: '🔒', bg: 'rgba(249,115,22,0.1)' },
  'Evaluator':      { color: '#8B5CF6', icon: '🔍', bg: 'rgba(139,92,246,0.1)' },
  'Legal':          { color: '#10B981', icon: '⚖️', bg: 'rgba(16,185,129,0.1)' },
  'Unknown':        { color: '#64748B', icon: '👤', bg: 'rgba(100,116,139,0.08)' },
}

const ROLES: StakeholderRole[] = ['Economic Buyer', 'Champion', 'Gatekeeper', 'Evaluator', 'Legal', 'Unknown']

export default function StakeholderMap({ contacts, dealStage, onRoleChange }: StakeholderMapProps) {
  const [localContacts, setLocalContacts] = useState(contacts)

  const hasEconomicBuyer = localContacts.some(c => c.role_type === 'Economic Buyer')
  const showWarning = !hasEconomicBuyer && dealStage === 'negotiation'

  const handleRoleChange = (id: string, role: StakeholderRole) => {
    setLocalContacts(prev => prev.map(c => c.id === id ? { ...c, role_type: role } : c))
    onRoleChange?.(id, role)
  }

  if (!localContacts.length) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
        👥 No contacts linked to this deal yet.
      </div>
    )
  }

  return (
    <div>
      {showWarning && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
          fontSize: 13, color: '#F87171', display: 'flex', alignItems: 'center', gap: 8
        }}>
          ⚠️ <strong>Risk Alert:</strong> Deal is in Negotiation but no Economic Buyer has been tagged. Close rate drops significantly without buyer engagement.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        {localContacts.map(contact => {
          const role = (contact.role_type || 'Unknown') as StakeholderRole
          const cfg = ROLE_CONFIG[role]
          const isEB = role === 'Economic Buyer'
          return (
            <div key={contact.id} style={{
              background: cfg.bg,
              border: `1px solid ${isEB ? cfg.color : 'rgba(255,255,255,0.07)'}`,
              borderRadius: 12, padding: '14px 16px',
              boxShadow: isEB ? `0 0 16px ${cfg.color}30` : 'none',
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${cfg.color}80, ${cfg.color}30)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, flexShrink: 0,
                  border: isEB ? `2px solid ${cfg.color}` : 'none',
                }}>
                  {cfg.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: isEB ? cfg.color : 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {contact.first_name} {contact.last_name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {contact.title || contact.email}
                  </div>
                </div>
              </div>
              <select
                value={role}
                onChange={e => handleRoleChange(contact.id, e.target.value as StakeholderRole)}
                style={{
                  width: '100%', background: 'var(--bg-secondary)', border: `1px solid ${cfg.color}50`,
                  borderRadius: 6, padding: '5px 8px', fontSize: 12, color: cfg.color,
                  cursor: 'pointer', fontWeight: 600,
                }}
              >
                {ROLES.map(r => <option key={r} value={r}>{ROLE_CONFIG[r].icon} {r}</option>)}
              </select>
            </div>
          )
        })}
      </div>
    </div>
  )
}
