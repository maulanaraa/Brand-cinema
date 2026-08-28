import { FilterQuery, UpdateQuery } from 'mongoose';
import { Movie, IMovie } from '../models/Movie';
import { MovieStatus, PaginatedResult } from '../types';

export interface MovieQueryOptions {
  search?: string;
  genre?: string;
  isActive?: boolean;
  status?: MovieStatus;
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

export class MovieRepository {
  async create(data: Partial<IMovie>): Promise<IMovie> {
    return Movie.create(data);
  }

  async findById(id: string): Promise<IMovie | null> {
    return Movie.findOne({ _id: id, isDeleted: false });
  }

  async findAll(options: MovieQueryOptions): Promise<PaginatedResult<IMovie>> {
    const filter: FilterQuery<IMovie> = { isDeleted: false };

    if (options.genre) {
      filter.genre = { $regex: options.genre, $options: 'i' };
    }

    if (options.isActive !== undefined) {
      filter.isActive = options.isActive;
    }

    if (options.status) {
      filter.status = options.status;
    }

    if (options.search) {
      filter.$or = [
        { title: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
        { genre: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Movie.find(filter).sort(options.sort).skip(options.skip).limit(options.limit),
      Movie.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async update(id: string, data: UpdateQuery<IMovie>): Promise<IMovie | null> {
    return Movie.findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true });
  }

  async softDelete(id: string): Promise<IMovie | null> {
    return Movie.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true, isActive: false },
      { new: true }
    );
  }

  async count(filter: FilterQuery<IMovie> = {}): Promise<number> {
    return Movie.countDocuments({ ...filter, isDeleted: false });
  }

  async findLatest(limit: number): Promise<IMovie[]> {
    return Movie.find({ isDeleted: false }).sort({ createdAt: -1 }).limit(limit);
  }
}

export const movieRepository = new MovieRepository();
