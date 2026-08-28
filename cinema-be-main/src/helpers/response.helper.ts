import { Response } from 'express';
import { HTTP_STATUS } from '../constants';
import { ApiErrorResponse, ApiSuccessResponse } from '../types';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    errors: string[] = []
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const sendSuccess = <T>(
  res: Response,
  message: string,
  data: T,
  statusCode: number = HTTP_STATUS.OK
): Response<ApiSuccessResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message: string,
  errors: string[] = [],
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
): Response<ApiErrorResponse> => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

export const sendSeatConflict = (
  res: Response,
  unavailableSeats: string[]
): Response => {
  return res.status(HTTP_STATUS.CONFLICT).json({
    success: false,
    message: 'Seat unavailable',
    unavailableSeats,
  });
};
