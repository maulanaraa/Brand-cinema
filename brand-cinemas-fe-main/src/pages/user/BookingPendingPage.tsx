import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, RefreshCcw } from 'lucide-react';
import { IBooking } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import BookingProgress from '@/components/BookingProgress';
import { bookingService } from '@/services/bookingService';
import { syncPaymentAndGetRoute } from '@/utils/payment';
import toast from 'react-hot-toast';

const POLL_INTERVAL_MS = 5000;

export default function BookingPendingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<IBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const pollingRef = useRef(false);

  const loadBooking = async () => {
    if (!id) return;
    const data = await bookingService.getBookingById(id, user ?? undefined);
    setBooking(data);

    if (data.bookingStatus === 'CONFIRMED') {
      bookingService.setConfirmedBookingId(id);
      navigate(`/bookings/${id}/success`, { replace: true });
      return true;
    }

    if (data.bookingStatus === 'CANCELLED') {
      navigate(`/bookings/${id}/failed`, { replace: true });
      return true;
    }

    return false;
  };

  const checkStatus = async (manual = false) => {
    if (!id || pollingRef.current) return;
    pollingRef.current = true;
    if (manual) setChecking(true);

    try {
      const route = await syncPaymentAndGetRoute(id);
      const data = await bookingService.getBookingById(id, user ?? undefined);
      setBooking(data);

      if (route === 'success') {
        bookingService.setConfirmedBookingId(id);
        navigate(`/bookings/${id}/success`, { replace: true });
      } else if (route === 'failed') {
        navigate(`/bookings/${id}/failed`, { replace: true });
      }
    } catch {
      if (manual) toast.error('Failed to check payment status');
    } finally {
      pollingRef.current = false;
      if (manual) setChecking(false);
    }
  };

  useEffect(() => {
    if (!id) {
      navigate('/my-bookings', { replace: true });
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const start = async () => {
      try {
        const resolved = await loadBooking();
        if (cancelled || resolved) return;

        intervalId = setInterval(() => {
          if (!pollingRef.current) {
            checkStatus();
          }
        }, POLL_INTERVAL_MS);
      } catch {
        if (!cancelled) navigate('/my-bookings', { replace: true });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    start();

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
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
        <Clock className="h-16 w-16 text-[#D5A527] mx-auto mb-6 animate-pulse" />
        <p className="section-eyebrow mb-3">Payment pending</p>
        <h1 className="text-3xl font-display font-bold mb-3">Waiting for Payment</h1>
        <p className="text-gray-500 dark:text-slate-400 mb-4">
          Complete your payment via the selected method. For virtual account or e-wallet, confirmation may take a few minutes.
        </p>
        <p className="text-sm text-gray-400 dark:text-slate-500 mb-8">
          Status is checked automatically every {POLL_INTERVAL_MS / 1000} seconds.
        </p>

        {booking && (
          <div className="cinema-panel p-6 text-left mb-8">
            <p className="text-sm text-gray-500 dark:text-slate-400">Booking</p>
            <p className="font-semibold text-lg">{booking.showtime.movie.title}</p>
            <p className="mt-2 text-sm">
              Order: <span className="font-mono">{booking.bookingNumber}</span>
            </p>
            <p className="mt-1 text-sm">
              Total: <span className="font-semibold">IDR {booking.total_amount.toLocaleString('id-ID')}</span>
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => checkStatus(true)}
            disabled={checking}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            {checking ? <LoadingSpinner size="sm" /> : <RefreshCcw className="h-4 w-4" />}
            Check Payment Status
          </button>
          {id && (
            <Link to={`/bookings/${id}/pay`} className="btn btn-secondary w-full">
              Back to Payment
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
