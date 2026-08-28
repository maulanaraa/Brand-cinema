import { useEffect, useState } from 'react';
import { Film, Loader2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ApiError, tmdbService } from '@/services/tmdbService';
import type { TmdbMovieImportData, TmdbSearchResult } from '@/types/tmdb';

const PLACEHOLDER_POSTER =
  'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=200&h=300&fit=crop';

interface TmdbMovieSearchProps {
  onImport: (data: TmdbMovieImportData) => void;
  disabled?: boolean;
}

export default function TmdbMovieSearch({ onImport, disabled }: TmdbMovieSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [importingId, setImportingId] = useState<number | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const items = await tmdbService.searchMovies(query);
        setResults(items);
        setHasSearched(true);
      } catch (error) {
        setResults([]);
        setHasSearched(true);
        if (error instanceof ApiError) {
          if (error.status === 401 || error.status === 403) {
            toast.error('Sesi admin habis. Silakan login ulang.');
          } else if (error.status === 503) {
            toast.error('TMDB belum dikonfigurasi di server.');
          } else {
            toast.error(error.message || 'Gagal mencari film di TMDB');
          }
        } else {
          toast.error('Gagal mencari film di TMDB');
        }
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = async (item: TmdbSearchResult) => {
    setImportingId(item.id);
    try {
      const data = await tmdbService.getMovieImportData(item.id);
      onImport(data);
      toast.success(`Data "${data.title}" diimpor dari TMDB`);
      setQuery('');
      setResults([]);
      setHasSearched(false);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message || 'Gagal mengimpor data TMDB');
      } else {
        toast.error('Gagal mengimpor data TMDB');
      }
    } finally {
      setImportingId(null);
    }
  };

  return (
    <div className="rounded-lg border border-primary-500/30 bg-primary-500/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Film className="h-5 w-5 text-primary-500" />
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Import dari TMDB</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Cari film untuk mengisi poster, trailer, sinopsis, dan metadata otomatis.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          placeholder="Cari judul film, mis. Inception..."
          className="input pl-10"
        />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
        )}
      </div>

      {importingId !== null && (
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
          <LoadingSpinner size="sm" />
          Mengambil detail film...
        </div>
      )}

      {results.length > 0 && (
        <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
          {results.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                disabled={disabled || importingId !== null}
                onClick={() => handleSelect(item)}
                className="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white p-2 text-left transition-colors hover:border-primary-500/50 hover:bg-gray-50 disabled:opacity-50 dark:border-dark-700 dark:bg-dark-900 dark:hover:bg-dark-800"
              >
                <img
                  src={item.poster?.trim() ? item.poster : PLACEHOLDER_POSTER}
                  alt={item.title}
                  className="h-16 w-11 shrink-0 rounded object-cover bg-gray-100 dark:bg-dark-800"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 dark:text-white">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {item.releaseDate
                      ? new Date(item.releaseDate).getFullYear()
                      : '—'}
                    {item.rating ? ` · ★ ${item.rating.toFixed(1)}` : ''}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {hasSearched && !searching && query.trim().length >= 2 && results.length === 0 && (
        <p className="mt-3 text-sm text-gray-500 dark:text-slate-400">
          Tidak ada hasil untuk &quot;{query}&quot;.
        </p>
      )}
    </div>
  );
}
