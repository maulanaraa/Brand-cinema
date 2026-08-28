import type {
  ApiTmdbSearchItem,
  TmdbGenre,
  TmdbGenresResponse,
  TmdbMovieImportData,
  TmdbSearchResponse,
  TmdbSearchResult,
} from '@/types/tmdb';
import { apiRequest } from './apiClient';

export { ApiError } from './apiClient';

function toNumberId(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeSearchItems(data: TmdbSearchResponse | ApiTmdbSearchItem[]): ApiTmdbSearchItem[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function toSearchResult(item: ApiTmdbSearchItem): TmdbSearchResult | null {
  const id = toNumberId(item.tmdbId ?? item.id);
  if (!id || !item.title?.trim()) return null;

  return {
    id,
    title: item.title.trim(),
    poster: item.poster || null,
    releaseDate: item.releaseDate,
    rating: item.rating,
  };
}

export const tmdbService = {
  async searchMovies(query: string): Promise<TmdbSearchResult[]> {
    if (!query.trim()) return [];

    const res = await apiRequest<TmdbSearchResponse | ApiTmdbSearchItem[]>(
      `/api/movies/tmdb/search?q=${encodeURIComponent(query.trim())}`,
    );

    return normalizeSearchItems(res.data)
      .map(toSearchResult)
      .filter((item): item is TmdbSearchResult => item !== null);
  },

  async getMovieImportData(tmdbId: number): Promise<TmdbMovieImportData> {
    const res = await apiRequest<TmdbMovieImportData & Record<string, unknown>>(
      `/api/movies/tmdb/${tmdbId}`,
    );
    const raw = res.data;
    return {
      ...raw,
      tmdbId: raw.tmdbId ?? tmdbId,
      poster: String(raw.poster || raw.posterUrl || raw.poster_url || ''),
      trailerUrl: String(raw.trailerUrl || raw.trailer_url || raw.trailer || ''),
    };
  },

  async getGenres(): Promise<TmdbGenre[]> {
    const res = await apiRequest<TmdbGenresResponse>('/api/movies/tmdb/genres');
    return res.data.genres ?? [];
  },
};
