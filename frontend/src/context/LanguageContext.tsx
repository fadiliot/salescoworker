'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'

type Language = 'EN' | 'AR'
type Direction = 'ltr' | 'rtl'

const TRANSLATIONS = {
  EN: {
    dashboard: 'Dashboard',
    leads: 'Leads',
    pipeline: 'Pipeline',
    inbox: 'Inbox',
    activities: 'Activities',
    reminders: 'Reminders',
    settings: 'Settings',
    workspace: 'WORKSPACE',
    system: 'SYSTEM',
    pbx_online: 'PBX Online',
    pbx_offline: 'PBX Offline',
    yeastar_int: 'Yeastar Integration',
    gold_tier: 'Gold Tier',
    dubai: 'Dubai',
    next: 'Next',
    maghrib: 'Maghrib',
    sync_data: 'Sync Data',
    new_lead: 'New Lead',
    total_pipeline: 'Total Pipeline',
    active_deals: 'Active Deals',
    unread_emails: 'Unread Emails',
    hot_leads_desc: 'Accounts showing high intent score',
    ai_analysis: 'AI Pipeline Analysis',
    upcoming_meetings: 'Upcoming Meetings',
    today_reminders: 'Today\'s Reminders',
    recent_emails: 'Recent Emails',
    uae_overview: 'Here\'s your UAE pipeline overview.',
    first_name: 'First Name',
    last_name: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    company: 'Company',
    title: 'Title',
    status: 'Status',
    source: 'Source',
    score: 'Score',
    actions: 'Actions',
    amount: 'Amount',
    probability: 'Probability',
    notes: 'Notes',
    stakeholders: 'Stakeholders',
    ai_score_all: 'AI Score All',
    new: 'New',
    contacted: 'Contacted',
    proposal: 'Proposal',
    negotiation: 'Negotiation',
    won: 'Won',
    lost: 'Lost',
    deal_title: 'Deal Title',
    drop_here: 'Drop deal here',
     briefings: 'AI intelligence briefings',
    schedule: 'Schedule',
    due: 'Due',
    completed: 'Completed',
    pending: 'Pending',
    log_activity: 'Log Activity',
    type: 'Type',
    call: 'Call',
    meeting: 'Meeting',
    outcome: 'Outcome',
    profile: 'Profile',
    notifications: 'Notifications',
    billing: 'Billing',
    logout: 'Logout',
    appearance: 'Appearance',
    language: 'Language',
    save_changes: 'Save Changes',
    cancel: 'Cancel',
    save_log: 'Save Log',
    note: 'Note',
    task: 'Task',
    search_emails: 'Search emails...',
    new_message: 'New Message',
    to: 'To',
    subject: 'Subject',
    type_message: 'Type your message here...',
    sending: 'Sending...',
    send_message: 'Send Message',
    positive: 'Positive',
    negative: 'Negative',
    neutral: 'Neutral',
    compose_reply: 'Compose Reply',
    type_reply: 'Type your reply here...',
    send_reply: 'Send Reply',
    thinking: 'Thinking...',
    auto_draft: 'Auto-Draft AI Reply',
    sales_coworker: 'Sales Co-worker',
    intel: 'Intel',
    draft_ready: 'Draft Ready',
    apply_draft: 'Apply Draft',
    lead_extracted: 'Lead Extracted',
    add_to_crm: 'Add to CRM',
    toolbox: 'Toolbox',
    generate_ai_reply: 'Generate AI Reply',
    parse_lead_data: 'Parse Lead Data',
    no_messages: 'No messages',
    select_email_hint: 'Select an email from the list to read it, generate AI drafts, and automatically extract pipeline leads.',
  },
  AR: {
    dashboard: 'لوحة القيادة',
    leads: 'العملاء المحتملون',
    pipeline: 'خط المبيعات',
    inbox: 'البريد الوارد',
    activities: 'الأنشطة',
    reminders: 'التذكيرات',
    settings: 'الإعدادات',
    workspace: 'مساحة العمل',
    system: 'النظام',
    pbx_online: 'الهاتف متصل',
    pbx_offline: 'الهاتف غير متصل',
    yeastar_int: 'تكامل Yeastar',
    gold_tier: 'الفئة الذهبية',
    dubai: 'دبي',
    next: 'التالي',
    maghrib: 'المغرب',
    sync_data: 'مزامنة البيانات',
    new_lead: 'عميل جديد',
    total_pipeline: 'إجمالي المبيعات',
    active_deals: 'الصفقات النشطة',
    unread_emails: 'رسائل غير مقروءة',
    hot_leads_desc: 'الحسابات ذات أعلى نقاط اهتمام',
    ai_analysis: 'تحليل الذكاء الاصطناعي',
    upcoming_meetings: 'الاجتماعات القادمة',
    today_reminders: 'تذكيرات اليوم',
    recent_emails: 'رسائل البريد الأخيرة',
    uae_overview: 'نظرة عامة على مبيعاتك في الإمارات',
    first_name: 'الاسم الأول',
    last_name: 'الكنية',
    email: 'البريد الإلكتروني',
    phone: 'الهاتف',
    company: 'الشركة',
    title: 'المسمى الوظيفي',
    status: 'الحالة',
    source: 'المصدر',
    score: 'الدرجة',
    actions: 'إجراءات',
    amount: 'المبلغ',
    probability: 'الاحتمالية',
    notes: 'ملاحظات',
    stakeholders: 'أصحاب المصلحة',
    ai_score_all: 'تقييم الكل بالذكاء الاصطناعي',
    new: 'جديد',
    contacted: 'تم الاتصال',
    proposal: 'عرض سعر',
    negotiation: 'تفاوض',
    won: 'رابحة',
    lost: 'خاسرة',
    deal_title: 'عنوان الصفقة',
    drop_here: 'أسقط الصفقة هنا',
    briefings: 'ملخصات ذكاء اصطناعي',
    schedule: 'جدول',
    due: 'الموعد',
    completed: 'مكتمل',
    pending: 'معلق',
    log_activity: 'تسجيل نشاط',
    type: 'النوع',
    call: 'اتصال',
    meeting: 'اجتماع',
    outcome: 'النتيجة',
    profile: 'الملف الشخصي',
    notifications: 'التنبيهات',
    billing: 'الفوترة',
    logout: 'تسديد الخروج',
    appearance: 'المظهر',
    language: 'اللغة',
    save_changes: 'حفظ التغييرات',
    cancel: 'إلغاء',
    save_log: 'حفظ السجل',
    note: 'ملاحظة',
    task: 'مهمة',
    search_emails: 'البحث في البريد...',
    new_message: 'رسالة جديدة',
    to: 'إلى',
    subject: 'الموضوع',
    type_message: 'اكتب رسالتك هنا...',
    sending: 'جاري الإرسال...',
    send_message: 'إرسال الرسالة',
    positive: 'إيجابي',
    negative: 'سلبي',
    neutral: 'محايد',
    compose_reply: 'كتابة رد',
    type_reply: 'اكتب ردك هنا...',
    send_reply: 'إرسال الرد',
    thinking: 'جاري التفكير...',
    auto_draft: 'مسودة ذكية',
    sales_coworker: 'مساعد المبيعات',
    intel: 'معلومات',
    draft_ready: 'المسودة جاهزة',
    apply_draft: 'تطبيق المسودة',
    lead_extracted: 'تم استخراج العميل',
    add_to_crm: 'إضافة إلى النظام',
    toolbox: 'أدوات',
    generate_ai_reply: 'إنشاء رد ذكي',
    parse_lead_data: 'تحليل بيانات العميل',
    no_messages: 'لا توجد رسائل',
    select_email_hint: 'اختر رسالة من القائمة لقراءتها، وتوليد مسودات ذكاء اصطناعي، واستخراج العملاء تلقائياً.',
  }
}

interface LanguageContextType {
  lang: Language
  setLanguage: (lang: Language) => void
  dir: Direction
  t: (key: keyof typeof TRANSLATIONS.EN) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('EN')
  const [dir, setDir] = useState<Direction>('ltr')

  useEffect(() => {
    const saved = localStorage.getItem('app-lang') as Language
    if (saved && (saved === 'EN' || saved === 'AR')) {
      setLang(saved)
      setDir(saved === 'AR' ? 'rtl' : 'ltr')
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang.toLowerCase()
    document.documentElement.dir = dir
    localStorage.setItem('app-lang', lang)
  }, [lang, dir])

  const setLanguage = (newLang: Language) => {
    setLang(newLang)
    setDir(newLang === 'AR' ? 'rtl' : 'ltr')
  }

  const t = (key: keyof typeof TRANSLATIONS.EN) => {
    return TRANSLATIONS[lang][key] || key
  }

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, dir, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider')
  return context
}
