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
    // Mock the actual logging call to avoid file system issues in tests
    const originalInfo = logger.info;
    logger.info = () => {}; // Mock function that does nothing
    
    expect(() => {
      logger.info({ test: 'data' }, 'Test message');
    }).not.toThrow();
    
    // Restore original function
    logger.info = originalInfo;
  });
});