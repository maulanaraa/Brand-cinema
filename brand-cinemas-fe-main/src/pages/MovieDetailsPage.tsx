import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Play, Star, Ticket, X } from 'lucide-react';
import { clsx } from 'clsx';
import { IMovie, IShowtime } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { movieService } from '@/services/movieService';
import { showtimeService } from '@/services/showtimeService';
import { getShowtimeTicketPrice, filterBookableShowtimes, isShowtimeBookable } from '@/utils/showtime';
import { getYoutubeAutoplayEmbedUrl, getYoutubeFocusEmbedUrl } from '@/utils/youtube';
import { useLanguage } from '@/contexts/LanguageContext';
import { LOCALE_BY_LANGUAGE } from '@/i18n/translations';

export default function MovieDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useLanguage();
  const locale = LOCALE_BY_LANGUAGE[language];
  const [movie, setMovie] = useState<IMovie | null>(null);
  const [showtimes, setShowtimes] = useState<IShowtime[]>([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedShowtime, setSelectedShowtime] = useState<IShowtime | null>(null);
  const [loading, setLoading] = useState(true);
  const [trailerFocus, setTrailerFocus] = useState(false);

  useEffect(() => {
    if (id) {
      fetchMovie(id);
    }
  }, [id]);

  useEffect(() => {
    setTrailerFocus(false);
  }, [id]);

  useEffect(() => {
    if (!trailerFocus) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTrailerFocus(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [trailerFocus]);

  const fetchMovie = async (movieId: string) => {
    try {
      const [movieData, showtimeData] = await Promise.all([
        movieService.getMovieById(movieId),
        showtimeService.getMovieShowtimes(movieId),
      ]);
      setMovie(movieData);
      const bookable = filterBookableShowtimes(showtimeData);
      setShowtimes(bookable);
      if (bookable.length > 0) {
        setSelectedDate(bookable[0].show_date.split('T')[0]);
      }
    } catch (error) {
      console.error('Error fetching movie:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableDates = [...new Set(showtimes.map((showtime) => showtime.show_date.split('T')[0]))];
  const visibleShowtimes = showtimes.filter((showtime) => showtime.show_date.startsWith(selectedDate));

  const handleSelectShowtime = (showtime: IShowtime) => {
    if (!isShowtimeBookable(showtime)) return;
    setSelectedShowtime(showtime);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('movieNotFound')}</h1>
          <Link to="/movies" className="btn btn-primary">
            {t('backToMovies')}
          </Link>
        </div>
      </div>
    );
  }

  const backdrop = movie.backdrop_url || movie.poster_url;
  const heroAutoplayUrl = getYoutubeAutoplayEmbedUrl(movie.trailer_url);
  const trailerFocusUrl = getYoutubeFocusEmbedUrl(movie.trailer_url);
  const hasTrailer = Boolean(heroAutoplayUrl);

  return (
    <div className="min-h-screen">
      <section
        className={clsx(
          'relative overflow-hidden transition-all duration-700 ease-in-out',
          trailerFocus ? 'fixed inset-0 z-50 min-h-screen bg-black' : 'relative',
        )}
      >
        <div className="absolute inset-0">
          <div
            className={clsx(
              'absolute inset-0 bg-cover bg-center transition-opacity duration-700',
              hasTrailer && !trailerFocus ? 'opacity-0' : 'opacity-100',
            )}
            style={{ backgroundImage: `url(${backdrop})` }}
          />

          {hasTrailer && !trailerFocus && (
            <div className="absolute inset-0 overflow-hidden">
              <iframe
                src={heroAutoplayUrl!}
                title={`${movie.title} background trailer`}
                className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
                allow="autoplay; encrypted-media; picture-in-picture"
                tabIndex={-1}
              />
            </div>
          )}

          {trailerFocus && trailerFocusUrl && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black px-3 pt-14 pb-6 sm:px-6 sm:pt-16">
              <div className="w-full max-w-5xl">
                <div className="relative aspect-video w-full overflow-hidden rounded-lg sm:rounded-xl">
                  <iframe
                    src={trailerFocusUrl}
                    title={`${movie.title} trailer`}
                    className="absolute inset-0 h-full w-full border-0"
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          )}

          {!trailerFocus && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-[#d5d8dc] via-[#e0e2e5]/90 to-[#e6e7e9]/70 dark:from-dark-950 dark:via-dark-950/85 dark:to-dark-950/40" />
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[var(--surface-page)] to-transparent dark:from-dark-950" />
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setTrailerFocus(false)}
          className={clsx(
            'absolute right-3 top-3 z-40 flex items-center gap-2 rounded-full border border-white/20 bg-black/50 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm transition-all duration-500 hover:bg-black/70 sm:right-4 sm:top-4 sm:px-4',
            trailerFocus ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0',
          )}
          aria-label={t('closeTrailer')}
          tabIndex={trailerFocus ? 0 : -1}
        >
          <X className="h-4 w-4" />
          {t('closeTrailer')}
        </button>

        <div
          className={clsx(
            'relative mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 transition-all duration-700 ease-in-out sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8 lg:py-16',
            trailerFocus && 'pointer-events-none opacity-0 translate-y-6 scale-[0.97]',
          )}
        >
          <div className="hidden lg:block">
            <div className="max-w-[260px]">
              <img
                src={movie.poster_url || ''}
                alt={movie.title}
                className="w-full rounded-lg shadow-2xl shadow-black/60"
              />
            </div>
          </div>

          <div className="flex items-center">
            <div className="max-w-3xl space-y-6">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="cinema-badge bg-primary-700/90 text-white">
                    {movie.status === 'coming_soon' ? t('comingSoon') : t('nowPlaying')}
                  </span>
                  {movie.classification && <span className="cinema-badge">{movie.classification}</span>}
                  {movie.rating ? (
                    <div className="flex items-center space-x-1 text-[#D5A527]">
                      <Star className="h-5 w-5 fill-current" />
                      <span className="font-semibold">{movie.rating.toFixed(1)}</span>
                    </div>
                  ) : null}
                </div>
                <h1 className="text-4xl font-display font-black mb-4 md:text-6xl">{movie.title}</h1>

                <div className="flex flex-wrap items-center gap-6 text-gray-500 dark:text-slate-400 mb-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>{movie.duration} {t('minutes')}</span>
                  </div>
                  <div className="px-3 py-1 bg-primary-700/15 text-primary-800 dark:bg-primary-500/20 dark:text-primary-400 rounded-full text-sm font-medium">
                    {movie.genre}
                  </div>
                </div>
              </div>

              {trailerFocusUrl && (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setTrailerFocus(true)}
                    className="btn border-0 bg-white/10 text-white backdrop-blur-2xl hover:bg-white/20 active:scale-95 text-lg px-8 py-3 shadow-xl shadow-black/30 font-semibold transition-all"
                  >
                    <Play className="h-5 w-5" />
                    {t('watchTrailer')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <div
        className={clsx(
          'max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8 transition-opacity duration-700',
          trailerFocus && 'opacity-0 pointer-events-none',
        )}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <p className="section-eyebrow mb-3">{t('story')}</p>
              <h2 className="text-2xl font-semibold mb-4">{t('synopsis')}</h2>
              <p className="text-gray-600 dark:text-slate-300 leading-relaxed text-lg">{movie.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h2 className="text-xl font-semibold mb-2">{t('director')}</h2>
                <p className="text-gray-600 dark:text-slate-300">{movie.director || t('toBeAnnounced')}</p>
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">{t('cast')}</h2>
                <p className="text-gray-600 dark:text-slate-300">{movie.cast?.join(', ') || t('toBeAnnounced')}</p>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-1">
            {showtimes.length > 0 ? (
              <div className="cinema-panel sticky top-24 p-6">
                <p className="section-eyebrow mb-3">{t('bookNow')}</p>
                <h2 className="text-2xl font-semibold mb-4">{t('selectShowtime')}</h2>
                <div className="mb-5 flex items-center gap-2 rounded-md bg-[var(--surface-muted)] dark:bg-dark-950 px-3 py-2 text-sm text-gray-600 dark:text-slate-300">
                  <MapPin className="h-4 w-4 text-[#D5A527]" />
                  CinemaID Grand Indonesia
                </div>
                <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                  {availableDates.map((date) => (
                    <button
                      key={date}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedShowtime(null);
                      }}
                      className={`min-w-24 rounded-md border px-4 py-3 text-left transition ${
                        selectedDate === date
                          ? 'bg-primary-500/15 border-primary-500 text-primary-500'
                          : 'border-transparent bg-[var(--surface-muted)] dark:bg-dark-950 text-gray-600 dark:text-slate-300 hover:bg-[var(--surface-raised)] dark:hover:bg-dark-800'
                      }`}
                    >
                      <span className="block text-xs uppercase opacity-70">
                        {new Date(`${date}T00:00:00`).toLocaleDateString(locale, { weekday: 'short' })}
                      </span>
                      <span className="block font-bold">
                        {new Date(`${date}T00:00:00`).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {visibleShowtimes.map((showtime) => {
                    const isActive = selectedShowtime?._id === showtime._id;
                    return (
                      <button
                        key={showtime._id}
                        type="button"
                        onClick={() => handleSelectShowtime(showtime)}
                        className={`w-full rounded-lg border p-4 text-left transition hover:border-primary-500 ${
                          isActive
                            ? 'bg-primary-500/15 border-primary-500'
                            : 'border-gray-200 dark:border-dark-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p
                            className={`text-lg font-bold ${isActive ? 'text-primary-500' : 'text-gray-900 dark:text-white'}`}
                          >
                            {showtime.start_time}
                          </p>
                          <p
                            className={`font-semibold ${isActive ? 'text-primary-500' : 'text-accent-500 dark:text-accent-400'}`}
                          >
                            IDR {getShowtimeTicketPrice(showtime).toLocaleString('id-ID')}
                          </p>
                        </div>
                        <p
                          className={`text-sm ${isActive ? 'text-primary-600' : 'text-gray-500 dark:text-slate-400'}`}
                        >
                          {showtime.studio || showtime.hall.hall_name} • {t('estFinish')} {showtime.end_time}
                        </p>
                      </button>
                    );
                  })}
                  {visibleShowtimes.length === 0 && (
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      {t('noUpcomingShowtimes')}
                    </p>
                  )}
                </div>
                <Link
                  to={selectedShowtime ? `/booking/${selectedShowtime._id}` : `/book/${movie._id}`}
                  className={`btn btn-primary mt-5 w-full py-3 text-base ${
                    !selectedShowtime ? 'pointer-events-none opacity-50' : ''
                  }`}
                  aria-disabled={!selectedShowtime}
                  onClick={(event) => {
                    if (!selectedShowtime || !isShowtimeBookable(selectedShowtime)) {
                      event.preventDefault();
                    }
                  }}
                >
                  <Ticket className="h-5 w-5" />
                  {t('continueToSeats')}
                </Link>
              </div>
            ) : (
              <div className="cinema-panel p-6">
                <h2 className="text-xl font-semibold">{t('noShowtimesYet')}</h2>
                <p className="mt-2 text-gray-500 dark:text-slate-400">{t('noShowtimesHint')}</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
