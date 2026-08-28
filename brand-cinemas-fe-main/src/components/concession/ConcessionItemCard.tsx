import { Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';
import type { ConcessionItem } from '@/types/concession';
import { getConcessionImageUrl } from '@/utils/concession';

interface ConcessionItemCardProps {
  item: ConcessionItem;
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  maxQuantity?: number;
}

function formatIdr(amount: number) {
  return `IDR ${amount.toLocaleString('id-ID')}`;
}

export default function ConcessionItemCard({
  item,
  quantity,
  onIncrease,
  onDecrease,
  maxQuantity = 10,
}: ConcessionItemCardProps) {
  const [imageSrc, setImageSrc] = useState(() => getConcessionImageUrl(item.imageUrl));
  const isSelected = quantity > 0;

  return (
    <article
      className={clsx(
        'group w-full min-w-0 overflow-hidden rounded-2xl border transition-all duration-200',
        isSelected
          ? 'border-primary-500/50 bg-primary-500/[0.06] shadow-lg shadow-primary-500/10 ring-1 ring-primary-500/30'
          : 'border-gray-200/80 bg-white hover:border-gray-300 hover:shadow-md dark:border-dark-600 dark:bg-dark-900/70 dark:hover:border-dark-500',
      )}
    >
      <div className="flex w-full min-w-0 gap-3 p-3 sm:gap-4 sm:p-4">
        {/* Image */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-dark-800 sm:h-24 sm:w-24 lg:h-28 lg:w-28">
          <img
            src={imageSrc}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={() => setImageSrc(getConcessionImageUrl())}
          />
          {item.badge && (
            <span className="absolute left-1 top-1 rounded-md bg-[#D5A527] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-dark-950 sm:text-[10px]">
              {item.badge}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-snug text-gray-900 dark:text-white sm:text-base lg:text-lg">
              {item.name}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-slate-400 sm:text-sm">
              {item.description}
            </p>
            <p className="mt-1.5 text-sm font-bold text-primary-600 dark:text-primary-400 sm:mt-2">
              {formatIdr(item.price)}
            </p>
          </div>

          <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit shrink-0 items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-dark-600 dark:bg-dark-800">
              <button
                type="button"
                onClick={onDecrease}
                disabled={quantity === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100 disabled:opacity-40 dark:hover:bg-dark-700 sm:h-9 sm:w-9"
                aria-label={`Kurangi ${item.name}`}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-[2rem] text-center text-sm font-bold tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={onIncrease}
                disabled={quantity >= maxQuantity}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white transition-colors hover:bg-primary-600 disabled:opacity-40 sm:h-9 sm:w-9"
                aria-label={`Tambah ${item.name}`}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {isSelected && (
              <p className="shrink-0 text-left text-xs font-semibold text-primary-600 dark:text-primary-400 sm:text-right sm:text-sm">
                Subtotal {formatIdr(item.price * quantity)}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
