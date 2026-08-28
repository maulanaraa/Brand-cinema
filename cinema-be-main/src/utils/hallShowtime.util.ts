import { hallRepository } from '../repositories/hall.repository';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS } from '../constants';
import { IHall } from '../models/Hall';

export const resolveActiveHallForStudio = async (studio: string): Promise<IHall> => {
  const hall = await hallRepository.findActiveByName(studio.trim());

  if (!hall) {
    throw new AppError(
      'Hall not found or inactive. Create an active hall in Admin → Halls first.',
      HTTP_STATUS.BAD_REQUEST
    );
  }

  return hall;
};

export const assertTotalSeatMatchesHall = (totalSeat: number, hall: IHall): void => {
  if (totalSeat !== hall.totalSeats) {
    throw new AppError(
      `totalSeat must match hall capacity (${hall.totalSeats})`,
      HTTP_STATUS.BAD_REQUEST,
      [`totalSeat must match hall capacity (${hall.totalSeats})`]
    );
  }
};
