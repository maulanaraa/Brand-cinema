import { getApiBaseUrl } from '@/config/api';

const GOOGLE_DRIVE_FOLDER_PATTERN = /drive\.google\.com\/drive\/folders\//i;

const GOOGLE_DRIVE_FILE_ID_PATTERNS = [
  /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
  /drive\.google\.com\/uc\?(?:export=(?:view|download)&)?(?:id=([a-zA-Z0-9_-]+)|.*&id=([a-zA-Z0-9_-]+))/,
  /lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/,
];

/** Frontend hosts that must not serve `/api/*` (Vercel SPA). */
const FRONTEND_HOSTS = new Set([
  'www.brand-cinemas.online',
  'brand-cinemas.online',
]);

export function isGoogleDriveFolderUrl(url: string): boolean {
  return GOOGLE_DRIVE_FOLDER_PATTERN.test(url.trim());
}

export function extractGoogleDriveFileId(url: string): string | null {
  const trimmed = url.trim();
  for (const pattern of GOOGLE_DRIVE_FILE_ID_PATTERNS) {
    const match = trimmed.match(pattern);
    const fileId = match?.[1] ?? match?.[2];
    if (fileId) return fileId;
  }
  return null;
}

/** Normalize public image URLs (e.g. Google Drive share links → direct view). */
export function resolvePublicImageUrl(imageUrl?: string): string | undefined {
  if (!imageUrl?.trim()) return undefined;

  const trimmed = imageUrl.trim();
  if (isGoogleDriveFolderUrl(trimmed)) return undefined;

  const fileId = extractGoogleDriveFileId(trimmed);
  if (fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  return trimmed;
}

/**
 * Ensure `/api/...` asset URLs hit the API host, not the Vercel SPA.
 * Backend sometimes prefixes media proxy URLs with CLIENT/APP URL (www).
 */
export function resolveApiAssetUrl(imageUrl?: string): string | undefined {
  if (!imageUrl?.trim()) return undefined;

  const trimmed = imageUrl.trim();
  const apiBase = getApiBaseUrl().replace(/\/$/, '');

  if (trimmed.startsWith('/api/')) {
    return `${apiBase}${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    const isFrontendApiPath =
      FRONTEND_HOSTS.has(parsed.hostname) && parsed.pathname.startsWith('/api/');
    const isLocalhostApiPath =
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
      parsed.pathname.startsWith('/api/');

    if (isFrontendApiPath || isLocalhostApiPath) {
      return `${apiBase}${parsed.pathname}${parsed.search}`;
    }
  } catch {
    // not an absolute URL
  }

  return trimmed;
}

/** Full pipeline for displayable image src from API or user input. */
export function resolveDisplayImageUrl(
  imageUrl?: string,
  fallback = '',
): string {
  if (!imageUrl?.trim()) return fallback;

  const publicUrl = resolvePublicImageUrl(imageUrl) ?? imageUrl.trim();
  const assetUrl = resolveApiAssetUrl(publicUrl) ?? publicUrl;

  if (assetUrl.startsWith('http') || assetUrl.startsWith('data:') || assetUrl.startsWith('blob:')) {
    return assetUrl;
  }

  const apiBase = getApiBaseUrl().replace(/\/$/, '');
  return `${apiBase}${assetUrl.startsWith('/') ? '' : '/'}${assetUrl}`;
}
