import { useEffect, useState } from 'react';
import { Film, Building, TrendingUp, RefreshCcw } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { bookingService } from '@/services/bookingService';
import { adminService } from '@/services/adminService';
import { movieService } from '@/services/movieService';
import { hallService } from '@/services/hallService';
import { useTheme } from '@/contexts/ThemeContext';
import type { IBooking, IHall, IMovie } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminReportsPage() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [halls, setHalls] = useState<IHall[]>([]);
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState<{ date: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [stats, moviesResult, hallsData, bookingsData] = await Promise.all([
        adminService.getDashboardStats(),
        movieService.getMovies({ limit: 100 }),
        hallService.getHalls({ limit: 100 }).then((result) => result.items),
        bookingService.getAdminBookings({ limit: 100 }).then((result) => result.items),
      ]);
      setMovies(moviesResult.items);
      setHalls(hallsData);
      setBookings(bookingsData);
      setWeeklyRevenue(stats.weeklyRevenue);
    } catch (error) {
      console.error(error);
      toast.error('Error loading report data');
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const todayRevenue = bookings
    .filter(b => b.status === 'confirmed' && b.booking_date.startsWith(today))
    .reduce((sum, b) => sum + b.total_amount, 0);

  const currentMovies = movies.filter(m => m.is_now_showing);
  const activeHalls = halls.filter(h => h.is_active);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Today's Revenue",
      value: `IDR ${todayRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-primary-500 dark:text-primary-400',
      bgColor: 'bg-primary-500/20'
    },
    {
      title: 'Now Showing Movies',
      value: currentMovies.length,
      icon: Film,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20'
    },
    {
      title: 'Active Halls',
      value: activeHalls.length,
      icon: Building,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20'
    }
  ];

  const gridStroke = theme === 'dark' ? '#262626' : '#e5e7eb';
  const axisStroke = theme === 'dark' ? '#737373' : '#6b7280';
  const tooltipBg = theme === 'dark' ? '#181818' : '#ffffff';
  const tooltipBorder = theme === 'dark' ? '#262626' : '#e5e7eb';
  const tooltipText = theme === 'dark' ? '#f8fafc' : '#111827';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('adminNavReports')}</h1>
          <p className="text-gray-500 dark:text-neutral-400">Daily performance overview</p>
        </div>
        <button onClick={fetchReportData} className="btn btn-secondary flex items-center space-x-2">
          <RefreshCcw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-neutral-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-6 mt-6">
        <h2 className="text-xl font-bold mb-4">{t('weeklyRevenue')}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={weeklyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="date" stroke={axisStroke} />
            <YAxis stroke={axisStroke} />
            <Tooltip contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, color: tooltipText, borderRadius: '12px' }} />
            <Bar dataKey="revenue" fill="#C49622" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
