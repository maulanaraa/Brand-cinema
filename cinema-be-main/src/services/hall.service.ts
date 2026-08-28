import { hallRepository } from '../repositories/hall.repository';
import { showtimeRepository } from '../repositories/showtime.repository';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { IHall } from '../models/Hall';
import { PaginatedResult } from '../types';
import { getPaginationParams } from '../helpers';

export interface CreateHallDto {
  name: string;
  totalSeats: number;
  layoutRows: number;
  layoutColumns: number;
  isActive?: boolean;
}

export type UpdateHallDto = Partial<CreateHallDto>;

export interface HallListQuery {
  page?: string;
  limit?: string;
  search?: string;
  sort?: string;
  order?: string;
  isActive?: string;
}

const buildHallSort = (sort?: string, order?: string): Record<string, 1 | -1> => {
  const allowedSortFields = ['name', 'totalSeats', 'createdAt'];
  const field = sort && allowedSortFields.includes(sort) ? sort : 'name';
  const direction: 1 | -1 = order === 'desc' ? -1 : 1;
  return { [field]: direction };
};

const resolveIsActiveFilter = (
  queryIsActive: string | undefined,
  isAdmin: boolean
): boolean | undefined => {
  const value = queryIsActive ?? 'true';

  if (value === 'all') {
    if (!isAdmin) {
      throw new AppError(MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }
    return undefined;
  }

  if (value === 'false') {
    if (!isAdmin) {
      throw new AppError(MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
    }
    return false;
  }

  if (value !== 'true') {
    throw new AppError('isActive must be true, false, or all', HTTP_STATUS.BAD_REQUEST);
  }

  return true;
};

const assertLayoutConsistent = (layoutRows: number, layoutColumns: number, totalSeats: number): void => {
  if (totalSeats !== layoutRows * layoutColumns) {
    throw new AppError(
      'totalSeats must equal layoutRows × layoutColumns',
      HTTP_STATUS.BAD_REQUEST,
      ['totalSeats must equal layoutRows × layoutColumns']
    );
  }
};

export class HallService {
  async create(dto: CreateHallDto): Promise<IHall> {
    assertLayoutConsistent(dto.layoutRows, dto.layoutColumns, dto.totalSeats);

    const duplicate = await hallRepository.findByName(dto.name.trim());
    if (duplicate) {
      throw new AppError('Hall name already exists', HTTP_STATUS.CONFLICT);
    }

    return hallRepository.create({
      name: dto.name.trim(),
      totalSeats: dto.totalSeats,
      layoutRows: dto.layoutRows,
      layoutColumns: dto.layoutColumns,
      isActive: dto.isActive ?? true,
    });
  }

  async getById(id: string, isAdmin: boolean): Promise<IHall> {
    const hall = await hallRepository.findById(id);

    if (!hall || (!isAdmin && !hall.isActive)) {
      throw new AppError('Hall not found', HTTP_STATUS.NOT_FOUND);
    }

    return hall;
  }

  async getAll(query: HallListQuery, isAdmin: boolean): Promise<PaginatedResult<IHall>> {
    const { page, limit, skip } = getPaginationParams(query);
    const sort = buildHallSort(query.sort, query.order);
    const isActive = resolveIsActiveFilter(query.isActive, isAdmin);

    return hallRepository.findAll({
      search: query.search,
      isActive,
      page,
      limit,
      skip,
      sort,
    });
  }

  async update(id: string, dto: UpdateHallDto): Promise<IHall> {
    const existing = await hallRepository.findById(id);
    if (!existing) {
      throw new AppError('Hall not found', HTTP_STATUS.NOT_FOUND);
    }

    const layoutRows = dto.layoutRows ?? existing.layoutRows;
    const layoutColumns = dto.layoutColumns ?? existing.layoutColumns;
    const totalSeats = dto.totalSeats ?? existing.totalSeats;
    assertLayoutConsistent(layoutRows, layoutColumns, totalSeats);

    if (dto.name) {
      const duplicate = await hallRepository.findByName(dto.name.trim(), id);
      if (duplicate) {
        throw new AppError('Hall name already exists', HTTP_STATUS.CONFLICT);
      }
    }

    const hall = await hallRepository.update(id, {
      ...dto,
      ...(dto.name ? { name: dto.name.trim() } : {}),
    });

    if (!hall) {
      throw new AppError('Hall not found', HTTP_STATUS.NOT_FOUND);
    }

    return hall;
  }

  async delete(id: string): Promise<void> {
    const hall = await hallRepository.findById(id);
    if (!hall) {
      throw new AppError('Hall not found', HTTP_STATUS.NOT_FOUND);
    }

    const upcomingShowtimes = await showtimeRepository.countUpcomingByStudioName(hall.name);
    if (upcomingShowtimes > 0) {
      throw new AppError('Cannot delete hall with existing showtimes', HTTP_STATUS.CONFLICT);
    }

    const deleted = await hallRepository.deleteById(id);
    if (!deleted) {
      throw new AppError('Hall not found', HTTP_STATUS.NOT_FOUND);
    }
  }
}

export const hallService = new HallService();
