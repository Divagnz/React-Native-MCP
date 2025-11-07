/**
 * Expo Dev Server Send Tool
 *
 * Send commands to a running Expo development server via stdin.
 * Supports predefined commands (reload, clear cache, etc.) and custom input.
 */

import { logger } from '../../../utils/logger.js';
import { sessionManager } from '../core/shell-session-manager.js';
import { DevCommandInput } from '../types.js';
import { DEV_COMMANDS, SUCCESS_MESSAGES } from '../constants.js';

/**
 * Send command to running dev server
 */
export function sendDevCommand(input: DevCommandInput): {
  success: boolean;
  message?: string;
  error?: string;
} {
  try {
    const { session_id, command, custom_input } = input;

    logger.info('Sending command to dev server', {
      sessionId: session_id,
      command,
    });

    // Get the actual input to send
    let inputToSend: string;

    if (command === 'custom') {
      if (!custom_input) {
        return {
          success: false,
          error: 'custom_input required when command is "custom"',
        };
      }
      inputToSend = custom_input;
    } else {
      // Map command to keyboard input
      const mappedInput = DEV_COMMANDS[command as keyof typeof DEV_COMMANDS];
      if (!mappedInput) {
        return {
          success: false,
          error: `Unknown command: ${command}`,
        };
      }
      inputToSend = mappedInput;
    }

    // Send input to session
    const result = sessionManager.sendInput(session_id, inputToSend);

    if (!result.success) {
      logger.error('Failed to send command to dev server', {
        sessionId: session_id,
        error: result.error,
      });
      return {
        success: false,
        error: result.error,
      };
    }

    logger.info('Command sent successfully', {
      sessionId: session_id,
      command,
    });

    return {
      success: true,
      message: `${SUCCESS_MESSAGES.COMMAND_SENT}: ${command}`,
    };
  } catch (error) {
    logger.error('Error sending command to dev server', {
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
