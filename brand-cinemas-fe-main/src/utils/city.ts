import type { ICity } from '@/types';
import type { ApiCity, CreateCityInput } from '@/types/city';

export function toCity(api: ApiCity): ICity {
  return {
    _id: String(api._id),
    name: api.name ?? '',
    slug: api.slug,
    is_active: api.isActive ?? api.is_active ?? true,
    sort_order: api.sortOrder ?? api.sort_order ?? 0,
    createdAt: api.createdAt ?? '',
    updatedAt: api.updatedAt ?? '',
  };
}

/** Normalize list payload from Hall-style `{ items }` responses. */
export function normalizeCityListPayload(data: {
  items?: ApiCity[];
  cities?: ApiCity[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}): { items: ApiCity[]; pagination: NonNullable<typeof data.pagination> } {
  return {
    items: data.items ?? data.cities ?? [],
    pagination: data.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

export interface CityFormValues {
  name: string;
  slug?: string;
  is_active?: boolean;
  sort_order?: number;
}

export function buildCityRequestBody(data: CityFormValues): CreateCityInput {
  const name = data.name.trim();
  const slug = data.slug?.trim();

  return {
    name,
    ...(slug ? { slug } : {}),
    isActive: data.is_active ?? true,
    sortOrder: Number(data.sort_order ?? 0),
  };
}
