'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { i18n, SupportedLanguage } from '@/lib/i18n-enhanced'
import { toast } from 'sonner'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  const languages = [
    { code: 'fa', name: 'فارسی', nativeName: 'فارسی', flag: '🇦🇫' },
    { code: 'ps', name: 'پښتو', nativeName: 'پښتو', flag: '🇦🇫' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' }
  ]

  useEffect(() => {
    setMounted(true)
    // Sync with enhanced i18n
    const currentLang = i18n.getLanguage()
    if (currentLang !== language) {
      setLanguage(currentLang)
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.language-switcher')) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
    return undefined
  }, [isOpen])

  const handleLanguageChange = (langCode: string) => {
    try {
      const newLang = langCode as SupportedLanguage
      setLanguage(newLang)
      i18n.setLanguage(newLang)
      setIsOpen(false)
      
      // Update document direction and language
      if (typeof window !== 'undefined') {
        document.documentElement.dir = i18n.isRTL(newLang) ? 'rtl' : 'ltr'
        document.documentElement.lang = newLang
      }
      
      const langName = languages.find(l => l.code === langCode)?.nativeName
      toast.success(i18n.t('common.languageChanged', { language: langName }))
    } catch (error) {
      console.error('Language change error:', error)
      toast.error(i18n.t('common.languageChangeFailed'))
    }
  }

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Globe className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="relative language-switcher">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">
          {languages.find(l => l.code === language)?.nativeName}
        </span>
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border rounded-lg shadow-lg z-50 min-w-[120px]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors ${
                language === lang.code ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : ''
              }`}
            >
              <span>{lang.flag}</span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{lang.nativeName}</span>
                <span className="text-xs text-muted-foreground">{lang.name}</span>
              </div>
              {language === lang.code && (
                <span className="ml-auto text-xs">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}