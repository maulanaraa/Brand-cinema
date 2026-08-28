import MidtransClient from 'midtrans-client';
import { verifyMidtransSignature, mapMidtransTransactionStatus, MidtransNotification } from '../config/midtrans';
import { env } from '../config/env';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS } from '../constants';
import { IBooking } from '../models/Booking';
import { IUser } from '../models/User';
import { logger } from '../utils/logger.util';
import { buildChargeItemDetails, formatMidtransExpiryStart } from '../utils/midtransCharge.util';
import { PAYMENT_EXPIRY_MINUTES } from '../config/midtransPaymentMethods';

interface MidtransApiError extends Error {
  httpStatusCode?: number | string | null;
  ApiResponse?: {
    error_messages?: string[];
    status_code?: string;
    status_message?: string;
  };
}

const isMidtransNotFoundError = (error: unknown): boolean => {
  const midtransError = error as MidtransApiError;
  const httpCode = Number(midtransError?.httpStatusCode);
  if (httpCode === 404) {
    return true;
  }

  const apiStatusCode = midtransError?.ApiResponse?.status_code;
  if (apiStatusCode === '404' || Number(apiStatusCode) === 404) {
    return true;
  }

  const statusMessage = midtransError?.ApiResponse?.status_message?.toLowerCase() || '';
  if (statusMessage.includes("doesn't exist") || statusMessage.includes('not found')) {
    return true;
  }

  const message = midtransError?.message?.toLowerCase() || '';
  return message.includes("transaction doesn't exist") || message.includes('http status code: 404');
};

const serializeMidtransError = (error: unknown): Record<string, unknown> => {
  const midtransError = error as MidtransApiError;
  return {
    message: midtransError?.message,
    httpStatusCode: midtransError?.httpStatusCode ?? null,
    apiResponse: midtransError?.ApiResponse ?? null,
  };
};

const wrapMidtransError = (error: unknown, action: string): never => {
  const midtransError = error as MidtransApiError;
  const details = serializeMidtransError(error);

  if (midtransError?.httpStatusCode === 401) {
    logger.error(`Midtrans ${action} unauthorized — check MIDTRANS_SERVER_KEY / MIDTRANS_CLIENT_KEY`, details);
    throw new AppError(
      'Midtrans credentials are invalid. Update MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY from Midtrans Sandbox Dashboard.',
      HTTP_STATUS.SERVICE_UNAVAILABLE
    );
  }

  if (midtransError?.httpStatusCode === 400 && midtransError.ApiResponse?.error_messages?.length) {
    logger.error(`Midtrans ${action} validation failed`, details);
    throw new AppError(
      `Midtrans rejected payment request: ${midtransError.ApiResponse.error_messages.join(', ')}`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (midtransError?.httpStatusCode === 406 || midtransError?.httpStatusCode === 409) {
    const apiResponse = midtransError.ApiResponse as { status_message?: string } | undefined;
    logger.error(`Midtrans ${action} conflict — order may already have active transaction`, details);
    throw new AppError(
      apiResponse?.status_message ||
        'An active payment already exists for this booking. Please complete or cancel it first.',
      HTTP_STATUS.CONFLICT
    );
  }

  logger.error(`Midtrans ${action} failed`, details);
  throw new AppError(`Failed to ${action} with Midtrans. Please try again.`, HTTP_STATUS.INTERNAL_SERVER_ERROR);
};

const snap = new MidtransClient.Snap({
  isProduction: env.midtrans.isProduction,
  serverKey: env.midtrans.serverKey,
  clientKey: env.midtrans.clientKey,
});

const coreApi = new MidtransClient.CoreApi({
  isProduction: env.midtrans.isProduction,
  serverKey: env.midtrans.serverKey,
  clientKey: env.midtrans.clientKey,
});

export interface SnapTransactionResponse {
  snapToken: string;
  clientKey: string;
  redirectUrl: string;
  orderId: string;
}

export class MidtransService {
  async createSnapTransaction(booking: IBooking, user: IUser): Promise<SnapTransactionResponse> {
    if (!env.midtrans.serverKey || !env.midtrans.clientKey) {
      throw new AppError('Midtrans is not configured', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }

    const grossAmount = Math.round(booking.totalPrice);
    const itemDetails = buildChargeItemDetails(booking);

    const parameter = {
      transaction_details: {
        order_id: booking.bookingNumber,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: user.name,
        email: user.email,
      },
      item_details: itemDetails,
      expiry: {
        start_time: formatMidtransExpiryStart(),
        unit: 'minutes',
        duration: PAYMENT_EXPIRY_MINUTES,
      },
      callbacks: {
        finish: `${env.appUrl}/bookings/${booking._id.toString()}/payment/finish`,
      },
    };

    try {
      const transaction = await snap.createTransaction(parameter);

      logger.info('Midtrans snap token created', {
        bookingId: booking._id.toString(),
        orderId: booking.bookingNumber,
      });

      return {
        snapToken: transaction.token,
        clientKey: env.midtrans.clientKey,
        redirectUrl: transaction.redirect_url,
        orderId: booking.bookingNumber,
      };
    } catch (error) {
      return wrapMidtransError(error, 'create snap token');
    }
  }

  verifyNotification(notification: MidtransNotification): boolean {
    return verifyMidtransSignature(notification);
  }

  resolvePaymentResult(notification: MidtransNotification): 'success' | 'pending' | 'failed' {
    return mapMidtransTransactionStatus(
      notification.transaction_status,
      notification.fraud_status
    );
  }

  async getTransactionStatus(orderId: string): Promise<MidtransNotification | null> {
    try {
      const status = await snap.transaction.status(orderId);
      return status as unknown as MidtransNotification;
    } catch (error) {
      if (isMidtransNotFoundError(error)) {
        return null;
      }
      return wrapMidtransError(error, 'get transaction status');
    }
  }

  async chargeTransaction(parameter: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!env.midtrans.serverKey) {
      throw new AppError('Midtrans is not configured', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }

    try {
      return await coreApi.charge(parameter);
    } catch (error) {
      return wrapMidtransError(error, 'charge transaction');
    }
  }

  async cancelTransaction(orderId: string): Promise<void> {
    if (!env.midtrans.serverKey) {
      return;
    }

    try {
      await coreApi.transaction.cancel(orderId);
      logger.info('Midtrans transaction cancelled', { orderId });
    } catch (error) {
      const details = serializeMidtransError(error);
      logger.warn('Midtrans cancel transaction failed (may already be final)', {
        orderId,
        ...details,
      });
    }
  }
}

export const midtransService = new MidtransService();
