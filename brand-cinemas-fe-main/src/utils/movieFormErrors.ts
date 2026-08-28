import type { UseFormSetError } from 'react-hook-form';

type MovieFormField =
  | 'title'
  | 'description'
  | 'genre'
  | 'duration'
  | 'language'
  | 'release_date'
  | 'rating'
  | 'poster_url'
  | 'trailer_url'
  | 'status';

function resolveMovieFieldError(message: string): MovieFormField | null {
  const normalized = message.toLowerCase();

  if (normalized.includes('title')) return 'title';
  if (normalized.includes('genre')) return 'genre';
  if (normalized.includes('description')) return 'description';
  if (normalized.includes('duration')) return 'duration';
  if (normalized.includes('rating')) return 'rating';
  if (normalized.includes('language')) return 'language';
  if (normalized.includes('release date') || normalized.includes('releasedate')) return 'release_date';
  if (normalized.includes('trailer')) return 'trailer_url';
  if (normalized.includes('poster')) return 'poster_url';
  if (normalized.includes('status')) return 'status';

  return null;
}

export function applyMovieFormApiErrors<T extends Record<string, unknown>>(
  apiErrors: string[],
  setError: UseFormSetError<T>,
  setFormError: (message: string) => void,
) {
  const fieldMessages = new Map<MovieFormField, string[]>();
  const generalErrors: string[] = [];

  apiErrors.forEach((message) => {
    const field = resolveMovieFieldError(message);
    if (!field) {
      generalErrors.push(message);
      return;
    }

    const existing = fieldMessages.get(field) ?? [];
    fieldMessages.set(field, [...existing, message]);
  });

  fieldMessages.forEach((messages, field) => {
    setError(field as Parameters<UseFormSetError<T>>[0], {
      type: 'server',
      message: messages.join(', '),
    });
  });

  setFormError(generalErrors.length ? generalErrors.join(', ') : '');
}
