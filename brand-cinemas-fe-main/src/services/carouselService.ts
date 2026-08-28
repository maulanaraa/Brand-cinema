import type { ICarouselItem } from '@/types';
import type {
  ApiCarouselItem,
  CarouselListQuery,
  CarouselListResponse,
  CreateCarouselInput,
  UpdateCarouselInput,
} from '@/types/carousel';
import type { PaginatedResult } from '@/types/pagination';
import { apiRequest } from './apiClient';
import {
  normalizeCarouselListPayload,
  toCarouselItem,
} from '@/utils/carousel';

export { ApiError } from './apiClient';

function buildQueryParams(filters: CarouselListQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);
  if (filters.type && filters.type !== 'all') params.set('type', filters.type);

  if (filters.isActive === 'all') {
    params.set('isActive', 'all');
  } else if (filters.isActive !== undefined) {
    params.set('isActive', String(filters.isActive));
  }

  return params;
}

function unwrapCarousel(
  data: ApiCarouselItem | { item: ApiCarouselItem } | { carousel: ApiCarouselItem },
): ApiCarouselItem {
  if (data && typeof data === 'object') {
    if ('item' in data && data.item) return data.item;
    if ('carousel' in data && data.carousel) return data.carousel;
  }
  return data as ApiCarouselItem;
}

export const carouselService = {
  /** Admin list — requires admin session when `isActive=all` / `false`. */
  async getCarouselItems(
    filters: CarouselListQuery = {},
  ): Promise<ICarouselItem[]> {
    const { items } = await this.getCarouselItemsPaginated({
      isActive: 'all',
      sort: 'order',
      order: 'asc',
      page: 1,
      limit: 100,
      ...filters,
    });
    return items;
  },

  async getCarouselItemsPaginated(
    filters: CarouselListQuery = {},
  ): Promise<PaginatedResult<ICarouselItem>> {
    const params = buildQueryParams({
      isActive: 'all',
      sort: 'order',
      order: 'asc',
      page: 1,
      limit: 20,
      ...filters,
    });
    const query = params.toString();
    const path = query ? `/api/carousel?${query}` : '/api/carousel';

    const res = await apiRequest<CarouselListResponse>(path);
    const { items, pagination } = normalizeCarouselListPayload(res.data);
    return {
      items: items.map(toCarouselItem).sort((a, b) => a.order - b.order),
      pagination,
    };
  },

  /** Public homepage: active slides only, ordered by `order` asc. */
  async getActiveCarouselItems(): Promise<ICarouselItem[]> {
    const res = await apiRequest<CarouselListResponse | ApiCarouselItem[]>(
      '/api/carousel/active',
    );
    const raw = res.data;
    const items = Array.isArray(raw)
      ? raw
      : normalizeCarouselListPayload(raw).items;
    return items.map(toCarouselItem).sort((a, b) => a.order - b.order);
  },

  async getCarouselItemById(id: string): Promise<ICarouselItem> {
    const res = await apiRequest<
      ApiCarouselItem | { item: ApiCarouselItem } | { carousel: ApiCarouselItem }
    >(`/api/carousel/${id}`);
    return toCarouselItem(unwrapCarousel(res.data));
  },

  async createCarouselItem(data: CreateCarouselInput): Promise<ICarouselItem> {
    const res = await apiRequest<
      ApiCarouselItem | { item: ApiCarouselItem } | { carousel: ApiCarouselItem }
    >('/api/carousel', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return toCarouselItem(unwrapCarousel(res.data));
  },

  async updateCarouselItem(
    id: string,
    data: UpdateCarouselInput,
  ): Promise<ICarouselItem> {
    const res = await apiRequest<
      ApiCarouselItem | { item: ApiCarouselItem } | { carousel: ApiCarouselItem }
    >(`/api/carousel/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return toCarouselItem(unwrapCarousel(res.data));
  },

  async deleteCarouselItem(id: string): Promise<void> {
    await apiRequest<null>(`/api/carousel/${id}`, { method: 'DELETE' });
  },

  async reorderCarouselItems(orderedIds: string[]): Promise<ICarouselItem[]> {
    const res = await apiRequest<CarouselListResponse | ApiCarouselItem[]>(
      '/api/carousel/reorder',
      {
        method: 'PUT',
        body: JSON.stringify({ orderedIds }),
      },
    );
    const raw = res.data;
    const items = Array.isArray(raw)
      ? raw
      : normalizeCarouselListPayload(raw).items;
    return items.map(toCarouselItem).sort((a, b) => a.order - b.order);
  },
};
