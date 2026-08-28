import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, CheckCircle, ExternalLink, MapPin, Ticket } from 'lucide-react';
import { IBooking } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import BookingProgress from '@/components/BookingProgress';
import TicketQrCode from '@/components/TicketQrCode';
import { bookingService } from '@/services/bookingService';
import { ApiError } from '@/services/apiClient';
import { buildTicketSuccessPath, buildTicketUrl } from '@/utils/ticketQr';

export default function BookingConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<IBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const queryBookingNumber = searchParams.get('bookingNumber');

  useEffect(() => {
    const bookingId = id || bookingService.getConfirmedBookingId();
    if (!bookingId) {
      navigate('/my-bookings', { replace: true });
      return;
    }

    bookingService
      .getBookingById(bookingId, user ?? undefined)
      .then((data) => {
        if (data.bookingStatus !== 'CONFIRMED' && data.status !== 'confirmed') {
          setError('This ticket is not confirmed yet.');
          return;
        }

        if (
          queryBookingNumber &&
          data.bookingNumber &&
          queryBookingNumber !== data.bookingNumber
        ) {
          setError('Booking number does not match this ticket.');
          return;
        }

        setBooking(data);
        bookingService.clearConfirmedBookingId();
        bookingService.clearPendingBookingId();
        sessionStorage.removeItem('seatSelection');

        if (!queryBookingNumber && data.bookingNumber) {
          navigate(buildTicketSuccessPath(data._id, data.bookingNumber), { replace: true });
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          setError('Sign in to view full ticket details, or verify the scanned QR code at the entrance.');
          return;
        }
        navigate('/my-bookings', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id, navigate, queryBookingNumber, user]);

  const displayBookingNumber = booking?.bookingNumber || queryBookingNumber || '';

  const ticketUrl = useMemo(() => {
    if (!booking) return '';
    return buildTicketUrl(booking._id, booking.bookingNumber || booking._id);
  }, [booking]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 dark:bg-dark-900">
        <div className="cinema-panel max-w-md p-8 text-center">
          <h1 className="text-xl font-bold mb-3">Unable to load ticket</h1>
          <p className="text-gray-500 dark:text-slate-400 mb-6">{error}</p>
          {queryBookingNumber && (
            <p className="mb-6 font-mono text-sm text-gray-700 dark:text-slate-300">
              Ref: {queryBookingNumber}
            </p>
          )}
          <div className="flex flex-col gap-3">
            {!user && (
              <Link to="/login" className="btn btn-primary w-full">
                Sign In
              </Link>
            )}
            <Link to="/my-bookings" className="btn btn-secondary w-full">
              My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-white pb-6 text-gray-900 dark:bg-dark-950 dark:text-white sm:pb-8">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-dark-950/95">
        <div className="relative mx-auto flex max-w-7xl items-center px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="btn btn-secondary relative z-10 flex shrink-0 items-center gap-2 px-3 py-2 text-sm sm:px-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <div className="pointer-events-none absolute inset-x-4 flex justify-center sm:inset-x-6 lg:inset-x-8">
            <BookingProgress currentStep="finish" />
          </div>
          <div className="ml-auto w-[4.75rem] shrink-0 sm:w-16" aria-hidden />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="mx-auto w-full max-w-md sm:max-w-2xl">
          <div className="text-center">
            <CheckCircle className="mx-auto mb-4 h-14 w-14 text-green-500 sm:mb-6 sm:h-20 sm:w-20" />
            <p className="section-eyebrow mb-2 sm:mb-3">Payment successful</p>
            <h1 className="mb-2 font-display text-2xl font-bold sm:text-3xl lg:text-4xl">
              Your Ticket Is Ready
            </h1>
            <p className="mx-auto mb-6 max-w-md text-sm text-gray-500 dark:text-slate-400 sm:mb-8 sm:text-base">
              Show this e-ticket at the cinema entrance before entering the studio.
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-center text-sm text-amber-700 dark:text-amber-200">
              {error}
            </div>
          )}

          {booking && (
            <div className="mx-auto w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 text-left shadow-2xl shadow-black/30 dark:border-white/10 dark:bg-dark-900">
            <div className="flex flex-col md:grid md:grid-cols-[minmax(0,180px)_1fr]">
              <img
                src={booking.showtime.movie.poster_url}
                alt={booking.showtime.movie.title}
                className="h-44 w-full object-cover sm:h-52 md:h-full md:min-h-64"
              />
              <div className="p-4 sm:p-6">
                <div className="mb-5 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 text-center sm:text-left">
                    <span className="cinema-badge mb-3 inline-flex bg-primary-600/90">
                      <Ticket className="mr-1 h-3 w-3" />
                      E-ticket
                    </span>
                    <h2 className="text-xl font-bold leading-tight sm:text-2xl">
                      {booking.showtime.movie.title}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                      {booking.showtime.movie.genre} • {booking.showtime.movie.duration} mins
                    </p>
                  </div>
                  <TicketQrCode
                    booking={booking}
                    size={112}
                    className="mx-auto shrink-0 sm:mx-0"
                  />
                </div>

                <div className="my-5 border-t border-dashed border-gray-300 dark:border-white/20" />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Cinema
                    </p>
                    <p className="mt-1 flex items-center gap-1 font-semibold">
                      <MapPin className="h-4 w-4 shrink-0 text-[#D5A527]" />
                      <span>Grand Indonesia</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Hall
                    </p>
                    <p className="mt-1 font-semibold">{booking.showtime.hall.hall_name}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Date
                    </p>
                    <p className="mt-1 flex items-center gap-1 font-semibold">
                      <CalendarDays className="h-4 w-4 shrink-0 text-[#D5A527]" />
                      <span>{new Date(booking.showtime.show_date).toLocaleDateString()}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Time
                    </p>
                    <p className="mt-1 font-semibold">{booking.showtime.start_time}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Seats
                    </p>
                    <p className="mt-1 break-words font-semibold">
                      {booking.selected_seats.join(', ')}
                    </p>
                  </div>
                  <div className="sm:col-span-2 md:col-span-1">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Booking ID
                    </p>
                    <p className="mt-1 break-all font-mono text-sm font-semibold">
                      {displayBookingNumber || `#${booking._id.slice(-6).toUpperCase()}`}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-1 rounded-lg bg-white p-4 dark:bg-dark-950 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-gray-500 dark:text-slate-400">Total Paid</span>
                  <span className="text-lg font-black text-accent-500 dark:text-accent-300 sm:text-xl">
                    IDR {booking.total_amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
            </div>
          )}

          <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:flex-row sm:items-stretch sm:justify-center">
            {ticketUrl && (
              <a
                href={ticketUrl}
                className="btn btn-primary w-full text-base sm:max-w-xs sm:text-lg"
              >
                <ExternalLink className="h-5 w-5" />
                View My Ticket
              </a>
            )}
            <Link
              to="/my-bookings"
              className="btn btn-secondary w-full text-base sm:max-w-xs sm:text-lg"
            >
              My Bookings
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
