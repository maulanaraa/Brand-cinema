import '../config/dns';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { tmdbService } from '../services/tmdb.service';
import { logger } from '../utils/logger.util';

const run = async () => {
  try {
    await connectDatabase();
    logger.info('Connected to MongoDB. Starting sync of Indonesian cinema movies...');

    const result = await tmdbService.syncIndonesiaMovies();
    logger.info(`✅ Selesai! Berhasil menyinkronkan total ${result.syncedCount} film bioskop Indonesia.`);
    logger.info(`- Now Playing: ${result.nowPlayingCount} film`);
    logger.info(`- Coming Soon: ${result.upcomingCount} film`);
  } catch (error) {
    logger.error('❌ Error during Indonesia cinema movie sync:', error);
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
};

run();
