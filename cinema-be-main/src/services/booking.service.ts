import mongoose, { ClientSession } from 'mongoose';
import { Response } from 'express';
import { bookingRepository } from '../repositories/booking.repository';
import { showtimeRepository } from '../repositories/showtime.repository';
import { AppError, sendSeatConflict } from '../helpers/response.helper';
import { HTTP_STATUS, MESSAGES } from '../constants';
import { IBooking } from '../models/Booking';
import { BookingStatus, PaginatedResult, PaymentStatus } from '../types';
import { getPaginationParams, buildSortOption, generateBookingNumber } from '../helpers';
import {
  validateSeatCodes,
  findUnavailableSeats,
  validateSeatsWithinCapacity,
} from '../utils/seat.util';
import { logger } from '../utils/logger.util';
import { midtransService } from './midtrans.service';
import { MidtransNotification } from '../config/midtrans';
import { userRepository } from '../repositories/user.repository';
import { PaymentMethod } from '../types';
import { emailService } from './email.service';
import dayjs from 'dayjs';
import { paymentService } from './payment.service';
import { paymentRepository } from '../repositories/payment.repository';
import {
  ConcessionCartItem,
  getTicketSubtotal,
  resolveConcessionCart,
} from '../utils/bookingConcession.util';
import { formatBookingsForApi } from '../utils/bookingResponse.util';

export interface CreateBookingDto {
  showtimeId: string;
  selectedSeats: string[];
}

export interface PaymentDto {
  status: 'SUCCESS' | 'FAILED';
}

export interface BookingListQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: string;
}

export interface AdminBookingListQuery extends BookingListQuery {
  bookingStatus?: string;
  paymentStatus?: string;
  search?: string;
  movieId?: string;
  date?: string;
}

export interface AdminUpdateBookingStatusDto {
  bookingStatus: BookingStatus;
  paymentStatus?: PaymentStatus;
}

const buildAdminBookingSort = (sort?: string, order?: string): Record<string, 1 | -1> => {
  const allowedSortFields = ['createdAt', 'totalPrice', 'bookingStatus'];
  const field = sort && allowedSortFields.includes(sort) ? sort : 'createdAt';
  const direction: 1 | -1 = order === 'asc' ? 1 : -1;
  return { [field]: direction };
};

const buildLocalMidtransStatus = (
  booking: IBooking,
  overrides?: Partial<MidtransNotification>
): MidtransNotification => ({
  order_id: booking.bookingNumber,
  status_code: '201',
  gross_amount: String(Math.round(booking.totalPrice)),
  signature_key: '',
  transaction_status: 'pending',
  transaction_id: booking.midtransTransactionId || '',
  payment_type: '',
  ...overrides,
});

export class SeatConflictError extends Error {
  public readonly unavailableSeats: string[];

  constructor(unavailableSeats: string[]) {
    super(MESSAGES.SEAT_UNAVAILABLE);
    this.unavailableSeats = unavailableSeats;
    Object.setPrototypeOf(this, SeatConflictError.prototype);
  }
}

const withTransaction = async <T>(fn: (session: ClientSession) => Promise<T>): Promise<T> => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    session.endSession();
  }
};

interface PopulatedUser {
  name?: string;
  email?: string;
}

interface PopulatedMovie {
  title?: string;
  genre?: string;
  duration?: number;
  poster?: string;
}

interface PopulatedShowtime {
  studio?: string;
  date?: Date;
  time?: string;
}

const dispatchETicketEmail = async (bookingId: string): Promise<void> => {
  const booking = await bookingRepository.findById(bookingId);

  if (
    !booking ||
    booking.bookingStatus !== BookingStatus.CONFIRMED ||
    booking.paymentStatus !== PaymentStatus.SUCCESS
  ) {
    return;
  }

  const user = booking.userId as unknown as PopulatedUser;
  const movie = booking.movieId as unknown as PopulatedMovie;
  const showtime = booking.showtimeId as unknown as PopulatedShowtime;

  let email = user?.email;
  let name = user?.name;

  if (!email) {
    const userRecord = await userRepository.findById(booking.userId.toString());
    email = userRecord?.email;
    name = userRecord?.name;
  }

  if (!email) {
    logger.warn('E-ticket email skipped: user email not found', { bookingId });
    return;
  }

  void emailService.sendETicketEmail({
    name: name || 'Moviegoer',
    email,
    bookingId: booking._id.toString(),
    bookingNumber: booking.bookingNumber,
    movieTitle: movie?.title || 'Cinema Ticket',
    movieGenre: movie?.genre || 'Movie',
    movieDuration: movie?.duration || 0,
    moviePoster: movie?.poster || '',
    studio: showtime?.studio || 'Studio',
    showDate: showtime?.date ? dayjs(showtime.date).format('DD/MM/YYYY') : '-',
    showTime: showtime?.time || '-',
    seats: booking.seats,
    totalPrice: booking.totalPrice,
  });
};

export class BookingService {
  async create(userId: string, dto: CreateBookingDto): Promise<IBooking> {
    validateSeatCodes(dto.selectedSeats);

    const execute = async (session?: ClientSession): Promise<IBooking> => {
      const showtime = await showtimeRepository.findByIdRaw(dto.showtimeId, session);

      if (!showtime) {
        throw new AppError('Showtime not found', HTTP_STATUS.NOT_FOUND);
      }

      validateSeatsWithinCapacity(dto.selectedSeats, showtime.totalSeat);

      const unavailable = findUnavailableSeats(dto.selectedSeats, showtime.bookedSeats);
      if (unavailable.length > 0) {
        throw new SeatConflictError(unavailable);
      }

      const remainingSeats = showtime.totalSeat - showtime.bookedSeats.length;
      if (dto.selectedSeats.length > remainingSeats) {
        throw new AppError('Not enough available seats', HTTP_STATUS.BAD_REQUEST);
      }

      const updatedShowtime = await showtimeRepository.atomicBookSeats(
        dto.showtimeId,
        dto.selectedSeats,
        session
      );

      if (!updatedShowtime) {
        const latest = await showtimeRepository.findByIdRaw(dto.showtimeId, session);
        const conflictSeats = findUnavailableSeats(
          dto.selectedSeats,
          latest?.bookedSeats ?? []
        );
        throw new SeatConflictError(conflictSeats.length > 0 ? conflictSeats : dto.selectedSeats);
      }

      const totalPrice = showtime.price * dto.selectedSeats.length;

      return bookingRepository.create(
        {
          bookingNumber: generateBookingNumber(),
          userId: userId as unknown as IBooking['userId'],
          movieId: showtime.movieId,
          showtimeId: showtime._id,
          seats: dto.selectedSeats,
          ticketPrice: totalPrice,
          concessions: [],
          totalPrice,
          bookingStatus: BookingStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
        },
        session
      );
    };

    let booking: IBooking;

    try {
      booking = await withTransaction(execute);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('Transaction numbers are only allowed') ||
          error.message.includes('replica set'))
      ) {
        logger.warn('Transactions unavailable, using atomic update fallback');
        booking = await execute();
      } else {
        throw error;
      }
    }

    logger.info('Booking created', {
      bookingId: booking._id.toString(),
      seats: dto.selectedSeats,
    });

    const populated = await bookingRepository.findById(booking._id.toString());
    return populated!;
  }

  async getMyBookings(
    userId: string,
    query: BookingListQuery
  ): Promise<PaginatedResult<IBooking>> {
    const { page, limit, skip } = getPaginationParams(query);
    const sort = buildSortOption(query.sort, query.order);

    return bookingRepository.findByUser({
      userId,
      page,
      limit,
      skip,
      sort,
    });
  }

  async getById(id: string, userId: string, isAdmin: boolean): Promise<IBooking> {
    const booking = isAdmin
      ? await bookingRepository.findById(id)
      : await bookingRepository.findByIdAndUser(id, userId);

    if (!booking) {
      throw new AppError('Booking not found', HTTP_STATUS.NOT_FOUND);
    }

    return booking;
  }

  async cancel(id: string, userId: string, isAdmin: boolean): Promise<IBooking> {
    const booking = isAdmin
      ? await bookingRepository.findById(id)
      : await bookingRepository.findByIdAndUser(id, userId);

    if (!booking) {
      throw new AppError('Booking not found', HTTP_STATUS.NOT_FOUND);
    }

    if (
      booking.bookingStatus === BookingStatus.CANCELLED ||
      booking.bookingStatus === BookingStatus.EXPIRED
    ) {
      throw new AppError('Booking is already cancelled or expired', HTTP_STATUS.BAD_REQUEST);
    }

    const showtimeId = booking.showtimeId._id
      ? booking.showtimeId._id.toString()
      : booking.showtimeId.toString();

    const execute = async (session?: ClientSession): Promise<IBooking> => {
      await showtimeRepository.releaseSeats(showtimeId, booking.seats, session);
      const cancelled = await bookingRepository.cancelBooking(id, session);
      return cancelled!;
    };

    let cancelled: IBooking;

    try {
      cancelled = await withTransaction(execute);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('Transaction numbers are only allowed') ||
          error.message.includes('replica set'))
      ) {
        cancelled = await execute();
      } else {
        throw error;
      }
    }

    logger.info('Booking cancelled', { bookingId: id });
    return cancelled;
  }

  async updateAdminStatus(id: string, dto: AdminUpdateBookingStatusDto): Promise<IBooking> {
    const booking = await bookingRepository.findById(id);
    if (!booking) {
      throw new AppError('Booking not found', HTTP_STATUS.NOT_FOUND);
    }

    if (
      (booking.bookingStatus === BookingStatus.CANCELLED ||
        booking.bookingStatus === BookingStatus.EXPIRED) &&
      (dto.bookingStatus === BookingStatus.CONFIRMED || dto.bookingStatus === BookingStatus.PENDING)
    ) {
      throw new AppError('Cannot update a cancelled or expired booking', HTTP_STATUS.BAD_REQUEST);
    }

    const showtimeId = booking.showtimeId._id
      ? booking.showtimeId._id.toString()
      : booking.showtimeId.toString();

    const shouldReleaseSeats =
      (dto.bookingStatus === BookingStatus.CANCELLED ||
        dto.bookingStatus === BookingStatus.EXPIRED) &&
      (booking.bookingStatus === BookingStatus.PENDING ||
        booking.bookingStatus === BookingStatus.CONFIRMED);

    const paymentStatus =
      dto.paymentStatus ??
      (dto.bookingStatus === BookingStatus.CONFIRMED
        ? PaymentStatus.SUCCESS
        : booking.paymentStatus);

    let updated: IBooking;

    const execute = async (session?: ClientSession): Promise<IBooking> => {
      if (shouldReleaseSeats) {
        await showtimeRepository.releaseSeats(showtimeId, booking.seats, session);
      }

      const result = await bookingRepository.updateStatus(
        id,
        {
          bookingStatus: dto.bookingStatus,
          paymentStatus,
        },
        session
      );

      if (!result) {
        throw new AppError('Booking not found', HTTP_STATUS.NOT_FOUND);
      }

      return result;
    };

    try {
      updated = await withTransaction(execute);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('Transaction numbers are only allowed') ||
          error.message.includes('replica set'))
      ) {
        updated = await execute();
      } else {
        throw error;
      }
    }

    if (
      dto.bookingStatus === BookingStatus.CONFIRMED &&
      paymentStatus === PaymentStatus.SUCCESS
    ) {
      void dispatchETicketEmail(id);
    }

    logger.info('Admin booking status updated', {
      bookingId: id,
      bookingStatus: dto.bookingStatus,
      paymentStatus,
    });

    return updated;
  }

  async updateConcessions(
    id: string,
    userId: string,
    items: ConcessionCartItem[]
  ): Promise<IBooking> {
    const booking = await bookingRepository.findByIdAndUser(id, userId);
    if (!booking) {
      throw new AppError('Booking not found', HTTP_STATUS.NOT_FOUND);
    }

    if (booking.bookingStatus !== BookingStatus.PENDING) {
      throw new AppError('Booking is not pending payment', HTTP_STATUS.CONFLICT);
    }

    if (booking.paymentStatus === PaymentStatus.SUCCESS) {
      throw new AppError('Payment already processed', HTTP_STATUS.CONFLICT);
    }

    const ticketPrice = getTicketSubtotal(booking);
    const { concessions, concessionsSubtotal } = await resolveConcessionCart(items);
    const totalPrice = ticketPrice + concessionsSubtotal;

    const updated = await bookingRepository.updateConcessions(id, userId, {
      ticketPrice,
      concessions,
      totalPrice,
    });

    if (!updated) {
      throw new AppError('Booking not found', HTTP_STATUS.NOT_FOUND);
    }

    const activePayment = await paymentRepository.findActiveByBookingId(id);
    if (activePayment && activePayment.grossAmount !== totalPrice) {
      await midtransService.cancelTransaction(updated.bookingNumber);
      await paymentRepository.deactivateByBookingId(id);
    }

    logger.info('Booking concessions updated', {
      bookingId: id,
      concessionCount: concessions.length,
      ticketPrice,
      totalPrice,
    });

    return updated;
  }

  async createMidtransPayment(
    id: string,
    userId: string
  ): Promise<import('./midtrans.service').SnapTransactionResponse> {
    const booking = await bookingRepository.findByIdAndUser(id, userId);

    if (!booking) {
      throw new AppError('Booking not found', HTTP_STATUS.NOT_FOUND);
    }

    if (booking.bookingStatus !== BookingStatus.PENDING) {
      throw new AppError('Booking is not pending payment', HTTP_STATUS.BAD_REQUEST);
    }

    if (booking.paymentStatus === PaymentStatus.SUCCESS) {
      throw new AppError('Payment already processed', HTTP_STATUS.BAD_REQUEST);
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    const snapTransaction = await midtransService.createSnapTransaction(booking, user);

    await bookingRepository.updatePaymentStatus(
      id,
      PaymentStatus.PENDING,
      BookingStatus.PENDING,
      { paymentMethod: PaymentMethod.MIDTRANS }
    );

    return snapTransaction;
  }

  async finalizeSuccessfulCharge(bookingId: string, midtransTransactionId: string): Promise<void> {
    await bookingRepository.updatePaymentStatus(
      bookingId,
      PaymentStatus.SUCCESS,
      BookingStatus.CONFIRMED,
      {
        paymentMethod: PaymentMethod.MIDTRANS,
        midtransTransactionId,
      }
    );
    void dispatchETicketEmail(bookingId);
  }

  async handleMidtransNotification(notification: MidtransNotification): Promise<void> {
    if (!midtransService.verifyNotification(notification)) {
      throw new AppError('Invalid Midtrans signature', HTTP_STATUS.BAD_REQUEST);
    }

    const booking = await bookingRepository.findByBookingNumber(notification.order_id);
    if (!booking) {
      throw new AppError('Booking not found', HTTP_STATUS.NOT_FOUND);
    }

    if (
      booking.bookingStatus === BookingStatus.CONFIRMED &&
      booking.paymentStatus === PaymentStatus.SUCCESS
    ) {
      return;
    }

    const paymentResult = midtransService.resolvePaymentResult(notification);
    const showtimeId = booking.showtimeId._id
      ? booking.showtimeId._id.toString()
      : booking.showtimeId.toString();
    let shouldSendETicket = false;

    const execute = async (session?: ClientSession): Promise<void> => {
      if (paymentResult === 'success') {
        await bookingRepository.updatePaymentStatus(
          booking._id.toString(),
          PaymentStatus.SUCCESS,
          BookingStatus.CONFIRMED,
          {
            paymentMethod: PaymentMethod.MIDTRANS,
            midtransTransactionId: notification.transaction_id || '',
          },
          session
        );
        logger.info('Midtrans payment successful', {
          bookingId: booking._id.toString(),
          orderId: notification.order_id,
        });
        shouldSendETicket = true;
        return;
      }

      if (paymentResult === 'failed') {
        if (booking.bookingStatus === BookingStatus.PENDING) {
          await showtimeRepository.releaseSeats(showtimeId, booking.seats, session);
        }
        await bookingRepository.updatePaymentStatus(
          booking._id.toString(),
          PaymentStatus.FAILED,
          BookingStatus.CANCELLED,
          {
            paymentMethod: PaymentMethod.MIDTRANS,
            midtransTransactionId: notification.transaction_id || '',
          },
          session
        );
        logger.info('Midtrans payment failed, seats released', {
          bookingId: booking._id.toString(),
          orderId: notification.order_id,
          status: notification.transaction_status,
        });
      }
    };

    try {
      await withTransaction(async (session) => {
        await execute(session);
      });
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('Transaction numbers are only allowed') ||
          error.message.includes('replica set'))
      ) {
        await execute();
      } else {
        throw error;
      }
    }

    if (shouldSendETicket) {
      void dispatchETicketEmail(booking._id.toString());
    }

    void paymentService.syncPaymentFromNotification(
      notification.order_id,
      notification.transaction_status,
      paymentResult,
      notification.transaction_id
    );
  }

  async getMidtransPaymentStatus(
    id: string,
    userId: string
  ): Promise<{ booking: IBooking; midtransStatus: MidtransNotification }> {
    const booking = await bookingRepository.findByIdAndUser(id, userId);

    if (!booking) {
      throw new AppError('Booking not found', HTTP_STATUS.NOT_FOUND);
    }

    if (
      booking.paymentStatus === PaymentStatus.SUCCESS ||
      booking.bookingStatus === BookingStatus.CONFIRMED
    ) {
      return {
        booking,
        midtransStatus: buildLocalMidtransStatus(booking, {
          status_code: '200',
          transaction_status: 'settlement',
        }),
      };
    }

    if (
      booking.paymentStatus === PaymentStatus.FAILED ||
      booking.bookingStatus === BookingStatus.CANCELLED
    ) {
      return {
        booking,
        midtransStatus: buildLocalMidtransStatus(booking, {
          status_code: '202',
          transaction_status: 'deny',
        }),
      };
    }

    const activePayment = await paymentRepository.findActiveByBookingId(id);

    if (!activePayment && !booking.midtransTransactionId) {
      return {
        booking,
        midtransStatus: buildLocalMidtransStatus(booking),
      };
    }

    const midtransStatus = await midtransService.getTransactionStatus(booking.bookingNumber);

    if (!midtransStatus) {
      if (activePayment) {
        return {
          booking,
          midtransStatus: buildLocalMidtransStatus(booking, {
            transaction_status: activePayment.transactionStatus,
            transaction_id: activePayment.transactionId,
            payment_type: activePayment.paymentType,
          }),
        };
      }

      return {
        booking,
        midtransStatus: buildLocalMidtransStatus(booking),
      };
    }

    const paymentResult = midtransService.resolvePaymentResult(midtransStatus);

    if (
      paymentResult === 'success' &&
      booking.bookingStatus === BookingStatus.PENDING &&
      booking.paymentStatus === PaymentStatus.PENDING
    ) {
      await this.handleMidtransNotification(midtransStatus);
      const updated = await bookingRepository.findByIdAndUser(id, userId);
      return { booking: updated!, midtransStatus };
    }

    if (
      paymentResult === 'failed' &&
      booking.bookingStatus === BookingStatus.PENDING
    ) {
      await this.handleMidtransNotification(midtransStatus);
      const updated = await bookingRepository.findByIdAndUser(id, userId);
      return { booking: updated!, midtransStatus };
    }

    return { booking, midtransStatus };
  }

  async processPayment(id: string, userId: string, dto: PaymentDto): Promise<IBooking> {
    const booking = await bookingRepository.findByIdAndUser(id, userId);

    if (!booking) {
      throw new AppError('Booking not found', HTTP_STATUS.NOT_FOUND);
    }

    if (booking.bookingStatus !== BookingStatus.PENDING) {
      throw new AppError('Booking is not pending payment', HTTP_STATUS.BAD_REQUEST);
    }

    if (booking.paymentStatus !== PaymentStatus.PENDING) {
      throw new AppError('Payment already processed', HTTP_STATUS.BAD_REQUEST);
    }

    const showtimeId = booking.showtimeId._id
      ? booking.showtimeId._id.toString()
      : booking.showtimeId.toString();

    const execute = async (session?: ClientSession): Promise<IBooking> => {
      if (dto.status === 'SUCCESS') {
        const result = await bookingRepository.updatePaymentStatus(
          id,
          PaymentStatus.SUCCESS,
          BookingStatus.CONFIRMED,
          { paymentMethod: PaymentMethod.SIMULATION },
          session
        );
        logger.info('Payment successful', { bookingId: id });
        return result!;
      }

      await showtimeRepository.releaseSeats(showtimeId, booking.seats, session);
      const result = await bookingRepository.updatePaymentStatus(
        id,
        PaymentStatus.FAILED,
        BookingStatus.CANCELLED,
        { paymentMethod: PaymentMethod.SIMULATION },
        session
      );
      logger.info('Payment failed, seats released', { bookingId: id });
      return result!;
    };

    try {
      const result = await withTransaction(execute);
      if (dto.status === 'SUCCESS') {
        void dispatchETicketEmail(id);
      }
      return result;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes('Transaction numbers are only allowed') ||
          error.message.includes('replica set'))
      ) {
        const result = await execute();
        if (dto.status === 'SUCCESS') {
          void dispatchETicketEmail(id);
        }
        return result;
      }
      throw error;
    }
  }

  async getAllAdmin(
    query: AdminBookingListQuery
  ): Promise<{ items: Record<string, unknown>[]; pagination: PaginatedResult<IBooking>['pagination'] }> {
    const { page, limit, skip } = getPaginationParams(query);
    const sort = buildAdminBookingSort(query.sort, query.order);

    const result = await bookingRepository.findAllAdmin({
      page,
      limit,
      skip,
      sort,
      bookingStatus: query.bookingStatus as BookingStatus | undefined,
      paymentStatus: query.paymentStatus as PaymentStatus | undefined,
      search: query.search,
      movieId: query.movieId,
      date: query.date,
    });

    return {
      items: formatBookingsForApi(result.items),
      pagination: result.pagination,
    };
  }

  handleSeatConflict(res: Response, error: SeatConflictError): void {
    sendSeatConflict(res, error.unavailableSeats);
  }
}

export const bookingService = new BookingService();
