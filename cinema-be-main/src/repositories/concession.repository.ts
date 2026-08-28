import { FilterQuery, UpdateQuery } from 'mongoose';
import { Concession, IConcession } from '../models/Concession';
import { PaginatedResult } from '../types';

export interface ConcessionQueryOptions {
  search?: string;
  category?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

export class ConcessionRepository {
  async create(data: Partial<IConcession>): Promise<IConcession> {
    return Concession.create(data);
  }

  async findById(id: string): Promise<IConcession | null> {
    return Concession.findById(id);
  }

  async findAll(options: ConcessionQueryOptions): Promise<PaginatedResult<IConcession>> {
    const filter: FilterQuery<IConcession> = {};

    if (options.category) {
      filter.category = options.category;
    }

    if (options.isActive !== undefined) {
      filter.isActive = options.isActive;
    }

    if (options.search) {
      filter.$or = [
        { name: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Concession.find(filter).sort(options.sort).skip(options.skip).limit(options.limit),
      Concession.countDocuments(filter),
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

  async update(id: string, data: UpdateQuery<IConcession>): Promise<IConcession | null> {
    return Concession.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async deleteById(id: string): Promise<IConcession | null> {
    return Concession.findByIdAndDelete(id);
  }

  async count(filter: FilterQuery<IConcession> = {}): Promise<number> {
    return Concession.countDocuments(filter);
  }
}

export const concessionRepository = new ConcessionRepository();
