import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Plus, Edit, Trash2, Search, UserRound } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, userService } from '@/services/userService';
import type { AdminUser, UserRole } from '@/types/user';
import { EMPTY_PAGINATION, DEFAULT_PAGE_SIZE } from '@/types/pagination';
import type { PaginationMeta } from '@/types/pagination';
import {
  buildCreateUserBody,
  buildUpdateUserBody,
  type UserFormValues,
} from '@/utils/user';
import { useLanguage } from '@/contexts/LanguageContext';

interface UserFormProps {
  userToEdit: AdminUser | null;
  onClose: () => void;
  onSave: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ userToEdit, onClose, onSave }) => {
  const { t } = useLanguage();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormValues>();

  useEffect(() => {
    if (userToEdit) {
      reset({
        name: userToEdit.name,
        email: userToEdit.email,
        password: '',
        role: userToEdit.role,
      });
    } else {
      reset({
        name: '',
        email: '',
        password: '',
        role: 'USER',
      });
    }
    setFormError('');
  }, [userToEdit, reset]);

  const onSubmit: SubmitHandler<UserFormValues> = async (formData) => {
    setFormError('');

    try {
      if (userToEdit) {
        await userService.updateUser(userToEdit._id, buildUpdateUserBody(formData));
      } else {
        await userService.createUser(buildCreateUserBody(formData));
      }

      toast.success(`User ${userToEdit ? 'updated' : 'created'} successfully!`);
      onSave();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.errors.join(', ') || error.message);
      } else if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('Failed to save user');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-lg p-6 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-6">{userToEdit ? t('editUser') : t('addNewUser')}</h2>

        {formError && (
          <div
            className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"
            role="alert"
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input
              {...register('name', {
                required: 'Name is required',
                maxLength: { value: 100, message: 'Name must be at most 100 characters' },
              })}
              className="input"
              placeholder="Jane Doe"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+\.\S+$/,
                  message: 'Enter a valid email',
                },
              })}
              className="input"
              placeholder="jane@example.com"
              autoComplete="off"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Password {userToEdit ? '(leave blank to keep current)' : ''}
            </label>
            <input
              type="password"
              {...register('password', {
                required: userToEdit ? false : 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters',
                },
              })}
              className="input"
              placeholder={userToEdit ? '••••••••' : 'Min. 8 characters'}
              autoComplete="new-password"
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              {...register('role', { required: 'Role is required' })}
              className="input"
            >
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </select>
            {errors.role && <p className="text-red-400 text-sm mt-1">{errors.role.message}</p>}
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? <LoadingSpinner size="sm" /> : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface DeleteModalProps {
  user: AdminUser;
  onClose: () => void;
  onConfirm: (userId: string) => void;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({ user, onClose, onConfirm }) => {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 bg-gray-900/50 dark:bg-dark-900/80 z-50 flex items-center justify-center p-4">
      <div className="card p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">{t('confirmDeletion')}</h2>
        <p className="text-gray-600 dark:text-slate-300 mb-6">
          Soft-delete <strong>{user.name}</strong> ({user.email})? The account will no longer be
          able to sign in.
        </p>
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={() => onConfirm(user._id)} className="btn btn-danger">
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
};

function formatDate(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>(EMPTY_PAGINATION);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await userService.getUsers({
        page,
        limit: DEFAULT_PAGE_SIZE,
        sort: 'createdAt',
        order: 'desc',
        ...(roleFilter !== 'all' ? { role: roleFilter } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      setUsers(result.items);
      setPagination(result.pagination);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Failed to load users');
      } else {
        toast.error('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user: AdminUser | null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = () => {
    fetchUsers();
    handleCloseModal();
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleConfirmDelete = async (userId: string) => {
    try {
      await userService.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.errors.join(', ') || error.message || 'Failed to delete user');
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to delete user');
      }
    } finally {
      setUserToDelete(null);
    }
  };

  const isSelf = (user: AdminUser) =>
    Boolean(currentUser && (currentUser.id === user._id || currentUser._id === user._id));

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {isModalOpen && (
        <UserForm userToEdit={editingUser} onClose={handleCloseModal} onSave={handleSave} />
      )}
      {userToDelete && (
        <DeleteConfirmationModal
          user={userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">{t('adminNavUsers')}</h1>
          <p className="text-gray-500 dark:text-slate-400">
            Manage customer and admin accounts
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleOpenModal(null)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add User</span>
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input pl-9"
            placeholder="Search by name or email"
          />
        </form>
        <div className="flex gap-2">
          {(['all', 'USER', 'ADMIN'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => {
                setRoleFilter(role);
                setPage(1);
              }}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                roleFilter === role
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-800 dark:text-slate-300 dark:hover:bg-dark-700'
              }`}
            >
              {role === 'all' ? 'All' : role}
            </button>
          ))}
        </div>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12 card">
          <UserRound className="h-16 w-16 text-gray-400 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-slate-400 text-lg mb-4">No users found</p>
          <button type="button" onClick={() => handleOpenModal(null)} className="btn btn-primary">
            Add Your First User
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-200 bg-gray-50 dark:border-white/[0.08] dark:bg-dark-800/50">
                <tr>
                  <th className="px-6 py-3 text-sm font-semibold">Name</th>
                  <th className="px-6 py-3 text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-sm font-semibold">Role</th>
                  <th className="px-6 py-3 text-sm font-semibold">Joined</th>
                  <th className="px-6 py-3 text-sm font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 dark:border-white/[0.08]">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {user.name}
                      {isSelf(user) && (
                        <span className="ml-2 text-xs font-normal text-primary-500">(you)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">{user.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          user.role === 'ADMIN'
                            ? 'bg-[#D5A527]/15 text-[#D5A527]'
                            : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenModal(user)}
                          className="btn btn-secondary flex items-center space-x-1"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUserToDelete(user)}
                          disabled={isSelf(user)}
                          title={isSelf(user) ? 'You cannot delete your own account' : 'Delete user'}
                          className="btn btn-danger flex items-center space-x-1 disabled:cursor-not-allowed disabled:opacity-40"
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
