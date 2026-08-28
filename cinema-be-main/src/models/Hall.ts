import mongoose, { Document, Schema } from 'mongoose';

export interface IHall extends Document {
  name: string;
  totalSeats: number;
  layoutRows: number;
  layoutColumns: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const hallSchema = new Schema<IHall>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      unique: true,
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'Total seats must be at least 1'],
    },
    layoutRows: {
      type: Number,
      required: [true, 'Layout rows is required'],
      min: [1, 'Layout rows must be at least 1'],
    },
    layoutColumns: {
      type: Number,
      required: [true, 'Layout columns is required'],
      min: [1, 'Layout columns must be at least 1'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

hallSchema.index({ isActive: 1 });

export const Hall = mongoose.model<IHall>('Hall', hallSchema);
