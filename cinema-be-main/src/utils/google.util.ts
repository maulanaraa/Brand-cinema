import jwt, { JwtPayload } from 'jsonwebtoken';
import { getGoogleConfig } from '../config/google';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS } from '../constants';
import { getGoogleCertByKid, tryRefreshGoogleCerts } from './google-certs';
import { logger } from './logger.util';

export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

interface GoogleTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  name?: string;
  email_verified?: boolean;
}

const decodeJwtPart = <T>(part: string): T | null => {
  try {
    const normalized = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const json = Buffer.from(padded, 'base64').toString('utf-8');
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};

const decodeJwtHeader = (token: string): { kid?: string; alg?: string } | null => {
  const headerPart = token.split('.')[0];
  if (!headerPart) {
    return null;
  }

  return decodeJwtPart<{ kid?: string; alg?: string }>(headerPart);
};

const verifyWithCachedCerts = (token: string, clientIds: string[]): GoogleTokenPayload => {
  const header = decodeJwtHeader(token);
  if (!header?.kid) {
    throw new Error('Token header missing key id');
  }

  if (header.alg && header.alg !== 'RS256') {
    throw new Error(`Unsupported token algorithm: ${header.alg}`);
  }

  const pem = getGoogleCertByKid(header.kid);
  if (!pem) {
    throw new Error(`Unknown token key id: ${header.kid}`);
  }

  const payload = jwt.verify(token, pem, {
    algorithms: ['RS256'],
    audience: clientIds.length === 1 ? clientIds[0] : (clientIds as [string, ...string[]]),
    issuer: ['accounts.google.com', 'https://accounts.google.com'],
  }) as unknown as GoogleTokenPayload;

  return payload;
};

export { warmupGoogleCertificates } from './google-certs';

export const verifyGoogleIdToken = async (idToken: string): Promise<GoogleUserInfo> => {
  const trimmedToken = idToken.trim();
  const { clientIds } = getGoogleConfig();

  try {
    let payload: GoogleTokenPayload;

    try {
      payload = verifyWithCachedCerts(trimmedToken, clientIds);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';

      if (message.startsWith('Unknown token key id:')) {
        const refreshed = await tryRefreshGoogleCerts();
        if (!refreshed) {
          throw error;
        }
        payload = verifyWithCachedCerts(trimmedToken, clientIds);
      } else {
        throw error;
      }
    }

    if (!payload.sub || !payload.email) {
      throw new AppError('Invalid Google token', HTTP_STATUS.UNAUTHORIZED);
    }

    return {
      googleId: payload.sub,
      email: payload.email.toLowerCase(),
      name: payload.name || payload.email.split('@')[0],
      emailVerified: payload.email_verified === true,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const decoded = decodeJwtPart<Record<string, unknown>>(trimmedToken.split('.')[1] || '');

    logger.warn('Google token verification failed', {
      audiences: clientIds,
      tokenAudience: decoded?.aud ?? null,
      tokenAzp: decoded?.azp ?? null,
      tokenIssuer: decoded?.iss ?? null,
      error: error instanceof Error ? error.message : 'unknown',
    });

    throw new AppError('Invalid Google token', HTTP_STATUS.UNAUTHORIZED);
  }
};
