import { Link } from 'react-router-dom';
import type { IMovie } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface MovieCardProps {
  movie: IMovie;
  hideOverlay?: boolean;
}

export default function MovieCard({ movie, hideOverlay }: MovieCardProps) {
  const { t } = useLanguage();
  if (!movie) return null;

  const isComingSoon = movie?.status === 'coming_soon';

  return (
    <div className="movie-card group">
      <div className="relative aspect-[2/3] overflow-hidden">
        <img
          src={movie?.poster_url || 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop'}
          alt={movie?.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
          <span className={`cinema-badge ${isComingSoon ? 'badge-coming-soon' : 'badge-now-playing'}`}>
            {isComingSoon ? t('comingSoon') : t('nowPlaying')}
          </span>
          {movie?.classification && (
            <span className="rounded bg-dark-950/80 px-2 py-1 text-xs font-bold text-white">
              {movie.classification}
            </span>
          )}
        </div>
        {/* Bottom overlay + Details button */}
        <div className="absolute inset-x-0 bottom-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <div className="relative z-10 px-6 pb-4">
            <Link
              to={`/movies/${movie._id}`}
              className="flex w-full items-center justify-center text-white rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:brightness-110"
              style={{ background: 'linear-gradient(to bottom, #D5A527, #957115)' }}
            >
              {t('viewDetails')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
