import type { ApiMovie } from '@/types/movie';
import type { PaginationMeta } from '@/types/pagination';

export type CarouselItemType = 'movie' | 'promotion';

export interface ApiCarouselItem {
  _id: string;
  type: CarouselItemType;
  title?: string;
  description?: string;
  imageUrl?: string;
  image_url?: string;
  linkUrl?: string;
  link_url?: string;
  movieId?: string | null;
  movie_id?: string | null;
  movie?: ApiMovie | null;
  isActive?: boolean;
  is_active?: boolean;
  order?: number;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCarouselInput {
  type: CarouselItemType;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  movieId?: string | null;
  isActive?: boolean;
  order?: number;
}

export type UpdateCarouselInput = Partial<CreateCarouselInput>;

export interface CarouselListQuery {
  search?: string;
  type?: CarouselItemType | 'all';
  isActive?: boolean | 'all';
  page?: number;
  limit?: number;
  sort?: 'order' | 'createdAt' | 'title';
  order?: 'asc' | 'desc';
}

export interface CarouselListResponse {
  items?: ApiCarouselItem[];
  carousel?: ApiCarouselItem[];
  pagination?: PaginationMeta;
}

export interface ReorderCarouselInput {
  orderedIds: string[];
}
