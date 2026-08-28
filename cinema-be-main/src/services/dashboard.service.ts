import { userRepository } from '../repositories/user.repository';
import { movieRepository } from '../repositories/movie.repository';
import { showtimeRepository } from '../repositories/showtime.repository';
import { bookingRepository } from '../repositories/booking.repository';
import { DashboardStats } from '../types';

export class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const [
      totalUsers,
      totalMovies,
      totalShowtimes,
      totalBookings,
      latestBookings,
      latestMovies,
      latestShowtimes,
    ] = await Promise.all([
      userRepository.count(),
      movieRepository.count(),
      showtimeRepository.count(),
      bookingRepository.count(),
      bookingRepository.findLatest(5),
      movieRepository.findLatest(5),
      showtimeRepository.findLatest(5),
    ]);

    return {
      totalUsers,
      totalMovies,
      totalShowtimes,
      totalBookings,
      latestBookings,
      latestMovies,
      latestShowtimes,
    };
  }
}

export const dashboardService = new DashboardService();
