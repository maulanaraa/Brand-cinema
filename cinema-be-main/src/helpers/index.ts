import { Request } from 'express';
import { JwtPayload } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const asyncHandler = <T extends Request>(
  fn: (req: T, res: import('express').Response, next: import('express').NextFunction) => Promise<void>
) => {
  return (req: T, res: import('express').Response, next: import('express').NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const getPaginationParams = (query: {
  page?: string;
  limit?: string;
}): { page: number; limit: number; skip: number } => {
  const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const buildSortOption = (
  sort?: string,
  order?: string
): Record<string, 1 | -1> => {
  const allowedSortFields = ['createdAt', 'title', 'releaseDate', 'rating', 'date', 'price'];
  const field = sort && allowedSortFields.includes(sort) ? sort : 'createdAt';
  const direction: 1 | -1 = order === 'asc' ? 1 : -1;
  return { [field]: direction };
};

export const generateBookingNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK-${timestamp}-${random}`;
};

export const getPosterUrl = (filename: string): string => {
  return `/uploads/posters/${filename}`;
};
