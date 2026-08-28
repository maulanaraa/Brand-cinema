import { clsx } from 'clsx';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  loading?: boolean;
}

export default function LoadingSpinner({
  size = 'md',
  className,
  loading = true,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-5 w-5 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <span
      aria-label="Loading"
      role="status"
      className={clsx(
        'inline-block rounded-full border-current border-r-transparent text-primary-500',
        loading && 'animate-spin',
        sizeClasses[size],
        className,
      )}
    />
  );
}
