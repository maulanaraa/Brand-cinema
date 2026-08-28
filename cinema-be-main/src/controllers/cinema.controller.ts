import { Response, NextFunction } from 'express';
import { cinemaService } from '../services/cinema.service';
import { asyncHandler, AuthenticatedRequest } from '../helpers';
import { sendSuccess } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { UserRole } from '../types';

const isAdminUser = (req: AuthenticatedRequest): boolean => req.user?.role === UserRole.ADMIN;

export const getCinemas = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await cinemaService.getAll(req.query, isAdminUser(req));
    sendSuccess(res, MESSAGES.SUCCESS, result);
  }
);

export const getCinemaById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const cinema = await cinemaService.getById(req.params.id, isAdminUser(req));
    sendSuccess(res, MESSAGES.SUCCESS, cinema);
  }
);

export const createCinema = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const cinema = await cinemaService.create(req.body);
    sendSuccess(res, MESSAGES.CINEMA_CREATED, cinema, HTTP_STATUS.CREATED);
  }
);

export const updateCinema = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const cinema = await cinemaService.update(req.params.id, req.body);
    sendSuccess(res, MESSAGES.UPDATED, cinema);
  }
);

export const deleteCinema = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    await cinemaService.delete(req.params.id);
    sendSuccess(res, MESSAGES.CINEMA_DELETED, null);
  }
);
