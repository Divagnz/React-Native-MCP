/**
 * EAS Build Status Tool
 *
 * Check status of EAS cloud builds.
 */

import { logger } from '../../../utils/logger.js';
import { expoExecutor } from '../core/expo-executor.js';
import { EASBuildStatusResult, BuildInfo } from '../types.js';

export async function getEASBuildStatus(
  buildId?: string,
  limit: number = 5
): Promise<{
  success: boolean;
  data?: EASBuildStatusResult;
  error?: string;
}> {
  try {
    logger.info('Getting EAS build status', { buildId, limit });

    const args = ['build:list', `--limit=${limit}`, '--json'];
    if (buildId) args.push(`--buildId=${buildId}`);

    const result = await expoExecutor.executeEAS(args);

    if (!result.success) {
      return { success: false, error: result.stderr || 'Failed to get build status' };
    }

    const builds = parseBuildsJSON(result.stdout);

    return {
      success: true,
      data: {
        builds,
        total: builds.length,
      },
    };
  } catch (error) {
    logger.error('Error getting build status', { error });
    return { success: false, error: String(error) };
  }
}

function parseBuildsJSON(output: string): BuildInfo[] {
  try {
    const data = JSON.parse(output);
    if (Array.isArray(data)) {
      return data.map((build: any) => ({
        id: build.id,
        status: build.status,
        platform: build.platform,
        created_at: build.createdAt,
        completed_at: build.completedAt,
        app_version: build.appVersion,
        sdk_version: build.sdkVersion,
      }));
    }
    return [];
  } catch {
    return [];
  }
}
