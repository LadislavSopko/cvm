// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2025-2026 Ladislav Sopko

import { CVMMcpServer } from '@cvm/mcp-server';
import { loadConfig } from './config.js';
import { logger } from '@cvm/types';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  logger.info("CVM Server main() function started");
  logger.debug("Debugging: main() function entry point");
  let cvmServer: CVMMcpServer | undefined;
  
  try {
    // Load configuration
    const config = loadConfig();
    
    // Logger is already initialized in types package
    
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
    logger.error({ err: error }, 'Fatal error starting CVM Server');
    process.exit(1);
  }
  
  async function shutdown() {
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
  logger.error({ err: error }, 'Unhandled error in main()');
  process.exit(1);
});