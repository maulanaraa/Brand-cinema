import { FilterQuery, UpdateQuery } from 'mongoose';
import { Carousel, ICarousel } from '../models/Carousel';
import { PaginatedResult } from '../types';

export interface CarouselQueryOptions {
  search?: string;
  type?: string;
  isActive?: boolean;
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

const MOVIE_POPULATE = {
  path: 'movieId',
  select:
    'title poster isActive releaseDate genre duration rating language createdAt updatedAt isDeleted',
};

export class CarouselRepository {
  async create(data: Partial<ICarousel>): Promise<ICarousel> {
    const item = await Carousel.create(data);
    return item.populate(MOVIE_POPULATE);
  }

  async findById(id: string): Promise<ICarousel | null> {
    return Carousel.findById(id).populate(MOVIE_POPULATE);
  }

  async findActive(): Promise<ICarousel[]> {
    return Carousel.find({ isActive: true }).populate(MOVIE_POPULATE).sort({ order: 1 });
  }

  async findAll(options: CarouselQueryOptions): Promise<PaginatedResult<ICarousel>> {
    const filter: FilterQuery<ICarousel> = {};

    if (options.type) {
      filter.type = options.type;
    }

    if (options.isActive !== undefined) {
      filter.isActive = options.isActive;
    }

    if (options.search) {
      filter.$or = [
        { title: { $regex: options.search, $options: 'i' } },
        { description: { $regex: options.search, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      Carousel.find(filter)
        .populate(MOVIE_POPULATE)
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit),
      Carousel.countDocuments(filter),
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

  async update(id: string, data: UpdateQuery<ICarousel>): Promise<ICarousel | null> {
    return Carousel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate(
      MOVIE_POPULATE
    );
  }

  async deleteById(id: string): Promise<ICarousel | null> {
    return Carousel.findByIdAndDelete(id);
  }

  async reorder(orderedIds: string[]): Promise<ICarousel[]> {
    await Promise.all(
      orderedIds.map((id, index) =>
        Carousel.findByIdAndUpdate(id, { order: index + 1 }, { new: false })
      )
    );

    return Carousel.find({ _id: { $in: orderedIds } })
      .populate(MOVIE_POPULATE)
      .sort({ order: 1 });
  }

  async count(filter: FilterQuery<ICarousel> = {}): Promise<number> {
    return Carousel.countDocuments(filter);
  }
}

export const carouselRepository = new CarouselRepository();
