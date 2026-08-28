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

      {/* Menu Dropdown */}
      <div className={`absolute right-4 top-full z-[60] mt-1 w-56 border border-[var(--border-soft)] bg-[var(--surface-card)] rounded-xl shadow-xl dark:border-white/10 dark:bg-dark-850 transition-all duration-200 ease-out origin-top-right ${isMobileMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                    isActive
                      ? 'bg-[#D5A527] text-dark-950 shadow-md shadow-[#D5A527]/20'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-white/5'
                  )}
                >
                  <Icon className={clsx('h-5 w-5', isActive ? 'text-dark-950' : 'text-[#D5A527]')} />
                  {item.label}
                </Link>
              );
            })}

            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  <User className="h-5 w-5 text-[#D5A527]" />
                  {t('profile')}
                </Link>
                <Link
                  to="/my-bookings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  <CalendarDays className="h-5 w-5 text-[#D5A527]" />
                  {t('myTickets')}
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-white/5"
                  >
                    <Settings className="h-5 w-5 text-[#D5A527]" />
                    {t('admin')}
                  </Link>
                )}
                <button
                  onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <LogOut className="h-5 w-5" />
                  {t('signOut')}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  <LogIn className="h-5 w-5 text-[#D5A527]" />
                  {t('signIn')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:text-slate-300 dark:hover:bg-white/5"
                >
                  <UserPlus className="h-5 w-5 text-[#D5A527]" />
                  {t('signUp')}
                </Link>
              </>
            )}
          </div>
        </div>
    </header>
  );
}
