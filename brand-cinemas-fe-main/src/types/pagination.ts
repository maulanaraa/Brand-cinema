export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

export const DEFAULT_PAGE_SIZE = 10;

export const EMPTY_PAGINATION: PaginationMeta = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 1,
};
