import '../config/dns';
import dayjs from 'dayjs';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Movie } from '../models/Movie';
import { Hall } from '../models/Hall';
import { Showtime } from '../models/Showtime';
import { logger } from '../utils/logger.util';

const TIMES_3X = ['13:00', '16:30', '20:00'];
const PRICES = [45000, 50000, 55000];

async function reseedShowtimes3x(): Promise<void> {
  try {
    await connectDatabase();
    logger.info('Connected to MongoDB. Reseeding showtimes to strictly max 3 times per day...');

    // 1. Get or create active halls
    let halls = await Hall.find({ isActive: true });
    if (halls.length === 0) {
      halls = await Hall.create([
        { name: 'Studio 1', totalSeats: 50, layoutRows: 5, layoutColumns: 10, isActive: true },
        { name: 'Studio 2', totalSeats: 60, layoutRows: 6, layoutColumns: 10, isActive: true },
        { name: 'Studio 3', totalSeats: 40, layoutRows: 5, layoutColumns: 8, isActive: true },
      ]);
    }

    // 2. Remove existing showtimes without bookings to eliminate duplicates and excessive times
    const deleteRes = await Showtime.deleteMany({
      $or: [{ bookedSeats: { $size: 0 } }, { bookedSeats: { $exists: false } }],
    });
    logger.info(`Removed ${deleteRes.deletedCount} old/duplicate unbooked showtimes.`);

    // 3. Find now playing movies
    const today = dayjs();
    const nowPlayingMovies = await Movie.find({
      isActive: true,
      isDeleted: false,
    });

    logger.info(`Generating 3x daily showtimes for ${nowPlayingMovies.length} movies across 3 days (including today)...`);

    const DAYS_AHEAD = 2; // 0 = today, 1 = tomorrow, 2 = day after tomorrow -> 3 days total
    let createdCount = 0;

    for (let dayOffset = 0; dayOffset <= DAYS_AHEAD; dayOffset++) {
      const dateStr = today.add(dayOffset, 'day').format('YYYY-MM-DD');
      const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

      for (let mIndex = 0; mIndex < nowPlayingMovies.length; mIndex++) {
        const movie = nowPlayingMovies[mIndex];
        const hall = halls[mIndex % halls.length];
        const price = PRICES[mIndex % PRICES.length];

        for (const time of TIMES_3X) {
          await Showtime.create({
            movieId: movie._id,
            studio: hall.name,
            date: targetDate,
            time: time,
            price: price,
            totalSeat: hall.totalSeats,
            bookedSeats: [],
            isDeleted: false,
          });
          createdCount++;
        }
      }
    }

    logger.info(`✅ Reseeded successfully! Created ${createdCount} clean showtimes (3x per day per movie).`);
  } catch (error) {
    logger.error('Failed to reseed showtimes:', {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
}

reseedShowtimes3x();
