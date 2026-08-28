export type ConcessionCategory = 'combo' | 'popcorn' | 'drinks' | 'snacks';

export interface ApiConcession {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: ConcessionCategory;
  imageUrl: string;
  badge?: string;
  isActive: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConcessionItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ConcessionCategory;
  imageUrl: string;
  badge?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CreateConcessionInput {
  name: string;
  description: string;
  price: number;
  category: ConcessionCategory;
  imageUrl: string;
  badge?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateConcessionInput = Partial<CreateConcessionInput>;

export interface ConcessionListQuery {
  category?: ConcessionCategory;
  isActive?: boolean | 'all';
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'sortOrder' | 'name' | 'price' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface ConcessionListResponse {
  items: ApiConcession[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ConcessionCartLine {
  itemId: string;
  quantity: number;
}
