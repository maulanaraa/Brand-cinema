export interface ApiCity {
  _id: string;
  name?: string;
  slug?: string;
  isActive?: boolean;
  is_active?: boolean;
  sortOrder?: number;
  sort_order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCityInput {
  name: string;
  slug?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateCityInput = Partial<CreateCityInput>;

export interface CityListQuery {
  search?: string;
  isActive?: boolean | 'all';
  page?: number;
  limit?: number;
  sort?: 'name' | 'sortOrder' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface CityListResponse {
  items?: ApiCity[];
  cities?: ApiCity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
