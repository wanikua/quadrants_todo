'use client'

import { useTranslation } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, toggleLocale } = useTranslation()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLocale}
      className={`gap-1.5 font-medium ${className}`}
      title={locale === 'en' ? '切换中文' : 'Switch to English'}
    >
      <Globe className="w-4 h-4" />
      <span className="text-sm">{locale === 'en' ? '中文' : 'EN'}</span>
    </Button>
  )
}
