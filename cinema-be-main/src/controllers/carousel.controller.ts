import { Response, NextFunction } from 'express';
import { carouselService } from '../services/carousel.service';
import { asyncHandler, AuthenticatedRequest } from '../helpers';
import { sendSuccess } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { UserRole } from '../types';

const isAdminUser = (req: AuthenticatedRequest): boolean => req.user?.role === UserRole.ADMIN;

export const getActiveCarousel = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await carouselService.getActive();
    sendSuccess(res, MESSAGES.SUCCESS, result);
  }
);

export const getCarouselItems = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await carouselService.getAll(req.query, isAdminUser(req));
    sendSuccess(res, MESSAGES.SUCCESS, result);
  }
);

export const getCarouselById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const item = await carouselService.getById(req.params.id);
    sendSuccess(res, MESSAGES.SUCCESS, item);
  }
);

export const createCarousel = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const item = await carouselService.create(req.body);
    sendSuccess(res, MESSAGES.CAROUSEL_CREATED, item, HTTP_STATUS.CREATED);
  }
);

export const updateCarousel = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const item = await carouselService.update(req.params.id, req.body);
    sendSuccess(res, MESSAGES.UPDATED, item);
  }
);

export const deleteCarousel = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    await carouselService.delete(req.params.id);
    sendSuccess(res, MESSAGES.CAROUSEL_DELETED, null);
  }
);

export const reorderCarousel = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await carouselService.reorder(req.body.orderedIds);
    sendSuccess(res, MESSAGES.UPDATED, result);
  }
);
