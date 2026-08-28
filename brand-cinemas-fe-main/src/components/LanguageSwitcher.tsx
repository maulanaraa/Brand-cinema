import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Languages } from 'lucide-react'
import { clsx } from 'clsx'
import { useLanguage } from '@/contexts/LanguageContext'

export default function LanguageSwitcher({ className }: { className?: string }) {
  const { language, setLanguage, languages, t } = useLanguage()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const current = languages.find((item) => item.code === language) ?? languages[1]

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={clsx('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[var(--border-soft)] bg-[var(--surface-raised)] px-2.5 text-sm font-semibold text-[var(--text-primary)] transition-all hover:bg-[var(--surface-muted)] dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
        aria-label={t('language')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Languages className="h-4 w-4 shrink-0 text-[#D5A527]" />
        <span className="hidden sm:inline">{t('language')}</span>
        <span className="sm:hidden">{current.label}</span>
        <span className="hidden sm:inline text-xs opacity-70">{current.label}</span>
        <ChevronDown className={clsx('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      <div
        className={clsx(
          'absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] shadow-xl transition-all duration-200 origin-top-right dark:border-white/10 dark:bg-dark-850',
          open
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0'
        )}
        role="listbox"
        aria-label={t('language')}
      >
        {languages.map((item) => (
          <button
            key={item.code}
            type="button"
            role="option"
            aria-selected={language === item.code}
            onClick={() => {
              setLanguage(item.code)
              setOpen(false)
            }}
            className={clsx(
              'flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold transition-colors',
              language === item.code
                ? 'bg-[#D5A527] text-dark-950'
                : 'text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-white/5'
            )}
          >
            <span>{item.name}</span>
            <span className="text-xs opacity-80">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
