import type { IBooking } from '@/types';

const APP_ORIGIN =
  (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, '') ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');

export function buildTicketUrl(bookingId: string, bookingNumber: string): string {
  const params = new URLSearchParams({ bookingNumber });
  return `${APP_ORIGIN}/bookings/${bookingId}/success?${params.toString()}`;
}

export function buildTicketSuccessPath(bookingId: string, bookingNumber?: string): string {
  if (!bookingNumber) return `/bookings/${bookingId}/success`;
  return `/bookings/${bookingId}/success?bookingNumber=${encodeURIComponent(bookingNumber)}`;
}

export function buildTicketQrValue(booking: IBooking): string {
  const bookingNumber = booking.bookingNumber || booking._id;
  return buildTicketUrl(booking._id, bookingNumber);
}

export function parseTicketBookingNumber(search: string): string | null {
  return new URLSearchParams(search).get('bookingNumber');
}
