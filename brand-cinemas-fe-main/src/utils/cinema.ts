import type { ICinema, ICity } from '@/types';
import type { ApiCinema, CreateCinemaInput } from '@/types/cinema';
import { toCity } from './city';

function resolveCity(api: ApiCinema): ICity | string {
  if (api.city && typeof api.city === 'object') {
    return toCity(api.city);
  }
  if (typeof api.city === 'string') {
    return api.city;
  }
  return api.cityId ?? api.city_id ?? '';
}

export function getCinemaCityId(cinema: ICinema): string {
  if (cinema.city_id) return cinema.city_id;
  if (typeof cinema.city === 'string') return cinema.city;
  return cinema.city._id;
}

export function getCinemaCityName(cinema: ICinema): string {
  if (typeof cinema.city === 'object' && cinema.city?.name) {
    return cinema.city.name;
  }
  return '—';
}

export function toCinema(api: ApiCinema): ICinema {
  const cityId = api.cityId ?? api.city_id
    ?? (typeof api.city === 'string' ? api.city : api.city?._id)
    ?? '';

  return {
    _id: String(api._id),
    name: api.name ?? '',
    city: resolveCity(api),
    city_id: cityId ? String(cityId) : '',
    address: api.address,
    is_active: api.isActive ?? api.is_active ?? true,
    sort_order: api.sortOrder ?? api.sort_order ?? 0,
    createdAt: api.createdAt ?? '',
    updatedAt: api.updatedAt ?? '',
  };
}

export interface CinemaFormValues {
  name: string;
  city_id: string;
  address?: string;
  is_active?: boolean;
  sort_order?: number;
}

export function buildCinemaRequestBody(data: CinemaFormValues): CreateCinemaInput {
  return {
    name: data.name.trim(),
    cityId: data.city_id,
    address: data.address?.trim() || undefined,
    isActive: data.is_active ?? true,
    sortOrder: Number(data.sort_order ?? 0),
  };
}

/** Normalize list payload from Hall-style `{ items }` responses. */
export function normalizeCinemaListPayload(data: {
  items?: ApiCinema[];
  cinemas?: ApiCinema[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}): { items: ApiCinema[]; pagination: NonNullable<typeof data.pagination> } {
  return {
    items: data.items ?? data.cinemas ?? [],
    pagination: data.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}
