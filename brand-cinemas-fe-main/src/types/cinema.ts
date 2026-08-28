import type { ApiCity } from './city';

export interface ApiCinema {
  _id: string;
  name?: string;
  city?: ApiCity | string;
  cityId?: string;
  city_id?: string;
  address?: string;
  isActive?: boolean;
  is_active?: boolean;
  sortOrder?: number;
  sort_order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCinemaInput {
  name: string;
  cityId: string;
  address?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateCinemaInput = Partial<CreateCinemaInput>;

export interface CinemaListQuery {
  search?: string;
  cityId?: string;
  isActive?: boolean | 'all';
  page?: number;
  limit?: number;
  sort?: 'name' | 'sortOrder' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface CinemaListResponse {
  items?: ApiCinema[];
  cinemas?: ApiCinema[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AvailableDateItem {
  date: string;
  label?: string;
}
