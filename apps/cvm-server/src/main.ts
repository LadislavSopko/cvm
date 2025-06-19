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

import { CVMMcpServer } from '@cvm/mcp-server';
import { loadConfig } from './config.js';
import { initLogger, getLogger } from './logger.js';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  let cvmServer: CVMMcpServer | undefined;
  
  try {
    // Load configuration
    const config = loadConfig();
    
    // Initialize logger
    initLogger(config.logging.level);
    const logger = getLogger();
    
    // Get version - try multiple locations for different deployment scenarios
    let version = '0.4.3'; // Fallback version
    const possiblePaths = [
      join(__dirname, '..', 'package.json'), // Development
      join(__dirname, 'package.json'),       // Bundled dist
      join(process.cwd(), 'package.json')    // Current directory
    ];
    
    for (const packageJsonPath of possiblePaths) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.name === 'cvm-server' && packageJson.version) {
          version = packageJson.version;
          break;
        }
      } catch (e) {
        // Try next path
      }
    }
    
    logger.info('Starting CVM Server...', {
      env: config.env,
      logLevel: config.logging.level,
      version,
    });
    
    // Log storage configuration
    if (config.storage.type === 'file') {
      const dataDir = config.storage.dataDir || '.cvm';
      const fullPath = resolve(process.cwd(), dataDir);
      logger.info(`[CVM] Initializing file storage in: ${fullPath}`);
      logger.warn(`[CVM] ⚠️  Remember to add '${dataDir}/' to your .gitignore file!`);
    } else {
      logger.info('[CVM] Using MongoDB storage');
    }
    
    // Create CVM MCP server instance (it creates its own VMManager internally)
    cvmServer = new CVMMcpServer(version);
    
    // Start the server (initializes VMManager and sets up stdio transport)
    await cvmServer.start();
    logger.info('CVM Server is running and ready to accept MCP connections');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await shutdown();
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await shutdown();
    });
    
    // The server is now running and handling MCP requests via stdio
    
  } catch (error) {
    // Use console.error in case logger isn't initialized yet
    console.error('Fatal error starting CVM Server:', error);
    process.exit(1);
  }
  
  async function shutdown() {
    const logger = getLogger();
    try {
      logger.info('Closing connections...');
      
      if (cvmServer) {
        await cvmServer.stop();
      }
      
      logger.info('Shutdown complete');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }
}

// Start the server
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});