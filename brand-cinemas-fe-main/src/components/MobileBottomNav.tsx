import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Ticket, User } from 'lucide-react';
import { clsx } from 'clsx';
import { useLanguage } from '@/contexts/LanguageContext';
import type { TranslationKey } from '@/i18n/translations';

const navItems: {
  href: string;
  labelKey: TranslationKey;
  icon: typeof Home;
  match: (path: string) => boolean;
}[] = [
  {
    href: '/',
    labelKey: 'home',
    icon: Home,
    match: (path: string) => path === '/',
  },
  {
    href: '/movies',
    labelKey: 'search',
    icon: Search,
    match: (path: string) => path.startsWith('/movies'),
  },
  {
    href: '/my-bookings',
    labelKey: 'tickets',
    icon: Ticket,
    match: (path: string) =>
      path.startsWith('/my-bookings') ||
      path.startsWith('/bookings') ||
      path.startsWith('/tickets'),
  },
  {
    href: '/profile',
    labelKey: 'account',
    icon: User,
    match: (path: string) => path === '/profile',
  },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden border-t border-[var(--border-soft)] bg-[var(--surface-page)]/95 backdrop-blur-xl dark:border-white/10 dark:bg-dark-950/95"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const isActive = item.match(location.pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={clsx(
                'relative flex flex-col items-center justify-center gap-1 transition-colors',
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-slate-200',
              )}
            >
              <Icon
                className={clsx('h-5 w-5', isActive && 'stroke-[2.5]')}
                aria-hidden
              />
              <span className={clsx('text-[11px] font-semibold', isActive && 'text-primary-700 dark:text-primary-300')}>
                {t(item.labelKey)}
              </span>
              {isActive && (
                <span className="absolute bottom-1 h-0.5 w-8 rounded-full bg-primary-500 dark:bg-primary-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
