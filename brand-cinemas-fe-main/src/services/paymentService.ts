import type {
  ChargePaymentRequest,
  PaymentInstruction,
  PaymentMethodOption,
  PaymentStatusResponse,
  SnapPaymentData,
} from '@/types/payment';
import { isValidPaymentInstruction } from '@/utils/paymentInstructionStorage';
import { ApiError, apiRequest } from './apiClient';

export const paymentService = {
  async getPaymentMethods() {
    const res = await apiRequest<PaymentMethodOption[]>('/api/payment/methods');
    return res.data;
  },

  async chargePayment(bookingId: string, body: ChargePaymentRequest) {
    const res = await apiRequest<PaymentInstruction>(
      `/api/bookings/${bookingId}/payment/charge`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
    if (!isValidPaymentInstruction(res.data)) {
      throw new ApiError(502, 'Invalid payment instruction from charge');
    }
    return res.data;
  },

  async getPaymentInstruction(bookingId: string) {
    const res = await apiRequest<PaymentInstruction | null>(
      `/api/bookings/${bookingId}/payment/instruction`,
    );
    if (!isValidPaymentInstruction(res.data)) {
      throw new ApiError(404, 'No active payment instruction');
    }
    return res.data;
  },

  async createMidtransPayment(bookingId: string) {
    const res = await apiRequest<SnapPaymentData>(
      `/api/bookings/${bookingId}/payment/midtrans`,
      { method: 'POST' },
    );
    return res.data;
  },

  async getPaymentStatus(bookingId: string) {
    const res = await apiRequest<PaymentStatusResponse>(
      `/api/bookings/${bookingId}/payment/status`,
    );
    return res.data;
  },
};
