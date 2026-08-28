import { Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { asyncHandler, AuthenticatedRequest } from '../helpers';
import { sendSuccess } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';

export const getUsers = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await userService.getAll(req.query);
    sendSuccess(res, MESSAGES.SUCCESS, result);
  }
);

export const getUserById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const user = await userService.getById(req.params.id);
    sendSuccess(res, MESSAGES.SUCCESS, user);
  }
);

export const createUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const user = await userService.create(req.body);
    sendSuccess(res, MESSAGES.USER_CREATED, user, HTTP_STATUS.CREATED);
  }
);

export const updateUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const user = await userService.update(req.params.id, req.body);
    sendSuccess(res, MESSAGES.UPDATED, user);
  }
);

export const deleteUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    await userService.delete(req.params.id, req.user?.id);
    sendSuccess(res, MESSAGES.USER_DELETED, null);
  }
);
