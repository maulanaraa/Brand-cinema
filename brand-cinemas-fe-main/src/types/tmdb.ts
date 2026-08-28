export interface TmdbSearchResult {
  id: number;
  title: string;
  poster?: string | null;
  releaseDate?: string;
  rating?: number;
}

export interface ApiTmdbSearchItem {
  tmdbId?: number;
  id?: number;
  title: string;
  overview?: string;
  poster?: string | null;
  releaseDate?: string;
  rating?: number;
  language?: string;
}

export interface TmdbMovieImportData {
  tmdbId?: number;
  title: string;
  description: string;
  duration: number;
  genre: string;
  poster: string;
  backdrop?: string;
  trailerUrl?: string;
  rating?: number;
  language?: string;
  releaseDate?: string;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbSearchResponse {
  items?: ApiTmdbSearchItem[];
  results?: ApiTmdbSearchItem[];
  pagination?: {
    page: number;
    totalPages: number;
    totalResults: number;
  };
}

export interface TmdbGenresResponse {
  genres: TmdbGenre[];
}
