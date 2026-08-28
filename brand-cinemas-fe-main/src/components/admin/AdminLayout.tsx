import { Outlet, Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Film,
  Building,
  Calendar,
  UserRound,
  LogOut,
  Menu,
  X,
  BarChart3,
  Image,
  UtensilsCrossed,
  MapPin,
  Ticket,
  ClipboardList,
  PanelLeftClose,
  PanelLeftOpen,
  ExternalLink,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import type { TranslationKey } from '@/i18n/translations'
import toast from 'react-hot-toast'

const SIDEBAR_COLLAPSED_KEY = 'admin-sidebar-collapsed'

interface NavItem {
  labelKey: TranslationKey
  href: string
  icon: typeof LayoutDashboard
  badge?: string
}

interface NavGroup {
  groupTitle: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    groupTitle: 'Overview',
    items: [
      { labelKey: 'adminNavDashboard', href: '/admin', icon: LayoutDashboard },
      { labelKey: 'adminNavReports', href: '/admin/reports', icon: BarChart3 },
    ],
  },
  {
    groupTitle: 'Operations & Ticketing',
    items: [
      { labelKey: 'adminNavShowtimes', href: '/admin/showtimes', icon: Calendar },
      { labelKey: 'adminNavBookings', href: '/admin/bookings', icon: ClipboardList, badge: 'Live' },
      { labelKey: 'adminNavHalls', href: '/admin/halls', icon: Building },
    ],
  },
  {
    groupTitle: 'Catalog & Content',
    items: [
      { labelKey: 'adminNavMovies', href: '/admin/movies', icon: Film },
      { labelKey: 'adminNavCarousel', href: '/admin/carousel', icon: Image },
      { labelKey: 'adminNavFnB', href: '/admin/concessions', icon: UtensilsCrossed },
    ],
  },
  {
    groupTitle: 'Master Data & Users',
    items: [
      { labelKey: 'adminNavCities', href: '/admin/cities', icon: MapPin },
      { labelKey: 'adminNavCinemas', href: '/admin/cinemas', icon: Ticket },
      { labelKey: 'adminNavUsers', href: '/admin/users', icon: UserRound },
    ],
  },
]

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
    } catch {
      return false
    }
  })
  const { signOut, user } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
    } catch {
      // ignore storage errors
    }
  }, [collapsed])

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success(t('signedOut'))
    } catch {
      toast.error(t('signOutError'))
    }
  }

  const toggleCollapsed = () => setCollapsed((prev) => !prev)

  return (
    <div className="min-h-screen bg-[var(--surface-page)] dark:bg-dark-950 text-gray-900 dark:text-slate-100 flex flex-col antialiased">
      {/* Mobile Drawer Backdrop */}
      <div className={`fixed inset-0 z-50 lg:hidden ${mobileOpen ? 'block' : 'hidden'}`}>
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white dark:bg-dark-900 border-r border-gray-200 dark:border-white/[0.08] shadow-2xl z-50">
          {/* Mobile Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-white/[0.08]">
            <Link to="/admin" className="flex items-center gap-2">
              <span className="text-xl font-display font-bold text-gray-900 dark:text-white">
                Cinema<span className="text-gradient-gold">ID</span>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
              aria-label={t('closeMenu')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Navigation List */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
            {navGroups.map((group) => (
              <div key={group.groupTitle} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                  {group.groupTitle}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon
                  const active = isNavActive(location.pathname, item.href)
                  const label = t(item.labelKey)
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                        active
                          ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30 shadow-sm'
                          : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 ${active ? 'text-primary-500' : 'text-gray-400 dark:text-neutral-500'}`} />
                        <span>{label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-primary-500/20 text-primary-500 border border-primary-500/30">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            ))}

            <div className="pt-2 border-t border-gray-200 dark:border-white/[0.08] space-y-1">
              <Link
                to="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-gray-400 dark:text-neutral-500" />
                <span>{t('backToCinema')}</span>
              </Link>
            </div>
          </nav>

          {/* Mobile User Bottom Card */}
          <div className="p-3 border-t border-gray-200 dark:border-white/[0.08] bg-gray-50/50 dark:bg-dark-950">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-primary-500 text-black font-bold flex items-center justify-center text-xs shadow">
                  {user?.fullName?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold truncate text-gray-900 dark:text-white">{user?.fullName || 'Administrator'}</p>
                  <p className="text-[10px] text-gray-400 dark:text-neutral-400 truncate">{user?.email || 'admin@cinema.com'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                title={t('signOut')}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex lg:flex-col border-r border-gray-200 dark:border-white/[0.08] bg-white dark:bg-dark-900 transition-all duration-300 ease-in-out shadow-sm ${
          collapsed ? 'lg:w-[76px]' : 'lg:w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-gray-200 dark:border-white/[0.08]">
          {!collapsed ? (
            <Link to="/admin" className="flex items-center gap-2">
              <span className="text-xl font-display font-bold text-gray-900 dark:text-white tracking-tight">
                Cinema<span className="text-gradient-gold">ID</span>
              </span>
            </Link>
          ) : (
            <Link to="/admin" className="mx-auto" title="CinemaID">
              <span className="text-lg font-display font-extrabold text-gradient-gold">ID</span>
            </Link>
          )}

          <button
            type="button"
            onClick={toggleCollapsed}
            className={`p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors ${
              collapsed ? 'hidden' : ''
            }`}
            aria-label={collapsed ? t('expandSidebar') : t('collapseSidebar')}
            title={collapsed ? t('expandSidebar') : t('collapseSidebar')}
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="mt-4 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4 space-y-5 scrollbar-thin">
          {navGroups.map((group) => (
            <div key={group.groupTitle} className="space-y-1">
              {!collapsed && (
                <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-neutral-500">
                  {group.groupTitle}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon
                const active = isNavActive(location.pathname, item.href)
                const label = t(item.labelKey)
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    title={collapsed ? label : undefined}
                    className={`group relative flex items-center rounded-xl py-2 text-xs font-semibold transition-all duration-200 ${
                      collapsed ? 'justify-center px-2' : 'justify-between px-3'
                    } ${
                      active
                        ? 'bg-primary-500/20 text-primary-400 font-bold border border-primary-500/30 shadow-sm'
                        : 'text-gray-600 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                          active ? 'text-primary-500' : 'text-gray-400 dark:text-neutral-500 group-hover:text-gray-900 dark:group-hover:text-white'
                        }`}
                      />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </div>

                    {!collapsed && item.badge && (
                      <span className="px-1.5 py-0.5 text-[9px] font-extrabold rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}

                    {/* Active side indicator glow */}
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary-500 shadow-lg shadow-primary-500/50" />
                    )}
                  </Link>
                )
              })}
            </div>
          ))}

          {/* Quick Client Web Link */}
          <div className="pt-2 border-t border-gray-200 dark:border-white/[0.08]">
            <Link
              to="/"
              title={collapsed ? t('backToCinema') : undefined}
              className={`flex items-center rounded-xl py-2 text-xs font-semibold text-gray-500 dark:text-neutral-400 hover:bg-gray-100 dark:hover:bg-dark-800 hover:text-gray-900 dark:hover:text-white transition-colors ${
                collapsed ? 'justify-center px-2' : 'gap-3 px-3'
              }`}
            >
              <ExternalLink className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{t('backToCinema')}</span>}
            </Link>
          </div>
        </nav>

        {/* Collapsed Toggle Button when sidebar is small */}
        {collapsed && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={toggleCollapsed}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-800 transition-colors"
              title={t('expandSidebar')}
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Admin Profile Footer */}
        <div className="shrink-0 border-t border-gray-200 dark:border-white/[0.08] p-3 bg-gray-50/60 dark:bg-dark-950/60">
          {!collapsed ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-black font-extrabold text-xs shadow-md">
                    {user?.fullName?.[0]?.toUpperCase() || 'A'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-dark-900" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-gray-900 dark:text-white">
                    {user?.fullName || 'Administrator'}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-neutral-400 truncate">
                    {user?.email || 'admin@cinema.com'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="p-1.5 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                title={t('signOut')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-primary-500 text-black font-bold text-xs"
                title={user?.fullName || 'Administrator'}
              >
                {user?.fullName?.[0]?.toUpperCase() || 'A'}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border border-white dark:border-dark-900" />
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-dark-800 rounded-lg transition-colors"
                title={t('signOut')}
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-[padding] duration-300 ease-in-out ${
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'
        }`}
      >
        {/* Top Floating App Bar */}
        <header className="sticky top-0 z-20 h-16 border-b border-gray-200 dark:border-white/[0.08] bg-white/95 dark:bg-dark-900/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:text-gray-900 lg:hidden dark:text-neutral-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-dark-800"
              aria-label={t('openMenu')}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
