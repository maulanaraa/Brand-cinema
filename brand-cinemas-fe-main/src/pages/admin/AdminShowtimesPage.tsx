import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';
import { movieService } from '@/services/movieService';
import { hallService } from '@/services/hallService';
import { ApiError, showtimeService } from '@/services/showtimeService';
import type { IHall, IMovie, IShowtime } from '@/types';
import { EMPTY_PAGINATION, DEFAULT_PAGE_SIZE } from '@/types/pagination';
import type { PaginationMeta } from '@/types/pagination';
import type { CreateShowtimeInput } from '@/types/showtime';
import { useLanguage } from '@/contexts/LanguageContext';

type ShowtimeFormData = {
  movieId: string;
  hallId: string;
  date: string;
  time: string;
  price: number;
  totalSeat: number;
};

function resolveHallId(showtime: IShowtime, halls: IHall[]): string {
  const byId = halls.find((hall) => hall._id === showtime.hall?._id);
  if (byId) return byId._id;

  const studioName = showtime.studio || showtime.hall?.hall_name;
  const byName = halls.find((hall) => hall.hall_name === studioName);
  return byName?._id ?? '';
}

interface ShowtimeFormProps {
  showtimeToEdit: IShowtime | null;
  onClose: () => void;
  onSave: () => void;
}

const ShowtimeForm: React.FC<ShowtimeFormProps> = ({ showtimeToEdit, onClose, onSave }) => {
  const { t } = useLanguage();
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [halls, setHalls] = useState<IHall[]>([]);
  const [hallsLoading, setHallsLoading] = useState(true);
  const [formError, setFormError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ShowtimeFormData>({
    defaultValues: { totalSeat: 50 },
  });

  const selectedHallId = watch('hallId');

  useEffect(() => {
    movieService.getMovies({ limit: 100 }).then((result) => setMovies(result.items));
    hallService
      .getHalls({ isActive: true, limit: 100 })
      .then((result) => setHalls(result.items))
      .catch(() => setHalls([]))
      .finally(() => setHallsLoading(false));
  }, []);

  useEffect(() => {
    const hall = halls.find((item) => item._id === selectedHallId);
    if (hall) {
      setValue('totalSeat', hall.total_seats);
    }
  }, [selectedHallId, halls, setValue]);

  useEffect(() => {
    if (showtimeToEdit) {
      reset({
        movieId: showtimeToEdit.movie._id,
        hallId: resolveHallId(showtimeToEdit, halls),
        date: new Date(showtimeToEdit.show_date).toISOString().split('T')[0],
        time: showtimeToEdit.start_time,
        price: showtimeToEdit.ticket_price,
        totalSeat: showtimeToEdit.totalSeat || showtimeToEdit.hall.total_seats,
      });
    } else {
      reset({
        hallId: halls[0]?._id ?? '',
        totalSeat: halls[0]?.total_seats ?? 50,
      });
    }
    setFormError('');
  }, [showtimeToEdit, halls, reset]);

  const onSubmit: SubmitHandler<ShowtimeFormData> = async (formData) => {
    setFormError('');

    const hall = halls.find((item) => item._id === formData.hallId);
    if (!hall) {
      setFormError('Please select a hall');
      return;
    }

    try {
      const payload: CreateShowtimeInput = {
        movieId: formData.movieId,
        studio: hall.hall_name,
        date: formData.date,
        time: formData.time,
        price: Number(formData.price),
        totalSeat: hall.total_seats,
      };

      if (showtimeToEdit) {
        await showtimeService.updateShowtime(showtimeToEdit._id, payload);
      } else {
        await showtimeService.createShowtime(payload);
      }

      toast.success(`Showtime ${showtimeToEdit ? 'updated' : 'added'} successfully!`);
      onSave();
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.errors.length) {
          setFormError(error.errors.join(', '));
        } else {
          setFormError(error.message);
        }
      } else if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Failed to save showtime');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">&times;</button>
        <h2 className="text-2xl font-bold mb-6">{showtimeToEdit ? t('editShowtime') : t('addNewShowtime')}</h2>

        {formError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Movie</label>
              <select {...register('movieId', { required: 'Movie is required' })} className="input">
                <option value="">Select a movie</option>
                {movies.map((movie) => (
                  <option key={movie._id} value={movie._id}>{movie.title}</option>
                ))}
              </select>
              {errors.movieId && <p className="text-red-400 text-sm mt-1">{errors.movieId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Studio (Hall)</label>
              {hallsLoading ? (
                <div className="input flex items-center text-gray-500 dark:text-slate-400">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm">Loading halls...</span>
                </div>
              ) : halls.length === 0 ? (
                <p className="text-sm text-[#D5A527]">
                  No halls available.{' '}
                  <Link to="/admin/halls" className="underline hover:text-[#957115]">
                    Create a hall first
                  </Link>
                </p>
              ) : (
                <select {...register('hallId', { required: 'Hall is required' })} className="input">
                  <option value="">Select a hall</option>
                  {halls.map((hall) => (
                    <option key={hall._id} value={hall._id}>
                      {hall.hall_name} ({hall.total_seats} seats · {hall.layout_rows}×{hall.layout_columns})
                    </option>
                  ))}
                </select>
              )}
              {errors.hallId && <p className="text-red-400 text-sm mt-1">{errors.hallId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Show Date</label>
              <input type="date" {...register('date', { required: 'Show date is required' })} className="input" />
              {errors.date && <p className="text-red-400 text-sm mt-1">{errors.date.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Show Time</label>
              <input type="time" {...register('time', { required: 'Show time is required' })} className="input" />
              {errors.time && <p className="text-red-400 text-sm mt-1">{errors.time.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ticket Price (IDR)</label>
              <input
                type="number"
                min={0}
                {...register('price', { required: 'Price is required', min: 0 })}
                className="input"
              />
              {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Seats</label>
              <input
                type="number"
                readOnly
                {...register('totalSeat', { required: 'Total seats is required', min: { value: 1, message: 'Min 1 seat' } })}
                className="input bg-gray-50 dark:bg-dark-800 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Auto-filled from selected hall</p>
              {errors.totalSeat && <p className="text-red-400 text-sm mt-1">{errors.totalSeat.message}</p>}
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting || hallsLoading || halls.length === 0} className="btn btn-primary">
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Save Showtime'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteModalProps {
  showtime: IShowtime;
  onClose: () => void;
  onConfirm: (showtimeId: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ showtime, onClose, onConfirm }) => {
  const { t } = useLanguage();
  return (
  <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center p-4">
    <div className="card p-6 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">{t('confirmDeletion')}</h2>
      <p className="text-gray-600 dark:text-slate-300 mb-6">
        Delete showtime for &quot;<strong>{showtime.movie?.title}</strong>&quot; on{' '}
        {new Date(showtime.show_date).toLocaleDateString()} at {showtime.start_time}?
      </p>
      <div className="flex justify-end space-x-4">
        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
        <button type="button" onClick={() => onConfirm(showtime._id)} className="btn btn-danger">Delete Showtime</button>
      </div>
    </div>
  </div>
  );
};

export default function AdminShowtimesPage() {
  const { t } = useLanguage();
  const [showtimes, setShowtimes] = useState<IShowtime[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState<IShowtime | null>(null);
  const [showtimeToDelete, setShowtimeToDelete] = useState<IShowtime | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [movieFilter, setMovieFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);
  const [seatCounts, setSeatCounts] = useState<Record<string, { booked: number; total: number }>>({});

  const fetchShowtimes = async () => {
    setLoading(true);
    try {
      const result = await showtimeService.getShowtimes({
        page,
        limit: DEFAULT_PAGE_SIZE,
        movieId: movieFilter || undefined,
        date: dateFilter || undefined,
        sort: 'date',
        order: 'asc',
      });
      const data = result.items;
      setShowtimes(data);
      setPagination(result.pagination);

      const counts = await Promise.all(
        data.map(async (showtime) => {
          try {
            const seatMap = await showtimeService.getShowtimeSeats(showtime._id);
            return [showtime._id, { booked: seatMap.bookedSeats.length, total: seatMap.totalSeat }] as const;
          } catch {
            return [showtime._id, { booked: 0, total: showtime.totalSeat || showtime.hall.total_seats }] as const;
          }
        }),
      );
      setSeatCounts(Object.fromEntries(counts));
    } catch {
      toast.error('Failed to load showtimes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [movieFilter, dateFilter]);

  useEffect(() => {
    fetchShowtimes();
  }, [page, movieFilter, dateFilter]);

  const handleOpenModal = (showtime: IShowtime | null) => {
    setEditingShowtime(showtime);
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (searchParams.get('openModal') === 'true') {
      handleOpenModal(null);
      searchParams.delete('openModal');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingShowtime(null);
  };

  const handleSave = () => {
    fetchShowtimes();
    handleCloseModal();
  };

  const handleConfirmDelete = async (showtimeId: string) => {
    try {
      await showtimeService.deleteShowtime(showtimeId);
      toast.success('Showtime deleted successfully');
      fetchShowtimes();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete showtime');
      }
    } finally {
      setShowtimeToDelete(null);
    }
  };

  if (loading && showtimes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isModalOpen && <ShowtimeForm showtimeToEdit={editingShowtime} onClose={handleCloseModal} onSave={handleSave} />}
      {showtimeToDelete && (
        <DeleteConfirmationModal
          showtime={showtimeToDelete}
          onClose={() => setShowtimeToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('adminNavShowtimes')}</h1>
          <p className="text-gray-500 dark:text-slate-400">Manage movie showtimes</p>
        </div>
        <button type="button" onClick={() => handleOpenModal(null)} className="btn btn-primary flex items-center justify-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Add Showtime</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <select value={movieFilter} onChange={(event) => setMovieFilter(event.target.value)} className="input">
          <option value="">All Movies</option>
          {[...new Map(showtimes.map((showtime) => [showtime.movie?._id, showtime.movie])).values()].map((movie) => (
            <option key={movie?._id} value={movie?._id}>{movie?.title}</option>
          ))}
        </select>
        <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="input" />
      </div>

      {showtimes.length === 0 ? (
        <div className="text-center py-12 card">
          <Calendar className="h-16 w-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-4">No showtimes found</p>
          <button type="button" onClick={() => handleOpenModal(null)} className="btn btn-primary">Add Your First Showtime</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-dark-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Movie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Studio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Seats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {showtimes.map((showtime) => {
                  const seats = seatCounts[showtime._id];
                  return (
                    <tr key={showtime._id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">{showtime.movie?.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
                          {showtime.studio || showtime.hall.hall_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                        <div>{new Date(showtime.show_date).toLocaleDateString('id-ID')}</div>
                        <div className="text-gray-500 dark:text-slate-400">{showtime.start_time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-500 dark:text-primary-400">
                        IDR {showtime.ticket_price.toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-300">
                        {seats ? `${seats.booked} booked / ${seats.total - seats.booked} available` : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button type="button" onClick={() => handleOpenModal(showtime)} className="text-green-400 hover:text-green-300 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-700">
                            <Edit className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => setShowtimeToDelete(showtime)} className="text-red-400 hover:text-red-300 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-700">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
