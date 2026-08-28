import { Response, NextFunction } from 'express';
import { bookingService } from '../services/booking.service';
import { paymentService } from '../services/payment.service';
import { formatBookingForApi } from '../utils/bookingResponse.util';
import { AuthenticatedRequest, asyncHandler } from '../helpers';
import { sendSuccess } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { UserRole } from '../types';

export const createBooking = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const booking = await bookingService.create(req.user!.id, req.body);
    sendSuccess(res, MESSAGES.BOOKING_CREATED, booking, HTTP_STATUS.CREATED);
  }
);

export const getMyBookings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await bookingService.getMyBookings(req.user!.id, req.query);
    sendSuccess(res, MESSAGES.SUCCESS, result);
  }
);

export const getBookingById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const isAdmin = req.user!.role === UserRole.ADMIN;
    const booking = await bookingService.getById(req.params.id, req.user!.id, isAdmin);
    sendSuccess(res, MESSAGES.SUCCESS, formatBookingForApi(booking));
  }
);

export const cancelBooking = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const isAdmin = req.user!.role === UserRole.ADMIN;
    const booking = await bookingService.cancel(req.params.id, req.user!.id, isAdmin);
    sendSuccess(res, MESSAGES.BOOKING_CANCELLED, formatBookingForApi(booking));
  }
);

export const processPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const booking = await bookingService.processPayment(req.params.id, req.user!.id, req.body);
    const message =
      req.body.status === 'SUCCESS' ? MESSAGES.PAYMENT_SUCCESS : MESSAGES.PAYMENT_FAILED;
    sendSuccess(res, message, booking);
  }
);

export const createMidtransPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const snapTransaction = await bookingService.createMidtransPayment(
      req.params.id,
      req.user!.id
    );
    sendSuccess(res, MESSAGES.MIDTRANS_TOKEN_CREATED, snapTransaction);
  }
);

export const getMidtransPaymentStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await bookingService.getMidtransPaymentStatus(req.params.id, req.user!.id);
    sendSuccess(res, MESSAGES.SUCCESS, result);
  }
);

export const chargeBookingPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const instruction = await paymentService.chargeBooking(
      req.params.id,
      req.user!.id,
      req.body.paymentMethod,
      req.body.tokenId,
      req.body.concessions
    );
    sendSuccess(res, MESSAGES.PAYMENT_CHARGE_CREATED, instruction);
  }
);

export const updateBookingConcessions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const booking = await bookingService.updateConcessions(
      req.params.id,
      req.user!.id,
      req.body.concessions ?? []
    );
    sendSuccess(res, MESSAGES.BOOKING_CONCESSIONS_UPDATED, booking);
  }
);

export const getBookingPaymentInstruction = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const instruction = await paymentService.getActiveInstruction(req.params.id, req.user!.id);
    sendSuccess(res, MESSAGES.SUCCESS, instruction);
  }
);

export const getAdminBookings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const result = await bookingService.getAllAdmin(req.query);
    sendSuccess(res, MESSAGES.SUCCESS, result);
  }
);

export const updateAdminBookingStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response, _next: NextFunction): Promise<void> => {
    const booking = await bookingService.updateAdminStatus(req.params.id, req.body);
    sendSuccess(res, MESSAGES.BOOKING_STATUS_UPDATED, formatBookingForApi(booking));
  }
);
