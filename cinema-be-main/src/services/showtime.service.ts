import dayjs from 'dayjs';
import { showtimeRepository } from '../repositories/showtime.repository';
import { movieRepository } from '../repositories/movie.repository';
import { cityRepository } from '../repositories/city.repository';
import { cinemaRepository } from '../repositories/cinema.repository';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS } from '../constants';
import { IShowtime } from '../models/Showtime';
import { PaginatedResult } from '../types';
import { getPaginationParams, buildSortOption } from '../helpers';
import { resolveActiveHallForStudio, assertTotalSeatMatchesHall } from '../utils/hallShowtime.util';

export interface CreateShowtimeDto {
  movieId: string;
  studio: string;
  date: string | Date;
  time: string;
  price: number;
  totalSeat: number;
}

export type UpdateShowtimeDto = Partial<CreateShowtimeDto>;

export interface ShowtimeListQuery {
  page?: string;
  limit?: string;
  movieId?: string;
  date?: string;
  sort?: string;
  order?: string;
}

export interface SeatMap {
  totalSeat: number;
  bookedSeats: string[];
  availableCount: number;
}

export interface AvailableDateItem {
  date: string;
  label: string;
}

export interface ShowtimeDatesQuery {
  cityId?: string;
  cinemaId?: string;
  days?: string;
}

const formatDateLabel = (dateStr: string, today: dayjs.Dayjs): string => {
  const date = dayjs(dateStr);
  if (date.isSame(today, 'day')) {
    return `Today, ${date.format('MMM D')}`;
  }
  if (date.isSame(today.add(1, 'day'), 'day')) {
    return `Tomorrow, ${date.format('MMM D')}`;
  }
  return `${date.format('ddd')}, ${date.format('MMM D')}`;
};

export class ShowtimeService {
  async create(dto: CreateShowtimeDto): Promise<IShowtime> {
    const movie = await movieRepository.findById(dto.movieId);
    if (!movie) {
      throw new AppError('Movie not found', HTTP_STATUS.NOT_FOUND);
    }

    if (!movie.isActive) {
      throw new AppError('Cannot create showtime for inactive movie', HTTP_STATUS.BAD_REQUEST);
    }

    const hall = await resolveActiveHallForStudio(dto.studio);
    assertTotalSeatMatchesHall(dto.totalSeat, hall);

    return showtimeRepository.create({
      movieId: dto.movieId as unknown as IShowtime['movieId'],
      studio: hall.name,
      date: new Date(dto.date),
      time: dto.time,
      price: dto.price,
      totalSeat: hall.totalSeats,
      bookedSeats: [],
    });
  }

  async getById(id: string): Promise<IShowtime> {
    const showtime = await showtimeRepository.findById(id);
    if (!showtime) {
      throw new AppError('Showtime not found', HTTP_STATUS.NOT_FOUND);
    }
    return showtime;
  }

  async getAll(query: ShowtimeListQuery): Promise<PaginatedResult<IShowtime>> {
    const { page, limit, skip } = getPaginationParams(query);
    const sort = buildSortOption(query.sort, query.order);

    return showtimeRepository.findAll({
      movieId: query.movieId,
      date: query.date,
      page,
      limit,
      skip,
      sort,
    });
  }

  async getAvailableDates(query: ShowtimeDatesQuery): Promise<AvailableDateItem[]> {
    if (query.cityId) {
      const city = await cityRepository.findById(query.cityId);
      if (!city || !city.isActive) {
        throw new AppError('City not found', HTTP_STATUS.NOT_FOUND, [
          `City with id ${query.cityId} does not exist`,
        ]);
      }
    }

    if (query.cinemaId) {
      const cinema = await cinemaRepository.findById(query.cinemaId);
      if (!cinema || !cinema.isActive) {
        throw new AppError('Cinema not found', HTTP_STATUS.NOT_FOUND, [
          `Cinema with id ${query.cinemaId} does not exist`,
        ]);
      }

      if (query.cityId) {
        const cinemaCityId =
          typeof cinema.cityId === 'object' && cinema.cityId !== null && '_id' in cinema.cityId
            ? String((cinema.cityId as { _id: unknown })._id)
            : String(cinema.cityId);
        if (cinemaCityId !== query.cityId) {
          throw new AppError('Cinema does not belong to the specified city', HTTP_STATUS.BAD_REQUEST);
        }
      }
    }

    const days = Math.min(60, Math.max(1, parseInt(query.days || '7', 10) || 7));
    const today = dayjs().startOf('day');
    const startDate = today.toDate();
    const endDate = today.add(days - 1, 'day').endOf('day').toDate();

    // cityId/cinemaId accepted for API compatibility; showtime↔cinema link is a later phase
    const dates = await showtimeRepository.findAvailableDates(startDate, endDate);

    return dates.map((date) => ({
      date,
      label: formatDateLabel(date, today),
    }));
  }

  async getSeats(id: string): Promise<SeatMap> {
    const showtime = await showtimeRepository.findByIdRaw(id);
    if (!showtime) {
      throw new AppError('Showtime not found', HTTP_STATUS.NOT_FOUND);
    }

    return {
      totalSeat: showtime.totalSeat,
      bookedSeats: showtime.bookedSeats,
      availableCount: showtime.totalSeat - showtime.bookedSeats.length,
    };
  }

  async update(id: string, dto: UpdateShowtimeDto): Promise<IShowtime> {
    const existing = await showtimeRepository.findByIdRaw(id);
    if (!existing) {
      throw new AppError('Showtime not found', HTTP_STATUS.NOT_FOUND);
    }

    if (dto.movieId) {
      const movie = await movieRepository.findById(dto.movieId);
      if (!movie) {
        throw new AppError('Movie not found', HTTP_STATUS.NOT_FOUND);
      }
    }

    if (dto.totalSeat !== undefined && dto.totalSeat < existing.bookedSeats.length) {
      throw new AppError(
        'Total seat cannot be less than currently booked seats',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const studioName = dto.studio ?? existing.studio;
    const hall = await resolveActiveHallForStudio(studioName);
    const totalSeat = dto.totalSeat ?? existing.totalSeat;
    assertTotalSeatMatchesHall(totalSeat, hall);

    const updateData: Record<string, unknown> = { ...dto, studio: hall.name, totalSeat: hall.totalSeats };
    if (dto.date) {
      updateData.date = new Date(dto.date);
    }

    const showtime = await showtimeRepository.update(id, updateData);
    if (!showtime) {
      throw new AppError('Showtime not found', HTTP_STATUS.NOT_FOUND);
    }

    return showtime;
  }

  async delete(id: string): Promise<void> {
    const existing = await showtimeRepository.findByIdRaw(id);
    if (!existing) {
      throw new AppError('Showtime not found', HTTP_STATUS.NOT_FOUND);
    }

    if (existing.bookedSeats.length > 0) {
      throw new AppError(
        'Cannot delete showtime with existing bookings',
        HTTP_STATUS.BAD_REQUEST
      );
    }

    await showtimeRepository.softDelete(id);
  }
}

export const showtimeService = new ShowtimeService();
