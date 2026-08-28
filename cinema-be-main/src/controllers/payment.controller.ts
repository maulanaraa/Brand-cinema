import { Request, Response } from 'express';
import { bookingService } from '../services/booking.service';
import { paymentService } from '../services/payment.service';
import { MidtransNotification } from '../config/midtrans';
import { logger } from '../utils/logger.util';
import { asyncHandler } from '../helpers';
import { sendSuccess } from '../helpers/response.helper';
import { MESSAGES } from '../constants';

/** Midtrans dashboard "Test notification URL" may probe with GET first. */
export const midtransNotificationPing = (_req: Request, res: Response): void => {
  res.status(200).send('OK');
};

export const midtransNotification = (req: Request, res: Response): void => {
  // Respond immediately — Midtrans times out if we await DB work first.
  res.status(200).json({ success: true });

  bookingService
    .handleMidtransNotification(req.body as MidtransNotification)
    .catch((error) => logger.error('Midtrans notification error', { error }));
};

export const getPaymentMethods = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const methods = paymentService.getPaymentMethods();
  sendSuccess(res, MESSAGES.SUCCESS, methods);
});

export const getMidtransConfig = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const config = paymentService.getMidtransConfig();
  sendSuccess(res, MESSAGES.SUCCESS, config);
});
