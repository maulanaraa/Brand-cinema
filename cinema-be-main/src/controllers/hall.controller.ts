import { Response, NextFunction } from 'express';
import { hallService } from '../services/hall.service';
import { asyncHandler, AuthenticatedRequest } from '../helpers';
import { sendSuccess } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { UserRole } from '../types';

const isAdminUser = (req: AuthenticatedRequest): boolean => req.user?.role === UserRole.ADMIN;

export const getHalls = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await hallService.getAll(req.query, isAdminUser(req));
    sendSuccess(res, MESSAGES.SUCCESS, result);
  }
);

export const getHallById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const hall = await hallService.getById(req.params.id, isAdminUser(req));
    sendSuccess(res, MESSAGES.SUCCESS, hall);
  }
);

export const createHall = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const hall = await hallService.create(req.body);
    sendSuccess(res, MESSAGES.HALL_CREATED, hall, HTTP_STATUS.CREATED);
  }
);

export const updateHall = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const hall = await hallService.update(req.params.id, req.body);
    sendSuccess(res, MESSAGES.UPDATED, hall);
  }
);

export const deleteHall = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    await hallService.delete(req.params.id);
    sendSuccess(res, MESSAGES.HALL_DELETED, null);
  }
);
