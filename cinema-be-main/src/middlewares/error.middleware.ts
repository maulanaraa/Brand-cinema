import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import mongoose from 'mongoose';
import { MongoServerSelectionError, MongoNetworkError } from 'mongodb';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError, sendError } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { logger } from '../utils/logger.util';
import { SeatConflictError } from '../services/booking.service';
import { sendSeatConflict } from '../helpers/response.helper';
import { applyCorsHeaders } from '../config/cors';

export const notFoundHandler = (req: Request, res: Response): void => {
  applyCorsHeaders(req.headers.origin, res.setHeader.bind(res));
  sendError(res, `Route ${req.method} ${req.originalUrl} not found`, [], HTTP_STATUS.NOT_FOUND);
};

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  applyCorsHeaders(req.headers.origin, res.setHeader.bind(res));
  logger.error(err.message, { stack: err.stack });

  if (err instanceof SeatConflictError) {
    sendSeatConflict(res, err.unavailableSeats);
    return;
  }

  if (err instanceof MongoServerSelectionError || err instanceof MongoNetworkError) {
    sendError(
      res,
      'Database connection failed. Please try again in a moment.',
      [],
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
    return;
  }

  if (err instanceof AppError) {
    sendError(res, err.message, err.errors, err.statusCode);
    return;
  }

  if (err instanceof TokenExpiredError) {
    sendError(res, 'Token expired', [], HTTP_STATUS.UNAUTHORIZED);
    return;
  }

  if (err instanceof JsonWebTokenError) {
    sendError(res, 'Invalid token', [], HTTP_STATUS.UNAUTHORIZED);
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    sendError(res, 'Invalid resource ID', [], HTTP_STATUS.BAD_REQUEST);
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((e) => e.message);
    sendError(res, MESSAGES.VALIDATION_FAILED, errors, HTTP_STATUS.BAD_REQUEST);
    return;
  }

  if ((err as { code?: number }).code === 11000) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue;
    const field = keyValue ? Object.keys(keyValue)[0] : 'field';
    sendError(res, `Duplicate value for ${field}`, [], HTTP_STATUS.CONFLICT);
    return;
  }

  sendError(
    res,
    process.env.NODE_ENV === 'production' ? MESSAGES.INTERNAL_ERROR : err.message,
    [],
    HTTP_STATUS.INTERNAL_SERVER_ERROR
  );
};
