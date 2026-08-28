import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { LANGUAGES, translate, type Language, type TranslationKey } from '@/i18n/translations'

interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
  languages: typeof LANGUAGES
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

function getInitialLanguage(): Language {
  if (typeof window === 'undefined') return 'en'
  const stored = localStorage.getItem('language') as Language | null
  if (stored === 'id' || stored === 'en' || stored === 'ko') return stored
  const browser = navigator.language.toLowerCase()
  if (browser.startsWith('id')) return 'id'
  if (browser.startsWith('ko')) return 'ko'
  return 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  useEffect(() => {
    document.documentElement.lang = language
    localStorage.setItem('language', language)
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
  }, [])

  const t = useCallback((key: TranslationKey) => translate(language, key), [language])

  const value = useMemo(
    () => ({ language, setLanguage, t, languages: LANGUAGES }),
    [language, setLanguage, t],
  )

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider')
  return ctx
}
