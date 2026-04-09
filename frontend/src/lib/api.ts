import axios from 'axios'

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

// ─── Dashboard ──────────────────────────────────────────────────
export const getDashboardStats = () => API.get('/api/dashboard/stats').then(r => r.data)

// ─── Leads ──────────────────────────────────────────────────────
export const getLeads = (params?: Record<string, any>) => API.get('/api/leads', { params }).then(r => r.data)
export const getLead = (id: string) => API.get(`/api/leads/${id}`).then(r => r.data)
export const createLead = (data: any) => API.post('/api/leads', data).then(r => r.data)
export const updateLead = (id: string, data: any) => API.put(`/api/leads/${id}`, data).then(r => r.data)
export const deleteLead = (id: string) => API.delete(`/api/leads/${id}`).then(r => r.data)
export const rescoreLead = (id: string) => API.post(`/api/leads/${id}/rescore`).then(r => r.data)
export const getLeadNextActions = (id: string) => API.get(`/api/leads/${id}/next-actions`).then(r => r.data)

// ─── Deals ──────────────────────────────────────────────────────
export const getDeals = (params?: Record<string, any>) => API.get('/api/deals', { params }).then(r => r.data)
export const createDeal = (data: any) => API.post('/api/deals', data).then(r => r.data)
export const updateDealStage = (id: string, stage: string) => API.patch(`/api/deals/${id}/stage`, null, { params: { stage } }).then(r => r.data)
export const getPipelineStats = () => API.get('/api/deals/stats/pipeline').then(r => r.data)

// ─── Emails ─────────────────────────────────────────────────────
export const getEmails = (params?: Record<string, any>) => API.get('/api/emails', { params }).then(r => r.data)
export const getEmail = (id: string) => API.get(`/api/emails/${id}`).then(r => r.data)
export const syncEmails = () => API.post('/api/emails/sync').then(r => r.data)
export const suggestReply = (id: string) => API.post(`/api/emails/${id}/suggest-reply`).then(r => r.data)
export const sendReply = (id: string, body: string) =>
  API.post(`/api/emails/${id}/send-reply`, null, { params: { body } }).then(r => r.data)
export const sendEmail = (data: any) => API.post('/api/emails/send', data).then(r => r.data)
export const extractLead = (id: string) => API.post(`/api/emails/${id}/extract-lead`).then(r => r.data)

// ─── Activities ─────────────────────────────────────────────────
export const getActivities = (params?: Record<string, any>) => API.get('/api/activities', { params }).then(r => r.data)
export const createActivity = (data: any) => API.post('/api/activities', data).then(r => r.data)
export const getRecentCalls = () => API.get('/api/activities/calls/recent').then(r => r.data)
export const clickToDial = (callerExt: string, calleeNumber: string) =>
  API.post('/api/activities/calls/dial', null, { params: { caller_ext: callerExt, callee_number: calleeNumber } }).then(r => r.data)
export const getRecentMeetings = () => API.get('/api/activities/meetings/recent').then(r => r.data)

// ─── Reminders ──────────────────────────────────────────────────
export const getReminders = (params?: Record<string, any>) => API.get('/api/reminders', { params }).then(r => r.data)
export const createReminder = (data: any) => API.post('/api/reminders', data).then(r => r.data)
export const completeReminder = (id: string) => API.patch(`/api/reminders/${id}/complete`).then(r => r.data)

// ─── Auth / Integrations ─────────────────────────────────────────
export const getAuthStatus = () => API.get('/api/auth/status').then(r => r.data)
export const getZohoAuthUrl = () => API.get('/api/auth/zoho').then(r => r.data)
export const getMicrosoftAuthUrl = () => API.get('/api/auth/microsoft').then(r => r.data)
export const getGoogleAuthUrl = () => API.get('/api/auth/google').then(r => r.data)
export const syncIntegrations = () => API.post('/api/integrations/sync').then(r => r.data)
export const seedSampleData = () => API.post('/api/integrations/seed').then(r => r.data)
export const getZohoInvoices = () => API.get('/api/integrations/zoho/invoices').then(r => r.data)

// ─── Agent ────────────────────────────────────────────────────────
export const getAgentLogs = () => API.get('/api/agent/logs').then(r => r.data)
export const getAgentConfig = () => API.get('/api/agent/config').then(r => r.data)
export const toggleAgentWorkflow = (name: string, enabled: boolean) => API.post(`/api/agent/config/${name}`, null, { params: { enabled } }).then(r => r.data)
export const getApprovalQueue = () => API.get('/api/agent/approval-queue').then(r => r.data)
export const approveAgentDraft = (id: string) => API.post(`/api/agent/approval-queue/${id}/approve`).then(r => r.data)
export const triggerAgentWorkflow = (name: string) => API.post('/api/agent/trigger', null, { params: { workflow_name: name } }).then(r => r.data)

// ─── AI ──────────────────────────────────────────────────────────
export const getPipelineInsights = () => API.get('/api/ai/pipeline-insights').then(r => r.data)
export const scoreAllLeads = () => API.post('/api/ai/score-all-leads').then(r => r.data)
export const generateFollowup = (data: any) => API.post('/api/ai/generate-followup', data).then(r => r.data)
export const getUpcomingMeetings = () => API.get('/api/ai/upcoming-meetings').then(r => r.data)
export const getTearSheet = (eventId: string, attendeeEmails: string) =>
  API.get(`/api/ai/tear-sheet/${eventId}`, { params: { attendee_emails: attendeeEmails } }).then(r => r.data)
export const analyzeRecentCalls = (leadId?: string) =>
  API.post('/api/activities/calls/analyze', null, { params: { lead_id: leadId } }).then(r => r.data)

// ─── Contacts ────────────────────────────────────────────────────
export const getContactsByLead = (leadId: string) => API.get('/api/contacts', { params: { lead_id: leadId } }).then(r => r.data)
export const updateContactRole = (id: string, role: string) => API.patch(`/api/contacts/${id}/role`, null, { params: { role } }).then(r => r.data)
export const analyzeContactRole = (id: string) => API.post(`/api/contacts/${id}/analyze`).then(r => r.data)

export default API
