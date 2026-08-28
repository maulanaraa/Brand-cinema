export interface AuthUser {
  id: string;
  _id?: string;
  email: string;
  username?: string;
  fullName: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
}

export interface IMovie {
  _id: string;
  title: string;
  description: string;
  genre: string;
  duration: number;
  release_date: string;
  poster_url: string;
  trailer_url?: string;
  backdrop_url?: string;
  classification?: string;
  director?: string;
  cast?: string[];
  rating?: number;
  ticket_price: number;
  status: 'now_showing' | 'coming_soon';
  is_now_showing?: boolean;
  language?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IHall {
  _id: string;
  hall_name: string;
  total_seats: number;
  layout_rows: number;
  layout_columns: number;
  is_active?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICity {
  _id: string;
  name: string;
  slug?: string;
  is_active?: boolean;
  sort_order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICinema {
  _id: string;
  name: string;
  city: ICity | string;
  city_id?: string;
  address?: string;
  is_active?: boolean;
  sort_order?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IShowtime {
  _id: string;
  movie: IMovie;
  hall: IHall;
  show_date: string;
  start_time: string;
  end_time: string;
  ticket_price: number;
  totalSeat?: number;
  studio?: string;
}

export interface IBooking {
  _id: string;
  user: AuthUser;
  showtime: IShowtime;
  booking_date: string;
  total_seats: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  selected_seats: string[];
  bookingNumber?: string;
  paymentStatus?: 'PENDING' | 'SUCCESS' | 'FAILED';
  bookingStatus?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  ticketTotal?: number;
  concessionTotal?: number;
}

export interface MovieFilters {
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  status?: 'all' | 'now_showing' | 'coming_soon';
  isActive?: 'true' | 'false';
  sort?: 'title' | 'release_date' | 'rating' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface MovieListResult {
  items: IMovie[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ShowtimeInput {
  movie: string;
  hall: string;
  show_date: string;
  start_time: string;
  end_time: string;
}

export interface IFoodItem {
  _id: string;
  name: string;
  price: number;
  category: 'popcorn' | 'minuman' | 'snack';
  image_url: string;
  is_available: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IOrderItem {
  foodItem: IFoodItem;
  quantity: number;
}

export interface BookingInput {
  user: string;
  showtime: string;
  selected_seats: string[];
  total_seats: number;
  total_amount: number;
  order_items?: IOrderItem[];
  status?: 'pending' | 'confirmed' | 'cancelled';
}

export interface ICarouselItem {
  _id: string;
  type: 'movie' | 'promotion';
  title: string;
  description?: string;
  image_url: string;
  link_url?: string;
  movie_id?: string;
  movie?: IMovie;
  is_active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}
