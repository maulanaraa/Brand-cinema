import type { ICinema } from '@/types';
import type {
  ApiCinema,
  AvailableDateItem,
  CreateCinemaInput,
  CinemaListQuery,
  CinemaListResponse,
  UpdateCinemaInput,
} from '@/types/cinema';
import type { PaginatedResult } from '@/types/pagination';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import { apiRequest } from './apiClient';
import { normalizeCinemaListPayload, toCinema } from '@/utils/cinema';

export { ApiError } from './apiClient';

function buildQueryParams(filters: CinemaListQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.cityId) params.set('cityId', filters.cityId);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);
  if (filters.isActive === 'all') {
    params.set('isActive', 'all');
  } else if (filters.isActive !== undefined) {
    params.set('isActive', String(filters.isActive));
  }

  return params;
}

function normalizeAvailableDates(data: unknown): AvailableDateItem[] {
  if (Array.isArray(data)) {
    return data.filter(
      (item): item is AvailableDateItem =>
        Boolean(item && typeof item === 'object' && 'date' in item && typeof (item as AvailableDateItem).date === 'string'),
    );
  }

  if (data && typeof data === 'object') {
    const record = data as { items?: AvailableDateItem[]; dates?: AvailableDateItem[] };
    const list = record.items ?? record.dates;
    if (Array.isArray(list)) {
      return normalizeAvailableDates(list);
    }
  }

  return [];
}

export const cinemaService = {
  async getCinemas(filters: CinemaListQuery = {}): Promise<PaginatedResult<ICinema>> {
    const params = buildQueryParams({
      isActive: true,
      sort: 'sortOrder',
      order: 'asc',
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      ...filters,
    });
    const query = params.toString();
    const path = query ? `/api/cinemas?${query}` : '/api/cinemas';

    const res = await apiRequest<CinemaListResponse>(path);
    const { items, pagination } = normalizeCinemaListPayload(res.data);
    return {
      items: items.map(toCinema),
      pagination,
    };
  },

  async getCinemaById(id: string): Promise<ICinema> {
    const res = await apiRequest<ApiCinema>(`/api/cinemas/${id}`);
    return toCinema(res.data);
  },

  async createCinema(data: CreateCinemaInput): Promise<ICinema> {
    const res = await apiRequest<ApiCinema>('/api/cinemas', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return toCinema(res.data);
  },

  async updateCinema(id: string, data: UpdateCinemaInput): Promise<ICinema> {
    const res = await apiRequest<ApiCinema>(`/api/cinemas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return toCinema(res.data);
  },

  async deleteCinema(id: string): Promise<void> {
    await apiRequest<null>(`/api/cinemas/${id}`, { method: 'DELETE' });
  },

  /**
   * Available booking dates for a cinema (optionally scoped by city).
   * Falls back to empty list if the endpoint is unavailable.
   */
  async getAvailableDates(filters: {
    cityId?: string;
    cinemaId?: string;
    days?: number;
  } = {}): Promise<AvailableDateItem[]> {
    const params = new URLSearchParams();
    if (filters.cityId) params.set('cityId', filters.cityId);
    if (filters.cinemaId) params.set('cinemaId', filters.cinemaId);
    if (filters.days) params.set('days', String(filters.days));

    const query = params.toString();
    const path = query ? `/api/showtimes/dates?${query}` : '/api/showtimes/dates';

    try {
      const res = await apiRequest<AvailableDateItem[] | { items?: AvailableDateItem[]; dates?: AvailableDateItem[] }>(path);
      return normalizeAvailableDates(res.data);
    } catch {
      return [];
    }
  },
};
