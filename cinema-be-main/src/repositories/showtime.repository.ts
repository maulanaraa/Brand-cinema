import { ClientSession, FilterQuery, UpdateQuery } from 'mongoose';
import { Showtime, IShowtime } from '../models/Showtime';
import { PaginatedResult } from '../types';

export interface ShowtimeQueryOptions {
  movieId?: string;
  date?: string;
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

export class ShowtimeRepository {
  async create(data: Partial<IShowtime>): Promise<IShowtime> {
    return Showtime.create(data);
  }

  async findById(id: string): Promise<IShowtime | null> {
    return Showtime.findOne({ _id: id, isDeleted: false }).populate(
      'movieId',
      'title genre duration poster rating'
    );
  }

  async findByIdRaw(id: string, session?: ClientSession): Promise<IShowtime | null> {
    const query = Showtime.findOne({ _id: id, isDeleted: false });
    if (session) query.session(session);
    return query;
  }

  async findAll(options: ShowtimeQueryOptions): Promise<PaginatedResult<IShowtime>> {
    const filter: FilterQuery<IShowtime> = { isDeleted: false };

    if (options.movieId) {
      filter.movieId = options.movieId;
    }

    if (options.date) {
      const startDate = new Date(options.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(options.date);
      endDate.setHours(23, 59, 59, 999);
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const [items, total] = await Promise.all([
      Showtime.find(filter)
        .populate('movieId', 'title genre duration poster rating')
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit),
      Showtime.countDocuments(filter),
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

  async update(id: string, data: UpdateQuery<IShowtime>): Promise<IShowtime | null> {
    return Showtime.findOneAndUpdate({ _id: id, isDeleted: false }, data, { new: true }).populate(
      'movieId',
      'title genre duration poster rating'
    );
  }

  async softDelete(id: string): Promise<IShowtime | null> {
    return Showtime.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true }, { new: true });
  }

  async atomicBookSeats(
    showtimeId: string,
    seats: string[],
    session?: ClientSession
  ): Promise<IShowtime | null> {
    const query = Showtime.findOneAndUpdate(
      {
        _id: showtimeId,
        isDeleted: false,
        bookedSeats: { $nin: seats },
      },
      { $addToSet: { bookedSeats: { $each: seats } } },
      { new: true }
    );
    if (session) query.session(session);
    return query;
  }

  async releaseSeats(
    showtimeId: string,
    seats: string[],
    session?: ClientSession
  ): Promise<IShowtime | null> {
    const query = Showtime.findOneAndUpdate(
      { _id: showtimeId },
      { $pull: { bookedSeats: { $in: seats } } },
      { new: true }
    );
    if (session) query.session(session);
    return query;
  }

  async count(filter: FilterQuery<IShowtime> = {}): Promise<number> {
    return Showtime.countDocuments({ ...filter, isDeleted: false });
  }

  async countUpcomingByStudioName(studioName: string): Promise<number> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return Showtime.countDocuments({
      isDeleted: false,
      studio: studioName,
      date: { $gte: startOfToday },
    });
  }

  async findLatest(limit: number): Promise<IShowtime[]> {
    return Showtime.find({ isDeleted: false })
      .populate('movieId', 'title poster')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async findAvailableDates(startDate: Date, endDate: Date): Promise<string[]> {
    const results = await Showtime.aggregate<{ date: string }>([
      {
        $match: {
          isDeleted: false,
          date: { $gte: startDate, $lte: endDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' },
          },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, date: '$_id' } },
    ]);

    return results.map((row) => row.date);
  }
}

export const showtimeRepository = new ShowtimeRepository();
