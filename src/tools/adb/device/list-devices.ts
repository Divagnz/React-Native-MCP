/**
 * ADB List Devices Tool
 * Lists all connected Android devices and emulators
 * @module tools/adb/device/list-devices
 */

import { z } from 'zod';
import { getADBClient } from '../core/index.js';
import { withErrorHandling } from '../../../errors/index.js';

/**
 * Input schema for list_devices tool
 */
export const ListDevicesInputSchema = z.object({
  include_offline: z
    .boolean()
    .optional()
    .describe('Include offline/unauthorized devices in results'),
  show_details: z
    .boolean()
    .optional()
    .describe('Fetch detailed information for each device (slower)'),
});

export type ListDevicesInput = z.infer<typeof ListDevicesInputSchema>;

/**
 * List all connected Android devices and emulators
 *
 * @param input - List devices configuration
 * @returns List of devices with their information
 */
export async function listDevices(input: ListDevicesInput) {
  return withErrorHandling(async () => {
    const { include_offline = false, show_details = false } = input;

    const client = getADBClient();

    // Get basic device list
    const devices = await client.listDevices(include_offline);

    // If show_details is true, fetch detailed info for each online device
    if (show_details) {
      const detailedDevices = await Promise.all(
        devices.map(async (device) => {
          if (device.state === 'device') {
            try {
              const detailedInfo = await client.getDeviceInfo(device.id);
              return detailedInfo;
            } catch {
              // If detailed info fails, return basic info
              return device;
            }
          }
          return device;
        })
      );

      // Calculate statistics
      const online = detailedDevices.filter((d) => d.state === 'device').length;
      const offline = detailedDevices.filter(
        (d) => d.state === 'offline' || d.state === 'unauthorized'
      ).length;

      return {
        devices: detailedDevices,
        total: detailedDevices.length,
        online,
        offline,
        summary: `Found ${detailedDevices.length} device(s): ${online} online, ${offline} offline`,
      };
    }

    // Return basic info
    const online = devices.filter((d) => d.state === 'device').length;
    const offline = devices.filter(
      (d) => d.state === 'offline' || d.state === 'unauthorized'
    ).length;

    return {
      devices,
      total: devices.length,
      online,
      offline,
      summary: `Found ${devices.length} device(s): ${online} online, ${offline} offline`,
    };
  }, 'list ADB devices');
}
