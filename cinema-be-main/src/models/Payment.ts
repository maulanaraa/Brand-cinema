import mongoose, { Document, Schema, Types } from 'mongoose';
import { PaymentInstructionType } from '../types/payment.types';
import { PaymentStatus } from '../types';

export interface IPayment extends Document {
  bookingId: Types.ObjectId;
  userId: Types.ObjectId;
  orderId: string;
  transactionId: string;
  paymentMethod: string;
  paymentType: string;
  instructionType: PaymentInstructionType;
  grossAmount: number;
  currency: string;
  transactionStatus: string;
  paymentStatus: PaymentStatus;
  qrImageUrl?: string;
  acquirer?: string;
  bank?: string;
  vaNumber?: string;
  companyCode?: string;
  billKey?: string;
  deeplinkUrl?: string;
  paymentCode?: string;
  store?: string;
  snapToken?: string;
  clientKey?: string;
  redirectUrl?: string;
  expiresAt?: Date;
  rawChargeResponse?: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    transactionId: {
      type: String,
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    paymentType: {
      type: String,
      required: true,
    },
    instructionType: {
      type: String,
      enum: ['qris', 'virtual_account', 'deeplink', 'retail', 'snap', 'card'],
      required: true,
    },
    grossAmount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'IDR',
    },
    transactionStatus: {
      type: String,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    qrImageUrl: { type: String, default: '' },
    acquirer: { type: String, default: '' },
    bank: { type: String, default: '' },
    vaNumber: { type: String, default: '' },
    companyCode: { type: String, default: '' },
    billKey: { type: String, default: '' },
    deeplinkUrl: { type: String, default: '' },
    paymentCode: { type: String, default: '' },
    store: { type: String, default: '' },
    snapToken: { type: String, default: '' },
    clientKey: { type: String, default: '' },
    redirectUrl: { type: String, default: '' },
    expiresAt: { type: Date },
    rawChargeResponse: { type: Schema.Types.Mixed },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ bookingId: 1, isActive: 1 });
paymentSchema.index({ orderId: 1, paymentMethod: 1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
