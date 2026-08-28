import mongoose, { Document, Schema, Types } from 'mongoose';

export const CAROUSEL_TYPES = ['movie', 'promotion'] as const;
export type CarouselType = (typeof CAROUSEL_TYPES)[number];

export interface ICarousel extends Document {
  type: CarouselType;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  movieId: Types.ObjectId | null;
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const carouselSchema = new Schema<ICarousel>(
  {
    type: {
      type: String,
      enum: CAROUSEL_TYPES,
      required: [true, 'Type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    imageUrl: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    linkUrl: {
      type: String,
      default: '',
      trim: true,
    },
    movieId: {
      type: Schema.Types.ObjectId,
      ref: 'Movie',
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 1,
      min: [0, 'Order cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

carouselSchema.index({ isActive: 1, order: 1 });
carouselSchema.index({ type: 1 });
carouselSchema.index({ order: 1 });
carouselSchema.index({ title: 'text', description: 'text' });

export const Carousel = mongoose.model<ICarousel>('Carousel', carouselSchema);
