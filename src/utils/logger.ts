import winston from "winston";

/**
 * Configure Winston logger with custom format and transports
 * Implements production-ready logging with:
 * - Separate error and combined log files
 * - JSON formatting for file logs
 * - Colorized console output in development
 * - Timestamp and log level information
 * - Custom metadata handling
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "mearth-game" },
  transports: [
    // Write all error logs to error.log
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
  exitOnError: false,
});

// Add console transport in development
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export { logger };

// Commit message:
// feat(logging): Implement production-ready Winston logger
// - Add separate error and combined log files
// - Add exception and rejection handling
// - Add development console output with colors
// - Add timestamp and service metadata
// - Configure max file sizes and rotation
