type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogMeta {
  [key: string]: unknown;
}

const formatMessage = (level: LogLevel, message: string, meta?: LogMeta): string => {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
};

export const logger = {
  info: (message: string, meta?: LogMeta): void => {
    console.log(formatMessage('info', message, meta));
  },
  warn: (message: string, meta?: LogMeta): void => {
    console.warn(formatMessage('warn', message, meta));
  },
  error: (message: string, meta?: LogMeta): void => {
    console.error(formatMessage('error', message, meta));
  },
  debug: (message: string, meta?: LogMeta): void => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('debug', message, meta));
    }
  },
};
