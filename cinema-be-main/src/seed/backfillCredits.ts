import '../config/dns';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Movie } from '../models';
import { tmdbService } from '../services/tmdb.service';
import { logger } from '../utils/logger.util';

const run = async () => {
  try {
    await connectDatabase();
    logger.info('Connected to MongoDB. Starting backfill of Director & Cast for movies...');

    const movies = await Movie.find({ isDeleted: false });
    logger.info(`Found ${movies.length} movies to check/update.`);

    let updatedCount = 0;

    for (const movie of movies) {
      try {
        let tmdbId = movie.tmdbId;

        // If no tmdbId, try searching TMDB by title
        if (!tmdbId) {
          const searchRes = await tmdbService.searchMovies(movie.title);
          if (searchRes.items && searchRes.items.length > 0) {
            tmdbId = searchRes.items[0].tmdbId;
            movie.tmdbId = tmdbId;
          }
        }

        if (tmdbId) {
          const details = await tmdbService.getMovieImportData(tmdbId);
          if (details.director) {
            movie.director = details.director;
          }
          if (details.cast && details.cast.length > 0) {
            movie.cast = details.cast;
          }
          await movie.save();
          updatedCount++;
          logger.info(`Updated "${movie.title}": Director="${movie.director}", Cast=${JSON.stringify(movie.cast)}`);
        } else {
          logger.warn(`Could not find TMDB match for "${movie.title}"`);
        }
      } catch (err) {
        logger.warn(`Failed to backfill movie "${movie.title}":`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    logger.info(`✅ Backfill complete! Updated ${updatedCount}/${movies.length} movies.`);
  } catch (error) {
    logger.error('❌ Error during backfillCredits', {
      error: error instanceof Error ? error.message : String(error),
    });
  } finally {
    await disconnectDatabase();
    process.exit(0);
  }
};

run();
