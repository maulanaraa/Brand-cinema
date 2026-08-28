import type { ApiBooking } from './booking';
import type { BookingConcessionLine } from './booking';
import type { MidtransPaymentType } from '@/constants/midtransPaymentMethods';

export interface SnapPaymentData {
  snapToken: string;
  clientKey: string;
  redirectUrl: string;
  orderId: string;
}

export interface PaymentStatusResponse {
  booking: ApiBooking;
  midtransStatus?: {
    order_id: string;
    transaction_status: string;
    status_code: string;
    gross_amount: string;
    transaction_id?: string;
    payment_type?: string;
  };
}

export type PaymentInstructionType =
  | 'qris'
  | 'virtual_account'
  | 'deeplink'
  | 'retail'
  | 'card'
  | 'snap';

export interface PaymentInstructionBase {
  instructionType: PaymentInstructionType;
  orderId: string;
  transactionId: string;
  paymentMethod: MidtransPaymentType | string;
  grossAmount: number;
  currency: 'IDR';
  transactionStatus: string;
  expiresAt?: string;
}

export interface QrisPaymentInstruction extends PaymentInstructionBase {
  instructionType: 'qris';
  qrImageUrl: string;
  acquirer?: string;
}

export interface VirtualAccountPaymentInstruction extends PaymentInstructionBase {
  instructionType: 'virtual_account';
  bank: string;
  vaNumber?: string;
  companyCode?: string;
  billKey?: string;
}

export interface DeeplinkPaymentInstruction extends PaymentInstructionBase {
  instructionType: 'deeplink';
  deeplinkUrl: string;
  qrImageUrl?: string;
}

export interface RetailPaymentInstruction extends PaymentInstructionBase {
  instructionType: 'retail';
  store: string;
  paymentCode: string;
}

export interface CardPaymentInstruction extends PaymentInstructionBase {
  instructionType: 'card';
  redirectUrl?: string;
}

export interface SnapPaymentInstruction extends PaymentInstructionBase {
  instructionType: 'snap';
  snapToken: string;
  clientKey: string;
  redirectUrl: string;
}

export type PaymentInstruction =
  | QrisPaymentInstruction
  | VirtualAccountPaymentInstruction
  | DeeplinkPaymentInstruction
  | RetailPaymentInstruction
  | CardPaymentInstruction
  | SnapPaymentInstruction;

export interface PaymentMethodOption {
  id: MidtransPaymentType;
  label: string;
  category: string;
  enabled: boolean;
}

export interface ChargePaymentRequest {
  paymentMethod: MidtransPaymentType;
  tokenId?: string;
  concessions?: BookingConcessionLine[];
}
