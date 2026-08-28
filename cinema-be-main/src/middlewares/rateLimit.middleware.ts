import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../constants';

const shouldSkipRateLimit = (): boolean =>
  process.env.NODE_ENV === 'test' && process.env.TEST_RATE_LIMIT !== 'true';

export const loginRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.LOGIN.windowMs,
  max: RATE_LIMIT.LOGIN.max,
  skip: shouldSkipRateLimit,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again later.',
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const registerRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.REGISTER.windowMs,
  max: RATE_LIMIT.REGISTER.max,
  skip: shouldSkipRateLimit,
  message: {
    success: false,
    message: 'Too many registration attempts. Please try again later.',
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const resetPasswordRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.RESET_PASSWORD.windowMs,
  max: RATE_LIMIT.RESET_PASSWORD.max,
  skip: shouldSkipRateLimit,
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again later.',
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const bookingRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.BOOKING.windowMs,
  max: RATE_LIMIT.BOOKING.max,
  skip: shouldSkipRateLimit,
  message: {
    success: false,
    message: 'Too many booking requests. Please try again later.',
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const forgotPasswordIpRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.FORGOT_PASSWORD_IP.windowMs,
  max: RATE_LIMIT.FORGOT_PASSWORD_IP.max,
  skip: shouldSkipRateLimit,
  keyGenerator: (req) => `forgot-password:ip:${req.ip}`,
  message: {
    success: false,
    message: 'Too many password reset requests from this IP. Please try again later.',
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const forgotPasswordRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.FORGOT_PASSWORD.windowMs,
  max: RATE_LIMIT.FORGOT_PASSWORD.max,
  skip: shouldSkipRateLimit,
  keyGenerator: (req) => {
    const email =
      typeof req.body?.email === 'string' ? req.body.email.toLowerCase().trim() : '';
    return email ? `forgot-password:email:${email}` : `forgot-password:ip:${req.ip}`;
  },
  message: {
    success: false,
    message: 'Too many password reset requests for this email. Please try again later.',
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const chatRateLimiter = rateLimit({
  windowMs: RATE_LIMIT.CHAT.windowMs,
  max: RATE_LIMIT.CHAT.max,
  skip: shouldSkipRateLimit,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan. Silakan coba lagi sebentar.',
    errors: [],
  },
  standardHeaders: true,
  legacyHeaders: false,
});
