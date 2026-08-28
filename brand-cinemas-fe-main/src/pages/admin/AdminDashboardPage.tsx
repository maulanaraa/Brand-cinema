import { useEffect, useState } from 'react'
import {
  Film,
  Building,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  Ticket,
  Plus,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  ChevronRight,
  DollarSign,
  Activity,
  Layers,
  UtensilsCrossed,
  Image as ImageIcon,
} from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useNavigate } from 'react-router-dom'
import { adminService } from '@/services/adminService'
import { useLanguage } from '@/contexts/LanguageContext'

interface DashboardStats {
  totalMovies: number
  totalHalls: number
  totalShowtimes: number
  totalBookings: number
  totalUsers: number
  totalRevenue: number
  recentBookings: any[]
  popularMovies: { title: string; seats: number }[]
  weeklyRevenue: { date: string; revenue: number }[]
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const { t } = useLanguage()

  const [stats, setStats] = useState<DashboardStats>({
    totalMovies: 0,
    totalHalls: 0,
    totalShowtimes: 0,
    totalBookings: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentBookings: [],
    popularMovies: [],
    weeklyRevenue: [],
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboardStats = async () => {
    try {
      const data = await adminService.getDashboardStats()
      setStats(data)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDashboardStats()
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[450px]">
        <div className="text-center space-y-3">
          <LoadingSpinner size="lg" />
          <p className="text-xs text-gray-400 dark:text-neutral-400 font-medium animate-pulse">Loading Bento Grid Dashboard...</p>
        </div>
      </div>
    )
  }

  const totalWeeklyRevenue = stats.weeklyRevenue?.reduce((sum, d) => sum + d.revenue, 0) || 0
  const maxSeats = Math.max(...(stats.popularMovies?.map((m) => m.seats) || [1]), 1)

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white font-display">
            {t('adminNavDashboard')}
          </h1>
          <p className="text-xs text-gray-500 dark:text-neutral-400">
            {t('dashboardOverview')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-dark-900 hover:bg-gray-50 dark:hover:bg-dark-800 text-gray-700 dark:text-neutral-300 border border-gray-200 dark:border-white/[0.08] text-xs font-semibold transition-all shadow-sm active:scale-95"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary-500' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate('/admin/movies?openModal=true')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-black font-bold text-xs shadow-md shadow-primary-500/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>{t('addNewMovie')}</span>
          </button>
        </div>
      </div>

      {/* 🍱 BENTO GRID MAIN CONTAINER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* BENTO 1: Main Revenue Highlight (Hero Tile - 6 cols) */}
        <div className="md:col-span-6 rounded-2xl bg-white dark:bg-dark-900 border border-gray-200 dark:border-white/[0.08] p-5 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:border-gray-300 dark:hover:border-white/20 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-500/15 flex items-center justify-center text-primary-500">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                {t('revenue')} Total
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <TrendingUp className="w-3 h-3" />
              <span>Live Accumulation</span>
            </span>
          </div>

          <div className="my-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white font-display">
              {formatCurrency(stats.totalRevenue)}
            </h2>
            <p className="text-xs text-gray-400 dark:text-neutral-500 mt-1">
              Akumulasi dari seluruh transaksi pemesanan tiket yang terkonfirmasi.
            </p>
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-neutral-400">Total Minggu Ini</span>
            <span className="font-bold text-primary-500">{formatCurrency(totalWeeklyRevenue)}</span>
          </div>
        </div>

        {/* BENTO 2: Tickets Sold (3 cols) */}
        <div className="md:col-span-3 rounded-2xl bg-white dark:bg-dark-900 border border-gray-200 dark:border-white/[0.08] p-5 shadow-sm flex flex-col justify-between hover:border-gray-300 dark:hover:border-white/20 transition-all group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
              {t('adminNavBookings')}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
              <Ticket className="w-4 h-4" />
            </div>
          </div>

          <div className="my-3">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {stats.totalBookings.toLocaleString()}
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-neutral-400 mt-0.5">Tiket Dipesan</p>
          </div>

          <button
            onClick={() => navigate('/admin/bookings')}
            className="text-[11px] font-semibold text-primary-500 hover:text-primary-400 flex items-center gap-1 pt-2 border-t border-gray-100 dark:border-white/[0.06]"
          >
            <span>Kelola Transaksi</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* BENTO 3: Mini Catalog & Users Split Bento (3 cols) */}
        <div className="md:col-span-3 grid grid-rows-2 gap-4">
          {/* Sub-Bento: Movies */}
          <div className="rounded-2xl bg-white dark:bg-dark-900 border border-gray-200 dark:border-white/[0.08] p-4 shadow-sm flex items-center justify-between hover:border-gray-300 dark:hover:border-white/20 transition-all group">
            <div>
              <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
                {t('adminNavMovies')}
              </span>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                {stats.totalMovies} <span className="text-xs font-medium text-gray-400">Judul</span>
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
              <Film className="w-4 h-4" />
            </div>
          </div>

          {/* Sub-Bento: Users */}
          <div className="rounded-2xl bg-white dark:bg-dark-900 border border-gray-200 dark:border-white/[0.08] p-4 shadow-sm flex items-center justify-between hover:border-gray-300 dark:hover:border-white/20 transition-all group">
            <div>
              <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-500 uppercase tracking-wider">
                {t('adminNavUsers')}
              </span>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mt-0.5">
                {stats.totalUsers} <span className="text-xs font-medium text-gray-400">Pengguna</span>
              </h3>
            </div>
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* BENTO 4: Revenue Area Chart (Wide Tile - 8 cols) */}
        <div className="md:col-span-8 rounded-2xl bg-white dark:bg-dark-900 border border-gray-200 dark:border-white/[0.08] p-5 shadow-sm flex flex-col justify-between hover:border-gray-300 dark:hover:border-white/20 transition-all">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {t('revenueOverview')}
              </h2>
            </div>
            <span className="text-[10px] font-bold text-gray-400 dark:text-neutral-500">
              7 Hari Terakhir
            </span>
          </div>

          {stats.weeklyRevenue && stats.weeklyRevenue.length > 0 ? (
            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.weeklyRevenue} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bentoRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C49622" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#C49622" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.5} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(dateStr) => {
                      const d = new Date(dateStr)
                      return d.toLocaleDateString('id-ID', { weekday: 'short' })
                    }}
                    stroke="#737373"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#737373"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#181818',
                      borderColor: '#262626',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Revenue']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#C49622"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#bentoRevenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-400 dark:text-neutral-500 text-xs">
              {t('noRevenueData')}
            </div>
          )}
        </div>

        {/* BENTO 5: Popular Movies Ranking (Tall Tile - 4 cols) */}
        <div className="md:col-span-4 rounded-2xl bg-white dark:bg-dark-900 border border-gray-200 dark:border-white/[0.08] p-5 shadow-sm flex flex-col justify-between hover:border-gray-300 dark:hover:border-white/20 transition-all">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-primary-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {t('popularMovies')}
                </h2>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-500 border border-primary-500/20">
                Top Occupancy
              </span>
            </div>

            <div className="space-y-3">
              {stats.popularMovies && stats.popularMovies.length > 0 ? (
                stats.popularMovies.slice(0, 4).map((movie, i) => {
                  const percentage = Math.round((movie.seats / maxSeats) * 100)
                  return (
                    <div key={movie.title} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span
                            className={`w-4 h-4 rounded-md flex items-center justify-center font-bold text-[9px] ${
                              i === 0
                                ? 'bg-primary-500 text-black shadow-sm'
                                : i === 1
                                ? 'bg-gray-300 dark:bg-neutral-700 text-gray-800 dark:text-neutral-200'
                                : i === 2
                                ? 'bg-amber-800/60 text-amber-200'
                                : 'bg-gray-100 dark:bg-dark-800 text-gray-500'
                            }`}
                          >
                            {i + 1}
                          </span>
                          <span className="font-semibold text-gray-800 dark:text-neutral-200 truncate">{movie.title}</span>
                        </div>
                        <span className="font-bold text-primary-500 whitespace-nowrap text-[11px]">
                          {movie.seats} {t('seats')}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-gray-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-primary-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 10)}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-gray-400 dark:text-neutral-500 text-xs py-8 text-center">{t('noConfirmedBookings')}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/admin/movies')}
            className="w-full mt-3 py-1.5 px-3 rounded-xl bg-gray-50 dark:bg-dark-800 hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-700 dark:text-neutral-300 text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-gray-200/60 dark:border-white/[0.06]"
          >
            <span>Lihat Semua Film</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* BENTO 6: Recent Bookings Table (7 cols) */}
        <div className="md:col-span-7 rounded-2xl bg-white dark:bg-dark-900 border border-gray-200 dark:border-white/[0.08] p-5 shadow-sm hover:border-gray-300 dark:hover:border-white/20 transition-all">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-primary-500" />
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {t('recentBookings')}
              </h2>
            </div>
            <button
              onClick={() => navigate('/admin/bookings')}
              className="text-xs font-semibold text-primary-500 hover:text-primary-400 flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {stats.recentBookings && stats.recentBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/[0.08] text-gray-400 dark:text-neutral-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="pb-2">Booking ID</th>
                    <th className="pb-2">Film</th>
                    <th className="pb-2">Kursi</th>
                    <th className="pb-2">Total</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05] font-medium">
                  {stats.recentBookings.slice(0, 4).map((booking) => {
                    const isSuccess = booking.status === 'CONFIRMED' || booking.paymentStatus === 'PAID'
                    const isPending = booking.status === 'PENDING' || booking.paymentStatus === 'PENDING'
                    return (
                      <tr key={booking._id} className="hover:bg-gray-50 dark:hover:bg-dark-800/40 transition-colors">
                        <td className="py-2.5 font-mono font-bold text-primary-500 text-[11px]">
                          #{booking.bookingNumber || booking._id?.slice(-6)?.toUpperCase()}
                        </td>
                        <td className="py-2.5 font-semibold text-gray-800 dark:text-neutral-200 truncate max-w-[140px]">
                          {booking.showtime?.movie?.title || 'Film'}
                        </td>
                        <td className="py-2.5 text-gray-500 dark:text-neutral-400 text-[11px]">
                          {booking.seats?.join(', ') || '-'}
                        </td>
                        <td className="py-2.5 font-bold text-gray-900 dark:text-white text-[11px]">
                          {formatCurrency(booking.totalPrice || 0)}
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-extrabold ${
                              isSuccess
                                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                                : isPending
                                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                                : 'bg-rose-500/15 text-rose-500 border border-rose-500/20'
                            }`}
                          >
                            {booking.status || 'PAID'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-400 dark:text-neutral-500 text-xs">
              <Ticket className="w-6 h-6 mx-auto mb-1 opacity-40 text-gray-500" />
              <p>{t('noBookingsYet')}</p>
            </div>
          )}
        </div>

        {/* BENTO 7: Quick Operations Hub & System Badges (5 cols) */}
        <div className="md:col-span-5 rounded-2xl bg-white dark:bg-dark-900 border border-gray-200 dark:border-white/[0.08] p-5 shadow-sm flex flex-col justify-between hover:border-gray-300 dark:hover:border-white/20 transition-all">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Aksi Cepat Operasional
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => navigate('/admin/showtimes?openModal=true')}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-dark-800/80 hover:bg-gray-100 dark:hover:bg-dark-700 text-left border border-gray-200/80 dark:border-white/[0.06] transition-all group"
              >
                <Calendar className="w-4 h-4 text-purple-500 mb-1 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-gray-900 dark:text-white">Jadwal Baru</p>
                <p className="text-[10px] text-gray-500 dark:text-neutral-400">Atur studio</p>
              </button>

              <button
                onClick={() => navigate('/admin/carousel')}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-dark-800/80 hover:bg-gray-100 dark:hover:bg-dark-700 text-left border border-gray-200/80 dark:border-white/[0.06] transition-all group"
              >
                <ImageIcon className="w-4 h-4 text-blue-500 mb-1 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-gray-900 dark:text-white">Banner Promo</p>
                <p className="text-[10px] text-gray-500 dark:text-neutral-400">Banner web</p>
              </button>

              <button
                onClick={() => navigate('/admin/concessions')}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-dark-800/80 hover:bg-gray-100 dark:hover:bg-dark-700 text-left border border-gray-200/80 dark:border-white/[0.06] transition-all group"
              >
                <UtensilsCrossed className="w-4 h-4 text-amber-500 mb-1 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-gray-900 dark:text-white">Menu F&B</p>
                <p className="text-[10px] text-gray-500 dark:text-neutral-400">Popcorn & drink</p>
              </button>

              <button
                onClick={() => navigate('/admin/users')}
                className="p-2.5 rounded-xl bg-gray-50 dark:bg-dark-800/80 hover:bg-gray-100 dark:hover:bg-dark-700 text-left border border-gray-200/80 dark:border-white/[0.06] transition-all group"
              >
                <Users className="w-4 h-4 text-emerald-500 mb-1 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-gray-900 dark:text-white">Staf & User</p>
                <p className="text-[10px] text-gray-500 dark:text-neutral-400">Akses user</p>
              </button>
            </div>
          </div>

          {/* Minimal Services Status Pills */}
          <div className="pt-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-gray-500 dark:text-neutral-400">
            <span>Services Connected:</span>
            <div className="flex items-center gap-2 font-bold text-emerald-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                DB
              </span>
              <span>•</span>
              <span>Payment</span>
              <span>•</span>
              <span>AI</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
