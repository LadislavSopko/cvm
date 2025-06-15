// Copyright 2024 Ladislav Sopko
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from workspace root
dotenv.config({ path: resolve(__dirname, '../../../.env') });

export interface Config {
  storage: {
    type: 'file' | 'mongodb';
    mongoUri?: string;
    dataDir?: string;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
  };
  execution: {
    maxExecutionTime: number;
    maxStackSize: number;
    maxOutputSize: number;
  };
  env: 'development' | 'production';
  // Feature: API port configuration (future enhancement)
  // api?: {
  //   port: number;
  //   host: string;
  // };
}

export function loadConfig(): Config {
  const env = process.env.NODE_ENV || 'development';
  
  // Storage configuration
  const storageType = (process.env.CVM_STORAGE_TYPE || 'file') as 'file' | 'mongodb';
  const mongoUri = process.env.MONGODB_URI;
  const dataDir = process.env.CVM_DATA_DIR;
  
  // Validate storage configuration
  if (storageType === 'mongodb' && !mongoUri) {
    throw new Error('MONGODB_URI environment variable is required when CVM_STORAGE_TYPE is mongodb');
  }

  // Optional with defaults
  const logLevel = (process.env.CVM_LOG_LEVEL || 'info') as Config['logging']['level'];
  const validLogLevels = ['debug', 'info', 'warn', 'error'];
  if (!validLogLevels.includes(logLevel)) {
    throw new Error(`Invalid CVM_LOG_LEVEL: ${logLevel}. Must be one of: ${validLogLevels.join(', ')}`);
  }

  const maxExecutionTime = parseInt(process.env.CVM_MAX_EXECUTION_TIME || '300000', 10); // 5 minutes default
  const maxStackSize = parseInt(process.env.CVM_MAX_STACK_SIZE || '1000', 10);
  const maxOutputSize = parseInt(process.env.CVM_MAX_OUTPUT_SIZE || '1048576', 10); // 1MB default

  return {
    storage: {
      type: storageType,
      mongoUri,
      dataDir,
    },
    logging: {
      level: logLevel,
    },
    execution: {
      maxExecutionTime,
      maxStackSize,
      maxOutputSize,
    },
    env: env as Config['env'],
  };
}