'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { getAuthStatus, getZohoAuthUrl, getMicrosoftAuthUrl, syncIntegrations } from '@/lib/api'

const INTEGRATIONS = [
  { key: 'zoho_crm', name: 'Zoho CRM', icon: '🔵', desc: 'Sync leads, contacts, and deals bidirectionally', authKey: 'zoho' },
  { key: 'microsoft_outlook', name: 'Microsoft Outlook', icon: '🟦', desc: 'Read emails, send replies via Microsoft Graph API', authKey: 'microsoft' },
  { key: 'yeastar_pbx', name: 'Yeastar PBX', icon: '📞', desc: 'Call logs, CDR, click-to-call (configured server-side)', authKey: null },
]

export default function SettingsPage() {
  const [statuses, setStatuses] = useState<Record<string, boolean>>({})
  const [syncing, setSyncing] = useState(false)
  const [flash, setFlash] = useState('')

  useEffect(() => {
    getAuthStatus().then(setStatuses).catch(() => {})

    // Check URL params for connection success
    const params = new URLSearchParams(window.location.search)
    if (params.get('zoho') === 'connected') setFlash('✅ Zoho CRM connected successfully!')
    if (params.get('microsoft') === 'connected') setFlash('✅ Microsoft Outlook connected successfully!')
  }, [])

  const handleConnect = async (authKey: string | null) => {
    if (!authKey) return
    try {
      const fn = authKey === 'zoho' ? getZohoAuthUrl : getMicrosoftAuthUrl
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

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Manage integrations and configure your workspace</p>
          </div>
          <button className="btn btn-primary" onClick={handleSync} disabled={syncing}>{syncing ? '⏳ Syncing…' : '🔄 Sync All Data'}</button>
        </div>

        {flash && (
          <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 10, padding: '12px 20px', marginBottom: 24, fontSize: 13, color: 'var(--accent)' }}>
            {flash}
          </div>
        )}

        {/* Integrations */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>🔌 Integrations</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {INTEGRATIONS.map(intg => {
            const connected = statuses[intg.key]
            return (
              <div key={intg.key} className="integration-card">
                <div className="integration-logo" style={{ background: connected ? 'rgba(16,185,129,0.1)' : 'var(--bg-glass)', fontSize: 24 }}>{intg.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{intg.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{intg.desc}</div>
                </div>
                <div style={{ display: 'flex', flex: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <div className={`integration-status ${connected ? 'connected' : 'disconnected'}`}>
                    <div className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
                    {connected ? 'Connected' : 'Not connected'}
                  </div>
                  {intg.authKey ? (
                    <button className={`btn btn-sm ${connected ? 'btn-ghost' : 'btn-primary'}`} onClick={() => handleConnect(intg.authKey)}>
                      {connected ? 'Reconnect' : 'Connect'}
                    </button>
                  ) : (
                    <span className="btn btn-ghost btn-sm" style={{ cursor: 'default', color: 'var(--text-muted)' }}>Server Config</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Environment Guide */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>⚙️ Configuration Guide</h2>
        <div className="card">
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
            Configure integrations by setting these variables in <code style={{ background: 'var(--bg-glass)', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>backend/.env</code>
          </div>
          {[
            { label: 'Zoho CRM + Books', vars: ['ZOHO_CLIENT_ID', 'ZOHO_CLIENT_SECRET', 'ZOHO_ORGANIZATION_ID'], link: 'https://api-console.zoho.com/' },
            { label: 'Microsoft Outlook', vars: ['MS_CLIENT_ID', 'MS_CLIENT_SECRET', 'MS_TENANT_ID'], link: 'https://portal.azure.com' },
            { label: 'Yeastar PBX', vars: ['YEASTAR_HOST', 'YEASTAR_USERNAME', 'YEASTAR_PASSWORD'], link: null },
            { label: 'Google Gemini AI', vars: ['GEMINI_API_KEY'], link: 'https://aistudio.google.com/app/apikey' },
            { label: 'Database', vars: ['DATABASE_URL'], link: null },
          ].map(section => (
            <div key={section.label} style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{section.label}</div>
                {section.link && <a href={section.link} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none' }}>Get credentials →</a>}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {section.vars.map(v => (
                  <code key={v} style={{ background: 'var(--bg-glass)', border: '1px solid var(--border)', padding: '3px 10px', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)' }}>{v}</code>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* AI Config */}
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '32px 0 16px' }}>🤖 AI Features</h2>
        <div className="ai-panel">
          <div className="ai-panel-header">⚡ Gemini AI Status</div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            AI features use Google Gemini 1.5 Flash. All features work with dummy responses if no API key is set.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Email Summarization', 'Reply Generation', 'Lead Scoring', 'Follow-up Writer', 'Pipeline Insights', 'Lead Extraction', 'Next-Action Suggestions'].map(f => (
              <span key={f} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', padding: '4px 10px', borderRadius: 20, fontSize: 12, color: 'var(--accent)' }}>⚡ {f}</span>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
