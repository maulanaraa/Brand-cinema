import type { UserRole } from '@/types/auth';
import type { PaginationMeta } from '@/types/pagination';

export type { UserRole };

/** Domain model for admin user management UI. */
export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface ApiAdminUser {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  /** Omit or leave empty to keep current password. */
  password?: string;
  role?: UserRole;
}

export interface UserListQuery {
  search?: string;
  role?: UserRole | 'all';
  page?: number;
  limit?: number;
  sort?: 'name' | 'email' | 'role' | 'createdAt';
  order?: 'asc' | 'desc';
}

export interface UserListResponse {
  items?: ApiAdminUser[];
  users?: ApiAdminUser[];
  pagination?: PaginationMeta;
}
