// Simple timing logger for backend operations
// Logs timestamps with a label; does not log any sensitive data.
// Usage: const logger = require('../utils/timingLogger');
// logger.log('stage', 'message');

const log = (stage, message) => {
  const timestamp = new Date().toISOString();
  console.log(`[Timing] ${timestamp} | ${stage} | ${message}`);
};

module.exports = { log };
