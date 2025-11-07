/**
 * Expo Upgrade Tool
 *
 * Upgrade Expo SDK and dependencies.
 */

import { logger } from '../../../utils/logger.js';
import { expoExecutor } from '../core/expo-executor.js';
import { ExpoUpgradeConfig, ExpoUpgradeResult, PackageChange } from '../types.js';
import { TIMEOUTS } from '../constants.js';

export async function upgradeExpoSDK(config: ExpoUpgradeConfig): Promise<{
  success: boolean;
  data?: ExpoUpgradeResult;
  error?: string;
}> {
  try {
    const { target_version, dry_run = false, npm = false } = config;

    logger.info('Upgrading Expo SDK', {
      target_version,
      dry_run,
      npm,
    });

    const args = ['upgrade'];
    if (target_version) args.push(target_version);
    if (npm) args.push('--npm');

    const result = await expoExecutor.executeExpo(args, {
      timeout: dry_run ? TIMEOUTS.DEFAULT : TIMEOUTS.UPGRADE,
    });

    const changes = parseUpgradeOutput(result.stdout);
    const currentVersion = extractVersion(result.stdout, 'current');
    const targetVersion = extractVersion(result.stdout, 'target') || target_version || 'latest';

    return {
      success: result.success,
      data: {
        current_version: currentVersion,
        target_version: targetVersion,
        changes,
        breaking_changes: extractBreakingChanges(result.stdout),
        applied: !dry_run && result.success,
      },
    };
  } catch (error) {
    logger.error('Error upgrading Expo SDK', { error });
    return { success: false, error: String(error) };
  }
}

function parseUpgradeOutput(output: string): PackageChange[] {
  const changes: PackageChange[] = [];
  const lines = output.split('\n');

  for (const line of lines) {
    const match = line.match(/(\S+)\s+(\S+)\s+→\s+(\S+)/);
    if (match) {
      changes.push({
        package: match[1],
        from: match[2],
        to: match[3],
        breaking: line.includes('BREAKING'),
      });
    }
  }

  return changes;
}

function extractVersion(output: string, type: 'current' | 'target'): string {
  const pattern =
    type === 'current' ? /current.*?(\d+\.\d+\.\d+)/i : /target.*?(\d+\.\d+\.\d+)/i;
  const match = output.match(pattern);
  return match ? match[1] : 'unknown';
}

function extractBreakingChanges(output: string): string[] | undefined {
  const breaking = output
    .split('\n')
    .filter((line) => line.includes('BREAKING'))
    .map((line) => line.trim());
  return breaking.length > 0 ? breaking : undefined;
}
