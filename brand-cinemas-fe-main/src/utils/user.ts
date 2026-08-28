import type {
  AdminUser,
  ApiAdminUser,
  CreateUserInput,
  UpdateUserInput,
} from '@/types/user';
import type { UserRole } from '@/types/auth';

export interface UserFormValues {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
}

export function toAdminUser(api: ApiAdminUser): AdminUser {
  const id = api._id ?? api.id;
  if (!id) {
    throw new Error('User response missing id');
  }

  const toIso = (value?: string | Date) => {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString();
    return String(value);
  };

  return {
    _id: String(id),
    name: api.name ?? '',
    email: api.email ?? '',
    role: api.role === 'ADMIN' ? 'ADMIN' : 'USER',
    createdAt: toIso(api.createdAt as string | Date | undefined),
    updatedAt: toIso(api.updatedAt as string | Date | undefined),
  };
}

export function normalizeUserListPayload(data: {
  items?: ApiAdminUser[];
  users?: ApiAdminUser[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}): {
  items: ApiAdminUser[];
  pagination: NonNullable<typeof data.pagination>;
} {
  return {
    items: data.items ?? data.users ?? [],
    pagination: data.pagination ?? { page: 1, limit: 10, total: 0, totalPages: 1 },
  };
}

export function buildCreateUserBody(data: UserFormValues): CreateUserInput {
  return {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    password: data.password?.trim() ?? '',
    role: data.role,
  };
}

export function buildUpdateUserBody(data: UserFormValues): UpdateUserInput {
  const body: UpdateUserInput = {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    role: data.role,
  };

  const password = data.password?.trim();
  if (password) {
    body.password = password;
  }

  return body;
}
