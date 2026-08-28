import type { IBooking } from '@/types';
import { bookingService } from './bookingService';
import { hallService } from './hallService';
import { movieService } from './movieService';
import { showtimeService } from './showtimeService';

function buildWeeklyRevenue(bookings: IBooking[]) {
  const confirmed = bookings.filter((booking) => booking.status === 'confirmed');
  const byDate = new Map<string, number>();

  for (const booking of confirmed) {
    const date = booking.booking_date.split('T')[0];
    byDate.set(date, (byDate.get(date) ?? 0) + booking.total_amount);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, revenue]) => ({ date, revenue }));
}

export const adminService = {
  async getDashboardStats() {
    const [moviesResult, hallsResult, showtimesResult, bookingsResult] = await Promise.all([
      movieService.getMovies({ limit: 1 }),
      hallService.getHalls({ limit: 1 }),
      showtimeService.getShowtimes({ limit: 1 }),
      bookingService.getAdminBookings({ limit: 100 }),
    ]);

    const bookings = bookingsResult.items;
    const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed');
    const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + booking.total_amount, 0);
    const movieCounts = confirmedBookings.reduce<Record<string, number>>((counts, booking) => {
      const title = booking.showtime.movie.title;
      counts[title] = (counts[title] || 0) + booking.total_seats;
      return counts;
    }, {});
    const uniqueUsers = new Set(bookings.map((booking) => booking.user.id || booking.user._id));

    return {
      totalMovies: moviesResult.pagination.total,
      totalHalls: hallsResult.pagination.total,
      totalShowtimes: showtimesResult.pagination.total,
      totalBookings: bookingsResult.pagination.total,
      totalUsers: uniqueUsers.size,
      totalRevenue,
      recentBookings: bookings.slice(0, 5),
      popularMovies: Object.entries(movieCounts)
        .map(([title, seats]) => ({ title, seats }))
        .sort((a, b) => b.seats - a.seats)
        .slice(0, 5),
      weeklyRevenue: buildWeeklyRevenue(bookings),
    };
  },
};
