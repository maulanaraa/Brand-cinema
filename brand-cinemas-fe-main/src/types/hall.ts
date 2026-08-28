export interface ApiHall {
  _id: string;
  name?: string;
  hallName?: string;
  hall_name?: string;
  totalSeats?: number;
  total_seats?: number;
  layoutRows?: number;
  layout_rows?: number;
  layoutColumns?: number;
  layout_columns?: number;
  isActive?: boolean;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateHallInput {
  name: string;
  totalSeats: number;
  layoutRows: number;
  layoutColumns: number;
  isActive?: boolean;
}

export type UpdateHallInput = Partial<CreateHallInput>;

export interface HallListQuery {
  search?: string;
  isActive?: boolean | 'all';
  page?: number;
  limit?: number;
  sort?: 'name' | 'totalSeats' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface HallListResponse {
  items: ApiHall[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
