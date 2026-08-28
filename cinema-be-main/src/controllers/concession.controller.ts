import { Response, NextFunction } from 'express';
import { concessionService } from '../services/concession.service';
import { asyncHandler, AuthenticatedRequest } from '../helpers';
import { sendSuccess } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { UserRole } from '../types';

const isAdminUser = (req: AuthenticatedRequest): boolean => req.user?.role === UserRole.ADMIN;

export const getConcessions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await concessionService.getAll(req.query, isAdminUser(req));
    sendSuccess(res, MESSAGES.SUCCESS, result);
  }
);

export const getConcessionById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const concession = await concessionService.getById(req.params.id, isAdminUser(req));
    sendSuccess(res, MESSAGES.SUCCESS, concession);
  }
);

export const createConcession = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const concession = await concessionService.create(req.body);
    sendSuccess(res, MESSAGES.CREATED, concession, HTTP_STATUS.CREATED);
  }
);

export const updateConcession = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const concession = await concessionService.update(req.params.id, req.body);
    sendSuccess(res, MESSAGES.UPDATED, concession);
  }
);

export const deleteConcession = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    await concessionService.delete(req.params.id);
    sendSuccess(res, MESSAGES.DELETED, null);
  }
);
