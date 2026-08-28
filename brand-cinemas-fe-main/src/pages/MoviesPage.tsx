import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, MapPin } from 'lucide-react';
import { IMovie } from '@/types';
import MovieCard from '@/components/MovieCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { movieService } from '@/services/movieService';
import { cityService } from '@/services/cityService';
import { cinemaService } from '@/services/cinemaService';

export default function MoviesPage() {
  const [searchParams] = useSearchParams();
  const locationCityId = searchParams.get('cityId') ?? '';
  const locationCinemaId = searchParams.get('cinemaId') ?? '';
  const locationDate = searchParams.get('date') ?? '';

  const [movies, setMovies] = useState<IMovie[]>([]);
  const [filteredMovies, setFilteredMovies] = useState<IMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'now_showing' | 'coming_soon'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'release_date' | 'rating'>('title');
  const [genres, setGenres] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const moviesPerPage = 8;

  useEffect(() => {
    fetchMovies();
  }, [searchTerm, selectedGenre, sortBy]);

  useEffect(() => {
    filterMovies();
  }, [movies, selectedStatus]);

  useEffect(() => {
    let cancelled = false;

    const resolveLocation = async () => {
      if (!locationCityId && !locationCinemaId && !locationDate) {
        setLocationLabel('');
        return;
      }

      try {
        const [city, cinema] = await Promise.all([
          locationCityId ? cityService.getCityById(locationCityId).catch(() => null) : Promise.resolve(null),
          locationCinemaId ? cinemaService.getCinemaById(locationCinemaId).catch(() => null) : Promise.resolve(null),
        ]);

        if (cancelled) return;

        const parts: string[] = [];
        if (cinema?.name) parts.push(cinema.name);
        if (city?.name) parts.push(city.name);
        if (locationDate) {
          const d = new Date(`${locationDate}T00:00:00`);
          parts.push(
            Number.isNaN(d.getTime())
              ? locationDate
              : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          );
        }
        setLocationLabel(parts.join(' · '));
      } catch {
        if (!cancelled) setLocationLabel('');
      }
    };

    resolveLocation();
    return () => {
      cancelled = true;
    };
  }, [locationCityId, locationCinemaId, locationDate]);

  const fetchMovies = async () => {
    setLoading(true);
    setError('');
    try {
      const { items } = await movieService.getMovies({
        isActive: 'true',
        limit: 100,
        search: searchTerm || undefined,
        genre: selectedGenre || undefined,
        sort: sortBy,
        order: sortBy === 'title' ? 'asc' : 'desc',
      });
      setMovies(items);

      const uniqueGenres = [...new Set(items.map((movie) => movie.genre).filter(Boolean))];
      setGenres(uniqueGenres);
    } catch (error) {
      console.error('Error fetching movies:', error);
      setError('Could not load movies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterMovies = () => {
    let filtered = movies;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((movie) => movie.status === selectedStatus);
    }

    setFilteredMovies(filtered);
    setCurrentPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / moviesPerPage));
  const paginatedMovies = filteredMovies.slice((currentPage - 1) * moviesPerPage, currentPage * moviesPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <p className="section-eyebrow mb-3">Browse tickets</p>
          <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-4">
            Movies & Showtimes
          </h1>
          <p className="text-gray-500 dark:text-slate-400 text-lg max-w-2xl">
            Filter by status, genre, and rating to find your next cinema plan.
          </p>
          {locationLabel && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm text-[#D5A527]">
              <MapPin className="h-4 w-4" />
              {locationLabel}
            </p>
          )}
        </div>

        {/* Filters */}
        <div className="cinema-panel mb-8 grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search movies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-slate-400 h-5 w-5" />
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="input pl-10 pr-8 appearance-none bg-gray-200 dark:bg-dark-800"
            >
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'now_showing' | 'coming_soon')}
            className="input bg-gray-200 dark:bg-dark-800"
          >
            <option value="all">All Status</option>
            <option value="now_showing">Now Showing</option>
            <option value="coming_soon">Coming Soon</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'title' | 'release_date' | 'rating')}
            className="input bg-gray-200 dark:bg-dark-800"
          >
            <option value="title">Sort by Title</option>
            <option value="release_date">Sort by Release Date</option>
            <option value="rating">Sort by Rating</option>
          </select>
        </div>

        {error && <div className="card p-4 mb-8 text-red-300 border-red-500/40">{error}</div>}

        {/* Movies Grid */}
        {filteredMovies.length > 0 ? (
          <>
            <div className="mb-5 flex items-center justify-between text-sm text-gray-500 dark:text-slate-400">
              <span>{filteredMovies.length} movies found</span>
              <span>{selectedStatus === 'all' ? 'All titles' : selectedStatus === 'now_showing' ? 'Now playing' : 'Coming soon'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paginatedMovies.map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-slate-400 text-lg">
              {searchTerm || selectedGenre 
                ? 'No movies found matching your criteria.' 
                : 'No movies currently available.'
              }
            </p>
          </div>
        )}
        <div className="flex justify-center mt-8 space-x-4">
          <button
            className="btn btn-secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            Previous
          </button>
          <span className="text-gray-900 dark:text-white text-sm flex items-center">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </button>
        </div>

      </div>
    </div>
  );
}
