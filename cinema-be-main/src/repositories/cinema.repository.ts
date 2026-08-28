import { FilterQuery, UpdateQuery } from 'mongoose';
import { Cinema, ICinema } from '../models/Cinema';
import { PaginatedResult } from '../types';

export interface CinemaQueryOptions {
  search?: string;
  cityId?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

const CITY_POPULATE = { path: 'cityId', select: 'name slug isActive' };

export class CinemaRepository {
  async create(data: Partial<ICinema>): Promise<ICinema> {
    const cinema = await Cinema.create(data);
    return cinema.populate(CITY_POPULATE);
  }

  async findById(id: string): Promise<ICinema | null> {
    return Cinema.findById(id).populate(CITY_POPULATE);
  }

  async findByNameInCity(
    name: string,
    cityId: string,
    excludeId?: string
  ): Promise<ICinema | null> {
    const filter: FilterQuery<ICinema> = {
      cityId,
      name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
    };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    return Cinema.findOne(filter);
  }

  async countByCityId(cityId: string, isActive?: boolean): Promise<number> {
    const filter: FilterQuery<ICinema> = { cityId };
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }
    return Cinema.countDocuments(filter);
  }

  async findAll(options: CinemaQueryOptions): Promise<PaginatedResult<ICinema>> {
    const filter: FilterQuery<ICinema> = {};

    if (options.cityId) {
      filter.cityId = options.cityId;
    }

    if (options.isActive !== undefined) {
      filter.isActive = options.isActive;
    }

    if (options.search) {
      filter.name = { $regex: options.search, $options: 'i' };
    }

    const [items, total] = await Promise.all([
      Cinema.find(filter)
        .populate(CITY_POPULATE)
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit),
      Cinema.countDocuments(filter),
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

  async update(id: string, data: UpdateQuery<ICinema>): Promise<ICinema | null> {
    return Cinema.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate(
      CITY_POPULATE
    );
  }

  async deleteById(id: string): Promise<ICinema | null> {
    return Cinema.findByIdAndDelete(id);
  }
}

export const cinemaRepository = new CinemaRepository();
