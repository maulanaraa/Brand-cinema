import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Plus, Edit, Trash2, Ticket } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';
import { ApiError, cinemaService } from '@/services/cinemaService';
import { cityService } from '@/services/cityService';
import type { ICinema, ICity } from '@/types';
import { EMPTY_PAGINATION, DEFAULT_PAGE_SIZE } from '@/types/pagination';
import type { PaginationMeta } from '@/types/pagination';
import {
  buildCinemaRequestBody,
  getCinemaCityId,
  getCinemaCityName,
  type CinemaFormValues,
} from '@/utils/cinema';
import { useLanguage } from '@/contexts/LanguageContext';

type CinemaFormData = CinemaFormValues;

interface CinemaFormProps {
  cinemaToEdit: ICinema | null;
  cities: ICity[];
  onClose: () => void;
  onSave: () => void;
}

const CinemaForm: React.FC<CinemaFormProps> = ({ cinemaToEdit, cities, onClose, onSave }) => {
  const { t } = useLanguage();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CinemaFormData>();

  useEffect(() => {
    if (cinemaToEdit) {
      reset({
        name: cinemaToEdit.name,
        city_id: getCinemaCityId(cinemaToEdit),
        address: cinemaToEdit.address ?? '',
        is_active: cinemaToEdit.is_active ?? true,
        sort_order: cinemaToEdit.sort_order ?? 0,
      });
    } else {
      reset({
        name: '',
        city_id: cities[0]?._id ?? '',
        address: '',
        is_active: true,
        sort_order: 0,
      });
    }
    setFormError('');
  }, [cinemaToEdit, cities, reset]);

  const onSubmit: SubmitHandler<CinemaFormData> = async (formData) => {
    setFormError('');

    if (!formData.city_id) {
      setFormError('Please select a city');
      return;
    }

    try {
      const payload = buildCinemaRequestBody(formData);

      if (cinemaToEdit) {
        await cinemaService.updateCinema(cinemaToEdit._id, payload);
      } else {
        await cinemaService.createCinema(payload);
      }

      toast.success(`Cinema ${cinemaToEdit ? 'updated' : 'added'} successfully!`);
      onSave();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.errors.join(', ') || error.message);
      } else if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Failed to save cinema');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg p-6 relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">&times;</button>
        <h2 className="text-2xl font-bold mb-6">{cinemaToEdit ? t('editCinema') : t('addNewCinema')}</h2>

        {formError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Cinema Name</label>
            <input
              {...register('name', { required: 'Cinema name is required' })}
              className="input"
              placeholder="Grand Indonesia"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <select
              {...register('city_id', { required: 'City is required' })}
              className="input"
            >
              <option value="">Select city</option>
              {cities.map((city) => (
                <option key={city._id} value={city._id}>{city.name}</option>
              ))}
            </select>
            {errors.city_id && <p className="text-red-400 text-sm mt-1">{errors.city_id.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address (optional)</label>
            <input {...register('address')} className="input" placeholder="Jl. M.H. Thamrin No.1" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sort Order</label>
            <input type="number" {...register('sort_order', { valueAsNumber: true })} className="input" />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="cinema-active" {...register('is_active')} className="rounded" />
            <label htmlFor="cinema-active" className="text-sm">Active (shown in homepage filter)</label>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Save Cinema'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteModalProps {
  cinema: ICinema;
  onClose: () => void;
  onConfirm: (cinemaId: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ cinema, onClose, onConfirm }) => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{t('confirmDeletion')}</h2>
        <p className="text-gray-600 dark:text-slate-300 mb-6">
          Are you sure you want to delete "<strong>{cinema.name}</strong>"?
        </p>
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="button" onClick={() => onConfirm(cinema._id)} className="btn btn-danger">
            Delete Cinema
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminCinemasPage() {
  const { t } = useLanguage();
  const [cinemas, setCinemas] = useState<ICinema[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCinema, setEditingCinema] = useState<ICinema | null>(null);
  const [cinemaToDelete, setCinemaToDelete] = useState<ICinema | null>(null);
  const [page, setPage] = useState(1);
  const [cityFilter, setCityFilter] = useState('');
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    fetchCinemas();
  }, [page, cityFilter]);

  const loadCities = async () => {
    try {
      const result = await cityService.getCities({
        isActive: 'all',
        limit: 100,
        sort: 'name',
        order: 'asc',
      });
      setCities(result.items);
    } catch {
      toast.error('Failed to load cities');
    }
  };

  const fetchCinemas = async () => {
    setLoading(true);
    try {
      const result = await cinemaService.getCinemas({
        page,
        limit: DEFAULT_PAGE_SIZE,
        isActive: 'all',
        cityId: cityFilter || undefined,
        sort: 'sortOrder',
        order: 'asc',
      });
      setCinemas(result.items);
      setPagination(result.pagination);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to load cinemas');
      } else {
        toast.error('Failed to load cinemas');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cinema: ICinema | null) => {
    setEditingCinema(cinema);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCinema(null);
  };

  const handleSave = () => {
    fetchCinemas();
    handleCloseModal();
  };

  const handleConfirmDelete = async (cinemaId: string) => {
    try {
      await cinemaService.deleteCinema(cinemaId);
      toast.success('Cinema deleted successfully');
      fetchCinemas();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.errors.join(', ') || error.message || 'Failed to delete cinema');
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete cinema');
      }
    } finally {
      setCinemaToDelete(null);
    }
  };

  if (loading && cinemas.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isModalOpen && (
        <CinemaForm
          cinemaToEdit={editingCinema}
          cities={cities.filter((c) => c.is_active !== false)}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
      {cinemaToDelete && (
        <DeleteConfirmationModal
          cinema={cinemaToDelete}
          onClose={() => setCinemaToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('adminNavCinemas')}</h1>
          <p className="text-gray-500 dark:text-slate-400">Manage cinema venues per city</p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenModal(null)}
          className="btn btn-primary flex items-center space-x-2"
          disabled={cities.length === 0}
        >
          <Plus className="h-5 w-5" />
          <span>Add Cinema</span>
        </button>
      </div>

      {cities.length === 0 && (
        <div className="rounded-lg border border-[#D5A527]/30 bg-[#D5A527]/10 p-4 text-sm text-[#D5A527]">
          Add at least one city before creating cinemas.
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-500 dark:text-slate-400">Filter by city</label>
        <select
          value={cityFilter}
          onChange={(e) => {
            setPage(1);
            setCityFilter(e.target.value);
          }}
          className="input max-w-xs"
        >
          <option value="">All cities</option>
          {cities.map((city) => (
            <option key={city._id} value={city._id}>{city.name}</option>
          ))}
        </select>
      </div>

      {cinemas.length === 0 ? (
        <div className="text-center py-12 card">
          <Ticket className="h-16 w-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-4">No cinemas found</p>
          <button
            type="button"
            onClick={() => handleOpenModal(null)}
            className="btn btn-primary"
            disabled={cities.length === 0}
          >
            Add Your First Cinema
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-dark-800/50">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-sm font-semibold">City</th>
                  <th className="px-6 py-3 text-sm font-semibold">Address</th>
                  <th className="px-6 py-3 text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-sm font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {cinemas.map((cinema) => (
                  <tr key={cinema._id} className="hover:bg-gray-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{cinema.name}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">{getCinemaCityName(cinema)}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">{cinema.address || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        cinema.is_active !== false
                          ? 'bg-green-500/15 text-green-500'
                          : 'bg-gray-500/15 text-gray-500'
                      }`}>
                        {cinema.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(cinema)}
                          className="btn btn-secondary flex items-center space-x-1"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCinemaToDelete(cinema)}
                          className="btn btn-danger flex items-center space-x-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
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
