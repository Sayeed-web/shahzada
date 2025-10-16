'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language, TranslationKey, t as translate } from '@/lib/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export { LanguageContext }

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fa')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Always start with Persian as default
    setLanguageState('fa')
    updateDocumentLanguage('fa')
    
    // Load saved language after mount
    setTimeout(() => {
      try {
        const saved = localStorage.getItem('language') as Language
        if (saved && translations[saved] && saved !== 'fa') {
          setLanguageState(saved)
          updateDocumentLanguage(saved)
        }
      } catch (error) {
        // Ignore localStorage errors
      }
    }, 100)
  }, [])

  const updateDocumentLanguage = (lang: Language) => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = lang
      document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl'
      document.body.className = document.body.className.replace(/lang-\w+/g, '') + ` lang-${lang}`
    }
  }

  const setLanguage = (lang: Language) => {
    try {
      setLanguageState(lang)
      localStorage.setItem('language', lang)
      updateDocumentLanguage(lang)
      
      // Force complete re-render of entire app
      window.dispatchEvent(new CustomEvent('languageChange', { 
        detail: { language: lang },
        bubbles: true 
      }))
      
      // Force React to re-render everything
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
        // Trigger state updates in all components
        const event = new CustomEvent('forceUpdate')
        window.dispatchEvent(event)
      }, 50)
    } catch (error) {
      console.error('Error setting language:', error)
    }
  }

  const t = (key: TranslationKey) => {
    if (!mounted) return key
    try {
      return translate(key, language)
    } catch (error) {
      console.warn('Translation error for key:', key, error)
      return key
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white font-bold text-2xl">س</span>
          </div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    )
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}