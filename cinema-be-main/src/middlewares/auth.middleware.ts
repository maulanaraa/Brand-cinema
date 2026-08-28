import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../helpers';
import {
  extractAuthToken,
  getTokenExpiry,
  verifyToken,
} from '../utils/auth.util';
import { AppError } from '../helpers/response.helper';
import { COOKIE_NAME, HTTP_STATUS, MESSAGES } from '../constants';
import { UserRole } from '../types';
import { userRepository } from '../repositories/user.repository';
import { tokenRevocationRepository } from '../repositories/tokenRevocation.repository';

const resolveAuthToken = (req: AuthenticatedRequest): string => {
  const token = extractAuthToken(req);

  if (!token) {
    throw new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  return token;
};

const validateActiveSession = async (token: string): Promise<{
  id: string;
  email: string;
  role: UserRole;
  jti: string;
  tv: number;
}> => {
  const payload = verifyToken(token);

  if (!payload.jti || payload.tv === undefined) {
    throw new AppError('Invalid or expired token', HTTP_STATUS.UNAUTHORIZED);
  }

  if (await tokenRevocationRepository.isRevoked(payload.jti)) {
    throw new AppError('Invalid or expired token', HTTP_STATUS.UNAUTHORIZED);
  }

  const authState = await userRepository.findAuthState(payload.id);

  if (!authState) {
    throw new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED);
  }

  if (authState.tokenVersion !== payload.tv) {
    throw new AppError('Invalid or expired token', HTTP_STATUS.UNAUTHORIZED);
  }

  return {
    id: payload.id,
    email: payload.email,
    role: authState.role,
    jti: payload.jti,
    tv: payload.tv,
  };
};

export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = resolveAuthToken(req);
    req.user = await validateActiveSession(token);
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError('Invalid or expired token', HTTP_STATUS.UNAUTHORIZED));
  }
};

/** Sets req.user when a valid token is present; continues anonymously otherwise. */
export const optionalAuthenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractAuthToken(req);

    if (token) {
      req.user = await validateActiveSession(token);
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }

  next();
};

export const authorizeAdmin = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    next(new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED));
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    next(new AppError(MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN));
    return;
  }

  next();
};

export const authorizeUser = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    next(new AppError(MESSAGES.UNAUTHORIZED, HTTP_STATUS.UNAUTHORIZED));
    return;
  }

  if (req.user.role !== UserRole.USER && req.user.role !== UserRole.ADMIN) {
    next(new AppError(MESSAGES.FORBIDDEN, HTTP_STATUS.FORBIDDEN));
    return;
  }

  next();
};

export const revokeCurrentToken = async (token: string): Promise<void> => {
  const payload = verifyToken(token);
  if (!payload.jti) {
    return;
  }

  await tokenRevocationRepository.revoke(payload.jti, getTokenExpiry(token));
};

// Re-export for tests and controllers
export { COOKIE_NAME };
