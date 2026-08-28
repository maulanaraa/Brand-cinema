import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import type { PaginationMeta } from '@/types/pagination';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

function getVisiblePages(current: number, total: number): number[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= total)
    .sort((a, b) => a - b);
}

export default function Pagination({ pagination, onPageChange, className }: PaginationProps) {
  const { page, limit, total, totalPages } = pagination;

  if (totalPages <= 1 && total <= limit) {
    return null;
  }

  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <div
      className={clsx(
        'flex flex-col gap-3 border-t border-gray-200 px-4 py-4 dark:border-dark-700 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <p className="text-sm text-gray-500 dark:text-slate-400">
        Showing {start.toLocaleString()}–{end.toLocaleString()} of {total.toLocaleString()}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn btn-secondary px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {visiblePages.map((pageNumber, index) => {
          const prev = visiblePages[index - 1];
          const showEllipsis = prev !== undefined && pageNumber - prev > 1;

          return (
            <span key={pageNumber} className="flex items-center gap-1">
              {showEllipsis && <span className="px-1 text-gray-400">…</span>}
              <button
                type="button"
                onClick={() => onPageChange(pageNumber)}
                className={clsx(
                  'min-w-[2.25rem] rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  pageNumber === page
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-dark-800',
                )}
                aria-current={pageNumber === page ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            </span>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn btn-secondary px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
