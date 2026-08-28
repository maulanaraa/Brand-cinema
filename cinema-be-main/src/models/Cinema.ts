import mongoose, { Document, Schema, Types } from 'mongoose';
import { ICity } from './City';

export interface ICinema extends Document {
  name: string;
  cityId: Types.ObjectId | ICity;
  address?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const cinemaSchema = new Schema<ICinema>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    cityId: {
      type: Schema.Types.ObjectId,
      ref: 'City',
      required: [true, 'City is required'],
      index: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

cinemaSchema.index({ cityId: 1, isActive: 1, sortOrder: 1 });
cinemaSchema.index({ name: 1, cityId: 1 }, { unique: true });

export const Cinema = mongoose.model<ICinema>('Cinema', cinemaSchema);
