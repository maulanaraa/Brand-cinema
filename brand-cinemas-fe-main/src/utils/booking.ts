import type { AuthUser, IBooking, IMovie, IShowtime } from '@/types';
import type { ApiBooking, PopulatedMovie, PopulatedShowtime, BookingListResponse } from '@/types/booking';
import { getPosterFullUrl } from '@/utils/movie';

function mapBookingStatus(status: ApiBooking['bookingStatus']): IBooking['status'] {
  if (status === 'CONFIRMED') return 'confirmed';
  if (status === 'CANCELLED' || status === 'EXPIRED') return 'cancelled';
  return 'pending';
}

function formatGenre(genre?: string[] | string): string {
  if (Array.isArray(genre)) return genre.join(', ');
  return genre || '';
}

function toMovieFromPopulated(movie?: PopulatedMovie | string): IMovie {
  if (!movie || typeof movie === 'string') {
    return {
      _id: typeof movie === 'string' ? movie : '',
      title: 'Unknown Movie',
      description: '',
      genre: '',
      duration: 120,
      release_date: new Date().toISOString(),
      poster_url: getPosterFullUrl(),
      status: 'now_showing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    _id: movie._id,
    title: movie.title,
    description: '',
    genre: formatGenre(movie.genre),
    duration: movie.duration,
    release_date: new Date().toISOString(),
    poster_url: getPosterFullUrl(movie.poster),
    status: 'now_showing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function toShowtimeFromPopulated(
  showtime: PopulatedShowtime,
  movie: IMovie,
): IShowtime {
  return {
    _id: showtime._id,
    movie,
    hall: {
      _id: showtime.studio,
      hall_name: showtime.studio,
      total_seats: 0,
      layout_rows: 0,
      layout_columns: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    show_date: showtime.date,
    start_time: showtime.time,
    end_time: '',
    ticket_price: showtime.price,
    studio: showtime.studio,
  };
}

function toShowtimeLegacy(showtime: NonNullable<ApiBooking['showtime']>): IShowtime {
  const legacyMovie = showtime.movie
    ? {
        _id: showtime.movie._id,
        title: showtime.movie.title,
        genre: showtime.movie.genre,
        duration: showtime.movie.duration,
        poster: showtime.movie.poster_url || showtime.movie.poster,
      }
    : undefined;

  return {
    _id: showtime._id,
    movie: toMovieFromPopulated(legacyMovie as PopulatedMovie | undefined),
    hall: {
      _id: showtime.hall?._id || '',
      hall_name: showtime.hall?.hall_name || showtime.hall?.hallName || 'Hall',
      total_seats: 0,
      layout_rows: 0,
      layout_columns: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    show_date: showtime.show_date || showtime.showDate || new Date().toISOString(),
    start_time: showtime.start_time || showtime.startTime || '',
    end_time: showtime.end_time || showtime.endTime || '',
    ticket_price: showtime.ticket_price || showtime.ticketPrice || 0,
  };
}

function resolveShowtime(api: ApiBooking): IShowtime {
  const movie =
    api.movieId && typeof api.movieId === 'object'
      ? toMovieFromPopulated(api.movieId)
      : toMovieFromPopulated(undefined);

  if (api.showtimeId && typeof api.showtimeId === 'object') {
    return toShowtimeFromPopulated(api.showtimeId, movie);
  }

  if (api.showtime) {
    return toShowtimeLegacy(api.showtime);
  }

  return {
    _id: typeof api.showtimeId === 'string' ? api.showtimeId : '',
    movie,
    hall: {
      _id: '',
      hall_name: 'Studio',
      total_seats: 0,
      layout_rows: 0,
      layout_columns: 10,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    show_date: new Date().toISOString(),
    start_time: '',
    end_time: '',
    ticket_price: 0,
  };
}

export function unwrapBooking(data: ApiBooking | { booking: ApiBooking }): ApiBooking {
  if (data && typeof data === 'object' && 'booking' in data && data.booking) {
    return data.booking;
  }
  return data as ApiBooking;
}

export function normalizeBookingListPayload(data: BookingListResponse) {
  return {
    items: data.items ?? data.bookings ?? [],
    pagination: data.pagination,
  };
}

function resolveUser(api: ApiBooking, fallbackUser?: AuthUser): AuthUser {
  if (fallbackUser) return fallbackUser;

  const populatedUser =
    api.user ??
    (api.userId && typeof api.userId === 'object' ? api.userId : null);

  if (populatedUser && typeof populatedUser === 'object') {
    return {
      id: populatedUser._id || populatedUser.id || '',
      _id: populatedUser._id || populatedUser.id,
      email: populatedUser.email || '',
      fullName: populatedUser.name || 'User',
      role: 'user',
    };
  }

  return {
    id: typeof api.userId === 'string' ? api.userId : '',
    email: '',
    fullName: 'User',
    role: 'user',
  };
}

export function toBooking(api: ApiBooking, fallbackUser?: AuthUser): IBooking {
  const showtime = resolveShowtime(api);

  const user = resolveUser(api, fallbackUser);
  const concessionTotal = api.concessionTotal ?? 0;
  const ticketTotal =
    api.ticketTotal ??
    api.ticketPrice ??
    Math.max(0, api.totalPrice - concessionTotal);

  return {
    _id: api._id,
    user,
    showtime,
    booking_date: api.createdAt || new Date().toISOString(),
    total_seats: api.seats.length,
    total_amount: api.totalPrice,
    ticketTotal,
    concessionTotal,
    status: mapBookingStatus(api.bookingStatus),
    selected_seats: api.seats,
    bookingNumber: api.bookingNumber,
    paymentStatus: api.paymentStatus,
    bookingStatus: api.bookingStatus,
  };
}
