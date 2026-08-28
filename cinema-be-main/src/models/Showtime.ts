import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IShowtime extends Document {
  movieId: Types.ObjectId;
  studio: string;
  date: Date;
  time: string;
  price: number;
  bookedSeats: string[];
  totalSeat: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const showtimeSchema = new Schema<IShowtime>(
  {
    movieId: {
      type: Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie ID is required'],
    },
    studio: {
      type: String,
      required: [true, 'Studio is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm format'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    bookedSeats: {
      type: [String],
      default: [],
    },
    totalSeat: {
      type: Number,
      required: [true, 'Total seat is required'],
      min: [1, 'Total seat must be at least 1'],
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

showtimeSchema.index({ movieId: 1, date: 1 });
showtimeSchema.index({ isDeleted: 1 });

export const Showtime = mongoose.model<IShowtime>('Showtime', showtimeSchema);
