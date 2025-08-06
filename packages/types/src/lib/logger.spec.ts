import { describe, it, expect } from 'vitest';
import logger from './logger.js';

describe('Pino Logger', () => {
  it('should export a valid Pino logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.debug).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.trace).toBe('function');
  });

  it('should have child logger functionality', () => {
    const childLogger = logger.child({ component: 'test' });
    expect(childLogger).toBeDefined();
    expect(typeof childLogger.info).toBe('function');
  });

  it('should support structured logging', () => {
    expect(() => {
      logger.info({ test: 'data' }, 'Test message');
    }).not.toThrow();
  });
});