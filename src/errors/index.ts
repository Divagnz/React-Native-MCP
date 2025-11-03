/**
 * Custom error types for the React Native MCP Server
 * Provides structured error handling with codes and details
 */

/**
 * Base MCP error class
 * All custom errors extend from this class
 */
export class MCPError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'MCPError';
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON format for structured logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      details: this.details,
      stack: this.stack,
    };
  }
}

/**
 * Validation error - thrown when input validation fails
 */
export class ValidationError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Code analysis error - thrown during code analysis operations
 */
export class CodeAnalysisError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'CODE_ANALYSIS_ERROR', details);
    this.name = 'CodeAnalysisError';
  }
}

/**
 * File system error - thrown during file operations
 */
export class FileSystemError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'FILE_SYSTEM_ERROR', details);
    this.name = 'FileSystemError';
  }
}

/**
 * Package management error - thrown during package operations
 */
export class PackageManagementError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'PACKAGE_MANAGEMENT_ERROR', details);
    this.name = 'PackageManagementError';
  }
}

/**
 * Test generation error - thrown during test generation
 */
export class TestGenerationError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'TEST_GENERATION_ERROR', details);
    this.name = 'TestGenerationError';
  }
}

/**
 * Configuration error - thrown when configuration is invalid
 */
export class ConfigurationError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFIGURATION_ERROR', details);
    this.name = 'ConfigurationError';
  }
}

/**
 * Network error - thrown during network operations
 */
export class NetworkError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

/**
 * Timeout error - thrown when an operation times out
 */
export class TimeoutError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'TIMEOUT_ERROR', details);
    this.name = 'TimeoutError';
  }
}

/**
 * Not found error - thrown when a resource is not found
 */
export class NotFoundError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'NOT_FOUND_ERROR', details);
    this.name = 'NotFoundError';
  }
}

/**
 * Permission error - thrown when permission is denied
 */
export class PermissionError extends MCPError {
  constructor(message: string, details?: unknown) {
    super(message, 'PERMISSION_ERROR', details);
    this.name = 'PermissionError';
  }
}

/**
 * Error handling wrapper utility
 * Wraps async operations with standardized error handling
 *
 * @param operation - The async operation to execute
 * @param errorContext - Context string for error messages
 * @returns The result of the operation
 * @throws MCPError with proper context
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  errorContext: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    // If it's already an MCPError, just rethrow it
    if (error instanceof MCPError) {
      // Log to file (lazy import to avoid circular dependencies)
      const { logger } = await import('../utils/logger.js');
      logger.error(`Error in ${errorContext}`, {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      throw error;
    }

    // Log the original error to file for debugging
    const { logger } = await import('../utils/logger.js');
    logger.error(`Error in ${errorContext}`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Wrap unknown errors in MCPError
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new MCPError(
      `Failed to ${errorContext}: ${errorMessage}`,
      'UNKNOWN_ERROR',
      {
        originalError: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      }
    );
  }
}

/**
 * Synchronous error handling wrapper
 * Wraps sync operations with standardized error handling
 *
 * @param operation - The sync operation to execute
 * @param errorContext - Context string for error messages
 * @returns The result of the operation
 * @throws MCPError with proper context
 */
export function withErrorHandlingSync<T>(
  operation: () => T,
  errorContext: string
): T {
  try {
    return operation();
  } catch (error) {
    // If it's already an MCPError, just rethrow it
    if (error instanceof MCPError) {
      // Log to file (dynamic import for sync context)
      import('../utils/logger.js').then(({ logger }) => {
        logger.error(`Error in ${errorContext}`, {
          code: error.code,
          message: error.message,
          details: error.details,
        });
      });
      throw error;
    }

    // Log the original error to file for debugging
    import('../utils/logger.js').then(({ logger }) => {
      logger.error(`Error in ${errorContext}`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
    });

    // Wrap unknown errors in MCPError
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new MCPError(
      `Failed to ${errorContext}: ${errorMessage}`,
      'UNKNOWN_ERROR',
      {
        originalError: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      }
    );
  }
}

/**
 * Type guard to check if an error is an MCPError
 */
export function isMCPError(error: unknown): error is MCPError {
  return error instanceof MCPError;
}

/**
 * Type guard to check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Get error details as a formatted string
 */
export function formatErrorDetails(error: unknown): string {
  if (isMCPError(error)) {
    return JSON.stringify(error.toJSON(), null, 2);
  }

  if (error instanceof Error) {
    return `${error.name}: ${error.message}\n${error.stack || ''}`;
  }

  return String(error);
}
