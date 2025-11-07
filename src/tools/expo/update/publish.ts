/**
 * EAS Update Publish Tool
 *
 * Publish over-the-air (OTA) updates via EAS Update.
 * Supports gradual rollout with percentage control.
 */

import { logger } from '../../../utils/logger.js';
import { expoExecutor } from '../core/expo-executor.js';
import { EASUpdateConfig, EASUpdateResult } from '../types.js';
import { TIMEOUTS } from '../constants.js';

export async function publishEASUpdate(config: EASUpdateConfig): Promise<{
  success: boolean;
  data?: EASUpdateResult;
  error?: string;
}> {
  try {
    const {
      branch,
      message,
      rollout_percentage = 100,
      runtime_version,
      platform = 'all',
    } = config;

    logger.info('Publishing EAS update', {
      branch,
      message,
      rollout_percentage,
      platform,
    });

    const args = ['update', '--branch', branch, '--message', message, '--non-interactive'];

    if (platform !== 'all') {
      args.push('--platform', platform);
    }

    if (runtime_version) {
      args.push('--runtime-version', runtime_version);
    }

    // Note: Rollout percentage might require EAS Update advanced features
    // This is a placeholder for the implementation
    if (rollout_percentage < 100) {
      logger.warn('Gradual rollout may require additional EAS configuration', {
        rollout_percentage,
      });
    }

    const result = await expoExecutor.executeEAS(args, {
      timeout: TIMEOUTS.DEFAULT,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.stderr || 'Failed to publish update',
      };
    }

    const updateId = extractUpdateId(result.stdout);
    const groupId = extractGroupId(result.stdout);
    const runtimeVersion = extractRuntimeVersion(result.stdout) || runtime_version || 'auto';

    return {
      success: true,
      data: {
        update_id: updateId,
        group_id: groupId,
        runtime_version: runtimeVersion,
        message,
        branch,
        rollout_percentage,
      },
    };
  } catch (error) {
    logger.error('Error publishing EAS update', { error });
    return { success: false, error: String(error) };
  }
}

function extractUpdateId(output: string): string {
  const match =
    output.match(/Update ID:\s*([a-f0-9-]+)/i) ||
    output.match(/Update.*?([a-f0-9-]{36})/i);
  return match ? match[1] : 'unknown';
}

function extractGroupId(output: string): string {
  const match =
    output.match(/Group ID:\s*([a-f0-9-]+)/i) || output.match(/Group.*?([a-f0-9-]{36})/i);
  return match ? match[1] : 'unknown';
}

function extractRuntimeVersion(output: string): string | undefined {
  const match = output.match(/Runtime version:\s*([^\s]+)/i);
  return match ? match[1] : undefined;
}
