/**
 * EAS Update Status Tool
 *
 * Check status and deployment information for published OTA updates.
 */

import { logger } from '../../../utils/logger.js';
import { expoExecutor } from '../core/expo-executor.js';
import { EASUpdateStatusResult, UpdateInfo } from '../types.js';

export async function getEASUpdateStatus(
  branch?: string,
  limit: number = 10
): Promise<{
  success: boolean;
  data?: EASUpdateStatusResult;
  error?: string;
}> {
  try {
    logger.info('Getting EAS update status', { branch, limit });

    const args = ['update:list', `--limit=${limit}`, '--json'];
    if (branch) {
      args.push('--branch', branch);
    }

    const result = await expoExecutor.executeEAS(args);

    if (!result.success) {
      return {
        success: false,
        error: result.stderr || 'Failed to get update status',
      };
    }

    const updates = parseUpdatesJSON(result.stdout);

    return {
      success: true,
      data: {
        updates,
        branch,
        total: updates.length,
      },
    };
  } catch (error) {
    logger.error('Error getting update status', { error });
    return { success: false, error: String(error) };
  }
}

function parseUpdatesJSON(output: string): UpdateInfo[] {
  try {
    const data = JSON.parse(output);
    if (Array.isArray(data)) {
      return data.map((update: any) => ({
        id: update.id,
        branch: update.branch,
        message: update.message || '',
        created_at: update.createdAt,
        rollout_percentage: update.rolloutPercentage || 100,
        runtime_version: update.runtimeVersion || 'auto',
        platform: update.platform || 'all',
      }));
    }
    return [];
  } catch {
    // If JSON parsing fails, return empty array
    return [];
  }
}
