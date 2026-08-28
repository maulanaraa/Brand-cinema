import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';
import { bookingService } from '@/services/bookingService';
import { syncPaymentAndGetRoute } from '@/utils/payment';

export default function BookingPaymentFinishPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    if (!id) {
      navigate('/my-bookings', { replace: true });
      return;
    }

    const verify = async () => {
      try {
        const route = await syncPaymentAndGetRoute(id);
        sessionStorage.removeItem('seatSelection');
        bookingService.clearPendingBookingId();

        if (route === 'success') {
          bookingService.setConfirmedBookingId(id);
          navigate(`/bookings/${id}/success`, { replace: true });
          return;
        }

        if (route === 'failed') {
          navigate(`/bookings/${id}/failed`, { replace: true });
          return;
        }

        navigate(`/bookings/${id}/pending`, { replace: true });
      } catch {
        setMessage('Could not verify payment. Redirecting...');
        setTimeout(() => navigate(`/bookings/${id}/pending`, { replace: true }), 1500);
      }
    };

    verify();
  }, [id, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-dark-900 gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-gray-500 dark:text-slate-400">{message}</p>
    </div>
  );
}
