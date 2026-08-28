import { ClientSession, FilterQuery } from 'mongoose';
import { Booking, IBooking } from '../models/Booking';
import { BookingStatus, PaginatedResult, PaymentMethod, PaymentStatus } from '../types';
import { User } from '../models/User';
import { Movie } from '../models/Movie';
import { Showtime } from '../models/Showtime';

export interface BookingQueryOptions {
  userId?: string;
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, 1 | -1>;
}

export interface AdminBookingQueryOptions extends BookingQueryOptions {
  bookingStatus?: BookingStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  movieId?: string;
  date?: string;
}
export class BookingRepository {
  async create(data: Partial<IBooking>, session?: ClientSession): Promise<IBooking> {
    const booking = new Booking(data);
    if (session) {
      return booking.save({ session });
    }
    return booking.save();
  }

  async findById(id: string): Promise<IBooking | null> {
    return Booking.findOne({ _id: id, isDeleted: false })
      .populate('userId', 'name email')
      .populate('movieId', 'title poster genre duration')
      .populate('showtimeId', 'studio date time price');
  }

  async findByIdAndUser(id: string, userId: string): Promise<IBooking | null> {
    return Booking.findOne({ _id: id, userId, isDeleted: false })
      .populate('movieId', 'title poster genre duration')
      .populate('showtimeId', 'studio date time price');
  }

  async findByUser(options: BookingQueryOptions): Promise<PaginatedResult<IBooking>> {
    const filter: FilterQuery<IBooking> = { isDeleted: false };

    if (options.userId) {
      filter.userId = options.userId;
    }

    const [items, total] = await Promise.all([
      Booking.find(filter)
        .populate('movieId', 'title poster genre')
        .populate('showtimeId', 'studio date time')
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit),
      Booking.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  async findAllAdmin(options: AdminBookingQueryOptions): Promise<PaginatedResult<IBooking>> {
    const filter: FilterQuery<IBooking> = { isDeleted: false };

    if (options.bookingStatus) {
      filter.bookingStatus = options.bookingStatus;
    }

    if (options.paymentStatus) {
      filter.paymentStatus = options.paymentStatus;
    }

    if (options.movieId) {
      filter.movieId = options.movieId;
    }

    if (options.search) {
      const regex = new RegExp(options.search.trim(), 'i');
      const [users, movies] = await Promise.all([
        User.find({ $or: [{ name: regex }, { email: regex }] }).select('_id'),
        Movie.find({ title: regex, isDeleted: false }).select('_id'),
      ]);

      filter.$or = [
        { bookingNumber: regex },
        { userId: { $in: users.map((user) => user._id) } },
        { movieId: { $in: movies.map((movie) => movie._id) } },
      ];
    }

    if (options.date) {
      const startDate = new Date(options.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(options.date);
      endDate.setHours(23, 59, 59, 999);

      const showtimes = await Showtime.find({
        isDeleted: false,
        date: { $gte: startDate, $lte: endDate },
      }).select('_id');

      filter.showtimeId = { $in: showtimes.map((showtime) => showtime._id) };
    }

    const [items, total] = await Promise.all([
      Booking.find(filter)
        .populate('userId', 'name email')
        .populate('movieId', 'title poster duration genre')
        .populate('showtimeId', 'studio date time price')
        .sort(options.sort)
        .skip(options.skip)
        .limit(options.limit),
      Booking.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        total,
        page: options.page,
        limit: options.limit,
        totalPages: Math.ceil(total / options.limit) || 1,
      },
    };
  }
  async findByBookingNumber(bookingNumber: string): Promise<IBooking | null> {
    return Booking.findOne({ bookingNumber, isDeleted: false })
      .populate('movieId', 'title poster genre duration')
      .populate('showtimeId', 'studio date time price');
  }

  async updatePaymentStatus(
    id: string,
    paymentStatus: PaymentStatus,
    bookingStatus: BookingStatus,
    extras?: {
      paymentMethod?: PaymentMethod;
      midtransTransactionId?: string;
    },
    session?: ClientSession
  ): Promise<IBooking | null> {
    const update: Record<string, unknown> = { paymentStatus, bookingStatus };

    if (extras?.paymentMethod) {
      update.paymentMethod = extras.paymentMethod;
    }

    if (extras?.midtransTransactionId) {
      update.midtransTransactionId = extras.midtransTransactionId;
    }

    const query = Booking.findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .populate('movieId', 'title poster')
      .populate('showtimeId', 'studio date time');

    if (session) query.session(session);
    return query;
  }

  async cancelBooking(id: string, session?: ClientSession): Promise<IBooking | null> {
    const query = Booking.findOneAndUpdate(
      { _id: id, isDeleted: false },
      {
        bookingStatus: BookingStatus.CANCELLED,
        paymentStatus: PaymentStatus.FAILED,
      },
      { new: true }
    )
      .populate('userId', 'name email')
      .populate('movieId', 'title poster genre duration')
      .populate('showtimeId', 'studio date time price');

    if (session) query.session(session);
    return query;
  }

  async updateStatus(
    id: string,
    data: {
      bookingStatus: BookingStatus;
      paymentStatus?: PaymentStatus;
    },
    session?: ClientSession
  ): Promise<IBooking | null> {
    const update: Record<string, unknown> = {
      bookingStatus: data.bookingStatus,
    };

    if (data.paymentStatus !== undefined) {
      update.paymentStatus = data.paymentStatus;
    }

    const query = Booking.findOneAndUpdate({ _id: id, isDeleted: false }, update, { new: true })
      .populate('userId', 'name email')
      .populate('movieId', 'title poster genre duration')
      .populate('showtimeId', 'studio date time price');

    if (session) query.session(session);
    return query;
  }

  async updateConcessions(
    id: string,
    userId: string,
    data: {
      ticketPrice: number;
      concessions: IBooking['concessions'];
      totalPrice: number;
    }
  ): Promise<IBooking | null> {
    return Booking.findOneAndUpdate(
      {
        _id: id,
        userId,
        isDeleted: false,
        bookingStatus: BookingStatus.PENDING,
        paymentStatus: { $ne: PaymentStatus.SUCCESS },
      },
      {
        ticketPrice: data.ticketPrice,
        concessions: data.concessions,
        totalPrice: data.totalPrice,
      },
      { new: true, runValidators: true }
    )
      .populate('movieId', 'title poster genre duration')
      .populate('showtimeId', 'studio date time price');
  }

  async softDelete(id: string): Promise<IBooking | null> {
    return Booking.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { bookingStatus: BookingStatus.CANCELLED, isDeleted: true },
      { new: true }
    );
  }

  async count(filter: FilterQuery<IBooking> = {}): Promise<number> {
    return Booking.countDocuments({ ...filter, isDeleted: false });
  }

  async findLatest(limit: number): Promise<IBooking[]> {
    return Booking.find({ isDeleted: false })
      .populate('userId', 'name email')
      .populate('movieId', 'title poster')
      .populate('showtimeId', 'studio date time')
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}

export const bookingRepository = new BookingRepository();
