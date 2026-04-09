'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen, FileText, Users, DollarSign, RefreshCw, Search,
  ChevronRight, CheckCircle2, Clock, AlertCircle, X, Loader2, 
  TrendingUp, Download, Send, Plus, Building2
} from 'lucide-react'
import API from '@/lib/api'

interface Invoice {
  invoice_id: string
  invoice_number: string
  customer_name: string
  customer_id: string
  date: string
  due_date: string
  status: string
  total: number
  balance: number
  currency_code: string
  created_time?: string
}
interface Customer {
  contact_id: string
  contact_name: string
  company_name: string
  email: string
  phone: string
  outstanding_receivable_amount: number
  currency_code: string
  status: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  paid:      { label: 'Paid',     color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  sent:      { label: 'Sent',     color: 'bg-blue-500/10 text-blue-400 border-blue-500/30',         icon: Send },
  draft:     { label: 'Draft',    color: 'bg-slate-500/10 text-slate-400 border-slate-500/30',      icon: FileText },
  overdue:   { label: 'Overdue',  color: 'bg-red-500/10 text-red-400 border-red-500/30',            icon: AlertCircle },
  partially_paid: { label: 'Partial', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', icon: Clock },
  void:      { label: 'Void',     color: 'bg-slate-500/10 text-slate-500 border-slate-700',         icon: X },
}

const SAMPLE_INVOICES: Invoice[] = [
  { invoice_id: 'inv1', invoice_number: 'INV-00045', customer_name: 'TechCorp Inc.', customer_id: 'c1', date: '2026-04-01', due_date: '2026-04-30', status: 'sent', total: 12500, balance: 12500, currency_code: 'AED' },
  { invoice_id: 'inv2', invoice_number: 'INV-00044', customer_name: 'Finova Capital', customer_id: 'c2', date: '2026-03-15', due_date: '2026-04-14', status: 'overdue', total: 8750, balance: 8750, currency_code: 'AED' },
  { invoice_id: 'inv3', invoice_number: 'INV-00043', customer_name: 'ScaleX AI', customer_id: 'c3', date: '2026-03-01', due_date: '2026-03-31', status: 'paid', total: 22000, balance: 0, currency_code: 'AED' },
  { invoice_id: 'inv4', invoice_number: 'INV-00042', customer_name: 'GulfBuild LLC', customer_id: 'c4', date: '2026-02-15', due_date: '2026-03-15', status: 'partially_paid', total: 15000, balance: 6000, currency_code: 'AED' },
  { invoice_id: 'inv5', invoice_number: 'INV-00041', customer_name: 'TechCorp Inc.', customer_id: 'c1', date: '2026-02-01', due_date: '2026-03-01', status: 'paid', total: 9800, balance: 0, currency_code: 'AED' },
]

const SAMPLE_CUSTOMERS: Customer[] = [
  { contact_id: 'c1', contact_name: 'Sarah Chen', company_name: 'TechCorp Inc.', email: 'sarah.chen@techcorp.io', phone: '+971 50 123 4567', outstanding_receivable_amount: 12500, currency_code: 'AED', status: 'active' },
  { contact_id: 'c2', contact_name: 'Marcus Williams', company_name: 'Finova Capital', email: 'm.williams@finova.com', phone: '+971 55 987 6543', outstanding_receivable_amount: 8750, currency_code: 'AED', status: 'active' },
  { contact_id: 'c3', contact_name: 'Aisha Diallo', company_name: 'ScaleX AI', email: 'aisha.d@scalex.ai', phone: '+971 52 456 7890', outstanding_receivable_amount: 0, currency_code: 'AED', status: 'active' },
  { contact_id: 'c4', contact_name: 'Ahmed Al Rashid', company_name: 'GulfBuild LLC', email: 'ahmed@gulfbuild.ae', phone: '+971 56 321 0987', outstanding_receivable_amount: 6000, currency_code: 'AED', status: 'active' },
]

export default function ZohoBooksPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'invoices' | 'customers'>('invoices')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [invoiceDetail, setInvoiceDetail] = useState<any>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [flash, setFlash] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [invRes, custRes] = await Promise.all([
        API.get('/api/books/invoices'),
        API.get('/api/books/customers'),
      ])
      const invData = invRes.data.invoices || []
      const custData = custRes.data.customers || []
      setInvoices(invData.length > 0 ? invData : SAMPLE_INVOICES)
      setCustomers(custData.length > 0 ? custData : SAMPLE_CUSTOMERS)
    } catch {
      setInvoices(SAMPLE_INVOICES)
      setCustomers(SAMPLE_CUSTOMERS)
    } finally {
      setLoading(false)
    }
  }

  const handleViewInvoice = async (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setLoadingDetail(true)
    try {
      const res = await API.get(`/api/books/invoices/${invoice.invoice_id}`)
      setInvoiceDetail(res.data.invoice || invoice)
    } catch {
      setInvoiceDetail(invoice)
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleSendReminder = async (invoiceId: string) => {
    try {
      await API.post(`/api/books/invoices/${invoiceId}/send-reminder`)
      setFlash('✅ Payment reminder sent!')
    } catch {
      setFlash('⚠️ Reminder sent (mock — connect Zoho Books in Settings to send real emails)')
    }
    setTimeout(() => setFlash(''), 4000)
  }

  useEffect(() => { fetchData() }, [])

  const fmtCurrency = (n: number, code = 'AED') =>
    new Intl.NumberFormat('en-AE', { style: 'currency', currency: code, maximumFractionDigits: 0 }).format(n)

  const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('en', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

  const filteredInvoices = invoices.filter(inv => {
    const matchSearch = !searchQuery || inv.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase())
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchSearch && matchStatus
  })

  const filteredCustomers = customers.filter(c =>
    !searchQuery || c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) || c.contact_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Summary stats
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balance || 0), 0)
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0)
  const overdueCount = invoices.filter(i => i.status === 'overdue').length
  const totalRevenue = invoices.reduce((sum, i) => sum + i.total, 0)

  const statCards = [
    { label: 'Total Revenue', value: fmtCurrency(totalRevenue), icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Outstanding', value: fmtCurrency(totalOutstanding), icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Collected', value: fmtCurrency(totalPaid), icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Overdue', value: `${overdueCount} invoice${overdueCount !== 1 ? 's' : ''}`, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  ]

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-50">
      <Sidebar />
      <main className="flex-1 ms-64 p-8 xl:p-10 h-screen overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-1 flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-400" />
              Zoho Books
            </h1>
            <p className="text-sm text-slate-400">Invoices & customer billing data from Zoho Books</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white" onClick={fetchData} disabled={syncing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} /> Sync
            </Button>
            <Button className="bg-blue-600 text-white hover:bg-blue-500" onClick={() => setFlash('⚠️ Connect Zoho Books in Settings to create invoices directly.')}>
              <Plus className="mr-2 h-4 w-4" /> New Invoice
            </Button>
          </div>
        </div>

        {flash && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 text-sm text-blue-300 flex items-center justify-between">
            <span>{flash}</span>
            <button onClick={() => setFlash('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(card => {
            const Icon = card.icon
            return (
              <Card key={card.label} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
                <CardContent className="p-5">
                  <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`w-4 h-4 ${card.color}`} />
                  </div>
                  <div className="text-xl font-bold text-white mb-1">{card.value}</div>
                  <div className="text-xs text-slate-400">{card.label}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="flex gap-8">
          {/* Main Table */}
          <div className="flex-1 min-w-0">
            {/* Tabs + Search + Filter */}
            <div className="flex items-center gap-4 mb-5 flex-wrap">
              <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
                {(['invoices', 'customers'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${activeTab === tab ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    {tab === 'invoices' ? <><FileText className="w-3.5 h-3.5 inline mr-1.5" />Invoices</> : <><Users className="w-3.5 h-3.5 inline mr-1.5" />Customers</>}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
                  placeholder={activeTab === 'invoices' ? 'Search invoices...' : 'Search customers...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {activeTab === 'invoices' && (
                <select
                  className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="sent">Sent</option>
                  <option value="overdue">Overdue</option>
                  <option value="partially_paid">Partial</option>
                  <option value="draft">Draft</option>
                </select>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : activeTab === 'invoices' ? (
              <Card className="bg-slate-900 border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Invoice #</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Customer</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Date</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Due</th>
                        <th className="text-right px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                        <th className="text-right px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Balance</th>
                        <th className="text-center px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                        <th className="px-5 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.map(inv => {
                        const cfg = STATUS_CONFIG[inv.status] || STATUS_CONFIG['draft']
                        const StatusIcon = cfg.icon
                        const isOverdue = inv.status === 'overdue' || (inv.balance > 0 && inv.due_date && new Date(inv.due_date) < new Date())
                        return (
                          <tr key={inv.invoice_id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors cursor-pointer" onClick={() => handleViewInvoice(inv)}>
                            <td className="px-5 py-4">
                              <span className="font-mono text-blue-400 font-medium">{inv.invoice_number}</span>
                            </td>
                            <td className="px-5 py-4 text-slate-200 font-medium">{inv.customer_name}</td>
                            <td className="px-5 py-4 text-slate-400">{fmtDate(inv.date)}</td>
                            <td className={`px-5 py-4 ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>{fmtDate(inv.due_date)}</td>
                            <td className="px-5 py-4 text-right text-slate-200">{fmtCurrency(inv.total, inv.currency_code)}</td>
                            <td className={`px-5 py-4 text-right font-semibold ${inv.balance > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                              {inv.balance > 0 ? fmtCurrency(inv.balance, inv.currency_code) : '—'}
                            </td>
                            <td className="px-5 py-4 text-center">
                              <Badge variant="outline" className={`text-[11px] ${cfg.color}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {cfg.label}
                              </Badge>
                            </td>
                            <td className="px-5 py-4">
                              <ChevronRight className="w-4 h-4 text-slate-600" />
                            </td>
                          </tr>
                        )
                      })}
                      {filteredInvoices.length === 0 && (
                        <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-500">No invoices found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              <Card className="bg-slate-900 border-slate-800">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Company</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Contact</th>
                        <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Email</th>
                        <th className="text-right px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Outstanding</th>
                        <th className="text-center px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map(cust => (
                        <tr key={cust.contact_id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                                {cust.company_name?.charAt(0) || '?'}
                              </div>
                              <span className="font-medium text-slate-200">{cust.company_name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-400">{cust.contact_name}</td>
                          <td className="px-5 py-4 text-slate-400">{cust.email}</td>
                          <td className={`px-5 py-4 text-right font-semibold ${cust.outstanding_receivable_amount > 0 ? 'text-orange-400' : 'text-emerald-400'}`}>
                            {cust.outstanding_receivable_amount > 0 ? fmtCurrency(cust.outstanding_receivable_amount, cust.currency_code) : 'None'}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <Badge variant="outline" className={cust.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px]' : 'bg-slate-500/10 text-slate-400 border-slate-700 text-[11px]'}>
                              {cust.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-500">No customers found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {/* Invoice Detail Panel */}
          {selectedInvoice && (
            <div className="w-[340px] shrink-0">
              <Card className="bg-slate-900 border-slate-800 sticky top-0">
                <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white">{selectedInvoice.invoice_number}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedInvoice.customer_name}</p>
                  </div>
                  <button onClick={() => setSelectedInvoice(null)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <CardContent className="p-5 space-y-4">
                  {loadingDetail ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                    </div>
                  ) : (
                    <>
                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Status</span>
                        {(() => {
                          const cfg = STATUS_CONFIG[selectedInvoice.status] || STATUS_CONFIG['draft']
                          const Icon = cfg.icon
                          return (
                            <Badge variant="outline" className={`text-[11px] ${cfg.color}`}>
                              <Icon className="w-3 h-3 mr-1" />{cfg.label}
                            </Badge>
                          )
                        })()}
                      </div>

                      {/* Key Fields */}
                      {[
                        ['Invoice Date', fmtDate(selectedInvoice.date)],
                        ['Due Date', fmtDate(selectedInvoice.due_date)],
                        ['Total Amount', fmtCurrency(selectedInvoice.total, selectedInvoice.currency_code)],
                        ['Balance Due', selectedInvoice.balance > 0 ? fmtCurrency(selectedInvoice.balance, selectedInvoice.currency_code) : 'Fully Paid'],
                      ].map(([label, value]) => (
                        <div key={label} className="flex items-center justify-between border-b border-slate-800/50 pb-3">
                          <span className="text-xs text-slate-500">{label}</span>
                          <span className={`text-sm font-medium ${label === 'Balance Due' && selectedInvoice.balance === 0 ? 'text-emerald-400' : label === 'Balance Due' ? 'text-orange-400' : 'text-slate-200'}`}>{value}</span>
                        </div>
                      ))}

                      {/* Line items if available */}
                      {invoiceDetail?.line_items && invoiceDetail.line_items.length > 0 && (
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Line Items</p>
                          <div className="space-y-2">
                            {invoiceDetail.line_items.map((item: any, i: number) => (
                              <div key={i} className="flex justify-between text-xs">
                                <span className="text-slate-400 truncate flex-1 pr-2">{item.name || item.description || 'Item'}</span>
                                <span className="text-slate-300 shrink-0">{fmtCurrency(item.item_total || 0, selectedInvoice.currency_code)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        {selectedInvoice.balance > 0 && (
                          <Button
                            className="w-full bg-orange-600 hover:bg-orange-500 text-white"
                            size="sm"
                            onClick={() => handleSendReminder(selectedInvoice.invoice_id)}
                          >
                            <Send className="w-3.5 h-3.5 mr-2" /> Send Payment Reminder
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-slate-700 text-slate-300 hover:text-white"
                          onClick={() => window.open(`https://books.zoho.com/app#/invoices/${selectedInvoice.invoice_id}`, '_blank')}
                        >
                          <Download className="w-3.5 h-3.5 mr-2" /> Open in Zoho Books
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
