import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, Ticket, ArrowLeft, User, Mail } from 'lucide-react';
import { IBooking } from '@/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { bookingService } from '@/services/bookingService';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AdminBookingDetailsPage() {
  const { t } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<IBooking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchBookingDetails(id);
    }
  }, [id]);

  const fetchBookingDetails = async (bookingId: string) => {
    try {
      const data = await bookingService.getAdminBookingById(bookingId);
      setBooking(data);
    } catch (error) {
      toast.error('Could not load booking details.');
      console.error(error);
      navigate('/admin/bookings');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold">{t('bookingNotFound')}</h1>
        <Link to="/admin/bookings" className="btn btn-primary mt-4">
          Back to Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/admin/bookings" className="btn btn-secondary flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Bookings</span>
        </Link>
        <h1 className="text-3xl font-display font-bold">{t('bookingDetails')}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 card p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{booking.showtime?.movie?.title}</h2>
            <div className="grid grid-cols-2 gap-4">
                <InfoItem icon={Ticket} label="Booking ID" value={`#${booking._id.slice(-6)}`} />
                <InfoItem icon={MapPin} label="Hall" value={booking.showtime?.hall?.hall_name} />
                <InfoItem icon={Calendar} label="Date" value={new Date(booking.showtime?.show_date).toLocaleDateString()} />
                <InfoItem icon={Clock} label="Time" value={booking.showtime?.start_time} />
                <InfoItem icon={Users} label="Seats" value={booking.selected_seats?.join(', ')} />
                <InfoItem icon={Ticket} label="Total Tickets" value={booking.total_seats.toString()} />
            </div>

            {booking.order_items && booking.order_items.length > 0 && (
                <div className="border-t border-gray-200 dark:border-white/[0.08] pt-4">
                    <p className="text-sm text-gray-500 dark:text-neutral-400 mb-2">Snacks Ordered</p>
                    <ul className="space-y-2">
                        {booking.order_items.map((item, index) => (
                            <li key={index} className="flex justify-between items-center text-sm">
                                <span>{item.foodItem.name} x{item.quantity}</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    IDR {(item.foodItem.price * item.quantity).toLocaleString()}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

             <div className="border-t border-gray-200 dark:border-white/[0.08] pt-4">
                <p className="text-sm text-gray-500 dark:text-slate-400">Total Amount</p>
                <p className="text-2xl font-bold text-primary-500 dark:text-primary-400">IDR {booking.total_amount.toLocaleString()}</p>
            </div>
        </div>
        <div className="card p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('customerInfo')}</h2>
            <InfoItem icon={User} label="Name" value={booking.user.fullName} />
            <InfoItem icon={Mail} label="Email" value={booking.user.email} />
            <div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">Status</p>
                <span className={`status-badge status-${booking.status}`}>{booking.status}</span>
            </div>
        </div>
      </div>
    </div>
  );
}

const InfoItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | undefined }) => (
    <div>
        <p className="text-sm text-gray-500 dark:text-slate-400 flex items-center space-x-2 mb-1">
            <Icon className="h-4 w-4" />
            <span>{label}</span>
        </p>
        <p className="font-semibold text-gray-900 dark:text-white">{value || 'N/A'}</p>
    </div>
)
