import type { ICity } from '@/types';
import type {
  ApiCity,
  CreateCityInput,
  CityListQuery,
  CityListResponse,
  UpdateCityInput,
} from '@/types/city';
import type { PaginatedResult } from '@/types/pagination';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import { apiRequest } from './apiClient';
import { normalizeCityListPayload, toCity } from '@/utils/city';

export { ApiError } from './apiClient';

function buildQueryParams(filters: CityListQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);
  if (filters.isActive === 'all') {
    params.set('isActive', 'all');
  } else if (filters.isActive !== undefined) {
    params.set('isActive', String(filters.isActive));
  }

  return params;
}

export const cityService = {
  async getCities(filters: CityListQuery = {}): Promise<PaginatedResult<ICity>> {
    const params = buildQueryParams({
      isActive: true,
      sort: 'sortOrder',
      order: 'asc',
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      ...filters,
    });
    const query = params.toString();
    const path = query ? `/api/cities?${query}` : '/api/cities';

    const res = await apiRequest<CityListResponse>(path);
    const { items, pagination } = normalizeCityListPayload(res.data);
    return {
      items: items.map(toCity),
      pagination,
    };
  },

  async getCityById(id: string): Promise<ICity> {
    const res = await apiRequest<ApiCity>(`/api/cities/${id}`);
    return toCity(res.data);
  },

  async createCity(data: CreateCityInput): Promise<ICity> {
    const res = await apiRequest<ApiCity>('/api/cities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return toCity(res.data);
  },

  async updateCity(id: string, data: UpdateCityInput): Promise<ICity> {
    const res = await apiRequest<ApiCity>(`/api/cities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return toCity(res.data);
  },

  async deleteCity(id: string): Promise<void> {
    await apiRequest<null>(`/api/cities/${id}`, { method: 'DELETE' });
  },
};
