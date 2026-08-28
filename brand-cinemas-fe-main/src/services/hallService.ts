import type { IHall } from '@/types';
import type {
  ApiHall,
  CreateHallInput,
  HallListQuery,
  HallListResponse,
  UpdateHallInput,
} from '@/types/hall';
import type { PaginatedResult } from '@/types/pagination';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import { apiRequest } from './apiClient';
import { toHall } from '@/utils/hall';

export { ApiError } from './apiClient';

function buildQueryParams(filters: HallListQuery): URLSearchParams {
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

export const hallService = {
  async getHalls(filters: HallListQuery = {}): Promise<PaginatedResult<IHall>> {
    const params = buildQueryParams({
      isActive: 'all',
      sort: 'name',
      order: 'asc',
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      ...filters,
    });
    const query = params.toString();
    const path = query ? `/api/halls?${query}` : '/api/halls';

    const res = await apiRequest<HallListResponse>(path);
    return {
      items: res.data.items.map(toHall),
      pagination: res.data.pagination,
    };
  },

  async getHallById(id: string): Promise<IHall> {
    const res = await apiRequest<ApiHall>(`/api/halls/${id}`);
    return toHall(res.data);
  },

  async createHall(data: CreateHallInput): Promise<IHall> {
    const res = await apiRequest<ApiHall>('/api/halls', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return toHall(res.data);
  },

  async updateHall(id: string, data: UpdateHallInput): Promise<IHall> {
    const res = await apiRequest<ApiHall>(`/api/halls/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return toHall(res.data);
  },

  async deleteHall(id: string): Promise<void> {
    await apiRequest<null>(`/api/halls/${id}`, { method: 'DELETE' });
  },
};
