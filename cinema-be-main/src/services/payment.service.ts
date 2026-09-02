import { bookingRepository } from '../repositories/booking.repository';
import { paymentRepository } from '../repositories/payment.repository';
import { userRepository } from '../repositories/user.repository';
import { midtransService } from './midtrans.service';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { BookingStatus, PaymentStatus } from '../types';
import { env } from '../config/env';
import { isSupportedPaymentMethod, PAYMENT_METHOD_OPTIONS } from '../config/midtransPaymentMethods';
import {
  MidtransChargeResponse,
  PaymentInstructionResponse,
} from '../types/payment.types';
import {
  buildCoreChargePayload,
  buildCreditCardChargePayload,
  mapChargeResponseToPaymentRecord,
  mapPaymentRecordToInstruction,
} from '../utils/midtransCharge.util';
import { logger } from '../utils/logger.util';
import { PaymentMethod } from '../types';
import { IBooking } from '../models/Booking';
import { ConcessionCartItem, buildPriceBreakdown } from '../utils/bookingConcession.util';

export class PaymentService {
  getPaymentMethods() {
    return PAYMENT_METHOD_OPTIONS;
  }

  private hasValidInstruction(payment: Awaited<ReturnType<typeof paymentRepository.findActiveByBookingId>>): boolean {
    if (!payment?.transactionId) {
      return false;
    }

    switch (payment.instructionType) {
      case 'qris':
        return Boolean(payment.qrImageUrl);
      case 'virtual_account':
        return Boolean(payment.vaNumber || payment.billKey);
      case 'deeplink':
        return Boolean(payment.deeplinkUrl || payment.qrImageUrl);
      case 'retail':
        return Boolean(payment.paymentCode);
      case 'snap':
        return Boolean(payment.snapToken);
      case 'card':
        return Boolean(
          payment.transactionId &&
            (payment.redirectUrl ||
              ['capture', 'settlement', 'pending'].includes(payment.transactionStatus))
        );
      default:
        return false;
    }
  }

  async chargeBooking(
    bookingId: string,
    userId: string,
    paymentMethod: string,
    tokenId?: string,
    concessions?: ConcessionCartItem[]
  ): Promise<PaymentInstructionResponse> {
    if (!isSupportedPaymentMethod(paymentMethod)) {
      throw new AppError(MESSAGES.PAYMENT_METHOD_NOT_SUPPORTED, HTTP_STATUS.BAD_REQUEST);
    }

    if (concessions !== undefined) {
      const { bookingService } = await import('./booking.service');
      await bookingService.updateConcessions(bookingId, userId, concessions);
    }

    const booking = await bookingRepository.findByIdAndUser(bookingId, userId);
    if (!booking) {
      throw new AppError('Booking not found', HTTP_STATUS.NOT_FOUND);
    }

    this.assertBookingChargeable(booking.bookingStatus, booking.paymentStatus);

    const expectedGrossAmount = Math.round(booking.totalPrice);
    const existing = await paymentRepository.findActiveByBookingId(bookingId);
    if (existing) {
      if (
        existing.paymentMethod === paymentMethod &&
        existing.grossAmount === expectedGrossAmount &&
        this.hasValidInstruction(existing)
      ) {
        return this.enrichInstruction(mapPaymentRecordToInstruction(existing), booking);
      }

      await midtransService.cancelTransaction(existing.orderId);
      await paymentRepository.deactivateByBookingId(bookingId);
    } else if (booking.bookingStatus === BookingStatus.PENDING) {
      // Clear Snap / pending Core API transaction on same order_id (e.g. from POST /payment/midtrans)
      await midtransService.cancelTransaction(booking.bookingNumber);
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    if (paymentMethod === 'credit_card') {
      if (!tokenId) {
        return this.chargeWithSnapFallback(booking, user);
      }
      return this.chargeWithCardToken(booking, user, tokenId);
    }

    const finishUrl = `${env.appUrl}/bookings/${booking._id.toString()}/payment/finish`;
    const payload = buildCoreChargePayload(booking, user, paymentMethod, finishUrl);

    let charge: MidtransChargeResponse;
    try {
      charge = (await midtransService.chargeTransaction(payload)) as unknown as MidtransChargeResponse;
    } catch (coreApiError) {
      logger.warn('Midtrans Core API charge failed, attempting Snap fallback', {
        bookingId,
        paymentMethod,
        error: coreApiError instanceof Error ? coreApiError.message : coreApiError,
      });

      try {
        return await this.chargeWithSnapFallback(booking, user, paymentMethod);
      } catch (snapError) {
        logger.error('Midtrans Snap fallback also failed', { snapError });
        if (coreApiError instanceof AppError) {
          throw coreApiError;
        }
        throw new AppError(MESSAGES.PAYMENT_PROVIDER_ERROR, HTTP_STATUS.BAD_GATEWAY);
      }
    }

    let recordInput;
    try {
      recordInput = mapChargeResponseToPaymentRecord(booking, user, paymentMethod, charge);
    } catch (error) {
      logger.error('Failed to map Midtrans charge response', {
        bookingId,
        paymentMethod,
        charge,
        error: error instanceof Error ? error.message : error,
      });
      throw new AppError(MESSAGES.PAYMENT_PROVIDER_ERROR, HTTP_STATUS.BAD_GATEWAY);
    }

    const payment = await paymentRepository.create(recordInput);

    await bookingRepository.updatePaymentStatus(bookingId, PaymentStatus.PENDING, BookingStatus.PENDING, {
      paymentMethod: PaymentMethod.MIDTRANS,
      midtransTransactionId: charge.transaction_id,
    });

    logger.info('Midtrans Core API charge created', {
      bookingId,
      orderId: charge.order_id,
      paymentMethod,
      instructionType: payment.instructionType,
    });

    return this.enrichInstruction(mapPaymentRecordToInstruction(payment), booking);
  }

  async getActiveInstruction(
    bookingId: string,
    userId: string
  ): Promise<PaymentInstructionResponse | null> {
    const booking = await bookingRepository.findByIdAndUser(bookingId, userId);
    if (!booking) {
      throw new AppError('Booking not found', HTTP_STATUS.NOT_FOUND);
    }

    const payment = await paymentRepository.findActiveByBookingId(bookingId);
    if (!payment) {
      return null;
    }

    if (payment.grossAmount !== Math.round(booking.totalPrice)) {
      return null;
    }

    return this.enrichInstruction(mapPaymentRecordToInstruction(payment), booking);
  }

  private enrichInstruction(
    instruction: PaymentInstructionResponse,
    booking: IBooking
  ): PaymentInstructionResponse {
    return {
      ...instruction,
      grossAmount: Math.round(booking.totalPrice),
      priceBreakdown: buildPriceBreakdown(booking),
    };
  }

  getMidtransConfig() {
    return {
      clientKey: env.midtrans.clientKey,
      isProduction: env.midtrans.isProduction,
    };
  }

  async syncPaymentFromNotification(
    orderId: string,
    transactionStatus: string,
    paymentResult: 'success' | 'pending' | 'failed',
    transactionId?: string
  ): Promise<void> {
    const paymentStatus =
      paymentResult === 'success'
        ? PaymentStatus.SUCCESS
        : paymentResult === 'failed'
          ? PaymentStatus.FAILED
          : PaymentStatus.PENDING;

    await paymentRepository.updateFromNotification(orderId, {
      transactionStatus,
      paymentStatus,
      transactionId,
    });
  }

  private assertBookingChargeable(bookingStatus: BookingStatus, paymentStatus: PaymentStatus): void {
    if (bookingStatus === BookingStatus.CONFIRMED || paymentStatus === PaymentStatus.SUCCESS) {
      throw new AppError('Payment already processed', HTTP_STATUS.CONFLICT);
    }

    if (bookingStatus !== BookingStatus.PENDING) {
      throw new AppError('Booking is not pending payment', HTTP_STATUS.CONFLICT);
    }
  }

  private async chargeWithSnapFallback(
    booking: Awaited<ReturnType<typeof bookingRepository.findByIdAndUser>>,
    user: NonNullable<Awaited<ReturnType<typeof userRepository.findById>>>,
    paymentMethod: string = 'credit_card'
  ): Promise<PaymentInstructionResponse> {
    if (!booking) {
      throw new AppError('Booking not found', HTTP_STATUS.NOT_FOUND);
    }

    const snap = await midtransService.createSnapTransaction(booking, user);
    let recordInput;

    try {
      recordInput = mapChargeResponseToPaymentRecord(
        booking,
        user,
        paymentMethod,
        {
          order_id: booking.bookingNumber,
          gross_amount: String(Math.round(booking.totalPrice)),
          payment_type: 'snap',
          transaction_status: 'pending',
          status_code: '201',
        },
        {
          snapToken: snap.snapToken,
          clientKey: snap.clientKey,
          redirectUrl: snap.redirectUrl,
        }
      );
    } catch (error) {
      logger.error('Failed to map Snap fallback payment', {
        bookingId: booking._id.toString(),
        error: error instanceof Error ? error.message : error,
      });
      throw new AppError(MESSAGES.PAYMENT_PROVIDER_ERROR, HTTP_STATUS.BAD_GATEWAY);
    }

    const payment = await paymentRepository.create(recordInput);

    await bookingRepository.updatePaymentStatus(booking._id.toString(), PaymentStatus.PENDING, BookingStatus.PENDING, {
      paymentMethod: PaymentMethod.MIDTRANS,
    });

    return this.enrichInstruction(mapPaymentRecordToInstruction(payment), booking);
  }

  private async chargeWithCardToken(
    booking: NonNullable<Awaited<ReturnType<typeof bookingRepository.findByIdAndUser>>>,
    user: NonNullable<Awaited<ReturnType<typeof userRepository.findById>>>,
    tokenId: string
  ): Promise<PaymentInstructionResponse> {
    const bookingId = booking._id.toString();
    const finishUrl = `${env.appUrl}/bookings/${bookingId}/payment/finish`;
    const payload = buildCreditCardChargePayload(booking, user, tokenId, finishUrl);

    let charge: MidtransChargeResponse;
    try {
      charge = (await midtransService.chargeTransaction(payload)) as unknown as MidtransChargeResponse;
    } catch (error) {
      if (error instanceof AppError) {
        if (
          error.statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR ||
          error.statusCode === HTTP_STATUS.CONFLICT
        ) {
          throw new AppError(
            error.statusCode === HTTP_STATUS.CONFLICT
              ? error.message
              : MESSAGES.PAYMENT_PROVIDER_ERROR,
            error.statusCode === HTTP_STATUS.CONFLICT ? HTTP_STATUS.CONFLICT : HTTP_STATUS.BAD_GATEWAY
          );
        }
        throw error;
      }
      throw new AppError(MESSAGES.PAYMENT_PROVIDER_ERROR, HTTP_STATUS.BAD_GATEWAY);
    }

    let recordInput;
    try {
      recordInput = mapChargeResponseToPaymentRecord(booking, user, 'credit_card', charge);
    } catch (error) {
      logger.error('Failed to map Midtrans card charge response', {
        bookingId,
        charge,
        error: error instanceof Error ? error.message : error,
      });
      throw new AppError(MESSAGES.PAYMENT_PROVIDER_ERROR, HTTP_STATUS.BAD_GATEWAY);
    }

    const payment = await paymentRepository.create(recordInput);

    if (recordInput.paymentStatus === PaymentStatus.SUCCESS) {
      const { bookingService } = await import('./booking.service');
      await bookingService.finalizeSuccessfulCharge(bookingId, recordInput.transactionId);
    } else {
      await bookingRepository.updatePaymentStatus(bookingId, PaymentStatus.PENDING, BookingStatus.PENDING, {
        paymentMethod: PaymentMethod.MIDTRANS,
        midtransTransactionId: recordInput.transactionId,
      });
    }

    logger.info('Midtrans card charge created', {
      bookingId,
      orderId: charge.order_id,
      instructionType: payment.instructionType,
      transactionStatus: charge.transaction_status,
      hasRedirectUrl: Boolean(recordInput.redirectUrl),
    });

    return this.enrichInstruction(mapPaymentRecordToInstruction(payment), booking);
  }
}

export const paymentService = new PaymentService();
