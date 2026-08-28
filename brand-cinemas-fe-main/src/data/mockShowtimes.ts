import type { IHall, IShowtime } from '@/types';
import { mockMovies } from './mockMovies';

const now = '2026-07-07T00:00:00.000Z';

export const mockHalls: IHall[] = [
  {
    _id: 'hall-1',
    hall_name: 'Studio 1',
    total_seats: 100,
    layout_rows: 10,
    layout_columns: 10,
    is_active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'hall-2',
    hall_name: 'Studio 2',
    total_seats: 100,
    layout_rows: 10,
    layout_columns: 10,
    is_active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    _id: 'hall-3',
    hall_name: 'Premiere Hall',
    total_seats: 100,
    layout_rows: 10,
    layout_columns: 10,
    is_active: true,
    createdAt: now,
    updatedAt: now,
  },
];

const movie = (id: string) => mockMovies.find((item) => item._id === id)!;
const hall = (id: string) => mockHalls.find((item) => item._id === id)!;

export const mockShowtimes: IShowtime[] = [
  { _id: 'showtime-1', movie: movie('movie-1'), hall: hall('hall-1'), show_date: '2026-07-08T00:00:00.000Z', start_time: '13:00', end_time: '15:08' },
  { _id: 'showtime-2', movie: movie('movie-1'), hall: hall('hall-2'), show_date: '2026-07-08T00:00:00.000Z', start_time: '19:30', end_time: '21:38' },
  { _id: 'showtime-3', movie: movie('movie-2'), hall: hall('hall-1'), show_date: '2026-07-08T00:00:00.000Z', start_time: '16:00', end_time: '17:56' },
  { _id: 'showtime-4', movie: movie('movie-3'), hall: hall('hall-3'), show_date: '2026-07-09T00:00:00.000Z', start_time: '20:00', end_time: '22:22' },
  { _id: 'showtime-5', movie: movie('movie-4'), hall: hall('hall-2'), show_date: '2026-07-09T00:00:00.000Z', start_time: '18:45', end_time: '20:29' },
  { _id: 'showtime-6', movie: movie('movie-5'), hall: hall('hall-1'), show_date: '2026-07-10T00:00:00.000Z', start_time: '14:30', end_time: '16:08' },
  { _id: 'showtime-7', movie: movie('movie-6'), hall: hall('hall-3'), show_date: '2026-08-15T00:00:00.000Z', start_time: '17:00', end_time: '19:01' },
  { _id: 'showtime-8', movie: movie('movie-8'), hall: hall('hall-2'), show_date: '2026-08-01T00:00:00.000Z', start_time: '11:00', end_time: '12:50' },
  // movie-1 additional
  { _id: 'showtime-9', movie: movie('movie-1'), hall: hall('hall-3'), show_date: '2026-07-09T00:00:00.000Z', start_time: '10:00', end_time: '12:08' },
  { _id: 'showtime-10', movie: movie('movie-1'), hall: hall('hall-1'), show_date: '2026-07-10T00:00:00.000Z', start_time: '16:00', end_time: '18:08' },
  // movie-2 additional
  { _id: 'showtime-11', movie: movie('movie-2'), hall: hall('hall-2'), show_date: '2026-07-09T00:00:00.000Z', start_time: '13:00', end_time: '14:56' },
  { _id: 'showtime-12', movie: movie('movie-2'), hall: hall('hall-1'), show_date: '2026-07-11T00:00:00.000Z', start_time: '19:00', end_time: '20:56' },
  // movie-3 additional
  { _id: 'showtime-13', movie: movie('movie-3'), hall: hall('hall-2'), show_date: '2026-07-10T00:00:00.000Z', start_time: '10:00', end_time: '12:22' },
  { _id: 'showtime-14', movie: movie('movie-3'), hall: hall('hall-1'), show_date: '2026-07-11T00:00:00.000Z', start_time: '14:00', end_time: '16:22' },
  // movie-4 additional
  { _id: 'showtime-15', movie: movie('movie-4'), hall: hall('hall-3'), show_date: '2026-07-10T00:00:00.000Z', start_time: '11:00', end_time: '12:44' },
  { _id: 'showtime-16', movie: movie('movie-4'), hall: hall('hall-1'), show_date: '2026-07-12T00:00:00.000Z', start_time: '15:00', end_time: '16:44' },
  // movie-5 additional
  { _id: 'showtime-17', movie: movie('movie-5'), hall: hall('hall-2'), show_date: '2026-07-11T00:00:00.000Z', start_time: '10:00', end_time: '11:38' },
  { _id: 'showtime-18', movie: movie('movie-5'), hall: hall('hall-3'), show_date: '2026-07-12T00:00:00.000Z', start_time: '17:00', end_time: '18:38' },
  // movie-6 additional
  { _id: 'showtime-19', movie: movie('movie-6'), hall: hall('hall-1'), show_date: '2026-08-15T00:00:00.000Z', start_time: '10:00', end_time: '12:01' },
  { _id: 'showtime-20', movie: movie('movie-6'), hall: hall('hall-2'), show_date: '2026-08-16T00:00:00.000Z', start_time: '14:00', end_time: '16:01' },
  // movie-7 additional
  { _id: 'showtime-21', movie: movie('movie-7'), hall: hall('hall-1'), show_date: '2026-09-03T00:00:00.000Z', start_time: '13:00', end_time: '15:13' },
  { _id: 'showtime-22', movie: movie('movie-7'), hall: hall('hall-2'), show_date: '2026-09-04T00:00:00.000Z', start_time: '19:00', end_time: '21:13' },
  // movie-8 additional
  { _id: 'showtime-23', movie: movie('movie-8'), hall: hall('hall-3'), show_date: '2026-08-01T00:00:00.000Z', start_time: '15:00', end_time: '16:50' },
  { _id: 'showtime-24', movie: movie('movie-8'), hall: hall('hall-1'), show_date: '2026-08-02T00:00:00.000Z', start_time: '14:00', end_time: '15:50' },
  // movie-9 additional
  { _id: 'showtime-25', movie: movie('movie-9'), hall: hall('hall-2'), show_date: '2026-09-20T00:00:00.000Z', start_time: '16:00', end_time: '18:05' },
  { _id: 'showtime-26', movie: movie('movie-9'), hall: hall('hall-3'), show_date: '2026-09-21T00:00:00.000Z', start_time: '20:00', end_time: '22:05' },
  // movie-10 additional
  { _id: 'showtime-27', movie: movie('movie-10'), hall: hall('hall-1'), show_date: '2026-10-05T00:00:00.000Z', start_time: '11:00', end_time: '12:58' },
  { _id: 'showtime-28', movie: movie('movie-10'), hall: hall('hall-2'), show_date: '2026-10-06T00:00:00.000Z', start_time: '18:00', end_time: '19:58' },
  // second showtime per day
  { _id: 'showtime-29', movie: movie('movie-1'), hall: hall('hall-2'), show_date: '2026-07-09T00:00:00.000Z', start_time: '19:00', end_time: '21:08' },
  { _id: 'showtime-30', movie: movie('movie-1'), hall: hall('hall-3'), show_date: '2026-07-10T00:00:00.000Z', start_time: '20:00', end_time: '22:08' },
  { _id: 'showtime-31', movie: movie('movie-2'), hall: hall('hall-2'), show_date: '2026-07-08T00:00:00.000Z', start_time: '20:00', end_time: '21:56' },
  { _id: 'showtime-32', movie: movie('movie-2'), hall: hall('hall-3'), show_date: '2026-07-09T00:00:00.000Z', start_time: '18:00', end_time: '19:56' },
  { _id: 'showtime-33', movie: movie('movie-2'), hall: hall('hall-2'), show_date: '2026-07-11T00:00:00.000Z', start_time: '11:00', end_time: '12:56' },
  { _id: 'showtime-34', movie: movie('movie-3'), hall: hall('hall-1'), show_date: '2026-07-09T00:00:00.000Z', start_time: '12:00', end_time: '14:22' },
  { _id: 'showtime-35', movie: movie('movie-3'), hall: hall('hall-3'), show_date: '2026-07-10T00:00:00.000Z', start_time: '17:00', end_time: '19:22' },
  { _id: 'showtime-36', movie: movie('movie-3'), hall: hall('hall-2'), show_date: '2026-07-11T00:00:00.000Z', start_time: '20:00', end_time: '22:22' },
  { _id: 'showtime-37', movie: movie('movie-4'), hall: hall('hall-1'), show_date: '2026-07-09T00:00:00.000Z', start_time: '11:00', end_time: '12:44' },
  { _id: 'showtime-38', movie: movie('movie-4'), hall: hall('hall-2'), show_date: '2026-07-10T00:00:00.000Z', start_time: '16:00', end_time: '17:44' },
  { _id: 'showtime-39', movie: movie('movie-4'), hall: hall('hall-3'), show_date: '2026-07-12T00:00:00.000Z', start_time: '20:00', end_time: '21:44' },
  { _id: 'showtime-40', movie: movie('movie-5'), hall: hall('hall-2'), show_date: '2026-07-10T00:00:00.000Z', start_time: '19:00', end_time: '20:38' },
  { _id: 'showtime-41', movie: movie('movie-5'), hall: hall('hall-3'), show_date: '2026-07-11T00:00:00.000Z', start_time: '15:00', end_time: '16:38' },
  { _id: 'showtime-42', movie: movie('movie-5'), hall: hall('hall-1'), show_date: '2026-07-12T00:00:00.000Z', start_time: '11:00', end_time: '12:38' },
  { _id: 'showtime-43', movie: movie('movie-6'), hall: hall('hall-3'), show_date: '2026-08-16T00:00:00.000Z', start_time: '19:00', end_time: '21:01' },
  { _id: 'showtime-44', movie: movie('movie-7'), hall: hall('hall-3'), show_date: '2026-09-03T00:00:00.000Z', start_time: '18:00', end_time: '20:13' },
  { _id: 'showtime-45', movie: movie('movie-7'), hall: hall('hall-1'), show_date: '2026-09-04T00:00:00.000Z', start_time: '11:00', end_time: '13:13' },
  { _id: 'showtime-46', movie: movie('movie-8'), hall: hall('hall-2'), show_date: '2026-08-02T00:00:00.000Z', start_time: '19:00', end_time: '20:50' },
  { _id: 'showtime-47', movie: movie('movie-9'), hall: hall('hall-1'), show_date: '2026-09-20T00:00:00.000Z', start_time: '20:00', end_time: '22:05' },
  { _id: 'showtime-48', movie: movie('movie-9'), hall: hall('hall-1'), show_date: '2026-09-21T00:00:00.000Z', start_time: '12:00', end_time: '14:05' },
  { _id: 'showtime-49', movie: movie('movie-10'), hall: hall('hall-3'), show_date: '2026-10-05T00:00:00.000Z', start_time: '17:00', end_time: '18:58' },
  { _id: 'showtime-50', movie: movie('movie-10'), hall: hall('hall-1'), show_date: '2026-10-06T00:00:00.000Z', start_time: '11:00', end_time: '12:58' },
];
