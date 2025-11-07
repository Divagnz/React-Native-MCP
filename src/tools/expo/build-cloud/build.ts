/**
 * EAS Build Tool
 *
 * Trigger cloud builds via EAS (Expo Application Services).
 * Supports optional waiting for build completion.
 */

import { logger } from '../../../utils/logger.js';
import { expoExecutor } from '../core/expo-executor.js';
import { EASBuildConfig, EASBuildResult } from '../types.js';
import { TIMEOUTS, SUCCESS_MESSAGES } from '../constants.js';

export async function triggerEASBuild(config: EASBuildConfig): Promise<{
  success: boolean;
  data?: EASBuildResult;
  error?: string;
}> {
  try {
    const {
      platform,
      profile = 'production',
      wait = false,
      non_interactive = true,
      clear_cache = false,
    } = config;

    logger.info('Triggering EAS build', { platform, profile, wait });

    const args = ['build', '--platform', platform, '--profile', profile];

    if (non_interactive) args.push('--non-interactive');
    if (clear_cache) args.push('--clear-cache');
    if (wait) args.push('--wait');

    const timeout = wait ? TIMEOUTS.BUILD_CLOUD : TIMEOUTS.DEFAULT;
    const result = await expoExecutor.executeEAS(args, { timeout });

    if (!result.success) {
      return { success: false, error: result.stderr || 'Build failed' };
    }

    const buildId = extractBuildId(result.stdout);
    const url = extractBuildURL(result.stdout);

    return {
      success: true,
      data: {
        build_id: buildId,
        status: wait ? 'finished' : 'pending',
        url: url || 'https://expo.dev/accounts',
        logs_url: url,
        platform,
      },
    };
  } catch (error) {
    logger.error('Error triggering EAS build', { error });
    return { success: false, error: String(error) };
  }
}

function extractBuildId(output: string): string {
  const match = output.match(/Build ID:\s*([a-f0-9-]+)/i) || output.match(/([a-f0-9-]{36})/);
  return match ? match[1] : 'unknown';
}

function extractBuildURL(output: string): string | undefined {
  const match = output.match(/https:\/\/expo\.dev\/[^\s]+/);
  return match ? match[0] : undefined;
}
