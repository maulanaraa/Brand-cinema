import {
  ArrowUpDown,
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Film,
  Heart,
  LogOut,
  Mail,
  MapPin,
  Popcorn,
  Save,
  Settings,
  Shield,
  Sparkles,
  Ticket,
  User,
} from 'lucide-react';
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
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<IBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'profile' | 'preferences'>('stats');
  const [sortFilter, setSortFilter] = useState<'all' | 'confirmed' | 'recent'>('all');

  // Profile edit state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Preferences state
  const [favoriteCinema, setFavoriteCinema] = useState('CinemaID Grand Indonesia');
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>(['Horror', 'Action', 'Sci-Fi']);

  useEffect(() => {
    if (user) {
      setName(user.fullName || '');
    }
  }, [user]);

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;
      try {
        const data = await bookingService.getMyBookings(user.id);
        setBookings(data);
      } catch (err) {
        console.error('Failed to load bookings:', err);
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success(t('signedOut') || 'Berhasil keluar');
      navigate('/');
    } catch {
      toast.error(t('signOutError') || 'Gagal keluar');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      // Simulate save update
      await new Promise((resolve) => setTimeout(resolve, 600));
      toast.success('Profil berhasil diperbarui!');
    } catch {
      toast.error('Gagal memperbarui profil');
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setFavoriteGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Calculate metrics
  const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
  const totalTickets = bookings.reduce(
    (sum, b) => sum + (b.selected_seats?.length || b.total_seats || 1),
    0
  );
  const uniqueMoviesCount = new Set(
    confirmedBookings.map((b) => b.showtime?.movie?.title || b.showtime?.movie?._id).filter(Boolean)
  ).size;

  const lastBooking = bookings[0];
  const lastWatchDate = lastBooking
    ? new Date(lastBooking.showtime?.show_date || lastBooking.booking_date).toLocaleDateString(
        language === 'id' ? 'id-ID' : 'en-US',
        { day: 'numeric', month: 'short', year: 'numeric' }
      )
    : 'Belum ada';

  // Filter bookings for list
  const filteredBookings = bookings.filter((b) => {
    if (sortFilter === 'confirmed') return b.status === 'confirmed';
    return true;
  });

  const availableGenres = [
    'Action',
    'Horror',
    'Comedy',
    'Drama',
    'Sci-Fi',
    'Thriller',
    'Romance',
    'Animation',
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 py-10 dark:bg-dark-950 text-gray-900 dark:text-white transition-colors">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header Title */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-black tracking-tight">User Profile</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Kelola informasi akun, preferensi menonton, dan aktivitas tiket CinemaID Anda.
            </p>
          </div>
          {isAdmin && (
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-primary-500/15 px-4 py-2.5 text-sm font-semibold text-primary-600 dark:text-[#D5A527] transition hover:bg-primary-500/25"
            >
              <Settings className="h-4 w-4" />
              <span>Admin Panel</span>
            </Link>
          )}
        </div>

        {/* 2-Column Grid Layout matching reference */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[340px_1fr]">
          {/* LEFT COLUMN: Identity & Quick Stats Card */}
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl bg-white shadow-xl shadow-black/5 dark:bg-dark-900/90 dark:shadow-2xl dark:shadow-black/40">
              {/* Cover Banner with Cinema Gold Gradient */}
              <div className="relative h-28 w-full bg-gradient-to-r from-[#A67C2E]/40 via-[#D5A527]/25 to-dark-900 p-4">
                <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#D5A527] backdrop-blur-md">
                  <Sparkles className="h-3 w-3" />
                  Premiere Member
                </span>
              </div>

              {/* Profile Avatar & Info */}
              <div className="relative px-6 pb-6 pt-0">
                {/* Avatar overlapping banner */}
                <div className="-mt-12 mb-4 flex items-end justify-between">
                  <div className="relative h-20 w-20 rounded-full border-4 border-white bg-dark-950 p-0.5 shadow-xl dark:border-dark-900">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.fullName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-tr from-[#A67C2E] to-[#D5A527] text-2xl font-black text-dark-950">
                        {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </div>
                  <span className="mb-2 inline-flex items-center gap-1 rounded-md bg-[#D5A527]/15 px-2.5 py-1 text-xs font-bold text-[#D5A527]">
                    <Shield className="h-3.5 w-3.5" />
                    {user.role === 'admin' ? 'Administrator' : 'Cinema VIP'}
                  </span>
                </div>

                {/* Name & Email */}
                <div>
                  <h2 className="text-xl font-bold leading-tight text-gray-900 dark:text-white">
                    {user.fullName || 'Member CinemaID'}
                  </h2>
                  <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400 truncate">
                    {user.email}
                  </p>
                </div>

                {/* 2 Mini Cards (like 01 Events Created | 24 Events Attended in reference) */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 p-3.5 text-left dark:bg-dark-950/70">
                    <span className="block text-2xl font-black text-gray-900 dark:text-white">
                      {String(totalTickets).padStart(2, '0')}
                    </span>
                    <span className="mt-0.5 block text-xs font-medium text-gray-500 dark:text-slate-400">
                      Tiket Dipesan
                    </span>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3.5 text-left dark:bg-dark-950/70">
                    <span className="block text-2xl font-black text-[#D5A527]">
                      {String(uniqueMoviesCount).padStart(2, '0')}
                    </span>
                    <span className="mt-0.5 block text-xs font-medium text-gray-500 dark:text-slate-400">
                      Film Ditonton
                    </span>
                  </div>
                </div>

                {/* Account Action Buttons */}
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-500/20 dark:text-red-400"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('signOut') || 'Keluar Akun'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Navigation Tabs, 4 Metric Stats, and Activity List */}
          <div className="space-y-6">
            {/* Tab Navigation Header (matching reference layout) */}
            <div className="flex border-b border-gray-200 dark:border-white/[0.08] gap-8">
              <button
                type="button"
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-2 pb-3.5 text-sm font-bold transition-all relative ${
                  activeTab === 'stats'
                    ? 'text-gray-900 dark:text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#D5A527]'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Ticket className="h-4 w-4 text-[#D5A527]" />
                <span>My Movie Stats</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex items-center gap-2 pb-3.5 text-sm font-bold transition-all relative ${
                  activeTab === 'profile'
                    ? 'text-gray-900 dark:text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#D5A527]'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <User className="h-4 w-4 text-[#D5A527]" />
                <span>Profile Settings</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('preferences')}
                className={`flex items-center gap-2 pb-3.5 text-sm font-bold transition-all relative ${
                  activeTab === 'preferences'
                    ? 'text-gray-900 dark:text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#D5A527]'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Heart className="h-4 w-4 text-[#D5A527]" />
                <span>Preferences</span>
              </button>
            </div>

            {/* TAB 1: MOVIE STATS & TICKETS (Exact match to reference view) */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                {/* 4 Stat Cards in 2x2 Grid (like Sessions Attended, Attendance Rate, etc.) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Stat 1: Tiket Aktif */}
                  <div className="rounded-2xl bg-white p-5 shadow-lg shadow-black/5 dark:bg-dark-900/90 dark:shadow-2xl dark:shadow-black/30">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                      Tiket Siap Ditonton
                    </p>
                    <p className="mt-2 text-3xl font-black text-[#D5A527]">
                      {String(confirmedBookings.length).padStart(2, '0')}
                    </p>
                  </div>

                  {/* Stat 2: Total Riwayat Booking */}
                  <div className="rounded-2xl bg-white p-5 shadow-lg shadow-black/5 dark:bg-dark-900/90 dark:shadow-2xl dark:shadow-black/30">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                      Total Transaksi
                    </p>
                    <p className="mt-2 text-3xl font-black text-gray-900 dark:text-white">
                      {String(bookings.length).padStart(2, '0')}
                    </p>
                  </div>

                  {/* Stat 3: Bioskop Favorit */}
                  <div className="rounded-2xl bg-white p-5 shadow-lg shadow-black/5 dark:bg-dark-900/90 dark:shadow-2xl dark:shadow-black/30">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                      Bioskop Pilihan
                    </p>
                    <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white truncate">
                      {favoriteCinema}
                    </p>
                  </div>

                  {/* Stat 4: Terakhir Menonton */}
                  <div className="rounded-2xl bg-white p-5 shadow-lg shadow-black/5 dark:bg-dark-900/90 dark:shadow-2xl dark:shadow-black/30">
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-400">
                      Terakhir Menonton
                    </p>
                    <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
                      {lastWatchDate}
                    </p>
                  </div>
                </div>

                {/* Section Header with Filter / Sort (like "Created by You" & "Sort" in reference) */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Riwayat Tiket & Aktivitas
                  </h3>

                  <div className="flex items-center gap-2">
                    <div className="inline-flex rounded-xl bg-gray-100 p-1 dark:bg-dark-900">
                      <button
                        type="button"
                        onClick={() => setSortFilter('all')}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                          sortFilter === 'all'
                            ? 'bg-white shadow-sm dark:bg-dark-800 text-gray-900 dark:text-white'
                            : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                      >
                        Semua ({bookings.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSortFilter('confirmed')}
                        className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                          sortFilter === 'confirmed'
                            ? 'bg-white shadow-sm dark:bg-dark-800 text-[#D5A527]'
                            : 'text-gray-500 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white'
                        }`}
                      >
                        Aktif ({confirmedBookings.length})
                      </button>
                    </div>
                  </div>
                </div>

                {/* Vertical List of Ticket Cards (matching list in reference image) */}
                <div className="space-y-3">
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => {
                      const movie = booking.showtime?.movie;
                      const showDate = booking.showtime?.show_date
                        ? new Date(booking.showtime.show_date).toLocaleDateString(
                            language === 'id' ? 'id-ID' : 'en-US',
                            { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }
                          )
                        : new Date(booking.booking_date).toLocaleDateString();

                      const isConfirmed = booking.status === 'confirmed';

                      return (
                        <div
                          key={booking._id}
                          className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-md shadow-black/5 transition-all duration-300 hover:shadow-xl dark:bg-dark-900/90 dark:shadow-2xl dark:shadow-black/30 hover:scale-[1.01]"
                        >
                          {/* Left: Thumbnail & Info */}
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-200 dark:bg-dark-950 shadow-inner">
                              {movie?.poster_url ? (
                                <img
                                  src={movie.poster_url}
                                  alt={movie.title}
                                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-[#D5A527]/20 text-[#D5A527]">
                                  <Film className="h-6 w-6" />
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <h4 className="font-bold text-base text-gray-900 dark:text-white truncate group-hover:text-[#D5A527] transition-colors">
                                {movie?.title || 'Film CinemaID'}
                              </h4>
                              <p className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                                {showDate} • {booking.showtime?.start_time || '13:00'}
                              </p>
                              <p className="mt-1 text-xs text-gray-600 dark:text-slate-300 font-medium">
                                {booking.showtime?.studio || booking.showtime?.hall?.hall_name || 'Studio 1'} • Kursi:{' '}
                                <span className="font-bold text-gray-900 dark:text-white">
                                  {booking.selected_seats?.join(', ') || 'D9'}
                                </span>
                              </p>
                            </div>
                          </div>

                          {/* Right: Status & Action */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-white/[0.04]">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                                isConfirmed
                                  ? 'bg-[#D5A527]/15 text-[#D5A527]'
                                  : booking.status === 'cancelled'
                                  ? 'bg-red-500/15 text-red-500'
                                  : 'bg-yellow-500/15 text-yellow-500'
                              }`}
                            >
                              {booking.status}
                            </span>

                            <Link
                              to="/my-bookings"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 dark:text-[#D5A527] hover:underline"
                            >
                              <span>E-Tiket</span>
                              <ChevronRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl bg-white p-8 text-center shadow-md dark:bg-dark-900/90">
                      <Film className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-3" />
                      <p className="text-base font-semibold text-gray-700 dark:text-slate-300">
                        Belum ada tiket film ditemukan
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Pesan tiket film favorit Anda sekarang untuk menikmati pengalaman sinema terbaik.
                      </p>
                      <Link
                        to="/movies"
                        className="btn btn-primary mt-4 inline-flex items-center gap-2 text-sm"
                      >
                        <Ticket className="h-4 w-4" />
                        <span>Jelajahi Film</span>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: PROFILE SETTINGS */}
            {activeTab === 'profile' && (
              <div className="rounded-2xl bg-white p-6 shadow-xl shadow-black/5 dark:bg-dark-900/90 dark:shadow-2xl dark:shadow-black/40">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                  Informasi Akun
                </h3>
                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-dark-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D5A527] transition"
                      placeholder="Masukkan nama lengkap Anda"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full rounded-xl bg-gray-100 px-4 py-3 text-sm dark:bg-dark-950/50 text-gray-500 dark:text-slate-400 cursor-not-allowed"
                    />
                    <span className="mt-1 block text-xs text-gray-400">
                      Email akun tidak dapat diubah secara langsung.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1.5">
                      Nomor Telepon / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl bg-gray-50 px-4 py-3 text-sm dark:bg-dark-950 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D5A527] transition"
                      placeholder="Contoh: 081234567890"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="btn btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm"
                    >
                      <Save className="h-4 w-4" />
                      <span>{savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: CINEMA PREFERENCES */}
            {activeTab === 'preferences' && (
              <div className="rounded-2xl bg-white p-6 shadow-xl shadow-black/5 dark:bg-dark-900/90 dark:shadow-2xl dark:shadow-black/40 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Bioskop Favorit
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                    Lokasi bioskop default untuk menampilkan jadwal penayangan utama Anda.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
                    {['CinemaID Grand Indonesia', 'CinemaID Central Park', 'CinemaID Senayan City'].map(
                      (cinema) => (
                        <button
                          key={cinema}
                          type="button"
                          onClick={() => setFavoriteCinema(cinema)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition ${
                            favoriteCinema === cinema
                              ? 'bg-[#D5A527]/15 ring-2 ring-[#D5A527] text-gray-900 dark:text-white'
                              : 'bg-gray-50 dark:bg-dark-950/70 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-dark-800'
                          }`}
                        >
                          <MapPin className="h-4 w-4 text-[#D5A527] shrink-0" />
                          <span className="font-semibold text-sm">{cinema}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-white/[0.06]">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Genre Film Kesukaan
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-4">
                    Pilih genre favorit Anda untuk rekomendasi film yang lebih personal.
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {availableGenres.map((genre) => {
                      const isSelected = favoriteGenres.includes(genre);
                      return (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => toggleGenre(genre)}
                          className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                            isSelected
                              ? 'bg-[#D5A527] text-dark-950 shadow-md shadow-[#D5A527]/20'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-dark-950 dark:text-slate-300 dark:hover:bg-dark-800'
                          }`}
                        >
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
