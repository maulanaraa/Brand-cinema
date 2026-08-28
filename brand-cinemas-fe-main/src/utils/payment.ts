import { paymentService } from '@/services/paymentService';

export type PaymentPollResult = 'success' | 'failed' | 'pending' | 'timeout';

export async function pollPaymentStatus(
  bookingId: string,
  maxAttempts = 30,
  intervalMs = 5000,
): Promise<PaymentPollResult> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await paymentService.getPaymentStatus(bookingId);
    const { booking, midtransStatus } = status;

    if (booking.bookingStatus === 'CONFIRMED') return 'success';
    if (booking.bookingStatus === 'CANCELLED') return 'failed';

    const txnStatus = midtransStatus?.transaction_status;
    if (
      txnStatus === 'pending' ||
      !txnStatus ||
      booking.paymentStatus === 'PENDING'
    ) {
      if (attempt < maxAttempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        continue;
      }
      return 'pending';
    }
  }

  return 'timeout';
}

export async function syncPaymentAndGetRoute(bookingId: string): Promise<'success' | 'pending' | 'failed'> {
  const status = await paymentService.getPaymentStatus(bookingId);
  const { booking } = status;

  if (booking.bookingStatus === 'CONFIRMED') return 'success';
  if (booking.bookingStatus === 'CANCELLED') return 'failed';
  return 'pending';
}
