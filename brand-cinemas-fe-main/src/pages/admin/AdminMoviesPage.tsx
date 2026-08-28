import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';
import { useParams, useSearchParams } from 'react-router-dom';
import { ApiError, movieService } from '@/services/movieService';
import type { IMovie } from '@/types';
import { EMPTY_PAGINATION, DEFAULT_PAGE_SIZE } from '@/types/pagination';
import type { PaginationMeta } from '@/types/pagination';
import type { TmdbMovieImportData } from '@/types/tmdb';
import TmdbMovieSearch from '@/components/admin/TmdbMovieSearch';
import { applyMovieFormApiErrors } from '@/utils/movieFormErrors';
import { useLanguage } from '@/contexts/LanguageContext';

interface MovieFormFields {
  title: string;
  description: string;
  genre: string;
  duration: number;
  language: string;
  release_date: string;
  rating?: number;
  poster_url?: string;
  trailer_url?: string;
  status: 'now_showing' | 'coming_soon';
  isActive: boolean;
}

interface MovieFormProps {
  movieToEdit: IMovie | null;
  onClose: () => void;
  onSave: () => void;
}

const MovieForm: React.FC<MovieFormProps> = ({ movieToEdit, onClose, onSave }) => {
  const { t } = useLanguage();
  const [tmdbId, setTmdbId] = useState<number | null>(null);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<MovieFormFields>({
    defaultValues: {
      status: 'now_showing',
      isActive: true,
      rating: 0,
    },
  });

  const posterUrl = watch('poster_url');

  useEffect(() => {
    if (movieToEdit) {
      reset({
        title: movieToEdit.title,
        description: movieToEdit.description,
        genre: movieToEdit.genre,
        duration: movieToEdit.duration,
        language: movieToEdit.language || 'English',
        release_date: new Date(movieToEdit.release_date).toISOString().split('T')[0],
        rating: movieToEdit.rating ?? 0,
        poster_url: movieToEdit.poster_url || '',
        trailer_url: movieToEdit.trailer_url || '',
        status: movieToEdit.status === 'coming_soon' ? 'coming_soon' : 'now_showing',
        isActive: movieToEdit.isActive ?? true,
      });
      setTmdbId(null);
    } else {
      reset({
        title: '',
        description: '',
        genre: '',
        duration: 0,
        language: 'English',
        release_date: '',
        rating: 0,
        poster_url: '',
        trailer_url: '',
        status: 'now_showing',
        isActive: true,
      });
      setTmdbId(null);
    }
    setFormError('');
    clearErrors();
  }, [movieToEdit, reset, clearErrors]);

  const handleTmdbImport = (data: TmdbMovieImportData) => {
    const releaseDate = data.releaseDate
      ? new Date(data.releaseDate).toISOString().split('T')[0]
      : '';
    const release = releaseDate ? new Date(`${releaseDate}T00:00:00`) : null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const importedStatus =
      release && release > today ? 'coming_soon' as const : 'now_showing' as const;

    reset({
      title: data.title,
      description: data.description,
      genre: data.genre,
      duration: data.duration,
      language: data.language || 'English',
      release_date: releaseDate,
      rating: data.rating ?? 0,
      poster_url: data.poster || '',
      trailer_url: data.trailerUrl || '',
      status: importedStatus,
      isActive: true,
    });

    setTmdbId(data.tmdbId ?? null);
    setFormError('');
    clearErrors();
  };

  const onSubmit: SubmitHandler<MovieFormFields> = async (formData) => {
    setFormError('');
    clearErrors();

    const posterUrlValue = formData.poster_url?.trim();

    try {
      const payload = {
        title: formData.title,
        genre: formData.genre,
        description: formData.description,
        duration: Number(formData.duration),
        language: formData.language,
        releaseDate: formData.release_date,
        rating: formData.rating ? Number(formData.rating) : undefined,
        trailerUrl: formData.trailer_url?.trim() || undefined,
        status: formData.status,
        isActive: formData.isActive,
        posterUrl: posterUrlValue || undefined,
        tmdbId: tmdbId ?? undefined,
      };

      if (movieToEdit) {
        await movieService.updateMovie(movieToEdit._id, payload);
      } else {
        await movieService.createMovie(payload);
      }

      toast.success(`Movie ${movieToEdit ? 'updated' : 'added'} successfully!`);
      onSave();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 403) {
          setFormError('You do not have admin access.');
        } else if (error.errors.length) {
          applyMovieFormApiErrors(error.errors, setError, setFormError);
        } else {
          setFormError(error.message);
        }
      } else if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Failed to save movie.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-6">{movieToEdit ? t('editMovie') : t('addNewMovie')}</h2>

        {formError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {!movieToEdit && (
            <TmdbMovieSearch onImport={handleTmdbImport} disabled={isSubmitting} />
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input {...register('title', { required: 'Title is required' })} className="input" />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              {...register('description', { required: 'Description is required' })}
              className="input"
              rows={4}
            />
            {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Genre</label>
              <input {...register('genre', { required: 'Genre is required' })} className="input" />
              {errors.genre && <p className="text-red-400 text-sm mt-1">{errors.genre.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <input {...register('language', { required: 'Language is required' })} className="input" />
              {errors.language && <p className="text-red-400 text-sm mt-1">{errors.language.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
              <input
                type="number"
                min={1}
                {...register('duration', { required: 'Duration is required', min: { value: 1, message: 'Min 1 minute' } })}
                className="input"
              />
              {errors.duration && <p className="text-red-400 text-sm mt-1">{errors.duration.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rating (0-10)</label>
              <input
                type="number"
                step="0.1"
                min={0}
                max={10}
                {...register('rating', { min: 0, max: 10 })}
                className="input"
              />
              {errors.rating && <p className="text-red-400 text-sm mt-1">{errors.rating.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Release Date</label>
              <input
                type="date"
                {...register('release_date', { required: 'Release date is required' })}
                className="input"
              />
              {errors.release_date && <p className="text-red-400 text-sm mt-1">{errors.release_date.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Poster URL</label>
            <input
              type="url"
              placeholder="https://image.tmdb.org/..."
              {...register('poster_url', {
                required: movieToEdit ? false : 'Poster URL wajib diisi',
                pattern: {
                  value: /^https?:\/\/.+/i,
                  message: 'Gunakan URL http/https yang valid',
                },
              })}
              className="input"
            />
            {errors.poster_url && (
              <p className="text-red-400 text-sm mt-1">{errors.poster_url.message}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Import TMDB untuk mengisi otomatis, atau tempel URL gambar poster.
            </p>
            {posterUrl && /^https?:\/\//i.test(posterUrl) && (
              <img
                src={posterUrl}
                alt="Poster preview"
                className="mt-3 h-40 w-28 object-cover rounded border border-gray-200 dark:border-white/[0.08]"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Trailer URL</label>
            <input
              type="url"
              {...register('trailer_url', {
                pattern: {
                  value: /^$|^https?:\/\/.+/i,
                  message: 'Gunakan URL http/https yang valid',
                },
              })}
              className="input"
              placeholder="https://youtube.com/..."
            />
            {errors.trailer_url && (
              <p className="text-red-400 text-sm mt-1">{errors.trailer_url.message}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Diisi otomatis dari TMDB jika tersedia; beberapa film tidak memiliki trailer di TMDB.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                {...register('status', { required: 'Status is required' })}
                className="input"
              >
                <option value="now_showing">Now Playing</option>
                <option value="coming_soon">Coming Soon</option>
              </select>
              {errors.status && <p className="text-red-400 text-sm mt-1">{errors.status.message}</p>}
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm font-medium">
              <input type="checkbox" {...register('isActive')} className="rounded" />
              Active (visible in catalog)
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Save Movie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteModalProps {
  movie: IMovie;
  onClose: () => void;
  onConfirm: (movieId: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ movie, onClose, onConfirm }) => {
  const { t } = useLanguage();
  return (
  <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center p-4">
    <div className="card p-6 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">{t('confirmDeletion')}</h2>
      <p className="text-gray-600 dark:text-slate-300 mb-6">
        Are you sure you want to delete the movie &quot;<strong>{movie.title}</strong>&quot;? This action cannot be undone.
      </p>
      <div className="flex justify-end space-x-4">
        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
        <button type="button" onClick={() => onConfirm(movie._id)} className="btn btn-danger">Delete Movie</button>
      </div>
    </div>
  </div>
  );
};

export default function AdminMoviesPage() {
  const { t } = useLanguage();
  const { movieId } = useParams<{ movieId?: string }>();
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<IMovie | null>(null);
  const [movieToDelete, setMovieToDelete] = useState<IMovie | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);
  const [genreOptions, setGenreOptions] = useState<string[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    movieService.getMovies({ limit: 100 }).then((result) => {
      setGenreOptions([...new Set(result.items.map((movie) => movie.genre).filter(Boolean))]);
    });
  }, []);

  const handleSyncIndonesiaMovies = async () => {
    setIsSyncing(true);
    try {
      const res = await movieService.syncIndonesiaMovies();
      toast.success(
        `Berhasil menyinkronkan ${res.syncedCount} film bioskop Indonesia (${res.nowPlayingCount} Sedang Tayang, ${res.upcomingCount} Segera Hadir)!`,
        { duration: 5000 }
      );
      fetchMovies();
    } catch {
      toast.error('Gagal menyinkronkan film dari TMDB');
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const result = await movieService.getMovies({
        page,
        limit: DEFAULT_PAGE_SIZE,
        search: searchTerm || undefined,
        genre: genreFilter || undefined,
        status: statusFilter === 'all' ? undefined : (statusFilter as 'now_showing' | 'coming_soon'),
        isActive: activeFilter === 'all' ? undefined : activeFilter,
        sort: 'createdAt',
        order: 'desc',
      });
      setMovies(result.items);
      setPagination(result.pagination);
    } catch {
      toast.error('Failed to load movies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchTerm, genreFilter, statusFilter, activeFilter]);

  useEffect(() => {
    fetchMovies();
  }, [page, searchTerm, genreFilter, statusFilter, activeFilter]);

  const handleOpenModal = (movie: IMovie | null) => {
    setEditingMovie(movie);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('openModal') === 'true') {
      handleOpenModal(null);
      searchParams.delete('openModal');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!movieId || movies.length === 0) return;
    const movie = movies.find((item) => item._id === movieId);
    if (movie) handleOpenModal(movie);
  }, [movieId, movies]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMovie(null);
  };

  const handleSave = () => {
    fetchMovies();
    handleCloseModal();
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await movieService.deleteMovie(id);
      toast.success('Movie deleted successfully');
      fetchMovies();
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        toast.error('You do not have admin access.');
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete movie');
      }
    } finally {
      setMovieToDelete(null);
    }
  };

  if (loading && movies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const genres = genreOptions;

  return (
    <div className="space-y-6">
      {isModalOpen && (
        <MovieForm movieToEdit={editingMovie} onClose={handleCloseModal} onSave={handleSave} />
      )}
      {movieToDelete && (
        <DeleteConfirmationModal
          movie={movieToDelete}
          onClose={() => setMovieToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('adminNavMovies')}</h1>
          <p className="text-gray-500 dark:text-neutral-400">Manage your movie catalog & real-time cinema sync</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSyncIndonesiaMovies}
            disabled={isSyncing}
            className="btn btn-secondary flex items-center justify-center space-x-2 border-primary-500/30 text-primary-500 hover:bg-primary-500/10 shadow-sm"
            title="Sinkronkan film bioskop Indonesia (XXI/CGV) terkini dari TMDB"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Bioskop ID'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleOpenModal(null)}
            className="btn btn-primary flex items-center justify-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Add Movie</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="input"
          placeholder="Search movies..."
        />
        <select value={genreFilter} onChange={(event) => setGenreFilter(event.target.value)} className="input">
          <option value="">All Genres</option>
          {genres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input">
          <option value="all">All Status</option>
          <option value="now_showing">Now Playing</option>
          <option value="coming_soon">Coming Soon</option>
        </select>
        <select
          value={activeFilter}
          onChange={(event) => setActiveFilter(event.target.value as 'all' | 'true' | 'false')}
          className="input"
        >
          <option value="all">All Active States</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {movies.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-4">No movies found</p>
          <button type="button" onClick={() => handleOpenModal(null)} className="btn btn-primary">
            Add Your First Movie
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-dark-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Movie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Genre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {movies.map((movie) => (
                  <tr key={movie._id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={movie.poster_url}
                          alt={movie.title}
                          className="w-12 h-18 object-cover rounded"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">
                            {movie.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 max-w-xs">
                            {movie.language} · {new Date(movie.release_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-primary-500/20 text-primary-500 dark:text-primary-400 rounded-full">
                        {movie.genre}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                      {movie.duration} mins
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                      {movie.rating ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        !movie.isActive
                          ? 'bg-gray-500/20 text-gray-600 dark:text-gray-400'
                          : movie.status === 'coming_soon'
                            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                            : 'bg-green-500/20 text-green-600 dark:text-green-400'
                      }`}>
                        {!movie.isActive
                          ? 'Inactive'
                          : movie.status === 'coming_soon'
                            ? 'Coming Soon'
                            : 'Now Playing'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(movie)}
                          className="text-green-400 hover:text-green-300 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setMovieToDelete(movie)}
                          className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
