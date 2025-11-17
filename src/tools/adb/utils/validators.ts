/**
 * ADB Input Validators
 * Provides validation and sanitization for ADB command inputs
 * Prevents command injection and validates Android-specific formats
 * @module tools/adb/utils/validators
 */

import { ValidationError } from '../../../errors/index.js';

/**
 * Validate Android package name format
 * Must follow reverse domain notation (e.g., com.example.app)
 *
 * @param packageName - The package name to validate
 * @returns The validated package name
 * @throws {ValidationError} If package name is invalid
 */
export function validatePackageName(packageName: string): string {
  if (!packageName || typeof packageName !== 'string') {
    throw new ValidationError('Package name must be a non-empty string');
  }

  // Android package name rules:
  // - Must contain at least one dot
  // - Can only contain letters, numbers, underscores, and dots
  // - Cannot start or end with a dot
  // - Cannot have consecutive dots
  // - Each segment must start with a letter
  const packageNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+$/;

  if (!packageNameRegex.test(packageName)) {
    throw new ValidationError(
      'Invalid package name format. Must follow reverse domain notation (e.g., com.example.app)',
      { packageName }
    );
  }

  // Check for reserved Java keywords in package name segments
  const javaKeywords = [
    'abstract',
    'assert',
    'boolean',
    'break',
    'byte',
    'case',
    'catch',
    'char',
    'class',
    'const',
    'continue',
    'default',
    'do',
    'double',
    'else',
    'enum',
    'extends',
    'final',
    'finally',
    'float',
    'for',
    'goto',
    'if',
    'implements',
    'import',
    'instanceof',
    'int',
    'interface',
    'long',
    'native',
    'new',
    'package',
    'private',
    'protected',
    'public',
    'return',
    'short',
    'static',
    'strictfp',
    'super',
    'switch',
    'synchronized',
    'this',
    'throw',
    'throws',
    'transient',
    'try',
    'void',
    'volatile',
    'while',
  ];

  const segments = packageName.split('.');
  for (const segment of segments) {
    if (javaKeywords.includes(segment.toLowerCase())) {
      throw new ValidationError(`Package name segment "${segment}" is a reserved Java keyword`, {
        packageName,
        invalidSegment: segment,
      });
    }
  }

  return packageName;
}

/**
 * Validate device ID format
 * Device IDs can be serial numbers, emulator names, or IP addresses
 *
 * @param deviceId - The device ID to validate
 * @returns The validated device ID
 * @throws {ValidationError} If device ID is invalid
 */
export function validateDeviceId(deviceId: string): string {
  if (!deviceId || typeof deviceId !== 'string') {
    throw new ValidationError('Device ID must be a non-empty string');
  }

  // Remove whitespace
  const trimmed = deviceId.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('Device ID cannot be empty or only whitespace');
  }

  // Check for command injection attempts
  const dangerousChars = /[;&|`$(){}[\]<>'"\\]/;
  if (dangerousChars.test(trimmed)) {
    throw new ValidationError('Device ID contains invalid characters', {
      deviceId: trimmed,
    });
  }

  return trimmed;
}

/**
 * Validate and sanitize file path for ADB operations
 * Prevents path traversal and command injection
 *
 * @param filePath - The file path to validate
 * @param allowAbsolute - Whether to allow absolute paths (default: true)
 * @returns The validated file path
 * @throws {ValidationError} If file path is invalid
 */
export function validateFilePath(filePath: string, allowAbsolute = true): string {
  if (!filePath || typeof filePath !== 'string') {
    throw new ValidationError('File path must be a non-empty string');
  }

  const trimmed = filePath.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('File path cannot be empty or only whitespace');
  }

  // Check for command injection attempts
  const dangerousChars = /[;&|`$(){}[\]<>'"]/;
  if (dangerousChars.test(trimmed)) {
    throw new ValidationError('File path contains invalid characters', {
      filePath: trimmed,
    });
  }

  // Check for path traversal attempts
  if (trimmed.includes('..')) {
    throw new ValidationError('File path cannot contain parent directory references (..)');
  }

  // Validate absolute path if not allowed
  if (!allowAbsolute && (trimmed.startsWith('/') || /^[a-zA-Z]:/.test(trimmed))) {
    throw new ValidationError('Absolute paths are not allowed', {
      filePath: trimmed,
    });
  }

  return trimmed;
}

/**
 * Validate port number
 *
 * @param port - The port number to validate
 * @returns The validated port number
 * @throws {ValidationError} If port is invalid
 */
export function validatePort(port: number): number {
  if (typeof port !== 'number' || !Number.isInteger(port)) {
    throw new ValidationError('Port must be an integer');
  }

  if (port < 1 || port > 65535) {
    throw new ValidationError('Port must be between 1 and 65535', { port });
  }

  return port;
}

/**
 * Validate ADB shell command
 * Ensures the command is safe to execute and doesn't contain injection attempts
 *
 * @param command - The shell command to validate
 * @param allowedCommands - Optional whitelist of allowed commands
 * @returns The validated command
 * @throws {ValidationError} If command is invalid or not allowed
 */
export function validateShellCommand(command: string, allowedCommands?: string[]): string {
  if (!command || typeof command !== 'string') {
    throw new ValidationError('Shell command must be a non-empty string');
  }

  const trimmed = command.trim();

  if (trimmed.length === 0) {
    throw new ValidationError('Shell command cannot be empty or only whitespace');
  }

  // Extract the base command (first word)
  const baseCommand = trimmed.split(/\s+/)[0];

  // If whitelist provided, check if command is allowed
  if (allowedCommands && allowedCommands.length > 0) {
    if (!allowedCommands.includes(baseCommand)) {
      throw new ValidationError(`Command "${baseCommand}" is not in the allowed list`, {
        command: baseCommand,
        allowedCommands,
      });
    }
  }

  // Check for dangerous patterns
  const dangerousPatterns = [
    /;\s*rm\s+-rf/i, // rm -rf
    /;\s*dd\s+/i, // dd command
    />\s*\/dev\//i, // writing to device files
    /;\s*mkfs/i, // filesystem formatting
    /;\s*:(){ :|:& };:/i, // fork bomb
    /\$\(.*\)/i, // command substitution
    /`.*`/i, // command substitution
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(trimmed)) {
      throw new ValidationError('Shell command contains potentially dangerous patterns', {
        command: trimmed,
      });
    }
  }

  return trimmed;
}

/**
 * Validate timeout value
 *
 * @param timeout - The timeout in milliseconds
 * @param maxTimeout - Maximum allowed timeout (default: 5 minutes)
 * @returns The validated timeout
 * @throws {ValidationError} If timeout is invalid
 */
export function validateTimeout(timeout: number, maxTimeout = 300000): number {
  if (typeof timeout !== 'number' || !Number.isInteger(timeout)) {
    throw new ValidationError('Timeout must be an integer');
  }

  if (timeout < 0) {
    throw new ValidationError('Timeout cannot be negative', { timeout });
  }

  if (timeout > maxTimeout) {
    throw new ValidationError(`Timeout cannot exceed ${maxTimeout}ms`, {
      timeout,
      maxTimeout,
    });
  }

  return timeout;
}

/**
 * Sanitize string for safe use in ADB commands
 * Escapes special shell characters
 *
 * @param input - The string to sanitize
 * @returns The sanitized string
 */
export function sanitizeForShell(input: string): string {
  // Escape special shell characters
  return input
    .replace(/\\/g, '\\\\') // Backslash
    .replace(/"/g, '\\"') // Double quote
    .replace(/'/g, "\\'") // Single quote
    .replace(/\$/g, '\\$') // Dollar sign
    .replace(/`/g, '\\`') // Backtick
    .replace(/!/g, '\\!') // Exclamation mark
    .replace(/\n/g, '\\n') // Newline
    .replace(/\r/g, '\\r'); // Carriage return
}
