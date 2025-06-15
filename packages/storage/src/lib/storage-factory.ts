import { StorageAdapter } from './storage.js';
import { FileStorageAdapter } from './file-adapter.js';
import { MongoDBAdapter } from './mongodb-adapter.js';
import * as os from 'os';
import * as path from 'path';

export type StorageType = 'file' | 'mongodb';

export interface StorageConfig {
  type?: StorageType;
  mongoUri?: string;
  dataDir?: string;
}

export class StorageFactory {
  static create(config?: StorageConfig): StorageAdapter {
    // Default to file storage for zero-setup experience
    const type = config?.type || process.env.CVM_STORAGE_TYPE || 'file';
    
    switch (type) {
      case 'file': {
        const dataDir = config?.dataDir || 
                       process.env.CVM_DATA_DIR || 
                       path.join(os.homedir(), '.cvm');
        return new FileStorageAdapter(dataDir);
      }
      
      case 'mongodb': {
        const mongoUri = config?.mongoUri || 
                        process.env.MONGODB_URI || 
                        'mongodb://localhost:27017/cvm';
        return new MongoDBAdapter(mongoUri);
      }
      
      default:
        throw new Error(`Unsupported storage type: ${type}`);
    }
  }
}