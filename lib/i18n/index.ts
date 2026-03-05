'use client'

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { locales, type Locale, type TranslationKey } from './locales'

const STORAGE_KEY = 'quadrants-locale'

/**
 * Get the user's preferred locale
 * Priority: localStorage > browser language > 'en'
 */
export function getDefaultLocale(): Locale {
  if (typeof window === 'undefined') return 'en'

  // Check localStorage
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'zh' || stored === 'en') return stored

  // Check browser language
  const browserLang = navigator.language || (navigator as any).userLanguage || ''
  if (browserLang.startsWith('zh')) return 'zh'

  return 'en'
}

/**
 * Translation function
 */
export function t(key: TranslationKey, locale: Locale = 'en'): string {
  return locales[locale]?.[key] || locales.en[key] || key
}

/**
 * React hook for translations
 */
export function useTranslation() {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    setLocaleState(getDefaultLocale())
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLocale)
    }
  }, [])

  const translate = useCallback((key: TranslationKey): string => {
    return t(key, locale)
  }, [locale])

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'zh' : 'en')
  }, [locale, setLocale])

  return {
    locale,
    setLocale,
    t: translate,
    toggleLocale,
    isZh: locale === 'zh',
    isEn: locale === 'en',
  }
}

export { type Locale, type TranslationKey }
