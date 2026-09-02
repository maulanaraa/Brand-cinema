import { useEffect, useState, useCallback, useRef, type ReactElement, type TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { IMovie, ICarouselItem } from '@/types';
import MovieSlider, { type MovieSliderHandle } from '@/components/MovieSlider';
import LocationSearchBar from '@/components/LocationSearchBar';
import LoadingSpinner from '@/components/LoadingSpinner';
import { movieService } from '@/services/movieService';
import { carouselService } from '@/services/carouselService';
import { getCarouselMoviePath } from '@/utils/carousel';
import { useLanguage } from '@/contexts/LanguageContext';

export default function HomePage(): ReactElement {
  const { t } = useLanguage();
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselItems, setCarouselItems] = useState<ICarouselItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'now_playing' | 'coming_soon'>('now_playing');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const nowPlayingSliderRef = useRef<MovieSliderHandle>(null);
  const comingSoonSliderRef = useRef<MovieSliderHandle>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [moviesResult, carouselResult] = await Promise.allSettled([
        movieService.getMovies({
          isActive: 'true',
          limit: 100,
          sort: 'release_date',
          order: 'desc',
        }),
        carouselService.getActiveCarouselItems(),
      ]);

      if (moviesResult.status === 'fulfilled') {
        setMovies(moviesResult.value.items);
      } else {
        console.error('Error fetching movies:', moviesResult.reason);
        setError('Could not load movies.');
      }

      if (carouselResult.status === 'fulfilled') {
        setCarouselItems(carouselResult.value);
      } else {
        console.error('Error fetching carousel:', carouselResult.reason);
        setCarouselItems([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const goNext = useCallback(() => {
    if (carouselItems.length === 0) return;
    setCurrentSlide(prev => (prev + 1) % carouselItems.length);
  }, [carouselItems.length]);

  const goPrev = useCallback(() => {
    if (carouselItems.length === 0) return;
    setCurrentSlide(prev => (prev - 1 + carouselItems.length) % carouselItems.length);
  }, [carouselItems.length]);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (touchStartX.current == null || carouselItems.length <= 1) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    if (delta < 0) goNext();
    else goPrev();
  }, [carouselItems.length, goNext, goPrev]);

  useEffect(() => {
    if (carouselItems.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(goNext, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [carouselItems.length, isPaused, goNext]);

  useEffect(() => {
    if (carouselItems.length === 0) {
      setCurrentSlide(0);
      return;
    }
    setCurrentSlide((prev) => (prev >= carouselItems.length ? 0 : prev));
  }, [carouselItems.length]);

  const nowShowing = movies.filter((movie) => movie?.status === 'now_showing');
  const comingSoon = movies.filter((movie) => movie?.status === 'coming_soon');
  const activeCarouselItem =
    carouselItems.length > 0
      ? carouselItems[((currentSlide % carouselItems.length) + carouselItems.length) % carouselItems.length]
      : undefined;
  const activeMoviePath = activeCarouselItem ? getCarouselMoviePath(activeCarouselItem) : undefined;
  const activeBookPath = activeCarouselItem
    ? (activeCarouselItem.movie?._id ?? activeCarouselItem.movie_id)
      ? `/book/${activeCarouselItem.movie?._id ?? activeCarouselItem.movie_id}`
      : activeCarouselItem.link_url
    : undefined;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section - Carousel */}
      {carouselItems.length > 0 && activeCarouselItem && (
        <div className="dark">
          <section
            className="relative h-[min(58vh,420px)] overflow-hidden sm:h-[min(64vh,520px)] md:h-[76vh] md:min-h-[520px]"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Slides Container */}
            <div
              className="flex h-full transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {carouselItems.map((item) => (
                <div key={item._id} className="relative h-full w-full min-w-full flex-shrink-0 basis-full">
                  {item.type === 'promotion' ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="absolute inset-0 h-full w-full object-cover object-[center_top] sm:object-center"
                    />
                  ) : (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${item.image_url})` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/70 to-dark-950/25 md:bg-gradient-to-r md:from-dark-950 md:via-dark-950/75 md:to-dark-950/20" />
                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-dark-950 to-transparent sm:h-36" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Content Overlay - Movie only */}
            {activeCarouselItem.type === 'movie' && (
              <div className="absolute inset-0 z-10 flex items-end justify-center px-4 pb-12 pt-16 sm:items-center sm:px-6 sm:pb-20 md:pb-28 lg:mx-auto lg:max-w-7xl lg:px-8">
                <div className="flex w-full max-w-5xl items-end gap-6 sm:items-center sm:gap-8">
                  <div className="min-w-0 max-w-3xl">
                    <h1 className="mb-2 max-w-3xl text-2xl font-black leading-tight text-white sm:mb-4 sm:text-4xl md:mb-5 md:text-5xl lg:text-7xl">
                      {activeCarouselItem.title}
                    </h1>
                    {activeCarouselItem.description && (
                      <p className="mb-4 hidden max-w-2xl text-sm leading-6 text-slate-200 sm:mb-6 sm:line-clamp-2 sm:text-base sm:leading-7 md:text-lg md:leading-8">
                        {activeCarouselItem.description}
                      </p>
                    )}
                    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                      {activeMoviePath && (
                        <Link
                          to={activeMoviePath}
                          className="btn border-0 bg-white/20 text-white backdrop-blur-2xl hover:bg-white/30 active:scale-95 px-5 py-2.5 text-sm sm:px-8 sm:py-3 sm:text-lg shadow-xl shadow-black/30 font-semibold"
                        >
                          <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                          {t('viewDetails')}
                        </Link>
                      )}
                    </div>
                  </div>
                  {activeCarouselItem.movie?.poster_url && (
                    <img
                      src={activeCarouselItem.movie.poster_url}
                      alt={activeCarouselItem.title}
                      className="hidden h-[280px] w-auto rounded-xl object-cover shadow-2xl shadow-black/50 md:block md:h-[350px]"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Chevron Navigation */}
            {carouselItems.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-white/15 text-white backdrop-blur-2xl transition-all hover:bg-white/30 active:scale-95 sm:left-4 sm:h-12 sm:w-12"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
                <button
                  onClick={goNext}
                  className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border-0 bg-white/15 text-white backdrop-blur-2xl transition-all hover:bg-white/30 active:scale-95 sm:right-4 sm:h-12 sm:w-12"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </>
            )}

            {/* Dot Indicators */}
            {carouselItems.length > 1 && (
              <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 sm:bottom-8 sm:gap-2">
                {carouselItems.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-1.5 rounded-full transition-all duration-300 sm:h-2 ${index === currentSlide
                      ? 'w-6 bg-white sm:w-8'
                      : 'w-1.5 bg-white/40 hover:bg-white/60 sm:w-2'
                      }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      <LocationSearchBar />

      {/* Now Showing Section */}
      <section className="px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col items-center gap-2 text-center sm:mb-10">
            <p className="section-eyebrow">{t('inTheaters')}</p>
            <h2 className="font-display text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl md:text-4xl">
              {activeTab === 'now_playing' ? t('nowPlaying') : t('comingSoon')}
            </h2>
            <p className="max-w-2xl px-2 text-sm text-gray-500 dark:text-slate-400 sm:px-0 sm:text-base">
              {activeTab === 'now_playing' ? t('nowPlayingSubtitle') : t('comingSoonSubtitle')}
            </p>
          </div>

          <div className="mb-3 flex justify-center gap-4 border-b border-gray-200 dark:border-white/10 sm:mb-4 sm:gap-6">
            <button
              onClick={() => setActiveTab('now_playing')}
              className={`pb-2 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'now_playing'
                  ? 'border-[#D5A527] text-[#D5A527]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t('nowPlaying')}
            </button>
            <button
              onClick={() => setActiveTab('coming_soon')}
              className={`pb-2 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'coming_soon'
                  ? 'border-[#D5A527] text-[#D5A527]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {t('comingSoon')}
            </button>
          </div>

          {error && (
            <div className="card p-4 mb-8 text-red-300 border-red-500/40">
              {error}
            </div>
          )}

          {activeTab === 'now_playing' ? (
            nowShowing.length > 0 ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => nowPlayingSliderRef.current?.goPrev()}
                    className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white/15 text-white backdrop-blur-2xl transition-all hover:bg-white/30 active:scale-95"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => nowPlayingSliderRef.current?.goNext()}
                    className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white/15 text-white backdrop-blur-2xl transition-all hover:bg-white/30 active:scale-95"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <MovieSlider key="now_playing" ref={nowPlayingSliderRef} movies={nowShowing} />
                </div>
                <div className="mt-3 flex justify-center sm:mt-4">
                  <Link to="/movies" className="btn btn-secondary w-full max-w-xs sm:w-auto">
                    {t('viewAllMovies')}
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-slate-400 text-lg">No movies currently showing.</p>
              </div>
            )
          ) : (
            comingSoon.length > 0 ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => comingSoonSliderRef.current?.goPrev()}
                    className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white/15 text-white backdrop-blur-2xl transition-all hover:bg-white/30 active:scale-95"
                    aria-label="Previous slide"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => comingSoonSliderRef.current?.goNext()}
                    className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full border-0 bg-white/15 text-white backdrop-blur-2xl transition-all hover:bg-white/30 active:scale-95"
                    aria-label="Next slide"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <MovieSlider key="coming_soon" ref={comingSoonSliderRef} movies={comingSoon} />
                </div>
                <div className="mt-3 flex justify-center sm:mt-4">
                  <Link to="/movies" className="btn btn-secondary w-full max-w-xs sm:w-auto">
                    {t('viewAllMovies')}
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-slate-400 text-lg">No coming soon movies available.</p>
              </div>
            )
          )}
        </div>
      </section>

      {/* Banner Section */}
      <section className="w-full">
        <img
          src="/images/banner.png"
          alt="Banner"
          className="w-full h-auto object-cover"
        />
      </section>
    </div>
  );
}
