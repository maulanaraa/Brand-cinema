export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const MESSAGES = {
  SUCCESS: 'Success',
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  VALIDATION_FAILED: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error',
  SEAT_UNAVAILABLE: 'Seat unavailable',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTER_SUCCESS: 'Registration successful',
  FORGOT_PASSWORD_SUCCESS: 'If that email is registered, a password reset link has been sent',
  RESET_PASSWORD_SUCCESS: 'Password reset successful',
  GOOGLE_AUTH_SUCCESS: 'Google login successful',
  BOOKING_CREATED: 'Booking created successfully',
  BOOKING_CANCELLED: 'Booking cancelled successfully',
  BOOKING_STATUS_UPDATED: 'Booking status updated',
  BOOKING_CONCESSIONS_UPDATED: 'Booking concessions updated',
  HALL_CREATED: 'Hall created',
  HALL_DELETED: 'Hall deleted',
  CITY_CREATED: 'City created',
  CITY_DELETED: 'City deleted',
  CINEMA_CREATED: 'Cinema created',
  CINEMA_DELETED: 'Cinema deleted',
  CAROUSEL_CREATED: 'Carousel item created',
  CAROUSEL_DELETED: 'Carousel item deleted',
  USER_CREATED: 'User created',
  USER_DELETED: 'User deleted',
  PAYMENT_SUCCESS: 'Payment successful',
  PAYMENT_FAILED: 'Payment failed',
  MIDTRANS_TOKEN_CREATED: 'Midtrans snap token created',
  PAYMENT_CHARGE_CREATED: 'Payment charge created',
  PAYMENT_INSTRUCTION_NOT_FOUND: 'No active payment instruction',
  PAYMENT_METHOD_NOT_SUPPORTED: 'Payment method not supported',
  PAYMENT_PROVIDER_ERROR: 'Payment provider error',
  ACTIVE_PAYMENT_EXISTS: 'Active payment exists',
} as const;

export const COOKIE_NAME = 'token';

export const MIN_PASSWORD_LENGTH = 8;
export const PASSWORD_RESET_EXPIRE_MS = 60 * 60 * 1000;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

export const RATE_LIMIT = {
  LOGIN: { windowMs: 15 * 60 * 1000, max: 5 },
  REGISTER: { windowMs: 15 * 60 * 1000, max: 3 },
  FORGOT_PASSWORD: { windowMs: 15 * 60 * 1000, max: 3 },
  FORGOT_PASSWORD_IP: { windowMs: 15 * 60 * 1000, max: 10 },
  RESET_PASSWORD: { windowMs: 15 * 60 * 1000, max: 5 },
  BOOKING: { windowMs: 60 * 1000, max: 10 },
  CHAT: { windowMs: 60 * 1000, max: 20 },
} as const;

export const UPLOAD = {
  POSTER_DIR: 'uploads/posters',
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
} as const;

export const SEAT_PATTERN = /^[A-Z][1-9][0-9]?$/;
