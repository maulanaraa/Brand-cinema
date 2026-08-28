import { carouselRepository } from '../repositories/carousel.repository';
import { movieRepository } from '../repositories/movie.repository';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { CarouselType, ICarousel } from '../models/Carousel';
import { IMovie } from '../models/Movie';
import { PaginatedResult } from '../types';
import { getPaginationParams } from '../helpers';
import { env } from '../config/env';
import { normalizeImageUrl, resolvePublicImageUrl } from '../utils/imageUrl.util';

export interface CreateCarouselDto {
  type: CarouselType;
  title: string;
  description?: string;
  imageUrl: string;
  linkUrl?: string;
  movieId?: string | null;
  isActive?: boolean;
  order?: number;
}

export type UpdateCarouselDto = Partial<CreateCarouselDto>;

export interface CarouselListQuery {
  page?: string;
  limit?: string;
  search?: string;
  type?: string;
  sort?: string;
  order?: string;
  isActive?: string;
}

export interface CarouselMovieResponse {
  _id: unknown;
  title: string;
  poster: string;
  isActive: boolean;
  releaseDate: Date;
  genre: string;
  duration: number;
  rating: number;
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CarouselResponse {
  _id: unknown;
  type: CarouselType;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  movieId: string | null;
  movie: CarouselMovieResponse | null;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const buildCarouselSort = (sort?: string, order?: string): Record<string, 1 | -1> => {
  const allowedSortFields = ['order', 'createdAt', 'title'];
  const field = sort && allowedSortFields.includes(sort) ? sort : 'order';
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

const isRelativeOrDataImageUrl = (value: string): boolean =>
  value.startsWith('/') || value.startsWith('data:image/');

const normalizeCarouselImageUrl = (value: string): string => {
  const trimmed = value.trim();

  if (isRelativeOrDataImageUrl(trimmed)) {
    return trimmed;
  }

  try {
    return normalizeImageUrl(trimmed);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Invalid image URL',
      HTTP_STATUS.BAD_REQUEST
    );
  }
};

const resolveCarouselImageUrl = (value: string): string => {
  if (!value || isRelativeOrDataImageUrl(value)) {
    if (value.startsWith('/') && env.apiUrl) {
      return `${env.apiUrl.replace(/\/$/, '')}${value}`;
    }
    return value;
  }

  return resolvePublicImageUrl(value, env.apiUrl);
};

const toMovieResponse = (movie: IMovie | null | undefined): CarouselMovieResponse | null => {
  if (!movie || !movie._id || movie.isDeleted) {
    return null;
  }

  return {
    _id: movie._id,
    title: movie.title,
    poster: resolvePublicImageUrl(movie.poster, env.apiUrl),
    isActive: movie.isActive,
    releaseDate: movie.releaseDate,
    genre: movie.genre,
    duration: movie.duration,
    rating: movie.rating,
    language: movie.language,
    createdAt: movie.createdAt,
    updatedAt: movie.updatedAt,
  };
};

const toCarouselResponse = (item: ICarousel): CarouselResponse => {
  const populated = item.movieId as unknown as (IMovie & { _id?: unknown }) | null;

  const movieIdValue =
    populated && typeof populated === 'object' && populated._id != null
      ? String(populated._id)
      : item.movieId
        ? String(item.movieId)
        : null;

  const movie =
    populated && typeof populated === 'object' && 'title' in populated
      ? toMovieResponse(populated as IMovie)
      : null;

  return {
    _id: item._id,
    type: item.type,
    title: item.title,
    description: item.description ?? '',
    imageUrl: resolveCarouselImageUrl(item.imageUrl),
    linkUrl: item.linkUrl ?? '',
    movieId: movieIdValue,
    movie,
    isActive: item.isActive,
    order: item.order,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
};

const normalizeInput = <T extends { imageUrl?: string; movieId?: string | null }>(dto: T): T => {
  const next = { ...dto };

  if (next.imageUrl) {
    next.imageUrl = normalizeCarouselImageUrl(next.imageUrl);
  }

  if (next.movieId === '') {
    next.movieId = null;
  }

  return next;
};

const assertMovieExistsIfProvided = async (movieId: string | null | undefined): Promise<void> => {
  if (!movieId) {
    return;
  }

  const movie = await movieRepository.findById(movieId);
  if (!movie) {
    throw new AppError('Movie not found', HTTP_STATUS.BAD_REQUEST);
  }
};

export class CarouselService {
  async getActive(): Promise<{ items: CarouselResponse[] }> {
    const items = await carouselRepository.findActive();
    return { items: items.map(toCarouselResponse) };
  }

  async getAll(
    query: CarouselListQuery,
    isAdmin: boolean
  ): Promise<PaginatedResult<CarouselResponse>> {
    const { page, limit, skip } = getPaginationParams({
      page: query.page,
      limit: query.limit ?? '20',
    });
    const sort = buildCarouselSort(query.sort, query.order);
    const isActive = resolveIsActiveFilter(query.isActive, isAdmin);

    const result = await carouselRepository.findAll({
      search: query.search,
      type: query.type,
      isActive,
      page,
      limit,
      skip,
      sort,
    });

    return {
      ...result,
      items: result.items.map(toCarouselResponse),
    };
  }

  async getById(id: string): Promise<CarouselResponse> {
    const item = await carouselRepository.findById(id);
    if (!item) {
      throw new AppError('Carousel item not found', HTTP_STATUS.NOT_FOUND);
    }
    return toCarouselResponse(item);
  }

  async create(dto: CreateCarouselDto): Promise<CarouselResponse> {
    const normalized = normalizeInput(dto);
    await assertMovieExistsIfProvided(normalized.movieId);

    const created = await carouselRepository.create({
      type: normalized.type,
      title: normalized.title,
      description: normalized.description ?? '',
      imageUrl: normalized.imageUrl,
      linkUrl: normalized.linkUrl ?? '',
      movieId: (normalized.movieId || null) as ICarousel['movieId'],
      isActive: normalized.isActive ?? true,
      order: normalized.order ?? 1,
    });

    return toCarouselResponse(created);
  }

  async update(id: string, dto: UpdateCarouselDto): Promise<CarouselResponse> {
    const existing = await carouselRepository.findById(id);
    if (!existing) {
      throw new AppError('Carousel item not found', HTTP_STATUS.NOT_FOUND);
    }

    const normalized = normalizeInput(dto);
    if (normalized.movieId !== undefined) {
      await assertMovieExistsIfProvided(normalized.movieId);
    }

    const updated = await carouselRepository.update(id, {
      ...normalized,
      ...(normalized.movieId !== undefined
        ? { movieId: (normalized.movieId || null) as ICarousel['movieId'] }
        : {}),
    });
    if (!updated) {
      throw new AppError('Carousel item not found', HTTP_STATUS.NOT_FOUND);
    }

    return toCarouselResponse(updated);
  }

  async delete(id: string): Promise<void> {
    const deleted = await carouselRepository.deleteById(id);
    if (!deleted) {
      throw new AppError('Carousel item not found', HTTP_STATUS.NOT_FOUND);
    }
  }

  async reorder(orderedIds: string[]): Promise<{ items: CarouselResponse[] }> {
    if (!orderedIds.length) {
      throw new AppError('orderedIds cannot be empty', HTTP_STATUS.BAD_REQUEST);
    }

    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      throw new AppError('orderedIds must be unique', HTTP_STATUS.BAD_REQUEST);
    }

    const found = await Promise.all(orderedIds.map((id) => carouselRepository.findById(id)));
    const missing = orderedIds.filter((_, index) => !found[index]);
    if (missing.length) {
      throw new AppError(`Carousel item(s) not found: ${missing.join(', ')}`, HTTP_STATUS.NOT_FOUND);
    }

    const items = await carouselRepository.reorder(orderedIds);
    return { items: items.map(toCarouselResponse) };
  }
}

export const carouselService = new CarouselService();
