import { Request, Response } from 'express';
import https from 'https';
import http from 'http';
import { asyncHandler } from '../helpers';
import { applyCorsHeaders } from '../config/cors';
import {
  assertSafeImageUrl,
  buildGoogleDriveImageUrl,
  extractGoogleDriveFileId,
  normalizeImageUrl,
} from '../utils/imageUrl.util';
import { AppError } from '../helpers/response.helper';
import { HTTP_STATUS } from '../constants';
import { logger } from '../utils/logger.util';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const fetchRemoteImage = (targetUrl: string): Promise<{ buffer: Buffer; contentType: string }> =>
  new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;

    const request = client.get(
      targetUrl,
      {
        headers: {
          'User-Agent': 'BrandCinemas-ImageProxy/1.0',
          Accept: 'image/*,*/*',
        },
        timeout: 15000,
      },
      (response) => {
        const statusCode = response.statusCode ?? 500;

        if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
          const redirectUrl = new URL(response.headers.location, targetUrl).toString();
          response.resume();
          fetchRemoteImage(redirectUrl).then(resolve).catch(reject);
          return;
        }

        if (statusCode >= 400) {
          reject(new Error(`Image upstream HTTP ${statusCode}`));
          response.resume();
          return;
        }

        const chunks: Buffer[] = [];
        let total = 0;

        response.on('data', (chunk: Buffer) => {
          total += chunk.length;
          if (total > MAX_IMAGE_BYTES) {
            request.destroy(new Error('Image is too large'));
            return;
          }
          chunks.push(chunk);
        });

        response.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const contentType = String(response.headers['content-type'] || 'image/jpeg');
          resolve({ buffer, contentType });
        });
      }
    );

    request.on('timeout', () => {
      request.destroy(new Error('Image request timed out'));
    });
    request.on('error', reject);
  });

export const proxyImage = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const rawUrl = typeof req.query.url === 'string' ? req.query.url : '';

  if (!rawUrl) {
    throw new AppError('Image URL is required', HTTP_STATUS.BAD_REQUEST);
  }

  const fileId = extractGoogleDriveFileId(rawUrl);
  if (fileId) {
    const directUrl = buildGoogleDriveImageUrl(fileId);
    applyCorsHeaders(req.headers.origin, res.setHeader.bind(res));
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.redirect(302, directUrl);
    return;
  }

  const safeUrl = assertSafeImageUrl(normalizeImageUrl(rawUrl)).toString();

  try {
    const { buffer, contentType } = await fetchRemoteImage(safeUrl);

    applyCorsHeaders(req.headers.origin, res.setHeader.bind(res));
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.status(200).send(buffer);
  } catch (error) {
    logger.error('Image proxy fetch failed', {
      url: safeUrl,
      error: error instanceof Error ? error.message : 'unknown',
    });
    throw new AppError('Unable to fetch image from upstream source', HTTP_STATUS.BAD_GATEWAY);
  }
});
