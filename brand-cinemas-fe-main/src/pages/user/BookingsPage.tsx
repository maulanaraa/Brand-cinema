import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, CreditCard, MapPin, Eye, X } from 'lucide-react';
import { IBooking } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import CancelBookingModal from '@/components/CancelBookingModal';
import toast from 'react-hot-toast';
import { bookingService } from '@/services/bookingService';

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    if (!user) return;
    try {
      const data = await bookingService.getMyBookings();
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
  };

  const confirmCancelBooking = async () => {
    if (!cancellingId) return;
    try {
      await bookingService.cancelBooking(cancellingId);
      toast.success('Booking cancelled successfully');
      setCancellingId(null);
      fetchBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel booking');
    }
  };

  const getStatusBadge = (booking: IBooking) => {
    const baseClasses = 'status-badge';
    const status = booking.bookingStatus || booking.status.toUpperCase();

    if (status === 'CONFIRMED' || booking.status === 'confirmed') {
      return `${baseClasses} status-confirmed`;
    }
    if (status === 'CANCELLED' || status === 'EXPIRED' || booking.status === 'cancelled') {
      return `${baseClasses} status-cancelled`;
    }
    return `${baseClasses} status-pending`;
  };

  const getStatusLabel = (booking: IBooking) => {
    const status = booking.bookingStatus || booking.status.toUpperCase();
    if (status === 'CONFIRMED') return 'Confirmed';
    if (status === 'CANCELLED') return 'Cancelled';
    if (status === 'EXPIRED') return 'Expired';
    return 'Pending';
  };

  const isPending = (booking: IBooking) =>
    (booking.bookingStatus || booking.status.toUpperCase()) === 'PENDING';

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-5 sm:mb-8">
          <p className="section-eyebrow mb-1">Your tickets</p>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">My Bookings</h1>
        </div>

        {bookings.length === 0 ? (
          <div className="py-10 text-center sm:py-12">
            <p className="mb-6 text-base text-gray-500 dark:text-slate-400 sm:text-lg">
              You don&apos;t have any bookings yet.
            </p>
            <Link to="/movies" className="btn btn-primary w-full max-w-xs sm:w-auto">
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {bookings.map((booking) => (
              <article key={booking._id} className="card overflow-hidden p-4 sm:p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex gap-3 sm:gap-4">
                    <img
                      src={
                        booking.showtime?.movie?.poster_url ||
                        'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=100&h=150&fit=crop'
                      }
                      alt={booking.showtime?.movie?.title}
                      className="h-28 w-20 shrink-0 rounded-lg object-cover sm:h-32 sm:w-24"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-2 line-clamp-2 text-lg font-semibold leading-tight sm:text-xl">
                        {booking.showtime?.movie?.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <span className={getStatusBadge(booking)}>{getStatusLabel(booking)}</span>
                        <span className="text-base font-semibold text-primary-600 dark:text-primary-400 sm:text-lg">
                          IDR {booking.total_amount.toLocaleString('id-ID')}
                        </span>
                      </div>
                      {booking.bookingNumber && (
                        <p className="mt-2 break-all font-mono text-xs text-gray-500 dark:text-slate-400">
                          {booking.bookingNumber}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600 dark:bg-dark-900/50 dark:text-slate-300 sm:grid-cols-2 sm:gap-3 sm:p-4 lg:grid-cols-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-[#D5A527]" />
                      <span className="truncate">{booking.showtime?.hall?.hall_name}</span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0 text-[#D5A527]" />
                      <span>
                        {new Date(booking.showtime?.show_date || '').toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex min-w-0 items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-[#D5A527]" />
                      <span>{booking.showtime?.start_time}</span>
                    </div>
                    <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                      <span className="break-words">
                        Seats: {booking.selected_seats?.join(', ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <Link
                      to={`/bookings/${booking._id}`}
                      className="btn btn-secondary w-full justify-center sm:w-auto"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </Link>
                    {isPending(booking) && (
                      <>
                        <Link
                          to={`/bookings/${booking._id}/summary`}
                          className="btn btn-primary w-full justify-center sm:w-auto"
                        >
                          <CreditCard className="h-4 w-4" />
                          <span>Pay Now</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(booking._id)}
                          className="btn btn-danger w-full justify-center sm:w-auto"
                        >
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <CancelBookingModal
        isOpen={cancellingId !== null}
        onClose={() => setCancellingId(null)}
        onConfirm={confirmCancelBooking}
      />
    </div>
  );
}
