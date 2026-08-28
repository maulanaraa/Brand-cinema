import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';
import { ApiError, cityService } from '@/services/cityService';
import type { ICity } from '@/types';
import { EMPTY_PAGINATION, DEFAULT_PAGE_SIZE } from '@/types/pagination';
import type { PaginationMeta } from '@/types/pagination';
import { buildCityRequestBody, type CityFormValues } from '@/utils/city';
import { useLanguage } from '@/contexts/LanguageContext';

type CityFormData = CityFormValues;

interface CityFormProps {
  cityToEdit: ICity | null;
  onClose: () => void;
  onSave: () => void;
}

const CityForm: React.FC<CityFormProps> = ({ cityToEdit, onClose, onSave }) => {
  const { t } = useLanguage();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CityFormData>();

  useEffect(() => {
    if (cityToEdit) {
      reset({
        name: cityToEdit.name,
        slug: cityToEdit.slug ?? '',
        is_active: cityToEdit.is_active ?? true,
        sort_order: cityToEdit.sort_order ?? 0,
      });
    } else {
      reset({
        name: '',
        slug: '',
        is_active: true,
        sort_order: 0,
      });
    }
    setFormError('');
  }, [cityToEdit, reset]);

  const onSubmit: SubmitHandler<CityFormData> = async (formData) => {
    setFormError('');

    try {
      const payload = buildCityRequestBody(formData);

      if (cityToEdit) {
        await cityService.updateCity(cityToEdit._id, payload);
      } else {
        await cityService.createCity(payload);
      }

      toast.success(`City ${cityToEdit ? 'updated' : 'added'} successfully!`);
      onSave();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.errors.join(', ') || error.message);
      } else if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Failed to save city');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg p-6 relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">&times;</button>
        <h2 className="text-2xl font-bold mb-6">{cityToEdit ? t('editCity') : t('addNewCity')}</h2>

        {formError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">City Name</label>
            <input {...register('name', { required: 'City name is required' })} className="input" placeholder="Jakarta" />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Slug (optional)</label>
            <input {...register('slug')} className="input" placeholder="jakarta" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sort Order</label>
            <input
              type="number"
              {...register('sort_order', { valueAsNumber: true })}
              className="input"
            />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="city-active" {...register('is_active')} className="rounded" />
            <label htmlFor="city-active" className="text-sm">Active (shown in homepage filter)</label>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Save City'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteModalProps {
  city: ICity;
  onClose: () => void;
  onConfirm: (cityId: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ city, onClose, onConfirm }) => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{t('confirmDeletion')}</h2>
        <p className="text-gray-600 dark:text-slate-300 mb-6">
          Are you sure you want to delete "<strong>{city.name}</strong>"? Delete is blocked if this city still has active cinemas.
        </p>
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button type="button" onClick={() => onConfirm(city._id)} className="btn btn-danger">
            Delete City
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminCitiesPage() {
  const { t } = useLanguage();
  const [cities, setCities] = useState<ICity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<ICity | null>(null);
  const [cityToDelete, setCityToDelete] = useState<ICity | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);

  useEffect(() => {
    fetchCities();
  }, [page]);

  const fetchCities = async () => {
    setLoading(true);
    try {
      const result = await cityService.getCities({
        page,
        limit: DEFAULT_PAGE_SIZE,
        isActive: 'all',
        sort: 'sortOrder',
        order: 'asc',
      });
      setCities(result.items);
      setPagination(result.pagination);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to load cities');
      } else {
        toast.error('Failed to load cities');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (city: ICity | null) => {
    setEditingCity(city);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCity(null);
  };

  const handleSave = () => {
    fetchCities();
    handleCloseModal();
  };

  const handleConfirmDelete = async (cityId: string) => {
    try {
      await cityService.deleteCity(cityId);
      toast.success('City deleted successfully');
      fetchCities();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.errors.join(', ') || error.message || 'Failed to delete city');
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete city');
      }
    } finally {
      setCityToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isModalOpen && (
        <CityForm cityToEdit={editingCity} onClose={handleCloseModal} onSave={handleSave} />
      )}
      {cityToDelete && (
        <DeleteConfirmationModal
          city={cityToDelete}
          onClose={() => setCityToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('adminNavCities')}</h1>
          <p className="text-gray-500 dark:text-slate-400">Manage cities shown in the location filter</p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenModal(null)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add City</span>
        </button>
      </div>

      {cities.length === 0 ? (
        <div className="text-center py-12 card">
          <MapPin className="h-16 w-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-4">No cities found</p>
          <button type="button" onClick={() => handleOpenModal(null)} className="btn btn-primary">
            Add Your First City
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-dark-800/50">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-sm font-semibold">Slug</th>
                  <th className="px-6 py-3 text-sm font-semibold">Order</th>
                  <th className="px-6 py-3 text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-sm font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {cities.map((city) => (
                  <tr key={city._id} className="hover:bg-gray-50 dark:hover:bg-dark-800/40 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{city.name}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">{city.slug || '—'}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">{city.sort_order ?? 0}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        city.is_active !== false
                          ? 'bg-green-500/15 text-green-500'
                          : 'bg-gray-500/15 text-gray-500'
                      }`}>
                        {city.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(city)}
                          className="btn btn-secondary flex items-center space-x-1"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setCityToDelete(city)}
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
