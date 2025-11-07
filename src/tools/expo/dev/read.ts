/**
 * Expo Dev Server Read Tool
 *
 * Read logs from a running Expo development server session.
 * Provides tail functionality to get recent logs.
 */

import { logger } from '../../../utils/logger.js';
import { sessionManager } from '../core/shell-session-manager.js';
import { logParser } from '../core/log-parser.js';
import { DevReadInput, DevReadResult } from '../types.js';

/**
 * Read logs from running dev server
 */
export function readDevLogs(input: DevReadInput): {
  success: boolean;
  data?: DevReadResult;
  error?: string;
} {
  try {
    const { session_id, tail = 50 } = input;

    logger.debug('Reading dev server logs', {
      sessionId: session_id,
      tail,
    });

    // Read logs from session
    const result = sessionManager.readOutput(session_id, tail);

    if (!result.success || !result.logs || !result.status) {
      logger.error('Failed to read dev server logs', {
        sessionId: session_id,
        error: result.error,
      });
      return {
        success: false,
        error: result.error || 'Failed to read logs',
      };
    }

    logger.debug('Successfully read dev server logs', {
      sessionId: session_id,
      logCount: result.logs.length,
    });

    return {
      success: true,
      data: {
        logs: result.logs,
        status: result.status,
        total_lines: result.logs.length,
      },
    };
  } catch (error) {
    logger.error('Error reading dev server logs', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
