import { env } from '../config/env';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS } from '../constants';
import { MovieStatus } from '../types';
import { logger } from '../utils/logger.util';
import { externalHttpsRequest } from '../utils/externalHttp.util';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

interface TmdbGenre {
  id: number;
  name: string;
}

interface TmdbMovieSearchResult {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  original_language: string;
  genre_ids: number[];
}

interface TmdbSearchResponse {
  page: number;
  results: TmdbMovieSearchResult[];
  total_pages: number;
  total_results: number;
}

interface TmdbMovieDetails {
  id: number;
  title: string;
  overview: string;
  runtime: number | null;
  vote_average: number;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  original_language: string;
  genres: TmdbGenre[];
  videos?: {
    results: Array<{
      key: string;
      site: string;
      type: string;
      name: string;
    }>;
  };
}

export interface TmdbSearchItem {
  tmdbId: number;
  title: string;
  overview: string;
  poster: string;
  releaseDate: string;
  rating: number;
  language: string;
}

export interface TmdbSearchResult {
  items: TmdbSearchItem[];
  pagination: {
    page: number;
    totalPages: number;
    totalResults: number;
  };
}

export interface TmdbMovieImportData {
  tmdbId: number;
  title: string;
  description: string;
  duration: number;
  rating: number;
  poster: string;
  backdrop: string;
  trailerUrl: string;
  genre: string;
  language: string;
  releaseDate: string;
  status: MovieStatus;
}

const buildPosterUrl = (path: string | null): string => {
  if (!path) return '';
  return `${TMDB_IMAGE_BASE}${path}`;
};

const buildBackdropUrl = (path: string | null): string => {
  if (!path) return '';
  return `https://image.tmdb.org/t/p/w1280${path}`;
};

const extractTrailerUrl = (movie: TmdbMovieDetails): string => {
  const videos = movie.videos?.results ?? [];
  const trailer =
    videos.find((v) => v.site === 'YouTube' && v.type === 'Trailer') ||
    videos.find((v) => v.site === 'YouTube' && v.type === 'Teaser') ||
    videos.find((v) => v.site === 'YouTube');

  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '';
};

const mapLanguage = (code: string): string => {
  const languages: Record<string, string> = {
    en: 'English',
    id: 'Indonesian',
    ko: 'Korean',
    ja: 'Japanese',
    hi: 'Hindi',
    fr: 'French',
    es: 'Spanish',
    de: 'German',
    zh: 'Chinese',
  };
  return languages[code] || code.toUpperCase();
};

const resolveStatusFromReleaseDate = (releaseDate: string): MovieStatus => {
  if (!releaseDate) return MovieStatus.NOW_PLAYING;

  const release = new Date(releaseDate);
  if (Number.isNaN(release.getTime())) return MovieStatus.NOW_PLAYING;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  release.setHours(0, 0, 0, 0);

  return release > today ? MovieStatus.COMING_SOON : MovieStatus.NOW_PLAYING;
};

export class TmdbService {
  private async request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    if (!env.tmdb.accessToken && !env.tmdb.apiKey) {
      throw new AppError('TMDB is not configured', HTTP_STATUS.SERVICE_UNAVAILABLE);
    }

    const url = new URL(`${TMDB_BASE_URL}${path}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    const tryFetch = async (useApiKey: boolean): Promise<{ status: number; body: string }> => {
      const requestUrl = new URL(url.toString());
      const requestHeaders = { ...headers };

      if (useApiKey) {
        if (!env.tmdb.apiKey) {
          throw new AppError('TMDB API key is not configured', HTTP_STATUS.SERVICE_UNAVAILABLE);
        }
        requestUrl.searchParams.set('api_key', env.tmdb.apiKey);
      } else if (env.tmdb.accessToken) {
        requestHeaders.Authorization = `Bearer ${env.tmdb.accessToken}`;
      } else if (env.tmdb.apiKey) {
        requestUrl.searchParams.set('api_key', env.tmdb.apiKey);
      }

      return externalHttpsRequest(requestUrl.toString(), { headers: requestHeaders });
    };

    let response: { status: number; body: string };

    try {
      const preferApiKey = Boolean(env.tmdb.apiKey && !env.tmdb.accessToken);
      response = await tryFetch(preferApiKey);
    } catch (error) {
      logger.error('TMDB network error', {
        path,
        error: error instanceof Error ? error.message : 'unknown',
      });
      throw new AppError(
        'Unable to reach TMDB API. Ensure VPS allows outbound HTTPS to api.themoviedb.org',
        HTTP_STATUS.SERVICE_UNAVAILABLE
      );
    }

    if (response.status === 401 && env.tmdb.apiKey) {
      logger.warn('TMDB bearer token rejected, retrying with API key');
      try {
        response = await tryFetch(true);
      } catch (error) {
        logger.error('TMDB network error on API key retry', {
          path,
          error: error instanceof Error ? error.message : 'unknown',
        });
        throw new AppError(
          'Unable to reach TMDB API. Ensure VPS allows outbound HTTPS to api.themoviedb.org',
          HTTP_STATUS.SERVICE_UNAVAILABLE
        );
      }
    }

    if (response.status >= 400) {
      let tmdbMessage = 'Failed to fetch data from TMDB';
      try {
        const body = JSON.parse(response.body) as { status_message?: string };
        if (body.status_message) {
          tmdbMessage = `TMDB error: ${body.status_message}`;
        }
      } catch {
        // ignore JSON parse errors
      }

      logger.error('TMDB request failed', {
        path,
        status: response.status,
        message: tmdbMessage,
      });

      if (response.status === 401) {
        throw new AppError(
          'TMDB credentials are invalid. Update TMDB_API_KEY or TMDB_ACCESS_TOKEN in .env',
          HTTP_STATUS.SERVICE_UNAVAILABLE
        );
      }

      throw new AppError(tmdbMessage, HTTP_STATUS.SERVICE_UNAVAILABLE);
    }

    return JSON.parse(response.body) as T;
  }

  async searchMovies(query: string, page = 1): Promise<TmdbSearchResult> {
    const data = await this.request<TmdbSearchResponse>('/search/movie', {
      query,
      page: String(page),
      include_adult: 'false',
      language: 'en-US',
    });

    return {
      items: data.results.map((movie) => ({
        tmdbId: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster: buildPosterUrl(movie.poster_path),
        releaseDate: movie.release_date,
        rating: Math.round(movie.vote_average * 10) / 10,
        language: mapLanguage(movie.original_language),
      })),
      pagination: {
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
      },
    };
  }

  async getMovieImportData(tmdbId: number): Promise<TmdbMovieImportData> {
    const movie = await this.request<TmdbMovieDetails>(`/movie/${tmdbId}`, {
      append_to_response: 'videos',
      language: 'en-US',
    });

    const releaseDate = movie.release_date || new Date().toISOString().split('T')[0];

    return {
      tmdbId: movie.id,
      title: movie.title,
      description: movie.overview || '',
      duration: movie.runtime && movie.runtime > 0 ? movie.runtime : 120,
      rating: Math.round(movie.vote_average * 10) / 10,
      poster: buildPosterUrl(movie.poster_path),
      backdrop: buildBackdropUrl(movie.backdrop_path),
      trailerUrl: extractTrailerUrl(movie),
      genre: movie.genres.map((g) => g.name).join(', ') || 'General',
      language: mapLanguage(movie.original_language),
      releaseDate,
      status: resolveStatusFromReleaseDate(releaseDate),
    };
  }

  async getNowPlaying(page = 1, region = 'ID'): Promise<TmdbSearchResult> {
    const data = await this.request<TmdbSearchResponse>('/movie/now_playing', {
      page: String(page),
      region,
      language: 'id-ID',
    });

    return {
      items: data.results.map((movie) => ({
        tmdbId: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster: buildPosterUrl(movie.poster_path),
        releaseDate: movie.release_date,
        rating: Math.round(movie.vote_average * 10) / 10,
        language: mapLanguage(movie.original_language),
      })),
      pagination: {
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
      },
    };
  }

  async getUpcoming(page = 1, region = 'ID'): Promise<TmdbSearchResult> {
    const data = await this.request<TmdbSearchResponse>('/movie/upcoming', {
      page: String(page),
      region,
      language: 'id-ID',
    });

    return {
      items: data.results.map((movie) => ({
        tmdbId: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster: buildPosterUrl(movie.poster_path),
        releaseDate: movie.release_date,
        rating: Math.round(movie.vote_average * 10) / 10,
        language: mapLanguage(movie.original_language),
      })),
      pagination: {
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
      },
    };
  }

  async getIndonesianMovies(page = 1): Promise<TmdbSearchResult> {
    const currentYear = new Date().getFullYear();
    const data = await this.request<TmdbSearchResponse>('/discover/movie', {
      page: String(page),
      with_original_language: 'id',
      sort_by: 'popularity.desc',
      'primary_release_date.gte': `${currentYear - 1}-01-01`,
      language: 'id-ID',
    });

    return {
      items: data.results.map((movie) => ({
        tmdbId: movie.id,
        title: movie.title,
        overview: movie.overview,
        poster: buildPosterUrl(movie.poster_path),
        releaseDate: movie.release_date,
        rating: Math.round(movie.vote_average * 10) / 10,
        language: 'Indonesian',
      })),
      pagination: {
        page: data.page,
        totalPages: data.total_pages,
        totalResults: data.total_results,
      },
    };
  }

  async syncIndonesiaMovies(): Promise<{
    syncedCount: number;
    nowPlayingCount: number;
    upcomingCount: number;
    movies: any[];
  }> {
    const { Movie, Showtime, Hall } = await import('../models');

    logger.info('Starting Real-Time sync of Indonesia Cinema Movies (Local Indo + International) from TMDB...');

    const [indoRes, nowPlayingRes, upcomingRes] = await Promise.allSettled([
      this.getIndonesianMovies(1),
      this.getNowPlaying(1, 'ID'),
      this.getUpcoming(1, 'ID'),
    ]);

    const indoList = indoRes.status === 'fulfilled' ? indoRes.value.items.slice(0, 10) : [];
    const nowPlayingList = nowPlayingRes.status === 'fulfilled' ? nowPlayingRes.value.items.slice(0, 6) : [];
    const upcomingList = upcomingRes.status === 'fulfilled' ? upcomingRes.value.items.slice(0, 6) : [];

    // Combine Now Playing: Indonesian hits + International in-theater
    const combinedNowPlaying = [...indoList, ...nowPlayingList];
    const seenTmdbIds = new Set<number>();

    const syncedMovies: any[] = [];
    let nowPlayingCount = 0;
    let upcomingCount = 0;

    // 1. Process Now Playing Movies (Indonesian hits + International)
    for (const item of combinedNowPlaying) {
      if (seenTmdbIds.has(item.tmdbId)) continue;
      seenTmdbIds.add(item.tmdbId);

      try {
        const details = await this.getMovieImportData(item.tmdbId);
        
        let movie = await Movie.findOne({
          $or: [{ tmdbId: item.tmdbId }, { title: details.title }],
          isDeleted: false,
        });

        if (movie) {
          movie.title = details.title;
          movie.description = details.description || movie.description;
          movie.duration = details.duration || movie.duration;
          movie.rating = details.rating || movie.rating;
          movie.poster = details.poster || movie.poster;
          movie.trailerUrl = details.trailerUrl || movie.trailerUrl;
          movie.genre = details.genre || movie.genre;
          movie.status = MovieStatus.NOW_PLAYING;
          movie.isActive = true;
          await movie.save();
        } else {
          movie = await Movie.create({
            title: details.title,
            genre: details.genre,
            description: details.description || `${details.title} kini tayang di bioskop Indonesia.`,
            duration: details.duration || 120,
            rating: details.rating || 8.0,
            poster: details.poster,
            trailerUrl: details.trailerUrl,
            language: details.language,
            releaseDate: new Date(details.releaseDate),
            status: MovieStatus.NOW_PLAYING,
            isActive: true,
            tmdbId: details.tmdbId,
          });
        }

        // Generate showtimes for the next 5 days if none exist
        const halls = await Hall.find({ isActive: true });
        const hallName = halls.length > 0 ? halls[0].name : 'Studio 1';
        const hallSeats = halls.length > 0 ? halls[0].totalSeats : 64;

        const showTimes = ['13:00', '15:30', '18:00', '20:30'];
        const prices = [40000, 45000, 50000];

        for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
          const showDate = new Date();
          showDate.setDate(showDate.getDate() + dayOffset);
          showDate.setHours(0, 0, 0, 0);

          for (let i = 0; i < showTimes.length; i++) {
            const time = showTimes[i];
            const existing = await Showtime.findOne({
              movieId: movie._id,
              date: showDate,
              time,
              isDeleted: false,
            });

            if (!existing) {
              await Showtime.create({
                movieId: movie._id,
                studio: hallName,
                date: showDate,
                time,
                price: prices[i % prices.length],
                totalSeat: hallSeats,
                bookedSeats: [],
              });
            }
          }
        }

        syncedMovies.push(movie);
        nowPlayingCount++;
      } catch (err) {
        logger.warn(`Failed to sync now playing movie tmdbId ${item.tmdbId}:`, err);
      }
    }

    // 2. Process Upcoming Movies
    for (const item of upcomingList) {
      if (seenTmdbIds.has(item.tmdbId)) continue;
      seenTmdbIds.add(item.tmdbId);

      try {
        const details = await this.getMovieImportData(item.tmdbId);
        
        let movie = await Movie.findOne({
          $or: [{ tmdbId: item.tmdbId }, { title: details.title }],
          isDeleted: false,
        });

        if (movie) {
          movie.title = details.title;
          movie.description = details.description || movie.description;
          movie.duration = details.duration || movie.duration;
          movie.rating = details.rating || movie.rating;
          movie.poster = details.poster || movie.poster;
          movie.trailerUrl = details.trailerUrl || movie.trailerUrl;
          movie.genre = details.genre || movie.genre;
          movie.status = MovieStatus.COMING_SOON;
          movie.isActive = true;
          await movie.save();
        } else {
          movie = await Movie.create({
            title: details.title,
            genre: details.genre,
            description: details.description || `Saksikan ${details.title} segera di bioskop Cinema.id.`,
            duration: details.duration || 120,
            rating: details.rating || 7.5,
            poster: details.poster,
            trailerUrl: details.trailerUrl,
            language: details.language,
            releaseDate: new Date(details.releaseDate),
            status: MovieStatus.COMING_SOON,
            isActive: true,
            tmdbId: details.tmdbId,
          });
        }

        syncedMovies.push(movie);
        upcomingCount++;
      } catch (err) {
        logger.warn(`Failed to sync upcoming movie tmdbId ${item.tmdbId}:`, err);
      }
    }

    logger.info(`Successfully synced ${syncedMovies.length} movies (${nowPlayingCount} Now Playing, ${upcomingCount} Coming Soon)`);

    return {
      syncedCount: syncedMovies.length,
      nowPlayingCount,
      upcomingCount,
      movies: syncedMovies,
    };
  }

  async getGenres(): Promise<TmdbGenre[]> {
    const data = await this.request<{ genres: TmdbGenre[] }>('/genre/movie/list', {
      language: 'en-US',
    });
    return data.genres;
  }
}

export const tmdbService = new TmdbService();

