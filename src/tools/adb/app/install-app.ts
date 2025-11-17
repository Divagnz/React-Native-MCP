/**
 * ADB Install App Tool
 * Install an APK file on an Android device
 * @module tools/adb/app/install-app
 */

import { z } from 'zod';
import { getADBClient } from '../core/index.js';
import { validateFilePath } from '../utils/index.js';
import { withErrorHandling, ADBError, DeviceNotFoundError } from '../../../errors/index.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Input schema for install_app tool
 */
export const InstallAppInputSchema = z.object({
  apk_path: z.string().describe('Path to the APK file to install'),
  device_id: z
    .string()
    .optional()
    .describe('Target device ID (uses first available if not specified)'),
  replace: z.boolean().optional().describe('Replace existing app if installed (default: false)'),
  grant_permissions: z
    .boolean()
    .optional()
    .describe('Grant all runtime permissions (default: false)'),
  allow_downgrade: z.boolean().optional().describe('Allow version downgrade (default: false)'),
  allow_test_apk: z
    .boolean()
    .optional()
    .describe('Allow test APKs to be installed (default: false)'),
});

export type InstallAppInput = z.infer<typeof InstallAppInputSchema>;

/**
 * Install an APK file on an Android device
 *
 * Common workflows:
 * - Development: Use replace=true to quickly update app during development
 * - Testing: Use grant_permissions=true to avoid manual permission granting
 * - Downgrade: Use allow_downgrade=true when testing older versions
 *
 * @param input - Installation configuration
 * @returns Installation result with package name and details
 */
export async function installApp(input: InstallAppInput) {
  return withErrorHandling(async () => {
    const {
      apk_path,
      device_id,
      replace = false,
      grant_permissions = false,
      allow_downgrade = false,
      allow_test_apk = false,
    } = input;

    // Validate APK path
    validateFilePath(apk_path);

    // Verify file exists
    try {
      const stats = await fs.stat(apk_path);
      if (!stats.isFile()) {
        throw new ADBError('APK path must be a file', { apk_path });
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new ADBError('APK file not found', { apk_path });
      }
      throw error;
    }

    // Verify APK extension
    const ext = path.extname(apk_path).toLowerCase();
    if (ext !== '.apk') {
      throw new ADBError('File must have .apk extension', {
        apk_path,
        extension: ext,
      });
    }

    const client = getADBClient();

    // Get target device
    let targetDevice = device_id;
    if (!targetDevice) {
      const devices = await client.listDevices(false);
      if (devices.length === 0) {
        throw new DeviceNotFoundError('No devices connected');
      }
      targetDevice = devices[0].id;
    } else {
      // Verify device exists
      const devices = await client.listDevices(false);
      if (!devices.find((d) => d.id === targetDevice)) {
        throw new DeviceNotFoundError(`Device ${targetDevice} not found`);
      }
    }

    // Build install command
    const args = ['-s', targetDevice, 'install'];

    if (replace) args.push('-r');
    if (grant_permissions) args.push('-g');
    if (allow_downgrade) args.push('-d');
    if (allow_test_apk) args.push('-t');

    args.push(apk_path);

    // Execute install command
    const result = await client.execute(args, {
      timeout: 120000, // 2 minutes for large APKs
      throw_on_error: false,
    });

    const output = result.stdout.toLowerCase();

    // Parse installation result
    if (output.includes('success')) {
      // Try to extract package name from APK metadata
      let packageName: string | undefined;
      try {
        const dumpResult = await client.execute(['aapt', 'dump', 'badging', apk_path], {
          timeout: 10000,
          throw_on_error: false,
        });
        const packageMatch = dumpResult.stdout.match(/package: name='([^']+)'/);
        if (packageMatch) {
          packageName = packageMatch[1];
        }
      } catch {
        // Package name extraction is optional
      }

      return {
        success: true,
        device_id: targetDevice,
        package_name: packageName,
        message: `Successfully installed APK on ${targetDevice}`,
        apk_path,
        options: {
          replaced: replace,
          permissions_granted: grant_permissions,
          downgrade_allowed: allow_downgrade,
          test_apk_allowed: allow_test_apk,
        },
      };
    }

    // Handle common errors
    if (output.includes('failed to install') || output.includes('failure')) {
      const errorMessage = result.stdout || result.stderr;
      const errorLower = errorMessage.toLowerCase();

      // Parse specific error types
      if (errorLower.includes('install_failed_already_exists')) {
        throw new ADBError('App already installed. Use replace=true to update it', {
          device_id: targetDevice,
          apk_path,
          error_output: errorMessage,
        });
      } else if (errorLower.includes('install_failed_version_downgrade')) {
        throw new ADBError('Version downgrade not allowed. Use allow_downgrade=true', {
          device_id: targetDevice,
          apk_path,
          error_output: errorMessage,
        });
      } else if (errorLower.includes('install_failed_insufficient_storage')) {
        throw new ADBError('Insufficient storage space on device', {
          device_id: targetDevice,
          apk_path,
          error_output: errorMessage,
        });
      } else if (errorLower.includes('install_failed_invalid_apk')) {
        throw new ADBError('Invalid or corrupted APK file', {
          device_id: targetDevice,
          apk_path,
          error_output: errorMessage,
        });
      }

      // Generic installation failure
      throw new ADBError('Failed to install APK', {
        device_id: targetDevice,
        apk_path,
        error_output: errorMessage,
      });
    }

    // Unexpected response
    throw new ADBError('Unexpected response from ADB install command', {
      device_id: targetDevice,
      apk_path,
      response: result.stdout || result.stderr,
    });
  }, 'install APK on device');
}
