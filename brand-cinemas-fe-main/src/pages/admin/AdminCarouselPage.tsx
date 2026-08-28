import { useEffect, useState, useRef } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Film, Image, Link, Upload, X } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { carouselService } from '@/services/carouselService';
import { movieService } from '@/services/movieService';
import type { ICarouselItem, IMovie } from '@/types';
import {
  buildCarouselRequestBody,
  buildCarouselUpdateBody,
  type CarouselFormValues,
} from '@/utils/carousel';
import { useLanguage } from '@/contexts/LanguageContext';

interface CarouselFormProps {
  itemToEdit: ICarouselItem | null;
  onClose: () => void;
  onSave: () => void;
}

const CarouselForm: React.FC<CarouselFormProps> = ({ itemToEdit, onClose, onSave }) => {
  const { t } = useLanguage();
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CarouselFormValues>();

  const watchType = watch('type');

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    if (itemToEdit) {
      reset({
        type: itemToEdit.type,
        title: itemToEdit.title,
        description: itemToEdit.description ?? '',
        image_url: itemToEdit.image_url,
        link_url: itemToEdit.link_url ?? '',
        movie_id: itemToEdit.movie_id ?? itemToEdit.movie?._id ?? '',
        is_active: itemToEdit.is_active,
        order: itemToEdit.order,
      });
      const isBase64 = itemToEdit.image_url?.startsWith('data:');
      setImageMode(isBase64 ? 'upload' : 'url');
      setImagePreview(isBase64 ? itemToEdit.image_url : '');
    } else {
      reset({
        type: 'movie',
        title: '',
        description: '',
        image_url: '',
        link_url: '',
        movie_id: '',
        is_active: true,
        order: 1,
      });
      setImageMode('url');
      setImagePreview('');
    }
  }, [itemToEdit, reset]);

  const fetchMovies = async () => {
    try {
      const { items } = await movieService.getMovies({
        isActive: 'true',
        limit: 100,
        sort: 'title',
        order: 'asc',
      });
      setMovies(items);
    } catch (error) {
      console.error('Error fetching movies:', error);
      toast.error('Failed to load movies');
    }
  };

  const onSubmit: SubmitHandler<CarouselFormValues> = async (formData) => {
    try {
      if (itemToEdit) {
        await carouselService.updateCarouselItem(
          itemToEdit._id,
          buildCarouselUpdateBody(formData),
        );
      } else {
        await carouselService.createCarouselItem(buildCarouselRequestBody(formData));
      }
      toast.success(`Carousel item ${itemToEdit ? 'updated' : 'created'} successfully!`);
      onSave();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save carousel item';
      toast.error(message);
      console.error('Error saving carousel item:', error);
    }
  };

  const handleMovieSelect = (movieId: string) => {
    setValue('movie_id', movieId, { shouldValidate: true });
    if (movieId) {
      const movie = movies.find((m) => m._id === movieId);
      setValue('link_url', `/movies/${movieId}`, { shouldValidate: true });
      if (movie && !watch('title')) {
        setValue('title', movie.title);
      }
      if (movie?.description && !watch('description')) {
        setValue('description', movie.description);
      }
      if (movie?.backdrop_url || movie?.poster_url) {
        const image = movie.backdrop_url || movie.poster_url;
        if (!watch('image_url') && imageMode === 'url') {
          setValue('image_url', image, { shouldValidate: true });
        }
      }
    } else {
      setValue('link_url', '');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5MB or smaller');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      setValue('image_url', base64, { shouldValidate: true });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    setValue('image_url', '', { shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const switchImageMode = (mode: 'url' | 'upload') => {
    setImageMode(mode);
    setImagePreview('');
    setValue('image_url', '', { shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center">
      <div className="card w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">&times;</button>
        <h2 className="text-2xl font-bold mb-6">{itemToEdit ? t('editCarouselItem') : t('addNewCarouselItem')}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select {...register('type', { required: 'Type is required' })} className="input">
              <option value="movie">Movie</option>
              <option value="promotion">Promotion</option>
            </select>
            {errors.type && <p className="text-red-400 text-sm mt-1">{errors.type.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Title {watchType === 'movie' && <span className="text-gray-400">(for movie slides)</span>}</label>
            <input {...register('title', { required: 'Title is required' })} className="input" placeholder={watchType === 'promotion' ? 'Optional display title' : 'Movie title'} />
            {errors.title && <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>}
          </div>

          {watchType === 'movie' && (
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea {...register('description')} className="input" rows={3}></textarea>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => switchImageMode('url')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  imageMode === 'url'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-dark-700'
                }`}
              >
                <Link className="h-3.5 w-3.5" />
                URL
              </button>
              <button
                type="button"
                onClick={() => switchImageMode('upload')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  imageMode === 'upload'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-dark-700'
                }`}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload File
              </button>
            </div>

            {imageMode === 'url' ? (
              <input
                {...register('image_url', { required: 'Image URL is required' })}
                className="input"
                placeholder="https://..."
              />
            ) : (
              <div>
                <input type="hidden" {...register('image_url', { required: 'Image is required' })} />
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="carousel-image-upload"
                />
                {imagePreview ? (
                  <div className="relative inline-block w-full">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-40 object-cover rounded-lg border border-gray-200 dark:border-white/[0.08]"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="carousel-image-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-white/[0.15] rounded-lg cursor-pointer hover:border-primary-500 dark:hover:border-primary-400 transition-colors bg-gray-50 dark:bg-dark-800/50"
                  >
                    <Upload className="h-8 w-8 text-gray-400 dark:text-slate-500 mb-2" />
                    <span className="text-sm text-gray-500 dark:text-slate-400">Click to upload image</span>
                    <span className="text-xs text-gray-400 dark:text-slate-500 mt-1">PNG, JPG, GIF up to 5MB</span>
                  </label>
                )}
              </div>
            )}
            {errors.image_url && <p className="text-red-400 text-sm mt-1">{errors.image_url.message}</p>}
          </div>

          {watchType === 'movie' && (
            <div>
              <label className="block text-sm font-medium mb-1">Link to Movie</label>
              <input type="hidden" {...register('movie_id')} />
              <select
                className="input"
                value={watch('movie_id') || ''}
                onChange={(e) => handleMovieSelect(e.target.value)}
              >
                <option value="">Select a movie</option>
                {movies.map((movie) => (
                  <option key={movie._id} value={movie._id}>
                    {movie.title}
                  </option>
                ))}
              </select>
              <input type="hidden" {...register('link_url')} />
            </div>
          )}

          {watchType === 'promotion' && (
            <div>
              <label className="block text-sm font-medium mb-1">Link URL</label>
              <input {...register('link_url')} className="input" placeholder="/promotions or https://..." />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Order</label>
              <input
                type="number"
                {...register('order', {
                  required: 'Order is required',
                  min: { value: 1, message: 'Min order is 1' },
                  valueAsNumber: true,
                })}
                className="input"
              />
              {errors.order && <p className="text-red-400 text-sm mt-1">{errors.order.message}</p>}
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('is_active')} className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500" />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteModalProps {
  item: ICarouselItem;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ item, onClose, onConfirm }) => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center">
      <div className="card p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{t('confirmDeletion')}</h2>
        <p className="text-gray-600 dark:text-slate-300 mb-6">
          Are you sure you want to delete &quot;<strong>{item.title}</strong>&quot;? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <button onClick={onClose} className="btn btn-secondary">Cancel</button>
          <button onClick={() => onConfirm(item._id)} className="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default function AdminCarouselPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<ICarouselItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ICarouselItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ICarouselItem | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'promotion'>('all');

  useEffect(() => {
    fetchItems();
  }, [filterType]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await carouselService.getCarouselItems({
        isActive: 'all',
        ...(filterType !== 'all' ? { type: filterType } : {}),
      });
      setItems(data);
    } catch (error) {
      console.error('Error fetching carousel items:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to load carousel items');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item: ICarouselItem | null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    fetchItems();
    handleCloseModal();
  };

  const handleDeleteClick = (item: ICarouselItem) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await carouselService.deleteCarouselItem(id);
      toast.success('Carousel item deleted successfully');
      fetchItems();
    } catch (error: unknown) {
      console.error('Error deleting carousel item:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete');
    } finally {
      setItemToDelete(null);
    }
  };

  const handleToggleActive = async (item: ICarouselItem) => {
    try {
      await carouselService.updateCarouselItem(item._id, { isActive: !item.is_active });
      toast.success(`Carousel item ${item.is_active ? 'deactivated' : 'activated'}`);
      fetchItems();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    if (filterType !== 'all') {
      toast.error('Switch to All to reorder slides');
      return;
    }

    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const nextOrder = [...items];
    const [moved] = nextOrder.splice(index, 1);
    nextOrder.splice(target, 0, moved);

    setItems(nextOrder);
    try {
      const reordered = await carouselService.reorderCarouselItems(
        nextOrder.map((item) => item._id),
      );
      setItems(reordered);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to reorder');
      fetchItems();
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
        <CarouselForm
          itemToEdit={editingItem}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
      {itemToDelete && (
        <DeleteConfirmationModal
          item={itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('adminNavCarousel')}</h1>
          <p className="text-gray-500 dark:text-slate-400">Manage homepage carousel slides</p>
        </div>
        <button
          onClick={() => handleOpenModal(null)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add Slide</span>
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterType === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-dark-700'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterType('movie')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            filterType === 'movie'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-dark-700'
          }`}
        >
          <Film className="h-4 w-4" />
          Movies
        </button>
        <button
          onClick={() => setFilterType('promotion')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            filterType === 'promotion'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 dark:bg-dark-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-dark-700'
          }`}
        >
          <Image className="h-4 w-4" />
          Promotions
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 card">
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-4">No carousel items found</p>
          <button onClick={() => handleOpenModal(null)} className="btn btn-primary">Add Your First Slide</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-dark-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-700">
                {items.map((item, index) => (
                  <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-dark-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-gray-400">
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => handleMove(index, -1)}
                            disabled={filterType !== 'all' || index === 0}
                            className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-30 dark:hover:bg-dark-700"
                            aria-label="Move up"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMove(index, 1)}
                            disabled={filterType !== 'all' || index === items.length - 1}
                            className="rounded p-0.5 hover:bg-gray-200 disabled:opacity-30 dark:hover:bg-dark-700"
                            aria-label="Move down"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-medium">{item.order}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <img
                        src={item.image_url || 'https://placehold.co/120x60/0f172a/94a3b8?text=No+Image'}
                        alt={item.title}
                        className="w-24 h-12 object-cover rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white max-w-xs truncate">
                        {item.title}
                      </div>
                      {item.description && (
                        <div className="text-sm text-gray-500 dark:text-slate-400 line-clamp-1 max-w-xs">
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        item.type === 'movie'
                          ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                          : 'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400'
                      }`}>
                        {item.type === 'movie' ? 'Movie' : 'Promotion'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                          item.is_active
                            ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {item.is_active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        {item.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="text-green-400 hover:text-green-300 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-dark-700"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item)}
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
        </div>
      )}
    </div>
  );
}
