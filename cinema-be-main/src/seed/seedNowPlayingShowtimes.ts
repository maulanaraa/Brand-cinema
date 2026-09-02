import '../config/dns';
import dayjs from 'dayjs';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Movie } from '../models/Movie';
import { Hall } from '../models/Hall';
import { Showtime } from '../models/Showtime';
import { logger } from '../utils/logger.util';

const TIMES = ['10:30', '13:15', '15:45', '18:30', '21:15'];
const PRICES = [45000, 50000, 55000];

async function seedNowPlayingShowtimes(): Promise<void> {
  try {
    await connectDatabase();
    logger.info('Connected to MongoDB. Generating showtimes for now_playing movies...');

    // 1. Ensure active halls exist
    let halls = await Hall.find({ isActive: true });
    if (halls.length === 0) {
      await Hall.updateMany({}, { isActive: true });
      halls = await Hall.find({ isActive: true });
    }
    if (halls.length === 0) {
      logger.info('No halls found in DB. Creating default studios...');
      halls = await Hall.create([
        { name: 'Studio 1', totalSeats: 50, layoutRows: 5, layoutColumns: 10, isActive: true },
        { name: 'Studio 2', totalSeats: 60, layoutRows: 6, layoutColumns: 10, isActive: true },
        { name: 'Studio 3', totalSeats: 40, layoutRows: 5, layoutColumns: 8, isActive: true },
      ]);
    }

    logger.info(`Using active halls (${halls.length}): ${halls.map((h) => h.name).join(', ')}`);

    // 2. Find now playing movies
    const today = dayjs();
    const nowPlayingMovies = await Movie.find({
      isActive: true,
      isDeleted: false,
      $or: [
        { status: 'now_playing' },
        { status: 'now_showing' },
        { releaseDate: { $lte: today.toDate() } },
      ],
    });

    if (nowPlayingMovies.length === 0) {
      logger.warn('No active now_playing movies found!');
      return;
    }

    logger.info(`Found ${nowPlayingMovies.length} now playing movies.`);

    // 3. Build bulk operations for today + next 7 days
    const DAYS_AHEAD = 7;
    const bulkOps: any[] = [];

    for (let dayOffset = 0; dayOffset <= DAYS_AHEAD; dayOffset++) {
      const dateStr = today.add(dayOffset, 'day').format('YYYY-MM-DD');
      const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

      for (let mIndex = 0; mIndex < nowPlayingMovies.length; mIndex++) {
        const movie = nowPlayingMovies[mIndex];
        const hall = halls[mIndex % halls.length];
        const price = PRICES[mIndex % PRICES.length];

        for (const time of TIMES) {
          bulkOps.push({
            updateOne: {
              filter: {
                movieId: movie._id,
                studio: hall.name,
                date: targetDate,
                time: time,
              },
              update: {
                $setOnInsert: {
                  movieId: movie._id,
                  studio: hall.name,
                  date: targetDate,
                  time: time,
                  price: price,
                  totalSeat: hall.totalSeats,
                  bookedSeats: [],
                  isDeleted: false,
                },
              },
              upsert: true,
            },
          });
        }
      }
    }

    logger.info(`Executing bulkWrite of ${bulkOps.length} showtime operations...`);
    const result = await Showtime.bulkWrite(bulkOps, { ordered: false });

    logger.info(
      `Showtime generation complete! Upserted: ${result.upsertedCount}, Matched/Existing: ${result.matchedCount}`
    );
  } catch (error: any) {
    console.error('Failed to generate showtimes:', error);
  } finally {
    await disconnectDatabase();
  }
}

seedNowPlayingShowtimes();
