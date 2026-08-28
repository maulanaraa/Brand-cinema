import { Response, NextFunction } from 'express';
import { cityService } from '../services/city.service';
import { asyncHandler, AuthenticatedRequest } from '../helpers';
import { sendSuccess } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { UserRole } from '../types';

const isAdminUser = (req: AuthenticatedRequest): boolean => req.user?.role === UserRole.ADMIN;

export const getCities = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await cityService.getAll(req.query, isAdminUser(req));
    sendSuccess(res, MESSAGES.SUCCESS, result);
  }
);

export const getCityById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const city = await cityService.getById(req.params.id, isAdminUser(req));
    sendSuccess(res, MESSAGES.SUCCESS, city);
  }
);

export const createCity = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const city = await cityService.create(req.body);
    sendSuccess(res, MESSAGES.CITY_CREATED, city, HTTP_STATUS.CREATED);
  }
);

export const updateCity = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const city = await cityService.update(req.params.id, req.body);
    sendSuccess(res, MESSAGES.UPDATED, city);
  }
);

export const deleteCity = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    await cityService.delete(req.params.id);
    sendSuccess(res, MESSAGES.CITY_DELETED, null);
  }
);
