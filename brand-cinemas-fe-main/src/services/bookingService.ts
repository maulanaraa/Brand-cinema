import type { AuthUser, IBooking } from '@/types';
import type {
  AdminBookingListQuery,
  ApiBooking,
  BookingListResponse,
  BookingConcessionLine,
  CreateBookingRequest,
  UpdateBookingConcessionsRequest,
  UpdateAdminBookingStatusRequest,
} from '@/types/booking';
import type { PaginatedResult } from '@/types/pagination';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import type { SeatMap } from '@/types/showtime';
import { ApiError, apiRequest } from './apiClient';
import { normalizeBookingListPayload, toBooking, unwrapBooking } from '@/utils/booking';

const PENDING_BOOKING_KEY = 'cinematix_pending_booking_id';
const CONFIRMED_BOOKING_KEY = 'cinematix_confirmed_booking_id';

function buildAdminBookingQuery(filters: AdminBookingListQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.movieId) params.set('movieId', filters.movieId);
  if (filters.date) params.set('date', filters.date);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);
  if (filters.bookingStatus && filters.bookingStatus !== 'all') {
    params.set('bookingStatus', filters.bookingStatus);
  }
  if (filters.paymentStatus && filters.paymentStatus !== 'all') {
    params.set('paymentStatus', filters.paymentStatus);
  }

  return params;
}

function mapUiStatusToBookingStatus(status: 'pending' | 'confirmed' | 'cancelled') {
  if (status === 'confirmed') return 'CONFIRMED' as const;
  if (status === 'cancelled') return 'CANCELLED' as const;
  return 'PENDING' as const;
}

export const bookingService = {
  async getSeatAvailability(showtimeId: string) {
    const res = await apiRequest<SeatMap>(`/api/showtimes/${showtimeId}/seats`);
    return res.data.bookedSeats;
  },

  async createBooking(input: CreateBookingRequest) {
    const res = await apiRequest<ApiBooking>('/api/bookings', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    sessionStorage.setItem(PENDING_BOOKING_KEY, res.data._id);
    return res.data;
  },

  async processPayment(bookingId: string, status: 'SUCCESS' | 'FAILED' = 'SUCCESS') {
    const res = await apiRequest<ApiBooking>(`/api/bookings/${bookingId}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return toBooking(res.data);
  },

  async getMyBookings(_userId?: string, page = 1, limit = 20): Promise<IBooking[]> {
    const res = await apiRequest<BookingListResponse>(
      `/api/bookings/me?page=${page}&limit=${limit}&sort=createdAt&order=desc`,
    );
    const { items } = normalizeBookingListPayload(res.data);
    return items.map((booking) => toBooking(booking));
  },

  async getBookingById(id: string, fallbackUser?: AuthUser) {
    const res = await apiRequest<ApiBooking | { booking: ApiBooking }>(`/api/bookings/${id}`);
    return toBooking(unwrapBooking(res.data), fallbackUser);
  },

  canCancelBooking(booking: { status: string; showtime: { show_date: string; start_time: string } }) {
    if (booking.status !== 'confirmed') {
      return { allowed: false, reason: 'Booking is not confirmed' };
    }

    const showDate = new Date(booking.showtime.show_date);
    const [hours, minutes] = booking.showtime.start_time.split(':').map(Number);
    const movieStart = new Date(showDate);
    movieStart.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const diffMs = movieStart.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes < 30) {
      return {
        allowed: false,
        reason: `Cancellation is only allowed up to 30 minutes before the show starts. The cancellation window has closed for this booking.`,
      };
    }

    return { allowed: true };
  },

  async cancelBooking(id: string) {
    const res = await apiRequest<ApiBooking | { booking: ApiBooking }>(`/api/bookings/${id}`, {
      method: 'DELETE',
    });
    return toBooking(unwrapBooking(res.data));
  },

  async getAdminBookings(filters: AdminBookingListQuery = {}): Promise<PaginatedResult<IBooking>> {
    const params = buildAdminBookingQuery({
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      sort: 'createdAt',
      order: 'desc',
      ...filters,
    });
    const query = params.toString();
    const res = await apiRequest<BookingListResponse>(
      query ? `/api/admin/bookings?${query}` : '/api/admin/bookings',
    );
    const { items, pagination } = normalizeBookingListPayload(res.data);
    return {
      items: items.map((booking) => toBooking(booking)),
      pagination,
    };
  },

  async getAdminBookingById(id: string) {
    return this.getBookingById(id);
  },

  async updateAdminBookingStatus(id: string, status: 'confirmed' | 'cancelled') {
    if (status === 'cancelled') {
      return this.cancelBooking(id);
    }

    const body: UpdateAdminBookingStatusRequest = {
      bookingStatus: mapUiStatusToBookingStatus(status),
      paymentStatus: 'SUCCESS',
    };

    const res = await apiRequest<ApiBooking | { booking: ApiBooking }>(
      `/api/admin/bookings/${id}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
    );
    return toBooking(unwrapBooking(res.data));
  },

  async updateBookingConcessions(bookingId: string, concessions: BookingConcessionLine[]) {
    const res = await apiRequest<ApiBooking>(`/api/bookings/${bookingId}/concessions`, {
      method: 'PUT',
      body: JSON.stringify({ concessions } satisfies UpdateBookingConcessionsRequest),
    });
    return toBooking(res.data);
  },

  getPendingBookingId() {
    return sessionStorage.getItem(PENDING_BOOKING_KEY);
  },

  setPendingBookingId(id: string) {
    sessionStorage.setItem(PENDING_BOOKING_KEY, id);
  },

  clearPendingBookingId() {
    sessionStorage.removeItem(PENDING_BOOKING_KEY);
  },

  getConfirmedBookingId() {
    return sessionStorage.getItem(CONFIRMED_BOOKING_KEY);
  },

  setConfirmedBookingId(id: string) {
    sessionStorage.setItem(CONFIRMED_BOOKING_KEY, id);
  },

  clearConfirmedBookingId() {
    sessionStorage.removeItem(CONFIRMED_BOOKING_KEY);
  },
};

export { ApiError };
