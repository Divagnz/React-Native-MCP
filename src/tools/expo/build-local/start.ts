/**
 * Local Build Start Tool
 *
 * Starts a local Expo build (expo run:ios or expo run:android) in a persistent session.
 * These are interactive builds that compile natively on the local machine.
 */

import { logger } from '../../../utils/logger.js';
import { sessionManager } from '../core/shell-session-manager.js';
import { LocalBuildConfig, LocalBuildResult } from '../types.js';
import { EXPO_CLI, EXPO_COMMAND, SUCCESS_MESSAGES } from '../constants.js';

/**
 * Start local build
 */
export function startLocalBuild(config: LocalBuildConfig): {
  success: boolean;
  data?: LocalBuildResult;
  error?: string;
} {
  try {
    const { platform, device, variant = 'debug', clean = false } = config;

    logger.info('Starting local build', {
      platform,
      device,
      variant,
      clean,
    });

    // Build command
    const command = [EXPO_CLI, EXPO_COMMAND, `run:${platform}`];

    // Add device/simulator option
    if (device) {
      command.push('--device', device);
    }

    // Add variant
    if (variant === 'release') {
      command.push('--variant', 'release');
    }

    // Add clean flag
    if (clean) {
      command.push('--clear');
    }

    // Generate unique session ID
    const sessionId = `expo-build-${platform}-${Date.now()}`;

    logger.info('Starting local build session', {
      sessionId,
      command: command.join(' '),
    });

    // Start session
    const sessionResult = sessionManager.startSession(sessionId, command, {
      cwd: process.cwd(),
    });

    if (!sessionResult.success) {
      logger.error('Failed to start local build session', {
        error: sessionResult.error,
      });
      return {
        success: false,
        error: sessionResult.error || 'Failed to start build session',
      };
    }

    logger.info('Local build session started', { sessionId });

    return {
      success: true,
      data: {
        session_id: sessionId,
        status: 'building',
        message: `${SUCCESS_MESSAGES.BUILD_STARTED} for ${platform}`,
        platform,
      },
    };
  } catch (error) {
    logger.error('Error starting local build', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
