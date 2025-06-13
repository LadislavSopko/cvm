import { CVMMcpServer } from '@cvm/mcp-server';
import { loadConfig } from './config.js';
import { initLogger, getLogger } from './logger.js';

async function main() {
  let cvmServer: CVMMcpServer | undefined;
  
  try {
    // Load configuration
    const config = loadConfig();
    
    // Initialize logger
    initLogger(config.logging.level);
    const logger = getLogger();
    
    logger.info('Starting CVM Server...', {
      env: config.env,
      logLevel: config.logging.level,
    });
    
    // Create CVM MCP server instance (it creates its own VMManager internally)
    cvmServer = new CVMMcpServer();
    
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