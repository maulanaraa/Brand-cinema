import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, XCircle } from 'lucide-react';
import { IBooking } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import BookingProgress from '@/components/BookingProgress';
import { bookingService } from '@/services/bookingService';

export default function BookingFailedPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<IBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      navigate('/my-bookings', { replace: true });
      return;
    }

    bookingService
      .getBookingById(id, user ?? undefined)
      .then(setBooking)
      .catch(() => navigate('/my-bookings', { replace: true }))
      .finally(() => setLoading(false));
  }, [id, navigate, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-dark-950 dark:text-white">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-dark-950/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/my-bookings" className="btn btn-secondary flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>My Bookings</span>
          </Link>
          <BookingProgress currentStep="payment" />
          <div />
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-6" />
        <p className="section-eyebrow mb-3">Payment failed</p>
        <h1 className="text-3xl font-display font-bold mb-3">Payment Unsuccessful</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-8">
          Your payment was not completed or was cancelled. The booking has been cancelled and seats have been released.
        </p>

        {booking && (
          <div className="cinema-panel p-6 text-left mb-8">
            <p className="text-sm text-gray-500 dark:text-slate-400">Booking</p>
            <p className="font-semibold text-lg">{booking.showtime.movie.title}</p>
            <p className="mt-2 text-sm">
              Order: <span className="font-mono">{booking.bookingNumber}</span>
            </p>
            <p className="mt-1 text-sm">
              Seats: {booking.selected_seats.join(', ')}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <Link to="/movies" className="btn btn-primary w-full">
            Browse Movies
          </Link>
          {booking?.showtime._id && (
            <Link to={`/booking/${booking.showtime._id}`} className="btn btn-secondary w-full">
              Try Again
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
