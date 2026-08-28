import { userRepository } from '../repositories/user.repository';
import { hashPassword } from '../utils/auth.util';
import { AppError } from '../helpers/response.helper';
import { getPaginationParams } from '../helpers';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { IUser } from '../models/User';
import { PaginatedResult, UserRole } from '../types';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
}

export interface UserListQuery {
  page?: string;
  limit?: string;
  search?: string;
  sort?: string;
  order?: string;
  role?: string;
}

const buildUserSort = (sort?: string, order?: string): Record<string, 1 | -1> => {
  const allowedSortFields = ['name', 'email', 'role', 'createdAt'];
  const field = sort && allowedSortFields.includes(sort) ? sort : 'createdAt';
  const direction: 1 | -1 = order === 'asc' ? 1 : -1;
  return { [field]: direction };
};

const sanitizeUser = (user: IUser) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export class UserService {
  async getAll(query: UserListQuery): Promise<PaginatedResult<ReturnType<typeof sanitizeUser>>> {
    const { page, limit, skip } = getPaginationParams(query);
    const sort = buildUserSort(query.sort, query.order);

    let role: UserRole | undefined;
    if (query.role) {
      if (!Object.values(UserRole).includes(query.role as UserRole)) {
        throw new AppError('role must be ADMIN or USER', HTTP_STATUS.BAD_REQUEST);
      }
      role = query.role as UserRole;
    }

    const result = await userRepository.findPaginated({
      search: query.search,
      role,
      page,
      limit,
      skip,
      sort,
    });

    return {
      items: result.items.map(sanitizeUser),
      pagination: result.pagination,
    };
  }

  async getById(id: string): Promise<ReturnType<typeof sanitizeUser>> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
    return sanitizeUser(user);
  }

  async create(dto: CreateUserDto): Promise<ReturnType<typeof sanitizeUser>> {
    const email = dto.email.toLowerCase().trim();
    const exists = await userRepository.existsByEmail(email);
    if (exists) {
      throw new AppError('Email already exists', HTTP_STATUS.CONFLICT);
    }

    const hashedPassword = await hashPassword(dto.password);
    const user = await userRepository.create({
      name: dto.name.trim(),
      email,
      password: hashedPassword,
      role: dto.role ?? UserRole.USER,
    });

    return sanitizeUser(user);
  }

  async update(id: string, dto: UpdateUserDto): Promise<ReturnType<typeof sanitizeUser>> {
    const existing = await userRepository.findById(id);
    if (!existing) {
      throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const updateData: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name.trim();
    }

    if (dto.email !== undefined) {
      const email = dto.email.toLowerCase().trim();
      const duplicate = await userRepository.findByEmail(email);
      if (duplicate && duplicate._id.toString() !== id) {
        throw new AppError('Email already exists', HTTP_STATUS.CONFLICT);
      }
      updateData.email = email;
    }

    if (dto.role !== undefined) {
      updateData.role = dto.role;
    }

    if (dto.password) {
      updateData.password = await hashPassword(dto.password);
      updateData.$inc = { tokenVersion: 1 };
    } else if (dto.role !== undefined && dto.role !== existing.role) {
      updateData.$inc = { tokenVersion: 1 };
    }

    const user = await userRepository.update(id, updateData);
    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    return sanitizeUser(user);
  }

  async delete(id: string, actorId?: string): Promise<void> {
    if (actorId && actorId === id) {
      throw new AppError('Cannot delete your own account', HTTP_STATUS.BAD_REQUEST);
    }

    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    const deleted = await userRepository.update(id, {
      isDeleted: true,
      $inc: { tokenVersion: 1 },
    });
    if (!deleted) {
      throw new AppError(MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }
  }
}

export const userService = new UserService();
