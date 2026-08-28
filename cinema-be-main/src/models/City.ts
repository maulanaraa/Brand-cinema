import mongoose, { Document, Schema } from 'mongoose';

export interface ICity extends Document {
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const citySchema = new Schema<ICity>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      trim: true,
      lowercase: true,
      unique: true,
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

citySchema.index({ isActive: 1, sortOrder: 1 });

export const City = mongoose.model<ICity>('City', citySchema);
