import type { IShowtime } from '@/types';
import type {
  ApiShowtime,
  CreateShowtimeInput,
  SeatMap,
  ShowtimeListQuery,
  ShowtimeListResponse,
  UpdateShowtimeInput,
} from '@/types/showtime';
import type { PaginatedResult } from '@/types/pagination';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import { ApiError, apiRequest } from './apiClient';
import { toShowtime } from '@/utils/showtime';export interface ShowtimeFilters extends ShowtimeListQuery {}

function buildQueryParams(filters: ShowtimeFilters): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.movieId) params.set('movieId', filters.movieId);
  if (filters.date) params.set('date', filters.date);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);

  return params;
}

export const showtimeService = {
  async getShowtimes(filters: ShowtimeFilters = {}): Promise<PaginatedResult<IShowtime>> {
    const params = buildQueryParams({
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      ...filters,
    });
    const query = params.toString();
    const path = query ? `/api/showtimes?${query}` : '/api/showtimes';

    const res = await apiRequest<ShowtimeListResponse>(path);
    return {
      items: res.data.items.map(toShowtime),
      pagination: res.data.pagination,
    };
  },

  async getShowtimeById(id: string): Promise<IShowtime> {
    const res = await apiRequest<ApiShowtime>(`/api/showtimes/${id}`);
    return toShowtime(res.data);
  },

  async getMovieShowtimes(movieId: string, date?: string): Promise<IShowtime[]> {
    const { items } = await this.getShowtimes({
      movieId,
      date,
      sort: 'date',
      order: 'asc',
      limit: 100,
    });
    return items;
  },

  async getShowtimeSeats(id: string): Promise<SeatMap> {
    const res = await apiRequest<SeatMap>(`/api/showtimes/${id}/seats`);
    return res.data;
  },

  async createShowtime(data: CreateShowtimeInput): Promise<IShowtime> {
    const res = await apiRequest<ApiShowtime>('/api/showtimes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return toShowtime(res.data);
  },

  async updateShowtime(id: string, data: UpdateShowtimeInput): Promise<IShowtime> {
    const res = await apiRequest<ApiShowtime>(`/api/showtimes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return toShowtime(res.data);
  },

  async deleteShowtime(id: string): Promise<void> {
    await apiRequest<null>(`/api/showtimes/${id}`, { method: 'DELETE' });
  },
};

export { ApiError };
