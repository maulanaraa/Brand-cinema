import './config/dns';
import { createApp } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { getGoogleConfig } from './config/google';
import { logger } from './utils/logger.util';
import { warmupGoogleCertificates } from './utils/google.util';
import { checkExternalHttps } from './utils/externalHttp.util';

const startServer = async (): Promise<void> => {
  await connectDatabase();
  warmupGoogleCertificates().catch(() => {});

  const app = createApp();

  if (env.tmdb.apiKey || env.tmdb.accessToken) {
    const tmdbReachable = await checkExternalHttps('https://api.themoviedb.org/3/configuration');
    logger.info(
      tmdbReachable
        ? 'TMDB API: reachable'
        : 'TMDB API: unreachable (check outbound HTTPS to api.themoviedb.org)'
    );
  }

  app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port}`);
    logger.info(`Environment: ${env.nodeEnv}`);
    logger.info(`Swagger docs: http://localhost:${env.port}/api-docs`);
    logger.info(`OpenAPI JSON: http://localhost:${env.port}/api-docs.json`);
    if (env.resend.enabled) {
      logger.info(`Resend email: enabled (from: ${env.resend.fromEmail})`);
    } else if (env.brevo.enabled && env.brevo.senderEmail) {
      logger.info(`Brevo email: enabled (sender: ${env.brevo.senderEmail})`);
    } else {
      logger.info('Email service: disabled');
    }
    if (env.midtrans.notificationUrl) {
      logger.info(`Midtrans webhook: ${env.midtrans.notificationUrl}`);
    }

    try {
      const google = getGoogleConfig();
      if (google.clientId) {
        logger.info(`Google OAuth: enabled (clientId: ${google.clientId})`);
      } else {
        logger.info('Google OAuth: disabled (set GOOGLE_CLIENT_ID if needed)');
      }
    } catch (error) {
      logger.warn('Google OAuth is not configured', {
        error: error instanceof Error ? error.message : 'unknown',
      });
    }

    logger.info(`App URL (QR/email links): ${env.appUrl}`);
  });
};

startServer().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});
