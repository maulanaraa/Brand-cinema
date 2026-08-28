import type {
  AdminUser,
  ApiAdminUser,
  CreateUserInput,
  UpdateUserInput,
  UserListQuery,
  UserListResponse,
} from '@/types/user';
import type { PaginatedResult } from '@/types/pagination';
import { DEFAULT_PAGE_SIZE } from '@/types/pagination';
import { apiRequest } from './apiClient';
import { normalizeUserListPayload, toAdminUser } from '@/utils/user';

export { ApiError } from './apiClient';

function buildQueryParams(filters: UserListQuery): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  if (filters.search) params.set('search', filters.search);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);
  if (filters.role && filters.role !== 'all') params.set('role', filters.role);

  return params;
}

function unwrapUser(
  data: ApiAdminUser | { item: ApiAdminUser } | { user: ApiAdminUser },
): ApiAdminUser {
  if (data && typeof data === 'object') {
    if ('item' in data && data.item) return data.item;
    if ('user' in data && data.user) return data.user;
  }
  return data as ApiAdminUser;
}

export const userService = {
  async getUsers(filters: UserListQuery = {}): Promise<PaginatedResult<AdminUser>> {
    const params = buildQueryParams({
      sort: 'createdAt',
      order: 'desc',
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      ...filters,
    });
    const query = params.toString();
    const path = query ? `/api/users?${query}` : '/api/users';

    const res = await apiRequest<UserListResponse>(path);
    const { items, pagination } = normalizeUserListPayload(res.data);
    return {
      items: items.map(toAdminUser),
      pagination,
    };
  },

  async getUserById(id: string): Promise<AdminUser> {
    const res = await apiRequest<
      ApiAdminUser | { item: ApiAdminUser } | { user: ApiAdminUser }
    >(`/api/users/${id}`);
    return toAdminUser(unwrapUser(res.data));
  },

  async createUser(data: CreateUserInput): Promise<AdminUser> {
    const res = await apiRequest<
      ApiAdminUser | { item: ApiAdminUser } | { user: ApiAdminUser }
    >('/api/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return toAdminUser(unwrapUser(res.data));
  },

  async updateUser(id: string, data: UpdateUserInput): Promise<AdminUser> {
    const res = await apiRequest<
      ApiAdminUser | { item: ApiAdminUser } | { user: ApiAdminUser }
    >(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return toAdminUser(unwrapUser(res.data));
  },

  async deleteUser(id: string): Promise<void> {
    await apiRequest<null>(`/api/users/${id}`, { method: 'DELETE' });
  },
};
