import { FilterQuery, UpdateQuery } from 'mongoose';
import { City, ICity } from '../models/City';
import { PaginatedResult } from '../types';

export interface CityQueryOptions {
  search?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

export class CityRepository {
  async create(data: Partial<ICity>): Promise<ICity> {
    return City.create(data);
  }

  async findById(id: string): Promise<ICity | null> {
    return City.findById(id);
  }

  async findByName(name: string, excludeId?: string): Promise<ICity | null> {
    const filter: FilterQuery<ICity> = {
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    return City.findOne(filter);
  }

  async findBySlug(slug: string, excludeId?: string): Promise<ICity | null> {
    const filter: FilterQuery<ICity> = { slug };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    return City.findOne(filter);
  }

  async findAll(options: CityQueryOptions): Promise<PaginatedResult<ICity>> {
    const filter: FilterQuery<ICity> = {};

    if (options.isActive !== undefined) {
      filter.isActive = options.isActive;
    }

    if (options.search) {
      filter.name = { $regex: options.search, $options: 'i' };
    }

    const [items, total] = await Promise.all([
      City.find(filter).sort(options.sort).skip(options.skip).limit(options.limit),
      City.countDocuments(filter),
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

  async update(id: string, data: UpdateQuery<ICity>): Promise<ICity | null> {
    return City.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async deleteById(id: string): Promise<ICity | null> {
    return City.findByIdAndDelete(id);
  }
}

export const cityRepository = new CityRepository();
