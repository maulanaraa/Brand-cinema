import { CreditCard, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import LoadingSpinner from '@/components/LoadingSpinner';

export interface CardFormData {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  cardholderName: string;
}

interface CreditCardFormProps {
  paying: boolean;
  onSubmit: (data: CardFormData) => void;
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export default function CreditCardForm({ paying, onSubmit }: CreditCardFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CardFormData>({
    defaultValues: {
      cardNumber: '',
      expMonth: '',
      expYear: '',
      cvv: '',
      cardholderName: '',
    },
  });

  const cardNumber = watch('cardNumber');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="flex items-center gap-3 rounded-lg border border-primary-500/30 bg-primary-500/10 p-4">
        <CreditCard className="h-8 w-8 shrink-0 text-primary-500" />
        <div>
          <h3 className="font-semibold">Credit / Debit Card</h3>
          <p className="text-sm text-gray-600 dark:text-slate-300">
            Data kartu diproses aman oleh Midtrans — tidak disimpan di server kami.
          </p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
          Nama di kartu
        </label>
        <input
          className="input"
          placeholder="JOHN DOE"
          autoComplete="cc-name"
          {...register('cardholderName', { required: 'Nama wajib diisi' })}
        />
        {errors.cardholderName && (
          <p className="mt-1 text-xs text-red-400">{errors.cardholderName.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
          Nomor kartu
        </label>
        <input
          className="input font-mono"
          placeholder="4811 1111 1111 1114"
          inputMode="numeric"
          autoComplete="cc-number"
          value={cardNumber}
          onChange={(e) => setValue('cardNumber', formatCardNumber(e.target.value), { shouldValidate: true })}
        />
        <input
          type="hidden"
          {...register('cardNumber', {
            required: 'Nomor kartu wajib diisi',
            validate: (v) =>
              v.replace(/\s/g, '').length >= 15 || 'Nomor kartu tidak valid',
          })}
        />
        {errors.cardNumber && (
          <p className="mt-1 text-xs text-red-400">{errors.cardNumber.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Bulan
          </label>
          <input
            className="input font-mono"
            placeholder="01"
            maxLength={2}
            inputMode="numeric"
            autoComplete="cc-exp-month"
            {...register('expMonth', {
              required: 'Wajib',
              pattern: { value: /^(0[1-9]|1[0-2])$/, message: 'MM' },
            })}
          />
          {errors.expMonth && (
            <p className="mt-1 text-xs text-red-400">{errors.expMonth.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
            Tahun
          </label>
          <input
            className="input font-mono"
            placeholder="28"
            maxLength={4}
            inputMode="numeric"
            autoComplete="cc-exp-year"
            {...register('expYear', {
              required: 'Wajib',
              validate: (v) => v.length >= 2 || 'TTTT',
            })}
          />
          {errors.expYear && (
            <p className="mt-1 text-xs text-red-400">{errors.expYear.message}</p>
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
            CVV
          </label>
          <input
            className="input font-mono"
            placeholder="123"
            maxLength={4}
            inputMode="numeric"
            autoComplete="cc-csc"
            {...register('cvv', {
              required: 'Wajib',
              pattern: { value: /^\d{3,4}$/, message: 'CVV' },
            })}
          />
          {errors.cvv && <p className="mt-1 text-xs text-red-400">{errors.cvv.message}</p>}
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-slate-400">
        Sandbox: <span className="font-mono">4811 1111 1111 1114</span> · CVV 123 · Exp 01/28 · OTP 112233
      </p>

      <button
        type="submit"
        disabled={paying}
        className="btn btn-primary w-full py-3 text-lg disabled:opacity-50"
      >
        {paying ? <LoadingSpinner size="sm" /> : 'Bayar dengan Kartu'}
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-slate-400">
        <Lock className="h-3.5 w-3.5" />
        Pembayaran aman via Midtrans 3D Secure
      </div>
    </form>
  );
}
