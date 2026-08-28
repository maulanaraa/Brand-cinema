import crypto from 'crypto';
import { env } from './env';

export interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  transaction_id?: string;
  payment_type?: string;
}

export const verifyMidtransSignature = (notification: MidtransNotification): boolean => {
  const payload = `${notification.order_id}${notification.status_code}${notification.gross_amount}${env.midtrans.serverKey}`;
  const expected = crypto.createHash('sha512').update(payload).digest('hex');
  return expected === notification.signature_key;
};

export type MidtransPaymentResult = 'success' | 'pending' | 'failed';

export const mapMidtransTransactionStatus = (
  transactionStatus: string,
  fraudStatus?: string
): MidtransPaymentResult => {
  if (transactionStatus === 'capture') {
    return fraudStatus === 'accept' || !fraudStatus ? 'success' : 'pending';
  }

  if (transactionStatus === 'settlement') {
    return 'success';
  }

  if (transactionStatus === 'pending') {
    return 'pending';
  }

  if (['deny', 'cancel', 'expire', 'failure'].includes(transactionStatus)) {
    return 'failed';
  }

  return 'pending';
};
