import type { IMovie, IShowtime } from '@/types';
import type { ApiShowtime, PopulatedMovie } from '@/types/showtime';
import { getPosterFullUrl } from '@/utils/movie';

function toMovieFromPopulated(movie: PopulatedMovie | string, ticketPrice = 0): IMovie {
  if (typeof movie === 'string') {
    return {
      _id: movie,
      title: 'Unknown Movie',
      description: '',
      genre: '',
      duration: 120,
      release_date: new Date().toISOString(),
      poster_url: getPosterFullUrl(),
      ticket_price: ticketPrice,
      status: 'now_showing',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  return {
    _id: movie._id,
    title: movie.title,
    description: '',
    genre: movie.genre,
    duration: movie.duration,
    release_date: new Date().toISOString(),
    poster_url: getPosterFullUrl(movie.poster),
    rating: movie.rating,
    ticket_price: ticketPrice,
    status: 'now_showing',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function computeEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60) % 24;
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

export function extractLocalDateStr(dateInput: string | Date): string {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) {
    return typeof dateInput === 'string' ? dateInput.slice(0, 10) : '';
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toShowtime(api: ApiShowtime): IShowtime {
  const movie = toMovieFromPopulated(api.movieId, api.price);
  const rows = Math.max(1, Math.ceil(api.totalSeat / 10));

  return {
    _id: api._id,
    movie,
    hall: {
      _id: api.studio,
      hall_name: api.studio,
      total_seats: api.totalSeat,
      layout_rows: rows,
      layout_columns: 10,
      createdAt: api.createdAt,
      updatedAt: api.updatedAt,
    },
    show_date: extractLocalDateStr(api.date),
    start_time: api.time,
    end_time: computeEndTime(api.time, movie.duration),
    ticket_price: api.price,
    totalSeat: api.totalSeat,
    studio: api.studio,
  };
}

export function getShowtimeTicketPrice(showtime: Pick<IShowtime, 'ticket_price' | 'movie'>): number {
  return showtime.ticket_price ?? showtime.movie.ticket_price ?? 0;
}

/** Local start datetime from show_date (YYYY-MM-DD or ISO) + start_time (HH:mm). */
export function getShowtimeStartAt(showtime: Pick<IShowtime, 'show_date' | 'start_time'>): Date {
  const datePart = extractLocalDateStr(showtime.show_date);
  const rawTime = showtime.start_time?.trim() || '00:00';
  const timePart = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
  return new Date(`${datePart}T${timePart}`);
}

export function isShowtimePast(
  showtime: Pick<IShowtime, 'show_date' | 'start_time'>,
  now: Date = new Date(),
): boolean {
  const startAt = getShowtimeStartAt(showtime);
  if (Number.isNaN(startAt.getTime())) return true;
  return startAt.getTime() <= now.getTime();
}

export function isShowtimeBookable(
  showtime: Pick<IShowtime, 'show_date' | 'start_time'>,
  now: Date = new Date(),
): boolean {
  return !isShowtimePast(showtime, now);
}

export function filterBookableShowtimes<T extends Pick<IShowtime, 'show_date' | 'start_time'>>(
  showtimes: T[],
  now: Date = new Date(),
): T[] {
  return showtimes.filter((showtime) => isShowtimeBookable(showtime, now));
}

export function generateSeatCodes(totalSeat: number): string[] {
  const seats: string[] = [];

  for (let row = 0; row < 26; row++) {
    for (let col = 1; col <= 10; col++) {
      const index = row * 10 + col;
      if (index > totalSeat) return seats;
      seats.push(`${String.fromCharCode(65 + row)}${col}`);
    }
  }

  return seats;
}

export function groupSeatsByRow(seats: string[]): string[] {
  const rows = new Set<string>();
  seats.forEach((seat) => rows.add(seat.charAt(0)));
  return Array.from(rows).sort();
}
