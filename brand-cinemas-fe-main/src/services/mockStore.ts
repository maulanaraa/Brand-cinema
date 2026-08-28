import type { IBooking, ICarouselItem, IHall, IMovie, IShowtime } from '@/types';
import { initialMockBookings } from '@/data/mockBookings';
import { mockHalls, mockShowtimes } from '@/data/mockShowtimes';
import { mockMovies } from '@/data/mockMovies';
import { mockCarouselItems } from '@/data/mockCarousel';

export const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

const clone = <T>(value: T): T => structuredClone(value);

let movies = clone(mockMovies);
let halls = clone(mockHalls);
let showtimes = clone(mockShowtimes);
let bookings = clone(initialMockBookings);
let carouselItems = clone(mockCarouselItems);

export const mockStore = {
  getMovies: () => clone(movies),
  setMovies: (next: IMovie[]) => {
    movies = clone(next);
  },
  getHalls: () => clone(halls),
  setHalls: (next: IHall[]) => {
    halls = clone(next);
  },
  getShowtimes: () => clone(showtimes),
  setShowtimes: (next: IShowtime[]) => {
    showtimes = clone(next);
  },
  getBookings: () => clone(bookings),
  setBookings: (next: IBooking[]) => {
    bookings = clone(next);
  },
  getCarouselItems: () => clone(carouselItems),
  setCarouselItems: (next: ICarouselItem[]) => {
    carouselItems = clone(next);
  },
};
