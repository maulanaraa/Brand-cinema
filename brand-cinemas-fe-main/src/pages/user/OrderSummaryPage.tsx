import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Popcorn,
  RefreshCcw,
  ShoppingBag,
  Ticket,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { IBooking } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import BookingProgress from '@/components/BookingProgress';
import ConcessionItemCard from '@/components/concession/ConcessionItemCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CONCESSION_CATEGORIES } from '@/constants/concessionItems';
import { bookingService } from '@/services/bookingService';
import { concessionService } from '@/services/concessionService';
import type { ConcessionCartLine, ConcessionCategory, ConcessionItem } from '@/types/concession';
import {
  calculateConcessionTotal,
  clearConcessionCart,
  getConcessionCart,
  pruneConcessionCart,
  saveConcessionCart,
  toBookingConcessionLines,
} from '@/utils/concessionCart';

function formatIdr(amount: number) {
  return `IDR ${amount.toLocaleString('id-ID')}`;
}

type ConfirmMode = 'continue' | 'skip';

export default function OrderSummaryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<IBooking | null>(null);
  const [concessions, setConcessions] = useState<ConcessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConcessions, setLoadingConcessions] = useState(true);
  const [concessionError, setConcessionError] = useState('');
  const [cart, setCart] = useState<ConcessionCartLine[]>([]);
  const [continuing, setContinuing] = useState(false);
  const [confirmMode, setConfirmMode] = useState<ConfirmMode | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const loadConcessions = useCallback(async () => {
    setLoadingConcessions(true);
    setConcessionError('');
    try {
      const items = await concessionService.getConcessions();
      setConcessions(items);
      if (id) {
        setCart(pruneConcessionCart(id, items));
      }
    } catch {
      setConcessionError('Gagal memuat menu makanan & minuman.');
      toast.error('Gagal memuat menu F&B');
    } finally {
      setLoadingConcessions(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) {
      navigate('/my-bookings', { replace: true });
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: { pathname: `/bookings/${id}/summary` } } });
      return;
    }

    const init = async () => {
      try {
        const data = await bookingService.getBookingById(id, user);
        if (data.bookingStatus === 'CONFIRMED') {
          navigate(`/bookings/${id}/success`, { replace: true });
          return;
        }
        if (data.bookingStatus === 'CANCELLED') {
          navigate(`/bookings/${id}/failed`, { replace: true });
          return;
        }
        setBooking(data);
        setCart(getConcessionCart(id));
      } catch {
        navigate('/my-bookings', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    init();
    loadConcessions();
  }, [id, navigate, user, loadConcessions]);

  const concessionTotal = useMemo(
    () => calculateConcessionTotal(cart, concessions),
    [cart, concessions],
  );
  const ticketTotal = booking?.ticketTotal ?? booking?.total_amount ?? 0;
  const grandTotal = ticketTotal + concessionTotal;

  const cartLinesDetailed = useMemo(() => {
    const byId = new Map(concessions.map((item) => [item.id, item]));
    return cart
      .map((line) => {
        const item = byId.get(line.itemId);
        if (!item) return null;
        return {
          id: item.id,
          name: item.name,
          quantity: line.quantity,
          lineTotal: item.price * line.quantity,
        };
      })
      .filter((line): line is NonNullable<typeof line> => Boolean(line));
  }, [cart, concessions]);

  const confirmTicketTotal = ticketTotal;
  const confirmConcessionTotal = confirmMode === 'skip' ? 0 : concessionTotal;
  const confirmGrandTotal = confirmTicketTotal + confirmConcessionTotal;
  const confirmFnBLines = confirmMode === 'skip' ? [] : cartLinesDetailed;

  const getQty = (itemId: string) => cart.find((l) => l.itemId === itemId)?.quantity ?? 0;

  const updateQty = (itemId: string, delta: number) => {
    if (!id) return;
    setCart((prev) => {
      const current = prev.find((l) => l.itemId === itemId)?.quantity ?? 0;
      const nextQty = Math.max(0, Math.min(10, current + delta));
      const without = prev.filter((l) => l.itemId !== itemId);
      const next = nextQty === 0 ? without : [...without, { itemId, quantity: nextQty }];
      saveConcessionCart(id, next);
      return next;
    });
  };

  const openConfirm = (mode: ConfirmMode) => {
    if (continuing) return;
    setConfirmMode(mode);
    // Double rAF so the enter transition runs from the closed styles.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setModalVisible(true));
    });
  };

  const closeConfirm = () => {
    if (continuing) return;
    setModalVisible(false);
  };

  useEffect(() => {
    if (modalVisible || !confirmMode) return;
    const timer = window.setTimeout(() => setConfirmMode(null), 220);
    return () => window.clearTimeout(timer);
  }, [modalVisible, confirmMode]);

  useEffect(() => {
    if (!confirmMode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [confirmMode]);

  const handleContinue = async () => {
    if (!id || continuing) return;
    saveConcessionCart(id, cart);
    setContinuing(true);
    try {
      await bookingService.updateBookingConcessions(id, toBookingConcessionLines(cart));
      navigate(`/bookings/${id}/pay`);
    } catch {
      toast.error('Gagal menyimpan pesanan F&B. Coba lagi.');
      setContinuing(false);
    }
  };

  const handleSkipConcessions = async () => {
    if (!id || continuing) return;
    clearConcessionCart(id);
    setCart([]);
    setContinuing(true);
    try {
      await bookingService.updateBookingConcessions(id, []);
      navigate(`/bookings/${id}/pay`);
    } catch {
      toast.error('Gagal melanjutkan ke pembayaran. Coba lagi.');
      setContinuing(false);
    }
  };

  const handleConfirmPay = async () => {
    if (confirmMode === 'skip') {
      await handleSkipConcessions();
      return;
    }
    await handleContinue();
  };

  const groupedItems = useMemo(() => {
    const map = new Map<ConcessionCategory, ConcessionItem[]>();
    for (const item of concessions) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return (Object.keys(CONCESSION_CATEGORIES) as ConcessionCategory[])
      .map((category) => ({
        category,
        ...CONCESSION_CATEGORIES[category],
        items: map.get(category) ?? [],
      }))
      .filter((group) => group.items.length > 0);
  }, [concessions]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!booking) return null;

  const showtime = booking.showtime;
  const movie = showtime.movie;

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-dark-950 dark:text-white">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-dark-950/95">
        <div className="relative mx-auto flex max-w-7xl items-center px-4 py-3 sm:px-6 lg:px-8">
          <Link
            to={`/booking/${showtime._id}`}
            className="btn btn-secondary relative z-10 flex shrink-0 items-center gap-2 px-3 py-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Kembali</span>
          </Link>
          <div className="pointer-events-none absolute inset-x-4 flex justify-center sm:inset-x-6 lg:inset-x-8">
            <BookingProgress currentStep="summary" />
          </div>
          <div className="ml-auto w-[4.75rem] shrink-0 sm:w-16" aria-hidden />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 sm:mb-8">
          <p className="section-eyebrow mb-1">Checkout</p>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Order Summary</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400 sm:text-base">
            Tinjau tiket Anda dan tambahkan makanan & minuman sebelum pembayaran.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:gap-8">
          <div className="space-y-6">
            <section className="cinema-panel p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-primary-500" />
                <h2 className="text-lg font-bold sm:text-xl">Ringkasan Tiket</h2>
              </div>
              <div className="flex gap-3 sm:gap-4">
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="h-28 w-20 shrink-0 rounded-lg object-cover sm:h-32 sm:w-24"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-2 text-lg font-semibold leading-tight">{movie.title}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                    {showtime.hall.hall_name}
                  </p>
                  <div className="mt-3 space-y-1 text-sm text-gray-600 dark:text-slate-300">
                    <p className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 shrink-0 text-[#D5A527]" />
                      {new Date(showtime.show_date).toLocaleDateString('id-ID', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-[#D5A527]" />
                      {showtime.start_time}
                    </p>
                    <p>
                      Kursi:{' '}
                      <span className="font-semibold">{booking.selected_seats.join(', ')}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 dark:border-dark-700">
                <span className="text-gray-500 dark:text-slate-400">
                  {booking.selected_seats.length} tiket
                </span>
                <span className="font-semibold">{formatIdr(ticketTotal)}</span>
              </div>
            </section>

            <section className="cinema-panel p-4 sm:p-6">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Popcorn className="h-5 w-5 shrink-0 text-[#D5A527]" />
                  <div>
                    <h2 className="text-lg font-bold sm:text-xl">Tawaran Makanan & Minuman</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">
                      Pilih item untuk ditambahkan ke pesanan
                    </p>
                  </div>
                </div>
                {concessionError && (
                  <button
                    type="button"
                    onClick={loadConcessions}
                    className="btn btn-secondary shrink-0 p-2"
                    aria-label="Muat ulang menu"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                )}
              </div>

              {loadingConcessions ? (
                <div className="flex justify-center py-10">
                  <LoadingSpinner size="md" />
                </div>
              ) : concessionError ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-600 dark:text-red-300">
                  {concessionError}
                </div>
              ) : groupedItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500 dark:text-slate-400">
                  Belum ada menu tersedia saat ini.
                </p>
              ) : (
                <div className="space-y-8">
                  {groupedItems.map((group) => (
                    <div key={group.category}>
                      <div className="mb-3">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-700 dark:text-slate-300">
                          {group.label}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{group.description}</p>
                      </div>
                      <div className="flex flex-col gap-3">
                        {group.items.map((item) => (
                          <ConcessionItemCard
                            key={item.id}
                            item={item}
                            quantity={getQty(item.id)}
                            onIncrease={() => updateQty(item.id, 1)}
                            onDecrease={() => updateQty(item.id, -1)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="cinema-panel p-4 sm:p-6">
              <div className="mb-4 flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-primary-500" />
                <h2 className="text-lg font-bold">Total Pesanan</h2>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Tiket</span>
                  <span>{formatIdr(ticketTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Makanan & minuman</span>
                  <span>{formatIdr(concessionTotal)}</span>
                </div>
                {booking.bookingNumber && (
                  <p className="break-all pt-1 font-mono text-xs text-gray-500 dark:text-slate-400">
                    {booking.bookingNumber}
                  </p>
                )}
              </div>

              <div className="mt-4 flex justify-between border-t border-gray-200 pt-4 text-lg font-bold dark:border-dark-700">
                <span>Total</span>
                <span className="text-accent-600 dark:text-accent-300">{formatIdr(grandTotal)}</span>
              </div>

              <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                Total pembayaran akan mencakup tiket dan makanan & minuman yang dipilih.
              </p>

              <button
                type="button"
                onClick={() => openConfirm('continue')}
                disabled={continuing}
                className="btn btn-primary mt-4 w-full py-3 text-base disabled:opacity-60"
              >
                Lanjut ke Pembayaran
              </button>
              <button
                type="button"
                onClick={() => openConfirm('skip')}
                disabled={continuing}
                className="btn btn-secondary mt-2 w-full py-2.5 text-sm disabled:opacity-60"
              >
                Lewati, bayar tiket saja
              </button>
            </div>
          </aside>
        </div>
      </main>

      {confirmMode && (
        <div
          className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-opacity duration-200 ease-out ${
            modalVisible
              ? 'opacity-100'
              : 'pointer-events-none opacity-0'
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="order-confirm-title"
          onClick={closeConfirm}
        >
          <div
            className={`absolute inset-0 bg-gray-900/50 dark:bg-dark-900/80 transition-opacity duration-200 ease-out ${
              modalVisible ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden
          />
          <div
            className={`card relative z-10 w-full max-w-lg p-6 transition-all duration-200 ease-out ${
              modalVisible
                ? 'translate-y-0 scale-100 opacity-100'
                : 'translate-y-3 scale-[0.97] opacity-0'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeConfirm}
              disabled={continuing}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 disabled:opacity-50 dark:hover:text-gray-300"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 id="order-confirm-title" className="pr-8 text-xl font-bold">
              Konfirmasi Pesanan
            </h2>
            <p className="mt-1 mb-5 text-sm text-gray-500 dark:text-slate-400">
              {confirmMode === 'skip'
                ? 'Anda akan melanjutkan pembayaran tiket saja (tanpa F&B).'
                : 'Periksa kembali detail pesanan sebelum lanjut ke pembayaran.'}
            </p>

            <div className="mb-4 flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-dark-800/50">
              <img
                src={movie.poster_url}
                alt={movie.title}
                className="h-16 w-12 rounded object-cover"
              />
              <div className="min-w-0">
                <p className="truncate font-semibold">{movie.title}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400">
                  {showtime.hall.hall_name}
                </p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-dark-800/50">
                <p className="text-xs text-gray-500 dark:text-slate-400">Tanggal</p>
                <p className="font-medium">
                  {new Date(showtime.show_date).toLocaleDateString('id-ID', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 dark:bg-dark-800/50">
                <p className="text-xs text-gray-500 dark:text-slate-400">Jam</p>
                <p className="font-medium">{showtime.start_time}</p>
              </div>
              <div className="col-span-2 rounded-lg bg-gray-50 p-3 dark:bg-dark-800/50">
                <p className="text-xs text-gray-500 dark:text-slate-400">Kursi</p>
                <p className="font-medium">{booking.selected_seats.join(', ')}</p>
              </div>
            </div>

            <div className="space-y-2 border-t border-gray-200 pt-3 text-sm dark:border-dark-700">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-slate-400">
                  Tiket ({booking.selected_seats.length})
                </span>
                <span className="font-medium">{formatIdr(confirmTicketTotal)}</span>
              </div>

              {confirmFnBLines.length > 0 ? (
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    Makanan & minuman
                  </p>
                  {confirmFnBLines.map((line) => (
                    <div key={line.id} className="flex justify-between">
                      <span className="text-gray-500 dark:text-slate-400">
                        {line.name} ×{line.quantity}
                      </span>
                      <span className="font-medium">{formatIdr(line.lineTotal)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-slate-400">Makanan & minuman</span>
                  <span className="font-medium">{formatIdr(0)}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg border border-primary-500/20 bg-primary-500/10 p-3">
              <span className="font-semibold">Total pembayaran</span>
              <span className="text-lg font-bold text-accent-600 dark:text-accent-300">
                {formatIdr(confirmGrandTotal)}
              </span>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={continuing}
                className="btn btn-secondary disabled:opacity-60"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={handleConfirmPay}
                disabled={continuing}
                className="btn btn-primary min-w-[9rem] disabled:opacity-60"
              >
                {continuing ? <LoadingSpinner size="sm" /> : 'Konfirmasi & Bayar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
