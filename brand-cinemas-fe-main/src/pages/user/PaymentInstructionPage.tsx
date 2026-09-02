import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Copy,
  ExternalLink,
  QrCode,
  RefreshCcw,
  Store,
  Wallet,
} from 'lucide-react';
import toast from 'react-hot-toast';
import BookingProgress from '@/components/BookingProgress';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MIDTRANS_PAYMENT_METHODS } from '@/constants/midtransPaymentMethods';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/services/apiClient';
import { paymentService } from '@/services/paymentService';
import { bookingService } from '@/services/bookingService';
import { concessionService } from '@/services/concessionService';
import type { ConcessionItem } from '@/types/concession';
import type { PaymentInstruction } from '@/types/payment';
import {
  calculateConcessionTotal,
  getConcessionCart,
  getConcessionCartDetails,
  clearConcessionCart,
} from '@/utils/concessionCart';
import { syncPaymentAndGetRoute } from '@/utils/payment';
import {
  cachePaymentInstruction,
  clearCachedPaymentInstruction,
  isValidPaymentInstruction,
  resolvePaymentInstructionSeed,
} from '@/utils/paymentInstructionStorage';

const POLL_INTERVAL_MS = 5000;

function getMethodLabel(paymentMethod: string) {
  return MIDTRANS_PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label ?? paymentMethod;
}

function formatCurrency(amount: number) {
  return `IDR ${amount.toLocaleString('id-ID')}`;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} disalin`);
    } catch {
      toast.error('Gagal menyalin');
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-dark-700 dark:bg-dark-900/50">
      <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-slate-400">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="font-mono text-lg font-semibold break-all">{value}</p>
        <button
          type="button"
          onClick={copy}
          className="btn btn-secondary shrink-0 p-2"
          aria-label={`Salin ${label}`}
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function PaymentCountdown({ expiresAt }: { expiresAt?: string }) {
  const [remaining, setRemaining] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) return;

    const tick = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('00:00');
        return;
      }
      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt || !remaining) return null;

  return (
    <div className="flex items-center justify-center gap-2 rounded-lg bg-[#D5A527]/10 px-4 py-3 text-sm text-[#D5A527]">
      <Clock className="h-4 w-4" />
      Bayar dalam <span className="font-mono font-semibold">{remaining}</span>
    </div>
  );
}

function InstructionContent({ instruction }: { instruction: PaymentInstruction }) {
  switch (instruction.instructionType) {
    case 'qris':
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <QrCode className="h-6 w-6 text-primary-500" />
            <div>
              <h2 className="text-xl font-bold">Scan QRIS</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Buka aplikasi e-wallet atau mobile banking, lalu scan kode QR di bawah.
              </p>
            </div>
          </div>
          <div className="mx-auto max-w-xs rounded-xl border border-gray-200 bg-white p-4 dark:border-dark-700">
            <img
              src={instruction.qrImageUrl}
              alt="QRIS payment code"
              className="mx-auto h-auto w-full"
            />
          </div>
        </div>
      );

    case 'virtual_account':
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Wallet className="h-6 w-6 text-primary-500" />
            <div>
              <h2 className="text-xl font-bold">Transfer Virtual Account</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Transfer tepat sesuai nominal ke rekening virtual berikut.
              </p>
            </div>
          </div>
          <CopyField label="Bank" value={instruction.bank.toUpperCase()} />
          {instruction.vaNumber && <CopyField label="Nomor Virtual Account" value={instruction.vaNumber} />}
          {instruction.companyCode && instruction.billKey && (
            <>
              <CopyField label="Kode Perusahaan (Mandiri)" value={instruction.companyCode} />
              <CopyField label="Bill Key" value={instruction.billKey} />
            </>
          )}
        </div>
      );

    case 'deeplink':
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <ExternalLink className="h-6 w-6 text-primary-500" />
            <div>
              <h2 className="text-xl font-bold">Bayar via Aplikasi</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Lanjutkan pembayaran di aplikasi e-wallet Anda.
              </p>
            </div>
          </div>
          {instruction.qrImageUrl && (
            <div className="mx-auto max-w-xs rounded-xl border border-gray-200 bg-white p-4 dark:border-dark-700">
              <img src={instruction.qrImageUrl} alt="QR payment code" className="mx-auto w-full" />
            </div>
          )}
          <a
            href={instruction.deeplinkUrl}
            className="btn btn-primary flex w-full items-center justify-center gap-2 py-3"
          >
            <ExternalLink className="h-4 w-4" />
            Buka Aplikasi Pembayaran
          </a>
        </div>
      );

    case 'retail':
      return (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Store className="h-6 w-6 text-primary-500" />
            <div>
              <h2 className="text-xl font-bold">Bayar di {instruction.store}</h2>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Tunjukkan kode pembayaran ini ke kasir {instruction.store}.
              </p>
            </div>
          </div>
          <CopyField label="Kode Pembayaran" value={instruction.paymentCode} />
        </div>
      );

    default:
      return null;
  }
}

export default function PaymentInstructionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [instruction, setInstruction] = useState<PaymentInstruction | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [concessions, setConcessions] = useState<ConcessionItem[]>([]);
  const pollingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const concessionLines = useMemo(() => (id ? getConcessionCart(id) : []), [id, instruction]);
  const concessionDetails = useMemo(
    () => getConcessionCartDetails(concessionLines, concessions),
    [concessionLines, concessions],
  );
  const concessionTotal = useMemo(
    () => calculateConcessionTotal(concessionLines, concessions),
    [concessionLines, concessions],
  );
  const ticketTotal = useMemo(
    () => Math.max(0, (instruction?.grossAmount ?? 0) - concessionTotal),
    [instruction?.grossAmount, concessionTotal],
  );

  useEffect(() => {
    if (!id) return;
    concessionService.getConcessions().then(setConcessions).catch(() => setConcessions([]));
  }, [id]);

  const redirectByStatus = async () => {
    if (!id) return;
    const route = await syncPaymentAndGetRoute(id);
    if (route === 'success') {
      clearCachedPaymentInstruction(id);
      if (intervalRef.current) clearInterval(intervalRef.current);
      navigate(`/bookings/${id}/success`, { replace: true });
    } else if (route === 'failed') {
      clearCachedPaymentInstruction(id);
      if (intervalRef.current) clearInterval(intervalRef.current);
      navigate(`/bookings/${id}/failed`, { replace: true });
    }
  };

  const checkStatus = async (manual = false) => {
    if (!id || pollingRef.current) return;
    pollingRef.current = true;
    if (manual) setChecking(true);

    try {
      await redirectByStatus();
    } catch {
      if (manual) toast.error('Gagal memeriksa status pembayaran');
    } finally {
      pollingRef.current = false;
      if (manual) setChecking(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!id) return;
    setChecking(true);
    try {
      await bookingService.processPayment(id, 'SUCCESS');
      clearConcessionCart(id);
      clearCachedPaymentInstruction(id);
      bookingService.setConfirmedBookingId(id);
      if (intervalRef.current) clearInterval(intervalRef.current);
      toast.success('Pembayaran berhasil dikonfirmasi!');
      navigate(`/bookings/${id}/success`, { replace: true });
    } catch {
      toast.error('Gagal simulasi pembayaran');
      setChecking(false);
    }
  };

  const startPolling = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      if (!pollingRef.current) checkStatus();
    }, POLL_INTERVAL_MS);
  };

  useEffect(() => {
    if (!id) {
      navigate('/my-bookings', { replace: true });
      return;
    }

    if (!user) {
      navigate('/login', { state: { from: { pathname: `/bookings/${id}/pay/instruction` } } });
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    const seed = resolvePaymentInstructionSeed(id, location.state);
    setInstruction(seed);

    const init = async () => {
      let resolved: PaymentInstruction | null = seed;

      try {
        const data = await paymentService.getPaymentInstruction(id);
        if (cancelled) return;

        if (!isValidPaymentInstruction(data)) {
          throw new ApiError(502, 'Data instruksi pembayaran tidak valid');
        }

        resolved = data;
        cachePaymentInstruction(id, data);
        setInstruction(data);
      } catch (err) {
        if (cancelled) return;

        if (err instanceof ApiError && err.status === 404) {
          if (seed) {
            resolved = seed;
            setInstruction(seed);
          } else {
            navigate(`/bookings/${id}/pay`, { replace: true });
            return;
          }
        } else if (seed) {
          resolved = seed;
          setInstruction(seed);
        } else {
          setLoadError(
            err instanceof ApiError ? err.message : 'Gagal memuat instruksi pembayaran',
          );
          return;
        }
      } finally {
        if (!cancelled) setLoading(false);
      }

      if (cancelled || !resolved) {
        if (!cancelled && !resolved) {
          setLoadError('Instruksi pembayaran tidak tersedia.');
        }
        return;
      }

      try {
        await redirectByStatus();
      } catch {
        // Status check can fail temporarily; keep showing instruction and poll.
      }

      if (!cancelled) startPolling();
    };

    init();

    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [id, user?.id, location.key]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (loadError || !instruction) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50 px-4 dark:bg-dark-900">
        <p className="text-center text-gray-600 dark:text-slate-300">
          {loadError ?? 'Instruksi pembayaran tidak tersedia.'}
        </p>
        <Link to={`/bookings/${id}/pay`} className="btn btn-primary">
          Kembali ke Pembayaran
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-dark-950 dark:text-white">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-dark-950/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to={`/bookings/${id}/pay`} className="btn btn-secondary flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4" />
            <span>Ganti Metode</span>
          </Link>
          <BookingProgress currentStep="payment" />
          <div />
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <div className="cinema-panel p-6">
          <p className="section-eyebrow mb-2">Pembayaran</p>
          <h1 className="text-2xl font-display font-bold mb-1">{getMethodLabel(instruction.paymentMethod)}</h1>
          <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">
            Selesaikan pembayaran sebelum waktu habis.
          </p>

          <PaymentCountdown expiresAt={instruction.expiresAt} />

          <div className="my-6 space-y-3 rounded-lg border border-gray-200 p-4 dark:border-dark-700">
            {concessionDetails.length > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-slate-400">Tiket</span>
                  <span>{formatCurrency(ticketTotal)}</span>
                </div>
                <div className="space-y-1 border-b border-gray-200 pb-3 dark:border-dark-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">Makanan & minuman</span>
                    <span>{formatCurrency(concessionTotal)}</span>
                  </div>
                  {concessionDetails.map((item) => (
                    <div key={item.id} className="flex justify-between text-xs text-gray-500 dark:text-slate-400">
                      <span>{item.quantity}x {item.name}</span>
                      <span>{formatCurrency(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-slate-400">Total</span>
              <span className="font-semibold">{formatCurrency(instruction.grossAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500 dark:text-slate-400">Order ID</span>
              <span className="font-mono">{instruction.orderId}</span>
            </div>
          </div>

          <InstructionContent instruction={instruction} />

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => checkStatus(true)}
              disabled={checking}
              className="btn btn-primary w-full flex items-center justify-center gap-2 py-3"
            >
              {checking ? <LoadingSpinner size="sm" /> : <RefreshCcw className="h-4 w-4" />}
              Cek Status Pembayaran
            </button>

            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={checking}
              className="w-full rounded-xl bg-black py-3 text-sm font-medium text-gray-400 hover:text-white transition-all disabled:opacity-50"
            >
              Simulasi Pembayaran Berhasil (Test Mode)
            </button>

            <p className="text-center text-xs text-gray-400 dark:text-slate-500">
              Status diperbarui otomatis setiap {POLL_INTERVAL_MS / 1000} detik
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
