const pino = require('pino');
const fs = require('fs');
const path = require('path');

let _logger: any = null;

function getLogger() {
  if (!_logger) {
    
    const logLevel = process.env.CVM_LOG_LEVEL || 'info';
    const logFile = process.env.CVM_LOG_FILE || '.cvm/cvm-debug.log';
    

    // Ensure log directory exists in production
    let destination;
    try {
      const logDir = path.dirname(logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      destination = pino.destination(logFile);
    } catch (error) {
      // Fallback to stdout if file system access fails (e.g., in test environments)
      destination = process.stdout;
    }

    _logger = pino({
      level: logLevel,
    }, destination);
    
    _logger.info("LogLevel: " + logLevel)

  }
  return _logger;
}

// Proxy object that forwards all calls to the lazy-initialized logger
const logger = new Proxy({} as any, {
  get(_target, prop) {
    return getLogger()[prop];
  }
}) as any;

export default logger;