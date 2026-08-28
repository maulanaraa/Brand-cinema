import express, { Application } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { corsOptions } from './config/cors';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares';
import { UPLOAD } from './constants';

export const createApp = (): Application => {
  const app = express();

  app.set('trust proxy', 1);

  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
    })
  );
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(mongoSanitize());
  app.use(cookieParser(env.cookieSecret));
  app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

  app.use(
    `/${UPLOAD.POSTER_DIR}`,
    express.static(path.join(process.cwd(), UPLOAD.POSTER_DIR))
  );

  app.get('/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Server is healthy',
      data: { uptime: process.uptime() },
    });
  });

  app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
