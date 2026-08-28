import { PaymentStatus } from './index';

export type CorePaymentMethod =
  | 'credit_card'
  | 'gopay'
  | 'shopeepay'
  | 'dana'
  | 'bca_va'
  | 'bni_va'
  | 'bri_va'
  | 'permata_va'
  | 'echannel'
  | 'indomaret'
  | 'alfamart';

export type PaymentInstructionType =
  | 'qris'
  | 'virtual_account'
  | 'deeplink'
  | 'retail'
  | 'snap'
  | 'card';

export interface PaymentConcessionLine {
  concessionId: string;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
}

export interface PaymentPriceBreakdown {
  ticketSubtotal: number;
  concessionsSubtotal: number;
  concessions: PaymentConcessionLine[];
}

export interface PaymentInstructionBase {
  orderId: string;
  transactionId: string;
  paymentMethod: string;
  grossAmount: number;
  currency: 'IDR';
  transactionStatus: string;
  expiresAt?: string;
  priceBreakdown?: PaymentPriceBreakdown;
}

export interface QrisInstruction extends PaymentInstructionBase {
  instructionType: 'qris';
  qrImageUrl: string;
  acquirer: string;
}

export interface VirtualAccountInstruction extends PaymentInstructionBase {
  instructionType: 'virtual_account';
  bank: string;
  vaNumber?: string;
  companyCode?: string;
  billKey?: string;
}

export interface DeeplinkInstruction extends PaymentInstructionBase {
  instructionType: 'deeplink';
  deeplinkUrl: string;
  qrImageUrl?: string;
}

export interface RetailInstruction extends PaymentInstructionBase {
  instructionType: 'retail';
  store: 'indomaret' | 'alfamart';
  paymentCode: string;
}

export interface SnapFallbackInstruction extends PaymentInstructionBase {
  instructionType: 'snap';
  snapToken: string;
  clientKey: string;
  redirectUrl: string;
}

export interface CardInstruction extends PaymentInstructionBase {
  instructionType: 'card';
  redirectUrl: string | null;
}

export type PaymentInstructionResponse =
  | QrisInstruction
  | VirtualAccountInstruction
  | DeeplinkInstruction
  | RetailInstruction
  | SnapFallbackInstruction
  | CardInstruction;

export interface PaymentMethodOption {
  id: CorePaymentMethod;
  label: string;
  category: 'card' | 'ewallet' | 'virtual_account' | 'retail';
  instructionType: PaymentInstructionType;
}

export interface MidtransChargeAction {
  name: string;
  method: string;
  url: string;
}

export interface MidtransChargeResponse {
  transaction_id?: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_status: string;
  status_code: string;
  status_message?: string;
  currency?: string;
  expiry_time?: string;
  actions?: MidtransChargeAction[];
  va_numbers?: Array<{ bank: string; va_number: string }>;
  bill_key?: string;
  biller_code?: string;
  payment_code?: string;
  store?: string;
  redirect_url?: string;
  fraud_status?: string;
}

export interface SavePaymentRecordInput {
  bookingId: string;
  userId: string;
  orderId: string;
  transactionId: string;
  paymentMethod: CorePaymentMethod;
  paymentType: string;
  instructionType: PaymentInstructionType;
  grossAmount: number;
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
}
