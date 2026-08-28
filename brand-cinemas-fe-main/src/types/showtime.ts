export interface PopulatedMovie {
  _id: string;
  title: string;
  genre: string;
  duration: number;
  poster: string;
  rating: number;
}

export interface ApiShowtime {
  _id: string;
  movieId: PopulatedMovie | string;
  studio: string;
  date: string;
  time: string;
  price: number;
  totalSeat: number;
  bookedSeats?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SeatMap {
  totalSeat: number;
  bookedSeats: string[];
  availableCount: number;
}

export interface ShowtimeListResponse {
  items: ApiShowtime[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ShowtimeListQuery {
  page?: number;
  limit?: number;
  movieId?: string;
  date?: string;
  sort?: 'createdAt' | 'date' | 'price' | 'title' | 'releaseDate' | 'rating' | 'time';
  order?: 'asc' | 'desc';
}

export interface CreateShowtimeInput {
  movieId: string;
  studio: string;
  date: string;
  time: string;
  price: number;
  totalSeat: number;
}

export type UpdateShowtimeInput = Partial<CreateShowtimeInput>;
