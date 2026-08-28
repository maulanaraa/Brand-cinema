import type { IMovie } from '@/types';
import type { ApiMovie, CreateMovieInput, UpdateMovieInput } from '@/types/movie';
import { resolveDisplayImageUrl } from '@/utils/imageUrl';

const PLACEHOLDER_POSTER =
  'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop';

export function getPosterFullUrl(poster?: string): string {
  return resolveDisplayImageUrl(poster, PLACEHOLDER_POSTER);
}

export function getBackdropFullUrl(backdrop?: string): string | undefined {
  if (!backdrop?.trim()) return undefined;
  return resolveDisplayImageUrl(backdrop);
}

/** Higher-res / backdrop URL for hero ambient backgrounds */
export function getHeroAmbientUrl(
  movie?: Pick<IMovie, 'backdrop_url' | 'poster_url'> | null,
): string {
  if (movie?.backdrop_url) return movie.backdrop_url;

  const poster = movie?.poster_url || PLACEHOLDER_POSTER;
  if (poster.includes('image.tmdb.org/t/p/w')) {
    return poster.replace(/\/w\d+\//, '/w1280/');
  }

  return poster;
}

function deriveStatus(releaseDate: string): IMovie['status'] {
  const release = new Date(releaseDate);
  if (Number.isNaN(release.getTime())) return 'coming_soon';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  release.setHours(0, 0, 0, 0);
  return release <= today ? 'now_showing' : 'coming_soon';
}

/** Map API status (NOW_PLAYING / COMING_SOON / legacy) → UI status */
function resolveStatus(api: ApiMovie): IMovie['status'] {
  const raw = (api.status ?? '').toString().toLowerCase().replace(/-/g, '_');
  if (raw === 'now_showing' || raw === 'now_playing') return 'now_showing';
  if (raw === 'coming_soon') return 'coming_soon';
  return deriveStatus(api.releaseDate);
}

/** Map UI status → API enum (NOW_PLAYING | COMING_SOON) */
function toApiStatus(status: 'now_showing' | 'coming_soon' | 'now_playing'): 'NOW_PLAYING' | 'COMING_SOON' {
  return status === 'coming_soon' ? 'COMING_SOON' : 'NOW_PLAYING';
}

export function toMovie(api: ApiMovie): IMovie {
  const status = resolveStatus(api);
  const genre = Array.isArray(api.genre) ? api.genre.join(', ') : api.genre;
  return {
    _id: api._id,
    title: api.title,
    description: api.description,
    genre,
    duration: api.duration,
    release_date: api.releaseDate,
    poster_url: getPosterFullUrl(api.poster),
    backdrop_url: getBackdropFullUrl(api.backdrop),
    trailer_url: api.trailerUrl || undefined,
    rating: api.rating,
    language: api.language,
    isActive: api.isActive,
    status,
    is_now_showing: status === 'now_showing' && api.isActive,
    ticket_price: 55000,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
  };
}

function normalizeGenre(genre: string | string[]): string {
  const items = Array.isArray(genre)
    ? genre
    : genre.split(',');

  return items.map((item) => item.trim()).filter(Boolean).join(', ');
}

export function buildMovieRequestBody(
  data: CreateMovieInput | UpdateMovieInput,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (data.title !== undefined) body.title = data.title;
  if (data.description !== undefined) body.description = data.description;
  if (data.genre !== undefined) body.genre = normalizeGenre(data.genre);
  if (data.duration !== undefined) body.duration = Number(data.duration);
  if (data.language !== undefined) body.language = data.language;
  if (data.releaseDate !== undefined) body.releaseDate = data.releaseDate;
  if (data.rating !== undefined) body.rating = Number(data.rating);
  if (data.trailerUrl?.trim()) body.trailerUrl = data.trailerUrl.trim();
  if (data.isActive !== undefined) body.isActive = data.isActive;
  if (data.status !== undefined) body.status = toApiStatus(data.status);
  if (data.tmdbId !== undefined) body.tmdbId = data.tmdbId;
  if (data.posterUrl?.trim()) body.poster = data.posterUrl.trim();

  return body;
}
