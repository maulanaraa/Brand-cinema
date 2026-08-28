import mongoose, { Document, Schema } from 'mongoose';

export interface IRevokedToken extends Document {
  jti: string;
  expiresAt: Date;
}

const revokedTokenSchema = new Schema<IRevokedToken>(
  {
    jti: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: false,
  }
);

export const RevokedToken = mongoose.model<IRevokedToken>('RevokedToken', revokedTokenSchema);
