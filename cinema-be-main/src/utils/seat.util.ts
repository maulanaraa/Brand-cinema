import { SEAT_PATTERN } from '../constants';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS } from '../constants';

export const validateSeatCodes = (seats: string[]): void => {
  if (!seats || seats.length === 0) {
    throw new AppError('At least one seat must be selected', HTTP_STATUS.BAD_REQUEST);
  }

  const uniqueSeats = new Set(seats);
  if (uniqueSeats.size !== seats.length) {
    throw new AppError('Duplicate seats in request', HTTP_STATUS.BAD_REQUEST);
  }

  for (const seat of seats) {
    if (!SEAT_PATTERN.test(seat)) {
      throw new AppError(`Invalid seat code: ${seat}`, HTTP_STATUS.BAD_REQUEST);
    }
  }
};

export const findUnavailableSeats = (
  requestedSeats: string[],
  bookedSeats: string[]
): string[] => {
  const bookedSet = new Set(bookedSeats);
  return requestedSeats.filter((seat) => bookedSet.has(seat));
};

export const validateSeatsWithinCapacity = (
  seats: string[],
  totalSeat: number
): void => {
  for (const seat of seats) {
    const row = seat.charCodeAt(0) - 65;
    const col = parseInt(seat.slice(1), 10);
    const seatIndex = row * 10 + col;

    if (seatIndex > totalSeat) {
      throw new AppError(`Seat ${seat} exceeds studio capacity`, HTTP_STATUS.BAD_REQUEST);
    }
  }
};
