interface SnapResult {
  status_code: string;
  status_message: string;
  transaction_id: string;
  order_id: string;
  gross_amount: string;
}

interface SnapPayOptions {
  enabledPayments?: string[];
  selectedPaymentType?: string;
  language?: 'en' | 'id';
  autoCloseDelay?: number;
  uiMode?: 'deeplink' | 'qr' | 'auto';
  onSuccess?: (result: SnapResult) => void;
  onPending?: (result: SnapResult) => void;
  onError?: (result: SnapResult) => void;
  onClose?: () => void;
}

interface Window {
  snap: {
    pay: (token: string, options?: SnapPayOptions) => void;
    show: () => void;
    hide: () => void;
    embed: (token: string, options?: SnapPayOptions & { embedId: string }) => void;
  };
}
