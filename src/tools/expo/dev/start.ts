/**
 * Expo Dev Server Start Tool
 *
 * Starts the Expo development server in a persistent session,
 * extracts QR code and URL, and returns session ID for further interaction.
 */

import { logger } from '../../../utils/logger.js';
import { sessionManager } from '../core/shell-session-manager.js';
import { qrGenerator } from '../core/qr-generator.js';
import { logParser } from '../core/log-parser.js';
import { DevServerConfig, DevServerResult } from '../types.js';
import {
  EXPO_CLI,
  EXPO_COMMAND,
  DEV_SERVER_DEFAULTS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  TIMEOUTS,
} from '../constants.js';

/**
 * Start Expo development server
 */
export async function startDevServer(config: DevServerConfig): Promise<{
  success: boolean;
  data?: DevServerResult;
  error?: string;
}> {
  try {
    const {
      platform = DEV_SERVER_DEFAULTS.PLATFORM,
      clear_cache = DEV_SERVER_DEFAULTS.CLEAR_CACHE,
      port = DEV_SERVER_DEFAULTS.PORT,
      qr_format = DEV_SERVER_DEFAULTS.QR_FORMAT,
      offline = DEV_SERVER_DEFAULTS.OFFLINE,
    } = config;

    logger.info('Starting Expo dev server', {
      platform,
      port,
      clear_cache,
      offline,
    });

    // Build command
    const command = [EXPO_CLI, EXPO_COMMAND, 'start'];

    // Add platform filter if not 'all'
    if (platform !== 'all') {
      command.push(`--${platform}`);
    }

    // Add other options
    if (clear_cache) {
      command.push('--clear');
    }
    if (port) {
      command.push('--port', port.toString());
    }
    if (offline) {
      command.push('--offline');
    }

    // Generate unique session ID
    const sessionId = `expo-dev-${Date.now()}`;

    // Start session
    const sessionResult = sessionManager.startSession(sessionId, command, {
      cwd: process.cwd(),
    });

    if (!sessionResult.success) {
      logger.error('Failed to start dev server session', {
        error: sessionResult.error,
      });
      return {
        success: false,
        error: sessionResult.error || 'Failed to start session',
      };
    }

    logger.info('Dev server session started, waiting for server to be ready', {
      sessionId,
    });

    // Wait for dev server to be ready and extract URL
    const result = await waitForDevServer(sessionId, qr_format);

    if (!result.success) {
      // Stop session on failure
      sessionManager.stopSession(sessionId);
      return result;
    }

    logger.info('Dev server ready', {
      sessionId,
      url: result.data?.url,
    });

    return result;
  } catch (error) {
    logger.error('Error starting dev server', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Wait for dev server to start and extract URL
 */
async function waitForDevServer(
  sessionId: string,
  qrFormat: string
): Promise<{
  success: boolean;
  data?: DevServerResult;
  error?: string;
}> {
  const maxWaitTime = TIMEOUTS.DEV_SERVER_START;
  const checkInterval = 1000; // Check every second
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    // Check session status
    const statusResult = sessionManager.getStatus(sessionId);
    if (!statusResult.success || statusResult.status === 'error') {
      return {
        success: false,
        error: 'Dev server encountered an error',
      };
    }

    // Read recent logs
    const logsResult = sessionManager.readOutput(sessionId, 100);
    if (!logsResult.success || !logsResult.logs) {
      return {
        success: false,
        error: 'Failed to read session logs',
      };
    }

    // Convert logs to string array
    const logLines = logsResult.logs.map((log) => log.message);

    // Check if server is ready
    if (logParser.isDevServerReady(logLines)) {
      // Extract URL from logs
      const url = extractDevServerURL(logLines);

      if (!url) {
        return {
          success: false,
          error: 'Dev server started but URL not found in logs',
        };
      }

      // Generate QR code
      let qrCode = url; // Default to URL
      try {
        const qrResult = await qrGenerator.generate(url, qrFormat as any);
        qrCode = qrGenerator.formatOutput(qrResult);
      } catch (error) {
        logger.warn('Failed to generate QR code, using URL instead', {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return {
        success: true,
        data: {
          session_id: sessionId,
          qr_code: qrCode,
          url,
          status: 'running',
          platform: 'all', // We don't track platform filter in logs
          port: extractPort(url),
        },
      };
    }

    // Wait before next check
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  // Timeout
  return {
    success: false,
    error: ERROR_MESSAGES.COMMAND_TIMEOUT(maxWaitTime),
  };
}

/**
 * Extract dev server URL from logs
 */
function extractDevServerURL(logs: string[]): string | null {
  for (const log of logs) {
    const url = qrGenerator.extractURL(log);
    if (url) {
      return url;
    }
  }
  return null;
}

/**
 * Extract port from URL
 */
function extractPort(url: string): number | undefined {
  const match = url.match(/:(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}
