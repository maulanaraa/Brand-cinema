import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Plus, Edit, Trash2, Building } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';
import { ApiError, hallService } from '@/services/hallService';
import type { IHall } from '@/types';
import { EMPTY_PAGINATION, DEFAULT_PAGE_SIZE } from '@/types/pagination';
import type { PaginationMeta } from '@/types/pagination';
import { buildHallRequestBody, validateHallLayout, type HallFormValues } from '@/utils/hall';
import { useLanguage } from '@/contexts/LanguageContext';

type HallFormData = HallFormValues;

interface HallFormProps {
  hallToEdit: IHall | null;
  onClose: () => void;
  onSave: () => void;
}

const HallForm: React.FC<HallFormProps> = ({ hallToEdit, onClose, onSave }) => {
  const { t } = useLanguage();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HallFormData>();

  useEffect(() => {
    if (hallToEdit) {
      reset({
        hall_name: hallToEdit.hall_name,
        total_seats: hallToEdit.total_seats,
        layout_rows: hallToEdit.layout_rows,
        layout_columns: hallToEdit.layout_columns,
        is_active: hallToEdit.is_active ?? true,
      });
    } else {
      reset({
        hall_name: '',
        total_seats: 100,
        layout_rows: 10,
        layout_columns: 10,
        is_active: true,
      });
    }
    setFormError('');
  }, [hallToEdit, reset]);

  const onSubmit: SubmitHandler<HallFormData> = async (formData) => {
    setFormError('');

    const layoutError = validateHallLayout(formData);
    if (layoutError) {
      setFormError(layoutError);
      return;
    }

    try {
      const payload = buildHallRequestBody(formData);

      if (hallToEdit) {
        await hallService.updateHall(hallToEdit._id, payload);
      } else {
        await hallService.createHall(payload);
      }

      toast.success(`Hall ${hallToEdit ? 'updated' : 'added'} successfully!`);
      onSave();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.errors.join(', ') || error.message);
      } else if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Failed to save hall');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg p-6 relative">
        <button type="button" onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">&times;</button>
        <h2 className="text-2xl font-bold mb-6">{hallToEdit ? t('editHall') : t('addNewHall')}</h2>

        {formError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400" role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Hall Name</label>
            <input {...register('hall_name', { required: 'Hall name is required' })} className="input" />
            {errors.hall_name && <p className="text-red-400 text-sm mt-1">{errors.hall_name.message}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Total Seats</label>
              <input type="number" {...register('total_seats', { required: 'Total seats is required', valueAsNumber: true, min: { value: 1, message: 'Minimum 1 seat' } })} className="input" />
              {errors.total_seats && <p className="text-red-400 text-sm mt-1">{errors.total_seats.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rows</label>
              <input type="number" {...register('layout_rows', { required: 'Number of rows is required', valueAsNumber: true, min: { value: 1, message: 'Minimum 1 row' } })} className="input" />
              {errors.layout_rows && <p className="text-red-400 text-sm mt-1">{errors.layout_rows.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Columns</label>
              <input type="number" {...register('layout_columns', { required: 'Number of columns is required', valueAsNumber: true, min: { value: 1, message: 'Minimum 1 column' } })} className="input" />
              {errors.layout_columns && <p className="text-red-400 text-sm mt-1">{errors.layout_columns.message}</p>}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400">Total seats must equal rows × columns.</p>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Save Hall'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteModalProps {
  hall: IHall;
  onClose: () => void;
  onConfirm: (hallId: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ hall, onClose, onConfirm }) => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{t('confirmDeletion')}</h2>
        <p className="text-gray-600 dark:text-slate-300 mb-6">
          Are you sure you want to delete "<strong>{hall.hall_name}</strong>"? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(hall._id)}
            className="btn btn-danger"
          >
            Delete Hall
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminHallsPage() {
  const { t } = useLanguage();
  const [halls, setHalls] = useState<IHall[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<IHall | null>(null);
  const [hallToDelete, setHallToDelete] = useState<IHall | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);

  useEffect(() => {
    fetchHalls();
  }, [page]);

  const fetchHalls = async () => {
    setLoading(true);
    try {
      const result = await hallService.getHalls({ page, limit: DEFAULT_PAGE_SIZE });
      setHalls(result.items);
      setPagination(result.pagination);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to load halls');
      } else {
        toast.error('Failed to load halls');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (hall: IHall | null) => {
    setEditingHall(hall);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHall(null);
  };

  const handleSave = () => {
    fetchHalls();
    handleCloseModal();
  };

  const handleDeleteClick = (hall: IHall) => {
    setHallToDelete(hall);
  };

  const handleConfirmDelete = async (hallId: string) => {
    try {
      await hallService.deleteHall(hallId);
      toast.success('Hall deleted successfully');
      fetchHalls();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.errors.join(', ') || error.message || 'Failed to delete hall');
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete hall');
      }
    } finally {
      setHallToDelete(null);
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
        <HallForm
          hallToEdit={editingHall}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
      {hallToDelete && (
        <DeleteConfirmationModal
          hall={hallToDelete}
          onClose={() => setHallToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('adminNavHalls')}</h1>
          <p className="text-gray-500 dark:text-slate-400">Manage your cinema halls</p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenModal(null)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Hall</span>
        </button>
      </div>

      {halls.length === 0 ? (
        <div className="text-center py-12 card">
          <Building className="h-16 w-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-4">No halls found</p>
          <button type="button" onClick={() => handleOpenModal(null)} className="btn btn-primary">
            Add Your First Hall
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {halls.map((hall) => (
            <div key={hall._id} className="card p-6 flex flex-col min-w-0 overflow-hidden">
              <div className="flex-grow min-w-0">
                <div className="flex items-center mb-4 min-w-0">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-12 h-12 shrink-0 bg-primary-500/20 rounded-lg flex items-center justify-center">
                      <Building className="h-6 w-6 text-primary-500 dark:text-primary-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">{hall.hall_name}</h3>
                      <p className="text-sm text-gray-500 dark:text-slate-400 truncate" title={hall._id}>
                        ID: {hall._id}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">Total Seats</span>
                    <span className="text-gray-900 dark:text-white font-medium">{hall.total_seats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">Layout</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {hall.layout_rows} × {hall.layout_columns}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">Created</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {hall.createdAt ? new Date(hall.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/[0.08] flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleOpenModal(hall)}
                  className="btn btn-secondary flex-1 flex items-center justify-center space-x-2"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(hall)}
                  className="btn btn-danger flex-1 flex items-center justify-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
