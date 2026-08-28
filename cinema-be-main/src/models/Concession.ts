import mongoose, { Document, Schema } from 'mongoose';

export const CONCESSION_CATEGORIES = ['combo', 'popcorn', 'drinks', 'snacks'] as const;
export type ConcessionCategory = (typeof CONCESSION_CATEGORIES)[number];

export interface IConcession extends Document {
  name: string;
  description: string;
  price: number;
  category: ConcessionCategory;
  imageUrl: string;
  badge?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const concessionSchema = new Schema<IConcession>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    category: {
      type: String,
      enum: CONCESSION_CATEGORIES,
      required: [true, 'Category is required'],
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    badge: {
      type: String,
      default: '',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: [0, 'Sort order cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

concessionSchema.index({ isActive: 1, sortOrder: 1 });
concessionSchema.index({ category: 1 });
concessionSchema.index({ name: 'text', description: 'text' });

export const Concession = mongoose.model<IConcession>('Concession', concessionSchema);
