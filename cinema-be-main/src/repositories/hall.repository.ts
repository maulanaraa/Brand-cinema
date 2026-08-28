import { FilterQuery, UpdateQuery } from 'mongoose';
import { Hall, IHall } from '../models/Hall';
import { PaginatedResult } from '../types';

export interface HallQueryOptions {
  search?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

export class HallRepository {
  async create(data: Partial<IHall>): Promise<IHall> {
    return Hall.create(data);
  }

  async findById(id: string): Promise<IHall | null> {
    return Hall.findById(id);
  }

  async findByName(name: string, excludeId?: string): Promise<IHall | null> {
    const filter: FilterQuery<IHall> = { name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    return Hall.findOne(filter);
  }

  async findActiveByName(name: string): Promise<IHall | null> {
    return Hall.findOne({
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      isActive: true,
    });
  }

  async findAll(options: HallQueryOptions): Promise<PaginatedResult<IHall>> {
    const filter: FilterQuery<IHall> = {};

    if (options.isActive !== undefined) {
      filter.isActive = options.isActive;
    }

    if (options.search) {
      filter.name = { $regex: options.search, $options: 'i' };
    }

    const [items, total] = await Promise.all([
      Hall.find(filter).sort(options.sort).skip(options.skip).limit(options.limit),
      Hall.countDocuments(filter),
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

  async update(id: string, data: UpdateQuery<IHall>): Promise<IHall | null> {
    return Hall.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async deleteById(id: string): Promise<IHall | null> {
    return Hall.findByIdAndDelete(id);
  }
}

export const hallRepository = new HallRepository();
