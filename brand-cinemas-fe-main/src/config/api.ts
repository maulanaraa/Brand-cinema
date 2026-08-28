/**
 * Resolve API base URL.
 * - Local DEV: always "" so Vite proxies `/api` → localhost:5000 (no CORS)
 * - Production: VITE_API_URL or https://api.brand-cinemas.online
 */
export function getApiBaseUrl(): string {
  // Prefer same-origin + Vite proxy during local development.
  // Calling http://localhost:5000 from :5173 triggers CORS.
  if (import.meta.env.DEV) {
    return '';
  }

  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  return 'https://cinema-id-api.vercel.app';
}
