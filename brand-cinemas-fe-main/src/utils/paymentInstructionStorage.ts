import type { PaymentInstruction } from '@/types/payment';

const storageKey = (bookingId: string) => `payment-instruction:${bookingId}`;

export function isValidPaymentInstruction(data: unknown): data is PaymentInstruction {
  if (!data || typeof data !== 'object') return false;
  const instruction = data as PaymentInstruction;
  return Boolean(instruction.instructionType && instruction.orderId);
}

export function getCachedPaymentInstruction(bookingId: string): PaymentInstruction | null {
  try {
    const raw = sessionStorage.getItem(storageKey(bookingId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidPaymentInstruction(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function cachePaymentInstruction(bookingId: string, instruction: PaymentInstruction) {
  sessionStorage.setItem(storageKey(bookingId), JSON.stringify(instruction));
}

export function clearCachedPaymentInstruction(bookingId: string) {
  sessionStorage.removeItem(storageKey(bookingId));
}

export function resolvePaymentInstructionSeed(
  bookingId: string,
  locationState: unknown,
): PaymentInstruction | null {
  const fromState = (locationState as { instruction?: PaymentInstruction } | null)?.instruction;
  if (fromState && isValidPaymentInstruction(fromState)) return fromState;
  return getCachedPaymentInstruction(bookingId);
}
