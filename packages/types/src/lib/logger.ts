const pino = require('pino');
const fs = require('fs');
const path = require('path');

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

const logger = pino({
  level: logLevel,
}, destination);

export default logger;