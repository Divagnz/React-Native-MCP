/**
 * Local Build Stop Tool
 *
 * Stop a running local build session (cancel the build).
 */

import { logger } from '../../../utils/logger.js';
import { sessionManager } from '../core/shell-session-manager.js';
import { SUCCESS_MESSAGES } from '../constants.js';

/**
 * Stop running local build
 */
export function stopLocalBuild(sessionId: string): {
  success: boolean;
  message?: string;
  error?: string;
} {
  try {
    logger.info('Stopping local build', { sessionId });

    const result = sessionManager.stopSession(sessionId);

    if (!result.success) {
      logger.error('Failed to stop local build', {
        sessionId,
        error: result.error,
      });
      return {
        success: false,
        error: result.error,
      };
    }

    logger.info('Local build stopped successfully', { sessionId });

    return {
      success: true,
      message: SUCCESS_MESSAGES.BUILD_CANCELLED,
    };
  } catch (error) {
    logger.error('Error stopping local build', {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
