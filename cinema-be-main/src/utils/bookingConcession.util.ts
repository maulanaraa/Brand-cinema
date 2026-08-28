import { Types } from 'mongoose';
import { IBooking, IBookingConcessionItem } from '../models/Booking';
import { concessionRepository } from '../repositories/concession.repository';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS } from '../constants';
import { PaymentPriceBreakdown } from '../types/payment.types';

export interface ConcessionCartItem {
  concessionId: string;
  quantity: number;
}

export const getTicketSubtotal = (booking: IBooking): number =>
  Math.round(booking.ticketPrice ?? booking.totalPrice);

export const getConcessionsSubtotal = (booking: IBooking): number =>
  Math.round((booking.concessions || []).reduce((sum, item) => sum + item.lineTotal, 0));

export const buildPriceBreakdown = (booking: IBooking): PaymentPriceBreakdown => {
  const ticketSubtotal = getTicketSubtotal(booking);
  const concessions = (booking.concessions || []).map((item) => ({
    concessionId: item.concessionId.toString(),
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    lineTotal: item.lineTotal,
  }));
  const concessionsSubtotal = concessions.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    ticketSubtotal,
    concessionsSubtotal,
    concessions,
  };
};

export const resolveConcessionCart = async (
  items: ConcessionCartItem[]
): Promise<{ concessions: IBookingConcessionItem[]; concessionsSubtotal: number }> => {
  if (!items.length) {
    return { concessions: [], concessionsSubtotal: 0 };
  }

  const quantityById = new Map<string, number>();
  for (const item of items) {
    if (item.quantity < 1) {
      throw new AppError('Concession quantity must be at least 1', HTTP_STATUS.BAD_REQUEST);
    }
    const current = quantityById.get(item.concessionId) || 0;
    quantityById.set(item.concessionId, current + item.quantity);
  }

  const concessions: IBookingConcessionItem[] = [];
  let concessionsSubtotal = 0;

  for (const [concessionId, quantity] of quantityById.entries()) {
    const concession = await concessionRepository.findById(concessionId);
    if (!concession || !concession.isActive) {
      throw new AppError(`Concession not available: ${concessionId}`, HTTP_STATUS.BAD_REQUEST);
    }

    const price = Math.round(concession.price);
    const lineTotal = price * quantity;
    concessionsSubtotal += lineTotal;

    concessions.push({
      concessionId: concession._id as Types.ObjectId,
      name: concession.name,
      price,
      quantity,
      lineTotal,
    });
  }

  concessions.sort((a, b) => a.name.localeCompare(b.name));

  return { concessions, concessionsSubtotal };
};
