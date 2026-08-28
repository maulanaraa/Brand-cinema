export type MidtransPaymentType =
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

export type PaymentMethodCategory = 'card' | 'ewallet' | 'va' | 'retail';

export interface MidtransPaymentMethod {
  id: MidtransPaymentType;
  label: string;
  description: string;
  category: PaymentMethodCategory;
}

export const PAYMENT_METHOD_CATEGORIES: Record<
  PaymentMethodCategory,
  { label: string; description: string }
> = {
  ewallet: { label: 'E-Wallet', description: 'Pay with mobile wallet' },
  va: { label: 'Virtual Account', description: 'Bank transfer via VA' },
  retail: { label: 'Retail', description: 'Pay at convenience store' },
  card: { label: 'Card', description: 'Credit or debit card' },
};

/** Payment methods for custom checkout UI (filtered by GET /api/payment/methods). */
export const MIDTRANS_PAYMENT_METHODS: MidtransPaymentMethod[] = [
  {
    id: 'gopay',
    label: 'GoPay',
    description: 'Scan QR or open GoPay app',
    category: 'ewallet',
  },
  {
    id: 'shopeepay',
    label: 'ShopeePay',
    description: 'Scan QR or open ShopeePay app',
    category: 'ewallet',
  },
  {
    id: 'dana',
    label: 'DANA',
    description: 'Pay with DANA wallet',
    category: 'ewallet',
  },
  {
    id: 'bca_va',
    label: 'BCA Virtual Account',
    description: 'Transfer to BCA VA number',
    category: 'va',
  },
  {
    id: 'bni_va',
    label: 'BNI Virtual Account',
    description: 'Transfer to BNI VA number',
    category: 'va',
  },
  {
    id: 'bri_va',
    label: 'BRI Virtual Account',
    description: 'Transfer to BRI VA number',
    category: 'va',
  },
  {
    id: 'permata_va',
    label: 'Permata Virtual Account',
    description: 'Transfer to Permata VA number',
    category: 'va',
  },
  {
    id: 'echannel',
    label: 'Mandiri Bill Payment',
    description: 'Pay via Mandiri Livin / ATM',
    category: 'va',
  },
  {
    id: 'indomaret',
    label: 'Indomaret',
    description: 'Pay at Indomaret outlet',
    category: 'retail',
  },
  {
    id: 'alfamart',
    label: 'Alfamart',
    description: 'Pay at Alfamart outlet',
    category: 'retail',
  },
  {
    id: 'credit_card',
    label: 'Credit / Debit Card',
    description: 'Visa, Mastercard, JCB',
    category: 'card',
  },
];

export function getPaymentMethodsByCategory() {
  const grouped = new Map<PaymentMethodCategory, MidtransPaymentMethod[]>();

  for (const method of MIDTRANS_PAYMENT_METHODS) {
    const list = grouped.get(method.category) ?? [];
    list.push(method);
    grouped.set(method.category, list);
  }

  return (Object.keys(PAYMENT_METHOD_CATEGORIES) as PaymentMethodCategory[]).map((category) => ({
    category,
    ...PAYMENT_METHOD_CATEGORIES[category],
    methods: grouped.get(category) ?? [],
  }));
}

export function getPaymentMethodsForIds(enabledIds: string[]) {
  const enabled = new Set(enabledIds);
  return MIDTRANS_PAYMENT_METHODS.filter((method) => enabled.has(method.id));
}

export function getPaymentMethodsByCategoryFromList(methods: MidtransPaymentMethod[]) {
  const grouped = new Map<PaymentMethodCategory, MidtransPaymentMethod[]>();

  for (const method of methods) {
    const list = grouped.get(method.category) ?? [];
    list.push(method);
    grouped.set(method.category, list);
  }

  return (Object.keys(PAYMENT_METHOD_CATEGORIES) as PaymentMethodCategory[])
    .map((category) => ({
      category,
      ...PAYMENT_METHOD_CATEGORIES[category],
      methods: grouped.get(category) ?? [],
    }))
    .filter((group) => group.methods.length > 0);
}
