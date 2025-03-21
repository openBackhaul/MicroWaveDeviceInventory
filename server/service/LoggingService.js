const pino = require('pino');
const path = require("path");

// configuration for pino with pretty console output and logfile output
const transports = pino.transport({
  targets: [
    {
      level: 'info',
      target: 'pino-pretty',
      options: { colorize: true }
    },
    {
      level: 'info',
      target: 'pino-roll',
      options: { file: path.join(__dirname, '../logs/MicroWaveDeviceInventory'), extension: '.log', mkdir: true,
        frequency: 'daily', dateFormat: 'yyyy-MM-dd', size: "1m", "limit.count": 15 }
    }
  ]
});

// create pino logger instance
const logger = pino({level: 'trace'}, transports);

exports.getLogger = function getLogger() {
  return logger;
};
