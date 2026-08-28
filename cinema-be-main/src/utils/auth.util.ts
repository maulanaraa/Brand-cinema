import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { MIN_PASSWORD_LENGTH, COOKIE_NAME } from '../constants';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS } from '../constants';
import { JwtPayload } from '../types';

const SALT_ROUNDS = 12;

export const hashPassword = async (password: string): Promise<string> => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
      HTTP_STATUS.BAD_REQUEST
    );
  }
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const signToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = (process.env.JWT_EXPIRE || '7d') as jwt.SignOptions['expiresIn'];

  if (!secret) {
    throw new AppError('JWT_SECRET is not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return jwt.sign(payload, secret, { expiresIn });
};

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError('JWT_SECRET is not configured', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }

  return jwt.verify(token, secret) as JwtPayload;
};

export const createJwtPayload = (
  user: { _id: { toString(): string }; email: string; role: JwtPayload['role']; tokenVersion?: number }
): JwtPayload => ({
  id: user._id.toString(),
  email: user.email,
  role: user.role,
  jti: uuidv4(),
  tv: user.tokenVersion ?? 0,
});

export const getTokenExpiry = (token: string): Date => {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded === 'string' || !decoded.exp) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  return new Date(decoded.exp * 1000);
};

export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashPasswordResetToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const getCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  // Cross-subdomain SPA (www → api.brand-cinemas.online): Lax is enough for same-site
  // subdomains and is less brittle than Strict for auth redirects.
  const options: {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number;
    signed: boolean;
    domain?: string;
    path: string;
  } = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    signed: true,
    path: '/',
  };

  // Share cookie across www + api subdomains in production
  if (isProduction) {
    options.domain = '.brand-cinemas.online';
  }

  return options;
};

export const extractAuthToken = (req: {
  signedCookies?: Record<string, string>;
  cookies?: Record<string, string>;
  headers: { authorization?: string };
}): string | undefined => {
  const signedToken = req.signedCookies?.[COOKIE_NAME];
  const headerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : undefined;

  return signedToken || headerToken;
};
