/**
 * Expo Dev Server Stop Tool
 *
 * Stop a running Expo development server session gracefully.
 */

import { logger } from '../../../utils/logger.js';
import { sessionManager } from '../core/shell-session-manager.js';
import { SUCCESS_MESSAGES } from '../constants.js';

/**
 * Stop running dev server
 */
export function stopDevServer(sessionId: string): {
  success: boolean;
  message?: string;
  error?: string;
} {
  try {
    logger.info('Stopping dev server', { sessionId });

    const result = sessionManager.stopSession(sessionId);

    if (!result.success) {
      logger.error('Failed to stop dev server', {
        sessionId,
        error: result.error,
      });
      return {
        success: false,
        error: result.error,
      };
    }

    logger.info('Dev server stopped successfully', { sessionId });

    return {
      success: true,
      message: SUCCESS_MESSAGES.DEV_SERVER_STOPPED,
    };
  } catch (error) {
    logger.error('Error stopping dev server', {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
