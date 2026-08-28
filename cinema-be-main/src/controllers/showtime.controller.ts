import { Response, NextFunction } from 'express';
import { showtimeService } from '../services/showtime.service';
import { AuthenticatedRequest, asyncHandler } from '../helpers';
import { sendSuccess } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';

export const getShowtimes = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await showtimeService.getAll(req.query);
    sendSuccess(res, MESSAGES.SUCCESS, result);
  }
);

export const getShowtimeById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const showtime = await showtimeService.getById(req.params.id);
    sendSuccess(res, MESSAGES.SUCCESS, showtime);
  }
);

export const getShowtimeSeats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const seats = await showtimeService.getSeats(req.params.id);
    sendSuccess(res, MESSAGES.SUCCESS, seats);
  }
);

export const getAvailableDates = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const dates = await showtimeService.getAvailableDates(req.query);
    sendSuccess(res, MESSAGES.SUCCESS, dates);
  }
);

export const createShowtime = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const showtime = await showtimeService.create(req.body);
    sendSuccess(res, MESSAGES.CREATED, showtime, HTTP_STATUS.CREATED);
  }
);

export const updateShowtime = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const showtime = await showtimeService.update(req.params.id, req.body);
    sendSuccess(res, MESSAGES.UPDATED, showtime);
  }
);

export const deleteShowtime = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    await showtimeService.delete(req.params.id);
    sendSuccess(res, MESSAGES.DELETED, null);
  }
);
