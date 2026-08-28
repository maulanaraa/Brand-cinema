import { Link, useLocation } from 'react-router-dom';
import {
  CalendarDays,
  LogOut,
  Settings,
  Ticket,
  User,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderMenuDrawerProps {
  open: boolean;
  onClose: () => void;
  onSignOut: () => void;
  isAdmin?: boolean;
}

const mainLinks = [
  { href: '/', label: 'Home', exact: true },
  { href: '/movies', label: 'Movies', exact: false },
  { href: '/my-bookings', label: 'My Bookings', exact: false, auth: true },
  { href: '/profile', label: 'Profile', exact: true, auth: true },
];

const accountLinks = [
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/my-bookings', label: 'My Bookings', icon: Ticket },
  { href: '/my-bookings', label: 'My Tickets', icon: CalendarDays },
];

export default function HeaderMenuDrawer({
  open,
  onClose,
  onSignOut,
  isAdmin = false,
}: HeaderMenuDrawerProps) {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (href: string, exact: boolean) =>
    exact ? location.pathname === href : location.pathname.startsWith(href);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close menu"
      />

      <aside
        className="fixed right-4 top-20 z-[70] w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-dark-900/95 shadow-2xl shadow-black/40 backdrop-blur-xl"
        aria-label="Main menu"
      >
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">Menu</span>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-1">
            {mainLinks.map((item) => {
              if (item.auth && !user) return null;
              const active = isActive(item.href, item.exact);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className={clsx(
                    'block rounded-xl px-4 py-3 text-base font-semibold transition-colors',
                    active
                      ? 'bg-primary-950 text-white'
                      : 'text-slate-200 hover:bg-white/5 hover:text-white',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {user ? (
            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="space-y-1">
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    <Settings className="h-4 w-4 text-accent-400" />
                    Admin
                  </Link>
                )}
                {accountLinks.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={`${item.href}-${item.label}`}
                      to={item.href}
                      onClick={onClose}
                      className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <Icon className="h-4 w-4 text-accent-400" />
                      {item.label}
                    </Link>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSignOut();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-2 border-t border-white/10 pt-4">
              <Link to="/login" onClick={onClose} className="btn btn-secondary w-full">
                Sign In
              </Link>
              <Link to="/register" onClick={onClose} className="btn btn-primary w-full">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
