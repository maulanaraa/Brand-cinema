import { X } from 'lucide-react';

interface Card3dsModalProps {
  url: string | null;
  onClose?: () => void;
}

export default function Card3dsModal({ url, onClose }: Card3dsModalProps) {
  if (!url) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="flex h-[min(90vh,640px)] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-white/10 bg-white shadow-2xl dark:bg-dark-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-dark-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Verifikasi Kartu (3D Secure)</p>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-800"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <iframe
          title="3D Secure authentication"
          src={url}
          className="h-full w-full flex-1 border-0"
        />
      </div>
    </div>
  );
}
