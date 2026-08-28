export interface ApiMovie {
  _id: string;
  title: string;
  genre: string | string[];
  description: string;
  duration: number;
  rating: number;
  poster: string;
  backdrop?: string;
  trailerUrl: string;
  language: string;
  releaseDate: string;
  isActive: boolean;
  status?: 'now_showing' | 'coming_soon' | 'now_playing' | 'NOW_PLAYING' | 'COMING_SOON';
  tmdbId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MovieListResponse {
  items: ApiMovie[];
  pagination: Pagination;
}

export interface MovieListQuery {
  page?: number;
  limit?: number;
  search?: string;
  genre?: string;
  isActive?: 'true' | 'false';
  sort?: 'createdAt' | 'title' | 'releaseDate' | 'rating';
  order?: 'asc' | 'desc';
}

export interface CreateMovieInput {
  title: string;
  genre: string | string[];
  description: string;
  duration: number;
  language: string;
  releaseDate: string;
  rating?: number;
  trailerUrl?: string;
  isActive?: boolean;
  status?: 'now_showing' | 'coming_soon';
  posterUrl?: string;
  tmdbId?: number;
}

export type UpdateMovieInput = Partial<CreateMovieInput>;
