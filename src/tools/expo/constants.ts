/**
 * Expo Tools Constants
 *
 * Configuration constants and defaults for Expo CLI integration
 */

// ============================================================================
// Command Constants
// ============================================================================

export const EXPO_CLI = 'npx';
export const EXPO_COMMAND = 'expo';
export const EAS_COMMAND = 'eas';

// ============================================================================
// Timeout Constants (milliseconds)
// ============================================================================

export const TIMEOUTS = {
  DEFAULT: 30000, // 30 seconds
  DEV_SERVER_START: 60000, // 60 seconds
  BUILD_LOCAL: 1800000, // 30 minutes
  BUILD_CLOUD: 3600000, // 1 hour (if wait=true)
  INSTALL: 300000, // 5 minutes
  UPGRADE: 600000, // 10 minutes
} as const;

// ============================================================================
// Session Management Constants
// ============================================================================

export const MAX_LOG_BUFFER_SIZE = 1000; // Keep last 1000 lines
export const LOG_TRIM_SIZE = 800; // Trim to this when max exceeded

// ============================================================================
// Dev Server Constants
// ============================================================================

export const DEV_SERVER_DEFAULTS = {
  PORT: 19000,
  PLATFORM: 'all' as const,
  QR_FORMAT: 'terminal' as const,
  CLEAR_CACHE: false,
  OFFLINE: false,
} as const;

// Keyboard commands for Expo dev server
export const DEV_COMMANDS = {
  reload: 'r',
  clear_cache: 'shift+r',
  toggle_inspector: 'i',
  toggle_performance_monitor: 'perf',
  open_ios: 'shift+i',
  open_android: 'shift+a',
  open_web: 'w',
} as const;

// ============================================================================
// Build Constants
// ============================================================================

export const BUILD_PROFILES = {
  DEVELOPMENT: 'development',
  PREVIEW: 'preview',
  PRODUCTION: 'production',
} as const;

export const BUILD_PLATFORMS = ['ios', 'android', 'all'] as const;

export const BUILD_VARIANTS = ['debug', 'release'] as const;

// ============================================================================
// Security: Command Sanitization
// ============================================================================

// Characters to remove from user input to prevent command injection
export const DANGEROUS_CHARS = /[;|&`()<>$\n\r]/g;

// Allowed characters for package names
export const PACKAGE_NAME_REGEX = /^[@a-z0-9\-_/]+$/i;

// ============================================================================
// URL Patterns
// ============================================================================

export const URL_PATTERNS = {
  EXPO_DEV: /exp:\/\/[\d.]+:\d+/,
  METRO: /http:\/\/[\d.]+:\d+/,
  QR_CODE: /█/,
} as const;

// ============================================================================
// Log Patterns
// ============================================================================

export const LOG_PATTERNS = {
  METRO_BUNDLING: /Bundling \d+.\d+%/,
  METRO_COMPLETE: /Bundling complete/,
  EXPO_READY: /Metro.*waiting on/,
  EXPO_URL: /(exp:\/\/[^\s]+)/,
  METRO_URL: /(http:\/\/[^\s]+)/,
  QR_START: /│\s*█/,
  ERROR: /error/i,
  WARNING: /warning|warn/i,
  BUILD_PROGRESS: /\[\d+\/\d+\]/,
  XCODE_PROGRESS: /▸\s*(.*)/,
  GRADLE_PROGRESS: />.*CONFIGURE|BUILD/,
} as const;

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  SESSION_NOT_FOUND: (id: string) => `Session not found: ${id}`,
  SESSION_NOT_RUNNING: (id: string) => `Session is not running: ${id}`,
  SESSION_ALREADY_EXISTS: (id: string) => `Session already exists: ${id}`,
  COMMAND_TIMEOUT: (timeout: number) => `Command timed out after ${timeout}ms`,
  INVALID_PACKAGE_NAME: (name: string) => `Invalid package name: ${name}`,
  INVALID_PLATFORM: (platform: string) => `Invalid platform: ${platform}`,
  EXPO_NOT_INSTALLED: 'Expo CLI is not installed. Run: npm install -g expo-cli',
  EAS_NOT_INSTALLED: 'EAS CLI is not installed. Run: npm install -g eas-cli',
  NOT_EXPO_PROJECT: 'Not an Expo project. Run: expo init',
  BUILD_FAILED: 'Build failed. Check logs for details.',
  NETWORK_ERROR: 'Network error. Check your internet connection.',
} as const;

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  DEV_SERVER_STARTED: 'Development server started successfully',
  DEV_SERVER_STOPPED: 'Development server stopped',
  COMMAND_SENT: 'Command sent to dev server',
  BUILD_STARTED: 'Build started successfully',
  BUILD_CANCELLED: 'Build cancelled',
  INSTALL_COMPLETE: 'Packages installed successfully',
  UPGRADE_COMPLETE: 'Upgrade completed successfully',
  UPDATE_PUBLISHED: 'OTA update published successfully',
} as const;

// ============================================================================
// Environment Variables
// ============================================================================

export const ENV_VARS = {
  EXPO_TOKEN: 'EXPO_TOKEN',
  EAS_TOKEN: 'EAS_TOKEN',
  EXPO_NO_TELEMETRY: 'EXPO_NO_TELEMETRY',
  EXPO_NO_REDIRECT: 'EXPO_NO_REDIRECT',
} as const;

// ============================================================================
// QR Code Options
// ============================================================================

export const QR_OPTIONS = {
  ERROR_CORRECTION: 'M' as const,
  TYPE: 'terminal' as const,
  SMALL: true,
  MARGIN: 1,
  WIDTH: 256, // For PNG generation
} as const;
