const GOOGLE_DRIVE_FILE_PATTERN =
  /^https?:\/\/(?:drive|docs)\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/i;

const GOOGLE_DRIVE_OPEN_PATTERN =
  /^https?:\/\/(?:drive|docs)\.google\.com\/open\?[^#]*id=([a-zA-Z0-9_-]+)/i;

const GOOGLE_DRIVE_UC_PATTERN =
  /^https?:\/\/drive\.google\.com\/uc\?(?:export=(?:view|download)&)?id=([a-zA-Z0-9_-]+)/i;

const GOOGLE_USERCONTENT_PATTERN =
  /^https?:\/\/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i;

const GOOGLE_DRIVE_FOLDER_PATTERN =
  /^https?:\/\/(?:drive|docs)\.google\.com\/(?:drive\/)?folders\/[a-zA-Z0-9_-]+/i;

const ALLOWED_IMAGE_HOSTS = new Set([
  'drive.google.com',
  'docs.google.com',
  'lh3.googleusercontent.com',
  'images.unsplash.com',
  'image.tmdb.org',
  'api.brand-cinemas.online',
  'www.brand-cinemas.online',
  'brand-cinemas.online',
]);

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^0\./,
  /^\[::1\]$/,
];

export const isGoogleDriveFolderUrl = (value: string): boolean =>
  GOOGLE_DRIVE_FOLDER_PATTERN.test(value.trim());

export const extractGoogleDriveFileId = (value: string): string | null => {
  const trimmed = value.trim();

  for (const pattern of [
    GOOGLE_DRIVE_FILE_PATTERN,
    GOOGLE_DRIVE_OPEN_PATTERN,
    GOOGLE_DRIVE_UC_PATTERN,
    GOOGLE_USERCONTENT_PATTERN,
  ]) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
};

export const buildGoogleDriveImageUrl = (fileId: string): string =>
  `https://lh3.googleusercontent.com/d/${fileId}=w1000`;

export const normalizeImageUrl = (value: string): string => {
  const trimmed = value.trim();

  if (isGoogleDriveFolderUrl(trimmed)) {
    throw new Error('Google Drive folder links are not supported. Use a direct file link per item.');
  }

  const fileId = extractGoogleDriveFileId(trimmed);
  if (fileId) {
    return buildGoogleDriveImageUrl(fileId);
  }

  return trimmed;
};

export const isExternalImageHost = (hostname: string): boolean => {
  const host = hostname.toLowerCase();
  return !ALLOWED_IMAGE_HOSTS.has(host) && !host.endsWith('.brand-cinemas.online');
};

export const assertSafeImageUrl = (value: string): URL => {
  let parsed: URL;

  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error('Invalid image URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Image URL must use http or https');
  }

  if (BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(parsed.hostname))) {
    throw new Error('Image URL host is not allowed');
  }

  if (isGoogleDriveFolderUrl(parsed.toString())) {
    throw new Error('Google Drive folder links are not supported');
  }

  return parsed;
};

export const shouldProxyImageUrl = (value: string): boolean => {
  try {
    const parsed = assertSafeImageUrl(value);

    if (parsed.hostname.includes('googleusercontent.com') || parsed.hostname.includes('google.com')) {
      return false;
    }

    return isExternalImageHost(parsed.hostname);
  } catch {
    return false;
  }
};

export const buildImageProxyPath = (value: string): string =>
  `/api/media/image?url=${encodeURIComponent(value)}`;

export const resolvePublicImageUrl = (value: string, apiBaseUrl = ''): string => {
  if (!value) {
    return value;
  }

  try {
    const normalized = normalizeImageUrl(value);
    if (shouldProxyImageUrl(normalized)) {
      const path = buildImageProxyPath(normalized);
      const base = apiBaseUrl.replace(/\/$/, '');
      return base ? `${base}${path}` : path;
    }
    return normalized;
  } catch {
    return value;
  }
};
