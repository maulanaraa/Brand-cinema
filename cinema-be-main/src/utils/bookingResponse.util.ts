import { IBooking } from '../models/Booking';
import { getConcessionsSubtotal, getTicketSubtotal } from './bookingConcession.util';

export const formatBookingForApi = (booking: IBooking): Record<string, unknown> => {
  const plain =
    typeof (booking as { toObject?: () => Record<string, unknown> }).toObject === 'function'
      ? (booking as { toObject: () => Record<string, unknown> }).toObject()
      : { ...(booking as unknown as Record<string, unknown>) };

  return {
    ...plain,
    ticketPrice: getTicketSubtotal(booking),
    concessionTotal: getConcessionsSubtotal(booking),
  };
};

export const formatBookingsForApi = (bookings: IBooking[]): Record<string, unknown>[] =>
  bookings.map((booking) => formatBookingForApi(booking));
