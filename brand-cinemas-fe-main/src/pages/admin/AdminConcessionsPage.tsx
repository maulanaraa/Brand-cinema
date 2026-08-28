import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Edit, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import { CONCESSION_CATEGORIES, CONCESSION_CATEGORY_OPTIONS } from '@/constants/concessionItems';
import { ApiError, concessionService } from '@/services/concessionService';
import type { ConcessionCategory, ConcessionItem } from '@/types/concession';
import { EMPTY_PAGINATION, DEFAULT_PAGE_SIZE } from '@/types/pagination';
import type { PaginationMeta } from '@/types/pagination';
import { getConcessionImageUrl } from '@/utils/concession';
import { isGoogleDriveFolderUrl, resolvePublicImageUrl } from '@/utils/imageUrl';
import { useLanguage } from '@/contexts/LanguageContext';

interface ConcessionFormFields {
  name: string;
  description: string;
  price: number;
  category: ConcessionCategory;
  imageUrl: string;
  badge?: string;
  isActive: boolean;
  sortOrder: number;
}

interface ConcessionFormProps {
  itemToEdit: ConcessionItem | null;
  onClose: () => void;
  onSave: () => void;
}

const ConcessionForm: React.FC<ConcessionFormProps> = ({ itemToEdit, onClose, onSave }) => {
  const { t } = useLanguage();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConcessionFormFields>({
    defaultValues: {
      category: 'popcorn',
      isActive: true,
      sortOrder: 0,
      imageUrl: '',
    },
  });

  const imageUrl = watch('imageUrl');

  useEffect(() => {
    if (itemToEdit) {
      reset({
        name: itemToEdit.name,
        description: itemToEdit.description,
        price: itemToEdit.price,
        category: itemToEdit.category,
        imageUrl: itemToEdit.imageUrl,
        badge: itemToEdit.badge ?? '',
        isActive: itemToEdit.isActive,
        sortOrder: itemToEdit.sortOrder,
      });
    } else {
      reset({
        name: '',
        description: '',
        price: 0,
        category: 'popcorn',
        imageUrl: '',
        badge: '',
        isActive: true,
        sortOrder: 0,
      });
    }
    setFormError('');
  }, [itemToEdit, reset]);

  const onSubmit: SubmitHandler<ConcessionFormFields> = async (formData) => {
    setFormError('');
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        category: formData.category,
        imageUrl: formData.imageUrl.trim(),
        badge: formData.badge?.trim() || undefined,
        isActive: formData.isActive,
        sortOrder: Number(formData.sortOrder) || 0,
      };

      if (itemToEdit) {
        await concessionService.updateConcession(itemToEdit.id, payload);
      } else {
        await concessionService.createConcession(payload);
      }

      toast.success(`Item ${itemToEdit ? 'diperbarui' : 'ditambahkan'} berhasil`);
      onSave();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.errors.join(', ') || error.message);
      } else {
        setFormError('Gagal menyimpan item');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 dark:bg-dark-900/80">
      <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {itemToEdit ? t('editFoodItem') : t('addNewFoodItem')}
          </h2>
          <button type="button" onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">
            ×
          </button>
        </div>

        {formError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Nama</label>
              <input {...register('name', { required: 'Nama wajib diisi' })} className="input" />
              {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">Deskripsi</label>
              <textarea
                {...register('description', { required: 'Deskripsi wajib diisi' })}
                className="input min-h-[80px]"
                rows={3}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Kategori</label>
              <select {...register('category', { required: true })} className="input">
                {CONCESSION_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Harga (IDR)</label>
              <input
                type="number"
                min={0}
                {...register('price', { required: 'Harga wajib diisi', min: 0 })}
                className="input"
              />
              {errors.price && <p className="mt-1 text-sm text-red-400">{errors.price.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium">URL Gambar</label>
              <input
                type="url"
                placeholder="https://example.com/popcorn.jpg"
                {...register('imageUrl', {
                  required: 'URL gambar wajib diisi',
                  pattern: {
                    value: /^https?:\/\/.+/i,
                    message: 'Gunakan URL http/https yang valid',
                  },
                  validate: (value) => {
                    const trimmed = value.trim();
                    if (isGoogleDriveFolderUrl(trimmed)) {
                      return 'Link folder Google Drive tidak bisa dipakai. Buka tiap gambar, salin link file-nya (bukan link folder).';
                    }
                    return true;
                  },
                })}
                className="input"
              />
              {errors.imageUrl && (
                <p className="mt-1 text-sm text-red-400">{errors.imageUrl.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">
                Satu URL per item. Google Drive: buka file gambar → Share → salin link file (bukan link folder).
              </p>
            </div>
            {imageUrl && /^https?:\/\//i.test(imageUrl) && !isGoogleDriveFolderUrl(imageUrl) && (
              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-medium">Preview</p>
                <img
                  src={resolvePublicImageUrl(imageUrl) ?? imageUrl}
                  alt="Preview"
                  className="h-32 w-32 rounded-lg border border-gray-200 object-cover dark:border-white/[0.08]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium">Badge (opsional)</label>
              <input {...register('badge')} className="input" placeholder="Best Value" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Urutan tampil</label>
              <input type="number" min={0} {...register('sortOrder', { min: 0 })} className="input" />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" id="isActive" {...register('isActive')} className="h-4 w-4" />
              <label htmlFor="isActive" className="text-sm font-medium">
                Aktif (tampil di checkout user)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Batal
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteModalProps {
  item: ConcessionItem;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ item, onClose, onConfirm }) => {
  const { t } = useLanguage();
  return (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4 dark:bg-dark-900/80">
    <div className="card w-full max-w-md p-6">
      <h2 className="mb-4 text-xl font-bold">{t('deleteFnBItem')}</h2>
      <p className="mb-6 text-gray-600 dark:text-slate-300">
        Hapus &quot;<strong>{item.name}</strong>&quot; dari menu?
      </p>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn btn-secondary">
          Batal
        </button>
        <button type="button" onClick={() => onConfirm(item.id)} className="btn btn-danger">
          Hapus
        </button>
      </div>
    </div>
  </div>
  );
};

export default function AdminConcessionsPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<ConcessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ConcessionItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ConcessionItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const result = await concessionService.getConcessionsAdmin({
        page,
        limit: DEFAULT_PAGE_SIZE,
        category: categoryFilter ? (categoryFilter as ConcessionCategory) : undefined,
        search: search || undefined,
      });
      setItems(result.items);
      setPagination(result.pagination);
    } catch (error) {
      if (error instanceof ApiError && error.status === 403) {
        toast.error('Akses ditolak. Login sebagai admin.');
      } else {
        toast.error('Gagal memuat menu F&B');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [categoryFilter, search]);

  useEffect(() => {
    fetchItems();
  }, [page, categoryFilter, search]);

  const handleOpenModal = (item: ConcessionItem | null) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    try {
      await concessionService.deleteConcession(id);
      toast.success('Item dihapus');
      setItemToDelete(null);
      fetchItems();
    } catch {
      toast.error('Gagal menghapus item');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('foodAndBeverage')}</h1>
          <p className="text-gray-500 dark:text-slate-400">Kelola menu F&B untuk halaman order summary</p>
        </div>
        <button type="button" onClick={() => handleOpenModal(null)} className="btn btn-primary">
          <Plus className="h-4 w-4" />
          Tambah Item
        </button>
      </div>

      <div className="card mb-6 grid grid-cols-1 gap-4 p-4 md:grid-cols-3">
        <input
          type="search"
          placeholder="Cari nama..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input"
        >
          <option value="">Semua kategori</option>
          {CONCESSION_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-8 text-center text-gray-500 dark:text-slate-400">
          Belum ada item F&B. Tambahkan item pertama.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/[0.08]">
                <th className="p-4">Gambar</th>
                <th className="p-4">Nama</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Harga</th>
                <th className="p-4">Status</th>
                <th className="p-4">Urutan</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-dark-800/40 transition-colors">
                  <td className="p-4">
                    <img
                      src={getConcessionImageUrl(item.imageUrl)}
                      alt={item.name}
                      className="h-14 w-14 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getConcessionImageUrl();
                      }}
                    />
                  </td>
                  <td className="p-4">
                    <p className="font-semibold">{item.name}</p>
                    <p className="line-clamp-1 text-xs text-gray-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  </td>
                  <td className="p-4">{CONCESSION_CATEGORIES[item.category].label}</td>
                  <td className="p-4">IDR {item.price.toLocaleString('id-ID')}</td>
                  <td className="p-4">
                    <span
                      className={`status-badge ${item.isActive ? 'status-confirmed' : 'status-cancelled'}`}
                    >
                      {item.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="p-4">{item.sortOrder}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(item)}
                        className="btn btn-secondary p-2"
                        aria-label={`Edit ${item.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        className="btn btn-danger p-2"
                        aria-label={`Hapus ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination pagination={pagination} onPageChange={setPage} />
        </div>
      )}

      {isModalOpen && (
        <ConcessionForm
          itemToEdit={editingItem}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
        />
      )}

      {itemToDelete && (
        <DeleteConfirmationModal
          item={itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
