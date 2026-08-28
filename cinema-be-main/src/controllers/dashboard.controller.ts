import { Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { AuthenticatedRequest, asyncHandler } from '../helpers';
import { sendSuccess } from '../helpers/response.helper';
import { MESSAGES } from '../constants';

export const getDashboard = asyncHandler(
  async (_req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const stats = await dashboardService.getStats();
    sendSuccess(res, MESSAGES.SUCCESS, stats);
  }
);
