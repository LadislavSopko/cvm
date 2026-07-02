// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import { StorageAdapter } from './storage.js';
import { FileStorageAdapter } from './file-adapter.js';

export type StorageType = 'file';

export interface StorageConfig {
  type?: StorageType;
  dataDir?: string;
}

export class StorageFactory {
  static create(config?: StorageConfig): StorageAdapter {
    // Default to file storage for zero-setup experience
    const type = config?.type || process.env['CVM_STORAGE_TYPE'] || 'file';

    if (type === 'file') {
      const dataDir = config?.dataDir || process.env['CVM_DATA_DIR'] || '.cvm';
      return new FileStorageAdapter(dataDir);
    }

    if (type === 'mongodb') {
      throw new Error(
        'MongoDB storage was removed in cvm-server v2.0.0. ' +
        'Unset CVM_STORAGE_TYPE (or set it to "file") to use file storage.'
      );
    }

    throw new Error(`Unsupported storage type: ${type}. Only "file" is supported.`);
  }
}
