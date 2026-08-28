import { CorePaymentMethod, PaymentMethodOption } from '../types/payment.types';

export const PAYMENT_EXPIRY_MINUTES = 15;

export const SUPPORTED_PAYMENT_METHODS: CorePaymentMethod[] = [
  'credit_card',
  'gopay',
  'shopeepay',
  'dana',
  'bca_va',
  'bni_va',
  'bri_va',
  'permata_va',
  'echannel',
  'indomaret',
  'alfamart',
];

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
  { id: 'credit_card', label: 'Credit / Debit Card', category: 'card', instructionType: 'card' },
  { id: 'gopay', label: 'GoPay / QRIS', category: 'ewallet', instructionType: 'qris' },
  { id: 'shopeepay', label: 'ShopeePay', category: 'ewallet', instructionType: 'qris' },
  { id: 'dana', label: 'DANA', category: 'ewallet', instructionType: 'deeplink' },
  { id: 'bca_va', label: 'BCA Virtual Account', category: 'virtual_account', instructionType: 'virtual_account' },
  { id: 'bni_va', label: 'BNI Virtual Account', category: 'virtual_account', instructionType: 'virtual_account' },
  { id: 'bri_va', label: 'BRI Virtual Account', category: 'virtual_account', instructionType: 'virtual_account' },
  { id: 'permata_va', label: 'Permata Virtual Account', category: 'virtual_account', instructionType: 'virtual_account' },
  { id: 'echannel', label: 'Mandiri Bill Payment', category: 'virtual_account', instructionType: 'virtual_account' },
  { id: 'indomaret', label: 'Indomaret', category: 'retail', instructionType: 'retail' },
  { id: 'alfamart', label: 'Alfamart', category: 'retail', instructionType: 'retail' },
];

const VA_BANK_MAP: Record<string, string> = {
  bca_va: 'bca',
  bni_va: 'bni',
  bri_va: 'bri',
  permata_va: 'permata',
};

export const isSupportedPaymentMethod = (method: string): method is CorePaymentMethod =>
  SUPPORTED_PAYMENT_METHODS.includes(method as CorePaymentMethod);

export const getVaBankCode = (method: CorePaymentMethod): string | null => VA_BANK_MAP[method] ?? null;

export const getRetailStore = (method: CorePaymentMethod): 'indomaret' | 'alfamart' | null => {
  if (method === 'indomaret' || method === 'alfamart') {
    return method;
  }
  return null;
};
