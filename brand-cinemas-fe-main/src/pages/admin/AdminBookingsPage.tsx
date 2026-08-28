import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, CheckCircle, XCircle, Download } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';
import { ApiError, bookingService } from '@/services/bookingService';
import { movieService } from '@/services/movieService';
import type { BookingStatus } from '@/types/booking';
import type { IBooking, IMovie } from '@/types';
import { EMPTY_PAGINATION, DEFAULT_PAGE_SIZE } from '@/types/pagination';
import type { PaginationMeta } from '@/types/pagination';
import { useLanguage } from '@/contexts/LanguageContext';

function toApiBookingStatus(status: string): BookingStatus | 'all' {
  if (status === 'confirmed') return 'CONFIRMED';
  if (status === 'cancelled') return 'CANCELLED';
  if (status === 'pending') return 'PENDING';
  return 'all';
}

export default function AdminBookingsPage() {
  const { t } = useLanguage();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [movieFilter, setMovieFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);
  const [bookingStats, setBookingStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    revenue: 0,
  });

  useEffect(() => {
    movieService.getMovies({ limit: 100 }).then((result) => setMovies(result.items));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchTerm, movieFilter, dateFilter]);

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter, searchTerm, movieFilter, dateFilter]);

  useEffect(() => {
    fetchBookingStats();
  }, []);

  const fetchBookingStats = async () => {
    try {
      const [all, confirmed, pending, confirmedList] = await Promise.all([
        bookingService.getAdminBookings({ limit: 1, page: 1 }),
        bookingService.getAdminBookings({ limit: 1, page: 1, bookingStatus: 'CONFIRMED' }),
        bookingService.getAdminBookings({ limit: 1, page: 1, bookingStatus: 'PENDING' }),
        bookingService.getAdminBookings({ limit: 100, page: 1, bookingStatus: 'CONFIRMED' }),
      ]);
      setBookingStats({
        total: all.pagination.total,
        confirmed: confirmed.pagination.total,
        pending: pending.pagination.total,
        revenue: confirmedList.items.reduce((sum, booking) => sum + booking.total_amount, 0),
      });
    } catch {
      // Stats are optional; list view still works
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const result = await bookingService.getAdminBookings({
        page,
        limit: DEFAULT_PAGE_SIZE,
        bookingStatus: toApiBookingStatus(statusFilter),
        search: searchTerm || undefined,
        movieId: movieFilter || undefined,
        date: dateFilter || undefined,
        sort: 'createdAt',
        order: 'desc',
      });
      setBookings(result.items);
      setPagination(result.pagination);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to load bookings');
      } else {
        toast.error('Failed to load bookings');
      }
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: 'confirmed' | 'cancelled') => {
    try {
      await bookingService.updateAdminBookingStatus(bookingId, status);
      toast.success(`Booking ${status} successfully`);
      fetchBookings();
      fetchBookingStats();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.errors.join(', ') || error.message || 'Failed to update booking status');
      } else {
        toast.error('Failed to update booking status');
      }
      console.error('Error updating booking status:', error);
    }
  };

  const handleExport = () => {
    const csvRows = [
      ['Booking ID', 'Customer', 'Movie', 'Show Date', 'Start Time', 'Seats', 'Amount', 'Status'],
      ...bookings.map((b) => [
        b._id,
        b.user.fullName,
        b.showtime.movie.title,
        b.showtime.show_date,
        b.showtime.start_time,
        b.selected_seats.join(', '),
        b.total_amount,
        b.status,
      ]),
    ];

    const csvContent = csvRows.map((row) => row.map(String).map((val) => `"${val}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookings_export.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'status-badge';
    switch (status) {
      case 'confirmed':
        return `${baseClasses} status-confirmed`;
      case 'cancelled':
        return `${baseClasses} status-cancelled`;
      default:
        return `${baseClasses} status-pending`;
    }
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('adminNavBookings')}</h1>
          <p className="text-gray-500 dark:text-slate-400">Manage customer bookings</p>
        </div>
        <button type="button" onClick={handleExport} className="btn btn-secondary flex items-center space-x-2">
          <Download className="h-4 w-4" />
          <span>Export</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="input"
          placeholder="Search bookings..."
        />
        <select value={movieFilter} onChange={(event) => setMovieFilter(event.target.value)} className="input">
          <option value="">All Movies</option>
          {movies.map((movie) => (
            <option key={movie._id} value={movie._id}>
              {movie.title}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="input" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <p className="text-sm text-gray-500 dark:text-slate-400">Total Bookings</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{bookingStats.total}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 dark:text-slate-400">Confirmed</p>
          <p className="text-2xl font-bold text-green-400">{bookingStats.confirmed}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 dark:text-slate-400">Pending</p>
          <p className="text-2xl font-bold text-[#D5A527]">{bookingStats.pending}</p>
        </div>
        <div className="card p-6">
          <p className="text-sm text-gray-500 dark:text-slate-400">Total Revenue</p>
          <p className="text-2xl font-bold text-primary-500 dark:text-primary-400">IDR {bookingStats.revenue.toLocaleString()}</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-500 dark:text-slate-400 text-lg">No bookings found for the selected filters.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-dark-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Booking ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Movie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Seats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      #{booking.bookingNumber?.slice(-8) || booking._id.slice(-6)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                      <div>{booking.user.fullName}</div>
                      <div className="text-gray-500 dark:text-slate-400">{booking.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={booking.showtime?.movie?.poster_url || 'https://placehold.co/60x90/0f172a/94a3b8?text=N/A'}
                          alt={booking.showtime?.movie?.title}
                          className="w-10 h-15 object-cover rounded"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{booking.showtime?.movie?.title}</div>
                          <div className="text-sm text-gray-500 dark:text-slate-400">{booking.showtime?.hall?.hall_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                      <div>{new Date(booking.showtime?.show_date || '').toLocaleDateString()}</div>
                      <div className="text-gray-500 dark:text-slate-400">{booking.showtime?.start_time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">{booking.selected_seats?.join(', ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-500 dark:text-primary-400">IDR {booking.total_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(booking.status)}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link to={`/admin/bookings/${booking._id}`} className="text-blue-400 hover:text-blue-300">
                          <Eye className="h-4 w-4" />
                        </Link>
                        {booking.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(booking._id, 'confirmed')}
                              className="text-green-400 hover:text-green-300"
                              title="Confirm booking"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateBookingStatus(booking._id, 'cancelled')}
                              className="text-red-400 hover:text-red-300"
                              title="Cancel booking"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
