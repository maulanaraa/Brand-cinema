import type { SnapPaymentInstruction } from '@/types/payment';
import { loadMidtransSnap } from '@/utils/midtrans';

interface SnapPaymentCallbacks {
  onSuccess: () => void;
  onPending: () => void;
  onError: () => void;
  onClose: () => void;
}

export async function openSnapPayment(
  instruction: SnapPaymentInstruction,
  paymentMethod: string,
  callbacks: SnapPaymentCallbacks,
): Promise<void> {
  await loadMidtransSnap();

  if (!window.snap) {
    throw new Error('Midtrans Snap is not available. Please refresh the page.');
  }

  window.snap.pay(instruction.snapToken, {
    enabledPayments: [paymentMethod],
    selectedPaymentType: paymentMethod,
    language: 'id',
    onSuccess: callbacks.onSuccess,
    onPending: callbacks.onPending,
    onError: callbacks.onError,
    onClose: callbacks.onClose,
  });
}
