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
