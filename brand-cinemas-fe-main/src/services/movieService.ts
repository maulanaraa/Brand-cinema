import type { IMovie, MovieFilters, MovieListResult } from '@/types';
import type { ApiMovie, CreateMovieInput, MovieListResponse, UpdateMovieInput } from '@/types/movie';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import { ApiError, apiRequest } from './apiClient';
import { buildMovieRequestBody, toMovie } from '@/utils/movie';

function unwrapApiMovie(data: ApiMovie | { movie: ApiMovie }): ApiMovie {
  if (data && typeof data === 'object' && 'movie' in data && data.movie) {
    return data.movie;
  }
  return data as ApiMovie;
}

const sortFieldMap: Record<NonNullable<MovieFilters['sort']>, string> = {
  title: 'title',
  release_date: 'releaseDate',
  rating: 'rating',
  createdAt: 'createdAt',
};

function buildQueryParams(filters: MovieFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.genre) params.set('genre', filters.genre);
  if (filters.isActive) params.set('isActive', filters.isActive);
  if (filters.sort) params.set('sort', sortFieldMap[filters.sort]);
  if (filters.order) params.set('order', filters.order);
  // Backend currently ignores `status`; filtering is done client-side after fetch.

  return params;
}

function paginateItems(
  items: IMovie[],
  page: number,
  limit: number,
): MovieListResult {
  const safePage = Math.max(1, page);
  const safeLimit = Math.max(1, limit);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  const start = (safePage - 1) * safeLimit;

  return {
    items: items.slice(start, start + safeLimit),
    pagination: {
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
    },
  };
}

export const movieService = {
  async getMovies(filters: MovieFilters = {}): Promise<MovieListResult> {
    const statusFilter = filters.status && filters.status !== 'all' ? filters.status : undefined;
    const page = filters.page ?? 1;
    const limit = filters.limit ?? DEFAULT_PAGE_SIZE;

    // Status is not reliably supported by the API, so fetch a wider set and filter locally.
    const requestFilters: MovieFilters = statusFilter
      ? { ...filters, page: 1, limit: 100, status: undefined }
      : { ...filters, status: undefined };

    const params = buildQueryParams(requestFilters);
    const query = params.toString();
    const path = query ? `/api/movies?${query}` : '/api/movies';

    const res = await apiRequest<MovieListResponse>(path);
    let items = res.data.items.map(toMovie);

    if (statusFilter) {
      items = items.filter((movie) => movie.status === statusFilter);
      return paginateItems(items, page, limit);
    }

    return {
      items,
      pagination: res.data.pagination,
    };
  },

  async getMovieById(id: string): Promise<IMovie> {
    const res = await apiRequest<ApiMovie>(`/api/movies/${id}`);
    return toMovie(res.data);
  },

  async createMovie(data: CreateMovieInput): Promise<IMovie> {
    const res = await apiRequest<ApiMovie | { movie: ApiMovie }>('/api/movies', {
      method: 'POST',
      body: JSON.stringify(buildMovieRequestBody(data)),
    });
    return toMovie(unwrapApiMovie(res.data));
  },

  async updateMovie(id: string, data: UpdateMovieInput): Promise<IMovie> {
    const res = await apiRequest<ApiMovie | { movie: ApiMovie }>(`/api/movies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(buildMovieRequestBody(data)),
    });
    return toMovie(unwrapApiMovie(res.data));
  },

  async deleteMovie(id: string): Promise<void> {
    await apiRequest<null>(`/api/movies/${id}`, { method: 'DELETE' });
  },

  async syncIndonesiaMovies(): Promise<{
    syncedCount: number;
    nowPlayingCount: number;
    upcomingCount: number;
  }> {
    const res = await apiRequest<{
      syncedCount: number;
      nowPlayingCount: number;
      upcomingCount: number;
    }>('/api/movies/tmdb/sync-indonesia', { method: 'POST' });
    return res.data;
  },
};

export { ApiError };
