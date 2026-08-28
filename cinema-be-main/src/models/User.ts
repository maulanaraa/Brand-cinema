import mongoose, { Document, Schema } from 'mongoose';
import { UserRole } from '../types';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string;
  role: UserRole;
  tokenVersion: number;
  isDeleted: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: function (this: IUser) {
        return !this.googleId;
      },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    tokenVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ isDeleted: 1 });

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    delete ret.googleId;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    return ret;
  },
});

export const User = mongoose.model<IUser>('User', userSchema);
