/**
 * ADB Uninstall App Tool
 * Uninstall an app from an Android device
 * @module tools/adb/app/uninstall-app
 */

import { z } from 'zod';
import { getADBClient } from '../core/index.js';
import { validatePackageName } from '../utils/index.js';
import {
  withErrorHandling,
  ADBError,
  DeviceNotFoundError,
  PackageNotFoundError,
} from '../../../errors/index.js';

/**
 * Input schema for uninstall_app tool
 */
export const UninstallAppInputSchema = z.object({
  package_name: z.string().describe('Package name to uninstall (e.g., com.example.app)'),
  device_id: z
    .string()
    .optional()
    .describe('Target device ID (uses first available if not specified)'),
  keep_data: z.boolean().optional().describe('Keep app data and cache (default: false)'),
});

export type UninstallAppInput = z.infer<typeof UninstallAppInputSchema>;

/**
 * Uninstall an app from an Android device
 *
 * Common workflows:
 * - Clean uninstall: Default behavior removes app and all data
 * - Keep data: Use keep_data=true to preserve app data for reinstall
 *
 * @param input - Uninstallation configuration
 * @returns Uninstallation result
 */
export async function uninstallApp(input: UninstallAppInput) {
  return withErrorHandling(async () => {
    const { package_name, device_id, keep_data = false } = input;

    // Validate package name
    validatePackageName(package_name);

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

    // Build uninstall command
    const args = ['-s', targetDevice, 'uninstall'];

    if (keep_data) {
      args.push('-k');
    }

    args.push(package_name);

    // Execute uninstall command
    const result = await client.execute(args, {
      timeout: 30000, // 30 seconds
      throw_on_error: false,
    });

    const output = result.stdout.toLowerCase();

    // Parse uninstallation result
    if (output.includes('success')) {
      return {
        success: true,
        device_id: targetDevice,
        package_name,
        message: `Successfully uninstalled ${package_name} from ${targetDevice}`,
        data_kept: keep_data,
      };
    }

    // Handle common errors
    if (output.includes('failure') || output.includes('failed')) {
      const errorMessage = result.stdout || result.stderr;

      // Parse specific error types
      if (
        errorMessage.toLowerCase().includes('not installed') ||
        errorMessage.toLowerCase().includes('unknown package')
      ) {
        throw new PackageNotFoundError(package_name, targetDevice, {
          error_output: errorMessage,
        });
      } else if (errorMessage.toLowerCase().includes('delete_failed_internal_error')) {
        throw new ADBError('Internal error during uninstallation', {
          device_id: targetDevice,
          package_name,
          error_output: errorMessage,
        });
      }

      // Generic uninstallation failure
      throw new ADBError('Failed to uninstall package', {
        device_id: targetDevice,
        package_name,
        error_output: errorMessage,
      });
    }

    // Unexpected response
    throw new ADBError('Unexpected response from ADB uninstall command', {
      device_id: targetDevice,
      package_name,
      response: result.stdout || result.stderr,
    });
  }, 'uninstall app from device');
}
