import { CorsOptions } from 'cors';
import { env } from './env';

const normalizeOrigin = (origin: string): string => origin.replace(/\/$/, '');

const isDevelopmentEnv = (nodeEnv: string): boolean =>
  ['development', 'dev', 'local', 'test'].includes(nodeEnv.toLowerCase());

const LOCALHOST_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;
const BRAND_CINEMAS_ORIGIN_PATTERN = /^https:\/\/([a-z0-9-]+\.)?brand-cinemas\.online$/i;

const allowedOrigins = new Set(env.clientUrls.map(normalizeOrigin));

/** API is running on a local host (even if NODE_ENV=production via PM2). */
const isLocalApiHost = (): boolean =>
  /localhost|127\.0\.0\.1/i.test(env.apiUrl) || env.port === 5000 && isDevelopmentEnv(env.nodeEnv);

export const isAllowedOrigin = (origin: string | undefined): boolean => {
  // Non-browser / same-origin / server-to-server
  if (!origin) {
    return true;
  }

  const normalized = normalizeOrigin(origin);

  if (allowedOrigins.has(normalized)) {
    return true;
  }

  // Local FE (any port) → always allow when hitting a local API, or when NODE_ENV is development
  if (LOCALHOST_ORIGIN_PATTERN.test(normalized)) {
    if (isDevelopmentEnv(env.nodeEnv) || isLocalApiHost() || /localhost|127\.0\.0\.1/i.test(env.apiUrl)) {
      return true;
    }
    // Production API: only allow localhost if explicitly listed in CLIENT_URL
    return false;
  }

  // Production FE hosts (www / apex / preview subdomains under brand-cinemas.online)
  if (BRAND_CINEMAS_ORIGIN_PATTERN.test(normalized)) {
    return true;
  }

  return false;
};

const resolveAllowedOrigin = (origin: string | undefined): string | false => {
  if (!origin) {
    return env.clientUrls[0] || false;
  }

  return isAllowedOrigin(origin) ? normalizeOrigin(origin) : false;
};

export const applyCorsHeaders = (
  origin: string | undefined,
  setHeader: (name: string, value: string) => void,
): void => {
  const allowedOrigin = resolveAllowedOrigin(origin);
  if (allowedOrigin) {
    setHeader('Access-Control-Allow-Origin', allowedOrigin);
    setHeader('Access-Control-Allow-Credentials', 'true');
    setHeader('Vary', 'Origin');
  }
};

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    const allowedOrigin = resolveAllowedOrigin(origin);
    if (allowedOrigin) {
      callback(null, allowedOrigin);
      return;
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'ngrok-skip-browser-warning',
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204,
  maxAge: 86400,
};
