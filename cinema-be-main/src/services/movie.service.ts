import { movieRepository } from '../repositories/movie.repository';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS } from '../constants';
import { IMovie } from '../models/Movie';
import { MovieStatus, PaginatedResult } from '../types';
import { getPaginationParams, buildSortOption } from '../helpers';

export interface CreateMovieDto {
  title: string;
  genre: string;
  description: string;
  duration: number;
  rating?: number;
  poster?: string;
  trailerUrl?: string;
  language: string;
  releaseDate: string | Date;
  status?: MovieStatus;
  isActive?: boolean;
  tmdbId?: number;
}

export type UpdateMovieDto = Partial<CreateMovieDto>;

export interface MovieListQuery {
  page?: string;
  limit?: string;
  search?: string;
  genre?: string;
  sort?: string;
  order?: string;
  isActive?: string;
  status?: string;
}

const resolveMovieStatus = (
  status: MovieStatus | undefined,
  releaseDate: string | Date
): MovieStatus => {
  if (status === MovieStatus.NOW_PLAYING || status === MovieStatus.COMING_SOON) {
    return status;
  }

  const release = new Date(releaseDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  release.setHours(0, 0, 0, 0);

  return release > today ? MovieStatus.COMING_SOON : MovieStatus.NOW_PLAYING;
};

export class MovieService {
  async create(dto: CreateMovieDto): Promise<IMovie> {
    const movieData: Partial<IMovie> = {
      title: dto.title,
      genre: dto.genre,
      description: dto.description,
      duration: dto.duration,
      rating: dto.rating ?? 0,
      poster: dto.poster ?? '',
      trailerUrl: dto.trailerUrl ?? '',
      language: dto.language,
      releaseDate: new Date(dto.releaseDate),
      status: resolveMovieStatus(dto.status, dto.releaseDate),
      isActive: dto.isActive ?? true,
      tmdbId: dto.tmdbId,
    };

    return movieRepository.create(movieData);
  }

  async getById(id: string): Promise<IMovie> {
    const movie = await movieRepository.findById(id);
    if (!movie) {
      throw new AppError('Movie not found', HTTP_STATUS.NOT_FOUND);
    }
    return movie;
  }

  async getAll(query: MovieListQuery): Promise<PaginatedResult<IMovie>> {
    const { page, limit, skip } = getPaginationParams(query);
    const sort = buildSortOption(query.sort, query.order);

    let isActive: boolean | undefined;
    if (query.isActive === 'true') isActive = true;
    if (query.isActive === 'false') isActive = false;

    let status: MovieStatus | undefined;
    if (query.status === MovieStatus.NOW_PLAYING || query.status === MovieStatus.COMING_SOON) {
      status = query.status;
    }

    return movieRepository.findAll({
      search: query.search,
      genre: query.genre,
      isActive,
      status,
      page,
      limit,
      skip,
      sort,
    });
  }

  async update(id: string, dto: UpdateMovieDto): Promise<IMovie> {
    const existing = await movieRepository.findById(id);
    if (!existing) {
      throw new AppError('Movie not found', HTTP_STATUS.NOT_FOUND);
    }

    const updateData: Record<string, unknown> = { ...dto };

    if (dto.releaseDate) {
      updateData.releaseDate = new Date(dto.releaseDate);
    }

    if (dto.status !== undefined || dto.releaseDate !== undefined) {
      updateData.status = resolveMovieStatus(
        dto.status ?? existing.status,
        dto.releaseDate ?? existing.releaseDate
      );
    }

    const movie = await movieRepository.update(id, updateData);
    if (!movie) {
      throw new AppError('Movie not found', HTTP_STATUS.NOT_FOUND);
    }

    return movie;
  }

  async delete(id: string): Promise<void> {
    const movie = await movieRepository.softDelete(id);
    if (!movie) {
      throw new AppError('Movie not found', HTTP_STATUS.NOT_FOUND);
    }
  }
}

export const movieService = new MovieService();
