/**
 * Local Build Read Tool
 *
 * Read logs and progress from a running local build session.
 * Detects build completion and errors.
 */

import { logger } from '../../../utils/logger.js';
import { sessionManager } from '../core/shell-session-manager.js';
import { logParser } from '../core/log-parser.js';
import { LocalBuildReadResult } from '../types.js';

/**
 * Read logs from running local build
 */
export function readLocalBuildLogs(
  sessionId: string,
  tail: number = 100
): {
  success: boolean;
  data?: LocalBuildReadResult;
  error?: string;
} {
  try {
    logger.debug('Reading local build logs', {
      sessionId,
      tail,
    });

    // Read logs from session
    const result = sessionManager.readOutput(sessionId, tail);

    if (!result.success || !result.logs) {
      logger.error('Failed to read local build logs', {
        sessionId,
        error: result.error,
      });
      return {
        success: false,
        error: result.error || 'Failed to read logs',
      };
    }

    // Convert logs to string array for parsing
    const logLines = result.logs.map((log) => log.raw);

    // Check build completion
    const buildStatus = logParser.isBuildComplete(logLines);

    // Extract errors
    const errors = logParser.extractErrors(logLines);

    // Determine status
    let status: 'building' | 'success' | 'failed' | 'cancelled';
    if (buildStatus.complete) {
      status = buildStatus.success ? 'success' : 'failed';
    } else if (result.status === 'stopped') {
      status = 'cancelled';
    } else {
      status = 'building';
    }

    logger.debug('Successfully read local build logs', {
      sessionId,
      status,
      logCount: logLines.length,
      errorCount: errors.length,
    });

    return {
      success: true,
      data: {
        logs: logLines,
        progress: undefined, // Could be enhanced to detect build progress
        status,
        errors: errors.length > 0 ? errors : undefined,
      },
    };
  } catch (error) {
    logger.error('Error reading local build logs', {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
