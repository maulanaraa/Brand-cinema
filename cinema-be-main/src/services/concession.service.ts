import { concessionRepository } from '../repositories/concession.repository';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { ConcessionCategory, IConcession } from '../models/Concession';
import { PaginatedResult } from '../types';
import { getPaginationParams } from '../helpers';
import { env } from '../config/env';
import { normalizeImageUrl, resolvePublicImageUrl } from '../utils/imageUrl.util';

export interface CreateConcessionDto {
  name: string;
  description: string;
  price: number;
  category: ConcessionCategory;
  imageUrl: string;
  badge?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export type UpdateConcessionDto = Partial<CreateConcessionDto>;

export interface ConcessionListQuery {
  page?: string;
  limit?: string;
  search?: string;
  category?: string;
  sort?: string;
  order?: string;
  isActive?: string;
}

const buildConcessionSort = (sort?: string, order?: string): Record<string, 1 | -1> => {
  const allowedSortFields = ['sortOrder', 'name', 'price', 'createdAt'];
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

const mapConcession = (concession: IConcession): IConcession => {
  const plain =
    typeof (concession as IConcession & { toObject?: () => IConcession }).toObject === 'function'
      ? (concession as IConcession & { toObject: () => IConcession }).toObject()
      : concession;

  return {
    ...plain,
    imageUrl: resolvePublicImageUrl(plain.imageUrl, env.apiUrl),
  };
};

const normalizeConcessionInput = <T extends { imageUrl?: string }>(dto: T): T => {
  if (!dto.imageUrl) {
    return dto;
  }

  try {
    return {
      ...dto,
      imageUrl: normalizeImageUrl(dto.imageUrl),
    };
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Invalid image URL',
      HTTP_STATUS.BAD_REQUEST
    );
  }
};

export class ConcessionService {
  async create(dto: CreateConcessionDto): Promise<IConcession> {
    const normalized = normalizeConcessionInput(dto);
    const created = await concessionRepository.create({
      name: normalized.name,
      description: normalized.description,
      price: normalized.price,
      category: normalized.category,
      imageUrl: normalized.imageUrl,
      badge: normalized.badge ?? '',
      isActive: normalized.isActive ?? true,
      sortOrder: normalized.sortOrder ?? 0,
    });
    return mapConcession(created);
  }

  async getById(id: string, isAdmin: boolean): Promise<IConcession> {
    const concession = await concessionRepository.findById(id);

    if (!concession || (!isAdmin && !concession.isActive)) {
      throw new AppError('Concession not found', HTTP_STATUS.NOT_FOUND);
    }

    return mapConcession(concession);
  }

  async getAll(query: ConcessionListQuery, isAdmin: boolean): Promise<PaginatedResult<IConcession>> {
    const { page, limit, skip } = getPaginationParams(query);
    const sort = buildConcessionSort(query.sort, query.order);
    const isActive = resolveIsActiveFilter(query.isActive, isAdmin);

    const result = await concessionRepository.findAll({
      search: query.search,
      category: query.category,
      isActive,
      page,
      limit,
      skip,
      sort,
    });

    return {
      ...result,
      items: result.items.map(mapConcession),
    };
  }

  async update(id: string, dto: UpdateConcessionDto): Promise<IConcession> {
    const existing = await concessionRepository.findById(id);
    if (!existing) {
      throw new AppError('Concession not found', HTTP_STATUS.NOT_FOUND);
    }

    const normalized = normalizeConcessionInput(dto);
    const concession = await concessionRepository.update(id, normalized);
    if (!concession) {
      throw new AppError('Concession not found', HTTP_STATUS.NOT_FOUND);
    }

    return mapConcession(concession);
  }

  async delete(id: string): Promise<void> {
    const concession = await concessionRepository.deleteById(id);
    if (!concession) {
      throw new AppError('Concession not found', HTTP_STATUS.NOT_FOUND);
    }
  }
}

export const concessionService = new ConcessionService();
