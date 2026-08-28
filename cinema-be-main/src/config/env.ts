import dotenv from 'dotenv';

dotenv.config();

const parseClientUrls = (raw?: string): string[] => {
  const value =
    raw ||
    [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://localhost:4173',
      'https://www.brand-cinemas.online',
      'https://brand-cinemas.online',
    ].join(',');
  return value
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
};

const normalizeUrl = (url: string): string => url.replace(/\/$/, '');

const isDevelopmentEnv = (nodeEnv: string): boolean =>
  ['development', 'dev', 'local', 'test'].includes(nodeEnv.toLowerCase());

const resolveAppUrl = (clientUrls: string[], nodeEnv: string): string => {
  if (process.env.APP_URL?.trim()) {
    return normalizeUrl(process.env.APP_URL.trim());
  }

  if (!isDevelopmentEnv(nodeEnv)) {
    const productionUrl = clientUrls.find((url) => /^https:\/\//i.test(url));
    if (productionUrl) {
      return normalizeUrl(productionUrl);
    }

    return 'https://www.brand-cinemas.online';
  }

  return normalizeUrl(clientUrls[0] || 'http://localhost:5173');
};

interface EnvConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpire: string;
  cookieSecret: string;
  clientUrl: string;
  appUrl: string;
  apiUrl: string;
  clientUrls: string[];
  brevo: {
    enabled: boolean;
    apiKey: string;
    senderEmail: string;
    senderName: string;
  };
  resend: {
    enabled: boolean;
    apiKey: string;
    fromEmail: string;
  };
  midtrans: {
    merchantId: string;
    clientKey: string;
    serverKey: string;
    isProduction: boolean;
    notificationUrl: string;
  };
  tmdb: {
    apiKey: string;
    accessToken: string;
  };
  gemini: {
    apiKey: string;
    model: string;
  };
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key] ?? defaultValue;
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const env: EnvConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: getEnv('MONGO_URI', 'mongodb://localhost:27017/cinema-booking'),
  jwtSecret: getEnv('JWT_SECRET'),
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  cookieSecret: getEnv('COOKIE_SECRET'),
  clientUrls: parseClientUrls(process.env.CLIENT_URL),
  clientUrl: parseClientUrls(process.env.CLIENT_URL)[0],
  appUrl: resolveAppUrl(parseClientUrls(process.env.CLIENT_URL), process.env.NODE_ENV || 'development'),
  apiUrl: normalizeUrl(
    process.env.API_URL ||
      (isDevelopmentEnv(process.env.NODE_ENV || 'development')
        ? `http://localhost:${parseInt(process.env.PORT || '5000', 10)}`
        : 'https://api.brand-cinemas.online')
  ),
  brevo: {
    enabled: Boolean(process.env.BREVO_API_KEY),
    apiKey: process.env.BREVO_API_KEY || '',
    senderEmail: process.env.BREVO_SENDER_EMAIL || '',
    senderName: process.env.BREVO_SENDER_NAME || 'Brand Cinemas',
  },
  resend: {
    enabled: Boolean(process.env.RESEND_API_KEY),
    apiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.RESEND_FROM_EMAIL || 'Brand Cinemas <onboarding@resend.dev>',
  },
  midtrans: {
    merchantId: process.env.MIDTRANS_MERCHANT_ID || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
    notificationUrl: process.env.MIDTRANS_NOTIFICATION_URL || '',
  },
  tmdb: {
    apiKey: process.env.TMDB_API_KEY || '',
    accessToken: process.env.TMDB_ACCESS_TOKEN || '',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-flash-lite-latest',
  },
};
