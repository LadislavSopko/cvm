// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from workspace root
dotenv.config({ path: resolve(__dirname, '../../../.env') });

export interface Config {
  storage: {
    type: 'file';
  };
  dataDir: string;
  sandboxPaths: string[];
  logging: {
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  };
  maxInstructions: number;
  env: 'development' | 'production';
}

export function loadConfig(): Config {
  const env = process.env.NODE_ENV || 'development';
  
  // Storage configuration
  const storageType = (process.env.CVM_STORAGE_TYPE || 'file') as Config['storage']['type'];
  const dataDir = process.env.CVM_DATA_DIR || '.cvm';
  const sandboxPaths = sandboxPathsFromEnv();

  // Optional with defaults
  const logLevel = (process.env.CVM_LOG_LEVEL || 'info') as Config['logging']['level'];
  const validLogLevels = ['trace', 'debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(logLevel)) {
    throw new Error(`Invalid CVM_LOG_LEVEL: ${logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
  }

  const maxInstructions = parseInt(process.env.CVM_MAX_INSTRUCTIONS || '10000000', 10);

  return {
    storage: {
      type: storageType,
    },
    dataDir,
    sandboxPaths,
    logging: {
      level: logLevel,
    },
    maxInstructions,
    env: env as Config['env'],
  };
}

function sandboxPathsFromEnv(): string[] {
  const paths = process.env.CVM_SANDBOX_PATHS;
  if (paths) return paths.split(',').map(p => resolve(p.trim()));
  const root = process.env.CVM_SANDBOX_ROOT;
  return [resolve(root || process.cwd())];
}
