import mongoose, { Document, Schema } from 'mongoose';
import { MovieStatus } from '../types';

export interface IMovie extends Document {
  title: string;
  genre: string;
  description: string;
  duration: number;
  rating: number;
  poster: string;
  trailerUrl: string;
  language: string;
  releaseDate: Date;
  status: MovieStatus;
  isActive: boolean;
  tmdbId?: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const movieSchema = new Schema<IMovie>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    genre: {
      type: String,
      required: [true, 'Genre is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [1, 'Duration must be at least 1 minute'],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [10, 'Rating cannot exceed 10'],
    },
    poster: {
      type: String,
      default: '',
    },
    trailerUrl: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      trim: true,
    },
    releaseDate: {
      type: Date,
      required: [true, 'Release date is required'],
    },
    status: {
      type: String,
      enum: Object.values(MovieStatus),
      default: MovieStatus.NOW_PLAYING,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tmdbId: {
      type: Number,
      index: true,
      sparse: true,
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

movieSchema.index({ genre: 1 });
movieSchema.index({ isActive: 1, isDeleted: 1 });
movieSchema.index({ status: 1, isActive: 1, isDeleted: 1 });
movieSchema.index({ title: 1 });

export const Movie = mongoose.model<IMovie>('Movie', movieSchema);
