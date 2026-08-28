import type {
  ApiConcession,
  ConcessionItem,
  ConcessionListQuery,
  ConcessionListResponse,
  CreateConcessionInput,
  UpdateConcessionInput,
} from '@/types/concession';
import type { PaginatedResult } from '@/types/pagination';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import { apiRequest } from './apiClient';
import { toConcessionItem } from '@/utils/concession';

export { ApiError } from './apiClient';

function buildQueryParams(filters: ConcessionListQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.category) params.set('category', filters.category);
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

export const concessionService = {
  async getConcessions(filters: ConcessionListQuery = {}): Promise<ConcessionItem[]> {
    const { items } = await this.getConcessionsPaginated({
      isActive: true,
      sort: 'sortOrder',
      order: 'asc',
      limit: 100,
      ...filters,
    });
    return items;
  },

  async getConcessionsPaginated(
    filters: ConcessionListQuery = {},
  ): Promise<PaginatedResult<ConcessionItem>> {
    const params = buildQueryParams({
      isActive: 'all',
      sort: 'sortOrder',
      order: 'asc',
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      ...filters,
    });
    const query = params.toString();
    const path = query ? `/api/concessions?${query}` : '/api/concessions';

    const res = await apiRequest<ConcessionListResponse>(path);
    return {
      items: res.data.items.map(toConcessionItem),
      pagination: res.data.pagination,
    };
  },

  async getConcessionsAdmin(filters: ConcessionListQuery = {}): Promise<PaginatedResult<ConcessionItem>> {
    return this.getConcessionsPaginated({
      isActive: 'all',
      sort: 'sortOrder',
      order: 'asc',
      ...filters,
    });
  },

  async getConcessionById(id: string): Promise<ConcessionItem> {
    const res = await apiRequest<ApiConcession>(`/api/concessions/${id}`);
    return toConcessionItem(res.data);
  },

  async createConcession(data: CreateConcessionInput): Promise<ConcessionItem> {
    const res = await apiRequest<ApiConcession>('/api/concessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return toConcessionItem(res.data);
  },

  async updateConcession(id: string, data: UpdateConcessionInput): Promise<ConcessionItem> {
    const res = await apiRequest<ApiConcession>(`/api/concessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return toConcessionItem(res.data);
  },

  async deleteConcession(id: string): Promise<void> {
    await apiRequest<null>(`/api/concessions/${id}`, { method: 'DELETE' });
  },
};
