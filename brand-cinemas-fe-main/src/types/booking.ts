export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface CreateBookingRequest {
  showtimeId: string;
  selectedSeats: string[];
}

export interface BookingConcessionLine {
  concessionId: string;
  quantity: number;
}

export interface UpdateBookingConcessionsRequest {
  concessions: BookingConcessionLine[];
}

export interface ApiBookingConcessionLine {
  concessionId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface PopulatedMovie {
  _id: string;
  title: string;
  poster: string;
  genre: string[] | string;
  duration: number;
}

export interface PopulatedShowtime {
  _id: string;
  studio: string;
  date: string;
  time: string;
  price: number;
}

export interface ApiBooking {
  _id: string;
  bookingNumber: string;
  seats: string[];
  totalPrice: number;
  /** Ticket-only subtotal (preferred; backend formatBookingForApi). */
  ticketPrice?: number;
  ticketTotal?: number;
  concessionTotal?: number;
  concessions?: ApiBookingConcessionLine[];
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: 'MIDTRANS' | 'SIMULATION';
  midtransTransactionId?: string;
  movieId?: PopulatedMovie | string;
  showtimeId?: PopulatedShowtime | string;
  /** @deprecated legacy shape */
  showtime?: {
    _id: string;
    showDate?: string;
    show_date?: string;
    startTime?: string;
    start_time?: string;
    endTime?: string;
    end_time?: string;
    ticketPrice?: number;
    ticket_price?: number;
    movie?: {
      _id: string;
      title: string;
      genre?: string;
      duration?: number;
      poster?: string;
      poster_url?: string;
    };
    hall?: {
      _id: string;
      hallName?: string;
      hall_name?: string;
    };
  };
  userId?: string | {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
  };
  user?: {
    _id?: string;
    id?: string;
    name?: string;
    email?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface BookingListResponse {
  items?: ApiBooking[];
  bookings?: ApiBooking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminBookingListQuery {
  page?: number;
  limit?: number;
  bookingStatus?: BookingStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
  search?: string;
  movieId?: string;
  date?: string;
  sort?: 'createdAt' | 'totalPrice' | 'bookingStatus';
  order?: 'asc' | 'desc';
}

export interface UpdateAdminBookingStatusRequest {
  bookingStatus: BookingStatus;
  paymentStatus?: PaymentStatus;
}
