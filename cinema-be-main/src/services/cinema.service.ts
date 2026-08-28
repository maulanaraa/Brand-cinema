import { cinemaRepository } from '../repositories/cinema.repository';
import { cityRepository } from '../repositories/city.repository';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { ICinema } from '../models/Cinema';
import { PaginatedResult } from '../types';
import { getPaginationParams } from '../helpers';

export interface CreateCinemaDto {
  name: string;
  cityId: string;
  address?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateCinemaDto = Partial<CreateCinemaDto>;

export interface CinemaListQuery {
  page?: string;
  limit?: string;
  search?: string;
  cityId?: string;
  sort?: string;
  order?: string;
  isActive?: string;
}

/** Shape returned to clients: cityId as string + nested city object */
export interface CinemaResponse {
  _id: unknown;
  name: string;
  cityId: string;
  city: {
    _id: unknown;
    name: string;
    slug: string;
    isActive: boolean;
  } | null;
  address?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const buildCinemaSort = (sort?: string, order?: string): Record<string, 1 | -1> => {
  const allowedSortFields = ['name', 'sortOrder', 'createdAt'];
  const field = sort && allowedSortFields.includes(sort) ? sort : 'sortOrder';
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

const toCinemaResponse = (cinema: ICinema): CinemaResponse => {
  const populated = cinema.cityId as unknown as {
    _id?: unknown;
    name?: string;
    slug?: string;
    isActive?: boolean;
  } | null;

  const cityIdValue =
    populated && typeof populated === 'object' && populated._id != null
      ? String(populated._id)
      : String(cinema.cityId);

  const city =
    populated && typeof populated === 'object' && populated.name
      ? {
          _id: populated._id,
          name: populated.name,
          slug: populated.slug ?? '',
          isActive: populated.isActive ?? true,
        }
      : null;

  return {
    _id: cinema._id,
    name: cinema.name,
    cityId: cityIdValue,
    city,
    address: cinema.address,
    isActive: cinema.isActive,
    sortOrder: cinema.sortOrder,
    createdAt: cinema.createdAt,
    updatedAt: cinema.updatedAt,
  };
};

export class CinemaService {
  async create(dto: CreateCinemaDto): Promise<CinemaResponse> {
    const city = await cityRepository.findById(dto.cityId);
    if (!city) {
      throw new AppError('City not found', HTTP_STATUS.NOT_FOUND, [
        `City with id ${dto.cityId} does not exist`,
      ]);
    }

    const name = dto.name.trim();
    const duplicate = await cinemaRepository.findByNameInCity(name, dto.cityId);
    if (duplicate) {
      throw new AppError('Cinema name already exists in this city', HTTP_STATUS.CONFLICT);
    }

    const cinema = await cinemaRepository.create({
      name,
      cityId: dto.cityId as unknown as ICinema['cityId'],
      address: dto.address?.trim() ?? '',
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });

    return toCinemaResponse(cinema);
  }

  async getById(id: string, isAdmin: boolean): Promise<CinemaResponse> {
    const cinema = await cinemaRepository.findById(id);

    if (!cinema || (!isAdmin && !cinema.isActive)) {
      throw new AppError('Cinema not found', HTTP_STATUS.NOT_FOUND);
    }

    return toCinemaResponse(cinema);
  }

  async getAll(
    query: CinemaListQuery,
    isAdmin: boolean
  ): Promise<PaginatedResult<CinemaResponse>> {
    const { page, limit, skip } = getPaginationParams(query);
    const sort = buildCinemaSort(query.sort, query.order);
    const isActive = resolveIsActiveFilter(query.isActive, isAdmin);

    if (query.cityId) {
      const city = await cityRepository.findById(query.cityId);
      if (!city || (!isAdmin && !city.isActive)) {
        throw new AppError('City not found', HTTP_STATUS.NOT_FOUND, [
          `City with id ${query.cityId} does not exist`,
        ]);
      }
    }

    const result = await cinemaRepository.findAll({
      search: query.search,
      cityId: query.cityId,
      isActive,
      page,
      limit,
      skip,
      sort,
    });

    return {
      items: result.items.map(toCinemaResponse),
      pagination: result.pagination,
    };
  }

  async update(id: string, dto: UpdateCinemaDto): Promise<CinemaResponse> {
    const existing = await cinemaRepository.findById(id);
    if (!existing) {
      throw new AppError('Cinema not found', HTTP_STATUS.NOT_FOUND);
    }

    const cityId =
      dto.cityId ??
      (typeof existing.cityId === 'object' && existing.cityId !== null && '_id' in existing.cityId
        ? String((existing.cityId as { _id: unknown })._id)
        : String(existing.cityId));

    if (dto.cityId) {
      const city = await cityRepository.findById(dto.cityId);
      if (!city) {
        throw new AppError('City not found', HTTP_STATUS.NOT_FOUND, [
          `City with id ${dto.cityId} does not exist`,
        ]);
      }
    }

    if (dto.name) {
      const duplicate = await cinemaRepository.findByNameInCity(dto.name.trim(), cityId, id);
      if (duplicate) {
        throw new AppError('Cinema name already exists in this city', HTTP_STATUS.CONFLICT);
      }
    }

    const cinema = await cinemaRepository.update(id, {
      ...dto,
      ...(dto.name ? { name: dto.name.trim() } : {}),
      ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
    });

    if (!cinema) {
      throw new AppError('Cinema not found', HTTP_STATUS.NOT_FOUND);
    }

    return toCinemaResponse(cinema);
  }

  async delete(id: string): Promise<void> {
    const cinema = await cinemaRepository.findById(id);
    if (!cinema) {
      throw new AppError('Cinema not found', HTTP_STATUS.NOT_FOUND);
    }

    const deleted = await cinemaRepository.deleteById(id);
    if (!deleted) {
      throw new AppError('Cinema not found', HTTP_STATUS.NOT_FOUND);
    }
  }
}

export const cinemaService = new CinemaService();
