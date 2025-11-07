/**
 * EAS Submit Tool
 *
 * Submit builds to app stores (App Store, Play Store).
 */

import { logger } from '../../../utils/logger.js';
import { expoExecutor } from '../core/expo-executor.js';
import { EASSubmitConfig, EASSubmitResult } from '../types.js';
import { TIMEOUTS } from '../constants.js';

export async function submitToStore(config: EASSubmitConfig): Promise<{
  success: boolean;
  data?: EASSubmitResult;
  error?: string;
}> {
  try {
    const { platform, build_id, profile = 'production', latest = false } = config;

    logger.info('Submitting to store', { platform, build_id, profile, latest });

    const args = ['submit', '--platform', platform, '--profile', profile, '--non-interactive'];

    if (latest) {
      args.push('--latest');
    } else if (build_id) {
      args.push('--id', build_id);
    } else {
      return { success: false, error: 'Either build_id or latest must be specified' };
    }

    const result = await expoExecutor.executeEAS(args, {
      timeout: TIMEOUTS.DEFAULT,
    });

    if (!result.success) {
      return { success: false, error: result.stderr || 'Submission failed' };
    }

    const submissionId = extractSubmissionId(result.stdout);

    return {
      success: true,
      data: {
        submission_id: submissionId,
        status: 'submitted',
        message: `Successfully submitted to ${platform} store`,
        platform,
      },
    };
  } catch (error) {
    logger.error('Error submitting to store', { error });
    return { success: false, error: String(error) };
  }
}

function extractSubmissionId(output: string): string {
  const match = output.match(/Submission ID:\s*([a-f0-9-]+)/i) || output.match(/([a-f0-9-]{36})/);
  return match ? match[1] : 'unknown';
}
