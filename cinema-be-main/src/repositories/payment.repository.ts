import { Payment, IPayment } from '../models/Payment';
import { PaymentStatus } from '../types';
import { SavePaymentRecordInput } from '../types/payment.types';

export class PaymentRepository {
  async create(data: SavePaymentRecordInput): Promise<IPayment> {
    const payment = new Payment({
      ...data,
      currency: 'IDR',
      isActive: true,
    });
    return payment.save();
  }

  async deactivateByBookingId(bookingId: string): Promise<void> {
    await Payment.updateMany(
      { bookingId, isActive: true },
      { isActive: false, paymentStatus: PaymentStatus.FAILED }
    );
  }

  async findActiveByBookingId(bookingId: string): Promise<IPayment | null> {
    const now = new Date();
    return Payment.findOne({
      bookingId,
      isActive: true,
      paymentStatus: PaymentStatus.PENDING,
      transactionStatus: 'pending',
      $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
    }).sort({ createdAt: -1 });
  }

  async findByOrderId(orderId: string): Promise<IPayment | null> {
    return Payment.findOne({ orderId, isActive: true }).sort({ createdAt: -1 });
  }

  async updateFromNotification(
    orderId: string,
    data: {
      transactionStatus: string;
      paymentStatus: PaymentStatus;
      transactionId?: string;
    }
  ): Promise<IPayment | null> {
    const update: Record<string, unknown> = {
      transactionStatus: data.transactionStatus,
      paymentStatus: data.paymentStatus,
    };

    if (data.transactionId) {
      update.transactionId = data.transactionId;
    }

    if (data.paymentStatus !== PaymentStatus.PENDING) {
      update.isActive = false;
    }

    return Payment.findOneAndUpdate(
      { orderId, isActive: true },
      update,
      { new: true, sort: { createdAt: -1 } }
    );
  }
}

export const paymentRepository = new PaymentRepository();
