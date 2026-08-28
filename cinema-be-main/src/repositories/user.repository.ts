import { FilterQuery, UpdateQuery } from 'mongoose';
import { User, IUser } from '../models/User';
import { PaginatedResult, UserRole } from '../types';

export interface UserQueryOptions {
  search?: string;
  role?: UserRole;
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

export class UserRepository {
  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }

  async findById(id: string): Promise<IUser | null> {
    return User.findOne({ _id: id, isDeleted: false });
  }

  async findByEmail(email: string, includePassword = false): Promise<IUser | null> {
    const query = User.findOne({ email, isDeleted: false });
    if (includePassword) {
      query.select('+password');
    }
    return query;
  }

  async count(filter: FilterQuery<IUser> = {}): Promise<number> {
    return User.countDocuments({ ...filter, isDeleted: false });
  }

  async findLatest(limit: number): Promise<IUser[]> {
    return User.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-password');
  }

  async update(id: string, data: UpdateQuery<IUser>): Promise<IUser | null> {
    return User.findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true });
  }

  async softDelete(id: string): Promise<IUser | null> {
    return User.findOneAndUpdate({ _id: id }, { isDeleted: true }, { new: true });
  }

  async findAll(
    filter: FilterQuery<IUser> = {},
    skip = 0,
    limit = 10,
    sort: Record<string, 1 | -1> = { createdAt: -1 }
  ): Promise<IUser[]> {
    return User.find({ ...filter, isDeleted: false })
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('-password');
  }

  async findPaginated(options: UserQueryOptions): Promise<PaginatedResult<IUser>> {
    const filter: FilterQuery<IUser> = { isDeleted: false };

    if (options.role) {
      filter.role = options.role;
    }

    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { email: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit)
        .select('-password -googleId -passwordResetToken -passwordResetExpires'),
      User.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit) || 1,
      },
    };
  }

  async findByPasswordResetToken(hashedToken: string): Promise<IUser | null> {
    return User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
      isDeleted: false,
    }).select('+passwordResetToken +passwordResetExpires +password');
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId, isDeleted: false });
  }

  async findAuthState(id: string): Promise<{ tokenVersion: number; role: UserRole } | null> {
    const user = await User.findOne({ _id: id, isDeleted: false }).select('tokenVersion role').lean();
    if (!user) {
      return null;
    }

    return {
      tokenVersion: user.tokenVersion ?? 0,
      role: user.role,
    };
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email, isDeleted: false });
    return count > 0;
  }

  async createAdminIfNotExists(
    name: string,
    email: string,
    hashedPassword: string
  ): Promise<IUser | null> {
    const exists = await this.existsByEmail(email);
    if (exists) return null;

    return this.create({
      name,
      email,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });
  }
}

export const userRepository = new UserRepository();
