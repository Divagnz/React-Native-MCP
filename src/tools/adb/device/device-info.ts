/**
 * ADB Device Info Tool
 * Get detailed information about a specific Android device
 * @module tools/adb/device/device-info
 */

import { z } from 'zod';
import { getADBClient } from '../core/index.js';
import { validateDeviceId } from '../utils/index.js';
import { withErrorHandling, DeviceNotFoundError } from '../../../errors/index.js';

/**
 * Input schema for device_info tool
 */
export const DeviceInfoInputSchema = z.object({
  device_id: z
    .string()
    .optional()
    .describe('Device serial number or ID. If not provided, uses the first available device'),
});

export type DeviceInfoInput = z.infer<typeof DeviceInfoInputSchema>;

/**
 * Get detailed information about a specific Android device
 *
 * @param input - Device info configuration
 * @returns Detailed device information
 */
export async function getDeviceInfo(input: DeviceInfoInput) {
  return withErrorHandling(async () => {
    const { device_id } = input;

    const client = getADBClient();

    // Validate device_id if provided
    const validatedDeviceId = device_id ? validateDeviceId(device_id) : undefined;

    // Check if any devices are connected
    const devices = await client.listDevices();
    if (devices.length === 0) {
      throw new DeviceNotFoundError();
    }

    // If device_id not specified, use first available
    const targetDeviceId = validatedDeviceId || devices[0].id;

    // Verify the device exists if specified
    if (validatedDeviceId) {
      const deviceExists = devices.some((d) => d.id === validatedDeviceId);
      if (!deviceExists) {
        throw new DeviceNotFoundError(validatedDeviceId);
      }
    }

    // Get detailed device information
    const deviceInfo = await client.getDeviceInfo(targetDeviceId);

    // Additional system information
    const additionalInfo: Record<string, string> = {};

    // Get SDK version
    try {
      const sdkResult = await client.execute(['shell', 'getprop', 'ro.build.version.sdk'], {
        device_id: targetDeviceId,
        throw_on_error: false,
      });
      if (sdkResult.success) {
        additionalInfo.sdk_version = sdkResult.stdout.trim();
      }
    } catch {
      // Ignore errors
    }

    // Get screen resolution
    try {
      const sizeResult = await client.execute(['shell', 'wm', 'size'], {
        device_id: targetDeviceId,
        throw_on_error: false,
      });
      if (sizeResult.success) {
        const match = sizeResult.stdout.match(/Physical size: (\d+x\d+)/);
        if (match) {
          additionalInfo.screen_resolution = match[1];
        }
      }
    } catch {
      // Ignore errors
    }

    // Get screen density
    try {
      const densityResult = await client.execute(['shell', 'wm', 'density'], {
        device_id: targetDeviceId,
        throw_on_error: false,
      });
      if (densityResult.success) {
        const match = densityResult.stdout.match(/Physical density: (\d+)/);
        if (match) {
          additionalInfo.screen_density = match[1];
        }
      }
    } catch {
      // Ignore errors
    }

    // Get battery level
    try {
      const batteryResult = await client.execute(
        ['shell', 'dumpsys', 'battery', '|', 'grep', 'level'],
        {
          device_id: targetDeviceId,
          throw_on_error: false,
        }
      );
      if (batteryResult.success) {
        const match = batteryResult.stdout.match(/level: (\d+)/);
        if (match) {
          additionalInfo.battery_level = `${match[1]}%`;
        }
      }
    } catch {
      // Ignore errors
    }

    return {
      ...deviceInfo,
      ...additionalInfo,
      summary: `Device: ${deviceInfo.model || deviceInfo.id} (${deviceInfo.android_version || 'Unknown'}) - ${deviceInfo.state}`,
    };
  }, 'get device information');
}
