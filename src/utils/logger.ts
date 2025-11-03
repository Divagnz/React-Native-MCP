/**
 * File-based logging infrastructure for MCP Server
 *
 * IMPORTANT: MCP servers use stdio for JSON-RPC communication.
 * Console.log/error interferes with the protocol, so we log ONLY to files.
 */

import winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log level from environment or default to 'info'
const logLevel = process.env.MCP_LOG_LEVEL || 'info';

// Create log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Main logger instance
 * Logs to files only - NO console output to avoid MCP protocol interference
 */
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports: [
    // Error log - only errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log - all levels
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
    // Debug log - debug and above (optional, only if MCP_LOG_LEVEL=debug)
    ...(logLevel === 'debug'
      ? [
          new winston.transports.File({
            filename: path.join(logsDir, 'debug.log'),
            level: 'debug',
            maxsize: 10485760, // 10MB
            maxFiles: 3,
          }),
        ]
      : []),
  ],
  // Prevent Winston from exiting on error
  exitOnError: false,
});

/**
 * Log tool invocation with timing
 */
export function logToolInvocation(
  toolName: string,
  args: unknown,
  duration?: number
): void {
  logger.info('Tool invoked', {
    tool: toolName,
    args: sanitizeArgs(args),
    duration: duration ? `${duration.toFixed(2)}ms` : undefined,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log tool success
 */
export function logToolSuccess(
  toolName: string,
  duration: number,
  resultSize?: number
): void {
  logger.info('Tool completed successfully', {
    tool: toolName,
    duration: `${duration.toFixed(2)}ms`,
    resultSize,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log tool failure
 */
export function logToolFailure(
  toolName: string,
  error: Error,
  duration?: number
): void {
  logger.error('Tool failed', {
    tool: toolName,
    error: error.message,
    errorName: error.name,
    stack: error.stack,
    duration: duration ? `${duration.toFixed(2)}ms` : undefined,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log validation error
 */
export function logValidationError(
  context: string,
  error: string,
  details?: unknown
): void {
  logger.warn('Validation error', {
    context,
    error,
    details: sanitizeArgs(details),
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log file system operation
 */
export function logFileOperation(
  operation: string,
  filePath: string,
  success: boolean,
  error?: string
): void {
  const level = success ? 'debug' : 'error';
  logger.log(level, 'File operation', {
    operation,
    filePath,
    success,
    error,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log performance metric
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  logger.debug('Performance metric', {
    operation,
    duration: `${duration.toFixed(2)}ms`,
    ...metadata,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log server startup
 */
export function logServerStartup(version: string, config?: Record<string, unknown>): void {
  logger.info('MCP Server starting', {
    version,
    config: sanitizeArgs(config),
    nodeVersion: process.version,
    platform: process.platform,
    logLevel,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log server shutdown
 */
export function logServerShutdown(reason?: string): void {
  logger.info('MCP Server shutting down', {
    reason,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Sanitize arguments to prevent logging sensitive data
 * Removes potential secrets, tokens, and large data structures
 */
function sanitizeArgs(args: unknown): unknown {
  if (args === null || args === undefined) {
    return args;
  }

  if (typeof args === 'string') {
    // Truncate very long strings
    if (args.length > 1000) {
      return args.substring(0, 1000) + '... [truncated]';
    }
    // Redact potential secrets
    if (
      args.includes('token') ||
      args.includes('password') ||
      args.includes('secret') ||
      args.includes('api_key')
    ) {
      return '[REDACTED - contains sensitive keywords]';
    }
    return args;
  }

  if (typeof args === 'object') {
    if (Array.isArray(args)) {
      // Truncate large arrays
      if (args.length > 10) {
        return args.slice(0, 10).map(sanitizeArgs).concat(['... [truncated]']);
      }
      return args.map(sanitizeArgs);
    }

    // Sanitize object properties
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      const lowerKey = key.toLowerCase();
      // Redact sensitive keys
      if (
        lowerKey.includes('token') ||
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('api_key') ||
        lowerKey.includes('credential')
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = value.substring(0, 1000) + '... [truncated]';
      } else {
        sanitized[key] = sanitizeArgs(value);
      }
    }
    return sanitized;
  }

  return args;
}

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: Record<string, unknown>): winston.Logger {
  return logger.child(context);
}

/**
 * Flush all pending log writes
 * Useful before process exit
 */
export async function flushLogs(): Promise<void> {
  return new Promise((resolve) => {
    logger.on('finish', resolve);
    logger.end();
  });
}

export default logger;
