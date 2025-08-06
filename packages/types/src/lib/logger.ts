const pino = require('pino');

const logLevel = process.env.CVM_LOG_LEVEL || 'info';
const logFile = process.env.CVM_LOG_FILE || '.cvm/cvm-debug.log';

const logger = pino({
  level: logLevel,
}, pino.destination(logFile));

export default logger;