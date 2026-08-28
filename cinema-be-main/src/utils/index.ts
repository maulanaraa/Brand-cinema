import { logger } from './logger.util';

export const logInfo = (message: string, meta?: Record<string, unknown>): void => {
  logger.info(message, meta);
};

export const logError = (message: string, error?: unknown): void => {
  logger.error(message, { error });
};

export const logWarn = (message: string, meta?: Record<string, unknown>): void => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: Record<string, unknown>): void => {
  logger.debug(message, meta);
};
