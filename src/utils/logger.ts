import pino, { LoggerOptions } from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

const options: LoggerOptions = { level: process.env.LOG_LEVEL || 'info' };
if (isDev) {
  // @ts-ignore - transport type is permissive in runtime
  options.transport = { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } } as any;
}

// Create a pino logger instance with custom error method to accept any type
const pinoLogger = pino(options);

// Create a wrapper that allows any error type
const logger = {
  ...pinoLogger,
  error: (message: string, ...args: any[]) => {
    // @ts-ignore
    pinoLogger.error(message, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    // @ts-ignore
    pinoLogger.warn(message, ...args);
  },
  info: (message: string, ...args: any[]) => {
    // @ts-ignore
    pinoLogger.info(message, ...args);
  },
  debug: (message: string, ...args: any[]) => {
    // @ts-ignore
    pinoLogger.debug(message, ...args);
  },
};

export { logger };
