export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  private levelValue: number;

  constructor(level: LogLevel) {
    this.levelValue = LOG_LEVELS[level];
  }

  private log(level: LogLevel, message: string, ...args: unknown[]): void {
    if (LOG_LEVELS[level] >= this.levelValue) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
      
      // Write to stderr to keep stdout clean for MCP protocol
      if (args.length > 0) {
        console.error(prefix, message, ...args);
      } else {
        console.error(prefix, message);
      }
    }
  }

  debug(message: string, ...args: unknown[]): void {
    this.log('debug', message, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }
}

// Singleton instance
let logger: Logger;

export function initLogger(level: LogLevel): Logger {
  logger = new Logger(level);
  return logger;
}

export function getLogger(): Logger {
  if (!logger) {
    throw new Error('Logger not initialized. Call initLogger() first.');
  }
  return logger;
}