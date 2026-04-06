'use client'
import React, { createContext, useContext, useEffect, useState } from 'react'

type Language = 'EN' | 'AR'
type Direction = 'ltr' | 'rtl'

interface LanguageContextType {
  lang: Language
  setLanguage: (lang: Language) => void
  dir: Direction
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

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider')
  return context
}
