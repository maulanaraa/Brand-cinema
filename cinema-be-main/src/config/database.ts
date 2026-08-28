import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger.util';

const MAX_RETRIES = env.nodeEnv === 'development' ? 1 : 5;
const RETRY_DELAY_MS = 2000;

const mongoOptions: mongoose.ConnectOptions = {
  family: 4,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
  maxIdleTimeMS: 60000,
  retryWrites: true,
  retryReads: true,
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const getMongoErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown MongoDB connection error';
};

const registerConnectionHandlers = (): void => {
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error', { error: getMongoErrorMessage(error) });
  });
};

export const connectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      await mongoose.connect(env.mongoUri, mongoOptions);
      registerConnectionHandlers();
      logger.info('MongoDB connected successfully');
      return;
    } catch (error) {
      const message = getMongoErrorMessage(error);
      logger.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed`, {
        error: message,
      });

      if (attempt === MAX_RETRIES) {
        logger.error(
          'Unable to connect to MongoDB. If using Atlas, whitelist your IP at Network Access and verify MONGO_URI credentials, or ensure local MongoDB service is running.'
        );
        if (env.nodeEnv === 'production') {
          process.exit(1);
        }
        return;
      }

      await sleep(RETRY_DELAY_MS * attempt);
    }
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};
