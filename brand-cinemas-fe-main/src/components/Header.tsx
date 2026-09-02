import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, Home, LogIn, LogOut, Menu, Settings, Ticket, User, UserPlus, X, CalendarDays } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import CitySwitcher from './CitySwitcher';

export default function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t('signedOut'));
      navigate('/');
    } catch {
      toast.error(t('signOutError'));
    }
  };

  const navItems: { href: string; label: string; icon: LucideIcon }[] = [
    { href: '/', label: t('home'), icon: Home },
    { href: '/movies', label: t('movies'), icon: Film },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border-soft)] bg-[var(--surface-page)]/90 backdrop-blur-xl dark:border-white/10 dark:bg-dark-950/85">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 relative">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="text-xl font-display font-bold text-gray-900 dark:text-white">
              Cinema<span className="text-gradient-gold">ID</span>
            </span>
          </Link>

          {/* Navigation - hidden, all links in hamburger menu */}
          <nav className="hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={clsx(
                  "relative text-sm text-gray-600 hover:text-gray-900 dark:text-slate-300 dark:hover:text-white transition-colors font-semibold py-2",
                  "after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 after:bg-accent-500 dark:after:bg-accent-400 after:transition-all after:duration-300",
                  location.pathname === item.href
                    ? 'text-gray-900 dark:text-white after:w-full'
                    : 'after:w-0'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <CitySwitcher compact />
            <LanguageSwitcher />
            <ThemeToggle />
            {user ? (
              <div className="hidden">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="btn btn-secondary flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>{t('admin')}</span>
                  </Link>
                )}
                <Link to="/my-bookings" className="hidden sm:inline-flex btn btn-accent">
                  <Ticket className="h-4 w-4" />
                  {t('myTickets')}
                </Link>
                <div className="hidden items-center space-x-2 text-gray-700 dark:text-slate-300 md:flex">
                  <User className="h-5 w-5 text-[#D5A527]" />
                  <span className="hidden sm:inline">
                    {user.fullName || user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('signOut')}</span>
                </button>
              </div>
            ) : (
              <div className="hidden">
                <Link to="/login" className="btn btn-secondary">
                  {t('signIn')}
                </Link>
                <Link to="/register" className="btn btn-primary">
                  {t('signUp')}
                </Link>
              </div>
            )}

            {/* Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-[var(--surface-muted)] dark:text-slate-300 dark:hover:bg-white/10"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop overlay for outside click */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Konsep 3: Minimalist Floating Glass Menu (Border-less) */}
      <div
        className={clsx(
          'absolute right-4 top-full z-[60] mt-2 w-64 overflow-hidden rounded-2xl bg-[var(--surface-card)]/95 p-2 shadow-2xl backdrop-blur-2xl transition-all duration-200 ease-out origin-top-right dark:bg-dark-900/95',
          isMobileMenuOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        )}
      >
        {/* Main Navigation */}
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={clsx(
                  'group flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-[#D5A527]/15 text-[#D5A527] font-semibold'
                    : 'text-gray-700 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5 font-medium'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={clsx('h-4 w-4', isActive ? 'text-[#D5A527]' : 'text-gray-400 dark:text-slate-400')} />
                  <span>{item.label}</span>
                </div>
                {isActive && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D5A527] shadow-sm shadow-[#D5A527]" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Account Links */}
        {user && (
          <div className="mt-1.5 pt-1.5 space-y-0.5">
            <Link
              to="/my-bookings"
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                'group flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors',
                location.pathname === '/my-bookings'
                  ? 'bg-[#D5A527]/15 text-[#D5A527] font-semibold'
                  : 'text-gray-700 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5 font-medium'
              )}
            >
              <div className="flex items-center gap-2.5">
                <CalendarDays className={clsx('h-4 w-4', location.pathname === '/my-bookings' ? 'text-[#D5A527]' : 'text-gray-400 dark:text-slate-400')} />
                <span>{t('myTickets')}</span>
              </div>
              {location.pathname === '/my-bookings' && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#D5A527] shadow-sm shadow-[#D5A527]" />
              )}
            </Link>

            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className={clsx(
                'group flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors',
                location.pathname === '/profile'
                  ? 'bg-[#D5A527]/15 text-[#D5A527] font-semibold'
                  : 'text-gray-700 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5 font-medium'
              )}
            >
              <div className="flex items-center gap-2.5">
                <User className={clsx('h-4 w-4', location.pathname === '/profile' ? 'text-[#D5A527]' : 'text-gray-400 dark:text-slate-400')} />
                <span>{t('profile')}</span>
              </div>
              {location.pathname === '/profile' && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#D5A527] shadow-sm shadow-[#D5A527]" />
              )}
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className={clsx(
                  'group flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors',
                  location.pathname.startsWith('/admin')
                    ? 'bg-[#D5A527]/15 text-[#D5A527] font-semibold'
                    : 'text-gray-700 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5 font-medium'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className={clsx('h-4 w-4', location.pathname.startsWith('/admin') ? 'text-[#D5A527]' : 'text-gray-400 dark:text-slate-400')} />
                  <span>{t('admin')}</span>
                </div>
                {location.pathname.startsWith('/admin') && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D5A527] shadow-sm shadow-[#D5A527]" />
                )}
              </Link>
            )}

            <button
              onClick={() => {
                handleSignOut();
                setIsMobileMenuOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10 dark:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              <span>{t('signOut')}</span>
            </button>
          </div>
        )}

        {!user && (
          <div className="mt-1.5 pt-1.5 space-y-0.5">
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors text-gray-700 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5 font-medium"
            >
              <div className="flex items-center gap-2.5">
                <LogIn className="h-4 w-4 text-gray-400 dark:text-slate-400" />
                <span>{t('signIn')}</span>
              </div>
            </Link>
            <Link
              to="/register"
              onClick={() => setIsMobileMenuOpen(false)}
              className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm transition-colors text-gray-700 hover:bg-black/5 dark:text-slate-300 dark:hover:bg-white/5 font-medium"
            >
              <div className="flex items-center gap-2.5">
                <UserPlus className="h-4 w-4 text-[#D5A527]" />
                <span>{t('signUp')}</span>
              </div>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
