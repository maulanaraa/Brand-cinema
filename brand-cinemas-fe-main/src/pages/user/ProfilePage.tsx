import { Calendar, LogOut, Mail, Settings, Shield, Ticket, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { bookingService } from '@/services/bookingService';
import type { IBooking } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, isAdmin, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;
      try {
        setBookings(await bookingService.getMyBookings(user.id));
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t('signedOut'));
      navigate('/');
    } catch {
      toast.error(t('signOutError'));
    }
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed').length;
  const roleLabel = user.role === 'admin' ? t('roleAdmin') : t('roleUser');

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-display font-bold mb-8">{t('profile')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card p-6 lg:col-span-1 text-center">
            <div className="w-24 h-24 rounded-full bg-[#D5A527]/20 mx-auto mb-4 flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-[#D5A527]" />
              )}
            </div>
            <h2 className="text-xl font-semibold">{user.fullName}</h2>
            <p className="text-gray-500 dark:text-slate-400">{user.email}</p>
            <span className="status-badge mt-4 bg-[#D5A527]/15 text-[#D5A527]">{roleLabel}</span>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">{t('accountInformation')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-[#D5A527]" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{t('emailAddress')}</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-[#D5A527]" />
                  <div>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{t('role')}</p>
                    <p className="font-medium">{roleLabel}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">{t('bookingSummary')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{t('totalBookings')}</p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{t('confirmed')}</p>
                  <p className="text-2xl font-bold text-[#D5A527]">{confirmedBookings}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{t('cancelled')}</p>
                  <p className="text-2xl font-bold text-red-500 dark:text-red-400">
                    {bookings.filter((booking) => booking.status === 'cancelled').length}
                  </p>
                </div>
              </div>
              <Link
                to="/my-bookings"
                className="btn mt-6 flex w-fit items-center space-x-2 bg-[#D5A527] text-dark-950 shadow-md shadow-[#D5A527]/25 hover:brightness-110 focus:ring-[#D5A527]"
              >
                <Ticket className="h-4 w-4" />
                <span>{t('viewMyBookings')}</span>
              </Link>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">{t('accountActions')}</h2>
              <div className="flex flex-col sm:flex-row gap-3">
                {isAdmin && (
                  <Link to="/admin" className="btn btn-secondary flex items-center justify-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span>{t('adminDashboard')}</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="btn btn-danger flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t('signOut')}</span>
                </button>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center space-x-3 text-gray-600 dark:text-slate-300">
                <Calendar className="h-5 w-5 shrink-0 text-[#D5A527]" />
                <p>{t('manageBookingsHint')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
