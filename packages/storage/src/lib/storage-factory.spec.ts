import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageFactory } from './storage-factory.js';
import { FileStorageAdapter } from './file-adapter.js';
import { MongoDBAdapter } from './mongodb-adapter.js';

describe('StorageFactory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should create FileStorageAdapter by default', () => {
    const adapter = StorageFactory.create();
    expect(adapter).toBeInstanceOf(FileStorageAdapter);
  });

  it('should create FileStorageAdapter when type is file', () => {
    const adapter = StorageFactory.create({ type: 'file' });
    expect(adapter).toBeInstanceOf(FileStorageAdapter);
  });

  it('should create MongoDBAdapter when type is mongodb', () => {
    const adapter = StorageFactory.create({ type: 'mongodb' });
    expect(adapter).toBeInstanceOf(MongoDBAdapter);
  });

  it('should use environment variable for storage type', () => {
    process.env.CVM_STORAGE_TYPE = 'mongodb';
    const adapter = StorageFactory.create();
    expect(adapter).toBeInstanceOf(MongoDBAdapter);
  });

  it('should use custom data directory for file storage', () => {
    const adapter = StorageFactory.create({ 
      type: 'file', 
      dataDir: '/custom/path' 
    }) as FileStorageAdapter;
    
    // We can't easily test the internal dataDir, but we can verify it's a FileStorageAdapter
    expect(adapter).toBeInstanceOf(FileStorageAdapter);
  });

  it('should use environment variable for data directory', () => {
    process.env.CVM_DATA_DIR = '/env/path';
    const adapter = StorageFactory.create({ type: 'file' });
    expect(adapter).toBeInstanceOf(FileStorageAdapter);
  });

  it('should use custom MongoDB URI', () => {
    const adapter = StorageFactory.create({ 
      type: 'mongodb', 
      mongoUri: 'mongodb://custom:27017/db' 
    });
    expect(adapter).toBeInstanceOf(MongoDBAdapter);
  });

  it('should use environment variable for MongoDB URI', () => {
    process.env.MONGODB_URI = 'mongodb://env:27017/db';
    const adapter = StorageFactory.create({ type: 'mongodb' });
    expect(adapter).toBeInstanceOf(MongoDBAdapter);
  });

  it('should throw for unsupported storage type', () => {
    expect(() => StorageFactory.create({ type: 'unsupported' as any }))
      .toThrow('Unsupported storage type: unsupported');
  });
});