import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { sendError } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => err.msg as string);
    sendError(res, MESSAGES.VALIDATION_FAILED, errorMessages, HTTP_STATUS.BAD_REQUEST);
    return;
  }

  next();
};
