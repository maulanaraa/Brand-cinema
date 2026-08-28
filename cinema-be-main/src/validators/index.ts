import { body, param, query, ValidationChain } from 'express-validator';
import { MIN_PASSWORD_LENGTH } from '../constants';
import { SUPPORTED_PAYMENT_METHODS } from '../config/midtransPaymentMethods';
import { CONCESSION_CATEGORIES } from '../models/Concession';
import { CAROUSEL_TYPES } from '../models/Carousel';
import { UserRole } from '../types';

export const registerValidator: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: MIN_PASSWORD_LENGTH })
    .withMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
  body('role').not().exists().withMessage('Role cannot be set during registration'),
];

export const loginValidator: ValidationChain[] = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const forgotPasswordValidator: ValidationChain[] = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
];

export const resetPasswordValidator: ValidationChain[] = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: MIN_PASSWORD_LENGTH })
    .withMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
];

export const googleAuthValidator: ValidationChain[] = [
  body().custom((_value, { req }) => {
    const token = req.body?.idToken || req.body?.credential;
    if (typeof token !== 'string' || !token.trim()) {
      throw new Error('Google ID token is required');
    }
    return true;
  }),
];

export const createMovieValidator: ValidationChain[] = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('genre').trim().notEmpty().withMessage('Genre is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('duration').toInt().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('rating')
    .optional({ values: 'falsy' })
    .toFloat()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Rating must be between 0 and 10'),
  body('poster')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Invalid poster URL'),
  body('trailerUrl')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Invalid trailer URL'),
  body('tmdbId').optional({ values: 'falsy' }).toInt().isInt({ min: 1 }).withMessage('Invalid TMDB ID'),
  body('language').trim().notEmpty().withMessage('Language is required'),
  body('releaseDate').notEmpty().withMessage('Release date is required').isISO8601().withMessage('Invalid release date'),
  body('status')
    .optional()
    .isIn(['NOW_PLAYING', 'COMING_SOON'])
    .withMessage('Status must be NOW_PLAYING or COMING_SOON'),
  body('isActive')
    .optional({ values: 'falsy' })
    .isIn(['true', 'false', true, false])
    .withMessage('isActive must be boolean')
    .customSanitizer((value) => value === true || value === 'true'),
];

export const updateMovieValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid movie ID'),
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('genre').optional().trim().notEmpty().withMessage('Genre cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('duration').optional().toInt().isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('rating')
    .optional({ values: 'falsy' })
    .toFloat()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Rating must be between 0 and 10'),
  body('poster')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Invalid poster URL'),
  body('trailerUrl')
    .optional({ values: 'falsy' })
    .isURL()
    .withMessage('Invalid trailer URL'),
  body('tmdbId').optional({ values: 'falsy' }).toInt().isInt({ min: 1 }).withMessage('Invalid TMDB ID'),
  body('language').optional().trim().notEmpty().withMessage('Language cannot be empty'),
  body('releaseDate').optional().isISO8601().withMessage('Invalid release date'),
  body('status')
    .optional()
    .isIn(['NOW_PLAYING', 'COMING_SOON'])
    .withMessage('Status must be NOW_PLAYING or COMING_SOON'),
  body('isActive')
    .optional({ values: 'falsy' })
    .isIn(['true', 'false', true, false])
    .withMessage('isActive must be boolean')
    .customSanitizer((value) => value === true || value === 'true'),
];

export const movieIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid movie ID'),
];

export const tmdbSearchValidator: ValidationChain[] = [
  query('q').trim().notEmpty().withMessage('Search query is required'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
];

export const tmdbIdValidator: ValidationChain[] = [
  param('tmdbId').isInt({ min: 1 }).withMessage('Invalid TMDB ID'),
];

export const movieQueryValidator: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString(),
  query('genre').optional().isString(),
  query('sort').optional().isString(),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  query('isActive').optional().isIn(['true', 'false']).withMessage('isActive must be true or false'),
  query('status')
    .optional()
    .isIn(['NOW_PLAYING', 'COMING_SOON'])
    .withMessage('Status must be NOW_PLAYING or COMING_SOON'),
];

export const createShowtimeValidator: ValidationChain[] = [
  body('movieId').notEmpty().withMessage('Movie ID is required').isMongoId().withMessage('Invalid movie ID'),
  body('studio').trim().notEmpty().withMessage('Studio is required'),
  body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Invalid date'),
  body('time')
    .notEmpty()
    .withMessage('Time is required')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('Time must be in HH:mm format'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('totalSeat').isInt({ min: 1 }).withMessage('Total seat must be a positive integer'),
];

export const updateShowtimeValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid showtime ID'),
  body('movieId').optional().isMongoId().withMessage('Invalid movie ID'),
  body('studio').optional().trim().notEmpty().withMessage('Studio cannot be empty'),
  body('date').optional().isISO8601().withMessage('Invalid date'),
  body('time')
    .optional()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('Time must be in HH:mm format'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('totalSeat').optional().isInt({ min: 1 }).withMessage('Total seat must be a positive integer'),
];

export const showtimeIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid showtime ID'),
];

export const showtimeQueryValidator: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('movieId').optional().isMongoId().withMessage('Invalid movie ID'),
  query('date').optional().isISO8601().withMessage('Invalid date'),
  query('sort').optional().isString(),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
];

export const createBookingValidator: ValidationChain[] = [
  body('showtimeId')
    .notEmpty()
    .withMessage('Showtime ID is required')
    .isMongoId()
    .withMessage('Invalid showtime ID'),
  body('selectedSeats')
    .isArray({ min: 1 })
    .withMessage('Selected seats must be a non-empty array')
    .custom((seats: string[]) => {
      const pattern = /^[A-Z][1-9][0-9]?$/;
      for (const seat of seats) {
        if (typeof seat !== 'string' || !pattern.test(seat)) {
          throw new Error(`Invalid seat code: ${seat}`);
        }
      }
      return true;
    }),
];

export const bookingIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid booking ID'),
];

export const paymentValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('status')
    .notEmpty()
    .withMessage('Payment status is required')
    .isIn(['SUCCESS', 'FAILED'])
    .withMessage('Status must be SUCCESS or FAILED'),
];

export const paymentChargeValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(SUPPORTED_PAYMENT_METHODS)
    .withMessage('Payment method not supported'),
  body('tokenId')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('tokenId cannot be empty'),
  body('concessions')
    .optional()
    .isArray()
    .withMessage('concessions must be an array'),
  body('concessions.*.concessionId')
    .optional()
    .isMongoId()
    .withMessage('Invalid concession ID'),
  body('concessions.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Concession quantity must be at least 1'),
  body('paymentMethod').custom((method, { req }) => {
    if (method === 'credit_card' && !req.body?.tokenId) {
      throw new Error('tokenId is required for credit card payment');
    }
    return true;
  }),
];

export const updateBookingConcessionsValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('concessions')
    .isArray()
    .withMessage('concessions must be an array'),
  body('concessions.*.concessionId')
    .isMongoId()
    .withMessage('Invalid concession ID'),
  body('concessions.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Concession quantity must be at least 1'),
];

export const bookingQueryValidator: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sort').optional().isString(),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
];

export const adminBookingQueryValidator: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('bookingStatus')
    .optional()
    .isIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED'])
    .withMessage('Invalid bookingStatus'),
  query('paymentStatus')
    .optional()
    .isIn(['PENDING', 'SUCCESS', 'FAILED'])
    .withMessage('Invalid paymentStatus'),
  query('search').optional().isString(),
  query('movieId').optional().isMongoId().withMessage('Invalid movie ID'),
  query('date').optional().isISO8601().withMessage('Invalid date'),
  query('sort')
    .optional()
    .isIn(['createdAt', 'totalPrice', 'bookingStatus'])
    .withMessage('sort must be createdAt, totalPrice, or bookingStatus'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
];

export const adminBookingStatusValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('bookingStatus')
    .notEmpty()
    .withMessage('bookingStatus is required')
    .isIn(['PENDING', 'CONFIRMED', 'CANCELLED', 'EXPIRED'])
    .withMessage('Invalid bookingStatus'),
  body('paymentStatus')
    .optional()
    .isIn(['PENDING', 'SUCCESS', 'FAILED'])
    .withMessage('Invalid paymentStatus'),
];

const imageUrlValidator = body('imageUrl')
  .trim()
  .notEmpty()
  .withMessage('imageUrl is required')
  .isURL({ protocols: ['http', 'https'], require_protocol: true })
  .withMessage('imageUrl must be a valid URL')
  .custom((value: string) => {
    if (/drive\.google\.com\/(?:drive\/)?folders\//i.test(value)) {
      throw new Error('Google Drive folder links are not supported. Use a direct file link per item.');
    }
    return true;
  });

export const createConcessionValidator: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('name is required')
    .isLength({ min: 2, max: 120 })
    .withMessage('name must be between 2 and 120 characters'),
  body('description').trim().notEmpty().withMessage('description is required'),
  body('price')
    .isInt({ min: 0 })
    .withMessage('price must be a non-negative integer'),
  body('category')
    .notEmpty()
    .withMessage('category is required')
    .isIn(CONCESSION_CATEGORIES)
    .withMessage(`category must be one of: ${CONCESSION_CATEGORIES.join(', ')}`),
  imageUrlValidator,
  body('badge').optional({ values: 'falsy' }).isString().trim(),
  body('isActive')
    .optional({ values: 'falsy' })
    .isIn(['true', 'false', true, false])
    .withMessage('isActive must be boolean')
    .customSanitizer((value) => value === true || value === 'true'),
  body('sortOrder')
    .optional({ values: 'falsy' })
    .toInt()
    .isInt({ min: 0 })
    .withMessage('sortOrder must be a non-negative integer'),
];

export const updateConcessionValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid concession ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('name cannot be empty')
    .isLength({ min: 2, max: 120 })
    .withMessage('name must be between 2 and 120 characters'),
  body('description').optional().trim().notEmpty().withMessage('description cannot be empty'),
  body('price')
    .optional()
    .toInt()
    .isInt({ min: 0 })
    .withMessage('price must be a non-negative integer'),
  body('category')
    .optional()
    .isIn(CONCESSION_CATEGORIES)
    .withMessage(`category must be one of: ${CONCESSION_CATEGORIES.join(', ')}`),
  body('imageUrl')
    .optional({ values: 'falsy' })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('imageUrl must be a valid URL')
    .custom((value: string) => {
      if (/drive\.google\.com\/(?:drive\/)?folders\//i.test(value)) {
        throw new Error('Google Drive folder links are not supported. Use a direct file link per item.');
      }
      return true;
    }),
  body('badge').optional({ values: 'falsy' }).isString().trim(),
  body('isActive')
    .optional({ values: 'falsy' })
    .isIn(['true', 'false', true, false])
    .withMessage('isActive must be boolean')
    .customSanitizer((value) => value === true || value === 'true'),
  body('sortOrder')
    .optional({ values: 'falsy' })
    .toInt()
    .isInt({ min: 0 })
    .withMessage('sortOrder must be a non-negative integer'),
];

export const concessionIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid concession ID'),
];

export const concessionQueryValidator: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString(),
  query('category')
    .optional()
    .isIn(CONCESSION_CATEGORIES)
    .withMessage(`category must be one of: ${CONCESSION_CATEGORIES.join(', ')}`),
  query('sort')
    .optional()
    .isIn(['sortOrder', 'name', 'price', 'createdAt'])
    .withMessage('sort must be sortOrder, name, price, or createdAt'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  query('isActive')
    .optional()
    .isIn(['true', 'false', 'all'])
    .withMessage('isActive must be true, false, or all'),
];

const validateHallLayout = (
  totalSeats: unknown,
  layoutRows: unknown,
  layoutColumns: unknown
): boolean => {
  const total = Number(totalSeats);
  const rows = Number(layoutRows);
  const cols = Number(layoutColumns);

  if (!Number.isInteger(total) || !Number.isInteger(rows) || !Number.isInteger(cols)) {
    return true;
  }

  if (total !== rows * cols) {
    throw new Error('totalSeats must equal layoutRows × layoutColumns');
  }

  return true;
};

export const createHallValidator: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('totalSeats').isInt({ min: 1 }).withMessage('totalSeats must be a positive integer'),
  body('layoutRows').isInt({ min: 1 }).withMessage('layoutRows must be a positive integer'),
  body('layoutColumns').isInt({ min: 1 }).withMessage('layoutColumns must be a positive integer'),
  body('isActive')
    .optional({ values: 'falsy' })
    .isIn(['true', 'false', true, false])
    .withMessage('isActive must be boolean')
    .customSanitizer((value) => value === true || value === 'true'),
  body('totalSeats').custom((value, { req }) =>
    validateHallLayout(value, req.body.layoutRows, req.body.layoutColumns)
  ),
];

export const updateHallValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid hall ID'),
  body('name').optional().trim().notEmpty().withMessage('name cannot be empty'),
  body('totalSeats').optional().toInt().isInt({ min: 1 }).withMessage('totalSeats must be a positive integer'),
  body('layoutRows').optional().toInt().isInt({ min: 1 }).withMessage('layoutRows must be a positive integer'),
  body('layoutColumns').optional().toInt().isInt({ min: 1 }).withMessage('layoutColumns must be a positive integer'),
  body('isActive')
    .optional({ values: 'falsy' })
    .isIn(['true', 'false', true, false])
    .withMessage('isActive must be boolean')
    .customSanitizer((value) => value === true || value === 'true'),
];

export const hallIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid hall ID'),
];

export const hallQueryValidator: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString(),
  query('sort')
    .optional()
    .isIn(['name', 'totalSeats', 'createdAt'])
    .withMessage('sort must be name, totalSeats, or createdAt'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  query('isActive')
    .optional()
    .isIn(['true', 'false', 'all'])
    .withMessage('isActive must be true, false, or all'),
];

export const createCityValidator: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('slug').optional().trim().notEmpty().withMessage('slug cannot be empty'),
  body('isActive')
    .optional({ values: 'falsy' })
    .isIn(['true', 'false', true, false])
    .withMessage('isActive must be boolean')
    .customSanitizer((value) => value === true || value === 'true'),
  body('sortOrder')
    .optional()
    .toInt()
    .isInt()
    .withMessage('sortOrder must be an integer'),
];

export const updateCityValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid city ID'),
  body('name').optional().trim().notEmpty().withMessage('name cannot be empty'),
  body('slug').optional().trim().notEmpty().withMessage('slug cannot be empty'),
  body('isActive')
    .optional({ values: 'falsy' })
    .isIn(['true', 'false', true, false])
    .withMessage('isActive must be boolean')
    .customSanitizer((value) => value === true || value === 'true'),
  body('sortOrder')
    .optional()
    .toInt()
    .isInt()
    .withMessage('sortOrder must be an integer'),
];

export const cityIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid city ID'),
];

export const cityQueryValidator: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString(),
  query('sort')
    .optional()
    .isIn(['name', 'sortOrder', 'createdAt'])
    .withMessage('sort must be name, sortOrder, or createdAt'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  query('isActive')
    .optional()
    .isIn(['true', 'false', 'all'])
    .withMessage('isActive must be true, false, or all'),
];

export const createCinemaValidator: ValidationChain[] = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('cityId').notEmpty().withMessage('cityId is required').isMongoId().withMessage('Invalid city ID'),
  body('address').optional().trim().isString(),
  body('isActive')
    .optional({ values: 'falsy' })
    .isIn(['true', 'false', true, false])
    .withMessage('isActive must be boolean')
    .customSanitizer((value) => value === true || value === 'true'),
  body('sortOrder')
    .optional()
    .toInt()
    .isInt()
    .withMessage('sortOrder must be an integer'),
];

export const updateCinemaValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid cinema ID'),
  body('name').optional().trim().notEmpty().withMessage('name cannot be empty'),
  body('cityId').optional().isMongoId().withMessage('Invalid city ID'),
  body('address').optional().trim().isString(),
  body('isActive')
    .optional({ values: 'falsy' })
    .isIn(['true', 'false', true, false])
    .withMessage('isActive must be boolean')
    .customSanitizer((value) => value === true || value === 'true'),
  body('sortOrder')
    .optional()
    .toInt()
    .isInt()
    .withMessage('sortOrder must be an integer'),
];

export const cinemaIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid cinema ID'),
];

export const cinemaQueryValidator: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString(),
  query('cityId').optional().isMongoId().withMessage('Invalid city ID'),
  query('sort')
    .optional()
    .isIn(['name', 'sortOrder', 'createdAt'])
    .withMessage('sort must be name, sortOrder, or createdAt'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  query('isActive')
    .optional()
    .isIn(['true', 'false', 'all'])
    .withMessage('isActive must be true, false, or all'),
];

export const showtimeDatesQueryValidator: ValidationChain[] = [
  query('cityId').optional().isMongoId().withMessage('Invalid city ID'),
  query('cinemaId').optional().isMongoId().withMessage('Invalid cinema ID'),
  query('days').optional().isInt({ min: 1, max: 60 }).withMessage('days must be between 1 and 60'),
];

const isValidCarouselImageUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.startsWith('/')) {
    return true;
  }
  if (/^data:image\/[a-zA-Z0-9.+-]+;base64,/.test(trimmed)) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
};

const carouselImageUrlMessage =
  'imageUrl must be an absolute URL, app-relative path (/uploads/...), or data:image URL';

export const createCarouselValidator: ValidationChain[] = [
  body('type')
    .notEmpty()
    .withMessage('type is required')
    .isIn(CAROUSEL_TYPES)
    .withMessage(`type must be one of: ${CAROUSEL_TYPES.join(', ')}`),
  body('title')
    .trim()
    .notEmpty()
    .withMessage('title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('title must be between 1 and 200 characters'),
  body('description').optional({ values: 'falsy' }).isString().trim(),
  body('imageUrl')
    .trim()
    .notEmpty()
    .withMessage('imageUrl is required')
    .custom((value: string) => {
      if (!isValidCarouselImageUrl(value)) {
        throw new Error(carouselImageUrlMessage);
      }
      if (/drive\.google\.com\/(?:drive\/)?folders\//i.test(value)) {
        throw new Error('Google Drive folder links are not supported. Use a direct file link per item.');
      }
      return true;
    }),
  body('linkUrl').optional({ values: 'falsy' }).isString().trim(),
  body('movieId')
    .optional({ values: 'null' })
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true;
      }
      if (typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value)) {
        return true;
      }
      throw new Error('Invalid movie ID');
    }),
  body('isActive')
    .optional({ values: 'falsy' })
    .isIn(['true', 'false', true, false])
    .withMessage('isActive must be boolean')
    .customSanitizer((value) => value === true || value === 'true'),
  body('order')
    .optional({ values: 'falsy' })
    .toInt()
    .isInt({ min: 0 })
    .withMessage('order must be a non-negative integer'),
];

export const updateCarouselValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid carousel ID'),
  body('type')
    .optional()
    .isIn(CAROUSEL_TYPES)
    .withMessage(`type must be one of: ${CAROUSEL_TYPES.join(', ')}`),
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('title cannot be empty')
    .isLength({ min: 1, max: 200 })
    .withMessage('title must be between 1 and 200 characters'),
  body('description').optional({ values: 'falsy' }).isString().trim(),
  body('imageUrl')
    .optional({ values: 'falsy' })
    .trim()
    .custom((value: string) => {
      if (!isValidCarouselImageUrl(value)) {
        throw new Error(carouselImageUrlMessage);
      }
      if (/drive\.google\.com\/(?:drive\/)?folders\//i.test(value)) {
        throw new Error('Google Drive folder links are not supported. Use a direct file link per item.');
      }
      return true;
    }),
  body('linkUrl').optional({ values: 'falsy' }).isString().trim(),
  body('movieId')
    .optional({ values: 'null' })
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true;
      }
      if (typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value)) {
        return true;
      }
      throw new Error('Invalid movie ID');
    }),
  body('isActive')
    .optional({ values: 'falsy' })
    .isIn(['true', 'false', true, false])
    .withMessage('isActive must be boolean')
    .customSanitizer((value) => value === true || value === 'true'),
  body('order')
    .optional({ values: 'falsy' })
    .toInt()
    .isInt({ min: 0 })
    .withMessage('order must be a non-negative integer'),
];

export const carouselIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid carousel ID'),
];

export const carouselQueryValidator: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString(),
  query('type')
    .optional()
    .isIn(CAROUSEL_TYPES)
    .withMessage(`type must be one of: ${CAROUSEL_TYPES.join(', ')}`),
  query('sort')
    .optional()
    .isIn(['order', 'createdAt', 'title'])
    .withMessage('sort must be order, createdAt, or title'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  query('isActive')
    .optional()
    .isIn(['true', 'false', 'all'])
    .withMessage('isActive must be true, false, or all'),
];

export const reorderCarouselValidator: ValidationChain[] = [
  body('orderedIds')
    .isArray({ min: 1 })
    .withMessage('orderedIds must be a non-empty array'),
  body('orderedIds.*').isMongoId().withMessage('Invalid carousel ID in orderedIds'),
];

export const createUserValidator: ValidationChain[] = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: MIN_PASSWORD_LENGTH })
    .withMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
  body('role')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage(`role must be one of: ${Object.values(UserRole).join(', ')}`),
];

export const updateUserValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid user ID'),
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Name cannot exceed 100 characters'),
  body('email').optional().trim().isEmail().withMessage('Invalid email'),
  body('password')
    .optional()
    .isLength({ min: MIN_PASSWORD_LENGTH })
    .withMessage(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`),
  body('role')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage(`role must be one of: ${Object.values(UserRole).join(', ')}`),
];

export const userIdValidator: ValidationChain[] = [
  param('id').isMongoId().withMessage('Invalid user ID'),
];

export const userQueryValidator: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().isString(),
  query('sort')
    .optional()
    .isIn(['name', 'email', 'role', 'createdAt'])
    .withMessage('sort must be name, email, role, or createdAt'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
  query('role')
    .optional()
    .isIn(Object.values(UserRole))
    .withMessage(`role must be one of: ${Object.values(UserRole).join(', ')}`),
];

export const chatValidator: ValidationChain[] = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Pesan tidak boleh kosong')
    .isLength({ max: 1000 })
    .withMessage('Pesan terlalu panjang (maksimal 1000 karakter)'),
  body('history')
    .optional()
    .isArray()
    .withMessage('history must be an array'),
  body('history.*.role')
    .optional()
    .isIn(['user', 'assistant'])
    .withMessage('history role must be user or assistant'),
  body('history.*.content')
    .optional()
    .isString()
    .withMessage('history content must be a string'),
];
