import { IBooking } from '../models/Booking';
import { IUser } from '../models/User';
import { CorePaymentMethod, MidtransChargeResponse, SavePaymentRecordInput } from '../types/payment.types';
import { PaymentStatus } from '../types';
import { PAYMENT_EXPIRY_MINUTES, getRetailStore, getVaBankCode } from '../config/midtransPaymentMethods';
import { IPayment } from '../models/Payment';
import { PaymentInstructionResponse } from '../types/payment.types';
import { getTicketSubtotal } from './bookingConcession.util';

const MIDTRANS_ITEM_NAME_MAX = 50;
const MIDTRANS_ITEM_ID_MAX = 50;

interface PopulatedMovie {
  title?: string;
}

interface PopulatedShowtime {
  studio?: string;
}

const truncateField = (value: string, maxLength: number): string =>
  value.length <= maxLength ? value : value.slice(0, maxLength - 3) + '...';

export const formatMidtransExpiryStart = (): string => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '00';

  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')} +0700`;
};

export const buildExpiryDate = (): Date =>
  new Date(Date.now() + PAYMENT_EXPIRY_MINUTES * 60 * 1000);

export const resolvePaymentExpiresAt = (_charge?: MidtransChargeResponse): Date => buildExpiryDate();

export const buildChargeItemDetails = (booking: IBooking): Array<{
  id: string;
  name: string;
  price: number;
  quantity: number;
}> => {
  const movie = booking.movieId as unknown as PopulatedMovie;
  const showtime = booking.showtimeId as unknown as PopulatedShowtime;
  const ticketSubtotal = getTicketSubtotal(booking);
  const seatQuantity = booking.seats.length || 1;
  const itemName = truncateField(
    `${movie?.title || 'Cinema Ticket'} - ${showtime?.studio || 'Studio'}`,
    MIDTRANS_ITEM_NAME_MAX
  );
  const itemId = truncateField(booking.showtimeId.toString(), MIDTRANS_ITEM_ID_MAX);
  const items: Array<{ id: string; name: string; price: number; quantity: number }> = [];

  if (seatQuantity > 1 && ticketSubtotal % seatQuantity === 0) {
    items.push({ id: itemId, name: itemName, price: ticketSubtotal / seatQuantity, quantity: seatQuantity });
  } else {
    items.push({
      id: itemId,
      name:
        seatQuantity > 1
          ? truncateField(`Cinema Ticket (${seatQuantity}x) - ${showtime?.studio || 'Studio'}`, MIDTRANS_ITEM_NAME_MAX)
          : itemName,
      price: ticketSubtotal,
      quantity: 1,
    });
  }

  for (const concession of booking.concessions || []) {
    const concessionId = truncateField(concession.concessionId.toString(), MIDTRANS_ITEM_ID_MAX);
    const concessionName = truncateField(concession.name, MIDTRANS_ITEM_NAME_MAX);

    if (concession.quantity > 1 && concession.lineTotal % concession.quantity === 0) {
      items.push({
        id: `fnb-${concessionId}`,
        name: concessionName,
        price: concession.lineTotal / concession.quantity,
        quantity: concession.quantity,
      });
    } else {
      items.push({
        id: `fnb-${concessionId}`,
        name: concessionName,
        price: concession.lineTotal,
        quantity: 1,
      });
    }
  }

  // Midtrans requires the sum of items to exactly equal the transaction gross_amount
  const grossAmount = Math.round(booking.totalPrice);
  const currentSum = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const diff = grossAmount - currentSum;
  if (diff !== 0) {
    if (items.length > 0) {
      items[0].price += diff;
    } else {
      items.push({ id: itemId, name: itemName, price: grossAmount, quantity: 1 });
    }
  }

  return items;
};

export const buildCoreChargePayload = (
  booking: IBooking,
  user: IUser,
  paymentMethod: CorePaymentMethod,
  finishUrl: string
): Record<string, unknown> => {
  const grossAmount = Math.round(booking.totalPrice);
  const base = {
    transaction_details: {
      order_id: booking.bookingNumber,
      gross_amount: grossAmount,
    },
    customer_details: {
      first_name: user.name,
      email: user.email,
    },
    item_details: buildChargeItemDetails(booking),
    expiry: {
      start_time: formatMidtransExpiryStart(),
      unit: 'minutes',
      duration: PAYMENT_EXPIRY_MINUTES,
    },
  };

  if (paymentMethod === 'gopay') {
    return {
      ...base,
      payment_type: 'qris',
      qris: { acquirer: 'gopay' },
    };
  }

  if (paymentMethod === 'shopeepay') {
    return {
      ...base,
      payment_type: 'qris',
      qris: { acquirer: 'airpay shopee' },
    };
  }

  if (paymentMethod === 'dana') {
    return {
      ...base,
      payment_type: 'dana',
      dana: { callback_url: finishUrl },
    };
  }

  const vaBank = getVaBankCode(paymentMethod);
  if (vaBank) {
    return {
      ...base,
      payment_type: 'bank_transfer',
      bank_transfer: { bank: vaBank },
    };
  }

  if (paymentMethod === 'echannel') {
    return {
      ...base,
      payment_type: 'echannel',
      echannel: {
        bill_info1: 'Payment:',
        bill_info2: 'Cinema booking',
      },
    };
  }

  const retailStore = getRetailStore(paymentMethod);
  if (retailStore) {
    return {
      ...base,
      payment_type: 'cstore',
      cstore: {
        store: retailStore,
        message: 'Brand Cinemas ticket',
      },
    };
  }

  throw new Error(`Unsupported payment method: ${paymentMethod}`);
};

export const buildCreditCardChargePayload = (
  booking: IBooking,
  user: IUser,
  tokenId: string,
  finishUrl: string
): Record<string, unknown> => ({
  payment_type: 'credit_card',
  transaction_details: {
    order_id: booking.bookingNumber,
    gross_amount: Math.round(booking.totalPrice),
  },
  customer_details: {
    first_name: user.name,
    email: user.email,
  },
  item_details: buildChargeItemDetails(booking),
  credit_card: {
    token_id: tokenId,
    authentication: true,
  },
  callbacks: {
    finish: finishUrl,
  },
});

const findActionUrl = (response: MidtransChargeResponse, names: string[]): string | undefined => {
  const action = response.actions?.find((item) => names.includes(item.name));
  return action?.url;
};

export const resolveTransactionId = (
  charge: MidtransChargeResponse,
  _paymentMethod: string,
  orderId: string
): string => {
  if (charge.transaction_id) {
    return charge.transaction_id;
  }

  return `snap-${orderId}`;
};

export const mapChargeResponseToPaymentRecord = (
  booking: IBooking,
  user: IUser,
  paymentMethod: CorePaymentMethod,
  charge: MidtransChargeResponse,
  snapExtras?: { snapToken: string; clientKey: string; redirectUrl: string }
): SavePaymentRecordInput => {
  const grossAmount = Math.round(booking.totalPrice);
  const expiresAt = resolvePaymentExpiresAt(charge);
  const orderId = charge.order_id || booking.bookingNumber;

  const base: SavePaymentRecordInput = {
    bookingId: booking._id.toString(),
    userId: user._id.toString(),
    orderId,
    transactionId: resolveTransactionId(charge, paymentMethod, orderId),
    paymentMethod,
    paymentType: charge.payment_type,
    instructionType: 'qris',
    grossAmount,
    transactionStatus: charge.transaction_status,
    paymentStatus: PaymentStatus.PENDING,
    expiresAt,
    rawChargeResponse: charge as unknown as Record<string, unknown>,
  };

  if (snapExtras) {
    return {
      ...base,
      instructionType: 'snap',
      paymentType: 'snap',
      snapToken: snapExtras.snapToken,
      clientKey: snapExtras.clientKey,
      redirectUrl: snapExtras.redirectUrl,
    };
  }

  if (paymentMethod === 'gopay' || paymentMethod === 'shopeepay') {
    const qrImageUrl = findActionUrl(charge, ['generate-qr-code-v2', 'generate-qr-code']);
    if (!qrImageUrl) {
      throw new Error('QR code URL not found in Midtrans response');
    }

    return {
      ...base,
      instructionType: 'qris',
      qrImageUrl,
      acquirer: paymentMethod === 'gopay' ? 'gopay' : 'airpay shopee',
    };
  }

  if (paymentMethod === 'dana') {
    const deeplinkUrl = findActionUrl(charge, ['deeplink-redirect']);
    const qrImageUrl = findActionUrl(charge, ['generate-qr-code-v2', 'generate-qr-code']);

    if (!deeplinkUrl && !qrImageUrl) {
      throw new Error('DANA payment instructions not found in Midtrans response');
    }

    return {
      ...base,
      instructionType: 'deeplink',
      deeplinkUrl: deeplinkUrl || '',
      qrImageUrl,
    };
  }

  const vaBank = getVaBankCode(paymentMethod);
  if (vaBank) {
    const vaNumber = charge.va_numbers?.[0]?.va_number;
    if (!vaNumber) {
      throw new Error('Virtual account number not found in Midtrans response');
    }

    return {
      ...base,
      instructionType: 'virtual_account',
      bank: charge.va_numbers?.[0]?.bank || vaBank,
      vaNumber,
    };
  }

  if (paymentMethod === 'echannel') {
    if (!charge.bill_key || !charge.biller_code) {
      throw new Error('Mandiri bill payment details not found in Midtrans response');
    }

    return {
      ...base,
      instructionType: 'virtual_account',
      bank: 'mandiri',
      companyCode: charge.biller_code,
      billKey: charge.bill_key,
    };
  }

  const retailStore = getRetailStore(paymentMethod);
  if (retailStore) {
    if (!charge.payment_code) {
      throw new Error('Retail payment code not found in Midtrans response');
    }

    return {
      ...base,
      instructionType: 'retail',
      store: retailStore,
      paymentCode: charge.payment_code,
    };
  }

  if (paymentMethod === 'credit_card') {
    const redirectUrl =
      charge.redirect_url ||
      findActionUrl(charge, ['redirect-url', 'redirect_url', 'redirect-3ds-url']) ||
      '';

    const isImmediateSuccess =
      ['capture', 'settlement'].includes(charge.transaction_status) &&
      (!charge.fraud_status || charge.fraud_status === 'accept');

    return {
      ...base,
      instructionType: 'card',
      paymentType: 'credit_card',
      redirectUrl: redirectUrl || undefined,
      paymentStatus: isImmediateSuccess ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
    };
  }

  throw new Error(`Unable to map charge response for method: ${paymentMethod}`);
};

export const mapPaymentRecordToInstruction = (payment: IPayment): PaymentInstructionResponse => {
  const base = {
    orderId: payment.orderId,
    transactionId: payment.transactionId,
    paymentMethod: payment.paymentMethod,
    grossAmount: payment.grossAmount,
    currency: 'IDR' as const,
    transactionStatus: payment.transactionStatus,
    expiresAt: payment.expiresAt?.toISOString(),
  };

  switch (payment.instructionType) {
    case 'qris':
      return {
        ...base,
        instructionType: 'qris',
        qrImageUrl: payment.qrImageUrl || '',
        acquirer: payment.acquirer || 'gopay',
      };
    case 'virtual_account':
      return {
        ...base,
        instructionType: 'virtual_account',
        bank: payment.bank || 'unknown',
        vaNumber: payment.vaNumber || undefined,
        companyCode: payment.companyCode || undefined,
        billKey: payment.billKey || undefined,
      };
    case 'deeplink':
      return {
        ...base,
        instructionType: 'deeplink',
        deeplinkUrl: payment.deeplinkUrl || '',
        qrImageUrl: payment.qrImageUrl || undefined,
      };
    case 'retail':
      return {
        ...base,
        instructionType: 'retail',
        store: (payment.store as 'indomaret' | 'alfamart') || 'indomaret',
        paymentCode: payment.paymentCode || '',
      };
    case 'snap':
      return {
        ...base,
        instructionType: 'snap',
        snapToken: payment.snapToken || '',
        clientKey: payment.clientKey || '',
        redirectUrl: payment.redirectUrl || '',
      };
    case 'card':
      return {
        ...base,
        instructionType: 'card',
        redirectUrl: payment.redirectUrl || null,
      };
    default:
      throw new Error(`Unknown instruction type: ${payment.instructionType}`);
  }
};
