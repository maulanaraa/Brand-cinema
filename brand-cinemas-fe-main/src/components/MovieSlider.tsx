import {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  type TouchEvent,
} from 'react';
import type { IMovie } from '@/types';
import MovieCard from '@/components/MovieCard';

interface MovieSliderProps {
  movies: IMovie[];
}

export interface MovieSliderHandle {
  goNext: () => void;
  goPrev: () => void;
}

const CENTER_WIDTH = 292;
/** Slides beyond this are fully off-stage (opacity 0) but still mounted for enter/exit animation. */
const MAX_RENDER_OFFSET = 3;
const MAX_VISIBLE_OFFSET = 2;

/** Shortest circular distance from current index to target. */
function getCircularOffset(index: number, current: number, count: number): number {
  let offset = index - current;
  const half = count / 2;
  if (offset > half) offset -= count;
  if (offset < -half) offset += count;
  return offset;
}

function getTranslateX(offset: number): number {
  const abs = Math.abs(offset);
  const sign = Math.sign(offset);
  if (abs === 0) return 0;
  if (abs === 1) return sign * 290;
  if (abs === 2) return sign * 510;
  return sign * 680;
}

function getScale(offset: number): number {
  const abs = Math.abs(offset);
  if (abs === 0) return 1;
  if (abs === 1) return 244 / CENTER_WIDTH;
  if (abs === 2) return 170 / CENTER_WIDTH;
  return 0.48;
}

const MovieSlider = forwardRef<MovieSliderHandle, MovieSliderProps>(({ movies }, ref) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);
  const movieCount = movies?.length ?? 0;
  const movieIdsKey = movies?.map((m) => m._id).join(',') ?? '';

  useEffect(() => {
    setCurrentIndex(0);
  }, [movieIdsKey]);

  const goNext = useCallback(() => {
    if (movieCount === 0) return;
    setCurrentIndex((prev) => (prev + 1) % movieCount);
  }, [movieCount]);

  const goPrev = useCallback(() => {
    if (movieCount === 0) return;
    setCurrentIndex((prev) => (prev - 1 + movieCount) % movieCount);
  }, [movieCount]);

  const selectMovie = useCallback(
    (movieId: string) => {
      const index = movies.findIndex((m) => m._id === movieId);
      if (index < 0) return;
      setCurrentIndex(index);
    },
    [movies],
  );

  useImperativeHandle(ref, () => ({ goNext, goPrev }), [goNext, goPrev]);

  useEffect(() => {
    if (movieCount <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(goNext, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [movieCount, isPaused, goNext]);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (event: TouchEvent) => {
      if (touchStartX.current == null || movieCount <= 1) return;
      const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
      const delta = endX - touchStartX.current;
      touchStartX.current = null;
      if (Math.abs(delta) < 40) return;
      if (delta < 0) goNext();
      else goPrev();
    },
    [movieCount, goNext, goPrev],
  );

  if (movieCount === 0) return null;

  const safeIndex = ((currentIndex % movieCount) + movieCount) % movieCount;
  const activeMovie = movies?.[safeIndex];
  if (!activeMovie) return null;

  const slides = movies
    .map((movie, index) => ({
      movie,
      offset: getCircularOffset(index, safeIndex, movieCount),
    }))
    .filter(({ offset }) => Math.abs(offset) <= MAX_RENDER_OFFSET);

  return (
    <div
      className="relative z-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[150%] w-full max-w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-[120px] transition-[background-image] duration-700 ease-out"
        style={{
          backgroundImage: `url(${activeMovie?.poster_url || activeMovie?.backdrop_url || ''})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative h-[560px] overflow-hidden sm:h-[600px]">
        <div className="absolute inset-0 flex items-center justify-center">
          {slides.map(({ movie, offset }) => {
            const scale = getScale(offset);
            const tx = getTranslateX(offset);
            const abs = Math.abs(offset);
            const isOffstage = abs > MAX_VISIBLE_OFFSET;

            return (
              <div
                key={movie._id}
                role={offset !== 0 ? 'button' : undefined}
                tabIndex={isOffstage ? -1 : 0}
                className="movie-slide absolute left-1/2 top-1/2"
                style={{
                  width: CENTER_WIDTH,
                  transform: `translate(-50%, -50%) translateX(${tx}px) scale(${scale})`,
                  zIndex: MAX_RENDER_OFFSET + 1 - abs,
                  opacity: isOffstage ? 0 : abs === MAX_VISIBLE_OFFSET ? 0.85 : 1,
                  pointerEvents: isOffstage ? 'none' : 'auto',
                }}
                onClick={() => {
                  if (offset !== 0) selectMovie(movie._id);
                }}
                onKeyDown={(event) => {
                  if (offset === 0) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectMovie(movie._id);
                  }
                }}
              >
                <MovieCard movie={movie} hideOverlay />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

MovieSlider.displayName = 'MovieSlider';

export default MovieSlider;
