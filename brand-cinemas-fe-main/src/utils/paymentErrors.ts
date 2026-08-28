import type { NavigateFunction } from 'react-router-dom';
import { ApiError } from '@/services/apiClient';

export function formatApiErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (!(err instanceof ApiError)) return fallback;
  if (err.errors.length > 0) {
    return `${err.message}: ${err.errors.join(' ')}`;
  }
  return err.message;
}

export function handlePaymentApiError(
  err: unknown,
  bookingId: string,
  navigate: NavigateFunction,
  setError: (message: string) => void,
): boolean {
  if (!(err instanceof ApiError)) {
    setError('Unable to connect to payment server.');
    return false;
  }

  if (err.message === 'Booking is not pending payment') {
    navigate(`/bookings/${bookingId}`);
    return true;
  }

  if (err.message === 'Payment already processed') {
    navigate(`/bookings/${bookingId}/success`, { replace: true });
    return true;
  }

  setError(formatApiErrorMessage(err));
  return false;
}
