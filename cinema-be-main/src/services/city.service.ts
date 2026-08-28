import { cityRepository } from '../repositories/city.repository';
import { cinemaRepository } from '../repositories/cinema.repository';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { ICity } from '../models/City';
import { PaginatedResult } from '../types';
import { getPaginationParams } from '../helpers';

export interface CreateCityDto {
  name: string;
  slug?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateCityDto = Partial<CreateCityDto>;

export interface CityListQuery {
  page?: string;
  limit?: string;
  search?: string;
  sort?: string;
  order?: string;
  isActive?: string;
}

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildCitySort = (sort?: string, order?: string): Record<string, 1 | -1> => {
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

export class CityService {
  async create(dto: CreateCityDto): Promise<ICity> {
    const name = dto.name.trim();
    const slug = (dto.slug?.trim() ? slugify(dto.slug) : slugify(name)) || 'city';

    const duplicateName = await cityRepository.findByName(name);
    if (duplicateName) {
      throw new AppError('City name already exists', HTTP_STATUS.CONFLICT);
    }

    const duplicateSlug = await cityRepository.findBySlug(slug);
    if (duplicateSlug) {
      throw new AppError('City slug already exists', HTTP_STATUS.CONFLICT);
    }

    return cityRepository.create({
      name,
      slug,
      isActive: dto.isActive ?? true,
      sortOrder: dto.sortOrder ?? 0,
    });
  }

  async getById(id: string, isAdmin: boolean): Promise<ICity> {
    const city = await cityRepository.findById(id);

    if (!city || (!isAdmin && !city.isActive)) {
      throw new AppError('City not found', HTTP_STATUS.NOT_FOUND);
    }

    return city;
  }

  async getAll(query: CityListQuery, isAdmin: boolean): Promise<PaginatedResult<ICity>> {
    const { page, limit, skip } = getPaginationParams(query);
    const sort = buildCitySort(query.sort, query.order);
    const isActive = resolveIsActiveFilter(query.isActive, isAdmin);

    return cityRepository.findAll({
      search: query.search,
      isActive,
      page,
      limit,
      skip,
      sort,
    });
  }

  async update(id: string, dto: UpdateCityDto): Promise<ICity> {
    const existing = await cityRepository.findById(id);
    if (!existing) {
      throw new AppError('City not found', HTTP_STATUS.NOT_FOUND);
    }

    const updateData: Record<string, unknown> = { ...dto };

    if (dto.name) {
      const name = dto.name.trim();
      const duplicate = await cityRepository.findByName(name, id);
      if (duplicate) {
        throw new AppError('City name already exists', HTTP_STATUS.CONFLICT);
      }
      updateData.name = name;
    }

    if (dto.slug !== undefined || dto.name) {
      const slugSource = dto.slug?.trim() || (dto.name ? dto.name.trim() : existing.name);
      const slug = slugify(slugSource) || existing.slug;
      const duplicateSlug = await cityRepository.findBySlug(slug, id);
      if (duplicateSlug) {
        throw new AppError('City slug already exists', HTTP_STATUS.CONFLICT);
      }
      updateData.slug = slug;
    }

    const city = await cityRepository.update(id, updateData);
    if (!city) {
      throw new AppError('City not found', HTTP_STATUS.NOT_FOUND);
    }

    return city;
  }

  async delete(id: string): Promise<void> {
    const city = await cityRepository.findById(id);
    if (!city) {
      throw new AppError('City not found', HTTP_STATUS.NOT_FOUND);
    }

    const activeCinemas = await cinemaRepository.countByCityId(id, true);
    if (activeCinemas > 0) {
      throw new AppError(
        'Cannot delete city with active cinemas',
        HTTP_STATUS.CONFLICT,
        [`City still has ${activeCinemas} active cinema(s)`]
      );
    }

    const deleted = await cityRepository.deleteById(id);
    if (!deleted) {
      throw new AppError('City not found', HTTP_STATUS.NOT_FOUND);
    }
  }
}

export const cityService = new CityService();
