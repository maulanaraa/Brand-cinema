import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Plus, Edit, Trash2, UtensilsCrossed, Search } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { foodService } from '@/services/foodService';
import type { IFoodItem } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

type FoodItemFormData = Omit<IFoodItem, '_id' | 'createdAt' | 'updatedAt'>;

interface FoodItemFormProps {
  itemToEdit: IFoodItem | null;
  onClose: () => void;
  onSave: () => void;
}

const FoodItemForm: React.FC<FoodItemFormProps> = ({ itemToEdit, onClose, onSave }) => {
  const { t } = useLanguage();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FoodItemFormData>();

  const imageUrl = watch('image_url');

  useEffect(() => {
    if (itemToEdit) {
      reset(itemToEdit);
    } else {
      reset({
        name: '',
        price: 0,
        category: 'popcorn',
        image_url: '',
        is_available: true,
      });
    }
  }, [itemToEdit, reset]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      reset((prev) => ({ ...prev, image_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const onSubmit: SubmitHandler<FoodItemFormData> = async (formData) => {
    try {
      const dataToSubmit = { ...formData, price: Number(formData.price) };
      if (itemToEdit) {
        await foodService.updateFoodItem(itemToEdit._id, dataToSubmit);
      } else {
        await foodService.createFoodItem(dataToSubmit);
      }
      toast.success(`Food item ${itemToEdit ? 'updated' : 'added'} successfully!`);
      onSave();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center">
      <div className="card w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">&times;</button>
        <h2 className="text-2xl font-bold mb-6">{itemToEdit ? t('editFoodItem') : t('addNewFoodItem')}</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input {...register('name', { required: 'Name is required' })} className="input" placeholder="e.g. Popcorn Butter" />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Price (IDR)</label>
            <input type="number" {...register('price', { required: 'Price is required', valueAsNumber: true, min: { value: 0, message: 'Price must be positive' } })} className="input" />
            {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select {...register('category', { required: 'Category is required' })} className="input">
              <option value="popcorn">Popcorn</option>
              <option value="minuman">Minuman</option>
              <option value="snack">Snack</option>
            </select>
            {errors.category && <p className="text-red-400 text-sm mt-1">{errors.category.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Image</label>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="input mb-2" />
            <input {...register('image_url')} className="input" placeholder="Or paste image URL here" />
            {imageUrl && (
              <img src={imageUrl} alt="Preview" className="mt-2 h-32 w-32 rounded-lg object-cover" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register('is_available')} id="is_available" className="h-4 w-4 rounded" />
            <label htmlFor="is_available" className="text-sm font-medium">Available</label>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteModalProps {
  item: IFoodItem;
  onClose: () => void;
  onConfirm: (itemId: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ item, onClose, onConfirm }) => {
  const { t } = useLanguage();
  return (
  <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center">
    <div className="card p-6 w-full max-w-md">
      <h2 className="text-xl font-bold mb-4">{t('confirmDeletion')}</h2>
      <p className="text-gray-600 dark:text-slate-300 mb-6">
        Are you sure you want to delete "<strong>{item.name}</strong>"? This action cannot be undone.
      </p>
      <div className="flex justify-end space-x-4">
        <button onClick={onClose} className="btn btn-secondary">Cancel</button>
        <button onClick={() => onConfirm(item._id)} className="btn btn-danger">Delete Item</button>
      </div>
    </div>
  </div>
  );
};

const categoryLabels: Record<string, string> = {
  popcorn: 'Popcorn',
  minuman: 'Minuman',
  snack: 'Snack',
};

export default function AdminFoodItemsPage() {
  const { t } = useLanguage();
  const [foodItems, setFoodItems] = useState<IFoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IFoodItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<IFoodItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    fetchFoodItems();
  }, []);

  const fetchFoodItems = async () => {
    setLoading(true);
    try {
      const data = await foodService.getFoodItems();
      setFoodItems(data || []);
    } catch (error) {
      toast.error('Failed to load food items');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item: IFoodItem | null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = () => {
    fetchFoodItems();
    handleCloseModal();
  };

  const handleDeleteClick = (item: IFoodItem) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = async (itemId: string) => {
    try {
      await foodService.deleteFoodItem(itemId);
      toast.success('Food item deleted successfully');
      fetchFoodItems();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete food item');
    } finally {
      setItemToDelete(null);
    }
  };

  const filteredItems = foodItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

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
        <FoodItemForm itemToEdit={editingItem} onClose={handleCloseModal} onSave={handleSave} />
      )}
      {itemToDelete && (
        <DeleteConfirmationModal item={itemToDelete} onClose={() => setItemToDelete(null)} onConfirm={handleConfirmDelete} />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('foodItems')}</h1>
          <p className="text-gray-500 dark:text-slate-400">Manage cinema food & beverage menu</p>
        </div>
        <button onClick={() => handleOpenModal(null)} className="btn btn-primary flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Add Food Item</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search food items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input"
        >
          <option value="all">All Categories</option>
          <option value="popcorn">Popcorn</option>
          <option value="minuman">Minuman</option>
          <option value="snack">Snack</option>
        </select>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12 card">
          <UtensilsCrossed className="h-16 w-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-4">No food items found</p>
          <button onClick={() => handleOpenModal(null)} className="btn btn-primary">
            Add Your First Food Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div key={item._id} className="card p-6 flex flex-col border-0">
              <div className="flex-grow">
                <div className="flex items-center gap-4 mb-4">
                  <img
                    src={item.image_url || 'https://via.placeholder.com/100'}
                    alt={item.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.name}</h3>
                    <span className="inline-block rounded-full bg-primary-500/20 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-300">
                      {categoryLabels[item.category]}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">Price</span>
                    <span className="text-gray-900 dark:text-white font-medium">IDR {item.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-slate-400">Status</span>
                    <span className={`font-medium ${item.is_available ? 'text-green-500' : 'text-red-500'}`}>
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/[0.08] flex items-center space-x-2">
                <button onClick={() => handleOpenModal(item)} className="btn btn-secondary flex-1 flex items-center justify-center space-x-2">
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button onClick={() => handleDeleteClick(item)} className="btn btn-danger flex-1 flex items-center justify-center space-x-2">
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
