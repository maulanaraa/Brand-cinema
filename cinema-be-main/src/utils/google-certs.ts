import fs from 'fs';
import https from 'https';
import path from 'path';
import { logger } from './logger.util';

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v1/certs';
const CERTS_PATH = path.resolve(process.cwd(), 'config/google-oauth-certs.json');

export type GoogleCertMap = Record<string, string>;

const readCertFile = (): GoogleCertMap => {
  if (!fs.existsSync(CERTS_PATH)) {
    throw new Error(`Missing cached Google OAuth certificates at ${CERTS_PATH}`);
  }

  return JSON.parse(fs.readFileSync(CERTS_PATH, 'utf-8')) as GoogleCertMap;
};

const writeCertFile = (certs: GoogleCertMap): void => {
  try {
    const dir = path.dirname(CERTS_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(CERTS_PATH, `${JSON.stringify(certs, null, 2)}\n`, 'utf-8');
  } catch (error) {
    // Ignore write failure in read-only environment
  }
};

const downloadGoogleCerts = (): Promise<GoogleCertMap> =>
  new Promise((resolve, reject) => {
    const request = https.get(
      GOOGLE_CERTS_URL,
      { family: 4, timeout: 10000 },
      (response) => {
        if ((response.statusCode ?? 0) >= 400) {
          reject(new Error(`Google certs HTTP ${response.statusCode}`));
          response.resume();
          return;
        }

        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => {
          try {
            resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')) as GoogleCertMap);
          } catch (error) {
            reject(error);
          }
        });
      }
    );

    request.on('timeout', () => {
      request.destroy(new Error('Google certs request timed out'));
    });
    request.on('error', reject);
  });

export const loadGoogleCerts = (): GoogleCertMap => readCertFile();

export const tryRefreshGoogleCerts = async (): Promise<GoogleCertMap | null> => {
  try {
    const certs = await downloadGoogleCerts();
    writeCertFile(certs);
    logger.info('Google OAuth certificates refreshed from Google');
    return certs;
  } catch (error) {
    logger.warn('Could not refresh Google OAuth certificates online', {
      error: error instanceof Error ? error.message : 'unknown',
    });
    return null;
  }
};

export const warmupGoogleCertificates = async (): Promise<void> => {
  const cached = loadGoogleCerts();
  const keyCount = Object.keys(cached).length;
  logger.info(`Google OAuth certificates loaded from cache (${keyCount} keys)`);

  const refreshed = await tryRefreshGoogleCerts();
  if (!refreshed) {
    logger.info('Using cached Google OAuth certificates (offline verification enabled)');
  }
};

export const getGoogleCertByKid = (kid: string): string | null => {
  const certs = loadGoogleCerts();
  return certs[kid] ?? null;
};
