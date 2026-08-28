import { Response, NextFunction } from 'express';
import { movieService } from '../services/movie.service';
import { tmdbService } from '../services/tmdb.service';
import { AuthenticatedRequest, asyncHandler } from '../helpers';
import { sendSuccess } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';

export const getMovies = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await movieService.getAll(req.query);
    sendSuccess(res, MESSAGES.SUCCESS, result);
  }
);

export const getMovieById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const movie = await movieService.getById(req.params.id);
    sendSuccess(res, MESSAGES.SUCCESS, movie);
  }
);

export const createMovie = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const movie = await movieService.create(req.body);
    sendSuccess(res, MESSAGES.CREATED, movie, HTTP_STATUS.CREATED);
  }
);

export const updateMovie = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const movie = await movieService.update(req.params.id, req.body);
    sendSuccess(res, MESSAGES.UPDATED, movie);
  }
);

export const deleteMovie = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    await movieService.delete(req.params.id);
    sendSuccess(res, MESSAGES.DELETED, null);
  }
);

export const searchTmdbMovies = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await tmdbService.searchMovies(
      String(req.query.q),
      parseInt(String(req.query.page || '1'), 10)
    );
    sendSuccess(res, MESSAGES.SUCCESS, result);
  }
);

export const getTmdbMovieImport = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const data = await tmdbService.getMovieImportData(parseInt(req.params.tmdbId, 10));
    sendSuccess(res, MESSAGES.SUCCESS, data);
  }
);

export const getTmdbGenres = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const genres = await tmdbService.getGenres();
    sendSuccess(res, MESSAGES.SUCCESS, genres);
  }
);

export const syncIndonesiaMovies = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await tmdbService.syncIndonesiaMovies();
    sendSuccess(res, 'Berhasil menyinkronkan film bioskop Indonesia terkini dari TMDB', result);
  }
);

