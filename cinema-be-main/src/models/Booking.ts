import mongoose, { Document, Schema, Types } from 'mongoose';
import { BookingStatus, PaymentMethod, PaymentStatus } from '../types';

export interface IBookingConcessionItem {
  concessionId: Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface IBooking extends Document {
  bookingNumber: string;
  userId: Types.ObjectId;
  movieId: Types.ObjectId;
  showtimeId: Types.ObjectId;
  seats: string[];
  ticketPrice: number;
  concessions: IBookingConcessionItem[];
  totalPrice: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  midtransTransactionId?: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    movieId: {
      type: Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie ID is required'],
    },
    showtimeId: {
      type: Schema.Types.ObjectId,
      ref: 'Showtime',
      required: [true, 'Showtime ID is required'],
    },
    seats: {
      type: [String],
      required: [true, 'Seats are required'],
      validate: {
        validator: (seats: string[]) => seats.length > 0,
        message: 'At least one seat is required',
      },
    },
    ticketPrice: {
      type: Number,
      min: [0, 'Ticket price cannot be negative'],
    },
    concessions: {
      type: [
        {
          concessionId: {
            type: Schema.Types.ObjectId,
            ref: 'Concession',
            required: true,
          },
          name: { type: String, required: true, trim: true },
          price: { type: Number, required: true, min: 0 },
          quantity: { type: Number, required: true, min: 1 },
          lineTotal: { type: Number, required: true, min: 0 },
        },
      ],
      default: [],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price cannot be negative'],
    },
    bookingStatus: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PaymentMethod),
      default: PaymentMethod.MIDTRANS,
    },
    midtransTransactionId: {
      type: String,
      default: '',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

bookingSchema.index({ userId: 1 });
bookingSchema.index({ showtimeId: 1 });
bookingSchema.index({ bookingStatus: 1 });
bookingSchema.index({ isDeleted: 1 });

export const Booking = mongoose.model<IBooking>('Booking', bookingSchema);
