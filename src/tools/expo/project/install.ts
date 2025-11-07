/**
 * Expo Install Tool
 *
 * Install Expo-compatible packages with compatibility checks.
 */

import { logger } from '../../../utils/logger.js';
import { expoExecutor } from '../core/expo-executor.js';
import { ExpoInstallConfig, ExpoInstallResult } from '../types.js';
import { TIMEOUTS } from '../constants.js';

export async function installExpoPackages(config: ExpoInstallConfig): Promise<{
  success: boolean;
  data?: ExpoInstallResult;
  error?: string;
}> {
  try {
    const { packages, check_compatibility = true, fix = false } = config;

    logger.info('Installing Expo packages', {
      packages,
      check_compatibility,
      fix,
    });

    // Validate package names
    const sanitized = expoExecutor.sanitizePackageNames(packages);
    if (sanitized.invalid.length > 0) {
      logger.warn('Invalid package names detected', {
        invalid: sanitized.invalid,
      });
    }

    const args = ['install', ...sanitized.valid];
    if (check_compatibility) args.push('--check');
    if (fix) args.push('--fix');

    const result = await expoExecutor.executeExpo(args, {
      timeout: TIMEOUTS.INSTALL,
    });

    const installed = result.success ? sanitized.valid : [];
    const failed = result.success ? sanitized.invalid : packages;
    const warnings = extractWarnings(result.stdout + result.stderr);

    return {
      success: result.success,
      data: {
        installed,
        failed,
        warnings,
        message: result.success
          ? `Successfully installed ${installed.length} package(s)`
          : 'Installation failed',
      },
    };
  } catch (error) {
    logger.error('Error installing packages', { error });
    return { success: false, error: String(error) };
  }
}

function extractWarnings(output: string): string[] {
  return output
    .split('\n')
    .filter((line) => line.toLowerCase().includes('warn'))
    .map((line) => line.trim());
}
