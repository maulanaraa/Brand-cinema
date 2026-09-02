import { useEffect, useMemo, useState } from 'react';

import { useNavigate, useParams } from 'react-router-dom';

import { ArrowLeft, Check, ShieldCheck } from 'lucide-react';

import { IMovie, IShowtime } from '@/types';

import { useAuth } from '@/contexts/AuthContext';

import LoadingSpinner from '@/components/LoadingSpinner';

import toast from 'react-hot-toast';

import BookingProgress from '@/components/BookingProgress';

import { bookingService } from '@/services/bookingService';

import { paymentService } from '@/services/paymentService';
import { concessionService } from '@/services/concessionService';

import { ApiError } from '@/services/apiClient';

import {

  getPaymentMethodsByCategory,

  getPaymentMethodsByCategoryFromList,

  getPaymentMethodsForIds,

  MIDTRANS_PAYMENT_METHODS,

  type MidtransPaymentType,

} from '@/constants/midtransPaymentMethods';

import type { ConcessionItem } from '@/types/concession';
import type { PaymentMethodOption, PaymentInstruction } from '@/types/payment';
import { syncPaymentAndGetRoute } from '@/utils/payment';
import { handlePaymentApiError } from '@/utils/paymentErrors';
import { cachePaymentInstruction, isValidPaymentInstruction } from '@/utils/paymentInstructionStorage';
import {
  calculateConcessionTotal,
  getConcessionCart,
  getConcessionCartDetails,
  pruneConcessionCart,
  clearConcessionCart,
  toBookingConcessionLines,
} from '@/utils/concessionCart';
import { clearCachedPaymentInstruction } from '@/utils/paymentInstructionStorage';

import { openSnapPayment } from '@/utils/snapPayment';
import CreditCardForm, { type CardFormData } from '@/components/payment/CreditCardForm';
import Card3dsModal from '@/components/payment/Card3dsModal';
import {
  authenticateCard3ds,
  getCardToken,
  loadMidtransCard3ds,
  MidtransCardError,
} from '@/utils/midtransCard';



export default function PaymentPage() {

  const { id: routeBookingId } = useParams<{ id: string }>();

  const navigate = useNavigate();

  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  const [paying, setPaying] = useState(false);

  const [error, setError] = useState('');
  const [threeDsUrl, setThreeDsUrl] = useState<string | null>(null);

  const [selectedMethod, setSelectedMethod] = useState<MidtransPaymentType | null>(null);

  const [bookingId, setBookingId] = useState<string | null>(null);

  const [bookingData, setBookingData] = useState<{

    movie: IMovie;

    showtime: IShowtime;

    selectedSeats: string[];

    totalPrice: number;

    bookingNumber?: string;

  } | null>(null);

  const [enabledMethodIds, setEnabledMethodIds] = useState<string[] | null>(null);
  const [concessions, setConcessions] = useState<ConcessionItem[]>([]);

  const concessionLines = useMemo(
    () => (bookingId ? getConcessionCart(bookingId) : []),
    [bookingId, loading, concessions],
  );
  const concessionDetails = useMemo(
    () => getConcessionCartDetails(concessionLines, concessions),
    [concessionLines, concessions],
  );
  const concessionTotal = useMemo(
    () => calculateConcessionTotal(concessionLines, concessions),
    [concessionLines, concessions],
  );

  useEffect(() => {
    if (!bookingId) return;
    concessionService
      .getConcessions()
      .then((items) => {
        setConcessions(items);
        pruneConcessionCart(bookingId, items);
      })
      .catch(() => setConcessions([]));
  }, [bookingId]);

  const paymentMethodGroups = useMemo(() => {
    if (!enabledMethodIds) return getPaymentMethodsByCategory();

    const methods = getPaymentMethodsForIds(enabledMethodIds);

    return getPaymentMethodsByCategoryFromList(methods);

  }, [enabledMethodIds]);



  useEffect(() => {

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    initPage();

  }, [routeBookingId]);



  const loadEnabledMethods = async () => {

    try {

      const methods = await paymentService.getPaymentMethods();

      const ids = methods
        .filter((m: PaymentMethodOption) => m.enabled)
        .map((m: PaymentMethodOption) => m.id);

      if (ids.length > 0) {

        setEnabledMethodIds(ids);

        return;

      }

    } catch {

      // fallback to local list

    }

    setEnabledMethodIds(MIDTRANS_PAYMENT_METHODS.map((m) => m.id));

  };



  const initPage = async () => {

    if (!user) {

      const returnPath = routeBookingId ? `/bookings/${routeBookingId}/pay` : '/payment';

      navigate('/login', { state: { from: { pathname: returnPath } } });

      return;

    }



    try {

      await loadEnabledMethods();



      if (routeBookingId) {

        await loadBookingForPayment(routeBookingId);

        return;

      }



      await initFromSessionStorage();

    } catch (err) {

      console.error('Error initializing payment:', err);

      if (err instanceof ApiError) {

        setError(err.message);

      } else {

        toast.error('Failed to prepare payment');

        navigate('/movies');

      }

    } finally {

      setLoading(false);

    }

  };



  const loadBookingForPayment = async (id: string) => {

    const booking = await bookingService.getBookingById(id, user ?? undefined);



    if (booking.bookingStatus === 'CONFIRMED') {

      navigate(`/bookings/${id}/success`, { replace: true });

      return;

    }



    if (booking.bookingStatus === 'CANCELLED') {

      navigate(`/bookings/${id}/failed`, { replace: true });

      return;

    }



    bookingService.setPendingBookingId(id);

    setBookingId(id);

    const catalog = await concessionService.getConcessions().catch(() => [] as ConcessionItem[]);
    setConcessions(catalog);
    const cartLines = pruneConcessionCart(id, catalog);
    const localConcessionTotal = calculateConcessionTotal(cartLines, catalog);
    const apiConcessionTotal = booking.concessionTotal ?? 0;
    const ticketTotal =
      booking.ticketTotal ??
      Math.max(0, booking.total_amount - apiConcessionTotal);
    const expectedTotal = ticketTotal + localConcessionTotal;

    setBookingData({

      movie: booking.showtime.movie,

      showtime: booking.showtime,

      selectedSeats: booking.selected_seats,

      totalPrice: ticketTotal,

      bookingNumber: booking.bookingNumber,

    });



    try {

      const instruction = await paymentService.getPaymentInstruction(id);

      if (Math.abs(instruction.grossAmount - expectedTotal) < 1) {
        goToInstructionPage(id, instruction);
        return;
      }

      clearCachedPaymentInstruction(id);

    } catch (err) {

      if (!(err instanceof ApiError) || err.status !== 404) {

        throw err;

      }

    }

  };



  const initFromSessionStorage = async () => {

    const selectionData = sessionStorage.getItem('seatSelection');

    if (!selectionData) {

      toast.error('No booking data found');

      navigate('/movies');

      return;

    }



    const selection = JSON.parse(selectionData) as {

      showtimeId: string;

      selectedSeats: string[];

    };



    const created = await bookingService.createBooking({

      showtimeId: selection.showtimeId,

      selectedSeats: selection.selectedSeats,

    });



    sessionStorage.removeItem('seatSelection');

    navigate(`/bookings/${created._id}/summary`, { replace: true });

  };



  const goToInstructionPage = (bookingId: string, instruction: PaymentInstruction) => {
    cachePaymentInstruction(bookingId, instruction);
    navigate(`/bookings/${bookingId}/pay/instruction`, {
      state: { instruction },
      replace: true,
    });
  };

  const handlePaymentResult = async () => {
    if (!bookingId) return;

    try {
      const route = await syncPaymentAndGetRoute(bookingId);

      sessionStorage.removeItem('seatSelection');

      bookingService.clearPendingBookingId();

      if (route === 'success') {
        bookingService.setConfirmedBookingId(bookingId);
        clearConcessionCart(bookingId);

        navigate(`/bookings/${bookingId}/success`, { replace: true });

        return;
      }

      if (route === 'failed') {
        navigate(`/bookings/${bookingId}/failed`, { replace: true });

        return;
      }

      navigate(`/bookings/${bookingId}/pending`, { replace: true });
    } catch {
      navigate(`/bookings/${bookingId}/pending`, { replace: true });
    }
  };

  const syncConcessionsBeforePay = async () => {
    if (!bookingId) return;
    clearCachedPaymentInstruction(bookingId);
    await bookingService.updateBookingConcessions(
      bookingId,
      toBookingConcessionLines(concessionLines),
    );
  };

  const buildChargeBody = (paymentMethod: MidtransPaymentType, tokenId?: string) => ({
    paymentMethod,
    tokenId,
    concessions: concessionLines.length > 0 ? toBookingConcessionLines(concessionLines) : undefined,
  });

  const handleCardPay = async (cardData: CardFormData) => {
    if (!bookingId || !bookingData) return;

    setPaying(true);
    setError('');

    try {
      await loadMidtransCard3ds();
      const tokenId = await getCardToken(cardData);

      await syncConcessionsBeforePay();

      const instruction = await paymentService.chargePayment(
        bookingId,
        buildChargeBody('credit_card', tokenId),
      );

      if (instruction.instructionType === 'snap') {
        await openSnapPayment(instruction, 'credit_card', {
          onSuccess: () => handlePaymentResult(),
          onPending: () => handlePaymentResult(),
          onError: async () => {
            await handlePaymentResult();
            setError('Payment failed. Please try again.');
            setPaying(false);
          },
          onClose: async () => {
            await handlePaymentResult();
            setPaying(false);
          },
        });
        return;
      }

      if (instruction.instructionType === 'card' && instruction.redirectUrl) {
        const result = await authenticateCard3ds(instruction.redirectUrl, setThreeDsUrl);
        setThreeDsUrl(null);
        await handlePaymentResult();

        if (result === 'failure') {
          setError('Verifikasi kartu gagal. Silakan coba lagi.');
        }
        setPaying(false);
        return;
      }

      await handlePaymentResult();
    } catch (err) {
      if (err instanceof MidtransCardError) {
        const detail = err.validationMessages.length > 0 ? `: ${err.validationMessages.join(' ')}` : '';
        setError(`${err.message}${detail}`);
      } else {
        handlePaymentApiError(err, bookingId, navigate, setError);
      }
      setPaying(false);
      setThreeDsUrl(null);
    }
  };

  const handlePay = async () => {
    if (!bookingId || !bookingData || !selectedMethod) return;
    if (selectedMethod === 'credit_card') return;



    setPaying(true);

    setError('');



    try {

      await syncConcessionsBeforePay();

      const instruction = await paymentService.chargePayment(
        bookingId,
        buildChargeBody(selectedMethod),
      );



      if (instruction.instructionType === 'snap') {

        await openSnapPayment(instruction, selectedMethod, {

          onSuccess: () => handlePaymentResult(),

          onPending: () => handlePaymentResult(),

          onError: async () => {

            await handlePaymentResult();

            setError('Payment failed. Please try again.');

            setPaying(false);

          },

          onClose: async () => {

            await handlePaymentResult();

            setPaying(false);

          },

        });

        return;

      }



      goToInstructionPage(bookingId, instruction);

    } catch (err) {
      handlePaymentApiError(err, bookingId, navigate, setError);
      setPaying(false);
    }

  };

  const handleDirectSimulationPay = async () => {
    if (!bookingId || !bookingData) return;
    setPaying(true);
    setError('');
    try {
      await syncConcessionsBeforePay();
      await bookingService.processPayment(bookingId, 'SUCCESS');
      clearConcessionCart(bookingId);
      clearCachedPaymentInstruction(bookingId);
      bookingService.setConfirmedBookingId(bookingId);
      toast.success('Pembayaran berhasil dikonfirmasi!');
      navigate(`/bookings/${bookingId}/success`, { replace: true });
    } catch {
      toast.error('Gagal memproses pembayaran simulasi');
      setPaying(false);
    }
  };



  if (loading || !bookingData) {

    return (

      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">

        <LoadingSpinner size="lg" />

      </div>

    );

  }



  const { movie, showtime, selectedSeats, totalPrice, bookingNumber } = bookingData;
  const displayTotal = totalPrice + concessionTotal;



  return (

    <div className="min-h-screen bg-white text-gray-900 dark:bg-dark-950 dark:text-white">

      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-dark-950/90">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">

          <button
            type="button"
            onClick={() =>
              bookingId ? navigate(`/bookings/${bookingId}/summary`) : navigate(-1)
            }
            className="btn btn-secondary flex items-center space-x-2"
          >

            <ArrowLeft className="h-4 w-4" />

            <span>Back</span>

          </button>

          <BookingProgress currentStep="payment" />

          <div />

        </div>

      </header>



      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">

          <p className="section-eyebrow mb-2">Checkout</p>

          <h1 className="text-3xl font-bold font-display">Complete Payment</h1>

          <p className="mt-2 text-gray-500 dark:text-slate-400">

            Pilih metode pembayaran, lalu lanjutkan ke halaman instruksi bayar Brand Cinemas.

          </p>

        </div>



        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.1fr_0.9fr]">

          <div className="cinema-panel p-6">

            <h2 className="text-2xl font-bold mb-2">Payment Method</h2>

            <p className="mb-6 text-sm text-gray-500 dark:text-slate-400">

              Pilih satu metode. Instruksi pembayaran (QR, VA, kode) ditampilkan di halaman kita.

            </p>



            <div className="space-y-6 mb-6">

              {paymentMethodGroups.map((group) => (

                <section key={group.category}>

                  <div className="mb-3">

                    <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-700 dark:text-slate-300">

                      {group.label}

                    </h3>

                    <p className="text-xs text-gray-500 dark:text-slate-400">{group.description}</p>

                  </div>

                  <div className="space-y-2">

                    {group.methods.map((method) => {

                      const isSelected = selectedMethod === method.id;

                      return (

                        <button

                          key={method.id}

                          type="button"

                          onClick={() => setSelectedMethod(method.id)}

                          disabled={paying}

                          className={[

                            'w-full rounded-lg border p-4 text-left transition-colors',

                            isSelected

                              ? 'border-primary-500 bg-primary-500/10 ring-1 ring-primary-500/40'

                              : 'border-gray-200 hover:border-primary-500/40 dark:border-dark-700 dark:hover:border-primary-500/40',

                          ].join(' ')}

                        >

                          <div className="flex items-center justify-between gap-3">

                            <div>

                              <p className="font-semibold">{method.label}</p>

                              <p className="mt-0.5 text-sm text-gray-500 dark:text-slate-400">

                                {method.description}

                              </p>

                            </div>

                            <span

                              className={[

                                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',

                                isSelected

                                  ? 'border-primary-500 bg-primary-500 text-white'

                                  : 'border-gray-300 dark:border-dark-600',

                              ].join(' ')}

                            >

                              {isSelected && <Check className="h-3 w-3" />}

                            </span>

                          </div>

                        </button>

                      );

                    })}

                  </div>

                </section>

              ))}

            </div>



            {selectedMethod === 'credit_card' ? (
              <CreditCardForm paying={paying} onSubmit={handleCardPay} />
            ) : null}

            {selectedMethod === 'credit_card' && error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400" role="alert">
                {error}
              </div>
            )}

            {selectedMethod !== 'credit_card' && error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400" role="alert">
                {error}
              </div>
            )}

            <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              Payment is processed securely by Midtrans.
            </div>
          </div>



          <div className="cinema-panel p-6">

            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>

            <div className="space-y-4">

              <div className="flex items-center gap-4">

                <img src={movie.poster_url} alt={movie.title} className="w-20 rounded-lg" />

                <div>

                  <h3 className="font-semibold text-lg">{movie.title}</h3>

                  <p className="text-sm text-gray-500 dark:text-slate-400">{showtime.hall.hall_name}</p>

                </div>

              </div>

              {bookingNumber && (

                <p className="text-sm text-gray-500 dark:text-slate-400">

                  Order ID: <span className="font-mono font-semibold text-gray-900 dark:text-white">{bookingNumber}</span>

                </p>

              )}

              <div className="border-t border-gray-200 pt-4 space-y-2 dark:border-dark-700">

                <div className="flex justify-between">

                  <span className="text-gray-500 dark:text-slate-400">Date</span>

                  <span>{new Date(showtime.show_date).toLocaleDateString()}</span>

                </div>

                <div className="flex justify-between">

                  <span className="text-gray-500 dark:text-slate-400">Time</span>

                  <span>{showtime.start_time}</span>

                </div>

                <div className="flex justify-between">

                  <span className="text-gray-500 dark:text-slate-400">Seats</span>

                  <span>{selectedSeats.join(', ')}</span>

                </div>

                {concessionDetails.length > 0 && (
                  <div className="border-t border-gray-200 pt-3 dark:border-dark-700">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">
                      Makanan & Minuman
                    </p>
                    <div className="space-y-1">
                      {concessionDetails.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-slate-300">
                            {item.quantity}x {item.name}
                          </span>
                          <span>IDR {item.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              <div className="border-t border-gray-200 pt-4 dark:border-dark-700">

                {concessionTotal > 0 && (
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-slate-400">Tiket</span>
                    <span>IDR {totalPrice.toLocaleString('id-ID')}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-xl">

                  <span>Total</span>

                  <span>IDR {displayTotal.toLocaleString('id-ID')}</span>

                </div>

                {concessionTotal > 0 && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-slate-400">
                    Total pembayaran mencakup tiket dan makanan & minuman yang dipilih.
                  </p>
                )}

              </div>

              {selectedMethod !== 'credit_card' && (
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={paying || !selectedMethod}
                  className="btn btn-primary w-full text-lg mt-4 py-3 disabled:opacity-50"
                >
                  {paying ? <LoadingSpinner size="sm" /> : 'Bayar Sekarang'}
                </button>
              )}

              <button
                type="button"
                onClick={handleDirectSimulationPay}
                disabled={paying}
                className="mt-2.5 w-full rounded-xl bg-black py-3 text-sm font-medium text-gray-400 hover:text-white transition-all disabled:opacity-50"
              >
                Bayar Instan (Mode Simulasi / Demo)
              </button>

              {!selectedMethod && (

                <p className="mt-2 text-center text-xs text-gray-500 dark:text-slate-400">

                  Pilih metode pembayaran terlebih dahulu

                </p>

              )}

            </div>

          </div>

        </div>

      </main>

      <Card3dsModal url={threeDsUrl} />
    </div>

  );

}


