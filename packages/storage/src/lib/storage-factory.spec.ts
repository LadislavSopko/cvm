import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageFactory, StorageConfig } from './storage-factory.js';
import { FileStorageAdapter } from './file-adapter.js';

describe('StorageFactory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create FileStorageAdapter when type is file', () => {
    const adapter = StorageFactory.create({ type: 'file', dataDir: '/custom/path' });
    expect(adapter).toBeInstanceOf(FileStorageAdapter);
  });

  it('should create FileStorageAdapter by default with no config and no env', () => {
    const adapter = StorageFactory.create();
    expect(adapter).toBeInstanceOf(FileStorageAdapter);
  });

  it('should throw for mongodb storage type with actionable message', () => {
    expect(() => StorageFactory.create({ type: 'mongodb' as any }))
      .toThrow(/mongodb.*removed.*file storage/i);
  });

  it('should throw for unsupported storage type', () => {
    expect(() => StorageFactory.create({ type: 'bogus' as any }))
      .toThrow('Unsupported storage type: bogus');
  });

  it('StorageConfig has no mongoUri field', () => {
    const config: StorageConfig = { type: 'file', dataDir: '/tmp' };
    expect(config).not.toHaveProperty('mongoUri');
  });
});
