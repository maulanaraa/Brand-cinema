import { Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest, asyncHandler } from '../helpers';
import { sendSuccess } from '../helpers/response.helper';
import { COOKIE_NAME, HTTP_STATUS, MESSAGES } from '../constants';
import { extractAuthToken, getCookieOptions } from '../utils/auth.util';
import { revokeCurrentToken } from '../middlewares/auth.middleware';

export const register = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await authService.register(req.body);
    res.cookie(COOKIE_NAME, result.token, getCookieOptions());
    sendSuccess(res, MESSAGES.REGISTER_SUCCESS, { user: result.user }, HTTP_STATUS.CREATED);
  }
);

export const login = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await authService.login(req.body);
    res.cookie(COOKIE_NAME, result.token, getCookieOptions());
    sendSuccess(res, MESSAGES.LOGIN_SUCCESS, { user: result.user });
  }
);

export const logout = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const token = extractAuthToken(req);
    if (token) {
      await revokeCurrentToken(token);
    }
    res.clearCookie(COOKIE_NAME, getCookieOptions());
    sendSuccess(res, MESSAGES.LOGOUT_SUCCESS, null);
  }
);

export const getMe = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const user = await authService.getMe(req.user!.id);
    sendSuccess(res, MESSAGES.SUCCESS, user);
  }
);

export const forgotPassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    await authService.forgotPassword(req.body);
    sendSuccess(res, MESSAGES.FORGOT_PASSWORD_SUCCESS, null);
  }
);

export const resetPassword = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    await authService.resetPassword(req.body);
    sendSuccess(res, MESSAGES.RESET_PASSWORD_SUCCESS, null);
  }
);

export const googleAuth = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const idToken = req.body.idToken || req.body.credential;
    const result = await authService.googleAuth({ idToken });
    res.cookie(COOKIE_NAME, result.token, getCookieOptions());
    sendSuccess(res, MESSAGES.GOOGLE_AUTH_SUCCESS, { user: result.user });
  }
);
