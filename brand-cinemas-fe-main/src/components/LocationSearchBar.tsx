import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, ChevronDown, MapPin, Search, Ticket } from 'lucide-react';
import { clsx } from 'clsx';
import { cinemaService } from '@/services/cinemaService';
import { useLocationCity } from '@/contexts/LocationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LOCALE_BY_LANGUAGE, type Language } from '@/i18n/translations';
import type { AvailableDateItem } from '@/types/cinema';

function formatDateLabel(isoDate: string, language: Language, labels: { today: string; tomorrow: string }): string {
  const date = new Date(`${isoDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const locale = LOCALE_BY_LANGUAGE[language];

  const short = date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });

  if (date.getTime() === today.getTime()) return `${labels.today}, ${short}`;
  if (date.getTime() === tomorrow.getTime()) return `${labels.tomorrow}, ${short}`;
  return date.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' });
}

function buildFallbackDates(
  language: Language,
  labels: { today: string; tomorrow: string },
  days = 7,
): AvailableDateItem[] {
  const items: AvailableDateItem[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);

  for (let i = 0; i < days; i += 1) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    items.push({ date: iso, label: formatDateLabel(iso, language, labels) });
  }

  return items;
}

export default function LocationSearchBar() {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const dateLabels = useMemo(() => {
    if (language === 'id') return { today: 'Hari ini', tomorrow: 'Besok' };
    if (language === 'ko') return { today: '오늘', tomorrow: '내일' };
    return { today: 'Today', tomorrow: 'Tomorrow' };
  }, [language]);
  const {
    cities,
    cinemas,
    cityId,
    cinemaId,
    selectedCity,
    selectedCinema,
    loading: loadingCities,
    loadingCinemas,
    setCityId,
    setCinemaId,
  } = useLocationCity();
  const [dates, setDates] = useState<AvailableDateItem[]>(() =>
    buildFallbackDates('en', { today: 'Today', tomorrow: 'Tomorrow' }),
  );
  const [date, setDate] = useState(() =>
    buildFallbackDates('en', { today: 'Today', tomorrow: 'Tomorrow' })[0]?.date ?? '',
  );
  const [openMenu, setOpenMenu] = useState<'city' | 'cinema' | 'date' | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadDates = async () => {
      if (cityId && !cinemaId && loadingCinemas) {
        return;
      }

      const apiDates = await cinemaService.getAvailableDates({
        cityId: cityId || undefined,
        cinemaId: cinemaId || undefined,
        days: 7,
      });

      if (cancelled) return;

      if (apiDates.length > 0) {
        const normalized = apiDates.map((item) => ({
          date: item.date,
          label: item.label || formatDateLabel(item.date, language, dateLabels),
        }));
        setDates(normalized);
        setDate((prev) => (
          normalized.some((d) => d.date === prev) ? prev : normalized[0].date
        ));
      } else {
        const fallback = buildFallbackDates(language, dateLabels);
        setDates(fallback);
        setDate((prev) => (
          fallback.some((d) => d.date === prev) ? prev : fallback[0].date
        ));
      }
    };

    loadDates();
    return () => {
      cancelled = true;
    };
  }, [cityId, cinemaId, loadingCinemas, language, dateLabels]);

  useEffect(() => {
    if (!openMenu) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-location-menu]')) {
        setOpenMenu(null);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMenu(null);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openMenu]);

  const canSearch = useMemo(
    () => Boolean(cityId && cinemaId && date),
    [cityId, cinemaId, date],
  );

  const selectedDateLabel = dates.find((item) => item.date === date)?.label
    || (date ? formatDateLabel(date, language, dateLabels) : t('selectDate'));

  const handleSearch = () => {
    if (!canSearch) return;

    const params = new URLSearchParams({
      cityId,
      cinemaId,
      date,
    });
    navigate(`/movies?${params.toString()}`);
  };

  const fieldButtonClass =
    'flex w-full items-center gap-3 rounded-md border border-[var(--border-soft)] bg-[var(--surface-raised)] px-4 py-3 text-left transition-colors hover:border-primary-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-transparent dark:hover:border-primary-500/60';

  const menuClass = (open: boolean) =>
    clsx(
      'absolute left-0 right-0 top-full z-40 mt-2 max-h-64 overflow-y-auto rounded-xl border border-[var(--border-soft)] bg-[var(--surface-card)] shadow-xl transition-all duration-200 origin-top dark:border-white/10 dark:bg-dark-850',
      open
        ? 'pointer-events-auto scale-100 opacity-100'
        : 'pointer-events-none scale-95 opacity-0',
    );

  const optionClass = (active: boolean) =>
    clsx(
      'flex w-full items-center px-3 py-2.5 text-left text-sm font-semibold transition-colors',
      active
        ? 'bg-primary-550 text-dark-950'
        : 'text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-white/5',
    );

  return (
    <section className="px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="cinema-panel mx-auto max-w-7xl p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <div className={clsx('relative', openMenu === 'city' && 'z-40')} data-location-menu>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              {t('city')}
            </span>
            <button
              type="button"
              onClick={() => setOpenMenu((prev) => (prev === 'city' ? null : 'city'))}
              disabled={loadingCities || cities.length === 0}
              className={fieldButtonClass}
              aria-haspopup="listbox"
              aria-expanded={openMenu === 'city'}
            >
              <MapPin className="h-5 w-5 shrink-0 text-[#D5A527]" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-slate-100">
                {loadingCities
                  ? t('loading')
                  : selectedCity?.name || t('selectCity')}
              </span>
              <ChevronDown className={clsx('h-4 w-4 shrink-0 text-gray-400 transition-transform', openMenu === 'city' && 'rotate-180')} />
            </button>
            <div className={menuClass(openMenu === 'city')} role="listbox">
              {cities.map((city) => (
                <button
                  key={city._id}
                  type="button"
                  role="option"
                  aria-selected={cityId === city._id}
                  onClick={() => {
                    setCityId(city._id);
                    setOpenMenu(null);
                  }}
                  className={optionClass(cityId === city._id)}
                >
                  {city.name}
                </button>
              ))}
              {!loadingCities && cities.length === 0 && (
                <p className="px-3 py-2.5 text-sm text-gray-500 dark:text-slate-400">
                  {t('noCities')}
                </p>
              )}
            </div>
          </div>

          <div className={clsx('relative', openMenu === 'cinema' && 'z-40')} data-location-menu>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              {t('cinema')}
            </span>
            <button
              type="button"
              onClick={() => setOpenMenu((prev) => (prev === 'cinema' ? null : 'cinema'))}
              disabled={!cityId || loadingCinemas || cinemas.length === 0}
              className={fieldButtonClass}
              aria-haspopup="listbox"
              aria-expanded={openMenu === 'cinema'}
            >
              <Ticket className="h-5 w-5 shrink-0 text-[#D5A527]" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-slate-100">
                {loadingCinemas
                  ? t('loading')
                  : selectedCinema?.name || t('noCinemas')}
              </span>
              <ChevronDown className={clsx('h-4 w-4 shrink-0 text-gray-400 transition-transform', openMenu === 'cinema' && 'rotate-180')} />
            </button>
            <div className={menuClass(openMenu === 'cinema')} role="listbox">
              {cinemas.map((cinema) => (
                <button
                  key={cinema._id}
                  type="button"
                  role="option"
                  aria-selected={cinemaId === cinema._id}
                  onClick={() => {
                    setCinemaId(cinema._id);
                    setOpenMenu(null);
                  }}
                  className={optionClass(cinemaId === cinema._id)}
                >
                  {cinema.name}
                </button>
              ))}
            </div>
          </div>

          <div className={clsx('relative', openMenu === 'date' && 'z-40')} data-location-menu>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
              {t('date')}
            </span>
            <button
              type="button"
              onClick={() => setOpenMenu((prev) => (prev === 'date' ? null : 'date'))}
              disabled={dates.length === 0}
              className={fieldButtonClass}
              aria-haspopup="listbox"
              aria-expanded={openMenu === 'date'}
            >
              <CalendarDays className="h-5 w-5 shrink-0 text-[#D5A527]" />
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 dark:text-slate-100">
                {selectedDateLabel}
              </span>
              <ChevronDown className={clsx('h-4 w-4 shrink-0 text-gray-400 transition-transform', openMenu === 'date' && 'rotate-180')} />
            </button>
            <div className={menuClass(openMenu === 'date')} role="listbox">
              {dates.map((item) => (
                <button
                  key={item.date}
                  type="button"
                  role="option"
                  aria-selected={date === item.date}
                  onClick={() => {
                    setDate(item.date);
                    setOpenMenu(null);
                  }}
                  className={optionClass(date === item.date)}
                >
                  {item.label || formatDateLabel(item.date, language, dateLabels)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSearch}
            disabled={!canSearch}
            className="btn btn-accent w-full px-6 py-3 md:w-auto md:self-end disabled:opacity-50"
            aria-label={t('searchMovies')}
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
