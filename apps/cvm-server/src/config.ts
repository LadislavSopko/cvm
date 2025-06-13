import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from workspace root
dotenv.config({ path: resolve(__dirname, '../../../.env') });

export interface Config {
  mongodb: {
    uri: string;
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
}

export function loadConfig(): Config {
  const env = process.env.NODE_ENV || 'development';
  
  // Required environment variables
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is required');
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
    mongodb: {
      uri: mongoUri,
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