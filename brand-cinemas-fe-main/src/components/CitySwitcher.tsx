import { useEffect, useRef, useState } from 'react'
import { ChevronDown, MapPin } from 'lucide-react'
import { clsx } from 'clsx'
import { useLocationCity } from '@/contexts/LocationContext'
import { useLanguage } from '@/contexts/LanguageContext'

export default function CitySwitcher({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  const { t } = useLanguage()
  const {
    cities,
    cinemas,
    cityId,
    cinemaId,
    selectedCity,
    selectedCinema,
    loading,
    loadingCinemas,
    setCityId,
    setCinemaId,
  } = useLocationCity()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

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

  const label = loading
    ? t('loading')
    : selectedCinema?.name || selectedCity?.name || cities[0]?.name || t('selectLocation')

  const subLabel = selectedCinema && selectedCity ? selectedCity.name : null

  return (
    <div ref={rootRef} className={clsx('relative', open && 'z-[60]', className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={loading || cities.length === 0}
        className={clsx(
          'inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[var(--surface-raised)] text-sm font-semibold text-[var(--text-primary)] transition-all hover:bg-[var(--surface-muted)] disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10',
          compact ? 'h-9 px-2.5' : 'px-3 py-2',
        )}
        aria-label={t('changeLocation')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <MapPin className="h-4 w-4 shrink-0 text-[#D5A527]" />
        <span className="max-w-[9rem] truncate sm:max-w-[11rem]">
          {label}
          {subLabel ? (
            <span className="hidden font-medium text-gray-400 dark:text-slate-400 sm:inline">
              {` · ${subLabel}`}
            </span>
          ) : null}
        </span>
        <ChevronDown className={clsx('h-3.5 w-3.5 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>

      <div
        className={clsx(
          'absolute right-0 top-full z-[60] mt-2 max-h-72 w-64 overflow-y-auto rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] shadow-xl transition-all duration-200 origin-top-right dark:border-white/10 dark:bg-dark-850',
          open
            ? 'pointer-events-auto scale-100 opacity-100'
            : 'pointer-events-none scale-95 opacity-0',
        )}
        role="listbox"
        aria-label={t('changeLocation')}
      >
        {cities.length > 1 && (
          <div className="border-b border-gray-100 px-3 py-2 dark:border-white/5">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
              {t('city')}
            </p>
            {cities.map((city) => (
              <button
                key={city._id}
                type="button"
                role="option"
                aria-selected={cityId === city._id}
                onClick={() => {
                  setCityId(city._id)
                }}
                className={clsx(
                  'flex w-full items-center rounded-lg px-2 py-2 text-left text-sm font-semibold transition-colors',
                  cityId === city._id
                    ? 'bg-primary-550 text-dark-950'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-white/5',
                )}
              >
                {city.name}
              </button>
            ))}
          </div>
        )}

        <div className="px-3 py-2">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-500">
            {cities.length > 1 ? `${t('cinema')} · ${selectedCity?.name || ''}` : t('cinema')}
          </p>
          {loadingCinemas && (
            <p className="px-2 py-2 text-sm text-gray-500 dark:text-slate-400">{t('loading')}</p>
          )}
          {!loadingCinemas &&
            cinemas.map((cinema) => (
              <button
                key={cinema._id}
                type="button"
                role="option"
                aria-selected={cinemaId === cinema._id}
                onClick={() => {
                  setCinemaId(cinema._id)
                  setOpen(false)
                }}
                className={clsx(
                  'flex w-full flex-col rounded-lg px-2 py-2 text-left transition-colors',
                  cinemaId === cinema._id
                    ? 'bg-primary-550 text-dark-950'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-white/5',
                )}
              >
                <span className="text-sm font-semibold">{cinema.name}</span>
                {cities.length === 1 && selectedCity?.name ? (
                  <span
                    className={clsx(
                      'text-xs',
                      cinemaId === cinema._id ? 'text-dark-950/70' : 'text-gray-400 dark:text-slate-500',
                    )}
                  >
                    {selectedCity.name}
                  </span>
                ) : null}
              </button>
            ))}
          {!loadingCinemas && cinemas.length === 0 && (
            <p className="px-2 py-2 text-sm text-gray-500 dark:text-slate-400">
              {t('noCinemas')}
            </p>
          )}
        </div>

        {!loading && cities.length === 0 && (
          <p className="px-3 py-2.5 text-sm text-gray-500 dark:text-slate-400">
            {t('noCities')}
          </p>
        )}
      </div>
    </div>
  )
}
